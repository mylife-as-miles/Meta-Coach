// supabase/functions/team-matches/index.ts
// Fetch match history with DB Caching (Cache-Aside Pattern)
// Uses GRID API Central Data Feed (allSeries query)

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

    console.log(`Fetching from GRID for team ${teamId}`)

    // Query: allSeries with teamIds filter (Canonical Way)
    const matchesQuery = `
      query GetTeamMatchHistory($teamId: ID!) {
        allSeries(
          filter: {
            teamIds: { in: [$teamId] }
            startTimeScheduled: { lt: "2026-02-18T00:00:00Z" }
          }
          first: 10
          orderBy: START_TIME_SCHEDULED
          orderDirection: DESC
        ) {
          edges {
            node {
              id
              startTimeScheduled
              endTimeActual
              format {
                name
                nameShortened
              }
              type
              tournament {
                id
                name
                slug
              }
              teams {
                baseInfo {
                  id
                  name
                  nameShortened
                }
                scoreAdvantage
              }
            }
          }
        }
      }
    `

    // Note: using a future date "2026-02-18" as a safe upper bound for "now" since `now` isn't a valid scalar input in GraphQL directly without variable.
    // In a real prod env, we'd pass `new Date().toISOString()` as a variable `$now`.
    const nowISO = new Date().toISOString();

    const gridRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': gridApiKey },
      body: JSON.stringify({
        query: matchesQuery.replace('"2026-02-18T00:00:00Z"', `"${nowISO}"`), // Dynamic replacement for simplicity or use variable
        variables: { teamId }
      }),
    })

    if (!gridRes.ok) {
        const text = await gridRes.text();
        console.error(`GRID API error ${gridRes.status}:`, text);
        throw new Error(`GRID API error: ${gridRes.status}`);
    }

    const gridData = await gridRes.json()

    if (gridData.errors) {
      console.error('GRID GraphQLErrors:', JSON.stringify(gridData.errors, null, 2));
      throw new Error('GRID Query failed');
    }

    const edges = gridData.data?.allSeries?.edges ?? []

    const matches = edges.map((edge: any) => {
      const node = edge.node;

      // Find opponent: The participant that is NOT the current team
      const opponentTeam = node.teams?.find((t: any) => t.baseInfo?.id !== teamId);
      const myTeam = node.teams?.find((t: any) => t.baseInfo?.id === teamId);

      // Determine winner if possible (simple heuristic based on scoreAdvantage or existence of endTimeActual)
      // Note: scoreAdvantage logic depends on series format (e.g. map wins).
      // Often strictly identifying a "winner" requires checking map scores or seriesResult if available.
      // Here we map basic info.

      const isFinished = !!node.endTimeActual;

      // Heuristic for result:
      // If myTeam.scoreAdvantage > opponentTeam.scoreAdvantage => WIN
      // This might not be 100% accurate for all titles but serves as a proxy.
      let result = 'UPCOMING';
      if (isFinished) {
          const myScore = myTeam?.scoreAdvantage || 0;
          const oppScore = opponentTeam?.scoreAdvantage || 0;
          if (myScore > oppScore) result = 'WIN';
          else if (myScore < oppScore) result = 'LOSS';
          else result = 'DRAW'; // or unknown
      } else {
          result = 'SCHEDULED';
      }

      return {
        id: node.id,
        startTime: node.startTimeScheduled,
        status: isFinished ? 'finished' : 'scheduled',
        format: node.format?.nameShortened || node.format?.name || 'Bo1',
        type: node.type,
        result: result,
        score: `${myTeam?.scoreAdvantage || 0} - ${opponentTeam?.scoreAdvantage || 0}`,
        opponent: opponentTeam ? {
            id: opponentTeam.baseInfo.id,
            name: opponentTeam.baseInfo.name,
            abbreviation: opponentTeam.baseInfo.nameShortened
        } : null,
        tournament: node.tournament ? {
            name: node.tournament.name
        } : null,
        // Legacy fields for compat
        winnerId: result === 'WIN' ? teamId : (result === 'LOSS' ? opponentTeam?.baseInfo?.id : null)
      };
    })

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
