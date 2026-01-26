/**
 * Enhanced AI Assistant Panel Component
 * Fixed layout - proper scrolling, no content cutoff, full functionality
 * v2.0 - Complete UI overhaul with proper overflow handling
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Sparkles, Send, Loader2, Wand2, RefreshCw, Check, Plus, Minus, Copy,
    CheckCheck, Zap, MessageSquare, FileText, ChevronRight,
    StopCircle, Bot, User, Trash2, ArrowRight, BarChart3, Lightbulb,
    Target, Palette, Globe, PenTool, Gauge, Brain, Hash, Play, ChevronLeft,
    Scissors, AlignLeft, ListOrdered, Type, Megaphone,
    Smile, BookOpen, Pencil, FileQuestion, Mail, Twitter, Linkedin,
    GraduationCap, Briefcase, Heart, Flame, Mic, AlertCircle, TrendingUp,
    Eye, Clock, Percent, BarChart2, Languages, Quote, Sparkle,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { langchainUtils } from '@/lib/langchain/llm';
import { validateConfig, LANGCHAIN_CONFIG } from '@/lib/langchain/config';
import type { StreamChunk, ToneType } from '@/lib/langchain/types';
import {
    calculateReadability, analyzeDocument, generateParaphrases, translateText,
    generateFromTemplate, humanizeText, getSmartSuggestions, applyWritingStyle,
    SUPPORTED_LANGUAGES, WRITING_STYLES, CONTENT_TEMPLATES,
    type ReadabilityMetrics, type DocumentIntelligence, type ParaphraseOption,
    type SmartSuggestion, type ContentTemplate, type WritingStyle,
} from '@/lib/langchain/aiFeatures';
import { toast } from 'react-hot-toast';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

interface AIAssistantPanelProps {
    selectedText: string;
    documentContent: string;
    onInsertText: (text: string) => void;
    onReplaceText: (text: string) => void;
}

const QUICK_ACTIONS = [
    { id: 'grammar', label: 'Fix Grammar', icon: Check, color: 'bg-green-500', prompt: 'Fix all grammar, spelling, and punctuation errors. Return only corrected text.' },
    { id: 'professional', label: 'Professional', icon: Briefcase, color: 'bg-blue-500', prompt: 'Rewrite in professional, business tone. Return only rewritten text.' },
    { id: 'casual', label: 'Casual', icon: Smile, color: 'bg-orange-500', prompt: 'Rewrite in casual, friendly tone. Return only rewritten text.' },
    { id: 'expand', label: 'Expand', icon: Plus, color: 'bg-purple-500', prompt: 'Expand with more details and examples. Return only expanded text.' },
    { id: 'summarize', label: 'Summarize', icon: Minus, color: 'bg-cyan-500', prompt: 'Summarize concisely keeping key points. Return only summary.' },
    { id: 'continue', label: 'Continue', icon: ArrowRight, color: 'bg-pink-500', prompt: 'Continue writing naturally matching the style. Return only continuation.' },
    { id: 'shorten', label: 'Shorten', icon: Scissors, color: 'bg-red-500', prompt: 'Make shorter and more concise. Return only shortened text.' },
    { id: 'simplify', label: 'Simplify', icon: AlignLeft, color: 'bg-teal-500', prompt: 'Simplify using simple words and short sentences. Return only simplified text.' },
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
    { id: 'bullet', label: 'Bullets', icon: ListOrdered, prompt: 'Convert to bullet point list. Return only bullets.' },
    { id: 'numbered', label: 'Numbered', icon: ListOrdered, prompt: 'Convert to numbered list. Return only list.' },
    { id: 'paragraph', label: 'Paragraphs', icon: AlignLeft, prompt: 'Rewrite as well-structured paragraphs. Return only paragraphs.' },
    { id: 'headline', label: 'Headlines', icon: Type, prompt: 'Create 5 compelling headlines from this. Return only headlines.' },
];

const QUICK_GENERATE = [
    { id: 'email', label: 'Email', icon: Mail, prompt: 'Write a professional email about: ' },
    { id: 'tweet', label: 'Tweet', icon: Twitter, prompt: 'Write a viral tweet about: ' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, prompt: 'Write a LinkedIn post about: ' },
    { id: 'explain', label: 'Explain', icon: BookOpen, prompt: 'Explain in simple terms: ' },
    { id: 'outline', label: 'Outline', icon: ListOrdered, prompt: 'Create detailed outline for: ' },
    { id: 'questions', label: 'Questions', icon: FileQuestion, prompt: 'Generate 5 questions about: ' },
];

const CONTENT_ENHANCERS = [
    { id: 'engaging', label: 'More Engaging', icon: Sparkles, prompt: 'Make this more engaging and captivating. Return only enhanced text.' },
    { id: 'examples', label: 'Add Examples', icon: Lightbulb, prompt: 'Add relevant examples and illustrations. Return enhanced text.' },
    { id: 'emotions', label: 'Add Emotion', icon: Heart, prompt: 'Make this more emotional and impactful. Return only enhanced text.' },
    { id: 'clarity', label: 'Improve Clarity', icon: Eye, prompt: 'Make this clearer and easier to understand. Return only improved text.' },
];

const SEO_TOOLS = [
    { id: 'keywords', label: 'Add Keywords', icon: Hash, prompt: 'Optimize with relevant SEO keywords. Return enhanced text.' },
    { id: 'meta', label: 'Meta Description', icon: FileText, prompt: 'Create compelling meta description (150-160 chars) for: ' },
    { id: 'caption', label: 'Social Caption', icon: MessageSquare, prompt: 'Create engaging social media caption for: ' },
];

const PROFESSIONAL_ACTIONS = [
    { id: 'executive', label: 'Executive Summary', icon: Briefcase, prompt: 'Create executive summary highlighting key points. Return only summary.' },
    { id: 'action-items', label: 'Action Items', icon: CheckCheck, prompt: 'Extract and list all action items as bullet points. Return only list.' },
    { id: 'talking-points', label: 'Talking Points', icon: Mic, prompt: 'Create key talking points for presentation. Return only points.' },
];

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
    selectedText, documentContent, onInsertText, onReplaceText,
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('actions');
    const [isProcessing, setIsProcessing] = useState(false);
    const [readability, setReadability] = useState<ReadabilityMetrics | null>(null);
    const [intelligence, setIntelligence] = useState<DocumentIntelligence | null>(null);
    const [paraphrases, setParaphrases] = useState<ParaphraseOption[]>([]);
    const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
    const [translationResult, setTranslationResult] = useState<string>('');
    const [targetLanguage, setTargetLanguage] = useState('es');
    const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
    const [templateFields, setTemplateFields] = useState<Record<string, string>>({});
    const [generatedContent, setGeneratedContent] = useState('');
    const [quickGenerateInput, setQuickGenerateInput] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const configValidation = validateConfig();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingText]);

    useEffect(() => {
        if (documentContent) {
            setReadability(calculateReadability(documentContent));
        }
    }, [documentContent]);

    // Generic AI action
    const runAIAction = async (prompt: string, systemPrompt: string) => {
        setIsProcessing(true);
        setGeneratedContent('');
        try {
            let result = '';
            await langchainUtils.streamComplete(prompt, (chunk: StreamChunk) => {
                if (!chunk.done) { result += chunk.content; setGeneratedContent(result); }
            }, systemPrompt, 'generate');
            toast.success('Done!');
        } catch (error) {
            toast.error('Action failed');
            setGeneratedContent('Error: ' + (error instanceof Error ? error.message : 'Unknown'));
        }
        setIsProcessing(false);
    };

    const handleQuickAction = async (action: typeof QUICK_ACTIONS[0]) => {
        const text = action.id === 'continue' ? documentContent.slice(-500) : selectedText;
        if (!text.trim()) { toast.error(action.id === 'continue' ? 'No document content' : 'Select text first'); return; }
        await runAIAction(text, action.prompt);
    };

    const handleToneChange = async (tone: typeof TONE_OPTIONS[0]) => {
        if (!selectedText.trim()) { toast.error('Select text first'); return; }
        await runAIAction(selectedText, `Rewrite in ${tone.label.toLowerCase()} tone. Maintain meaning. Return only rewritten text.`);
    };

    const handleFormatChange = async (format: typeof FORMAT_OPTIONS[0]) => {
        if (!selectedText.trim()) { toast.error('Select text first'); return; }
        await runAIAction(selectedText, format.prompt);
    };

    const handleQuickGenerate = async (option: typeof QUICK_GENERATE[0]) => {
        const topic = quickGenerateInput.trim() || selectedText.trim();
        if (!topic) { toast.error('Enter topic or select text'); return; }
        await runAIAction(option.prompt + topic, 'You are a professional content writer. Create high-quality content.');
        setQuickGenerateInput('');
    };

    const handleApplyStyle = async (style: WritingStyle) => {
        if (!selectedText.trim()) { toast.error('Select text first'); return; }
        setIsProcessing(true); setGeneratedContent('');
        try {
            const result = await applyWritingStyle(selectedText, style);
            setGeneratedContent(result);
            toast.success(`${style.name} style applied!`);
        } catch { toast.error('Style failed'); }
        setIsProcessing(false);
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isStreaming) return;
        const userMessage: Message = { id: generateId(), role: 'user', content: input.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput(''); setIsStreaming(true); setStreamingText('');

        const assistantMessageId = generateId();
        setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }]);

        try {
            const contextPrompt = selectedText ? `Context: "${selectedText}"\n\nUser: ${input.trim()}` : input.trim();
            let fullResponse = '';
            await langchainUtils.streamComplete(contextPrompt, (chunk: StreamChunk) => {
                if (!chunk.done) { fullResponse += chunk.content; setStreamingText(fullResponse); }
                else { setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: fullResponse, isStreaming: false } : msg)); setIsStreaming(false); }
            }, 'You are a helpful AI writing assistant.', 'generate');
        } catch (error) {
            setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: `Error: ${error instanceof Error ? error.message : 'Unknown'}`, isStreaming: false } : msg));
            setIsStreaming(false);
        }
    };

    const handleTranslate = async () => {
        if (!selectedText.trim()) { toast.error('Select text to translate'); return; }
        setIsProcessing(true); setTranslationResult('');
        try {
            const result = await translateText(selectedText, targetLanguage);
            setTranslationResult(result.translatedText);
            toast.success('Translated!');
        } catch { toast.error('Translation failed'); }
        setIsProcessing(false);
    };

    const handleParaphrase = async () => {
        if (!selectedText.trim()) { toast.error('Select text to paraphrase'); return; }
        setIsProcessing(true); setParaphrases([]);
        try {
            const result = await generateParaphrases(selectedText);
            setParaphrases(result);
            toast.success('Paraphrases ready!');
        } catch { toast.error('Paraphrase failed'); }
        setIsProcessing(false);
    };

    const handleHumanize = async () => {
        if (!selectedText.trim()) { toast.error('Select text to humanize'); return; }
        setIsProcessing(true); setGeneratedContent('');
        try {
            const result = await humanizeText(selectedText);
            setGeneratedContent(result);
            toast.success('Text humanized!');
        } catch { toast.error('Humanize failed'); }
        setIsProcessing(false);
    };

    const handleGetSuggestions = async () => {
        const text = selectedText || documentContent;
        if (!text.trim()) { toast.error('No content'); return; }
        setIsProcessing(true); setSuggestions([]);
        try {
            const result = await getSmartSuggestions(text.slice(0, 1500));
            setSuggestions(result);
            toast.success(`${result.length} suggestions!`);
        } catch { toast.error('Analysis failed'); }
        setIsProcessing(false);
    };

    const handleAnalyzeDocument = async () => {
        if (!documentContent.trim()) { toast.error('No document'); return; }
        setIsProcessing(true);
        try {
            const result = await analyzeDocument(documentContent);
            setIntelligence(result);
            toast.success('Analysis complete!');
        } catch { toast.error('Analysis failed'); }
        setIsProcessing(false);
    };

    const handleGenerateFromTemplate = async () => {
        if (!selectedTemplate) return;
        setIsProcessing(true); setGeneratedContent('');
        try {
            let result = '';
            await generateFromTemplate(selectedTemplate, templateFields, (chunk: StreamChunk) => {
                if (!chunk.done) { result += chunk.content; setGeneratedContent(result); }
            });
            toast.success('Generated!');
        } catch { toast.error('Generation failed'); }
        setIsProcessing(false);
    };

    const handleCopy = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Copied!');
    };

    const handleInsert = (text: string) => { onInsertText(text); toast.success('Inserted!'); };
    const handleReplace = (text: string) => { onReplaceText(text); toast.success('Replaced!'); };
    const getReadabilityColor = (score: number) => score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
    const getLangName = (code: string) => SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;

    const ResultCard = ({ content, id }: { content: string; id: string }) => (
        <div className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-purple-500" /> AI Result</span>
                <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleCopy(content, id)}>
                        {copiedId === id ? <CheckCheck className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copiedId === id ? 'Copied' : 'Copy'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleInsert(content)}>
                        <Plus className="w-3 h-3 mr-1" />Insert
                    </Button>
                    {selectedText && <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleReplace(content)}>
                        <RefreshCw className="w-3 h-3 mr-1" />Replace
                    </Button>}
                </div>
            </div>
            <div className="max-h-40 overflow-y-auto bg-background/50 rounded p-2"><p className="text-xs whitespace-pre-wrap leading-relaxed">{content}</p></div>
        </div>
    );

    // Document Stats
    const wordCount = documentContent.split(/\s+/).filter(w => w).length;
    const charCount = documentContent.length;
    const sentenceCount = documentContent.split(/[.!?]+/).filter(s => s.trim()).length;
    const paragraphCount = documentContent.split(/\n\n+/).filter(p => p.trim()).length;

    return (
        <div className="h-full w-full flex flex-col bg-background overflow-hidden">
            {/* Header - Fixed at top */}
            <div className="flex-shrink-0 flex items-center justify-between p-3 border-b bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">AI Assistant</h3>
                        <p className="text-[10px] text-muted-foreground">{LANGCHAIN_CONFIG.model.split('-').slice(0, 2).join(' ').toUpperCase()}</p>
                    </div>
                </div>
                <Badge variant={configValidation.valid ? 'default' : 'destructive'} className={configValidation.valid ? 'bg-green-500/20 text-green-600 text-[10px] h-6 px-2' : 'text-[10px] h-6 px-2'}>
                    {configValidation.valid ? '✓ Ready' : 'Not Configured'}
                </Badge>
            </div>

            {/* Stats Bar - Fixed */}
            <div className="flex-shrink-0 px-3 py-2 border-b bg-muted/30 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {wordCount} words</span>
                    <span className="flex items-center gap-1"><Type className="w-3 h-3" /> {charCount} chars</span>
                </div>
                {readability && readability.score > 0 && (
                    <div className="flex items-center gap-1.5">
                        <Gauge className="w-3 h-3" />
                        <span className={`font-bold ${getReadabilityColor(readability.score)}`}>{readability.score}</span>
                        <Badge variant="outline" className="text-[9px] h-5 py-0">{readability.gradeLevel}</Badge>
                    </div>
                )}
            </div>

            {/* Tabs - Fill remaining space with proper scroll */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="flex-shrink-0 grid grid-cols-5 mx-3 mt-3 h-8">
                    <TabsTrigger value="actions" className="text-[10px] h-7 data-[state=active]:shadow-none gap-1"><Zap className="w-3.5 h-3.5" />Actions</TabsTrigger>
                    <TabsTrigger value="chat" className="text-[10px] h-7 data-[state=active]:shadow-none gap-1"><MessageSquare className="w-3.5 h-3.5" />Chat</TabsTrigger>
                    <TabsTrigger value="tools" className="text-[10px] h-7 data-[state=active]:shadow-none gap-1"><Wand2 className="w-3.5 h-3.5" />Tools</TabsTrigger>
                    <TabsTrigger value="templates" className="text-[10px] h-7 data-[state=active]:shadow-none gap-1"><FileText className="w-3.5 h-3.5" />Create</TabsTrigger>
                    <TabsTrigger value="insights" className="text-[10px] h-7 data-[state=active]:shadow-none gap-1"><BarChart3 className="w-3.5 h-3.5" />Analyze</TabsTrigger>
                </TabsList>

                {/* ACTIONS TAB */}
                <TabsContent value="actions" className="flex-1 m-0 mt-2 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <ScrollArea className="flex-1 h-full">
                        <div className="px-3 pt-3 pb-6 space-y-4">
                            {/* Selection Status */}
                            {selectedText ? (
                                <div className="p-2.5 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center justify-between">
                                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 font-medium"><Check className="w-4 h-4" /> Text Selected</span>
                                    <Badge variant="secondary" className="text-[10px] h-5">{selectedText.split(/\s+/).length} words</Badge>
                                </div>
                            ) : (
                                <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                    <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Select text in the editor to use AI actions</span>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div>
                                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Zap className="w-4 h-4 text-yellow-500" /> Quick Actions</h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {QUICK_ACTIONS.map((action) => (
                                        <Button key={action.id} variant="outline" size="sm" className="justify-start h-8 text-[11px] px-2.5 hover:bg-muted/80"
                                            disabled={(!selectedText && action.id !== 'continue') || isProcessing || !configValidation.valid}
                                            onClick={() => handleQuickAction(action)}>
                                            <div className={`p-1 rounded ${action.color} mr-1.5 flex-shrink-0`}><action.icon className="w-3 h-3 text-white" /></div>
                                            {action.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Tone Options */}
                            <div>
                                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Mic className="w-4 h-4 text-blue-500" /> Change Tone</h4>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {TONE_OPTIONS.map((tone) => (
                                        <Button key={tone.id} variant="outline" size="sm" className="h-7 text-[10px] px-2 hover:bg-muted/80"
                                            disabled={!selectedText || isProcessing || !configValidation.valid}
                                            onClick={() => handleToneChange(tone)}>
                                            <tone.icon className="w-3 h-3 mr-1" />{tone.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Format Options */}
                            <div>
                                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><AlignLeft className="w-4 h-4 text-green-500" /> Format As</h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {FORMAT_OPTIONS.map((format) => (
                                        <Button key={format.id} variant="outline" size="sm" className="justify-start h-7 text-[10px] px-2.5 hover:bg-muted/80"
                                            disabled={!selectedText || isProcessing || !configValidation.valid}
                                            onClick={() => handleFormatChange(format)}>
                                            <format.icon className="w-3 h-3 mr-1.5" />{format.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Writing Styles */}
                            <div>
                                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Palette className="w-4 h-4 text-purple-500" /> Writing Styles</h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {WRITING_STYLES.map((style) => (
                                        <Button key={style.id} variant="outline" size="sm" className="justify-start h-7 text-[10px] px-2.5 hover:bg-muted/80"
                                            disabled={!selectedText || isProcessing || !configValidation.valid}
                                            onClick={() => handleApplyStyle(style)}>
                                            <span className="mr-1.5 text-sm">{style.icon}</span>{style.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Generate */}
                            <div>
                                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Sparkle className="w-4 h-4 text-pink-500" /> Quick Generate</h4>
                                <Input value={quickGenerateInput} onChange={(e) => setQuickGenerateInput(e.target.value)}
                                    placeholder="Enter topic or use selected text..." className="h-8 text-xs mb-2" />
                                <div className="grid grid-cols-3 gap-1.5">
                                    {QUICK_GENERATE.map((option) => (
                                        <Button key={option.id} variant="outline" size="sm" className="h-7 text-[10px] px-1.5 hover:bg-muted/80"
                                            disabled={(!quickGenerateInput && !selectedText) || isProcessing || !configValidation.valid}
                                            onClick={() => handleQuickGenerate(option)}>
                                            <option.icon className="w-3 h-3 mr-1" />{option.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Enhancers */}
                            <div>
                                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-yellow-500" /> Content Enhancers</h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {CONTENT_ENHANCERS.map((enhancer) => (
                                        <Button key={enhancer.id} variant="outline" size="sm" className="justify-start h-7 text-[10px] px-2.5 hover:bg-muted/80"
                                            disabled={!selectedText || isProcessing || !configValidation.valid}
                                            onClick={() => runAIAction(selectedText, enhancer.prompt)}>
                                            <enhancer.icon className="w-3 h-3 mr-1.5" />{enhancer.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* SEO & Marketing */}
                            <div>
                                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-500" /> SEO & Marketing</h4>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {SEO_TOOLS.map((tool) => (
                                        <Button key={tool.id} variant="outline" size="sm" className="justify-start h-7 text-[10px] px-2.5 hover:bg-muted/80"
                                            disabled={(!selectedText && tool.id === 'keywords') || isProcessing || !configValidation.valid}
                                            onClick={() => {
                                                const text = tool.id === 'keywords' ? selectedText : (quickGenerateInput || selectedText);
                                                if (!text.trim()) { toast.error('Enter text or select content'); return; }
                                                runAIAction(tool.id === 'keywords' ? text : tool.prompt + text, tool.id === 'keywords' ? tool.prompt : 'You are a marketing expert.');
                                            }}>
                                            <tool.icon className="w-3 h-3 mr-1.5" />{tool.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Professional Actions */}
                            <div>
                                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-indigo-500" /> Professional Tools</h4>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {PROFESSIONAL_ACTIONS.map((action) => (
                                        <Button key={action.id} variant="outline" size="sm" className="justify-start h-7 text-[10px] px-2.5 hover:bg-muted/80"
                                            disabled={!selectedText || isProcessing || !configValidation.valid}
                                            onClick={() => runAIAction(selectedText, action.prompt)}>
                                            <action.icon className="w-3 h-3 mr-1.5" />{action.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Processing/Result */}
                            {isProcessing && (
                                <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
                                    <Loader2 className="w-5 h-5 animate-spin" /><span className="text-xs">AI is processing...</span>
                                </div>
                            )}
                            {generatedContent && !isProcessing && <ResultCard content={generatedContent} id="gen" />}
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* CHAT TAB */}
                <TabsContent value="chat" className="flex-1 flex flex-col m-0 mt-2 min-h-0 overflow-hidden">
                    <ScrollArea className="flex-1">
                        <div className="px-3 pt-3 pb-3">
                        {messages.length === 0 ? (
                            <div className="text-center py-6">
                                <Bot className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                                <p className="text-xs text-muted-foreground">Start a conversation</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">{selectedText ? 'Selected text as context' : 'Select text for context'}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {messages.map((message) => (
                                    <div key={message.id} className={`flex gap-1.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                            }`}>
                                            {message.role === 'user' ? <User className="w-2.5 h-2.5" /> : <Bot className="w-2.5 h-2.5" />}
                                        </div>
                                        <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                                            <div className={`inline-block p-2 rounded-lg max-w-[90%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                <p className="text-[10px] whitespace-pre-wrap">
                                                    {message.isStreaming ? streamingText : message.content}
                                                    {message.isStreaming && <span className="inline-block w-1 h-2.5 bg-current animate-pulse ml-0.5" />}
                                                </p>
                                            </div>
                                            {message.role === 'assistant' && !message.isStreaming && message.content && (
                                                <div className="flex gap-0.5 mt-0.5">
                                                    <Button size="sm" variant="ghost" className="h-4 px-1 text-[8px]" onClick={() => handleCopy(message.content, message.id)}>
                                                        {copiedId === message.id ? <CheckCheck className="w-2 h-2" /> : <Copy className="w-2 h-2" />}
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-4 px-1 text-[8px]" onClick={() => handleInsert(message.content)}>Insert</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                        </div>
                    </ScrollArea>
                    <div className="flex-shrink-0 p-3 border-t bg-background">
                        {isStreaming && <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI is generating...</div>}
                        <Textarea value={input} onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="Ask AI anything..." className="min-h-[50px] resize-none text-xs mb-2" disabled={isStreaming || !configValidation.valid} />
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" onClick={() => { setMessages([]); setStreamingText(''); }} disabled={messages.length === 0} className="text-[10px] h-7 px-2">
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                            </Button>
                            <Button onClick={handleSendMessage} disabled={!input.trim() || isStreaming || !configValidation.valid} size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 h-7 text-xs px-4">
                                {isStreaming ? <StopCircle className="w-3.5 h-3.5 mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                                {isStreaming ? 'Stop' : 'Send'}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* TOOLS TAB */}
                <TabsContent value="tools" className="flex-1 m-0 mt-2 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <ScrollArea className="flex-1 h-full">
                        <div className="px-3 pt-3 pb-6 space-y-3">
                            {/* Translate */}
                            <div className="p-2 rounded-lg border bg-blue-500/5">
                                <h4 className="text-[10px] font-semibold mb-1.5 flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" /> Translate</h4>
                                <div className="flex gap-1.5 mb-1">
                                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                                        <SelectTrigger className="h-7 text-[10px] flex-1">
                                            <SelectValue>{SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.flag} {getLangName(targetLanguage)}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>{SUPPORTED_LANGUAGES.map(lang => (<SelectItem key={lang.code} value={lang.code} className="text-[10px]">{lang.flag} {lang.name}</SelectItem>))}</SelectContent>
                                    </Select>
                                    <Button size="sm" onClick={handleTranslate} disabled={!selectedText || isProcessing} className="h-7 px-2 text-[10px]">
                                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Translate'}
                                    </Button>
                                </div>
                                {!selectedText && <p className="text-[8px] text-muted-foreground">Select text first</p>}
                                {translationResult && (
                                    <div className="p-1.5 bg-background rounded border mt-1.5">
                                        <p className="text-[10px] mb-1">{translationResult}</p>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="outline" className="h-5 text-[8px] px-1.5" onClick={() => handleCopy(translationResult, 'trans')}><Copy className="w-2 h-2 mr-0.5" />Copy</Button>
                                            {selectedText && <Button size="sm" variant="outline" className="h-5 text-[8px] px-1.5" onClick={() => handleReplace(translationResult)}><RefreshCw className="w-2 h-2 mr-0.5" />Replace</Button>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Paraphrase */}
                            <div className="p-2 rounded-lg border bg-purple-500/5">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h4 className="text-[10px] font-semibold flex items-center gap-1"><PenTool className="w-3 h-3 text-purple-500" /> Paraphrase</h4>
                                    <Button size="sm" variant="outline" onClick={handleParaphrase} disabled={!selectedText || isProcessing} className="h-6 text-[9px]">
                                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Generate'}
                                    </Button>
                                </div>
                                {!selectedText && <p className="text-[8px] text-muted-foreground">Select text to get paraphrase options</p>}
                                {paraphrases.length > 0 && (
                                    <div className="space-y-1 max-h-36 overflow-y-auto">
                                        {paraphrases.map((p) => (
                                            <div key={p.id} className="p-1.5 bg-background rounded border">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <Badge variant="outline" className="text-[8px] h-4">{p.label}</Badge>
                                                    <div className="flex gap-0.5">
                                                        <Button size="sm" variant="ghost" className="h-4 w-4 p-0" onClick={() => handleCopy(p.text, p.id)}>
                                                            {copiedId === p.id ? <CheckCheck className="w-2 h-2" /> : <Copy className="w-2 h-2" />}
                                                        </Button>
                                                        {selectedText && <Button size="sm" variant="ghost" className="h-4 w-4 p-0" onClick={() => handleReplace(p.text)}><RefreshCw className="w-2 h-2" /></Button>}
                                                    </div>
                                                </div>
                                                <p className="text-[9px]">{p.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Humanize */}
                            <div className="p-2 rounded-lg border bg-orange-500/5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[10px] font-semibold flex items-center gap-1"><Brain className="w-3 h-3 text-orange-500" /> Humanize AI Text</h4>
                                        <p className="text-[8px] text-muted-foreground">Make AI-generated text natural</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={handleHumanize} disabled={!selectedText || isProcessing} className="h-6 text-[9px]">
                                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Humanize'}
                                    </Button>
                                </div>
                            </div>

                            {/* Smart Suggestions */}
                            <div className="p-2 rounded-lg border bg-green-500/5">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h4 className="text-[10px] font-semibold flex items-center gap-1"><Lightbulb className="w-3 h-3 text-green-500" /> Smart Suggestions</h4>
                                    <Button size="sm" variant="outline" onClick={handleGetSuggestions} disabled={isProcessing} className="h-6 text-[9px]">
                                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Analyze'}
                                    </Button>
                                </div>
                                <p className="text-[8px] text-muted-foreground mb-1">Get AI-powered improvement tips</p>
                                {suggestions.length > 0 && (
                                    <div className="space-y-1 max-h-28 overflow-y-auto">
                                        {suggestions.map((s) => (
                                            <div key={s.id} className="p-1.5 bg-background rounded border flex items-start gap-1.5">
                                                <span className="text-xs">{s.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1 mb-0.5">
                                                        <Badge variant={s.severity === 'high' ? 'destructive' : 'secondary'} className="text-[7px] px-1 h-3">{s.severity}</Badge>
                                                        <span className="text-[8px] text-muted-foreground capitalize">{s.type}</span>
                                                    </div>
                                                    <p className="text-[9px]">{s.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quote Generator */}
                            <div className="p-2 rounded-lg border bg-indigo-500/5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[10px] font-semibold flex items-center gap-1"><Quote className="w-3 h-3 text-indigo-500" /> Quote Generator</h4>
                                        <p className="text-[8px] text-muted-foreground">Generate inspiring quotes</p>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-6 text-[9px]" disabled={!configValidation.valid || isProcessing}
                                        onClick={() => runAIAction('Generate 3 inspiring, unique quotes about success and motivation. Format each on new line.', 'You are a quote creator.')}>
                                        Generate
                                    </Button>
                                </div>
                            </div>

                            {/* Word Count Optimizer */}
                            <div className="p-2 rounded-lg border bg-teal-500/5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[10px] font-semibold flex items-center gap-1"><TrendingUp className="w-3 h-3 text-teal-500" /> Optimize Length</h4>
                                        <p className="text-[8px] text-muted-foreground">Adjust text to target word count</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="outline" className="h-6 text-[8px] px-1.5" disabled={!selectedText || isProcessing}
                                            onClick={() => runAIAction(`Reduce to ~50% length:\n\n${selectedText}`, 'Shorten concisely.')}>50%</Button>
                                        <Button size="sm" variant="outline" className="h-6 text-[8px] px-1.5" disabled={!selectedText || isProcessing}
                                            onClick={() => runAIAction(`Expand to ~150% length:\n\n${selectedText}`, 'Expand with details.')}>150%</Button>
                                    </div>
                                </div>
                            </div>

                            {generatedContent && !isProcessing && <ResultCard content={generatedContent} id="tool-gen" />}
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* TEMPLATES TAB */}
                <TabsContent value="templates" className="flex-1 m-0 mt-2 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <ScrollArea className="flex-1 h-full">
                        <div className="px-3 pt-3 pb-6">
                            {!selectedTemplate ? (
                                <div className="space-y-2">
                                    {['social', 'business', 'marketing', 'academic', 'creative'].map(category => {
                                        const templates = CONTENT_TEMPLATES.filter(t => t.category === category);
                                        if (templates.length === 0) return null;
                                        return (
                                            <div key={category}>
                                                <h4 className="text-[10px] font-semibold mb-1 capitalize flex items-center gap-1">
                                                    {category === 'social' && <Twitter className="w-3 h-3 text-blue-400" />}
                                                    {category === 'business' && <Briefcase className="w-3 h-3 text-gray-500" />}
                                                    {category === 'marketing' && <Megaphone className="w-3 h-3 text-orange-500" />}
                                                    {category === 'academic' && <GraduationCap className="w-3 h-3 text-indigo-500" />}
                                                    {category === 'creative' && <Pencil className="w-3 h-3 text-pink-500" />}
                                                    {category}
                                                </h4>
                                                <div className="space-y-1">
                                                    {templates.map((template) => (
                                                        <button key={template.id} className="w-full p-1.5 text-left bg-muted/50 hover:bg-muted rounded border transition-colors"
                                                            onClick={() => { setSelectedTemplate(template); setTemplateFields({}); setGeneratedContent(''); }}>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-sm">{template.icon}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="text-[10px] font-medium block">{template.name}</span>
                                                                    <span className="text-[8px] text-muted-foreground line-clamp-1">{template.description}</span>
                                                                </div>
                                                                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px] -ml-1 mb-1" onClick={() => { setSelectedTemplate(null); setGeneratedContent(''); }}>
                                        <ChevronLeft className="w-3 h-3 mr-0.5" /> Back
                                    </Button>
                                    <div className="flex items-center gap-1.5 p-1.5 bg-muted/50 rounded">
                                        <span className="text-lg">{selectedTemplate.icon}</span>
                                        <div>
                                            <h4 className="text-xs font-semibold">{selectedTemplate.name}</h4>
                                            <p className="text-[8px] text-muted-foreground">{selectedTemplate.description}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedTemplate.fields.map((field) => (
                                            <div key={field.id}>
                                                <Label className="text-[10px] mb-0.5 block">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                                                {field.type === 'textarea' ? (
                                                    <Textarea placeholder={field.placeholder} value={templateFields[field.id] || ''}
                                                        onChange={(e) => setTemplateFields(prev => ({ ...prev, [field.id]: e.target.value }))} className="min-h-[40px] text-[10px]" />
                                                ) : field.type === 'select' ? (
                                                    <Select value={templateFields[field.id] || ''} onValueChange={(v) => setTemplateFields(prev => ({ ...prev, [field.id]: v }))}>
                                                        <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Select..." /></SelectTrigger>
                                                        <SelectContent>{field.options?.map(opt => <SelectItem key={opt} value={opt} className="text-[10px]">{opt}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input placeholder={field.placeholder} value={templateFields[field.id] || ''}
                                                        onChange={(e) => setTemplateFields(prev => ({ ...prev, [field.id]: e.target.value }))} className="h-7 text-[10px]" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={handleGenerateFromTemplate} disabled={isProcessing || !configValidation.valid} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 h-7 text-[10px]">
                                        {isProcessing ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</> : <><Play className="w-3 h-3 mr-1" /> Generate</>}
                                    </Button>
                                    {generatedContent && <ResultCard content={generatedContent} id="template" />}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* INSIGHTS TAB */}
                <TabsContent value="insights" className="flex-1 m-0 mt-2 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <ScrollArea className="flex-1 h-full">
                        <div className="px-3 pt-3 pb-6 space-y-3">
                            <Button onClick={handleAnalyzeDocument} disabled={!documentContent || isProcessing} className="w-full h-8 text-[10px]" variant={intelligence ? 'outline' : 'default'}>
                                {isProcessing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <BarChart3 className="w-3 h-3 mr-1" />}
                                {intelligence ? 'Re-analyze' : 'Analyze Document'}
                            </Button>

                            {/* Document Stats */}
                            <div className="p-2 rounded-lg border bg-muted/30">
                                <h4 className="text-[10px] font-semibold mb-1.5 flex items-center gap-1"><BarChart2 className="w-3 h-3 text-blue-500" /> Document Stats</h4>
                                <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                                    <div className="p-1.5 bg-background rounded flex justify-between"><span className="text-muted-foreground">Words</span><span className="font-medium">{wordCount}</span></div>
                                    <div className="p-1.5 bg-background rounded flex justify-between"><span className="text-muted-foreground">Characters</span><span className="font-medium">{charCount}</span></div>
                                    <div className="p-1.5 bg-background rounded flex justify-between"><span className="text-muted-foreground">Sentences</span><span className="font-medium">{sentenceCount}</span></div>
                                    <div className="p-1.5 bg-background rounded flex justify-between"><span className="text-muted-foreground">Paragraphs</span><span className="font-medium">{paragraphCount}</span></div>
                                </div>
                            </div>

                            {/* Readability */}
                            {readability && readability.score > 0 && (
                                <div className="p-2 rounded-lg border bg-blue-500/5">
                                    <h4 className="text-[10px] font-semibold mb-1.5 flex items-center gap-1"><Gauge className="w-3 h-3 text-blue-500" /> Readability</h4>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Progress value={readability.score} className="flex-1 h-2" />
                                        <span className={`text-sm font-bold ${getReadabilityColor(readability.score)}`}>{readability.score}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-[9px]">
                                        <div className="p-1 bg-background rounded flex justify-between"><span className="text-muted-foreground">Grade</span><span className="font-medium">{readability.gradeLevel}</span></div>
                                        <div className="p-1 bg-background rounded flex justify-between"><span className="text-muted-foreground">Ease</span><span className="font-medium">{readability.readingEase}</span></div>
                                        <div className="p-1 bg-background rounded flex justify-between"><span className="text-muted-foreground">Avg Sentence</span><span className="font-medium">{readability.avgSentenceLength}w</span></div>
                                        <div className="p-1 bg-background rounded flex justify-between"><span className="text-muted-foreground">Complex%</span><span className="font-medium">{readability.complexWordPercentage}%</span></div>
                                    </div>
                                </div>
                            )}

                            {/* Reading Time */}
                            <div className="p-2 rounded-lg border bg-green-500/5">
                                <h4 className="text-[10px] font-semibold mb-1 flex items-center gap-1"><Clock className="w-3 h-3 text-green-500" /> Reading Time</h4>
                                <div className="flex items-center gap-3 text-[9px]">
                                    <div className="flex items-center gap-1"><Eye className="w-3 h-3" /><span>{Math.ceil(wordCount / 200)} min read</span></div>
                                    <div className="flex items-center gap-1"><Languages className="w-3 h-3" /><span>{Math.ceil(wordCount / 150)} min speak</span></div>
                                </div>
                            </div>

                            {intelligence && (
                                <>
                                    <div className="p-2 rounded-lg border bg-purple-500/5">
                                        <h4 className="text-[10px] font-semibold mb-1 flex items-center gap-1"><Target className="w-3 h-3 text-purple-500" /> Sentiment</h4>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="capitalize text-[9px]">{intelligence.sentiment.overall}</Badge>
                                            <span className="text-[8px] text-muted-foreground">{Math.round(intelligence.sentiment.confidence * 100)}% conf</span>
                                        </div>
                                    </div>

                                    {intelligence.keyTopics.length > 0 && (
                                        <div className="p-2 rounded-lg border">
                                            <h4 className="text-[10px] font-semibold mb-1 flex items-center gap-1"><Hash className="w-3 h-3 text-green-500" /> Key Topics</h4>
                                            <div className="flex flex-wrap gap-1">{intelligence.keyTopics.map((t, i) => (<Badge key={i} variant="secondary" className="text-[8px]">{t}</Badge>))}</div>
                                        </div>
                                    )}

                                    <div className="p-2 rounded-lg border">
                                        <div className="grid grid-cols-2 gap-2 text-[9px]">
                                            <div><span className="text-muted-foreground block text-[8px]">Style</span><span className="font-medium">{intelligence.writingStyle}</span></div>
                                            <div><span className="text-muted-foreground block text-[8px]">Audience</span><span className="font-medium">{intelligence.targetAudience}</span></div>
                                        </div>
                                    </div>

                                    {intelligence.improvements.length > 0 && (
                                        <div className="p-2 rounded-lg border">
                                            <h4 className="text-[10px] font-semibold mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3 text-yellow-500" /> Suggestions</h4>
                                            <div className="space-y-1">
                                                {intelligence.improvements.slice(0, 4).map((imp) => (
                                                    <div key={imp.id} className="flex items-start gap-1.5 p-1 bg-muted/50 rounded text-[9px]">
                                                        <span className="text-xs">{imp.icon}</span><span className="flex-1">{imp.message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                )}
                            </>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AIAssistantPanel;
