// Mock data for dashboard functionality

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
    avatar?: string;
}

export interface Match {
    id: string;
    date: string;
    duration: string;
    result: 'WIN' | 'LOSS';
    score: string;
    format: 'Bo1' | 'Bo3' | 'Bo5';
    type: 'Ranked' | 'Scrim';
    opponent: {
        name: string;
        abbreviation: string;
        color: string;
    };
    performance: {
        macroControl: number;
        microErrorRate: 'LOW' | 'MED' | 'HIGH';
    };
}

export interface Champion {
    id: string;
    name: string;
    role: 'TOP' | 'JG' | 'MID' | 'ADC' | 'SUP';
    icon: string;
}

export const players: Player[] = [
    {
        id: 'thanatos',
        name: 'Thanatos',
        role: 'TOP',
        overall: 90,
        stats: { mechanics: 88, objectives: 85, macro: 92, vision: 86, teamwork: 89, mental: 88 },
        synergy: 92,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkT4Ks269eAsRO6dfV89vALxgdxfAIVhrSHYZ7tNq8vISykltHagGhfqxQ3jGWrJToNIJpP4nM3PSdgPu8l9HYdhYrWOGXeDoZE0G4AtmJSbDrpnVK9otXSAjl7dyD5dHsK0gI8YorFUR23B9c1S7IZ6YJUPedlRZgYDwSEGbgE1Qn_v8raz85BTG63ZekqtcevpkMwY7youcMNc-tgeCvFlI4XIRqdEm7dh6c-V5ydmisJWLB9DIAPUQA7zzudRIGVrMsPgx45nY'
    },
    {
        id: 'blaber',
        name: 'Blaber',
        role: 'JG',
        overall: 96,
        stats: { mechanics: 98, objectives: 94, macro: 89, vision: 91, teamwork: 92, mental: 85 },
        synergy: 88,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlIJwvp8CJbnm_G_ebQy1u5tPqtfiI65vbfXCcoI7mW_DPo3DfI28f9VxDLLJVC-EhH78h7c9-SH__pTSDAIQzMaqrLQKQt6RbmUbCEYlA6Hau1KtjKoBfjqG75OkcbamnBjK4H7P7UOZk7-7kKTKiwRh-gVGy-LG5yzpD7SuqKfU6pqlW7S2V3XCc_-hYQNRBhMV0eAvia9CV4onl0orcsGsRsmvLZmyC8WQ0Li3t5_tyqHZUL6zcknCXfdd_WtvXdZULlmJ2oqI'
    },
    {
        id: 'jojopyun',
        name: 'Jojopyun',
        role: 'MID',
        overall: 92,
        stats: { mechanics: 94, objectives: 88, macro: 91, vision: 89, teamwork: 93, mental: 90 },
        synergy: 99,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgmk_3Dd5LZ7x8Y6QRyVcvfIY2o6i6ZEow7ULJQ7mDBP9ltpfN96fTLkIsaRT5-MpowpIF-OK3wILuhV1LMKNyFwYaELdGjXM27XdtdTTQ53UZfPgdMZ253PEYcr2KocmNhX69xqIBVXrvyGfbX_f4B0RgX6TfhpLyEyzdI0tBFdPk1NZGSJs2AXWniFBg8o-q5_rUNev6IJ1Ih1TABpuVeL3aPlaDuEgX4ofivzoMsoGDWhrOQPLUbq9XCkzAO2rA9Pe7ZbFsKxk'
    },
    {
        id: 'berserker',
        name: 'Berserker',
        role: 'ADC',
        overall: 91,
        stats: { mechanics: 99, objectives: 85, macro: 87, vision: 84, teamwork: 88, mental: 89 },
        synergy: 90,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdsGjvfWWP_RQNNnonarIcqn1w4a1C67nqV4onFMGWTacVTtZcmBLfYLg0F_8tnC-0L75xDGVVduwGKczRdEbfwrYroPUf6BjR_tk2ZyXcg5qNWU9xkxeixNdlRIqXeymWpYv2G1J9Q0TPgaXpw1PAPC2ca1uP290RzVvGwU4Sv56ZJnYXnZxha829S_3gVjM5ccAMUtxp4D_0J8qBGHt9N5KOsN97t0X_glvsn1Hx1et9xihm5_9k8eEf1cRjBX4HU7_q7_kNYyc'
    },
    {
        id: 'vulcan',
        name: 'Vulcan',
        role: 'SUP',
        overall: 88,
        stats: { mechanics: 82, objectives: 95, macro: 90, vision: 94, teamwork: 86, mental: 85 },
        synergy: 75,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDczUci-uHIWdbJeCdzPrbW8bcQ_I9NN_1njJmho1qTxEAFZ9aXu3gvt0gYxoZ4gnkO5UaGdc_ZOVtuj-jKW6u1gIwQYD7AmyRTU-RfzLUrMNfrcT-EAUPmsmqUMXe7rjEf96uDjYqljkUL--R9J3jWOd14hio3KRju1e4daLpYR6O-Wt3yj_GrNpAHHpb44Un-j7RloKeE0_eqUoGAbPyoa-axldcOQBZ0-g5n4p0wNFIdoWlJ5EAN5vKdKgmwkhJ_H54zPK2JK9Y'
    }
];

export const matches: Match[] = [
    {
        id: 'match-1',
        date: 'Oct 24',
        duration: '32:40',
        result: 'WIN',
        score: '2 - 1',
        format: 'Bo3',
        type: 'Ranked',
        opponent: { name: 'T1', abbreviation: 'T1', color: 'red' },
        performance: { macroControl: 82, microErrorRate: 'LOW' }
    },
    {
        id: 'match-2',
        date: 'Oct 23',
        duration: '28:15',
        result: 'LOSS',
        score: '0 - 1',
        format: 'Bo1',
        type: 'Scrim',
        opponent: { name: 'FNATIC', abbreviation: 'FNC', color: 'orange' },
        performance: { macroControl: 45, microErrorRate: 'HIGH' }
    },
    {
        id: 'match-3',
        date: 'Oct 21',
        duration: '41:05',
        result: 'WIN',
        score: '1 - 0',
        format: 'Bo1',
        type: 'Ranked',
        opponent: { name: 'Gen.G', abbreviation: 'GEN', color: 'yellow' },
        performance: { macroControl: 76, microErrorRate: 'MED' }
    }
];

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

export const strategyBriefData = {
    opponent: 'T1',
    matchTime: '2 hours',
    format: 'Best of 5',
    region: 'Worlds 2024',
    keyPlayers: [
        { name: 'Faker', role: 'MID', threat: 'HIGH', note: 'Signature Azir pick - prioritize ban or counter' },
        { name: 'Oner', role: 'JG', threat: 'MED', note: 'Aggressive early invades - ward enemy jungle' }
    ],
    objectives: [
        'Secure first blood through mid-jungle synergy',
        'Prioritize Herald control for early tower pressure',
        'Avoid late-game teamfights - split push advantage'
    ],
    banSuggestions: ['Azir', 'Lee Sin', 'Nautilus'],
    winConditions: [
        'Early game snowball through bot lane',
        'Objective control (Baron @ 20 min)',
        'Vision denial in enemy jungle'
    ]
};
