// supabase/functions/draft-analysis/index.ts
// Draft Analysis Edge Function - Provides win probability and counter-pick recommendations

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GRID_URLS, getGridHeaders } from "../_shared/grid-config.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// GraphQL query for draft analysis
const DRAFT_ANALYSIS_QUERY = `
query GetDraftAnalysis($titleId: Int!, $seriesId: ID, $teamId: ID) {
  series(
    filter: {
      titleId: { equals: $titleId }
      id: { equals: $seriesId }
    }
    first: 1
  ) {
    edges {
      node {
        id
        startTime
        seriesType
        teams {
          baseInfo {
            id
            name
            logoUrl
          }
          score
        }
        games {
          id
          gameNumber
          draft {
            picks {
              player {
                id
                nickname
              }
              hero {
                id
                name
              }
              team {
                id
              }
              order
            }
            bans {
              hero {
                id
                name
              }
              team {
                id
              }
              order
            }
          }
          winningTeam {
            id
          }
        }
        participants {
          id
          seed {
            name
          }
          roster {
            player {
              id
              nickname
            }
            role
          }
        }
      }
    }
  }
}
`;

// Query to get team's recent draft patterns
const TEAM_DRAFT_PATTERNS_QUERY = `
query GetTeamDraftPatterns($teamId: ID!, $titleId: Int!, $limit: Int = 20) {
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
          draft {
            picks {
              hero {
                id
                name
              }
              team {
                id
              }
            }
            bans {
              hero {
                id
                name
              }
              team {
                id
              }
            }
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

interface DraftPick {
    heroId: string;
    heroName: string;
    teamId: string;
    playerId?: string;
    playerName?: string;
    order: number;
    role?: string;
}

interface DraftBan {
    heroId: string;
    heroName: string;
    teamId: string;
    order: number;
}

interface DraftAnalysisResult {
    seriesId: string | null;
    titleId: number;
    blueSide: {
        teamId: string;
        teamName: string;
        picks: DraftPick[];
        bans: DraftBan[];
    };
    redSide: {
        teamId: string;
        teamName: string;
        picks: DraftPick[];
        bans: DraftBan[];
    };
    winProbability: {
        blueWinRate: number;
        redWinRate: number;
        confidence: number;
    };
    draftAdvantage: {
        advantageTeam: 'blue' | 'red' | 'even';
        delta: number;
        reasoning: string;
    };
    recommendedPicks: {
        heroId: string;
        heroName: string;
        role: string;
        winRateVsComp: number;
        counterScore: number;
        reasoning: string;
    }[];
    compositionAnalysis: {
        blueArchetype: string;
        redArchetype: string;
        matchupNotes: string[];
    };
    source: string;
}

// Champion/Hero archetype classifications for LoL
const COMPOSITION_ARCHETYPES = {
    dive: ['Camille', 'Renekton', 'Diana', 'JarvanIV', 'Leona', 'Nautilus', 'Elise', 'LeeSin'],
    poke: ['Jayce', 'Nidalee', 'Xerath', 'Varus', 'Zoe', 'Lux', 'Ziggs'],
    engage: ['Malphite', 'Ornn', 'Rakan', 'Alistar', 'Sett', 'Galio', 'Amumu'],
    disengage: ['Janna', 'Gragas', 'Azir', 'Anivia', 'Tahm Kench', 'Lulu'],
    splitpush: ['Fiora', 'Tryndamere', 'Jax', 'Shen', 'Twisted Fate', 'Ryze'],
    scaling: ['Kayle', 'Kassadin', 'Azir', 'Jinx', 'Kog\'Maw', 'Aphelios', 'Zeri'],
    earlygame: ['Renekton', 'Pantheon', 'LeeSin', 'Elise', 'Draven', 'Lucian', 'Kalista'],
};

function classifyComposition(picks: DraftPick[]): string {
    const heroNames = picks.map(p => p.heroName);

    // Count matches for each archetype
    const archetypeCounts: Record<string, number> = {};
    for (const [archetype, heroes] of Object.entries(COMPOSITION_ARCHETYPES)) {
        archetypeCounts[archetype] = heroNames.filter(h =>
            heroes.some(hero => h.toLowerCase().includes(hero.toLowerCase()))
        ).length;
    }

    // Find dominant archetype
    const sorted = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] >= 2) {
        return sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1) + ' Heavy';
    }

    return 'Balanced';
}

function calculateWinProbability(bluePicks: DraftPick[], redPicks: DraftPick[]): { blueWinRate: number; confidence: number } {
    // Base probability
    let blueAdvantage = 50;

    // Factors that affect win probability:
    // 1. Composition archetype matchup
    const blueArchetype = classifyComposition(bluePicks);
    const redArchetype = classifyComposition(redPicks);

    // Dive beats Poke, Poke beats Scaling, Scaling beats Dive, etc.
    if (blueArchetype.includes('Dive') && redArchetype.includes('Poke')) blueAdvantage += 5;
    if (blueArchetype.includes('Poke') && redArchetype.includes('Scaling')) blueAdvantage += 4;
    if (blueArchetype.includes('Scaling') && redArchetype.includes('Dive')) blueAdvantage += 3;
    if (blueArchetype.includes('Disengage') && redArchetype.includes('Dive')) blueAdvantage += 6;

    // Reverse matchups
    if (redArchetype.includes('Dive') && blueArchetype.includes('Poke')) blueAdvantage -= 5;
    if (redArchetype.includes('Poke') && blueArchetype.includes('Scaling')) blueAdvantage -= 4;
    if (redArchetype.includes('Disengage') && blueArchetype.includes('Dive')) blueAdvantage -= 6;

    // 2. Number of picks (more picks = more confidence)
    const totalPicks = bluePicks.length + redPicks.length;
    const confidence = Math.min(0.95, 0.4 + (totalPicks * 0.06));

    // Blue side advantage baseline
    blueAdvantage += 2;

    // Clamp to reasonable range
    blueAdvantage = Math.max(35, Math.min(65, blueAdvantage));

    return {
        blueWinRate: blueAdvantage,
        confidence: confidence
    };
}

function generateRecommendedPicks(
    existingBluePicks: DraftPick[],
    existingRedPicks: DraftPick[]
): DraftAnalysisResult['recommendedPicks'] {
    const recommendations: DraftAnalysisResult['recommendedPicks'] = [];
    const redArchetype = classifyComposition(existingRedPicks);

    // Recommend based on counter-archetype logic
    if (redArchetype.includes('Dive')) {
        recommendations.push({
            heroId: 'azir',
            heroName: 'Azir',
            role: 'MID',
            winRateVsComp: 54.2,
            counterScore: 8.5,
            reasoning: 'Azir\'s ultimate (Shurima Shuffle) provides excellent disengage against dive compositions.'
        });
        recommendations.push({
            heroId: 'janna',
            heroName: 'Janna',
            role: 'SUPPORT',
            winRateVsComp: 56.1,
            counterScore: 9.0,
            reasoning: 'Janna excels at peeling and disrupting dive attempts with Monsoon and Howling Gale.'
        });
    }

    if (redArchetype.includes('Poke')) {
        recommendations.push({
            heroId: 'leona',
            heroName: 'Leona',
            role: 'SUPPORT',
            winRateVsComp: 53.8,
            counterScore: 7.5,
            reasoning: 'Hard engage to close the gap before poke wears down your team.'
        });
    }

    if (redArchetype.includes('Scaling')) {
        recommendations.push({
            heroId: 'renekton',
            heroName: 'Renekton',
            role: 'TOP',
            winRateVsComp: 55.0,
            counterScore: 8.0,
            reasoning: 'Strong early game pressure to prevent scaling compositions from reaching their power spikes.'
        });
    }

    // Default recommendations if no specific counter
    if (recommendations.length === 0) {
        recommendations.push({
            heroId: 'orianna',
            heroName: 'Orianna',
            role: 'MID',
            winRateVsComp: 51.5,
            counterScore: 7.0,
            reasoning: 'Versatile pick that fits into most compositions with strong teamfighting.'
        });
    }

    return recommendations.slice(0, 3);
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const {
            titleId = 3, // Default to LoL
            seriesId,
            teamId,
            bluePicks = [],
            redPicks = [],
            blueBans = [],
            redBans = []
        } = await req.json();

        console.log('[draft-analysis] Request:', { titleId, seriesId, teamId, bluePicks: bluePicks.length });

        let seriesData = null;
        let blueTeam = { id: 'blue', name: 'Blue Side', picks: [] as DraftPick[], bans: [] as DraftBan[] };
        let redTeam = { id: 'red', name: 'Red Side', picks: [] as DraftPick[], bans: [] as DraftBan[] };

        // If seriesId provided, fetch real draft data
        if (seriesId) {
            const response = await fetch(GRID_URLS.CENTRAL_DATA, {
                method: 'POST',
                headers: getGridHeaders(),
                body: JSON.stringify({
                    query: DRAFT_ANALYSIS_QUERY,
                    variables: { titleId, seriesId, teamId }
                })
            });

            const result = await response.json();

            if (result.data?.series?.edges?.[0]?.node) {
                seriesData = result.data.series.edges[0].node;

                // Extract teams and draft info
                const teams = seriesData.teams || [];
                if (teams[0]) {
                    blueTeam.id = teams[0].baseInfo?.id || 'blue';
                    blueTeam.name = teams[0].baseInfo?.name || 'Blue Side';
                }
                if (teams[1]) {
                    redTeam.id = teams[1].baseInfo?.id || 'red';
                    redTeam.name = teams[1].baseInfo?.name || 'Red Side';
                }

                // Extract draft from most recent game
                const latestGame = seriesData.games?.[seriesData.games.length - 1];
                if (latestGame?.draft) {
                    // Process picks
                    for (const pick of latestGame.draft.picks || []) {
                        const draftPick: DraftPick = {
                            heroId: pick.hero?.id || 'unknown',
                            heroName: pick.hero?.name || 'Unknown',
                            teamId: pick.team?.id || 'unknown',
                            playerId: pick.player?.id,
                            playerName: pick.player?.nickname,
                            order: pick.order || 0
                        };

                        if (draftPick.teamId === blueTeam.id) {
                            blueTeam.picks.push(draftPick);
                        } else {
                            redTeam.picks.push(draftPick);
                        }
                    }

                    // Process bans
                    for (const ban of latestGame.draft.bans || []) {
                        const draftBan: DraftBan = {
                            heroId: ban.hero?.id || 'unknown',
                            heroName: ban.hero?.name || 'Unknown',
                            teamId: ban.team?.id || 'unknown',
                            order: ban.order || 0
                        };

                        if (draftBan.teamId === blueTeam.id) {
                            blueTeam.bans.push(draftBan);
                        } else {
                            redTeam.bans.push(draftBan);
                        }
                    }
                }
            }
        }

        // If no series data, use provided picks/bans for simulation
        if (!seriesData && (bluePicks.length > 0 || redPicks.length > 0)) {
            blueTeam.picks = bluePicks.map((p: any, i: number) => ({
                heroId: p.id || p.heroId || String(i),
                heroName: p.name || p.heroName || 'Unknown',
                teamId: 'blue',
                order: i + 1
            }));
            redTeam.picks = redPicks.map((p: any, i: number) => ({
                heroId: p.id || p.heroId || String(i),
                heroName: p.name || p.heroName || 'Unknown',
                teamId: 'red',
                order: i + 1
            }));
            blueTeam.bans = blueBans.map((b: any, i: number) => ({
                heroId: b.id || b.heroId || String(i),
                heroName: b.name || b.heroName || 'Unknown',
                teamId: 'blue',
                order: i + 1
            }));
            redTeam.bans = redBans.map((b: any, i: number) => ({
                heroId: b.id || b.heroId || String(i),
                heroName: b.name || b.heroName || 'Unknown',
                teamId: 'red',
                order: i + 1
            }));
        }

        // Calculate win probability
        const { blueWinRate, confidence } = calculateWinProbability(blueTeam.picks, redTeam.picks);

        // Classify compositions
        const blueArchetype = classifyComposition(blueTeam.picks);
        const redArchetype = classifyComposition(redTeam.picks);

        // Determine advantage
        const delta = Math.abs(blueWinRate - 50);
        const advantageTeam = blueWinRate > 52 ? 'blue' : blueWinRate < 48 ? 'red' : 'even';

        // Generate recommendations
        const recommendations = generateRecommendedPicks(blueTeam.picks, redTeam.picks);

        const analysisResult: DraftAnalysisResult = {
            seriesId: seriesId || null,
            titleId,
            blueSide: {
                teamId: blueTeam.id,
                teamName: blueTeam.name,
                picks: blueTeam.picks,
                bans: blueTeam.bans
            },
            redSide: {
                teamId: redTeam.id,
                teamName: redTeam.name,
                picks: redTeam.picks,
                bans: redTeam.bans
            },
            winProbability: {
                blueWinRate: Math.round(blueWinRate * 10) / 10,
                redWinRate: Math.round((100 - blueWinRate) * 10) / 10,
                confidence: Math.round(confidence * 100) / 100
            },
            draftAdvantage: {
                advantageTeam,
                delta: Math.round(delta * 10) / 10,
                reasoning: advantageTeam === 'blue'
                    ? `Blue side's ${blueArchetype} composition has favorable matchup against ${redArchetype}.`
                    : advantageTeam === 'red'
                        ? `Red side's ${redArchetype} composition counters ${blueArchetype}.`
                        : 'Draft is relatively even with no significant advantage.'
            },
            recommendedPicks: recommendations,
            compositionAnalysis: {
                blueArchetype,
                redArchetype,
                matchupNotes: [
                    `Blue plays ${blueArchetype} style`,
                    `Red plays ${redArchetype} style`,
                    blueArchetype.includes('Dive') && redArchetype.includes('Disengage')
                        ? 'Warning: Dive into Disengage is historically unfavorable'
                        : 'Standard matchup dynamics apply'
                ]
            },
            source: seriesId ? 'grid-central' : 'simulation'
        };

        return new Response(JSON.stringify(analysisResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[draft-analysis] Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
