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
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!gridApiKey || !supabaseUrl || !supabaseKey) {
            throw new Error('Environment configuration missing')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const { titleId, from, to } = await req.json()

        if (!titleId || !from || !to) {
            throw new Error('Missing require params: titleId, from, to')
        }

        console.log(`[sync-history] Syncing series for Title ${titleId} from ${from} to ${to}`)

        // Step 1: Query AllSeries (The Spine + Teams)
        // Optimized to fetch teams in a single request to avoid N+1 Rate Limits
        const spineQuery = `
            query HistoricalSeries($titleId: ID!, $from: String!, $to: String!) {
              allSeries(
                filter: {
                  titleId: $titleId
                  startTimeScheduled: { gte: $from, lte: $to }
                }
                first: 50
              ) {
                edges {
                  node {
                    id
                    startTimeScheduled
                    tournament { id name }
                    teams {
                      baseInfo { id name }
                    }
                  }
                }
              }
            }
        `

        const requestBody = JSON.stringify({ query: spineQuery, variables: { titleId: String(titleId), from, to } });
        console.log(`[sync-history] Sending Request to ${GRID_URLS.CENTRAL_DATA}`, {
            keyPrefix: gridApiKey.substring(0, 5) + '...',
            body: requestBody
        });

        const spineRes = await fetch(GRID_URLS.CENTRAL_DATA, {
            method: 'POST',
            headers: getGridHeaders(gridApiKey),
            body: requestBody
        })

        const spineData = await spineRes.json()

        if (spineData.errors) {
            console.error('[sync-history] GRID GraphQL Errors:', spineData.errors)
        }

        const edges = spineData.data?.allSeries?.edges || []

        if (edges.length === 0) {
            console.warn('[sync-history] No series found via GRID.', {
                payload: { titleId, from, to },
                response: JSON.stringify(spineData).substring(0, 500)
            })
        } else {
            console.log(`[sync-history] Found ${edges.length} series in range`)
        }

        let syncedCount = 0

        // Step 2: Iterate and Upsert (Local Processing Only)
        for (const edge of edges) {
            const node = edge.node
            const seriesId = node.id

            // Prepare Data for Upsert
            // 1. Series
            const seriesPayload = {
                id: seriesId,
                title_id: titleId,
                start_time: node.startTimeScheduled,
                end_time: null,
                status: null,
                tournament_id: node.tournament?.id,
                tournament_name: node.tournament?.name,
                updated_at: new Date().toISOString()
            }

            // 2. Participants (Mapped from teams in main query)
            const participantsPayload = node.teams?.map((t: any) => ({
                series_id: seriesId,
                team_id: t.baseInfo?.id,
                team_name: t.baseInfo?.name
            })) || []

            // 3. Matches & Games (Currently unavailable in api-op schema)
            const matchesPayload: any[] = []
            const gamesPayload: any[] = []

            // Execute DB Upserts
            const { error: sErr } = await supabase.from('series').upsert(seriesPayload)
            if (sErr) console.error('Series upsert failed:', sErr)

            if (participantsPayload.length > 0) {
                const { error: pErr } = await supabase.from('series_participants').upsert(participantsPayload, { onConflict: 'series_id, team_id' })
                if (pErr) console.error('Participants upsert failed:', pErr)
            }

            if (matchesPayload.length > 0) {
                const { error: mErr } = await supabase.from('matches').upsert(matchesPayload)
                if (mErr) console.error('Matches upsert failed:', mErr)
            }

            if (gamesPayload.length > 0) {
                const { error: gErr } = await supabase.from('games').upsert(gamesPayload)
                if (gErr) console.error('Games upsert failed:', gErr)
            }

            syncedCount++
        }

        return new Response(
            JSON.stringify({
                status: 'success',
                synced: syncedCount,
                totalFound: edges.length,
                gridErrors: spineData.errors, // Main query errors
                detailErrors: detailErrors.length > 0 ? detailErrors : undefined, // Detail query errors
                debug: { titleId, from, to }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Sync failed:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
