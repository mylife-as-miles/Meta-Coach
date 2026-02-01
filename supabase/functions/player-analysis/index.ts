// supabase/functions/player-analysis/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenAI } from 'npm:@google/genai@^1.0.0'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { playerName, playerRole, teamId, recentStats, playerId } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

        // Initialize Clients
        const genAI = new GoogleGenAI({ apiKey })
        const supabase = (supabaseUrl && supabaseKey)
            ? createClient(supabaseUrl, supabaseKey)
            : null

        // Configuration for Gemini 3.0 Pro
        const tools = [
            { googleSearch: {} },
        ];

        const config = {
            thinkingConfig: {
                thinkingLevel: 'HIGH',
            },
            mediaResolution: 'MEDIA_RESOLUTION_HIGH',
            tools,
            responseMimeType: 'application/json',
        };

        const model = 'gemini-3-pro-preview';

        // Contextual Prompt
        const prompt = `
      You are an expert League of Legends esports analyst using the Gemini 3 Pro engine.
      Analyze the potential and synergies for player: ${playerName} (${playerRole}).
      
      Recent Stats Context: ${JSON.stringify(recentStats || {})}
      
      Output MUST be valid JSON with this structure:
      {
        "synergies": [
           { "name": "Mid-Jungle", "partner": "Name", "score": 94, "description": "Short reasoning" },
           { "name": "Top Side", "partner": "Name", "score": 82, "description": "Short reasoning" },
           { "name": "Support Roam", "partner": "Name", "score": 65, "description": "Short reasoning" }
        ],
        "potential": {
           "currentScore": 85,
           "projectedPeak": 98,
           "trajectory": [85, 88, 92, 95, 98],
           "analysis": "Based on current scrim performance, Gemini predicts Mechanics will cap at 99 by Playoffs."
        }
      }
      
      Make up plausible partners if team roster isn't fully accurate in context, but prioritize famous players if unknown.
      The scores should be realistic (0-100).
    `

        // Generate Content
        const result = await genAI.models.generateContent({
            model,
            config,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        })

        console.log("Gemini Raw Result Keys:", Object.keys(result));

        let text = "";

        // Handle various response shapes from the new SDK
        if (typeof result.text === 'function') {
            text = result.text();
        } else if (result.response && typeof result.response.text === 'function') {
            text = result.response.text();
        } else if (result.candidates && result.candidates.length > 0) {
            text = result.candidates[0].content?.parts?.[0]?.text || "";
        } else {
            console.warn("Unexpected Gemini response shape:", result);
            text = JSON.stringify(result);
        }

        console.log("Gemini 3 Analysis Extracted:", text.substring(0, 100) + "...");

        // Persist to Database if playerId is provided
        if (playerId && text && supabase) {
            try {
                const analysisJson = JSON.parse(text);
                console.log(`Persisting analysis for player ${playerId}`);
                const { error: dbError } = await supabase
                    .from('roster')
                    .update({
                        analysis_data: analysisJson
                    })
                    .eq('id', playerId);

                if (dbError) {
                    console.error("Failed to persist analysis:", dbError);
                } else {
                    console.log("Analysis saved to DB for player:", playerId);
                }
            } catch (e) {
                console.error("Failed to parse/save JSON:", e);
            }
        }

        return new Response(text, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message || error.toString() }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
