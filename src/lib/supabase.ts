import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Validate URL format
const isValidUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
};

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)) {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase connected:', supabaseUrl);
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
    }
} else {
    if (!supabaseUrl) {
        console.warn('⚠️ VITE_SUPABASE_URL not found in .env');
    } else if (!isValidUrl(supabaseUrl)) {
        console.warn('⚠️ VITE_SUPABASE_URL is invalid. Must be like: https://xxxxx.supabase.co');
        console.warn('   Current value:', supabaseUrl);
    }
    if (!supabaseAnonKey) {
        console.warn('⚠️ VITE_SUPABASE_ANON_KEY not found in .env');
    }
    console.warn('⚠️ Supabase features disabled. App will work without database sync.');
}

export { supabase };

// ============================================
// TypeScript Interfaces
// ============================================

export interface User {
    id: string;
    clerk_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    provider: string;
    created_at: string;
    updated_at: string;
    last_sign_in: string;
}

export interface ConversionHistory {
    id: string;
    user_id: string;
    clerk_id: string;
    file_name: string;
    file_size: number;
    source_format: string;
    target_format: string;
    status: 'completed' | 'failed' | 'processing';
    error_message: string | null;
    created_at: string;
}

export interface UserSettings {
    id: string;
    user_id: string;
    clerk_id: string;
    theme: 'light' | 'dark' | 'system';
    language: string;
    auto_download: boolean;
    email_notifications: boolean;
}

// ============================================
// User Operations
// ============================================

/**
 * Create or update user in Supabase when they sign in via Clerk
 */
export async function syncUserFromClerk(clerkUser: {
    id: string;
    emailAddresses: { emailAddress: string }[];
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    imageUrl: string | null;
    externalAccounts?: { provider: string }[];
}): Promise<User | null> {
    if (!supabase) {
        console.log('⚠️ Supabase not initialized - skipping user sync');
        return null;
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const provider = clerkUser.externalAccounts?.[0]?.provider || 'email';

    try {
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_id', clerkUser.id)
            .single();

        if (existingUser) {
            // Update existing user
            const { data, error } = await supabase
                .from('users')
                .update({
                    email,
                    first_name: clerkUser.firstName,
                    last_name: clerkUser.lastName,
                    full_name: clerkUser.fullName,
                    avatar_url: clerkUser.imageUrl,
                    provider,
                    last_sign_in: new Date().toISOString(),
                })
                .eq('clerk_id', clerkUser.id)
                .select()
                .single();

            if (error) throw error;
            console.log('✅ User updated in Supabase:', data?.email);
            return data;
        } else {
            // Create new user
            const { data, error } = await supabase
                .from('users')
                .insert({
                    clerk_id: clerkUser.id,
                    email,
                    first_name: clerkUser.firstName,
                    last_name: clerkUser.lastName,
                    full_name: clerkUser.fullName,
                    avatar_url: clerkUser.imageUrl,
                    provider,
                })
                .select()
                .single();

            if (error) throw error;
            console.log('✅ New user created in Supabase:', data?.email);
            return data;
        }
    } catch (error) {
        console.error('❌ Error syncing user to Supabase:', error);
        return null;
    }
}

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkId: string): Promise<User | null> {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_id', clerkId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// ============================================
// Conversion History Operations
// ============================================

/**
 * Add a conversion to history
 */
export async function addConversionHistory(
    clerkId: string,
    conversion: {
        fileName: string;
        fileSize: number;
        sourceFormat: string;
        targetFormat: string;
        status?: 'completed' | 'failed' | 'processing';
        errorMessage?: string;
    }
): Promise<ConversionHistory | null> {
    if (!supabase) {
        console.log('⚠️ Supabase not initialized - skipping history save');
        return null;
    }

    try {
        const user = await getUserByClerkId(clerkId);

        const { data, error } = await supabase
            .from('conversion_history')
            .insert({
                user_id: user?.id,
                clerk_id: clerkId,
                file_name: conversion.fileName,
                file_size: conversion.fileSize,
                source_format: conversion.sourceFormat.toLowerCase(),
                target_format: conversion.targetFormat.toLowerCase(),
                status: conversion.status || 'completed',
                error_message: conversion.errorMessage,
            })
            .select()
            .single();

        if (error) throw error;
        console.log('✅ Conversion history added:', conversion.fileName);
        return data;
    } catch (error) {
        console.error('❌ Error adding conversion history:', error);
        return null;
    }
}

/**
 * Get conversion history for a user
 */
export async function getConversionHistory(
    clerkId: string,
    limit: number = 50
): Promise<ConversionHistory[]> {
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from('conversion_history')
            .select('*')
            .eq('clerk_id', clerkId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching conversion history:', error);
        return [];
    }
}

/**
 * Delete a conversion history record
 */
export async function deleteConversionHistory(
    id: string,
    clerkId: string
): Promise<boolean> {
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('conversion_history')
            .delete()
            .eq('id', id)
            .eq('clerk_id', clerkId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting conversion history:', error);
        return false;
    }
}

/**
 * Clear all conversion history for a user
 */
export async function clearConversionHistory(clerkId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('conversion_history')
            .delete()
            .eq('clerk_id', clerkId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error clearing conversion history:', error);
        return false;
    }
}

/**
 * Get conversion statistics for a user
 */
export async function getConversionStats(clerkId: string): Promise<{
    totalConversions: number;
    totalFilesSize: number;
    recentConversions: ConversionHistory[];
}> {
    if (!supabase) {
        return { totalConversions: 0, totalFilesSize: 0, recentConversions: [] };
    }

    try {
        const { data, error } = await supabase
            .from('conversion_history')
            .select('*')
            .eq('clerk_id', clerkId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const conversions = data || [];
        const totalConversions = conversions.length;
        const totalFilesSize = conversions.reduce((sum, c) => sum + (c.file_size || 0), 0);
        const recentConversions = conversions.slice(0, 5);

        return { totalConversions, totalFilesSize, recentConversions };
    } catch (error) {
        console.error('Error fetching conversion stats:', error);
        return { totalConversions: 0, totalFilesSize: 0, recentConversions: [] };
    }
}

// ============================================
// User Settings Operations
// ============================================

/**
 * Get user settings
 */
export async function getUserSettings(clerkId: string): Promise<UserSettings | null> {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('clerk_id', clerkId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Error fetching user settings:', error);
        return null;
    }
}

/**
 * Update user settings
 */
export async function updateUserSettings(
    clerkId: string,
    settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'clerk_id'>>
): Promise<UserSettings | null> {
    if (!supabase) return null;

    try {
        const existing = await getUserSettings(clerkId);
        const user = await getUserByClerkId(clerkId);

        if (existing) {
            const { data, error } = await supabase
                .from('user_settings')
                .update(settings)
                .eq('clerk_id', clerkId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('user_settings')
                .insert({
                    user_id: user?.id,
                    clerk_id: clerkId,
                    ...settings,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Error updating user settings:', error);
        return null;
    }
}

// ============================================
// Export all operations
// ============================================

export const db = {
    syncUserFromClerk,
    getUserByClerkId,
    addConversionHistory,
    getConversionHistory,
    deleteConversionHistory,
    clearConversionHistory,
    getConversionStats,
    getUserSettings,
    updateUserSettings,
};

export default db;
