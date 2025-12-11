import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Mail,
    MessageSquare,
    Send,
    Github,
    Linkedin,
    MapPin,
    Phone,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import emailjs from '@emailjs/browser';

const ContactPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // EmailJS configuration - Get these from your EmailJS account
            // These should be stored as environment variables
            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_zukq4lf';
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_24gtxc6';
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'Mq2IhyUUB3uKd1WsS';

            // Send email using EmailJS
            await emailjs.send(
                serviceId,
                templateId,
                {
                    from_name: formData.name,
                    from_email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    reply_to: formData.email,
                },
                publicKey
            );

            // Success
            setIsSuccess(true);
            toast.success('Message sent successfully! We\'ll get back to you soon.');
            setFormData({ name: '', email: '', subject: '', message: '' });

            // Reset success state after 5 seconds
            setTimeout(() => setIsSuccess(false), 5000);
        } catch (error) {
            console.error('EmailJS Error:', error);
            toast.error('Failed to send message. Please try again or contact us directly via email.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const contactInfo = [
        {
            icon: Mail,
            title: 'Email',
            detail: 'support@docconverter.pro',
            link: 'mailto:support@docconverter.pro',
            color: 'text-blue-500'
        },
        {
            icon: MapPin,
            title: 'Location',
            detail: 'Remote - Available Worldwide',
            color: 'text-green-500'
        },
        {
            icon: Clock,
            title: 'Response Time',
            detail: 'Within 24 hours',
            color: 'text-orange-500'
        }
    ];

    const socialLinks = [
        {
            name: 'GitHub',
            icon: Github,
            href: 'https://github.com/Sharjeel-Saleem-06',
            color: 'hover:text-gray-900 dark:hover:text-white'
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            href: 'https://www.linkedin.com/in/msharjeelsaleem/',
            color: 'hover:text-blue-600'
        }
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
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
                        >
                            <MessageSquare className="h-8 w-8 text-white" />
                        </motion.div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Have questions or feedback? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <Card className="border-2 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <Send className="h-6 w-6 text-primary" />
                                    Send us a Message
                                </CardTitle>
                                <CardDescription>
                                    Fill out the form below and we'll get back to you within 24 hours
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name *</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="h-12"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="h-12"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            placeholder="How can we help you?"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="h-12"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            placeholder="Tell us more about your question or feedback..."
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={6}
                                            className="resize-none"
                                        />
                                    </div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={isSubmitting || isSuccess}
                                            className="w-full h-12 text-lg font-semibold"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                        className="mr-2"
                                                    >
                                                        <Send className="h-5 w-5" />
                                                    </motion.div>
                                                    Sending...
                                                </>
                                            ) : isSuccess ? (
                                                <>
                                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                                    Message Sent!
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-5 w-5 mr-2" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Contact Info Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Contact Information */}
                        <Card className="border-2 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-xl">Contact Information</CardTitle>
                                <CardDescription>
                                    Reach out to us through any of these channels
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {contactInfo.map((info, index) => {
                                    const Icon = info.icon;
                                    return (
                                        <motion.div
                                            key={info.title}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + index * 0.1 }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className={`p-3 rounded-xl bg-muted ${info.color}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm mb-1">{info.title}</h3>
                                                {info.link ? (
                                                    <a
                                                        href={info.link}
                                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                                    >
                                                        {info.detail}
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">{info.detail}</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Social Media */}
                        <Card className="border-2 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-xl">Follow Us</CardTitle>
                                <CardDescription>
                                    Connect with us on social media
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-3">
                                    {socialLinks.map((social) => {
                                        const Icon = social.icon;
                                        return (
                                            <motion.a
                                                key={social.name}
                                                href={social.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                whileHover={{ scale: 1.1, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 hover:border-primary transition-all ${social.color}`}
                                            >
                                                <Icon className="h-6 w-6" />
                                                <span className="text-xs font-medium">{social.name}</span>
                                            </motion.a>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Response */}
                        <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 shadow-xl">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                            Quick Response Guaranteed
                                        </h3>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            We typically respond to all inquiries within 24 hours during business days.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-16 max-w-4xl mx-auto"
                >
                    <Card className="border-2 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center">Frequently Asked Questions</CardTitle>
                            <CardDescription className="text-center">
                                Quick answers to common questions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                {
                                    q: 'What file formats do you support?',
                                    a: 'We support 15+ formats including PDF, DOCX, CSV, JSON, XML, HTML, Markdown, and more.'
                                },
                                {
                                    q: 'Is my data secure?',
                                    a: 'Yes! All conversions happen securely with encryption, and we never store your files permanently.'
                                },
                                {
                                    q: 'Do you offer bulk conversions?',
                                    a: 'Absolutely! Our batch processor can handle multiple files at once for your convenience.'
                                }
                            ].map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                    className="p-4 rounded-lg bg-muted/50 border"
                                >
                                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                                </motion.div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default ContactPage;
