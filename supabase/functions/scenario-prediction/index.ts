// supabase/functions/scenario-prediction/index.ts
// Scenario Prediction Edge Function - AI-powered Monte Carlo simulation using Gemini

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ScenarioInput {
    gamePhase: 'EARLY' | 'MID' | 'LATE';
    goldAdvantage: number;
    objectivesSecured: string[];
    playerFatigue: boolean;
    draftAdvantage: number;
    towerCount: { blue: number; red: number };
    dragonCount: { blue: number; red: number };
    baronSecured: { blue: boolean; red: boolean };
    teamKills: { blue: number; red: number };
    teamDeaths: { blue: number; red: number };
}

const MONTE_CARLO_PROMPT = `You are a high-fidelity Esports Simulation Engine.
Your task is to predict the outcome of a League of Legends match based on the provided variables.

Calculate the Win Probability for the BLUE team by simulating 1000 virtual match outcomes based on:
1. GOLD ADVANTAGE: (Positive = Blue Lead). >2k is significant. >5k is massive.
2. SCALING: Draft advantage impacts late game.
3. OBJECTIVES: Dragon Soul point (3 dragons) is a major win condition. Baron is a siege tool.
4. MOMENTUM: Turret and Kill leads imply map control.

Output strictly valid JSON:
{
  "winProbability": {
    "teamId": "blue",
    "probability": number (0-100),
    "confidenceInterval": { "low": number, "high": number },
    "factors": [
      { "variable": string, "weight": number (0-1), "impact": number (-10 to 10), "direction": "positive"|"negative"|"neutral" }
    ]
  },
  "teamfightWinRate": {
    "probability": number (0-100),
    "rating": "HIGH"|"MEDIUM"|"LOW",
    "conditions": { "goldDiff": number, "itemAdvantage": boolean, "positioning": string }
  },
  "splitPushEfficiency": {
    "rating": "HIGH"|"MEDIUM"|"LOW",
    "probability": number,
    "reasoning": string
  },
  "objectivePriority": {
    "nextObjective": string,
    "timing": string,
    "winRateIfSecured": number,
    "riskLevel": "LOW"|"MEDIUM"|"HIGH"
  },
  "strategicRecommendations": [string]
}`;

async function generateGeminiPrediction(scenario: ScenarioInput) {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: MONTE_CARLO_PROMPT });

    const userPrompt = `
    CURRENT GAME STATE:
    - Phase: ${scenario.gamePhase}
    - Gold Advantage: ${scenario.goldAdvantage}
    - Blue Dragons: ${scenario.dragonCount.blue}, Red Dragons: ${scenario.dragonCount.red}
    - Blue Towers: ${scenario.towerCount.blue}, Red Towers: ${scenario.towerCount.red}
    - Baron Secured: Blue=${scenario.baronSecured.blue}, Red=${scenario.baronSecured.red}
    - Kills: Blue=${scenario.teamKills.blue}, Red=${scenario.teamKills.red}
    - Draft Advantage (0-1): ${scenario.draftAdvantage}
    - Player Fatigue: ${scenario.playerFatigue}
    `;

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    // Clean potential markdown blocks
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        const body = await req.json();
        const scenario: ScenarioInput = {
            gamePhase: body.gamePhase || 'MID',
            goldAdvantage: body.goldAdvantage ?? 0,
            objectivesSecured: body.objectivesSecured || [],
            playerFatigue: body.playerFatigue ?? false,
            draftAdvantage: body.draftAdvantage ?? 0.5,
            towerCount: body.towerCount || { blue: 0, red: 0 },
            dragonCount: body.dragonCount || { blue: 0, red: 0 },
            baronSecured: body.baronSecured || { blue: false, red: false },
            teamKills: body.teamKills || { blue: 0, red: 0 },
            teamDeaths: body.teamDeaths || { blue: 0, red: 0 }
        };

        let prediction;
        try {
            prediction = await generateGeminiPrediction(scenario);
            prediction.source = 'gemini-2.0-flash';
        } catch (err) {
            console.error('Gemini failed, fallback to static:', err);
            // Fallback would go here, simplified for brevity as we expect Gemini to work
            prediction = { error: "Simulation failed", source: "fallback" };
        }

        return new Response(JSON.stringify(prediction), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
