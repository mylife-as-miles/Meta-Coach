// supabase/functions/grid-players/index.ts
// Fetch players by teamId from GRID

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

        const { teamId } = await req.json()

        if (!teamId) {
            return new Response(
                JSON.stringify({ error: 'teamId is required' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            )
        }

        // Query players for the specific team
        const playersQuery = `
      query GetPlayersForTeam($teamId: ID!) {
        players(
          filter: { teamIdFilter: { id: $teamId } }
          first: 20
        ) {
          edges {
            node {
              id
              nickname
              firstName
              lastName
              externalLinks {
                dataProvider { name }
                externalEntity { id }
              }
            }
          }
        }
      }
    `

        const playersRes = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': gridApiKey,
            },
            body: JSON.stringify({
                query: playersQuery,
                variables: { teamId }
            }),
        })

        if (!playersRes.ok) {
            throw new Error(`GRID API error: ${playersRes.status}`)
        }

        const playersData = await playersRes.json()
        const playerEdges = playersData.data?.players?.edges || []

        const players = playerEdges.map((edge: any) => ({
            id: edge.node.id,
            nickname: edge.node.nickname,
            firstName: edge.node.firstName,
            lastName: edge.node.lastName,
            externalLinks: edge.node.externalLinks
        }))

        return new Response(
            JSON.stringify({ players }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error fetching players:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
