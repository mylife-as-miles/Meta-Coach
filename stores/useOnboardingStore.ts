import { create } from 'zustand';
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
    role: string;

    // Step 2: Roster
    roster: RosterPlayer[];

    // Step 3: AI Config
    aiConfig: AIConfig;

    // Loading state
    isSaving: boolean;
}

interface OnboardingActions {
    // Step 1 actions
    setGameAndTeam: (titleId: string, teamId: string, teamName: string, gameTitle: string) => void;

    // Step 2 actions
    setRoster: (roster: RosterPlayer[]) => void;
    updateRosterPlayer: (index: number, ign: string) => void;

    // Step 3 actions
    setAIConfig: (config: Partial<AIConfig>) => void;

    // Final save
    completeOnboarding: (navigate: (path: string) => void) => Promise<boolean>;

    // Reset
    reset: () => void;
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

const initialState: OnboardingState = {
    gridTitleId: null,
    gridTeamId: null,
    teamName: null,
    gameTitle: null,
    role: 'Coach',
    roster: defaultRoster,
    aiConfig: defaultAIConfig,
    isSaving: false,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>((set, get) => ({
    ...initialState,

    setGameAndTeam: (titleId, teamId, teamName, gameTitle) => {
        set({
            gridTitleId: titleId,
            gridTeamId: teamId,
            teamName,
            gameTitle,
        });
    },

    setRoster: (roster) => {
        set({ roster });
    },

    updateRosterPlayer: (index, ign) => {
        const roster = [...get().roster];
        roster[index] = { ...roster[index], ign };
        set({ roster });
    },

    setAIConfig: (config) => {
        set((state) => ({
            aiConfig: { ...state.aiConfig, ...config },
        }));
    },

    completeOnboarding: async (navigate) => {
        set({ isSaving: true });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user');
                return false;
            }

            const state = get();

            // 1. Create workspace
            console.log("Saving Workspace with state:", state);

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

            console.log("Workspace created:", workspace);

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
                .upsert({
                    id: user.id,
                    onboarding_complete: true,
                    updated_at: new Date().toISOString(),
                    username: user.user_metadata?.username || user.email?.split('@')[0],
                    role: state.role || 'Coach',
                })
                .select();

            // 5. Navigate to dashboard
            navigate('/dashboard');
            return true;

        } catch (error) {
            console.error('Error completing onboarding:', error);
            return false;
        } finally {
            set({ isSaving: false });
        }
    },

    reset: () => {
        set(initialState);
    },
}));

// Re-export types for consumers
export type { RosterPlayer, AIConfig, OnboardingState };
