// Type definitions for dashboard data (shared with API responses)

export interface Player {
    id: string;
    name: string;
    role: 'TOP' | 'JG' | 'MID' | 'ADC' | 'SUP';
    overall: number;
    stats: {
        mechanics: number;
        objectives: number;
        macro: number;
        vision: number;
        teamwork: number;
        mental: number;
    };
    synergy: number;
    readiness?: number;
    isActive?: boolean;
    avatar?: string;
    gridId?: string; // GRID API player ID for stats lookup
}

export interface Match {
    id: string;
    date: string;
    startTime?: string; // ISO string for calculations
    duration: string;
    result: 'WIN' | 'LOSS' | 'UPCOMING' | 'TBD';
    score: string;
    format: 'Bo1' | 'Bo3' | 'Bo5';
    type: 'Ranked' | 'Scrim';
    opponent: {
        id?: string;
        name: string;
        abbreviation: string;
        color: string;
        logoUrl?: string;
    };
    tournament?: {
        name: string;
    };
    performance: {
        macroControl: number;
        microErrorRate: 'LOW' | 'MED' | 'HIGH';
    };
    source?: 'grid' | 'gemini';
}

export interface Champion {
    id: string;
    name: string;
    role: 'TOP' | 'JG' | 'MID' | 'ADC' | 'SUP';
    icon: string;
}

// Empty arrays - no mock data, real data comes from Supabase/GRID API
export const players: Player[] = [];
export const matches: Match[] = [
    {
        id: 'mock-match-1',
        date: 'Oct 24',
        startTime: new Date().toISOString(),
        duration: '34:20',
        result: 'WIN',
        score: '18 - 6',
        format: 'Bo1',
        type: 'Ranked',
        opponent: {
            id: 'opp-1',
            name: 'Cloud9',
            abbreviation: 'C9',
            color: 'blue',
            logoUrl: 'https://am-a.akamaihd.net/image?resize=60:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2Fcloud9-logo-2023.png'
        },
        tournament: { name: 'World Championship' },
        performance: { macroControl: 75, microErrorRate: 'LOW' },
        source: 'grid'
    }
];

// Champion data for Strategy Lab (static game data, not mock user data)
// This would ideally come from Riot Data Dragon or similar game asset API
export const champions: Champion[] = [
    { id: 'azir', name: 'Azir', role: 'MID', icon: '🏛️' },
    { id: 'orianna', name: 'Orianna', role: 'MID', icon: '⚙️' },
    { id: 'syndra', name: 'Syndra', role: 'MID', icon: '🔮' },
    { id: 'ahri', name: 'Ahri', role: 'MID', icon: '🦊' },
    { id: 'leblanc', name: 'LeBlanc', role: 'MID', icon: '🎭' },
    { id: 'viktor', name: 'Viktor', role: 'MID', icon: '⚡' },
    { id: 'aatrox', name: 'Aatrox', role: 'TOP', icon: '⚔️' },
    { id: 'ksante', name: "K'Sante", role: 'TOP', icon: '🛡️' },
    { id: 'gnar', name: 'Gnar', role: 'TOP', icon: '🦎' },
    { id: 'sejuani', name: 'Sejuani', role: 'JG', icon: '🐗' },
    { id: 'leesin', name: 'Lee Sin', role: 'JG', icon: '👊' },
    { id: 'viego', name: 'Viego', role: 'JG', icon: '👑' },
    { id: 'jinx', name: 'Jinx', role: 'ADC', icon: '💣' },
    { id: 'kaisa', name: "Kai'Sa", role: 'ADC', icon: '💜' },
    { id: 'thresh', name: 'Thresh', role: 'SUP', icon: '⛓️' },
    { id: 'nautilus', name: 'Nautilus', role: 'SUP', icon: '⚓' }
];

// Strategy Brief interface (for StrategyBriefModal)
export interface StrategyBriefData {
    opponent: string;
    matchTime: string;
    format: string;
    region: string;
    keyPlayers: { name: string; role: string; threat: string; note: string }[];
    objectives: string[];
    banSuggestions: string[];
    winConditions: string[];
}

// Empty strategy brief data - would be fetched from AI analysis
export const strategyBriefData: StrategyBriefData | null = null;
