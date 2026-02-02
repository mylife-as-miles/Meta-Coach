import React, { useState, useEffect } from 'react';
import { ScoutPlayer } from '../ScoutingView';
import { supabase } from '../../../lib/supabase';

interface ScoutingReportModalProps {
    player: ScoutPlayer;
    comparisonPlayer?: ScoutPlayer;
    onClose: () => void;
}

interface ReportData {
    executive_summary: {
        title: string;
        text: string;
    };
    metrics_analysis: {
        eobp_trend: string;
        eslg_trend: string;
        war_trend: string;
    };
    cost_analysis: {
        current_roster_cost: string;
        target_acquisition_cost: string;
        roi_percentage: string;
    };
}

const ScoutingReportModal: React.FC<ScoutingReportModalProps> = ({ player, comparisonPlayer, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<ReportData | null>(null);
    const [retrospective, setRetrospective] = useState<any>(null); // Using any for brevity, or define interface

    useEffect(() => {
        const fetchReport = async () => {
            try {
                // Parallel fetching of Report and Retrospective
                const reportPromise = supabase.functions.invoke('scouting-report', {
                    body: {
                        player: {
                            name: player.name,
                            role: player.role,
                            stats: player.stats,
                            price: player.price
                        },
                        comparison: comparisonPlayer ? {
                            name: comparisonPlayer.name,
                            role: comparisonPlayer.role
                        } : null
                    }
                });

                const retroPromise = supabase.functions.invoke('gemini-retrospective', {
                    body: { teamId: player.team || 'generic' }
                });

                const [reportRes, retroRes] = await Promise.all([reportPromise, retroPromise]);

                if (reportRes.error) console.error('Report Error:', reportRes.error);
                if (reportRes.data?.report) {
                    setReport(reportRes.data.report);
                }

                if (retroRes.error) console.error('Retro Error:', retroRes.error);
                if (retroRes.data?.analysis) {
                    setRetrospective(retroRes.data.analysis);
                }

            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [player, comparisonPlayer]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="relative bg-[#0E100A] w-full max-w-6xl h-[90vh] rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white/10">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-800 flex justify-between items-start bg-zinc-900/50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-icons-outlined text-gray-500 text-sm">lock</span>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Confidential Strategic Analysis</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">{player.name} <span className="text-gray-500 font-normal">Scouting Report</span></h1>
                        <p className="text-sm text-gray-500 mt-1">Generated: {new Date().toLocaleDateString()} • MetaCoach Analytics Engine v4.2</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center transform rotate-45 shadow-neon">
                                <span className="material-icons-outlined text-black transform -rotate-45 text-[10px]">sports_esports</span>
                            </div>
                            <span className="font-bold text-white tracking-tight">MetaCoach</span>
                        </div>
                        <div className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono font-bold text-gray-400">ID: #{player.id.substring(0, 6).toUpperCase()}</div>
                    </div>
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white">
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0E100A] custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <span className="material-icons-outlined text-primary text-4xl animate-spin">autorenew</span>
                            <p className="text-gray-500 font-mono text-sm tracking-widest animate-pulse">ANALYZING MONEYBALL DATA DEEP DIVE...</p>
                        </div>
                    ) : (
                        <>
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">Executive Summary</h2>
                                </div>
                                <div className="bg-primary/5 p-5 rounded-lg border border-primary/20">
                                    <h3 className="font-bold text-primary mb-2 text-lg">{report?.executive_summary.title}</h3>
                                    <p className="text-sm text-gray-300 leading-relaxed font-light">
                                        {report?.executive_summary.text}
                                    </p>
                                </div>
                            </section>

                            {/* Gemini Retrospective (New) */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-purple-400">psychology_alt</span>
                                        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Gemini Retrospective</h2>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                                        MODEL: GEMINI-3-PRO
                                    </span>
                                </div>

                                {retrospective ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {retrospective.patterns.map((pattern: any, idx: number) => (
                                            <div key={idx} className="bg-surface-dark border border-white/10 p-4 rounded-lg hover:border-purple-500/30 transition group">
                                                <div className="text-xs text-purple-400 font-bold uppercase mb-2 group-hover:text-purple-300">{pattern.title}</div>
                                                <p className="text-sm text-gray-300 mb-3 min-h-[40px] leading-snug">{pattern.description}</p>
                                                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                                                    <span className="material-icons text-[10px] text-gray-500">analytics</span>
                                                    <span className="text-xs font-mono font-bold text-white">{pattern.stat}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 border border-dashed border-white/10 rounded-lg text-center text-gray-500 text-xs font-mono">
                                        INITIALIZING DEEP MIND ANALYSIS...
                                    </div>
                                )}
                            </section>

                            {/* Sabermetrics Breakdown */}
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="col-span-1 md:col-span-3 flex items-center justify-between mb-2">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">Sabermetrics Breakdown</h2>
                                    <span className="text-xs text-gray-500 font-mono">TREND: LAST 3 SPLITS</span>
                                </div>

                                {/* eOBP Card */}
                                <div className="p-4 border border-white/10 rounded-lg bg-surface-dark bg-[url('/grid-pattern.png')]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">eOBP</div>
                                            <div className="text-2xl font-bold text-white">{player.metrics.eOBP.toFixed(3)}</div>
                                        </div>
                                        <span className="text-primary text-xs font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                            {report?.metrics_analysis.eobp_trend}
                                        </span>
                                    </div>
                                    <div className="h-10 flex items-end gap-1 opacity-70">
                                        <div className="bg-gray-700 w-1/5 h-[40%] rounded-t-sm"></div>
                                        <div className="bg-gray-700 w-1/5 h-[50%] rounded-t-sm"></div>
                                        <div className="bg-gray-700 w-1/5 h-[45%] rounded-t-sm"></div>
                                        <div className="bg-gray-600 w-1/5 h-[70%] rounded-t-sm"></div>
                                        <div className="bg-primary w-1/5 h-[90%] rounded-t-sm shadow-neon"></div>
                                    </div>
                                </div>

                                {/* eSLG Card */}
                                <div className="p-4 border border-white/10 rounded-lg bg-surface-dark">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">eSLG</div>
                                            <div className="text-2xl font-bold text-white">{player.metrics.eSLG.toFixed(3)}</div>
                                        </div>
                                        <span className="text-primary text-xs font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                            {report?.metrics_analysis.eslg_trend}
                                        </span>
                                    </div>
                                    {/* Simulated Trend Line */}
                                    <svg className="w-full h-10 overflow-visible" preserveAspectRatio="none">
                                        <path d="M0,40 L15,35 L30,38 L45,20 L60,25 L75,10 L90,5" fill="none" stroke="#D2F96F" strokeWidth="2" className="drop-shadow-[0_0_5px_rgba(210,249,111,0.5)]"></path>
                                        <circle cx="90" cy="5" fill="#D2F96F" r="3" className="shadow-neon"></circle>
                                    </svg>
                                </div>

                                {/* WAR Card */}
                                <div className="p-4 border border-white/10 rounded-lg bg-surface-dark">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">WAR</div>
                                            <div className="text-2xl font-bold text-white">{player.metrics.war}</div>
                                        </div>
                                        <span className="text-white/50 text-xs font-bold bg-white/5 px-1.5 py-0.5 rounded">
                                            {report?.metrics_analysis.war_trend}
                                        </span>
                                    </div>
                                    <div className="h-10 flex items-center gap-1">
                                        <div className="h-1.5 bg-gray-800 w-full rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-[85%] shadow-neon"></div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1">Top 5% in League</div>
                                </div>
                            </section>

                            {/* Cost-Benefit Analysis */}
                            <section>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Cost-Benefit Analysis</h2>
                                <div className="p-6 bg-white/5 border border-white/10 rounded-lg flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1 space-y-6 w-full">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-gray-500">CURRENT ROSTER COST</span>
                                                <span className="text-white">{report?.cost_analysis.current_roster_cost}</span>
                                            </div>
                                            <div className="h-3 bg-gray-800 rounded-full w-full overflow-hidden">
                                                <div className="h-full bg-gray-500 rounded-full w-full opacity-50"></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-primary">{player.name.toUpperCase()} COST (Projected)</span>
                                                <span className="text-primary">{report?.cost_analysis.target_acquisition_cost}</span>
                                            </div>
                                            <div className="h-3 bg-gray-800 rounded-full w-full relative overflow-hidden">
                                                <div className="absolute top-0 left-0 h-full bg-primary w-[60%] shadow-neon"></div>
                                                <div className="absolute top-0 left-[60%] h-full w-[40%] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.05)_5px,rgba(255,255,255,0.05)_10px)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-px h-16 bg-white/10 hidden md:block"></div>
                                    <div className="text-center min-w-[150px]">
                                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Proj. ROI</div>
                                        <div className="text-4xl font-bold text-primary font-mono tracking-tighter drop-shadow-lg">{report?.cost_analysis.roi_percentage}</div>
                                        <div className="text-[10px] text-gray-500 mt-1">Yield Efficiency / $</div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="px-8 py-4 bg-zinc-900/80 border-t border-white/5 text-xs text-gray-500 flex justify-between items-center backdrop-blur">
                    <span>Confidential - For Internal Use Only - ID: {window.crypto.randomUUID().split('-')[0]}</span>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 hover:text-white transition group">
                            <span className="material-icons-outlined text-base group-hover:text-primary transition">file_download</span>
                            Export PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoutingReportModal;
