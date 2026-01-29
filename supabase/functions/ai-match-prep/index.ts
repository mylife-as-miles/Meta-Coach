// supabase/functions/ai-match-prep/index.ts
// Prepare match prep context for Gemini AI

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'

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

        // Get opponent ID from request
        const url = new URL(req.url)
        let opponentId = url.searchParams.get('opponentId')

        if (!opponentId && req.method === 'POST') {
            const body = await req.json()
            opponentId = body.opponentId
        }

        if (!opponentId) {
            return new Response(
                JSON.stringify({ error: 'opponentId is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
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
            .select('id, grid_team_id, team_name, game_title')
            .eq('user_id', user.id)
            .single()

        if (!workspace) {
            return new Response(
                JSON.stringify({ error: 'No workspace found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        const { data: calibration } = await supabase
            .from('ai_calibration')
            .select('*')
            .eq('workspace_id', workspace.id)
            .single()

        // Fetch opponent info from GRID
        const opponentQuery = `
      query OpponentInfo($opponentId: ID!) {
        team(id: $opponentId) {
          id
          name
        }
      }
    `

        const opponentRes = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': gridApiKey,
            },
            body: JSON.stringify({
                query: opponentQuery,
                variables: { opponentId }
            }),
        })

        const opponentData = await opponentRes.json()
        const opponent = opponentData.data?.team || { name: 'Unknown', id: opponentId }

        // Fetch head-to-head series
        const h2hQuery = `
      query HeadToHead($teamId: ID!, $opponentId: ID!) {
        allSeries(
          filter: {
            AND: [
              { teams: { id: { equals: $teamId } } }
              { teams: { id: { equals: $opponentId } } }
            ]
          }
          first: 10
          orderBy: { field: START_TIME, direction: DESC }
        ) {
          edges {
            node {
              id
              startTimeScheduled
              teams {
                baseInfo { id name }
                score
                result
              }
            }
          }
        }
      }
    `

        const h2hRes = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': gridApiKey,
            },
            body: JSON.stringify({
                query: h2hQuery,
                variables: { teamId: workspace.grid_team_id, opponentId }
            }),
        })

        const h2hData = await h2hRes.json()
        const h2hSeries = h2hData.data?.allSeries?.edges || []

        // Calculate head-to-head stats
        let h2hWins = 0
        let h2hLosses = 0
        h2hSeries.forEach((s: any) => {
            const ourTeam = s.node.teams?.find((t: any) => t.baseInfo?.id === workspace.grid_team_id)
            if (ourTeam?.result === 'win') h2hWins++
            else if (ourTeam?.result === 'loss') h2hLosses++
        })

        // Build match prep context
        const matchPrepContext = {
            teamProfile: {
                id: workspace.grid_team_id,
                name: workspace.team_name,
                game: workspace.game_title,
                identity: {
                    aggression: calibration?.aggression || 50,
                    resourcePriority: calibration?.resource_priority || 50,
                    visionInvestment: calibration?.vision_investment || 50,
                    earlyGameFocus: calibration?.early_game_pathing || false,
                    objectiveControl: calibration?.objective_control || false,
                },
            },
            opponentProfile: {
                id: opponent.id,
                name: opponent.name,
            },
            headToHead: {
                totalMeetings: h2hSeries.length,
                ourWins: h2hWins,
                theirWins: h2hLosses,
                lastMeeting: h2hSeries[0]?.node?.startTimeScheduled || null,
            },
        }

        return new Response(
            JSON.stringify(matchPrepContext),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error building match prep context:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
