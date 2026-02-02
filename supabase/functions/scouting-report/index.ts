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

        // With responseMimeType: 'application/json', the text should be valid JSON
        let reportData = {};
        try {
            if (response.text) {
                reportData = JSON.parse(response.text());
            } else {
                // Fallback if text() is not available or empty (streaming vs sync difference in SDK versions)
                // Deno SDK generateContent typically returns .response object in previous versions, 
                // but @google/genai syntax returns object with .text() method or .text property.
                // The user code showed response as iterable/async stream. But generateContent is unary.
                // We will try .text() first then .text
                try {
                    reportData = JSON.parse(response.text());
                } catch (e) {
                    if (response.text) {
                        reportData = JSON.parse(response.text);
                    }
                }
            }
        } catch (jsonError) {
            console.error("Failed to parse JSON response:", response.text ? (typeof response.text === 'function' ? response.text() : response.text) : "Empty response");
            // Fallback simple error object
            reportData = {
                executive_summary: { title: "Analysis Failed", text: "AI could not generate a structured report." },
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
