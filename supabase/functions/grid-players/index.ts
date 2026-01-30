// supabase/functions/grid-players/index.ts
// Fetch players by teamId from GRID with AI-powered image search

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenAI } from 'npm:@google/genai@^1.0.0'

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'

// Gemini-powered image search for players without images
async function searchPlayerImagesWithGemini(
    players: { id: string; nickname: string; imageUrl: string | null }[],
    teamName: string,
    game: string
): Promise<{ id: string; nickname: string; imageUrl: string | null }[]> {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
        console.warn('GEMINI_API_KEY not configured, skipping AI image search')
        return players
    }

    // Filter players that need images
    const playersNeedingImages = players.filter(p => !p.imageUrl)

    if (playersNeedingImages.length === 0) {
        return players
    }

    console.log(`Using Gemini to search images for ${playersNeedingImages.length} players`)

    try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey })

        const playerList = playersNeedingImages.map(p => p.nickname).join(', ')

        const prompt = `Find official esports profile image URLs for these professional ${game} players from team "${teamName}":

Players: ${playerList}

Search these sources:
- Liquipedia
- vlr.gg (VALORANT)
- lol.fandom.com (League of Legends)
- Official team websites
- Official tournament pages

Return ONLY a JSON array like this:
[{"nickname": "player_name", "imageUrl": "https://direct-image-url.jpg"}]

Rules:
- Only return direct image URLs (.jpg, .png, .webp)
- If no image found, set imageUrl to null
- No explanations, just the JSON array`

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
            },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        })

        const responseText = response.text || ''
        console.log('Gemini image search response:', responseText)

        const parsed = JSON.parse(responseText)

        if (Array.isArray(parsed)) {
            // Merge AI results back into players array
            return players.map(player => {
                if (player.imageUrl) return player // Already has image

                const found = parsed.find((r: any) =>
                    r.nickname?.toLowerCase() === player.nickname.toLowerCase()
                )
                return {
                    ...player,
                    imageUrl: found?.imageUrl || null
                }
            })
        }
    } catch (error) {
        console.error('Gemini image search error:', error)
    }

    return players
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const gridApiKey = Deno.env.get('GRID_API_KEY')

        console.log('GRID_API_KEY exists:', !!gridApiKey)

        if (!gridApiKey) {
            throw new Error('GRID_API_KEY not configured in Supabase Edge Function secrets')
        }

        // Parse inputs from Body (POST) or Query Params (GET)
        let teamId: string | null = null
        let titleId: string | null = null
        let teamName: string | null = null

        const url = new URL(req.url)
        teamId = url.searchParams.get('teamId')
        titleId = url.searchParams.get('titleId')
        teamName = url.searchParams.get('teamName')

        if (req.method === 'POST') {
            try {
                const body = await req.json()
                if (!teamId) teamId = body.teamId
                if (!titleId) titleId = body.titleId
                if (!teamName) teamName = body.teamName
            } catch (e) {
                console.warn('Failed to parse JSON body:', e)
            }
        }

        console.log('Request params:', { teamId, titleId, teamName })

        if (!teamId) {
            return new Response(
                JSON.stringify({ error: 'teamId is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Query players for the specific team
        // Query players AND team details
        const playersQuery = `
      query GetPlayersForTeam($teamId: ID!) {
        team(id: $teamId) {
            name
        }
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
        console.log('GRID API response data (partial):', JSON.stringify({ team: playersData.data?.team, playersCount: playersData.data?.players?.edges?.length }))

        // Extract team name from GRID if not provided in params
        if (!teamName) {
            const gridTeamName = playersData.data?.team?.name
            if (gridTeamName) {
                console.log(`Using team name from GRID response: ${gridTeamName}`)
                teamName = gridTeamName
            }
        }

        const playerEdges = playersData.data?.players?.edges || []
        console.log('Player edges count:', playerEdges.length)

        let players = playerEdges.map((edge: any) => ({
            id: edge.node.id,
            nickname: edge.node.nickname,
            externalLinks: edge.node.externalLinks,
            imageUrl: null // Default null
        }))

        // Helper to fetch Valorant image by ID
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

        // First try VLR API for Valorant players
        if (titleId === '6' || titleId === '29') {
            console.log('Fetching Valorant images using External IDs...')
            const imagePromises = players.map(async (p: any) => {
                const valLink = p.externalLinks?.find((l: any) => l.dataProvider.name === "VALORANT")
                const img = valLink ? await fetchValorantImageById(valLink.externalEntity.id) : null
                return { ...p, imageUrl: img }
            })
            players = await Promise.all(imagePromises)
        }

        // Determine game name for Gemini search
        const gameName = titleId === '3' ? 'League of Legends' :
            (titleId === '6' || titleId === '29') ? 'VALORANT' :
                'esports'

        // Use Gemini + Google Search as fallback for players without images
        const playersWithMissingImages = players.filter((p: any) => !p.imageUrl)
        console.log(`Team name received: ${teamName}`)
        console.log(`Players with missing images: ${playersWithMissingImages.length}`)
        console.log(`Player image status:`, players.map((p: any) => ({ nickname: p.nickname, hasImage: !!p.imageUrl })))

        if (playersWithMissingImages.length > 0) {
            if (teamName) {
                console.log(`Calling Gemini search for ${playersWithMissingImages.length} players from ${teamName}...`)
                players = await searchPlayerImagesWithGemini(players, teamName, gameName)
                console.log(`After Gemini search:`, players.map((p: any) => ({ nickname: p.nickname, imageUrl: p.imageUrl })))
            } else {
                console.warn('teamName not provided, skipping Gemini image search')
            }
        }

        return new Response(
            JSON.stringify({ players }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error fetching players:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
