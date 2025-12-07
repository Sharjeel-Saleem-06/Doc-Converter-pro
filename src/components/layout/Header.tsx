import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTheme, useTranslation } from '@/contexts/ThemeContext';
import { useConversion } from '@/contexts/ConversionContext';
import {
  FileText,
  Moon,
  Sun,
  Monitor, 
  Settings, 
  Menu,
  X,
  Zap,
  Home,
  RefreshCw,
  History,
  Edit,
  Layers,
  Globe,
  Sparkles,
  ChevronDown,
  Bell,
  User,
  HelpCircle,
  RotateCcw,
  FolderOpen
} from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme, language, setLanguage, setTheme } = useTheme();
  const { t } = useTranslation();
  const { state } = useConversion();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const navigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Converter', href: '/converter', icon: RotateCcw },
    { name: 'Batch Processor', href: '/batch-processor', icon: FolderOpen },
  { name: 'Editor', href: '/editor', icon: Edit },
  { name: 'History', href: '/history', icon: History },
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const getActiveRoute = () => {
    const currentRoute = navigationItems.find(nav => nav.href === location.pathname);
    return currentRoute?.name || 'DocConverter Pro';
  };

  const processingCount = state.files.filter(f => f.status === 'processing').length;
  const completedCount = state.files.filter(f => f.status === 'completed').length;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`
        sticky top-0 z-50 w-full border-b transition-all duration-300
        ${isScrolled 
          ? 'bg-background/80 backdrop-blur-md shadow-lg' 
          : 'bg-background/95 backdrop-blur-sm'
        }
      `}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to="/" className="flex items-center space-x-4 group">
              {/* Professional Logo Icon */}
              <motion.div
                className="relative"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.6 }}
              >
                {/* Main Logo Container */}
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 shadow-xl group-hover:shadow-2xl transition-all duration-300 flex items-center justify-center overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]"></div>
                  
                  {/* Icon Layers */}
                  <div className="relative z-10 flex items-center justify-center">
                    {/* Background Document */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute w-5 h-6 bg-white/30 rounded-sm transform rotate-12"
                    />
                    
                    {/* Main Document */}
          <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                      className="relative w-6 h-7 bg-white rounded-sm shadow-lg flex flex-col items-center justify-center"
                    >
                      {/* Document Lines */}
                      <div className="w-4 h-0.5 bg-blue-500 rounded mb-0.5"></div>
                      <div className="w-3 h-0.5 bg-purple-500 rounded mb-0.5"></div>
                      <div className="w-4 h-0.5 bg-indigo-500 rounded"></div>
                      
                      {/* Conversion Arrow */}
                      <motion.div
                        animate={{ 
                          x: [0, 2, 0],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute -right-1 top-1/2 transform -translate-y-1/2"
                      >
                        <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>

                {/* Animated Glow Effect */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-md -z-10"
                />

                {/* Sparkle Effects */}
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -top-1 -right-1 w-3 h-3"
                >
                  <Sparkles className="w-3 h-3 text-yellow-400 opacity-80" />
                </motion.div>
          </motion.div>
              
              {/* Professional Brand Text */}
              <div className="hidden sm:block">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="flex flex-col"
                >
                  {/* Main Brand Name */}
                  <motion.h1 
                    className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent leading-tight"
                    whileHover={{ 
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 2 }}
                  >
                    DocConverter
                    <motion.span 
                      className="ml-1 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-extrabold"
                      animate={{ 
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      Pro
                    </motion.span>
                  </motion.h1>
                  
                  {/* Professional Tagline */}
          <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="flex items-center gap-2"
                  >
                    <motion.p 
                      className="text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide uppercase"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      Professional Document Conversion
                    </motion.p>
                    
                    {/* Status Indicator */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-2 h-2 bg-green-500 rounded-full shadow-lg"
                    />
                  </motion.div>
                </motion.div>
              </div>

              {/* Mobile Brand (Simplified) */}
              <div className="sm:hidden">
                <motion.h1 
                  className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  DocConverter Pro
                </motion.h1>
              </div>
            </Link>
          </motion.div>

        {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
                <motion.div
                key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link to={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative px-4 py-2 rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {isActive && (
                <motion.div
                  layoutId="activeTab"
                          className="absolute inset-0 bg-primary rounded-lg -z-10"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              );
          })}
        </nav>

          {/* Status and Actions */}
          <div className="flex items-center space-x-2">
            {/* Processing Status */}
            <AnimatePresence>
              {(processingCount > 0 || completedCount > 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="hidden sm:flex items-center space-x-2"
                >
                  {processingCount > 0 && (
                    <Badge variant="secondary" className="animate-pulse">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      {processingCount} processing
                    </Badge>
                  )}
                  {completedCount > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {completedCount} completed
                    </Badge>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 hover-glow">
                  <motion.div
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ThemeIcon className="h-4 w-4" />
                  </motion.div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 glass">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 hover-glow">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 glass">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? 'bg-primary/10' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="h-9 w-9 hover-glow">
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Settings className="h-4 w-4" />
                </motion.div>
              </Button>
            </Link>

            {/* CTA Button */}
            <Link to="/converter">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="button-primary px-4 py-2 text-sm inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Convert Now
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </motion.div>
          </Button>
        </div>

          {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur"
            >
              <div className="py-4 space-y-2">
                {navigationItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        location.pathname === item.href
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile Actions */}
                <div className="pt-4 border-t border-border/40 space-y-2">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm font-medium">Theme</span>
                    <div className="flex gap-1">
                      <Button
                        variant={theme === 'light' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTheme('light')}
                      >
                        <Sun className="w-4 h-4" />
              </Button>
                  <Button
                        variant={theme === 'dark' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTheme('dark')}
                      >
                        <Moon className="w-4 h-4" />
                  </Button>
                    </div>
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-all"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                  </Link>

                  <Link
                    to="/converter"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full button-primary py-3 text-sm inline-flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Start Converting
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar for Active Conversions */}
      <AnimatePresence>
        {state.isProcessing && (
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary origin-left"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
              backgroundSize: '200% 100%',
              animation: 'progressShine 2s ease-in-out infinite'
            }}
          />
        )}
      </AnimatePresence>

      {/* Breadcrumb for current page */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="hidden lg:block border-b bg-muted/30"
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Home className="h-3 w-3" />
              <span>/</span>
              <span className="text-foreground font-medium">{getActiveRoute()}</span>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <Badge variant="outline" className="text-xs">
                v1.0.0
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
};

export default Header;