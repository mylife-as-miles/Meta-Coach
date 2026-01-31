import React, { useState } from 'react';
import { useTeamSearch, useTeamHistory } from '../../hooks/useDashboardQueries';
import TeamInsightPanel from './TeamInsightPanel';

interface MoneyballModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTeamId?: string; // Analysis context (e.g. "My Team")
}

const MoneyballModal: React.FC<MoneyballModalProps> = ({ isOpen, onClose, currentTeamId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<{ id: string, name: string } | null>(null);

    // Hooks
    const { data: searchResults, isFetching: isSearching } = useTeamSearch(searchQuery);
    const { data: teamHistory, isFetching: isHistoryLoading } = useTeamHistory(selectedTeam?.id);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-6xl h-[90vh] bg-[#050505] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header / Search */}
                <header className="px-8 py-6 border-b border-white/5 bg-[#0a0c0f] flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-icons">analytics</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Moneyball / <span className="text-gray-500">Opponent Analysis</span></h2>
                            <p className="text-xs text-gray-500 font-mono">Select a team to formulate strategic plans.</p>
                        </div>
                    </div>

                    <div className="relative w-96 z-50">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Search team (e.g. T1, G2)..."
                            className="w-full bg-[#0f1115] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        {/* Search Results Dropdown */}
                        {searchQuery.length > 1 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f1115] border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-4 text-center text-gray-500 text-xs">Scanning database...</div>
                                ) : searchResults && searchResults.length > 0 ? (
                                    <ul>
                                        {searchResults.map((team: any) => (
                                            <li
                                                key={team.id}
                                                className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                                                onClick={() => {
                                                    setSelectedTeam(team);
                                                    setSearchQuery(''); // Close dropdown but keep selection
                                                }}
                                            >
                                                <img src={team.logoUrl} alt={team.teamName} className="w-6 h-6 object-contain" />
                                                <span className="text-white font-bold">{team.name}</span>
                                                <span className="text-xs text-gray-500 ml-auto bg-black/20 px-2 py-0.5 rounded">{team.region}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 text-xs">No teams found matching "{searchQuery}"</div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons text-sm">close</span>
                    </button>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 relative overflow-auto bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                    {selectedTeam ? (
                        isHistoryLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-400 animate-pulse font-mono text-sm">Analyzing {selectedTeam.name} historical data...</p>
                            </div>
                        ) : (
                            <TeamInsightPanel
                                teamName={selectedTeam.name}
                                // Pass dynamic history data here
                                winRate={teamHistory?.winRate}
                                avgGameTime={teamHistory?.avgGameTime}
                                firstBloodRate={teamHistory?.firstBloodRate}
                                dragonControl={teamHistory?.dragonControl}
                                players={teamHistory?.roster}
                            />
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                            <span className="material-icons text-6xl text-gray-500 mb-4">search_off</span>
                            <h3 className="text-2xl font-bold text-gray-300">No Team Selected</h3>
                            <p className="text-gray-500 mt-2 max-w-sm">Use the search bar above to find an opponent and analyzing their Moneyball stats.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MoneyballModal;
