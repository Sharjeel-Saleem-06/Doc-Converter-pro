import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true, // Required for client-side usage
});

const MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';

export interface AICompletionOptions {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
}

/**
 * Generate AI completion using Groq
 */
export async function generateAICompletion(options: AICompletionOptions): Promise<string> {
    const {
        prompt,
        systemPrompt = 'You are a helpful AI writing assistant. Provide clear, concise, and professional responses.',
        temperature = 0.7,
        maxTokens = 1024,
    } = options;

    try {
        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            temperature,
            max_tokens: maxTokens,
        });

        return completion.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('Groq API Error:', error);
        throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Generate content from a topic/prompt
 */
export async function generateContent(topic: string): Promise<string> {
    return generateAICompletion({
        prompt: `Write a well-structured document about: "${topic}". Include relevant details and maintain a professional tone.`,
        systemPrompt: 'You are a professional content writer. Create well-organized, informative content.',
        temperature: 0.8,
        maxTokens: 2048,
    });
}

/**
 * Rewrite text with specific instructions
 */
export async function rewriteText(text: string, instruction: string): Promise<string> {
    return generateAICompletion({
        prompt: `${instruction}\n\nOriginal text:\n${text}\n\nRewritten text:`,
        systemPrompt: 'You are an expert editor. Rewrite the text according to the instructions while maintaining the core meaning.',
        temperature: 0.7,
    });
}

/**
 * Improve grammar and spelling
 */
export async function improveGrammar(text: string): Promise<string> {
    return generateAICompletion({
        prompt: `Fix any grammar, spelling, and punctuation errors in the following text. Maintain the original meaning and style:\n\n${text}`,
        systemPrompt: 'You are a grammar and spelling expert. Fix errors while preserving the original voice.',
        temperature: 0.3,
    });
}

/**
 * Change tone of text
 */
export async function changeTone(text: string, tone: 'formal' | 'casual' | 'professional' | 'friendly'): Promise<string> {
    const toneDescriptions = {
        formal: 'formal and academic',
        casual: 'casual and conversational',
        professional: 'professional and business-like',
        friendly: 'friendly and approachable',
    };

    return generateAICompletion({
        prompt: `Rewrite the following text in a ${toneDescriptions[tone]} tone:\n\n${text}`,
        systemPrompt: 'You are a writing style expert. Adjust the tone while maintaining the core message.',
        temperature: 0.6,
    });
}

/**
 * Expand text with more details
 */
export async function expandText(text: string): Promise<string> {
    return generateAICompletion({
        prompt: `Expand the following text with more details, examples, and explanations:\n\n${text}`,
        systemPrompt: 'You are a content expander. Add relevant details while maintaining coherence.',
        temperature: 0.7,
        maxTokens: 2048,
    });
}

/**
 * Shorten text while keeping key points
 */
export async function shortenText(text: string): Promise<string> {
    return generateAICompletion({
        prompt: `Summarize the following text concisely while keeping all key points:\n\n${text}`,
        systemPrompt: 'You are a concise summary expert. Keep only essential information.',
        temperature: 0.5,
    });
}

/**
 * Continue writing from where the text left off
 */
export async function continueWriting(text: string): Promise<string> {
    return generateAICompletion({
        prompt: `Continue writing from where this text left off. Maintain the same style and tone:\n\n${text}`,
        systemPrompt: 'You are a creative writer. Continue the text naturally and coherently.',
        temperature: 0.8,
        maxTokens: 1024,
    });
}

/**
 * Generate suggestions for improvement
 */
export async function getSuggestions(text: string): Promise<string[]> {
    const response = await generateAICompletion({
        prompt: `Provide 3-5 specific suggestions to improve the following text:\n\n${text}\n\nList suggestions as bullet points.`,
        systemPrompt: 'You are an editor. Provide actionable improvement suggestions.',
        temperature: 0.6,
    });

    // Parse bullet points into array
    return response
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^[-•\d.]\s*/, '').trim())
        .filter(Boolean);
}
