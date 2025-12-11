import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Shield,
    Lock,
    Eye,
    CheckCircle2,
    Server,
    Key,
    FileCheck,
    Trash2,
    UserCheck,
    Database,
    AlertTriangle,
    Globe
} from 'lucide-react';

const PrivacySafetyPage: React.FC = () => {
    const securityFeatures = [
        {
            icon: Lock,
            title: 'End-to-End Encryption',
            description: 'All file uploads and conversions are encrypted using industry-standard SSL/TLS protocols. Your data is protected during transmission and processing.',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
            badge: 'SSL/TLS'
        },
        {
            icon: UserCheck,
            title: 'Secure Authentication',
            description: 'We use Clerk for authentication, providing secure OAuth integration with Google, GitHub, and email/password login with multi-factor authentication support.',
            color: 'text-green-500',
            bgColor: 'bg-green-50 dark:bg-green-950',
            badge: 'OAuth 2.0'
        },
        {
            icon: Database,
            title: 'Encrypted Database Storage',
            description: 'User data and conversion history are stored in Supabase with row-level security policies and end-to-end encryption. PostgreSQL database with advanced security features.',
            color: 'text-purple-500',
            bgColor: 'bg-purple-50 dark:bg-purple-950',
            badge: 'PostgreSQL RLS'
        },
        {
            icon: Trash2,
            title: 'Automatic File Deletion',
            description: 'Uploaded files are processed in-memory and automatically deleted after conversion. We don\'t permanently store your original files on our servers.',
            color: 'text-red-500',
            bgColor: 'bg-red-50 dark:bg-red-950',
            badge: 'Zero Storage'
        },
        {
            icon: Server,
            title: 'Secure Cloud Infrastructure',
            description: 'Our application is hosted on secure, enterprise-grade cloud infrastructure with regular security audits and 99.9% uptime guarantee.',
            color: 'text-orange-500',
            bgColor: 'bg-orange-50 dark:bg-orange-950',
            badge: 'Enterprise Grade'
        },
        {
            icon: Eye,
            title: 'Privacy by Design',
            description: 'We only collect essential data needed for the service. No tracking, no selling of user data, and minimal data retention policies in compliance with GDPR and privacy regulations.',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-50 dark:bg-indigo-950',
            badge: 'GDPR Compliant'
        }
    ];

    const privacyPractices = [
        {
            title: 'Data Collection',
            items: [
                'Email address and name (for authentication)',
                'Conversion history (file names, formats, dates)',
                'User preferences and settings',
                'No tracking cookies or analytics beyond essential functionality'
            ]
        },
        {
            title: 'Data Usage',
            items: [
                'Provide and improve our conversion services',
                'User authentication and authorization',
                'Display conversion history to users',
                'Service announcements and support communications'
            ]
        },
        {
            title: 'Data Protection',
            items: [
                'All data encrypted at rest and in transit',
                'Row-level security on database level',
                'Regular security audits and updates',
                'Secure backup and disaster recovery procedures'
            ]
        },
        {
            title: 'Your Rights',
            items: [
                'Access your data at any time',
                'Delete your data and account',
                'Export your conversion history',
                'Opt-out of  non-essential communications'
            ]
        }
    ];

    const complianceStandards = [
        { standard: 'GDPR', description: 'General Data Protection Regulation', icon: Globe },
        { standard: 'SOC 2', description: 'Service Organization Control', icon: Shield },
        { standard: 'ISO 27001', description: 'Information Security Management', icon: Key },
        { standard: 'CCPA', description: 'California Consumer Privacy Act', icon: FileCheck }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <div className="flex items-center justify-center mb-4">
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                            className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 shadow-lg"
                        >
                            <Shield className="h-8 w-8 text-white" />
                        </motion.div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        Privacy & Safety
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Your security and privacy are our top priorities. Learn how we protect your data with enterprise-grade security measures and transparent privacy practices.
                    </p>
                </motion.div>

                {/* Security Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {securityFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card className="h-full border-2 hover:shadow-xl transition-shadow duration-300">
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`p-3 rounded-xl ${feature.bgColor}`}>
                                                <Icon className={`h-6 w-6 ${feature.color}`} />
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {feature.badge}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Privacy Practices */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mb-16"
                >
                    <Card className="border-2 shadow-xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl mb-2">Our Privacy Practices</CardTitle>
                            <CardDescription>
                                Transparent policies on how we handle your information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {privacyPractices.map((practice, index) => (
                                    <motion.div
                                        key={practice.title}
                                        initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 + index * 0.1 }}
                                        className="space-y-4"
                                    >
                                        <h3 className="text-xl font-semibold flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            {practice.title}
                                        </h3>
                                        <ul className="space-y-2">
                                            {practice.items.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Compliance Standards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mb-16"
                >
                    <Card className="border-2 shadow-xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl mb-2">Compliance Standards</CardTitle>
                            <CardDescription>
                                We adhere to international security and privacy standards
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {complianceStandards.map((compliance, index) => {
                                    const Icon = compliance.icon;
                                    return (
                                        <motion.div
                                            key={compliance.standard}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.9 + index * 0.1 }}
                                            whileHover={{ scale: 1.05 }}
                                            className="p-6 rounded-xl border-2 text-center hover:border-primary transition-all"
                                        >
                                            <div className="flex justify-center mb-3">
                                                <div className="p-3 rounded-full bg-primary/10">
                                                    <Icon className="h-6 w-6 text-primary" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg mb-1">{compliance.standard}</h3>
                                            <p className="text-xs text-muted-foreground">{compliance.description}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Important Notice */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                >
                    <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20 shadow-xl">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 text-lg">
                                        Important Security Notice
                                    </h3>
                                    <div className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                                        <p>
                                            • While we implement best-in-class security measures, please <strong>do not upload highly sensitive or confidential documents</strong> without proper authorization.
                                        </p>
                                        <p>
                                            • For maximum security, we recommend using our service for general-purpose documents only.
                                        </p>
                                        <p>
                                            • If you have concerns about specific data, please contact us before uploading.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Contact for Privacy Concerns */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                    className="mt-12 text-center"
                >
                    <Card className="border-2 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10">
                        <CardContent className="pt-8 pb-8">
                            <h3 className="text-2xl font-bold mb-3">Have Privacy Questions?</h3>
                            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                                If you have any questions about our privacy practices or security measures,
                                we're here to help. Contact our team for detailed information.
                            </p>
                            <motion.a
                                href="/contact"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                            >
                                <Shield className="h-5 w-5" />
                                Contact Privacy Team
                            </motion.a>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacySafetyPage;
