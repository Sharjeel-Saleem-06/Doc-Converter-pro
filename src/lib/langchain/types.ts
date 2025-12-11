/**
 * TypeScript Types for LangChain Integration
 */

import { BaseMessage } from "@langchain/core/messages";
import { Document } from "@langchain/core/documents";

/**
 * AI Operation Types
 */
export type AIOperation =
    | 'grammar'
    | 'rewrite'
    | 'generate'
    | 'summarize'
    | 'analyze'
    | 'expand'
    | 'tone'
    | 'continue';

export type ToneType =
    | 'formal'
    | 'casual'
    | 'professional'
    | 'friendly'
    | 'academic'
    | 'creative';

/**
 * AI Request/Response Types
 */
export interface AIRequest {
    text: string;
    operation: AIOperation;
    options?: AIRequestOptions;
}

export interface AIRequestOptions {
    tone?: ToneType;
    instruction?: string;
    context?: string;
    maxLength?: number;
    temperature?: number;
    streaming?: boolean;
}

export interface AIResponse {
    text: string;
    operation: AIOperation;
    metadata?: AIResponseMetadata;
}

export interface AIResponseMetadata {
    tokensUsed?: number;
    timeMs?: number;
    model?: string;
    confidence?: number;
}

/**
 * Streaming Types
 */
export interface StreamChunk {
    content: string;
    done: boolean;
    metadata?: {
        tokenCount?: number;
    };
}

export type StreamCallback = (chunk: StreamChunk) => void;

/**
 * LangChain Chain Types
 */
export interface ChainInput {
    text: string;
    context?: string;
    [key: string]: unknown;
}

export interface ChainOutput {
    text: string;
    metadata?: Record<string, unknown>;
}

/**
 * Document Analysis Types
 */
export interface DocumentAnalysis {
    readabilityScore: number; // 0-100
    gradeLevel: number; // School grade level
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    averageSentenceLength: number;
    tone: ToneType;
    issues: DocumentIssue[];
    suggestions: string[];
}

export interface DocumentIssue {
    type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'tone';
    severity: 'low' | 'medium' | 'high';
    message: string;
    position?: {
        start: number;
        end: number;
    };
    suggestion?: string;
}

/**
 * Suggestion Types
 */
export interface AISuggestion {
    id: string;
    type: 'rewrite' | 'improvement' | 'alternative';
    original: string;
    suggested: string;
    explanation: string;
    confidence: number; // 0-1
    metadata?: {
        changeType?: 'grammar' | 'style' | 'tone' | 'clarity';
        impact?: 'minor' | 'major';
    };
}

/**
 * RAG (Retrieval-Augmented Generation) Types
 */
export interface RAGContext {
    documents: Document[];
    query: string;
    maxResults?: number;
}

export interface RAGResult {
    answer: string;
    sources: Document[];
    confidence: number;
}

/**
 * Vector Store Types
 */
export interface VectorStoreDocument {
    id: string;
    content: string;
    metadata: {
        title?: string;
        type?: string;
        createdAt?: Date;
        userId?: string;
        [key: string]: unknown;
    };
    embedding?: number[];
}

/**
 * Memory Types
 */
export interface ConversationMemory {
    messages: BaseMessage[];
    summary?: string;
    entities?: Map<string, string>;
}

export interface BufferMemory {
    buffer: string[];
    maxLength: number;
}

/**
 * LangGraph State Types
 */
export interface EditorState {
    // Document state
    document: string;
    selectedText: string;
    cursorPosition: number;

    // User intent
    userIntent: AIOperation | null;
    userInstruction?: string;

    // AI processing
    aiSuggestions: AISuggestion[];
    currentSuggestion?: AISuggestion;
    processingStatus: 'idle' | 'analyzing' | 'generating' | 'complete' | 'error';

    // Context
    documentContext: DocumentContext;
    conversationHistory: BaseMessage[];

    // Metadata
    metadata: {
        wordCount: number;
        lastModified: Date;
        analysisData?: DocumentAnalysis;
    };
}

export interface DocumentContext {
    precedingText: string; // 500 chars before
    followingText: string; // 500 chars after
    documentType?: 'email' | 'article' | 'report' | 'blog' | 'note';
    styleGuide?: string[];
    keywords?: string[];
}

/**
 * Workflow Types
 */
export interface WorkflowNode {
    id: string;
    type: 'analyze' | 'generate' | 'review' | 'apply';
    execute: (state: EditorState) => Promise<Partial<EditorState>>;
}

export interface WorkflowEdge {
    from: string;
    to: string;
    condition?: (state: EditorState) => boolean;
}

/**
 * Error Types
 */
export interface AIError {
    code: string;
    message: string;
    details?: unknown;
    retryable: boolean;
}

/**
 * Cache Types
 */
export interface CacheEntry<T> {
    key: string;
    value: T;
    timestamp: number;
    ttl: number;
}

export interface CacheManager {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

/**
 * Rate Limiter Types
 */
export interface RateLimitInfo {
    allowed: boolean;
    remainingRequests: number;
    resetTime: Date;
}

/**
 * Template Types
 */
export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    category: 'business' | 'academic' | 'creative' | 'technical';
    variables?: TemplateVariable[];
}

export interface TemplateVariable {
    name: string;
    type: 'text' | 'number' | 'date' | 'list';
    required: boolean;
    default?: unknown;
    description?: string;
}

/**
 * Hook Return Types
 */
export interface UseEditorAIReturn {
    // Operations
    improveGrammar: (text: string) => Promise<string>;
    rewrite: (text: string, instruction: string) => Promise<string>;
    changeTone: (text: string, tone: ToneType) => Promise<string>;
    expand: (text: string) => Promise<string>;
    summarize: (text: string) => Promise<string>;
    generate: (prompt: string) => Promise<string>;
    continueWriting: (text: string) => Promise<string>;

    // Analysis
    analyzeDocument: (text: string) => Promise<DocumentAnalysis>;
    getSuggestions: (text: string) => Promise<AISuggestion[]>;

    // State
    loading: boolean;
    error: AIError | null;
    streaming: boolean;
    streamingText: string;

    // Control
    cancelRequest: () => void;
    clearError: () => void;
}

export interface UseStreamingAIReturn {
    streamText: (
        prompt: string,
        onChunk: StreamCallback,
        options?: AIRequestOptions
    ) => Promise<void>;

    isStreaming: boolean;
    cancel: () => void;
    error: AIError | null;
}

/**
 * Service Return Types
 */
export interface LangChainService {
    // Core chains
    rewriteChain: (input: ChainInput) => Promise<ChainOutput>;
    analysisChain: (input: ChainInput) => Promise<DocumentAnalysis>;
    summaryChain: (input: ChainInput) => Promise<ChainOutput>;

    // Utility
    validateInput: (text: string) => boolean;
    estimateTokens: (text: string) => number;
}

/**
 * Utility Types
 */
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncFunction<Args extends unknown[], Return> = (
    ...args: Args
) => Promise<Return>;
