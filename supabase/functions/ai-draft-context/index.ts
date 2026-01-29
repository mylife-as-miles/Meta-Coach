// supabase/functions/ai-draft-context/index.ts
// Prepare draft context for Gemini AI

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

        // Get workspace and AI calibration
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

        const { data: roster } = await supabase
            .from('roster')
            .select('role, ign')
            .eq('workspace_id', workspace.id)

        // Fetch recent series from GRID for context
        const query = `
      query TeamContext($teamId: ID!) {
        allSeries(
          filter: { teams: { id: { equals: $teamId } } }
          first: 10
          orderBy: { field: START_TIME, direction: DESC }
        ) {
          edges {
            node {
              id
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

        const response = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': gridApiKey,
            },
            body: JSON.stringify({
                query,
                variables: { teamId: workspace.grid_team_id }
            }),
        })

        const gridData = await response.json()
        const series = gridData.data?.allSeries?.edges || []

        // Calculate win rate from recent series
        let wins = 0
        let losses = 0
        series.forEach((s: any) => {
            const ourTeam = s.node.teams?.find((t: any) => t.baseInfo?.id === workspace.grid_team_id)
            if (ourTeam?.result === 'win') wins++
            else if (ourTeam?.result === 'loss') losses++
        })

        // Build AI context object
        const draftContext = {
            team: {
                id: workspace.grid_team_id,
                name: workspace.team_name,
                game: workspace.game_title,
            },
            teamStats: {
                recentWinRate: series.length > 0 ? (wins / series.length).toFixed(2) : 0,
                recentWins: wins,
                recentLosses: losses,
                totalSeriesAnalyzed: series.length,
            },
            teamIdentity: {
                aggression: calibration?.aggression || 50,
                resourcePriority: calibration?.resource_priority || 50,
                visionInvestment: calibration?.vision_investment || 50,
                earlyGameFocus: calibration?.early_game_pathing || false,
                objectiveControl: calibration?.objective_control || false,
            },
            roster: roster || [],
        }

        return new Response(
            JSON.stringify(draftContext),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error building draft context:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
