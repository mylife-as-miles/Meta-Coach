import React, { useState, useEffect } from 'react';
import { X, Cpu, Star, TrendingUp, Loader2 } from 'lucide-react';
import { ScoutPlayer } from '../ScoutingView';
import { supabase } from '../../../lib/supabase';

interface ScoutingReportModalProps {
    player: ScoutPlayer;
    onClose: () => void;
}

const ScoutingReportModal: React.FC<ScoutingReportModalProps> = ({ player, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<string | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                // Call drafting-analysis or a new scouting function
                // For now, we'll try to use a new specialized function 'scouting-report'
                const { data, error } = await supabase.functions.invoke('scouting-report', {
                    body: {
                        player: {
                            name: player.name,
                            role: player.role,
                            stats: player.stats
                        }
                    }
                });

                if (error) throw error;
                setReport(data.report);
            } catch (err) {
                console.error('Error fetching scout report:', err);
                setReport("Analysis unavailable. The AI scout is currently offline or the player data is insufficient.");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [player]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-[#0E100A] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-surface-dark">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-black/50 overflow-hidden border border-white/10">
                            {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">{player.role[0]}</div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold text-white">{player.name}</h2>
                                <span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-bold border border-primary/30 uppercase tracking-wider">
                                    AI Scout Target
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm flex items-center gap-2">
                                {player.team} • {player.role}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                                <Cpu className="relative text-primary animate-pulse" size={48} />
                            </div>
                            <p className="text-gray-400 font-mono text-sm">Analyzing Moneyball metrics...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="prose prose-invert max-w-none">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                                    <Star className="text-yellow-400" size={18} />
                                    Scouting Analysis
                                </h3>
                                <div className="bg-surface-dark/50 rounded-xl p-6 border border-white/5 text-gray-300 leading-relaxed whitespace-pre-line">
                                    {report}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    Close
                                </button>
                                <button className="px-6 py-2 rounded-lg text-sm bg-primary text-black font-bold hover:bg-primary-hover shadow-[0_0_20px_-5px_rgba(196,240,66,0.3)] transition-all">
                                    Add to Shortlist
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScoutingReportModal;
