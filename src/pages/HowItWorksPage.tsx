import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Settings, 
  Zap, 
  Download, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  Presentation,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Users
} from 'lucide-react';
import { useTheme, useTranslation } from '@/contexts/ThemeContext';

const HowItWorksPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      icon: Upload,
      title: "Upload Your Files",
      description: "Drag & drop or click to upload documents. Supports PDF, DOCX, PPTX, XLSX, TXT, MD, HTML, JSON, XML, RTF, EPUB, ODT and more.",
      details: [
        "Batch upload multiple files",
        "Drag & drop interface",
        "File format auto-detection",
        "Preview before conversion"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: 2,
      icon: Settings,
      title: "Choose Output Format",
      description: "Select your desired output format and customize conversion settings for optimal results.",
      details: [
        "15+ output formats",
        "Quality settings",
        "Compression options",
        "Custom parameters"
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      id: 3,
      icon: Zap,
      title: "AI-Powered Conversion",
      description: "Our advanced conversion engine processes your files with intelligent format detection and optimization.",
      details: [
        "Smart format detection",
        "Content preservation",
        "Layout optimization",
        "Real-time progress"
      ],
      color: "from-orange-500 to-red-500"
    },
    {
      id: 4,
      icon: Download,
      title: "Download Results",
      description: "Get your converted files instantly with options for individual downloads or bulk ZIP packages.",
      details: [
        "Instant download",
        "Bulk ZIP export",
        "Preview converted files",
        "Conversion history"
      ],
      color: "from-green-500 to-emerald-500"
    }
  ];

  const supportedFormats = [
    { name: "PDF", icon: FileText, description: "Portable Document Format", color: "text-red-500" },
    { name: "DOCX", icon: FileText, description: "Microsoft Word Document", color: "text-blue-500" },
    { name: "PPTX", icon: Presentation, description: "PowerPoint Presentation", color: "text-orange-500" },
    { name: "XLSX", icon: FileSpreadsheet, description: "Excel Spreadsheet", color: "text-green-500" },
    { name: "TXT", icon: FileText, description: "Plain Text", color: "text-gray-500" },
    { name: "MD", icon: FileText, description: "Markdown", color: "text-purple-500" },
    { name: "HTML", icon: FileText, description: "Web Page", color: "text-yellow-500" },
    { name: "JSON", icon: FileText, description: "JavaScript Object Notation", color: "text-indigo-500" }
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure & Private",
      description: "All conversions happen locally in your browser. Your files never leave your device."
    },
    {
      icon: Clock,
      title: "Lightning Fast",
      description: "Advanced algorithms ensure quick conversion times without compromising quality."
    },
    {
      icon: Users,
      title: "User Friendly",
      description: "Intuitive interface designed for both beginners and professionals."
    },
    {
      icon: Sparkles,
      title: "AI Enhanced",
      description: "Smart format detection and optimization for the best possible results."
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="absolute inset-0 grid-pattern opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              How DocConverter Pro Works
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Simple.</span>{" "}
              <span className="gradient-text">Powerful.</span>{" "}
              <span className="gradient-text">Professional.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Transform your documents with our advanced conversion engine. 
              Four simple steps to convert any document format with professional results.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-20"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                variants={itemVariants}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-center gap-12`}
              >
                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg`}
                    >
                      <step.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <div>
                      <span className="text-sm font-medium text-primary">Step {step.id}</span>
                      <h3 className="text-3xl font-bold">{step.title}</h3>
                    </div>
                  </div>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {step.details.map((detail, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Visual */}
                <div className="flex-1">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative"
                  >
                    <div className={`w-full h-80 rounded-3xl bg-gradient-to-r ${step.color} p-1 shadow-2xl`}>
                      <div className="w-full h-full bg-background rounded-3xl flex items-center justify-center">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ 
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="text-6xl opacity-20"
                        >
                          <step.icon />
                        </motion.div>
                      </div>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="hidden lg:block absolute -right-10 top-1/2 transform -translate-y-1/2"
                      >
                        <ArrowRight className="w-8 h-8 text-muted-foreground" />
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Supported Formats */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Supported Formats</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Convert between 15+ document formats with professional-grade quality and precision.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {supportedFormats.map((format, index) => (
              <motion.div
                key={format.name}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass rounded-2xl p-6 text-center group cursor-pointer hover-glow"
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className={`w-12 h-12 mx-auto mb-4 ${format.color}`}
                >
                  <format.icon className="w-full h-full" />
                </motion.div>
                <h3 className="font-semibold text-lg mb-2">{format.name}</h3>
                <p className="text-sm text-muted-foreground">{format.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose DocConverter Pro?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge technology to deliver the best document conversion experience.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Convert Your Documents?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users who trust DocConverter Pro for their document conversion needs.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="button-primary text-lg px-8 py-4 inline-flex items-center gap-3"
              onClick={() => navigate('/converter')}
            >
              Start Converting Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage; 