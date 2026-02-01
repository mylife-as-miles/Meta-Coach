import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import { Player } from '../../../lib/mockData';
import { supabase } from '../../../lib/supabase';
import { Cpu, Save, RefreshCw } from 'lucide-react';

interface ExtendedPlayer extends Player {
    analysis_data?: any;
    avatarUrl?: string; // PlayerHub passes imageUrl as avatarUrl sometimes, or we standardized on avatarUrl
    team?: string;
}

interface EditAttributesModalProps {
    isOpen: boolean;
    onClose: () => void;
    player: Player | null; // Keep generic, cast inside
}

const EditAttributesModal: React.FC<EditAttributesModalProps> = ({ isOpen, onClose, player }) => {
    const [stats, setStats] = useState<Record<string, number>>({
        mechanics: 50,
        objectives: 50,
        macro: 50,
        vision: 50,
        teamwork: 50,
        mental: 50
    });
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (player) {
            setStats(player.stats);
        }
    }, [player]);

    if (!player) return null;

    const extendedPlayer = player as ExtendedPlayer;

    const handleSave = async () => {
        // Logic to save would go here - optimally persisting to DB 'roster' table
        // For now we just close, assuming the parent updates or we add a mutation hook later
        try {
            const { error } = await supabase
                .from('roster')
                .update({ analysis_data: { ...extendedPlayer.analysis_data, attributes: stats } }) // simplistic merge
                .eq('id', player.id);

            if (error) console.error("Error saving attributes:", error);
        } catch (e) {
            console.error("Save failed:", e);
        }
        onClose();
    };

    const handleAIAnalyze = async () => {
        setAnalyzing(true);
        try {
            const { data, error } = await supabase.functions.invoke('player-analysis', {
                body: {
                    playerId: player.id,
                    playerName: player.name,
                    playerRole: player.role,
                    // Pass existing context if needed
                }
            });
            if (error) throw error;

            if (data?.attributes) {
                setStats(data.attributes);
            }
        } catch (err) {
            console.error("AI Analysis failed", err);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Scouting Report: ${player.name}`} size="md">
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-surface-darker rounded-xl border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                    <img src={extendedPlayer.avatar || extendedPlayer.avatarUrl || ''} alt={player.name} className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-lg z-10" />
                    <div className="z-10">
                        <h3 className="text-white font-bold text-lg">{player.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/20">
                                {player.role}
                            </span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">{extendedPlayer.team || 'Free Agent'}</span>
                        </div>
                    </div>
                    <div className="ml-auto text-right z-10 flex flex-col items-end gap-2">
                        <button
                            onClick={handleAIAnalyze}
                            disabled={analyzing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 text-xs font-bold transition disabled:opacity-50"
                        >
                            {analyzing ? (
                                <>
                                    <RefreshCw size={12} className="animate-spin" /> Analyzing...
                                </>
                            ) : (
                                <>
                                    <Cpu size={12} /> Auto-Scout (Gemini)
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <span className="material-icons-outlined text-gray-500 text-sm">tune</span>
                            Evaluated Attributes
                        </h4>
                        <span className="text-[10px] text-gray-500 italic">0-100 Scale</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {Object.entries(stats).map(([key, value]) => {
                            const numValue = value as number;
                            return (
                                <div key={key} className="group">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] group-hover:text-white transition-colors">{key}</span>
                                        <span className="font-mono text-primary font-bold">{numValue}</span>
                                    </div>
                                    <div className="relative h-1.5 bg-surface-darker rounded-full overflow-hidden">
                                        <div
                                            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary/60 to-primary rounded-full shadow-[0_0_10px_rgba(210,249,111,0.3)]"
                                            style={{ width: `${numValue}%` }}
                                        ></div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={numValue}
                                        onChange={(e) => setStats(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                        className="w-full h-2 opacity-0 cursor-pointer absolute top-0 -mt-2"
                                        style={{ transform: 'translateY(100%)' }} // Hack to overlap
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary-dark transition shadow-neon text-sm flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Save Evaluation
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditAttributesModal;
