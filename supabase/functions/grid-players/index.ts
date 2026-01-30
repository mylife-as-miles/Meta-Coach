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
- Search for the player's **VLR.gg** profile. The image URL usually looks like 'https://owcdn.net/img/...' or 'https://img.vlr.gg/...'.
- Search for the player's **Liquipedia** profile. Use the main infobox image if a direct link is found in search results.
            - If no VLR or Liquipedia image is found, try official team sites.
- Return null ONLY if absolutely no image can be found.
- No explanations, just the JSON array`

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            config: {
                tools: [{ googleSearch: {} }, { urlContext: {} }],
                responseMimeType: 'application/json',
                thinkingConfig: {
                    thinkingLevel: 'HIGH',
                },
                mediaResolution: 'MEDIA_RESOLUTION_HIGH',
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
            throw new Error(`GRID API error: ${playersRes.status} - ${errorText} `)
        }

        const playersData = await playersRes.json()
        console.log('GRID API response data (partial):', JSON.stringify({ team: playersData.data?.team, playersCount: playersData.data?.players?.edges?.length }))

        // Extract team name from GRID if not provided in params
        if (!teamName) {
            const gridTeamName = playersData.data?.team?.name
            if (gridTeamName) {
                console.log(`Using team name from GRID response: ${gridTeamName} `)
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

        // (Removed ID-based VLR fetch as it used Riot IDs instead of VLR IDs)

        // Determine game name for Gemini search
        const gameName = titleId === '3' ? 'League of Legends' :
            (titleId === '6' || titleId === '29') ? 'VALORANT' :
                'esports'

        // Use Gemini + Google Search as fallback for players without images
        const playersWithMissingImages = players.filter((p: any) => !p.imageUrl)
        console.log(`Team name received: ${teamName} `)
        console.log(`Players with missing images: ${playersWithMissingImages.length} `)
        console.log(`Player image status: `, players.map((p: any) => ({ nickname: p.nickname, hasImage: !!p.imageUrl })))

        if (playersWithMissingImages.length > 0) {
            if (teamName) {
                console.log(`Calling Gemini search for ${playersWithMissingImages.length} players from ${teamName}...`)
                players = await searchPlayerImagesWithGemini(players, teamName, gameName)
                console.log(`After Gemini search: `, players.map((p: any) => ({ nickname: p.nickname, imageUrl: p.imageUrl })))
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
