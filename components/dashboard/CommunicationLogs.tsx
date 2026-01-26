import React from 'react';

const CommunicationLogs: React.FC = () => {
    return (
        <div className="flex flex-col gap-6 mb-10">
            <style>{`
                .grid-bg {
                    background-color: #0E100A;
                    background-image: 
                        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Notifications</h1>
                    <p className="text-gray-400 text-sm">Archive of all AI alerts, tactical shifts, and system notifications.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-surface-dark border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-primary/50 transition flex items-center gap-2 cursor-pointer">
                        <span className="material-icons-outlined text-sm">file_download</span>
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-surface-dark p-2.5 rounded-xl border border-white/5 shadow-lg">
                <div className="relative flex-grow md:flex-grow-0 md:w-80">
                    <span className="material-icons-outlined absolute left-3 top-2.5 text-gray-500 text-lg">search</span>
                    <input className="w-full bg-[#0E100A] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-primary focus:ring-0 placeholder-gray-600 transition h-10" placeholder="Search by keyword..." type="text" />
                </div>
                <div className="w-px h-8 bg-white/10 hidden md:block mx-2"></div>
                <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0E100A] border border-white/10 text-gray-300 text-sm hover:border-primary/50 hover:text-white transition whitespace-nowrap h-10 group cursor-pointer">
                        <span className="material-icons-outlined text-sm text-gray-500 group-hover:text-primary transition">category</span>
                        Alert Type: All
                        <span className="material-icons-outlined text-sm ml-1 text-gray-500">expand_more</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0E100A] border border-white/10 text-gray-300 text-sm hover:border-primary/50 hover:text-white transition whitespace-nowrap h-10 group cursor-pointer">
                        <span className="material-icons-outlined text-sm text-gray-500 group-hover:text-primary transition">warning</span>
                        Severity: All
                        <span className="material-icons-outlined text-sm ml-1 text-gray-500">expand_more</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0E100A] border border-white/10 text-gray-300 text-sm hover:border-primary/50 hover:text-white transition whitespace-nowrap h-10 group cursor-pointer">
                        <span className="material-icons-outlined text-sm text-gray-500 group-hover:text-primary transition">calendar_today</span>
                        Date: Last 30 Days
                        <span className="material-icons-outlined text-sm ml-1 text-gray-500">expand_more</span>
                    </button>
                </div>
                <div className="flex-1 hidden lg:block"></div>
                <button className="text-gray-500 hover:text-primary text-xs font-medium transition px-4 ml-auto lg:ml-0 cursor-pointer">Clear Filters</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Today</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    {/* Critical Alert */}
                    <div className="group bg-surface-dark border border-white/5 hover:border-red-500/30 rounded-xl p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] flex flex-col md:flex-row gap-5 items-start relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-1">
                            <span className="material-icons-outlined text-red-500">priority_high</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="font-bold text-white text-lg">Critical Objective Lost</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider">Critical</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-400 border border-white/5 uppercase tracking-wider font-mono">Macro Event</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-3">
                                Opponent secured Baron Nashor due to vision lapse in top-side river. Recommended immediate defensive formation at inhibitor turrets. AI analysis indicates 85% probability of bottom lane push.
                            </p>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 shrink-0 ml-auto md:ml-0 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-start border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                            <span className="text-xs font-mono text-gray-500">12 mins ago</span>
                            <button className="flex items-center gap-1 text-xs font-bold text-primary hover:text-white transition group/btn border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/10 cursor-pointer">
                                View Context
                                <span className="material-icons-outlined text-[14px] transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    {/* Warning Alert */}
                    <div className="group bg-surface-dark border border-white/5 hover:border-yellow-500/30 rounded-xl p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] flex flex-col md:flex-row gap-5 items-start relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                        <div className="w-12 h-12 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 mt-1">
                            <span className="material-icons-outlined text-yellow-500">warning</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="font-bold text-white text-lg">Micro-Mistake Detected</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-wider">Warning</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-400 border border-white/5 uppercase tracking-wider font-mono">Player: Blaber</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-3">
                                Inefficient jungle pathing detected during second clear. Delayed arrival to mid-lane counter-gank by 4 seconds. Potential gold loss estimated at 350g.
                            </p>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 shrink-0 ml-auto md:ml-0 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-start border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                            <span className="text-xs font-mono text-gray-500">45 mins ago</span>
                            <button className="flex items-center gap-1 text-xs font-bold text-primary hover:text-white transition group/btn border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/10 cursor-pointer">
                                View Context
                                <span className="material-icons-outlined text-[14px] transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="group bg-surface-dark border border-white/5 hover:border-primary/30 rounded-xl p-5 transition-all duration-300 hover:shadow-glow flex flex-col md:flex-row gap-5 items-start relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                            <span className="material-icons-outlined text-blue-400">tips_and_updates</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="font-bold text-white text-lg">Strategy Optimization</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">Info</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-400 border border-white/5 uppercase tracking-wider font-mono">Tactical</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-3">
                                New itemization route available for Lucian against heavy tank compositions. Win rate projection increases by 4.2% with Lord Dominik's Regards as third item.
                            </p>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 shrink-0 ml-auto md:ml-0 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-start border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                            <span className="text-xs font-mono text-gray-500">2 hours ago</span>
                            <button className="flex items-center gap-1 text-xs font-bold text-primary hover:text-white transition group/btn border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/10 cursor-pointer">
                                View Context
                                <span className="material-icons-outlined text-[14px] transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-2 mt-4">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Yesterday</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    {/* Yesterday Alert */}
                    <div className="group bg-surface-dark border border-white/5 hover:border-primary/30 rounded-xl p-5 transition-all duration-300 hover:shadow-glow flex flex-col md:flex-row gap-5 items-start relative overflow-hidden opacity-80 hover:opacity-100">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-neon"></div>
                        <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                            <span className="material-icons-outlined text-primary">bolt</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="font-bold text-white text-lg">Tempo Advantage Gained</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/20 uppercase tracking-wider">Success</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-400 border border-white/5 uppercase tracking-wider font-mono">Macro</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-3">
                                Team successfully utilized Herald push mid to open map. Vision control extended into enemy jungle quadrants.
                            </p>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 shrink-0 ml-auto md:ml-0 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-start border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                            <span className="text-xs font-mono text-gray-500">14:20 PM</span>
                            <button className="flex items-center gap-1 text-xs font-bold text-primary hover:text-white transition group/btn border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/10 cursor-pointer">
                                View Context
                                <span className="material-icons-outlined text-[14px] transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    <button className="w-full py-4 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 hover:text-white transition font-medium mt-2 cursor-pointer">
                        Load Older Notifications
                    </button>
                </div>

                {/* Sidebar Stats */}
                <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
                    <div className="bg-surface-dark border border-white/5 rounded-xl p-6 relative overflow-hidden shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white text-sm uppercase tracking-wide">Alert Frequency</h3>
                            <div className="flex items-center gap-1 bg-black/20 rounded px-2 py-1 border border-white/5">
                                <span className="text-[10px] text-gray-400">Weekly</span>
                                <span className="material-icons-outlined text-[10px] text-gray-400">expand_more</span>
                            </div>
                        </div>
                        <div className="flex items-end justify-between h-32 w-full gap-2 pt-4 border-b border-white/5 pb-2">
                            <div className="w-full bg-white/5 rounded-t-sm hover:bg-white/10 transition relative group h-[40%] flex flex-col justify-end"></div>
                            <div className="w-full bg-white/5 rounded-t-sm hover:bg-white/10 transition relative group h-[60%] flex flex-col justify-end"></div>
                            <div className="w-full bg-white/5 rounded-t-sm hover:bg-white/10 transition relative group h-[30%] flex flex-col justify-end"></div>
                            <div className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/30 transition relative group h-[85%] border-t border-x border-primary/30 shadow-[0_0_10px_rgba(210,249,111,0.1)] flex flex-col justify-end">
                                <div className="w-full text-center text-[9px] font-bold text-primary mb-1 opacity-0 group-hover:opacity-100 transition absolute -top-5 left-0">45</div>
                            </div>
                            <div className="w-full bg-white/5 rounded-t-sm hover:bg-white/10 transition relative group h-[50%] flex flex-col justify-end"></div>
                            <div className="w-full bg-white/5 rounded-t-sm hover:bg-white/10 transition relative group h-[70%] flex flex-col justify-end"></div>
                            <div className="w-full bg-white/5 rounded-t-sm hover:bg-white/10 transition relative group h-[45%] flex flex-col justify-end"></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-2 uppercase px-0.5">
                            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                        </div>
                    </div>

                    <div className="bg-surface-dark border border-white/5 rounded-xl p-6 shadow-lg">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-5">Top Recurring Issues</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-darker hover:bg-white/5 transition border border-white/5 cursor-pointer group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="material-icons-outlined text-red-500 text-sm">repeat</span>
                                    <div className="flex flex-col truncate">
                                        <span className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">Early Game Pathing</span>
                                        <span className="text-[10px] text-gray-500 truncate">Jungle • Blaber</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/10 whitespace-nowrap">5x</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-darker hover:bg-white/5 transition border border-white/5 cursor-pointer group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="material-icons-outlined text-yellow-500 text-sm">visibility_off</span>
                                    <div className="flex flex-col truncate">
                                        <span className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">Vision Gaps (Top)</span>
                                        <span className="text-[10px] text-gray-500 truncate">Macro • Team</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/10 whitespace-nowrap">3x</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-darker hover:bg-white/5 transition border border-white/5 cursor-pointer group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="material-icons-outlined text-blue-500 text-sm">trending_down</span>
                                    <div className="flex flex-col truncate">
                                        <span className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">CS Deficit @ 10min</span>
                                        <span className="text-[10px] text-gray-500 truncate">Micro • Jojopyun</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10 whitespace-nowrap">3x</span>
                            </div>
                        </div>
                        <button className="w-full mt-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer">
                            Full Analysis Report
                        </button>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-primary/30 p-6 bg-gradient-to-br from-surface-dark to-black group cursor-pointer">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center mb-3 text-primary shadow-neon">
                                <span className="material-icons-outlined text-sm">auto_awesome</span>
                            </div>
                            <h3 className="font-bold text-white mb-1">AI Insights Ready</h3>
                            <p className="text-xs text-gray-400 mb-4">A new weekly performance summary is available for review based on these logs.</p>
                            <button className="text-xs font-bold text-black bg-primary px-4 py-2 rounded shadow-neon hover:bg-primary-dark transition w-full cursor-pointer">
                                Generate Summary
                            </button>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default CommunicationLogs;
