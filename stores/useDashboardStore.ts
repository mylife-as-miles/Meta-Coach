// stores/useDashboardStore.ts
// Zustand store for UI/transient state only
// Server data (profile, players, matches) is now handled by TanStack Query hooks

import { create } from 'zustand';
import { Player, Match } from '../lib/mockData';

interface DashboardUIState {
    // Selected items (for modals/detail views)
    selectedPlayer: Player | null;
    selectedMatch: Match | null;

    // Modal visibility
    strategyBriefOpen: boolean;
    matchDetailOpen: boolean;
    comparePlayersOpen: boolean;
    editAttributesOpen: boolean;
    championPickerOpen: boolean;
    simulationResultOpen: boolean;

    // Simulation state (client-side only)
    simulationRunning: boolean;
    simulationResult: { winProbability: number; insights: string[] } | null;
}

interface DashboardUIActions {
    // Player actions
    selectPlayer: (player: Player) => void;
    clearSelectedPlayer: () => void;

    // Match actions
    selectMatch: (match: Match) => void;
    clearSelectedMatch: () => void;

    // Modal actions
    openStrategyBrief: () => void;
    closeStrategyBrief: () => void;
    openMatchDetail: (match: Match) => void;
    closeMatchDetail: () => void;
    openComparePlayers: () => void;
    closeComparePlayers: () => void;
    openEditAttributes: () => void;
    closeEditAttributes: () => void;
    openChampionPicker: () => void;
    closeChampionPicker: () => void;
    openSimulationResult: () => void;
    closeSimulationResult: () => void;

    // Simulation action
    runSimulation: () => void;

    // Reset all state
    reset: () => void;
}

const initialState: DashboardUIState = {
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
};

export const useDashboardStore = create<DashboardUIState & DashboardUIActions>((set) => ({
    ...initialState,

    // Player actions - now accept Player object directly
    selectPlayer: (player) => set({ selectedPlayer: player }),
    clearSelectedPlayer: () => set({ selectedPlayer: null }),

    // Match actions - now accept Match object directly
    selectMatch: (match) => set({ selectedMatch: match }),
    clearSelectedMatch: () => set({ selectedMatch: null }),

    // Modal actions
    openStrategyBrief: () => set({ strategyBriefOpen: true }),
    closeStrategyBrief: () => set({ strategyBriefOpen: false }),

    openMatchDetail: (match) => set({ selectedMatch: match, matchDetailOpen: true }),
    closeMatchDetail: () => set({ matchDetailOpen: false, selectedMatch: null }),

    openComparePlayers: () => set({ comparePlayersOpen: true }),
    closeComparePlayers: () => set({ comparePlayersOpen: false }),

    openEditAttributes: () => set({ editAttributesOpen: true }),
    closeEditAttributes: () => set({ editAttributesOpen: false }),

    openChampionPicker: () => set({ championPickerOpen: true }),
    closeChampionPicker: () => set({ championPickerOpen: false }),

    openSimulationResult: () => set({ simulationResultOpen: true }),
    closeSimulationResult: () => set({ simulationResultOpen: false }),

    // Simulation (mocked for now - could become a mutation later)
    runSimulation: () => {
        set({ simulationRunning: true });

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

    // Reset all state
    reset: () => set(initialState),
}));
