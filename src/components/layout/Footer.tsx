import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Github,
  Twitter,
  Heart,
  Shield,
  HelpCircle,
  Mail,
  Download,
  Zap,
  Users } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const productLinks = [
  { name: 'Document Converter', href: '/converter' },
  { name: 'Batch Processor', href: '/batch' },
  { name: 'Online Editor', href: '/editor' },
  { name: 'Conversion History', href: '/history' }];


  const supportLinks = [
  { name: 'Help Center', href: '#', icon: HelpCircle },
  { name: 'Contact Us', href: '#', icon: Mail },
  { name: 'Privacy Policy', href: '#', icon: Shield },
  { name: 'Terms of Service', href: '#' }];


  const socialLinks = [
  { name: 'GitHub', href: '#', icon: Github },
  { name: 'Twitter', href: '#', icon: Twitter }];


  const stats = [
  { label: 'Files Converted', value: '1M+', icon: FileText },
  { label: 'Active Users', value: '50K+', icon: Users },
  { label: 'Formats Supported', value: '15+', icon: Zap },
  { label: 'Uptime', value: '99.9%', icon: Shield }];


  return (
    <footer className="bg-background border-t" data-id="n4xgnzdwn" data-path="src/components/layout/Footer.tsx">
      {/* Stats Section */}
      <div className="border-b" data-id="ketepvpby" data-path="src/components/layout/Footer.tsx">
        <div className="container mx-auto px-4 py-8" data-id="f7jz1o3wp" data-path="src/components/layout/Footer.tsx">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6" data-id="e3af1ejr0" data-path="src/components/layout/Footer.tsx">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center" data-id="xba3lnbkx" data-path="src/components/layout/Footer.tsx">

                  <div className="flex items-center justify-center mb-2" data-id="zwny7vqzf" data-path="src/components/layout/Footer.tsx">
                    <div className="p-2 rounded-full bg-primary/10" data-id="kbyy1m3nn" data-path="src/components/layout/Footer.tsx">
                      <Icon className="h-6 w-6 text-primary" data-id="kcv41psv3" data-path="src/components/layout/Footer.tsx" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground" data-id="tvphyj0p2" data-path="src/components/layout/Footer.tsx">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground" data-id="hx7dremdk" data-path="src/components/layout/Footer.tsx">
                    {stat.label}
                  </div>
                </motion.div>);

            })}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12" data-id="arfhaqnd2" data-path="src/components/layout/Footer.tsx">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" data-id="i20ghd3q2" data-path="src/components/layout/Footer.tsx">
          {/* Brand Section */}
          <div className="space-y-4" data-id="qr0wdce9t" data-path="src/components/layout/Footer.tsx">
            <Link to="/" className="flex items-center space-x-2 group" data-id="uep0bqwg8" data-path="src/components/layout/Footer.tsx">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }} data-id="u0phn3vu9" data-path="src/components/layout/Footer.tsx">

                <FileText className="h-8 w-8 text-primary" data-id="j36lzfrwc" data-path="src/components/layout/Footer.tsx" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" data-id="18my49647" data-path="src/components/layout/Footer.tsx">
                DocConverter Pro
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed" data-id="w4fvoplkf" data-path="src/components/layout/Footer.tsx">
              The most powerful, secure, and user-friendly document conversion platform. 
              Convert, edit, and manage your documents with professional-grade tools.
            </p>
            <div className="flex space-x-2" data-id="4b025qppz" data-path="src/components/layout/Footer.tsx">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Button
                    key={social.name}
                    variant="ghost"
                    size="icon"
                    asChild
                    className="hover:text-primary" data-id="9qlp8hn77" data-path="src/components/layout/Footer.tsx">

                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name} data-id="sc2tsiunb" data-path="src/components/layout/Footer.tsx">

                      <Icon className="h-4 w-4" data-id="c9qtokzu3" data-path="src/components/layout/Footer.tsx" />
                    </a>
                  </Button>);

              })}
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4" data-id="g191khh67" data-path="src/components/layout/Footer.tsx">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider" data-id="lapmnwbtb" data-path="src/components/layout/Footer.tsx">
              Products
            </h3>
            <ul className="space-y-2" data-id="bg4q5xi1y" data-path="src/components/layout/Footer.tsx">
              {productLinks.map((link) =>
              <li key={link.name} data-id="cx2gq68px" data-path="src/components/layout/Footer.tsx">
                  <Link
                  to={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors text-sm" data-id="d50jad57g" data-path="src/components/layout/Footer.tsx">

                    {link.name}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4" data-id="268ndg8ph" data-path="src/components/layout/Footer.tsx">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider" data-id="cojac5n57" data-path="src/components/layout/Footer.tsx">
              Support
            </h3>
            <ul className="space-y-2" data-id="bzt8e3zao" data-path="src/components/layout/Footer.tsx">
              {supportLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name} data-id="whq301hm4" data-path="src/components/layout/Footer.tsx">
                    <a
                      href={link.href}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors text-sm" data-id="y6rcor441" data-path="src/components/layout/Footer.tsx">

                      {Icon && <Icon className="h-4 w-4" data-id="akxv3tkgc" data-path="src/components/layout/Footer.tsx" />}
                      <span data-id="hy7m53jfu" data-path="src/components/layout/Footer.tsx">{link.name}</span>
                    </a>
                  </li>);

              })}
            </ul>
          </div>

          {/* Download Section */}
          <div className="space-y-4" data-id="72ee9oiau" data-path="src/components/layout/Footer.tsx">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider" data-id="il1cb3ozg" data-path="src/components/layout/Footer.tsx">
              Get the App
            </h3>
            <p className="text-muted-foreground text-sm" data-id="bb7t7xmyd" data-path="src/components/layout/Footer.tsx">
              Download our desktop app for offline document conversion.
            </p>
            <div className="space-y-2" data-id="icbww3tjk" data-path="src/components/layout/Footer.tsx">
              <Button className="w-full" size="sm" data-id="49gpa5ry5" data-path="src/components/layout/Footer.tsx">
                <Download className="h-4 w-4 mr-2" data-id="j91s2dyhq" data-path="src/components/layout/Footer.tsx" />
                Download for Windows
              </Button>
              <Button variant="outline" className="w-full" size="sm" data-id="h5mre8lrh" data-path="src/components/layout/Footer.tsx">
                <Download className="h-4 w-4 mr-2" data-id="rdnt08ui2" data-path="src/components/layout/Footer.tsx" />
                Download for macOS
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator data-id="i4w7ljzqi" data-path="src/components/layout/Footer.tsx" />

      {/* Bottom Section */}
      <div className="container mx-auto px-4 py-6" data-id="gln211etw" data-path="src/components/layout/Footer.tsx">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0" data-id="zc6mebxq3" data-path="src/components/layout/Footer.tsx">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground" data-id="zd2hdfyop" data-path="src/components/layout/Footer.tsx">
            <span data-id="2jbkau69q" data-path="src/components/layout/Footer.tsx">© {currentYear} DocConverter Pro. All rights reserved.</span>
            <Separator orientation="vertical" className="h-4" data-id="w2lv4s4r2" data-path="src/components/layout/Footer.tsx" />
            <span className="flex items-center space-x-1" data-id="zxmgo6zmf" data-path="src/components/layout/Footer.tsx">
              <span data-id="0csiao45a" data-path="src/components/layout/Footer.tsx">Made with</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }} data-id="sd73r5m69" data-path="src/components/layout/Footer.tsx">

                <Heart className="h-4 w-4 text-red-500 fill-current" data-id="wqh3u70bu" data-path="src/components/layout/Footer.tsx" />
              </motion.div>
              <span data-id="a3va5ofu0" data-path="src/components/layout/Footer.tsx">by DocConverter Team</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground" data-id="q5n0u5rif" data-path="src/components/layout/Footer.tsx">
            <span className="flex items-center space-x-1" data-id="p4029m5fn" data-path="src/components/layout/Footer.tsx">
              <Zap className="h-4 w-4 text-green-500" data-id="7pbkf0ls7" data-path="src/components/layout/Footer.tsx" />
              <span data-id="kdaq3jl8t" data-path="src/components/layout/Footer.tsx">100% Offline Processing</span>
            </span>
            <Separator orientation="vertical" className="h-4" data-id="ifcuod22o" data-path="src/components/layout/Footer.tsx" />
            <span className="flex items-center space-x-1" data-id="fab0ap1xu" data-path="src/components/layout/Footer.tsx">
              <Shield className="h-4 w-4 text-blue-500" data-id="rjapfx837" data-path="src/components/layout/Footer.tsx" />
              <span data-id="d8o5r2vwu" data-path="src/components/layout/Footer.tsx">Privacy First</span>
            </span>
          </div>
        </div>
      </div>
    </footer>);

};

export default Footer;