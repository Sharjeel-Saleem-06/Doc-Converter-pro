import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignUp, useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { FileText, Check, Zap, Shield } from 'lucide-react';

const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();

    React.useEffect(() => {
        if (isSignedIn) {
            navigate('/converter');
        }
    }, [isSignedIn, navigate]);

    const benefits = [
        'Unlimited file conversions',
        'Access to all 15+ formats',
        'Cloud storage & sync',
        'Conversion history',
        'Priority support',
    ];

    return (
        <div className="min-h-screen bg-white flex">
            {/* Left Side - Sign Up Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 py-12 bg-gray-50">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">DocConverter Pro</h1>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Create your account
                        </h2>
                        <p className="text-gray-500">
                            Start converting documents in seconds
                        </p>
                    </div>

                    {/* Clerk Sign Up */}
                    <SignUp
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "bg-white shadow-2xl shadow-gray-200/50 rounded-3xl border-0 p-6",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: "bg-white border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 rounded-xl h-12",
                                socialButtonsBlockButtonText: "font-medium text-gray-700",
                                dividerLine: "bg-gray-200",
                                dividerText: "text-gray-400 text-sm bg-white px-4",
                                formFieldLabel: "text-gray-700 font-medium text-sm",
                                formFieldInput: "h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-xl transition-all duration-200",
                                formButtonPrimary: "h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl font-semibold text-base shadow-lg shadow-purple-500/30 transition-all duration-300",
                                footerAction: "hidden",
                                footer: "hidden",
                                formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-600",
                            },
                        }}
                        signInUrl="/sign-in"
                        forceRedirectUrl="/converter"
                    />

                    {/* Sign In Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-500">
                            Already have an account?{' '}
                            <Link
                                to="/sign-in"
                                className="text-purple-600 hover:text-purple-700 font-semibold"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center text-sm text-gray-400">
                        <p>
                            By signing up, you agree to our{' '}
                            <a href="#" className="text-gray-500 hover:text-gray-700">Terms</a>
                            {' '}and{' '}
                            <a href="#" className="text-gray-500 hover:text-gray-700">Privacy Policy</a>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl"
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full px-16">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                            <FileText className="w-10 h-10 text-white" />
                        </div>

                        <h1 className="text-4xl font-bold text-white mb-4">
                            Start for free
                        </h1>
                        <p className="text-xl text-white/80">
                            No credit card required
                        </p>
                    </motion.div>

                    {/* Benefits */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="bg-white/10 backdrop-blur rounded-3xl p-8 w-full max-w-sm"
                    >
                        <h3 className="text-white font-semibold text-lg mb-6">
                            What you'll get:
                        </h3>
                        <div className="space-y-4">
                            {benefits.map((benefit, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white/90">{benefit}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex gap-8 mt-12"
                    >
                        <div className="flex items-center gap-2 text-white/70">
                            <Shield className="w-5 h-5" />
                            <span className="text-sm">SSL Secure</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                            <Zap className="w-5 h-5" />
                            <span className="text-sm">Instant setup</span>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex gap-12 mt-12"
                    >
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">50K+</div>
                            <div className="text-white/60 text-sm">Happy users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">4.9★</div>
                            <div className="text-white/60 text-sm">Rating</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
