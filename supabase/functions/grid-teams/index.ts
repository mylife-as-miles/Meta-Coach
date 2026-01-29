// supabase/functions/grid-teams/index.ts
// Fetch teams by title from GRID with curated fallback

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'

// Curated fallback teams for known titles (used when GRID has no ingested matches yet)
const CURATED_TEAMS: Record<string, Array<{ id: string; name: string; logoUrl: string | null }>> = {
  '3': [ // League of Legends
    { id: 'lol-1', name: 'T1', logoUrl: null },
    { id: 'lol-2', name: 'G2 Esports', logoUrl: null },
    { id: 'lol-3', name: 'Cloud9', logoUrl: null },
    { id: 'lol-4', name: 'Fnatic', logoUrl: null },
    { id: 'lol-5', name: 'Gen.G', logoUrl: null },
    { id: 'lol-6', name: 'Team Liquid', logoUrl: null },
    { id: 'lol-7', name: 'DRX', logoUrl: null },
    { id: 'lol-8', name: 'JD Gaming', logoUrl: null },
  ],
  '29': [ // Valorant
    { id: 'val-1', name: 'Sentinels', logoUrl: null },
    { id: 'val-2', name: 'LOUD', logoUrl: null },
    { id: 'val-3', name: 'Fnatic', logoUrl: null },
    { id: 'val-4', name: 'Paper Rex', logoUrl: null },
    { id: 'val-5', name: 'DRX', logoUrl: null },
    { id: 'val-6', name: 'NRG', logoUrl: null },
    { id: 'val-7', name: 'Evil Geniuses', logoUrl: null },
    { id: 'val-8', name: 'Team Liquid', logoUrl: null },
  ],
}

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

    // Query teams filtered by titleId
    const teamsQuery = `
      query GetTeams($titleId: ID!) {
        teams(first: 50, filter: { title: { id: { equals: $titleId } } }) {
          edges {
            node {
              id
              name
              logoUrl
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

    let teams = teamsEdges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      logoUrl: edge.node.logoUrl || null
    }))

    // If empty, use curated fallback for this title
    if (teams.length === 0 && CURATED_TEAMS[titleId]) {
      teams = CURATED_TEAMS[titleId]
    }

    // Sort alphabetically
    teams.sort((a: any, b: any) => a.name.localeCompare(b.name))

    return new Response(
      JSON.stringify({ teams, isCurated: teamsEdges.length === 0 && teams.length > 0 }),
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
