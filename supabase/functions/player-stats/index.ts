// supabase/functions/player-stats/index.ts
// Fetch player micro-level performance analytics from GRID API
// Used in Player Hub for detailed individual performance tracking

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const gridApiKey = Deno.env.get('GRID_API_KEY')

        if (!gridApiKey) {
            throw new Error('GRID_API_KEY is not configured')
        }

        let playerId: string | null = null;
        let teamId: string | null = null;
        let matchLimit = 10;

        const url = new URL(req.url)
        playerId = url.searchParams.get('playerId')
        teamId = url.searchParams.get('teamId')

        if (req.method === 'POST') {
            const body = await req.json()
            if (!playerId) playerId = body.playerId
            if (!teamId) teamId = body.teamId
            if (body.matchLimit) matchLimit = body.matchLimit
        }

        if (!playerId) {
            return new Response(
                JSON.stringify({ error: 'playerId is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        console.log(`[player-stats] Fetching stats for player: ${playerId}`)

        // Query player performance across recent matches
        // Note: GRID API schema may vary - this is adapted from documented patterns
        const playerStatsQuery = `
      query GetPlayerStats($playerId: ID!, $limit: Int!) {
        player(id: $playerId) {
          id
          nickname
          country {
            name
            shortName
          }
          teams {
            id
            name
          }
        }
        
        allSeries(
          filter: {
            playerIds: { in: [$playerId] }
          }
          first: $limit
          orderBy: StartTimeScheduled
          orderDirection: DESC
        ) {
          edges {
            node {
              id
              startTimeScheduled
              type
              format { name nameShortened }
              tournament { id name }
              teams {
                baseInfo { id name nameShortened logoUrl }
                scoreAdvantage
                players {
                  player { id nickname }
                  stats {
                    kills
                    deaths
                    assists
                    headshots
                    damageDealt
                    damageReceived
                  }
                }
              }
            }
          }
        }
      }
    `

        const gridRes = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': gridApiKey
            },
            body: JSON.stringify({
                query: playerStatsQuery,
                variables: { playerId, limit: matchLimit }
            })
        })

        console.log(`[player-stats] GRID Response: ${gridRes.status}`)

        if (!gridRes.ok) {
            const errorText = await gridRes.text()
            console.error(`[player-stats] GRID API Error: ${errorText}`)
            return new Response(
                JSON.stringify({ error: 'Failed to fetch player stats', details: errorText }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
            )
        }

        const gridData = await gridRes.json()

        if (gridData.errors) {
            console.error('[player-stats] GraphQL Errors:', JSON.stringify(gridData.errors, null, 2))
            // Return partial data even with errors
        }

        const playerInfo = gridData.data?.player || null
        const matchEdges = gridData.data?.allSeries?.edges || []

        // Process match data to extract player-specific stats
        const matchStats = matchEdges.map((edge: any) => {
            const node = edge.node
            const teams = node.teams || []

            // Find the team containing our player
            let playerStats = null
            let playerTeam = null
            let opponentTeam = null

            for (const team of teams) {
                const playerInTeam = team.players?.find((p: any) => p.player?.id === playerId)
                if (playerInTeam) {
                    playerStats = playerInTeam.stats
                    playerTeam = team
                } else {
                    opponentTeam = team
                }
            }

            // Calculate KDA
            const kills = playerStats?.kills || 0
            const deaths = playerStats?.deaths || 1 // Avoid division by zero
            const assists = playerStats?.assists || 0
            const kda = ((kills + assists) / deaths).toFixed(2)

            return {
                matchId: node.id,
                date: node.startTimeScheduled,
                tournament: node.tournament?.name || 'Unknown',
                format: node.format?.nameShortened || node.format?.name || 'Bo1',
                opponent: opponentTeam?.baseInfo?.name || 'Unknown',
                opponentLogo: opponentTeam?.baseInfo?.logoUrl || null,
                result: playerTeam?.scoreAdvantage > opponentTeam?.scoreAdvantage ? 'WIN' :
                    playerTeam?.scoreAdvantage < opponentTeam?.scoreAdvantage ? 'LOSS' : 'TBD',
                score: `${playerTeam?.scoreAdvantage || 0} - ${opponentTeam?.scoreAdvantage || 0}`,
                stats: {
                    kills,
                    deaths: playerStats?.deaths || 0,
                    assists,
                    kda: parseFloat(kda),
                    headshots: playerStats?.headshots || 0,
                    damageDealt: playerStats?.damageDealt || 0,
                    damageReceived: playerStats?.damageReceived || 0,
                }
            }
        })

        // Calculate aggregated statistics
        const totalMatches = matchStats.length
        const wins = matchStats.filter((m: any) => m.result === 'WIN').length
        const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0

        const avgKills = totalMatches > 0
            ? (matchStats.reduce((sum: number, m: any) => sum + m.stats.kills, 0) / totalMatches).toFixed(1)
            : 0
        const avgDeaths = totalMatches > 0
            ? (matchStats.reduce((sum: number, m: any) => sum + m.stats.deaths, 0) / totalMatches).toFixed(1)
            : 0
        const avgAssists = totalMatches > 0
            ? (matchStats.reduce((sum: number, m: any) => sum + m.stats.assists, 0) / totalMatches).toFixed(1)
            : 0
        const avgKda = totalMatches > 0
            ? (matchStats.reduce((sum: number, m: any) => sum + m.stats.kda, 0) / totalMatches).toFixed(2)
            : 0
        const avgDamage = totalMatches > 0
            ? Math.round(matchStats.reduce((sum: number, m: any) => sum + m.stats.damageDealt, 0) / totalMatches)
            : 0

        // Build performance trend (last 5 matches)
        const recentMatches = matchStats.slice(0, 5)
        const performanceTrend = recentMatches.map((m: any, index: number) => ({
            matchNumber: index + 1,
            kda: m.stats.kda,
            kills: m.stats.kills,
            result: m.result
        }))

        // Determine form (based on last 3 matches)
        const last3 = matchStats.slice(0, 3)
        const last3Wins = last3.filter((m: any) => m.result === 'WIN').length
        const form = last3Wins >= 2 ? 'HOT' : last3Wins === 1 ? 'STABLE' : 'COLD'

        const response = {
            player: playerInfo ? {
                id: playerInfo.id,
                name: playerInfo.nickname,
                country: playerInfo.country?.name || null,
                countryCode: playerInfo.country?.shortName || null,
                team: playerInfo.teams?.[0]?.name || null
            } : null,
            aggregated: {
                totalMatches,
                wins,
                losses: totalMatches - wins,
                winRate: parseFloat(winRate as string),
                avgKills: parseFloat(avgKills as string),
                avgDeaths: parseFloat(avgDeaths as string),
                avgAssists: parseFloat(avgAssists as string),
                avgKda: parseFloat(avgKda as string),
                avgDamage,
                form
            },
            performanceTrend,
            recentMatches: matchStats.slice(0, 10),
            source: 'grid'
        }

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('[player-stats] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
