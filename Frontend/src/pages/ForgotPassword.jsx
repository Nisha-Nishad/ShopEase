import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDevResetUrl('');

    try {
      const { data } = await api.post('/auth/forgot-password', {
        email,
        clientUrl: window.location.origin,
      });
      setMessage(data.message);
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeRedirect = (e) => {
    e.preventDefault();
    const raw = resetCodeInput.trim();
    if (!raw) return;
    // Accept either a full URL (.../reset-password/<token>) or just the raw <token>
    const token = raw.includes('/reset-password/')
      ? raw.split('/reset-password/').pop().split(/[?#]/)[0]
      : raw;
    if (token) {
      navigate(`/reset-password/${token}`);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
        <h1 className="text-2xl font-bold text-slate-900 text-center">
          Forgot Password?
        </h1>
        <p className="text-sm text-slate-500 text-center mt-1 mb-6">
          Enter your registered email and we&apos;ll send you a 15-minute reset link.
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
            {devResetUrl && (
              <div className="text-xs bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-semibold text-slate-700 block">
                  Click below to open your Password Reset Link:
                </span>
                <a
                  href={devResetUrl}
                  className="inline-block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Reset Password Now
                </a>
              </div>
            )}

            <form
              onSubmit={handleCodeRedirect}
              className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2 text-xs text-slate-700"
            >
              <label className="font-semibold flex items-center gap-1.5 text-slate-800">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  Opened Gmail on your phone? Paste the Reset Code or Link from your email here:
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resetCodeInput}
                  onChange={(e) => setResetCodeInput(e.target.value)}
                  placeholder="Paste Reset Code from Gmail..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            {loading ? 'Sending reset link...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
