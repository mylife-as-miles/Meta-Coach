import { supabase } from './supabase';

const PROJECT_URL = "https://mhvdcrxoulyrwvrcjdyy.supabase.co"; // Fallback if env/config missing

export function getProxiedImageUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined;

    // Only proxy vulnerable domains
    if (url.includes('owcdn.net')) {
        return `${PROJECT_URL}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
    }

    return url;
}
