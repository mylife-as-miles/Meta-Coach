import React from 'react';
import Modal from '../../ui/Modal';
import { strategyBriefData } from '../../../lib/mockData';

interface StrategyBriefModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StrategyBriefModal: React.FC<StrategyBriefModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pre-Match Strategy Brief" size="lg">
            <div className="p-6 space-y-6">
                {/* Match Info Header */}
                <div className="flex items-center justify-between p-4 bg-surface-darker rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-900/20 border border-blue-500/30 flex items-center justify-center">
                            <span className="font-bold text-blue-400">C9</span>
                        </div>
                        <span className="text-2xl text-gray-600 font-light">VS</span>
                        <div className="w-12 h-12 rounded-full bg-red-900/20 border border-red-500/30 flex items-center justify-center">
                            <span className="font-bold text-red-400">{strategyBriefData.opponent}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-bold">{strategyBriefData.region}</p>
                        <p className="text-xs text-gray-400">{strategyBriefData.format} • Live in {strategyBriefData.matchTime}</p>
                    </div>
                </div>

                {/* Key Threats */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span className="material-icons-outlined text-red-400 text-base">warning</span>
                        Key Threats
                    </h3>
                    <div className="space-y-2">
                        {strategyBriefData.keyPlayers.map((player, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-surface-darker rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center">
                                        <span className="text-xs font-bold text-gray-400">{player.role}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{player.name}</p>
                                        <p className="text-xs text-gray-400">{player.note}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${player.threat === 'HIGH'
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                    }`}>
                                    {player.threat} THREAT
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ban Suggestions */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span className="material-icons-outlined text-orange-400 text-base">block</span>
                        Recommended Bans
                    </h3>
                    <div className="flex gap-3">
                        {strategyBriefData.banSuggestions.map((champ, idx) => (
                            <div key={idx} className="flex-1 p-3 bg-surface-darker rounded-lg border border-orange-500/20 text-center">
                                <span className="text-sm font-bold text-orange-400">{champ}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Win Conditions */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span className="material-icons-outlined text-primary text-base">emoji_events</span>
                        Win Conditions
                    </h3>
                    <div className="space-y-2">
                        {strategyBriefData.winConditions.map((condition, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                    {idx + 1}
                                </span>
                                <span className="text-sm text-gray-300">{condition}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Game Objectives */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span className="material-icons-outlined text-blue-400 text-base">flag</span>
                        Key Objectives
                    </h3>
                    <ul className="space-y-2">
                        {strategyBriefData.objectives.map((obj, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="material-icons-outlined text-xs text-blue-400">check_circle</span>
                                {obj}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition font-medium"
                    >
                        Close
                    </button>
                    <button
                        className="flex-1 py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary-dark transition shadow-neon flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-outlined text-lg">print</span>
                        Export Brief
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default StrategyBriefModal;
