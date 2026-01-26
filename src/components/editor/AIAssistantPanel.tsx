/**
 * AI Assistant Panel - Complete Rebuild v4.0
 * Simple, clean structure with guaranteed scrolling
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { langchainUtils } from '@/lib/langchain/llm';
import { validateConfig, LANGCHAIN_CONFIG } from '@/lib/langchain/config';
import type { StreamChunk } from '@/lib/langchain/types';
import {
    calculateReadability, generateFromTemplate,
    SUPPORTED_LANGUAGES, WRITING_STYLES, CONTENT_TEMPLATES,
    type ReadabilityMetrics, type ContentTemplate,
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
    const [activeTab, setActiveTab] = useState<'actions' | 'chat' | 'tools' | 'create' | 'analyze'>('actions');
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const [targetLanguage, setTargetLanguage] = useState('es');
    const [quickGenerateInput, setQuickGenerateInput] = useState('');
    
    const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
    const [templateFields, setTemplateFields] = useState<Record<string, string>>({});
    
    const [readability, setReadability] = useState<ReadabilityMetrics | null>(null);
    
    const configValidation = validateConfig();

    useEffect(() => {
        if (documentContent.length > 50) {
            const metrics = calculateReadability(documentContent);
            setReadability(metrics);
        }
    }, [documentContent]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const wordCount = documentContent.split(/\s+/).filter(w => w).length;
    const charCount = documentContent.length;

    const getActionPrompt = (actionId: string, text: string): string => {
        const prompts: Record<string, string> = {
            grammar: `Fix all grammar, spelling, and punctuation errors. Return only the corrected text:\n\n${text}`,
            professional: `Rewrite in a professional, business tone. Return only the rewritten text:\n\n${text}`,
            casual: `Rewrite in a casual, friendly tone. Return only the rewritten text:\n\n${text}`,
            expand: `Expand with more details and examples. Return only the expanded text:\n\n${text}`,
            summarize: `Summarize concisely keeping key points. Return only the summary:\n\n${text}`,
            continue: `Continue writing naturally, matching the style. Return only the continuation:\n\n${text}`,
            shorten: `Make shorter and more concise. Return only the shortened text:\n\n${text}`,
            simplify: `Simplify using simpler words. Return only the simplified text:\n\n${text}`,
        };
        return prompts[actionId] || text;
    };

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
            await langchainUtils.streamComplete(prompt, (chunk: StreamChunk) => {
                if (!chunk.done) {
                    result += chunk.content;
                    setGeneratedContent(result);
                }
            }, 'You are a helpful writing assistant.', 'rewrite');
            toast.success('Done!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed');
            setGeneratedContent('');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToneChange = async (toneId: string) => {
        if (!selectedText.trim()) { toast.error('Please select text first'); return; }
        setIsProcessing(true);
        setGeneratedContent('');
        try {
            let result = '';
            await langchainUtils.streamComplete(
                `Rewrite in a ${toneId} tone. Return only the rewritten text:\n\n${selectedText}`,
                (chunk: StreamChunk) => { if (!chunk.done) { result += chunk.content; setGeneratedContent(result); } },
                'You are a tone adjustment specialist.', 'tone'
            );
            toast.success('Tone changed!');
        } catch { toast.error('Failed'); }
        finally { setIsProcessing(false); }
    };

    const handleFormatChange = async (formatId: string) => {
        if (!selectedText.trim()) { toast.error('Please select text first'); return; }
        setIsProcessing(true);
        setGeneratedContent('');
        const formatPrompts: Record<string, string> = {
            bullet: 'Convert to bullet points', numbered: 'Convert to numbered list',
            paragraph: 'Rewrite as paragraphs', headline: 'Create 5 headlines from this',
        };
        try {
            let result = '';
            await langchainUtils.streamComplete(
                `${formatPrompts[formatId]}. Return only the output:\n\n${selectedText}`,
                (chunk: StreamChunk) => { if (!chunk.done) { result += chunk.content; setGeneratedContent(result); } },
                'You are a text formatter.', 'rewrite'
            );
            toast.success('Formatted!');
        } catch { toast.error('Failed'); }
        finally { setIsProcessing(false); }
    };

    const handleQuickGenerate = async (type: string) => {
        const topic = quickGenerateInput.trim() || selectedText.trim();
        if (!topic) { toast.error('Enter a topic or select text'); return; }
        setIsProcessing(true);
        setGeneratedContent('');
        const prompts: Record<string, string> = {
            email: `Write a professional email about: ${topic}`,
            tweet: `Write an engaging tweet about: ${topic}`,
            linkedin: `Write a LinkedIn post about: ${topic}`,
            explain: `Explain simply: ${topic}`,
            outline: `Create an outline for: ${topic}`,
            questions: `Generate 5 questions about: ${topic}`,
        };
        try {
            let result = '';
            await langchainUtils.streamComplete(prompts[type], (chunk: StreamChunk) => {
                if (!chunk.done) { result += chunk.content; setGeneratedContent(result); }
            }, 'You are a content writer.', 'generate');
            toast.success('Generated!');
        } catch { toast.error('Failed'); }
        finally { setIsProcessing(false); }
    };

    const handleTranslate = async () => {
        if (!selectedText.trim()) { toast.error('Please select text first'); return; }
        setIsProcessing(true);
        setGeneratedContent('');
        const langName = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name || targetLanguage;
        try {
            let result = '';
            await langchainUtils.streamComplete(
                `Translate to ${langName}. Return only the translation:\n\n${selectedText}`,
                (chunk: StreamChunk) => { if (!chunk.done) { result += chunk.content; setGeneratedContent(result); } },
                'You are a translator.', 'rewrite'
            );
            toast.success(`Translated to ${langName}!`);
        } catch { toast.error('Failed'); }
        finally { setIsProcessing(false); }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isStreaming) return;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsStreaming(true);
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: new Date() };
        setMessages(prev => [...prev, assistantMsg]);
        try {
            let response = '';
            const context = selectedText ? `\n\nSelected text:\n${selectedText}` : '';
            await langchainUtils.streamComplete(`${chatInput}${context}`, (chunk: StreamChunk) => {
                if (!chunk.done) {
                    response += chunk.content;
                    setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: response } : m));
                }
            }, 'You are a helpful AI writing assistant.', 'generate');
        } catch {
            setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: 'Error occurred.' } : m));
        } finally { setIsStreaming(false); }
    };

    const handleGenerateFromTemplate = async () => {
        if (!selectedTemplate) return;
        const missing = selectedTemplate.fields.filter(f => f.required && !templateFields[f.id]?.trim());
        if (missing.length > 0) { toast.error(`Fill: ${missing.map(f => f.label).join(', ')}`); return; }
        setIsProcessing(true);
        setGeneratedContent('');
        try {
            const result = await generateFromTemplate(selectedTemplate, templateFields);
            setGeneratedContent(result);
            toast.success('Generated!');
        } catch { toast.error('Failed'); }
        finally { setIsProcessing(false); }
    };

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        toast.success('Copied!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleInsert = (content: string) => { onInsertText(content); setGeneratedContent(''); toast.success('Inserted!'); };
    const handleReplace = (content: string) => { onReplaceText(content); setGeneratedContent(''); toast.success('Replaced!'); };

    const getReadabilityColor = (score: number) => score >= 60 ? 'text-green-500' : score >= 30 ? 'text-yellow-500' : 'text-red-500';

    const templatesByCategory = CONTENT_TEMPLATES.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
    }, {} as Record<string, ContentTemplate[]>);

    // Result Card
    const ResultCard = ({ content, id }: { content: string; id: string }) => (
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 mt-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Result
                </span>
                <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handleCopy(content, id)}>
                        {copiedId === id ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handleInsert(content)}>
                        <Plus className="w-3 h-3" />
                    </Button>
                    {selectedText && (
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handleReplace(content)}>
                            <RefreshCw className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </div>
            <div className="max-h-40 overflow-y-auto bg-white/50 dark:bg-black/20 rounded p-2">
                <p className="text-xs whitespace-pre-wrap">{content}</p>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-background border-l">
            {/* HEADER - Fixed */}
            <div className="p-3 border-b bg-gradient-to-r from-purple-500/10 to-pink-500/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">AI Assistant</h3>
                            <p className="text-[10px] text-muted-foreground">Powered by LLAMA</p>
                        </div>
                    </div>
                    <Badge variant={configValidation.valid ? 'default' : 'destructive'} className="text-[10px]">
                        {configValidation.valid ? '● Ready' : '○ Offline'}
                    </Badge>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t text-[10px] text-muted-foreground">
                    <div className="flex gap-3">
                        <span><Eye className="w-3 h-3 inline mr-1" />{wordCount} words</span>
                        <span><Type className="w-3 h-3 inline mr-1" />{charCount} chars</span>
                    </div>
                    {readability && readability.score > 0 && (
                        <div className="flex items-center gap-1">
                            <Gauge className="w-3 h-3" />
                            <span className={`font-bold ${getReadabilityColor(readability.score)}`}>{readability.score}</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1">{readability.gradeLevel}</Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* TABS - Fixed */}
            <div className="flex border-b flex-shrink-0">
                {[
                    { id: 'actions', label: 'Actions', icon: Zap },
                    { id: 'chat', label: 'Chat', icon: MessageSquare },
                    { id: 'tools', label: 'Tools', icon: Wand2 },
                    { id: 'create', label: 'Create', icon: FileText },
                    { id: 'analyze', label: 'Analyze', icon: BarChart3 },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex-1 py-2 text-[10px] font-medium flex items-center justify-center gap-1 border-b-2 transition-colors ${
                            activeTab === tab.id 
                                ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        <tab.icon className="w-3 h-3" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {/* ACTIONS TAB */}
                {activeTab === 'actions' && (
                    <div className="p-3 space-y-4">
                        {/* Selection Status */}
                        <div className={`p-2 rounded-lg text-xs ${selectedText ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                            {selectedText ? (
                                <span className="flex items-center gap-1"><Check className="w-3 h-3" /> {selectedText.split(/\s+/).length} words selected</span>
                            ) : (
                                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Select text to use AI</span>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> Quick Actions</h4>
                            <div className="grid grid-cols-2 gap-1.5">
                                {QUICK_ACTIONS.map(action => (
                                    <Button key={action.id} variant="outline" size="sm" className="justify-start h-8 text-[10px]"
                                        disabled={(!selectedText && action.id !== 'continue') || isProcessing || !configValidation.valid}
                                        onClick={() => handleQuickAction(action.id)}>
                                        <div className={`p-0.5 rounded ${action.color} mr-1.5`}><action.icon className="w-2.5 h-2.5 text-white" /></div>
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Tone */}
                        <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Mic className="w-3 h-3 text-blue-500" /> Change Tone</h4>
                            <div className="grid grid-cols-3 gap-1.5">
                                {TONE_OPTIONS.map(tone => (
                                    <Button key={tone.id} variant="outline" size="sm" className="h-7 text-[10px]"
                                        disabled={!selectedText || isProcessing || !configValidation.valid}
                                        onClick={() => handleToneChange(tone.id)}>
                                        <tone.icon className="w-3 h-3 mr-1" />{tone.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Format */}
                        <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><AlignLeft className="w-3 h-3 text-green-500" /> Format As</h4>
                            <div className="grid grid-cols-2 gap-1.5">
                                {FORMAT_OPTIONS.map(fmt => (
                                    <Button key={fmt.id} variant="outline" size="sm" className="justify-start h-7 text-[10px]"
                                        disabled={!selectedText || isProcessing || !configValidation.valid}
                                        onClick={() => handleFormatChange(fmt.id)}>
                                        <fmt.icon className="w-3 h-3 mr-1.5" />{fmt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Writing Styles */}
                        <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Palette className="w-3 h-3 text-purple-500" /> Writing Styles</h4>
                            <div className="grid grid-cols-2 gap-1.5">
                                {WRITING_STYLES.slice(0, 6).map(style => (
                                    <Button key={style.id} variant="outline" size="sm" className="justify-start h-7 text-[10px]"
                                        disabled={!selectedText || isProcessing || !configValidation.valid}
                                        onClick={() => handleToneChange(style.id)}>
                                        <span className="mr-1">{style.icon}</span>{style.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Generate */}
                        <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Sparkle className="w-3 h-3 text-pink-500" /> Quick Generate</h4>
                            <Input value={quickGenerateInput} onChange={e => setQuickGenerateInput(e.target.value)}
                                placeholder="Enter topic..." className="h-7 text-[10px] mb-1.5" />
                            <div className="grid grid-cols-3 gap-1.5">
                                {QUICK_GENERATE.map(opt => (
                                    <Button key={opt.id} variant="outline" size="sm" className="h-7 text-[10px]"
                                        disabled={(!quickGenerateInput && !selectedText) || isProcessing || !configValidation.valid}
                                        onClick={() => handleQuickGenerate(opt.id)}>
                                        <opt.icon className="w-3 h-3 mr-1" />{opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {isProcessing && (
                            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                <span className="text-xs">Processing...</span>
                            </div>
                        )}
                        {generatedContent && !isProcessing && <ResultCard content={generatedContent} id="actions" />}
                    </div>
                )}

                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto p-3 min-h-0">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                                    <Bot className="w-10 h-10 mb-3 opacity-50" />
                                    <h4 className="font-medium text-sm mb-1">Start a Conversation</h4>
                                    <p className="text-[10px]">Ask me anything about your document.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map(msg => (
                                        <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                            {msg.role === 'assistant' && (
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                                    <Bot className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                            <div className={`max-w-[80%] p-2 rounded-lg text-xs ${
                                                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                            }`}>
                                                {msg.content || <Loader2 className="w-3 h-3 animate-spin" />}
                                            </div>
                                            {msg.role === 'user' && (
                                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                    <User className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t flex-shrink-0">
                            <div className="flex gap-2">
                                <Textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                                    placeholder="Ask AI..." className="min-h-[36px] max-h-24 resize-none text-xs" disabled={isStreaming || !configValidation.valid} />
                                <Button onClick={handleSendMessage} disabled={!chatInput.trim() || isStreaming || !configValidation.valid}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-9 px-3">
                                    {isStreaming ? <StopCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <Button variant="ghost" size="sm" onClick={() => setMessages([])} disabled={messages.length === 0} className="text-[10px] h-6">
                                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                                </Button>
                                <span className="text-[10px] text-muted-foreground">Enter to send</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* TOOLS TAB */}
                {activeTab === 'tools' && (
                    <div className="p-3 space-y-4">
                        {/* Translate */}
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Languages className="w-3 h-3 text-blue-500" /> Translate</h4>
                            <div className="flex gap-2">
                                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                                    <SelectTrigger className="h-8 text-[10px] flex-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <SelectItem key={lang.code} value={lang.code} className="text-xs">{lang.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleTranslate} disabled={!selectedText || isProcessing || !configValidation.valid} className="h-8 text-xs">
                                    <Globe className="w-3 h-3 mr-1" /> Translate
                                </Button>
                            </div>
                        </div>

                        {/* AI Tools */}
                        <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Wand2 className="w-3 h-3 text-purple-500" /> AI Tools</h4>
                            <div className="space-y-1.5">
                                {[
                                    { id: 'paraphrase', label: 'Paraphrase', desc: 'Rewrite differently', icon: RefreshCw },
                                    { id: 'humanize', label: 'Humanize', desc: 'Sound natural', icon: Heart },
                                    { id: 'seo', label: 'SEO Optimize', desc: 'Add keywords', icon: TrendingUp },
                                    { id: 'quotes', label: 'Find Quotes', desc: 'Suggest quotes', icon: Quote },
                                ].map(tool => (
                                    <Button key={tool.id} variant="outline" className="w-full justify-start h-auto py-2 text-left"
                                        disabled={!selectedText || isProcessing || !configValidation.valid}
                                        onClick={() => handleQuickAction('professional')}>
                                        <tool.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <div>
                                            <div className="text-xs font-medium">{tool.label}</div>
                                            <div className="text-[10px] text-muted-foreground">{tool.desc}</div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {isProcessing && (
                            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                <span className="text-xs">Processing...</span>
                            </div>
                        )}
                        {generatedContent && !isProcessing && <ResultCard content={generatedContent} id="tools" />}
                    </div>
                )}

                {/* CREATE TAB */}
                {activeTab === 'create' && (
                    <div className="p-3">
                        {!selectedTemplate ? (
                            <div className="space-y-3">
                                {Object.entries(templatesByCategory).map(([category, templates]) => (
                                    <div key={category}>
                                        <h4 className="text-xs font-semibold mb-1.5 capitalize flex items-center gap-1">
                                            {category === 'social' && <Twitter className="w-3 h-3 text-blue-400" />}
                                            {category === 'business' && <Briefcase className="w-3 h-3 text-gray-500" />}
                                            {category === 'marketing' && <Megaphone className="w-3 h-3 text-orange-500" />}
                                            {category === 'academic' && <GraduationCap className="w-3 h-3 text-indigo-500" />}
                                            {category === 'creative' && <Pencil className="w-3 h-3 text-pink-500" />}
                                            {category}
                                        </h4>
                                        <div className="space-y-1">
                                            {templates.map(t => (
                                                <button key={t.id} className="w-full p-2 text-left bg-muted/50 hover:bg-muted rounded-lg border transition-colors"
                                                    onClick={() => { setSelectedTemplate(t); setTemplateFields({}); setGeneratedContent(''); }}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{t.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs font-medium block">{t.name}</span>
                                                            <span className="text-[10px] text-muted-foreground line-clamp-1">{t.description}</span>
                                                        </div>
                                                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] -ml-2"
                                    onClick={() => { setSelectedTemplate(null); setGeneratedContent(''); }}>
                                    <ChevronLeft className="w-3 h-3 mr-1" /> Back
                                </Button>
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <span className="text-xl">{selectedTemplate.icon}</span>
                                    <div>
                                        <h4 className="font-medium text-sm">{selectedTemplate.name}</h4>
                                        <p className="text-[10px] text-muted-foreground">{selectedTemplate.description}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {selectedTemplate.fields.map(field => (
                                        <div key={field.id}>
                                            <Label className="text-[10px] mb-1 block">
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </Label>
                                            {field.type === 'textarea' ? (
                                                <Textarea placeholder={field.placeholder} value={templateFields[field.id] || ''}
                                                    onChange={e => setTemplateFields(p => ({ ...p, [field.id]: e.target.value }))}
                                                    className="min-h-[60px] text-xs" />
                                            ) : field.type === 'select' ? (
                                                <Select value={templateFields[field.id] || ''} onValueChange={v => setTemplateFields(p => ({ ...p, [field.id]: v }))}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input placeholder={field.placeholder} value={templateFields[field.id] || ''}
                                                    onChange={e => setTemplateFields(p => ({ ...p, [field.id]: e.target.value }))}
                                                    className="h-8 text-xs" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={handleGenerateFromTemplate} disabled={isProcessing || !configValidation.valid}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                    Generate
                                </Button>
                                {generatedContent && <ResultCard content={generatedContent} id="template" />}
                            </div>
                        )}
                    </div>
                )}

                {/* ANALYZE TAB */}
                {activeTab === 'analyze' && (
                    <div className="p-3 space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Words', value: wordCount, icon: Type, color: 'text-blue-500' },
                                { label: 'Characters', value: charCount, icon: Hash, color: 'text-green-500' },
                                { label: 'Sentences', value: documentContent.split(/[.!?]+/).filter(s => s.trim()).length, icon: AlignLeft, color: 'text-purple-500' },
                                { label: 'Paragraphs', value: documentContent.split(/\n\n+/).filter(p => p.trim()).length, icon: FileText, color: 'text-orange-500' },
                            ].map(stat => (
                                <div key={stat.label} className="p-2 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <stat.icon className={`w-3 h-3 ${stat.color}`} />
                                        <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                                    </div>
                                    <span className="text-lg font-bold">{stat.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Readability */}
                        {readability && readability.score > 0 && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Gauge className="w-3 h-3 text-cyan-500" /> Readability</h4>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Score</span>
                                        <span className={`font-bold ${getReadabilityColor(readability.score)}`}>{readability.score}/100</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Grade Level</span>
                                        <Badge variant="outline" className="text-[10px]">{readability.gradeLevel}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Reading Time</span>
                                        <span className="font-medium">{Math.ceil(wordCount / 200)} min</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI Analysis */}
                        <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Brain className="w-3 h-3 text-purple-500" /> AI Analysis</h4>
                            <div className="space-y-1.5">
                                {[
                                    { id: 'sentiment', label: 'Analyze Sentiment', desc: 'Detect tone' },
                                    { id: 'topics', label: 'Extract Topics', desc: 'Find themes' },
                                    { id: 'improve', label: 'Suggest Improvements', desc: 'Get tips' },
                                ].map(item => (
                                    <Button key={item.id} variant="outline" className="w-full justify-start h-auto py-2 text-left"
                                        disabled={!documentContent || isProcessing || !configValidation.valid}
                                        onClick={() => handleQuickAction('summarize')}>
                                        <Lightbulb className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <div>
                                            <div className="text-xs font-medium">{item.label}</div>
                                            <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {isProcessing && (
                            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                <span className="text-xs">Analyzing...</span>
                            </div>
                        )}
                        {generatedContent && !isProcessing && <ResultCard content={generatedContent} id="analyze" />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAssistantPanel;
