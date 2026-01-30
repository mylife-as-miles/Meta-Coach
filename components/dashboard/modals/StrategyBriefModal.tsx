import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import { supabase } from '../../../lib/supabase';
import { strategyBriefData as mockStrategyBriefData } from '../../../lib/mockData';
import { useSession } from '../../../hooks/useAuth';
import { useWorkspace, useTeamProfile } from '../../../hooks/useDashboardQueries';

interface StrategyBriefModalProps {
    isOpen: boolean;
    onClose: () => void;
    opponentId?: string; // Optional: for fetching real opponent data
}

const StrategyBriefModal: React.FC<StrategyBriefModalProps> = ({ isOpen, onClose, opponentId }) => {
    // Get team profile from Query hooks
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { data: workspace } = useWorkspace(userId);
    const { data: teamProfile } = useTeamProfile(workspace?.id, workspace?.grid_team_id);

    const [isLoading, setIsLoading] = useState(false);
    const [matchPrepData, setMatchPrepData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch match prep data when modal opens with an opponentId
    useEffect(() => {
        if (isOpen && opponentId) {
            const fetchMatchPrep = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const { data, error: fetchError } = await supabase.functions.invoke('ai-match-prep', {
                        body: { opponentId }
                    });

                    if (fetchError) throw new Error(fetchError.message);
                    setMatchPrepData(data);
                } catch (err: any) {
                    console.error('Error fetching match prep:', err);
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMatchPrep();
        } else {
            // Reset when modal closes
            setMatchPrepData(null);
        }
    }, [isOpen, opponentId]);

    // Use fetched data or fallback to mock
    const displayData = matchPrepData ? {
        opponent: matchPrepData.opponentProfile?.name?.substring(0, 2).toUpperCase() || 'OPP',
        opponentName: matchPrepData.opponentProfile?.name || 'Unknown Opponent',
        region: teamProfile?.region || mockStrategyBriefData.region,
        format: mockStrategyBriefData.format,
        matchTime: mockStrategyBriefData.matchTime,
        headToHead: matchPrepData.headToHead || { totalMeetings: 0, ourWins: 0, theirWins: 0 },
        // Keep mock data for detailed sections that aren't available from API yet
        keyPlayers: mockStrategyBriefData.keyPlayers,
        banSuggestions: mockStrategyBriefData.banSuggestions,
        winConditions: mockStrategyBriefData.winConditions,
        objectives: mockStrategyBriefData.objectives,
    } : {
        opponent: mockStrategyBriefData.opponent,
        opponentName: 'T1',
        region: mockStrategyBriefData.region,
        format: mockStrategyBriefData.format,
        matchTime: mockStrategyBriefData.matchTime,
        headToHead: { totalMeetings: 5, ourWins: 2, theirWins: 3 },
        keyPlayers: mockStrategyBriefData.keyPlayers,
        banSuggestions: mockStrategyBriefData.banSuggestions,
        winConditions: mockStrategyBriefData.winConditions,
        objectives: mockStrategyBriefData.objectives,
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pre-Match Strategy Brief" size="lg">
            <div className="p-6 space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="material-icons animate-spin text-primary text-4xl">hourglass_top</span>
                        <span className="ml-3 text-gray-400">Analyzing opponent...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-icons text-red-400 text-4xl mb-2">error_outline</span>
                        <p className="text-red-400">{error}</p>
                        <p className="text-gray-500 text-sm mt-2">Showing sample data instead.</p>
                    </div>
                ) : (
                    <>
                        {/* Match Info Header */}
                        <div className="flex items-center justify-between p-4 bg-surface-darker rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-900/20 border border-blue-500/30 flex items-center justify-center">
                                    <span className="font-bold text-blue-400">{teamProfile?.teamName?.substring(0, 2).toUpperCase() || 'YOU'}</span>
                                </div>
                                <span className="text-2xl text-gray-600 font-light">VS</span>
                                <div className="w-12 h-12 rounded-full bg-red-900/20 border border-red-500/30 flex items-center justify-center">
                                    <span className="font-bold text-red-400">{displayData.opponent}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold">{displayData.region}</p>
                                <p className="text-xs text-gray-400">{displayData.format} • Live in {displayData.matchTime}</p>
                            </div>
                        </div>

                        {/* AI General Strategy (From Onboarding) */}
                        {teamProfile?.generated_reasoning && (
                            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="material-icons-outlined text-primary text-base">psychology</span>
                                    Core Strategic Identity
                                </h3>
                                <p className="text-sm text-gray-300 italic">"{teamProfile.generated_reasoning}"</p>
                            </div>
                        )}

                        {/* Head-to-Head Stats */}
                        {displayData.headToHead && (
                            <div className="bg-surface-darker rounded-xl p-4 border border-white/5">
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <span className="material-icons-outlined text-purple-400 text-base">compare_arrows</span>
                                    Head-to-Head Record
                                </h3>
                                <div className="flex items-center justify-around text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-primary">{displayData.headToHead.ourWins}</p>
                                        <p className="text-xs text-gray-500">Our Wins</p>
                                    </div>
                                    <div className="text-gray-600">
                                        <p className="text-lg font-mono">{displayData.headToHead.totalMeetings} games</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-red-400">{displayData.headToHead.theirWins}</p>
                                        <p className="text-xs text-gray-500">Their Wins</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Key Threats */}
                        <div>
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <span className="material-icons-outlined text-red-400 text-base">warning</span>
                                Key Threats
                            </h3>
                            <div className="space-y-2">
                                {displayData.keyPlayers.map((player, idx) => (
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
                                {displayData.banSuggestions.map((champ, idx) => (
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
                                {displayData.winConditions.map((condition, idx) => (
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
                                {displayData.objectives.map((obj, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                                        <span className="material-icons-outlined text-xs text-blue-400">check_circle</span>
                                        {obj}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}

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
