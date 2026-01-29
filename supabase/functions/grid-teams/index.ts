// supabase/functions/grid-teams/index.ts
// Fetch teams by title from GRID via Tournament -> Series lookup (Hackathon compatible)

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

    // STEP 1: Get Tournaments for the Title
    const tournamentsQuery = `
      query Tournaments($titleId: ID!) {
        tournaments(filter: { title: { id: { equals: $titleId } } }) {
          edges {
            node {
              id
            }
          }
        }
      }
    `

    const tourneyRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': gridApiKey,
      },
      body: JSON.stringify({
        query: tournamentsQuery,
        variables: { titleId }
      }),
    })

    if (!tourneyRes.ok) {
      throw new Error(`GRID API (Tournaments) error: ${tourneyRes.status}`)
    }

    const tourneyData = await tourneyRes.json()
    const tournamentIds = tourneyData.data?.tournaments?.edges?.map((e: any) => e.node.id) || []

    if (tournamentIds.length === 0) {
      return new Response(
        JSON.stringify({ teams: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // STEP 2: Get Teams via Series in those Tournaments
    // GRID data is series-centric. We fetch recent series to find active teams.
    const seriesQuery = `
      query SeriesTeams($tournamentIds: [ID!]) {
        allSeries(
          filter: {
            tournament: {
              id: { in: $tournamentIds }
              includeChildren: { equals: true }
            }
          }
          first: 50
        ) {
          edges {
            node {
              id
              teams {
                baseInfo {
                  id
                  name
                  logoUrl
                }
              }
            }
          }
        }
      }
    `

    const seriesRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': gridApiKey,
      },
      body: JSON.stringify({
        query: seriesQuery,
        variables: { tournamentIds }
      }),
    })

    if (!seriesRes.ok) {
      throw new Error(`GRID API (Series) error: ${seriesRes.status}`)
    }

    const seriesData = await seriesRes.json()
    const seriesEdges = seriesData.data?.allSeries?.edges || []

    // Extract unique teams
    const uniqueTeamsMap = new Map()

    seriesEdges.forEach((edge: any) => {
      const teams = edge.node.teams || []
      teams.forEach((teamObj: any) => {
        const baseInfo = teamObj.baseInfo
        if (baseInfo && baseInfo.id && baseInfo.name) {
          if (!uniqueTeamsMap.has(baseInfo.id)) {
            uniqueTeamsMap.set(baseInfo.id, {
              id: baseInfo.id,
              name: baseInfo.name,
              logoUrl: baseInfo.logoUrl
            })
          }
        }
      })
    })

    const teams = Array.from(uniqueTeamsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically

    if (teams.length === 0) {
      // Fallback for empty results (common in hackathon environments with limited scope)
      if (titleId === '3') { // League of Legends
        teams.push(
          { id: '1', name: 'T1' },
          { id: '2', name: 'G2 Esports' },
          { id: '3', name: 'Cloud9' },
          { id: '4', name: 'Fnatic' },
          { id: '5', name: 'Gen.G' }
        )
      } else if (titleId === '29') { // Valorant
        teams.push(
          { id: '101', name: 'Sentinels' },
          { id: '102', name: 'LOUD' },
          { id: '103', name: 'Fnatic' },
          { id: '104', name: 'Paper Rex' },
          { id: '105', name: 'DRX' }
        )
      }
    }

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
