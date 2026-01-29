import React, { useState, useEffect } from "react";
import { Building2, Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card.jsx";

export default function LoginForm() {
    const navigate = useNavigate();
    const { login, isLoggingIn, authUser, error: authError } = useAuthStore();
    
    // Central email regex (case-insensitive)
    const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]+@cadt\.edu\.kh$/i;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
    const [isFormFocused, setIsFormFocused] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (authUser) {
            navigate(`/${authUser.role}`, { replace: true });
        }
    }, [authUser, navigate]);

    // Update local error state when auth error changes
    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            setError("Email and password are required");
            return;
        }
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setError("Email must be in the format youremail@cadt.edu.kh");
            return;
        }
        if (trimmedPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            const response = await login({ 
                email: trimmedEmail, 
                password: trimmedPassword 
            });
            
            // Navigation will be handled by the useEffect hook when authUser changes
            console.log('Login successful:', response);
        } catch (err) {
            // Error is already handled by the auth store and will be displayed via useEffect
            console.error('Login failed:', err);
        }
    };

    const handleForgotPassword = () => {
        if (!email.trim()) {
            setError("Please enter your email address first");
            return;
        }
        if (!EMAIL_REGEX.test(email.trim().toLowerCase())) {
            setError("Please enter a valid email address in the format youremail@cadt.edu.kh");
            return;
        }
        
        // Here you would typically call an API to send reset password email
        setShowForgotPassword(true);
        setError("");
        
        // Hide the message after 5 seconds
        setTimeout(() => {
            setShowForgotPassword(false);
        }, 5000);
    };

    const [showDecor, setShowDecor] = useState(false);
    useEffect(() => {
        let didCancel = false;
        const enable = () => { if (!didCancel) setShowDecor(true); };
        // Prefer idle callback to avoid impacting initial paint
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

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
            {/* Animated Background Particles */}
            {showDecor && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none defer-render">
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
                    <div className="absolute top-3/4 left-1/3 w-1 h-1 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                    <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-white/25 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                    <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                </div>
            )}

            {/* Left side - Enhanced Welcome section */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Animated gradient background overlay */}
                {showDecor && <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-blue-600/20 to-blue-800/30 animate-gradient-x defer-render"></div>}
                
                {/* Floating geometric shapes */}
                {showDecor && (
                    <div className="absolute inset-0 defer-render">
                        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full animate-float"></div>
                        <div className="absolute top-40 right-32 w-20 h-20 bg-white/10 rounded-lg rotate-45 animate-float-delayed"></div>
                        <div className="absolute bottom-40 left-16 w-24 h-24 bg-white/7 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
                        <div className="absolute bottom-20 right-20 w-16 h-16 bg-white/8 rounded-lg animate-float-delayed" style={{animationDelay: '0.5s'}}></div>
                    </div>
                )}

                {/* Glass morphism overlay */}
                {showDecor && <div className="absolute inset-0 bg-white/5 backdrop-blur-sm defer-render"></div>}

                {showDecor && (
                    <div className="flex flex-col justify-center items-start p-12 text-white relative z-20 animate-slide-in-left defer-render">
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

                        {/* Feature highlights */}
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

                {/* Animated wave pattern */}
                {showDecor && (
                    <div className="absolute right-0 top-0 bottom-0 w-40 defer-render">
                        <svg className="w-full h-full text-white/10 animate-wave" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,0 Q50,25 0,50 Q50,75 0,100 L100,100 L100,0 Z" fill="currentColor"/>
                        </svg>
                    </div>
                )}
            </div>

            {/* Right side - Enhanced Login form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-blue-700 to-blue-900 relative">
                {/* Subtle background pattern */}
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

                    <Card className={`border-0 shadow-2xl bg-white/95 backdrop-blur-xl transition-all duration-700 transform ${
                        isFormFocused ? 'scale-105 shadow-blue-500/30' : 'hover:scale-102'
                    }`}>
                        <CardHeader className="text-center pb-8 pt-8">
                            <CardTitle className="text-3xl font-bold text-gray-900 mb-3 animate-fade-in-up">
                                Sign in to your account
                            </CardTitle>
                            <CardDescription className="text-gray-600 text-lg animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                                Enter your credentials to access the system
                            </CardDescription>
                            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mt-4 animate-scale-in" style={{animationDelay: '0.4s'}}></div>
                        </CardHeader>
                        
                        <CardContent className="px-8 pb-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                                    <label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setEmail(val);
                                                setFieldErrors(fe => ({ 
                                                    ...fe, 
                                                    email: val && !EMAIL_REGEX.test(val.toLowerCase()) ? 'Email must be in the format youremail@cadt.edu.kh' : '' 
                                                }));
                                                if (error) setError('');
                                            }}
                                            onFocus={() => setIsFormFocused(true)}
                                            onBlur={() => setIsFormFocused(false)}
                                            placeholder="youremail@cadt.edu.kh"
                                            className={`h-14 text-base border-2 w-full px-4 bg-white/90 backdrop-blur-sm transition-all duration-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-lg placeholder:text-gray-400 group-hover:border-blue-300 ${
                                                fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                                            }`}
                                            required
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                    </div>
                                    {fieldErrors.email && (
                                        <p className="text-sm text-red-600 flex items-center gap-2 animate-shake" role="alert">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                            {fieldErrors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
                                    <label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-blue-500" />
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <Input
                                            className={`h-14 text-base border-2 w-full px-4 pr-14 bg-white/90 backdrop-blur-sm transition-all duration-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-lg placeholder:text-gray-400 group-hover:border-blue-300 ${
                                                fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                                            }`}
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setPassword(val);
                                                setFieldErrors(fe => ({ 
                                                    ...fe, 
                                                    password: val && val.length < 6 ? 'Password must be at least 6 characters' : '' 
                                                }));
                                                if (error) setError('');
                                            }}
                                            onFocus={() => setIsFormFocused(true)}
                                            onBlur={() => setIsFormFocused(false)}
                                            placeholder="Enter your password"
                                            required
                                            minLength={6}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-all duration-300 hover:scale-110"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? 
                                                <Eye className="h-5 w-5 animate-fade-in" /> : 
                                                <EyeOff className="h-5 w-5 animate-fade-in" />
                                            }
                                        </button>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                    </div>
                                    {fieldErrors.password && (
                                        <p className="text-sm text-red-600 flex items-center gap-2 animate-shake" role="alert">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                            {fieldErrors.password}
                                        </p>
                                    )}
                                </div>

                                {error && !fieldErrors.email && !fieldErrors.password && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl backdrop-blur-sm animate-slide-down">
                                        <p className="text-sm text-red-700 flex items-center gap-2" role="alert">
                                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {showForgotPassword && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl backdrop-blur-sm animate-slide-down">
                                        <p className="text-sm text-green-700 flex items-center gap-2" role="alert">
                                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                            Password reset link has been sent to your email address.
                                        </p>
                                    </div>
                                )}

                                <Button 
                                    type="submit" 
                                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 animate-fade-in-up disabled:opacity-70 disabled:hover:scale-100" 
                                    style={{animationDelay: '1s'}}
                                    disabled={isLoggingIn}
                                >
                                    {isLoggingIn ? (
                                        <>
                                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                            <span className="animate-pulse">Signing in...</span>
                                        </>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            Sign In
                                          
                                        </span>
                                    )}
                                </Button>

                                {/* Forgot Password Link */}
                                <div className="text-center animate-fade-in-up" style={{animationDelay: '1.1s'}}>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-300 underline decoration-blue-300 hover:decoration-blue-500 underline-offset-4"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Additional features */}
                    <div className="mt-6 text-center animate-fade-in-up" style={{animationDelay: '1.2s'}}>
                        <p className="text-sm text-blue-100">
                            Secured with enterprise-grade encryption
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-300 font-medium">SSL Protected</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes gradient-x {
                    0%, 100% {
                        background-size: 200% 200%;
                        background-position: left center;
                    }
                    50% {
                        background-size: 200% 200%;
                        background-position: right center;
                    }
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
                    from {
                        opacity: 0;
                        transform: translateX(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slide-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scaleX(0);
                    }
                    to {
                        opacity: 1;
                        transform: scaleX(1);
                    }
                }
                
                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
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
                .animate-slide-down { animation: slide-down 0.4s ease-out; }
                .animate-shake { animation: shake 0.6s ease-in-out; }
                .hover\\:scale-102:hover { transform: scale(1.02); }
            `}</style>
    </div>
    );
}