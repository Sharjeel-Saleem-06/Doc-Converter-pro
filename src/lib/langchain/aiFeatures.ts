/**
 * Advanced AI Features Module
 * Premium document intelligence and writing enhancement features
 */

import { langchainUtils } from './llm';
import type { StreamChunk, ToneType } from './types';

// ==================== Types ====================

export interface ReadabilityMetrics {
    score: number; // 0-100
    gradeLevel: string; // e.g., "Grade 8", "College"
    fleschKincaid: number;
    readingEase: string; // "Easy", "Standard", "Difficult"
    avgSentenceLength: number;
    avgWordLength: number;
    complexWordPercentage: number;
}

export interface SentimentAnalysis {
    overall: 'positive' | 'negative' | 'neutral' | 'mixed';
    score: number; // -1 to 1
    emotions: {
        joy: number;
        sadness: number;
        anger: number;
        fear: number;
        surprise: number;
    };
    confidence: number;
}

export interface DocumentIntelligence {
    readability: ReadabilityMetrics;
    sentiment: SentimentAnalysis;
    keyTopics: string[];
    writingStyle: string;
    targetAudience: string;
    improvements: SmartSuggestion[];
    seoScore?: number;
    keywords?: string[];
}

export interface SmartSuggestion {
    id: string;
    type: 'grammar' | 'style' | 'clarity' | 'engagement' | 'seo' | 'tone';
    severity: 'low' | 'medium' | 'high';
    message: string;
    originalText?: string;
    suggestedText?: string;
    position?: { start: number; end: number };
    icon: string;
}

export interface ParaphraseOption {
    id: string;
    style: 'standard' | 'formal' | 'simple' | 'creative' | 'concise' | 'expanded';
    text: string;
    label: string;
}

export interface ContentTemplate {
    id: string;
    name: string;
    icon: string;
    category: 'social' | 'business' | 'marketing' | 'academic' | 'creative';
    description: string;
    prompt: string;
    fields: TemplateField[];
}

export interface TemplateField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    placeholder?: string;
    options?: string[];
    required: boolean;
}

export interface TranslationResult {
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    confidence: number;
}

export interface WritingStyle {
    id: string;
    name: string;
    description: string;
    icon: string;
    systemPrompt: string;
}

export interface AIHistoryEntry {
    id: string;
    timestamp: Date;
    action: string;
    originalText: string;
    resultText: string;
    operation: string;
}

// ==================== Constants ====================

export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
];

export const WRITING_STYLES: WritingStyle[] = [
    {
        id: 'professional',
        name: 'Professional',
        description: 'Business-appropriate and polished',
        icon: '💼',
        systemPrompt: 'You are a professional business writer. Write in a polished, business-appropriate tone while maintaining clarity and impact.',
    },
    {
        id: 'academic',
        name: 'Academic',
        description: 'Scholarly and well-researched',
        icon: '🎓',
        systemPrompt: 'You are an academic writer. Use scholarly language, cite concepts properly, and maintain objectivity.',
    },
    {
        id: 'creative',
        name: 'Creative',
        description: 'Imaginative and engaging',
        icon: '🎨',
        systemPrompt: 'You are a creative writer. Use vivid language, metaphors, and engaging storytelling techniques.',
    },
    {
        id: 'conversational',
        name: 'Conversational',
        description: 'Friendly and approachable',
        icon: '💬',
        systemPrompt: 'You are writing in a friendly, conversational style. Be approachable, use casual language, and connect with the reader.',
    },
    {
        id: 'technical',
        name: 'Technical',
        description: 'Precise and detailed',
        icon: '⚙️',
        systemPrompt: 'You are a technical writer. Be precise, use appropriate terminology, and explain complex concepts clearly.',
    },
    {
        id: 'persuasive',
        name: 'Persuasive',
        description: 'Convincing and compelling',
        icon: '🎯',
        systemPrompt: 'You are a persuasive writer. Use rhetorical techniques, emotional appeals, and logical arguments to convince the reader.',
    },
];

export const CONTENT_TEMPLATES: ContentTemplate[] = [
    // Social Media
    {
        id: 'linkedin-post',
        name: 'LinkedIn Post',
        icon: '💼',
        category: 'social',
        description: 'Professional LinkedIn post with engagement hooks',
        prompt: 'Write a compelling LinkedIn post about: {topic}. Include a hook, valuable insights, and a call-to-action. Target audience: {audience}. Tone: {tone}',
        fields: [
            { id: 'topic', label: 'Topic/Subject', type: 'textarea', placeholder: 'What do you want to share?', required: true },
            { id: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Tech professionals', required: false },
            { id: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Inspirational', 'Educational', 'Storytelling'], required: true },
        ],
    },
    {
        id: 'twitter-thread',
        name: 'Twitter/X Thread',
        icon: '🐦',
        category: 'social',
        description: 'Engaging Twitter thread with hooks',
        prompt: 'Create a viral Twitter thread (5-7 tweets) about: {topic}. Start with an attention-grabbing hook. Each tweet should provide value. End with a CTA.',
        fields: [
            { id: 'topic', label: 'Thread Topic', type: 'textarea', placeholder: 'What insight do you want to share?', required: true },
        ],
    },
    {
        id: 'instagram-caption',
        name: 'Instagram Caption',
        icon: '📸',
        category: 'social',
        description: 'Engaging caption with hashtags',
        prompt: 'Write an engaging Instagram caption for: {description}. Include emojis, a compelling hook, and relevant hashtags. Style: {style}',
        fields: [
            { id: 'description', label: 'Photo/Post Description', type: 'textarea', placeholder: 'Describe your post content', required: true },
            { id: 'style', label: 'Style', type: 'select', options: ['Casual', 'Inspiring', 'Funny', 'Educational', 'Behind-the-scenes'], required: true },
        ],
    },
    // Business
    {
        id: 'professional-email',
        name: 'Professional Email',
        icon: '📧',
        category: 'business',
        description: 'Clear and effective business email',
        prompt: 'Write a professional email about: {subject}. Context: {context}. The recipient is: {recipient}. Goal: {goal}. Keep it concise and actionable.',
        fields: [
            { id: 'subject', label: 'Email Subject', type: 'text', placeholder: 'Email subject matter', required: true },
            { id: 'context', label: 'Context/Background', type: 'textarea', placeholder: 'Provide relevant context', required: true },
            { id: 'recipient', label: 'Recipient Role', type: 'text', placeholder: 'e.g., Client, Manager, Team', required: false },
            { id: 'goal', label: 'Email Goal', type: 'select', options: ['Request', 'Follow-up', 'Update', 'Introduction', 'Proposal', 'Apology'], required: true },
        ],
    },
    {
        id: 'meeting-agenda',
        name: 'Meeting Agenda',
        icon: '📋',
        category: 'business',
        description: 'Structured meeting agenda',
        prompt: 'Create a professional meeting agenda for: {meeting_topic}. Duration: {duration}. Attendees: {attendees}. Include objectives, discussion points, and time allocations.',
        fields: [
            { id: 'meeting_topic', label: 'Meeting Topic', type: 'text', placeholder: 'What is the meeting about?', required: true },
            { id: 'duration', label: 'Duration', type: 'select', options: ['15 minutes', '30 minutes', '45 minutes', '1 hour', '1.5 hours', '2 hours'], required: true },
            { id: 'attendees', label: 'Attendees', type: 'text', placeholder: 'Who will attend?', required: false },
        ],
    },
    {
        id: 'project-proposal',
        name: 'Project Proposal',
        icon: '📑',
        category: 'business',
        description: 'Comprehensive project proposal',
        prompt: 'Write a professional project proposal for: {project}. Include: executive summary, objectives, scope, timeline, budget considerations, and expected outcomes. Client: {client}.',
        fields: [
            { id: 'project', label: 'Project Description', type: 'textarea', placeholder: 'Describe the project', required: true },
            { id: 'client', label: 'Client/Stakeholder', type: 'text', placeholder: 'Who is this for?', required: false },
        ],
    },
    // Marketing
    {
        id: 'product-description',
        name: 'Product Description',
        icon: '🛍️',
        category: 'marketing',
        description: 'Compelling product copy',
        prompt: 'Write a compelling product description for: {product}. Key features: {features}. Target customer: {target}. Focus on benefits, use sensory language, and include a CTA.',
        fields: [
            { id: 'product', label: 'Product Name', type: 'text', placeholder: 'Name of your product', required: true },
            { id: 'features', label: 'Key Features', type: 'textarea', placeholder: 'List main features', required: true },
            { id: 'target', label: 'Target Customer', type: 'text', placeholder: 'Who is this for?', required: false },
        ],
    },
    {
        id: 'ad-copy',
        name: 'Ad Copy',
        icon: '📢',
        category: 'marketing',
        description: 'High-converting advertisement copy',
        prompt: 'Write compelling ad copy for: {product_service}. Platform: {platform}. Unique selling point: {usp}. Include a strong hook, benefits, and CTA.',
        fields: [
            { id: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'What are you advertising?', required: true },
            { id: 'platform', label: 'Platform', type: 'select', options: ['Google Ads', 'Facebook/Meta', 'LinkedIn', 'Instagram', 'Twitter'], required: true },
            { id: 'usp', label: 'Unique Selling Point', type: 'textarea', placeholder: 'What makes it special?', required: true },
        ],
    },
    // Academic
    {
        id: 'essay-outline',
        name: 'Essay Outline',
        icon: '📝',
        category: 'academic',
        description: 'Structured essay outline',
        prompt: 'Create a detailed essay outline on: {topic}. Type: {essay_type}. Include thesis statement, main arguments, supporting evidence suggestions, and conclusion summary.',
        fields: [
            { id: 'topic', label: 'Essay Topic', type: 'textarea', placeholder: 'What is your essay about?', required: true },
            { id: 'essay_type', label: 'Essay Type', type: 'select', options: ['Argumentative', 'Expository', 'Narrative', 'Descriptive', 'Compare/Contrast', 'Research'], required: true },
        ],
    },
    {
        id: 'research-summary',
        name: 'Research Summary',
        icon: '🔬',
        category: 'academic',
        description: 'Academic research summary',
        prompt: 'Summarize the following research/findings: {content}. Include: key findings, methodology (if mentioned), implications, and limitations. Write in academic style.',
        fields: [
            { id: 'content', label: 'Research Content', type: 'textarea', placeholder: 'Paste the research content to summarize', required: true },
        ],
    },
    // Creative
    {
        id: 'blog-post',
        name: 'Blog Post',
        icon: '✍️',
        category: 'creative',
        description: 'Engaging blog article',
        prompt: 'Write an engaging blog post about: {topic}. Target audience: {audience}. Include: catchy headline, introduction hook, main points with examples, and conclusion with CTA. Length: {length}',
        fields: [
            { id: 'topic', label: 'Blog Topic', type: 'textarea', placeholder: 'What do you want to write about?', required: true },
            { id: 'audience', label: 'Target Audience', type: 'text', placeholder: 'Who will read this?', required: false },
            { id: 'length', label: 'Length', type: 'select', options: ['Short (300-500 words)', 'Medium (500-800 words)', 'Long (1000+ words)'], required: true },
        ],
    },
    {
        id: 'story-starter',
        name: 'Story Starter',
        icon: '📖',
        category: 'creative',
        description: 'Creative story beginning',
        prompt: 'Write an engaging story opening for: {premise}. Genre: {genre}. Include vivid descriptions, character introduction, and a hook that draws readers in.',
        fields: [
            { id: 'premise', label: 'Story Premise', type: 'textarea', placeholder: 'Describe your story idea', required: true },
            { id: 'genre', label: 'Genre', type: 'select', options: ['Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Thriller', 'Literary Fiction', 'Horror'], required: true },
        ],
    },
];

// ==================== Utility Functions ====================

/**
 * Calculate readability metrics locally
 */
export function calculateReadability(text: string): ReadabilityMetrics {
    if (!text.trim()) {
        return {
            score: 0,
            gradeLevel: 'N/A',
            fleschKincaid: 0,
            readingEase: 'N/A',
            avgSentenceLength: 0,
            avgWordLength: 0,
            complexWordPercentage: 0,
        };
    }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

    const sentenceCount = Math.max(sentences.length, 1);
    const wordCount = Math.max(words.length, 1);

    const avgSentenceLength = wordCount / sentenceCount;
    const avgSyllablesPerWord = syllables / wordCount;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;

    // Complex words (3+ syllables)
    const complexWords = words.filter(w => countSyllables(w) >= 3).length;
    const complexWordPercentage = (complexWords / wordCount) * 100;

    // Flesch-Kincaid Grade Level
    const fleschKincaid = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

    // Flesch Reading Ease (0-100)
    const readingEaseScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
    const score = Math.max(0, Math.min(100, readingEaseScore));

    // Determine grade level string
    let gradeLevel: string;
    if (fleschKincaid <= 5) gradeLevel = 'Elementary';
    else if (fleschKincaid <= 8) gradeLevel = 'Middle School';
    else if (fleschKincaid <= 12) gradeLevel = 'High School';
    else if (fleschKincaid <= 16) gradeLevel = 'College';
    else gradeLevel = 'Graduate';

    // Determine reading ease string
    let readingEase: string;
    if (score >= 80) readingEase = 'Very Easy';
    else if (score >= 60) readingEase = 'Easy';
    else if (score >= 40) readingEase = 'Standard';
    else if (score >= 20) readingEase = 'Difficult';
    else readingEase = 'Very Difficult';

    return {
        score: Math.round(score),
        gradeLevel,
        fleschKincaid: Math.round(fleschKincaid * 10) / 10,
        readingEase,
        avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
        avgWordLength: Math.round(avgWordLength * 10) / 10,
        complexWordPercentage: Math.round(complexWordPercentage * 10) / 10,
    };
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    const vowels = 'aeiouy';
    let count = 0;
    let prevIsVowel = false;

    for (const char of word) {
        const isVowel = vowels.includes(char);
        if (isVowel && !prevIsVowel) count++;
        prevIsVowel = isVowel;
    }

    // Adjust for silent e
    if (word.endsWith('e')) count--;
    // Adjust for -le ending
    if (word.endsWith('le') && word.length > 2 && !vowels.includes(word[word.length - 3])) count++;

    return Math.max(count, 1);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== AI Feature Functions ====================

/**
 * Analyze document for intelligence insights
 */
export async function analyzeDocument(text: string): Promise<DocumentIntelligence> {
    const readability = calculateReadability(text);

    // Get AI-powered analysis
    const analysisPrompt = `Analyze this text and provide a JSON response with the following structure:
{
    "sentiment": {
        "overall": "positive" | "negative" | "neutral" | "mixed",
        "score": number between -1 and 1,
        "confidence": number between 0 and 1
    },
    "keyTopics": ["topic1", "topic2", "topic3"],
    "writingStyle": "description of the writing style",
    "targetAudience": "description of target audience",
    "improvements": [
        {
            "type": "grammar" | "style" | "clarity" | "engagement" | "tone",
            "severity": "low" | "medium" | "high",
            "message": "specific improvement suggestion"
        }
    ],
    "seoScore": number between 0 and 100,
    "keywords": ["keyword1", "keyword2", "keyword3"]
}

Text to analyze:
${text.slice(0, 3000)}

Respond only with valid JSON.`;

    try {
        const response = await langchainUtils.complete(
            analysisPrompt,
            'You are a professional document analyst. Provide accurate, actionable insights. Always respond with valid JSON only.',
            'analyze'
        );

        const analysis = JSON.parse(response);

        return {
            readability,
            sentiment: {
                overall: analysis.sentiment?.overall || 'neutral',
                score: analysis.sentiment?.score || 0,
                emotions: {
                    joy: 0,
                    sadness: 0,
                    anger: 0,
                    fear: 0,
                    surprise: 0,
                },
                confidence: analysis.sentiment?.confidence || 0.5,
            },
            keyTopics: analysis.keyTopics || [],
            writingStyle: analysis.writingStyle || 'Not determined',
            targetAudience: analysis.targetAudience || 'General audience',
            improvements: (analysis.improvements || []).map((imp: any, i: number) => ({
                id: generateId(),
                type: imp.type || 'style',
                severity: imp.severity || 'medium',
                message: imp.message,
                icon: getImprovementIcon(imp.type),
            })),
            seoScore: analysis.seoScore || 50,
            keywords: analysis.keywords || [],
        };
    } catch (error) {
        console.error('Document analysis error:', error);
        return {
            readability,
            sentiment: {
                overall: 'neutral',
                score: 0,
                emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0 },
                confidence: 0,
            },
            keyTopics: [],
            writingStyle: 'Unable to analyze',
            targetAudience: 'Unknown',
            improvements: [],
            seoScore: 0,
            keywords: [],
        };
    }
}

function getImprovementIcon(type: string): string {
    const icons: Record<string, string> = {
        grammar: '✏️',
        style: '🎨',
        clarity: '💡',
        engagement: '🎯',
        seo: '🔍',
        tone: '🎭',
    };
    return icons[type] || '💡';
}

/**
 * Generate paraphrase options
 */
export async function generateParaphrases(
    text: string,
    onChunk?: (chunk: StreamChunk) => void
): Promise<ParaphraseOption[]> {
    const prompt = `Provide 5 different ways to rewrite this text. Each version should have a different style.
Return a JSON array with the format:
[
    {"style": "standard", "text": "rewritten text", "label": "Standard Rewrite"},
    {"style": "formal", "text": "rewritten text", "label": "Formal Version"},
    {"style": "simple", "text": "rewritten text", "label": "Simplified"},
    {"style": "creative", "text": "rewritten text", "label": "Creative"},
    {"style": "concise", "text": "rewritten text", "label": "Concise"}
]

Original text:
${text}

Respond only with the JSON array.`;

    try {
        const response = await langchainUtils.complete(
            prompt,
            'You are an expert paraphrasing assistant. Provide diverse, high-quality rewrites while preserving the original meaning.',
            'rewrite'
        );

        const options = JSON.parse(response);
        return options.map((opt: any, i: number) => ({
            id: generateId(),
            style: opt.style,
            text: opt.text,
            label: opt.label,
        }));
    } catch (error) {
        console.error('Paraphrase error:', error);
        return [];
    }
}

/**
 * Translate text
 */
export async function translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'auto'
): Promise<TranslationResult> {
    const langName = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name || targetLanguage;
    const sourceLangName = sourceLanguage === 'auto' ? 'the original language' :
        SUPPORTED_LANGUAGES.find(l => l.code === sourceLanguage)?.name || sourceLanguage;

    const prompt = `Translate the following text from ${sourceLangName} to ${langName}. 
Preserve the tone, style, and meaning. Only provide the translated text, nothing else.

Text to translate:
${text}`;

    try {
        const translatedText = await langchainUtils.complete(
            prompt,
            `You are a professional translator. Translate accurately while maintaining the original tone and context. Translate to ${langName}.`,
            'generate'
        );

        return {
            originalText: text,
            translatedText: translatedText.trim(),
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage,
            confidence: 0.95,
        };
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

/**
 * Generate content from template
 */
export async function generateFromTemplate(
    template: ContentTemplate,
    fieldValues: Record<string, string>,
    onChunk?: (chunk: StreamChunk) => void
): Promise<string> {
    let prompt = template.prompt;

    // Replace placeholders with values
    for (const [key, value] of Object.entries(fieldValues)) {
        prompt = prompt.replace(`{${key}}`, value || '');
    }

    if (onChunk) {
        return await langchainUtils.streamComplete(
            prompt,
            onChunk,
            `You are an expert content writer specializing in ${template.category} content. Create high-quality, engaging content.`,
            'generate'
        );
    } else {
        return await langchainUtils.complete(
            prompt,
            `You are an expert content writer specializing in ${template.category} content. Create high-quality, engaging content.`,
            'generate'
        );
    }
}

/**
 * Humanize AI text
 */
export async function humanizeText(text: string): Promise<string> {
    const prompt = `Rewrite the following text to sound more natural and human-like. 
Remove robotic or overly formal language. Add natural transitions, vary sentence structure, 
and include conversational elements while maintaining the original meaning.

Text to humanize:
${text}`;

    return await langchainUtils.complete(
        prompt,
        'You are an expert editor who specializes in making content sound natural and human. Remove any AI-like patterns or robotic language.',
        'rewrite'
    );
}

/**
 * Generate SEO suggestions
 */
export async function generateSEOSuggestions(text: string, topic?: string): Promise<{
    score: number;
    suggestions: string[];
    keywords: string[];
    metaDescription: string;
    titleSuggestions: string[];
}> {
    const prompt = `Analyze this content for SEO and provide suggestions.
${topic ? `Topic focus: ${topic}` : ''}

Return a JSON response with:
{
    "score": SEO score from 0-100,
    "suggestions": ["list of specific SEO improvements"],
    "keywords": ["recommended keywords to include"],
    "metaDescription": "a compelling meta description (150-160 chars)",
    "titleSuggestions": ["3 SEO-optimized title options"]
}

Content to analyze:
${text.slice(0, 2000)}

Respond only with valid JSON.`;

    try {
        const response = await langchainUtils.complete(
            prompt,
            'You are an SEO expert. Provide actionable, specific recommendations to improve search rankings.',
            'analyze'
        );

        return JSON.parse(response);
    } catch (error) {
        console.error('SEO analysis error:', error);
        return {
            score: 50,
            suggestions: ['Unable to analyze SEO at this time'],
            keywords: [],
            metaDescription: '',
            titleSuggestions: [],
        };
    }
}

/**
 * Smart suggestions for improvement
 */
export async function getSmartSuggestions(text: string): Promise<SmartSuggestion[]> {
    const prompt = `Analyze this text and provide specific improvement suggestions.
Return a JSON array with improvement suggestions:
[
    {
        "type": "grammar" | "style" | "clarity" | "engagement" | "tone",
        "severity": "low" | "medium" | "high",
        "message": "specific suggestion with context",
        "originalText": "problematic text (if applicable)",
        "suggestedText": "improved version (if applicable)"
    }
]

Provide 3-5 actionable suggestions.

Text:
${text.slice(0, 1500)}

Respond only with the JSON array.`;

    try {
        const response = await langchainUtils.complete(
            prompt,
            'You are a professional editor. Identify specific, actionable improvements. Be precise about what needs changing.',
            'analyze'
        );

        const suggestions = JSON.parse(response);
        return suggestions.map((s: any) => ({
            id: generateId(),
            type: s.type,
            severity: s.severity,
            message: s.message,
            originalText: s.originalText,
            suggestedText: s.suggestedText,
            icon: getImprovementIcon(s.type),
        }));
    } catch (error) {
        console.error('Smart suggestions error:', error);
        return [];
    }
}

/**
 * Apply writing style
 */
export async function applyWritingStyle(
    text: string,
    style: WritingStyle,
    onChunk?: (chunk: StreamChunk) => void
): Promise<string> {
    const prompt = `Rewrite the following text in the specified style.
Style: ${style.name} - ${style.description}

Original text:
${text}

Rewrite maintaining the same meaning but with the specified style.`;

    if (onChunk) {
        return await langchainUtils.streamComplete(
            prompt,
            onChunk,
            style.systemPrompt,
            'rewrite'
        );
    } else {
        return await langchainUtils.complete(
            prompt,
            style.systemPrompt,
            'rewrite'
        );
    }
}

/**
 * Fact check claims in text
 */
export async function factCheckText(text: string): Promise<{
    claims: Array<{
        claim: string;
        status: 'verified' | 'unverified' | 'questionable';
        note: string;
    }>;
    overallCredibility: number;
}> {
    const prompt = `Identify factual claims in this text and assess their credibility.
Return a JSON response:
{
    "claims": [
        {
            "claim": "the factual claim",
            "status": "verified" | "unverified" | "questionable",
            "note": "brief note about verification or source"
        }
    ],
    "overallCredibility": number from 0-100
}

Note: Mark claims as "verified" only if they are commonly known facts. 
Mark as "questionable" if they seem potentially inaccurate.
Mark as "unverified" if they would need source verification.

Text:
${text.slice(0, 2000)}

Respond only with valid JSON.`;

    try {
        const response = await langchainUtils.complete(
            prompt,
            'You are a fact-checking assistant. Be conservative - only mark things as verified if they are well-established facts.',
            'analyze'
        );

        return JSON.parse(response);
    } catch (error) {
        console.error('Fact check error:', error);
        return {
            claims: [],
            overallCredibility: 50,
        };
    }
}

export default {
    calculateReadability,
    analyzeDocument,
    generateParaphrases,
    translateText,
    generateFromTemplate,
    humanizeText,
    generateSEOSuggestions,
    getSmartSuggestions,
    applyWritingStyle,
    factCheckText,
    SUPPORTED_LANGUAGES,
    WRITING_STYLES,
    CONTENT_TEMPLATES,
};
