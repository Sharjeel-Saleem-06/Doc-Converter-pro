import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useConversion } from '@/contexts/ConversionContext';
import { useTheme, useTranslation } from '@/contexts/ThemeContext';
import { conversionService, SupportedFormat, ConversionOptions, downloadFile, getFileExtension, formatFileSize } from '@/lib/conversionService';
import { toast } from 'react-hot-toast';
import { useUser } from '@clerk/clerk-react';
import { addConversionHistory } from '@/lib/supabase';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Sparkles,
  FileImage,
  FileCode,
  Database,
  Globe,
  BookOpen,
  Image,
  Type,
  Layers,
  Target,
  Wand2,
  Copy,
  ExternalLink,
  Info,
  TrendingUp,
  Gauge
} from 'lucide-react';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  detectedFormat?: SupportedFormat;
  suggestedFormats?: SupportedFormat[];
}

const ConverterPage: React.FC = () => {
  const { state, addFiles, removeFile, updateFileStatus, addConvertedFile, setProcessing, clearConvertedFiles } = useConversion();
  const { settings } = useTheme();
  const { t } = useTranslation();
  const { user } = useUser(); // Get current user for Supabase history

  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [outputFormat, setOutputFormat] = useState<SupportedFormat>('pdf');
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>({
    fontSize: 16,
    fontFamily: 'Arial',
    pageSize: 'A4',
    margin: 20,
    quality: 'medium',
    imageResolution: 300,
    preserveFormatting: true,
    includeMetadata: true,
    compression: false
  });
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get converted files from context
  const convertedFiles = state.convertedFiles;

  // Smart format detection and suggestions
  const analyzeFile = useCallback(async (file: File): Promise<{ detectedFormat: SupportedFormat; suggestedFormats: SupportedFormat[] }> => {
    const content = await file.text().catch(() => '');
    const detectedFormat = conversionService.detectFormat(file.name, content);
    const suggestedFormats = conversionService.suggestOptimalFormat(content, detectedFormat);

    return { detectedFormat, suggestedFormats };
  }, []);

  // Enhanced file drop handling
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          switch (error.code) {
            case 'file-too-large':
              toast.error(`File "${file.name}" is too large. Maximum size is 50MB.`);
              break;
            case 'file-invalid-type':
              toast.error(`File "${file.name}" has an unsupported format.`);
              break;
            case 'too-many-files':
              toast.error('Too many files selected. Maximum is 20 files.');
              break;
            default:
              toast.error(`Error with file "${file.name}": ${error.message}`);
          }
        });
      });
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    // Show loading toast for file processing
    const loadingToast = toast.loading(`Processing ${acceptedFiles.length} file(s)...`);

    try {
      const filesWithPreview: FileWithPreview[] = [];

      for (const file of acceptedFiles) {
        try {
          const { detectedFormat, suggestedFormats } = await analyzeFile(file);

          const fileWithPreview: FileWithPreview = Object.assign(file, {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            detectedFormat,
            suggestedFormats,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
          });

          filesWithPreview.push(fileWithPreview);
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          toast.error(`Failed to process file "${file.name}"`);
        }
      }

      if (filesWithPreview.length > 0) {
        setSelectedFiles(prev => [...prev, ...filesWithPreview]);

        // Auto-suggest output format based on first file
        if (filesWithPreview.length > 0 && filesWithPreview[0].suggestedFormats) {
          const suggested = filesWithPreview[0].suggestedFormats[0];
          if (suggested && suggested !== filesWithPreview[0].detectedFormat) {
            setOutputFormat(suggested);
            toast.success(`Suggested format: ${conversionService.getFormatInfo(suggested).name}`, {
              icon: '💡',
              duration: 4000,
            });
          }
        }

        toast.success(`${filesWithPreview.length} file(s) added successfully!`, {
          icon: '📁',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process some files. Please try again.');
    } finally {
      toast.dismiss(loadingToast);
    }
  }, [analyzeFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.md', '.html', '.csv', '.json', '.xml', '.rtf'],
      'application/*': ['.pdf', '.docx', '.doc', '.odt', '.epub'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'] // Added all supported image formats
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 20,
    noClick: false, // Allow clicking
    noKeyboard: false,
    multiple: true
  });

  // Manual file selection handler
  const handleManualFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Handle manual file input change
  const handleFileInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      await onDrop(fileArray, []);
    }
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  }, [onDrop]);

  // Real-time preview generation
  const generatePreview = useCallback(async (file: FileWithPreview) => {
    try {
      let preview = '';

      // Handle PDF files specially - use native browser viewer for perfect rendering
      if (file.detectedFormat === 'pdf') {
        try {
          // Create a Blob URL for the PDF file
          const blobUrl = URL.createObjectURL(file);

          // Use an iframe to render the PDF natively
          // This handles images, layout, fonts, and large files perfectly
          preview = `
            <div style="width: 100%; height: 100%; background-color: #333; overflow: hidden;">
              <iframe 
                src="${blobUrl}#toolbar=0&view=FitH" 
                width="100%" 
                height="100%" 
                style="border: none;"
                title="${file.name}"
              >
                <div style="display: flex; flex-direction: column; items: center; justify-content: center; height: 100%; color: white; text-align: center;">
                  <p>Unable to display PDF directly.</p>
                  <a href="${blobUrl}" download="${file.name}" style="color: white; text-decoration: underline;">Download to view</a>
                </div>
              </iframe>
            </div>
          `;
        } catch (error) {
          console.error('PDF preview creation failed', error);
          preview = `<div style="text-align: center; padding: 40px;">
            <p style="color: #888;">📄 PDF file detected</p>
            <p><strong>${file.name}</strong></p>
            <p>Unable to load native viewer.</p>
          </div>`;
        }
      }
      // Handle DOCX files
      else if (file.detectedFormat === 'docx') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer });
          preview = result.value.substring(0, 5000);
        } catch {
          preview = `<div style="text-align: center; padding: 40px;">
            <p style="color: #888;">📝 Word document detected</p>
            <p><strong>${file.name}</strong></p>
            <p style="color: #666;">Size: ${formatFileSize(file.size)}</p>
          </div>`;
        }
      }
      // Handle image files
      else if (file.type.startsWith('image/')) {
        const dataUrl = URL.createObjectURL(file);
        preview = `<div style="text-align: center;">
          <img src="${dataUrl}" alt="${file.name}" style="max-width: 100%; max-height: 400px; border-radius: 8px;" />
          <p style="margin-top: 10px; color: #888;">${file.name}</p>
        </div>`;
      }
      // Handle text-based files
      else {
        const content = await file.text();

        switch (file.detectedFormat) {
          case 'md':
            const MarkdownIt = (await import('markdown-it')).default;
            const md = new MarkdownIt();
            preview = md.render(content.substring(0, 2000));
            break;
          case 'html':
            preview = content.substring(0, 2000);
            break;
          case 'json':
            try {
              const jsonData = JSON.parse(content);
              preview = `<pre style="background: #1a1a2e; padding: 15px; border-radius: 8px; overflow: auto;"><code style="color: #00ff88;">${JSON.stringify(jsonData, null, 2).substring(0, 2000)}</code></pre>`;
            } catch {
              preview = `<pre><code>${content.substring(0, 2000)}</code></pre>`;
            }
            break;
          case 'csv':
            preview = conversionService.csvToHTMLTable(content.substring(0, 5000));
            break;
          case 'xml':
            preview = `<pre style="background: #1a1a2e; padding: 15px; border-radius: 8px; overflow: auto;"><code style="color: #ff6b6b;">${content.substring(0, 2000).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
            break;
          default:
            preview = `<pre style="white-space: pre-wrap; font-family: monospace; line-height: 1.5;">${content.substring(0, 2000)}</pre>`;
        }
      }

      setPreviewContent(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to generate preview');
    }
  }, []);

  // Enhanced conversion with progress tracking
  const convertFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to convert');
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);
    setProcessing(true);

    // Show initial conversion toast
    const conversionToast = toast.loading(`Starting conversion of ${selectedFiles.length} file(s)...`);

    try {
      const totalFiles = selectedFiles.length;
      let completedFiles = 0;
      let successfulConversions = 0;

      console.log(`Starting conversion of ${totalFiles} files to ${outputFormat}`);

      for (const file of selectedFiles) {
        try {
          console.log(`Converting file: ${file.name} (${file.detectedFormat} → ${outputFormat})`);

          // Update progress
          setConversionProgress((completedFiles / totalFiles) * 100);

          // Update toast with current file
          toast.loading(`Converting ${file.name}...`, { id: conversionToast });

          // Read file content based on file type
          let content: string | ArrayBuffer;

          if (file.detectedFormat === 'pdf' || file.detectedFormat === 'docx' || file.type.startsWith('image/')) {
            // Read as ArrayBuffer for binary files
            content = await file.arrayBuffer();
            console.log(`Read ${file.name} as ArrayBuffer (${content.byteLength} bytes)`);
          } else {
            // Read as text for text-based files
            content = await file.text();
            console.log(`Read ${file.name} as text (${content.length} characters)`);
          }

          // Validate conversion path
          if (!conversionService.isConversionSupported?.(file.detectedFormat!, outputFormat)) {
            throw new Error(`Conversion from ${file.detectedFormat} to ${outputFormat} is not supported`);
          }

          // Perform conversion
          console.log(`Calling conversionService.convertFile for ${file.name}`);
          const result = await conversionService.convertFile(
            content,
            file.detectedFormat!,
            outputFormat,
            conversionOptions
          );

          console.log(`Conversion result for ${file.name}:`, {
            success: result.success,
            hasData: !!result.data,
            error: result.error,
            metadata: result.metadata
          });

          if (result.success && result.data) {
            // Generate filename - use .zip if it's a ZIP file with images
            const baseFilename = file.name.replace(/\.[^/.]+$/, '');
            const isZip = result.metadata?.isZip || false;
            const extension = isZip ? 'zip' : getFileExtension(outputFormat);
            const filename = `${baseFilename}.${extension}`;

            if (isZip && result.metadata?.imageCount) {
              console.log(`Adding converted ZIP file: ${filename} (${result.data.size} bytes) with ${result.metadata.imageCount} image(s)`);
            } else {
              console.log(`Adding converted file: ${filename} (${result.data.size} bytes)`);
            }

            // Add to conversion context
            addConvertedFile({
              id: `converted-${file.id}`,
              originalName: file.name,
              convertedName: filename,
              originalFormat: file.detectedFormat!,
              convertedFormat: outputFormat,
              size: result.data.size,
              blob: result.data,
              timestamp: new Date(),
              metadata: result.metadata
            });

            // Auto-download if enabled
            if (settings.autoDownload) {
              console.log(`Auto-downloading ${filename}`);
              downloadFile(result.data, filename);
            }

            // Save to Supabase history
            if (user?.id) {
              try {
                await addConversionHistory(user.id, {
                  fileName: file.name,
                  fileSize: file.size,
                  sourceFormat: file.detectedFormat!,
                  targetFormat: outputFormat,
                  status: 'completed'
                });
                console.log(`✅ Saved conversion history to Supabase for ${file.name}`);
              } catch (error) {
                console.error('Failed to save history to Supabase:', error);
                // Don't block the conversion flow if history save fails
              }
            }

            successfulConversions++;
            toast.success(`✅ ${file.name} converted successfully!`, {
              duration: 4000,
            });
          } else {
            throw new Error(result.error || 'Conversion failed - no data returned');
          }

          completedFiles++;
          setConversionProgress((completedFiles / totalFiles) * 100);

        } catch (error) {
          console.error(`Error converting ${file.name}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`❌ Failed to convert ${file.name}: ${errorMessage}`, {
            duration: 6000,
          });
        }
      }

      // Dismiss loading toast
      toast.dismiss(conversionToast);

      // Final success message
      if (successfulConversions > 0) {
        toast.success(`🎉 Successfully converted ${successfulConversions} of ${totalFiles} files!`, {
          duration: 5000,
        });

        console.log(`Conversion completed: ${successfulConversions}/${totalFiles} files successful`);
      } else {
        toast.error('No files were successfully converted. Please check the console for details.');
      }

      // Note: We intentionally keep files selected so the user can convert them again to a different format
      // if (successfulConversions === totalFiles) {
      //   setSelectedFiles([]);
      // }

    } catch (error) {
      console.error('Batch conversion error:', error);
      toast.dismiss(conversionToast);
      toast.error('Failed to convert files. Please check the console for details.');
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
      setProcessing(false);
    }
  }, [selectedFiles, outputFormat, conversionOptions, settings.autoDownload, addConvertedFile, setProcessing]);

  // Remove file from selection
  const removeSelectedFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Clean up preview URLs
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updated;
    });
  };

  // Clear all files
  const clearAllFiles = () => {
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
    setShowPreview(false);
    setPreviewContent('');
  };

  // Format categories for better organization
  const formatCategories = {
    document: ['pdf', 'docx', 'rtf', 'odt', 'epub'] as SupportedFormat[],
    text: ['txt', 'md', 'html', 'latex'] as SupportedFormat[],
    data: ['csv', 'json', 'xml'] as SupportedFormat[],
    image: ['png', 'jpg'] as SupportedFormat[]
  };

  const getFormatIcon = (format: SupportedFormat) => {
    const iconMap = {
      pdf: FileText, docx: FileText, rtf: FileText, odt: FileText, epub: BookOpen,
      txt: Type, md: FileCode, html: Globe, latex: FileCode,
      csv: Database, json: FileCode, xml: FileCode,
      png: Image, jpg: Image
    };
    return iconMap[format] || FileText;
  };

  const getFormatColor = (format: SupportedFormat) => {
    const colorMap = {
      pdf: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      docx: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      html: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      md: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      csv: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      json: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      png: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      jpg: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    };
    return colorMap[format] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{
                rotate: isConverting ? [0, 360] : 0,
                scale: isConverting ? [1, 1.1, 1] : 1
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity }
              }}
            >
              <Zap className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('documentConverter')}
              </h1>
              <p className="text-muted-foreground">{t('convertBetweenFormats')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="hidden sm:flex">
              {conversionService.getSupportedFormats().length} {t('formatsSupported')}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className={showAdvancedOptions ? 'bg-primary text-primary-foreground' : ''}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Conversion Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Area */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>{t('uploadFiles')}</span>
                </CardTitle>
                <CardDescription>
                  {t('dragDropOrClick')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Hidden file input for manual selection */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  accept=".txt,.md,.html,.csv,.json,.xml,.rtf,.pdf,.docx,.doc,.odt,.epub,.png,.jpg,.jpeg,.gif,.bmp,.webp"
                  style={{ display: 'none' }}
                />

                <div
                  {...getRootProps()}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 transform
                    ${isDragActive ? 'border-primary bg-primary/5 scale-105' : 'border-muted-foreground/25'}
                    ${isDragReject ? 'border-destructive bg-destructive/5' : ''}
                    hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]
                  `}
                  onClick={handleManualFileSelect}
                >
                  <input {...getInputProps()} style={{ display: 'none' }} />

                  <motion.div
                    animate={isDragActive ? { y: [-5, 5, -5] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  </motion.div>

                  <h3 className="text-lg font-semibold mb-2">
                    {isDragActive ? 'Drop files here!' : t('dragAndDrop')}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t('orClickToBrowse')}
                  </p>

                  {/* Browse Button */}
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualFileSelect();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 mb-4"
                  >
                    <Upload className="h-4 w-4" />
                    {t('browseFiles')}
                  </motion.button>

                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {['CSV', 'PDF', 'DOCX', 'JSON', 'PNG', 'JPG', 'GIF'].map((format) => (
                      <Badge key={format} variant="secondary" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t('maximumFileSize')}: 50MB • {t('maximumFiles')}: 20
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Selected Files */}
            <AnimatePresence>
              {selectedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <FileText className="h-5 w-5" />
                          <span>{t('selectedFiles')} ({selectedFiles.length})</span>
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={clearAllFiles}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('clearAll')}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedFiles.map((file, index) => {
                          const FormatIcon = getFormatIcon(file.detectedFormat!);
                          return (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <FormatIcon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{file.name}</p>
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <span>{formatFileSize(file.size)}</span>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getFormatColor(file.detectedFormat!)}`}
                                    >
                                      {file.detectedFormat?.toUpperCase()}
                                    </Badge>
                                    {file.suggestedFormats && file.suggestedFormats.length > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Smart suggestions
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => generatePreview(file)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSelectedFile(file.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversion Progress */}
            <AnimatePresence>
              {isConverting && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="border-primary">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <RefreshCw className="h-5 w-5 text-primary" />
                            </motion.div>
                            <span className="font-medium">{t('convertingFiles')}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(conversionProgress)}%
                          </span>
                        </div>

                        <Progress value={conversionProgress} className="h-2" />

                        <p className="text-sm text-muted-foreground text-center">
                          {t('pleaseWait')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Converted Files Display */}
            <AnimatePresence>
              {convertedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                          <CheckCircle className="h-5 w-5" />
                          <span>{t('convertedFiles')} ({convertedFiles.length})</span>
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => state.convertedFiles.forEach(file => downloadFile(file.blob, file.convertedName))}
                          className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t('downloadAll')}
                        </Button>
                      </div>
                      <CardDescription className="text-green-600 dark:text-green-400">
                        Your files have been successfully converted and are ready for download.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {convertedFiles.map((file, index) => {
                          const FormatIcon = getFormatIcon(file.convertedFormat);
                          return (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-green-200 dark:border-green-800"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <FormatIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center"
                                  >
                                    <CheckCircle className="h-2 w-2 text-white" />
                                  </motion.div>
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-green-800 dark:text-green-200">
                                    {file.convertedName}
                                  </p>
                                  <div className="flex items-center space-x-3 text-xs text-green-600 dark:text-green-400">
                                    <span>{t('from')}: {file.originalName}</span>
                                    <span>•</span>
                                    <span>{formatFileSize(file.size)}</span>
                                    <span>•</span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                                    >
                                      {file.originalFormat.toUpperCase()} → {file.convertedFormat.toUpperCase()}
                                    </Badge>
                                    {file.metadata && (
                                      <>
                                        <span>•</span>
                                        <span>{file.metadata.processingTime}ms</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadFile(file.blob, file.convertedName)}
                                  className="h-8 text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Copy download link to clipboard
                                    const url = URL.createObjectURL(file.blob);
                                    navigator.clipboard.writeText(url);
                                    toast.success('Download link copied to clipboard!');
                                  }}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Conversion Summary */}
                      <div className="mt-4 p-3 bg-green-100/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-700 dark:text-green-300 font-medium">
                            {t('conversionSummary')}
                          </span>
                          <div className="flex items-center space-x-4 text-green-600 dark:text-green-400">
                            <span>Total: {convertedFiles.length} files</span>
                            <span>•</span>
                            <span>
                              Size: {formatFileSize(convertedFiles.reduce((acc, file) => acc + file.size, 0))}
                            </span>
                            {convertedFiles.length > 0 && convertedFiles[0].metadata && (
                              <>
                                <span>•</span>
                                <span>
                                  Avg. time: {Math.round(convertedFiles.reduce((acc, file) => acc + (file.metadata?.processingTime || 0), 0) / convertedFiles.length)}ms
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Output Format Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>{t('outputFormat')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="document" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="document">{t('document')}</TabsTrigger>
                    <TabsTrigger value="data">{t('data')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="document" className="space-y-3 mt-4">
                    {formatCategories.document.map((format) => {
                      // Check if this format is supported for all selected files
                      const isSupported = selectedFiles.every(file =>
                        file.detectedFormat && conversionService.isConversionSupported(file.detectedFormat, format)
                      );

                      if (!isSupported && selectedFiles.length > 0) return null;

                      const FormatIcon = getFormatIcon(format);
                      const formatInfo = conversionService.getFormatInfo(format);
                      return (
                        <motion.div
                          key={format}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant={outputFormat === format ? "default" : "outline"}
                            className="w-full justify-start h-auto p-3"
                            onClick={() => setOutputFormat(format)}
                          >
                            <FormatIcon className="h-4 w-4 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">{formatInfo.name}</div>
                              <div className={`text-xs ${outputFormat === format ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                {formatInfo.description}
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </TabsContent>

                  <TabsContent value="data" className="space-y-3 mt-4">
                    {[...formatCategories.text, ...formatCategories.data, ...formatCategories.image].map((format) => {
                      // Check if this format is supported for all selected files
                      const isSupported = selectedFiles.every(file =>
                        file.detectedFormat && conversionService.isConversionSupported(file.detectedFormat, format)
                      );

                      if (!isSupported && selectedFiles.length > 0) return null;

                      const FormatIcon = getFormatIcon(format);
                      const formatInfo = conversionService.getFormatInfo(format);
                      return (
                        <motion.div
                          key={format}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant={outputFormat === format ? "default" : "outline"}
                            className="w-full justify-start h-auto p-3"
                            onClick={() => setOutputFormat(format)}
                          >
                            <FormatIcon className="h-4 w-4 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">{formatInfo.name}</div>
                              <div className={`text-xs ${outputFormat === format ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                {formatInfo.description}
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Advanced Options */}
            <AnimatePresence>
              {showAdvancedOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Wand2 className="h-5 w-5" />
                        <span>Advanced Options</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Quality Settings */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Quality</Label>
                        <Select
                          value={conversionOptions.quality}
                          onValueChange={(value) => setConversionOptions(prev => ({
                            ...prev,
                            quality: value as 'low' | 'medium' | 'high'
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low (Faster)</SelectItem>
                            <SelectItem value="medium">Medium (Balanced)</SelectItem>
                            <SelectItem value="high">High (Best Quality)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Font Size */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Font Size</Label>
                        <div className="px-3">
                          <Slider
                            value={[conversionOptions.fontSize || 16]}
                            onValueChange={([value]) => setConversionOptions(prev => ({
                              ...prev,
                              fontSize: value
                            }))}
                            max={24}
                            min={8}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>8px</span>
                            <span>{conversionOptions.fontSize}px</span>
                            <span>24px</span>
                          </div>
                        </div>
                      </div>

                      {/* Options Toggles */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="preserve-formatting" className="text-sm">
                            Preserve formatting
                          </Label>
                          <Switch
                            id="preserve-formatting"
                            checked={conversionOptions.preserveFormatting}
                            onCheckedChange={(checked) => setConversionOptions(prev => ({
                              ...prev,
                              preserveFormatting: checked
                            }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="include-metadata" className="text-sm">
                            Include metadata
                          </Label>
                          <Switch
                            id="include-metadata"
                            checked={conversionOptions.includeMetadata}
                            onCheckedChange={(checked) => setConversionOptions(prev => ({
                              ...prev,
                              includeMetadata: checked
                            }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="compression" className="text-sm">
                            Enable compression
                          </Label>
                          <Switch
                            id="compression"
                            checked={conversionOptions.compression}
                            onCheckedChange={(checked) => setConversionOptions(prev => ({
                              ...prev,
                              compression: checked
                            }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Convert Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={convertFiles}
                disabled={selectedFiles.length === 0 || isConverting}
                className="w-full h-12 text-lg font-semibold relative overflow-hidden"
                size="lg"
              >
                <motion.div
                  animate={isConverting ? { x: [-20, 20, -20] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center space-x-2"
                >
                  {isConverting ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Zap className="h-5 w-5" />
                  )}
                  <span>
                    {isConverting ? 'Converting...' : `Convert ${selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}` : 'Files'}`}
                  </span>
                </motion.div>
              </Button>
            </motion.div>

            {/* Quick Stats */}
            {selectedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    <span>{t('quickStats')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('totalFiles')}:</span>
                    <span className="font-medium">{selectedFiles.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('totalSize')}:</span>
                    <span className="font-medium">
                      {formatFileSize(selectedFiles.reduce((acc, file) => acc + file.size, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('outputFormat')}:</span>
                    <Badge variant="outline" className="text-xs">
                      {outputFormat.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Converted Files Management */}
            {convertedFiles.length > 0 && (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <span>Converted Files</span>
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-400">
                    {convertedFiles.length} file{convertedFiles.length > 1 ? 's' : ''} ready for download
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Converted files:</span>
                    <span className="font-medium text-green-700 dark:text-green-300">{convertedFiles.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total size:</span>
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {formatFileSize(convertedFiles.reduce((acc, file) => acc + file.size, 0))}
                    </span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => convertedFiles.forEach(file => downloadFile(file.blob, file.convertedName))}
                      className="w-full text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All ({convertedFiles.length})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearConvertedFiles();
                        toast.success('Converted files cleared');
                      }}
                      className="w-full text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-background rounded-lg shadow-xl w-[90vw] h-[90vh] max-w-7xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                  <h3 className="text-lg font-semibold">File Preview</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                    ✕
                  </Button>
                </div>
                <div
                  className="p-0 flex-1 overflow-auto bg-gray-100 dark:bg-gray-900"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ConverterPage;