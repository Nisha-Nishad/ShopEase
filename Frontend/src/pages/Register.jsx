import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthMessages } from '../redux/slices/authSlice';
import api from '../services/api';
import {
  User,
  Mail,
  Phone,
  Lock,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.verifyEmail || '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Step state: 'form' (Step 1: account details) | 'otp' (Step 2: 6-digit OTP verification)
  const [step, setStep] = useState(location.state?.verifyEmail ? 'otp' : 'form');
  const [otpEmail, setOtpEmail] = useState(location.state?.verifyEmail || '');
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState(
    location.state?.otpMessage || ''
  );
  const [devOtp, setDevOtp] = useState(location.state?.devOtp || null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(
    location.state?.verifyEmail ? 30 : 0
  );
  const [localError, setLocalError] = useState('');
  const [verifiedSuccess, setVerifiedSuccess] = useState('');

  useEffect(() => {
    dispatch(clearAuthMessages());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Countdown timer for Resend OTP button
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setLocalError('');
  };

  // Step 1: Submit Registration Form -> Sends 6-Digit OTP to Email
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      setOtpEmail(data.email || formData.email.trim());
      setOtpMessage(
        data.message ||
          `A 6-digit OTP has been sent to ${data.email || formData.email.trim()}.`
      );
      setDevOtp(data.devOtp || null);
      setOtp('');
      setStep('otp');
      setResendCooldown(30);
    } catch (err) {
      setLocalError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify 6-Digit OTP -> Activates Account & Redirects to Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLocalError('');

    const cleanOtp = otp.replace(/\D/g, '').trim();
    if (cleanOtp.length !== 6) {
      setLocalError('Please enter a valid 6-digit numeric OTP.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        email: otpEmail,
        otp: cleanOtp,
      });

      setVerifiedSuccess(
        data.message ||
          'Email verified successfully! Your account is now active.'
      );

      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: {
            verifiedEmail: otpEmail,
            verifiedMessage:
              data.message ||
              'Email verified successfully! Your account is now active. Please sign in.',
          },
        });
      }, 1500);
    } catch (err) {
      setLocalError(
        err.response?.data?.message ||
          'Invalid or expired OTP. Please check and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Resend a fresh 6-digit OTP
  const handleResendOtp = async () => {
    if (resending || resendCooldown > 0) return;
    setLocalError('');
    setResending(true);

    try {
      const { data } = await api.post('/auth/resend-otp', {
        email: otpEmail,
      });
      setOtpMessage(
        data.message || `A new 6-digit OTP has been sent to ${otpEmail}.`
      );
      setDevOtp(data.devOtp || null);
      setOtp('');
      setResendCooldown(30);
    } catch (err) {
      setLocalError(
        err.response?.data?.message ||
          'Could not resend OTP right now. Please try again.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        {step === 'otp' ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Verify Your Email
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Enter the 6-digit OTP sent to{' '}
                <span className="font-semibold text-slate-800 break-all">
                  {otpEmail}
                </span>
              </p>
            </div>

            {otpMessage && !verifiedSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs sm:text-sm flex items-start gap-2.5">
                <Mail className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                <span>{otpMessage}</span>
              </div>
            )}

            {devOtp && !verifiedSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold block text-emerald-800">
                    Your 6-Digit Verification OTP:
                  </span>
                  <span className="font-mono text-lg font-extrabold tracking-widest text-indigo-700">
                    {devOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(String(devOtp))}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer transition-colors"
                >
                  Auto-Fill OTP
                </button>
              </div>
            )}

            {localError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{localError}</span>
              </div>
            )}

            {verifiedSuccess ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-semibold text-sm">{verifiedSuccess}</p>
                <p className="text-xs text-emerald-700">
                  Redirecting you to Sign In...
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 text-center">
                    6-Digit Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setLocalError('');
                    }}
                    placeholder="••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center font-mono text-2xl font-bold tracking-[0.5em] text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="text-xs text-slate-400 text-center mt-1.5">
                    OTP is valid for 10 minutes. Check your inbox or spam folder.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || otp.length !== 6}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Verifying OTP...'
                      : 'Verify OTP & Activate Account'}
                  </span>
                </button>

                <div className="flex items-center justify-between pt-2 text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setLocalError('');
                    }}
                    className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending || resendCooldown > 0}
                    className="text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {resending
                        ? 'Sending...'
                        : resendCooldown > 0
                        ? `Resend OTP in ${resendCooldown}s`
                        : 'Resend OTP'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Create an Account
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Join ShopEase — we&apos;ll send a 6-digit OTP to verify your email
              </p>
            </div>

            {localError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{localError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nisha Nishad"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {submitting ? 'Sending OTP to Email...' : 'Sign Up & Get OTP'}
                </span>
              </button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-6">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
