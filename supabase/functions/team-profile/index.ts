// supabase/functions/team-profile/index.ts
// Fetch team profile with enhanced details (logo, roster, country)
// Uses GRID API Central Data Feed

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

        // Enhanced query with full team details
        const query = `
            query Team($teamId: ID!) {
                team(id: $teamId) {
                    id
                    name
                    acronym
                    logoUrl
                    region
                    country {
                        name
                        shortName
                    }
                    players {
                        id
                        nickname
                        firstName
                        lastName
                        country {
                            name
                            shortName
                        }
                    }
                }
            }
        `

        const response = await fetch(GRID_URLS.CENTRAL_DATA, {
            method: 'POST',
            headers: getGridHeaders(gridApiKey),
            body: JSON.stringify({
                query,
                variables: { teamId: workspace.grid_team_id }
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`[team-profile] GRID API error: ${errorText}`)
            throw new Error(`GRID API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.errors) {
            console.warn('[team-profile] GraphQL errors:', data.errors)
        }

        const team = data.data?.team || {}

        // Shape enhanced response
        const enhancedProfile = {
            teamId: workspace.grid_team_id,
            teamName: workspace.team_name || team.name || 'Unknown Team',
            acronym: team.acronym || (team.name || '').substring(0, 3).toUpperCase(),
            logoUrl: team.logoUrl || null,
            game: workspace.game_title || 'Esports',
            region: team.region || 'Unknown',
            country: team.country?.name || null,
            countryCode: team.country?.shortName || null,
            roster: (team.players || []).map((p: any) => ({
                id: p.id,
                nickname: p.nickname,
                firstName: p.firstName || null,
                lastName: p.lastName || null,
                country: p.country?.name || null,
                countryCode: p.country?.shortName || null,
            })),
            source: 'grid'
        }

        return new Response(
            JSON.stringify(enhancedProfile),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error: any) {
        console.error('[team-profile] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
