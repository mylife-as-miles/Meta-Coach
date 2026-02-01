import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useOnboardingStore } from '../stores/useOnboardingStore';

// Keys for caching
export const onboardingKeys = {
    teams: (titleId: string | null) => ['onboarding', 'teams', titleId] as const,
    players: (teamId: string | null, titleId: string | null) => ['onboarding', 'players', teamId, titleId] as const,
};

export function useGridTeams(titleId: string | null) {
    return useQuery({
        queryKey: onboardingKeys.teams(titleId),
        queryFn: async () => {
            if (!titleId) return [];

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${supabase['supabaseUrl']}/functions/v1/grid-teams`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ titleId })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/auth';
                    throw new Error('Unauthorized');
                }
                throw new Error('Failed to fetch teams');
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            return data?.teams || [];
        },
        enabled: !!titleId,
        staleTime: 1000 * 60 * 60, // 1 hour (teams don't change often)
    });
}

export function useGridPlayers(teamId: string | null, titleId: string | null) {
    // Get teamName from store to pass to the edge function for AI search
    const teamName = useOnboardingStore(state => state.teamName);

    return useQuery({
        queryKey: onboardingKeys.players(teamId, titleId),
        queryFn: async () => {
            if (!teamId) return [];
            console.log('Fetching players for team:', teamId, 'with name:', teamName);

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${supabase['supabaseUrl']}/functions/v1/grid-players`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    teamId,
                    titleId,
                    teamName // Important for AI image search
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/auth';
                    throw new Error('Unauthorized');
                }
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch players');
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            console.log('Players fetched:', data?.players?.length);
            return data?.players || [];
        },
        enabled: !!teamId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1, // Retry once if AI search fails or timeouts
    });
}
