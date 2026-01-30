// supabase/functions/team-matches/index.ts
// Fetch match history with DB Caching (Cache-Aside Pattern)
// Uses GRID Central Data API (allSeries) + Series State API (seriesState)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'
const SERIES_STATE_URL = 'https://api-op.grid.gg/live-data-feed/series-state/graphql'
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

    // 1. Check Cache
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
        return new Response(
          JSON.stringify({ matches: cacheHit.matches, source: 'cache' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    // 2. Fetch from GRID (Cache Miss)
    // Step A: Get Series List
    const seriesQuery = `
      query TeamSeries($teamId: ID!) {
        allSeries(
          filter: { 
             teams: { id: { equals: $teamId } }
          }
          first: 10
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

    const gridRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': gridApiKey },
      body: JSON.stringify({ query: seriesQuery, variables: { teamId } }),
    })

    if (!gridRes.ok) throw new Error(`GRID Central API error: ${gridRes.status}`);
    const gridData = await gridRes.json()
    const edges = gridData.data?.allSeries?.edges || []

    // Step B: Get Details for each Series (Parallel)
    const matches = await Promise.all(edges.map(async (edge: any) => {
      const node = edge.node;
      const startTime = new Date(node.startTimeScheduled);
      const isPast = startTime < new Date();

      // Base match object
      let match = {
        id: node.id,
        startTime: node.startTimeScheduled,
        status: isPast ? 'finished' : 'scheduled',
        format: node.format?.nameShortened || 'Bo1',
        teams: node.teams?.map((t: any) => ({
          id: t.baseInfo?.id,
          name: t.baseInfo?.name
        })) || [],
        winnerId: null as string | null
      };

      // If finished, fetch detail to get winner
      if (isPast) {
        try {
          const stateQuery = `
                    query SeriesState($id: ID!) {
                        seriesState(id: $id) {
                            teams {
                                id
                                won
                            }
                        }
                    }
                `;
          const stateRes = await fetch(SERIES_STATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': gridApiKey },
            body: JSON.stringify({ query: stateQuery, variables: { id: node.id } }),
          });

          if (stateRes.ok) {
            const stateData = await stateRes.json();
            const winner = stateData.data?.seriesState?.teams?.find((t: any) => t.won);
            if (winner) match.winnerId = winner.id;
          }
        } catch (e) {
          console.warn(`Failed to fetch state for series ${node.id}`, e);
        }
      }
      return match;
    }));

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
