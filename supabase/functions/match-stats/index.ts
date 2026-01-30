// supabase/functions/match-stats/index.ts
// Fetch detailed in-game statistics for a specific match/series (Stage 2)
// Uses GRID Stats Feed API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// GRID Stats Feed endpoint (may differ from Central Data Feed)
const GRID_STATS_API_URL = 'https://api-op.grid.gg/stats/graphql'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const gridApiKey = Deno.env.get('GRID_API_KEY')

        if (!gridApiKey) {
            throw new Error('GRID_API_KEY is not configured')
        }

        let seriesId: string | null = null;

        const url = new URL(req.url)
        seriesId = url.searchParams.get('seriesId')

        if (req.method === 'POST') {
            const body = await req.json()
            if (!seriesId) seriesId = body.seriesId
        }

        if (!seriesId) {
            return new Response(
                JSON.stringify({ error: 'seriesId is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        console.log(`[match-stats] Fetching stats for series: ${seriesId}`)

        // Query detailed series state from Stats Feed
        const statsQuery = `
      query GetSeriesStats($seriesId: ID!) {
        seriesState(id: $seriesId) {
          id
          startedAt
          finishedAt
          teams {
            id
            name
            score
            players {
              id
              name
              character {
                id
                name
              }
              statTotals {
                kills
                deaths
                assists
                damageDealt
                goldEarned
              }
            }
          }
          games {
            id
            sequenceNumber
            map {
              id
              name
            }
            started
            finished
            clock {
              currentSeconds
            }
            teams {
              id
              name
              score
              side
            }
            winner {
              id
              name
            }
          }
        }
      }
    `

        const statsRes = await fetch(GRID_STATS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': gridApiKey
            },
            body: JSON.stringify({
                query: statsQuery,
                variables: { seriesId }
            })
        })

        console.log(`[match-stats] Stats API Response: ${statsRes.status}`)

        if (!statsRes.ok) {
            const errorText = await statsRes.text()
            console.error(`[match-stats] Stats API Error: ${errorText}`)
            return new Response(
                JSON.stringify({ error: 'Failed to fetch match stats', details: errorText }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
            )
        }

        const statsData = await statsRes.json()

        if (statsData.errors) {
            console.error('[match-stats] GraphQL Errors:', JSON.stringify(statsData.errors, null, 2))
            return new Response(
                JSON.stringify({ error: 'GraphQL query failed', graphqlErrors: statsData.errors }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
            )
        }

        const seriesState = statsData.data?.seriesState

        if (!seriesState) {
            return new Response(
                JSON.stringify({ error: 'Series not found', seriesId }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        // Process and normalize the response
        const processedStats = {
            id: seriesState.id,
            startedAt: seriesState.startedAt,
            finishedAt: seriesState.finishedAt,
            teams: seriesState.teams?.map((team: any) => ({
                id: team.id,
                name: team.name,
                score: team.score,
                players: team.players?.map((player: any) => ({
                    id: player.id,
                    name: player.name,
                    character: player.character?.name || null,
                    stats: {
                        kills: player.statTotals?.kills || 0,
                        deaths: player.statTotals?.deaths || 0,
                        assists: player.statTotals?.assists || 0,
                        damage: player.statTotals?.damageDealt || 0,
                        gold: player.statTotals?.goldEarned || 0,
                    }
                })) || []
            })) || [],
            games: seriesState.games?.map((game: any) => ({
                id: game.id,
                gameNumber: game.sequenceNumber,
                map: game.map?.name || 'Unknown',
                duration: game.clock?.currentSeconds
                    ? `${Math.floor(game.clock.currentSeconds / 60)}:${String(game.clock.currentSeconds % 60).padStart(2, '0')}`
                    : null,
                winner: game.winner?.name || null,
                teams: game.teams?.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    score: t.score,
                    side: t.side
                })) || []
            })) || []
        }

        return new Response(
            JSON.stringify({ stats: processedStats, source: 'grid-stats' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('[match-stats] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
