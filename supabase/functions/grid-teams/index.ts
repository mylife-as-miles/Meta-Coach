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

    // Get titleId from query params or body
    const url = new URL(req.url)
    let titleId = url.searchParams.get('titleId')

    if (!titleId && req.method === 'POST') {
      const body = await req.json()
      titleId = body.titleId
    }

    if (!titleId) {
      return new Response(
        JSON.stringify({ error: 'titleId is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Map Valorant ID if necessary (from app's 29/6 to correct one if mixed up, but user said use "6")
    // User explicitly asked to use "6" for Valorant
    if (titleId === '29') {
      titleId = '6'; // Correct mappings based on user feedback
    }

    // Query teams using simplified titleId filter
    const teamsQuery = `
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
    `

    const teamsRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': gridApiKey,
      },
      body: JSON.stringify({
        query: teamsQuery,
        variables: { titleId }
      }),
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
