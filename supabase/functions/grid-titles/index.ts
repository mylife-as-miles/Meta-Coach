// supabase/functions/grid-titles/index.ts
// Fetch supported esports titles from GRID

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

        const query = `
      query Titles {
        titles {
          id
          name
        }
      }
    `

        const response = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': gridApiKey,
            },
            body: JSON.stringify({ query }),
        })

        if (!response.ok) {
            throw new Error(`GRID API error: ${response.status}`)
        }

        const data = await response.json()

        // Sanitize and shape the response
        const titles = data.data?.titles?.map((t: any) => ({
            id: t.id,
            name: t.name,
        })) || []

        return new Response(
            JSON.stringify({ titles }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error fetching titles:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
