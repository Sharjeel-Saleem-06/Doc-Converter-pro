import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { syncUserFromClerk, getUserByClerkId, User } from '@/lib/supabase';

/**
 * Hook to sync Clerk user with Supabase and get the database user
 */
export function useSupabaseUser() {
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const { isSignedIn } = useAuth();
    const [dbUser, setDbUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function syncUser() {
            if (!isClerkLoaded) return;

            if (!isSignedIn || !clerkUser) {
                setDbUser(null);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                // Sync user to Supabase (creates or updates)
                const syncedUser = await syncUserFromClerk({
                    id: clerkUser.id,
                    emailAddresses: clerkUser.emailAddresses.map(e => ({
                        emailAddress: e.emailAddress
                    })),
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    fullName: clerkUser.fullName,
                    imageUrl: clerkUser.imageUrl,
                    externalAccounts: clerkUser.externalAccounts?.map(a => ({
                        provider: a.provider
                    })),
                });

                setDbUser(syncedUser);
                setError(null);
            } catch (err) {
                console.error('Error syncing user:', err);
                setError(err instanceof Error ? err : new Error('Failed to sync user'));

                // Try to get existing user if sync failed
                try {
                    const existingUser = await getUserByClerkId(clerkUser.id);
                    setDbUser(existingUser);
                } catch {
                    setDbUser(null);
                }
            } finally {
                setIsLoading(false);
            }
        }

        syncUser();
    }, [clerkUser, isClerkLoaded, isSignedIn]);

    return {
        user: dbUser,
        clerkUser,
        isLoading,
        error,
        isSignedIn,
    };
}

export default useSupabaseUser;
