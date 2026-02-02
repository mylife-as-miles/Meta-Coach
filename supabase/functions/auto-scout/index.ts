import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenAI } from 'npm:@google/genai'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

        if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
            throw new Error('Environment configuration missing')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const { teamId } = await req.json()

        if (!teamId) {
            throw new Error('Missing require params: teamId')
        }

        console.log(`[auto-scout] Generating intelligence for Team ${teamId}`)

        // Step 1: Fetch Historical Data from Local Cache (The "Canonical" DB)
        const { data: participation, error: partError } = await supabase
            .from('series_participants')
            .select('series_id, team_name')
            .eq('team_id', teamId)
            .limit(50) // Analyze last 50 series

        if (partError) throw partError;

        const seriesIds = participation.map((p: any) => p.series_id);

        // Deep fetch games for these series
        const { data: games, error: gamesError } = await supabase
            .from('games')
            .select('*, matches!inner(series_id)')
            .in('matches.series_id', seriesIds)

        if (gamesError) throw gamesError;

        console.log(`[auto-scout] Analyzing ${games.length} games...`)

        // Step 2: Feature Extraction (The "AI" part - calculating signals)
        // Simple derived metrics for now (until we have Gold@10 in DB)

        let wins = 0;
        let totalTime = 0;
        let gameDurations: number[] = [];

        games.forEach((g: any) => {
            if (g.winner_id === teamId) wins++;
            if (g.length_ms) {
                totalTime += g.length_ms;
                gameDurations.push(g.length_ms / 60000); // Minutes
            }
        });

        const winRate = games.length > 0 ? (wins / games.length) : 0;
        const avgDuration = gameDurations.length > 0 ? (totalTime / gameDurations.length / 60000) : 0;

        // Calculate Volatility (Std Dev of Game Length)
        const mean = avgDuration;
        const squareDiffs = gameDurations.map((val: number) => {
            const diff = val - mean;
            return diff * diff;
        });
        const avgSquareDiff = squareDiffs.length > 0 ? (squareDiffs.reduce((a: number, b: number) => a + b, 0) / squareDiffs.length) : 0;
        const stdDev = Math.sqrt(avgSquareDiff);

        // Classify Signals
        const signals = {
            winRate: winRate.toFixed(2),
            avgDuration: avgDuration.toFixed(1) + "m",
            volatilityScore: stdDev,
            earlyGameImplication: avgDuration < 32 ? "High Aggression" : "Scaling",
            sampleSize: games.length
        };

        // Step 3: Generative strategic Profile (LLM Layer)
        const inputPrompt = `
        You are Auto-Scout, an elite esports intelligence engine.
        Analyze the following statistical signals for a professional team to generate a Strategic Profile.

        SIGNALS:
        - Win Rate: ${(winRate * 100).toFixed(1)}%
        - Average Game Duration: ${avgDuration.toFixed(1)} minutes (Benchmark: <30m is Fast/Aggressive, >35m is Slow/Scaling)
        - Game Length Volatility (StdDev): ${stdDev.toFixed(1)} (Benchmark: >8.0 is Chaos/High Volatility, <5.0 is Controlled/Structured)
        - Sample Size: ${games.length} Games

        TASK:
        Generate a JSON intelligence report.
        
        REQUIRED JSON STRUCTURE:
        {
            "playstyle": {
                "earlyGamePressure": "Integer 0-100 (Estimate based on duration)",
                "scalingPotential": "Integer 0-100 (Inversely proportional to early pressure usually)",
                "volatility": "String (Low/Medium/High/Chaos)"
            },
            "keyPattern": "String (One sentence observation, e.g. 'Wins are heavily front-loaded...')",
            "weakness": "String (One specific weakness derived from the profile, e.g. 'Struggles to close out long games')",
            "focusPlayer": "String (Name of a likely carry - just pick 'Core Player' if unknown)",
            "recommendation": "String (Strategic counter-tactic)"
        }
        `;

        const ai = new GoogleGenAI({ apiKey: geminiApiKey })
        const config = {
            thinkingConfig: { thinkingLevel: 'HIGH' },
            responseMimeType: 'application/json',
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            config,
            contents: [{ role: 'user', parts: [{ text: inputPrompt }] }],
        })

        // Helper to extract text
        const getResponseText = (resp: any): string => {
            if (typeof resp.text === 'function') return resp.text();
            if (typeof resp.text === 'string') return resp.text;
            if (resp.candidates?.[0]?.content?.parts?.[0]?.text) return resp.candidates[0].content.parts[0].text;
            return "{}";
        };

        let reportText = getResponseText(response);
        reportText = reportText.replace(/```json/g, '').replace(/```/g, '').trim();

        let intelligence = {};
        try {
            intelligence = JSON.parse(reportText);
        } catch (e) {
            console.error("JSON Parse failed", reportText);
            intelligence = { error: "Failed to generate intelligent profile" };
        }

        return new Response(
            JSON.stringify({
                teamId,
                metrics: signals,
                intelligence
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Auto-Scout failed:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
