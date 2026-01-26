/**
 * Advanced AI Service with Load Balancing, Fallback & Multiple API Integrations
 * Includes: Groq (LLM), LanguageTool (Grammar), TextRazor (Entity), HuggingFace (NLP)
 */

// ============================================
// Groq API Load Balancer
// ============================================

interface GroqKey {
  key: string;
  requestCount: number;
  lastUsed: number;
  isAvailable: boolean;
  errorCount: number;
}

class GroqLoadBalancer {
  private keys: GroqKey[] = [];
  private currentIndex = 0;
  private readonly maxErrorsBeforeCooldown = 3;
  private readonly cooldownMs = 60000; // 1 minute cooldown

  constructor() {
    // Initialize with all available keys
    const keyNames = [
      'VITE_GROQ_API_KEY',
      'VITE_GROQ_API_KEY_2',
      'VITE_GROQ_API_KEY_3',
      'VITE_GROQ_API_KEY_4'
    ];

    keyNames.forEach(name => {
      const key = import.meta.env[name];
      if (key) {
        this.keys.push({
          key,
          requestCount: 0,
          lastUsed: 0,
          isAvailable: true,
          errorCount: 0
        });
      }
    });

    console.log(`✅ Groq Load Balancer initialized with ${this.keys.length} keys`);
  }

  getNextKey(): string | null {
    if (this.keys.length === 0) return null;

    // Check for cooldown recovery
    const now = Date.now();
    this.keys.forEach(k => {
      if (!k.isAvailable && now - k.lastUsed > this.cooldownMs) {
        k.isAvailable = true;
        k.errorCount = 0;
        console.log('🔄 Groq key recovered from cooldown');
      }
    });

    // Find available key with least requests (round-robin with load awareness)
    const availableKeys = this.keys.filter(k => k.isAvailable);
    if (availableKeys.length === 0) {
      // All keys exhausted, use the one with oldest last use
      const oldestKey = this.keys.reduce((a, b) => a.lastUsed < b.lastUsed ? a : b);
      oldestKey.isAvailable = true;
      return oldestKey.key;
    }

    // Sort by request count and pick the least used
    availableKeys.sort((a, b) => a.requestCount - b.requestCount);
    const selectedKey = availableKeys[0];
    selectedKey.requestCount++;
    selectedKey.lastUsed = now;

    return selectedKey.key;
  }

  reportError(key: string): void {
    const keyObj = this.keys.find(k => k.key === key);
    if (keyObj) {
      keyObj.errorCount++;
      if (keyObj.errorCount >= this.maxErrorsBeforeCooldown) {
        keyObj.isAvailable = false;
        console.warn('⚠️ Groq key put in cooldown due to errors');
      }
    }
  }

  reportSuccess(key: string): void {
    const keyObj = this.keys.find(k => k.key === key);
    if (keyObj) {
      keyObj.errorCount = Math.max(0, keyObj.errorCount - 1);
    }
  }

  getStats(): { total: number; available: number; requestCounts: number[] } {
    return {
      total: this.keys.length,
      available: this.keys.filter(k => k.isAvailable).length,
      requestCounts: this.keys.map(k => k.requestCount)
    };
  }
}

export const groqLoadBalancer = new GroqLoadBalancer();

// ============================================
// LanguageTool API (Grammar & Spell Check)
// ============================================

interface LanguageToolMatch {
  message: string;
  shortMessage: string;
  replacements: { value: string }[];
  offset: number;
  length: number;
  rule: {
    id: string;
    description: string;
    category: { id: string; name: string };
  };
}

interface LanguageToolResponse {
  matches: LanguageToolMatch[];
  language: { code: string; name: string };
}

export interface GrammarError {
  message: string;
  shortMessage: string;
  suggestions: string[];
  offset: number;
  length: number;
  ruleId: string;
  category: string;
  originalText: string;
}

export async function checkGrammar(text: string, language = 'en-US'): Promise<GrammarError[]> {
  const apiUrl = import.meta.env.VITE_LANGUAGETOOL_API_URL || 'https://api.languagetool.org/v2';
  
  try {
    const response = await fetch(`${apiUrl}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        language,
        enabledOnly: 'false',
      }),
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status}`);
    }

    const data: LanguageToolResponse = await response.json();
    
    return data.matches.map(match => ({
      message: match.message,
      shortMessage: match.shortMessage || match.message.slice(0, 50),
      suggestions: match.replacements.slice(0, 5).map(r => r.value),
      offset: match.offset,
      length: match.length,
      ruleId: match.rule.id,
      category: match.rule.category.name,
      originalText: text.slice(match.offset, match.offset + match.length)
    }));
  } catch (error) {
    console.error('LanguageTool error:', error);
    return [];
  }
}

export async function autoCorrectGrammar(text: string): Promise<string> {
  const errors = await checkGrammar(text);
  
  if (errors.length === 0) return text;

  // Apply corrections from end to start to maintain offsets
  let correctedText = text;
  const sortedErrors = errors.sort((a, b) => b.offset - a.offset);

  for (const error of sortedErrors) {
    if (error.suggestions.length > 0) {
      correctedText = 
        correctedText.slice(0, error.offset) + 
        error.suggestions[0] + 
        correctedText.slice(error.offset + error.length);
    }
  }

  return correctedText;
}

// ============================================
// TextRazor API (Entity Extraction & Analysis)
// ============================================

interface TextRazorEntity {
  entityId: string;
  matchedText: string;
  type: string[];
  relevanceScore: number;
  confidenceScore: number;
  wikiLink?: string;
}

interface TextRazorTopic {
  label: string;
  score: number;
  wikiLink?: string;
}

interface TextRazorResponse {
  response: {
    entities?: TextRazorEntity[];
    topics?: TextRazorTopic[];
    sentences?: { words: { token: string; partOfSpeech: string }[] }[];
  };
}

export interface EntityAnalysis {
  entities: {
    text: string;
    type: string;
    relevance: number;
    confidence: number;
    wikiLink?: string;
  }[];
  topics: {
    label: string;
    score: number;
  }[];
}

export async function analyzeEntities(text: string): Promise<EntityAnalysis> {
  const apiKey = import.meta.env.VITE_TEXTRAZOR_API_KEY;
  
  if (!apiKey) {
    console.warn('TextRazor API key not configured');
    return { entities: [], topics: [] };
  }

  try {
    const response = await fetch('https://api.textrazor.com/', {
      method: 'POST',
      headers: {
        'X-TextRazor-Key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        extractors: 'entities,topics',
      }),
    });

    if (!response.ok) {
      throw new Error(`TextRazor API error: ${response.status}`);
    }

    const data: TextRazorResponse = await response.json();
    
    return {
      entities: (data.response.entities || []).slice(0, 20).map(e => ({
        text: e.matchedText,
        type: e.type[0] || 'Unknown',
        relevance: Math.round(e.relevanceScore * 100),
        confidence: Math.round(e.confidenceScore * 100),
        wikiLink: e.wikiLink
      })),
      topics: (data.response.topics || []).slice(0, 10).map(t => ({
        label: t.label,
        score: Math.round(t.score * 100)
      }))
    };
  } catch (error) {
    console.error('TextRazor error:', error);
    return { entities: [], topics: [] };
  }
}

// ============================================
// HuggingFace Inference API
// ============================================

interface HuggingFaceResult {
  label?: string;
  score?: number;
  summary_text?: string;
  generated_text?: string;
  translation_text?: string;
}

export interface SentimentResult {
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  confidence: string;
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    // Fallback to simple sentiment analysis
    return simpleSentimentAnalysis(text);
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text.slice(0, 512) }),
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
      const results = data[0] as { label: string; score: number }[];
      const best = results.reduce((a, b) => a.score > b.score ? a : b);
      
      // Map labels
      let label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
      if (best.label.toLowerCase().includes('positive')) label = 'POSITIVE';
      else if (best.label.toLowerCase().includes('negative')) label = 'NEGATIVE';
      
      return {
        label,
        score: Math.round(best.score * 100),
        confidence: best.score > 0.8 ? 'High' : best.score > 0.6 ? 'Medium' : 'Low'
      };
    }
    
    return simpleSentimentAnalysis(text);
  } catch (error) {
    console.error('HuggingFace sentiment error:', error);
    return simpleSentimentAnalysis(text);
  }
}

function simpleSentimentAnalysis(text: string): SentimentResult {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'best', 'awesome'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'poor', 'sad', 'angry', 'disappointing'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) score++;
    if (negativeWords.some(nw => word.includes(nw))) score--;
  });
  
  if (score > 0) return { label: 'POSITIVE', score: Math.min(score * 20, 80), confidence: 'Medium' };
  if (score < 0) return { label: 'NEGATIVE', score: Math.min(Math.abs(score) * 20, 80), confidence: 'Medium' };
  return { label: 'NEUTRAL', score: 50, confidence: 'Low' };
}

export async function summarizeText(text: string, maxLength = 150): Promise<string> {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  
  if (!apiKey || text.length < 100) {
    // Simple extractive summary for short texts
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    return sentences.slice(0, 3).join('. ') + '.';
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text.slice(0, 1024),
          parameters: {
            max_length: maxLength,
            min_length: 30,
            do_sample: false
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data[0]?.summary_text) {
      return data[0].summary_text;
    }
    
    // Fallback
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    return sentences.slice(0, 3).join('. ') + '.';
  } catch (error) {
    console.error('HuggingFace summarization error:', error);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    return sentences.slice(0, 3).join('. ') + '.';
  }
}

// ============================================
// Combined Document Analysis
// ============================================

export interface DocumentAnalysisResult {
  grammar: {
    errorCount: number;
    errors: GrammarError[];
    correctedText?: string;
  };
  sentiment: SentimentResult;
  entities: EntityAnalysis;
  readability: {
    score: number;
    gradeLevel: string;
    readingTime: number;
  };
  stats: {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    paragraphCount: number;
  };
}

export async function analyzeDocument(text: string): Promise<DocumentAnalysisResult> {
  // Run all analyses in parallel
  const [grammarErrors, sentiment, entities] = await Promise.all([
    checkGrammar(text),
    analyzeSentiment(text),
    analyzeEntities(text)
  ]);

  // Calculate readability
  const words = text.trim().split(/\s+/).filter(w => w);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  const avgSyllablesPerWord = syllables / Math.max(words.length, 1);
  
  // Flesch-Kincaid Grade Level
  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  const gradeLevelLabel = gradeLevel < 6 ? 'Elementary' :
                          gradeLevel < 9 ? 'Middle School' :
                          gradeLevel < 12 ? 'High School' :
                          gradeLevel < 16 ? 'College' : 'Graduate';

  return {
    grammar: {
      errorCount: grammarErrors.length,
      errors: grammarErrors,
      correctedText: grammarErrors.length > 0 ? await autoCorrectGrammar(text) : undefined
    },
    sentiment,
    entities,
    readability: {
      score: Math.max(0, Math.min(100, Math.round(fleschScore))),
      gradeLevel: gradeLevelLabel,
      readingTime: Math.ceil(words.length / 200)
    },
    stats: {
      wordCount: words.length,
      charCount: text.length,
      sentenceCount: sentences.length,
      paragraphCount: text.split(/\n\n+/).filter(p => p.trim()).length
    }
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;
  
  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevWasVowel) count++;
    prevWasVowel = isVowel;
  }
  
  // Adjust for silent e
  if (word.endsWith('e') && count > 1) count--;
  
  return Math.max(1, count);
}

// ============================================
// Export Enhanced Groq Functions
// ============================================

export async function groqComplete(
  prompt: string,
  systemPrompt?: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = groqLoadBalancer.getNextKey();
  
  if (!apiKey) {
    throw new Error('No Groq API keys available');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      groqLoadBalancer.reportError(apiKey);
      throw new Error(`Groq API error: ${response.status}`);
    }

    groqLoadBalancer.reportSuccess(apiKey);
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    groqLoadBalancer.reportError(apiKey);
    
    // Try fallback with another key
    const fallbackKey = groqLoadBalancer.getNextKey();
    if (fallbackKey && fallbackKey !== apiKey) {
      console.log('🔄 Attempting fallback with another Groq key...');
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fallbackKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ],
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 2048,
          }),
        });

        if (response.ok) {
          groqLoadBalancer.reportSuccess(fallbackKey);
          const data = await response.json();
          return data.choices[0]?.message?.content || '';
        }
      } catch (fallbackError) {
        groqLoadBalancer.reportError(fallbackKey);
      }
    }
    
    throw error;
  }
}

export async function* groqStreamComplete(
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  const apiKey = groqLoadBalancer.getNextKey();
  
  if (!apiKey) {
    throw new Error('No Groq API keys available');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      groqLoadBalancer.reportError(apiKey);
      throw new Error(`Groq API error: ${response.status}`);
    }

    groqLoadBalancer.reportSuccess(apiKey);
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

      for (const line of lines) {
        const data = line.replace('data: ', '').trim();
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } catch (error) {
    groqLoadBalancer.reportError(apiKey);
    throw error;
  }
}

// Export load balancer stats for monitoring
export function getGroqStats() {
  return groqLoadBalancer.getStats();
}
