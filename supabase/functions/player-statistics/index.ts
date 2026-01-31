// supabase/functions/player-statistics/index.ts
// Dedicated endpoint for fetching aggregated player statistics from Statistics Feed
// Provides granular player analytics with configurable filters

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

        // Parse request parameters
        const url = new URL(req.url)
        let playerId = url.searchParams.get('playerId')
        let seriesIds: string[] = []
        let matchLimit = parseInt(url.searchParams.get('limit') || '20')

        if (req.method === 'POST') {
            const body = await req.json()
            if (!playerId) playerId = body.playerId
            if (body.seriesIds) seriesIds = body.seriesIds
            if (body.limit) matchLimit = body.limit
        }

        if (!playerId) {
            return new Response(
                JSON.stringify({ error: 'playerId is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        console.log(`[player-statistics] Fetching statistics for player: ${playerId}`)

        // Step 1: Get player info and recent series from Central Data
        const playerQuery = `
            query GetPlayerInfo($playerId: ID!, $limit: Int!) {
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
                        acronym
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
                            teams {
                                baseInfo { id }
                                scoreAdvantage
                                players {
                                    player { id }
                                }
                            }
                        }
                    }
                }
            }
        `

        const centralRes = await fetch(GRID_URLS.CENTRAL_DATA, {
            method: 'POST',
            headers: getGridHeaders(gridApiKey),
            body: JSON.stringify({
                query: playerQuery,
                variables: { playerId, limit: matchLimit }
            })
        })

        if (!centralRes.ok) {
            throw new Error(`Central Data API error: ${centralRes.status}`)
        }

        const centralData = await centralRes.json()
        const playerInfo = centralData.data?.player
        const seriesEdges = centralData.data?.allSeries?.edges || []

        // Use provided seriesIds or extract from recent matches
        if (seriesIds.length === 0) {
            seriesIds = seriesEdges.map((e: any) => e.node.id)
        }

        // Calculate win/loss from series data
        let wins = 0, losses = 0
        for (const edge of seriesEdges) {
            const node = edge.node
            // Find which team the player is on
            const playerTeam = node.teams?.find((t: any) =>
                t.players?.some((p: any) => p.player?.id === playerId)
            )
            const oppTeam = node.teams?.find((t: any) =>
                !t.players?.some((p: any) => p.player?.id === playerId)
            )
            const myScore = playerTeam?.scoreAdvantage || 0
            const oppScore = oppTeam?.scoreAdvantage || 0
            if (myScore > oppScore) wins++
            else if (myScore < oppScore) losses++
        }

        // Step 2: Get aggregated statistics from Statistics Feed
        let aggregatedStats: any = null
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
                                        kills { total average max min }
                                        deaths { total average max min }
                                        assists { total average max min }
                                        kda { value }
                                        damage { total average max }
                                        goldEarned { total average }
                                        creepScore { total average }
                                        visionScore { total average }
                                        firstBloodKills { total }
                                        firstBloodDeaths { total }
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
                        const edges = statsData.data.playerStatistics.edges
                        const count = edges.length

                        // Find max values
                        let maxKills = 0, maxDeaths = 0, maxAssists = 0, maxDamage = 0

                        // Sum all stats
                        const totals = edges.reduce((acc: any, e: any) => {
                            const s = e.node.stats || {}
                            maxKills = Math.max(maxKills, s.kills?.max || 0)
                            maxDeaths = Math.max(maxDeaths, s.deaths?.max || 0)
                            maxAssists = Math.max(maxAssists, s.assists?.max || 0)
                            maxDamage = Math.max(maxDamage, s.damage?.max || 0)

                            return {
                                kills: acc.kills + (s.kills?.total || 0),
                                deaths: acc.deaths + (s.deaths?.total || 0),
                                assists: acc.assists + (s.assists?.total || 0),
                                damage: acc.damage + (s.damage?.total || 0),
                                gold: acc.gold + (s.goldEarned?.total || 0),
                                cs: acc.cs + (s.creepScore?.total || 0),
                                vision: acc.vision + (s.visionScore?.total || 0),
                                firstBloods: acc.firstBloods + (s.firstBloodKills?.total || 0),
                                firstDeaths: acc.firstDeaths + (s.firstBloodDeaths?.total || 0),
                                kdaSum: acc.kdaSum + (s.kda?.value || 0),
                            }
                        }, {
                            kills: 0, deaths: 0, assists: 0, damage: 0,
                            gold: 0, cs: 0, vision: 0, firstBloods: 0,
                            firstDeaths: 0, kdaSum: 0
                        })

                        aggregatedStats = {
                            kills: {
                                total: totals.kills,
                                average: (totals.kills / count).toFixed(1),
                                max: maxKills
                            },
                            deaths: {
                                total: totals.deaths,
                                average: (totals.deaths / count).toFixed(1),
                                max: maxDeaths
                            },
                            assists: {
                                total: totals.assists,
                                average: (totals.assists / count).toFixed(1),
                                max: maxAssists
                            },
                            kda: (totals.kdaSum / count).toFixed(2),
                            damage: {
                                total: totals.damage,
                                average: Math.round(totals.damage / count),
                                max: maxDamage
                            },
                            goldEarned: {
                                total: totals.gold,
                                average: Math.round(totals.gold / count)
                            },
                            creepScore: {
                                total: totals.cs,
                                average: (totals.cs / count).toFixed(1)
                            },
                            visionScore: {
                                total: totals.vision,
                                average: (totals.vision / count).toFixed(1)
                            },
                            firstBloods: {
                                kills: totals.firstBloods,
                                deaths: totals.firstDeaths
                            },
                            seriesAnalyzed: count
                        }
                        console.log(`[player-statistics] Aggregated stats from ${count} series`)
                    }
                } else {
                    console.warn('[player-statistics] Statistics Feed returned:', statsRes.status)
                }
            } catch (statsError) {
                console.warn('[player-statistics] Statistics Feed query failed:', statsError)
            }
        }

        // Determine form from recent 3 matches
        const recent3 = seriesEdges.slice(0, 3)
        let recentWins = 0
        for (const edge of recent3) {
            const node = edge.node
            const playerTeam = node.teams?.find((t: any) =>
                t.players?.some((p: any) => p.player?.id === playerId)
            )
            const oppTeam = node.teams?.find((t: any) =>
                !t.players?.some((p: any) => p.player?.id === playerId)
            )
            if ((playerTeam?.scoreAdvantage || 0) > (oppTeam?.scoreAdvantage || 0)) recentWins++
        }
        const form = recentWins >= 2 ? 'HOT' : recentWins === 1 ? 'STABLE' : 'COLD'

        // Build response
        const totalMatches = wins + losses
        const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0

        const response = {
            player: playerInfo ? {
                id: playerInfo.id,
                nickname: playerInfo.nickname,
                firstName: playerInfo.firstName || null,
                lastName: playerInfo.lastName || null,
                country: playerInfo.country?.name || null,
                countryCode: playerInfo.country?.shortName || null,
                team: playerInfo.teams?.[0] ? {
                    id: playerInfo.teams[0].id,
                    name: playerInfo.teams[0].name,
                    acronym: playerInfo.teams[0].acronym,
                    logoUrl: playerInfo.teams[0].logoUrl
                } : null
            } : null,
            record: {
                wins,
                losses,
                totalMatches,
                winRate: parseFloat(winRate as string)
            },
            recentForm: form,
            aggregatedStats,
            seriesAnalyzed: seriesIds.length,
            source: aggregatedStats ? 'grid-statistics-feed' : 'grid-central-data'
        }

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('[player-statistics] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
