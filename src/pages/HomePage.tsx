import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Zap,
  Shield,
  Users,
  Download,
  ArrowRight,
  CheckCircle,
  Star,
  Play,
  RotateCcw,
  FolderOpen,
  Edit,
  History,
  Settings,
  Upload,
  Sparkles,
  Clock,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Layers,
  Globe,
  Cpu,
  Database,
  Palette,
  Heart,
  Award,
  Target,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme, useTranslation } from '@/contexts/ThemeContext';

const HomePage = () => {
  const { t } = useTranslation();

  const features = [
  {
      icon: Upload,
      title: "Universal Converter",
      description: "Convert between 15+ document formats including PDF, DOCX, PPTX, XLSX, and more.",
      gradient: "from-blue-500 via-purple-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
  },
  {
      icon: Zap,
      title: "Batch Processing",
      description: "Convert multiple files simultaneously with our powerful batch processor.",
      gradient: "from-purple-500 via-pink-500 to-red-500",
      bgColor: "bg-gradient-to-br from-purple-500/10 to-pink-500/10"
  },
  {
    icon: Edit,
      title: "Online Editor",
      description: "Edit and format your documents before conversion with our built-in editor.",
      gradient: "from-orange-500 via-red-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-orange-500/10 to-red-500/10"
  },
  {
    icon: History,
    title: 'Conversion History',
    description: 'Track all your conversions with detailed history and quick re-download.',
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'All processing happens locally in your browser. Your files never leave your device.',
      gradient: "from-red-500 via-rose-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-red-500/10 to-rose-500/10"
  },
  {
      icon: Rocket,
    title: 'Lightning Fast',
    description: 'Optimized algorithms ensure rapid conversion without compromising quality.',
      gradient: "from-yellow-500 via-orange-500 to-red-500",
      bgColor: "bg-gradient-to-br from-yellow-500/10 to-orange-500/10"
    }
  ];

  const stats = [
    { number: "1M+", label: "Files Converted", icon: FileText, color: "text-blue-500" },
    { number: "50K+", label: "Active Users", icon: Users, color: "text-purple-500" },
    { number: "15+", label: "Formats Supported", icon: Settings, color: "text-green-500" },
    { number: "99.9%", label: "Uptime", icon: Clock, color: "text-orange-500" }
  ];

  const supportedFormats = [
  'PDF', 'DOCX', 'HTML', 'Markdown', 'TXT', 'CSV',
    'JSON', 'XML', 'RTF', 'EPUB', 'LaTeX', 'PNG', 'JPG'
  ];

  const testimonials = [
  {
      name: "Sarah Johnson",
      role: "Content Manager",
      content: "DocConverter Pro has revolutionized our document workflow. The batch processing feature saves us hours every week!",
      rating: 5,
      avatar: "SJ",
      color: "from-blue-500 to-purple-500"
  },
  {
      name: "Michael Chen",
      role: "Freelance Designer",
      content: "The quality of conversions is outstanding. I can trust DocConverter Pro with my client's important documents.",
      rating: 5,
      avatar: "MC",
      color: "from-green-500 to-teal-500"
  },
  {
      name: "Emily Rodriguez",
      role: "Project Manager",
      content: "Simple, fast, and reliable. Exactly what we needed for our team's document management needs.",
      rating: 5,
      avatar: "ER",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-20, 20, -20],
      rotate: [0, 10, -10, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,200,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,120,200,0.1),transparent_50%)]"></div>
        
        {/* Animated Orbs */}
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: "2s" }}
          className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: "4s" }}
          className="absolute bottom-20 left-1/4 w-36 h-36 bg-gradient-to-r from-pink-400 to-orange-500 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: "6s" }}
          className="absolute bottom-40 right-1/4 w-28 h-28 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-3xl opacity-30"
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Main Heading with Animated Background */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="relative mb-8"
            >
              <motion.div
                variants={pulseVariants}
                animate="animate"
                className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-3xl opacity-20"
              />
              <h1 className="relative text-6xl md:text-8xl font-bold leading-tight">
                <motion.span 
                  className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  DocConverter
                </motion.span>{" "}
                <motion.span 
                  className="inline-block bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ["100% 50%", "0% 50%", "100% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                >
                  Pro
                </motion.span>
              </h1>
            </motion.div>

            {/* Subtitle with Typewriter Effect */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto"
            >
                The most powerful, secure, and user-friendly document conversion platform.
              <br />
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 2 }}
                className="inline-block overflow-hidden whitespace-nowrap"
              >
                Convert, edit, and manage your documents with professional-grade tools.
              </motion.span>
            </motion.p>
              
            {/* CTA Buttons with Enhanced Animations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            >
              <Link to="/converter">
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg px-10 py-5 rounded-2xl font-semibold shadow-xl overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <span className="relative flex items-center gap-3">
                    <Upload className="w-6 h-6" />
                    Start Converting
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
                  </Link>
              
              <Link to="/how-it-works">
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "rgba(255, 255, 255, 0.1)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group glass text-lg px-10 py-5 rounded-2xl font-semibold border-2 border-white/20 hover:border-white/40 transition-all duration-300"
                >
                  <span className="flex items-center gap-3">
                    <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    How It Works
                  </span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Enhanced Stats */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="text-center group relative"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="relative glass rounded-2xl p-6 border border-white/20">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-12 h-12 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`}
                    >
                      <stat.icon className="w-full h-full" />
                    </motion.div>
                    <motion.div 
                      className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    >
                      {stat.number}
                  </motion.div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 8, repeat: Infinity }}
            >
              Everything You Need for Document Conversion
            </motion.h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Professional-grade tools designed for efficiency, security, and ease of use
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative"
              >
                <motion.div
                  className={`absolute inset-0 ${feature.bgColor} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}
                />
                <div className="relative glass rounded-3xl p-8 h-full border border-white/20 backdrop-blur-xl">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 shadow-2xl`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold mb-4 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                          {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                          {feature.description}
                  </p>

                  <Link 
                    to={index === 0 ? "/converter" : index === 1 ? "/batch-processor" : "/editor"}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-purple-600 hover:gap-3 transition-all font-medium group/link"
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
          </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced Supported Formats */}
      <section className="py-20 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"
          animate={{ 
            background: [
              "linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05), rgba(236, 72, 153, 0.05))",
              "linear-gradient(to right, rgba(236, 72, 153, 0.05), rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))",
              "linear-gradient(to right, rgba(147, 51, 234, 0.05), rgba(236, 72, 153, 0.05), rgba(59, 130, 246, 0.05))"
            ]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Convert Any Document Format
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Support for 15+ document formats with professional-grade quality
            </p>
          </motion.div>

            <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-6 mb-12"
          >
            {[
              { icon: FileText, name: "PDF", color: "from-red-500 to-red-600" },
              { icon: FileText, name: "DOCX", color: "from-blue-500 to-blue-600" },
              { icon: Presentation, name: "PPTX", color: "from-orange-500 to-orange-600" },
              { icon: FileSpreadsheet, name: "XLSX", color: "from-green-500 to-green-600" },
              { icon: ImageIcon, name: "Images", color: "from-purple-500 to-purple-600" },
              { icon: Database, name: "More", color: "from-gray-500 to-gray-600" }
            ].map((format, index) => (
              <motion.div
                key={format.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.15, y: -10 }}
                className="group relative"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${format.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-300`}
                />
                <div className="relative flex flex-col items-center gap-3 p-6 rounded-2xl glass border border-white/20 cursor-pointer">
                  <motion.div
                    className={`w-12 h-12 bg-gradient-to-r ${format.color} rounded-xl flex items-center justify-center shadow-lg`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <format.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{format.name}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link to="/how-it-works">
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3"
              >
                View All Formats
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Trusted by Professionals
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what our users say about DocConverter Pro
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${testimonial.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500`}
                />
                <div className="relative glass rounded-2xl p-6 border border-white/20 h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
          </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                  
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`w-12 h-12 rounded-full bg-gradient-to-r ${testimonial.color} flex items-center justify-center text-white font-bold shadow-lg`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {testimonial.avatar}
                    </motion.div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"
          animate={{ 
            background: [
              "linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))",
              "linear-gradient(45deg, rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))",
              "linear-gradient(45deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h2 
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              Ready to Transform Your Documents?
            </motion.h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Join thousands of professionals who trust DocConverter Pro for their document conversion needs.
              Start converting your documents today with our powerful, secure platform.
            </p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link to="/converter">
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 25px 50px rgba(59, 130, 246, 0.3)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg px-10 py-5 rounded-2xl font-semibold shadow-2xl overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <span className="relative flex items-center gap-3">
                    <Upload className="w-6 h-6" />
                    Start Converting Now
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                </motion.button>
                </Link>
              
              <Link to="/how-it-works">
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "rgba(255, 255, 255, 0.1)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group glass text-lg px-10 py-5 rounded-2xl font-semibold border-2 border-white/20 hover:border-white/40 transition-all duration-300"
                >
                  <span className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Learn How It Works
                  </span>
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;