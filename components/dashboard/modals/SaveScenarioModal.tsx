import React, { useState } from 'react';
import { useSaveScenario } from '../../../hooks/useDashboardQueries';

interface SaveScenarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    currentPlayerId?: string;
    targetPlayerId?: string;
    currentPlayerName: string;
    targetPlayerName: string;
    comparisonData: Record<string, any>;
    recommendation?: string;
}

const SaveScenarioModal: React.FC<SaveScenarioModalProps> = ({
    isOpen,
    onClose,
    workspaceId,
    currentPlayerId,
    targetPlayerId,
    currentPlayerName,
    targetPlayerName,
    comparisonData,
    recommendation,
}) => {
    const defaultName = `${currentPlayerName} vs ${targetPlayerName} - ${new Date().toLocaleDateString()}`;
    const [name, setName] = useState(defaultName);
    const [status, setStatus] = useState<'draft' | 'saved'>('saved');
    const [saved, setSaved] = useState(false);

    const saveScenario = useSaveScenario();

    React.useEffect(() => {
        if (isOpen) {
            setName(defaultName);
            setStatus('saved');
            setSaved(false);
        }
    }, [isOpen, defaultName]);

    const handleSave = async () => {
        try {
            await saveScenario.mutateAsync({
                workspaceId,
                name,
                currentPlayerId,
                targetPlayerId,
                comparisonData,
                recommendation,
                status,
            });
            setSaved(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Failed to save scenario:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-surface-dark border border-primary/30 rounded-2xl shadow-[0_0_50px_rgba(210,249,111,0.1)] overflow-hidden">
                {saved ? (
                    // Success State
                    <div className="p-12 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-4 shadow-neon animate-bounce">
                            <span className="material-icons-outlined text-4xl text-primary">check</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Scenario Saved!</h3>
                        <p className="text-gray-400 text-sm text-center">
                            Your comparison scenario has been saved to your workspace.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-white/10 bg-surface-darker flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-icons-outlined text-primary">save</span>
                                <h2 className="text-lg font-bold text-white">Save Scenario</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
                            >
                                <span className="material-icons-outlined text-sm">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Scenario Name */}
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Scenario Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter scenario name..."
                                    className="w-full px-4 py-3 bg-surface-darker border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                                />
                            </div>

                            {/* Comparison Summary */}
                            <div className="bg-surface-darker p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-gray-500 mb-3">COMPARING</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-xs font-bold">
                                            {currentPlayerName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-sm text-white">{currentPlayerName}</span>
                                    </div>
                                    <span className="material-icons-outlined text-gray-600">compare_arrows</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-white">{targetPlayerName}</span>
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                            {targetPlayerName.substring(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Toggle */}
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Status
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStatus('draft')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${status === 'draft'
                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        Draft
                                    </button>
                                    <button
                                        onClick={() => setStatus('saved')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${status === 'saved'
                                                ? 'bg-primary/20 text-primary border border-primary/30'
                                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        Final
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-white/10 bg-surface-darker flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-white/5 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveScenario.isPending || !name.trim()}
                                className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition shadow-neon disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saveScenario.isPending ? (
                                    <>
                                        <span className="material-icons-outlined animate-spin text-sm">sync</span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined text-sm">save</span>
                                        Save Scenario
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SaveScenarioModal;
