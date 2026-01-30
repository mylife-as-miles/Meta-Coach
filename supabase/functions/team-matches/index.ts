// supabase/functions/team-matches/index.ts
// Fetch team match history using lean GRID TeamMatches query

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const gridApiKey = Deno.env.get('GRID_API_KEY')
    if (!gridApiKey) {
      throw new Error('GRID_API_KEY not configured')
    }

    // Get teamId from query params or body
    const url = new URL(req.url)
    let teamId = url.searchParams.get('teamId')

    if (!teamId && req.method === 'POST') {
      const body = await req.json()
      teamId = body.teamId
    }

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: 'teamId is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Lean Matches Query
    const matchesQuery = `
      query TeamMatches($teamId: ID!) {
        matches(filter: { teamIdFilter: { id: $teamId } }, first: 10) {
          edges {
            node {
              id
              startTime
              status
              format
              teams {
                team {
                  id
                  name
                }
              }
              result {
                winner {
                  id
                }
              }
            }
          }
        }
      }
    `

    const matchesRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': gridApiKey,
      },
      body: JSON.stringify({
        query: matchesQuery,
        variables: { teamId }
      }),
    })

    if (!matchesRes.ok) {
      const text = await matchesRes.text();
      console.error('GRID API Error:', text);
      throw new Error(`GRID API error: ${matchesRes.status}`);
    }

    const matchesData = await matchesRes.json()

    if (matchesData.errors) {
      console.error('GRID GraphQLErrors:', matchesData.errors);
      throw new Error('GRID Query failed');
    }

    const matchesEdges = matchesData.data?.matches?.edges || []

    const matches = matchesEdges.map((edge: any) => ({
      id: edge.node.id,
      startTime: edge.node.startTime,
      status: edge.node.status,
      format: edge.node.format,
      teams: edge.node.teams?.map((t: any) => ({
        id: t.team.id,
        name: t.team.name
      })) || [],
      winnerId: edge.node.result?.winner?.id || null
    }))

    return new Response(
      JSON.stringify({ matches }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('Error fetching matches:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
