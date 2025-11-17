require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('./supabaseClient');

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGINS = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(',')
  : ['http://localhost:3000'];

const SUBSCRIPTION_PLANS = [
  {
    id: 'creator-monthly',
    name: 'Creator Monthly',
    price: 19,
    currency: 'USD',
    interval: 'month',
    headline: 'Best for people who match weekly',
    features: [
      'Unlimited matching minutes',
      'Priority in the random queue',
      'Community moderation tools'
    ],
    paypalPlanId: 'P-PLACEHOLDER-MONTHLY'
  },
  {
    id: 'creator-annual',
    name: 'Creator Annual',
    price: 190,
    currency: 'USD',
    interval: 'year',
    headline: 'Two months free every year',
    features: [
      'Everything in Monthly',
      'Early feature access',
      'Quarterly safety review call'
    ],
    paypalPlanId: 'P-PLACEHOLDER-ANNUAL'
  }
];

const sessions = new Map();
const waitingQueue = [];
const activePairs = new Map();
const socketMetadata = new Map();

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

function ensureSupabaseConfigured(res) {
  if (!supabase) {
    res.status(500).json({
      message: 'Supabase is not configured. Please supply SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    });
    return false;
  }
  return true;
}

function sanitizeUsername(username = '') {
  return username.trim().toLowerCase();
}

function calculateAgeFromDob(dob) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function isAdult(dob) {
  return calculateAgeFromDob(dob) >= 18;
}

function createSession(user) {
  const token = uuidv4();
  sessions.set(token, {
    id: user.id,
    username: user.username,
    subscriptionStatus: user.subscription_status || 'inactive',
    ageVerified: Boolean(user.age_verified_at),
    ageVerifiedAt: user.age_verified_at || null,
    dateOfBirth: user.date_of_birth || null
  });
  return token;
}

function getSessionFromRequest(req) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  return { token, session };
}

app.post('/auth/register', async (req, res) => {
  if (!ensureSupabaseConfigured(res)) return;
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  const normalizedUsername = sanitizeUsername(username);

  try {
    const { data: existingUser, error: existingError } = await supabase
      .from('app_users')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingUser) {
      return res.status(409).json({ message: 'That username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: insertedUser, error: insertError } = await supabase
      .from('app_users')
      .insert({
        username: normalizedUsername,
        password_hash: passwordHash,
        subscription_status: 'inactive'
      })
      .select('*')
      .maybeSingle();

    if (insertError) {
      throw insertError;
    }

    const sessionToken = createSession(insertedUser);

    res.status(201).json({
      token: sessionToken,
      user: {
        id: insertedUser.id,
        username: insertedUser.username,
        subscriptionStatus: insertedUser.subscription_status,
        ageVerified: Boolean(insertedUser.age_verified_at),
        ageVerifiedAt: insertedUser.age_verified_at,
        dateOfBirth: insertedUser.date_of_birth,
        disclaimer:
          'You created an account without email recovery. If you forget your username or password, access cannot be restored.'
      }
    });
  } catch (error) {
    console.error('[auth/register] error', error);
    res.status(500).json({ message: 'Unable to register right now. Please try again later.' });
  }
});

app.post('/auth/login', async (req, res) => {
  if (!ensureSupabaseConfigured(res)) return;
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const normalizedUsername = sanitizeUsername(username);

  try {
    const { data: user, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const sessionToken = createSession(user);
    res.json({
      token: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        subscriptionStatus: user.subscription_status,
        ageVerified: Boolean(user.age_verified_at),
        ageVerifiedAt: user.age_verified_at,
        dateOfBirth: user.date_of_birth,
        disclaimer: 'Accounts are not recoverable without the correct username and password.'
      }
    });
  } catch (error) {
    console.error('[auth/login] error', error);
    res.status(500).json({ message: 'Unable to login right now. Please try again later.' });
  }
});

app.post('/auth/logout', (req, res) => {
  const { token } = getSessionFromRequest(req) || {};
  if (token) {
    sessions.delete(token);
  }
  res.status(204).send();
});

app.get('/auth/session', (req, res) => {
  const sessionData = getSessionFromRequest(req);
  if (!sessionData) {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }

  const { session } = sessionData;
  res.json({
    user: {
      id: session.id,
      username: session.username,
      subscriptionStatus: session.subscriptionStatus,
      ageVerified: Boolean(session.ageVerified),
      ageVerifiedAt: session.ageVerifiedAt || null,
      dateOfBirth: session.dateOfBirth || null
    }
  });
});

app.post('/auth/verify-age', async (req, res) => {
  if (!ensureSupabaseConfigured(res)) return;
  const result = getSessionFromRequest(req);
  if (!result) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const { session, token } = result;
  const { dateOfBirth } = req.body || {};

  if (!dateOfBirth) {
    return res.status(400).json({ message: 'Date of birth is required.' });
  }

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  if (!isAdult(dob)) {
    return res.status(400).json({ message: 'You must be at least 18 years old to continue.' });
  }

  try {
    const ageVerifiedAt = new Date().toISOString();
    const { data: updatedUser, error } = await supabase
      .from('app_users')
      .update({
        date_of_birth: dob.toISOString(),
        age_verified_at: ageVerifiedAt
      })
      .eq('id', session.id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updatedSession = {
      ...session,
      ageVerified: true,
      ageVerifiedAt,
      dateOfBirth: updatedUser.date_of_birth
    };
    sessions.set(token, updatedSession);

    const age = calculateAgeFromDob(dob);

    res.json({
      message: 'Age verified successfully.',
      age,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        subscriptionStatus: updatedUser.subscription_status,
        ageVerified: true,
        ageVerifiedAt,
        dateOfBirth: updatedUser.date_of_birth
      }
    });
  } catch (error) {
    console.error('[auth/verify-age] error', error);
    res.status(500).json({ message: 'Unable to verify age right now.' });
  }
});

app.get('/subscription/plans', (_req, res) => {
  res.json({ plans: SUBSCRIPTION_PLANS });
});

app.post('/subscription/activate', async (req, res) => {
  if (!ensureSupabaseConfigured(res)) return;
  const result = getSessionFromRequest(req);
  if (!result) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const { session, token } = result;
  const { planId } = req.body || {};
  const selectedPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);

  if (!selectedPlan) {
    return res.status(400).json({ message: 'Unknown plan.' });
  }

  try {
    const { error } = await supabase
      .from('app_users')
      .update({
        subscription_status: 'active',
        subscription_plan: planId,
        subscription_activated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (error) {
      throw error;
    }

    const updatedSession = { ...session, subscriptionStatus: 'active' };
    sessions.set(token, updatedSession);

    res.json({
      subscriptionStatus: 'active',
      plan: selectedPlan,
      message: 'Subscription activated. PayPal confirmation placeholder – integrate real flow later.'
    });
  } catch (error) {
    console.error('[subscription/activate] error', error);
    res.status(500).json({ message: 'Unable to activate subscription right now.' });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ['GET', 'POST']
  }
});

function removeFromQueue(socketId) {
  const index = waitingQueue.findIndex((entry) => entry.socketId === socketId);
  if (index !== -1) {
    waitingQueue.splice(index, 1);
  }
}

function emitStats() {
  const onlineCount = io.of('/').sockets.size;
  const queueSize = waitingQueue.length;
  const activeCallCount = activePairs.size / 2;

  io.emit('stats:update', {
    onlineCount,
    queueSize,
    activeCallCount
  });
}

function matchUsers() {
  while (waitingQueue.length >= 2) {
    const a = waitingQueue.shift();
    let b = waitingQueue.shift();

    if (!b) {
      waitingQueue.unshift(a);
      break;
    }

    const socketA = io.sockets.sockets.get(a.socketId);
    const socketB = io.sockets.sockets.get(b.socketId);

    if (!socketA || !socketB) {
      if (socketA) waitingQueue.unshift(a);
      if (socketB) waitingQueue.unshift(b);
      continue;
    }

    activePairs.set(a.socketId, b.socketId);
    activePairs.set(b.socketId, a.socketId);

    socketA.emit('match:found', {
      partnerId: b.socketId,
      partnerMetadata: socketMetadata.get(b.socketId) || null
    });

    socketB.emit('match:found', {
      partnerId: a.socketId,
      partnerMetadata: socketMetadata.get(a.socketId) || null
    });
  }

  emitStats();
}

function endCallFor(socketId, reason = 'partner_left') {
  const partnerId = activePairs.get(socketId);
  if (partnerId) {
    activePairs.delete(socketId);
    activePairs.delete(partnerId);

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit('match:ended', { reason });
    }
  }
}

io.on('connection', (socket) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  const session = token ? sessions.get(token) : null;

  if (!session) {
    socket.emit('auth:error', { message: 'Session expired or invalid. Please login again.' });
    socket.disconnect(true);
    return;
  }

  if (session.subscriptionStatus !== 'active') {
    socket.emit('subscription:inactive', { message: 'Active subscription required to join the network.' });
    socket.disconnect(true);
    return;
  }

  if (!session.ageVerified) {
    socket.emit('age:unverified', { message: 'Age verification required before joining the network.' });
    socket.disconnect(true);
    return;
  }

  socket.sessionToken = token;

  socketMetadata.set(socket.id, {
    ageVerified: Boolean(session.ageVerified),
    displayName: session.username,
    currentMode: 'idle',
    joinedAt: Date.now(),
    userId: session.id,
    dateOfBirth: session.dateOfBirth || null
  });

  emitStats();

  socket.on('presence:update', (metadata = {}) => {
    const current = socketMetadata.get(socket.id) || {};
    socketMetadata.set(socket.id, { ...current, ...metadata, updatedAt: Date.now() });
    emitStats();
  });

  socket.on('queue:join', ({ metadata = {} } = {}) => {
    const activeSession = socket.sessionToken ? sessions.get(socket.sessionToken) : null;
    if (!activeSession || activeSession.subscriptionStatus !== 'active') {
      socket.emit('subscription:inactive', { message: 'Your subscription is inactive. Please renew to join the queue.' });
      return;
    }

    const current = socketMetadata.get(socket.id) || {};
    socketMetadata.set(socket.id, { ...current, ...metadata, currentMode: 'queue', updatedAt: Date.now() });

    removeFromQueue(socket.id);
    waitingQueue.push({
      socketId: socket.id,
      joinedAt: Date.now(),
      metadata: { ...metadata, username: session.username, ageVerified: Boolean(session.ageVerified) }
    });

    matchUsers();
  });

  socket.on('queue:leave', () => {
    removeFromQueue(socket.id);
    const current = socketMetadata.get(socket.id) || {};
    socketMetadata.set(socket.id, { ...current, currentMode: 'idle', updatedAt: Date.now() });
    emitStats();
  });

  socket.on('match:ready', () => {
    const current = socketMetadata.get(socket.id) || {};
    socketMetadata.set(socket.id, { ...current, currentMode: 'in_call', updatedAt: Date.now() });
    emitStats();
  });

  socket.on('match:signal', ({ targetId, data }) => {
    if (!targetId || !data) return;
    io.to(targetId).emit('match:signal', { from: socket.id, data });
  });

  socket.on('match:end', ({ reason } = {}) => {
    endCallFor(socket.id, reason || 'ended');
    const current = socketMetadata.get(socket.id) || {};
    socketMetadata.set(socket.id, { ...current, currentMode: 'idle', updatedAt: Date.now() });
    emitStats();
  });

  socket.on('user:report', ({ partnerId, details = '' } = {}) => {
    console.warn(`User ${socket.id} reported ${partnerId} - ${details}`);
    socket.emit('user:report:ack');
  });

  socket.on('disconnect', () => {
    removeFromQueue(socket.id);
    endCallFor(socket.id, 'disconnected');
    socketMetadata.delete(socket.id);
    delete socket.sessionToken;
    emitStats();
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
