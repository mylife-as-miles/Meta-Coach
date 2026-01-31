// supabase/functions/player-stats/index.ts
// Fetch player micro-level performance analytics from GRID API
// Uses Central Data Feed for match history + Statistics Feed for aggregated stats

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { GRID_URLS, getGridHeaders } from '../_shared/grid-config.ts'

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

        // Query 1: Player info and recent match history from Central Data Feed
        const playerSeriesQuery = `
            query GetPlayerStats($playerId: ID!, $limit: Int!) {
                player(id: $playerId) {
                    id
                    nickname
                    firstName
                    lastName
                    country {
                        name
                        shortName
                    }
                    teams {
                        id
                        name
                        logoUrl
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

        // Execute Central Data query
        const centralRes = await fetch(GRID_URLS.CENTRAL_DATA, {
            method: 'POST',
            headers: getGridHeaders(gridApiKey),
            body: JSON.stringify({
                query: playerSeriesQuery,
                variables: { playerId, limit: matchLimit }
            })
        })

        console.log(`[player-stats] Central Data Response: ${centralRes.status}`)

        if (!centralRes.ok) {
            const errorText = await centralRes.text()
            console.error(`[player-stats] Central Data API Error: ${errorText}`)
            return new Response(
                JSON.stringify({ error: 'Failed to fetch player data', details: errorText }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
            )
        }

        const centralData = await centralRes.json()

        if (centralData.errors) {
            console.warn('[player-stats] GraphQL Errors:', JSON.stringify(centralData.errors, null, 2))
        }

        const playerInfo = centralData.data?.player || null
        const matchEdges = centralData.data?.allSeries?.edges || []

        // Get series IDs for Statistics Feed query
        const seriesIds = matchEdges.map((edge: any) => edge.node.id)

        // Query 2: Aggregated statistics from Statistics Feed (if we have series)
        let aggregatedFromStats: any = null
        if (seriesIds.length > 0) {
            try {
                const statsQuery = `
                    query PlayerStatistics($playerId: ID!, $seriesIds: [ID!]!) {
                        playerStatistics(
                            filter: {
                                playerId: { in: [$playerId] }
                                seriesId: { in: $seriesIds }
                            }
                        ) {
                            edges {
                                node {
                                    playerId
                                    seriesId
                                    stats {
                                        kills { total average max }
                                        deaths { total average }
                                        assists { total average }
                                        kda { value }
                                        damage { total average }
                                    }
                                }
                            }
                        }
                    }
                `

                const statsRes = await fetch(GRID_URLS.STATISTICS_FEED, {
                    method: 'POST',
                    headers: getGridHeaders(gridApiKey),
                    body: JSON.stringify({
                        query: statsQuery,
                        variables: { playerId, seriesIds }
                    })
                })

                if (statsRes.ok) {
                    const statsData = await statsRes.json()
                    if (!statsData.errors && statsData.data?.playerStatistics?.edges?.length > 0) {
                        // Aggregate statistics from all series
                        const statEdges = statsData.data.playerStatistics.edges
                        const totalKills = statEdges.reduce((sum: number, e: any) => sum + (e.node.stats?.kills?.total || 0), 0)
                        const totalDeaths = statEdges.reduce((sum: number, e: any) => sum + (e.node.stats?.deaths?.total || 0), 0)
                        const totalAssists = statEdges.reduce((sum: number, e: any) => sum + (e.node.stats?.assists?.total || 0), 0)
                        const totalDamage = statEdges.reduce((sum: number, e: any) => sum + (e.node.stats?.damage?.total || 0), 0)
                        const avgKda = statEdges.reduce((sum: number, e: any) => sum + (e.node.stats?.kda?.value || 0), 0) / statEdges.length

                        aggregatedFromStats = {
                            kills: { total: totalKills, average: totalKills / statEdges.length },
                            deaths: { total: totalDeaths, average: totalDeaths / statEdges.length },
                            assists: { total: totalAssists, average: totalAssists / statEdges.length },
                            damage: { total: totalDamage, average: totalDamage / statEdges.length },
                            kda: avgKda,
                            seriesCount: statEdges.length
                        }
                        console.log(`[player-stats] Got aggregated stats from Statistics Feed for ${statEdges.length} series`)
                    }
                }
            } catch (statsError) {
                console.warn('[player-stats] Statistics Feed query failed, using calculated stats:', statsError)
            }
        }

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

        // Calculate aggregated statistics (use Stats Feed data if available, else calculate)
        const totalMatches = matchStats.length
        const wins = matchStats.filter((m: any) => m.result === 'WIN').length
        const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0

        // Use aggregated stats from Statistics Feed if available
        const avgKills = aggregatedFromStats?.kills?.average?.toFixed(1) ??
            (totalMatches > 0 ? (matchStats.reduce((sum: number, m: any) => sum + m.stats.kills, 0) / totalMatches).toFixed(1) : 0)
        const avgDeaths = aggregatedFromStats?.deaths?.average?.toFixed(1) ??
            (totalMatches > 0 ? (matchStats.reduce((sum: number, m: any) => sum + m.stats.deaths, 0) / totalMatches).toFixed(1) : 0)
        const avgAssists = aggregatedFromStats?.assists?.average?.toFixed(1) ??
            (totalMatches > 0 ? (matchStats.reduce((sum: number, m: any) => sum + m.stats.assists, 0) / totalMatches).toFixed(1) : 0)
        const avgKda = aggregatedFromStats?.kda?.toFixed(2) ??
            (totalMatches > 0 ? (matchStats.reduce((sum: number, m: any) => sum + m.stats.kda, 0) / totalMatches).toFixed(2) : 0)
        const avgDamage = aggregatedFromStats?.damage?.average ??
            (totalMatches > 0 ? Math.round(matchStats.reduce((sum: number, m: any) => sum + m.stats.damageDealt, 0) / totalMatches) : 0)

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
                firstName: playerInfo.firstName || null,
                lastName: playerInfo.lastName || null,
                country: playerInfo.country?.name || null,
                countryCode: playerInfo.country?.shortName || null,
                team: playerInfo.teams?.[0]?.name || null,
                teamLogo: playerInfo.teams?.[0]?.logoUrl || null
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
            source: aggregatedFromStats ? 'grid-statistics-feed' : 'grid-central-data'
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
