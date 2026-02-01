
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

// Keys for query caching
export const authKeys = {
    session: ['session'] as const,
    profile: (userId: string | undefined) => ['profile', userId] as const,
};

// Hook to get current session
export function useSession() {
    return useQuery({
        queryKey: authKeys.session,
        queryFn: async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session;
        },
        // Session is valid until explicitly invalidated or auth state changes
        staleTime: Infinity,
    });
}

// Hook to get user profile (specifically for onboarding status)
export function useProfile(userId: string | undefined) {
    return useQuery({
        queryKey: authKeys.profile(userId),
        queryFn: async () => {
            if (!userId) return null;

            // Optimization: we could check user metadata here first if we passed the user object
            // But for cleanliness/SSOT, we stick to DB or check inside component

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!userId, // Only fetch if we have a user ID
        retry: 2,
        staleTime: 1000 * 60 * 10, // Profile data effectively static for this session
    });
}

// Hook to listen to auth changes
export function useAuthListener() {
    const queryClient = useQueryClient();

    useQueryClientEffect(queryClient);
}

function useQueryClientEffect(queryClient: any) {
    // Set up singleton listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // console.log('Auth State Change:', event, session?.user?.id);

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED' as any) {
            // Clear all data
            queryClient.clear();
            // Redirect to Auth if not already there (handled by Router usually, but we force it)
            if (!window.location.pathname.startsWith('/auth')) {
                window.location.href = '/auth';
            }
        }
        else if (event === 'TOKEN_REFRESH_BROKEN' as any) {
            // Refresh failed (likely revoked or expired max age)
            console.error('Token refresh failed. Redirecting to login.');
            queryClient.clear();
            window.location.href = '/auth';
        }
        else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Invalidate session query to ensure fresh data
            queryClient.invalidateQueries({ queryKey: authKeys.session });
            queryClient.invalidateQueries({ queryKey: authKeys.profile(session?.user.id) });
        }
    });

    return () => {
        subscription.unsubscribe();
    };
}
