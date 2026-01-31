// supabase/functions/match-timeline/index.ts
// Match Timeline Edge Function - Provides live match events and map overlay data

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GRID_URLS, getGridHeaders } from "../_shared/grid-config.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// GraphQL query for match state and events
const SERIES_STATE_QUERY = `
query GetSeriesState($seriesId: ID!) {
  seriesState(id: $seriesId) {
    id
    title {
      nameShortened
    }
    teams {
      id
      name
      side
      score
      won
    }
    games {
      sequenceNumber
      state
      teams {
        id
        name
        side
        score
        won
      }
      players {
        id
        name
        role
        teamId
        kills
        deaths
        assists
        gold
        level
        creepScore
        position {
          x
          y
        }
      }
      objectives {
        type
        teamId
        timestamp
        position {
          x
          y
        }
      }
      gameTime
      goldAdvantage {
        teamId
        gold
      }
    }
    startedAt
    updatedAt
    scores {
      teamId
      score
    }
  }
}
`;

// Alternative query using central data feed
const CENTRAL_SERIES_QUERY = `
query GetSeriesData($seriesId: ID!) {
  series(
    filter: {
      id: { equals: $seriesId }
    }
  ) {
    edges {
      node {
        id
        startTime
        status
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
          state
          finished
          winningTeam {
            id
          }
          clock {
            currentSeconds
            running
          }
        }
      }
    }
  }
}
`;

interface Position {
    x: number;
    y: number;
}

interface TimelineEvent {
    id: string;
    timestamp: number;
    type: 'KILL' | 'OBJECTIVE' | 'TOWER' | 'DRAGON' | 'BARON' | 'RIFT_HERALD' | 'WARD' | 'TEAM_FIGHT';
    position: Position;
    teamId: string;
    playerId?: string;
    playerName?: string;
    targetId?: string;
    targetName?: string;
    objectiveType?: string;
    goldValue?: number;
    isFirstBlood?: boolean;
}

interface PlayerState {
    id: string;
    name: string;
    teamId: string;
    role: string;
    position: Position;
    kills: number;
    deaths: number;
    assists: number;
    gold: number;
    level: number;
    creepScore: number;
    alive: boolean;
}

interface GameState {
    gameTime: number;
    phase: 'EARLY' | 'MID' | 'LATE';
    goldAdvantage: {
        teamId: string;
        amount: number;
    };
    objectiveControl: {
        teamId: string;
        dragonCount: number;
        baronCount: number;
        riftHeraldCount: number;
        towerCount: number;
    };
    visionScore: {
        blueTeam: number;
        redTeam: number;
    };
}

interface MatchTimelineResult {
    seriesId: string;
    gameNumber: number;
    status: 'LIVE' | 'PAUSED' | 'ENDED' | 'SCHEDULED';
    teams: {
        blue: { id: string; name: string; score: number; logoUrl?: string };
        red: { id: string; name: string; score: number; logoUrl?: string };
    };
    gameState: GameState;
    players: PlayerState[];
    recentEvents: TimelineEvent[];
    hotspots: Position[]; // High activity areas for heatmap
    source: string;
}

function determineGamePhase(gameTimeSeconds: number): 'EARLY' | 'MID' | 'LATE' {
    if (gameTimeSeconds < 900) return 'EARLY';  // < 15 min
    if (gameTimeSeconds < 1800) return 'MID';   // < 30 min
    return 'LATE';
}

function normalizePosition(x: number, y: number, mapSize: number = 14800): Position {
    // Normalize coordinates to 0-500 SVG viewport
    return {
        x: Math.round((x / mapSize) * 500),
        y: Math.round((y / mapSize) * 500)
    };
}

function generateSimulatedTimeline(gameTime: number): TimelineEvent[] {
    // Generate simulated events for demo/testing
    const events: TimelineEvent[] = [];
    const numEvents = Math.min(10, Math.floor(gameTime / 60));

    const eventTypes: TimelineEvent['type'][] = ['KILL', 'TOWER', 'DRAGON', 'WARD'];
    const teamIds = ['blue', 'red'];

    for (let i = 0; i < numEvents; i++) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const timestamp = Math.floor(Math.random() * gameTime);

        events.push({
            id: `event-${i}`,
            timestamp,
            type: eventType,
            position: {
                x: 50 + Math.floor(Math.random() * 400),
                y: 50 + Math.floor(Math.random() * 400)
            },
            teamId: teamIds[Math.floor(Math.random() * 2)],
            goldValue: eventType === 'KILL' ? 300 : eventType === 'TOWER' ? 500 : 200
        });
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
}

function generateSimulatedPlayers(gameTime: number): PlayerState[] {
    const roles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
    const blueNames = ['Fudge', 'Blaber', 'Jojopyun', 'Berserker', 'Vulcan'];
    const redNames = ['Zeus', 'Oner', 'Faker', 'Gumayusi', 'Keria'];

    const players: PlayerState[] = [];

    // Blue team positions (bottom-left to top-right diagonal)
    const bluePositions = [
        { x: 100, y: 380 }, // Top laner at top lane
        { x: 200, y: 300 }, // Jungler in jungle
        { x: 250, y: 250 }, // Mid in mid lane
        { x: 380, y: 400 }, // ADC at bot lane
        { x: 400, y: 420 }  // Support at bot lane
    ];

    // Red team positions
    const redPositions = [
        { x: 400, y: 120 }, // Top laner
        { x: 300, y: 200 }, // Jungler
        { x: 250, y: 250 }, // Mid
        { x: 120, y: 100 }, // ADC
        { x: 100, y: 80 }   // Support
    ];

    for (let i = 0; i < 5; i++) {
        // Blue team player
        players.push({
            id: `blue-${i}`,
            name: blueNames[i],
            teamId: 'blue',
            role: roles[i],
            position: bluePositions[i],
            kills: Math.floor(Math.random() * 5),
            deaths: Math.floor(Math.random() * 4),
            assists: Math.floor(Math.random() * 8),
            gold: 3000 + Math.floor(Math.random() * 5000) + Math.floor(gameTime / 60) * 300,
            level: 6 + Math.floor(gameTime / 180),
            creepScore: Math.floor(gameTime / 60) * 10 + Math.floor(Math.random() * 20),
            alive: Math.random() > 0.1
        });

        // Red team player
        players.push({
            id: `red-${i}`,
            name: redNames[i],
            teamId: 'red',
            role: roles[i],
            position: redPositions[i],
            kills: Math.floor(Math.random() * 5),
            deaths: Math.floor(Math.random() * 4),
            assists: Math.floor(Math.random() * 8),
            gold: 3000 + Math.floor(Math.random() * 5000) + Math.floor(gameTime / 60) * 300,
            level: 6 + Math.floor(gameTime / 180),
            creepScore: Math.floor(gameTime / 60) * 10 + Math.floor(Math.random() * 20),
            alive: Math.random() > 0.1
        });
    }

    return players;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const {
            seriesId,
            gameNumber = 1,
            simulate = false
        } = await req.json();

        console.log('[match-timeline] Request:', { seriesId, gameNumber, simulate });

        let result: MatchTimelineResult;

        if (seriesId && !simulate) {
            // Try to fetch real data from GRID
            try {
                // First try Series State Feed
                const stateResponse = await fetch(GRID_URLS.SERIES_STATE, {
                    method: 'POST',
                    headers: getGridHeaders(),
                    body: JSON.stringify({
                        query: SERIES_STATE_QUERY,
                        variables: { seriesId }
                    })
                });

                const stateResult = await stateResponse.json();

                if (stateResult.data?.seriesState) {
                    const state = stateResult.data.seriesState;
                    const game = state.games?.find((g: any) => g.sequenceNumber === gameNumber) || state.games?.[0];

                    // Process real match data
                    const blueTeam = state.teams?.find((t: any) => t.side === 'BLUE' || t.side === 1);
                    const redTeam = state.teams?.find((t: any) => t.side === 'RED' || t.side === 2);

                    const players: PlayerState[] = (game?.players || []).map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        teamId: p.teamId,
                        role: p.role || 'UNKNOWN',
                        position: p.position ? normalizePosition(p.position.x, p.position.y) : { x: 250, y: 250 },
                        kills: p.kills || 0,
                        deaths: p.deaths || 0,
                        assists: p.assists || 0,
                        gold: p.gold || 0,
                        level: p.level || 1,
                        creepScore: p.creepScore || 0,
                        alive: true
                    }));

                    const events: TimelineEvent[] = (game?.objectives || []).map((obj: any, idx: number) => ({
                        id: `obj-${idx}`,
                        timestamp: obj.timestamp || 0,
                        type: obj.type?.toUpperCase() || 'OBJECTIVE',
                        position: obj.position ? normalizePosition(obj.position.x, obj.position.y) : { x: 250, y: 250 },
                        teamId: obj.teamId,
                        objectiveType: obj.type
                    }));

                    const goldAdv = game?.goldAdvantage?.[0];

                    result = {
                        seriesId,
                        gameNumber,
                        status: game?.state === 'FINISHED' ? 'ENDED' : game?.state === 'RUNNING' ? 'LIVE' : 'SCHEDULED',
                        teams: {
                            blue: {
                                id: blueTeam?.id || 'blue',
                                name: blueTeam?.name || 'Blue Side',
                                score: blueTeam?.score || 0
                            },
                            red: {
                                id: redTeam?.id || 'red',
                                name: redTeam?.name || 'Red Side',
                                score: redTeam?.score || 0
                            }
                        },
                        gameState: {
                            gameTime: game?.gameTime || 0,
                            phase: determineGamePhase(game?.gameTime || 0),
                            goldAdvantage: {
                                teamId: goldAdv?.teamId || 'blue',
                                amount: goldAdv?.gold || 0
                            },
                            objectiveControl: {
                                teamId: 'blue',
                                dragonCount: (game?.objectives || []).filter((o: any) => o.type === 'DRAGON' && o.teamId === blueTeam?.id).length,
                                baronCount: (game?.objectives || []).filter((o: any) => o.type === 'BARON' && o.teamId === blueTeam?.id).length,
                                riftHeraldCount: 0,
                                towerCount: (game?.objectives || []).filter((o: any) => o.type === 'TOWER' && o.teamId === blueTeam?.id).length
                            },
                            visionScore: {
                                blueTeam: players.filter(p => p.teamId === blueTeam?.id).reduce((sum, p) => sum + (p.creepScore * 0.1), 0),
                                redTeam: players.filter(p => p.teamId === redTeam?.id).reduce((sum, p) => sum + (p.creepScore * 0.1), 0)
                            }
                        },
                        players,
                        recentEvents: events.slice(0, 10),
                        hotspots: [
                            { x: 250, y: 250 }, // Mid lane
                            { x: 150, y: 350 }, // Bot jungle
                            { x: 350, y: 150 }  // Top jungle
                        ],
                        source: 'grid-series-state'
                    };
                } else {
                    throw new Error('No series state data available');
                }
            } catch (error) {
                console.warn('[match-timeline] GRID fetch failed, using simulation:', error);
                simulate = true;
            }
        }

        // Simulated/demo data
        if (simulate || !seriesId) {
            const simulatedGameTime = 1080; // 18 minutes
            const players = generateSimulatedPlayers(simulatedGameTime);
            const events = generateSimulatedTimeline(simulatedGameTime);

            const blueKills = players.filter(p => p.teamId === 'blue').reduce((sum, p) => sum + p.kills, 0);
            const redKills = players.filter(p => p.teamId === 'red').reduce((sum, p) => sum + p.kills, 0);
            const blueGold = players.filter(p => p.teamId === 'blue').reduce((sum, p) => sum + p.gold, 0);
            const redGold = players.filter(p => p.teamId === 'red').reduce((sum, p) => sum + p.gold, 0);

            result = {
                seriesId: seriesId || 'simulation',
                gameNumber,
                status: 'LIVE',
                teams: {
                    blue: { id: 'blue', name: 'Cloud9', score: 1 },
                    red: { id: 'red', name: 'T1', score: 0 }
                },
                gameState: {
                    gameTime: simulatedGameTime,
                    phase: determineGamePhase(simulatedGameTime),
                    goldAdvantage: {
                        teamId: blueGold > redGold ? 'blue' : 'red',
                        amount: Math.abs(blueGold - redGold)
                    },
                    objectiveControl: {
                        teamId: 'blue',
                        dragonCount: 2,
                        baronCount: 0,
                        riftHeraldCount: 1,
                        towerCount: 3
                    },
                    visionScore: {
                        blueTeam: 24,
                        redTeam: 21
                    }
                },
                players,
                recentEvents: events,
                hotspots: [
                    { x: 250, y: 250 }, // Mid
                    { x: 150, y: 350 }, // Bot side jungle
                    { x: 350, y: 150 }, // Top side jungle
                    { x: 100, y: 400 }  // Dragon pit
                ],
                source: 'simulation'
            };
        }

        return new Response(JSON.stringify(result!), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[match-timeline] Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
