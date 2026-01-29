// supabase/functions/grid-teams/index.ts
// Fetch all teams from GRID (no title filter)

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

    // Query all teams (no title filter) - GRID has 3793+ teams
    const teamsQuery = `
      query GetTeams {
        teams(first: 100) {
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
    `

    const teamsRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': gridApiKey,
      },
      body: JSON.stringify({ query: teamsQuery }),
    })

    if (!teamsRes.ok) {
      throw new Error(`GRID API error: ${teamsRes.status}`)
    }

    const teamsData = await teamsRes.json()
    const teamsEdges = teamsData.data?.teams?.edges || []

    const teams = teamsEdges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      logoUrl: edge.node.logoUrl || null,
      colorPrimary: edge.node.colorPrimary || null,
      colorSecondary: edge.node.colorSecondary || null,
    }))

    // Sort alphabetically
    teams.sort((a: any, b: any) => a.name.localeCompare(b.name))

    return new Response(
      JSON.stringify({ teams }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
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
