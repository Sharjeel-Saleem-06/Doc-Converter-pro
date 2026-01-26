/**
 * Enhanced AI-Powered Document Editor
 * Professional editor with LangChain AI integration
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Save,
  Download,
  Upload,
  Sparkles,
  Wand2,
  Bot,
  PanelRightOpen,
  PanelRightClose,
  Copy,
  CheckCheck,
  Loader2,
  ChevronDown,
  RefreshCw,
  Check,
  X,
  Plus,
  Minus,
  Type,
  Zap,
  FileDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Image as ImageIcon,
  Clock,
  Eye,
  EyeOff,
  Settings2,
  ArrowRight,
  Edit3,
  Send,
  MessageSquare,
  StopCircle,
  Trash2,
  User,
  CheckCircle,
  Undo2,
  Redo2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AIAssistantPanel } from '@/components/editor/AIAssistantPanel';
import { AIErrorBoundary } from '@/components/ErrorBoundary';
import { langchainUtils } from '@/lib/langchain/llm';
import { validateConfig, LANGCHAIN_CONFIG, OPERATION_CONFIGS } from '@/lib/langchain/config';
import type { StreamChunk, ToneType } from '@/lib/langchain/types';

// Document statistics interface
interface DocumentStats {
  words: number;
  characters: number;
  sentences: number;
  paragraphs: number;
  readingTime: number;
}

// Calculate document statistics
const calculateStats = (text: string): DocumentStats => {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;
  const readingTime = Math.ceil(words / 200); // Average reading speed

  return { words, characters, sentences, paragraphs, readingTime };
};

const EditorPage: React.FC = () => {
  // Document state
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('document.txt');
  const [documentType, setDocumentType] = useState<'plain' | 'markdown'>('plain');

  // Undo/Redo history state
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  // Track content changes for undo/redo
  const updateContent = useCallback((newContent: string, addToHistory = true) => {
    setContent(newContent);
    
    if (addToHistory && !isUndoRedoAction.current) {
      setHistory(prev => {
        // Remove any future history if we're in the middle of the stack
        const newHistory = prev.slice(0, historyIndex + 1);
        // Add new state
        newHistory.push(newContent);
        // Keep history limited to 50 entries
        if (newHistory.length > 50) {
          newHistory.shift();
          return newHistory;
        }
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49));
    }
    isUndoRedoAction.current = false;
  }, [historyIndex]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      toast.success('Undo successful', { icon: '↩️', duration: 1500 });
    } else {
      toast.error('Nothing to undo');
    }
  }, [historyIndex, history]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      toast.success('Redo successful', { icon: '↪️', duration: 1500 });
    } else {
      toast.error('Nothing to redo');
    }
  }, [historyIndex, history]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // UI state
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 });
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ x: 0, y: 0 });

  // AI state
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Auto-save state
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Config validation
  const configValidation = validateConfig();

  // Calculate stats
  const stats = calculateStats(content);

  // Handle text selection with improved positioning
  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    setCursorPosition({ start, end });
    setSelectedText(selected);

    if (selected.trim() && selected.length > 0) {
      // Use window selection API for accurate positioning
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectionRect = range.getBoundingClientRect();
        
        // Position the toolbar above the selection
        setFloatingToolbarPosition({
          x: Math.max(20, selectionRect.left + (selectionRect.width / 2) - 150), // Center above selection
          y: Math.max(20, selectionRect.top + window.scrollY - 60), // Above selection with scroll offset
        });
        setShowFloatingToolbar(true);
      } else {
        // Fallback: position based on textarea
        const rect = textarea.getBoundingClientRect();
        setFloatingToolbarPosition({
          x: rect.left + 100,
          y: rect.top + window.scrollY + 50,
        });
        setShowFloatingToolbar(true);
      }
    } else {
      setShowFloatingToolbar(false);
    }
  }, [content]);

  // Listen for selection changes with debounce
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let selectionTimeout: NodeJS.Timeout;

    const handleSelectionChange = () => {
      // Clear any pending timeout
      if (selectionTimeout) clearTimeout(selectionTimeout);
      
      // Debounce the selection handling
      selectionTimeout = setTimeout(() => {
        if (document.activeElement === textarea) {
          handleTextSelection();
        }
      }, 50);
    };

    const handleMouseUp = () => {
      handleSelectionChange();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Only handle arrow keys and shift+arrow for selection
      if (e.shiftKey || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        handleSelectionChange();
      }
    };

    // Hide toolbar when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (!textarea.contains(e.target as Node)) {
        setShowFloatingToolbar(false);
      }
    };

    textarea.addEventListener('mouseup', handleMouseUp);
    textarea.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      if (selectionTimeout) clearTimeout(selectionTimeout);
      textarea.removeEventListener('mouseup', handleMouseUp);
      textarea.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleTextSelection]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty) return;

    const timer = setTimeout(() => {
      handleSave();
      setIsDirty(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [content, autoSave, isDirty]);

  // Mark as dirty when content changes
  useEffect(() => {
    if (content) {
      setIsDirty(true);
    }
  }, [content]);

  // Handle save
  const handleSave = () => {
    localStorage.setItem('editor_content', content);
    localStorage.setItem('editor_filename', fileName);
    setLastSaved(new Date());
    toast.success('Document saved!', { icon: '💾' });
  };

  // Handle download
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document downloaded!', { icon: '📥' });
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateContent(e.target?.result as string);
        setFileName(file.name);
        toast.success('File loaded!', { icon: '📄' });
      };
      reader.readAsText(file);
    }
  };

  // Load saved content on mount
  useEffect(() => {
    const savedContent = localStorage.getItem('editor_content');
    const savedFileName = localStorage.getItem('editor_filename');
    if (savedContent) {
      updateContent(savedContent, false); // Don't add to history on initial load
    }
    if (savedFileName) {
      setFileName(savedFileName);
    }
  }, []);

  // AI Quick Action Handler
  const handleQuickAIAction = async (action: string, tone?: ToneType) => {
    if (!selectedText.trim() && action !== 'generate') {
      toast.error('Please select some text first');
      return;
    }

    setIsAIProcessing(true);
    setStreamingText('');
    setIsStreaming(true);

    try {
      let prompt = selectedText;
      let systemPrompt = 'You are a helpful writing assistant.';
      let operation: 'grammar' | 'rewrite' | 'expand' | 'summarize' | 'continue' | 'generate' = 'generate';

      switch (action) {
        case 'grammar':
          systemPrompt = OPERATION_CONFIGS.grammar.systemPrompt;
          prompt = `Fix the grammar in this text:\n\n${selectedText}`;
          operation = 'grammar';
          break;
        case 'tone':
          systemPrompt = OPERATION_CONFIGS.tone.systemPrompt;
          prompt = `Rewrite this text in a ${tone} tone:\n\n${selectedText}`;
          operation = 'rewrite';
          break;
        case 'expand':
          systemPrompt = OPERATION_CONFIGS.expand.systemPrompt;
          prompt = `Expand this text with more details:\n\n${selectedText}`;
          operation = 'expand';
          break;
        case 'summarize':
          systemPrompt = OPERATION_CONFIGS.summarize.systemPrompt;
          prompt = `Summarize this text:\n\n${selectedText}`;
          operation = 'summarize';
          break;
        case 'continue':
          systemPrompt = OPERATION_CONFIGS.continue.systemPrompt;
          prompt = `Continue writing from here:\n\n${content.slice(-500)}`;
          operation = 'continue';
          break;
      }

      let fullResponse = '';
      await langchainUtils.streamComplete(
        prompt,
        (chunk: StreamChunk) => {
          if (!chunk.done) {
            fullResponse += chunk.content;
            setStreamingText(fullResponse);
          } else {
            // Apply the result
            if (action === 'continue') {
              updateContent(content + '\n\n' + fullResponse);
            } else {
              const newContent =
                content.substring(0, cursorPosition.start) +
                fullResponse +
                content.substring(cursorPosition.end);
              updateContent(newContent);
            }
            setIsStreaming(false);
            setIsAIProcessing(false);
            setShowFloatingToolbar(false);
            toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} completed!`);
          }
        },
        systemPrompt,
        operation
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI action failed');
      setIsStreaming(false);
      setIsAIProcessing(false);
    }
  };

  // Handle insert from AI panel
  const handleInsertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionEnd || content.length;
    const newContent = content.substring(0, pos) + '\n\n' + text + content.substring(pos);
    updateContent(newContent);
    toast.success('Text inserted!');
  };

  // Handle replace from AI panel
  const handleReplaceText = (text: string) => {
    if (!selectedText) {
      toast.error('No text selected to replace');
      return;
    }

    const newContent =
      content.substring(0, cursorPosition.start) +
      text +
      content.substring(cursorPosition.end);
    updateContent(newContent);
    setSelectedText('');
    setShowFloatingToolbar(false);
    toast.success('Text replaced!');
  };

  // Copy content
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!', { icon: '📋' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Main Container */}
      <div className="flex h-[calc(100vh-120px)] overflow-hidden">
        {/* Editor Section */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showAIPanel ? 'pr-0' : ''}`}>
          {/* Header Bar */}
          <div className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">AI Document Editor</h1>
                      <p className="text-xs text-muted-foreground">
                        Powered by {LANGCHAIN_CONFIG.model.split('-').slice(0, 2).join(' ').toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={configValidation.valid ? 'default' : 'destructive'}
                    className={configValidation.valid ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
                  >
                    {configValidation.valid ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> AI Ready</>
                    ) : (
                      'AI Not Configured'
                    )}
                  </Badge>
                </div>

                <div className="flex items-center gap-4">
                  {/* Auto-save Toggle */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto-save" className="text-xs text-muted-foreground">
                      Auto-save
                    </Label>
                    <Switch
                      id="auto-save"
                      checked={autoSave}
                      onCheckedChange={setAutoSave}
                    />
                  </div>

                  {/* Last Saved */}
                  {lastSaved && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}

                  {/* AI Panel Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAIPanel(!showAIPanel)}
                        className="gap-2"
                      >
                        {showAIPanel ? (
                          <PanelRightClose className="w-4 h-4" />
                        ) : (
                          <PanelRightOpen className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">AI Panel</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {showAIPanel ? 'Hide AI Panel' : 'Show AI Panel'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 container mx-auto px-4 py-6 overflow-hidden">
            <div className="max-w-5xl mx-auto h-full">
              <Card className="h-full flex flex-col shadow-xl border-2">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1 max-w-[300px]">
                        <Label htmlFor="filename" className="text-xs text-muted-foreground mb-1 block">
                          File Name
                        </Label>
                        <Input
                          id="filename"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder="document.txt"
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Upload */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>

                      {/* Save */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>

                      {/* Download Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={handleDownload}>
                            <FileDown className="w-4 h-4 mr-2" />
                            Download as TXT
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleCopy}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy to Clipboard
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <Separator />

                {/* Undo/Redo Toolbar */}
                <div className="px-6 py-2 bg-muted/20 border-b flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        className="text-xs h-8"
                      >
                        <Undo2 className="w-4 h-4 mr-1" />
                        Undo
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo (Cmd/Ctrl+Z)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="text-xs h-8"
                      >
                        <Redo2 className="w-4 h-4 mr-1" />
                        Redo
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo (Cmd/Ctrl+Shift+Z)</TooltipContent>
                  </Tooltip>

                  <Separator orientation="vertical" className="h-6" />

                  <span className="text-xs text-muted-foreground">
                    History: {historyIndex + 1} / {history.length}
                  </span>
                </div>

                {/* AI Toolbar */}
                {configValidation.valid && (
                  <div className="px-6 py-3 bg-muted/30 border-b flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md">
                      <Sparkles className="w-3 h-3 text-white" />
                      <span className="text-xs font-medium text-white">AI</span>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Quick Actions */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickAIAction('grammar')}
                          disabled={!selectedText || isAIProcessing}
                          className="text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Fix Grammar
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Fix grammar in selected text</TooltipContent>
                    </Tooltip>

                    {/* Tone Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!selectedText || isAIProcessing}
                          className="text-xs"
                        >
                          <Type className="w-3 h-3 mr-1" />
                          Change Tone
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Select Tone</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleQuickAIAction('tone', 'professional')}>
                          Professional
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuickAIAction('tone', 'formal')}>
                          Formal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuickAIAction('tone', 'casual')}>
                          Casual
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuickAIAction('tone', 'friendly')}>
                          Friendly
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuickAIAction('tone', 'academic')}>
                          Academic
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickAIAction('expand')}
                          disabled={!selectedText || isAIProcessing}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Expand
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Expand selected text with more details</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickAIAction('summarize')}
                          disabled={!selectedText || isAIProcessing}
                          className="text-xs"
                        >
                          <Minus className="w-3 h-3 mr-1" />
                          Summarize
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Summarize selected text</TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="h-6" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickAIAction('continue')}
                          disabled={!content.trim() || isAIProcessing}
                          className="text-xs"
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Continue Writing
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>AI will continue writing from where you left off</TooltipContent>
                    </Tooltip>

                    {/* Loading Indicator */}
                    {isAIProcessing && (
                      <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        AI is processing...
                      </div>
                    )}
                  </div>
                )}

                <CardContent className="flex-1 p-0 flex flex-col">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.md,.json,.html"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                    <div className="px-6 pt-4">
                      <TabsList>
                        <TabsTrigger value="editor" className="gap-2">
                          <Edit3 className="w-4 h-4" />
                          AI Editor
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="gap-2">
                          <Eye className="w-4 h-4" />
                          Preview
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="editor" className="flex-1 m-0 p-0">
                      <div className="relative h-full">
                        <Textarea
                          ref={textareaRef}
                          value={content}
                          onChange={(e) => updateContent(e.target.value)}
                          placeholder="Start typing your document here... Select text to use AI features."
                          className="w-full h-full min-h-[400px] resize-none font-mono text-sm border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 p-6"
                          style={{ height: 'calc(100vh - 450px)' }}
                        />

                        {/* Streaming Preview Overlay */}
                        <AnimatePresence>
                          {isStreaming && streamingText && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className="absolute bottom-4 left-4 right-4 bg-card border-2 border-purple-500/50 rounded-lg p-4 shadow-xl"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                                  <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">AI Generating...</p>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {streamingText}
                                    <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1" />
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="flex-1 m-0 p-0">
                      <div
                        className="w-full h-full min-h-[400px] p-6 prose prose-sm max-w-none dark:prose-invert overflow-auto"
                        style={{ height: 'calc(100vh - 450px)' }}
                      >
                        {content ? (
                          <pre className="whitespace-pre-wrap font-sans text-sm">
                            {content}
                          </pre>
                        ) : (
                          <p className="text-muted-foreground">
                            Nothing to preview yet. Start typing in the editor tab.
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Status Bar */}
                  <div className="px-6 py-3 bg-muted/30 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{stats.words} words</span>
                      <span>{stats.characters} characters</span>
                      <span>{stats.sentences} sentences</span>
                      <span>{stats.paragraphs} paragraphs</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {stats.readingTime} min read
                      </span>
                      {selectedText && (
                        <span className="text-purple-500">
                          {selectedText.split(/\s+/).filter(w => w).length} words selected
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* AI Assistant Panel */}
        <AnimatePresence>
          {showAIPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex-shrink-0 border-l overflow-hidden"
            >
              <AIErrorBoundary onRetry={() => setShowAIPanel(true)}>
                <AIAssistantPanel
                  selectedText={selectedText}
                  documentContent={content}
                  onInsertText={handleInsertText}
                  onReplaceText={handleReplaceText}
                />
              </AIErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating AI Toolbar (shown on text selection) */}
      <AnimatePresence>
        {showFloatingToolbar && selectedText && configValidation.valid && !isAIProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-50 bg-card border-2 border-purple-500/30 rounded-lg shadow-xl p-2"
            style={{
              top: `${floatingToolbarPosition.y}px`,
              left: `${floatingToolbarPosition.x}px`,
            }}
          >
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md mr-1">
                <Wand2 className="w-3 h-3 text-white" />
                <span className="text-xs font-medium text-white">AI</span>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickAIAction('grammar')}
                    className="h-7 text-xs"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fix Grammar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickAIAction('expand')}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Expand</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickAIAction('summarize')}
                    className="h-7 text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Summarize</TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFloatingToolbar(false)}
                className="h-7 text-xs"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditorPage;