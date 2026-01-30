// components/AuthGuard.tsx
// Protects routes from unauthenticated access
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useSession, useProfile, authKeys } from '../hooks/useAuth';

interface AuthGuardProps {
    children: React.ReactNode;
    requireOnboarding?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireOnboarding = false }) => {
    const location = useLocation();
    const queryClient = useQueryClient();

    // 1. Get Session
    const {
        data: session,
        isLoading: isSessionLoading,
        error: sessionError
    } = useSession();

    // 2. Get Profile (logic dependent on session)
    const userId = session?.user?.id;
    const {
        data: profile,
        isLoading: isProfileLoading
    } = useProfile(userId);

    // 3. Setup global auth listener (could be moved to App.tsx)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Update query cache when auth state changes
            if (event === 'SIGNED_OUT') {
                queryClient.setQueryData(authKeys.session, null);
                queryClient.removeQueries({ queryKey: ['profile'] });
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                queryClient.setQueryData(authKeys.session, session);
                queryClient.invalidateQueries({ queryKey: authKeys.session });
                if (session?.user) {
                    queryClient.invalidateQueries({ queryKey: authKeys.profile(session.user.id) });
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    // Loading State
    if (isSessionLoading || (requireOnboarding && userId && isProfileLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400 text-sm">
                        {isSessionLoading ? "Authenticating..." : "Checking access..."}
                    </span>
                </div>
            </div>
        );
    }

    // Auth Check
    if (!session?.user) {
        // Redirect if no session found
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Onboarding Check
    if (requireOnboarding) {
        // Optimistic check from metadata for speed
        if (session.user.user_metadata?.onboarding_complete === true) {
            return <>{children}</>;
        }

        // Database truth check
        const isProfileComplete = !!profile?.onboarding_complete;

        if (!isProfileComplete) {
            return <Navigate to="/onboarding/step-1" replace />;
        }
    }

    return <>{children}</>;
};

export default AuthGuard;
