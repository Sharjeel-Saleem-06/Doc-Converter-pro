-- =====================================================
-- AI FEATURES DATABASE MIGRATION
-- Document Converter Pro - Advanced AI Features
-- Run this script in Supabase SQL Editor
-- =====================================================

-- 1. AI Usage History Table
-- Tracks all AI operations for analytics and history
CREATE TABLE IF NOT EXISTS ai_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    operation_type TEXT NOT NULL CHECK (operation_type IN (
        'grammar', 'rewrite', 'generate', 'summarize', 'analyze', 
        'expand', 'tone', 'continue', 'translate', 'paraphrase', 
        'humanize', 'seo_analyze', 'template_generate', 'chat', 'style_apply'
    )),
    input_text TEXT,
    input_length INTEGER,
    output_text TEXT,
    output_length INTEGER,
    model_used TEXT DEFAULT 'llama-3.3-70b-versatile',
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_operation ON ai_usage_history(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_session ON ai_usage_history(session_id);

-- 2. AI User Preferences Table
-- Stores user preferences for AI features
CREATE TABLE IF NOT EXISTS ai_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    default_language TEXT DEFAULT 'en',
    preferred_tone TEXT DEFAULT 'professional',
    preferred_style TEXT DEFAULT 'professional',
    auto_suggestions_enabled BOOLEAN DEFAULT true,
    readability_alerts_enabled BOOLEAN DEFAULT true,
    seo_tips_enabled BOOLEAN DEFAULT true,
    streaming_enabled BOOLEAN DEFAULT true,
    default_template_category TEXT DEFAULT 'business',
    custom_prompts JSONB DEFAULT '[]',
    favorite_templates TEXT[] DEFAULT '{}',
    blocked_suggestions TEXT[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI Saved Prompts Table
-- User's custom saved prompts
CREATE TABLE IF NOT EXISTS ai_saved_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    prompt_text TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    system_prompt TEXT,
    variables JSONB DEFAULT '[]',
    is_favorite BOOLEAN DEFAULT false,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_prompts_user ON ai_saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_category ON ai_saved_prompts(category);

-- 4. AI Document Analysis Cache Table
-- Caches document analysis results for performance
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT NOT NULL UNIQUE,
    analysis_type TEXT NOT NULL,
    result JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_hash ON ai_analysis_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires ON ai_analysis_cache(expires_at);

-- 5. AI Chat Conversations Table
-- Stores chat conversation history
CREATE TABLE IF NOT EXISTS ai_chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Conversation',
    model_used TEXT DEFAULT 'llama-3.3-70b-versatile',
    total_messages INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON ai_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_created ON ai_chat_conversations(created_at DESC);

-- 6. AI Chat Messages Table
-- Individual messages within conversations
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON ai_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_created ON ai_chat_messages(created_at);

-- 7. AI Templates Usage Table
-- Track template usage and effectiveness
CREATE TABLE IF NOT EXISTS ai_template_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    template_name TEXT NOT NULL,
    template_category TEXT NOT NULL,
    field_values JSONB DEFAULT '{}',
    generated_content TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_usage_user ON ai_template_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_template ON ai_template_usage(template_id);

-- 8. AI Writing Styles Table
-- Custom user writing styles/brand voices
CREATE TABLE IF NOT EXISTS ai_custom_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '✨',
    system_prompt TEXT NOT NULL,
    example_text TEXT,
    is_default BOOLEAN DEFAULT false,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_styles_user ON ai_custom_styles(user_id);

-- 9. Daily Usage Limits Table
-- For rate limiting free tier users
CREATE TABLE IF NOT EXISTS ai_daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    grammar_count INTEGER DEFAULT 0,
    rewrite_count INTEGER DEFAULT 0,
    generate_count INTEGER DEFAULT 0,
    translate_count INTEGER DEFAULT 0,
    analyze_count INTEGER DEFAULT 0,
    chat_count INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON ai_daily_usage(user_id, date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE ai_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_saved_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_custom_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_daily_usage ENABLE ROW LEVEL SECURITY;

-- AI Usage History - Users can only view their own history
CREATE POLICY "Users can view own AI usage" ON ai_usage_history
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI usage" ON ai_usage_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Preferences - Users manage their own preferences
CREATE POLICY "Users manage own preferences" ON ai_user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Saved Prompts - Users manage their own prompts
CREATE POLICY "Users manage own prompts" ON ai_saved_prompts
    FOR ALL USING (auth.uid() = user_id);

-- Chat Conversations - Users manage their own conversations
CREATE POLICY "Users manage own conversations" ON ai_chat_conversations
    FOR ALL USING (auth.uid() = user_id);

-- Chat Messages - Through conversation ownership
CREATE POLICY "Users view own chat messages" ON ai_chat_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM ai_chat_conversations WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users insert own chat messages" ON ai_chat_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM ai_chat_conversations WHERE user_id = auth.uid()
        )
    );

-- Template Usage - Users view their own usage
CREATE POLICY "Users manage own template usage" ON ai_template_usage
    FOR ALL USING (auth.uid() = user_id);

-- Custom Styles - Users manage their own styles
CREATE POLICY "Users manage own styles" ON ai_custom_styles
    FOR ALL USING (auth.uid() = user_id);

-- Daily Usage - Users view their own limits
CREATE POLICY "Users manage own daily usage" ON ai_daily_usage
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_ai_usage_history_updated_at
    BEFORE UPDATE ON ai_usage_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_user_preferences_updated_at
    BEFORE UPDATE ON ai_user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_saved_prompts_updated_at
    BEFORE UPDATE ON ai_saved_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_chat_conversations_updated_at
    BEFORE UPDATE ON ai_chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_custom_styles_updated_at
    BEFORE UPDATE ON ai_custom_styles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment daily usage
CREATE OR REPLACE FUNCTION increment_daily_ai_usage(
    p_user_id UUID,
    p_operation TEXT,
    p_tokens INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO ai_daily_usage (user_id, date, total_requests, total_tokens)
    VALUES (p_user_id, CURRENT_DATE, 1, p_tokens)
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_requests = ai_daily_usage.total_requests + 1,
        total_tokens = ai_daily_usage.total_tokens + p_tokens,
        grammar_count = CASE WHEN p_operation = 'grammar' THEN ai_daily_usage.grammar_count + 1 ELSE ai_daily_usage.grammar_count END,
        rewrite_count = CASE WHEN p_operation = 'rewrite' THEN ai_daily_usage.rewrite_count + 1 ELSE ai_daily_usage.rewrite_count END,
        generate_count = CASE WHEN p_operation = 'generate' THEN ai_daily_usage.generate_count + 1 ELSE ai_daily_usage.generate_count END,
        translate_count = CASE WHEN p_operation = 'translate' THEN ai_daily_usage.translate_count + 1 ELSE ai_daily_usage.translate_count END,
        analyze_count = CASE WHEN p_operation = 'analyze' THEN ai_daily_usage.analyze_count + 1 ELSE ai_daily_usage.analyze_count END,
        chat_count = CASE WHEN p_operation = 'chat' THEN ai_daily_usage.chat_count + 1 ELSE ai_daily_usage.chat_count END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is within daily limits
CREATE OR REPLACE FUNCTION check_ai_daily_limit(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
BEGIN
    SELECT total_requests INTO current_usage
    FROM ai_daily_usage
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    
    IF current_usage IS NULL THEN
        RETURN TRUE;
    END IF;
    
    RETURN current_usage < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user AI statistics
CREATE OR REPLACE FUNCTION get_user_ai_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_requests', COALESCE(SUM(total_requests), 0),
        'total_tokens', COALESCE(SUM(total_tokens), 0),
        'total_grammar', COALESCE(SUM(grammar_count), 0),
        'total_rewrites', COALESCE(SUM(rewrite_count), 0),
        'total_generates', COALESCE(SUM(generate_count), 0),
        'total_translates', COALESCE(SUM(translate_count), 0),
        'total_analyzes', COALESCE(SUM(analyze_count), 0),
        'total_chats', COALESCE(SUM(chat_count), 0),
        'days_active', COUNT(DISTINCT date)
    ) INTO result
    FROM ai_daily_usage
    WHERE user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_analysis_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View for AI usage analytics (admin only)
CREATE OR REPLACE VIEW ai_usage_analytics AS
SELECT 
    DATE(created_at) as date,
    operation_type,
    COUNT(*) as request_count,
    AVG(processing_time_ms) as avg_processing_time,
    SUM(tokens_used) as total_tokens,
    COUNT(CASE WHEN success THEN 1 END) as success_count,
    COUNT(CASE WHEN NOT success THEN 1 END) as error_count
FROM ai_usage_history
GROUP BY DATE(created_at), operation_type
ORDER BY date DESC;

-- =====================================================
-- SAMPLE DATA (OPTIONAL - for testing)
-- =====================================================

-- Uncomment below to insert sample data for testing
/*
INSERT INTO ai_user_preferences (user_id, default_language, preferred_tone)
VALUES 
    (auth.uid(), 'en', 'professional');

INSERT INTO ai_saved_prompts (user_id, name, description, prompt_text, category)
VALUES
    (auth.uid(), 'Professional Email', 'Write a formal business email', 'Write a professional email about: {topic}', 'business'),
    (auth.uid(), 'Blog Intro', 'Catchy blog introduction', 'Write an engaging introduction for a blog post about: {topic}', 'creative');
*/

-- =====================================================
-- GRANTS (if needed for service role)
-- =====================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION increment_daily_ai_usage TO authenticated;
GRANT EXECUTE ON FUNCTION check_ai_daily_limit TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ai_stats TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'AI Features Database Migration completed successfully!';
    RAISE NOTICE 'Tables created: 9';
    RAISE NOTICE 'Functions created: 5';
    RAISE NOTICE 'RLS policies enabled for all tables';
END $$;
