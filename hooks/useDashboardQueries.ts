// hooks/useDashboardQueries.ts
// TanStack Query hooks for all dashboard server state

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Player, Match, matches } from '../lib/mockData';

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
    try {
        // 1. Get fresh session token explicitly (as requested)
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        // 2. Construct URL (using internal URL logic or fallback)
        // Hardcoded project ref for certainty based on user request context, or use supabase.supabaseUrl
        // const projectUrl = supabase.supabaseUrl; // e.g. https://mhvdcrxoulyrwvrcjdyy.supabase.co
        const functionUrl = `${supabase['supabaseUrl']}/functions/v1/${functionName}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            // Check for 401 specifically
            if (response.status === 401) {
                console.error('Session expired or invalid JWT. Returning 401 error.');
                // Do NOT hard redirect here, as it causes loops if the API fails for other reasons
                // window.location.href = '/auth'; 
                return { data: null, error: { status: 401, message: 'Unauthorized' } };
            }
            return { data: null, error: data || { message: response.statusText } };
        }

        return { data, error: null };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { data: null, error: new Error(`${functionName} timeout after ${timeoutMs}ms`) };
        }
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

            if (error || !matchesData?.matches || matchesData.matches.length === 0) {
                console.warn('Matches fetch failed or empty, using mock data');
                // Return mock matches if API fails (Dev/Fallback mode)
                return matches;
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

// ============================================
// STRATEGY LAB HOOKS
// ============================================

// Draft Analysis Types
export interface DraftPick {
    heroId: string;
    heroName: string;
    teamId: string;
    playerId?: string;
    playerName?: string;
    order: number;
    role?: string;
}

export interface DraftBan {
    heroId: string;
    heroName: string;
    teamId: string;
    order: number;
}

export interface DraftAnalysisData {
    seriesId: string | null;
    titleId: number;
    blueSide: {
        teamId: string;
        teamName: string;
        picks: DraftPick[];
        bans: DraftBan[];
    };
    redSide: {
        teamId: string;
        teamName: string;
        picks: DraftPick[];
        bans: DraftBan[];
    };
    winProbability: {
        blueWinRate: number;
        redWinRate: number;
        confidence: number;
    };
    draftAdvantage: {
        advantageTeam: 'blue' | 'red' | 'even';
        delta: number;
        reasoning: string;
    };
    recommendedPicks: {
        heroId: string;
        heroName: string;
        role: string;
        winRateVsComp: number;
        counterScore: number;
        reasoning: string;
    }[];
    compositionAnalysis: {
        blueArchetype: string;
        redArchetype: string;
        matchupNotes: string[];
    };
    source: string;
}

export function useDraftAnalysis(params: {
    titleId?: number;
    seriesId?: string;
    bluePicks?: { id?: string; name: string }[];
    redPicks?: { id?: string; name: string }[];
}) {
    return useQuery({
        queryKey: ['draftAnalysis', params],
        queryFn: async (): Promise<DraftAnalysisData | null> => {
            console.log('[useDraftAnalysis] Fetching draft analysis');

            const { data, error } = await invokeWithTimeout<DraftAnalysisData>(
                'draft-analysis',
                {
                    titleId: params.titleId ?? 3,
                    seriesId: params.seriesId,
                    bluePicks: params.bluePicks || [],
                    redPicks: params.redPicks || []
                },
                10000
            );

            if (error) {
                console.error('[useDraftAnalysis] Error:', error);
                throw error;
            }

            return data || null;
        },
        enabled: true,
        staleTime: 1000 * 60 * 2,
        retry: 1,
    });
}

// Match Timeline Types
export interface Position {
    x: number;
    y: number;
}

export interface TimelineEvent {
    id: string;
    timestamp: number;
    type: 'KILL' | 'OBJECTIVE' | 'TOWER' | 'DRAGON' | 'BARON' | 'RIFT_HERALD' | 'WARD' | 'TEAM_FIGHT';
    position: Position;
    teamId: string;
    playerId?: string;
    objectiveType?: string;
    goldValue?: number;
}

export interface PlayerState {
    id: string;
    name: string;
    teamId: string;
    role: string;
    position: Position;
    kills: number;
    deaths: number;
    assists: number;
    gold: number;
    level: number;
    creepScore: number;
    alive: boolean;
}

export interface MatchTimelineData {
    seriesId: string;
    gameNumber: number;
    status: 'LIVE' | 'PAUSED' | 'ENDED' | 'SCHEDULED';
    teams: {
        blue: { id: string; name: string; score: number; logoUrl?: string };
        red: { id: string; name: string; score: number; logoUrl?: string };
    };
    gameState: {
        gameTime: number;
        phase: 'EARLY' | 'MID' | 'LATE';
        goldAdvantage: { teamId: string; amount: number };
        objectiveControl: {
            teamId: string;
            dragonCount: number;
            baronCount: number;
            riftHeraldCount: number;
            towerCount: number;
        };
        visionScore: { blueTeam: number; redTeam: number };
    };
    players: PlayerState[];
    recentEvents: TimelineEvent[];
    hotspots: Position[];
    source: string;
}

export function useMatchTimeline(seriesId?: string, gameNumber: number = 1, simulate: boolean = false) {
    return useQuery({
        queryKey: ['matchTimeline', seriesId, gameNumber, simulate],
        queryFn: async (): Promise<MatchTimelineData | null> => {
            console.log('[useMatchTimeline] Fetching timeline data');

            const { data, error } = await invokeWithTimeout<MatchTimelineData>(
                'match-timeline',
                { seriesId, gameNumber, simulate },
                10000
            );

            if (error) {
                console.error('[useMatchTimeline] Error:', error);
                throw error;
            }

            return data || null;
        },
        enabled: !!seriesId || simulate,
        staleTime: simulate ? 1000 * 60 * 5 : 1000 * 5, // Refresh live data every 5 seconds
        refetchInterval: simulate ? undefined : 5000,
        retry: 1,
    });
}

// Scenario Prediction Types
export interface ScenarioPredictionData {
    winProbability: {
        teamId: string;
        probability: number;
        confidenceInterval: { low: number; high: number };
        factors: {
            variable: string;
            weight: number;
            impact: number;
            direction: 'positive' | 'negative' | 'neutral';
        }[];
    };
    teamfightWinRate: {
        probability: number;
        rating: 'HIGH' | 'MEDIUM' | 'LOW';
        conditions: {
            goldDiff: number;
            itemAdvantage: boolean;
            positioning: string;
        };
    };
    splitPushEfficiency: {
        rating: 'HIGH' | 'MEDIUM' | 'LOW';
        probability: number;
        reasoning: string;
    };
    objectivePriority: {
        nextObjective: string;
        timing: string;
        winRateIfSecured: number;
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    strategicRecommendations: string[];
    source: string;
}

export interface ScenarioInput {
    gamePhase: 'EARLY' | 'MID' | 'LATE';
    goldAdvantage: number;
    playerFatigue: boolean;
    objectivesSecured?: string[];
    dragonCount?: { blue: number; red: number };
    baronSecured?: { blue: boolean; red: boolean };
    teamKills?: { blue: number; red: number };
    teamDeaths?: { blue: number; red: number };
}

export function useScenarioPrediction(input: ScenarioInput) {
    return useQuery({
        queryKey: ['scenarioPrediction', input],
        queryFn: async (): Promise<ScenarioPredictionData | null> => {
            // Debounce or skipping empty inputs could be handled here
            console.log('[useScenarioPrediction] Calculating scenario');

            const { data, error } = await invokeWithTimeout<ScenarioPredictionData>(
                'scenario-prediction',
                input,
                8000
            );

            if (error) {
                console.error('[useScenarioPrediction] Error:', error);
                throw error;
            }

            return data || null;
        },
        enabled: !!input,
        staleTime: 1000 * 60 * 2,
    });
}

// High Impact Plays Types
export interface HighImpactPlay {
    time: string;
    play: string;
    outcome: string;
    score: number;
}

export function useHighImpactPlays(matchId: string | undefined | null) {
    return useQuery({
        queryKey: ['highImpactPlays', matchId],
        queryFn: async (): Promise<HighImpactPlay[]> => {
            if (!matchId) return [];
            console.log('[useHighImpactPlays] Analyzing match:', matchId);

            const { data, error } = await invokeWithTimeout<{ plays: HighImpactPlay[] }>(
                'high-impact-plays',
                { matchId },
                20000 // Longer timeout for AI generation
            );

            if (error) {
                console.error('[useHighImpactPlays] Error:', error);
                throw error;
            }

            return data?.plays || [];
        },
        enabled: !!matchId,
        staleTime: Infinity, // These don't change for a completed match
        retry: 1
    });
}

// Tactical Briefing Types
export interface TacticalInsight {
    type: 'critical' | 'warning' | 'recommendation' | 'observation';
    title: string;
    content: string;
    timing?: string;
    impact?: 'high' | 'medium' | 'low';
}

export interface TacticalBriefingData {
    timestamp: string;
    teamId: string | null;
    opponentId: string | null;
    briefingType: 'pre-game' | 'in-game' | 'post-game';
    executiveSummary: string;
    insights: TacticalInsight[];
    keyMatchups: {
        lane: string;
        advantage: 'blue' | 'red' | 'even';
        reasoning: string;
    }[];
    criticalTimings: {
        timestamp: string;
        event: string;
        action: string;
    }[];
    riskAssessment: {
        level: 'low' | 'medium' | 'high';
        factors: string[];
    };
    source: string;
}

export function useTacticalBriefing(params: {
    titleId?: number;
    teamId?: string;
    opponentId?: string;
    draftData?: {
        bluePicks: string[];
        redPicks: string[];
        blueBans: string[];
        redBans: string[];
    };
    gameState?: {
        gamePhase: string;
        goldAdvantage: number;
        objectives: string[];
    };
}) {
    return useQuery({
        queryKey: ['tacticalBriefing', params],
        queryFn: async (): Promise<TacticalBriefingData | null> => {
            console.log('[useTacticalBriefing] Generating tactical briefing');

            const { data, error } = await invokeWithTimeout<TacticalBriefingData>(
                'tactical-briefing',
                params,
                20000 // Longer timeout for AI generation
            );

            if (error) {
                console.error('[useTacticalBriefing] Error:', error);
                throw error;
            }

            return data || null;
        },
        enabled: !!(params.teamId || params.draftData || params.gameState),
        staleTime: 1000 * 60 * 2, // Cache for 2 minutes
        retry: 1,
    });
}

// ============================================
// Hook: useTeamSearch
// ============================================
export function useTeamSearch(query: string, titleId: number = 3) {
    return useQuery({
        queryKey: ['teamSearch', query, titleId],
        queryFn: async () => {
            // Mock search for now as we don't have a dedicated search endpoint yet
            // In a real app, this would hit /search/teams?q=...
            if (!query) return [];

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Return some mock results filtered by query
            const mockTeams = [
                { id: 't1', name: 'T1', acronym: 'T1', region: 'LCK', logoUrl: 'https://am-a.akamaihd.net/image?resize=200:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2Ft1-full-on-dark.png' },
                { id: 'geng', name: 'Gen.G', acronym: 'GEN', region: 'LCK', logoUrl: 'https://am-a.akamaihd.net/image?resize=200:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2F1655210113163_GenG_logo_200x200.png' },
                { id: 'jdg', name: 'JD Gaming', acronym: 'JDG', region: 'LPL', logoUrl: 'https://am-a.akamaihd.net/image?resize=200:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2F1631819669150_jdg-200.png' },
                { id: 'g2', name: 'G2 Esports', acronym: 'G2', region: 'LEC', logoUrl: 'https://am-a.akamaihd.net/image?resize=200:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2F1704375161752_G2-Esports-Logo-2024.png' },
                { id: 'fnc', name: 'Fnatic', acronym: 'FNC', region: 'LEC', logoUrl: 'https://am-a.akamaihd.net/image?resize=200:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2Ffnatic-logo-2020.png' },
                { id: 'c9', name: 'Cloud9', acronym: 'C9', region: 'LCS', logoUrl: 'https://am-a.akamaihd.net/image?resize=200:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2F1704375087130_Cloud9-Logo-2024.png' }
            ];

            return mockTeams.filter(t => t.name.toLowerCase().includes(query.toLowerCase()) || t.acronym.toLowerCase().includes(query.toLowerCase()));
        },
        enabled: query.length > 1,
        staleTime: 1000 * 60 * 60 // 1 hour
    });
}

// ============================================
// Hook: useTeamHistory (Moneyball Data)
// ============================================
export function useTeamHistory(teamId: string | undefined) {
    return useQuery({
        queryKey: ['teamHistory', teamId],
        queryFn: async () => {
            if (!teamId) return null;

            // Call draft-analysis to get the deep dive data? 
            // Or simulate fetching detailed roster history for the Moneyball view
            console.log('[useTeamHistory] Fetching history for:', teamId);

            // Simulating a fetch to our enhanced backend
            await new Promise(resolve => setTimeout(resolve, 800));

            // Return rich data structure matching the TeamInsightPanel expectations
            // This corresponds to the user's "T1" reference image but dynamic
            return {
                teamId,
                avgGameTime: "29:15",
                firstBloodRate: 58.5,
                dragonControl: 65,
                winRate: 72,
                roster: [
                    { name: "Top Laner", role: "TOP", banPriority: "MED" as const, powerPicks: [{ name: "Aatrox", winRate: 65 }, { name: "K'Sante", winRate: 62 }], attributes: [{ label: "Laning", value: 85 }, { label: "Teamfight", value: 90 }] },
                    { name: "Jungler", role: "JUNGLE", banPriority: "HIGH" as const, powerPicks: [{ name: "Lee Sin", winRate: 72 }, { name: "Viego", winRate: 68 }], attributes: [{ label: "Gank", value: 92 }, { label: "Control", value: 88 }] },
                    { name: "Mid Laner", role: "MID", banPriority: "CRITICAL" as const, powerPicks: [{ name: "Azir", winRate: 80 }, { name: "Orianna", winRate: 75 }], attributes: [{ label: "Macro", value: 95 }, { label: "Micro", value: 98 }] },
                    { name: "ADC Carry", role: "ADC", banPriority: "LOW" as const, powerPicks: [{ name: "Xayah", winRate: 60 }, { name: "Kaisa", winRate: 58 }], attributes: [{ label: "Dmg", value: 92 }, { label: "Position", value: 85 }] },
                    { name: "Support", role: "SUPPORT", banPriority: "MED" as const, powerPicks: [{ name: "Rakan", winRate: 66 }, { name: "Nautilus", winRate: 64 }], attributes: [{ label: "Vision", value: 90 }, { label: "Engage", value: 88 }] },
                ]
            };
        },
        enabled: !!teamId,
        staleTime: 1000 * 60 * 10
    });
}
// ============================================
// Hook: usePlayerAnalysis (Gemini 3 Pro)
// ============================================
export interface PlayerAnalysis {
    synergies: {
        name: string;
        partner: string;
        score: number;
        description: string;
    }[];
    potential: {
        score: number;
        projectedPeak: number;
        trajectory: number[];
        analysis: string;
    };
}

export function usePlayerAnalysis(
    playerName: string | undefined,
    playerRole?: string,
    teamId?: string,
    recentStats?: any,
    playerId?: string
) {
    return useQuery({
        queryKey: ['playerAnalysis', playerName, teamId],
        queryFn: async () => {
            if (!playerName) return null;

            // Manual fetch to bypass potential Auth issues and ensure fresh token
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${supabase['supabaseUrl']}/functions/v1/player-analysis`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ playerName, playerRole, teamId, recentStats })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Session expired or invalid JWT (player-analysis). Redirecting to login...');
                    window.location.href = '/auth';
                    throw new Error('Unauthorized');
                }
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch player analysis');
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            return data as PlayerAnalysis;
        },
        enabled: !!playerName,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours (it's expensive deep analysis)
    });
}

// ============================================
// Hook: useRoster (Local DB)
// ============================================
export interface RosterPlayer {
    id: string;
    workspace_id: string;
    role: string;
    ign: string;
    grid_player_id: string;
    created_at: string;
    metadata: {
        gridId: string;
        imageUrl: string | null;
    };
    readiness_score: number;
    synergy_score: number;
    is_active: boolean;
    image_url: string | null;
}

export function useRoster(workspaceId: string | undefined) {
    return useQuery({
        queryKey: ['roster', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return [];

            const { data, error } = await supabase
                .from('roster')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('role', { ascending: true }); // Heuristic sorting, can refine

            if (error) throw error;
            return data as RosterPlayer[];
        },
        enabled: !!workspaceId,
    });
}
