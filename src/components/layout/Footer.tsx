import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Github,
  Linkedin,
  Shield,
  Mail,
  Zap,
  Users,
  FileCheck,
  Layers,
  Clock,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { name: 'Document Converter', href: '/converter', icon: FileCheck },
    { name: 'Batch Processor', href: '/batch-processor', icon: Layers },
    { name: 'Online Editor', href: '/editor', icon: FileText },
    { name: 'Conversion History', href: '/history', icon: Clock },
  ];

  const supportedFormats = [
    { from: 'PDF', to: 'DOCX' },
    { from: 'CSV', to: 'JSON' },
    { from: 'DOCX', to: 'PDF' },
    { from: 'JSON', to: 'XML' },
  ];

  const supportLinks = [
    { name: 'Contact Us', href: '/contact', icon: Mail },
    { name: 'Privacy & Safety', href: '/privacy-safety', icon: Shield },
  ];

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/Sharjeel-Saleem-06', icon: Github },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/in/msharjeelsaleem/', icon: Linkedin },
  ];

  const stats = [
    { label: 'Files Converted', value: '1M+', icon: FileText, color: 'text-blue-500' },
    { label: 'Happy Users', value: '50K+', icon: Users, color: 'text-green-500' },
    { label: 'Formats Supported', value: '15+', icon: Zap, color: 'text-yellow-500' },
    { label: 'Languages', value: '6', icon: Globe, color: 'text-purple-500' },
  ];

  return (
    <footer className="bg-gradient-to-b from-background to-muted/30 border-t">
      {/* Stats Section */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center group cursor-default"
                >
                  <div className="flex items-center justify-center mb-3">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300`}>
                      <Icon className={`h-7 w-7 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-5">
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg"
              >
                <FileText className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DocConverter
                </span>
                <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>
              </div>
            </Link>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Professional document conversion platform. Convert between PDF, DOCX, CSV, JSON,
              and 15+ formats with ease. Fast, secure, and reliable.
            </p>

            {/* Social Links */}
            <div className="flex space-x-2 pt-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.div key={social.name} whileHover={{ scale: 1.1, y: -2 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
                    >
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.name}
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Products */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Products
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <motion.li key={link.name} whileHover={{ x: 4 }}>
                    <Link
                      to={link.href}
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm group"
                    >
                      <Icon className="h-4 w-4 group-hover:text-primary transition-colors" />
                      {link.name}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </div>

          {/* Supported Conversions */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Popular Conversions
            </h3>
            <ul className="space-y-3">
              {supportedFormats.map((format, index) => (
                <motion.li
                  key={index}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <Badge variant="outline" className="text-xs font-mono">
                    {format.from}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {format.to}
                  </Badge>
                </motion.li>
              ))}
              <Link to="/converter" className="text-primary text-sm hover:underline inline-flex items-center gap-1 mt-2">
                View all formats
                <span>→</span>
              </Link>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <motion.li key={link.name} whileHover={{ x: 4 }}>
                    <Link
                      to={link.href}
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm group"
                    >
                      <Icon className="h-4 w-4 group-hover:text-primary transition-colors" />
                      {link.name}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            {/* Trust Badges */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Secure Processing</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">Fast Conversions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bottom Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>© {currentYear} DocConverter Pro. All rights reserved.</span>
            <Separator orientation="vertical" className="h-4 hidden md:block" />
            <Link to="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="#" className="hover:text-primary transition-colors">Privacy</Link>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>All systems operational</span>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;