// components/GuestGuard.tsx
// Protects public routes (Landing, Auth) from authenticated access
// Redirects logged-in users to Dashboard or Onboarding

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface GuestGuardProps {
    children: React.ReactNode;
}

const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
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

                if (session?.user) {
                    // Check if onboarding is complete
                    // First try metadata for speed
                    if (session.user.user_metadata?.onboarding_complete) {
                        setOnboardingComplete(true);
                    } else {
                        // Fallback to DB check
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('onboarding_complete')
                            .eq('id', session.user.id)
                            .single();

                        setOnboardingComplete(profile?.onboarding_complete ?? false);
                    }
                }
            } catch (error) {
                console.error('Auth check error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        // Optional: Show nothing or spinner while checking
        return null;
    }

    // If authenticated, redirect
    if (user) {
        // If we know onboarding status, route accordingly
        if (onboardingComplete === true) {
            return <Navigate to="/dashboard" replace />;
        } else if (onboardingComplete === false) {
            return <Navigate to="/onboarding/step-1" replace />;
        }
        // If status is still null but user exists (rare race condition), default to dashboard or wait? 
        // For safety, let's assume if we are here, we might just let them through or default dashboard.
        // But optimally we should have determined onboarding status. 
        // Let's default to dashboard if explicit check failed but user is logged in, 
        // OR wait for onboarding check. 
        // Simplified: If user is logged in, we generally want them IN the app.
        return <Navigate to="/dashboard" replace />;
    }

    // Not authenticated, allow access to public page
    return <>{children}</>;
};

export default GuestGuard;
