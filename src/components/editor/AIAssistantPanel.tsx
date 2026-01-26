/**
 * AI Assistant Panel - Fixed Scrolling & Complete Actions
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Sparkles, Send, Loader2, Check, Plus, Minus, Copy, CheckCheck, Bot, User, Trash2,
    ArrowRight, Scissors, AlignLeft, Type, Globe, RefreshCw, Heart, TrendingUp, Quote,
    Eye, Hash, Gauge, AlertCircle, Lightbulb, Brain, ChevronLeft, Mic, ListOrdered,
    Palette, FileText, Smile, Briefcase, Megaphone, Flame, GraduationCap, Pencil,
    Mail, Twitter, Linkedin, BookOpen, FileQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { langchainUtils } from '@/lib/langchain/llm';
import { validateConfig, LANGCHAIN_CONFIG } from '@/lib/langchain/config';
import type { StreamChunk } from '@/lib/langchain/types';
import {
    calculateReadability, generateFromTemplate, SUPPORTED_LANGUAGES, CONTENT_TEMPLATES,
    WRITING_STYLES, type ReadabilityMetrics, type ContentTemplate,
} from '@/lib/langchain/aiFeatures';
import { toast } from 'react-hot-toast';

interface Message { id: string; role: 'user' | 'assistant'; content: string; }

interface AIAssistantPanelProps {
    selectedText: string;
    documentContent: string;
    onInsertText: (text: string) => void;
    onReplaceText: (text: string) => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
    selectedText, documentContent, onInsertText, onReplaceText,
}) => {
    const [activeTab, setActiveTab] = useState<'actions' | 'chat' | 'tools' | 'create' | 'analyze'>('actions');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [targetLang, setTargetLang] = useState('es');
    const [generateInput, setGenerateInput] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
    const [templateFields, setTemplateFields] = useState<Record<string, string>>({});
    const [readability, setReadability] = useState<ReadabilityMetrics | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const config = validateConfig();
    const wordCount = documentContent.split(/\s+/).filter(w => w).length;
    const charCount = documentContent.length;

    useEffect(() => {
        if (documentContent.length > 50) setReadability(calculateReadability(documentContent));
    }, [documentContent]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Scroll to top when tab changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    const processAI = async (prompt: string) => {
        setIsProcessing(true);
        setResult('');
        try {
            let res = '';
            await langchainUtils.streamComplete(prompt, (chunk: StreamChunk) => {
                if (!chunk.done) { res += chunk.content; setResult(res); }
            }, 'You are a helpful writing assistant.', 'rewrite');
            toast.success('Done!');
        } catch { toast.error('Failed'); }
        finally { setIsProcessing(false); }
    };

    const handleAction = (action: string, customText?: string) => {
        const text = customText || (action === 'continue' ? documentContent : selectedText);
        if (!text.trim()) { toast.error('Select text first'); return; }
        const prompts: Record<string, string> = {
            grammar: `Fix all grammar, spelling, and punctuation errors:\n\n${text}`,
            professional: `Rewrite in professional, business tone:\n\n${text}`,
            casual: `Rewrite in casual, friendly tone:\n\n${text}`,
            expand: `Expand with more details:\n\n${text}`,
            summarize: `Summarize concisely:\n\n${text}`,
            continue: `Continue writing naturally:\n\n${text}`,
            shorten: `Make shorter and concise:\n\n${text}`,
            simplify: `Simplify using simple words:\n\n${text}`,
            formal: `Rewrite in formal tone:\n\n${text}`,
            friendly: `Rewrite in friendly tone:\n\n${text}`,
            persuasive: `Rewrite persuasively:\n\n${text}`,
            confident: `Rewrite with confidence:\n\n${text}`,
            bullets: `Convert to bullet points:\n\n${text}`,
            numbered: `Convert to numbered list:\n\n${text}`,
            paragraphs: `Rewrite as paragraphs:\n\n${text}`,
            headlines: `Create 5 headlines:\n\n${text}`,
        };
        processAI(prompts[action] || text);
    };

    const handleGenerate = async (type: string) => {
        const topic = generateInput.trim() || selectedText.trim();
        if (!topic) { toast.error('Enter topic'); return; }
        const prompts: Record<string, string> = {
            email: `Write professional email about: ${topic}`,
            tweet: `Write engaging tweet about: ${topic}`,
            linkedin: `Write LinkedIn post about: ${topic}`,
            explain: `Explain simply: ${topic}`,
            outline: `Create outline for: ${topic}`,
            questions: `Generate 5 questions about: ${topic}`,
        };
        processAI(prompts[type] || topic);
    };

    const handleChat = async () => {
        if (!chatInput.trim() || isStreaming) return;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: chatInput };
        setMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsStreaming(true);
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
        setMessages(prev => [...prev, aiMsg]);
        try {
            let res = '';
            await langchainUtils.streamComplete(chatInput, (chunk: StreamChunk) => {
                if (!chunk.done) {
                    res += chunk.content;
                    setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: res } : m));
                }
            }, 'You are a helpful assistant.', 'generate');
        } catch {
            setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: 'Error.' } : m));
        } finally { setIsStreaming(false); }
    };

    const handleCopy = () => { navigator.clipboard.writeText(result); setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000); };
    const handleInsert = () => { onInsertText(result); setResult(''); toast.success('Inserted!'); };
    const handleReplace = () => { onReplaceText(result); setResult(''); toast.success('Replaced!'); };
    const getColor = (score: number) => score >= 60 ? 'text-green-500' : score >= 30 ? 'text-yellow-500' : 'text-red-500';

    const templatesByCategory = CONTENT_TEMPLATES.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
    }, {} as Record<string, ContentTemplate[]>);

    return (
        <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            backgroundColor: 'white',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* HEADER - Fixed 80px */}
            <div style={{ 
                height: '80px', 
                flexShrink: 0, 
                padding: '12px', 
                borderBottom: '1px solid #e5e7eb', 
                backgroundColor: '#faf5ff' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
                            <Sparkles style={{ width: '16px', height: '16px', color: 'white' }} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>AI Assistant</h3>
                            <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>Powered by LLAMA</p>
                        </div>
                    </div>
                    <Badge variant={config.valid ? 'default' : 'destructive'} style={{ fontSize: '9px' }}>
                        {config.valid ? '● Ready' : '○ Offline'}
                    </Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6b7280' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <span><Eye style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />{wordCount} words</span>
                        <span><Type style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />{charCount} chars</span>
                    </div>
                    {readability && readability.score > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Gauge style={{ width: '12px', height: '12px' }} />
                            <span style={{ fontWeight: 'bold' }} className={getColor(readability.score)}>{readability.score}</span>
                            <Badge variant="outline" style={{ fontSize: '8px', height: '16px' }}>{readability.gradeLevel}</Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* TABS - Fixed 40px - REMOVED BLUE OUTLINE */}
            <div style={{ height: '40px', flexShrink: 0, display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                {[
                    { id: 'actions', label: 'Actions' },
                    { id: 'chat', label: 'Chat' },
                    { id: 'tools', label: 'Tools' },
                    { id: 'create', label: 'Create' },
                    { id: 'analyze', label: 'Analyze' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        style={{
                            flex: 1,
                            padding: '8px 4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid #a855f7' : '2px solid transparent',
                            backgroundColor: activeTab === tab.id ? '#faf5ff' : 'transparent',
                            color: activeTab === tab.id ? '#a855f7' : '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            outline: 'none', // REMOVE BLUE OUTLINE
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT - Scrollable calc(100% - 120px) with padding-bottom */}
            <div 
                ref={scrollContainerRef}
                style={{ 
                    height: 'calc(100% - 120px)', 
                    overflowY: 'auto', 
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    position: 'relative'
                }}
            >
                {/* ACTIONS TAB - MORE OPTIONS */}
                {activeTab === 'actions' && (
                    <div style={{ padding: '12px', paddingBottom: '60px' }}> {/* Added extra bottom padding */}
                        {/* Selection Status */}
                        <div style={{ padding: '8px', backgroundColor: selectedText ? '#dcfce7' : '#fef3c7', borderRadius: '8px', fontSize: '11px', marginBottom: '12px' }}>
                            {selectedText ? (
                                <span><Check style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />{selectedText.split(/\s+/).length} words selected</span>
                            ) : (
                                <span><AlertCircle style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />Select text to use AI</span>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles style={{ width: '14px', height: '14px', color: '#eab308' }} /> Quick Actions
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
                            {[
                                { id: 'grammar', label: 'Fix Grammar', color: '#22c55e', icon: Check },
                                { id: 'professional', label: 'Professional', color: '#3b82f6', icon: Briefcase },
                                { id: 'casual', label: 'Casual', color: '#f97316', icon: Smile },
                                { id: 'expand', label: 'Expand', color: '#a855f7', icon: Plus },
                                { id: 'summarize', label: 'Summarize', color: '#06b6d4', icon: Minus },
                                { id: 'continue', label: 'Continue', color: '#ec4899', icon: ArrowRight },
                                { id: 'shorten', label: 'Shorten', color: '#ef4444', icon: Scissors },
                                { id: 'simplify', label: 'Simplify', color: '#14b8a6', icon: AlignLeft },
                            ].map(action => (
                                <Button key={action.id} variant="outline" size="sm"
                                    disabled={(!selectedText && action.id !== 'continue') || isProcessing || !config.valid}
                                    onClick={() => handleAction(action.id)}
                                    style={{ fontSize: '10px', height: '32px', justifyContent: 'flex-start' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: action.color, marginRight: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <action.icon style={{ width: '10px', height: '10px', color: 'white' }} />
                                    </div>
                                    {action.label}
                                </Button>
                            ))}
                        </div>

                        {/* Change Tone */}
                        <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mic style={{ width: '14px', height: '14px', color: '#3b82f6' }} /> Change Tone
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '16px' }}>
                            {[
                                { id: 'formal', label: 'Formal', icon: GraduationCap },
                                { id: 'friendly', label: 'Friendly', icon: Heart },
                                { id: 'persuasive', label: 'Persuasive', icon: Megaphone },
                                { id: 'confident', label: 'Confident', icon: Flame },
                            ].map(tone => (
                                <Button key={tone.id} variant="outline" size="sm"
                                    disabled={!selectedText || isProcessing || !config.valid}
                                    onClick={() => handleAction(tone.id)}
                                    style={{ fontSize: '10px', height: '28px' }}>
                                    <tone.icon style={{ width: '12px', height: '12px', marginRight: '4px' }} />{tone.label}
                                </Button>
                            ))}
                        </div>

                        {/* Format As */}
                        <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlignLeft style={{ width: '14px', height: '14px', color: '#22c55e' }} /> Format As
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
                            {[
                                { id: 'bullets', label: 'Bullets', icon: ListOrdered },
                                { id: 'numbered', label: 'Numbered', icon: ListOrdered },
                                { id: 'paragraphs', label: 'Paragraphs', icon: AlignLeft },
                                { id: 'headlines', label: 'Headlines', icon: Type },
                            ].map(fmt => (
                                <Button key={fmt.id} variant="outline" size="sm"
                                    disabled={!selectedText || isProcessing || !config.valid}
                                    onClick={() => handleAction(fmt.id)}
                                    style={{ fontSize: '10px', height: '28px', justifyContent: 'flex-start' }}>
                                    <fmt.icon style={{ width: '12px', height: '12px', marginRight: '6px' }} />{fmt.label}
                                </Button>
                            ))}
                        </div>

                        {/* Writing Styles */}
                        <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Palette style={{ width: '14px', height: '14px', color: '#a855f7' }} /> Writing Styles
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
                            {WRITING_STYLES.slice(0, 6).map(style => (
                                <Button key={style.id} variant="outline" size="sm"
                                    disabled={!selectedText || isProcessing || !config.valid}
                                    onClick={() => handleAction(style.id)}
                                    style={{ fontSize: '10px', height: '28px', justifyContent: 'flex-start' }}>
                                    <span style={{ marginRight: '6px' }}>{style.icon}</span>{style.name}
                                </Button>
                            ))}
                        </div>

                        {/* Quick Generate */}
                        <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles style={{ width: '14px', height: '14px', color: '#ec4899' }} /> Quick Generate
                        </h4>
                        <Input value={generateInput} onChange={e => setGenerateInput(e.target.value)}
                            placeholder="Enter topic..." style={{ height: '32px', fontSize: '11px', marginBottom: '8px' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '16px' }}>
                            {[
                                { id: 'email', label: 'Email', icon: Mail },
                                { id: 'tweet', label: 'Tweet', icon: Twitter },
                                { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                                { id: 'explain', label: 'Explain', icon: BookOpen },
                                { id: 'outline', label: 'Outline', icon: ListOrdered },
                                { id: 'questions', label: 'Questions', icon: FileQuestion },
                            ].map(opt => (
                                <Button key={opt.id} variant="outline" size="sm"
                                    disabled={(!generateInput && !selectedText) || isProcessing || !config.valid}
                                    onClick={() => handleGenerate(opt.id)}
                                    style={{ fontSize: '10px', height: '28px' }}>
                                    <opt.icon style={{ width: '12px', height: '12px', marginRight: '4px' }} />{opt.label}
                                </Button>
                            ))}
                        </div>

                        {isProcessing && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', color: '#6b7280' }}>
                                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                                <span style={{ fontSize: '11px' }}>Processing...</span>
                            </div>
                        )}

                        {result && !isProcessing && (
                            <div style={{ padding: '12px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff', marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#a855f7' }}>Result</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <Button size="sm" variant="ghost" onClick={handleCopy} style={{ height: '24px', padding: '0 8px' }}>
                                            {copied ? <CheckCheck style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={handleInsert} style={{ height: '24px', padding: '0 8px' }}>
                                            <Plus style={{ width: '12px', height: '12px' }} />
                                        </Button>
                                        {selectedText && (
                                            <Button size="sm" variant="ghost" onClick={handleReplace} style={{ height: '24px', padding: '0 8px' }}>
                                                <RefreshCw style={{ width: '12px', height: '12px' }} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: 'white', borderRadius: '4px', padding: '8px' }}>
                                    <p style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>{result}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            {messages.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 12px', color: '#9ca3af' }}>
                                    <Bot style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.5 }} />
                                    <h4 style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Start Chatting</h4>
                                    <p style={{ fontSize: '10px' }}>Ask me anything about your document.</p>
                                </div>
                            ) : (
                                <div>
                                    {messages.map(msg => (
                                        <div key={msg.id} style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                            {msg.role === 'assistant' && (
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Bot style={{ width: '14px', height: '14px', color: 'white' }} />
                                                </div>
                                            )}
                                            <div style={{
                                                maxWidth: '80%', padding: '8px 12px', borderRadius: '12px', fontSize: '11px',
                                                backgroundColor: msg.role === 'user' ? '#a855f7' : '#f3f4f6',
                                                color: msg.role === 'user' ? 'white' : '#1f2937',
                                            }}>
                                                {msg.content || <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />}
                                            </div>
                                            {msg.role === 'user' && (
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <User style={{ width: '14px', height: '14px' }} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }}}
                                    placeholder="Ask AI..." disabled={isStreaming || !config.valid}
                                    style={{ minHeight: '36px', maxHeight: '96px', fontSize: '11px', flex: 1 }} />
                                <Button onClick={handleChat} disabled={!chatInput.trim() || isStreaming || !config.valid}
                                    style={{ height: '36px', padding: '0 12px', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
                                    <Send style={{ width: '16px', height: '16px' }} />
                                </Button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                <Button variant="ghost" size="sm" onClick={() => setMessages([])} disabled={messages.length === 0}
                                    style={{ fontSize: '10px', height: '24px' }}>
                                    <Trash2 style={{ width: '12px', height: '12px', marginRight: '4px' }} /> Clear
                                </Button>
                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Enter to send</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* TOOLS, CREATE, ANALYZE TABS - keeping same structure but with padding-bottom */}
                {activeTab === 'tools' && (
                    <div style={{ padding: '12px', paddingBottom: '60px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>AI Tools</h4>
                        <div style={{ marginBottom: '16px' }}>
                            {[
                                { id: 'translate', label: 'Translate', icon: Globe },
                                { id: 'paraphrase', label: 'Paraphrase', icon: RefreshCw },
                                { id: 'seo', label: 'SEO Optimize', icon: TrendingUp },
                                { id: 'quotes', label: 'Find Quotes', icon: Quote },
                            ].map(tool => (
                                <Button key={tool.id} variant="outline" disabled={!selectedText || isProcessing || !config.valid}
                                    onClick={() => handleAction('professional')}
                                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '6px', height: '48px' }}>
                                    <tool.icon style={{ width: '16px', height: '16px', marginRight: '8px', color: '#9ca3af' }} />
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '500' }}>{tool.label}</div>
                                        <div style={{ fontSize: '9px', color: '#9ca3af' }}>Transform your text</div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                        {isProcessing && <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', color: '#a855f7' }} /></div>}
                        {result && !isProcessing && (
                            <div style={{ padding: '12px', backgroundColor: '#faf5ff', borderRadius: '8px', marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '600' }}>Result</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <Button size="sm" variant="ghost" onClick={handleCopy} style={{ height: '24px', padding: '0 8px' }}>
                                            {copied ? <CheckCheck style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={handleInsert} style={{ height: '24px', padding: '0 8px' }}>
                                            <Plus style={{ width: '12px', height: '12px' }} />
                                        </Button>
                                    </div>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: 'white', borderRadius: '4px', padding: '8px' }}>
                                    <p style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>{result}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'create' && (
                    <div style={{ padding: '12px', paddingBottom: '60px' }}>
                        {!selectedTemplate ? (
                            <div>
                                {Object.entries(templatesByCategory).map(([category, templates]) => (
                                    <div key={category} style={{ marginBottom: '16px' }}>
                                        <h4 style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px', textTransform: 'capitalize' }}>{category}</h4>
                                        {templates.map(t => (
                                            <button key={t.id} onClick={() => { setSelectedTemplate(t); setTemplateFields({}); setResult(''); }}
                                                style={{ width: '100%', padding: '8px', textAlign: 'left', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '6px', cursor: 'pointer', outline: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '18px' }}>{t.icon}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '11px', fontWeight: '500' }}>{t.name}</div>
                                                        <div style={{ fontSize: '9px', color: '#6b7280' }}>{t.description}</div>
                                                    </div>
                                                    <ArrowRight style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedTemplate(null); setResult(''); }}
                                    style={{ fontSize: '10px', height: '24px', marginBottom: '12px' }}>
                                    <ChevronLeft style={{ width: '12px', height: '12px', marginRight: '4px' }} /> Back
                                </Button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '20px' }}>{selectedTemplate.icon}</span>
                                    <div>
                                        <h4 style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>{selectedTemplate.name}</h4>
                                        <p style={{ fontSize: '9px', color: '#6b7280', margin: 0 }}>{selectedTemplate.description}</p>
                                    </div>
                                </div>
                                {selectedTemplate.fields.map(field => (
                                    <div key={field.id} style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '500', marginBottom: '4px' }}>
                                            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <Textarea placeholder={field.placeholder} value={templateFields[field.id] || ''}
                                                onChange={e => setTemplateFields(p => ({ ...p, [field.id]: e.target.value }))}
                                                style={{ minHeight: '60px', fontSize: '11px' }} />
                                        ) : field.type === 'select' ? (
                                            <Select value={templateFields[field.id] || ''} onValueChange={v => setTemplateFields(p => ({ ...p, [field.id]: v }))}>
                                                <SelectTrigger style={{ height: '32px', fontSize: '11px' }}><SelectValue placeholder="Select..." /></SelectTrigger>
                                                <SelectContent>{field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                            </Select>
                                        ) : (
                                            <Input placeholder={field.placeholder} value={templateFields[field.id] || ''}
                                                onChange={e => setTemplateFields(p => ({ ...p, [field.id]: e.target.value }))}
                                                style={{ height: '32px', fontSize: '11px' }} />
                                        )}
                                    </div>
                                ))}
                                <Button onClick={async () => {
                                    setIsProcessing(true); setResult('');
                                    try {
                                        const res = await generateFromTemplate(selectedTemplate, templateFields);
                                        setResult(res); toast.success('Generated!');
                                    } catch { toast.error('Failed'); }
                                    finally { setIsProcessing(false); }
                                }} disabled={isProcessing || !config.valid}
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
                                    {isProcessing ? <Loader2 style={{ width: '16px', height: '16px', marginRight: '8px', animation: 'spin 1s linear infinite' }} /> : <Sparkles style={{ width: '16px', height: '16px', marginRight: '8px' }} />}
                                    Generate
                                </Button>
                                {result && (
                                    <div style={{ padding: '12px', backgroundColor: '#faf5ff', borderRadius: '8px', marginTop: '12px' }}>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: 'white', borderRadius: '4px', padding: '8px' }}>
                                            <p style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>{result}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analyze' && (
                    <div style={{ padding: '12px', paddingBottom: '60px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                            {[
                                { label: 'Words', value: wordCount, icon: Type },
                                { label: 'Characters', value: charCount, icon: Hash },
                                { label: 'Sentences', value: documentContent.split(/[.!?]+/).filter(s => s.trim()).length, icon: AlignLeft },
                                { label: 'Paragraphs', value: documentContent.split(/\n\n+/).filter(p => p.trim()).length, icon: Type },
                            ].map(stat => (
                                <div key={stat.label} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                        <stat.icon style={{ width: '12px', height: '12px', color: '#6b7280' }} />
                                        <span style={{ fontSize: '10px', color: '#6b7280' }}>{stat.label}</span>
                                    </div>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{stat.value}</span>
                                </div>
                            ))}
                        </div>
                        {readability && readability.score > 0 && (
                            <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Readability</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
                                    <span>Score</span>
                                    <span style={{ fontWeight: 'bold' }} className={getColor(readability.score)}>{readability.score}/100</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                    <span>Grade Level</span>
                                    <Badge variant="outline" style={{ fontSize: '9px' }}>{readability.gradeLevel}</Badge>
                                </div>
                            </div>
                        )}
                        <div>
                            <h4 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>AI Analysis</h4>
                            {['Analyze Sentiment', 'Extract Topics', 'Suggest Improvements'].map(label => (
                                <Button key={label} variant="outline" disabled={!documentContent || isProcessing || !config.valid}
                                    onClick={() => handleAction('summarize')}
                                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '6px', height: '40px' }}>
                                    <Lightbulb style={{ width: '16px', height: '16px', marginRight: '8px', color: '#9ca3af' }} />
                                    <div style={{ fontSize: '11px', fontWeight: '500' }}>{label}</div>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAssistantPanel;
