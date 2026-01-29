import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

// Types
interface RosterPlayer {
    role: string;
    ign: string;
}

interface AIConfig {
    aggression: number;
    resourcePriority: number;
    visionInvestment: number;
    earlyGamePathing: boolean;
    objectiveControl: boolean;
}

interface OnboardingState {
    // Step 1: Game & Team
    gridTitleId: string | null;
    gridTeamId: string | null;
    teamName: string | null;
    gameTitle: string | null;

    // Step 2: Roster
    roster: RosterPlayer[];

    // Step 3: AI Config
    aiConfig: AIConfig;

    // Loading state
    isSaving: boolean;
}

interface OnboardingContextType extends OnboardingState {
    // Step 1 actions
    setGameAndTeam: (titleId: string, teamId: string, teamName: string, gameTitle: string) => void;

    // Step 2 actions
    setRoster: (roster: RosterPlayer[]) => void;
    updateRosterPlayer: (index: number, ign: string) => void;

    // Step 3 actions
    setAIConfig: (config: Partial<AIConfig>) => void;

    // Final save
    completeOnboarding: () => Promise<boolean>;
}

const defaultAIConfig: AIConfig = {
    aggression: 50,
    resourcePriority: 50,
    visionInvestment: 50,
    earlyGamePathing: false,
    objectiveControl: false,
};

const defaultRoster: RosterPlayer[] = [
    { role: 'Top', ign: '' },
    { role: 'Jungle', ign: '' },
    { role: 'Mid', ign: '' },
    { role: 'ADC', ign: '' },
    { role: 'Support', ign: '' },
];

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();

    const [state, setState] = useState<OnboardingState>({
        gridTitleId: null,
        gridTeamId: null,
        teamName: null,
        gameTitle: null,
        roster: defaultRoster,
        aiConfig: defaultAIConfig,
        isSaving: false,
    });

    const setGameAndTeam = (titleId: string, teamId: string, teamName: string, gameTitle: string) => {
        setState(prev => ({
            ...prev,
            gridTitleId: titleId,
            gridTeamId: teamId,
            teamName,
            gameTitle,
        }));
    };

    const setRoster = (roster: RosterPlayer[]) => {
        setState(prev => ({ ...prev, roster }));
    };

    const updateRosterPlayer = (index: number, ign: string) => {
        setState(prev => {
            const newRoster = [...prev.roster];
            newRoster[index] = { ...newRoster[index], ign };
            return { ...prev, roster: newRoster };
        });
    };

    const setAIConfig = (config: Partial<AIConfig>) => {
        setState(prev => ({
            ...prev,
            aiConfig: { ...prev.aiConfig, ...config },
        }));
    };

    const completeOnboarding = async (): Promise<boolean> => {
        setState(prev => ({ ...prev, isSaving: true }));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user');
                return false;
            }

            // 1. Create workspace
            const { data: workspace, error: workspaceError } = await supabase
                .from('workspaces')
                .insert({
                    user_id: user.id,
                    grid_title_id: state.gridTitleId,
                    grid_team_id: state.gridTeamId,
                    team_name: state.teamName,
                    game_title: state.gameTitle,
                })
                .select()
                .single();

            if (workspaceError) {
                console.error('Error creating workspace:', workspaceError);
                return false;
            }

            // 2. Create roster entries
            const rosterEntries = state.roster
                .filter(p => p.ign.trim() !== '')
                .map(p => ({
                    workspace_id: workspace.id,
                    role: p.role,
                    ign: p.ign,
                }));

            if (rosterEntries.length > 0) {
                const { error: rosterError } = await supabase
                    .from('roster')
                    .insert(rosterEntries);

                if (rosterError) {
                    console.error('Error creating roster:', rosterError);
                }
            }

            // 3. Create AI calibration
            const { error: calibrationError } = await supabase
                .from('ai_calibration')
                .insert({
                    workspace_id: workspace.id,
                    aggression: state.aiConfig.aggression,
                    resource_priority: state.aiConfig.resourcePriority,
                    vision_investment: state.aiConfig.visionInvestment,
                    early_game_pathing: state.aiConfig.earlyGamePathing,
                    objective_control: state.aiConfig.objectiveControl,
                });

            if (calibrationError) {
                console.error('Error creating AI calibration:', calibrationError);
            }

            // 4. Mark onboarding complete
            await supabase
                .from('profiles')
                .update({ onboarding_complete: true })
                .eq('id', user.id);

            // 5. Navigate to dashboard
            navigate('/dashboard');
            return true;

        } catch (error) {
            console.error('Error completing onboarding:', error);
            return false;
        } finally {
            setState(prev => ({ ...prev, isSaving: false }));
        }
    };

    return (
        <OnboardingContext.Provider
            value={{
                ...state,
                setGameAndTeam,
                setRoster,
                updateRosterPlayer,
                setAIConfig,
                completeOnboarding,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = (): OnboardingContextType => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return context;
};
