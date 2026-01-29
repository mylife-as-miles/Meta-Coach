// supabase/functions/team-profile/index.ts
// Fetch team profile (scoped to user's gridTeamId)

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

        // Get user's authorization
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Authorization required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // Create Supabase client with user's JWT
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        // Get user's workspace (team binding)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Invalid user' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .select('grid_team_id, team_name, game_title')
            .eq('user_id', user.id)
            .single()

        if (wsError || !workspace) {
            return new Response(
                JSON.stringify({ error: 'No workspace found. Complete onboarding first.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        // Fetch team data from GRID
        const query = `
      query Team($teamId: ID!) {
        team(id: $teamId) {
          id
          name
          region
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

        if (!response.ok) {
            throw new Error(`GRID API error: ${response.status}`)
        }

        const data = await response.json()
        const team = data.data?.team || {}

        return new Response(
            JSON.stringify({
                teamId: workspace.grid_team_id,
                teamName: workspace.team_name || team.name,
                gameTitle: workspace.game_title,
                region: team.region || 'Unknown',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error fetching team profile:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
