import React from 'react';

const StrategyLab: React.FC = () => {
    return (
        <div className="flex flex-col h-auto lg:h-[calc(100vh-90px)] min-h-[800px]">
            {/* Custom Styles for Map and Animations */}
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

            <div className="grid grid-cols-12 gap-6 h-full">
                {/* Draft Simulator (Left Sidebar) */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                    <div className="flex-1 bg-surface-dark rounded-2xl border border-white/10 p-5 flex flex-col shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-white font-bold flex items-center gap-2">
                                <span className="material-icons-outlined text-primary text-sm">view_week</span>
                                Draft Simulator
                            </h2>
                            <span className="text-[10px] font-mono text-gray-500 border border-white/10 px-2 py-0.5 rounded">PATCH 14.3</span>
                        </div>
                        <div className="bg-surface-darker/50 rounded-xl p-4 border border-white/5 mb-6 relative">
                            <p className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">Draft Advantage</p>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-primary font-mono shadow-neon-text">64.2%</span>
                                <span className="text-xs text-primary mb-1.5">WIN PROB</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-3 flex overflow-hidden">
                                <div className="w-[64%] h-full bg-primary shadow-[0_0_10px_#D2F96F]"></div>
                            </div>
                            <div className="absolute -right-2 top-4 w-16 h-16 opacity-10">
                                <svg className="animate-spin-slow" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" fill="none" r="40" stroke="white" strokeDasharray="10 5" strokeWidth="2"></circle>
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                                    <span>BLUE SIDE (YOU)</span>
                                    <span className="text-blue-400">PICKING...</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 bg-surface-darker p-2 rounded-lg border-l-2 border-blue-500">
                                        <div className="w-8 h-8 bg-gray-800 rounded bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDUv0EoPfymbvrCgDYdsD31bSWrNzEVXCk5wkJoNj1AnnDXlONQkUrYTdVksLJLISnv6X7E0q0CcMQ8kLjZb3iVARUvEPbv34hk9NpdQXP6mtcz7ISM62INTfjeTHjhSeNyHnMHFSsrzqjjTFLszPabgYtWd_VIpQW53MxAJeawFQzNG4tSBL943s4uUZi4IxvbbrSGfhcuReaOevVHAPbqgOdgzNLNBIfsg0I7nyCBNFB6kP_VqaS8shbxZuliL1xLpZC0Z7s-mc8')" }}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">Aatrox</p>
                                            <p className="text-[10px] text-gray-500">Top Lane</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-surface-darker p-2 rounded-lg border-l-2 border-blue-500">
                                        <div className="w-8 h-8 bg-gray-800 rounded bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCf7_StFKf6adKA3b0kBUAG1PbdtJXK1Rgj1n7FwVTKATBkYh6vsB7nLQ-A-g76LfGNX8mx9U4q1FRlrc3Tn1oI1Hz_YLB9jgPN3Kkj4vZlXwDkqCkAchQsCXpZPbYdt7ZXMs_-sveDiSW_tA3xp0r7YfmM_F6DVr4Ex3LDVeAVazboGbpA_2CNxRUZ5rUVTxkqP_KljondHDk1p4e6eVzGM045HTIgJ51qcHOviBpDPuxxXd_OIdiVBw4h7PwwuoTWZWRTmgq3ktg')" }}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">Sejuani</p>
                                            <p className="text-[10px] text-gray-500">Jungle</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-primary/10 p-2 rounded-lg border border-primary/30 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                                        <div className="w-8 h-8 bg-gray-800 rounded border border-primary/50 flex items-center justify-center relative z-10">
                                            <span className="material-icons-outlined text-primary text-sm">add</span>
                                        </div>
                                        <div className="flex-1 relative z-10">
                                            <p className="text-sm font-bold text-primary">Select Mid</p>
                                            <p className="text-[10px] text-primary/70">Recommended: Azir</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-white/5">
                                <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                                    <span>RED SIDE</span>
                                </div>
                                <div className="space-y-2 opacity-80">
                                    <div className="flex items-center gap-3 bg-surface-darker p-2 rounded-lg border-r-2 border-red-500 flex-row-reverse text-right">
                                        <div className="w-8 h-8 bg-gray-800 rounded bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBJiC8BArHHIDzl16eJthLgWl9fHrH2CsL-t88YV3uNzDyR-mh9ACaRhe-pOVgdTYpmVelcOluamicEtsTJDhQgY4CTvEiHb8r74RF5Oy2H3esmhIlBOp69pRQVaNjEMSiQmeHsdiH8yilYWdpqRzSCz1LP_4tRQyNk_4j7G5wOhZBP1XI7AYtcYJ_ZrbOEEFKxbK1YfgBIfBuHiU3LVoOdQ3lUNPKJ07pYNfeveXEUIAJhlsNYBoyip5P4KOogPHH4goPXwMw0yqo')" }}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">K'Sante</p>
                                            <p className="text-[10px] text-gray-500">Top Lane</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-surface-darker p-2 rounded-lg border-r-2 border-red-500 flex-row-reverse text-right">
                                        <div className="w-8 h-8 bg-gray-800 rounded bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDsZzGPfU3RznSje50p5_wX9EQFkRxjHi2qHqevqimExZ9XlHNfn8Uz2kBKlx0flhK8VVsxSp6_UsXzMH-Ayjn1S--jfZGlGRs5HaVqj1M4arE3q5iL6j2qd4SXtHmSGAe4hUnRtwC8rTxFTEfwxE3YfA9ojUAG2Xx6KLZaRlJl3zAv8TW93VuG7WYCF96Lt18_yWYRyt2QSyDQQopAXXSEIewI7Gdh3BJMSU62nczXwEbL_5UmkavKbqNdwfLQSfJEAaIDA8dY-R4')" }}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">Lee Sin</p>
                                            <p className="text-[10px] text-gray-500">Jungle</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex gap-2 items-start">
                                <span className="material-symbols-outlined text-primary text-lg mt-0.5">auto_awesome</span>
                                <div>
                                    <p className="text-xs text-gray-300 leading-snug">
                                        <span className="text-primary font-bold">Counter Pick:</span>
                                        Azir has a <span className="text-white">+4.2%</span> win rate delta against their comp. Prioritize scaling.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Map Simulation (Center) */}
                <section className="col-span-12 lg:col-span-6 flex flex-col gap-4 h-full">
                    <div className="flex-grow bg-surface-darker rounded-2xl border border-white/10 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-4">
                            <h3 className="text-lg font-bold text-white tracking-tight backdrop-blur-md bg-surface-dark/50 px-3 py-1 rounded-lg border border-white/5">Summoner's Rift</h3>
                            <div className="flex gap-2">
                                <button className="p-1.5 rounded bg-surface-dark hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition" title="Toggle Vision">
                                    <span className="material-icons-outlined text-sm">visibility</span>
                                </button>
                                <button className="p-1.5 rounded bg-surface-dark hover:bg-white/10 border border-white/10 text-primary hover:text-white transition shadow-neon" title="Heatmap">
                                    <span className="material-icons-outlined text-sm">layers</span>
                                </button>
                            </div>
                        </div>
                        <div className="absolute inset-0 p-8 flex items-center justify-center map-grid">
                            <svg className="w-full h-full max-w-[600px] max-h-[600px] drop-shadow-[0_0_15px_rgba(210,249,111,0.1)]" viewBox="0 0 500 500">
                                <defs>
                                    <linearGradient id="laneGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#333', stopOpacity: 1 }}></stop>
                                        <stop offset="100%" style={{ stopColor: '#222', stopOpacity: 1 }}></stop>
                                    </linearGradient>
                                    <radialGradient cx="50%" cy="50%" fx="50%" fy="50%" id="midHeat" r="50%">
                                        <stop offset="0%" style={{ stopColor: 'rgba(210, 249, 111, 0.3)' }}></stop>
                                        <stop offset="100%" style={{ stopColor: 'rgba(210, 249, 111, 0)' }}></stop>
                                    </radialGradient>
                                    <pattern height="20" id="grid" patternUnits="userSpaceOnUse" width="20">
                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"></path>
                                    </pattern>
                                </defs>
                                <path d="M 50,450 L 50,50 L 450,50 L 450,450 Z" fill="#141610" stroke="#333" strokeWidth="2"></path>
                                <rect fill="url(#grid)" height="400" width="400" x="50" y="50"></rect>
                                <path d="M 50,450 C 150,350 350,150 450,50" fill="none" stroke="#1e293b" strokeOpacity="0.5" strokeWidth="40"></path>
                                <path d="M 60,440 L 60,60 L 440,60" fill="none" stroke="#333" strokeLinecap="round" strokeWidth="12"></path>
                                <path d="M 60,440 L 440,440 L 440,60" fill="none" stroke="#333" strokeLinecap="round" strokeWidth="12"></path>
                                <path d="M 60,440 L 440,60" fill="none" stroke="#333" strokeLinecap="round" strokeWidth="12"></path>
                                <circle cx="60" cy="440" fill="#1e3a8a" fillOpacity="0.2" r="25" stroke="#3b82f6" strokeWidth="1"></circle>
                                <circle cx="440" cy="60" fill="#7f1d1d" fillOpacity="0.2" r="25" stroke="#ef4444" strokeWidth="1"></circle>
                                <circle className="animate-pulse" cx="150" cy="350" fill="url(#midHeat)" r="40" style={{ animationDuration: '3s' }}></circle>
                                <g className="cursor-pointer hover:scale-110 transition-transform duration-200" transform="translate(250, 250)">
                                    <circle className="shadow-neon" fill="#1A1C14" r="12" stroke="#D2F96F" strokeWidth="2"></circle>
                                    <path d="M -5,-5 L 5,5 M 5,-5 L -5,5" stroke="#D2F96F" strokeWidth="2"></path>
                                </g>
                                <g className="cursor-pointer hover:scale-110 transition-transform duration-200" transform="translate(150, 350)">
                                    <circle fill="#1A1C14" r="12" stroke="#D2F96F" strokeWidth="2"></circle>
                                    <path d="M 0,-6 L 0,6 M -4,-2 L 0,6 L 4,-2" fill="none" stroke="#D2F96F" strokeWidth="2"></path>
                                </g>
                                <g className="cursor-pointer hover:scale-110 transition-transform duration-200 opacity-80" transform="translate(280, 220)">
                                    <circle fill="#1A1C14" r="12" stroke="#ef4444" strokeWidth="2"></circle>
                                    <text fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle" x="0" y="4">?</text>
                                </g>
                            </svg>
                            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-1">
                                <div className="bg-black/60 backdrop-blur px-3 py-1.5 rounded border border-white/10 text-xs font-mono text-primary">
                                    OBJ CONTROL: 62%
                                </div>
                                <div className="bg-black/60 backdrop-blur px-3 py-1.5 rounded border border-white/10 text-xs font-mono text-gray-400">
                                    VISION SCORE: 24
                                </div>
                            </div>
                        </div>
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
                                <span>Initializing strategic simulation module...</span>
                            </div>
                            <div className="flex gap-2 text-gray-400">
                                <span className="text-gray-600 select-none">$</span>
                                <span>Analyzing composition matchup: <span className="text-blue-400">Dive Heavy</span> vs <span className="text-red-400">Disengage</span></span>
                            </div>
                            <div className="flex gap-2 text-white mt-2">
                                <span className="text-primary select-none">&gt;</span>
                                <span className="typing-effect">
                                    <span className="text-primary font-bold">CRITICAL INSIGHT:</span> If T1 picks Azir, prioritize early dive on mid-lane (lvl 3) to disrupt their late-game macro control. Your Sejuani pathing should start Red to pressure mid early.
                                </span>
                            </div>
                            <div className="flex gap-2 text-white mt-1 opacity-80">
                                <span className="text-primary select-none">&gt;</span>
                                <span>
                                    Suggest warding enemy Raptors at 1:20 to track Lee Sin. High probability of lvl 2 invade.
                                </span>
                            </div>
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
                                    <span className="text-xs font-mono text-red-400">-2.5k</span>
                                </div>
                                <input className="w-full h-1.5 bg-surface-darker rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-neon" max="5000" min="-5000" type="range" defaultValue="-2500" />
                                <div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
                                    <span>-5k</span>
                                    <span>0</span>
                                    <span>+5k</span>
                                </div>
                            </div>
                            <div className="bg-surface-darker/50 p-3 rounded-xl border border-white/5">
                                <label className="text-xs text-gray-400 block mb-2">Game Phase</label>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1.5 text-xs rounded border border-white/10 bg-surface-dark text-gray-400 hover:text-white hover:border-white/30 transition cursor-pointer">Early</button>
                                    <button className="flex-1 py-1.5 text-xs rounded border border-primary/30 bg-primary/10 text-primary font-bold shadow-neon transition cursor-pointer">Mid</button>
                                    <button className="flex-1 py-1.5 text-xs rounded border border-white/10 bg-surface-dark text-gray-400 hover:text-white hover:border-white/30 transition cursor-pointer">Late</button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-surface-darker rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons-outlined text-gray-400 text-sm">battery_alert</span>
                                        <span className="text-xs text-gray-300">Player Fatigue</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input defaultChecked className="sr-only peer" type="checkbox" />
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
                                        <div className="text-xl font-mono text-white font-bold">42%</div>
                                    </div>
                                    <div className="bg-surface-darker p-3 rounded-lg border border-white/5 text-center">
                                        <div className="text-[10px] text-gray-500 mb-1">SPLIT PUSH</div>
                                        <div className="text-xl font-mono text-primary font-bold shadow-neon-text">High</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <button className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-black font-bold text-sm transition shadow-neon flex items-center justify-center gap-2 cursor-pointer">
                                <span className="material-icons-outlined text-lg">play_arrow</span>
                                Run Simulation
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default StrategyLab;
