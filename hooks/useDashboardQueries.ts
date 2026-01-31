// hooks/useDashboardQueries.ts
// TanStack Query hooks for all dashboard server state

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Player, Match } from '../lib/mockData';

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

            // Get enhanced GRID team data via team-profile Edge Function
            let gridTeamData: {
                teamName?: string;
                region?: string;
                logoUrl?: string;
                acronym?: string;
                country?: string;
                countryCode?: string;
                roster?: any[];
            } = {};

            if (gridTeamId) {
                const { data: profileRes } = await invokeWithTimeout<any>('team-profile', {});
                if (profileRes) {
                    gridTeamData = {
                        teamName: profileRes.teamName,
                        region: profileRes.region || 'Global',
                        logoUrl: profileRes.logoUrl,
                        acronym: profileRes.acronym,
                        country: profileRes.country,
                        countryCode: profileRes.countryCode,
                        roster: profileRes.roster || [],
                    };
                }
            }

            return {
                teamName: gridTeamData.teamName || workspace?.team_name,
                acronym: gridTeamData.acronym || (workspace?.team_name || '').substring(0, 3).toUpperCase(),
                region: gridTeamData.region || 'Global',
                country: gridTeamData.country || null,
                countryCode: gridTeamData.countryCode || null,
                game: workspace?.game_title,
                logoUrl: gridTeamData.logoUrl || null,
                roster: gridTeamData.roster || [],
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
            if (!workspaceId) return [];

            const { data: roster, error } = await supabase
                .from('roster')
                .select('*')
                .eq('workspace_id', workspaceId);

            if (error || !roster || roster.length === 0) {
                console.log('No roster found, returning empty array');
                return [];
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
                console.log('No grid team ID, returning empty matches');
                return [];
            }

            const { data: matchesData, error } = await invokeWithTimeout<any>('team-matches', {
                teamId: gridTeamId,
                game: gameTitle,
                teamName: teamName
            });

            if (error || !matchesData?.matches) {
                console.warn('Matches fetch failed, returning empty array');
                return [];
            }

            return matchesData.matches.map((m: any) => ({
                id: m.id,
                date: new Date(m.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                startTime: m.startTime, // Raw ISO timestamp for sorting/calculations
                duration: m.status === 'scheduled' ? 'TBD' : (m.duration || '35:00'),
                result: m.result || (m.status === 'scheduled' ? 'UPCOMING' : 'UNKNOWN'),
                score: m.score || '0 - 0',
                format: m.format || 'Bo1',
                type: m.type || 'Ranked',
                opponent: {
                    id: m.opponent?.id,
                    name: m.opponent?.name || 'Unknown',
                    abbreviation: m.opponent?.abbreviation || (m.opponent?.name || 'UNK').substring(0, 3).toUpperCase(),
                    color: 'red',
                    logoUrl: m.opponent?.logoUrl, // Now available from enhanced API
                },
                tournament: m.tournament ? {
                    id: m.tournament.id,
                    name: m.tournament.name,
                    startDate: m.tournament.startDate,
                    endDate: m.tournament.endDate,
                } : null,
                performance: { macroControl: 50, microErrorRate: 'MED' },
                source: m.source || 'grid', // Track data source
            }));
        },
        enabled: !!gridTeamId,
        staleTime: 1000 * 60 * 5, // 5 minutes
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

// ============================================
// Hook: useMatchStats (Stage 2 - Detailed Stats)
// ============================================
export function useMatchStats(seriesId: string | undefined | null) {
    return useQuery({
        queryKey: ['matchStats', seriesId],
        queryFn: async () => {
            if (!seriesId) return null;

            console.log('[useMatchStats] Fetching stats for series:', seriesId);

            const { data, error } = await invokeWithTimeout<{ stats: any }>(
                'match-stats',
                { seriesId },
                15000 // 15s timeout for detailed stats
            );

            if (error) {
                console.error('[useMatchStats] Error:', error);
                throw error;
            }

            return data?.stats || null;
        },
        enabled: !!seriesId,
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes (stats don't change)
        retry: 1,
    });
}

// ============================================
// Hook: usePlayerStats (Player Micro Analytics)
// ============================================
export interface PlayerStatsData {
    player: {
        id: string;
        name: string;
        country: string | null;
        countryCode: string | null;
        team: string | null;
    } | null;
    aggregated: {
        totalMatches: number;
        wins: number;
        losses: number;
        winRate: number;
        avgKills: number;
        avgDeaths: number;
        avgAssists: number;
        avgKda: number;
        avgDamage: number;
        form: 'HOT' | 'STABLE' | 'COLD';
    };
    performanceTrend: {
        matchNumber: number;
        kda: number;
        kills: number;
        result: string;
    }[];
    recentMatches: {
        matchId: string;
        date: string;
        tournament: string;
        format: string;
        opponent: string;
        opponentLogo: string | null;
        result: string;
        score: string;
        stats: {
            kills: number;
            deaths: number;
            assists: number;
            kda: number;
            headshots: number;
            damageDealt: number;
            damageReceived: number;
        };
    }[];
}

export function usePlayerStats(playerId: string | undefined | null, gridPlayerId?: string | null) {
    const effectiveId = gridPlayerId || playerId;

    return useQuery({
        queryKey: ['playerStats', effectiveId],
        queryFn: async () => {
            if (!effectiveId) return null;

            console.log('[usePlayerStats] Fetching stats for player:', effectiveId);

            const { data, error } = await invokeWithTimeout<PlayerStatsData>(
                'player-stats',
                { playerId: effectiveId },
                15000
            );

            if (error) {
                console.error('[usePlayerStats] Error:', error);
                throw error;
            }

            return data || null;
        },
        enabled: !!effectiveId,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: 1,
    });
}

// ============================================
// Hook: useTeamStatistics (Aggregated Team Analytics)
// ============================================
export interface TeamStatisticsData {
    teamId: string;
    record: {
        wins: number;
        losses: number;
        draws: number;
        totalMatches: number;
        winRate: number;
    };
    form: 'DOMINANT' | 'HOT' | 'STABLE' | 'COLD';
    stats: {
        avgKills: string;
        avgDeaths: string;
        avgAssists: string;
        avgObjectives: string;
        avgGold: number;
        avgDamage: number;
        seriesAnalyzed: number;
    } | null;
    recentMatches: {
        id: string;
        date: string;
        format: string;
        opponent: string;
        score: string;
        result: string;
    }[];
    source: string;
}

export function useTeamStatistics(teamId: string | undefined, matchLimit: number = 20) {
    return useQuery({
        queryKey: ['teamStatistics', teamId, matchLimit],
        queryFn: async (): Promise<TeamStatisticsData | null> => {
            if (!teamId) return null;

            console.log('[useTeamStatistics] Fetching stats for team:', teamId);

            const { data, error } = await invokeWithTimeout<TeamStatisticsData>(
                'team-statistics',
                { teamId, limit: matchLimit },
                15000
            );

            if (error) {
                console.error('[useTeamStatistics] Error:', error);
                throw error;
            }

            return data || null;
        },
        enabled: !!teamId,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: 1,
    });
}

// ============================================
// Hook: usePlayerStatistics (Dedicated Player Analytics)
// ============================================
export interface PlayerStatisticsData {
    player: {
        id: string;
        nickname: string;
        firstName: string | null;
        lastName: string | null;
        country: string | null;
        countryCode: string | null;
        team: {
            id: string;
            name: string;
            acronym: string;
            logoUrl: string | null;
        } | null;
    } | null;
    record: {
        wins: number;
        losses: number;
        totalMatches: number;
        winRate: number;
    };
    recentForm: 'HOT' | 'STABLE' | 'COLD';
    aggregatedStats: {
        kills: { total: number; average: string; max: number };
        deaths: { total: number; average: string; max: number };
        assists: { total: number; average: string; max: number };
        kda: string;
        damage: { total: number; average: number; max: number };
        goldEarned: { total: number; average: number };
        creepScore: { total: number; average: string };
        visionScore: { total: number; average: string };
        firstBloods: { kills: number; deaths: number };
        seriesAnalyzed: number;
    } | null;
    seriesAnalyzed: number;
    source: string;
}

export function usePlayerStatistics(playerId: string | undefined | null, matchLimit: number = 20) {
    return useQuery({
        queryKey: ['playerStatistics', playerId, matchLimit],
        queryFn: async (): Promise<PlayerStatisticsData | null> => {
            if (!playerId) return null;

            console.log('[usePlayerStatistics] Fetching detailed stats for player:', playerId);

            const { data, error } = await invokeWithTimeout<PlayerStatisticsData>(
                'player-statistics',
                { playerId, limit: matchLimit },
                15000
            );

            if (error) {
                console.error('[usePlayerStatistics] Error:', error);
                throw error;
            }

            return data || null;
        },
        enabled: !!playerId,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: 1,
    });
}
