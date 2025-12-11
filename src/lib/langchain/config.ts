/**
 * LangChain Configuration
 * Central configuration for all LangChain operations
 */

export const LANGCHAIN_CONFIG = {
    // Groq Model Configuration
    model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
    apiKey: import.meta.env.VITE_GROQ_API_KEY,

    // Generation Parameters
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,

    // Streaming Configuration
    streaming: true,
    streamingCallbacks: true,

    // Performance Settings
    timeout: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second

    // LangSmith (Optional - for debugging)
    callbacks: import.meta.env.VITE_LANGCHAIN_TRACING_V2 === 'true' ? [{
        handleLLMStart: () => console.log('🤖 AI Request Started'),
        handleLLMEnd: () => console.log('✅ AI Request Completed'),
        handleLLMError: (err: Error) => console.error('❌ AI Error:', err),
    }] : undefined,
} as const;

/**
 * Configuration for different AI operations
 */
export const OPERATION_CONFIGS = {
    grammar: {
        temperature: 0.3,
        maxTokens: 2048,
        systemPrompt: 'You are a grammar expert. Fix errors while preserving the original voice and style.',
    },

    rewrite: {
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: 'You are an expert editor. Rewrite text according to instructions while maintaining clarity.',
    },

    generate: {
        temperature: 0.8,
        maxTokens: 4096,
        systemPrompt: 'You are a creative content writer. Generate engaging, well-structured content.',
    },

    summarize: {
        temperature: 0.5,
        maxTokens: 1024,
        systemPrompt: 'You are a summarization expert. Extract key points concisely.',
    },

    analyze: {
        temperature: 0.4,
        maxTokens: 1024,
        systemPrompt: 'You are a document analyst. Provide objective, actionable insights.',
    },

    expand: {
        temperature: 0.7,
        maxTokens: 3072,
        systemPrompt: 'You are a content expander. Add relevant details and examples.',
    },

    tone: {
        temperature: 0.6,
        maxTokens: 2048,
        systemPrompt: 'You are a tone specialist. Adjust writing style while preserving meaning.',
    },

    continue: {
        temperature: 0.8,
        maxTokens: 1024,
        systemPrompt: 'You are a creative writer. Continue the text naturally and maintain the same style.',
    },
} as const;

/**
 * Prompt engineering best practices
 */
export const PROMPT_GUIDELINES = {
    maxContextLength: 8000, // characters
    includeExamples: true,
    useStructuredOutput: true,
    validateInputs: true,
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    burstSize: 5, // Allow 5 rapid requests
    cooldownMs: 2000, // 2 seconds between bursts
} as const;

/**
 * Caching configuration
 */
export const CACHE_CONFIG = {
    enabled: true,
    ttl: 3600000, // 1 hour in milliseconds
    maxSize: 100, // Max cached items
    keyPrefix: 'langchain_cache:',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
    noApiKey: 'Groq API key not configured. Please add VITE_GROQ_API_KEY to your .env file.',
    rateLimitExceeded: 'Rate limit exceeded. Please wait a moment before trying again.',
    networkError: 'Network error. Please check your connection and try again.',
    invalidInput: 'Invalid input provided. Please check your text and try again.',
    timeout: 'Request timed out. Please try again with a shorter text.',
    unknown: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Validate configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!LANGCHAIN_CONFIG.apiKey) {
        errors.push(ERROR_MESSAGES.noApiKey);
    }

    if (!LANGCHAIN_CONFIG.model) {
        errors.push('Model not configured');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get configuration for specific operation
 */
export function getOperationConfig(operation: keyof typeof OPERATION_CONFIGS) {
    return {
        ...LANGCHAIN_CONFIG,
        ...OPERATION_CONFIGS[operation],
    };
}
