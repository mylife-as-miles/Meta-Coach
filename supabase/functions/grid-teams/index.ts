// supabase/functions/grid-teams/index.ts
// Fetch teams by title from GRID

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql'

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const gridApiKey = Deno.env.get('GRID_API_KEY')
        if (!gridApiKey) {
            throw new Error('GRID_API_KEY not configured')
        }

        // Get titleId from query params or body
        const url = new URL(req.url)
        let titleId = url.searchParams.get('titleId')

        if (!titleId && req.method === 'POST') {
            const body = await req.json()
            titleId = body.titleId
        }

        if (!titleId) {
            return new Response(
                JSON.stringify({ error: 'titleId is required' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            )
        }

        const query = `
      query Teams($titleId: ID!) {
        teams(filter: { title: { id: { equals: $titleId } } }, first: 100) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `

        const response = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': gridApiKey,
            },
            body: JSON.stringify({
                query,
                variables: { titleId }
            }),
        })

        if (!response.ok) {
            throw new Error(`GRID API error: ${response.status}`)
        }

        const data = await response.json()

        // Sanitize and shape the response
        const teams = data.data?.teams?.edges?.map((e: any) => ({
            id: e.node.id,
            name: e.node.name,
        })) || []

        return new Response(
            JSON.stringify({ teams }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error fetching teams:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
