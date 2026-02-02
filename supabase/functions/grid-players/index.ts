// supabase/functions/grid-players/index.ts
// Comprehensive GRID Player API Proxy
// Supports Queries: players, player, playerIdByExternalId, playerRoles, playerRole
// Supports Mutations: createPlayer, updatePlayer, deletePlayer, createPlayerRole, updatePlayerRole, deletePlayerRole

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const gridApiKey = Deno.env.get('GRID_API_KEY')
        if (!gridApiKey) {
            throw new Error('GRID_API_KEY not configured')
        }

        const { action, ...params } = await req.json();
        console.log(`[grid-players] Action: ${action}`, params);

        let query = '';
        let variables = {};

        switch (action) {
            // ==========================================
            // QUERIES
            // ==========================================
            case 'players':
                query = `
                    query GetPlayers($filter: PlayerFilter, $first: Int, $after: String) {
                        players(filter: $filter, first: $first, after: $after) {
                            edges {
                                node {
                                    id
                                    nickname
                                    title { id name }
                                    team { id name }
                                    externalLinks {
                                        dataProvider { name }
                                        externalEntity { id }
                                    }
                                }
                            }
                            pageInfo {
                                hasNextPage
                                endCursor
                            }
                        }
                    }
                `;
                variables = {
                    filter: params.filter || {},
                    first: params.first || 50,
                    after: params.after || null
                };
                break;

            case 'player':
                query = `
                    query GetPlayer($id: ID!) {
                        player(id: $id) {
                            id
                            nickname
                            team { id name }
                            title { id name }
                            externalLinks {
                                dataProvider { name }
                                externalEntity { id }
                            }
                        }
                    }
                `;
                variables = { id: params.id };
                break;

            case 'playerIdByExternalId':
                query = `
                    query GetPlayerIdByExternalId($dataProviderName: String!, $externalPlayerId: ID!, $titleId: ID) {
                        playerIdByExternalId(dataProviderName: $dataProviderName, externalPlayerId: $externalPlayerId, titleId: $titleId)
                    }
                `;
                variables = {
                    dataProviderName: params.dataProviderName,
                    externalPlayerId: params.externalPlayerId,
                    titleId: params.titleId
                };
                break;

            case 'playerRoles':
                query = `
                    query GetPlayerRoles($filter: PlayerRoleFilter) {
                        playerRoles(filter: $filter) {
                            id
                            name
                            title { id name }
                        }
                    }
                `;
                variables = { filter: params.filter };
                break;

            case 'playerRole':
                query = `
                    query GetPlayerRole($id: ID!) {
                        playerRole(id: $id) {
                            id
                            name
                            title { id name }
                        }
                    }
                `;
                variables = { id: params.id };
                break;

            // ==========================================
            // MUTATIONS
            // ==========================================
            case 'createPlayer':
                query = `
                    mutation CreatePlayer($input: CreatePlayerInput!) {
                        createPlayer(createPlayerInput: $input) {
                            player {
                                id
                                nickname
                            }
                        }
                    }
                `;
                variables = { input: params.input };
                break;

            case 'updatePlayer':
                query = `
                    mutation UpdatePlayer($input: UpdatePlayerInput!) {
                        updatePlayer(updatePlayerInput: $input) {
                            player {
                                id
                                nickname
                                team { id name }
                            }
                        }
                    }
                `;
                variables = { input: params.input };
                break;

            case 'deletePlayer':
                query = `
                    mutation DeletePlayer($input: DeletePlayerInput!) {
                        deletePlayer(deletePlayerInput: $input) {
                            deletedPlayerId
                        }
                    }
                `;
                variables = { input: params.input };
                break;

            case 'createPlayerRole':
                query = `
                    mutation CreatePlayerRole($input: CreatePlayerRoleInput!) {
                        createPlayerRole(createPlayerRoleInput: $input) {
                            playerRole {
                                id
                                name
                            }
                        }
                    }
                `;
                variables = { input: params.input };
                break;

            case 'updatePlayerRole':
                query = `
                    mutation UpdatePlayerRole($input: UpdatePlayerRoleInput!) {
                        updatePlayerRole(updatePlayerRoleInput: $input) {
                            playerRole {
                                id
                                name
                            }
                        }
                    }
                `;
                variables = { input: params.input };
                break;

            case 'deletePlayerRole':
                query = `
                    mutation DeletePlayerRole($input: DeletePlayerRoleInput!) {
                        deletePlayerRole(deletePlayerRoleInput: $input) {
                             deletedPlayerRoleId
                        }
                    }
                `;
                variables = { input: params.input };
                break;

            // Default fallback for original team-based query (backward compatibility if needed, though we should migrate)
            default:
                if (params.teamId) {
                    // Legacy behavior for "list players by team"
                    query = `
                        query GetPlayersForTeam($teamId: ID!, $first: Int) {
                            players(filter: { teamIdFilter: { id: $teamId } }, first: $first) {
                                edges {
                                    node {
                                        id
                                        nickname
                                        externalLinks {
                                            dataProvider { name }
                                            externalEntity { id }
                                        }
                                    }
                                }
                            }
                        }
                    `;
                    variables = {
                        teamId: params.teamId,
                        first: params.first || 50
                    };
                } else {
                    throw new Error(`Unknown action: ${action}`);
                }
        }

        console.log(`Sending GRID Query for ${action || 'default'}`);

        const response = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': gridApiKey,
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GRID API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Handle GraphQL errors
        if (data.errors) {
            console.error('GraphQL Errors:', data.errors);
            throw new Error(data.errors[0].message);
        }

        return new Response(
            JSON.stringify(data.data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
