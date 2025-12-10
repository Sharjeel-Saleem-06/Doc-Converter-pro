import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { FileText, Lock, Mail, Sparkles } from 'lucide-react';

const SignInPage: React.FC = () => {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();

    React.useEffect(() => {
        if (isSignedIn) {
            navigate('/converter');
        }
    }, [isSignedIn, navigate]);

    return (
        <div className="min-h-screen bg-white flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 relative overflow-hidden">
                {/* Animated background circles */}
                <div className="absolute inset-0">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full px-16">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                            <FileText className="w-10 h-10 text-white" />
                        </div>

                        <h1 className="text-5xl font-bold text-white mb-4">
                            DocConverter
                        </h1>
                        <p className="text-xl text-white/80 mb-12">
                            Professional Document Conversion
                        </p>
                    </motion.div>

                    {/* Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="space-y-6 w-full max-w-sm"
                    >
                        <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-2xl p-5">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-yellow-300" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">15+ Formats</h3>
                                <p className="text-white/60 text-sm">PDF, DOCX, CSV, JSON & more</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-2xl p-5">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Lock className="w-6 h-6 text-green-300" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">100% Secure</h3>
                                <p className="text-white/60 text-sm">Your files are encrypted</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-2xl p-5">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Mail className="w-6 h-6 text-blue-300" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Cloud Sync</h3>
                                <p className="text-white/60 text-sm">Access anywhere, anytime</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex gap-12 mt-16"
                    >
                        <div className="text-center">
                            <div className="text-4xl font-bold text-white">1M+</div>
                            <div className="text-white/60 text-sm">Files</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-white">50K+</div>
                            <div className="text-white/60 text-sm">Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-white">99.9%</div>
                            <div className="text-white/60 text-sm">Uptime</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Sign In Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 py-12 bg-gray-50">
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">DocConverter Pro</h1>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Welcome back
                        </h2>
                        <p className="text-gray-500">
                            Sign in to continue to DocConverter
                        </p>
                    </div>

                    {/* Clerk Sign In */}
                    <SignIn
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "bg-white shadow-2xl shadow-gray-200/50 rounded-3xl border-0 p-6",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: "bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 rounded-xl h-12",
                                socialButtonsBlockButtonText: "font-medium text-gray-700",
                                dividerLine: "bg-gray-200",
                                dividerText: "text-gray-400 text-sm bg-white px-4",
                                formFieldLabel: "text-gray-700 font-medium text-sm",
                                formFieldInput: "h-12 border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all duration-200",
                                formButtonPrimary: "h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl font-semibold text-base shadow-lg shadow-indigo-500/30 transition-all duration-300",
                                footerAction: "hidden",
                                footer: "hidden",
                                formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-600",
                            },
                        }}
                        signUpUrl="/sign-up"
                        forceRedirectUrl="/converter"
                    />

                    {/* Sign Up Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-500">
                            Don't have an account?{' '}
                            <Link
                                to="/sign-up"
                                className="text-indigo-600 hover:text-indigo-700 font-semibold"
                            >
                                Sign up free
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center text-sm text-gray-400">
                        <p>
                            By signing in, you agree to our{' '}
                            <a href="#" className="text-gray-500 hover:text-gray-700">Terms</a>
                            {' '}and{' '}
                            <a href="#" className="text-gray-500 hover:text-gray-700">Privacy Policy</a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SignInPage;
