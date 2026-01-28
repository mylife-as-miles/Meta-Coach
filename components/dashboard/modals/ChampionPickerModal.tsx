import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import { champions, Champion } from '../../../lib/mockData';

interface ChampionPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: 'TOP' | 'JG' | 'MID' | 'ADC' | 'SUP';
    onSelect: (champion: Champion) => void;
}

const ChampionPickerModal: React.FC<ChampionPickerModalProps> = ({ isOpen, onClose, role, onSelect }) => {
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>(role);

    const filteredChampions = champions.filter(champ => {
        const matchesSearch = champ.name.toLowerCase().includes(search.toLowerCase());
        const matchesRole = selectedRole === 'ALL' || champ.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    const handleSelect = (champion: Champion) => {
        onSelect(champion);
        onClose();
    };

    const roles = ['ALL', 'TOP', 'JG', 'MID', 'ADC', 'SUP'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Champion" size="lg">
            <div className="p-6 space-y-4">
                {/* Search & Filter */}
                <div className="flex gap-3">
                    <div className="flex-1 flex items-center bg-surface-darker rounded-xl px-4 py-2 border border-white/10 focus-within:border-primary/50 transition">
                        <span className="material-icons-outlined text-gray-500 mr-2">search</span>
                        <input
                            type="text"
                            placeholder="Search champions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
                        />
                    </div>
                </div>

                {/* Role Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {roles.map(r => (
                        <button
                            key={r}
                            onClick={() => setSelectedRole(r)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${selectedRole === r
                                    ? 'bg-primary text-black shadow-neon'
                                    : 'bg-surface-darker text-gray-400 hover:text-white border border-white/10'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                {/* Champion Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {filteredChampions.map(champion => (
                        <button
                            key={champion.id}
                            onClick={() => handleSelect(champion)}
                            className="flex flex-col items-center p-3 bg-surface-darker rounded-xl border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition group"
                        >
                            <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition">
                                {champion.icon}
                            </div>
                            <span className="text-xs text-gray-300 group-hover:text-white truncate w-full text-center">
                                {champion.name}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase">
                                {champion.role}
                            </span>
                        </button>
                    ))}
                </div>

                {filteredChampions.length === 0 && (
                    <div className="text-center py-8">
                        <span className="material-icons-outlined text-4xl text-gray-600 mb-2">search_off</span>
                        <p className="text-gray-500 text-sm">No champions found</p>
                    </div>
                )}

                {/* Cancel */}
                <div className="pt-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ChampionPickerModal;
