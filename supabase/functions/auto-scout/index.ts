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

        // Step 1: Fetch Historical Data from Local Cache
        const { data: matches, error: matchesError } = await supabase
            .from('matches')
            .select('*, series!inner(series_participants!inner(team_id))')
            .eq('series.series_participants.team_id', teamId)
            .order('series(start_time)', { ascending: false })
            .limit(20)

        if (matchesError) throw matchesError;

        console.log(`[auto-scout] Analyzing ${matches.length} matches...`)

        // Step 2: Feature Extraction (The "AI" part - calculating signals)
        let wins = 0;
        let totalMacro = 0;
        let macroCount = 0;
        let errors = { LOW: 0, MED: 0, HIGH: 0 };
        let results = { WIN: 0, LOSS: 0 };

        matches.forEach((m: any) => {
            if (m.result === 'WIN') {
                wins++;
                results.WIN++;
            } else {
                results.LOSS++;
            }

            if (m.performance_summary) {
                if (typeof m.performance_summary.macroControl === 'number') {
                    totalMacro += m.performance_summary.macroControl;
                    macroCount++;
                }
                const rate = m.performance_summary.microErrorRate as keyof typeof errors;
                if (errors[rate] !== undefined) errors[rate]++;
            }
        });

        const winRate = matches.length > 0 ? (wins / matches.length) : 0;
        const avgMacro = macroCount > 0 ? (totalMacro / macroCount) : 50;

        // Classify Signals
        const signals = {
            winRate: (winRate * 100).toFixed(1) + "%",
            avgMacroControl: avgMacro.toFixed(1) + "%",
            errorDistribution: errors,
            sampleSize: matches.length
        };

        // Step 3: Generative strategic Profile (LLM Layer)
        const inputPrompt = `
        You are Auto-Scout, an elite esports intelligence engine.
        Analyze the following AI-generated performance signals for a professional team to synthesize a "Strategic Profile".

        SIGNALS (Last ${matches.length} Matches):
        - Overall Win Rate: ${signals.winRate}
        - Average Macro Control: ${signals.avgMacroControl} (Higher = better map control/objectives)
        - Micro Error Rate Distribution: LOW:${errors.LOW}, MED:${errors.MED}, HIGH:${errors.HIGH}
        
        TASK:
        Generate a JSON intelligence report that captures the team's "Identity".
        - If Macro is high (>70) but Error Rate is MED/HIGH, they are an "Aggressive but Chaotic" team.
        - If Macro is low (<50) but Error Rate is LOW, they are a "Passive/Reactive" team.
        
        REQUIRED JSON STRUCTURE:
        {
            "playstyle": {
                "earlyGamePressure": "Integer 0-100",
                "scalingPotential": "Integer 0-100",
                "volatility": "String (Low/Medium/High/Chaos)"
            },
            "keyPattern": "String (One specific strategic observation)",
            "weakness": "String (A critical vulnerability to exploit)",
            "focusPlayer": "String (Roles or playstyle to target)",
            "recommendation": "String (One clear tactical counter-play)"
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
