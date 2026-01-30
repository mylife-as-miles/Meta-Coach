
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
                .select('onboarding_complete')
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

// Hook to listen to auth changes (this is still effect-based but integrates with query)
export function useAuthListener() {
    const queryClient = useQueryClient();

    // We don't return anything, just set up the listener
    // Typically called once in a top-level component or hook
    useQueryClientEffect(queryClient);
}

function useQueryClientEffect(queryClient: any) {
    // This logic could live in the provider or a dedicated hook
    // For now AuthGuard can handle the listener or we assume session check is enough
    // Ideally, we want Supabase's onAuthStateChange to invalidate queries

    // We'll implement this manually inside AuthGuard or App if needed, 
    // but standard react-query pattern often just relies on intervals or event invalidation
}
