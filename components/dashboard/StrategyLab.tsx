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

            <div className="grid grid-cols-12 gap-6 px-4 pb-6 flex-1 overflow-hidden">

                {/* LEFT COLUMN: Draft Simulator */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col h-full overflow-hidden">
                    <div className="bg-surface-card rounded-2xl border border-white/5 p-5 h-full flex flex-col shadow-xl">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <span className="material-icons-outlined text-primary text-base">psychology</span>
                            Draft Simulator
                        </h2>

                        <div className="bg-surface-darker/50 rounded-xl p-4 border border-white/5 mb-6 relative">
                            <p className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">Draft Advantage</p>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-primary font-mono shadow-neon-text">{winProbability}%</span>
                                <span className="text-xs text-primary mb-1.5">WIN PROB</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-3 flex overflow-hidden">
                                <div
                                    className="h-full bg-primary shadow-[0_0_10px_#D2F96F] transition-all duration-500"
                                    style={{ width: `${winProbability}%` }}
                                ></div>
                            </div>
                            {draftLoading && (
                                <div className="absolute -right-2 top-4 w-16 h-16 opacity-30">
                                    <svg className="animate-spin-slow" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" fill="none" r="40" stroke="white" strokeDasharray="10 5" strokeWidth="2"></circle>
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                                    <span>BLUE SIDE (YOU)</span>
                                    <span className="text-blue-400">{bluePicks.length < 5 ? 'PICKING...' : 'LOCKED'}</span>
                                </div>
                                <div className="space-y-2">
                                    {bluePicks.map((pick, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-surface-darker p-2 rounded-lg border-l-2 border-blue-500">
                                            <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-lg">
                                                {pick.icon || '👤'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-white">{pick.name}</p>
                                                <p className="text-[10px] text-gray-500">Pick {i + 1}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {bluePicks.length < 5 && (
                                        <div
                                            onClick={openChampionPicker}
                                            className="flex items-center gap-3 bg-primary/10 p-2 rounded-lg border border-primary/30 relative overflow-hidden cursor-pointer hover:bg-primary/20 transition"
                                        >
                                            <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                                            <div className="w-8 h-8 bg-gray-800 rounded border border-primary/50 flex items-center justify-center relative z-10">
                                                <span className="material-icons-outlined text-primary text-sm">add</span>
                                            </div>
                                            <div className="flex-1 relative z-10">
                                                <p className="text-sm font-bold text-primary">Select Champion</p>
                                                <p className="text-[10px] text-primary/70">
                                                    Recommended: {recommendedPick?.heroName || 'Loading...'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="pt-2 border-t border-white/5">
                                <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                                    <span>RED SIDE</span>
                                </div>
                                <div className="space-y-2 opacity-80">
                                    {redPicks.map((pick, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-surface-darker p-2 rounded-lg border-r-2 border-red-500 flex-row-reverse text-right">
                                            <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-lg">
                                                {pick.icon || '🛡️'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-white">{pick.name}</p>
                                                <p className="text-[10px] text-gray-500">Pick {i + 1}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex gap-2 items-start">
                                <span className="material-symbols-outlined text-primary text-lg mt-0.5">auto_awesome</span>
                                <div>
                                    <p className="text-xs text-gray-300 leading-snug">
                                        <span className="text-primary font-bold">Counter Pick:</span>{' '}
                                        {counterInsight}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MIDDLE COLUMN: Team Insight Panel */}
                <section className="col-span-12 lg:col-span-6 flex flex-col gap-4 h-full">
                    {/* Team Insight Panel (Moneyball Dashboard) */}
                    <div className="flex-1 bg-[#0f1115] rounded-2xl border border-white/5 relative overflow-hidden shadow-2xl group min-h-[500px]">
                        <TeamInsightPanel
                            teamName={matchTimeline?.teams.red.name || "T1"}

                        />
                    </div>

                    {/* Console / Briefing */}
                    <div className="h-48 bg-[#0a0c08] rounded-xl border border-white/10 p-4 font-mono text-sm relative overflow-hidden shadow-lg flex flex-col">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                <span className="text-primary font-bold tracking-wider text-xs">GEMINI_TACTICAL_BRIEFING</span>
                            </div>
                            <span className="text-[10px] text-gray-600">v.2.0.4 - CONNECTED</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            <div className="flex gap-2 text-gray-400">
                                <span className="text-gray-600 select-none">$</span>
                                <span>{executiveSummary}</span>
                            </div>

                            {!briefingLoading && compositionAnalysis && (
                                <div className="flex gap-2 text-gray-400">
                                    <span className="text-gray-600 select-none">$</span>
                                    <span>Analyzing composition matchup: <span className="text-blue-400">{compositionAnalysis.blueArchetype}</span> vs <span className="text-red-400">{compositionAnalysis.redArchetype}</span></span>
                                </div>
                            )}

                            {tacticalInsights.map((insight, idx) => (
                                <div key={idx} className={`flex gap-2 ${insight.type === 'critical' ? 'text-red-300' :
                                    insight.type === 'warning' ? 'text-orange-300' :
                                        insight.type === 'recommendation' ? 'text-primary' : 'text-gray-300'
                                    } mt-1`}>
                                    <span className="text-primary select-none">&gt;</span>
                                    <span className="typing-effect">
                                        {insight.title && <span className="font-bold mr-1">{insight.title}:</span>}
                                        {insight.content}
                                    </span>
                                </div>
                            ))}

                            {briefingLoading && (
                                <div className="flex gap-2 text-primary/50 mt-1">
                                    <span className="text-gray-600 select-none">$</span>
                                    <span className="animate-pulse">Generating strategic analysis...</span>
                                </div>
                            )}

                            <div className="flex gap-2 text-white mt-1">
                                <span className="text-primary select-none animate-blink">_</span>
                            </div>
                        </div>
                        <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDBoMXYxSDB6IiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDIpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')" }}></div>
                    </div>
                </section>

                {/* Scenario Variables (Right Sidebar) */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full">
                    <div className="bg-surface-dark rounded-2xl border border-white/10 p-5 flex-1 shadow-lg relative overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-white font-bold flex items-center gap-2">
                                <span className="material-icons-outlined text-gray-400 text-sm">tune</span>
                                Scenario Variables
                            </h2>
                            <button className="text-[10px] text-primary hover:underline cursor-pointer">RESET</button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs text-gray-300 font-medium">Gold Advantage</label>
                                    <span className="text-xs font-mono text-red-400">{goldAdvantage}</span>
                                </div>
                                <input
                                    className="w-full h-1.5 bg-surface-darker rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-neon"
                                    max="5000"
                                    min="-5000"
                                    type="range"
                                    value={goldAdvantage}
                                    onChange={(e) => setGoldAdvantage(parseInt(e.target.value))}
                                />
                                <div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
                                    <span>-5k</span>
                                    <span>0</span>
                                    <span>+5k</span>
                                </div>
                            </div>
                            <div className="bg-surface-darker/50 p-3 rounded-xl border border-white/5">
                                <label className="text-xs text-gray-400 block mb-2">Game Phase</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setGamePhase('EARLY')}
                                        className={`flex-1 py-1.5 text-xs rounded border transition cursor-pointer ${gamePhase === 'EARLY' ? 'border-primary/30 bg-primary/10 text-primary font-bold shadow-neon' : 'border-white/10 bg-surface-dark text-gray-400 hover:text-white hover:border-white/30'}`}
                                    >
                                        Early
                                    </button>
                                    <button
                                        onClick={() => setGamePhase('MID')}
                                        className={`flex-1 py-1.5 text-xs rounded border transition cursor-pointer ${gamePhase === 'MID' ? 'border-primary/30 bg-primary/10 text-primary font-bold shadow-neon' : 'border-white/10 bg-surface-dark text-gray-400 hover:text-white hover:border-white/30'}`}
                                    >
                                        Mid
                                    </button>
                                    <button
                                        onClick={() => setGamePhase('LATE')}
                                        className={`flex-1 py-1.5 text-xs rounded border transition cursor-pointer ${gamePhase === 'LATE' ? 'border-primary/30 bg-primary/10 text-primary font-bold shadow-neon' : 'border-white/10 bg-surface-dark text-gray-400 hover:text-white hover:border-white/30'}`}
                                    >
                                        Late
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-surface-darker rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons-outlined text-gray-400 text-sm">battery_alert</span>
                                        <span className="text-xs text-gray-300">Player Fatigue</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            checked={playerFatigue}
                                            onChange={(e) => setPlayerFatigue(e.target.checked)}
                                            className="sr-only peer"
                                            type="checkbox"
                                        />
                                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-surface-darker rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons-outlined text-gray-400 text-sm">flag</span>
                                        <span className="text-xs text-gray-300">Objective Priority</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input defaultChecked className="sr-only peer" type="checkbox" />
                                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Simulated Outcome</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-surface-darker p-3 rounded-lg border border-white/5 text-center">
                                        <div className="text-[10px] text-gray-500 mb-1">TEAMFIGHT WR</div>
                                        <div className={`text-xl font-mono ${scenarioLoading ? 'text-gray-500' : 'text-white'} font-bold`}>
                                            {scenarioLoading ? '...' : `${teamfightWR}%`}
                                        </div>
                                    </div>
                                    <div className="bg-surface-darker p-3 rounded-lg border border-white/5 text-center">
                                        <div className="text-[10px] text-gray-500 mb-1">SPLIT PUSH</div>
                                        <div className={`text-xl font-mono ${scenarioLoading ? 'text-gray-500' : 'text-primary'} font-bold shadow-neon-text`}>
                                            {scenarioLoading ? '...' : splitPushRating}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={runSimulation}
                                disabled={simulationRunning}
                                className={`w-full py-3 rounded-xl text-black font-bold text-sm transition shadow-neon flex items-center justify-center gap-2 cursor-pointer ${simulationRunning
                                    ? 'bg-gray-500 cursor-not-allowed opacity-75'
                                    : 'bg-primary hover:bg-primary-dark'
                                    }`}
                            >
                                {simulationRunning ? (
                                    <>
                                        <span className="material-icons-outlined text-lg animate-spin">sync</span>
                                        Running Simulation...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined text-lg">play_arrow</span>
                                        Run Simulation
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </aside>
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
                isOpen={simulationResultOpen}
                onClose={closeSimulationResult}
                result={simulationResult}
            />
        </div>
    );
};

export default StrategyLab;
