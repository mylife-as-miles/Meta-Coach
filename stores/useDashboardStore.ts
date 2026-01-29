import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Player, Match, players as mockPlayers, matches as mockMatches } from '../lib/mockData';

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
    userProfile: { name: string; email: string; avatar?: string } | null;
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
    allPlayers: mockPlayers,
    allMatches: mockMatches,
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
        try {
            set({ isLoading: true, error: null });

            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // Set User Profile
            set({
                userProfile: {
                    name: user.user_metadata?.username || user.email?.split('@')[0] || 'Coach',
                    email: user.email || '',
                    avatar: user.user_metadata?.avatar_url
                }
            });

            // 2. Get Workspace
            const { data: workspace, error: wsError } = await supabase
                .from('workspaces')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (wsError || !workspace) {
                console.log("No workspace found, using mock data");
                set({ isLoading: false });
                return;
            }

            // 3. Get AI Calibration
            const { data: aiData } = await supabase
                .from('ai_calibration')
                .select('*')
                .eq('workspace_id', workspace.id)
                .maybeSingle();

            // Set Team Profile from Workspace + AI Data
            set({
                teamProfile: {
                    teamName: workspace.team_name,
                    region: 'Global', // Placeholder as region isn't in workspace table yet
                    game: workspace.game_title,
                    ...(aiData || {}) // Spread AI data safely
                }
            });

            // 4. Get Roster from DB
            const { data: roster, error: rosterError } = await supabase
                .from('roster')
                .select('*')
                .eq('workspace_id', workspace.id);

            if (!rosterError && roster && roster.length > 0) {
                const mappedPlayers: Player[] = roster.map((p, index) => {
                    // Try to find a mock template for stats based on role
                    const mockTemplate = mockPlayers.find(mp => mp.role.toLowerCase() === p.role.toLowerCase()) || mockPlayers[index % mockPlayers.length];

                    return {
                        id: p.id,
                        name: p.ign || `Player ${index + 1}`,
                        role: p.role as any,
                        overall: Math.floor((p.readiness_score + p.synergy_score) / 2) || mockTemplate.overall,
                        stats: mockTemplate.stats, // Keep mock gameplay stats for now
                        synergy: p.synergy_score ?? 85, // Use DB value or default
                        readiness: p.readiness_score ?? 90, // Use DB value or default
                        avatar: p.metadata?.imageUrl || null,
                        isActive: p.is_active ?? true
                    };
                });
                set({ allPlayers: mappedPlayers });
            }

            // 5. Get Matches (Optional - keep existing logic or mock if function fails)
            if (workspace.grid_team_id) {
                // If we have a Grid Team ID, we could fetch real matches. 
                // For now, let's keep the store's existing match logic or just leave it. 
                // The main request is to populate dashboard with data from database (User's team).
                // We'll leave the Function call as it was, assuming it works or fails gracefully.
                try {
                    const { data: matchesData, error: matchError } = await supabase.functions.invoke('team-matches', {
                        body: { teamId: workspace.grid_team_id }
                    });

                    if (!matchError && matchesData && matchesData.matches) {
                        const mappedMatches: Match[] = matchesData.matches.slice(0, 5).map((m: any) => ({
                            id: m.id,
                            date: new Date(m.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            duration: '35:00',
                            result: m.winner?.id === workspace.grid_team_id ? 'WIN' : 'LOSS',
                            score: `${m.games?.filter((g: any) => g.winnerId === workspace.grid_team_id).length} - ${m.games?.filter((g: any) => g.winnerId !== workspace.grid_team_id).length}`,
                            format: m.format || 'Bo1',
                            type: 'Ranked',
                            opponent: {
                                name: m.teams?.find((t: any) => t.id !== workspace.grid_team_id)?.name || 'Unknown',
                                abbreviation: (m.teams?.find((t: any) => t.id !== workspace.grid_team_id)?.name || 'UNK').substring(0, 3).toUpperCase(),
                                color: 'red'
                            },
                            performance: { macroControl: 50, microErrorRate: 'MED' }
                        }));
                        if (mappedMatches.length > 0) {
                            set({ allMatches: mappedMatches });
                        }
                    }
                } catch (e) {
                    console.warn("Failed to fetch matches", e);
                }
            }

            set({ isLoading: false });

        } catch (err: any) {
            console.error("Dashboard fetch error:", err);
            set({ isLoading: false, error: err.message });
        }
    },
}));

// Re-export types
export type { DashboardState };
