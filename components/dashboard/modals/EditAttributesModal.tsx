import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import { Player } from '../../../lib/mockData';

interface EditAttributesModalProps {
    isOpen: boolean;
    onClose: () => void;
    player: Player | null;
}

const EditAttributesModal: React.FC<EditAttributesModalProps> = ({ isOpen, onClose, player }) => {
    const [stats, setStats] = useState({
        mechanics: 50,
        objectives: 50,
        macro: 50,
        vision: 50,
        teamwork: 50,
        mental: 50
    });

    useEffect(() => {
        if (player) {
            setStats(player.stats);
        }
    }, [player]);

    if (!player) return null;

    const handleSave = () => {
        // Logic to save would go here
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Attributes: ${player.name}`} size="md">
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-surface-darker rounded-xl border border-white/5">
                    <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                        <h3 className="text-white font-bold">{player.name}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Manual Override</p>
                    </div>
                    <div className="ml-auto text-right">
                        <span className="text-2xl font-bold font-mono text-primary">{player.overall}</span>
                        <p className="text-[10px] text-gray-500 uppercase">Current OVR</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {Object.entries(stats).map(([key, value]) => (
                        <div key={key}>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-gray-300 font-bold uppercase tracking-wider">{key}</span>
                                <span className="font-mono text-primary font-bold">{value}</span>
                            </div>
                            <div className="relative h-2 bg-surface-darker rounded-full">
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-primary rounded-full shadow-neon"
                                    style={{ width: `${value}%` }}
                                ></div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={value}
                                    onChange={(e) => setStats(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div
                                    className="absolute w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary top-1/2 transform -translate-y-1/2 pointer-events-none transition-all"
                                    style={{ left: `${value}%`, marginLeft: '-8px' }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary-dark transition shadow-neon"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditAttributesModal;
