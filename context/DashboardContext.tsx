import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    teamProfile: any | null; // Store full team profile
}

interface DashboardContextType extends DashboardState {
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

    // Data
    allPlayers: Player[];
    allMatches: Match[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<DashboardState>({
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
        teamProfile: null
    });

    const [allPlayers, setAllPlayers] = useState<Player[]>(mockPlayers);
    const [allMatches, setAllMatches] = useState<Match[]>(mockMatches);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setState(prev => ({ ...prev, isLoading: true, error: null }));

                // 1. Get User
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No user found");

                // 2. Get Workspace
                const { data: workspace, error: wsError } = await supabase
                    .from('workspaces')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (wsError || !workspace) {
                    console.log("No workspace found, using mock data");
                    setState(prev => ({ ...prev, isLoading: false }));
                    return;
                }

                // 3. Get Roster from DB
                const { data: roster, error: rosterError } = await supabase
                    .from('roster')
                    .select('*')
                    .eq('workspace_id', workspace.id);

                if (!rosterError && roster && roster.length > 0) {
                    // Map DB roster to UI Player objects
                    // Note: In a real app we'd fetch stats for each player. 
                    // Here we'll merge DB data with mock stats for visual completeness.
                    const mappedPlayers: Player[] = roster.map((p, index) => {
                        // Find a mock player to steal stats/avatar from based on role/index to keep UI pretty
                        const mockTemplate = mockPlayers.find(mp => mp.role === p.role) || mockPlayers[index % mockPlayers.length];
                        return {
                            id: p.id,
                            name: p.ign || `Player ${index + 1}`,
                            role: p.role as any,
                            overall: mockTemplate.overall, // Placeholder stat
                            stats: mockTemplate.stats,
                            synergy: Math.floor(Math.random() * 20) + 80, // Random 80-100
                            avatar: mockTemplate.avatar // Use mock avatars for now
                        };
                    });
                    setAllPlayers(mappedPlayers);
                }

                // 4. Get Matches from Edge Function
                if (workspace.grid_team_id) {
                    const { data: matchesData, error: matchError } = await supabase.functions.invoke('team-matches', {
                        body: { teamId: workspace.grid_team_id }
                    });

                    if (!matchError && matchesData && matchesData.matches) {
                        const mappedMatches: Match[] = matchesData.matches.slice(0, 5).map((m: any) => ({
                            id: m.id,
                            date: new Date(m.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            // Calculate approximate duration or default
                            duration: '35:00',
                            result: m.winner?.id === workspace.grid_team_id ? 'WIN' : 'LOSS',
                            score: `${m.games?.filter((g: any) => g.winnerId === workspace.grid_team_id).length} - ${m.games?.filter((g: any) => g.winnerId !== workspace.grid_team_id).length}`,
                            // Format is usually Bo1, Bo3 etc. in series.
                            format: m.format || 'Bo1',
                            type: 'Ranked', // Default to Ranked for API matches
                            opponent: {
                                name: m.teams?.find((t: any) => t.id !== workspace.grid_team_id)?.name || 'Unknown',
                                abbreviation: (m.teams?.find((t: any) => t.id !== workspace.grid_team_id)?.name || 'UNK').substring(0, 3).toUpperCase(),
                                color: 'red'
                            },
                            performance: { macroControl: 50, microErrorRate: 'MED' }
                        }));
                        if (mappedMatches.length > 0) {
                            setAllMatches(mappedMatches);
                        }
                    } else {
                        console.error("Error fetching matches:", matchError);
                    }
                }

                // 5. Fetch Team Profile from Edge Function
                try {
                    const { data: profileData, error: profileError } = await supabase.functions.invoke('team-profile');
                    if (!profileError && profileData) {
                        setState(prev => ({ ...prev, teamProfile: profileData }));
                    }
                } catch (profileErr) {
                    console.error("Error fetching team profile:", profileErr);
                }

                setState(prev => ({ ...prev, isLoading: false }));

            } catch (err: any) {
                console.error("Dashboard fetch error:", err);
                // Fallback to mock data is already set via initial state
                setState(prev => ({ ...prev, isLoading: false, error: err.message }));
            }
        };

        fetchData();
    }, []);

    const selectPlayer = (playerId: string) => {
        const player = allPlayers.find(p => p.id === playerId);
        if (player) {
            setState(prev => ({ ...prev, selectedPlayer: player }));
        }
    };

    const clearSelectedPlayer = () => {
        setState(prev => ({ ...prev, selectedPlayer: null }));
    };

    const selectMatch = (matchId: string) => {
        const match = allMatches.find(m => m.id === matchId);
        if (match) {
            setState(prev => ({ ...prev, selectedMatch: match }));
        }
    };

    const clearSelectedMatch = () => {
        setState(prev => ({ ...prev, selectedMatch: null }));
    };

    const openStrategyBrief = () => setState(prev => ({ ...prev, strategyBriefOpen: true }));
    const closeStrategyBrief = () => setState(prev => ({ ...prev, strategyBriefOpen: false }));

    const openMatchDetail = (matchId: string) => {
        selectMatch(matchId);
        setState(prev => ({ ...prev, matchDetailOpen: true }));
    };
    const closeMatchDetail = () => setState(prev => ({ ...prev, matchDetailOpen: false, selectedMatch: null }));

    const openComparePlayers = () => setState(prev => ({ ...prev, comparePlayersOpen: true }));
    const closeComparePlayers = () => setState(prev => ({ ...prev, comparePlayersOpen: false }));

    const openEditAttributes = () => setState(prev => ({ ...prev, editAttributesOpen: true }));
    const closeEditAttributes = () => setState(prev => ({ ...prev, editAttributesOpen: false }));

    const openChampionPicker = () => setState(prev => ({ ...prev, championPickerOpen: true }));
    const closeChampionPicker = () => setState(prev => ({ ...prev, championPickerOpen: false }));

    const openSimulationResult = () => setState(prev => ({ ...prev, simulationResultOpen: true }));
    const closeSimulationResult = () => setState(prev => ({ ...prev, simulationResultOpen: false }));

    const runSimulation = () => {
        setState(prev => ({ ...prev, simulationRunning: true }));

        // Simulate processing time
        setTimeout(() => {
            const winProb = Math.floor(Math.random() * 30) + 55; // 55-85%
            const insights = [
                'Your composition excels in mid-game teamfights',
                'Consider prioritizing Baron control after 20 minutes',
                'Bot lane synergy creates strong 2v2 kill potential'
            ];

            setState(prev => ({
                ...prev,
                simulationRunning: false,
                simulationResult: { winProbability: winProb, insights },
                simulationResultOpen: true
            }));
        }, 2000);
    };

    const value: DashboardContextType = {
        ...state,
        selectPlayer,
        clearSelectedPlayer,
        selectMatch,
        clearSelectedMatch,
        openStrategyBrief,
        closeStrategyBrief,
        openMatchDetail,
        closeMatchDetail,
        openComparePlayers,
        closeComparePlayers,
        openEditAttributes,
        closeEditAttributes,
        openChampionPicker,
        closeChampionPicker,
        openSimulationResult,
        closeSimulationResult,
        runSimulation,
        allPlayers,
        allMatches
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = (): DashboardContextType => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
