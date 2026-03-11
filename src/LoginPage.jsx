import React, { useState } from 'react';

const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        // Pass email and password to the authentication system
        const success = await onLogin(email, password);
        if (!success) {
            setError('Invalid email or password');
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen bg-gray-50 text-slate-800">
            {/* Left Side - Image & Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0065a3] items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')]"></div>
                <img
                    src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2453&ixlib=rb-4.0.3"
                    alt="Hospital Hallway"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                />
                <div className="relative z-10 text-center px-10">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-xl">
                        <span className="text-white font-black text-2xl tracking-tight">KMCH</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">KMCH Hospital</h1>
                    <p className="text-blue-100 text-lg">Kovai Medical Center & Hospital</p>
                    <p className="text-blue-200 text-sm mt-2">Digital Asset Management System</p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Enter your credentials to access the system
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@kmchhospital.com"
                                className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-[#0065a3] focus:border-[#0065a3] text-sm transition-colors placeholder-gray-400"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-[#0065a3] focus:border-[#0065a3] text-sm transition-colors placeholder-gray-400"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-[#0065a3] focus:ring-[#0065a3] border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-[#0065a3] hover:text-[#005080]">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full justify-center rounded-lg bg-[#0065a3] px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#005080] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0065a3] transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>

                        <div className="flex items-center justify-center mt-6">
                            <div className="text-sm">
                                <span className="text-gray-600">Don't have an account? </span>
                                <a href="/signup" className="font-medium text-[#0065a3] hover:text-[#005080]">
                                    Sign up
                                </a>
                            </div>
                        </div>
                    </form>



                    <div className="mt-8 text-center text-xs text-gray-400">
                        &copy; 2026 KMCH Hospital – Kovai Medical Center & Hospital. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
