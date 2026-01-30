import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDashboardStore } from '../../stores/useDashboardStore';
import { useSession } from '../../hooks/useAuth';
import { useWorkspace, usePlayers, useMatches, useTeamProfile } from '../../hooks/useDashboardQueries';
import StrategyBriefModal from './modals/StrategyBriefModal';

const DashboardOverview: React.FC = () => {
    const navigate = useNavigate();

    // UI State from Zustand
    const strategyBriefOpen = useDashboardStore((state) => state.strategyBriefOpen);
    const openStrategyBrief = useDashboardStore((state) => state.openStrategyBrief);
    const closeStrategyBrief = useDashboardStore((state) => state.closeStrategyBrief);

    // Server Data from TanStack Query
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { data: workspace } = useWorkspace(userId);
    const { data: allPlayers = [], isLoading: isPlayersLoading } = usePlayers(workspace?.id);
    const { data: teamProfile } = useTeamProfile(workspace?.id, workspace?.grid_team_id);
    const { data: allMatches = [], isLoading: isMatchesLoading } = useMatches(workspace?.grid_team_id, teamProfile?.game, teamProfile?.teamName);

    const isLoading = isPlayersLoading || isMatchesLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-white">Live Operations</h1>
                    {/* Dynamic Team Name could go here if added to Context */}
                    <p className="text-gray-400 text-sm">Real-time tactical analysis for your roster</p>
                </div>
                <div className="flex items-center bg-surface-dark rounded-xl p-1 shadow-sm border border-white/10 hover:border-primary/30 transition w-full md:w-auto">
                    <span className="material-icons-outlined text-gray-500 px-3">search</span>
                    <input className="bg-transparent border-none focus:ring-0 text-sm w-full md:w-64 text-white placeholder-gray-500" placeholder="Search strategy database..." type="text" />
                    <div className="flex items-center gap-1 px-2 border-l border-white/10">
                        <span className="text-xs text-gray-500 font-mono px-2">⌘ + K</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[700px]">
                {/* Column 1 (Left) */}
                <div className="lg:col-span-3 flex flex-col gap-6 h-auto lg:h-full">
                    {/* Upcoming Match Card */}
                    <div className="bg-surface-dark rounded-2xl p-6 shadow-glow border border-border-lime flex flex-col justify-between relative overflow-hidden h-[300px] lg:h-1/2 group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <span className="material-icons-outlined text-6xl text-white">emoji_events</span>
                        </div>
                        {(() => {
                            const upcomingMatch = allMatches.find(m => m.result === 'UPCOMING');
                            return upcomingMatch ? (
                                <>
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upcoming Match</span>
                                        <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded shadow-neon">{upcomingMatch.date}</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                            <div className="w-12 h-12 bg-blue-900/20 border border-blue-500/30 rounded-full flex items-center justify-center mb-2 mx-auto overflow-hidden">
                                                {teamProfile?.logoUrl ? (
                                                    <img src={teamProfile.logoUrl} alt={teamProfile.teamName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-blue-400">{teamProfile?.teamName?.substring(0, 2).toUpperCase() || 'YOU'}</span>
                                                )}
                                            </div>
                                            <span className="text-lg font-bold text-white">{teamProfile?.teamName || 'Your Team'}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl text-gray-600 font-light">VS</span>
                                        </div>
                                        <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                            <div className="w-12 h-12 bg-gray-800 border border-white/10 rounded-full flex items-center justify-center mb-2 mx-auto">
                                                <span className="font-bold text-gray-400">{upcomingMatch.opponent?.abbreviation || '?'}</span>
                                            </div>
                                            <span className="text-lg font-bold text-white">{upcomingMatch.opponent?.name || 'TBD'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-6 relative z-10">
                                        <div>
                                            <p className="uppercase tracking-wide opacity-50 text-gray-500">Region</p>
                                            <p className="text-white font-medium">{teamProfile?.region || 'Global'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="uppercase tracking-wide opacity-50 text-gray-500">Format</p>
                                            <p className="text-white font-medium">{upcomingMatch.format || 'Bo1'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={openStrategyBrief}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 relative z-10 hover:shadow-neon hover:text-primary cursor-pointer"
                                    >
                                        <span className="material-icons-outlined text-sm">library_books</span>
                                        View Strategy Brief
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center z-10">
                                    <span className="material-icons-outlined text-4xl text-gray-600 mb-2">event_busy</span>
                                    <span className="text-lg font-bold text-gray-300">No Upcoming Matches</span>
                                    <p className="text-xs text-gray-500 mt-1">Check back later for schedule updates.</p>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Recent Scrims / Matches */}
                    <div className="bg-surface-dark rounded-2xl p-5 shadow-lg border border-white/5 flex-1 flex flex-col overflow-hidden h-[300px] lg:h-1/2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-white">Recent Matches</h3>
                            <Link to="/dashboard/match-history" className="text-xs text-gray-500 hover:text-primary transition">View All</Link>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                            {allMatches.length === 0 ? (
                                <div className="text-center text-gray-500 text-xs py-10">No matches found</div>
                            ) : (
                                allMatches
                                    .filter(match => match.result !== 'UPCOMING')
                                    .slice(0, 3) // Limit to 3 matches
                                    .map(match => (
                                        <div key={match.id} className="bg-surface-darker p-3 rounded-xl border border-white/5 hover:border-primary/20 transition group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-sm text-gray-200 group-hover:text-white">vs {match.opponent.name}</span>
                                                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${match.result === 'WIN' ? 'text-green-400 bg-green-900/20' : match.result === 'LOSS' ? 'text-red-400 bg-red-900/20' : 'text-gray-400 bg-gray-700/20'}`}>
                                                    {match.result} {match.score}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                                    <div className={`h-full w-2/3 shadow-neon ${match.result === 'WIN' ? 'bg-primary' : match.result === 'LOSS' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                                                </div>
                                                <span className="text-[10px] text-gray-500">{match.date}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-gray-500">
                                                <span>{match.duration} Duration</span>
                                                <span>{match.format}</span>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Column 2 (Center) */}
                <div className="lg:col-span-6 flex flex-col gap-6 h-auto lg:h-full">
                    {/* Live Telemetry Map */}
                    <div className="bg-surface-dark rounded-2xl p-0 shadow-glow border border-white/10 relative overflow-hidden h-[400px] lg:h-[60%] group">
                        <div className="absolute inset-0 map-bg opacity-100 z-0"></div>
                        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-neon"></span>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Strategic Projection</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Summoner's Rift • 14.3 Patch • Simulation Mode</p>
                        </div>
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <span className="px-3 py-1 bg-blue-900/60 backdrop-blur-md rounded-md text-[10px] font-bold text-blue-200 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                Baron: {teamProfile?.early_pressure_score || 50}%
                            </span>
                            <span className="px-3 py-1 bg-red-900/60 backdrop-blur-md rounded-md text-[10px] font-bold text-red-200 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                Drake: {teamProfile?.objective_control ? 'High' : 'Low'}
                            </span>
                        </div>
                        <div className="absolute top-[30%] left-[45%] w-24 h-24 bg-primary/10 rounded-full blur-2xl z-0"></div>
                        <div className="absolute bottom-[20%] right-[30%] w-32 h-32 bg-red-500/5 rounded-full blur-2xl z-0"></div>
                        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                            <path d="M 200 150 Q 400 100 600 250" fill="none" filter="drop-shadow(0 0 2px rgba(210, 249, 111, 0.6))" stroke="rgba(210, 249, 111, 0.4)" strokeDasharray="5,5" strokeWidth="2"></path>
                            <circle className="animate-pulse" cx="200" cy="150" fill="#D2F96F" r="4"></circle>
                            <circle className="animate-pulse" cx="600" cy="250" fill="#D2F96F" r="4"></circle>
                            <rect fill="rgba(14, 16, 10, 0.9)" height="24" rx="4" stroke="rgba(210, 249, 111, 0.3)" width="80" x="580" y="220"></rect>
                            <text fill="#E0E0E0" fontFamily="sans-serif" fontSize="10" fontWeight="bold" x="593" y="236">Expected Rotate</text>
                        </svg>
                        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 flex justify-between items-center z-20">
                            <div className="flex flex-col gap-1 w-1/3">
                                <span className="text-[10px] text-gray-400 uppercase">Projected Gold Lead</span>
                                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden flex border border-white/5">
                                    <div className="w-[55%] bg-primary h-full shadow-neon"></div>
                                    <div className="w-[45%] bg-red-500 h-full opacity-60"></div>
                                </div>
                                <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                                    <span className="text-primary">+2.4k</span>
                                    <span className="text-red-400">-2.4k</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded-lg bg-primary text-black text-xs font-bold hover:bg-primary-dark transition shadow-neon">Heatmap</button>
                                <button className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white text-xs font-medium transition">Vision</button>
                                <button className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white text-xs font-medium transition">Jungle</button>
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis List */}
                    <div className="bg-surface-dark rounded-2xl p-5 shadow-lg border border-white/5 flex-1 overflow-hidden h-[300px] lg:h-[40%]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-white">AI Strategic Insights: High-Impact Plays</h3>
                            <div className="flex gap-4 text-xs text-gray-500 font-mono">
                                <span>Time</span>
                                <span>Play</span>
                                <span>Outcome</span>
                                <span>AI Score</span>
                            </div>
                        </div>
                        <div className="space-y-3 overflow-y-auto h-[calc(100%-2rem)] pr-2 custom-scrollbar">
                            {teamProfile?.generated_reasoning ? (
                                <div className="flex items-center p-3 hover:bg-white/5 rounded-xl transition group cursor-pointer border border-transparent hover:border-primary/20">
                                    <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mr-4 relative border border-white/10">
                                        <span className="material-icons text-white opacity-70">psychology</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-bold text-white group-hover:text-primary transition">Strategic Analysis</span>
                                            <span className="text-xs font-mono text-gray-500">Live</span>
                                        </div>
                                        <div className="text-xs text-gray-400 leading-relaxed">
                                            {teamProfile.generated_reasoning.substring(0, 120)}...
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 text-xs py-10">
                                    Run a strategy simulation to generate insights.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Column 3 (Right) - Active Roster */}
                <div className="lg:col-span-3 h-auto lg:h-full">
                    <div className="bg-surface-dark rounded-2xl p-6 shadow-glow border border-white/5 h-full flex flex-col relative overflow-hidden text-white">
                        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl -translate-y-20"></div>
                        <div className="flex justify-between items-start mb-6 z-10">
                            <h2 className="text-lg font-bold">Active Roster</h2>
                            <span className="material-icons-outlined text-gray-500 hover:text-white transition text-sm cursor-pointer">info</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar relative z-10 pr-2">
                            <div className="absolute top-10 left-0 w-full h-full border-t border-white/5 rounded-full scale-150 pointer-events-none"></div>

                            {allPlayers.map((player) => (
                                <Link
                                    key={player.id}
                                    to={`/dashboard/player-hub?player=${player.id}`}
                                    className="w-full flex items-center justify-between p-2 rounded-lg transition border group bg-surface-darker hover:bg-white/5 border-white/5 hover:border-white/20"
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-8 h-8 rounded bg-gray-800 relative overflow-hidden transition ring-1 ring-white/10 group-hover:ring-white/30">
                                            {player.avatar ? (
                                                <img className="w-full h-full object-cover" src={player.avatar} alt={player.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-700 text-xs font-bold text-gray-300">
                                                    {player.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-200 group-hover:text-white">{player.name}</span>
                                            <span className="text-[9px] uppercase text-gray-500">{player.role}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="w-16 h-1 bg-gray-800 rounded-full mb-1 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${player.synergy >= 90 ? 'bg-primary shadow-neon' :
                                                    player.synergy >= 80 ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]' :
                                                        player.synergy >= 75 ? 'bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]' :
                                                            'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]'
                                                    }`}
                                                style={{ width: `${player.synergy}%` }}
                                            ></div>
                                        </div>
                                        <span className={`text-[9px] font-mono ${player.synergy >= 90 ? 'text-primary font-bold' :
                                            player.synergy >= 80 ? 'text-green-400' :
                                                player.synergy >= 75 ? 'text-yellow-400' :
                                                    'text-orange-400'
                                            }`}>Syn: {player.synergy}%</span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Roster Footer Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-6 z-10">
                            <div className="bg-surface-darker p-2 rounded-lg text-center border border-white/5">
                                <p className="text-[9px] text-gray-400 mb-1 uppercase tracking-wider">Team KDA</p>
                                <p className="text-sm font-bold text-white">4.5</p>
                            </div>
                            <div className="bg-surface-darker p-2 rounded-lg text-center border border-white/5">
                                <p className="text-[9px] text-gray-400 mb-1 uppercase tracking-wider">GPM</p>
                                <p className="text-sm font-bold text-white">1,940</p>
                            </div>
                            <div className="bg-surface-darker p-2 rounded-lg text-center border border-white/5">
                                <p className="text-[9px] text-gray-400 mb-1 uppercase tracking-wider">Control</p>
                                <p className="text-sm font-bold text-white">62%</p>
                            </div>
                        </div>

                        {/* Launch Button */}
                        <div className="mt-auto z-10 flex flex-col gap-3">
                            <div className="flex justify-between items-center text-xs px-1">
                                <span className="text-gray-400">Analysis Status</span>
                                <span className="text-primary animate-pulse font-mono font-bold">READY</span>
                            </div>
                            <button
                                onClick={() => navigate('/dashboard/strategy-lab')}
                                className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-3.5 rounded-xl flex items-center justify-between px-4 transition transform hover:scale-[1.02] shadow-neon cursor-pointer"
                            >
                                <span>Launch Strategy Lab</span>
                                <span className="material-icons-outlined text-sm bg-black/10 p-1 rounded-full">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategy Brief Modal */}
            <StrategyBriefModal
                isOpen={strategyBriefOpen}
                onClose={closeStrategyBrief}
                match={allMatches.find(m => m.result === 'UPCOMING')}
            />
        </div>
    );
};

export default DashboardOverview;
