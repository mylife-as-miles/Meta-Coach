import React from 'react';
import Modal from '../../ui/Modal';
import { Player, players } from '../../../lib/mockData';

interface ComparePlayersModalProps {
    isOpen: boolean;
    onClose: () => void;
    basePlayer: Player | null;
}

const ComparePlayersModal: React.FC<ComparePlayersModalProps> = ({ isOpen, onClose, basePlayer }) => {
    // For demo, just compare with the next player in the list or the first one if base is last
    const comparisonPlayer = players.find(p => p.id !== basePlayer?.id && p.role === basePlayer?.role) || players[0];

    if (!basePlayer || !comparisonPlayer) return null;

    const stats = [
        { label: 'Mechanics', base: basePlayer.stats.mechanics, comp: comparisonPlayer.stats.mechanics },
        { label: 'Objectives', base: basePlayer.stats.objectives, comp: comparisonPlayer.stats.objectives },
        { label: 'Macro', base: basePlayer.stats.macro, comp: comparisonPlayer.stats.macro },
        { label: 'Vision', base: basePlayer.stats.vision, comp: comparisonPlayer.stats.vision },
        { label: 'Teamwork', base: basePlayer.stats.teamwork, comp: comparisonPlayer.stats.teamwork },
        { label: 'Mental', base: basePlayer.stats.mental, comp: comparisonPlayer.stats.mental },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Player Comparison" size="lg">
            <div className="p-6 space-y-8">
                {/* Players Header */}
                <div className="flex items-center justify-between">
                    <div className="text-center w-1/3">
                        <div className="relative w-24 h-24 mx-auto mb-3">
                            <img src={basePlayer.avatar} alt={basePlayer.name} className="w-full h-full rounded-2xl object-cover ring-4 ring-primary/20 shadow-neon" />
                            <div className="absolute -bottom-2 -right-2 bg-surface-dark px-2 py-0.5 rounded border border-white/10 text-xs font-bold font-mono text-primary shadow-neon">
                                {basePlayer.overall}
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white">{basePlayer.name}</h3>
                        <p className="text-sm text-primary uppercase tracking-wider">{basePlayer.role}</p>
                    </div>

                    <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center">
                            <span className="text-gray-500 font-bold">VS</span>
                        </div>
                    </div>

                    <div className="text-center w-1/3 opacity-80">
                        <div className="relative w-24 h-24 mx-auto mb-3 grayscale">
                            <img src={comparisonPlayer.avatar} alt={comparisonPlayer.name} className="w-full h-full rounded-2xl object-cover ring-4 ring-white/10" />
                            <div className="absolute -bottom-2 -right-2 bg-surface-dark px-2 py-0.5 rounded border border-white/10 text-xs font-bold font-mono text-gray-400">
                                {comparisonPlayer.overall}
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-300">{comparisonPlayer.name}</h3>
                        <p className="text-sm text-gray-500 uppercase tracking-wider">{comparisonPlayer.role}</p>
                    </div>
                </div>

                {/* Stats Comparison */}
                <div className="space-y-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="relative">
                            <div className="flex justify-between text-xs mb-1 font-mono font-bold">
                                <span className={stat.base > stat.comp ? 'text-primary' : 'text-gray-400'}>{stat.base}</span>
                                <span className="text-gray-500 uppercase tracking-widest">{stat.label}</span>
                                <span className={stat.comp > stat.base ? 'text-white' : 'text-gray-400'}>{stat.comp}</span>
                            </div>
                            <div className="flex h-2 bg-surface-darker rounded-full overflow-hidden">
                                <div className="flex-1 flex justify-end bg-surface-darker/50 pr-1">
                                    <div
                                        className={`h-full rounded-l-full ${stat.base > stat.comp ? 'bg-primary shadow-neon' : 'bg-primary/30'}`}
                                        style={{ width: `${stat.base}%` }}
                                    ></div>
                                </div>
                                <div className="w-px bg-gray-800"></div>
                                <div className="flex-1 pl-1">
                                    <div
                                        className={`h-full rounded-r-full ${stat.comp > stat.base ? 'bg-white' : 'bg-white/30'}`}
                                        style={{ width: `${stat.comp}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI Insight */}
                <div className="bg-surface-darker p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-sm text-purple-400">auto_awesome</span>
                        <h4 className="text-sm font-bold text-white">AI Comparison Insight</h4>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        <span className="text-white font-bold">{basePlayer.name}</span> demonstrates superior <span className="text-primary">Mechanics (+{basePlayer.stats.mechanics - comparisonPlayer.stats.mechanics})</span> compared to market alternative, but significantly lags in Vision control. Retaining current roster is recommended for aggressive playstyles.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ComparePlayersModal;
