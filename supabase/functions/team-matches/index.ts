// supabase/functions/team-matches/index.ts
// Fetch match history with DB Caching (Cache-Aside Pattern)
// Uses GRID API with correct matchesConnection query

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'
const CACHE_DURATION_MINUTES = 15

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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader! } }
    })

    const url = new URL(req.url)
    let teamId = url.searchParams.get('teamId')

    if (!teamId && req.method === 'POST') {
      const body = await req.json()
      teamId = body.teamId
    }

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: 'teamId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Check Cache (DISABLED via user request: "always fetch from grid")
    /*
    const { data: cacheHit } = await supabase
      .from('team_match_cache')
      .select('matches, updated_at')
      .eq('team_id', teamId)
      .single()

    if (cacheHit) {
      const lastUpdate = new Date(cacheHit.updated_at).getTime()
      const now = new Date().getTime()
      const diffMinutes = (now - lastUpdate) / (1000 * 60)

      if (diffMinutes < CACHE_DURATION_MINUTES) {
        console.log(`Serving from cache for team ${teamId} (Age: ${diffMinutes.toFixed(1)}m)`)
        return new Response(
          JSON.stringify({ matches: cacheHit.matches, source: 'cache' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }
    */

    // 2. Fetch from GRID (Cache Miss)
    console.log(`Fetching from GRID for team ${teamId}`)

    // Correct Query: matchesConnection (Canonical Way)
    const matchesQuery = `
      query TeamMatches($teamId: ID!) {
        matchesConnection(
          first: 10
          orderBy: { startTime: DESC }
          filter: {
            participants: {
              some: {
                teamId: { eq: $teamId }
              }
            }
          }
        ) {
          edges {
            node {
              id
              startTime
              status
              participants {
                team {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `
    console.log('GRID QUERY:', matchesQuery)

    const gridRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': gridApiKey },
      body: JSON.stringify({ query: matchesQuery, variables: { teamId } }),
    })

    if (!gridRes.ok) throw new Error(`GRID API error: ${gridRes.status}`);
    const gridData = await gridRes.json()

    if (gridData.errors) {
      console.error('GRID GraphQLErrors:', gridData.errors);
      throw new Error('GRID Query failed');
    }

    // Defensive parsing for matchesConnection
    const edges = gridData.data?.matchesConnection?.edges ?? []

    const matches = edges.map((edge: any) => {
      const node = edge.node;

      // Find opponent: The participant that is NOT the current team
      const opponent = node.participants?.find((p: any) => p.team?.id !== teamId)?.team;

      const startTime = new Date(node.startTime);
      const isPast = startTime < new Date();
      const status = node.status || (isPast ? 'finished' : 'scheduled');

      return {
        id: node.id,
        startTime: node.startTime,
        status: status,
        format: 'Bo1', // Default as format isn't in this specific query
        opponent: opponent ? { id: opponent.id, name: opponent.name } : null,
        // Normalizing structure for store consumption
        teams: node.participants?.map((p: any) => ({
          id: p.team?.id,
          name: p.team?.name
        })) || [],
        winnerId: null
      };
    })

    // 3. Update Cache
    const { error: upsertError } = await supabase
      .from('team_match_cache')
      .upsert({
        team_id: teamId,
        matches: matches,
        updated_at: new Date().toISOString()
      })

    if (upsertError) console.warn('Failed to update cache:', upsertError)

    return new Response(
      JSON.stringify({ matches, source: 'grid' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Error fetching matches:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
