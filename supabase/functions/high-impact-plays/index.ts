import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { matchId } = await req.json()

        // In a real scenario, we would fetch match events from GRID/DB here
        // For now, we'll use a mocked set of events or a scenario description
        const matchContext = `
      Match ID: ${matchId}
      Game Time: 35:20
      Winner: Blue Team
      Key Events:
      - 03:24: First Blood by Blue Jungler on Red Mid
      - 12:45: Rift Herald taken by Red Team, used mid for plates
      - 18:30: Dragon Soul point denied by Blue Team steal
      - 24:15: Baron Nashor secured by Blue Team after 3-0 teamfight
      - 32:00: Elder Dragon fight, Red Team Ace but lost inhibitor
    `

        const prompt = `
      Analyze the following match context and identify 3-5 "High-Impact Plays" that turned the tide of the game.
      For each play, provide:
      - Time (approximate if not exact)
      - Play (concise description)
      - Outcome (immediate result)
      - AI Score (0-100 rating of strategic impact)

      Return ONLY a raw JSON array of objects with keys: time, play, outcome, score.
      Do not include markdown formatting or backticks.

      Context:
      ${matchContext}
    `

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        })

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text

        let plays = []
        try {
            // Clean up potentially formatted JSON
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
            plays = JSON.parse(jsonStr)
        } catch (e) {
            console.error('Failed to parse Gemini response:', text)
            // Fallback
            plays = [
                { time: '24:15', play: 'Baron Nashor Secure', outcome: 'Broken base gates', score: 95 },
                { time: '18:30', play: 'Dragon Steal', outcome: 'Denied Soul point', score: 88 }
            ]
        }

        return new Response(JSON.stringify({ plays }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
