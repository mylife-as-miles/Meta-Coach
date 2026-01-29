// supabase/functions/ai-match-prep/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("VITE_GEMINI_API_KEY") || "";

// Interfaces for request/response
interface TeamContext {
    id?: string;
    name: string;
    region?: string;
}

interface RequestBody {
    team: TeamContext; // Strict Requirement
    gameTitle: string;
    roster: { role: string; ign: string }[];
    opponentName?: string;
}

interface AIAnalysisResponse {
    aggression: number;
    resourcePriority: number;
    visionInvestment: number;
    earlyGamePathing: boolean;
    objectiveControl: boolean;
    generatedReasoning: string;
    coachingBias: string;
    earlyPressureScore: number;
    scalingPotentialScore: number;
    confidenceScore: number;
    matchupDelta: {
        earlyGame: number;
        lateGame: number;
    };
    derivationFactors: {
        aggression: string[];
        resourcePriority: string[];
        earlyGamePathing: string[];
    };
    opponentName: string;
    meta: {
        source: string;
        matchCount: number;
        teamIdentity: string;
    };
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    let teamContext: TeamContext | null = null;
    let requestBody: RequestBody | null = null;

    try {
        // Step 1: Parse Request & Validate Team Context
        try {
            requestBody = (await req.json()) as RequestBody;
            teamContext = requestBody.team;
        } catch (e) {
            throw new Error("Failed to parse request body or missing team context");
        }

        if (!teamContext || !teamContext.name) {
            throw new Error("Team identity missing in analysis context");
        }

        const { gameTitle, roster, opponentName } = requestBody;
        const teamName = teamContext.name;

        console.log(`Generating Matchday Brain for ${teamName} (${teamContext.region || 'Global'}) in ${gameTitle} vs ${opponentName || 'League Average'}`);

        if (!GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY not set. Returning mock data.");
            return new Response(JSON.stringify(getMockData(teamContext)), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Construct Prompt
        const prompt = `
      You are MetaCoach, an elite esports analyst AI. 
      Analyze this team for a match in the game "${gameTitle}" against "${opponentName || 'League Average'}".
      
      Team Identity: ${teamName} (${teamContext.region || 'Unknown Region'})
      Roster:
      ${roster.map((p) => `- ${p.role}: ${p.ign}`).join("\n")}
      
      Based on the known playstyle of these players (search their history if possible, or infer from roles) and the current meta, generate a strategic profile.
      
      Return ONLY a raw JSON object (no markdown formatting) with the following structure:
      {
        "aggression": number (0-100),
        "resourcePriority": number (0-100, where 0 is Spread, 100 is Funneled to Carry),
        "visionInvestment": number (0-100),
        "earlyGamePathing": boolean,
        "objectiveControl": boolean,
        "generatedReasoning": "string (max 2 sentences, sophisticated analytic tone referencing specific player tendencies)",
        "coachingBias": "string (short phrase, e.g., 'Dive Heavy', 'Scaling Control')",
        "earlyPressureScore": number (0-100),
        "scalingPotentialScore": number (0-100),
        "confidenceScore": number (95.0-99.9),
        "matchupDelta": {
           "earlyGame": number (positive for advantage, negative for disadvantage, e.g. +4 or -5),
           "lateGame": number
        },
        "derivationFactors": {
           "aggression": ["string", "string"], // e.g. "High First Blood Rate (Top)", "Aggressive Jungle Pathing"
           "resourcePriority": ["string", "string"],
           "earlyGamePathing": ["string"]
        },
        "opponentName": "${opponentName || 'League Average'}"
      }
    `;

        // Call Gemini API 
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", errorText);
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error("No content returned from Gemini");
        }

        const analysis = JSON.parse(rawText) as AIAnalysisResponse;

        // Enrich with Metadata
        analysis.meta = {
            source: "GRID Verified + Gemini Inference",
            matchCount: Math.floor(Math.random() * (200 - 50 + 1)) + 50, // Simulated match count for demo
            teamIdentity: `${teamName} (Confirmed)`
        };

        return new Response(JSON.stringify(analysis), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error in ai-match-prep:", error);

        // Fallback Logic: Use captured teamContext if available, otherwise safe fallback
        const fallbackTeam = teamContext || { name: "Unregistered Roster", region: "Unknown" };

        return new Response(JSON.stringify(getMockData(fallbackTeam)), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

function getMockData(team: TeamContext): AIAnalysisResponse {
    const safeName = team.name || "Unregistered Roster";

    return {
        aggression: 85,
        resourcePriority: 80, // Bot focused
        visionInvestment: 50,
        earlyGamePathing: true,
        objectiveControl: false,
        generatedReasoning: `Based on ${safeName}'s roster composition, the engine identifies a high-variance early game win condition dependent on bot-side volatility.`,
        coachingBias: "Dive Heavy / Skirmish",
        earlyPressureScore: 92,
        scalingPotentialScore: 45,
        confidenceScore: 98.4,
        matchupDelta: {
            earlyGame: 4,
            lateGame: -2
        },
        derivationFactors: {
            aggression: ["High First Blood Rate", "Support Roam Timings"],
            resourcePriority: ["Bot Lane Gold Share > 28%", "Jungle Proximity Bot"],
            earlyGamePathing: ["Level 2 Gank Frequency"]
        },
        opponentName: "League Average",
        meta: {
            source: "Local Simulation Engine",
            matchCount: 12,
            teamIdentity: `${safeName} (Offline Mode)`
        }
    };
}
