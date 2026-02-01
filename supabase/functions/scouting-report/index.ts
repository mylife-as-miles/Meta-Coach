import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenAI } from 'npm:@google/genai@^1.0.0'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY not configured')
        }

        const { player } = await req.json()

        // Calculate metrics for AI context
        const stats = player.stats;
        const totalInteractions = stats.kills + stats.assists + stats.deaths;
        const eOBP = totalInteractions > 0 ? (stats.kills + stats.assists) / totalInteractions : 0;
        const eSLG = stats.goldEarned > 0 ? (stats.damageToChampions / stats.goldEarned) * 100 : 0;

        // Construct Prompt
        const prompt = `
    Analyze this Esports Player for a "Moneyball" scouting report.
    We are looking for undervalued players who are efficient/effective but maybe not flashy.

    Player: ${player.name} (${player.role})
    
    Traditional Stats:
    - KDA: ${stats.kills}/${stats.deaths}/${stats.assists}
    - Gold Earned: ${stats.goldEarned}
    - Damage: ${stats.damageToChampions}
    
    Advanced Moneyball Metrics:
    - eOBP (Survival/Participation): ${eOBP.toFixed(3)} (Range: 0.0-1.0, Higher is better)
    - eSLG (Damage Efficiency): ${eSLG.toFixed(0)}% (Range: 100-200%, Higher is better "Power per Gold")

    Task:
    Write a short, professional scouting paragraph (3-4 sentences).
    - Focus on their EFFICIENCY and HIDDEN VALUE.
    - Explain why their eOBP or eSLG makes them a good pickup.
    - Compare them to a stock market "Buy" opportunity.
    - If stats are low, be honest but constructive about potential.
    
    Tone: Professional Scout, Analytical, Insightful.
    `;

        const ai = new GoogleGenAI({ apiKey: geminiApiKey })

        const config = {
            thinkingConfig: {
                thinkingLevel: 'HIGH',
            },
            tools: [{ googleSearch: {} }],
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            config,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        })

        const report = response.text || "Analysis complete. Player shows potential.";

        return new Response(
            JSON.stringify({ report }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error generating scout report:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
