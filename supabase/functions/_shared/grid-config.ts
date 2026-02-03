// supabase/functions/_shared/grid-config.ts
// GRID API configuration and URLs

/**
 * GRID API Endpoints
 * 
 * Central Data API - Titles, Teams, Series IDs
 * Series State API - Post-match results & stats
 * File Download API - Full event history for deep analysis
 */

export const GRID_URLS = {
    // Titles, Teams, Players, Tournaments, Series IDs
    // Titles, Teams, Players, Tournaments, Series IDs
    CENTRAL_DATA: 'https://api.grid.gg/central-data/graphql',

    // Post-match results, player stats, team outcomes
    SERIES_STATE: 'https://api-op.grid.gg/live-data-feed/series-state/graphql',

    // Aggregated player/team statistics
    STATISTICS_FEED: 'https://api-op.grid.gg/statistics-feed/graphql',

    // Full event history, timeline, pattern mining
    FILE_DOWNLOAD: 'https://api.grid.gg',
} as const;

/**
 * Get GRID API headers
 */
export function getGridHeaders(apiKey: string = '', titleId?: string | number) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
    };

    if (titleId) {
        headers['x-title-id'] = String(titleId);
    }

    return headers;
}
/**
 * API usage guide:
 * 
 * Central Data → Series IDs
 *      ↓
 * Series State → Match summary stats
 *      ↓
 * File Download → Deep patterns
 *      ↓
 * Gemini 2.5 Pro → AI reasoning
 */
