import React from 'react';

const DashboardOverview: React.FC = () => {
    return (
        <>
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-white">Live Operations</h1>
                    <p className="text-gray-400 text-sm">Real-time tactical analysis for Cloud9 vs T1</p>
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
                <div className="lg:col-span-3 flex flex-col gap-6 h-full">
                    {/* Upcoming Match Card */}
                    <div className="bg-surface-dark rounded-2xl p-6 shadow-glow border border-border-lime flex flex-col justify-between relative overflow-hidden h-1/2 group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <span className="material-icons-outlined text-6xl text-white">emoji_events</span>
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upcoming Match</span>
                            <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded shadow-neon">LIVE IN 2H</span>
                        </div>
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                <div className="w-12 h-12 bg-blue-900/20 border border-blue-500/30 rounded-full flex items-center justify-center mb-2 mx-auto">
                                    <span className="font-bold text-blue-400">C9</span>
                                </div>
                                <span className="text-lg font-bold text-white">C9</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-2xl text-gray-600 font-light">VS</span>
                            </div>
                            <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                <div className="w-12 h-12 bg-red-900/20 border border-red-500/30 rounded-full flex items-center justify-center mb-2 mx-auto">
                                    <span className="font-bold text-red-400">T1</span>
                                </div>
                                <span className="text-lg font-bold text-white">T1</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-6 relative z-10">
                            <div>
                                <p className="uppercase tracking-wide opacity-50 text-gray-500">Region</p>
                                <p className="text-white font-medium">Worlds 2024</p>
                            </div>
                            <div className="text-right">
                                <p className="uppercase tracking-wide opacity-50 text-gray-500">Format</p>
                                <p className="text-white font-medium">Best of 5</p>
                            </div>
                        </div>
                        <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 relative z-10 hover:shadow-neon hover:text-primary">
                            <span className="material-icons-outlined text-sm">library_books</span>
                            View Strategy Brief
                        </button>
                    </div>

                    {/* Recent Scrims */}
                    <div className="bg-surface-dark rounded-2xl p-5 shadow-lg border border-white/5 flex-1 flex flex-col overflow-hidden h-1/2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-white">Recent Scrims</h3>
                            <a className="text-xs text-gray-500 hover:text-primary transition" href="#">View All</a>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                            <div className="bg-surface-darker p-3 rounded-xl border border-white/5 hover:border-primary/20 transition group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm text-gray-200 group-hover:text-white">vs G2 Esports</span>
                                    <span className="text-xs font-mono text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded">WIN 2-1</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-3/4 shadow-neon"></div>
                                    </div>
                                    <span className="text-[10px] text-gray-500">Gold Lead</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>32:40 Duration</span>
                                    <span>18 Kills</span>
                                </div>
                            </div>
                            <div className="bg-surface-darker p-3 rounded-xl border border-white/5 hover:border-red-500/20 transition group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm text-gray-200 group-hover:text-white">vs FNATIC</span>
                                    <span className="text-xs font-mono text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">LOSS 0-1</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-1/4 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
                                    </div>
                                    <span className="text-[10px] text-gray-500">Deficit</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>28:15 Duration</span>
                                    <span>9 Kills</span>
                                </div>
                            </div>
                            <div className="bg-surface-darker p-3 rounded-xl border border-white/5 hover:border-primary/20 transition group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm text-gray-200 group-hover:text-white">vs Gen.G</span>
                                    <span className="text-xs font-mono text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded">WIN 1-0</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-2/3 shadow-neon"></div>
                                    </div>
                                    <span className="text-[10px] text-gray-500">Gold Lead</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>41:05 Duration</span>
                                    <span>24 Kills</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2 (Center) */}
                <div className="lg:col-span-6 flex flex-col gap-6 h-full">
                    {/* Live Telemetry Map */}
                    <div className="bg-surface-dark rounded-2xl p-0 shadow-glow border border-white/10 relative overflow-hidden h-[60%] group">
                        <div className="absolute inset-0 map-bg opacity-100 z-0"></div>
                        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-neon"></span>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Live Telemetry</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Summoner's Rift • 14.3 Patch</p>
                        </div>
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <span className="px-3 py-1 bg-blue-900/60 backdrop-blur-md rounded-md text-[10px] font-bold text-blue-200 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">Baron: 65%</span>
                            <span className="px-3 py-1 bg-red-900/60 backdrop-blur-md rounded-md text-[10px] font-bold text-red-200 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">Drake: 12%</span>
                        </div>
                        <div className="absolute top-[30%] left-[45%] w-24 h-24 bg-primary/10 rounded-full blur-2xl z-0"></div>
                        <div className="absolute bottom-[20%] right-[30%] w-32 h-32 bg-red-500/5 rounded-full blur-2xl z-0"></div>
                        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                            <path d="M 200 150 Q 400 100 600 250" fill="none" filter="drop-shadow(0 0 2px rgba(210, 249, 111, 0.6))" stroke="rgba(210, 249, 111, 0.4)" strokeDasharray="5,5" strokeWidth="2"></path>
                            <circle className="animate-pulse" cx="200" cy="150" fill="#D2F96F" r="4"></circle>
                            <circle className="animate-pulse" cx="600" cy="250" fill="#D2F96F" r="4"></circle>
                            <rect fill="rgba(14, 16, 10, 0.9)" height="24" rx="4" stroke="rgba(210, 249, 111, 0.3)" width="80" x="580" y="220"></rect>
                            <text fill="#E0E0E0" fontFamily="sans-serif" fontSize="10" fontWeight="bold" x="593" y="236">Mid Rotate</text>
                        </svg>
                        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 flex justify-between items-center z-20">
                            <div className="flex flex-col gap-1 w-1/3">
                                <span className="text-[10px] text-gray-400 uppercase">Gold Advantage</span>
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
                    <div className="bg-surface-dark rounded-2xl p-5 shadow-lg border border-white/5 flex-1 overflow-hidden h-[40%]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-white">AI Analysis: High-Impact Plays</h3>
                            <div className="flex gap-4 text-xs text-gray-500 font-mono">
                                <span>Time</span>
                                <span>Play</span>
                                <span>Outcome</span>
                                <span>AI Score</span>
                            </div>
                        </div>
                        <div className="space-y-3 overflow-y-auto h-[calc(100%-2rem)] pr-2 custom-scrollbar">
                            <div className="flex items-center p-3 hover:bg-white/5 rounded-xl transition group cursor-pointer border border-transparent hover:border-primary/20">
                                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mr-4 relative border border-white/10">
                                    <img className="w-full h-full rounded-lg object-cover opacity-70 group-hover:opacity-100 transition" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKsdHlC4K_WkUpLmn-wuVa_5pGEQsmJBFD2guT3rnJJkv9LozHkp3y-SrXuE0j5C-Q5gV-qd0HmsqhhzxfUCou9yUvxk_waAn11OEr216mp_zBjLoi_VeNCrRS0JpWAuFmTL1lpzMoYMwrJr0lzdK6MswzFdCHMKQyJarPGY2vx-3FMVbII6XnmhID1dKYQBsS_IWB7NQeWR1-qWx3Av8hdarb4FkglXDJXmY7LZLxuTjMlHxQ0AY0oDs9Z8ZW3oRZVRSURI7bPVw" alt="Faker" />
                                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-[8px] text-black px-1 rounded font-bold shadow-sm">MID</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-bold text-white group-hover:text-primary transition">Faker <span className="text-gray-500 group-hover:text-gray-400 font-normal text-xs ml-1 transition">Azir</span></span>
                                        <span className="text-xs font-mono text-gray-500">12:45</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Shurima Shuffle Engange</span>
                                        <span className="text-xs font-bold text-primary shadow-neon px-1.5 py-0.5 bg-primary/10 rounded">98/100</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 hover:bg-white/5 rounded-xl transition group cursor-pointer border border-transparent hover:border-white/10">
                                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mr-4 relative border border-white/10">
                                    <img className="w-full h-full rounded-lg object-cover opacity-70 group-hover:opacity-100 transition" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmOdYvk78C0i3G6ubogkOjcPkWEVedzgYQMZN9BIaOqZWJIXLmDIOg77qkyK59lW26WSq0qqkdNGyTCxozkxEwLX5Z7FABud_ZF5kiBHeo5LtAKL6LcObObcUUMqz1WRYoQA8feohYJHogx8waK3rbrW7wJCe9STi_faWuMSKUYCoN0DPyUjncwushG-zOqQOQsP2MoSzXy3lROiM-TmhivnV4UeyQj1PBSnSIPeT7PZ1Qqo-BwBYcJgfd9bIUO3JntIjxNFHakBs" alt="Zeus" />
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-[8px] text-white px-1 rounded font-bold shadow-sm">TOP</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-bold text-white group-hover:text-primary transition">Zeus <span className="text-gray-500 group-hover:text-gray-400 font-normal text-xs ml-1 transition">Aatrox</span></span>
                                        <span className="text-xs font-mono text-gray-500">15:20</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Teleport Flank (Mistimed)</span>
                                        <span className="text-xs font-bold text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">42/100</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center p-3 hover:bg-white/5 rounded-xl transition group cursor-pointer border border-transparent hover:border-primary/20">
                                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mr-4 relative border border-white/10">
                                    <img className="w-full h-full rounded-lg object-cover opacity-70 group-hover:opacity-100 transition" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgvHFLRp93nD0pIJ0QZrX6XGAw_tSfKiAOU6JdJa0OLMkRxKmIOFEf_lSgpByZW4jj_yGIr_-dgtDXT4ttfxVSgYPNyJDBYu6NVWNTQQoddgAaKdcOacnEtV_0o8DridTDNQip-wXjqRSuO_XBtZdXof59QdcpOtjcihAzy1WpBMmOITc9Eson07FWoyVqNSSV6pW2BQkWmiqCK7S3M_1tqFZqktEtMhQi7msNbFWu4iwIfXiWz2zqMABtCrvKWzABt80ufjRWMl0" alt="Oner" />
                                    <div className="absolute -bottom-1 -right-1 bg-green-600 text-[8px] text-white px-1 rounded font-bold shadow-sm">JGL</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-bold text-white group-hover:text-primary transition">Oner <span className="text-gray-500 group-hover:text-gray-400 font-normal text-xs ml-1 transition">Lee Sin</span></span>
                                        <span className="text-xs font-mono text-gray-500">18:10</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Dragon Steal &amp; Escape</span>
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">92/100</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3 (Right) - Active Roster */}
                <div className="lg:col-span-3 h-full">
                    <div className="bg-surface-dark rounded-2xl p-6 shadow-glow border border-white/5 h-full flex flex-col relative overflow-hidden text-white">
                        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl -translate-y-20"></div>
                        <div className="flex justify-between items-start mb-6 z-10">
                            <h2 className="text-lg font-bold">Active Roster</h2>
                            <span className="material-icons-outlined text-gray-500 hover:text-white transition text-sm cursor-pointer">info</span>
                        </div>
                        <div className="flex-1 flex flex-col justify-center items-center relative z-10 space-y-4 mb-4">
                            <div className="absolute top-10 left-0 w-full h-full border-t border-white/5 rounded-full scale-150 pointer-events-none"></div>

                            {/* Thanatos */}
                            <div className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-darker hover:bg-white/5 transition border border-white/5 hover:border-white/20 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-800 relative overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition">
                                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkT4Ks269eAsRO6dfV89vALxgdxfAIVhrSHYZ7tNq8vISykltHagGhfqxQ3jGWrJToNIJpP4nM3PSdgPu8l9HYdhYrWOGXeDoZE0G4AtmJSbDrpnVK9otXSAjl7dyD5dHsK0gI8YorFUR23B9c1S7IZ6YJUPedlRZgYDwSEGbgE1Qn_v8raz85BTG63ZekqtcevpkMwY7youcMNc-tgeCvFlI4XIRqdEm7dh6c-V5ydmisJWLB9DIAPUQA7zzudRIGVrMsPgx45nY" alt="Thanatos" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-200 group-hover:text-white">Thanatos</span>
                                        <span className="text-[9px] text-gray-500 uppercase">Top Lane</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="w-16 h-1 bg-gray-800 rounded-full mb-1 overflow-hidden">
                                        <div className="w-[90%] bg-green-400 h-full rounded-full shadow-[0_0_5px_rgba(74,222,128,0.5)]"></div>
                                    </div>
                                    <span className="text-[9px] text-green-400 font-mono">Syn: 92%</span>
                                </div>
                            </div>

                            {/* Blaber */}
                            <div className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-darker hover:bg-white/5 transition border border-white/5 hover:border-white/20 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-800 relative overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition">
                                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlIJwvp8CJbnm_G_ebQy1u5tPqtfiI65vbfXCcoI7mW_DPo3DfI28f9VxDLLJVC-EhH78h7c9-SH__pTSDAIQzMaqrLQKQt6RbmUbCEYlA6Hau1KtjKoBfjqG75OkcbamnBjK4H7P7UOZk7-7kKTKiwRh-gVGy-LG5yzpD7SuqKfU6pqlW7S2V3XCc_-hYQNRBhMV0eAvia9CV4onl0orcsGsRsmvLZmyC8WQ0Li3t5_tyqHZUL6zcknCXfdd_WtvXdZULlmJ2oqI" alt="Blaber" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-200 group-hover:text-white">Blaber</span>
                                        <span className="text-[9px] text-gray-500 uppercase">Jungle</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="w-16 h-1 bg-gray-800 rounded-full mb-1 overflow-hidden">
                                        <div className="w-[75%] bg-yellow-400 h-full rounded-full shadow-[0_0_5px_rgba(250,204,21,0.5)]"></div>
                                    </div>
                                    <span className="text-[9px] text-yellow-400 font-mono">Syn: 88%</span>
                                </div>
                            </div>

                            {/* Jojopyun (Highlighted) */}
                            <div className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-darker hover:bg-white/5 transition border border-primary/30 shadow-[0_0_10px_rgba(210,249,111,0.05)] group relative">
                                <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-20 animate-pulse pointer-events-none"></div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-8 h-8 rounded bg-gray-800 relative overflow-hidden ring-2 ring-primary shadow-neon">
                                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgmk_3Dd5LZ7x8Y6QRyVcvfIY2o6i6ZEow7ULJQ7mDBP9ltpfN96fTLkIsaRT5-MpowpIF-OK3wILuhV1LMKNyFwYaELdGjXM27XdtdTTQ53UZfPgdMZ253PEYcr2KocmNhX69xqIBVXrvyGfbX_f4B0RgX6TfhpLyEyzdI0tBFdPk1NZGSJs2AXWniFBg8o-q5_rUNev6IJ1Ih1TABpuVeL3aPlaDuEgX4ofivzoMsoGDWhrOQPLUbq9XCkzAO2rA9Pe7ZbFsKxk" alt="Jojopyun" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white">Jojopyun</span>
                                        <span className="text-[9px] text-primary uppercase">Mid Lane</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end relative z-10">
                                    <div className="w-16 h-1 bg-gray-800 rounded-full mb-1 overflow-hidden">
                                        <div className="w-[98%] bg-primary h-full rounded-full shadow-neon"></div>
                                    </div>
                                    <span className="text-[9px] text-primary font-bold font-mono">Syn: 99%</span>
                                </div>
                            </div>

                            {/* Berserker */}
                            <div className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-darker hover:bg-white/5 transition border border-white/5 hover:border-white/20 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-800 relative overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition">
                                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdsGjvfWWP_RQNNnonarIcqn1w4a1C67nqV4onFMGWTacVTtZcmBLfYLg0F_8tnC-0L75xDGVVduwGKczRdEbfwrYroPUf6BjR_tk2ZyXcg5qNWU9xkxeixNdlRIqXeymWpYv2G1J9Q0TPgaXpw1PAPC2ca1uP290RzVvGwU4Sv56ZJnYXnZxha829S_3gVjM5ccAMUtxp4D_0J8qBGHt9N5KOsN97t0X_glvsn1Hx1et9xihm5_9k8eEf1cRjBX4HU7_q7_kNYyc" alt="Berserker" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-200 group-hover:text-white">Berserker</span>
                                        <span className="text-[9px] text-gray-500 uppercase">ADC</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="w-16 h-1 bg-gray-800 rounded-full mb-1 overflow-hidden">
                                        <div className="w-[85%] bg-green-400 h-full rounded-full shadow-[0_0_5px_rgba(74,222,128,0.5)]"></div>
                                    </div>
                                    <span className="text-[9px] text-green-400 font-mono">Syn: 90%</span>
                                </div>
                            </div>

                            {/* Vulcan */}
                            <div className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-darker hover:bg-white/5 transition border border-white/5 hover:border-white/20 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-800 relative overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition">
                                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDczUci-uHIWdbJeCdzPrbW8bcQ_I9NN_1njJmho1qTxEAFZ9aXu3gvt0gYxoZ4gnkO5UaGdc_ZOVtuj-jKW6u1gIwQYD7AmyRTU-RfzLUrMNfrcT-EAUPmsmqUMXe7rjEf96uDjYqljkUL--R9J3jWOd14hio3KRju1e4daLpYR6O-Wt3yj_GrNpAHHpb44Un-j7RloKeE0_eqUoGAbPyoa-axldcOQBZ0-g5n4p0wNFIdoWlJ5EAN5vKdKgmwkhJ_H54zPK2JK9Y" alt="Vulcan" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-200 group-hover:text-white">Vulcan</span>
                                        <span className="text-[9px] text-gray-500 uppercase">Support</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="w-16 h-1 bg-gray-800 rounded-full mb-1 overflow-hidden">
                                        <div className="w-[60%] bg-orange-500 h-full rounded-full shadow-[0_0_5px_rgba(249,115,22,0.5)]"></div>
                                    </div>
                                    <span className="text-[9px] text-orange-400 font-mono">Syn: 75%</span>
                                </div>
                            </div>
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
                            <button className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-3.5 rounded-xl flex items-center justify-between px-4 transition transform hover:scale-[1.02] shadow-neon">
                                <span>Launch Strategy Lab</span>
                                <span className="material-icons-outlined text-sm bg-black/10 p-1 rounded-full">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 border-t border-white/10 pt-6">
                <p>© 2024 MetaCoach AI Analytics. Connected to Riot Games API.</p>
                <div className="flex gap-4 mt-2 md:mt-0 font-mono">
                    <a className="hover:text-primary transition" href="#">System Status: <span className="text-green-500">Stable</span></a>
                    <a className="hover:text-primary transition" href="#">Latency: <span className="text-white">12ms</span></a>
                </div>
            </div>
        </>
    );
};

export default DashboardOverview;
