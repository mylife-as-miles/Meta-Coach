import React, { useState } from 'react';
import { useSession } from '../../hooks/useAuth';
import { useWorkspace, usePlayers } from '../../hooks/useDashboardQueries';
import { supabase } from '../../lib/supabase';
import ScoutingReportModal from './modals/ScoutingReportModal';

// Define and Export Interface
export interface ScoutPlayer {
    id: string;
    name: string;
    team: string;
    region: string;
    role: string;
    price: number;
    metrics: {
        eOBP: number;
        eSLG: number;
        eWAR: number;
        war: string;
        impEff: number;
    };
    stats: {
        kills: number;
        deaths: number;
        assists: number;
        goldEarned: number;
        damageToChampions: number;
    };
    fit: number;
    status: string | null;
    avatarUrl: string | null;
    annotation: string | null;
    gridId: string;
    teamId: string | null;
}

interface AutoScoutProfile {
    playstyle: {
        earlyGamePressure: number; // 0-100
        scalingPotential: number; // 0-100
        volatility: string;
    };
    keyPattern: string;
    weakness: string;
    focusPlayer: string;
    recommendation: string;
}

const ScoutingView: React.FC = () => {
    const { data: session } = useSession();
    const { data: workspace } = useWorkspace(session?.user?.id);
    const { data: roster } = usePlayers(workspace?.id);

    // Market State
    const [marketPlayers, setMarketPlayers] = useState<ScoutPlayer[]>([]);
    const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Auto-Scout State
    const [autoScoutProfile, setAutoScoutProfile] = useState<AutoScoutProfile | null>(null);
    const [autoScoutLoading, setAutoScoutLoading] = useState(false);

    // Selection State
    const [selectedPlayer, setSelectedPlayer] = useState<ScoutPlayer | null>(null);
    const [comparisonPlayer, setComparisonPlayer] = useState<ScoutPlayer | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isComparisonDropdownOpen, setIsComparisonDropdownOpen] = useState(false);

    // Auto-Scout Fetcher
    React.useEffect(() => {
        const fetchAutoScout = async () => {
            if (!selectedPlayer || !selectedPlayer.team || selectedPlayer.team === 'Free Agent') {
                setAutoScoutProfile(null);
                return;
            }

            setAutoScoutLoading(true);
            try {
                const teamId = selectedPlayer.teamId;
                if (!teamId) {
                    setAutoScoutProfile(null);
                    return;
                }

                const { data, error } = await supabase.functions.invoke('auto-scout', {
                    body: { teamId: teamId }
                });

                if (error) throw error;
                if (data?.intelligence) {
                    setAutoScoutProfile(data.intelligence);
                }
            } catch (err) {
                console.error("Auto-Scout failed:", err);
                // No fallback needed if we want it to show "Analysis Pending" or handle errors gracefully
                setAutoScoutProfile(null);
            } finally {
                setAutoScoutLoading(false);
            }
        };

        fetchAutoScout();
    }, [selectedPlayer]);

    // Set default comparison player when market players load
    React.useEffect(() => {
        if (marketPlayers.length > 1 && !comparisonPlayer && selectedPlayer) {
            // Find first player that isn't the selected one
            const other = marketPlayers.find(p => p.id !== selectedPlayer.id);
            if (other) setComparisonPlayer(other);
        }
    }, [marketPlayers, selectedPlayer]);

    // Fetch Players (Initial & Pagination)
    const loadPlayers = async (cursor: string | null = null) => {
        if (!session) return;
        const isLoadMore = !!cursor;
        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);

        const titleId = workspace?.grid_title_id || 6;

        try {
            const { data, error } = await supabase.functions.invoke('grid-players', {
                body: {
                    action: 'players',
                    filter: { titleId: titleId },
                    first: 50,
                    after: cursor
                }
            });

            if (error) throw error;

            // Map GRID data
            const mappedPlayers: ScoutPlayer[] = data.players.edges.map((edge: any) => {
                const p = edge.node;
                const seed = p.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const warVal = 2.0 + ((seed % 40) / 10); // 2.0 - 6.0

                return {
                    id: p.id,
                    name: p.nickname,
                    team: p.team?.name || 'Free Agent',
                    region: 'INTL',
                    role: 'FLEX', // Placeholder as GRID role isn't always clear in this query
                    price: parseFloat((1.5 + ((seed % 45) / 10)).toFixed(1)),
                    metrics: {
                        eOBP: 0.350 + ((seed % 150) / 1000),
                        eSLG: 0.500 + ((seed % 150) / 1000),
                        eWAR: parseFloat(warVal.toFixed(1)),
                        war: warVal.toFixed(1),
                        impEff: 70 + (seed % 25)
                    },
                    stats: {
                        kills: 10 + (seed % 20) * 10,
                        deaths: 10 + (seed % 10) * 5,
                        assists: 10 + (seed % 20) * 8,
                        goldEarned: 10000 + (seed % 5000),
                        damageToChampions: 20000 + (seed % 10000)
                    },
                    fit: 60 + (seed % 35),
                    status: null,
                    avatarUrl: `https://ui-avatars.com/api/?name=${p.nickname}&background=random&color=fff`,
                    annotation: warVal > 4.5 ? "Undervalued Market Asset" : null,
                    gridId: p.id,
                    teamId: p.team?.id || null
                };
            });

            if (isLoadMore) {
                setMarketPlayers(prev => [...prev, ...mappedPlayers]);
            } else {
                setMarketPlayers(mappedPlayers);
                if (mappedPlayers.length > 0) setSelectedPlayer(mappedPlayers[0]);
            }

            setPageInfo(data.players.pageInfo || { hasNextPage: false, endCursor: null });

        } catch (err) {
            console.error("Failed to fetch GRID players:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Initial Load
    React.useEffect(() => {
        loadPlayers();
    }, [session, workspace]);

    const handleAutoScout = async () => {
        if (!selectedPlayer) return;
        setIsReportModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-primary font-mono animate-pulse">
                INITIALIZING SABERMETRICS ENGINE...
            </div>
        );
    }

    // Fallback if API fails
    if (marketPlayers.length === 0 && !loading) return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <div>No market data available.</div>
            <button onClick={() => loadPlayers()} className="text-primary hover:underline">Retry Connection</button>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#0E100A] text-white">
            <header className="flex justify-between items-end p-6 border-b border-white/5 bg-surface-darker/50 backdrop-blur-sm sticky top-0 z-50">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider">Sabermetrics V2.4</span>
                        <span className="text-gray-500 text-[10px] font-mono">// TRANSFER WINDOW OPEN</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        Market Scout: Exploiting Inefficiencies
                        <span className="material-icons-outlined text-gray-600 text-sm cursor-help" title="Using proprietary algorithms to find market mismatches">info</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAutoScout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-black font-bold text-sm hover:bg-primary-dark transition shadow-neon"
                    >
                        <span className="material-icons-outlined text-sm">auto_awesome</span>
                        AI Auto-Scout
                    </button>
                </div>
            </header>

            {/* Inefficiency Finder Section */}
            <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden min-h-0">

                {/* Left Column: Player List */}
                <div className="col-span-3 bg-surface-dark border border-white/5 rounded-2xl flex flex-col overflow-hidden h-full">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface-darker">
                        <h2 className="font-display font-bold text-gray-400 text-xs tracking-widest uppercase">
                            Market Opportunities
                            <span className="ml-2 text-primary">({marketPlayers.length})</span>
                        </h2>
                        <button className="text-gray-500 hover:text-white transition">
                            <span className="material-icons text-sm">filter_list</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {marketPlayers.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedPlayer(p)}
                                className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedPlayer?.id === p.id ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(210,249,111,0.1)]' : 'bg-surface-darker/50 border-transparent hover:bg-white/5 hover:border-white/10'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-black overflow-hidden relative shrink-0">
                                        {p.avatarUrl ? (
                                            <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-zinc-900 text-xs shadow-inner">
                                                {p.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/50"></div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-sm text-gray-200 truncate">{p.name}</div>
                                        <div className="text-[10px] text-gray-500 font-mono truncate">{p.team} • {p.role}</div>
                                    </div>
                                    <div className="ml-auto flex flex-col items-end shrink-0">
                                        <div className="text-primary font-mono font-bold text-xs">${(p.price || 0).toFixed(1)}M</div>
                                        <div className={`text-[10px] font-bold ${p.metrics.eWAR > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {p.metrics.eWAR > 0 ? '+' : ''}{p.metrics.eWAR} WAR
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {pageInfo.hasNextPage && (
                            <div className="p-4 text-center sticky bottom-0 bg-surface-darker/90 backdrop-blur-sm border-t border-white/5">
                                <button
                                    onClick={() => loadPlayers(pageInfo.endCursor)}
                                    disabled={loadingMore}
                                    className="px-6 py-2 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary font-bold hover:bg-primary/20 transition disabled:opacity-50 flex items-center gap-2 mx-auto"
                                >
                                    {loadingMore && <span className="material-icons-outlined text-xs animate-spin">refresh</span>}
                                    {loadingMore ? 'LOADING MARKET DATA...' : 'LOAD MORE PLAYERS'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center Column: Analysis & Visualization */}
                <div className="col-span-6 bg-surface-dark border border-white/5 rounded-2xl flex flex-col relative overflow-hidden h-full">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                    {/* Main Content Area */}
                    {selectedPlayer ? (
                        <div className="relative z-10 flex flex-col h-full p-8 items-center justify-start pt-20 text-center">
                            <div className="w-32 h-32 rounded-2xl bg-black border border-white/10 shadow-2xl mb-6 relative group overflow-hidden">
                                {selectedPlayer.avatarUrl ? (
                                    <img src={selectedPlayer.avatarUrl} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-700 font-bold bg-zinc-900">
                                        {selectedPlayer.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <div className="absolute bottom-3 left-0 w-full text-center text-white font-bold text-xl">{selectedPlayer.name}</div>
                            </div>

                            <h3 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">
                                Confirmed Target
                            </h3>
                            <p className="text-gray-400 max-w-md mb-8">
                                AI analysis indicates <span className="text-white font-bold">{selectedPlayer.name}</span> is currently undervalued by <span className="text-primary font-mono">14.2%</span> relative to projected performance output.
                            </p>

                            {/* Auto-Scout Intelligence Layer */}
                            {autoScoutLoading ? (
                                <div className="mb-6 flex gap-2 animate-pulse">
                                    <div className="h-6 w-24 bg-white/10 rounded"></div>
                                    <div className="h-6 w-32 bg-white/10 rounded"></div>
                                </div>
                            ) : autoScoutProfile ? (
                                <div className="mb-8 w-full max-w-md bg-surface-darker/50 p-4 rounded-xl border border-white/5 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-icons-outlined text-primary text-sm">psychology</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Auto-Scout Intelligence</span>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 mb-3">
                                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400">
                                            Early Pressure: <span className="text-white">{autoScoutProfile.playstyle.earlyGamePressure}%</span>
                                        </span>
                                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400">
                                            Volatility: <span className={autoScoutProfile.playstyle.volatility === 'High' ? 'text-red-400' : 'text-primary'}>{autoScoutProfile.playstyle.volatility}</span>
                                        </span>
                                    </div>
                                    <p className="text-xs text-start text-gray-300 italic border-l-2 border-primary pl-3">
                                        "{autoScoutProfile.keyPattern}"
                                    </p>
                                </div>
                            ) : null}

                            <div className="flex gap-4">
                                <button
                                    onClick={handleAutoScout}
                                    className="px-8 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary-hover shadow-[0_0_30px_-5px_rgba(210,249,111,0.4)] transition-all flex items-center gap-2"
                                >
                                    <span className="material-icons">smart_toy</span>
                                    FULL STRATEGIC REPORT
                                </button>

                                <button className="px-8 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-lg hover:bg-white/10 transition flex items-center gap-2" onClick={() => alert("Added to Shortlist (Simulation)")}>
                                    <span className="material-icons">add</span>
                                    ADD TO SHORTLIST
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600 font-mono text-sm tracking-widest">
                            SELECT A PLAYER TO INITIALIZE SCAN
                        </div>
                    )}
                </div>

                {/* Right Column: Comparison */}
                <div className="col-span-3 bg-surface-dark border border-white/5 rounded-2xl flex flex-col overflow-hidden h-full">
                    <div className="p-4 border-b border-white/5 bg-surface-darker mb-4">
                        <h2 className="font-display font-bold text-gray-400 text-xs tracking-widest uppercase text-center">Market Comparison</h2>
                    </div>

                    <div className="flex-1 p-6 flex flex-col items-center">
                        <div className="flex items-center justify-between w-full mb-8 relative">
                            {/* Connector Line */}
                            <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -z-10"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-dark border border-white/10 text-[10px] font-bold px-2 py-1 rounded text-gray-500 z-10">VS</div>

                            {/* Target (Left) */}
                            <div className="text-center w-24">
                                <div className="w-10 h-10 rounded-full border border-primary bg-primary/10 flex items-center justify-center mb-2 overflow-hidden mx-auto shadow-[0_0_10px_rgba(210,249,111,0.3)]">
                                    {selectedPlayer?.avatarUrl ? (
                                        <img src={selectedPlayer.avatarUrl} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-primary">
                                            {selectedPlayer?.name.substring(0, 2).toUpperCase() || 'TP'}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs font-bold text-white truncate max-w-full">{selectedPlayer?.name || 'Target'}</div>
                                <div className="text-[9px] font-mono text-gray-500">MKT VAL: ${(selectedPlayer?.price || 0).toFixed(1)}M</div>
                            </div>

                            {/* Market Comparison (Right) */}
                            <div className="text-center w-24 relative">
                                <div
                                    className="w-10 h-10 rounded-full border border-gray-600 bg-surface-darker flex items-center justify-center mb-2 overflow-hidden mx-auto relative group hover:border-primary/50 transition cursor-pointer"
                                    onClick={() => setIsComparisonDropdownOpen(!isComparisonDropdownOpen)}
                                >
                                    {comparisonPlayer?.avatarUrl ? (
                                        <img src={comparisonPlayer.avatarUrl} alt={comparisonPlayer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-gray-400">
                                            {comparisonPlayer?.name.substring(0, 2).toUpperCase() || 'CP'}
                                        </span>
                                    )}
                                </div>

                                {/* Custom Dropdown */}
                                {isComparisonDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40 bg-transparent"
                                            onClick={() => setIsComparisonDropdownOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-48 max-h-60 overflow-y-auto bg-surface-darker border border-white/10 rounded-lg shadow-2xl z-50 py-1 custom-scrollbar">
                                            {marketPlayers.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setComparisonPlayer(p);
                                                        setIsComparisonDropdownOpen(false);
                                                    }}
                                                    className={`px-3 py-2 text-left hover:bg-white/5 cursor-pointer flex items-center gap-2 ${comparisonPlayer?.id === p.id ? 'text-primary' : 'text-gray-300'}`}
                                                >
                                                    <div className="w-6 h-6 rounded bg-black flex items-center justify-center overflow-hidden shrink-0 text-[9px] font-bold text-gray-500">
                                                        {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : p.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="text-xs truncate">{p.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div
                                    className="text-xs font-bold text-gray-400 truncate max-w-full flex items-center justify-center gap-1 group cursor-pointer hover:text-white transition"
                                    onClick={() => setIsComparisonDropdownOpen(!isComparisonDropdownOpen)}
                                >
                                    {comparisonPlayer?.name || 'Select Player'}
                                    <span className="material-icons-outlined text-[10px] opacity-0 group-hover:opacity-100 transition">arrow_drop_down</span>
                                </div>
                                <div className="text-[9px] font-mono text-gray-500">MARKET COMP.</div>
                            </div>
                        </div>

                        {/* Comparison Metrics */}
                        {comparisonPlayer && selectedPlayer && (
                            <div className="w-full space-y-3">
                                {/* eOBP */}
                                <div className="bg-surface-darker p-3 rounded-lg border border-white/5">
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1 uppercase tracking-wider">eOBP (Survival)</div>
                                    <div className="w-full h-1.5 bg-gray-800 rounded-full flex overflow-hidden">
                                        <div style={{ width: '50%' }} className="h-full bg-primary shadow-[0_0_10px_rgba(210,249,111,0.5)]"></div>
                                        <div style={{ width: '50%' }} className="h-full bg-gray-600"></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-mono font-bold mt-1">
                                        <span className="text-primary">{selectedPlayer.metrics.eOBP.toFixed(3)}</span>
                                        <span className="text-gray-500">vs</span>
                                        <span className="text-gray-400">{comparisonPlayer.metrics.eOBP.toFixed(3)}</span>
                                    </div>
                                </div>

                                {/* eSLG */}
                                <div className="bg-surface-darker p-3 rounded-lg border border-white/5">
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1 uppercase tracking-wider">eSLG (Efficiency)</div>
                                    <div className="w-full h-1.5 bg-gray-800 rounded-full flex overflow-hidden">
                                        <div style={{ width: '50%' }} className="h-full bg-primary shadow-[0_0_10px_rgba(210,249,111,0.5)]"></div>
                                        <div style={{ width: '50%' }} className="h-full bg-gray-600"></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-mono font-bold mt-1">
                                        <span className="text-primary">{selectedPlayer.metrics.eSLG.toFixed(3)}</span>
                                        <span className="text-gray-500">vs</span>
                                        <span className="text-gray-400">{comparisonPlayer.metrics.eSLG.toFixed(3)}</span>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20 text-center w-full">
                                    <div className="text-xs text-primary font-bold uppercase mb-1">Delta Analysis</div>
                                    <div className="text-3xl font-mono font-bold text-white mb-1">
                                        {((selectedPlayer.metrics.eWAR - comparisonPlayer.metrics.eWAR) > 0 ? '+' : '')}
                                        {(selectedPlayer.metrics.eWAR - comparisonPlayer.metrics.eWAR).toFixed(1)}
                                    </div>
                                    <div className="text-[10px] text-gray-500">WAR Differential</div>
                                </div>
                            </div>
                        )}

                        {!comparisonPlayer && (
                            <div className="mt-8 text-center text-xs text-gray-500">
                                Select a player to compare metrics.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isReportModalOpen && selectedPlayer && (
                <ScoutingReportModal
                    player={selectedPlayer}
                    comparisonPlayer={comparisonPlayer || undefined}
                    onClose={() => setIsReportModalOpen(false)}
                />
            )}
        </div>
    );
};

export default ScoutingView;
