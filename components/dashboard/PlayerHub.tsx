import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDashboardStore } from '../../stores/useDashboardStore';
import { useSession } from '../../hooks/useAuth';
import { useWorkspace, usePlayerStats, usePlayerStatistics, usePlayerAnalysis, useRoster } from '../../hooks/useDashboardQueries';
import { useGridCreatePlayer, useGridDeletePlayer, useGridTeamPlayers } from '../../hooks/useGridQueries';
import { getProxiedImageUrl } from '../../lib/imageProxy';
import ComparePlayersModal from './modals/ComparePlayersModal';
import EditAttributesModal from './modals/EditAttributesModal';
import AddPlayerModal from './modals/AddPlayerModal';

const PlayerHub: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [addPlayerOpen, setAddPlayerOpen] = React.useState(false);

    // UI State from Zustand
    const selectedPlayer = useDashboardStore((state) => state.selectedPlayer);
    const selectPlayer = useDashboardStore((state) => state.selectPlayer);
    const comparePlayersOpen = useDashboardStore((state) => state.comparePlayersOpen);
    const openComparePlayers = useDashboardStore((state) => state.openComparePlayers);
    const closeComparePlayers = useDashboardStore((state) => state.closeComparePlayers);
    const editAttributesOpen = useDashboardStore((state) => state.editAttributesOpen);
    const openEditAttributes = useDashboardStore((state) => state.openEditAttributes);
    const closeEditAttributes = useDashboardStore((state) => state.closeEditAttributes);

    // Server Data from TanStack Query
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { data: workspace } = useWorkspace(userId);

    // GRID Team ID (needed for AI linking)
    const teamId = workspace?.grid_team_id || "1";

    // Use Roster Table (Local DB) instead of GRID API
    const { data: rosterPlayers, isLoading: playersLoading } = useRoster(workspace?.id);

    // Legacy GRID hooks (kept for create/delete if needed, though they might need to update Roster table too)
    const { mutate: createPlayer } = useGridCreatePlayer();
    const { mutate: deletePlayer } = useGridDeletePlayer();

    const allPlayers = React.useMemo(() => {
        if (!rosterPlayers) return [];
        return rosterPlayers.map((player: any) => ({
            id: player.id, // Internal UUID
            name: player.ign, // Display Name
            role: player.role,
            overall: player.readiness_score || 85,
            stats: {
                mechanics: player.analysis_data?.attributes?.mechanics || 80,
                objectives: player.analysis_data?.attributes?.objectives || 80,
                macro: player.analysis_data?.attributes?.macro || 80,
                vision: player.analysis_data?.attributes?.vision || 80,
                teamwork: player.analysis_data?.attributes?.teamwork || 80,
                mental: player.analysis_data?.attributes?.mental || 80
            },
            gridId: player.grid_player_id, // GRID ID for stats
            imageUrl: player.metadata?.imageUrl || player.image_url,
            teamId: player.workspace_id, // or grid team id? keeping consistent
            synergy: player.synergy_score || 85 // Added to satisfy Player interface
        }));
    }, [rosterPlayers]);

    // Fetch player micro-level stats from GRID (uses gridId if available)
    const { data: playerStats, isLoading: statsLoading } = usePlayerStats(
        selectedPlayer?.id,
        selectedPlayer?.gridId
    );

    // Fetch detailed player statistics from Statistics Feed
    const { data: playerDetailedStats } = usePlayerStatistics(selectedPlayer?.gridId);

    // AI Analysis (Gemini 3 Pro)
    const { data: playerAnalysis, isLoading: analysisLoading } = usePlayerAnalysis(
        selectedPlayer?.name,
        selectedPlayer?.role,
        teamId,
        playerDetailedStats,
        selectedPlayer?.id // Pass ID for persistence
    );

    // Handle URL params for direct linking
    useEffect(() => {
        const playerId = searchParams.get('player');
        const playerFromUrl = playerId ? allPlayers.find(p => p.id === playerId) : null;

        if (playerFromUrl && (!selectedPlayer || selectedPlayer.id !== playerId)) {
            selectPlayer(playerFromUrl);
        } else if (!selectedPlayer && allPlayers.length > 0) {
            // Default to first player if none selected
            selectPlayer(allPlayers[0]);
        }
    }, [searchParams, allPlayers, selectPlayer, selectedPlayer]);

    if (!selectedPlayer) {
        // Empty state when no players in roster
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
                <span className="material-icons-outlined text-6xl text-gray-600 mb-4">group_off</span>
                <h2 className="text-2xl font-bold text-white mb-2">No Players in Roster</h2>
                <p className="text-gray-400 mb-6 max-w-md">
                    Add players to your roster during onboarding or through the settings to start tracking performance.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.href = '/onboarding'}
                        className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition shadow-neon"
                    >
                        Complete Onboarding
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-90px)]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-primary font-mono text-xs uppercase tracking-wider">Roster Management</span>
                        <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                        <span className="text-gray-400 text-xs">Season 14</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">{selectedPlayer.name}</h1>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={openComparePlayers}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-surface-dark hover:border-primary/50 hover:text-white text-gray-400 text-sm transition cursor-pointer"
                    >
                        <span className="material-icons-outlined text-sm">compare_arrows</span> Compare
                    </button>
                    <button
                        onClick={() => window.location.href = '/dashboard/scout'}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-black font-bold text-sm hover:bg-primary-dark transition shadow-[0_0_5px_rgba(210,249,111,0.3),0_0_15px_rgba(210,249,111,0.1)] cursor-pointer"
                    >
                        <span className="material-icons-outlined text-sm">auto_awesome</span> Market Scout
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Gemini Potential Card */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg h-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                            <span className="material-symbols-outlined text-4xl text-purple-400">auto_awesome</span>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-400 text-sm">auto_awesome</span>
                                Gemini Potential
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">AI-Predicted development trajectory</p>
                        </div>
                        <div className="h-48 w-full relative mb-4">
                            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-600 font-mono">
                                <span>99</span>
                                <span>90</span>
                                <span>80</span>
                                <span>70</span>
                            </div>
                            <div className="ml-6 h-full relative border-l border-white/5 border-b">
                                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <defs>
                                        <linearGradient id="growthGradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.2"></stop>
                                            <stop offset="100%" stopColor="#A855F7" stopOpacity="0"></stop>
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,80 Q20,75 40,60 T70,45" fill="none" stroke="#666" strokeDasharray="4 2" strokeWidth="2"></path>
                                    <path d="M0,80 Q20,75 40,60 T70,45" fill="none" stroke="#D2F96F" strokeWidth="2"></path>
                                    <path className="animate-pulse" d="M70,45 Q85,35 100,20" fill="none" stroke="#A855F7" strokeDasharray="3 3" strokeWidth="2"></path>
                                    <circle className="shadow-[0_0_5px_rgba(210,249,111,0.3),0_0_15px_rgba(210,249,111,0.1)]" cx="70" cy="45" fill="#D2F96F" r="3"></circle>
                                    <circle cx="100" cy="20" fill="#A855F7" r="3"></circle>
                                </svg>
                            </div>
                        </div>
                        <div className="bg-surface-darker rounded-xl p-4 border border-white/5 mt-auto">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Projected Peak</span>
                                <span className="text-purple-400 font-bold font-mono text-lg">
                                    {analysisLoading ? '...' : (playerAnalysis?.potential?.projectedPeak || '98')} OVR
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                {analysisLoading ? 'Analyzing trajectory...' : (playerAnalysis?.potential?.analysis || 'Based on current scrim performance, Gemini predicts Mechanics will cap at 99 by Playoffs.')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Center Player Card & Stats */}
                <div className="lg:col-span-6 flex flex-col md:flex-row gap-8 items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-surface-darker/50 rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                    <div className="absolute w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                    {/* Player Card */}
                    <div className="relative w-full max-w-[320px] h-[480px] shrink-0 z-10 perspective-1000 group">
                        <div className="w-full h-full relative transition-transform duration-500 transform group-hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 via-primary/10 to-black rounded-t-2xl rounded-b-[4rem] border border-primary/40 shadow-[0_0_10px_rgba(210,249,111,0.5),0_0_30px_rgba(210,249,111,0.2)] backdrop-blur-sm"></div>
                            <div className="absolute inset-1 bg-gradient-to-b from-[#1F221B] via-[#0E100A] to-[#050604] rounded-t-xl rounded-b-[3.8rem] overflow-hidden flex flex-col">
                                <div className="absolute inset-0 z-20 pointer-events-none opacity-50" style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.2) 100%)' }}></div>
                                <div className="flex justify-between items-start p-5 z-30">
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl font-black text-white drop-shadow-md">{selectedPlayer.overall}</span>
                                        <span className="text-xl font-bold text-primary tracking-widest mt-[-5px]">{selectedPlayer.role}</span>
                                        <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-400/30 mt-2">
                                            <span className="text-[10px] font-bold text-blue-400">C9</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <img alt="USA" referrerPolicy="no-referrer" className="w-6 opacity-80 rounded-sm shadow-sm" src={getProxiedImageUrl("https://lh3.googleusercontent.com/aida-public/AB6AXuAFil26kJ3bUewkiNb-4gib2BeYc4Zx4NZjVRcWkLirY71c86hv4iOL2vPRy1KV0Qt1lVlZMRwMItsRt2oH389wzilXcbIm-i-nmKakxAZGwLtYFbY9VT5Q2KIRH2YcnWLWwVT_17XbL-Ng4f1vO2RbaTseAuUwd8wyB6YQ_w4Try1kkgG3VFzDyObGFq20bI0WhWA2ZKXkQYimaYOxyiAJu-qQzsmjRC4mwpkBWo2uAnVRSil0IyCt9h-EMh2oFSR5WbY3arxgeSc") || ''} />
                                    </div>
                                </div>
                                <div className="absolute top-16 left-0 right-0 bottom-32 flex items-center justify-center z-10 pointer-events-none">
                                    <span className="material-icons-outlined text-gray-800 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] opacity-80" style={{ fontSize: '220px' }}>person</span>
                                </div>
                                <div className="absolute top-[260px] w-full text-center z-30">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-display">{selectedPlayer.name}</h2>
                                    <div className="w-16 h-0.5 bg-primary/50 mx-auto mt-1 shadow-[0_0_5px_rgba(210,249,111,0.3),0_0_15px_rgba(210,249,111,0.1)]"></div>
                                </div>
                                <div className="absolute bottom-0 w-full h-[160px] px-6 pb-8 pt-4 flex flex-col justify-end z-30">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                        <div className="flex justify-between items-center group/stat cursor-default">
                                            <span className="font-bold text-white text-lg group-hover/stat:text-primary transition-colors">{selectedPlayer.stats.mechanics}</span>
                                            <span className="font-medium text-gray-400 text-xs tracking-wider">MECH</span>
                                        </div>
                                        <div className="flex justify-between items-center group/stat cursor-default">
                                            <span className="font-bold text-white text-lg group-hover/stat:text-primary transition-colors">{selectedPlayer.stats.objectives}</span>
                                            <span className="font-medium text-gray-400 text-xs tracking-wider">OBJ</span>
                                        </div>
                                        <div className="flex justify-between items-center group/stat cursor-default">
                                            <span className="font-bold text-white text-lg group-hover/stat:text-primary transition-colors">{selectedPlayer.stats.macro}</span>
                                            <span className="font-medium text-gray-400 text-xs tracking-wider">MACR</span>
                                        </div>
                                        <div className="flex justify-between items-center group/stat cursor-default">
                                            <span className="font-bold text-white text-lg group-hover/stat:text-primary transition-colors">{selectedPlayer.stats.vision}</span>
                                            <span className="font-medium text-gray-400 text-xs tracking-wider">VIS</span>
                                        </div>
                                        <div className="flex justify-between items-center group/stat cursor-default">
                                            <span className="font-bold text-white text-lg group-hover/stat:text-primary transition-colors">{selectedPlayer.stats.teamwork}</span>
                                            <span className="font-medium text-gray-400 text-xs tracking-wider">TEAM</span>
                                        </div>
                                        <div className="flex justify-between items-center group/stat cursor-default">
                                            <span className="font-bold text-white text-lg group-hover/stat:text-primary transition-colors">{selectedPlayer.stats.mental}</span>
                                            <span className="font-medium text-gray-400 text-xs tracking-wider">MENT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hex Chart */}
                    <div className="flex-1 w-full max-w-[300px] h-[300px] relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <polygon fill="none" points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" stroke="#333" strokeWidth="0.5"></polygon>
                                <polygon fill="none" points="50,20 80,35 80,65 50,80 20,65 20,35" stroke="#333" strokeWidth="0.5"></polygon>
                                <polygon fill="none" points="50,35 65,42.5 65,57.5 50,65 35,57.5 35,42.5" stroke="#333" strokeWidth="0.5"></polygon>
                                <line stroke="#333" strokeWidth="0.5" x1="50" x2="50" y1="50" y2="5"></line>
                                <line stroke="#333" strokeWidth="0.5" x1="50" x2="95" y1="50" y2="27.5"></line>
                                <line stroke="#333" strokeWidth="0.5" x1="50" x2="95" y1="50" y2="72.5"></line>
                                <line stroke="#333" strokeWidth="0.5" x1="50" x2="50" y1="50" y2="95"></line>
                                <line stroke="#333" strokeWidth="0.5" x1="50" x2="5" y1="50" y2="72.5"></line>
                                <line stroke="#333" strokeWidth="0.5" x1="50" x2="5" y1="50" y2="27.5"></line>
                            </svg>
                        </div>
                        <svg className="w-full h-full relative z-10 drop-shadow-[0_0_10px_rgba(210,249,111,0.4)]" viewBox="0 0 100 100">
                            <polygon fill="rgba(210, 249, 111, 0.2)" points="50,6 92,30 85,70 52,88 25,68 10,32" stroke="#D2F96F" strokeWidth="1.5"></polygon>
                            <circle cx="50" cy="6" fill="#fff" r="1.5"></circle>
                            <circle cx="92" cy="30" fill="#fff" r="1.5"></circle>
                            <circle cx="85" cy="70" fill="#fff" r="1.5"></circle>
                            <circle cx="52" cy="88" fill="#fff" r="1.5"></circle>
                            <circle cx="25" cy="68" fill="#fff" r="1.5"></circle>
                            <circle cx="10" cy="32" fill="#fff" r="1.5"></circle>
                        </svg>
                        <div className="absolute top-0 text-[10px] text-gray-400 font-bold bg-background-dark/80 px-1 rounded">MECH</div>
                        <div className="absolute top-[25%] right-0 text-[10px] text-gray-400 font-bold bg-background-dark/80 px-1 rounded">OBJ</div>
                        <div className="absolute bottom-[25%] right-0 text-[10px] text-gray-400 font-bold bg-background-dark/80 px-1 rounded">MACR</div>
                        <div className="absolute bottom-0 text-[10px] text-gray-400 font-bold bg-background-dark/80 px-1 rounded">VIS</div>
                        <div className="absolute bottom-[25%] left-0 text-[10px] text-gray-400 font-bold bg-background-dark/80 px-1 rounded">TEAM</div>
                        <div className="absolute top-[25%] left-0 text-[10px] text-gray-400 font-bold bg-background-dark/80 px-1 rounded">MENT</div>
                    </div>
                </div>

                {/* Tactical Synergies */}
                <div className="lg:col-span-3">
                    <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg h-full">
                        <h3 className="text-white font-bold mb-6 flex items-center justify-between">
                            Tactical Synergies
                            <span className="material-icons-outlined text-gray-500 text-sm">hub</span>
                        </h3>
                        <div className="space-y-6">
                            {analysisLoading ? (
                                <div className="text-xs text-gray-500 animate-pulse text-center py-4">
                                    Analyzing roster synergies...
                                </div>
                            ) : playerAnalysis?.synergies?.map((synergy, idx) => (
                                <div className="group" key={idx}>
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-surface-darker border border-white/10 flex items-center justify-center overflow-hidden">
                                                <span className="material-icons-outlined text-gray-400">person</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">{synergy.name}</p>
                                                <p className="text-sm font-bold text-white">{synergy.partner}</p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-bold text-primary font-mono shadow-[0_0_5px_rgba(210,249,111,0.3),0_0_15px_rgba(210,249,111,0.1)]">
                                            {synergy.score}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-surface-darker rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary/50 to-primary shadow-[0_0_5px_rgba(210,249,111,0.3),0_0_15px_rgba(210,249,111,0.1)] transition-all duration-1000"
                                            style={{ width: `${synergy.score}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {synergy.description}
                                    </p>
                                </div>
                            ))}
                            {!analysisLoading && (!playerAnalysis?.synergies || playerAnalysis.synergies.length === 0) && (
                                <p className="text-xs text-gray-500 text-center">No synergy data available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Match Performance Analytics (GRID API) */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">Match Performance</h3>
                        {statsLoading && (
                            <span className="material-icons animate-spin text-primary text-sm">hourglass_top</span>
                        )}
                        {playerStats?.aggregated?.form && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${playerStats.aggregated.form === 'HOT' ? 'bg-green-500/20 text-green-400' :
                                playerStats.aggregated.form === 'COLD' ? 'bg-red-500/20 text-red-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {playerStats.aggregated.form === 'HOT' ? '🔥 Hot Streak' :
                                    playerStats.aggregated.form === 'COLD' ? '❄️ Cold' : '⚖️ Stable'}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-500">Last {playerStats?.aggregated?.totalMatches || 0} matches from GRID</span>
                </div>

                {playerStats?.aggregated && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                        <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Win Rate</span>
                            <div className="text-2xl font-bold text-primary mt-1">{playerStats.aggregated.winRate}%</div>
                            <span className="text-xs text-gray-500">{playerStats.aggregated.wins}W - {playerStats.aggregated.losses}L</span>
                        </div>
                        <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Avg KDA</span>
                            <div className="text-2xl font-bold text-white mt-1">{playerStats.aggregated.avgKda}</div>
                            <span className="text-xs text-gray-500">{playerStats.aggregated.avgKills}/{playerStats.aggregated.avgDeaths}/{playerStats.aggregated.avgAssists}</span>
                        </div>
                        <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Avg Kills</span>
                            <div className="text-2xl font-bold text-green-400 mt-1">{playerStats.aggregated.avgKills}</div>
                        </div>
                        <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Avg Deaths</span>
                            <div className="text-2xl font-bold text-red-400 mt-1">{playerStats.aggregated.avgDeaths}</div>
                        </div>
                        <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Avg Assists</span>
                            <div className="text-2xl font-bold text-blue-400 mt-1">{playerStats.aggregated.avgAssists}</div>
                        </div>
                        <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Avg Damage</span>
                            <div className="text-2xl font-bold text-orange-400 mt-1">{playerStats.aggregated.avgDamage}</div>
                        </div>
                    </div>
                )}

                {/* Performance Trend Chart */}
                {playerStats?.performanceTrend && playerStats.performanceTrend.length > 0 && (
                    <div className="bg-surface-dark rounded-xl p-6 border border-white/5 mb-6">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-icons-outlined text-primary text-sm">trending_up</span>
                            KDA Trend (Last 5 Matches)
                        </h4>
                        <div className="flex items-end gap-3 h-24">
                            {playerStats.performanceTrend.map((match, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className={`w-full rounded-t transition-all ${match.result === 'WIN' ? 'bg-primary' : 'bg-red-500/50'
                                            }`}
                                        style={{ height: `${Math.min(match.kda * 20, 100)}%`, minHeight: '10px' }}
                                    />
                                    <span className="text-xs font-mono text-gray-400">{match.kda}</span>
                                    <span className={`text-[10px] font-bold ${match.result === 'WIN' ? 'text-primary' : 'text-red-400'
                                        }`}>{match.result === 'WIN' ? 'W' : 'L'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Matches Table */}
                {playerStats?.recentMatches && playerStats.recentMatches.length > 0 && (
                    <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                                    <th className="text-left py-3 px-4">Result</th>
                                    <th className="text-left py-3 px-4">Opponent</th>
                                    <th className="text-center py-3 px-4">K/D/A</th>
                                    <th className="text-center py-3 px-4">KDA</th>
                                    <th className="text-center py-3 px-4">Damage</th>
                                    <th className="text-left py-3 px-4">Tournament</th>
                                </tr>
                            </thead>
                            <tbody>
                                {playerStats.recentMatches.slice(0, 5).map((match) => (
                                    <tr key={match.matchId} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4">
                                            <span className={`font-bold ${match.result === 'WIN' ? 'text-primary' :
                                                match.result === 'LOSS' ? 'text-red-400' : 'text-gray-400'
                                                }`}>{match.result}</span>
                                            <span className="text-gray-500 ml-2 text-xs">{match.score}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {match.opponentLogo && (
                                                    <img src={match.opponentLogo} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                                                )}
                                                <span className="text-white">{match.opponent}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-green-400">{match.stats.kills}</span>
                                            <span className="text-gray-500">/</span>
                                            <span className="text-red-400">{match.stats.deaths}</span>
                                            <span className="text-gray-500">/</span>
                                            <span className="text-blue-400">{match.stats.assists}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono text-white">{match.stats.kda}</td>
                                        <td className="py-3 px-4 text-center text-orange-400">{match.stats.damageDealt}</td>
                                        <td className="py-3 px-4 text-gray-400 text-xs">{match.tournament}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!playerStats && !statsLoading && (
                    <div className="bg-surface-dark/50 rounded-xl p-8 border border-white/5 text-center">
                        <span className="material-icons-outlined text-gray-600 text-4xl mb-3">query_stats</span>
                        <p className="text-gray-500">No GRID match data available for this player.</p>
                        <p className="text-xs text-gray-600 mt-1">Stats will appear once match history is available.</p>
                    </div>
                )}

                {/* Detailed Statistics from Statistics Feed */}
                {playerDetailedStats?.aggregatedStats && (
                    <div className="mt-8">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-icons-outlined text-primary text-lg">analytics</span>
                            Aggregated Statistics
                            <span className="text-xs text-gray-500 font-normal">({playerDetailedStats.seriesAnalyzed} matches analyzed)</span>
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Total Kills</span>
                                <div className="text-2xl font-bold text-green-400 mt-1">
                                    {playerDetailedStats.aggregatedStats.kills.total}
                                </div>
                                <span className="text-xs text-gray-500">
                                    Max: <span className="text-green-300">{playerDetailedStats.aggregatedStats.kills.max}</span>
                                </span>
                            </div>
                            <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Total Deaths</span>
                                <div className="text-2xl font-bold text-red-400 mt-1">
                                    {playerDetailedStats.aggregatedStats.deaths.total}
                                </div>
                                <span className="text-xs text-gray-500">
                                    Max: <span className="text-red-300">{playerDetailedStats.aggregatedStats.deaths.max}</span>
                                </span>
                            </div>
                            <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Total Damage</span>
                                <div className="text-2xl font-bold text-orange-400 mt-1">
                                    {(playerDetailedStats.aggregatedStats.damage.total / 1000).toFixed(1)}k
                                </div>
                                <span className="text-xs text-gray-500">
                                    Avg: <span className="text-orange-300">{playerDetailedStats.aggregatedStats.damage.average}</span>
                                </span>
                            </div>
                            <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Gold Earned</span>
                                <div className="text-2xl font-bold text-yellow-400 mt-1">
                                    {(playerDetailedStats.aggregatedStats.goldEarned.total / 1000).toFixed(1)}k
                                </div>
                                <span className="text-xs text-gray-500">
                                    Avg: <span className="text-yellow-300">{playerDetailedStats.aggregatedStats.goldEarned.average}</span>
                                </span>
                            </div>
                            <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">CS Total</span>
                                <div className="text-2xl font-bold text-purple-400 mt-1">
                                    {playerDetailedStats.aggregatedStats.creepScore.total}
                                </div>
                                <span className="text-xs text-gray-500">
                                    Avg: <span className="text-purple-300">{playerDetailedStats.aggregatedStats.creepScore.average}/game</span>
                                </span>
                            </div>
                            <div className="bg-surface-dark rounded-xl p-4 border border-white/5">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">First Bloods</span>
                                <div className="text-2xl font-bold text-white mt-1">
                                    {playerDetailedStats.aggregatedStats.firstBloods.kills}
                                </div>
                                <span className="text-xs text-gray-500">
                                    Deaths: <span className="text-red-300">{playerDetailedStats.aggregatedStats.firstBloods.deaths}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Active Roster List */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Active Roster</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setAddPlayerOpen(true)}
                            className="px-3 py-1 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-bold transition flex items-center gap-1"
                        >
                            <span className="material-icons-outlined text-sm">add</span> Add Player
                        </button>
                        <button className="w-8 h-8 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center hover:bg-white/10 transition cursor-pointer">
                            <span className="material-icons-outlined text-sm">chevron_left</span>
                        </button>
                        <button className="w-8 h-8 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center hover:bg-white/10 transition cursor-pointer">
                            <span className="material-icons-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
                    {allPlayers.map((player) => (
                        <div
                            key={player.id}
                            onClick={() => selectPlayer(player)}
                            className={`snap-start shrink-0 transition-opacity ${selectedPlayer.id === player.id ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'} relative group`}
                        >
                            <div className={`w-48 h-72 relative rounded-2xl border overflow-hidden cursor-pointer transition-all ${selectedPlayer.id === player.id
                                ? 'border-2 border-primary shadow-[0_0_5px_rgba(210,249,111,0.3),0_0_15px_rgba(210,249,111,0.1)]'
                                : 'border-white/10 bg-surface-dark hover:border-white/30'
                                }`}>
                                <div className={`absolute inset-0 bg-gradient-to-b ${selectedPlayer.id === player.id ? 'from-gray-800 to-black' : 'from-gray-800/50 to-black'}`}></div>
                                <div className="absolute top-2 left-3 z-10">
                                    <div className={`text-2xl font-bold ${selectedPlayer.id === player.id ? 'text-white' : 'text-gray-300'}`}>{player.overall}</div>
                                    <div className={`text-xs font-bold ${selectedPlayer.id === player.id ? 'text-primary' : 'text-gray-500'}`}>{player.role}</div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`material-icons-outlined text-6xl ${selectedPlayer.id === player.id ? 'text-gray-700' : 'text-gray-800'}`}>person</span>
                                </div>
                                {/* In a real app we would use player.avatar here too */}
                                <div className="absolute bottom-0 w-full p-3 bg-black/60 backdrop-blur-sm border-t border-white/10">
                                    <div className={`text-center font-bold tracking-widest text-sm ${selectedPlayer.id === player.id ? 'text-white' : 'text-gray-300'}`}>{player.name.toUpperCase()}</div>
                                    <div className="flex justify-between mt-2 text-[10px] text-gray-500 px-2">
                                        <span>{player.stats.mechanics} MC</span>
                                        <span>{player.stats.objectives} OB</span>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete ${player.name}?`)) {
                                            deletePlayer({ deletePlayerInput: { id: player.id } });
                                        }
                                    }}
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100"
                                >
                                    <span className="material-icons-outlined text-xs">close</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Modals */}
            <AddPlayerModal
                isOpen={addPlayerOpen}
                onClose={() => setAddPlayerOpen(false)}
                onAdd={(nickname) => {
                    createPlayer({ createPlayerInput: { nickname, teamId, titleId: "3" } });
                }}
            />
            <ComparePlayersModal
                isOpen={comparePlayersOpen}
                onClose={closeComparePlayers}
                basePlayer={selectedPlayer}
            />

            <EditAttributesModal
                isOpen={editAttributesOpen}
                onClose={closeEditAttributes}
                player={selectedPlayer}
            />
        </div>
    );
};

export default PlayerHub;
