// supabase/functions/team-matches/index.ts
// Fetch match history: GRID (Primary) -> Leaguepedia via Gemini w/ Pandas (Fallback)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
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
      let text = "";
      if (data.candidates?.[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts;
        const textPart = parts.find((p: any) => p.text);
        text = textPart?.text || "";
      }
      return parseGeminiResult(text);
    }

    const data = await fetchResponse.json();
    let text = "";
    if (data.candidates?.[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts;
      const textPart = parts.find((p: any) => p.text);
      text = textPart?.text || "";
    }

    console.log(`[team-matches] Raw Gemini Response Length: ${text.length}`);
    if (text.length < 50) {
      console.warn(`[team-matches] Extremely short response from Gemini: "${text}"`);
    }

    return parseGeminiResult(text);
  } catch (e) {
    console.error('[team-matches] Gemini Research Failed:', e)
    return []
  }
}

function parseGeminiResult(text: string): any[] {
  if (!text) return [];
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
  try {
    const result = JSON.parse(cleanJson)
    if (Array.isArray(result)) {
      console.log(`[team-matches] Parsed ${result.length} matches from Gemini.`);
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
    } else if (result.matches && Array.isArray(result.matches)) {
      // Handle case where AI wraps it in an object
      return parseGeminiResult(JSON.stringify(result.matches));
    }
  } catch (e) {
    console.error('[team-matches] JSON parse error on text:', text.substring(0, 200));
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
4. GENERATE PERFORMANCE STATS:
   - "macroControl": Estimate a percentage (0-100) based on dominance. (Stomp = 80+, Close Win = 60+, Loss = <50).
   - "microErrorRate": Estimate "LOW", "MED", or "HIGH" based on result. (Win = LOW/MED, Loss = MED/HIGH).
   - "reasoning": A 1-sentence explanation of why you gave these stats (e.g., "Sweeping 2-0 victory suggests superior macro play").
5. Return the data as a clean JSON array with updated "result", "score" and "performance_summary" fields. Keep the same "id".

OUTPUT SCHEMA:
[
  { 
    "id": "original_id", 
    "result": "Win" | "Loss" | "Draw", 
    "score": "X-Y",
    "performance_summary": {
        "macroControl": number,
        "microErrorRate": "LOW" | "MED" | "HIGH",
        "reasoning": string
    }
  }
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
        performance_summary: refined.performance_summary || null, // Include AI stats
        source: 'grid_hybrid'
      };
    }
    return m;
  });
}

/**
 * Full research if GRID returns nothing.
 */
async function fetchMatchesFromLeaguepedia(teamName: string, titleId: string | number = '3'): Promise<any[]> {
  const gameName = String(titleId) === '6' ? 'Dota 2' : 'League of Legends';
  const prompt = `
You are a world-class esports research agent.
YOUR GOAL: Find the most recent Match History (past 10 matches) for the team "${teamName}" in ${gameName}.

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

/**
 * Fetches data from GRID API.
 */
async function fetchMatchesFromGRID(apiKey: string, titleId: string | number, teamId: string | number): Promise<any[]> {
  const gridQuery = `
    query TeamMatches($titleId: ID!, $teamId: ID!) {
      allSeries(
        filter: {
          titleId: $titleId
          teamIds: { in: [$teamId] }
        }
        first: 20
      ) {
        edges {
          node {
            id
            startTimeScheduled
            tournament { id name }
            teams {
              baseInfo { id name logoUrl nameShortened }
            }
          }
        }
      }
    }
  `;

  const requestBody = JSON.stringify({
    query: gridQuery,
    variables: {
      titleId: String(titleId),
      teamId: String(teamId)
    }
  });

  try {
    console.log(`[team-matches] Fetching GRID data for TeamID: ${teamId}, TitleID: ${titleId}`);

    const res = await fetch(GRID_URLS.CENTRAL_DATA, {
      method: 'POST',
      headers: getGridHeaders(apiKey),
      body: requestBody
    });

    const json = await res.json();

    if (json.errors) {
      console.error('[team-matches] GRID GraphQL Errors:', JSON.stringify(json.errors));
    }

    if (!res.ok) {
      console.warn(`[team-matches] GRID Fetch failed: ${res.status}`, JSON.stringify(json));
      return [];
    }

    const edges = json.data?.allSeries?.edges || [];
    console.log(`[team-matches] GRID returned ${edges.length} edges.`);

    return edges.map((e: any) => processGridNode(e.node, teamId));
  } catch (err) {
    console.error('[team-matches] GRID fetch error:', err);
    return [];
  }
}

/**
 * Merges and deduplicates matches from GRID and AI sources.
 */
function mergeAndRefineMatches(gridMatches: any[], aiMatches: any[], teamId: string | number): any[] {
  const merged = [...gridMatches];

  aiMatches.forEach(ai => {
    // Check if this AI match already exists in GRID results
    const exists = gridMatches.find(g => {
      const gDate = new Date(g.startTime).toDateString();
      const aiDate = new Date(ai.startTime).toDateString();
      const sameDay = gDate === aiDate;

      const gOpp = (g.opponent?.name || '').toLowerCase();
      const aiOpp = (ai.opponent?.name || '').toLowerCase();
      const sameOpp = gOpp.includes(aiOpp) || aiOpp.includes(gOpp);

      return sameDay && (sameOpp || aiOpp === 'unknown opponent');
    });

    if (!exists) {
      merged.push(ai);
    } else {
      // If it exists, merge AI details (like scores or summary) into GRID's structural match
      if (!exists.performance_summary && ai.performance_summary) {
        exists.performance_summary = ai.performance_summary;
      }
      if ((exists.score === '0-0' || !exists.score) && ai.score && ai.score !== '0-0') {
        exists.score = ai.score;
        exists.result = ai.result.toUpperCase();
      }
    }
  });

  return merged;
}

/* -------------------------------------------------------------------------- */
/*                               Main Handler                                 */
/* -------------------------------------------------------------------------- */
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') // Using Service Role for upserts

    if (!gridApiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const bodyText = await req.text()
    if (!bodyText) {
      console.warn('[team-matches] Received empty body')
      return new Response(JSON.stringify({ error: 'Empty request body' }), { status: 400, headers: corsHeaders })
    }

    const { teamId, titleId = '3', teamName, offset = 0, limit = 10 } = JSON.parse(bodyText)

    if (!teamId) {
      return new Response(JSON.stringify({ error: 'teamId is required' }), { status: 400, headers: corsHeaders })
    }

    console.log(`[team-matches] Fetching for TeamID: ${teamId}, Offset: ${offset}, Limit: ${limit}`)

    // 1. CACHE CHECK: Query local DB first
    // We join matches -> series -> tournament to reconstruct the payload
    const { data: dbMatches, error: dbError } = await supabase
      .from('matches')
      .select(`
        *,
        series:series_id (
          start_time,
          tournament_name,
          participants:series_participants(team_name, team_id)
        )
      `)
      .order('id', { ascending: false }) // Approximate sorting by ID for now, or match number
    // Note: A real implementation needs accurate sorting by startTime. 
    // For now, we rely on the fact that we insert them. 
    // Ideally, 'matches' should have a 'start_time' copied from series or its own.
    // Let's assume we can filter by series start_time if we had the relationship set up perfectly.
    // Simplify: Fetch everything and filter in memory or rely on API for pagination logic if DB is empty.

    // Better Strategy for Cache:
    // Query 'series_participants' for the team -> get series_ids -> get matches
    // This is complex in one go. 

    // SIMPLIFIED CACHE STRATEGY:
    // Check if we have *any* matches for this team in the 'series_participants' table roughly in the last month?
    // Actually, sticking to the requested "Load More" logic:
    // If offset > 0, we assume the client has some data. We try to fetch from DB. 
    // If DB yields < limit, we might need to fetch from API.

    // LET'S DO HYBRID:
    // Always fetch from API for now to ensure freshness/accuracy until the Sync Job is fully robust, 
    // BUT Upsert the results so future "Sync" jobs have data. 

    // WAIT, the requirement is "Cache-First".
    // 1. Try to fetch from DB "matches" linked to this team.
    // Need a way to link match -> team. 'series_participants' links series -> team.
    // Query: Get Series IDs for Team -> Get Matches for Series.

    const { data: seriesIds } = await supabase
      .from('series_participants')
      .select('series_id')
      .eq('team_id', teamId)

    let dbResults: any[] = [];
    if (seriesIds && seriesIds.length > 0) {
      const ids = seriesIds.map(s => s.series_id);
      const { data: matches } = await supabase
        .from('series')
        .select(`
                id,
                start_time,
                tournament_name,
                matches (
                    id, status, result, score, opponent_name, opponent_logo, sequence_number
                )
            `)
        .in('id', ids)
        .order('start_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (matches && matches.length > 0) {
        // Transform DB shape to API shape
        dbResults = matches.flatMap(s => s.matches.map((m: any) => ({
          id: m.id,
          startTime: s.start_time,
          status: m.status || 'finished',
          format: 'Bo3', // stored?
          type: 'Official',
          result: m.result,
          score: m.score,
          performance_summary: m.performance_summary || null, // Map DB JSON to API
          opponent: {
            name: m.opponent_name || 'Unknown',
            logoUrl: m.opponent_logo
          },
          tournament: { name: s.tournament_name },
          source: 'database_cache'
        })))
      }
    }

    if (dbResults.length >= limit) {
      console.log(`[team-matches] Cache Hit! Returning ${dbResults.length} matches from DB.`);
      return new Response(
        JSON.stringify({ matches: dbResults, source: 'database_cache' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('[team-matches] Cache Miss (or insufficient data). Triggering DUAL-SOURCE Fetch...');

    // 2. Dual-Source Fetch (GRID + Gemini Research in Parallel)
    const gridPromise = fetchMatchesFromGRID(gridApiKey, titleId, teamId);
    const aiPromise = fetchMatchesFromLeaguepedia(teamName || 'Team', titleId);

    const [gridResults, aiResults] = await Promise.all([
      gridPromise.catch(err => { console.error('[team-matches] GRID Parallel Fail:', err); return []; }),
      aiPromise.catch(err => { console.error('[team-matches] AI Parallel Fail:', err); return []; })
    ]);

    console.log(`[team-matches] Parallel Fetch Done. GRID: ${gridResults.length}, AI: ${aiResults.length}`);

    // 3. Merging & Deduplication Engine
    let mergedMatches = mergeAndRefineMatches(gridResults, aiResults, teamId);

    // Final Hybrid Refinement (For any GRID matches that Gemini might have missed or didn't have 0-0 info on)
    // Actually, we skip another full refine pass to save time, unless matches are 0-0.
    let matches = await refineMatchesWithGemini(mergedMatches, teamName || 'Team');

    const source = (gridResults.length > 0 && aiResults.length > 0) ? 'dual_source_hybrid' :
      gridResults.length > 0 ? 'grid' : 'leaguepedia_gemini';

    // 4. UPSERT TO DB
    if (matches.length > 0) {
      await upsertMatchesToDB(supabase, matches, teamId, teamName || 'Team', titleId);
    }

    // Sort and Paginate
    const now = new Date();
    const upcoming = matches.filter(m => new Date(m.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const history = matches.filter(m => new Date(m.startTime) <= now)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const unified = [...upcoming, ...history];

    return new Response(
      JSON.stringify({ matches: unified.slice(offset, offset + limit), source }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );


  } catch (error: any) {
    console.error('Handler error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function upsertMatchesToDB(supabase: any, matches: any[], teamId: string, teamName: string, titleId: string | number) {
  console.log('[team-matches] Persisting results to DB...')
  for (const m of matches) {
    // Upsert Series
    const { error: sErr } = await supabase.from('series').upsert({
      id: m.id,
      title_id: titleId,
      start_time: m.startTime,
      tournament_id: m.tournament?.id,
      tournament_name: m.tournament?.name,
      updated_at: new Date().toISOString()
    })

    // Upsert Participant (Link Team to Series)
    await supabase.from('series_participants').upsert({
      series_id: m.id,
      team_id: teamId,
      team_name: teamName
    }, { onConflict: 'series_id, team_id' })

    // Upsert Match
    await supabase.from('matches').upsert({
      id: m.id + '-1', // Simple single-game/match mapping
      series_id: m.id,
      status: m.status,
      result: m.result,
      score: m.score,
      performance_summary: m.performance_summary, // Upsert AI stats
      opponent_name: m.opponent.name,
      opponent_logo: m.opponent.logoUrl,
      sequence_number: 1
    }, { onConflict: 'series_id, sequence_number' }) // Assuming schema
  }
}

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
    tournament: {
      id: node.tournament?.id,
      name: node.tournament?.name || 'Unknown Tournament'
    },
    source: 'grid'
  }
}
