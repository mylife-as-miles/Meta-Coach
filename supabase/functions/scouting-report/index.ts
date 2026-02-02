import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenAI } from 'npm:@google/genai'

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
            COMPARE WITH SELECTED MARKET PEER:
            Name: ${comparison.name}
            Role: ${comparison.role}
            Stats: KDA ${comparison.stats?.kills}/${comparison.stats?.deaths}/${comparison.stats?.assists}
            (Assume the target is the better "Moneyball" pick if their efficiency metrics are better regardless of raw KDA).
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
        Generate a strategic analysis JSON.
        
        REQUIRED JSON STRUCTURE:
        {
            "executive_summary": {
                "title": "Short punchy title (e.g. 'Value Buy', 'Hidden Gem', 'High Risk')",
                "text": "3-4 sentences explaining the market inefficiency. Why is this player undervalued? Compare to peer if applicable."
            },
            "metrics_analysis": {
                "eobp_trend": "+X.X%" (Positive number representing improvement over average/peer),
                "eslg_trend": "+XX%" (Positive number representing improvement),
                "war_trend": "X.X" (Projected WAR impact)
            },
            "cost_analysis": {
                "current_roster_cost": "$X.XM" (Compare with peer or standard market rate, e.g. 4.5M),
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
            responseMimeType: 'application/json',
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            config,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        })

        // Helper to extract text from various SDK response formats
        const getResponseText = (resp: any): string => {
            if (typeof resp.text === 'function') return resp.text();
            if (typeof resp.text === 'string') return resp.text;
            if (resp.candidates?.[0]?.content?.parts?.[0]?.text) return resp.candidates[0].content.parts[0].text;
            if (resp.candidates?.[0]?.content?.parts?.[0]) {
                const part = resp.candidates[0].content.parts[0]; // fallback for unstructured
                return typeof part === 'string' ? part : JSON.stringify(part);
            }
            return "{}";
        };

        let reportText = getResponseText(response);
        console.log("[scouting-report] Raw AI Response:", reportText.substring(0, 500) + "...");

        // Clean markdown code blocks if present (Gemini might still add them despite JSON mode)
        reportText = reportText.replace(/```json/g, '').replace(/```/g, '').trim();

        let reportData = {};
        try {
            reportData = JSON.parse(reportText);
        } catch (jsonError) {
            console.error("[scouting-report] JSON Parse Error on text:", reportText);
            // Fallback simple error object
            reportData = {
                executive_summary: { title: "Analysis Failed", text: "AI generated invalid JSON." },
                metrics_analysis: { eobp_trend: "0%", eslg_trend: "0%", war_trend: "0.0" },
                cost_analysis: { current_roster_cost: "$0M", target_acquisition_cost: "$0M", roi_percentage: "0%" }
            };
        }

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
