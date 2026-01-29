// supabase/functions/series-state/index.ts
// Fetch detailed series state (post-match stats) from GRID Series State API

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

        // Get series ID from request
        const url = new URL(req.url)
        let seriesId = url.searchParams.get('seriesId')

        if (!seriesId && req.method === 'POST') {
            const body = await req.json()
            seriesId = body.seriesId
        }

        if (!seriesId) {
            return new Response(
                JSON.stringify({ error: 'seriesId is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Validate user
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

        // Fetch detailed series state
        const query = `
      query SeriesState($id: ID!) {
        seriesState(id: $id) {
          id
          finished
          startedAt
          teams {
            id
            name
            won
            score
          }
          games {
            sequenceNumber
            finished
            clock {
              currentSeconds
            }
            teams {
              id
              name
              won
              side
              players {
                id
                name
                kills
                deaths
                assists
                creepScore
                wardsPlaced
                goldEarned
                level
              }
            }
          }
        }
      }
    `

        const response = await fetch(GRID_URLS.SERIES_STATE, {
            method: 'POST',
            headers: getGridHeaders(gridApiKey),
            body: JSON.stringify({
                query,
                variables: { id: seriesId }
            }),
        })

        if (!response.ok) {
            throw new Error(`Series State API error: ${response.status}`)
        }

        const data = await response.json()
        const seriesState = data.data?.seriesState

        if (!seriesState) {
            return new Response(
                JSON.stringify({ error: 'Series not found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        // Shape the response for AI consumption
        const shapedResponse = {
            seriesId: seriesState.id,
            finished: seriesState.finished,
            startedAt: seriesState.startedAt,
            teams: seriesState.teams?.map((t: any) => ({
                id: t.id,
                name: t.name,
                won: t.won,
                score: t.score,
            })) || [],
            games: seriesState.games?.map((g: any) => ({
                gameNumber: g.sequenceNumber,
                finished: g.finished,
                duration: g.clock?.currentSeconds || 0,
                teams: g.teams?.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    won: t.won,
                    side: t.side,
                    players: t.players?.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        kills: p.kills || 0,
                        deaths: p.deaths || 0,
                        assists: p.assists || 0,
                        cs: p.creepScore || 0,
                        wards: p.wardsPlaced || 0,
                        gold: p.goldEarned || 0,
                        level: p.level || 1,
                    })) || [],
                })) || [],
            })) || [],
        }

        return new Response(
            JSON.stringify(shapedResponse),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error fetching series state:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
