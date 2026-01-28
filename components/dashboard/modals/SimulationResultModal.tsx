import React from 'react';
import Modal from '../../ui/Modal';

interface SimulationResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: { winProbability: number; insights: string[] } | null;
}

const SimulationResultModal: React.FC<SimulationResultModalProps> = ({ isOpen, onClose, result }) => {
    if (!result) return null;

    const isHighChance = result.winProbability >= 65;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Simulation Results" size="md">
            <div className="p-6 space-y-6">
                {/* Win Probability Circle */}
                <div className="flex flex-col items-center py-6">
                    <div className={`relative w-40 h-40 rounded-full flex items-center justify-center ${isHighChance ? 'bg-primary/10' : 'bg-yellow-500/10'
                        }`}>
                        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-gray-800"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray={`${result.winProbability * 2.64} 264`}
                                strokeLinecap="round"
                                className={isHighChance ? 'text-primary drop-shadow-[0_0_8px_rgba(210,249,111,0.5)]' : 'text-yellow-400'}
                            />
                        </svg>
                        <div className="text-center relative z-10">
                            <span className={`text-4xl font-bold font-mono ${isHighChance ? 'text-primary' : 'text-yellow-400'}`}>
                                {result.winProbability}%
                            </span>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Win Probability</p>
                        </div>
                    </div>
                    <div className={`mt-4 px-4 py-2 rounded-full text-sm font-bold ${isHighChance
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                        {isHighChance ? '✓ Favorable Matchup' : '⚠ Competitive Match'}
                    </div>
                </div>

                {/* Key Insights */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400 text-base">auto_awesome</span>
                        AI Strategic Insights
                    </h3>
                    <div className="space-y-2">
                        {result.insights.map((insight, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-surface-darker rounded-lg border border-white/5">
                                <span className="material-icons-outlined text-primary text-sm mt-0.5">lightbulb</span>
                                <span className="text-sm text-gray-300">{insight}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-xl border border-primary/20">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Recommended Action</h4>
                    <p className="text-sm text-gray-300">
                        {isHighChance
                            ? 'Your draft provides strong advantages. Focus on executing your win conditions and maintaining early tempo.'
                            : 'Consider adjusting your composition for better synergy, or focus on early-game aggression to create leads.'}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition font-medium"
                    >
                        Run Again
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary-dark transition shadow-neon"
                    >
                        Accept Draft
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SimulationResultModal;
