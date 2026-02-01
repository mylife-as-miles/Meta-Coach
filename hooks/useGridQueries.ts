import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Helper to invoke the grid-players edge function
const invokeGridPlayers = async (action: string, params: any = {}) => {
    const { data, error } = await supabase.functions.invoke('grid-players', {
        body: { action, ...params }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);
    return data;
};

// ==========================================
// QUERIES
// ==========================================

export const useGridTeamPlayers = (teamId: string, first: number = 50, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['gridTeamPlayers', teamId, first],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('grid-players', {
                body: { teamId, first } // Sending simplified payload as requested
            });
            if (error) throw error;
            if (data.error) throw new Error(data.error);
            return data;
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
