import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Helper to invoke the grid-players edge function
const invokeGridPlayers = async (action: string, params: any = {}) => {
    // 1. Get fresh session token explicitly
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 2. Manual fetch
    const functionUrl = `${supabase['supabaseUrl']}/functions/v1/grid-players`;

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token || ''}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, ...params })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Session expired or invalid JWT (grid-players). Redirecting to login...');
                window.location.href = '/auth';
                return { players: [], error: 'Unauthorized' };
            }
            throw new Error(data.error || 'Failed to fetch');
        }

        if (data.error) throw new Error(data.error);
        return data;

    } catch (error) {
        throw error;
    }
};

// ==========================================
// QUERIES
// ==========================================

export const useGridTeamPlayers = (teamId: string, first: number = 50, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['gridTeamPlayers', teamId, first],
        queryFn: async () => {
            // Manual fetch for consistency and 401 handling
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const functionUrl = `${supabase['supabaseUrl']}/functions/v1/grid-players`;

            try {
                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token || ''}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ teamId, first })
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        console.error('Session expired or invalid JWT (gridTeamPlayers). Redirecting to login...');
                        window.location.href = '/auth';
                        return { players: [], error: 'Unauthorized' };
                    }
                    throw new Error(data.error || 'Failed to fetch');
                }

                if (data.error) throw new Error(data.error);
                return data;
            } catch (error) {
                throw error;
            }
        },
        enabled: !!teamId && (options?.enabled ?? true)
    });
};

export const useGridPlayers = (filter?: any, first: number = 20, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['gridPlayers', filter, first],
        queryFn: () => invokeGridPlayers('players', { filter, first }),
        enabled: options?.enabled
    });
};

export const useGridPlayer = (id: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['gridPlayer', id],
        queryFn: () => invokeGridPlayers('player', { id }),
        enabled: !!id && (options?.enabled ?? true)
    });
};

export const useGridPlayerByExternalId = (dataProviderName: string, externalPlayerId: string, titleId?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['gridPlayerByExternalId', dataProviderName, externalPlayerId, titleId],
        queryFn: () => invokeGridPlayers('playerIdByExternalId', { dataProviderName, externalPlayerId, titleId }),
        enabled: !!dataProviderName && !!externalPlayerId && (options?.enabled ?? true)
    });
};

export const useGridPlayerRoles = (filter?: any, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['gridPlayerRoles', filter],
        queryFn: () => invokeGridPlayers('playerRoles', { filter }),
        enabled: options?.enabled
    });
};

export const useGridPlayerRole = (id: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['gridPlayerRole', id],
        queryFn: () => invokeGridPlayers('playerRole', { id }),
        enabled: !!id && (options?.enabled ?? true)
    });
};

// ==========================================
// MUTATIONS
// ==========================================

export const useGridCreatePlayer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: any) => invokeGridPlayers('createPlayer', { input }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gridPlayers'] });
        }
    });
};

export const useGridUpdatePlayer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: any) => invokeGridPlayers('updatePlayer', { input }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['gridPlayers'] });
            if (data?.updatePlayer?.player?.id) {
                queryClient.invalidateQueries({ queryKey: ['gridPlayer', data.updatePlayer.player.id] });
            }
        }
    });
};

export const useGridDeletePlayer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: any) => invokeGridPlayers('deletePlayer', { input }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gridPlayers'] });
        }
    });
};

export const useGridCreatePlayerRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: any) => invokeGridPlayers('createPlayerRole', { input }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gridPlayerRoles'] });
        }
    });
};

export const useGridUpdatePlayerRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: any) => invokeGridPlayers('updatePlayerRole', { input }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['gridPlayerRoles'] });
            if (data?.updatePlayerRole?.playerRole?.id) {
                queryClient.invalidateQueries({ queryKey: ['gridPlayerRole', data.updatePlayerRole.playerRole.id] });
            }
        }
    });
};

export const useGridDeletePlayerRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: any) => invokeGridPlayers('deletePlayerRole', { input }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gridPlayerRoles'] });
        }
    });
};
