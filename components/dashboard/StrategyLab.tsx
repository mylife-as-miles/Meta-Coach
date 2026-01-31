import React, { useState, useMemo, useEffect } from 'react';
import { useDashboardStore } from '../../stores/useDashboardStore';
import { useSession } from '../../hooks/useAuth';
import {
    useWorkspace,
    useDraftAnalysis,
    useScenarioPrediction,
    useTacticalBriefing,
    useMatchTimeline,
    ScenarioInput
} from '../../hooks/useDashboardQueries';
import ChampionPickerModal from './modals/ChampionPickerModal';
import SimulationResultModal from './modals/SimulationResultModal';
import TeamInsightPanel from './TeamInsightPanel';
import MoneyballModal from './MoneyballModal';
import { Champion } from '../../lib/mockData';

const StrategyLab: React.FC = () => {
    const championPickerOpen = useDashboardStore((state) => state.championPickerOpen);
    const openChampionPicker = useDashboardStore((state) => state.openChampionPicker);
    const closeChampionPicker = useDashboardStore((state) => state.closeChampionPicker);
    const simulationResultOpen = useDashboardStore((state) => state.simulationResultOpen);
    const closeSimulationResult = useDashboardStore((state) => state.closeSimulationResult);
    const simulationRunning = useDashboardStore((state) => state.simulationRunning);
    const simulationResult = useDashboardStore((state) => state.simulationResult);
    const runSimulation = useDashboardStore((state) => state.runSimulation);

    // Moneyball Modal State
    const [moneyballOpen, setMoneyballOpen] = useState(false);
    const [selectedOpponent, setSelectedOpponent] = useState<{ id: string; name: string } | null>(null);

    // Auth & Workspace
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { data: workspace } = useWorkspace(userId);

    // Draft State
    const [bluePicks, setBluePicks] = useState<{ id: string; name: string; icon?: string }[]>([
        { id: 'aatrox', name: 'Aatrox', icon: '⚔️' },
        { id: 'sejuani', name: 'Sejuani', icon: '🐗' }
    ]);
    const [redPicks, setRedPicks] = useState<{ id: string; name: string; icon?: string }[]>([
        { id: 'ksante', name: "K'Sante", icon: '🛡️' },
        { id: 'leesin', name: 'Lee Sin', icon: '👊' }
    ]);
    const [selectedMid, setSelectedMid] = useState<Champion | null>(null);

    // Scenario State
    const [gamePhase, setGamePhase] = useState<'EARLY' | 'MID' | 'LATE'>('MID');
    const [goldAdvantage, setGoldAdvantage] = useState(-2500);
    const [playerFatigue, setPlayerFatigue] = useState(true);
    const [objectivePriority, setObjectivePriority] = useState(true);

    // Match Timeline Hook (Moved up to be available for scenarioInput)
    const { data: matchTimeline, isLoading: timelineLoading } = useMatchTimeline(undefined, 1, true);

    // Build scenario for prediction
    // Build scenario for prediction
    const scenarioInput: ScenarioInput = useMemo(() => {
        let baseInput: ScenarioInput = {
            gamePhase,
            goldAdvantage,
            playerFatigue,
            draftAdvantage: 0.55,
            towerCount: { blue: 3, red: 2 },
            dragonCount: { blue: 2, red: 1 },
            baronSecured: { blue: false, red: false },
            teamKills: { blue: 8, red: 6 },
            teamDeaths: { blue: 6, red: 8 },
            objectivesSecured: ['DRAGON', 'RIFT_HERALD']
        };

        if (matchTimeline) {
            // Calculate kills/deaths from live player data
            const blueKills = matchTimeline.players.filter(p => p.teamId === matchTimeline.teams.blue.id).reduce((acc, p) => acc + p.kills, 0);
            const redKills = matchTimeline.players.filter(p => p.teamId === matchTimeline.teams.red.id).reduce((acc, p) => acc + p.kills, 0);

            baseInput = {
                ...baseInput,
                gamePhase: matchTimeline.gameState.phase,
                goldAdvantage: matchTimeline.gameState.goldAdvantage.amount,
                teamKills: { blue: blueKills, red: redKills },
                teamDeaths: { blue: redKills, red: blueKills }, // Kills for one are deaths for other
                dragonCount: {
                    blue: matchTimeline.gameState.objectiveControl.teamId === matchTimeline.teams.blue.id ? matchTimeline.gameState.objectiveControl.dragonCount : 0,
                    red: matchTimeline.gameState.objectiveControl.teamId === matchTimeline.teams.red.id ? matchTimeline.gameState.objectiveControl.dragonCount : 0
                }
            };
        }

        return baseInput;
    }, [gamePhase, goldAdvantage, playerFatigue, matchTimeline]);

    // API Hooks
    const { data: draftAnalysis, isLoading: draftLoading } = useDraftAnalysis({
        titleId: 3, // LoL
        bluePicks,
        redPicks: redPicks
    });

    const { data: scenarioPrediction, isLoading: scenarioLoading } = useScenarioPrediction(scenarioInput);

    const { data: tacticalBriefing, isLoading: briefingLoading } = useTacticalBriefing({
        titleId: 3,
        teamId: workspace?.grid_team_id,
        draftData: {
            bluePicks: bluePicks.map(p => p.name),
            redPicks: redPicks.map(p => p.name),
            blueBans: [],
            redBans: []
        },
        gameState: {
            gamePhase,
            goldAdvantage,
            objectives: ['DRAGON', 'DRAGON', 'RIFT_HERALD']
        }
    });



    // Update blue picks when mid is selected
    useEffect(() => {
        if (selectedMid) {
            const existingPicks = bluePicks.filter(p => !p.id.includes('mid-'));
            setBluePicks([...existingPicks, { id: `mid-${selectedMid.name}`, name: selectedMid.name, icon: selectedMid.icon }]);
        }
    }, [selectedMid]);

    // Get win probability from draft analysis or fallback
    const winProbability = draftAnalysis?.winProbability?.blueWinRate ?? 64.2;
    const recommendedPick = draftAnalysis?.recommendedPicks?.[0];
    const counterInsight = recommendedPick
        ? `${recommendedPick.heroName} has a +${(recommendedPick.winRateVsComp - 50).toFixed(1)}% win rate delta against their comp. ${recommendedPick.reasoning}`
        : 'Azir has a +4.2% win rate delta against their comp. Prioritize scaling.';

    // Get scenario outcomes
    const teamfightWR = scenarioPrediction?.teamfightWinRate?.probability ?? 42;
    const splitPushRating = scenarioPrediction?.splitPushEfficiency?.rating ?? 'High';

    // Get tactical insights for console
    const tacticalInsights = tacticalBriefing?.insights || [];
    const executiveSummary = tacticalBriefing?.executiveSummary || 'Analyzing composition matchup...';
    const compositionAnalysis = draftAnalysis?.compositionAnalysis;

    return (
        <div className="flex flex-col h-auto lg:h-[calc(100vh-90px)] min-h-[800px]">
            {/* Custom Styles */}
            <style>{`
                .grid-bg {
                    background-size: 40px 40px;
                    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                                      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                }
                .animate-blink {
                    animation: blink 1s step-end infinite;
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.33); opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { transform: scale(2); opacity: 0; }
                }
                .map-player-icon {
                    transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .map-grid {
                    background-image: radial-gradient(circle, rgba(210, 249, 111, 0.1) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-4 pt-2">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="material-icons-outlined text-primary text-3xl">science</span>
                        Strategy Lab
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">AI-Powered Draft Analysis & Scenario Modeling</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-surface-dark px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-mono text-gray-300">GRID LIVE DATA</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 pb-6 overflow-hidden flex flex-col">
                {/* Full Width Moneyball Panel */}
                <div className="flex-1 bg-[#0f1115] rounded-2xl border border-white/5 relative overflow-hidden shadow-2xl group w-full h-full">
                    <TeamInsightPanel
                        teamName={selectedOpponent?.name || matchTimeline?.teams.red.name || "T1"}
                        onSearchClick={() => setMoneyballOpen(true)}
                    />
                </div>
            </div>

            {/* Champion Picker Modal */}
            <ChampionPickerModal
                isOpen={championPickerOpen}
                onClose={closeChampionPicker}
                role="MID"
                onSelect={(champion) => setSelectedMid(champion)}
            />

            {/* Simulation Result Modal */}
            <SimulationResultModal
                isOpen={simulationResultOpen} // Is this correct? The view_file previously showed internal state usage for sim result but hooks imply store usage. I'll stick to store.
                onClose={closeSimulationResult}
                result={simulationResult}
            />

            {/* Moneyball / Search Modal */}
            <MoneyballModal
                isOpen={moneyballOpen}
                onClose={() => setMoneyballOpen(false)}
                currentTeamId={matchTimeline?.teams.blue.id}
            />
        </div>
    );
};

export default StrategyLab;
