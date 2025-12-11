/**
 * LangChain LLM Wrapper for Groq
 * Provides unified interface for AI operations
 */

import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { LANGCHAIN_CONFIG, getOperationConfig, validateConfig } from './config';
import type { AIOperation, StreamCallback, AIError } from './types';

/**
 * Initialize Groq LLM
 */
function initializeLLM(operation?: AIOperation) {
    const config = operation ? getOperationConfig(operation) : LANGCHAIN_CONFIG;

    return new ChatGroq({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        streaming: config.streaming,
        timeout: config.timeout,
    });
}

/**
 * Validate configuration before making requests
 */
function ensureConfigured() {
    const validation = validateConfig();
    if (!validation.valid) {
        throw new Error(`Configuration Error: ${validation.errors.join(', ')}`);
    }
}

/**
 * Main LLM instance (singleton)
 */
export const llm = initializeLLM();

/**
 * Get LLM for specific operation
 */
export function getLLM(operation: AIOperation) {
    return initializeLLM(operation);
}

/**
 * Basic text completion
 */
export async function complete(
    prompt: string,
    systemPrompt?: string,
    operation?: AIOperation
): Promise<string> {
    ensureConfigured();

    try {
        const model = operation ? getLLM(operation) : llm;
        const parser = new StringOutputParser();

        const messages = [
            ...(systemPrompt ? [new SystemMessage(systemPrompt)] : []),
            new HumanMessage(prompt),
        ];

        const chain = model.pipe(parser);
        const result = await chain.invoke(messages);

        return result;
    } catch (error) {
        throw handleLLMError(error);
    }
}

/**
 * Streaming completion
 */
export async function streamComplete(
    prompt: string,
    onChunk: StreamCallback,
    systemPrompt?: string,
    operation?: AIOperation
): Promise<string> {
    ensureConfigured();

    try {
        const model = operation ? getLLM(operation) : llm;

        const messages = [
            ...(systemPrompt ? [new SystemMessage(systemPrompt)] : []),
            new HumanMessage(prompt),
        ];

        let fullText = '';
        let tokenCount = 0;

        const stream = await model.stream(messages);

        for await (const chunk of stream) {
            const content = chunk.content as string;
            fullText += content;
            tokenCount++;

            onChunk({
                content,
                done: false,
                metadata: { tokenCount },
            });
        }

        // Send final chunk
        onChunk({
            content: '',
            done: true,
            metadata: { tokenCount },
        });

        return fullText;
    } catch (error) {
        throw handleLLMError(error);
    }
}

/**
 * Chat with conversation history
 */
export async function chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    operation?: AIOperation
): Promise<string> {
    ensureConfigured();

    try {
        const model = operation ? getLLM(operation) : llm;
        const parser = new StringOutputParser();

        const formattedMessages = messages.map(msg => {
            switch (msg.role) {
                case 'system':
                    return new SystemMessage(msg.content);
                case 'user':
                    return new HumanMessage(msg.content);
                case 'assistant':
                    return new AIMessage(msg.content);
                default:
                    throw new Error(`Unknown role: ${msg.role}`);
            }
        });

        const chain = model.pipe(parser);
        const result = await chain.invoke(formattedMessages);

        return result;
    } catch (error) {
        throw handleLLMError(error);
    }
}

/**
 * Batch completions (multiple prompts at once)
 */
export async function batchComplete(
    prompts: string[],
    systemPrompt?: string,
    operation?: AIOperation
): Promise<string[]> {
    ensureConfigured();

    try {
        const model = operation ? getLLM(operation) : llm;
        const parser = new StringOutputParser();

        const chain = model.pipe(parser);

        const messageSets = prompts.map(prompt => [
            ...(systemPrompt ? [new SystemMessage(systemPrompt)] : []),
            new HumanMessage(prompt),
        ]);

        const results = await chain.batch(messageSets);

        return results;
    } catch (error) {
        throw handleLLMError(error);
    }
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
    // Rough estimate: ~4 chars per token for English
    return Math.ceil(text.length / 4);
}

/**
 * Validate  input text
 */
export function validateInput(text: string): { valid: boolean; error?: string } {
    if (!text || typeof text !== 'string') {
        return { valid: false, error: 'Text must be a non-empty string' };
    }

    if (text.trim().length === 0) {
        return { valid: false, error: 'Text cannot be empty or only whitespace' };
    }

    const estimatedTokens = estimateTokens(text);
    const maxTokens = LANGCHAIN_CONFIG.maxTokens;

    // Leave room for response (use half of max tokens for input)
    if (estimatedTokens > maxTokens / 2) {
        return {
            valid: false,
            error: `Text is too long. Maximum ~${Math.floor(maxTokens / 2)} tokens (approximately ${Math.floor(maxTokens * 2)} characters)`
        };
    }

    return { valid: true };
}

/**
 * Error handler
 */
function handleLLMError(error: unknown): AIError {
    console.error('LLM Error:', error);

    if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('API key')) {
            return {
                code: 'INVALID_API_KEY',
                message: 'Invalid API key. Please check your configuration.',
                retryable: false,
            };
        }

        if (error.message.includes('rate limit')) {
            return {
                code: 'RATE_LIMIT',
                message: 'Rate limit exceeded. Please wait a moment.',
                retryable: true,
            };
        }

        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            return {
                code: 'TIMEOUT',
                message: 'Request timed out. Please try again.',
                retryable: true,
            };
        }

        if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
            return {
                code: 'NETWORK_ERROR',
                message: 'Network error. Please check your connection.',
                retryable: true,
            };
        }

        return {
            code: 'UNKNOWN_ERROR',
            message: error.message,
            details: error,
            retryable: true,
        };
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: error,
        retryable: true,
    };
}

/**
 * Retry logic with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            const aiError = handleLLMError(error);

            // Don't retry if error is not retryable
            if (!aiError.retryable) {
                throw aiError;
            }

            // Don't retry on last attempt
            if (attempt === maxRetries - 1) {
                throw aiError;
            }

            // Exponential backoff: 1s, 2s, 4s, etc.
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}

/**
 * Cancel ongoing requests (AbortController)
 */
export class RequestCanceller {
    private controller: AbortController | null = null;

    getSignal(): AbortSignal {
        this.controller = new AbortController();
        return this.controller.signal;
    }

    cancel(): void {
        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }
    }
}

/**
 * Export utility functions
 */
export const langchainUtils = {
    complete,
    streamComplete,
    chat,
    batchComplete,
    estimateTokens,
    validateInput,
    withRetry,
    getLLM,
};

export default llm;
