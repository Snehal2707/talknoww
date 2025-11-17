import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Bot,
  Camera,
  Check,
  Clock,
  Loader2,
  Lock,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Signal,
  Users,
  Video,
  VideoOff,
  Send
} from 'lucide-react';

const SOCKET_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SOCKET_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SOCKET_URL) ||
  'http://localhost:3001';
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

const initialStats = {
  onlineCount: 0,
  queueSize: 0,
  activeCallCount: 0
};

function StatsPanel({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between text-sm text-slate-400">
          Online Users
          <Signal className="size-4 text-brand-300" />
        </div>
        <p className="mt-2 text-3xl font-semibold text-white">{stats.onlineCount}</p>
        <p className="mt-1 text-sm text-slate-400">Real-time updates from the server</p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between text-sm text-slate-400">
          In Queue
          <Clock className="size-4 text-brand-300" />
        </div>
        <p className="mt-2 text-3xl font-semibold text-white">{stats.queueSize}</p>
        <p className="mt-1 text-sm text-slate-400">Waiting for the next match</p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between text-sm text-slate-400">
          Active Calls
          <Users className="size-4 text-brand-300" />
        </div>
        <p className="mt-2 text-3xl font-semibold text-white">{stats.activeCallCount}</p>
        <p className="mt-1 text-sm text-slate-400">Matched and chatting now</p>
      </div>
    </div>
  );
}

const MessageBubble = ({ role, content }) => (
  <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} text-sm`}>
    <div
      className={`max-w-[70%] rounded-2xl px-4 py-3 leading-relaxed ${
        role === 'user'
          ? 'bg-brand-500 text-white shadow-brand-500/30'
          : 'bg-slate-800/90 text-slate-100 shadow-slate-900/40'
      } shadow-lg`}
    >
      {content}
    </div>
  </div>
);

function AIChatPanel({ messages, onSend, isSending, onLeave }) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/70 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-brand-300">
              <Bot className="size-4" /> AI Companion
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Chat with our AI moderator</h1>
            <p className="text-sm text-slate-400">Get safety tips, conversation starters, and guidance before you join the live queue.</p>
          </div>
          <button
            onClick={onLeave}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-400 hover:text-brand-200"
          >
            Return to modes
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-6 py-6">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          {messages.map((message, index) => (
            <MessageBubble key={index} role={message.role} content={message.content} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <textarea
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask for conversation tips, moderation help, or anything else..."
            className="flex-1 resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
          <button
            type="submit"
            disabled={isSending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send
          </button>
        </form>
      </main>
    </div>
  );
}

function VideoChatApp() {
  const [userProfile] = useState(() => ({
    displayName: `User${Math.floor(Math.random() * 9000) + 1000}`,
    verifiedAt: new Date().toISOString()
  }));
  const [stats, setStats] = useState(initialStats);
  const [mode, setMode] = useState('random');
  const [queueState, setQueueState] = useState('idle');
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);
  const [mediaState, setMediaState] = useState({ audio: true, video: true });
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome! I can help you prepare for a safe and fun conversation. Ask me anything or request a conversation starter.'
    }
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const cleanupConnection = () => {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const teardownSession = (_reason = 'ended') => {
    cleanupConnection();
    cleanupMedia();
    setPartnerInfo(null);
    setQueueState('idle');
  };

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      reconnectionAttempts: 5
    });

    socketRef.current = socket;
    socket.connect();

    socket.on('connect', () => {
      setSocketId(socket.id);
      socket.emit('presence:update', {
        ageVerified: true,
        displayName: userProfile.displayName,
        currentMode: 'idle'
      });
    });

    socket.on('disconnect', () => {
      setSocketId(null);
      teardownSession('disconnected');
    });

    socket.on('stats:update', (payload) => {
      setStats((prev) => ({ ...prev, ...payload }));
    });

    socket.on('match:found', async ({ partnerId, partnerMetadata }) => {
      setQueueState('matched');
      setPartnerInfo({
        id: partnerId,
        metadata: partnerMetadata,
        status: 'connecting'
      });

      const isInitiator = socket.id.localeCompare(partnerId) > 0;
      await startPeerConnection(partnerId, isInitiator);
    });

    socket.on('match:signal', async ({ from, data }) => {
      if (!pcRef.current) {
        await startPeerConnection(from, false);
      }

      if (!pcRef.current) return;

      try {
        if (data.type === 'offer') {
          await pcRef.current.setRemoteDescription({ type: 'offer', sdp: data.sdp });
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socket.emit('match:signal', {
            targetId: from,
            data: { type: 'answer', sdp: answer.sdp }
          });
        } else if (data.type === 'answer') {
          await pcRef.current.setRemoteDescription({ type: 'answer', sdp: data.sdp });
        } else if (data.type === 'candidate' && data.candidate) {
          await pcRef.current.addIceCandidate(data.candidate);
        }
      } catch (error) {
        console.error('Error handling signal', error);
      }
    });

    socket.on('match:ended', ({ reason }) => {
      teardownSession(reason || 'partner_left');
    });

    return () => {
      socket.disconnect();
      cleanupConnection();
      cleanupMedia();
    };
  }, [userProfile.displayName]);

  const ensureMediaReady = async () => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      setIsRequestingMedia(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setMediaState({ audio: true, video: true });
      return stream;
    } finally {
      setIsRequestingMedia(false);
    }
  };

  const startPeerConnection = async (partnerId, isInitiator) => {
    const socket = socketRef.current;
    if (!socket) return;

    await ensureMediaReady();

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('match:signal', {
          targetId: partnerId,
          data: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    pc.onconnectionstatechange = () => {
      setPartnerInfo((prev) => (prev ? { ...prev, status: pc.connectionState } : prev));
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        teardownSession(pc.connectionState);
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('match:signal', {
          targetId: partnerId,
          data: { type: 'offer', sdp: offer.sdp }
        });
      } catch (error) {
        console.error('Unable to create offer', error);
      }
    }
  };

  const handleJoinQueue = async () => {
    const socket = socketRef.current;
    if (!socket) return;

    await ensureMediaReady();
    setQueueState('queued');
    socket.emit('queue:join', {
      metadata: {
        ageVerified: true,
        displayName: userProfile.displayName,
        currentMode: 'random'
      }
    });
    socket.emit('match:ready');
  };

  const handleLeaveQueue = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('queue:leave');
    setQueueState('idle');
  };

  const handleEndCall = () => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit('match:end', { reason: 'user_left' });
    }
    teardownSession('user_left');
  };

  const toggleTrack = (kind) => {
    if (!localStreamRef.current) return;

    const tracks = kind === 'audio'
      ? localStreamRef.current.getAudioTracks()
      : localStreamRef.current.getVideoTracks();

    tracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setMediaState((prev) => ({
      ...prev,
      [kind]: tracks.every((track) => track.enabled)
    }));
  };

  const handleModeChange = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode !== 'random') {
      handleLeaveQueue();
      teardownSession('mode_change');
    }
  };

  const handleAiMessage = (text) => {
    setAiMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsAiResponding(true);

    setTimeout(() => {
      const suggestions = [
        'Remember to keep personal information private and end the call if you ever feel uncomfortable.',
        'Try asking about shared interests or hobbies to break the ice!',
        'If you encounter inappropriate behavior, use the report button and we will handle it.',
        'We recommend enabling good lighting and keeping the camera steady for the best experience.'
      ];
      const reply = suggestions[Math.floor(Math.random() * suggestions.length)];
      setAiMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      setIsAiResponding(false);
    }, 900);
  };

  useEffect(() => {
    return () => {
      handleLeaveQueue();
      teardownSession('unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mode === 'ai') {
    return (
      <AIChatPanel
        messages={aiMessages}
        onSend={handleAiMessage}
        isSending={isAiResponding}
        onLeave={() => setMode('random')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-900/80 bg-slate-900/50 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1 text-sm font-medium text-brand-200">
              <ShieldCheck className="size-4" /> Safety Mode Active
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-white">Welcome back, {userProfile.displayName}</h1>
            <p className="text-sm text-slate-400">Choose how you want to connect today. Real-time stats update live as users join.</p>
          </div>
          <div className="flex gap-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2">
              <Lock className="size-4 text-brand-300" /> Session secured with TLS
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2">
              <Check className="size-4 text-brand-300" /> Moderation tools enabled
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <StatsPanel stats={stats} />

        <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span className="font-medium text-slate-200">Live video preview</span>
              <span>{socketId ? `Connected as ${socketId}` : 'Connecting...'}</span>
            </div>

            <div className="mt-4 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Local preview</p>
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                  {!localStreamRef.current && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-400">
                      {isRequestingMedia ? <Loader2 className="size-6 animate-spin text-brand-300" /> : <Camera className="size-6 text-slate-600" />}
                      <span>{isRequestingMedia ? 'Requesting camera access…' : 'Camera inactive'}</span>
                    </div>
                  )}
                  <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Partner stream</p>
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                  {!partnerInfo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-400">
                      <Users className="size-6 text-slate-600" />
                      <span>No match yet</span>
                    </div>
                  )}
                  <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={queueState === 'queued' ? handleLeaveQueue : handleJoinQueue}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition shadow-lg ${
                  queueState === 'queued'
                    ? 'bg-slate-800 text-slate-200 shadow-black/40 hover:bg-slate-700'
                    : 'bg-brand-500 text-white shadow-brand-500/30 hover:bg-brand-400'
                }`}
              >
                {queueState === 'queued' ? <Clock className="size-4" /> : <Users className="size-4" />}
                {queueState === 'queued' ? 'Leave queue' : 'Go online'}
              </button>

              <button
                onClick={() => toggleTrack('audio')}
                className={`inline-flex items-center gap-2 rounded-2xl border border-slate-800 px-5 py-3 text-sm font-semibold transition hover:border-brand-500/40 ${
                  mediaState.audio ? 'text-slate-200' : 'text-red-300'
                }`}
                disabled={!localStreamRef.current}
              >
                {mediaState.audio ? <Mic className="size-4" /> : <MicOff className="size-4" />}
                {mediaState.audio ? 'Mute' : 'Unmute'}
              </button>

              <button
                onClick={() => toggleTrack('video')}
                className={`inline-flex items-center gap-2 rounded-2xl border border-slate-800 px-5 py-3 text-sm font-semibold transition hover:border-brand-500/40 ${
                  mediaState.video ? 'text-slate-200' : 'text-red-300'
                }`}
                disabled={!localStreamRef.current}
              >
                {mediaState.video ? <Video className="size-4" /> : <VideoOff className="size-4" />}
                {mediaState.video ? 'Turn video off' : 'Turn video on'}
              </button>

              <button
                onClick={handleEndCall}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                disabled={!partnerInfo}
              >
                <PhoneOff className="size-4" />
                End call
              </button>
            </div>

            {partnerInfo && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
                <p className="font-medium text-slate-200">Matched with {partnerInfo.metadata?.displayName || partnerInfo.id}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-brand-300">Status: {partnerInfo.status}</p>
                <p className="mt-2 text-xs text-slate-500">If something feels off, leave the call and report the user.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Users className="size-5 text-brand-300" /> Choose a mode
              </h2>
              <p className="mt-2 text-sm text-slate-400">Switch anytime — moderation stays active regardless of mode.</p>

              <div className="mt-4 space-y-4">
                <button
                  onClick={() => handleModeChange('random')}
                  className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                    mode === 'random'
                      ? 'border-brand-400 bg-brand-500/10 text-brand-50'
                      : 'border-slate-800 bg-slate-900/40 text-slate-200 hover:border-brand-500/40'
                  }`}
                >
                  <p className="flex items-center justify-between text-sm font-semibold">
                    Random match
                    {mode === 'random' && <Check className="size-4 text-brand-300" />}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Join the live queue and meet someone new.</p>
                </button>

                <button
                  onClick={() => handleModeChange('ai')}
                  className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                    mode === 'ai'
                      ? 'border-brand-400 bg-brand-500/10 text-brand-50'
                      : 'border-slate-800 bg-slate-900/40 text-slate-200 hover:border-brand-500/40'
                  }`}
                >
                  <p className="flex items-center justify-between text-sm font-semibold">
                    AI Companion
                    {mode === 'ai' && <Check className="size-4 text-brand-300" />}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Practice conversations or ask for moderation advice.</p>
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-6 text-sm text-slate-300">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <ShieldCheck className="size-5 text-brand-300" /> Safety checklist
              </h2>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="mt-1 size-4 text-brand-300" /> Report inappropriate behavior instantly from the call controls.
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 size-4 text-brand-300" /> Never share personal contact details during a chat.
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 size-4 text-brand-300" /> Keep conversations respectful — violations lead to bans.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default VideoChatApp;
