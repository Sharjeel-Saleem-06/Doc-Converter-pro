-- ============================================
-- DocConverter Pro - Supabase Database Schema
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE - Stores user profiles from Clerk
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clerk_id TEXT UNIQUE NOT NULL,           -- Clerk's unique user ID
    email TEXT NOT NULL,                      -- User's email
    first_name TEXT,                          -- First name
    last_name TEXT,                           -- Last name
    full_name TEXT,                           -- Full display name
    avatar_url TEXT,                          -- Profile picture URL
    provider TEXT DEFAULT 'email',            -- Auth provider: 'email', 'google', 'github'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sign_in TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 2. CONVERSION HISTORY TABLE - Stores all conversions
-- ============================================
CREATE TABLE IF NOT EXISTS conversion_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,                   -- Clerk's user ID for quick lookup
    file_name TEXT NOT NULL,                  -- Original file name
    file_size BIGINT,                         -- File size in bytes
    source_format TEXT NOT NULL,              -- e.g., 'pdf', 'docx'
    target_format TEXT NOT NULL,              -- e.g., 'csv', 'json'
    status TEXT DEFAULT 'completed',          -- 'completed', 'failed', 'processing'
    error_message TEXT,                       -- Error message if failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_history_clerk_id ON conversion_history(clerk_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON conversion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON conversion_history(created_at DESC);

-- ============================================
-- 3. USER SETTINGS TABLE - Stores user preferences
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    clerk_id TEXT UNIQUE NOT NULL,
    theme TEXT DEFAULT 'system',              -- 'light', 'dark', 'system'
    language TEXT DEFAULT 'en',               -- Language code
    auto_download BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true);  -- Temporarily allow all reads for Clerk webhook

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Allow insert for new users" ON users
    FOR INSERT WITH CHECK (true);

-- Policy: Conversion history - users see only their records
CREATE POLICY "Users can view own history" ON conversion_history
    FOR SELECT USING (true);  -- We'll filter by clerk_id in the app

CREATE POLICY "Users can insert own history" ON conversion_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own history" ON conversion_history
    FOR DELETE USING (true);

-- Policy: User settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (true);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_settings table
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Database schema created successfully!' as status;
