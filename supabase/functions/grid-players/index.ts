// supabase/functions/grid-players/index.ts
// Fetch players by teamId from GRID

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const VLR_API_BASE = 'https://vlr.orlandomm.net/api/v1'

const fetchValorantImage = async (nickname: string): Promise<string | null> => {
    try {
        // Search for player
        const searchRes = await fetch(`${VLR_API_BASE}/players?q=${encodeURIComponent(nickname)}`)
        if (!searchRes.ok) return null

        const searchData = await searchRes.json()
        const player = searchData.data?.[0] // Take first match

        if (!player?.id) return null

        // Get player details for image
        // Sometimes search returns image, but let's be safe if detailed endpoint is needed.
        // Looking at common VLR wrappers, search usually returns basic info including img.
        // If not, we'd query /players/:id. Let's assume search result might have it or we query detail.
        // Based on user snippet, they used /players/:id. Let's try that.

        const detailRes = await fetch(`${VLR_API_BASE}/players/${player.id}`)
        if (!detailRes.ok) {
            // Fallback: maybe search result had it?
            return player.img || null
        }

        const detailData = await detailRes.json()
        return detailData.data?.info?.img || player.img || null

    } catch (e) {
        console.error(`Error fetching VLR image for ${nickname}:`, e)
        return null
    }
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

        const { teamId, titleId } = await req.json()

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

        let players = playerEdges.map((edge: any) => ({
            id: edge.node.id,
            nickname: edge.node.nickname,
            firstName: edge.node.firstName,
            lastName: edge.node.lastName,
            externalLinks: edge.node.externalLinks,
            imageUrl: null // Default null
        }))

        // Enrich with Images (Valorant specific for now)
        if (titleId === '6' || titleId === '29') { // Valorant title IDs
            console.log('Fetching Valorant images...')
            const imagePromises = players.map(async (p: any) => {
                const img = await fetchValorantImage(p.nickname)
                return { ...p, imageUrl: img }
            })
            players = await Promise.all(imagePromises)
        }

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
