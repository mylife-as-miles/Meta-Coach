import React from 'react';

const AICalibrationSettings: React.FC = () => {
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

            <div className="bg-surface-dark rounded-2xl border border-white/10 p-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-transparent to-transparent opacity-50"></div>
                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">AI Strategy Calibration</h2>
                        <p className="text-sm text-gray-400">Fine-tune the Gemini API's analysis engine to match your coaching philosophy.</p>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition flex items-center gap-2 cursor-pointer">
                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                        Reset to Default
                    </button>
                </div>

                {/* Calibration Preset */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">model_training</span>
                        Calibration Preset
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-white/5 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Select Analysis Profile</label>
                                <p className="text-xs text-gray-500 mb-3">Choose a pre-configured AI behavior model.</p>
                                <div className="relative">
                                    <select className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                                        <option>Moneyball (Data-Driven)</option>
                                        <option>Classic Coaching (Fundamentals)</option>
                                        <option>Aggressive Scrim (High Risk)</option>
                                        <option>Custom Configuration</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                        <span className="material-symbols-outlined text-sm">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-1">info</span>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        The <span className="text-white font-medium">Moneyball</span> preset prioritizes statistical efficiency and objective control over kill participation. Ideal for teams focusing on scaling and late-game macro execution.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Tolerance Engine */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">query_stats</span>
                        Risk Tolerance Engine
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-white/5 p-6">
                        <div className="flex justify-between text-xs font-mono text-gray-500 mb-2 uppercase tracking-wide">
                            <span>Conservative</span>
                            <span>Balanced</span>
                            <span>Aggressive</span>
                        </div>
                        <input className="custom-range w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" max="100" min="0" step="10" type="range" defaultValue="60" />
                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Current Setting: <span className="text-primary">Calculated Aggression</span></span>
                                <span className="text-xs text-gray-500 mt-1">AI will suggest plays with {'>'}60% success probability.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytical Focus */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">donut_large</span>
                        Analytical Focus
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-white/5 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-300 font-medium">Micro-Mechanics</span>
                            <span className="text-sm text-gray-300 font-medium">Macro-Strategy</span>
                        </div>
                        <div className="relative h-2 bg-gray-700 rounded-full mb-6">
                            <input className="absolute w-full h-2 opacity-0 cursor-pointer z-10" max="100" min="0" type="range" defaultValue="35"
                                onChange={(e) => {
                                    const percent = e.target.value + '%';
                                    const thumb = e.target.nextElementSibling as HTMLElement;
                                    const track = thumb?.nextElementSibling as HTMLElement;
                                    if (thumb) thumb.style.left = percent;
                                    if (track) track.style.width = percent;
                                }}
                            />
                            <div className="absolute h-4 w-4 bg-primary rounded-full shadow-[0_0_10px_rgba(210,249,111,0.5)] top-1/2 -translate-y-1/2 -ml-2 pointer-events-none transition-all duration-75" style={{ left: '35%' }}></div>
                            <div className="absolute h-full bg-white/10 rounded-l-full pointer-events-none top-0 left-0" style={{ width: '35%' }}></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface-dark p-3 rounded-lg border border-white/5">
                                <div className="text-xs text-gray-500 uppercase font-mono mb-1">Focus: Individual</div>
                                <div className="text-white text-sm">CS/min, Lane Trades, Spell Accuracy</div>
                            </div>
                            <div className="bg-surface-dark p-3 rounded-lg border border-white/5 text-right">
                                <div className="text-xs text-gray-500 uppercase font-mono mb-1">Focus: Team</div>
                                <div className="text-white text-sm">Objective Setup, Rotation, Vision Control</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Intelligence */}
                <div className="">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">trending_up</span>
                        Advanced Intelligence
                    </h3>
                    <div className="bg-surface-darker rounded-xl border border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">Identify Meta-Trends</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-black">BETA</span>
                                </div>
                                <span className="text-xs text-gray-500">Allow Gemini to cross-reference your replays with global pro-play data patterns.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-3">
                    <button className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-sm font-medium transition cursor-pointer">Cancel</button>
                    <button className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-black text-sm font-bold shadow-neon transition transform hover:-translate-y-0.5 cursor-pointer">Save Configuration</button>
                </div>
            </div>
        </div>
    );
};

export default AICalibrationSettings;
