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
        // Check current session
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);

                if (session?.user && requireOnboarding) {
                    // Check if onboarding is complete
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('onboarding_complete')
                        .eq('id', session.user.id)
                        .single();

                    setOnboardingComplete(profile?.onboarding_complete ?? false);
                }
            } catch (error) {
                console.error('Auth check error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null);

                if (session?.user && requireOnboarding) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('onboarding_complete')
                        .eq('id', session.user.id)
                        .single();

                    setOnboardingComplete(profile?.onboarding_complete ?? false);
                }

                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [requireOnboarding]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
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
