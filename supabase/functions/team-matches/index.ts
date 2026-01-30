// supabase/functions/team-matches/index.ts
// Fetch match history (past) and schedule (upcoming)
// Uses GRID API Central Data Feed (allSeries query)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenAI } from 'npm:@google/genai@^1.0.0'

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'

async function searchMatchesWithGemini(teamName: string, game: string, currentDate: string): Promise<any[]> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY missing, skipping AI match search')
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })
    const prompt = `Find the upcoming match schedule for the professional esports team "${teamName}" in ${game}.
Current Date: ${currentDate}

Search sources like Liquipedia, vlr.gg (if Valorant), or Leaguepedia.
Return up to 3 upcoming matches scheduled AFTER ${currentDate}.

Return a JSON array with this structure:
[
  {
    "opponentName": "Opponent Team Name",
    "opponentLogo": "URL to opponent logo (Liquipedia/Wiki)",
    "date": "ISO Date String (YYYY-MM-DDTHH:mm:ssZ)",
    "tournament": "Tournament Name",
    "format": "Bo1/Bo3/Bo5"
  }
]

Rules:
- STRICTLY JSON array only.
- Prefer Liquipedia images for logos.
- If exact time is unknown, use T00:00:00Z.
- If no upcoming matches found, return empty array.`

    const config = {
      thinkingConfig: {
        thinkingLevel: 'MINIMAL',
      },
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const responseText = response.text || '[]'
    const matches = JSON.parse(responseText);

    if (Array.isArray(matches)) {
      return matches.map((m: any) => ({
        id: `ai-${Math.random().toString(36).substr(2, 9)}`,
        startTime: m.date,
        status: 'scheduled',
        format: m.format || 'Bo1',
        type: 'Official',
        result: 'UPCOMING',
        score: 'VS',
        opponent: {
          name: m.opponentName,
          abbreviation: m.opponentName.substring(0, 3).toUpperCase(),
          logoUrl: m.opponentLogo
        },
        tournament: {
          name: m.tournament
        },
        source: 'gemini'
      }));
    }
    return [];

  } catch (e) {
    console.error('Gemini match search failed:', e);
    return [];
  }
}


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

    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader! } }
    })

    const url = new URL(req.url)
    let teamId = url.searchParams.get('teamId')
    let game = url.searchParams.get('game')
    let teamNameArg = url.searchParams.get('teamName')

    if (req.method === 'POST') {
      const body = await req.json()
      if (!teamId) teamId = body.teamId
      if (!game) game = body.game
      if (!teamNameArg) teamNameArg = body.teamName
    }

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: 'teamId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`[team-matches] Fetching matches for team: ${teamId}`)
    console.log(`[team-matches] Using API URL: ${GRID_API_URL}`)
    console.log(`[team-matches] API Key present: ${!!gridApiKey}, length: ${gridApiKey?.length}`)

    const nowISO = new Date().toISOString();
    console.log(`[team-matches] Query time: ${nowISO}`)

    // INTROSPECTION MODE:
    // Let's find out what the schema actually supports for 'allSeries' or 'series'
    const combinedQuery = `
      query IntrospectGRID {
         __type(name: "Series") {
            name
            fields {
                name
                type {
                    name
                    kind
                }
            }
         }
         filterInput: __type(name: "SeriesFilter") {
             name
             inputFields {
                 name
                 type {
                     name
                     kind
                 }
             }
         }
         orderByEnum: __type(name: "SeriesOrderBy") {
             name
             enumValues {
                 name
             }
         }
      }
    `;

    console.log(`[team-matches] Sending INTROSPECTION request to GRID API...`)

    const gridRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': gridApiKey },
      body: JSON.stringify({
        query: combinedQuery,
        variables: {}
      }),
    })

    console.log(`[team-matches] GRID Response Status: ${gridRes.status} ${gridRes.statusText}`)
    console.log(`[team-matches] GRID Response Headers:`, Object.fromEntries(gridRes.headers.entries()))

    const responseText = await gridRes.text()
    console.log(`[team-matches] GRID Raw Response (first 2000 chars):`, responseText.substring(0, 2000))

    if (!gridRes.ok) {
      console.error(`[team-matches] GRID API HTTP Error ${gridRes.status}:`, responseText)
      return new Response(
        JSON.stringify({
          error: `GRID API error: ${gridRes.status}`,
          details: responseText.substring(0, 500),
          statusText: gridRes.statusText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    let gridData;
    try {
      gridData = JSON.parse(responseText)
    } catch (parseError) {
      console.error(`[team-matches] Failed to parse GRID response as JSON:`, parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON from GRID API', raw: responseText.substring(0, 500) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    if (gridData.errors) {
      console.error('[team-matches] GRID GraphQL Errors:', JSON.stringify(gridData.errors, null, 2))
      return new Response(
        JSON.stringify({ error: 'GRID GraphQL query failed', graphqlErrors: gridData.errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    console.log(`[team-matches] GRID Query successful. Processing data...`)

    const historyEdges = gridData.data?.history?.edges ?? [];
    const upcomingEdges = gridData.data?.upcoming?.edges ?? [];

    const processNode = (node: any, isUpcoming: boolean) => {
      // Find opponent: The participant that is NOT the current team
      const opponentTeam = node.teams?.find((t: any) => t.baseInfo?.id !== teamId);
      const myTeam = node.teams?.find((t: any) => t.baseInfo?.id === teamId);

      let result = 'UPCOMING';
      let status = 'scheduled';

      if (!isUpcoming && node.endTimeActual) {
        status = 'finished';
        const myScore = myTeam?.scoreAdvantage || 0;
        const oppScore = opponentTeam?.scoreAdvantage || 0;
        if (myScore > oppScore) result = 'WIN';
        else if (myScore < oppScore) result = 'LOSS';
        else result = 'DRAW';
      }

      return {
        id: node.id,
        startTime: node.startTimeScheduled,
        status: status,
        format: node.format?.nameShortened || node.format?.name || 'Bo1',
        type: node.type,
        result: result,
        score: isUpcoming ? 'VS' : `${myTeam?.scoreAdvantage || 0} - ${opponentTeam?.scoreAdvantage || 0}`,
        opponent: opponentTeam ? {
          id: opponentTeam.baseInfo.id,
          name: opponentTeam.baseInfo.name,
          abbreviation: opponentTeam.baseInfo.nameShortened
        } : null,
        tournament: node.tournament ? {
          name: node.tournament.name
        } : null
      };
    };

    const historyMatches = historyEdges.map((e: any) => processNode(e.node, false));
    const upcomingMatches = upcomingEdges.map((e: any) => processNode(e.node, true));

    // Combine: Upcoming (ASC) -> History (DESC)
    // But typically dashboards show Most Recent at top.
    // If we want [Upcoming Soonest, Upcoming Later ... Past Recent, Past Older]
    // Or [Upcoming Later, Upcoming Soonest, Past Recent, Past Older] to keep time continuous?
    // Usually "Upcoming" is a separate section.
    // If mixed: Future -> Past (Time Descending).
    // Upcoming: we got ASC (Soonest first). So [Soonest, Next, Later].
    // History: we got DESC (Recent first). So [Recent, Older].
    // If we want Time Descending: [Upcoming Later, Upcoming Soonest, Past Recent, Past Older].
    // Let's just return all and let frontend sort if needed, or stick to simple concatenation.
    // Let's put Upcoming matches *first* in the list, ordered by soonest (ASC), then History (DESC).
    // This highlights the "Next Match" at the top of the upcoming list.

    let matches = [...upcomingMatches, ...historyMatches];

    // If no upcoming matches found, try Gemini
    if (upcomingMatches.length === 0) {
      console.log('[team-matches] No upcoming matches from GRID. Searching with Gemini...');
      // We need team name and game. We have teamId. 
      // We can get team name from history if available, or query GRID for it specifically, 
      // OR rely on what we have. historyEdges[0]?.node?.teams...

      // Let's try to extract team Name from history if possible
      let extractedTeamName = teamNameArg || 'Team';
      let extractedGame = game || 'Esports';

      if (historyEdges.length > 0 && !teamNameArg) {
        const myTeam = historyEdges[0].node.teams.find((t: any) => t.baseInfo.id === teamId);
        if (myTeam) extractedTeamName = myTeam.baseInfo.name;
      }

      if (extractedTeamName !== 'Team') {
        const aiMatches = await searchMatchesWithGemini(extractedTeamName, extractedGame, nowISO.split('T')[0]);
        if (aiMatches.length > 0) {
          console.log(`[team-matches] Found ${aiMatches.length} AI matches`);
          matches = [...aiMatches, ...matches];
        }
      }
    }

    return new Response(
      JSON.stringify({ matches, source: 'grid' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Error fetching matches:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
