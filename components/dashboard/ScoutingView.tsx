import React, { useState } from 'react';
import { useSession } from '../../hooks/useAuth';
import { useWorkspace, usePlayers } from '../../hooks/useDashboardQueries';
import { supabase } from '../../lib/supabase';

const ScoutingView: React.FC = () => {
    const { data: session } = useSession();
    const { data: workspace } = useWorkspace(session?.user?.id);
    const { data: roster } = usePlayers(workspace?.id);

    // Market State
    const [marketPlayers, setMarketPlayers] = useState<any[]>([]);
    const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Selection State
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
    const [comparisonPlayer, setComparisonPlayer] = useState<any>(null);

    // Analysis State
    const [analyzing, setAnalyzing] = useState(false);
    const [scoutReport, setScoutReport] = useState<string | null>(null);

    // Set default comparison player when roster loads
    React.useEffect(() => {
        if (roster && roster.length > 0 && !comparisonPlayer) {
            setComparisonPlayer(roster[0]);
        }
    }, [roster]);

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
                    first: 50, // Increased limit per user request
                    after: cursor
                }
            });

            if (error) throw error;

            // Map GRID data
            const mappedPlayers = data.players.edges.map((edge: any, index: number) => {
                const p = edge.node;
                const seed = p.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const war = 2.0 + ((seed % 40) / 10); // 2.0 - 6.0

                return {
                    id: p.id,
                    name: p.nickname,
                    team: p.team?.name || 'Free Agent',
                    region: 'INTL',
                    role: 'FLEX',
                    price: (1.5 + ((seed % 45) / 10)).toFixed(1), // $1.5M - $6.0M
                    metrics: {
                        eOBP: 0.350 + ((seed % 150) / 1000),
                        eSLG: 0.500 + ((seed % 150) / 1000),
                        war: war.toFixed(1),
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
                    img: `https://ui-avatars.com/api/?name=${p.nickname}&background=random&color=fff`,
                    annotation: war > 4.5 ? "Undervalued Market Asset" : null,
                    gridId: p.id
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
        setAnalyzing(true);
        setScoutReport(null);

        try {
            const { data, error } = await supabase.functions.invoke('scouting-report', {
                body: { player: selectedPlayer }
            });

            if (error) throw error;
            if (data?.report) {
                setScoutReport(data.report);
            }
        } catch (err) {
            console.error("Auto-Scout failed:", err);
            setScoutReport("AI Analysis unavailable. Check connection.");
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-primary font-mono animate-pulse">
                INITIALIZING SABERMETRICS ENGINE...
            </div>
        );
    }

    // Fallback if API fails
    if (marketPlayers.length === 0) return <div>No market data available.</div>;

    return (
        <div className="w-full max-w-[1800px] mx-auto min-h-[calc(100vh-80px)]">
            <header className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider">Sabermetrics V2.4</span>
                        <span className="text-gray-500 text-[10px] font-mono">// TRANSFER WINDOW OPEN</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        Market Scout: Exploiting Inefficiencies
                        <span className="material-icons-outlined text-gray-600 cursor-help" title="Using proprietary algorithms to find market mismatches">info</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                        Identify undervalued talent using proprietary metrics (eOBP, WAR). Optimize budget allocation by targeting high-impact, low-cost assets.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-surface-dark border border-white/10 rounded-lg flex items-center p-1">
                        <span className="material-icons-outlined text-gray-500 ml-2 text-sm">filter_list</span>
                        <select className="bg-transparent border-none text-xs text-white focus:ring-0 cursor-pointer py-1.5 focus:outline-none">
                            <option>Region: Global</option>
                            <option>Region: NA</option>
                            <option>Region: KR</option>
                        </select>
                    </div>
                    <button
                        onClick={handleAutoScout}
                        disabled={analyzing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-black font-bold text-sm hover:bg-primary-dark transition shadow-neon disabled:opacity-50"
                    >
                        {analyzing ? (
                            <span className="material-icons-outlined text-sm animate-spin">refresh</span>
                        ) : (
                            <span className="material-icons-outlined text-sm">auto_awesome</span>
                        )}
                        {analyzing ? "Analyzing..." : "AI Auto-Scout"}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Left Column: Inefficiency Finder */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-surface-dark rounded-xl border border-white/5 shadow-lg flex flex-col h-[500px]">
                        <div className="p-5 border-b border-white/5 flex justify-between items-start">
                            <div>
                                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">troubleshoot</span>
                                    Inefficiency Finder
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-1 font-mono">PRICE vs. IMPACT SCATTER</p>
                            </div>
                        </div>
                        <div className="p-4 flex-1 relative">
                            {/* Scatter Plot Simulation */}
                            <div className="w-full h-48 border-l border-b border-white/10 relative mb-4">
                                <div className="absolute -left-6 top-1/2 -rotate-90 text-[9px] text-gray-500 font-mono tracking-widest origin-center whitespace-nowrap">IMPACT SCORE (WAR)</div>
                                <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-mono tracking-widest">MARKET PRICE ($)</div>

                                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-primary/5 border border-primary/10 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-primary/50">UNDERVALUED</span>
                                </div>

                                {/* Plot Points for Players */}
                                {marketPlayers.map(player => (
                                    <div
                                        key={player.id}
                                        onClick={() => setSelectedPlayer(player)}
                                        className={`absolute w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform ${selectedPlayer?.id === player.id ? 'bg-primary border border-white shadow-neon z-20 scale-125' : 'bg-gray-400 opacity-60 hover:opacity-100 hover:bg-white'}`}
                                        style={{
                                            // Simple mapping: Price (Y) high=top, WAR (X) high=right
                                            // Normalized: Price 1.5M-6M -> 0-100%, WAR 2.0-6.0 -> 0-100%
                                            bottom: `${((parseFloat(player.price) - 1.5) / 4.5) * 100}%`,
                                            left: `${((parseFloat(player.metrics.war) - 2.0) / 4.0) * 100}%`
                                        }}
                                        title={`${player.name} ($${player.price}M, WAR ${player.metrics.war})`}
                                    />
                                ))}
                            </div>

                            {/* Contextual Info for Selected */}
                            <div className="space-y-3 mt-6">
                                <div className="flex items-start gap-3 p-3 rounded bg-surface-lighter border border-primary/20 relative group">
                                    <div className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-primary"></div>
                                    <img alt="Player" className="w-8 h-8 rounded bg-black object-cover opacity-80" src={selectedPlayer?.img} />
                                    <div>
                                        <div className="flex justify-between w-full items-center">
                                            <h4 className="text-xs font-bold text-white">{selectedPlayer?.name}</h4>
                                            <span className="text-[10px] font-mono text-primary bg-primary/10 px-1 rounded">{selectedPlayer?.fit}% FIT</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                                            {selectedPlayer?.annotation || "Selected for analysis."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Market Trends */}
                    <div className="bg-surface-dark rounded-xl border border-white/5 p-4">
                        <h4 className="text-[11px] font-mono text-gray-400 mb-3 uppercase">Market Trends</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-2xl font-mono text-white font-bold">12.4</div>
                                <div className="text-[10px] text-gray-500">Avg eOBP (ADC)</div>
                            </div>
                            <div>
                                <div className="text-2xl font-mono text-red-400 font-bold">-4%</div>
                                <div className="text-[10px] text-gray-500">Salary Cap Inflation</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Column: Market Grid */}
                <div className="lg:col-span-6 flex flex-col h-full">
                    <div className="bg-surface-dark rounded-xl border border-white/5 shadow-lg flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar items-center">
                            <button className="px-3 py-1.5 rounded-md bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition whitespace-nowrap">All Roles</button>
                            <button className="px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-medium transition whitespace-nowrap">ADC (Focus)</button>
                        </div>

                        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-surface-darker border-b border-white/5 text-[10px] font-mono text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                            <div className="col-span-4 pl-2">Athlete / Team</div>
                            <div className="col-span-2 text-right">Price (M)</div>
                            <div className="col-span-1 text-center text-white font-bold">eOBP</div>
                            <div className="col-span-1 text-center">eSLG</div>
                            <div className="col-span-1 text-center text-primary font-bold">WAR</div>
                            <div className="col-span-2 text-center">Imp. Eff.</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                            {marketPlayers.map(player => (
                                <div
                                    key={player.id}
                                    onClick={() => setSelectedPlayer(player)}
                                    className={`group data-row grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/5 items-center hover:bg-white/5 transition relative cursor-pointer ${selectedPlayer?.id === player.id ? 'bg-white/5' : ''}`}
                                >
                                    {selectedPlayer?.id === player.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary"></div>
                                    )}
                                    <div className="col-span-4 flex items-center gap-3 pl-2">
                                        <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">{player.name[0]}</div>
                                        <div>
                                            <div className={`text-sm font-bold transition ${selectedPlayer?.id === player.id ? 'text-primary' : 'text-white group-hover:text-primary'}`}>{player.name}</div>
                                            <div className="text-[10px] text-gray-500">{player.team} · {player.region} · <span className="text-primary">{player.role}</span></div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right font-mono text-xs text-white">${player.price}M</div>
                                    <div className="col-span-1 text-center font-mono text-xs text-primary font-bold bg-primary/5 rounded py-1">{player.metrics.eOBP.toFixed(3).substring(1)}</div>
                                    <div className="col-span-1 text-center font-mono text-xs text-gray-400">{player.metrics.eSLG.toFixed(3).substring(1)}</div>
                                    <div className="col-span-1 text-center font-mono text-xs text-white font-bold">{player.metrics.war}</div>
                                    <div className="col-span-2 text-center">
                                        <div className="w-full bg-gray-800 h-1.5 rounded-full mt-1">
                                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${player.metrics.impEff}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <span className={`material-icons-outlined text-sm ${selectedPlayer?.id === player.id ? 'text-white' : 'text-gray-600'}`}>visibility</span>
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
                </div>

                {/* Right Column: Roster Comparison */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-surface-dark rounded-xl border border-white/5 shadow-lg flex-1 p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <span className="material-icons-outlined text-6xl">compare_arrows</span>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-6 flex items-center gap-2 relative z-10">
                            <span className="material-symbols-outlined text-primary text-sm">radar</span>
                            Roster Comparison
                        </h3>

                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="text-center w-24">
                                <div className="w-12 h-12 rounded-full border-2 border-primary bg-surface-darker flex items-center justify-center mb-2 overflow-hidden mx-auto shadow-[0_0_15px_rgba(210,249,111,0.2)]">
                                    <img className="w-full h-full object-cover" src={selectedPlayer?.img} alt={selectedPlayer?.name} />
                                </div>
                                <div className="text-xs font-bold text-white truncate max-w-full">{selectedPlayer?.name}</div>
                                <div className="text-[9px] font-mono text-primary">SCOUTED</div>
                            </div>
                            <div className="text-xs font-mono text-gray-500">VS</div>
                            <div className="text-center w-24 relative">
                                <div className="w-10 h-10 rounded-full border border-gray-600 bg-surface-darker flex items-center justify-center mb-2 overflow-hidden mx-auto relative group hover:border-primary/50 transition cursor-pointer">
                                    {comparisonPlayer?.avatar ? (
                                        <img src={comparisonPlayer.avatar} alt={comparisonPlayer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-icons text-xl text-gray-400">person</span>
                                    )}

                                    {/* Invisible Select Overlay */}
                                    {roster && roster.length > 0 && (
                                        <select
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                            onChange={(e) => {
                                                const p = roster.find(r => r.id === e.target.value);
                                                if (p) setComparisonPlayer(p);
                                            }}
                                            value={comparisonPlayer?.id || ''}
                                        >
                                            {roster.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="text-xs font-bold text-gray-400 truncate max-w-full flex items-center justify-center gap-1 group">
                                    {comparisonPlayer?.name || 'Select Roster'}
                                    <span className="material-icons-outlined text-[10px] opacity-0 group-hover:opacity-100 transition">arrow_drop_down</span>
                                </div>
                                <div className="text-[9px] font-mono text-gray-500">ROSTER SELECT</div>
                            </div>
                        </div>

                        <div className="relative w-full aspect-square mb-6">
                            {/* Static Radar for demo, could be dynamic with chart.js in future */}
                            <svg className="w-full h-full text-gray-700" viewBox="0 0 100 100">
                                <polygon fill="none" opacity="0.2" points="50,10 90,30 90,70 50,90 10,70 10,30" stroke="currentColor" strokeWidth="0.5"></polygon>
                                <polygon fill="none" opacity="0.2" points="50,25 75,37.5 75,62.5 50,75 25,62.5 25,37.5" stroke="currentColor" strokeWidth="0.5"></polygon>
                                <polygon className="drop-shadow-[0_0_8px_rgba(210,249,111,0.5)]" fill="rgba(210, 249, 111, 0.2)" points="50,12 85,32 80,68 50,85 20,65 15,35" stroke="#D2F96F" strokeWidth="2"></polygon>
                                <polygon fill="rgba(255, 255, 255, 0.05)" points="50,30 70,40 65,65 50,70 30,60 25,45" stroke="#666" strokeDasharray="2 2" strokeWidth="1.5"></polygon>
                            </svg>
                        </div>

                        <div className="bg-surface-darker rounded border border-white/5 p-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Projected Analysis</span>
                                <span className="text-sm font-bold text-primary font-mono">
                                    {analyzing ? '...' : (scoutReport ? 'AI Report' : `+${(selectedPlayer?.metrics?.war * 2.5).toFixed(1)} WAR`)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-800 h-1 rounded-full mb-2">
                                <div className="bg-primary h-1 rounded-full shadow-neon" style={{ width: `${selectedPlayer?.fit}%` }}></div>
                            </div>
                            <p className="text-[10px] text-gray-500 italic leading-relaxed h-20 overflow-y-auto custom-scrollbar">
                                {analyzing ? (
                                    <span className="animate-pulse">Generating scouting report with Gemini...</span>
                                ) : scoutReport ? (
                                    <span className="text-white">{scoutReport}</span>
                                ) : (
                                    `"${selectedPlayer?.name} provides a significant upgrade in eOBP over the current roster option."`
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Shortlist */}
                    <section className="mt-8 border-t border-white/5 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-neon"></span>
                                Active Shortlist
                            </h3>
                            <button className="text-xs text-primary hover:text-white transition">View All</button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {marketPlayers.filter(p => p.status).map(player => (
                                <div key={player.id} className="bg-surface-dark border border-white/5 rounded-lg p-3 flex items-center gap-3 hover:border-primary/30 transition cursor-pointer group" onClick={() => setSelectedPlayer(player)}>
                                    <img className="w-10 h-10 rounded bg-black object-cover" src={player.img} alt={player.name} />
                                    <div>
                                        <div className="text-sm font-bold text-white group-hover:text-primary transition">{player.name}</div>
                                        <div className="text-[10px] text-gray-500">Negotiation: <span className={player.status === 'In Progress' ? 'text-yellow-500' : 'text-gray-400'}>{player.status}</span></div>
                                    </div>
                                </div>
                            ))}
                            <div className="border border-dashed border-white/10 rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-white/5 transition cursor-pointer text-gray-500 hover:text-white">
                                <span className="material-icons-outlined text-sm">add</span>
                                <span className="text-xs font-medium">Add to Shortlist</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ScoutingView;
