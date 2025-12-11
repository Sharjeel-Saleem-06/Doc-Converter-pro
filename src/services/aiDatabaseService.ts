/**
 * AI Database Service
 * Handles all AI-related database operations with Supabase
 */

import { supabase } from '@/lib/supabase';

// ==================== Types ====================

export interface AIUsageRecord {
    id?: string;
    user_id?: string;
    session_id?: string;
    operation_type: string;
    input_text?: string;
    input_length?: number;
    output_text?: string;
    output_length?: number;
    model_used?: string;
    tokens_used?: number;
    processing_time_ms?: number;
    success?: boolean;
    error_message?: string;
    metadata?: Record<string, any>;
}

export interface AIPreferences {
    id?: string;
    user_id?: string;
    default_language: string;
    preferred_tone: string;
    preferred_style: string;
    auto_suggestions_enabled: boolean;
    readability_alerts_enabled: boolean;
    seo_tips_enabled: boolean;
    streaming_enabled: boolean;
    default_template_category: string;
    custom_prompts: any[];
    favorite_templates: string[];
    settings: Record<string, any>;
}

export interface SavedPrompt {
    id?: string;
    user_id?: string;
    name: string;
    description?: string;
    prompt_text: string;
    category: string;
    system_prompt?: string;
    variables?: any[];
    is_favorite: boolean;
    use_count: number;
}

export interface ChatConversation {
    id?: string;
    user_id?: string;
    title: string;
    model_used: string;
    total_messages: number;
    total_tokens: number;
    is_archived: boolean;
    metadata?: Record<string, any>;
}

export interface ChatMessage {
    id?: string;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens_used?: number;
    metadata?: Record<string, any>;
}

export interface CustomStyle {
    id?: string;
    user_id?: string;
    name: string;
    description?: string;
    icon: string;
    system_prompt: string;
    example_text?: string;
    is_default: boolean;
    use_count: number;
}

export interface DailyUsage {
    total_requests: number;
    total_tokens: number;
    grammar_count: number;
    rewrite_count: number;
    generate_count: number;
    translate_count: number;
    analyze_count: number;
    chat_count: number;
}

export interface AIStats {
    total_requests: number;
    total_tokens: number;
    total_grammar: number;
    total_rewrites: number;
    total_generates: number;
    total_translates: number;
    total_analyzes: number;
    total_chats: number;
    days_active: number;
}

// ==================== Session Management ====================

let sessionId: string | null = null;

function getSessionId(): string {
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return sessionId;
}

// ==================== Usage Tracking ====================

/**
 * Log AI usage to database
 */
export async function logAIUsage(record: AIUsageRecord): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Skip if not logged in

        const { error } = await supabase.from('ai_usage_history').insert({
            ...record,
            user_id: user.id,
            session_id: getSessionId(),
        });

        if (error) {
            console.error('Failed to log AI usage:', error);
        }
    } catch (error) {
        console.error('Error logging AI usage:', error);
    }
}

/**
 * Get usage history for current user
 */
export async function getUsageHistory(limit: number = 50): Promise<AIUsageRecord[]> {
    try {
        const { data, error } = await supabase
            .from('ai_usage_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching usage history:', error);
        return [];
    }
}

/**
 * Check daily usage limit
 */
export async function checkDailyLimit(limit: number = 100): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('check_ai_daily_limit', {
            p_user_id: (await supabase.auth.getUser()).data.user?.id,
            p_limit: limit,
        });

        if (error) throw error;
        return data ?? true;
    } catch (error) {
        console.error('Error checking daily limit:', error);
        return true; // Allow if check fails
    }
}

/**
 * Get daily usage stats
 */
export async function getDailyUsage(): Promise<DailyUsage | null> {
    try {
        const { data, error } = await supabase
            .from('ai_daily_usage')
            .select('*')
            .eq('date', new Date().toISOString().split('T')[0])
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Error fetching daily usage:', error);
        return null;
    }
}

/**
 * Get overall AI stats
 */
export async function getAIStats(): Promise<AIStats | null> {
    try {
        const { data, error } = await supabase.rpc('get_user_ai_stats', {
            p_user_id: (await supabase.auth.getUser()).data.user?.id,
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching AI stats:', error);
        return null;
    }
}

// ==================== Preferences ====================

/**
 * Get user AI preferences
 */
export async function getPreferences(): Promise<AIPreferences | null> {
    try {
        const { data, error } = await supabase
            .from('ai_user_preferences')
            .select('*')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Error fetching preferences:', error);
        return null;
    }
}

/**
 * Save user AI preferences
 */
export async function savePreferences(prefs: Partial<AIPreferences>): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('ai_user_preferences')
            .upsert({
                user_id: user.id,
                ...prefs,
            }, { onConflict: 'user_id' });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error saving preferences:', error);
        return false;
    }
}

// ==================== Saved Prompts ====================

/**
 * Get saved prompts
 */
export async function getSavedPrompts(category?: string): Promise<SavedPrompt[]> {
    try {
        let query = supabase.from('ai_saved_prompts').select('*').order('is_favorite', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching saved prompts:', error);
        return [];
    }
}

/**
 * Save a prompt
 */
export async function savePrompt(prompt: Omit<SavedPrompt, 'id' | 'user_id'>): Promise<string | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('ai_saved_prompts')
            .insert({
                user_id: user.id,
                ...prompt,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data?.id || null;
    } catch (error) {
        console.error('Error saving prompt:', error);
        return null;
    }
}

/**
 * Delete a prompt
 */
export async function deletePrompt(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('ai_saved_prompts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting prompt:', error);
        return false;
    }
}

/**
 * Toggle prompt favorite
 */
export async function togglePromptFavorite(id: string, isFavorite: boolean): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('ai_saved_prompts')
            .update({ is_favorite: isFavorite })
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error toggling favorite:', error);
        return false;
    }
}

// ==================== Chat Conversations ====================

/**
 * Get chat conversations
 */
export async function getConversations(includeArchived: boolean = false): Promise<ChatConversation[]> {
    try {
        let query = supabase
            .from('ai_chat_conversations')
            .select('*')
            .order('updated_at', { ascending: false });

        if (!includeArchived) {
            query = query.eq('is_archived', false);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
}

/**
 * Create a new conversation
 */
export async function createConversation(title: string = 'New Conversation'): Promise<string | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('ai_chat_conversations')
            .insert({
                user_id: user.id,
                title,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data?.id || null;
    } catch (error) {
        console.error('Error creating conversation:', error);
        return null;
    }
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
        const { data, error } = await supabase
            .from('ai_chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

/**
 * Add message to conversation
 */
export async function addMessage(message: ChatMessage): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('ai_chat_messages')
            .insert(message)
            .select('id')
            .single();

        if (error) throw error;

        // Update conversation
        await supabase
            .from('ai_chat_conversations')
            .update({
                total_messages: supabase.rpc('increment_by_one'),
                total_tokens: message.tokens_used || 0,
            })
            .eq('id', message.conversation_id);

        return data?.id || null;
    } catch (error) {
        console.error('Error adding message:', error);
        return null;
    }
}

/**
 * Delete conversation
 */
export async function deleteConversation(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('ai_chat_conversations')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting conversation:', error);
        return false;
    }
}

// ==================== Custom Styles ====================

/**
 * Get custom writing styles
 */
export async function getCustomStyles(): Promise<CustomStyle[]> {
    try {
        const { data, error } = await supabase
            .from('ai_custom_styles')
            .select('*')
            .order('is_default', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching custom styles:', error);
        return [];
    }
}

/**
 * Save custom style
 */
export async function saveCustomStyle(style: Omit<CustomStyle, 'id' | 'user_id'>): Promise<string | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('ai_custom_styles')
            .insert({
                user_id: user.id,
                ...style,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data?.id || null;
    } catch (error) {
        console.error('Error saving custom style:', error);
        return null;
    }
}

/**
 * Delete custom style
 */
export async function deleteCustomStyle(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('ai_custom_styles')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting custom style:', error);
        return false;
    }
}

// ==================== Template Usage ====================

/**
 * Log template usage
 */
export async function logTemplateUsage(
    templateId: string,
    templateName: string,
    templateCategory: string,
    fieldValues: Record<string, string>,
    generatedContent: string
): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('ai_template_usage').insert({
            user_id: user.id,
            template_id: templateId,
            template_name: templateName,
            template_category: templateCategory,
            field_values: fieldValues,
            generated_content: generatedContent,
        });
    } catch (error) {
        console.error('Error logging template usage:', error);
    }
}

/**
 * Rate template output
 */
export async function rateTemplateOutput(usageId: string, rating: number, feedback?: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('ai_template_usage')
            .update({ rating, feedback })
            .eq('id', usageId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error rating template:', error);
        return false;
    }
}

// ==================== Export ====================

export const aiDatabaseService = {
    // Usage
    logAIUsage,
    getUsageHistory,
    checkDailyLimit,
    getDailyUsage,
    getAIStats,
    // Preferences
    getPreferences,
    savePreferences,
    // Prompts
    getSavedPrompts,
    savePrompt,
    deletePrompt,
    togglePromptFavorite,
    // Conversations
    getConversations,
    createConversation,
    getConversationMessages,
    addMessage,
    deleteConversation,
    // Styles
    getCustomStyles,
    saveCustomStyle,
    deleteCustomStyle,
    // Templates
    logTemplateUsage,
    rateTemplateOutput,
};

export default aiDatabaseService;
