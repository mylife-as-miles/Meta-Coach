// supabase/functions/grid-teams/index.ts
// Fetch teams by title from GRID (simplified titleId filter)

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

    // Get parameters from query params or body
    const url = new URL(req.url)
    let titleId = url.searchParams.get('titleId')
    let teamId = url.searchParams.get('teamId')

    if (!titleId && !teamId && req.method === 'POST') {
      const body = await req.json()
      titleId = body.titleId
      teamId = body.teamId
    }

    if (!titleId && !teamId) {
      return new Response(
        JSON.stringify({ error: 'titleId or teamId is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    let query = '';
    let variables = {};

    if (teamId) {
      // Lean Query #1: Team Identity
      query = `
        query GetTeam($id: ID!) {
          team(id: $id) {
            id
            name
            shortName
            logoUrl
            region {
              name
            }
          }
        }
      `;
      variables = { id: teamId };
    } else {
      // Map Valorant ID if necessary
      if (titleId === '29') {
        titleId = '6';
      }

      query = `
        query GetTeamsForTitle($titleId: ID!) {
            teams(
            filter: { titleId: $titleId }
            first: 50
            ) {
            totalCount
            edges {
                node {
                id
                name
                logoUrl
                colorPrimary
                colorSecondary
                }
            }
            }
        }
        `;
      variables = { titleId };
    }

    const teamsRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': gridApiKey,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!teamsRes.ok) {
      const text = await teamsRes.text();
      console.error('GRID API Error:', text);
      throw new Error(`GRID API error: ${teamsRes.status}`);
    }

    const json = await teamsRes.json();

    if (json.errors) {
      console.error('GRID GraphQLErrors:', json.errors);
      throw new Error('GRID Query failed');
    }

    // Return format depends on query
    let result;
    if (teamId) {
      result = { team: json.data?.team };
    } else {
      const teamsEdges = json.data?.teams?.edges || []
      const teams = teamsEdges.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        logoUrl: edge.node.logoUrl || null,
        colorPrimary: edge.node.colorPrimary || null,
        colorSecondary: edge.node.colorSecondary || null,
      }))
      // Sort alphabetically
      teams.sort((a: any, b: any) => a.name.localeCompare(b.name))
      result = { teams };
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('Error fetching teams:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
