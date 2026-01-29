// supabase/functions/team-matches/index.ts
// Fetch team match history using GRID Central Data + Series State APIs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { GRID_URLS, getGridHeaders } from '../_shared/grid-config.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const gridApiKey = Deno.env.get('GRID_API_KEY')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

        if (!gridApiKey || !supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing environment variables')
        }

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Authorization required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Invalid user' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const { data: workspace } = await supabase
            .from('workspaces')
            .select('grid_team_id, grid_title_id')
            .eq('user_id', user.id)
            .single()

        if (!workspace) {
            return new Response(
                JSON.stringify({ error: 'No workspace found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        // Get limit from query params
        const url = new URL(req.url)
        const limit = parseInt(url.searchParams.get('limit') || '10')

        // Step 1: Fetch series IDs from Central Data API
        const centralQuery = `
      query TeamSeries($teamId: ID!, $first: Int) {
        allSeries(
          filter: { 
            teams: { id: { equals: $teamId } }
          }
          first: $first
          orderBy: { field: START_TIME, direction: DESC }
        ) {
          edges {
            node {
              id
              startTimeScheduled
              format {
                nameShortened
              }
              teams {
                baseInfo {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `

        const centralResponse = await fetch(GRID_URLS.CENTRAL_DATA, {
            method: 'POST',
            headers: getGridHeaders(gridApiKey),
            body: JSON.stringify({
                query: centralQuery,
                variables: { teamId: workspace.grid_team_id, first: limit }
            }),
        })

        if (!centralResponse.ok) {
            throw new Error(`Central Data API error: ${centralResponse.status}`)
        }

        const centralData = await centralResponse.json()
        const seriesEdges = centralData.data?.allSeries?.edges || []

        // Step 2: Fetch detailed stats from Series State API for each series
        const matches = await Promise.all(
            seriesEdges.map(async (edge: any) => {
                const series = edge.node
                const opponent = series.teams?.find((t: any) => t.baseInfo?.id !== workspace.grid_team_id)

                // Fetch series state for detailed stats
                const stateQuery = `
          query SeriesState($id: ID!) {
            seriesState(id: $id) {
              finished
              teams {
                id
                name
                won
                score
              }
              games {
                sequenceNumber
                finished
                teams {
                  id
                  won
                }
              }
            }
          }
        `

                try {
                    const stateResponse = await fetch(GRID_URLS.SERIES_STATE, {
                        method: 'POST',
                        headers: getGridHeaders(gridApiKey),
                        body: JSON.stringify({
                            query: stateQuery,
                            variables: { id: series.id }
                        }),
                    })

                    const stateData = await stateResponse.json()
                    const state = stateData.data?.seriesState

                    const ourTeam = state?.teams?.find((t: any) => t.id === workspace.grid_team_id)
                    const theirTeam = state?.teams?.find((t: any) => t.id !== workspace.grid_team_id)

                    return {
                        id: series.id,
                        date: series.startTimeScheduled,
                        format: series.format?.nameShortened || 'Bo1',
                        opponent: opponent?.baseInfo?.name || theirTeam?.name || 'Unknown',
                        opponentId: opponent?.baseInfo?.id || theirTeam?.id,
                        ourScore: ourTeam?.score || 0,
                        theirScore: theirTeam?.score || 0,
                        result: ourTeam?.won ? 'win' : (theirTeam?.won ? 'loss' : 'unknown'),
                        finished: state?.finished || false,
                        gamesPlayed: state?.games?.length || 0,
                    }
                } catch {
                    // Fallback if series state fails
                    return {
                        id: series.id,
                        date: series.startTimeScheduled,
                        format: series.format?.nameShortened || 'Bo1',
                        opponent: opponent?.baseInfo?.name || 'Unknown',
                        opponentId: opponent?.baseInfo?.id,
                        ourScore: 0,
                        theirScore: 0,
                        result: 'unknown',
                        finished: false,
                        gamesPlayed: 0,
                    }
                }
            })
        )

        return new Response(
            JSON.stringify({ matches }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error fetching team matches:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
