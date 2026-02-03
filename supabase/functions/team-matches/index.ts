// supabase/functions/team-matches/index.ts
// Fetch match history: GRID (Primary) -> Leaguepedia via Gemini w/ Pandas (Fallback)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenAI } from 'npm:@google/genai'

import { GRID_URLS, getGridHeaders } from '../_shared/grid-config.ts'

/* -------------------------------------------------------------------------- */
/*                           Gemini Intelligence Layer                        */
/* -------------------------------------------------------------------------- */

/**
 * Strategy: Calls Gemini 3 Pro to research and verify match results.
 * Can be used for full research (if no GRID data) or refinement (if GRID has 0-0).
 */
async function callGeminiResearch(prompt: string): Promise<any[]> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY missing')
    return []
  }

  const apiKey = geminiApiKey;
  const modelName = 'gemini-3-pro-preview';
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const fetchResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [
          { googleSearch: {} },
          { codeExecution: {} }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.warn(`[team-matches] Gemini 3 error: ${fetchResponse.status}. Falling back to 1.5 Pro...`);

      // Fallback to 1.5 Pro if 3 is unavailable
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!fallbackRes.ok) throw new Error(`Gemini fallback failed: ${fallbackRes.status}`);
      const data = await fallbackRes.json();
      return parseGeminiResult(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
    }

    const data = await fetchResponse.json();
    let text = "";
    if (data.candidates?.[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts;
      const textPart = parts.find((p: any) => p.text);
      text = textPart?.text || "";
    }
    return parseGeminiResult(text);
  } catch (e) {
    console.error('[team-matches] Gemini Research Failed:', e)
    return []
  }
}

function parseGeminiResult(text: string): any[] {
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
  try {
    const result = JSON.parse(cleanJson)
    if (Array.isArray(result)) {
      return result.map((m: any) => ({
        id: m.id || `lp-${Math.random().toString(36).substr(2, 9)}`,
        startTime: m.date || new Date().toISOString(),
        status: 'finished',
        format: m.format || 'Bo3',
        type: 'Official',
        result: (m.result || 'TBD').toUpperCase(),
        score: m.score || '0-0',
        opponent: {
          name: m.opponent || 'Unknown Opponent',
          logoUrl: m.logoUrl || null
        },
        tournament: { name: m.tournament || 'Unknown Tournament' },
        source: 'leaguepedia_gemini'
      }))
    }
  } catch (e) {
    console.error('[team-matches] JSON parse error:', e);
  }
  return []
}

/**
 * Verifies and fills in scores for matches that were returned with 0-0/DRAW from GRID.
 */
async function refineMatchesWithGemini(matches: any[], teamName: string): Promise<any[]> {
  // Only refine finished matches with 0-0 score or DRAW result
  // LIMIT: Requesting research for too many matches causes Edge Function timeout.
  // We limit to the most recent 5 finished matches.
  let needsRefinement = matches
    .filter(m => m.status === 'finished' && (m.score === '0-0' || m.result === 'DRAW'))
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  if (needsRefinement.length === 0) return matches;

  // Take top 5
  needsRefinement = needsRefinement.slice(0, 5);

  console.log(`[team-matches] Refining ${needsRefinement.length} matches for ${teamName} using Gemini 3 Pro...`);

  const skeleton = needsRefinement.map(m => ({
    id: m.id,
    date: m.startTime,
    opponent: m.opponent.name,
    tournament: m.tournament.name
  }));

  const prompt = `
You are a world-class esports data researcher.
INPUT: A list of ${needsRefinement.length} matches for team "${teamName}" from an API that has missing or placeholder scores (0-0/DRAW).
GOAL: Use Google Search and Code Execution (Python/Pandas) to find the ACTUAL results and scores on Leaguepedia or Liquipedia.

MATCHES TO RESEARCH:
${JSON.stringify(skeleton, null, 2)}

TASK:
1. Search for each match by team, opponent, and date.
2. Verify if it was a Win, Loss, or Draw for ${teamName}.
3. Find the exact score (e.g., 2-1, 1-2).
4. Return the data as a clean JSON array with updated "result" and "score" fields. Keep the same "id".

OUTPUT SCHEMA:
[
  { "id": "original_id", "result": "Win" | "Loss" | "Draw", "score": "X-Y" }
]
`;

  const refinedData = await callGeminiResearch(prompt);

  // Map the refined results back to the original list
  return matches.map(m => {
    const refined = refinedData.find(r => r.id === m.id);
    if (refined) {
      return {
        ...m,
        result: refined.result.toUpperCase(),
        score: refined.score,
        source: 'grid_hybrid'
      };
    }
    return m;
  });
}

/**
 * Full research if GRID returns nothing.
 */
async function fetchMatchesFromLeaguepedia(teamName: string): Promise<any[]> {
  const prompt = `
You are a world-class esports research agent.
YOUR GOAL: Find the most recent Match History (past 10 matches) for the team "${teamName}" in League of Legends.

STEPS:
1. Use Google Search to find the team's Match History on Leaguepedia (lol.fandom.com) or liquipedia.
2. Visit the URL and extract the "Match History" table. 
3. Use Python (Pandas) to parse the HTML and find the table containing "Opponent", "Result", and "Score".
4. Return ONLY the data as a clean JSON array.

OUTPUT SCHEMA (JSON Array):
- date: ISO string
- tournament: string
- opponent: string
- result: "Win", "Loss", or "Draw"
- score: "2-1", "0-1" etc.
- type: "Official"
`;
  return await callGeminiResearch(prompt);
}

/* -------------------------------------------------------------------------- */
/*                               Main Handler                                 */
/* -------------------------------------------------------------------------- */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const gridApiKey = Deno.env.get('GRID_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!gridApiKey || !supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing environment variables')
    }

    const bodyText = await req.text()
    if (!bodyText) {
      console.warn('[team-matches] Received empty body')
      return new Response(JSON.stringify({ error: 'Empty request body' }), { status: 400, headers: corsHeaders })
    }

    const { teamId, titleId = '3', teamName } = JSON.parse(bodyText)

    if (!teamId) {
      return new Response(JSON.stringify({ error: 'teamId is required' }), { status: 400, headers: corsHeaders })
    }

    console.log(`[team-matches] Fetching for TeamID: ${teamId}, Title: ${titleId}`)

    // 1. GRID Query (allSeries)
    // Updated to use 'allSeries' with 'teamIds' filter
    const gridQuery = `
      query TeamMatches($titleId: ID!, $teamId: ID!) {
        allSeries(
          filter: {
            titleId: $titleId
            teamIds: { in: [$teamId] }
          }
          first: 20
          orderBy: StartTimeScheduled
          orderDirection: DESC
        ) {
          totalCount
          edges {
            node {
              id
              startTimeScheduled
              tournament { id name }
              format { name nameShortened }
              teams {
                baseInfo { id name logoUrl nameShortened }
                scoreAdvantage
              }
            }
          }
        }
      }
    `

    const gridRes = await fetch(GRID_URLS.CENTRAL_DATA, {
      method: 'POST',
      headers: getGridHeaders(gridApiKey),
      body: JSON.stringify({ query: gridQuery, variables: { titleId, teamId } })
    })

    let matches: any[] = []
    let source = 'grid'

    if (gridRes.ok) {
      const json = await gridRes.json()
      console.log('[team-matches] GRID/Central-Data Response:', JSON.stringify(json).substring(0, 500))
      const edges = json.data?.allSeries?.edges || []

      if (edges.length > 0) {
        console.log(`[team-matches] GRID found ${edges.length} matches. Entering Hybrid Refinement...`)
        const rawMatches = edges.map((e: any) => processGridNode(e.node, teamId))

        // HYBRID REFINEMENT: If GRID has 0-0 or DRAW, ask Gemini 3 Pro to find the truth.
        matches = await refineMatchesWithGemini(rawMatches, teamName || 'Team')
        source = 'grid_hybrid'
      } else {
        console.log('[team-matches] GRID returned 0 matches. Triggering full AI research...')
        source = 'leaguepedia_gemini'
      }
    } else {
      console.error(`[team-matches] GRID Error: ${gridRes.status}`)
      source = 'fallback_grid_error'
    }

    // 2. Fallback: Gemini + Leaguepedia (Full Research if matches still empty)
    if (matches.length === 0) {
      const effectiveName = teamName || 'Cloud9'
      console.log(`[team-matches] Triggering Full AI Research for Team: ${effectiveName}`)
      matches = await fetchMatchesFromLeaguepedia(effectiveName)
      source = 'leaguepedia_gemini'
    }

    // Sort: Upcoming (ASC) then History (DESC)
    const now = new Date()
    const upcoming = matches.filter(m => new Date(m.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    const history = matches.filter(m => new Date(m.startTime) <= now)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    const unified = [...upcoming, ...history]

    return new Response(
      JSON.stringify({ matches: unified, source }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Handler error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function processGridNode(node: any, myTeamId: string) {
  const now = new Date()
  const start = new Date(node.startTimeScheduled)
  const isUpcoming = start > now

  // Find sides
  const myTeam = node.teams?.find((t: any) => t.baseInfo.id == myTeamId)
  const opponent = node.teams?.find((t: any) => t.baseInfo.id != myTeamId)

  let result = isUpcoming ? 'UPCOMING' : 'TBD'
  if (!isUpcoming && myTeam && opponent) {
    if (myTeam.scoreAdvantage > opponent.scoreAdvantage) result = 'WIN'
    else if (myTeam.scoreAdvantage < opponent.scoreAdvantage) result = 'LOSS'
    else result = 'DRAW'
  }

  return {
    id: node.id,
    startTime: node.startTimeScheduled,
    status: isUpcoming ? 'scheduled' : 'finished',
    format: node.format?.nameShortened || 'Bo1',
    type: 'Official',
    result,
    score: isUpcoming ? 'VS' : `${myTeam?.scoreAdvantage || 0}-${opponent?.scoreAdvantage || 0}`,
    opponent: opponent ? {
      name: opponent.baseInfo.name,
      logoUrl: opponent.baseInfo.logoUrl
    } : { name: 'TBD' },
    tournament: { name: node.tournament?.name || 'Unknown Tournament' },
    source: 'grid'
  }
}
