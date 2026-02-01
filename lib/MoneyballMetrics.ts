export interface PlayerStats {
    kills: number;
    deaths: number;
    assists: number;
    goldEarned: number;
    damageToChampions: number;
    wins: number;
    gamesPlayed: number;
    role: string;
}

/**
 * Esports On-Base Percentage (eOBP)
 * Measures survival and participation frequency.
 * Formula: (Kills + Assists) / (Kills + Assists + Deaths)
 * Range: 0.0 - 1.0 (approximated, can go higher technically in KDA but treated as ratio here)
 * Actually for "Percentage" we might want K+A / Total Involvements or similar.
 * Implemented as: (K + A) / (K + A + D) to penalize deaths heavily like "outs".
 */
export function calculate_eOBP(stats: PlayerStats): number {
    const totalInteractions = stats.kills + stats.assists + stats.deaths;
    if (totalInteractions === 0) return 0;
    return (stats.kills + stats.assists) / totalInteractions;
}

/**
 * Esports Slugging Percentage (eSLG)
 * Measures "Power" efficiency - Damage dealt per Gold spent.
 * Formula: (Damage To Champions / Gold Earned) * 100
 * Base: Avg is around 100-150%. 
 */
export function calculate_eSLG(stats: PlayerStats): number {
    if (stats.goldEarned === 0) return 0;
    return (stats.damageToChampions / stats.goldEarned) * 100;
}

/**
 * Esports Wins Above Replacement (eWAR)
 * Estimates wins contributed over an average player in the same role.
 * Formula: (Player Win% - Role Avg Win%) * Games Played
 * 
 * Note: Requires knowing the Role Average. 
 * Defaults:
 * - Solocarry (Mid/ADC): 50%
 * - Utility (Sup/Jgl): 50%
 * Real implementation would fetch dynamic avgs.
 */
export function calculate_eWAR(stats: PlayerStats, roleAvgWinRate: number = 0.50): number {
    if (stats.gamesPlayed === 0) return 0;
    const playerWinRate = stats.wins / stats.gamesPlayed;
    return (playerWinRate - roleAvgWinRate) * stats.gamesPlayed;
}

/**
 * Composite "Moneyball" Score
 * Weighted sum of advanced metrics to find hidden gems.
 */
export function calculateMoneyballScore(stats: PlayerStats): number {
    const obp = calculate_eOBP(stats); // ~0.5 - 0.9
    const slg = calculate_eSLG(stats); // ~100 - 200
    // Normalize SLG to ~1.0 scale (divide by 200)
    const normSlg = Math.min(slg / 150, 1.5);

    // Weight OBP higher for "Getting on base" (Survival)
    // Moneyball philosophy: Survival > Flashy plays
    return (obp * 0.6) + (normSlg * 0.4);
}
