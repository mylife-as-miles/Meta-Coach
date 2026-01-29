// supabase/functions/grid-players/index.ts
// Fetch players by teamId from GRID

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const VLR_API_BASE = 'https://vlr.orlandomm.net/api/v1'
const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'



serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const gridApiKey = Deno.env.get('GRID_API_KEY')

        // Debug: Log if API key exists (don't log the actual key!)
        console.log('GRID_API_KEY exists:', !!gridApiKey)
        console.log('GRID_API_KEY length:', gridApiKey?.length || 0)

        if (!gridApiKey) {
            throw new Error('GRID_API_KEY not configured in Supabase Edge Function secrets')
        }

        // Parse inputs from Body (POST) or Query Params (GET)
        let teamId: string | null = null
        let titleId: string | null = null

        // 1. Try Query Params first
        const url = new URL(req.url)
        teamId = url.searchParams.get('teamId')
        titleId = url.searchParams.get('titleId')

        // 2. If not found and POST, try JSON body
        if ((!teamId || !titleId) && req.method === 'POST') {
            try {
                const body = await req.json()
                if (!teamId) teamId = body.teamId
                if (!titleId) titleId = body.titleId
            } catch (e) {
                console.warn('Failed to parse JSON body:', e)
            }
        }

        console.log('Request params:', { teamId, titleId })

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
              externalLinks {
                dataProvider { name }
                externalEntity { id }
              }
            }
          }
        }
      }
    `

        console.log('Calling GRID API with teamId:', teamId)

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

        console.log('GRID API response status:', playersRes.status)

        if (!playersRes.ok) {
            const errorText = await playersRes.text()
            console.error('GRID API error body:', errorText)
            throw new Error(`GRID API error: ${playersRes.status} - ${errorText}`)
        }

        const playersData = await playersRes.json()
        console.log('GRID API response data:', JSON.stringify(playersData, null, 2))

        const playerEdges = playersData.data?.players?.edges || []
        console.log('Player edges count:', playerEdges.length)

        let players = playerEdges.map((edge: any) => ({
            id: edge.node.id,
            nickname: edge.node.nickname,
            externalLinks: edge.node.externalLinks,
            imageUrl: null // Default null
        }))

        const fetchValorantImageById = async (externalId: string): Promise<string | null> => {
            try {
                const res = await fetch(`https://vlr.orlandomm.net/api/v1/players/${externalId}`)
                if (!res.ok) return null
                const data = await res.json()
                return data.data?.info?.img || null
            } catch (e) {
                console.error(`Error fetching image for ${externalId}:`, e)
                return null
            }
        }

        // ... inside serve ...

        // Enrich with Images (Valorant specific for now)
        if (titleId === '6' || titleId === '29') { // Valorant title IDs
            console.log('Fetching Valorant images using External IDs...')
            const imagePromises = players.map(async (p: any) => {
                const valLink = p.externalLinks?.find((l: any) => l.dataProvider.name === "VALORANT")
                const img = valLink ? await fetchValorantImageById(valLink.externalEntity.id) : null
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
