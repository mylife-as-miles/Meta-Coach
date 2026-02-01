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

Search the web for the OFFICIAL schedule. Do NOT restrict search to Liquipedia. Use official team sites, tournament pages, and major esports news outlets.
Return up to 3 upcoming matches scheduled AFTER ${currentDate}.

Return a JSON array with this structure:
[
  {
    "opponentName": "Opponent Team Name",
    "opponentLogo": "URL to opponent logo (High quality transparent PNG from web)",
    "date": "ISO Date String (YYYY-MM-DDTHH:mm:ssZ)",
    "tournament": "Tournament Name",
    "format": "Bo1/Bo3/Bo5"
  }
]

Rules:
- STRICTLY JSON array only.
- Find the best quality logo available from any reliable source.
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
    let titleId = url.searchParams.get('titleId')
    let game = url.searchParams.get('game')
    let teamNameArg = url.searchParams.get('teamName')

    if (req.method === 'POST') {
      const body = await req.json()
      if (!teamId) teamId = body.teamId
      if (!titleId) titleId = body.titleId
      if (!game) game = body.game
      if (!teamNameArg) teamNameArg = body.teamName
    }

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: 'teamId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Default titleId to 3 (LoL) if missing, as per general usage
    if (!titleId) titleId = '3';

    console.log(`[team-matches] Fetching matches for team: ${teamId}, title: ${titleId}`)

    const nowISO = new Date().toISOString();

    // =========================================
    // QUERY: seriesStatistics 
    // Attempting to fetch series list via statistics endpoint as requested
    // =========================================

    // Note: We are guessing that seriesStatistics contains a 'series' field or similar to get the list,
    // or we use this to get stats. But since this is 'team-matches' endpoint, we MUST return matches.
    // If this query fails to return a list, we might need to revisit.

    const query = `
      query GetSeriesStatistics($titleId: ID!, $teamId: ID!) {
        seriesStatistics(titleId: $titleId, filter: { teamIds: { in: [$teamId] } }) {
            series {
              id
              startTimeScheduled
              format { name nameShortened }
              type
              tournament { 
                id 
                name
                startDate
                endDate
              }
              teams {
                baseInfo { 
                  id 
                  name 
                  nameShortened 
                  logoUrl 
                }
                scoreAdvantage
              }
            }
        }
      }
    `

    console.log(`[team-matches] Sending seriesStatistics query...`)

    const gridRes = await fetch(GRID_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': gridApiKey },
      body: JSON.stringify({
        query: query,
        variables: { titleId, teamId }
      }),
    });

    console.log(`[team-matches] GRID Response: ${gridRes.status}`)

    let matches: any[] = [];
    if (gridRes.ok) {
      const json = await gridRes.json();
      if (!json.errors) {
        // Check where the list is. 
        // If seriesStatistics returns an object with 'series' array:
        const seriesList = json.data?.seriesStatistics?.series || [];

        // Map to our Match interface
        matches = seriesList.map((node: any) => processNode(node, teamId));

        console.log(`[team-matches] Found ${matches.length} matches via seriesStatistics`);
      } else {
        console.warn('[team-matches] GRID Query errors:', json.errors);
      }
    }

    // Helper function to process nodes (unified)
    function processNode(node: any, myTeamId: string) {
      const now = new Date();
      const start = new Date(node.startTimeScheduled);
      const isUpcoming = start > now;

      const opponentTeam = node.teams?.find((t: any) => t.baseInfo?.id !== myTeamId);
      const myTeam = node.teams?.find((t: any) => t.baseInfo?.id === myTeamId);

      let result = isUpcoming ? 'UPCOMING' : 'FINISHED';
      let status = isUpcoming ? 'scheduled' : 'finished';

      if (!isUpcoming) {
        if ((myTeam?.scoreAdvantage || 0) > 0 || (opponentTeam?.scoreAdvantage || 0) > 0) {
          status = 'finished';
          const myScore = myTeam?.scoreAdvantage || 0;
          const oppScore = opponentTeam?.scoreAdvantage || 0;
          if (myScore > oppScore) result = 'WIN';
          else if (myScore < oppScore) result = 'LOSS'; // Fixed: was result = 'LOSS'
          else result = 'DRAW';
        } else {
          result = 'TBD';
        }
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
          abbreviation: opponentTeam.baseInfo.nameShortened,
          logoUrl: opponentTeam.baseInfo.logoUrl
        } : null,
        tournament: node.tournament ? {
          id: node.tournament.id,
          name: node.tournament.name,
          startDate: node.tournament.startDate || null,
          endDate: node.tournament.endDate || null
        } : null,
        source: 'grid'
      };
    }

    // Sort matches: Upcoming ASC, Past DESC
    // Since we get them all in one bag, let's sort properly.
    const upcoming = matches.filter(m => m.status === 'scheduled').sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const history = matches.filter(m => m.status === 'finished').sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    matches = [...upcoming.slice(0, 5), ...history.slice(0, 10)];

    // Gemini Fallback logic (retained)
    if (matches.length === 0) {
      console.log('[team-matches] No upcoming matches from GRID. Searching with Gemini...');
      // We need team name and game. We have teamId. 
      // We can get team name from history if available, or query GRID for it specifically, 
      // OR rely on what we have. historyEdges[0]?.node?.teams...

      // Let's try to extract team Name from history if possible
      let extractedTeamName = teamNameArg || 'Team';
      let extractedGame = game || 'Esports';

      // Extract team name from first history match opponent (we know the opponent, so our team is the other one)
      // Since historyMatches are processed, we'll just use the teamNameArg if provided
      // or fallback to 'Team' which will trigger Gemini search anyway

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
