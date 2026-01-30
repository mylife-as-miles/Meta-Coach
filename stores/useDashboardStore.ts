import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Player, Match, matches as mockMatches } from '../lib/mockData';

interface DashboardState {
    // Selected items
    selectedPlayer: Player | null;
    selectedMatch: Match | null;

    // Modal visibility
    strategyBriefOpen: boolean;
    matchDetailOpen: boolean;
    comparePlayersOpen: boolean;
    editAttributesOpen: boolean;
    championPickerOpen: boolean;
    simulationResultOpen: boolean;

    // Simulation state
    simulationRunning: boolean;
    simulationResult: { winProbability: number; insights: string[] } | null;

    // Real Data State
    isLoading: boolean;
    error: string | null;
    userProfile: {
        id?: string;
        name: string;
        email: string;
        avatar?: string;
        role?: string;
        bio?: string;
        location?: string;
        languages?: string[];
        created_at?: string;
    } | null;
    teamProfile: any | null;

    // Data
    allPlayers: Player[];
    allMatches: Match[];
}

interface DashboardActions {
    // Player actions
    selectPlayer: (playerId: string) => void;
    clearSelectedPlayer: () => void;

    // Match actions
    selectMatch: (matchId: string) => void;
    clearSelectedMatch: () => void;

    // Modal actions
    openStrategyBrief: () => void;
    closeStrategyBrief: () => void;
    openMatchDetail: (matchId: string) => void;
    closeMatchDetail: () => void;
    openComparePlayers: () => void;
    closeComparePlayers: () => void;
    openEditAttributes: () => void;
    closeEditAttributes: () => void;
    openChampionPicker: () => void;
    closeChampionPicker: () => void;
    openSimulationResult: () => void;
    closeSimulationResult: () => void;

    // Simulation actions
    runSimulation: () => void;

    // Data fetching
    fetchDashboardData: () => Promise<void>;

    // Profile actions
    updateUserProfile: (updates: {
        name?: string;
        role?: string;
        bio?: string;
        location?: string;
        languages?: string[];
    }) => Promise<void>;
}

const initialState: DashboardState = {
    selectedPlayer: null,
    selectedMatch: null,
    strategyBriefOpen: false,
    matchDetailOpen: false,
    comparePlayersOpen: false,
    editAttributesOpen: false,
    championPickerOpen: false,
    simulationResultOpen: false,
    simulationRunning: false,
    simulationResult: null,
    isLoading: true,
    error: null,
    userProfile: null,
    teamProfile: null,
    allPlayers: [],
    allMatches: [],
};

export const useDashboardStore = create<DashboardState & DashboardActions>((set, get) => ({
    ...initialState,

    selectPlayer: (playerId) => {
        const player = get().allPlayers.find(p => p.id === playerId);
        if (player) {
            set({ selectedPlayer: player });
        }
    },

    clearSelectedPlayer: () => {
        set({ selectedPlayer: null });
    },

    selectMatch: (matchId) => {
        const match = get().allMatches.find(m => m.id === matchId);
        if (match) {
            set({ selectedMatch: match });
        }
    },

    clearSelectedMatch: () => {
        set({ selectedMatch: null });
    },

    openStrategyBrief: () => set({ strategyBriefOpen: true }),
    closeStrategyBrief: () => set({ strategyBriefOpen: false }),

    openMatchDetail: (matchId) => {
        const match = get().allMatches.find(m => m.id === matchId);
        if (match) {
            set({ selectedMatch: match, matchDetailOpen: true });
        }
    },
    closeMatchDetail: () => set({ matchDetailOpen: false, selectedMatch: null }),

    openComparePlayers: () => set({ comparePlayersOpen: true }),
    closeComparePlayers: () => set({ comparePlayersOpen: false }),

    openEditAttributes: () => set({ editAttributesOpen: true }),
    closeEditAttributes: () => set({ editAttributesOpen: false }),

    openChampionPicker: () => set({ championPickerOpen: true }),
    closeChampionPicker: () => set({ championPickerOpen: false }),

    openSimulationResult: () => set({ simulationResultOpen: true }),
    closeSimulationResult: () => set({ simulationResultOpen: false }),

    runSimulation: () => {
        set({ simulationRunning: true });

        // Simulate processing time
        setTimeout(() => {
            const winProb = Math.floor(Math.random() * 30) + 55; // 55-85%
            const insights = [
                'Your composition excels in mid-game teamfights',
                'Consider prioritizing Baron control after 20 minutes',
                'Bot lane synergy creates strong 2v2 kill potential'
            ];

            set({
                simulationRunning: false,
                simulationResult: { winProbability: winProb, insights },
                simulationResultOpen: true
            });
        }, 2000);
    },

    fetchDashboardData: async () => {
        console.log("fetchDashboardData: Started");
        set({ isLoading: true, error: null });

        try {
            // 1. Get User
            console.log("fetchDashboardData: Getting User...");
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");
            console.log("fetchDashboardData: User found", user.id);

            // Fetch comprehensive profile data
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Set User Profile
            set({
                userProfile: {
                    id: user.id,
                    name: profileData?.full_name || profileData?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'Coach',
                    email: user.email || '',
                    avatar: profileData?.avatar_url || user.user_metadata?.avatar_url,
                    role: profileData?.role || 'Coach',
                    bio: profileData?.bio,
                    location: profileData?.location,
                    languages: profileData?.languages,
                    created_at: user.created_at
                }
            });

            // 2. Get Workspace
            console.log("fetchDashboardData: Getting Workspace...");
            const { data: workspace, error: wsError } = await supabase
                .from('workspaces')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (wsError || !workspace) {
                console.log("fetchDashboardData: No workspace found, using mock data");
                return; // Early return, finally block will set isLoading: false
            }
            console.log("fetchDashboardData: Workspace found", workspace.id);

            // 3. Get AI Calibration
            const { data: aiData } = await supabase
                .from('ai_calibration')
                .select('*')
                .eq('workspace_id', workspace.id)
                .maybeSingle();

            // 4. Get Authentic Team Data from GRID (Lean Integration)
            let gridTeamData: { teamName?: string; region?: string; logoUrl?: string } = {};
            if (workspace.grid_team_id) {
                try {
                    const invokePromise = supabase.functions.invoke('grid-teams', {
                        body: { teamId: workspace.grid_team_id }
                    });

                    let timeoutId: any;
                    const timeoutPromise = new Promise((_, reject) => {
                        timeoutId = setTimeout(() => reject(new Error('GRID API Timeout')), 10000);
                    });

                    const { data: gridRes, error: gridError } = await Promise.race([invokePromise, timeoutPromise]) as any;
                    clearTimeout(timeoutId);

                    if (!gridError && gridRes && gridRes.team) {
                        gridTeamData = {
                            teamName: gridRes.team.name,
                            region: 'Global', // Default as region field removed
                            logoUrl: gridRes.team.logoUrl
                        };
                        // Note: gridRes.team.nameShortened is available if needed for abbreviations
                    }
                } catch (e) {
                    console.warn("Retrieved GRID Team Identity failed:", e);
                }
            }

            // Set Team Profile from Workspace + GRID Data + AI Data
            set({
                teamProfile: {
                    teamName: gridTeamData.teamName || workspace.team_name,
                    region: gridTeamData.region || 'Global',
                    game: workspace.game_title,
                    logoUrl: gridTeamData.logoUrl || null,
                    ...(aiData || {})
                }
            });

            // 4. Get Roster from DB
            const { data: roster, error: rosterError } = await supabase
                .from('roster')
                .select('*')
                .eq('workspace_id', workspace.id);

            if (!rosterError && roster && roster.length > 0) {
                const mappedPlayers: Player[] = roster.map((p, index) => {
                    // Default stats if no authentic data available yet
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
                        isActive: p.is_active ?? true
                    };
                });
                set({ allPlayers: mappedPlayers });
            }

            // 5. Get Matches (Authentic GRID Data)
            if (workspace.grid_team_id) {
                try {
                    const invokePromise = supabase.functions.invoke('team-matches', {
                        body: { teamId: workspace.grid_team_id }
                    });

                    let timeoutId: any;
                    const timeoutPromise = new Promise((_, reject) => {
                        timeoutId = setTimeout(() => reject(new Error('GRID API Timeout')), 10000);
                    });

                    const { data: matchesData, error: matchError } = await Promise.race([invokePromise, timeoutPromise]) as any;
                    clearTimeout(timeoutId);

                    if (!matchError && matchesData && matchesData.matches) {
                        const mappedMatches: Match[] = matchesData.matches.map((m: any) => ({
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
                                color: 'red' // Could be dynamic if GRID provides team color
                            },
                            performance: { macroControl: 50, microErrorRate: 'MED' }
                        }));

                        // Sort: Upcoming (ASC) then History (DESC) is what API returns, but we might want to ensure it here
                        // or just set it. API returns [...upcoming, ...history]. 
                        // If mappedMatches is empty, we keep existing mock matches or clear them?
                        // Let's overwite with authentic data if we have it, otherwise fallback to mock if empty? 
                        // Actually, if we have a team ID but no matches, it implies no matches.

                        set({ allMatches: mappedMatches });
                    }
                } catch (e) {
                    console.warn("Failed to fetch matches", e);
                    // Keep mock data if fetch fails? Or clear it? 
                    // For now, let's keep mock data on error so dashboard isn't empty during dev
                }
            } else {
                console.log("fetchDashboardData: No Grid Team ID, using mock matches");
                set({ allMatches: mockMatches });
            }

            console.log("fetchDashboardData: Completed successfully");

        } catch (err: any) {
            console.error("Dashboard fetch error:", err);
            set({ error: err.message });
        } finally {
            set({ isLoading: false });
        }
    },

    updateUserProfile: async (updates) => {
        const { userProfile } = get();
        if (!userProfile?.id) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: updates.name,
                    role: updates.role,
                    bio: updates.bio,
                    location: updates.location,
                    languages: updates.languages,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userProfile.id);

            if (error) throw error;

            // Optimistic update
            set({
                userProfile: {
                    ...userProfile,
                    ...updates,
                    name: updates.name || userProfile.name
                }
            });
        } catch (err) {
            console.error("Failed to update profile", err);
            // Optionally handle error
        }
    }
}));

// Re-export types
export type { DashboardState };
