// hooks/useDashboardQueries.ts
// TanStack Query hooks for all dashboard server state

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Player, Match, matches as mockMatches, players as mockPlayers } from '../lib/mockData';

// ============================================
// Query Keys
// ============================================
export const dashboardKeys = {
    all: ['dashboard'] as const,
    workspace: (userId: string | undefined) => [...dashboardKeys.all, 'workspace', userId] as const,
    userProfile: (userId: string | undefined) => [...dashboardKeys.all, 'userProfile', userId] as const,
    teamProfile: (workspaceId: string | undefined) => [...dashboardKeys.all, 'teamProfile', workspaceId] as const,
    players: (workspaceId: string | undefined) => [...dashboardKeys.all, 'players', workspaceId] as const,
    matches: (gridTeamId: string | undefined) => [...dashboardKeys.all, 'matches', gridTeamId] as const,
    aiCalibration: (workspaceId: string | undefined) => [...dashboardKeys.all, 'aiCalibration', workspaceId] as const,
};

// ============================================
// Helper: Invoke Edge Function with Timeout
// ============================================
async function invokeWithTimeout<T>(
    functionName: string,
    body: any,
    timeoutMs: number = 10000
): Promise<{ data: T | null; error: any }> {
    const invokePromise = supabase.functions.invoke(functionName, { body });
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${functionName} timeout after ${timeoutMs}ms`)), timeoutMs)
    );

    try {
        const result = await Promise.race([invokePromise, timeoutPromise]);
        return result as { data: T | null; error: any };
    } catch (error) {
        console.warn(`Edge function ${functionName} failed:`, error);
        return { data: null, error };
    }
}

// ============================================
// Hook: useWorkspace
// ============================================
export function useWorkspace(userId: string | undefined) {
    return useQuery({
        queryKey: dashboardKeys.workspace(userId),
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

// ============================================
// Hook: useUserProfile
// ============================================
export function useUserProfile(userId: string | undefined) {
    return useQuery({
        queryKey: dashboardKeys.userProfile(userId),
        queryFn: async () => {
            if (!userId) return null;

            // First get basic user info from auth
            const { data: { user } } = await supabase.auth.getUser();

            // Then get profile data
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.warn('Profile fetch error:', error);
            }

            return {
                id: userId,
                name: profileData?.full_name || profileData?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Coach',
                email: user?.email || '',
                avatar: profileData?.avatar_url || user?.user_metadata?.avatar_url,
                role: profileData?.role || 'Coach',
                bio: profileData?.bio,
                location: profileData?.location,
                languages: profileData?.languages,
                created_at: user?.created_at,
            };
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

// ============================================
// Hook: useTeamProfile (combines workspace + GRID team + AI calibration)
// ============================================
export function useTeamProfile(workspaceId: string | undefined, gridTeamId: string | undefined) {
    return useQuery({
        queryKey: dashboardKeys.teamProfile(workspaceId),
        queryFn: async () => {
            if (!workspaceId) return null;

            // Get workspace data first
            const { data: workspace } = await supabase
                .from('workspaces')
                .select('*')
                .eq('id', workspaceId)
                .single();

            // Get AI Calibration
            const { data: aiData } = await supabase
                .from('ai_calibration')
                .select('*')
                .eq('workspace_id', workspaceId)
                .maybeSingle();

            // Get GRID team data if available
            let gridTeamData: { teamName?: string; region?: string; logoUrl?: string } = {};
            if (gridTeamId) {
                const { data: gridRes } = await invokeWithTimeout<any>('grid-teams', { teamId: gridTeamId });
                if (gridRes?.team) {
                    gridTeamData = {
                        teamName: gridRes.team.name,
                        region: 'Global',
                        logoUrl: gridRes.team.logoUrl,
                    };
                }
            }

            return {
                teamName: gridTeamData.teamName || workspace?.team_name,
                region: gridTeamData.region || 'Global',
                game: workspace?.game_title,
                logoUrl: gridTeamData.logoUrl || null,
                ...aiData,
            };
        },
        enabled: !!workspaceId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

// ============================================
// Hook: usePlayers (roster)
// ============================================
export function usePlayers(workspaceId: string | undefined) {
    return useQuery({
        queryKey: dashboardKeys.players(workspaceId),
        queryFn: async (): Promise<Player[]> => {
            if (!workspaceId) return mockPlayers;

            const { data: roster, error } = await supabase
                .from('roster')
                .select('*')
                .eq('workspace_id', workspaceId);

            if (error || !roster || roster.length === 0) {
                console.log('No roster found, using mock data');
                return mockPlayers;
            }

            return roster.map((p, index) => {
                const defaultStats = { mechanics: 80, objectives: 80, macro: 80, vision: 80, teamwork: 80, mental: 80 };
                return {
                    id: p.id,
                    name: p.ign || `Player ${index + 1}`,
                    role: p.role as any,
                    overall: Math.floor((p.readiness_score + p.synergy_score) / 2) || 85,
                    stats: defaultStats,
                    synergy: p.synergy_score ?? 85,
                    readiness: p.readiness_score ?? 90,
                    avatar: p.metadata?.imageUrl || null,
                    isActive: p.is_active ?? true,
                };
            });
        },
        enabled: !!workspaceId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: mockPlayers, // Show mock data while loading
    });
}

// ============================================
// Hook: useMatches
// ============================================
export function useMatches(gridTeamId: string | undefined, gameTitle: string = 'Esports', teamName: string = 'Team') {
    return useQuery({
        queryKey: dashboardKeys.matches(gridTeamId),
        queryFn: async (): Promise<Match[]> => {
            if (!gridTeamId) {
                console.log('No grid team ID, using mock matches');
                return mockMatches;
            }

            const { data: matchesData, error } = await invokeWithTimeout<any>('team-matches', {
                teamId: gridTeamId,
                game: gameTitle,
                teamName: teamName
            });

            if (error || !matchesData?.matches) {
                console.warn('Matches fetch failed, using mock data');
                return mockMatches;
            }

            return matchesData.matches.map((m: any) => ({
                id: m.id,
                date: new Date(m.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                duration: m.status === 'scheduled' ? 'TBD' : (m.duration || '35:00'),
                result: m.result || (m.status === 'scheduled' ? 'UPCOMING' : 'UNKNOWN'),
                score: m.score || '0 - 0',
                format: m.format || 'Bo1',
                type: m.type || 'Ranked',
                opponent: {
                    name: m.opponent?.name || 'Unknown',
                    abbreviation: m.opponent?.abbreviation || (m.opponent?.name || 'UNK').substring(0, 3).toUpperCase(),
                    color: 'red',
                },
                performance: { macroControl: 50, microErrorRate: 'MED' },
            }));
        },
        enabled: true, // Always enabled, will use mock if no gridTeamId
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: mockMatches,
    });
}

// ============================================
// Mutation: Update User Profile
// ============================================
export function useUpdateUserProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: {
            userId: string;
            name?: string;
            role?: string;
            bio?: string;
            location?: string;
            languages?: string[];
        }) => {
            const { userId, name, ...rest } = updates;

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: name,
                    ...rest,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

            if (error) throw error;
            return updates;
        },
        onSuccess: (data) => {
            // Invalidate and refetch profile
            queryClient.invalidateQueries({ queryKey: dashboardKeys.userProfile(data.userId) });
        },
    });
}
