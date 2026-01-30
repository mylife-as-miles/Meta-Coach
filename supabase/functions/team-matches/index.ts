// supabase/functions/team-matches/index.ts
// Fetch match history (past) and schedule (upcoming)
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

    console.log(`Fetching matches for team ${teamId}`)
    const nowISO = new Date().toISOString();

    // Query both History (Past) and Upcoming (Future)
    // History: lt now, DESC, first 10
    // Upcoming: gt now, ASC, first 5
    const combinedQuery = `
      query GetMatches($teamId: ID!) {
        history: allSeries(
          filter: {
            teamIds: { in: [$teamId] }
            startTimeScheduled: { lt: "${nowISO}" }
          }
          first: 10
          orderBy: START_TIME_SCHEDULED
          orderDirection: DESC
        ) {
          edges {
            node {
              ...SeriesFields
            }
          }
        }
        upcoming: allSeries(
          filter: {
            teamIds: { in: [$teamId] }
            startTimeScheduled: { gt: "${nowISO}" }
          }
          first: 5
          orderBy: START_TIME_SCHEDULED
          orderDirection: ASC
        ) {
          edges {
            node {
              ...SeriesFields
            }
          }
        }
      }

      fragment SeriesFields on Series {
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
    `

    const gridRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': gridApiKey },
      body: JSON.stringify({
        query: combinedQuery,
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

    const historyEdges = gridData.data?.history?.edges ?? [];
    const upcomingEdges = gridData.data?.upcoming?.edges ?? [];

    const processNode = (node: any, isUpcoming: boolean) => {
        // Find opponent: The participant that is NOT the current team
        const opponentTeam = node.teams?.find((t: any) => t.baseInfo?.id !== teamId);
        const myTeam = node.teams?.find((t: any) => t.baseInfo?.id === teamId);

        let result = 'UPCOMING';
        let status = 'scheduled';

        if (!isUpcoming && node.endTimeActual) {
            status = 'finished';
            const myScore = myTeam?.scoreAdvantage || 0;
            const oppScore = opponentTeam?.scoreAdvantage || 0;
            if (myScore > oppScore) result = 'WIN';
            else if (myScore < oppScore) result = 'LOSS';
            else result = 'DRAW';
        }

        return {
            id: node.id,
            startTime: node.startTimeScheduled,
            status: status,
            format: node.format?.nameShortened || node.format?.name || 'Bo1',
            type: node.type,
            result: result,
            score: isUpcoming ? 'VS' : `${myTeam?.scoreAdvantage || 0} - ${opponentTeam?.scoreAdvantage || 0}`,
            opponent: opponentTeam ? {
                id: opponentTeam.baseInfo.id,
                name: opponentTeam.baseInfo.name,
                abbreviation: opponentTeam.baseInfo.nameShortened
            } : null,
            tournament: node.tournament ? {
                name: node.tournament.name
            } : null
        };
    };

    const historyMatches = historyEdges.map((e: any) => processNode(e.node, false));
    const upcomingMatches = upcomingEdges.map((e: any) => processNode(e.node, true));

    // Combine: Upcoming (ASC) -> History (DESC)
    // But typically dashboards show Most Recent at top.
    // If we want [Upcoming Soonest, Upcoming Later ... Past Recent, Past Older]
    // Or [Upcoming Later, Upcoming Soonest, Past Recent, Past Older] to keep time continuous?
    // Usually "Upcoming" is a separate section.
    // If mixed: Future -> Past (Time Descending).
    // Upcoming: we got ASC (Soonest first). So [Soonest, Next, Later].
    // History: we got DESC (Recent first). So [Recent, Older].
    // If we want Time Descending: [Upcoming Later, Upcoming Soonest, Past Recent, Past Older].
    // Let's just return all and let frontend sort if needed, or stick to simple concatenation.
    // Let's put Upcoming matches *first* in the list, ordered by soonest (ASC), then History (DESC).
    // This highlights the "Next Match" at the top of the upcoming list.

    const matches = [...upcomingMatches, ...historyMatches];

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
