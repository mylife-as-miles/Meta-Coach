import React from 'react';
import { useDashboardStore } from '../../stores/useDashboardStore';
import { useSession } from '../../hooks/useAuth';
import { useWorkspace, useMatches, useTeamProfile } from '../../hooks/useDashboardQueries';
import MatchDetailModal from './modals/MatchDetailModal';

const MatchHistory: React.FC = () => {
    // UI State from Zustand
    const matchDetailOpen = useDashboardStore((state) => state.matchDetailOpen);
    const selectedMatch = useDashboardStore((state) => state.selectedMatch);
    const openMatchDetail = useDashboardStore((state) => state.openMatchDetail);
    const closeMatchDetail = useDashboardStore((state) => state.closeMatchDetail);

    // Server Data from TanStack Query
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { data: workspace } = useWorkspace(userId);
    const { data: teamProfile } = useTeamProfile(workspace?.id, workspace?.grid_team_id);
    const { data: allMatches = [] } = useMatches(workspace?.grid_team_id, workspace?.grid_title_id, teamProfile?.game, teamProfile?.teamName);

    return (
        <div className="flex flex-col">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white">Strategic Archive</h1>
                    <p className="text-gray-400 text-sm">Review past performance, analyze key turning points, and identify patterns.</p>
                </div>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                    <div className="flex items-center bg-surface-dark rounded-xl px-3 py-2.5 shadow-sm border border-white/10 hover:border-primary/30 transition flex-1 md:w-64">
                        <span className="material-icons-outlined text-gray-500 mr-2 text-lg">search</span>
                        <input className="bg-transparent border-none focus:ring-0 text-sm w-full text-white placeholder-gray-500 p-0 outline-none" placeholder="Search team, champion..." type="text" />
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0">
                        <button className="flex items-center gap-2 bg-surface-dark px-4 py-2.5 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-white hover:border-primary/30 transition whitespace-nowrap cursor-pointer">
                            <span className="material-icons-outlined text-base">videogame_asset</span>
                            Game Mode
                            <span className="material-icons-outlined text-base ml-1">expand_more</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 flex flex-col gap-4">
                    {/* Dynamic Match List */}
                    {allMatches.length === 0 ? (
                        <div className="bg-surface-dark rounded-2xl p-10 border border-white/5 text-center">
                            <span className="material-icons-outlined text-4xl text-gray-600 mb-4">sports_esports</span>
                            <h3 className="text-lg font-bold text-white">No matches found</h3>
                            <p className="text-gray-400 text-sm mt-2">Play some games to see your history here.</p>
                        </div>
                    ) : (
                        allMatches.map(match => (
                            <div key={match.id} className="bg-surface-dark rounded-2xl p-0 border border-white/5 hover:border-primary/30 transition duration-300 shadow-lg group overflow-hidden">
                                <div className="grid grid-cols-12 h-full">
                                    <div className="col-span-12 md:col-span-2 bg-surface-darker p-5 flex flex-row md:flex-col items-center justify-between md:justify-center border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
                                        <div className={`absolute inset-0 hidden md:block ${match.result === 'WIN' ? 'bg-primary/5' : match.result === 'UPCOMING' ? 'bg-blue-500/5' : match.result === 'TBD' ? 'bg-gray-500/5' : 'bg-red-500/5'}`}></div>
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 shadow-neon ${match.result === 'WIN' ? 'bg-primary' : match.result === 'UPCOMING' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : match.result === 'TBD' ? 'bg-gray-500 shadow-[0_0_10px_rgba(107,114,128,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`}></div>
                                        <div className="flex flex-col items-center gap-1 z-10">
                                            <span className={`text-xl md:text-2xl font-bold tracking-widest shadow-neon-text ${match.result === 'WIN' ? 'text-primary drop-shadow-[0_0_8px_rgba(210,249,111,0.5)]' :
                                                match.result === 'UPCOMING' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                                    match.result === 'TBD' ? 'text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.5)]' :
                                                        'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                                }`}>
                                                {match.result === 'UPCOMING' ? 'SOON' : match.result}
                                            </span>
                                            <span className={`text-[10px] uppercase font-mono tracking-wide px-1.5 rounded ${match.result === 'WIN' ? 'text-primary/80 bg-primary/10' :
                                                match.result === 'UPCOMING' ? 'text-blue-400/80 bg-blue-500/10' :
                                                    match.result === 'TBD' ? 'text-gray-400/80 bg-gray-500/10' :
                                                        'text-red-400/80 bg-red-500/10'
                                                }`}>
                                                {match.type || 'Ranked'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end md:items-center mt-0 md:mt-4 gap-0.5 z-10">
                                            <span className="text-xs text-gray-300">{match.date}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{match.duration}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-12 md:col-span-5 p-5 flex items-center justify-center relative">
                                        <div className="flex items-center gap-6 w-full justify-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-14 h-14 rounded-full bg-blue-900/20 border border-blue-500/30 flex items-center justify-center p-2 shadow-[0_0_15px_rgba(59,130,246,0.1)] overflow-hidden">
                                                    {teamProfile?.logoUrl ? (
                                                        <img src={teamProfile.logoUrl} alt={teamProfile.teamName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-blue-400 text-lg">{teamProfile?.teamName?.substring(0, 2).toUpperCase() || 'YOU'}</span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-gray-300">{teamProfile?.teamName || 'Your Team'}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="text-2xl font-bold text-white font-mono bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                                                    {match.score}
                                                </div>
                                                <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{match.format}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={`w-14 h-14 rounded-full border flex items-center justify-center p-2 overflow-hidden ${match.opponent.color === 'red' ? 'bg-red-900/20 border-red-500/30' : 'bg-orange-900/20 border-orange-500/30'}`}>
                                                    {match.opponent.logoUrl ? (
                                                        <img src={match.opponent.logoUrl} alt={match.opponent.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <span className={`font-bold text-lg ${match.opponent.color === 'red' ? 'text-red-400' : 'text-orange-400'}`}>{match.opponent.abbreviation}</span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-gray-300">{match.opponent.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-12 md:col-span-3 p-5 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 bg-white/[0.01]">
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-semibold">AI Performance Summary</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400">Macro Control</span>
                                                <span className={`text-xs font-mono font-bold ${match.performance.macroControl >= 70 ? 'text-primary' : match.performance.macroControl >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {match.performance.macroControl}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full w-[${match.performance.macroControl}%] ${match.performance.macroControl >= 70 ? 'bg-primary shadow-neon' : match.performance.macroControl >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                                    style={{ width: `${match.performance.macroControl}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-xs text-gray-400">Micro Error Rate</span>
                                                <span className={`text-[10px] font-bold px-1.5 rounded ${match.performance.microErrorRate === 'LOW' ? 'text-green-400 bg-green-400/10' :
                                                    match.performance.microErrorRate === 'MED' ? 'text-yellow-400 bg-yellow-400/10' :
                                                        'text-red-400 bg-red-400/10'
                                                    }`}>
                                                    {match.performance.microErrorRate}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-12 md:col-span-2 p-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/5 bg-surface-darker/50">
                                        <button
                                            onClick={() => openMatchDetail(match)}
                                            className="w-full h-full min-h-[40px] flex md:flex-col items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-primary/10 border border-primary/20 hover:border-primary text-primary transition-all group-hover:shadow-neon cursor-pointer"
                                        >
                                            <span className="material-icons-outlined text-xl">analytics</span>
                                            <span className="text-xs font-bold">Analysis</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <div className="flex justify-center mt-4">
                        <button className="px-6 py-2 rounded-full border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:border-primary/30 hover:bg-surface-dark transition cursor-pointer">Load More Matches</button>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Performance Trends */}
                    <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">Performance Trends</h3>
                                <p className="text-xs text-gray-400">Strategic Efficiency (Last 10 Games)</p>
                            </div>
                            <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition cursor-pointer">
                                <span className="material-icons-outlined text-sm">more_horiz</span>
                            </button>
                        </div>
                        <div className="h-40 w-full relative mb-4">
                            <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                                <div className="w-full h-px bg-white"></div>
                                <div className="w-full h-px bg-white"></div>
                                <div className="w-full h-px bg-white"></div>
                                <div className="w-full h-px bg-white"></div>
                                <div className="w-full h-px bg-white"></div>
                            </div>
                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="gradientArea" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#D2F96F', stopOpacity: 0.2 }}></stop>
                                        <stop offset="100%" style={{ stopColor: '#D2F96F', stopOpacity: 0 }}></stop>
                                    </linearGradient>
                                </defs>
                                <path d="M0,70 Q10,65 20,50 T40,45 T60,20 T80,30 T100,10 V100 H0 Z" fill="url(#gradientArea)" stroke="none"></path>
                                <path className="drop-shadow-[0_0_4px_rgba(210,249,111,0.5)]" d="M0,70 Q10,65 20,50 T40,45 T60,20 T80,30 T100,10" fill="none" stroke="#D2F96F" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                                <circle cx="20" cy="50" fill="#1A1C14" r="1.5" stroke="#D2F96F" strokeWidth="1"></circle>
                                <circle cx="40" cy="45" fill="#1A1C14" r="1.5" stroke="#D2F96F" strokeWidth="1"></circle>
                                <circle cx="60" cy="20" fill="#1A1C14" r="1.5" stroke="#D2F96F" strokeWidth="1"></circle>
                                <circle cx="80" cy="30" fill="#1A1C14" r="1.5" stroke="#D2F96F" strokeWidth="1"></circle>
                                <circle className="animate-pulse" cx="100" cy="10" fill="#D2F96F" r="2"></circle>
                            </svg>
                            <div className="absolute -top-2 -right-2 bg-surface-darker border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-primary shadow-neon">
                                94%
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 font-mono mt-2 pt-4 border-t border-white/5">
                            <span>Current Form</span>
                            <span className="text-green-400 flex items-center gap-1">
                                <span className="material-icons-outlined text-xs">trending_up</span>
                                +12.5%
                            </span>
                        </div>
                    </div>

                    {/* Gemini Retrospective */}
                    <div className="bg-gradient-to-br from-surface-dark to-surface-darker rounded-2xl p-0 border border-white/5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <span className="material-symbols-outlined text-6xl text-purple-400">auto_awesome</span>
                        </div>
                        <div className="p-6 pb-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-purple-400 text-lg animate-pulse">auto_awesome</span>
                                <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Gemini Retrospective</h3>
                            </div>
                            <p className="text-xs text-gray-400">AI-detected recurring patterns across last 5 matches.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-3 items-start">
                                <div className="min-w-[4px] h-full min-h-[40px] bg-red-500/50 rounded-full mt-1"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-200 mb-1">Late Game Baron Control</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Team performance drops significantly <span className="text-red-400 font-medium">after 25 minutes</span> during Baron setup phases. Vision control around the pit averages only 42%.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="min-w-[4px] h-full min-h-[40px] bg-primary/50 rounded-full mt-1 shadow-neon"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-200 mb-1">Mid-Jungle Synergy</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Roam timings are highly synchronized. Successful gank conversion rate has increased to <span className="text-primary font-medium">68%</span> when support roams mid.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start opacity-70">
                                <div className="min-w-[4px] h-full min-h-[40px] bg-blue-500/50 rounded-full mt-1"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-200 mb-1">Objective Bounties</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Effective use of bounties to stall games when behind gold &gt; 2k.
                                    </p>
                                </div>
                            </div>
                            <button className="w-full mt-4 py-2.5 rounded-xl border border-purple-500/30 text-xs font-semibold text-purple-300 hover:bg-purple-500/10 transition flex items-center justify-center gap-2 cursor-pointer">
                                Generate Full Report
                                <span className="material-icons-outlined text-xs">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-dark p-4 rounded-xl border border-white/5 text-center">
                            <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Avg Win Duration</span>
                            <span className="text-lg font-bold text-white font-mono">29:14</span>
                        </div>
                        <div className="bg-surface-dark p-4 rounded-xl border border-white/5 text-center">
                            <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">First Blood %</span>
                            <span className="text-lg font-bold text-primary font-mono shadow-neon-text">62%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Match Detail Modal */}
            <MatchDetailModal isOpen={matchDetailOpen} onClose={closeMatchDetail} match={selectedMatch} />
        </div>
    );
};

export default MatchHistory;
