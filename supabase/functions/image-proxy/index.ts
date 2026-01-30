import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const targetUrl = url.searchParams.get('url')

        if (!targetUrl) {
            return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Security: Only allow specific domains
        const allowedDomains = ['owcdn.net', 'liquipedia.net', 'fandom.com']
        const targetDomain = new URL(targetUrl).hostname
        if (!allowedDomains.some(d => targetDomain.endsWith(d))) {
            return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log(`Proxying image: ${targetUrl}`)

        // Fetch with specific headers to bypass protection
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.vlr.gg/', // Spoof VLR referrer
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
        })

        if (!response.ok) {
            console.error(`Upstream error: ${response.status} ${response.statusText}`)
            return new Response(JSON.stringify({ error: 'Failed to fetch image' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Stream the response back
        // We recreate the response to strip upstream headers that might cause issues (like CORS from upstream)
        // and apply our own CORS
        const blob = await response.blob()

        return new Response(blob, {
            headers: {
                ...corsHeaders,
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            },
        })

    } catch (error) {
        console.error('Proxy error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
