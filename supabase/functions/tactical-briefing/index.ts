// supabase/functions/tactical-briefing/index.ts
// Tactical Briefing Edge Function - AI-powered strategic analysis using Gemini

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GRID_URLS, getGridHeaders } from "../_shared/grid-config.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Query for team macro stats and patterns
const TEAM_MACRO_QUERY = `
query GetTeamMacroStats($teamId: ID!, $titleId: Int!, $limit: Int = 10) {
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
        startTime
        games {
          id
          gameNumber
          clock {
            currentSeconds
          }
          winningTeam {
            id
          }
        }
        teams {
          baseInfo {
            id
            name
          }
          score
        }
      }
    }
  }
}
`;

interface TacticalBriefingRequest {
    titleId?: number;
    teamId?: string;
    opponentId?: string;
    seriesId?: string;
    draftData?: {
        bluePicks: string[];
        redPicks: string[];
        blueBans: string[];
        redBans: string[];
    };
    gameState?: {
        gamePhase: string;
        goldAdvantage: number;
        objectives: string[];
    };
    customContext?: string;
}

interface TacticalInsight {
    type: 'critical' | 'warning' | 'recommendation' | 'observation';
    title: string;
    content: string;
    timing?: string;
    impact?: 'high' | 'medium' | 'low';
}

interface TacticalBriefingResult {
    timestamp: string;
    teamId: string | null;
    opponentId: string | null;
    briefingType: 'pre-game' | 'in-game' | 'post-game';
    executiveSummary: string;
    insights: TacticalInsight[];
    keyMatchups: {
        lane: string;
        advantage: 'blue' | 'red' | 'even';
        reasoning: string;
    }[];
    criticalTimings: {
        timestamp: string;
        event: string;
        action: string;
    }[];
    riskAssessment: {
        level: 'low' | 'medium' | 'high';
        factors: string[];
    };
    source: string;
}

// Moneyball-style analytical prompts for Gemini
const MONEYBALL_SYSTEM_PROMPT = `You are Peter Brand from Moneyball - a brilliant analyst who finds hidden value in data that others overlook.

For esports analysis, you focus on:
1. MICRO TO MACRO: How individual player mistakes compound into strategic failures
2. PATTERN RECOGNITION: Identifying recurring tendencies that can be exploited
3. COUNTER-NARRATIVE: Finding opportunities others miss because they're focused on conventional wisdom
4. ACTIONABLE INSIGHTS: Every observation must lead to a specific action

Your analysis style:
- Be direct and confident in your assessments
- Use specific data points to back up claims
- Provide timing-specific recommendations (e.g., "at level 3", "after first dragon")
- Identify the "hidden gems" - undervalued plays or players
- Always connect individual actions to win probability impact

Output Format:
You will return a JSON object with tactical insights. Be specific and actionable.`;

async function generateGeminiBriefing(
    context: TacticalBriefingRequest,
    historyData: any
): Promise<{ summary: string; insights: TacticalInsight[] }> {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
        console.warn('[tactical-briefing] No Gemini API key, using fallback');
        return generateFallbackBriefing(context);
    }

    try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: MONEYBALL_SYSTEM_PROMPT
        });

        const prompt = buildAnalysisPrompt(context, historyData);

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Try to parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.executiveSummary || parsed.summary || 'Analysis complete.',
                insights: (parsed.insights || []).map((i: any) => ({
                    type: i.type || 'recommendation',
                    title: i.title || 'Insight',
                    content: i.content || i.description || '',
                    timing: i.timing,
                    impact: i.impact || 'medium'
                }))
            };
        }

        // Fallback: use response as summary
        return {
            summary: response.substring(0, 500),
            insights: [{
                type: 'observation',
                title: 'AI Analysis',
                content: response.substring(0, 300),
                impact: 'medium'
            }]
        };

    } catch (error) {
        console.error('[tactical-briefing] Gemini error:', error);
        return generateFallbackBriefing(context);
    }
}

function buildAnalysisPrompt(context: TacticalBriefingRequest, historyData: any): string {
    const parts: string[] = [];

    parts.push('Analyze this esports match scenario and provide tactical insights:');
    parts.push('');

    if (context.draftData) {
        parts.push('DRAFT STATE:');
        parts.push(`Blue Side Picks: ${context.draftData.bluePicks.join(', ') || 'None'}`);
        parts.push(`Red Side Picks: ${context.draftData.redPicks.join(', ') || 'None'}`);
        parts.push(`Blue Side Bans: ${context.draftData.blueBans.join(', ') || 'None'}`);
        parts.push(`Red Side Bans: ${context.draftData.redBans.join(', ') || 'None'}`);
        parts.push('');
    }

    if (context.gameState) {
        parts.push('GAME STATE:');
        parts.push(`Phase: ${context.gameState.gamePhase}`);
        parts.push(`Gold Advantage: ${context.gameState.goldAdvantage > 0 ? '+' : ''}${context.gameState.goldAdvantage}`);
        parts.push(`Objectives Secured: ${context.gameState.objectives.join(', ') || 'None'}`);
        parts.push('');
    }

    if (historyData?.recentMatches) {
        parts.push('HISTORICAL DATA:');
        parts.push(`Recent matches analyzed: ${historyData.recentMatches}`);
        if (historyData.avgGameTime) {
            parts.push(`Average game duration: ${Math.round(historyData.avgGameTime / 60)} minutes`);
        }
        if (historyData.winRate !== undefined) {
            parts.push(`Win rate in sample: ${historyData.winRate}%`);
        }
        parts.push('');
    }

    if (context.customContext) {
        parts.push('ADDITIONAL CONTEXT:');
        parts.push(context.customContext);
        parts.push('');
    }

    parts.push('Provide your analysis as JSON with this structure:');
    parts.push(`{
  "executiveSummary": "One sentence overview of the strategic situation",
  "insights": [
    {
      "type": "critical|warning|recommendation|observation",
      "title": "Short title",
      "content": "Detailed explanation with specific actionable advice",
      "timing": "When this applies (e.g., 'Level 3', 'After first dragon')",
      "impact": "high|medium|low"
    }
  ]
}`);

    return parts.join('\n');
}

function generateFallbackBriefing(context: TacticalBriefingRequest): { summary: string; insights: TacticalInsight[] } {
    const insights: TacticalInsight[] = [];

    // Generate contextual insights based on available data
    if (context.draftData?.bluePicks.length) {
        insights.push({
            type: 'observation',
            title: 'Composition Analysis',
            content: `Blue side has drafted ${context.draftData.bluePicks.length} champions. Analyze team composition synergies and power spikes.`,
            impact: 'medium'
        });
    }

    if (context.gameState) {
        if (context.gameState.goldAdvantage > 2000) {
            insights.push({
                type: 'recommendation',
                title: 'Press Advantage',
                content: 'With a gold lead, look to force objectives and extend map control. Avoid risky plays that could throw the lead.',
                timing: 'Immediately',
                impact: 'high'
            });
        } else if (context.gameState.goldAdvantage < -2000) {
            insights.push({
                type: 'warning',
                title: 'Deficit Recovery',
                content: 'Behind in gold - focus on wave management and look for picks rather than 5v5 teamfights.',
                timing: 'Until gold is even',
                impact: 'high'
            });
        }

        if (context.gameState.gamePhase === 'EARLY') {
            insights.push({
                type: 'critical',
                title: 'Early Game Priority',
                content: 'Focus on lane priority and jungle tracking. First blood and early tower are key objectives.',
                timing: '0-10 minutes',
                impact: 'high'
            });
        } else if (context.gameState.gamePhase === 'LATE') {
            insights.push({
                type: 'critical',
                title: 'Late Game Execution',
                content: 'Deaths are extremely punishing now. Play around Baron and Elder Dragon spawns.',
                timing: 'Now',
                impact: 'high'
            });
        }
    }

    // Default insights
    if (insights.length === 0) {
        insights.push({
            type: 'recommendation',
            title: 'Standard Gameplan',
            content: 'Focus on your win conditions and execute your practiced strategies.',
            impact: 'medium'
        });
    }

    return {
        summary: 'Strategic analysis based on current game state and composition matchups.',
        insights
    };
}

function generateKeyMatchups(draftData?: TacticalBriefingRequest['draftData']): TacticalBriefingResult['keyMatchups'] {
    // Default matchup analysis
    const matchups: TacticalBriefingResult['keyMatchups'] = [
        { lane: 'Top', advantage: 'even', reasoning: 'Standard skill matchup - wave management will be key.' },
        { lane: 'Jungle', advantage: 'blue', reasoning: 'Blue side jungler has better early game presence.' },
        { lane: 'Mid', advantage: 'even', reasoning: 'Control mage vs assassin - roam timing is critical.' },
        { lane: 'Bot', advantage: 'red', reasoning: 'Red side has stronger 2v2 potential early.' },
    ];

    return matchups;
}

function generateCriticalTimings(gamePhase: string): TacticalBriefingResult['criticalTimings'] {
    const timings: TacticalBriefingResult['criticalTimings'] = [];

    if (gamePhase === 'EARLY' || !gamePhase) {
        timings.push(
            { timestamp: '1:30', event: 'Leash complete', action: 'Ward enemy jungle entrance' },
            { timestamp: '3:00', event: 'Level 3 powerspike', action: 'Prepare for gank or invade' },
            { timestamp: '5:00', event: 'First dragon spawn', action: 'Establish bot priority' },
            { timestamp: '8:00', event: 'Rift Herald spawn', action: 'Coordinate with jungler for take' }
        );
    } else if (gamePhase === 'MID') {
        timings.push(
            { timestamp: '14:00', event: 'Tower plates fall', action: 'Rotate to take remaining plates' },
            { timestamp: '20:00', event: 'Baron spawns', action: 'Establish vision control' },
            { timestamp: 'On kill', event: 'After winning fight', action: 'Immediately rotate to nearest objective' }
        );
    } else {
        timings.push(
            { timestamp: 'Death timer', event: 'Enemy carry down', action: 'Rush Baron or Elder' },
            { timestamp: 'Elder spawn', event: 'Elder Dragon', action: 'Must contest with full team' },
            { timestamp: 'Baron buff', event: 'Baron secured', action: 'Siege as 5, do not split' }
        );
    }

    return timings;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body: TacticalBriefingRequest = await req.json();

        console.log('[tactical-briefing] Request:', {
            titleId: body.titleId,
            teamId: body.teamId,
            hasGameState: !!body.gameState
        });

        let historyData: any = null;

        // Fetch historical data if teamId provided
        if (body.teamId) {
            try {
                const response = await fetch(GRID_URLS.CENTRAL_DATA, {
                    method: 'POST',
                    headers: getGridHeaders(),
                    body: JSON.stringify({
                        query: TEAM_MACRO_QUERY,
                        variables: {
                            teamId: body.teamId,
                            titleId: body.titleId || 3,
                            limit: 10
                        }
                    })
                });

                const result = await response.json();
                const series = result.data?.series?.edges || [];

                if (series.length > 0) {
                    let totalGames = 0;
                    let totalWins = 0;
                    let totalGameTime = 0;

                    for (const edge of series) {
                        const node = edge.node;
                        const ourTeam = node.teams?.find((t: any) => t.baseInfo?.id === body.teamId);

                        for (const game of node.games || []) {
                            totalGames++;
                            if (game.winningTeam?.id === body.teamId) {
                                totalWins++;
                            }
                            if (game.clock?.currentSeconds) {
                                totalGameTime += game.clock.currentSeconds;
                            }
                        }
                    }

                    historyData = {
                        recentMatches: totalGames,
                        winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null,
                        avgGameTime: totalGames > 0 ? totalGameTime / totalGames : null
                    };
                }
            } catch (error) {
                console.warn('[tactical-briefing] Failed to fetch history:', error);
            }
        }

        // Generate briefing with Gemini
        const { summary, insights } = await generateGeminiBriefing(body, historyData);

        // Determine briefing type
        const briefingType = body.gameState
            ? (body.gameState.gamePhase === 'LATE' ? 'in-game' : 'in-game')
            : 'pre-game';

        // Calculate risk assessment
        const riskFactors: string[] = [];
        if (body.gameState?.goldAdvantage && body.gameState.goldAdvantage < -3000) {
            riskFactors.push('Significant gold deficit');
        }
        if (body.draftData?.bluePicks.length === 5 && body.draftData?.redPicks.length === 5) {
            // Full draft - analyze composition risk
            riskFactors.push('Full draft locked - execution is key');
        }

        const result: TacticalBriefingResult = {
            timestamp: new Date().toISOString(),
            teamId: body.teamId || null,
            opponentId: body.opponentId || null,
            briefingType,
            executiveSummary: summary,
            insights,
            keyMatchups: generateKeyMatchups(body.draftData),
            criticalTimings: generateCriticalTimings(body.gameState?.gamePhase || 'EARLY'),
            riskAssessment: {
                level: riskFactors.length >= 2 ? 'high' : riskFactors.length === 1 ? 'medium' : 'low',
                factors: riskFactors.length > 0 ? riskFactors : ['Standard game conditions']
            },
            source: historyData ? 'gemini-with-grid' : 'gemini-analysis'
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[tactical-briefing] Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
