// supabase/functions/grid-teams/index.ts
// Fetch teams by title from GRID via Series lookup (correct first-onboarding flow)

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

    // Fetch recent series for the title, then extract teams
    // This is the correct approach per GRID's event-centric data model
    const seriesQuery = `
      query GetSeries($titleId: ID!) {
        allSeries(first: 50, filter: { title: { id: { equals: $titleId } } }) {
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
        variables: { titleId }
      }),
    })

    if (!seriesRes.ok) {
      throw new Error(`GRID API error: ${seriesRes.status}`)
    }

    const seriesData = await seriesRes.json()
    const seriesEdges = seriesData.data?.allSeries?.edges || []

    // Extract unique teams from all series
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
              logoUrl: baseInfo.logoUrl || null
            })
          }
        }
      })
    })

    const teams = Array.from(uniqueTeamsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically

    // No fallback - if empty, return empty. UI will handle "No teams found."
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
