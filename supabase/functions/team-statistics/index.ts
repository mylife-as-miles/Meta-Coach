// supabase/functions/team-statistics/index.ts
// Fetch aggregated team performance statistics from GRID Statistics Feed API
// Provides team-level analytics (win rate, kill averages, objective control)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { GRID_URLS, getGridHeaders } from '../_shared/grid-config.ts'

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

        // Get team ID from request
        const url = new URL(req.url)
        let teamId = url.searchParams.get('teamId')
        let matchLimit = parseInt(url.searchParams.get('limit') || '20')

        if (req.method === 'POST') {
            const body = await req.json()
            if (!teamId) teamId = body.teamId
            if (body.limit) matchLimit = body.limit
        }

        // If no teamId provided, get from user's workspace
        let dbTeamName = null;
        if (!teamId || true) { // Always fetch workspace for fallback name
            const authHeader = req.headers.get('Authorization')
            if (authHeader) {
                const supabase = createClient(supabaseUrl, supabaseAnonKey, {
                    global: { headers: { Authorization: authHeader } }
                })
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: workspace } = await supabase
                        .from('workspaces')
                        .select('grid_team_id, team_name, grid_title_id')
                        .eq('user_id', user.id)
                        .single()
                    if (!teamId) teamId = workspace?.grid_team_id
                    dbTeamName = workspace?.team_name
                    var titleId = workspace?.grid_title_id
                }
            }
        }

        if (!teamId) {
            return new Response(
                JSON.stringify({ error: 'teamId is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        console.log(`[team-statistics] Fetching statistics for team: ${teamId}`)

        // Step 1: Get Team Info and Recent Series
        // We fetch the Team object directly to ensure we get the correct name
        const seriesQuery = `
            query GetTeamAndSeries($teamId: ID!, $limit: Int!) {
                team(id: $teamId) {
                    id
                    name
                    acronym
                }
                allSeries(
                    filter: {
                        teamIds: { in: [$teamId] }
                    }
                    first: $limit
                    orderBy: StartTimeScheduled
                    orderDirection: DESC
                ) {
                    edges {
                        node {
                            id
                            startTimeScheduled
                            status
                            format { nameShortened }
                            teams {
                                baseInfo { id name }
                                scoreAdvantage
                            }
                        }
                    }
                }
            }
        `

        const seriesRes = await fetch(GRID_URLS.CENTRAL_DATA, {
            method: 'POST',
            headers: getGridHeaders(gridApiKey, titleId),
            body: JSON.stringify({
                query: seriesQuery,
                variables: { teamId, limit: matchLimit }
            })
        })

        if (!seriesRes.ok) {
            throw new Error(`Central Data API error: ${seriesRes.status}`)
        }

        const seriesData = await seriesRes.json()
        const teamInfo = seriesData.data?.team
        const seriesEdges = seriesData.data?.allSeries?.edges || []
        const seriesIds = seriesEdges.map((e: any) => e.node.id)

        // Calculate win/loss from series data
        let wins = 0, losses = 0, draws = 0
        for (const edge of seriesEdges) {
            const node = edge.node
            // Only count completed games for W/L record
            if (node.status === 'completed' || node.status === 'finished') {
                const myTeam = node.teams?.find((t: any) => t.baseInfo?.id === teamId)
                const oppTeam = node.teams?.find((t: any) => t.baseInfo?.id !== teamId)
                const myScore = myTeam?.scoreAdvantage || 0
                const oppScore = oppTeam?.scoreAdvantage || 0
                if (myScore > oppScore) wins++
                else if (myScore < oppScore) losses++
                else if (myScore > 0 || oppScore > 0) draws++
            }
        }

        // Step 2: Get aggregated statistics from Statistics Feed
        let teamStatsFromFeed: any = null
        if (seriesIds.length > 0) {
            try {
                const statsQuery = `
                    query TeamStatistics($teamId: ID!, $seriesIds: [ID!]!) {
                        teamStatistics(
                            filter: {
                                teamId: { in: [$teamId] }
                                seriesId: { in: $seriesIds }
                            }
                        ) {
                            edges {
                                node {
                                    teamId
                                    seriesId
                                    stats {
                                        kills { total average max }
                                        deaths { total average }
                                        assists { total average }
                                        objectives { total average }
                                        goldEarned { total average }
                                        damageDealt { total average }
                                    }
                                }
                            }
                        }
                    }
                `

                const statsRes = await fetch(GRID_URLS.STATISTICS_FEED, {
                    method: 'POST',
                    headers: getGridHeaders(gridApiKey, titleId),
                    body: JSON.stringify({
                        query: statsQuery,
                        variables: { teamId, seriesIds }
                    })
                })

                if (statsRes.ok) {
                    const statsData = await statsRes.json()
                    if (!statsData.errors && statsData.data?.teamStatistics?.edges?.length > 0) {
                        const edges = statsData.data.teamStatistics.edges
                        const count = edges.length

                        // Aggregate all series stats
                        const totals = edges.reduce((acc: any, e: any) => {
                            const s = e.node.stats || {}
                            return {
                                kills: acc.kills + (s.kills?.total || 0),
                                deaths: acc.deaths + (s.deaths?.total || 0),
                                assists: acc.assists + (s.assists?.total || 0),
                                objectives: acc.objectives + (s.objectives?.total || 0),
                                gold: acc.gold + (s.goldEarned?.total || 0),
                                damage: acc.damage + (s.damageDealt?.total || 0),
                            }
                        }, { kills: 0, deaths: 0, assists: 0, objectives: 0, gold: 0, damage: 0 })

                        teamStatsFromFeed = {
                            kills: { total: totals.kills, average: totals.kills / count },
                            deaths: { total: totals.deaths, average: totals.deaths / count },
                            assists: { total: totals.assists, average: totals.assists / count },
                            objectives: { total: totals.objectives, average: totals.objectives / count },
                            goldEarned: { total: totals.gold, average: totals.gold / count },
                            damageDealt: { total: totals.damage, average: totals.damage / count },
                            seriesAnalyzed: count
                        }
                        console.log(`[team-statistics] Got aggregated stats from ${count} series`)
                    }
                }
            } catch (statsError) {
                console.warn('[team-statistics] Statistics Feed query failed:', statsError)
            }
        }

        // Build response
        const totalMatches = wins + losses + draws
        const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0

        // Determine form from recent 5 matches
        const recent5 = seriesEdges.slice(0, 5)
        let recentWins = 0
        for (const edge of recent5) {
            const node = edge.node
            const myTeam = node.teams?.find((t: any) => t.baseInfo?.id === teamId)
            const oppTeam = node.teams?.find((t: any) => t.baseInfo?.id !== teamId)
            if ((myTeam?.scoreAdvantage || 0) > (oppTeam?.scoreAdvantage || 0)) recentWins++
        }
        const form = recentWins >= 4 ? 'DOMINANT' : recentWins >= 3 ? 'HOT' : recentWins >= 2 ? 'STABLE' : 'COLD'

        const response = {
            teamId,
            teamName: teamInfo?.name || dbTeamName || 'Team',
            record: {
                wins,
                losses,
                draws,
                totalMatches,
                winRate: parseFloat(winRate as string)
            },
            form,
            stats: teamStatsFromFeed ? {
                avgKills: teamStatsFromFeed.kills.average.toFixed(1),
                avgDeaths: teamStatsFromFeed.deaths.average.toFixed(1),
                avgAssists: teamStatsFromFeed.assists.average.toFixed(1),
                avgObjectives: teamStatsFromFeed.objectives.average.toFixed(1),
                avgGold: Math.round(teamStatsFromFeed.goldEarned.average),
                avgDamage: Math.round(teamStatsFromFeed.damageDealt.average),
                seriesAnalyzed: teamStatsFromFeed.seriesAnalyzed
            } : null,
            recentMatches: seriesEdges.slice(0, 5).map((e: any) => {
                const node = e.node
                const oppTeam = node.teams?.find((t: any) => t.baseInfo?.id !== teamId)
                const myTeam = node.teams?.find((t: any) => t.baseInfo?.id === teamId)
                const myScore = myTeam?.scoreAdvantage || 0
                const oppScore = oppTeam?.scoreAdvantage || 0
                return {
                    id: node.id,
                    date: node.startTimeScheduled,
                    format: node.format?.nameShortened || 'Bo1',
                    opponent: oppTeam?.baseInfo?.name || 'Unknown',
                    score: `${myScore} - ${oppScore}`,
                    result: (node.status === 'scheduled' || node.status === 'upcoming') ? 'UPCOMING' :
                        (myScore > oppScore ? 'WIN' : myScore < oppScore ? 'LOSS' : 'DRAW')
                }
            }),
            source: teamStatsFromFeed ? 'grid-statistics-feed' : 'grid-central-data'
        }

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('[team-statistics] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
