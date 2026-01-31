// supabase/functions/scenario-prediction/index.ts
// Scenario Prediction Edge Function - Win probability modeling based on game state variables

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GRID_URLS, getGridHeaders } from "../_shared/grid-config.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ScenarioInput {
    gamePhase: 'EARLY' | 'MID' | 'LATE';
    goldAdvantage: number; // Positive = our advantage, negative = enemy advantage
    objectivesSecured: string[]; // ['DRAGON', 'RIFT_HERALD', 'BARON', 'TOWER']
    playerFatigue: boolean;
    draftAdvantage: number; // 0-1 scale, 0.5 = even
    towerCount: { blue: number; red: number };
    dragonCount: { blue: number; red: number };
    baronSecured: { blue: boolean; red: boolean };
    teamKills: { blue: number; red: number };
    teamDeaths: { blue: number; red: number };
}

interface PredictionResult {
    winProbability: {
        teamId: string;
        probability: number;
        confidenceInterval: { low: number; high: number };
        factors: {
            variable: string;
            weight: number;
            impact: number;
            direction: 'positive' | 'negative' | 'neutral';
        }[];
    };
    teamfightWinRate: {
        probability: number;
        rating: 'HIGH' | 'MEDIUM' | 'LOW';
        conditions: {
            goldDiff: number;
            itemAdvantage: boolean;
            positioning: string;
        };
    };
    splitPushEfficiency: {
        rating: 'HIGH' | 'MEDIUM' | 'LOW';
        probability: number;
        reasoning: string;
    };
    objectivePriority: {
        nextObjective: string;
        timing: string;
        winRateIfSecured: number;
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    strategicRecommendations: string[];
    source: string;
}

// Weight factors for win probability calculation
const FACTOR_WEIGHTS = {
    goldAdvantage: 0.25,
    objectiveControl: 0.20,
    draftAdvantage: 0.15,
    towerCount: 0.15,
    killAdvantage: 0.10,
    baronControl: 0.10,
    fatigue: 0.05
};

function calculateWinProbability(scenario: ScenarioInput): PredictionResult {
    const factors: PredictionResult['winProbability']['factors'] = [];
    let baseProbability = 50; // Start at 50/50

    // 1. Gold Advantage Impact
    // Every 1000 gold = ~2.5% win rate increase
    const goldImpact = (scenario.goldAdvantage / 1000) * 2.5;
    baseProbability += goldImpact * FACTOR_WEIGHTS.goldAdvantage * 4;
    factors.push({
        variable: 'GOLD_ADVANTAGE',
        weight: FACTOR_WEIGHTS.goldAdvantage,
        impact: goldImpact,
        direction: scenario.goldAdvantage > 0 ? 'positive' : scenario.goldAdvantage < 0 ? 'negative' : 'neutral'
    });

    // 2. Dragon Control
    const dragonDiff = (scenario.dragonCount?.blue || 0) - (scenario.dragonCount?.red || 0);
    const dragonImpact = dragonDiff * 3; // Each dragon = ~3%
    baseProbability += dragonImpact;
    factors.push({
        variable: 'DRAGON_CONTROL',
        weight: 0.1,
        impact: dragonImpact,
        direction: dragonDiff > 0 ? 'positive' : dragonDiff < 0 ? 'negative' : 'neutral'
    });

    // 3. Tower Control
    const towerDiff = (scenario.towerCount?.blue || 0) - (scenario.towerCount?.red || 0);
    const towerImpact = towerDiff * 2.5;
    baseProbability += towerImpact;
    factors.push({
        variable: 'TOWER_CONTROL',
        weight: FACTOR_WEIGHTS.towerCount,
        impact: towerImpact,
        direction: towerDiff > 0 ? 'positive' : towerDiff < 0 ? 'negative' : 'neutral'
    });

    // 4. Baron Impact
    const baronImpact = scenario.baronSecured?.blue ? 15 : scenario.baronSecured?.red ? -12 : 0;
    baseProbability += baronImpact;
    factors.push({
        variable: 'BARON_CONTROL',
        weight: FACTOR_WEIGHTS.baronControl,
        impact: baronImpact,
        direction: scenario.baronSecured?.blue ? 'positive' : scenario.baronSecured?.red ? 'negative' : 'neutral'
    });

    // 5. Kill Advantage
    const killDiff = (scenario.teamKills?.blue || 0) - (scenario.teamKills?.red || 0);
    const killImpact = killDiff * 1.5;
    baseProbability += killImpact * FACTOR_WEIGHTS.killAdvantage * 4;
    factors.push({
        variable: 'KILL_ADVANTAGE',
        weight: FACTOR_WEIGHTS.killAdvantage,
        impact: killImpact,
        direction: killDiff > 0 ? 'positive' : killDiff < 0 ? 'negative' : 'neutral'
    });

    // 6. Draft Advantage
    const draftImpact = ((scenario.draftAdvantage || 0.5) - 0.5) * 20;
    baseProbability += draftImpact;
    factors.push({
        variable: 'DRAFT_ADVANTAGE',
        weight: FACTOR_WEIGHTS.draftAdvantage,
        impact: draftImpact,
        direction: scenario.draftAdvantage > 0.5 ? 'positive' : scenario.draftAdvantage < 0.5 ? 'negative' : 'neutral'
    });

    // 7. Player Fatigue
    const fatigueImpact = scenario.playerFatigue ? -5 : 0;
    baseProbability += fatigueImpact;
    factors.push({
        variable: 'PLAYER_FATIGUE',
        weight: FACTOR_WEIGHTS.fatigue,
        impact: fatigueImpact,
        direction: scenario.playerFatigue ? 'negative' : 'neutral'
    });

    // 8. Game Phase adjustments
    let phaseMultiplier = 1;
    if (scenario.gamePhase === 'LATE') {
        // Late game amplifies advantages
        phaseMultiplier = 1.3;
    } else if (scenario.gamePhase === 'EARLY') {
        // Early game advantages are less decisive
        phaseMultiplier = 0.7;
    }

    // Apply phase multiplier to deviation from 50%
    const deviation = (baseProbability - 50) * phaseMultiplier;
    baseProbability = 50 + deviation;

    factors.push({
        variable: 'GAME_PHASE',
        weight: 0.1,
        impact: phaseMultiplier,
        direction: scenario.gamePhase === 'LATE' ? 'positive' : 'neutral'
    });

    // Clamp probability to reasonable range
    baseProbability = Math.max(15, Math.min(85, baseProbability));

    // Calculate confidence interval based on game phase and data completeness
    const confidenceWidth = scenario.gamePhase === 'EARLY' ? 15 : scenario.gamePhase === 'MID' ? 10 : 7;

    return {
        winProbability: {
            teamId: 'blue',
            probability: Math.round(baseProbability * 10) / 10,
            confidenceInterval: {
                low: Math.max(5, Math.round((baseProbability - confidenceWidth) * 10) / 10),
                high: Math.min(95, Math.round((baseProbability + confidenceWidth) * 10) / 10)
            },
            factors: factors.filter(f => Math.abs(f.impact) > 0.5)
        },
        teamfightWinRate: calculateTeamfightWinRate(scenario),
        splitPushEfficiency: calculateSplitPushEfficiency(scenario),
        objectivePriority: determineObjectivePriority(scenario),
        strategicRecommendations: generateRecommendations(scenario, baseProbability),
        source: 'prediction-engine'
    };
}

function calculateTeamfightWinRate(scenario: ScenarioInput): PredictionResult['teamfightWinRate'] {
    let probability = 50;

    // Gold advantage directly impacts teamfight power
    probability += (scenario.goldAdvantage / 1000) * 5;

    // Kill advantage shows current form
    const killDiff = (scenario.teamKills?.blue || 0) - (scenario.teamKills?.red || 0);
    probability += killDiff * 2;

    // Draft matters more in teamfights
    probability += ((scenario.draftAdvantage || 0.5) - 0.5) * 30;

    // Fatigue hurts teamfight execution
    if (scenario.playerFatigue) probability -= 8;

    probability = Math.max(20, Math.min(80, probability));

    return {
        probability: Math.round(probability),
        rating: probability >= 60 ? 'HIGH' : probability >= 45 ? 'MEDIUM' : 'LOW',
        conditions: {
            goldDiff: scenario.goldAdvantage,
            itemAdvantage: scenario.goldAdvantage > 2000,
            positioning: scenario.goldAdvantage > 0 ? 'Favorable' : 'Defensive'
        }
    };
}

function calculateSplitPushEfficiency(scenario: ScenarioInput): PredictionResult['splitPushEfficiency'] {
    // Split push is better when behind in teamfights but have tower pressure
    const towerDiff = (scenario.towerCount?.blue || 0) - (scenario.towerCount?.red || 0);
    const goldBehind = scenario.goldAdvantage < -1500;

    let rating: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let probability = 50;
    let reasoning = 'Standard split push viability.';

    if (goldBehind && towerDiff >= 0) {
        rating = 'HIGH';
        probability = 65;
        reasoning = 'Behind in gold but have wave control - split push to avoid teamfights and create pressure.';
    } else if (scenario.goldAdvantage > 3000) {
        rating = 'LOW';
        probability = 30;
        reasoning = 'Large gold lead - force teamfights to close out the game faster.';
    } else if (scenario.gamePhase === 'LATE') {
        rating = towerDiff > 0 ? 'HIGH' : 'MEDIUM';
        probability = towerDiff > 0 ? 60 : 45;
        reasoning = 'Late game split push can create baron/inhibitor pressure.';
    }

    return { rating, probability, reasoning };
}

function determineObjectivePriority(scenario: ScenarioInput): PredictionResult['objectivePriority'] {
    const blueDragons = scenario.dragonCount?.blue || 0;
    const redDragons = scenario.dragonCount?.red || 0;

    // Default to dragon
    let nextObjective = 'Dragon';
    let timing = 'When available';
    let winRateIfSecured = 55;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

    // Baron becomes priority after 20 mins or when ahead
    if (scenario.gamePhase !== 'EARLY') {
        if (scenario.goldAdvantage > 2000) {
            nextObjective = 'Baron';
            timing = 'Look for pick, then secure';
            winRateIfSecured = 75;
            riskLevel = 'MEDIUM';
        } else if (blueDragons >= 3) {
            nextObjective = 'Dragon Soul';
            timing = 'Contest immediately - game defining';
            winRateIfSecured = 80;
            riskLevel = 'HIGH';
        } else if (redDragons >= 3) {
            nextObjective = 'Dragon (Deny Soul)';
            timing = 'Must contest - prevent enemy soul';
            winRateIfSecured = 65;
            riskLevel = 'HIGH';
        }
    } else {
        // Early game - Rift Herald or Dragon
        if (scenario.towerCount?.blue || 0 < 2) {
            nextObjective = 'Rift Herald';
            timing = '8-12 minutes';
            winRateIfSecured = 58;
            riskLevel = 'LOW';
        }
    }

    return { nextObjective, timing, winRateIfSecured, riskLevel };
}

function generateRecommendations(scenario: ScenarioInput, winProb: number): string[] {
    const recommendations: string[] = [];

    if (scenario.goldAdvantage < -3000) {
        recommendations.push('Large gold deficit - avoid 5v5 fights. Look for picks and split pressure.');
        recommendations.push('Consider trading objectives rather than contesting every fight.');
    } else if (scenario.goldAdvantage > 3000) {
        recommendations.push('Significant lead - apply vision control and force objectives.');
        recommendations.push('Look to end before enemy team scales - push advantages aggressively.');
    }

    if (scenario.playerFatigue) {
        recommendations.push('Player fatigue detected - simplify shotcalling and reduce mechanical demands.');
    }

    if (winProb < 40) {
        recommendations.push('Defensive posture recommended - scale for late game if composition allows.');
        recommendations.push('Focus on not making mistakes rather than forcing plays.');
    } else if (winProb > 60) {
        recommendations.push('Winning position - maintain pressure but avoid throws.');
        recommendations.push('Control tempo and force the enemy to make difficult decisions.');
    }

    if (scenario.gamePhase === 'LATE') {
        recommendations.push('Single death can decide the game - position carefully around objectives.');
    }

    // Always have at least one recommendation
    if (recommendations.length === 0) {
        recommendations.push('Even game state - focus on macro play and objective control.');
    }

    return recommendations.slice(0, 4);
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();

        console.log('[scenario-prediction] Request:', body);

        // Build scenario from request
        const scenario: ScenarioInput = {
            gamePhase: body.gamePhase || 'MID',
            goldAdvantage: body.goldAdvantage ?? 0,
            objectivesSecured: body.objectivesSecured || [],
            playerFatigue: body.playerFatigue ?? false,
            draftAdvantage: body.draftAdvantage ?? 0.5,
            towerCount: body.towerCount || { blue: 0, red: 0 },
            dragonCount: body.dragonCount || { blue: 0, red: 0 },
            baronSecured: body.baronSecured || { blue: false, red: false },
            teamKills: body.teamKills || { blue: 0, red: 0 },
            teamDeaths: body.teamDeaths || { blue: 0, red: 0 }
        };

        const prediction = calculateWinProbability(scenario);

        return new Response(JSON.stringify(prediction), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[scenario-prediction] Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
