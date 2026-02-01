
import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface AddPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (nickname: string) => void;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [nickname, setNickname] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nickname.trim()) {
            onAdd(nickname.trim());
            setNickname('');
            onClose();
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fade-in" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0E100A] border border-white/10 rounded-2xl p-6 shadow-2xl z-50 animate-scale-in outline-none">
                    <Dialog.Title className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <span className="material-icons text-primary">person_add</span>
                        Add New Player
                    </Dialog.Title>
                    <Dialog.Description className="text-gray-400 text-sm mb-6">
                        Enter the player's nickname to add them to your active roster.
                    </Dialog.Description>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Player Nickname</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="e.g. faker, s1mple"
                                className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition font-mono"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!nickname.trim()}
                                className="flex-1 py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary-dark transition shadow-neon disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Player
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AddPlayerModal;
