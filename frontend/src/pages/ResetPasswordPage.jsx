import React, { useState, useEffect } from 'react';
import { Building2, Lock, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuthStore();

  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [showDecor, setShowDecor] = useState(false);
  useEffect(() => {
    let didCancel = false;
    const enable = () => { if (!didCancel) setShowDecor(true); };
    const useRIC = typeof window.requestIdleCallback === 'function';
    const handle = useRIC ? window.requestIdleCallback(enable, { timeout: 1000 }) : setTimeout(enable, 75);
    return () => {
      didCancel = true;
      if (useRIC) {
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(token, newPassword);
    setIsLoading(false);

    if (result.success) {
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } else {
      setError(result.message || 'Failed to reset password. The link may have expired.');
    }
  };

  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      {showDecor && <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-blue-600/20 to-blue-800/30 animate-gradient-x"></div>}

      {showDecor && (
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full animate-float"></div>
          <div className="absolute top-40 right-32 w-20 h-20 bg-white/10 rounded-lg rotate-45 animate-float-delayed"></div>
          <div className="absolute bottom-40 left-16 w-24 h-24 bg-white/7 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white/8 rounded-lg animate-float-delayed" style={{animationDelay: '0.5s'}}></div>
        </div>
      )}

      {showDecor && <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>}

      {showDecor && (
        <div className="flex flex-col justify-center items-start p-12 text-white relative z-20 animate-slide-in-left">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-8 group">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-500">
                <Building2 className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-wide">LCMS</h1>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-200 to-white rounded-full mt-2"></div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-5xl font-bold leading-tight">
                <span className="inline-block animate-fade-in-up">Welcome to</span><br />
                <span className="inline-block text-blue-100 animate-fade-in-up" style={{animationDelay: '0.2s'}}>Lecturer Contract</span><br />
                <span className="inline-block animate-fade-in-up" style={{animationDelay: '0.4s'}}>Management System</span>
              </h2>

              <p className="text-blue-100/90 text-xl leading-relaxed max-w-lg animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                Streamline your academic contract management with our comprehensive platform designed for
                <span className="text-blue-200 font-medium"> efficiency</span> and
                <span className="text-white font-medium"> transparency</span>.
              </p>
            </div>

            <div className="mt-12 space-y-4 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-blue-100">Secure Authentication</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                <span className="text-blue-100">Real-time Contract Tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                <span className="text-blue-100">Automated Workflows</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDecor && (
        <div className="absolute right-0 top-0 bottom-0 w-40">
          <svg className="w-full h-full text-white/10 animate-wave" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 Q50,25 0,50 Q50,75 0,100 L100,100 L100,0 Z" fill="currentColor"/>
          </svg>
        </div>
      )}
    </div>
  );

  const Animations = () => (
    <style>{`
      @keyframes gradient-x {
        0%, 100% { background-size: 200% 200%; background-position: left center; }
        50% { background-size: 200% 200%; background-position: right center; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
      }
      @keyframes float-delayed {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(-180deg); }
      }
      @keyframes wave {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(1.1); }
      }
      @keyframes slide-in-left {
        from { opacity: 0; transform: translateX(-50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slide-in-right {
        from { opacity: 0; transform: translateX(50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scale-in {
        from { opacity: 0; transform: scaleX(0); }
        to { opacity: 1; transform: scaleX(1); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      .animate-gradient-x { animation: gradient-x 15s ease infinite; }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
      .animate-wave { animation: wave 4s ease-in-out infinite; }
      .animate-slide-in-left { animation: slide-in-left 0.8s ease-out; }
      .animate-slide-in-right { animation: slide-in-right 0.8s ease-out; }
      .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }
      .animate-fade-in { animation: fade-in 0.6s ease-out; }
      .animate-scale-in { animation: scale-in 0.8s ease-out both; }
      .animate-shake { animation: shake 0.6s ease-in-out; }
    `}</style>
  );

  // No token — show error in same two-column layout
  if (!token) {
    return (
      <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <LeftPanel />
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-blue-700 to-blue-900 relative">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
          <div className="w-full max-w-md relative z-10 animate-slide-in-right">
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">LCMS</h1>
              </div>
              <p className="text-blue-100">Lecturer Contract Management System</p>
            </div>
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl text-center px-8 py-12">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid reset link</h2>
              <p className="text-gray-500 text-sm mb-6">
                This password reset link is missing or malformed. Please request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Request a new reset link
              </Link>
            </Card>
          </div>
        </div>
        <Animations />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      {showDecor && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 left-1/3 w-1 h-1 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-white/25 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
        </div>
      )}

      <LeftPanel />

      {/* Right side — Reset password form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-blue-700 to-blue-900 relative">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>

        <div className="w-full max-w-md relative z-10 animate-slide-in-right">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4 group">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg backdrop-blur-sm">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">LCMS</h1>
            </div>
            <p className="text-blue-100">Lecturer Contract Management System</p>
          </div>

          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-3 animate-fade-in-up">
                {done ? 'Password updated!' : 'Set new password'}
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                {done
                  ? 'You will be redirected to the login page shortly.'
                  : 'Choose a strong new password for your account.'}
              </CardDescription>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mt-4 animate-scale-in" style={{animationDelay: '0.4s'}}></div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {done ? (
                <div className="flex flex-col items-center gap-4 py-4 animate-fade-in-up">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                  <p className="text-sm text-gray-500 text-center">
                    Your password has been reset successfully. Redirecting to login...
                  </p>
                  <Link
                    to="/login"
                    className="text-sm text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-4 transition-colors"
                  >
                    Go to login now
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* New Password */}
                  <div className="space-y-3 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                    <label htmlFor="newPassword" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-500" />
                      New Password
                    </label>
                    <div className="relative group">
                      <Input
                        id="newPassword"
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                        placeholder="At least 6 characters"
                        className="h-14 text-base border-2 w-full px-4 pr-14 bg-white/90 backdrop-blur-sm transition-all duration-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-lg placeholder:text-gray-400 group-hover:border-blue-300 border-gray-200"
                        disabled={isLoading}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(p => !p)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-blue-600 focus:outline-none transition-all duration-300 hover:scale-110"
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-3 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-500" />
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="Repeat your new password"
                        className="h-14 text-base border-2 w-full px-4 pr-14 bg-white/90 backdrop-blur-sm transition-all duration-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-lg placeholder:text-gray-400 group-hover:border-blue-300 border-gray-200"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(p => !p)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-blue-600 focus:outline-none transition-all duration-300 hover:scale-110"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-slide-down">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                        {error}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 animate-fade-in-up disabled:opacity-70 disabled:hover:scale-100"
                    style={{animationDelay: '1s'}}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        <span className="animate-pulse">Resetting...</span>
                      </>
                    ) : (
                      'Reset password'
                    )}
                  </Button>

                  <div className="text-center animate-fade-in-up" style={{animationDelay: '1.1s'}}>
                    <Link
                      to="/login"
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-300 underline decoration-blue-300 hover:decoration-blue-500 underline-offset-4 inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to login
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 text-center animate-fade-in-up" style={{animationDelay: '1.2s'}}>
            <p className="text-sm text-blue-100">Secured with enterprise-grade encryption</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-300 font-medium">SSL Protected</span>
            </div>
          </div>
        </div>
      </div>

      <Animations />
    </div>
  );
}
