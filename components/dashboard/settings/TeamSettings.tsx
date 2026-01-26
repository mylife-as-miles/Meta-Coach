import React from 'react';

const TeamSettings: React.FC = () => {
    return (
        <div className="flex flex-col gap-6">
            <style>{`
                .custom-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: #D2F96F;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(210, 249, 111, 0.5);
                    margin-top: -6px;
                }
                .custom-range::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 4px;
                    cursor: pointer;
                    background: #333;
                    border-radius: 2px;
                }
            `}</style>

            {/* Team Config Panel */}
            <div className="bg-surface-dark rounded-2xl border border-white/10 p-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-transparent to-transparent opacity-50"></div>
                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Team Configuration</h2>
                        <p className="text-sm text-gray-400">Manage your organization identity and roster connections.</p>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition flex items-center gap-2 cursor-pointer">
                        <span className="material-symbols-outlined text-sm">save</span>
                        Save Changes
                    </button>
                </div>

                {/* Logo and Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="col-span-1">
                        <label className="block text-xs font-mono text-gray-400 mb-3 uppercase">Team Logo</label>
                        <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 bg-surface-darker flex flex-col items-center justify-center cursor-pointer group transition relative overflow-hidden">
                            <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-20 transition" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCf7_StFKf6adKA3b0kBUAG1PbdtJXK1Rgj1n7FwVTKATBkYh6vsB7nLQ-A-g76LfGNX8mx9U4q1FRlrc3Tn1oI1Hz_YLB9jgPN3Kkj4vZlXwDkqCkAchQsCXpZPbYdt7ZXMs_-sveDiSW_tA3xp0r7YfmM_F6DVr4Ex3LDVeAVazboGbpA_2CNxRUZ5rUVTxkqP_KljondHDk1p4e6eVzGM045HTIgJ51qcHOviBpDPuxxXd_OIdiVBw4h7PwwuoTWZWRTmgq3ktg')" }}></div>
                            <div className="z-10 flex flex-col items-center">
                                <span className="material-symbols-outlined text-3xl text-gray-500 group-hover:text-primary transition mb-2">cloud_upload</span>
                                <span className="text-xs text-gray-400 group-hover:text-white transition">Update Logo</span>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-2 space-y-5">
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">Team Name</label>
                            <input className="w-full bg-surface-darker border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary transition outline-none placeholder-gray-600 font-medium" type="text" defaultValue="T1 Academy" />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">Team Tag</label>
                            <input className="w-full bg-surface-darker border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary transition outline-none placeholder-gray-600 font-medium md:w-1/3" type="text" defaultValue="T1A" />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">Primary Region</label>
                            <select className="w-full bg-surface-darker border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary transition outline-none md:w-1/2 appearance-none">
                                <option>LCK (Korea)</option>
                                <option>LPL (China)</option>
                                <option>LEC (Europe)</option>
                                <option>LCS (North America)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Connected Accounts */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Connected Player Accounts</h3>
                        <button className="text-xs text-primary hover:text-white transition flex items-center gap-1 cursor-pointer">
                            <span className="material-symbols-outlined text-sm">add</span>
                            ADD ACCOUNT
                        </button>
                    </div>
                    <div className="bg-surface-darker rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-gray-400 font-mono text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Player</th>
                                    <th className="px-6 py-3 font-medium">Platform</th>
                                    <th className="px-6 py-3 font-medium">Rank</th>
                                    <th className="px-6 py-3 font-medium text-right">Status</th>
                                    <th className="px-6 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDUv0EoPfymbvrCgDYdsD31bSWrNzEVXCk5wkJoNj1AnnDXlONQkUrYTdVksLJLISnv6X7E0q0CcMQ8kLjZb3iVARUvEPbv34hk9NpdQXP6mtcz7ISM62INTfjeTHjhSeNyHnMHFSsrzqjjTFLszPabgYtWd_VIpQW53MxAJeawFQzNG4tSBL943s4uUZi4IxvbbrSGfhcuReaOevVHAPbqgOdgzNLNBIfsg0I7nyCBNFB6kP_VqaS8shbxZuliL1xLpZC0Z7s-mc8')" }}></div>
                                        <div>
                                            <div className="font-bold text-white">Zeus</div>
                                            <div className="text-xs text-gray-500">Top Lane</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">League of Legends</td>
                                    <td className="px-6 py-4 font-mono text-primary">Challenger 1.2k LP</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Connected
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-500 hover:text-white cursor-pointer"><span className="material-symbols-outlined">more_vert</span></button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDsZzGPfU3RznSje50p5_wX9EQFkRxjHi2qHqevqimExZ9XlHNfn8Uz2kBKlx0flhK8VVsxSp6_UsXzMH-Ayjn1S--jfZGlGRs5HaVqj1M4arE3q5iL6j2qd4SXtHmSGAe4hUnRtwC8rTxFTEfwxE3YfA9ojUAG2Xx6KLZaRlJl3zAv8TW93VuG7WYCF96Lt18_yWYRyt2QSyDQQopAXXSEIewI7Gdh3BJMSU62nczXwEbL_5UmkavKbqNdwfLQSfJEAaIDA8dY-R4')" }}></div>
                                        <div>
                                            <div className="font-bold text-white">Oner</div>
                                            <div className="text-xs text-gray-500">Jungle</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">League of Legends</td>
                                    <td className="px-6 py-4 font-mono text-primary">Challenger 980 LP</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Connected
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-500 hover:text-white cursor-pointer"><span className="material-symbols-outlined">more_vert</span></button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBJiC8BArHHIDzl16eJthLgWl9fHrH2CsL-t88YV3uNzDyR-mh9ACaRhe-pOVgdTYpmVelcOluamicEtsTJDhQgY4CTvEiHb8r74RF5Oy2H3esmhIlBOp69pRQVaNjEMSiQmeHsdiH8yilYWdpqRzSCz1LP_4tRQyNk_4j7G5wOhZBP1XI7AYtcYJ_ZrbOEEFKxbK1YfgBIfBuHiU3LVoOdQ3lUNPKJ07pYNfeveXEUIAJhlsNYBoyip5P4KOogPHH4goPXwMw0yqo')" }}></div>
                                        <div>
                                            <div className="font-bold text-white">Faker</div>
                                            <div className="text-xs text-gray-500">Mid Lane</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">League of Legends</td>
                                    <td className="px-6 py-4 font-mono text-primary">Challenger 1.5k LP</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Connected
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-500 hover:text-white cursor-pointer"><span className="material-symbols-outlined">more_vert</span></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* AI Coach Calibration */}
            <div className="bg-surface-dark rounded-2xl border border-white/10 p-8 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">psychology</span>
                            AI Coach Calibration
                        </h2>
                        <p className="text-sm text-gray-400">Fine-tune Gemini's strategic engine for your team style.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg bg-surface-darker border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition cursor-pointer">
                            <span className="material-symbols-outlined">history</span>
                        </button>
                        <button className="p-2 rounded-lg bg-surface-darker border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition cursor-pointer">
                            <span className="material-symbols-outlined">restart_alt</span>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-surface-darker p-6 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <label className="font-bold text-white text-sm">Risk Tolerance</label>
                            <span className="text-xs font-mono text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded">AGGRESSIVE (75%)</span>
                        </div>
                        <div className="relative h-12 flex items-center mb-2">
                            <input className="custom-range w-full absolute z-20 opacity-0 h-full cursor-pointer" max="100" min="0" type="range" defaultValue="75" />
                            <div className="w-full h-1 bg-gray-700 rounded-full relative z-10">
                                <div className="h-full bg-primary rounded-full shadow-neon" style={{ width: '75%' }}></div>
                                <div className="absolute top-1/2 -translate-y-1/2 left-[75%] w-4 h-4 bg-primary rounded-full shadow-[0_0_10px_#D2F96F] border-2 border-white"></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                            <span>Safe / Standard</span>
                            <span>Limit Testing</span>
                        </div>
                        <p className="mt-4 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                            <span className="text-primary font-bold">Impact:</span> AI will suggest higher variance plays, tower dives, and 50/50 objectives. Suitable for scrim environments.
                        </p>
                    </div>
                    <div className="bg-surface-darker p-6 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <label className="font-bold text-white text-sm">Analytical Focus</label>
                            <span className="text-xs font-mono text-blue-300 border border-blue-300/30 bg-blue-500/10 px-2 py-0.5 rounded">BALANCED</span>
                        </div>
                        <div className="relative h-12 flex items-center mb-2">
                            <input className="custom-range w-full absolute z-20 opacity-0 h-full cursor-pointer" max="100" min="0" type="range" defaultValue="50" />
                            <div className="w-full h-1 bg-gray-700 rounded-full relative z-10">
                                <div className="h-full bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" style={{ width: '50%' }}></div>
                                <div className="absolute top-1/2 -translate-y-1/2 left-[50%] w-4 h-4 bg-blue-400 rounded-full border-2 border-white"></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                            <span>Micro (Laning)</span>
                            <span>Macro (Objectives)</span>
                        </div>
                        <p className="mt-4 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                            <span className="text-blue-300 font-bold">Impact:</span> Suggestions are evenly distributed between individual mechanics and map-wide strategic movements.
                        </p>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">Real-time Draft Assist</span>
                            <span className="text-xs text-gray-500">Live pick/ban recommendations</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input defaultChecked className="sr-only peer" type="checkbox" />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">Voice Synthesis</span>
                            <span className="text-xs text-gray-500">Read briefings aloud</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input className="sr-only peer" type="checkbox" />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">Experimental Builds</span>
                            <span className="text-xs text-gray-500">Include off-meta items</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input defaultChecked className="sr-only peer" type="checkbox" />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamSettings;
