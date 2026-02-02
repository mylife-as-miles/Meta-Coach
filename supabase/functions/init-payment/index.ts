
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.14.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            console.error("STRIPE_SECRET_KEY is missing");
            return new Response(JSON.stringify({ error: "Server Configuration Error: STRIPE_SECRET_KEY not set" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const { priceId, returnUrl } = await req.json();

        // Default Price ID if none provided (e.g. for testing)
        // In production, this should come from the client or DB
        const effectivePriceId = priceId || 'price_1P...';

        console.log("Creating checkout session for:", effectivePriceId);

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: effectivePriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${returnUrl || req.headers.get('origin')}/dashboard?payment=success`,
            cancel_url: `${returnUrl || req.headers.get('origin')}/dashboard?payment=cancelled`,
        })

        return new Response(
            JSON.stringify({ url: session.url, sessionId: session.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        console.error("Payment Init Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400, }
        )
    }
})
