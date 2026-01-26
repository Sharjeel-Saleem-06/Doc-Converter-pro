/**
 * AI Assistant Panel - Complete Redesign v3.0
 * Clean, professional, properly scrollable design
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Sparkles, Send, Loader2, Wand2, RefreshCw, Check, Plus, Minus, Copy,
    CheckCheck, Zap, MessageSquare, FileText, ChevronRight,
    StopCircle, Bot, User, Trash2, ArrowRight, BarChart3, Lightbulb,
    Palette, Globe, PenTool, Gauge, Brain, ChevronLeft,
    Scissors, AlignLeft, ListOrdered, Type, Megaphone,
    Smile, BookOpen, Pencil, FileQuestion, Mail, Twitter, Linkedin,
    GraduationCap, Briefcase, Heart, Flame, Mic, AlertCircle, TrendingUp,
    Eye, Languages, Quote, Sparkle, Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { langchainUtils } from '@/lib/langchain/llm';
import { validateConfig, LANGCHAIN_CONFIG } from '@/lib/langchain/config';
import type { StreamChunk } from '@/lib/langchain/types';
import {
    calculateReadability, generateFromTemplate,
    SUPPORTED_LANGUAGES, WRITING_STYLES, CONTENT_TEMPLATES,
    type ReadabilityMetrics, type ContentTemplate, type WritingStyle,
} from '@/lib/langchain/aiFeatures';
import { toast } from 'react-hot-toast';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIAssistantPanelProps {
    selectedText: string;
    documentContent: string;
    onInsertText: (text: string) => void;
    onReplaceText: (text: string) => void;
}

// Quick action buttons
const QUICK_ACTIONS = [
    { id: 'grammar', label: 'Fix Grammar', icon: Check, color: 'bg-green-500' },
    { id: 'professional', label: 'Professional', icon: Briefcase, color: 'bg-blue-500' },
    { id: 'casual', label: 'Casual', icon: Smile, color: 'bg-orange-500' },
    { id: 'expand', label: 'Expand', icon: Plus, color: 'bg-purple-500' },
    { id: 'summarize', label: 'Summarize', icon: Minus, color: 'bg-cyan-500' },
    { id: 'continue', label: 'Continue', icon: ArrowRight, color: 'bg-pink-500' },
    { id: 'shorten', label: 'Shorten', icon: Scissors, color: 'bg-red-500' },
    { id: 'simplify', label: 'Simplify', icon: AlignLeft, color: 'bg-teal-500' },
];

const TONE_OPTIONS = [
    { id: 'formal', label: 'Formal', icon: GraduationCap },
    { id: 'friendly', label: 'Friendly', icon: Heart },
    { id: 'persuasive', label: 'Persuasive', icon: Megaphone },
    { id: 'confident', label: 'Confident', icon: Flame },
    { id: 'empathetic', label: 'Empathetic', icon: Heart },
    { id: 'witty', label: 'Witty', icon: Sparkle },
];

const FORMAT_OPTIONS = [
    { id: 'bullet', label: 'Bullets', icon: ListOrdered },
    { id: 'numbered', label: 'Numbered', icon: ListOrdered },
    { id: 'paragraph', label: 'Paragraphs', icon: AlignLeft },
    { id: 'headline', label: 'Headlines', icon: Type },
];

const QUICK_GENERATE = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'tweet', label: 'Tweet', icon: Twitter },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { id: 'explain', label: 'Explain', icon: BookOpen },
    { id: 'outline', label: 'Outline', icon: ListOrdered },
    { id: 'questions', label: 'Questions', icon: FileQuestion },
];

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
    selectedText,
    documentContent,
    onInsertText,
    onReplaceText,
}) => {
    // State
    const [activeTab, setActiveTab] = useState('actions');
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Tools state
    const [targetLanguage, setTargetLanguage] = useState('es');
    const [quickGenerateInput, setQuickGenerateInput] = useState('');
    
    // Template state
    const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
    const [templateFields, setTemplateFields] = useState<Record<string, string>>({});
    
    // Readability
    const [readability, setReadability] = useState<ReadabilityMetrics | null>(null);
    
    // Config validation
    const configValidation = validateConfig();

    // Calculate readability on content change
    useEffect(() => {
        if (documentContent.length > 50) {
            const metrics = calculateReadability(documentContent);
            setReadability(metrics);
        }
    }, [documentContent]);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Stats
    const wordCount = documentContent.split(/\s+/).filter(w => w).length;
    const charCount = documentContent.length;

    // Get prompt for action
    const getActionPrompt = (actionId: string, text: string): string => {
        const prompts: Record<string, string> = {
            grammar: `Fix all grammar, spelling, and punctuation errors in this text. Return only the corrected text:\n\n${text}`,
            professional: `Rewrite this text in a professional, business-appropriate tone. Return only the rewritten text:\n\n${text}`,
            casual: `Rewrite this text in a casual, friendly, conversational tone. Return only the rewritten text:\n\n${text}`,
            expand: `Expand this text with more details, examples, and explanations. Return only the expanded text:\n\n${text}`,
            summarize: `Summarize this text concisely while keeping the key points. Return only the summary:\n\n${text}`,
            continue: `Continue writing this text naturally, matching the style and tone. Return only the continuation:\n\n${text}`,
            shorten: `Make this text shorter and more concise while keeping the meaning. Return only the shortened text:\n\n${text}`,
            simplify: `Simplify this text using simpler words and shorter sentences. Return only the simplified text:\n\n${text}`,
        };
        return prompts[actionId] || text;
    };

    // Handle quick action
    const handleQuickAction = async (actionId: string) => {
        const text = actionId === 'continue' ? documentContent : selectedText;
        if (!text.trim()) {
            toast.error(actionId === 'continue' ? 'Document is empty' : 'Please select text first');
            return;
        }

        setIsProcessing(true);
        setGeneratedContent('');

        try {
            const prompt = getActionPrompt(actionId, text);
            let result = '';

            await langchainUtils.streamComplete(
                prompt,
                (chunk: StreamChunk) => {
                    if (!chunk.done) {
                        result += chunk.content;
                        setGeneratedContent(result);
                    }
                },
                'You are a helpful writing assistant. Follow instructions precisely and return only the requested output.',
                'rewrite'
            );

            toast.success('AI processing complete!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'AI processing failed');
            setGeneratedContent('');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle tone change
    const handleToneChange = async (toneId: string) => {
        if (!selectedText.trim()) {
            toast.error('Please select text first');
            return;
        }

        setIsProcessing(true);
        setGeneratedContent('');

        try {
            const prompt = `Rewrite this text in a ${toneId} tone. Return only the rewritten text:\n\n${selectedText}`;
            let result = '';

            await langchainUtils.streamComplete(
                prompt,
                (chunk: StreamChunk) => {
                    if (!chunk.done) {
                        result += chunk.content;
                        setGeneratedContent(result);
                    }
                },
                'You are a tone adjustment specialist. Rewrite text in the requested tone while preserving the meaning.',
                'tone'
            );

            toast.success('Tone changed!');
        } catch (error) {
            toast.error('Failed to change tone');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle format change
    const handleFormatChange = async (formatId: string) => {
        if (!selectedText.trim()) {
            toast.error('Please select text first');
            return;
        }

        setIsProcessing(true);
        setGeneratedContent('');

        const formatPrompts: Record<string, string> = {
            bullet: 'Convert to bullet points',
            numbered: 'Convert to numbered list',
            paragraph: 'Rewrite as well-structured paragraphs',
            headline: 'Create 5 compelling headlines from this content',
        };

        try {
            const prompt = `${formatPrompts[formatId]}. Return only the formatted output:\n\n${selectedText}`;
            let result = '';

            await langchainUtils.streamComplete(
                prompt,
                (chunk: StreamChunk) => {
                    if (!chunk.done) {
                        result += chunk.content;
                        setGeneratedContent(result);
                    }
                },
                'You are a text formatting specialist.',
                'rewrite'
            );

            toast.success('Text formatted!');
        } catch (error) {
            toast.error('Failed to format text');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle quick generate
    const handleQuickGenerate = async (type: string) => {
        const topic = quickGenerateInput.trim() || selectedText.trim();
        if (!topic) {
            toast.error('Enter a topic or select text');
            return;
        }

        setIsProcessing(true);
        setGeneratedContent('');

        const generatePrompts: Record<string, string> = {
            email: `Write a professional email about: ${topic}`,
            tweet: `Write an engaging tweet (max 280 chars) about: ${topic}`,
            linkedin: `Write a professional LinkedIn post about: ${topic}`,
            explain: `Explain in simple terms: ${topic}`,
            outline: `Create a detailed outline for: ${topic}`,
            questions: `Generate 5 thoughtful questions about: ${topic}`,
        };

        try {
            let result = '';

            await langchainUtils.streamComplete(
                generatePrompts[type],
                (chunk: StreamChunk) => {
                    if (!chunk.done) {
                        result += chunk.content;
                        setGeneratedContent(result);
                    }
                },
                'You are a creative content writer. Generate high-quality content as requested.',
                'generate'
            );

            toast.success('Content generated!');
        } catch (error) {
            toast.error('Failed to generate content');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle translation
    const handleTranslate = async () => {
        if (!selectedText.trim()) {
            toast.error('Please select text first');
            return;
        }

        setIsProcessing(true);
        setGeneratedContent('');

        const langName = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name || targetLanguage;

        try {
            let result = '';

            await langchainUtils.streamComplete(
                `Translate this text to ${langName}. Return only the translation:\n\n${selectedText}`,
                (chunk: StreamChunk) => {
                    if (!chunk.done) {
                        result += chunk.content;
                        setGeneratedContent(result);
                    }
                },
                'You are a professional translator. Provide accurate translations.',
                'rewrite'
            );

            toast.success(`Translated to ${langName}!`);
        } catch (error) {
            toast.error('Translation failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle chat message
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isStreaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsStreaming(true);

        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        try {
            let response = '';
            const context = selectedText ? `\n\nSelected text:\n${selectedText}` : '';
            const docContext = documentContent.length > 100 ? `\n\nDocument excerpt:\n${documentContent.slice(0, 500)}...` : '';

            await langchainUtils.streamComplete(
                `${chatInput}${context}${docContext}`,
                (chunk: StreamChunk) => {
                    if (!chunk.done) {
                        response += chunk.content;
                        setMessages(prev => 
                            prev.map(m => m.id === assistantMessage.id ? { ...m, content: response } : m)
                        );
                    }
                },
                'You are a helpful AI writing assistant. Help users with their writing tasks.',
                'generate'
            );
        } catch (error) {
            setMessages(prev => 
                prev.map(m => m.id === assistantMessage.id ? { ...m, content: 'Sorry, I encountered an error. Please try again.' } : m)
            );
        } finally {
            setIsStreaming(false);
        }
    };

    // Handle template generation
    const handleGenerateFromTemplate = async () => {
        if (!selectedTemplate) return;

        const requiredFields = selectedTemplate.fields.filter(f => f.required);
        const missingFields = requiredFields.filter(f => !templateFields[f.id]?.trim());

        if (missingFields.length > 0) {
            toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
            return;
        }

        setIsProcessing(true);
        setGeneratedContent('');

        try {
            const result = await generateFromTemplate(selectedTemplate, templateFields);
            setGeneratedContent(result);
            toast.success('Content generated from template!');
        } catch (error) {
            toast.error('Failed to generate from template');
        } finally {
            setIsProcessing(false);
        }
    };

    // Copy to clipboard
    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Insert text
    const handleInsert = (content: string) => {
        onInsertText(content);
        setGeneratedContent('');
        toast.success('Text inserted!');
    };

    // Replace text
    const handleReplace = (content: string) => {
        onReplaceText(content);
        setGeneratedContent('');
        toast.success('Text replaced!');
    };

    // Readability color
    const getReadabilityColor = (score: number) => {
        if (score >= 60) return 'text-green-500';
        if (score >= 30) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Result card component
    const ResultCard = ({ content, id }: { content: string; id: string }) => (
        <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> AI Result
                </span>
                <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleCopy(content, id)}>
                        {copiedId === id ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleInsert(content)}>
                        <Plus className="w-3.5 h-3.5 mr-1" />Insert
                    </Button>
                    {selectedText && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleReplace(content)}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />Replace
                        </Button>
                    )}
                </div>
            </div>
            <div className="max-h-48 overflow-y-auto bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
            </div>
        </div>
    );

    // Loading indicator
    const LoadingIndicator = () => (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            <span className="text-sm">AI is thinking...</span>
        </div>
    );

    // Group templates by category
    const templatesByCategory = CONTENT_TEMPLATES.reduce((acc, template) => {
        if (!acc[template.category]) acc[template.category] = [];
        acc[template.category].push(template);
        return acc;
    }, {} as Record<string, ContentTemplate[]>);

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Fixed Header */}
            <div className="flex-none p-4 border-b bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">AI Assistant</h3>
                            <p className="text-xs text-muted-foreground">Powered by {LANGCHAIN_CONFIG.model.split('-')[0].toUpperCase()}</p>
                        </div>
                    </div>
                    <Badge 
                        variant={configValidation.valid ? 'default' : 'destructive'} 
                        className={configValidation.valid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                    >
                        {configValidation.valid ? '● Ready' : '○ Offline'}
                    </Badge>
                </div>
                
                {/* Stats Row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {wordCount} words</span>
                        <span className="flex items-center gap-1"><Type className="w-3.5 h-3.5" /> {charCount} chars</span>
                    </div>
                    {readability && readability.score > 0 && (
                        <div className="flex items-center gap-2">
                            <Gauge className="w-3.5 h-3.5" />
                            <span className={`font-bold ${getReadabilityColor(readability.score)}`}>{readability.score}</span>
                            <Badge variant="outline" className="text-[10px] h-5">{readability.gradeLevel}</Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="flex-none grid grid-cols-5 mx-4 mt-4 h-9">
                    <TabsTrigger value="actions" className="text-xs gap-1"><Zap className="w-3.5 h-3.5" />Actions</TabsTrigger>
                    <TabsTrigger value="chat" className="text-xs gap-1"><MessageSquare className="w-3.5 h-3.5" />Chat</TabsTrigger>
                    <TabsTrigger value="tools" className="text-xs gap-1"><Wand2 className="w-3.5 h-3.5" />Tools</TabsTrigger>
                    <TabsTrigger value="create" className="text-xs gap-1"><FileText className="w-3.5 h-3.5" />Create</TabsTrigger>
                    <TabsTrigger value="analyze" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" />Analyze</TabsTrigger>
                </TabsList>

                {/* ==================== ACTIONS TAB ==================== */}
                <TabsContent value="actions" className="flex-1 overflow-y-auto m-0">
                    <div className="p-4 space-y-6">
                        {/* Selection Status */}
                        <div className={`p-3 rounded-lg border ${selectedText ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-sm flex items-center gap-2 ${selectedText ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                    {selectedText ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {selectedText ? 'Text Selected' : 'Select text to use AI actions'}
                                </span>
                                {selectedText && <Badge variant="secondary">{selectedText.split(/\s+/).length} words</Badge>}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" /> Quick Actions
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {QUICK_ACTIONS.map((action) => (
                                    <Button
                                        key={action.id}
                                        variant="outline"
                                        size="sm"
                                        className="justify-start h-10 text-xs hover:bg-muted/80"
                                        disabled={(!selectedText && action.id !== 'continue') || isProcessing || !configValidation.valid}
                                        onClick={() => handleQuickAction(action.id)}
                                    >
                                        <div className={`p-1 rounded ${action.color} mr-2`}>
                                            <action.icon className="w-3 h-3 text-white" />
                                        </div>
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Change Tone */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Mic className="w-4 h-4 text-blue-500" /> Change Tone
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                                {TONE_OPTIONS.map((tone) => (
                                    <Button
                                        key={tone.id}
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-xs"
                                        disabled={!selectedText || isProcessing || !configValidation.valid}
                                        onClick={() => handleToneChange(tone.id)}
                                    >
                                        <tone.icon className="w-3.5 h-3.5 mr-1.5" />{tone.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Format As */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-green-500" /> Format As
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {FORMAT_OPTIONS.map((format) => (
                                    <Button
                                        key={format.id}
                                        variant="outline"
                                        size="sm"
                                        className="justify-start h-9 text-xs"
                                        disabled={!selectedText || isProcessing || !configValidation.valid}
                                        onClick={() => handleFormatChange(format.id)}
                                    >
                                        <format.icon className="w-3.5 h-3.5 mr-2" />{format.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Writing Styles */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Palette className="w-4 h-4 text-purple-500" /> Writing Styles
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {WRITING_STYLES.slice(0, 6).map((style) => (
                                    <Button
                                        key={style.id}
                                        variant="outline"
                                        size="sm"
                                        className="justify-start h-9 text-xs"
                                        disabled={!selectedText || isProcessing || !configValidation.valid}
                                        onClick={() => handleToneChange(style.id)}
                                    >
                                        <span className="mr-2">{style.icon}</span>{style.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Generate */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Sparkle className="w-4 h-4 text-pink-500" /> Quick Generate
                            </h4>
                            <Input
                                value={quickGenerateInput}
                                onChange={(e) => setQuickGenerateInput(e.target.value)}
                                placeholder="Enter topic or use selected text..."
                                className="h-9 text-xs mb-2"
                            />
                            <div className="grid grid-cols-3 gap-2">
                                {QUICK_GENERATE.map((option) => (
                                    <Button
                                        key={option.id}
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-xs"
                                        disabled={(!quickGenerateInput && !selectedText) || isProcessing || !configValidation.valid}
                                        onClick={() => handleQuickGenerate(option.id)}
                                    >
                                        <option.icon className="w-3.5 h-3.5 mr-1" />{option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Processing / Result */}
                        {isProcessing && <LoadingIndicator />}
                        {generatedContent && !isProcessing && <ResultCard content={generatedContent} id="actions-result" />}
                        
                        {/* Bottom padding for scroll */}
                        <div className="h-8" />
                    </div>
                </TabsContent>

                {/* ==================== CHAT TAB ==================== */}
                <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                <Bot className="w-12 h-12 mb-4 opacity-50" />
                                <h4 className="font-semibold mb-2">Start a Conversation</h4>
                                <p className="text-sm">Ask me anything about your document or writing.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                        {message.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                            message.role === 'user' 
                                                ? 'bg-primary text-primary-foreground rounded-br-md' 
                                                : 'bg-muted rounded-bl-md'
                                        }`}>
                                            {message.content || <Loader2 className="w-4 h-4 animate-spin" />}
                                        </div>
                                        {message.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="flex-none p-4 border-t bg-background">
                        <div className="flex gap-2">
                            <Textarea
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Ask AI anything..."
                                className="min-h-[44px] max-h-32 resize-none text-sm"
                                disabled={isStreaming || !configValidation.valid}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!chatInput.trim() || isStreaming || !configValidation.valid}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-11 px-4"
                            >
                                {isStreaming ? <StopCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                        <div className="flex justify-between mt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMessages([])}
                                disabled={messages.length === 0}
                                className="text-xs h-7"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                            </Button>
                            <span className="text-xs text-muted-foreground">Press Enter to send</span>
                        </div>
                    </div>
                </TabsContent>

                {/* ==================== TOOLS TAB ==================== */}
                <TabsContent value="tools" className="flex-1 overflow-y-auto m-0">
                    <div className="p-4 space-y-6">
                        {/* Translate */}
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Languages className="w-4 h-4 text-blue-500" /> Translate
                            </h4>
                            <div className="flex gap-2">
                                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                                    <SelectTrigger className="h-9 text-xs flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code} className="text-xs">
                                                {lang.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleTranslate}
                                    disabled={!selectedText || isProcessing || !configValidation.valid}
                                    className="h-9 text-xs"
                                >
                                    <Globe className="w-3.5 h-3.5 mr-1" /> Translate
                                </Button>
                            </div>
                        </div>

                        {/* More Tools */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-purple-500" /> AI Tools
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'paraphrase', label: 'Paraphrase Text', icon: RefreshCw, desc: 'Rewrite with different words' },
                                    { id: 'humanize', label: 'Humanize Text', icon: Heart, desc: 'Make AI text sound natural' },
                                    { id: 'seo', label: 'SEO Optimize', icon: TrendingUp, desc: 'Add relevant keywords' },
                                    { id: 'quotes', label: 'Find Quotes', icon: Quote, desc: 'Suggest relevant quotes' },
                                ].map((tool) => (
                                    <Button
                                        key={tool.id}
                                        variant="outline"
                                        className="justify-start h-auto py-3 text-left"
                                        disabled={!selectedText || isProcessing || !configValidation.valid}
                                        onClick={() => handleQuickAction(tool.id === 'paraphrase' ? 'professional' : tool.id)}
                                    >
                                        <tool.icon className="w-4 h-4 mr-3 text-muted-foreground" />
                                        <div>
                                            <div className="text-sm font-medium">{tool.label}</div>
                                            <div className="text-xs text-muted-foreground">{tool.desc}</div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Processing / Result */}
                        {isProcessing && <LoadingIndicator />}
                        {generatedContent && !isProcessing && <ResultCard content={generatedContent} id="tools-result" />}
                        
                        <div className="h-8" />
                    </div>
                </TabsContent>

                {/* ==================== CREATE TAB ==================== */}
                <TabsContent value="create" className="flex-1 overflow-y-auto m-0">
                    <div className="p-4">
                        {!selectedTemplate ? (
                            <div className="space-y-4">
                                {Object.entries(templatesByCategory).map(([category, templates]) => (
                                    <div key={category}>
                                        <h4 className="text-sm font-semibold mb-2 capitalize flex items-center gap-2">
                                            {category === 'social' && <Twitter className="w-4 h-4 text-blue-400" />}
                                            {category === 'business' && <Briefcase className="w-4 h-4 text-gray-500" />}
                                            {category === 'marketing' && <Megaphone className="w-4 h-4 text-orange-500" />}
                                            {category === 'academic' && <GraduationCap className="w-4 h-4 text-indigo-500" />}
                                            {category === 'creative' && <Pencil className="w-4 h-4 text-pink-500" />}
                                            {category}
                                        </h4>
                                        <div className="space-y-2">
                                            {templates.map((template) => (
                                                <button
                                                    key={template.id}
                                                    className="w-full p-3 text-left bg-muted/50 hover:bg-muted rounded-lg border transition-colors"
                                                    onClick={() => { setSelectedTemplate(template); setTemplateFields({}); setGeneratedContent(''); }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{template.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-medium block">{template.name}</span>
                                                            <span className="text-xs text-muted-foreground line-clamp-1">{template.description}</span>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs -ml-2"
                                    onClick={() => { setSelectedTemplate(null); setGeneratedContent(''); }}
                                >
                                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back to templates
                                </Button>

                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <span className="text-2xl">{selectedTemplate.icon}</span>
                                    <div>
                                        <h4 className="font-semibold">{selectedTemplate.name}</h4>
                                        <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {selectedTemplate.fields.map((field) => (
                                        <div key={field.id}>
                                            <Label className="text-xs mb-1.5 block">
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </Label>
                                            {field.type === 'textarea' ? (
                                                <Textarea
                                                    placeholder={field.placeholder}
                                                    value={templateFields[field.id] || ''}
                                                    onChange={(e) => setTemplateFields(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                    className="min-h-[80px] text-sm"
                                                />
                                            ) : field.type === 'select' ? (
                                                <Select
                                                    value={templateFields[field.id] || ''}
                                                    onValueChange={(v) => setTemplateFields(prev => ({ ...prev, [field.id]: v }))}
                                                >
                                                    <SelectTrigger className="h-9 text-sm">
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {field.options?.map((opt) => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    placeholder={field.placeholder}
                                                    value={templateFields[field.id] || ''}
                                                    onChange={(e) => setTemplateFields(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                    className="h-9 text-sm"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={handleGenerateFromTemplate}
                                    disabled={isProcessing || !configValidation.valid}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                    Generate Content
                                </Button>

                                {generatedContent && <ResultCard content={generatedContent} id="template-result" />}
                            </div>
                        )}
                        <div className="h-8" />
                    </div>
                </TabsContent>

                {/* ==================== ANALYZE TAB ==================== */}
                <TabsContent value="analyze" className="flex-1 overflow-y-auto m-0">
                    <div className="p-4 space-y-4">
                        {/* Document Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Words', value: wordCount, icon: Type, color: 'text-blue-500' },
                                { label: 'Characters', value: charCount, icon: Hash, color: 'text-green-500' },
                                { label: 'Sentences', value: documentContent.split(/[.!?]+/).filter(s => s.trim()).length, icon: AlignLeft, color: 'text-purple-500' },
                                { label: 'Paragraphs', value: documentContent.split(/\n\n+/).filter(p => p.trim()).length, icon: FileText, color: 'text-orange-500' },
                            ].map((stat) => (
                                <div key={stat.label} className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                                    </div>
                                    <span className="text-xl font-bold">{stat.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Readability */}
                        {readability && readability.score > 0 && (
                            <div className="p-4 bg-muted/50 rounded-xl">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Gauge className="w-4 h-4 text-cyan-500" /> Readability
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Score</span>
                                        <span className={`text-lg font-bold ${getReadabilityColor(readability.score)}`}>
                                            {readability.score}/100
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Grade Level</span>
                                        <Badge variant="outline">{readability.gradeLevel}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Reading Time</span>
                                        <span className="text-sm font-medium">{Math.ceil(wordCount / 200)} min</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI Analysis */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-500" /> AI Analysis
                            </h4>
                            <div className="space-y-2">
                                {[
                                    { id: 'sentiment', label: 'Analyze Sentiment', desc: 'Detect tone and emotion' },
                                    { id: 'topics', label: 'Extract Key Topics', desc: 'Find main themes' },
                                    { id: 'improve', label: 'Suggest Improvements', desc: 'Get writing tips' },
                                ].map((analysis) => (
                                    <Button
                                        key={analysis.id}
                                        variant="outline"
                                        className="w-full justify-start h-auto py-3 text-left"
                                        disabled={!documentContent || isProcessing || !configValidation.valid}
                                        onClick={() => handleQuickAction('summarize')}
                                    >
                                        <Lightbulb className="w-4 h-4 mr-3 text-muted-foreground" />
                                        <div>
                                            <div className="text-sm font-medium">{analysis.label}</div>
                                            <div className="text-xs text-muted-foreground">{analysis.desc}</div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {isProcessing && <LoadingIndicator />}
                        {generatedContent && !isProcessing && <ResultCard content={generatedContent} id="analyze-result" />}
                        
                        <div className="h-8" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AIAssistantPanel;
