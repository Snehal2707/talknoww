import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Bot,
  Camera,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Crown,
  Loader2,
  Lock,
  LogOut,
  Mic,
  MicOff,
  Moon,
  PhoneOff,
  Send,
  ShieldCheck,
  Signal,
  Sparkles,
  Sun,
  Users,
  Video,
  VideoOff,
  XCircle
} from 'lucide-react';

const SOCKET_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SOCKET_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SOCKET_URL) ||
  'http://localhost:3001';
const API_URL = SOCKET_URL;

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

const initialStats = {
  onlineCount: 0,
  queueSize: 0,
  activeCallCount: 0
};

const getAgeFromDobString = (dateString) => {
  if (!dateString) return null;
  const dob = new Date(dateString);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
};

function ThemeSelector({ theme, onThemeChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'light', label: 'Light', icon: Sun, color: 'text-yellow-500' },
    { id: 'dark', label: 'Dark', icon: Moon, color: 'text-slate-400' }
  ];

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event) => {
        if (!event.target.closest('.theme-selector')) {
          setIsOpen(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="theme-selector relative z-[9999]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-[9999] inline-flex items-center justify-center rounded-full border border-slate-200/70 bg-white/60 p-2 text-slate-600 shadow-sm backdrop-blur transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-200"
        aria-label="Select theme"
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      >
        <CurrentIcon className="size-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-[9999] min-w-[160px] rounded-2xl border border-slate-200/70 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onThemeChange(t.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`size-4 ${t.color}`} />
                <span>{t.label}</span>
                {isActive && <Check className="ml-auto size-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AuthScreen({ onSuccess, theme, onThemeChange, serverMessage }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isLogin = mode === 'login';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (username.trim().length < 3) {
      setFormError('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/auth/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to complete request. Please try again.');
      }

      onSuccess(payload);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${theme === 'dark' ? 'dark' : 'light'}`}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black" />
      <div className="absolute inset-x-0 top-6 z-50 flex justify-end px-6">
        <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200/70 bg-white/80 p-10 shadow-2xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80 rounded-[2rem] border-[0.5px] border-lavender-200/30 bg-lavender-50/60 shadow-[0_2px_8px_rgba(196,181,253,0.08)] backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1 text-sm font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-200 rounded-2xl bg-lavender-100/40 text-lavender-700 border-[0.5px] border-lavender-200/40 shadow-none">
            <Sparkles className="size-4" />
            {isLogin ? 'Welcome back' : 'Create your studio handle'}
          </div>

          <h1 className="mt-5 text-3xl font-semibold text-slate-900 dark:text-white text-lavender-900">
            {isLogin ? 'Sign in to continue' : 'Join the lounge in seconds'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-lavender-600">
            {isLogin
              ? 'Enter your username and password to access the video chat community.'
              : 'Pick a memorable username. No email required—just remember your credentials.'}
          </p>

          {serverMessage && !formError && (
            <div className="mt-6 rounded-2xl border border-brand-400/40 bg-brand-50/80 px-4 py-3 text-sm text-brand-700 dark:border-brand-400/30 dark:bg-brand-500/10 dark:text-brand-100">
              {serverMessage}
            </div>
          )}

          {formError && (
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              <XCircle className="size-4" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 text-lavender-700" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoCorrect="off"
                autoCapitalize="none"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 rounded-3xl border-[0.5px] border-lavender-200/40 bg-lavender-50/40 text-lavender-800 shadow-[inset_0_1px_2px_rgba(196,181,253,0.06)] focus:border-lavender-300/60 focus:ring-1 focus:ring-lavender-200/50 focus:shadow-[0_0_0_3px_rgba(196,181,253,0.1)]"
                placeholder="e.g. nightowl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 text-lavender-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 rounded-3xl border-[0.5px] border-lavender-200/40 bg-lavender-50/40 text-lavender-800 shadow-[inset_0_1px_2px_rgba(196,181,253,0.06)] focus:border-lavender-300/60 focus:ring-1 focus:ring-lavender-200/50 focus:shadow-[0_0_0_3px_rgba(196,181,253,0.1)]"
                placeholder="Minimum 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60 rounded-3xl bg-gradient-to-r from-lavender-400 via-lavender-500 to-mint-400 shadow-[0_4px_12px_rgba(196,181,253,0.25)] hover:shadow-[0_6px_16px_rgba(196,181,253,0.35)] transition-all duration-300 border-[0.5px] border-lavender-300/30"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(isLogin ? 'register' : 'login');
              setFormError('');
            }}
            className="mt-6 text-sm font-medium text-brand-600 transition hover:text-brand-500 dark:text-brand-200 dark:hover:text-brand-100"
          >
            {isLogin ? 'Need an account? Create one for free.' : 'Already registered? Sign in instead.'}
          </button>

          <div className="mt-8 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 text-xs leading-6 text-slate-500 dark:border-slate-800/60 dark:bg-slate-800/50 dark:text-slate-400">
            <p className="font-semibold text-slate-600 dark:text-slate-200">Recovery disclaimer</p>
            <ul className="mt-2 space-y-1">
              <li>• Accounts are stored without email recovery links.</li>
              <li>• If you lose your username or password, access cannot be restored.</li>
              <li>• Consider using a password manager to keep your credentials safe.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionScreen({ token, user, onActivated, onLogout, theme, onThemeChange }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setIsLoadingPlans(true);
      setError('');
      try {
        const response = await fetch(`${API_URL}/subscription/plans`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load plans right now.');
        }
        if (!cancelled) {
          setPlans(payload.plans || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPlans(false);
        }
      }
    }

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
  const paypalButtonRef = useRef(null);

  // Initialize PayPal button when plan is selected
  useEffect(() => {
    if (!selectedPlan || !window.paypal) {
      return;
    }

    // Clear previous button
    if (paypalButtonRef.current) {
      paypalButtonRef.current.innerHTML = '';
    }

    // Create PayPal subscription button
    async function createPayPalButton() {
      try {
        // First, create subscription on backend
        const createResponse = await fetch(`${API_URL}/subscription/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ planId: selectedPlan.id })
        });

        const createData = await createResponse.json().catch(() => ({}));
        if (!createResponse.ok) {
          throw new Error(createData.message || 'Unable to create subscription.');
        }

        const { subscriptionId, approvalUrl } = createData;

        if (!approvalUrl) {
          throw new Error('PayPal approval URL not received.');
        }

        // Render PayPal button
        if (paypalButtonRef.current && window.paypal) {
          window.paypal.Buttons({
            style: {
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'subscribe'
            },
            createSubscription: async (data, actions) => {
              return subscriptionId;
            },
            onApprove: async (data, actions) => {
              setIsActivating(true);
              setError('');
              setSuccess('');

              try {
                // Verify and activate subscription
                const activateResponse = await fetch(`${API_URL}/subscription/activate`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({ 
                    subscriptionId: data.subscriptionID 
                  })
                });

                const activateData = await activateResponse.json().catch(() => ({}));
                if (!activateResponse.ok) {
                  throw new Error(activateData.message || 'Unable to activate subscription.');
                }

                setSuccess(activateData.message || 'Subscription activated successfully!');
                setTimeout(() => {
                  onActivated({ plan: selectedPlan, message: activateData.message });
                }, 1500);
              } catch (err) {
                setError(err.message || 'Payment approved but activation failed. Please contact support.');
              } finally {
                setIsActivating(false);
              }
            },
            onError: (err) => {
              setError('PayPal error: ' + (err.message || 'Payment could not be processed.'));
              setIsActivating(false);
            },
            onCancel: () => {
              setError('Payment cancelled. Please try again when ready.');
            }
          }).render(paypalButtonRef.current);
        }
      } catch (err) {
        setError(err.message || 'Unable to initialize PayPal. Please try again.');
        setIsActivating(false);
      }
    }

    createPayPalButton();
  }, [selectedPlan, token, onActivated]);

  return (
    <div className={`relative min-h-screen overflow-hidden ${theme === 'dark' ? 'dark' : 'light'}`}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black" />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-6">
        <div className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-widest text-slate-500 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-400">
          {user?.username} · Subscription required
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-6 py-24">
        <div className="w-full max-w-4xl space-y-10">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-10 shadow-2xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-200">
                  <Crown className="size-4" /> Premium access required
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Choose a creator plan</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Support the platform and unlock unrestricted matching. We process payments securely through PayPal.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-brand-400/40 bg-brand-500/10 px-4 py-3 text-xs text-brand-600 dark:border-brand-400/40 dark:bg-brand-500/15 dark:text-brand-100">
                <ShieldCheck className="size-4" /> Cancel anytime in your PayPal dashboard
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                <XCircle className="size-4" /> {error}
              </div>
            )}
            {success && (
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-brand-400/40 bg-brand-50 px-4 py-3 text-sm text-brand-600 dark:border-brand-400/40 dark:bg-brand-500/10 dark:text-brand-100">
                <Check className="size-4" /> {success}
              </div>
            )}

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {(isLoadingPlans ? [1, 2] : plans).map((plan, index) => {
                const isSkeleton = isLoadingPlans;
                const planId = isSkeleton ? `skeleton-${index}` : plan.id;
                const isSelected = selectedPlanId === planId;
                return (
                  <button
                    key={planId}
                    type="button"
                    disabled={isSkeleton}
                    onClick={() => setSelectedPlanId(planId)}
                    className={`relative overflow-hidden rounded-3xl border px-6 py-6 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-400/40 ${
                      isSelected
                        ? ' border-brand-400 bg-brand-500/10 shadow-lg shadow-brand-500/20'
                        : ' border-slate-200/70 bg-white/70 shadow-sm hover:border-brand-300/70 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/70 dark:hover:border-brand-400/40'
                    }`}
                  >
                    {isSkeleton ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 w-32 rounded bg-slate-200/80 dark:bg-slate-700/70" />
                        <div className="h-6 w-24 rounded bg-slate-200/80 dark:bg-slate-700/70" />
                        <div className="h-20 w-full rounded bg-slate-200/80 dark:bg-slate-700/70" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-500 dark:text-brand-200">
                            <CreditCard className="size-4" /> {plan.name}
                          </div>
                          {isSelected && (
                            <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-50">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
                          ${plan.price}
                          <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> / {plan.interval}</span>
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{plan.headline}</p>
                        <ul className="mt-5 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                          {(plan.features || []).map((feature) => (
                            <li key={feature} className="flex items-center gap-2">
                              <Check className="size-4 text-brand-500 dark:text-brand-300" /> {feature}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 text-xs text-slate-500 dark:border-slate-800/60 dark:bg-slate-800/50 dark:text-slate-400">
              <p>PayPal checkout launches a secure pop-up window. Once payment is confirmed, we immediately activate your plan.</p>
              <p>If the PayPal window closes unexpectedly, simply retry the activation—no duplicate charges occur for incomplete orders.</p>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              {selectedPlan ? (
                <div className="flex flex-col gap-3">
                  <div ref={paypalButtonRef} className="flex justify-center"></div>
                  {isActivating && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Loader2 className="size-4 animate-spin" />
                      Processing subscription...
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-center text-sm text-slate-500 dark:border-slate-800/60 dark:bg-slate-800/50 dark:text-slate-400">
                  Please select a plan above to continue
                </div>
              )}

              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Having trouble? Contact support with your username and PayPal receipt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgeGate({ onVerified, theme, onThemeChange, onLogout, username }) {
  const today = useMemo(() => new Date(), []);
  const maxAllowedDate = useMemo(() => {
    const limit = new Date(today);
    limit.setFullYear(limit.getFullYear() - 18);
    return limit;
  }, [today]);
  const minYear = useMemo(() => today.getFullYear() - 100, [today]);
  const maxYear = useMemo(() => maxAllowedDate.getFullYear(), [maxAllowedDate]);

  const monthOptions = useMemo(
    () => [
      { label: 'January', value: 0 },
      { label: 'February', value: 1 },
      { label: 'March', value: 2 },
      { label: 'April', value: 3 },
      { label: 'May', value: 4 },
      { label: 'June', value: 5 },
      { label: 'July', value: 6 },
      { label: 'August', value: 7 },
      { label: 'September', value: 8 },
      { label: 'October', value: 9 },
      { label: 'November', value: 10 },
      { label: 'December', value: 11 }
    ],
    []
  );

  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = maxYear; year >= minYear; year -= 1) {
      years.push(year);
    }
    return years;
  }, [maxYear, minYear]);

  const [birthYear, setBirthYear] = useState(maxYear);
  const [birthMonth, setBirthMonth] = useState(maxAllowedDate.getMonth());
  const [birthDay, setBirthDay] = useState(maxAllowedDate.getDate());
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysInSelectedMonth = useMemo(() => {
    if (!birthYear && birthYear !== 0) return 31;
    return new Date(birthYear, birthMonth + 1, 0).getDate();
  }, [birthYear, birthMonth]);

  useEffect(() => {
    setBirthDay((prev) => Math.min(prev, daysInSelectedMonth));
  }, [daysInSelectedMonth]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!birthYear || birthMonth === undefined || !birthDay) {
      setError('Please select your complete date of birth.');
      return;
    }

    const dob = new Date(birthYear, birthMonth, birthDay);
    if (Number.isNaN(dob.getTime())) {
      setError('Invalid date selected.');
      return;
    }

    if (dob > maxAllowedDate) {
      setError('You must be at least 18 years old to continue.');
      return;
    }

    if (!termsAccepted) {
      setError('Please confirm that you agree to the terms and community guidelines.');
      return;
    }

    const baseAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? baseAge - 1 : baseAge;

    setIsSubmitting(true);
    try {
      await onVerified({
        dateOfBirth: dob.toISOString(),
        age: adjustedAge
      });
    } catch (err) {
      setError(err.message || 'Unable to verify your age right now.');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  const handleYearChange = (event) => {
    setBirthYear(Number(event.target.value));
  };

  const handleMonthChange = (event) => {
    setBirthMonth(Number(event.target.value));
  };

  const handleDayChange = (event) => {
    setBirthDay(Number(event.target.value));
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${theme === 'dark' ? 'dark' : 'light'}`}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black" />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-6">
        <div className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-widest text-slate-500 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-400">
          {username} · one-time verification
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-6 py-24">
        <div className="w-full max-w-4xl rounded-3xl border border-slate-200/70 bg-white/85 p-10 shadow-2xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-200">
              <ShieldCheck className="size-4" /> Step 2 · Age verification
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">This verification is saved to your account permanently</div>
          </div>

          <h1 className="mt-6 text-4xl font-semibold text-slate-900 dark:text-white">
            Confirm your birthday
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Choose your birth date. This is a one-time verification that will be saved to your account. We automatically block anyone under 18 from entering the lounge.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Birth date</label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">Month</span>
                  <select
                    value={birthMonth}
                    onChange={handleMonthChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {monthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">Day</span>
                  <select
                    value={birthDay}
                    onChange={handleDayChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {Array.from({ length: daysInSelectedMonth }, (_, index) => index + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">Year</span>
                  <select
                    value={birthYear}
                    onChange={handleYearChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-800/60 dark:bg-slate-800/50 dark:text-slate-300">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-1 size-5 rounded border-slate-300 text-brand-500 focus:ring-brand-500 dark:border-slate-700"
              />
              <span>
                I confirm that I am at least 18 years old and agree to the community guidelines, privacy policy, and terms of service.
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                <XCircle className="size-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4 transition group-hover:translate-x-1" />}
              Verify &amp; continue
              {!isSubmitting && <ChevronRight className="size-4 transition group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-10 grid gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-6 text-sm text-slate-500 dark:border-slate-800/60 dark:bg-slate-800/50 dark:text-slate-300">
            <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-200">
              <ShieldCheck className="size-4 text-brand-500 dark:text-brand-300" />
              Why verification matters
            </div>
            <ul className="space-y-2">
              <li>• Keeps minors safe from mature conversations.</li>
              <li>• Helps us meet global online safety regulations.</li>
              <li>• Unlocks moderation tools tailored to adults.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
function StatsPanel({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[
        {
          title: 'Online now',
          value: stats.onlineCount,
          description: 'Users connected at this moment',
          icon: Signal
        },
        {
          title: 'In the queue',
          value: stats.queueSize,
          description: 'Waiting for the next match',
          icon: Clock
        },
        {
          title: 'Active calls',
          value: stats.activeCallCount,
          description: 'Live conversations happening',
          icon: Users
        }
      ].map(({ title, value, description, icon: Icon }) => (
        <div
          key={title}
          className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:border-brand-300/60 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/60"
        >
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {title}
            <Icon className="size-4 text-brand-500 dark:text-brand-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      ))}
    </div>
  );
}

const MessageBubble = ({ role, content }) => (
  <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} text-sm`}>
    <div
      className={`max-w-[70%] rounded-2xl px-4 py-3 leading-relaxed shadow-lg ${
        role === 'user'
          ? 'bg-brand-500 text-white shadow-brand-500/30'
          : 'bg-slate-200/90 text-slate-800 shadow-slate-200/70 dark:bg-slate-800/90 dark:text-slate-100 dark:shadow-slate-900/60'
      }`}
    >
      {content}
    </div>
  </div>
);

function AIChatPanel({ messages, onSend, isSending, onLeave, onLogout, theme, onThemeChange, username }) {
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
    <div className={`relative min-h-screen overflow-hidden ${theme === 'dark' ? 'dark' : 'light'}`}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-slate-100 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black" />
      <header className="border-b border-slate-200/70 bg-white/70 px-6 py-5 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-300">
              <Bot className="size-4" /> AI companion
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Warm up with our AI moderator, {username}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ask for conversation starters, safety tips, or practice an intro before meeting new people.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-inner dark:border-slate-800/70 dark:bg-slate-900/60"
        >
          {messages.map((message, index) => (
            <MessageBubble key={index} role={message.role} content={message.content} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70">
          <textarea
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask for icebreakers, etiquette tips, or safety guidance..."
            className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={isSending}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/70 bg-slate-50/80 p-5 text-xs text-slate-500 dark:border-slate-800/60 dark:bg-slate-800/50 dark:text-slate-400">
          <span>AI conversations stay private to you—nothing is shared with other members.</span>
          <button
            type="button"
            onClick={onLeave}
            className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-500/20 dark:border-brand-400/30 dark:text-brand-100"
          >
            Back to match mode
          </button>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen({ theme, onThemeChange, message = 'Preparing your session...' }) {
  return (
    <div className={`relative flex min-h-screen items-center justify-center ${theme === 'dark' ? 'dark' : 'light'}`}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black" />
      <div className="absolute right-6 top-6">
        <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
      </div>
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200/70 bg-white/80 px-10 py-12 shadow-2xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
        <Loader2 className="size-8 animate-spin text-brand-500" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
}

function VideoChatApp() {
  const preferredTheme = useMemo(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const [theme, setTheme] = useState(() => localStorage.getItem('cc-theme') || preferredTheme);
  const [token, setToken] = useState(() => localStorage.getItem('cc-token') || '');
  const [sessionUser, setSessionUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [isSessionLoading, setIsSessionLoading] = useState(Boolean(token));
  const [sessionError, setSessionError] = useState('');
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [ageGateData, setAgeGateData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [mode, setMode] = useState('random');
  const [stats, setStats] = useState(initialStats);
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
  const [socketError, setSocketError] = useState('');

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const cleanupConnection = useCallback(() => {
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
  }, []);

  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  const clearSession = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    cleanupConnection();
    cleanupMedia();
    localStorage.removeItem('cc-token');
    setToken('');
    setSessionUser(null);
    setSubscriptionStatus('inactive');
    setSubscriptionMessage('');
    setAgeGateData(null);
    setUserProfile(null);
    setMode('random');
    setStats(initialStats);
    setQueueState('idle');
    setMediaState({ audio: true, video: true });
    setPartnerInfo(null);
    setSocketId(null);
    setSocketError('');
    setAiMessages([
      {
        role: 'assistant',
        content: 'Welcome! I can help you prepare for a safe and fun conversation. Ask me anything or request a conversation starter.'
      }
    ]);
    setIsAiResponding(false);
  }, [cleanupConnection, cleanupMedia]);

  const handleLogout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      // Ignore logout errors
    }

    clearSession();
  }, [token, clearSession]);

  useEffect(() => {
    // Remove all theme classes first
    document.documentElement.classList.remove('dark', 'light');
    document.body.classList.remove('dark', 'light');
    
    // Add the current theme class
    document.documentElement.classList.add(theme);
    document.body.classList.add(theme);
    
    localStorage.setItem('cc-theme', theme);
  }, [theme]);

  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsSessionLoading(false);
      setSessionError('');
      return;
    }

    let cancelled = false;

    async function loadSession() {
      setIsSessionLoading(true);
      setSessionError('');
      try {
        const response = await fetch(`${API_URL}/auth/session`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || 'Session expired. Sign in again.');
        }

        if (!cancelled) {
          setSessionUser(payload.user);
          setSubscriptionStatus(payload.user.subscriptionStatus || 'inactive');
          setSessionError('');
        }
      } catch (error) {
        if (!cancelled) {
          setSessionError(error.message);
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setIsSessionLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [token, clearSession]);

  useEffect(() => {
    if (!token || !userProfile || subscriptionStatus !== 'active') {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      auth: { token }
    });

    socketRef.current = socket;
    socket.connect();
    setSocketError('');

    socket.on('connect', () => {
      setSocketId(socket.id);
      if (userProfile) {
        socket.emit('presence:update', {
          ageVerified: true,
          displayName: userProfile.displayName,
          currentMode: 'idle'
        });
      }
    });

    socket.on('connect_error', (error) => {
      setSocketError(error.message || 'Unable to connect to realtime service.');
    });

    socket.on('auth:error', (payload) => {
      setSocketError(payload.message || 'Session expired. Please log in again.');
      socket.disconnect();
      clearSession();
    });

    socket.on('subscription:inactive', (payload) => {
      setSocketError(payload.message || 'Subscription inactive. Please renew to continue.');
      setSubscriptionStatus('inactive');
      setAgeGateData(null);
      setUserProfile(null);
      setMode('random');
      setQueueState('idle');
      setPartnerInfo(null);
      socket.disconnect();
    });

    socket.on('disconnect', () => {
      setSocketId(null);
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
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userProfile, subscriptionStatus]);

  const teardownSession = useCallback(
    (_reason = 'ended') => {
      cleanupConnection();
      cleanupMedia();
      setPartnerInfo(null);
      setQueueState('idle');
    },
    [cleanupConnection, cleanupMedia]
  );

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      cleanupConnection();
      cleanupMedia();
    };
  }, [cleanupConnection, cleanupMedia]);

  const ensureMediaReady = useCallback(async () => {
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
  }, []);

  const startPeerConnection = useCallback(
    async (partnerId, isInitiator) => {
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
    },
    [ensureMediaReady, teardownSession]
  );

  const handleJoinQueue = async () => {
    if (subscriptionStatus !== 'active') {
      setSocketError('Your subscription is inactive. Activate it to join the queue.');
      return;
    }

    const socket = socketRef.current;
    if (!socket || !userProfile) return;

    await ensureMediaReady();
    setQueueState('queued');
    socket.emit('queue:join', {
      metadata: {
        ageVerified: true,
        displayName: userProfile.displayName,
        username: userProfile.username,
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

    const tracks = kind === 'audio' ? localStreamRef.current.getAudioTracks() : localStreamRef.current.getVideoTracks();

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

  const handleAgeVerified = async ({ dateOfBirth }) => {
    if (!token) {
      throw new Error('Session expired. Please log in again.');
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify-age`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ dateOfBirth })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to verify age right now.');
      }

      const verifiedAt = payload.user?.ageVerifiedAt || new Date().toISOString();
      const calculatedAge = typeof payload.age === 'number' ? payload.age : getAgeFromDobString(payload.user?.dateOfBirth);

      setSessionUser((prev) => {
        if (prev) {
          return {
            ...prev,
            ageVerified: true,
            ageVerifiedAt: payload.user?.ageVerifiedAt,
            dateOfBirth: payload.user?.dateOfBirth
          };
        }

        return {
          id: payload.user?.id,
          username: payload.user?.username,
          subscriptionStatus: payload.user?.subscriptionStatus,
          ageVerified: true,
          ageVerifiedAt: payload.user?.ageVerifiedAt,
          dateOfBirth: payload.user?.dateOfBirth
        };
      });

      const profileAge = calculatedAge ?? getAgeFromDobString(payload.user?.dateOfBirth);

      setSessionError('');
      setAgeGateData({
        dateOfBirth: payload.user?.dateOfBirth,
        verifiedAt
      });

      setUserProfile({
        displayName: payload.user?.username || sessionUser?.username || 'User',
        username: payload.user?.username || sessionUser?.username || 'User',
        age: profileAge ?? 18,
        verifiedAt
      });
      setMode('random');
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unable to verify age right now.');
    }
  };

  const handleAuthSuccess = ({ token: newToken, user }) => {
    localStorage.setItem('cc-token', newToken);
    setToken(newToken);
    setSessionUser(user);
    setSubscriptionStatus(user.subscriptionStatus || 'inactive');
    setSessionError('');
  };

  const handleSubscriptionActivated = ({ message }) => {
    setSubscriptionStatus('active');
    setSessionUser((prev) => (prev ? { ...prev, subscriptionStatus: 'active' } : prev));
    setSubscriptionMessage(message || 'Subscription activated. Welcome aboard!');
  };

  useEffect(() => {
    if (subscriptionStatus !== 'active' || !sessionUser || !sessionUser.ageVerified || !sessionUser.dateOfBirth) {
      return;
    }

    const verifiedAt = sessionUser.ageVerifiedAt || new Date().toISOString();

    setAgeGateData((prev) => prev || {
      dateOfBirth: sessionUser.dateOfBirth,
      verifiedAt
    });

    if (!userProfile) {
      const computedAge = getAgeFromDobString(sessionUser.dateOfBirth);
      setUserProfile({
        displayName: sessionUser.username,
        username: sessionUser.username,
        age: computedAge ?? 18,
        verifiedAt
      });
    }
  }, [subscriptionStatus, sessionUser, userProfile]);

  useEffect(() => {
    return () => {
      handleLeaveQueue();
      teardownSession('unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readyForChat = Boolean(userProfile && subscriptionStatus === 'active');

  if (!token || (!sessionUser && !isSessionLoading)) {
    return (
      <AuthScreen
        onSuccess={handleAuthSuccess}
        theme={theme}
        onThemeChange={handleThemeChange}
        serverMessage={sessionError}
      />
    );
  }

  if (isSessionLoading) {
    return <LoadingScreen theme={theme} onThemeChange={handleThemeChange} message="Validating your session..." />;
  }

  if (subscriptionStatus !== 'active') {
    return (
      <SubscriptionScreen
        token={token}
        user={sessionUser}
        onActivated={handleSubscriptionActivated}
        onLogout={handleLogout}
        theme={theme}
        onThemeChange={handleThemeChange}
      />
    );
  }

  // Safety check: ensure sessionUser exists
  if (!sessionUser) {
    return <LoadingScreen theme={theme} onThemeChange={handleThemeChange} message="Loading your profile..." />;
  }

  // Only show age gate if user hasn't verified age yet (first time only)
  const needsAgeVerification = !sessionUser.ageVerified || !sessionUser.dateOfBirth;
  
  if (needsAgeVerification) {
    return (
      <AgeGate
        onVerified={handleAgeVerified}
        theme={theme}
        onThemeChange={handleThemeChange}
        onLogout={handleLogout}
        username={sessionUser.username}
      />
    );
  }

  if (mode === 'ai') {
    return (
      <AIChatPanel
        messages={aiMessages}
        onSend={handleAiMessage}
        isSending={isAiResponding}
        onLeave={() => setMode('random')}
        onLogout={handleLogout}
        theme={theme}
        onThemeChange={handleThemeChange}
        username={sessionUser.username}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-white via-slate-100 to-white text-slate-900 transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-black dark:text-slate-100 ${theme === 'dark' ? 'dark' : 'light'}`}>
      <header className="border-b border-slate-200/70 bg-white/70 px-6 py-5 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-200">
              <ShieldCheck className="size-4" /> Age verified
            </div>
            <h1 className="mt-3 text-3xl font-semibold">Welcome back, {userProfile?.displayName || sessionUser?.username || 'User'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Choose how you want to connect today. Real-time stats update as members join.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {subscriptionMessage && (
              <span className="rounded-full border border-brand-400/40 bg-brand-500/10 px-4 py-2 text-xs font-semibold text-brand-600 dark:text-brand-100">
                {subscriptionMessage}
              </span>
            )}
            <ThemeSelector theme={theme} onThemeChange={handleThemeChange} />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      {socketError && (
        <div className="mx-auto mt-4 w-full max-w-5xl rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {socketError}
        </div>
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <StatsPanel stats={stats} />

        <section className="grid gap-6 lg:grid-cols-[1.45fr,1fr]">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-black/20">
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium">Live studio preview</span>
              <span>{socketId ? `Connected as ${socketId.slice(0, 8)}…` : 'Connecting…'}</span>
            </div>

            <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 sm:grid-cols-2 dark:border-slate-800/70 dark:bg-slate-900/60">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Local preview</p>
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                  {!localStreamRef.current && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      {isRequestingMedia ? <Loader2 className="size-6 animate-spin text-brand-500" /> : <Camera className="size-6 text-slate-400" />}
                      <span>{isRequestingMedia ? 'Requesting camera access…' : 'Camera inactive'}</span>
                    </div>
                  )}
                  <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Partner stream</p>
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                  {!partnerInfo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <Users className="size-6 text-slate-400" />
                      <span>No match yet</span>
                    </div>
                  )}
                  <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={queueState === 'queued' ? handleLeaveQueue : handleJoinQueue}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition shadow-lg ${
                  queueState === 'queued'
                    ? 'bg-slate-200 text-slate-700 shadow-slate-300/60 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:shadow-black/40 dark:hover:bg-slate-700'
                    : 'bg-brand-500 text-white shadow-brand-500/30 hover:bg-brand-400'
                }`}
              >
                {queueState === 'queued' ? <Clock className="size-4" /> : <Users className="size-4" />}
                {queueState === 'queued' ? 'Leave queue' : 'Go online'}
              </button>

              <button
                type="button"
                onClick={() => toggleTrack('audio')}
                className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold transition hover:border-brand-400/50 dark:border-slate-700 ${
                  mediaState.audio ? 'text-slate-600 dark:text-slate-200' : 'text-red-500'
                }`}
                disabled={!localStreamRef.current}
              >
                {mediaState.audio ? <Mic className="size-4" /> : <MicOff className="size-4" />}
                {mediaState.audio ? 'Mute' : 'Unmute'}
              </button>

              <button
                type="button"
                onClick={() => toggleTrack('video')}
                className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold transition hover:border-brand-400/50 dark:border-slate-700 ${
                  mediaState.video ? 'text-slate-600 dark:text-slate-200' : 'text-red-500'
                }`}
                disabled={!localStreamRef.current}
              >
                {mediaState.video ? <Video className="size-4" /> : <VideoOff className="size-4" />}
                {mediaState.video ? 'Turn video off' : 'Turn video on'}
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/20 dark:text-red-200"
                disabled={!partnerInfo}
              >
                <PhoneOff className="size-4" />
                End call
              </button>
            </div>

            {partnerInfo && (
              <div className="mt-6 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
                <p className="font-medium text-slate-700 dark:text-slate-100">
                  Matched with {partnerInfo.metadata?.displayName || partnerInfo.id}
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-brand-600 dark:text-brand-300">Status: {partnerInfo.status}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">If something feels off, leave the call and report the user.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <Users className="size-5 text-brand-500 dark:text-brand-300" /> Choose a mode
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Switch anytime—you stay verified for this session.</p>

              <div className="mt-4 space-y-4">
                <button
                  type="button"
                  onClick={() => handleModeChange('random')}
                  className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                    mode === 'random'
                      ? 'border-brand-400 bg-brand-500/10 text-brand-700 dark:text-brand-50'
                      : 'border-slate-200/70 bg-white/70 text-slate-700 hover:border-brand-300/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200'
                  }`}
                >
                  <p className="flex items-center justify-between text-sm font-semibold">
                    Random match
                    {mode === 'random' && <Check className="size-4 text-brand-500 dark:text-brand-200" />}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Join the live queue and meet someone new.</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('ai')}
                  className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                    mode === 'ai'
                      ? 'border-brand-400 bg-brand-500/10 text-brand-700 dark:text-brand-50'
                      : 'border-slate-200/70 bg-white/70 text-slate-700 hover:border-brand-300/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200'
                  }`}
                >
                  <p className="flex items-center justify-between text-sm font-semibold">
                    AI companion
                    {mode === 'ai' && <Check className="size-4 text-brand-500 dark:text-brand-200" />}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Practice conversations or ask for moderation advice.</p>
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-300">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <ShieldCheck className="size-5 text-brand-500 dark:text-brand-300" /> Safety checklist
              </h2>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="mt-1 size-4 text-brand-500 dark:text-brand-300" /> Report inappropriate behavior instantly from the call controls.
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 size-4 text-brand-500 dark:text-brand-300" /> Never share personal contact details during a chat.
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 size-4 text-brand-500 dark:text-brand-300" /> Keep conversations respectful—violations lead to bans.
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
