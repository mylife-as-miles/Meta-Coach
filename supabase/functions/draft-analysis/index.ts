// supabase/functions/draft-analysis/index.ts
// Draft Analysis Edge Function - AI-powered recommendations using Gemini + GRID Data

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { GRID_URLS, getGridHeaders } from "../_shared/grid-config.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Query to get team's recent draft patterns
const TEAM_HISTORY_QUERY = `
query GetTeamHistory($teamId: ID!, $titleId: Int!, $limit: Int = 10) {
  series(
    filter: {
      titleId: { equals: $titleId }
      teams: { baseInfo: { id: { equals: $teamId } } }
      status: { equals: ENDED }
    }
    first: $limit
    orderBy: { startTime: DESC }
  ) {
    edges {
      node {
        id
        games {
          winningTeam { id }
          draft {
            picks {
              hero { name }
              team { id }
              order
            }
          }
        }
      }
    }
  }
}
`;

interface DraftPick {
  heroId: string;
  heroName: string;
  teamId: string;
  playerName?: string;
  role?: string;
}

const DRAFT_SYSTEM_PROMPT = `You are a World-Class Esports Draft Analyst (Moneyball Style).
Your goal is to recommend the optimal next pick/ban based on DATA, not gut feeling.

Analyze the draft state:
1. IDENTIFY PATTERNS: Look at the team's history. Do they one-trick specific agents/champs?
2. COUNTER-STRATEGY: If the enemy picked X, what historically beats X (or what does this specific team struggle against)?
3. COMPOSITION SYNERGY: Does the team lack engage? Smokes? Scaling?
4. PLAYER COMFORT: If you know a player's pool, prioritize valid comfort picks.

Output JSON:
{
  "winProbability": { "blueWinRate": number, "confidence": number }, // 0-100, 0-1
  "draftAdvantage": { "advantageTeam": "blue"|"red"|"even", "reasoning": "Quick punchy explanation" },
  "recommendedPicks": [
    { "heroName": string, "role": string, "winRateVsComp": number, "reasoning": "Why this specific pick?" }
  ],
  "compositionAnalysis": {
    "blueArchetype": string, // e.g. "Dive Heavy", "Double Controller"
    "redArchetype": string,
    "matchupNotes": [string]
  }
}`;

async function fetchTeamHistory(teamId: string, titleId: number) {
  try {
    const response = await fetch(GRID_URLS.CENTRAL_DATA, {
      method: 'POST',
      headers: getGridHeaders(),
      body: JSON.stringify({
        query: TEAM_HISTORY_QUERY,
        variables: { teamId, titleId, limit: 10 }
      })
    });
    const result = await response.json();
    const games = result.data?.series?.edges?.flatMap((e: any) => e.node.games) || [];

    // Simplified analysis of history
    const picks: Record<string, number> = {};
    games.forEach((g: any) => {
      g.draft?.picks?.forEach((p: any) => {
        const name = p.hero?.name;
        if (name && p.team?.id === teamId) {
          picks[name] = (picks[name] || 0) + 1;
        }
      });
    });

    // Return top 5 most picked
    const topPicks = Object.entries(picks)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => `${name} (${count} games)`);

    return topPicks;
  } catch (e) {
    console.warn('Failed to fetch history', e);
    return [];
  }
}

async function fetchRosterContext(supabase: any, teamId: string) {
  // Fetch detailed roster data including champion pools if available
  const { data: players } = await supabase
    .from('players')
    .select('nickname, role, metadata') // metadata might contain 'champion_pool'
    .eq('team_id', teamId) // Assuming linkage exists, or logic to find by team
    .limit(5);

  if (!players || !players.length) return "No roster data available.";

  return players.map((p: any) => {
    const pool = p.metadata?.champion_pool || [];
    return `${p.nickname} (${p.role}): Pool=[${pool.join(', ')}]`;
  }).join('\n');
}

async function generateGeminiAnalysis(
  bluePicks: DraftPick[],
  redPicks: DraftPick[],
  blueHistory: string[],
  redHistory: string[],
  rosterContext: string,
  titleId: number
) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: DRAFT_SYSTEM_PROMPT });

  const prompt = `
    GAME TITLE ID: ${titleId} (3=LoL, 4=Valorant)
    
    CURRENT DRAFT:
    Blue Team Picks: ${bluePicks.map(p => p.heroName).join(', ') || 'None'}
    Red Team Picks: ${redPicks.map(p => p.heroName).join(', ') || 'None'}
    
    BLUE TEAM CONTEXT:
    - Recent Priority Picks: ${blueHistory.join(', ') || 'Unknown'}
    - Roster Info:
    ${rosterContext}
    
    RED TEAM CONTEXT:
    - Recent Priority Picks: ${redHistory.join(', ') || 'Unknown'}
    
    Based on this, identifying the composition archetypes and recommending the best response for the acting team.
    `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(jsonStr);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { titleId = 3, teamId, opponentId, bluePicks = [], redPicks = [] } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Fetch History
    const [blueHistory, redHistory] = await Promise.all([
      teamId ? fetchTeamHistory(teamId, titleId) : Promise.resolve([]),
      opponentId ? fetchTeamHistory(opponentId, titleId) : Promise.resolve([])
    ]);

    // 2. Fetch Roster (for our team)
    const rosterContext = teamId ? await fetchRosterContext(supabase, teamId) : "";

    // 3. AI Analysis
    let analysis;
    try {
      analysis = await generateGeminiAnalysis(bluePicks, redPicks, blueHistory, redHistory, rosterContext, titleId);
      analysis.source = 'gemini-2.0-flash';
    } catch (e) {
      console.error('Gemini failed', e);
      // Fallback (simplified)
      analysis = {
        winProbability: { blueWinRate: 50, confidence: 0.1 },
        recommendedPicks: [],
        compositionAnalysis: { blueArchetype: "Unknown", redArchetype: "Unknown", matchupNotes: ["AI Failed"] },
        draftAdvantage: { advantageTeam: "even", reasoning: "Analysis unavailable" },
        source: "fallback"
      };
    }

    return new Response(JSON.stringify({
      seriesId: null, // Simulation mode
      titleId,
      blueSide: { teamId, picks: bluePicks, bans: [] },
      redSide: { teamId: opponentId, picks: redPicks, bans: [] },
      ...analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
