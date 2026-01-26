/**
 * Batch Processor Page
 * Full-featured batch conversion using the same conversion service as single file converter
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversion } from '@/contexts/ConversionContext';
import { conversionService, SupportedFormat, ConversionOptions, downloadFile, getFileExtension, formatFileSize } from '@/lib/conversionService';
import { toast } from 'react-hot-toast';
import { useUser } from '@clerk/clerk-react';
import { addConversionHistory } from '@/lib/supabase';
import JSZip from 'jszip';
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
  FolderOpen,
  Package,
  Play,
  Pause,
  X,
  Check,
  ArrowRight
} from 'lucide-react';

interface BatchFile {
  id: string;
  file: File;
  name: string;
  size: number;
  detectedFormat: SupportedFormat;
  suggestedFormats: SupportedFormat[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  convertedBlob?: Blob;
  convertedName?: string;
  processingTime?: number;
}

const BatchProcessorPage: React.FC = () => {
  const { state, addConvertedFile, setProcessing } = useConversion();
  const { user } = useUser();

  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<SupportedFormat>('pdf');
  const [isConverting, setIsConverting] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
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
  const [showSettings, setShowSettings] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze file for format detection
  const analyzeFile = useCallback(async (file: File): Promise<{ detectedFormat: SupportedFormat; suggestedFormats: SupportedFormat[] }> => {
    const content = await file.text().catch(() => '');
    const detectedFormat = conversionService.detectFormat(file.name, content);
    const suggestedFormats = conversionService.suggestOptimalFormat(content, detectedFormat);
    return { detectedFormat, suggestedFormats };
  }, []);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          switch (error.code) {
            case 'file-too-large':
              toast.error(`"${file.name}" is too large. Maximum size is 50MB.`);
              break;
            case 'file-invalid-type':
              toast.error(`"${file.name}" has an unsupported format.`);
              break;
            case 'too-many-files':
              toast.error('Too many files. Maximum is 50 files at once.');
              break;
            default:
              toast.error(`Error with "${file.name}": ${error.message}`);
          }
        });
      });
    }

    if (acceptedFiles.length === 0) return;

    const loadingToast = toast.loading(`Processing ${acceptedFiles.length} file(s)...`);

    try {
      const newFiles: BatchFile[] = [];

      for (const file of acceptedFiles) {
        try {
          const { detectedFormat, suggestedFormats } = await analyzeFile(file);

          newFiles.push({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            name: file.name,
            size: file.size,
            detectedFormat,
            suggestedFormats,
            status: 'pending',
            progress: 0
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to process "${file.name}"`);
        }
      }

      if (newFiles.length > 0) {
        setBatchFiles(prev => [...prev, ...newFiles]);
        toast.success(`${newFiles.length} file(s) added to batch!`, { icon: '📁' });
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process some files.');
    } finally {
      toast.dismiss(loadingToast);
    }
  }, [analyzeFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.md', '.html', '.csv', '.json', '.xml', '.rtf'],
      'application/*': ['.pdf', '.docx', '.doc', '.odt', '.epub'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 50 * 1024 * 1024,
    maxFiles: 50,
    multiple: true
  });

  // Manual file selection
  const handleManualFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await onDrop(Array.from(files), []);
    }
    if (event.target) event.target.value = '';
  }, [onDrop]);

  // Remove single file
  const removeFile = (id: string) => {
    setBatchFiles(prev => prev.filter(f => f.id !== id));
  };

  // Clear all files
  const clearAllFiles = () => {
    setBatchFiles([]);
    setOverallProgress(0);
  };

  // Convert all files
  const convertAllFiles = async () => {
    if (batchFiles.length === 0) {
      toast.error('Please add files to convert');
      return;
    }

    const pendingFiles = batchFiles.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) {
      toast.error('No pending files to convert');
      return;
    }

    setIsConverting(true);
    setProcessing(true);
    setOverallProgress(0);

    const totalFiles = pendingFiles.length;
    let completedFiles = 0;
    let successCount = 0;

    const conversionToast = toast.loading(`Converting ${totalFiles} file(s)...`);

    for (const batchFile of pendingFiles) {
      // Update status to processing
      setBatchFiles(prev => prev.map(f => 
        f.id === batchFile.id ? { ...f, status: 'processing' as const, progress: 0 } : f
      ));

      const startTime = Date.now();

      try {
        // Read file content
        let content: string | ArrayBuffer;
        if (batchFile.detectedFormat === 'pdf' || batchFile.detectedFormat === 'docx' || batchFile.file.type.startsWith('image/')) {
          content = await batchFile.file.arrayBuffer();
        } else {
          content = await batchFile.file.text();
        }

        // Check if conversion is supported
        if (!conversionService.isConversionSupported?.(batchFile.detectedFormat, outputFormat)) {
          throw new Error(`Conversion from ${batchFile.detectedFormat} to ${outputFormat} not supported`);
        }

        // Update progress to 50%
        setBatchFiles(prev => prev.map(f => 
          f.id === batchFile.id ? { ...f, progress: 50 } : f
        ));

        // Perform conversion
        const result = await conversionService.convertFile(
          content,
          batchFile.detectedFormat,
          outputFormat,
          conversionOptions
        );

        const processingTime = Date.now() - startTime;

        if (result.success && result.data) {
          const baseFilename = batchFile.name.replace(/\.[^/.]+$/, '');
          const isZip = result.metadata?.isZip || false;
          const extension = isZip ? 'zip' : getFileExtension(outputFormat);
          const filename = `${baseFilename}.${extension}`;

          // Update file status
          setBatchFiles(prev => prev.map(f => 
            f.id === batchFile.id ? {
              ...f,
              status: 'completed' as const,
              progress: 100,
              convertedBlob: result.data,
              convertedName: filename,
              processingTime
            } : f
          ));

          // Add to conversion context
          addConvertedFile({
            id: `batch-${batchFile.id}`,
            originalName: batchFile.name,
            convertedName: filename,
            originalFormat: batchFile.detectedFormat,
            convertedFormat: outputFormat,
            size: result.data.size,
            blob: result.data,
            timestamp: new Date(),
            metadata: result.metadata
          });

          // Auto-download if enabled
          if (autoDownload) {
            downloadFile(result.data, filename);
          }

          // Save to Supabase
          if (user?.id) {
            await addConversionHistory(user.id, {
              fileName: batchFile.name,
              fileSize: batchFile.size,
              sourceFormat: batchFile.detectedFormat,
              targetFormat: outputFormat,
              status: 'completed'
            }).catch(console.error);
          }

          successCount++;
        } else {
          throw new Error(result.error || 'Conversion failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setBatchFiles(prev => prev.map(f => 
          f.id === batchFile.id ? {
            ...f,
            status: 'error' as const,
            progress: 0,
            error: errorMessage
          } : f
        ));
        console.error(`Error converting ${batchFile.name}:`, error);
      }

      completedFiles++;
      setOverallProgress((completedFiles / totalFiles) * 100);
    }

    toast.dismiss(conversionToast);

    if (successCount > 0) {
      toast.success(`Successfully converted ${successCount} of ${totalFiles} files!`, { icon: '🎉' });
    } else {
      toast.error('No files were successfully converted.');
    }

    setIsConverting(false);
    setProcessing(false);
  };

  // Download all converted files as ZIP
  const downloadAllAsZip = async () => {
    const completedFiles = batchFiles.filter(f => f.status === 'completed' && f.convertedBlob);
    
    if (completedFiles.length === 0) {
      toast.error('No converted files to download');
      return;
    }

    const loadingToast = toast.loading('Creating ZIP file...');

    try {
      const zip = new JSZip();
      
      for (const file of completedFiles) {
        if (file.convertedBlob && file.convertedName) {
          zip.file(file.convertedName, file.convertedBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = `batch_converted_${new Date().toISOString().slice(0, 10)}.zip`;
      
      downloadFile(zipBlob, zipName);
      toast.success(`Downloaded ${completedFiles.length} files as ZIP!`, { icon: '📦' });
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toast.error('Failed to create ZIP file');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Get file icon based on format
  const getFormatIcon = (format: SupportedFormat) => {
    const iconMap: Record<string, React.ElementType> = {
      pdf: FileText, docx: FileText, rtf: FileText, odt: FileText, epub: BookOpen,
      txt: Type, md: FileCode, html: Globe, latex: FileCode,
      csv: Database, json: FileCode, xml: FileCode,
      png: Image, jpg: Image, jpeg: Image
    };
    return iconMap[format] || FileText;
  };

  // Get status badge
  const getStatusBadge = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-gray-500">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="text-blue-500 animate-pulse">Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  // Format categories
  const formatCategories = {
    document: ['pdf', 'docx', 'rtf', 'odt', 'epub'] as SupportedFormat[],
    text: ['txt', 'md', 'html', 'latex'] as SupportedFormat[],
    data: ['csv', 'json', 'xml'] as SupportedFormat[],
    image: ['png', 'jpg'] as SupportedFormat[]
  };

  // Stats
  const totalFiles = batchFiles.length;
  const pendingFiles = batchFiles.filter(f => f.status === 'pending').length;
  const completedFiles = batchFiles.filter(f => f.status === 'completed').length;
  const errorFiles = batchFiles.filter(f => f.status === 'error').length;
  const totalSize = batchFiles.reduce((acc, f) => acc + f.size, 0);

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
              animate={isConverting ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Layers className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Batch Processor
              </h1>
              <p className="text-muted-foreground">Convert multiple files at once with professional quality</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="hidden sm:flex">
              {totalFiles} files • {formatFileSize(totalSize)}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className={showSettings ? 'bg-primary text-primary-foreground' : ''}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5" />
                  <span>Batch Upload</span>
                </CardTitle>
                <CardDescription>
                  Drag and drop multiple files or click to browse. Max 50 files, 50MB each.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  accept=".csv,.pdf,.docx,.json,.txt,.md,.html,.xml"
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

                  <motion.div animate={isDragActive ? { y: [-5, 5, -5] } : {}} transition={{ duration: 1, repeat: Infinity }}>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  </motion.div>

                  <h3 className="text-lg font-semibold mb-2">
                    {isDragActive ? 'Drop files here!' : 'Drop multiple files here'}
                  </h3>
                  <p className="text-muted-foreground mb-4">or click to browse</p>

                  <motion.button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleManualFileSelect(); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg"
                  >
                    <Upload className="h-4 w-4" />
                    Browse Files
                  </motion.button>

                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {['PDF', 'DOCX', 'CSV', 'JSON', 'TXT', 'MD', 'HTML'].map((format) => (
                      <Badge key={format} variant="secondary" className="text-xs">{format}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File List */}
            <AnimatePresence>
              {batchFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <FileText className="h-5 w-5" />
                          <span>Files in Batch ({totalFiles})</span>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-green-600">{completedFiles} done</Badge>
                          <Badge variant="outline" className="text-gray-500">{pendingFiles} pending</Badge>
                          {errorFiles > 0 && <Badge variant="destructive">{errorFiles} failed</Badge>}
                          <Button variant="outline" size="sm" onClick={clearAllFiles}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                          {batchFiles.map((file, index) => {
                            const FormatIcon = getFormatIcon(file.detectedFormat);
                            return (
                              <motion.div
                                key={file.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  file.status === 'completed' ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                                  file.status === 'error' ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                                  file.status === 'processing' ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' :
                                  'bg-muted/50'
                                }`}
                              >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <FormatIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{file.name}</p>
                                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                      <span>{formatFileSize(file.size)}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {file.detectedFormat.toUpperCase()}
                                      </Badge>
                                      {file.processingTime && (
                                        <span className="text-green-600">{file.processingTime}ms</span>
                                      )}
                                    </div>
                                    {file.status === 'processing' && (
                                      <Progress value={file.progress} className="h-1 mt-1" />
                                    )}
                                    {file.error && (
                                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  {getStatusBadge(file.status)}
                                  {file.status === 'completed' && file.convertedBlob && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => downloadFile(file.convertedBlob!, file.convertedName!)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(file.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </ScrollArea>
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
                            <span className="font-medium">Batch Conversion in Progress</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(overallProgress)}%
                          </span>
                        </div>
                        <Progress value={overallProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground text-center">
                          Processing {completedFiles + 1} of {totalFiles} files...
                        </p>
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
                  <span>Output Format</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="document" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="document">Documents</TabsTrigger>
                    <TabsTrigger value="data">Data & Text</TabsTrigger>
                  </TabsList>

                  <TabsContent value="document" className="space-y-2 mt-4">
                    {formatCategories.document.map((format) => {
                      const FormatIcon = getFormatIcon(format);
                      const formatInfo = conversionService.getFormatInfo(format);
                      return (
                        <Button
                          key={format}
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
                      );
                    })}
                  </TabsContent>

                  <TabsContent value="data" className="space-y-2 mt-4">
                    {[...formatCategories.text, ...formatCategories.data].map((format) => {
                      const FormatIcon = getFormatIcon(format);
                      const formatInfo = conversionService.getFormatInfo(format);
                      return (
                        <Button
                          key={format}
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
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Settings */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Wand2 className="h-5 w-5" />
                        <span>Conversion Settings</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Quality */}
                      <div className="space-y-2">
                        <Label>Quality</Label>
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
                      <div className="space-y-2">
                        <Label>Font Size: {conversionOptions.fontSize}px</Label>
                        <Slider
                          value={[conversionOptions.fontSize || 16]}
                          onValueChange={([value]) => setConversionOptions(prev => ({
                            ...prev,
                            fontSize: value
                          }))}
                          max={24}
                          min={8}
                          step={1}
                        />
                      </div>

                      <Separator />

                      {/* Toggle Options */}
                      <div className="flex items-center justify-between">
                        <Label>Preserve formatting</Label>
                        <Switch
                          checked={conversionOptions.preserveFormatting}
                          onCheckedChange={(checked) => setConversionOptions(prev => ({
                            ...prev,
                            preserveFormatting: checked
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Auto-download each file</Label>
                        <Switch
                          checked={autoDownload}
                          onCheckedChange={setAutoDownload}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Enable compression</Label>
                        <Switch
                          checked={conversionOptions.compression}
                          onCheckedChange={(checked) => setConversionOptions(prev => ({
                            ...prev,
                            compression: checked
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={convertAllFiles}
                    disabled={batchFiles.length === 0 || isConverting || pendingFiles === 0}
                    className="w-full h-12 text-lg font-semibold"
                    size="lg"
                  >
                    {isConverting ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Convert All ({pendingFiles})
                      </>
                    )}
                  </Button>
                </motion.div>

                {completedFiles > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={downloadAllAsZip}
                    disabled={isConverting}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Download All as ZIP ({completedFiles})
                  </Button>
                )}

                {completedFiles > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      batchFiles.filter(f => f.status === 'completed' && f.convertedBlob).forEach(f => {
                        downloadFile(f.convertedBlob!, f.convertedName!);
                      });
                      toast.success(`Downloading ${completedFiles} files...`);
                    }}
                    disabled={isConverting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Individually
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Stats Summary */}
            {batchFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Sparkles className="h-4 w-4" />
                    <span>Batch Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total files:</span>
                    <span className="font-medium">{totalFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total size:</span>
                    <span className="font-medium">{formatFileSize(totalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Output format:</span>
                    <Badge variant="outline">{outputFormat.toUpperCase()}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-green-600">
                    <span>Completed:</span>
                    <span className="font-medium">{completedFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending:</span>
                    <span>{pendingFiles}</span>
                  </div>
                  {errorFiles > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Failed:</span>
                      <span>{errorFiles}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BatchProcessorPage;
