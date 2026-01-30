// components/AuthGuard.tsx
// Protects routes from unauthenticated access

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthGuardProps {
    children: React.ReactNode;
    requireOnboarding?: boolean; // If true, redirects to onboarding if not complete
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireOnboarding = false }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn("AuthGuard: Authentication check timed out after 4s. Network slow?");
                setLoading(false);
            }
        }, 4000);

        const checkOnboardingStatus = async (sessionUser: User) => {
            // Optimization: Check metadata first
            if (sessionUser.user_metadata?.onboarding_complete === true) {
                if (mounted) setOnboardingComplete(true);
                return;
            }

            try {
                // Fallback to DB check
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('onboarding_complete')
                    .eq('id', sessionUser.id)
                    .maybeSingle();

                if (error) {
                    console.warn("AuthGuard: Profile fetch error", error);
                    // Don't fail auth just because profile check failed, but onboarding check might be false
                }

                if (mounted) {
                    setOnboardingComplete(profile?.onboarding_complete ?? false);
                }
            } catch (err) {
                console.error("AuthGuard: Profile check exception", err);
            }
        };

        const initAuth = async () => {
            try {
                // 1. Get initial session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (mounted) {
                    setUser(session?.user ?? null);
                    if (session?.user && requireOnboarding) {
                        await checkOnboardingStatus(session.user);
                    }
                }
            } catch (err) {
                console.error("AuthGuard: Initial session check failed", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        // Run initial check
        initAuth();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!mounted) return;

                setUser(session?.user ?? null);

                if (session?.user && requireOnboarding) {
                    await checkOnboardingStatus(session.user);
                } else {
                    setOnboardingComplete(null);
                }

                setLoading(false);
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [requireOnboarding]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400 text-sm">Authenticating...</span>
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to auth
    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Authenticated but needs onboarding (for dashboard routes)
    if (requireOnboarding && onboardingComplete === false) {
        return <Navigate to="/onboarding/step-1" replace />;
    }

    // Authenticated and onboarding check passed
    return <>{children}</>;
};

export default AuthGuard;
