import React from 'react';

const DataSourcesSettings: React.FC = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="bg-surface-dark rounded-2xl border border-white/10 p-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-transparent to-transparent opacity-50"></div>
                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Data Sources</h2>
                        <p className="text-sm text-gray-400">Manage connected platforms and external data ingestion pipelines.</p>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition flex items-center gap-2 cursor-pointer">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Refresh Integrations
                    </button>
                </div>

                {/* Connected Platforms */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">link</span>
                        Connected Platforms
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* GRID */}
                        <div className="bg-surface-darker rounded-xl border border-white/5 p-6 flex flex-col justify-between hover:border-white/20 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-800 border border-white/5 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                        <span className="material-symbols-outlined text-2xl text-white">grid_4x4</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base">GRID Esports Data</h4>
                                        <p className="text-xs text-gray-500">Official Tournament Feed</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-mono font-medium uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <button className="text-xs text-gray-400 hover:text-white transition font-medium flex items-center gap-1.5 border border-white/10 rounded px-3 py-1.5 hover:bg-white/5 cursor-pointer">
                                    <span className="material-symbols-outlined text-sm">settings</span> Configure
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">Real-time Sync</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input defaultChecked className="sr-only peer" type="checkbox" />
                                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Riot Games */}
                        <div className="bg-surface-darker rounded-xl border border-white/5 p-6 flex flex-col justify-between hover:border-white/20 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-800 border border-white/5 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                        <span className="material-symbols-outlined text-2xl text-white">sports_esports</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base">Riot Games API</h4>
                                        <p className="text-xs text-gray-500">Live & Match History</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono font-medium uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                                    Syncing
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <button className="text-xs text-gray-400 hover:text-white transition font-medium flex items-center gap-1.5 border border-white/10 rounded px-3 py-1.5 hover:bg-white/5 cursor-pointer">
                                    <span className="material-symbols-outlined text-sm">settings</span> Configure
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">Real-time Sync</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input defaultChecked className="sr-only peer" type="checkbox" />
                                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Steam */}
                        <div className="bg-surface-darker rounded-xl border border-white/5 p-6 flex flex-col justify-between hover:border-white/20 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-800 border border-white/5 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                        <span className="material-symbols-outlined text-2xl text-white">videogame_asset</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base">Steam Web API</h4>
                                        <p className="text-xs text-gray-500">Inventory & Stats</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-mono font-medium uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <button className="text-xs text-gray-400 hover:text-white transition font-medium flex items-center gap-1.5 border border-white/10 rounded px-3 py-1.5 hover:bg-white/5 cursor-pointer">
                                    <span className="material-symbols-outlined text-sm">settings</span> Configure
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">Real-time Sync</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input defaultChecked className="sr-only peer" type="checkbox" />
                                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Discord */}
                        <div className="bg-surface-darker rounded-xl border border-white/5 p-6 flex flex-col justify-between hover:border-white/20 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-800 border border-white/5 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                        <span className="material-symbols-outlined text-2xl text-white">webhook</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base">Discord Dev Portal</h4>
                                        <p className="text-xs text-gray-500">Bot Integrations</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono font-medium uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Disconnected
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <button className="text-xs text-primary hover:text-white transition font-medium flex items-center gap-1.5 border border-primary/20 bg-primary/5 rounded px-3 py-1.5 hover:bg-primary/10 cursor-pointer">
                                    <span className="material-symbols-outlined text-sm">login</span> Connect
                                </button>
                                <div className="flex items-center gap-3 opacity-50 cursor-not-allowed">
                                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">Real-time Sync</span>
                                    <label className="relative inline-flex items-center cursor-not-allowed">
                                        <input className="sr-only peer" disabled type="checkbox" />
                                        <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-500 after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Historical Data Upload */}
                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">history</span>
                        Historical Data Upload
                    </h3>
                    <div className="bg-surface-darker rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors p-10 flex flex-col items-center justify-center cursor-pointer group">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                            <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-primary transition">cloud_upload</span>
                        </div>
                        <h4 className="text-white font-medium mb-1">Click to upload or drag and drop</h4>
                        <p className="text-xs text-gray-500 mb-6 text-center max-w-sm">Support for VODs (.mp4, .mkv), Match JSON data, or Replay files (.rofl, .dem).</p>
                        <div className="flex gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded border border-white/5 text-[10px] text-gray-400 font-mono">
                                <span className="material-symbols-outlined text-sm">movie</span> VODs
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded border border-white/5 text-[10px] text-gray-400 font-mono">
                                <span className="material-symbols-outlined text-sm">data_object</span> JSON
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataSourcesSettings;
