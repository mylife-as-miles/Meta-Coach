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

        const { player, comparison } = await req.json()

        // Calculate metrics for AI context
        const stats = player.stats;
        const totalInteractions = stats.kills + stats.assists + stats.deaths;
        const eOBP = totalInteractions > 0 ? (stats.kills + stats.assists) / totalInteractions : 0;
        const eSLG = stats.goldEarned > 0 ? (stats.damageToChampions / stats.goldEarned) * 100 : 0;

        // Comparison Context
        let comparisonContext = "";
        if (comparison) {
            comparisonContext = `
            COMPARE WITH CURRENT ROSTER PLAYER:
            Name: ${comparison.name}
            Role: ${comparison.role}
            (Assume this roster player is "Expensive" and "Underperforming" relative to the target for the sake of the Moneyball narrative if stats are close).
            `;
        }

        // Construct Prompt
        const prompt = `
        You are a "Moneyball" Esports Scout. Analyze this player ("Target") and generate a high-fidelity strategic report.
        
        TARGET PLAYER: ${player.name} (${player.role})
        - KDA: ${stats.kills}/${stats.deaths}/${stats.assists}
        - Gold Earned: ${stats.goldEarned}
        - Damage: ${stats.damageToChampions}
        - Calculated eOBP: ${eOBP.toFixed(3)}
        - Calculated eSLG: ${eSLG.toFixed(0)}%
        - Market Price: $${player.price || "2.5"}M (Estimated)
        
        ${comparisonContext}

        TASK:
        Generate a JSON object containing a strategic analysis. DO NOT return Markdown. Return ONLY raw JSON.
        
        REQUIRED JSON STRUCTURE:
        {
            "executive_summary": {
                "title": "Short punchy title (e.g. 'Value Buy', 'Hidden Gem', 'High Risk')",
                "text": "3-4 sentences explaining the market inefficiency. Why is this player undervalued? Compare to roster player if applicable."
            },
            "metrics_analysis": {
                "eobp_trend": "+X.X%" (Positive number representing improvement over average/roster),
                "eslg_trend": "+XX%" (Positive number representing improvement),
                "war_trend": "X.X" (Projected WAR impact)
            },
            "cost_analysis": {
                "current_roster_cost": "$X.XM" (Invent a realistic higher salary for the roster player, e.g. 4.5M),
                "target_acquisition_cost": "$X.XM" (Use the player's price or valid estimate, e.g. 2.7M),
                "roi_percentage": "+XX%" (Calculate the efficiency gain per dollar)
            }
        }
        `;

        const ai = new GoogleGenAI({ apiKey: geminiApiKey })

        const config = {
            thinkingConfig: {
                thinkingLevel: 'HIGH',
            },
            tools: [{ googleSearch: {} }],
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-thinking-exp', // Using the latest thinking model
            config,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        })

        let reportText = response.text || "{}";
        // Clean markdown code blocks if present
        reportText = reportText.replace(/```json/g, '').replace(/```/g, '').trim();

        const reportData = JSON.parse(reportText);

        return new Response(
            JSON.stringify({ report: reportData }),
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
