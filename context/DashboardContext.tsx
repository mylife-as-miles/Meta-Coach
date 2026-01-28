import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Player, Match, players, matches } from '../lib/mockData';

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
        simulationResult: null
    });

    const selectPlayer = (playerId: string) => {
        const player = players.find(p => p.id === playerId);
        if (player) {
            setState(prev => ({ ...prev, selectedPlayer: player }));
        }
    };

    const clearSelectedPlayer = () => {
        setState(prev => ({ ...prev, selectedPlayer: null }));
    };

    const selectMatch = (matchId: string) => {
        const match = matches.find(m => m.id === matchId);
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
        allPlayers: players,
        allMatches: matches
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
