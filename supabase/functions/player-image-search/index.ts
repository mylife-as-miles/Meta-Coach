// supabase/functions/player-image-search/index.ts
// Uses Gemini AI with Google Search to find official player images

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenAI } from 'npm:@google/genai@^1.0.0'

interface PlayerImageRequest {
    playerName: string
    teamName: string
    game: string // "League of Legends" or "VALORANT"
}

interface PlayerImageResult {
    playerName: string
    imageUrl: string | null
    source: string | null
    confidence: 'high' | 'medium' | 'low'
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY not configured')
        }

        const body = await req.json()
        const { players, teamName, game } = body as {
            players: { id: string; nickname: string }[]
            teamName: string
            game: string
        }

        if (!players || !Array.isArray(players) || players.length === 0) {
            return new Response(
                JSON.stringify({ error: 'players array is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        console.log(`Searching images for ${players.length} players from ${teamName} (${game})`)

        const ai = new GoogleGenAI({ apiKey: geminiApiKey })

        // Create a single prompt for all players to minimize API calls
        const playerList = players.map(p => p.nickname).join(', ')

        const prompt = `Search for the official esports profile images of these professional ${game} players from team "${teamName}":
        
Players: ${playerList}

For each player, find their official profile image URL from sources like:
- Official team websites
- Liquipedia
- vlr.gg (for VALORANT)
- lol.fandom.com (for League of Legends)
- Official tournament pages

Return a JSON array with this exact structure for each player:
[
  {
    "nickname": "player_nickname",
    "imageUrl": "https://direct-image-url.jpg",
    "source": "source website name"
  }
]

IMPORTANT: 
- Only return direct image URLs found in the search results.
- DO NOT guess Liquipedia file paths.
- Prioritize VLR.gg, Fandom, or official sites.
- If no official image is found, set imageUrl to null
- Return ONLY the JSON array, no other text`

        const config = {
            tools: [
                { googleSearch: {} },
                { urlContext: {} }
            ],
            responseMimeType: 'application/json',
            thinkingConfig: {
                thinkingLevel: 'HIGH',
            },
            mediaResolution: 'MEDIA_RESOLUTION_HIGH',
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            config,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        })

        let results: PlayerImageResult[] = []

        try {
            const responseText = response.text || ''
            console.log('Gemini response:', responseText)

            // Try to parse the JSON response
            const parsed = JSON.parse(responseText)

            if (Array.isArray(parsed)) {
                results = parsed.map((item: any) => ({
                    playerName: item.nickname,
                    imageUrl: item.imageUrl || null,
                    source: item.source || null,
                    confidence: item.imageUrl ? 'high' : 'low'
                }))
            }
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError)
            // Return empty results if parsing fails
            results = players.map(p => ({
                playerName: p.nickname,
                imageUrl: null,
                source: null,
                confidence: 'low' as const
            }))
        }

        // Map results back to original player IDs
        const enrichedPlayers = players.map(player => {
            const found = results.find(r =>
                r.playerName.toLowerCase() === player.nickname.toLowerCase()
            )
            return {
                id: player.id,
                nickname: player.nickname,
                imageUrl: found?.imageUrl || null,
                imageSource: found?.source || null
            }
        })

        return new Response(
            JSON.stringify({ players: enrichedPlayers }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error searching player images:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
