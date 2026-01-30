import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import { Match } from '../../../lib/mockData';
import { useSession } from '../../../hooks/useAuth';
import { useWorkspace, useTeamProfile, useMatchStats } from '../../../hooks/useDashboardQueries';

interface MatchDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    match: Match | null;
}

interface PlayerStats {
    id: string;
    name: string;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    wards: number;
    gold: number;
    level: number;
}

interface GameData {
    gameNumber: number;
    finished: boolean;
    duration: number;
    teams: {
        id: string;
        name: string;
        won: boolean;
        side: string;
        players: PlayerStats[];
    }[];
}

const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ isOpen, onClose, match }) => {
    // Get team profile from Query hooks
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { data: workspace } = useWorkspace(userId);
    const { data: teamProfile } = useTeamProfile(workspace?.id, workspace?.grid_team_id);

    // Fetch match stats using the new hook (Stage 2)
    const { data: matchStats, isLoading, error: statsError } = useMatchStats(
        isOpen ? match?.id : null
    );
    const error = statsError?.message || null;

    if (!match) return null;

    const isWin = match.result === 'WIN';
    const teamName = teamProfile?.teamName || 'Your Team';
    const teamAbbr = teamName.substring(0, 2).toUpperCase();

    // Get first game player stats for display
    const gameData = matchStats?.games?.[0] || null;
    const ourTeamStats = matchStats?.teams?.find((t: any) => t.name === teamName) || matchStats?.teams?.[0];
    const opponentTeamStats = matchStats?.teams?.find((t: any) => t !== ourTeamStats);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Match Analysis" size="xl">
            <div className="p-6 space-y-6">
                {/* Match Header */}
                <div className={`flex items-center justify-between p-5 rounded-xl border ${isWin ? 'bg-primary/5 border-primary/20' : 'bg-red-500/5 border-red-500/20'
                    }`}>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-full bg-blue-900/20 border border-blue-500/30 flex items-center justify-center mb-2">
                                <span className="font-bold text-blue-400 text-lg">{teamAbbr}</span>
                            </div>
                            <span className="text-xs text-gray-400">{teamName}</span>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white font-mono">{match.score}</div>
                            <span className={`text-sm font-bold ${isWin ? 'text-primary' : 'text-red-400'}`}>
                                {match.result}
                            </span>
                        </div>
                        <div className="text-center">
                            <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-2 ${match.opponent.color === 'red' ? 'bg-red-900/20 border-red-500/30' :
                                match.opponent.color === 'orange' ? 'bg-orange-900/20 border-orange-500/30' :
                                    'bg-yellow-900/20 border-yellow-500/30'
                                }`}>
                                <span className={`font-bold text-lg ${match.opponent.color === 'red' ? 'text-red-400' :
                                    match.opponent.color === 'orange' ? 'text-orange-400' :
                                        'text-yellow-400'
                                    }`}>{match.opponent.abbreviation}</span>
                            </div>
                            <span className="text-xs text-gray-400">{match.opponent.name}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-medium">{match.date}</p>
                        <p className="text-xs text-gray-400">{match.format} • {gameData ? formatDuration(gameData.duration) : match.duration}</p>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded mt-2 inline-block ${match.type === 'Ranked' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'
                            }`}>{match.type}</span>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <span className="material-icons animate-spin text-primary text-3xl">hourglass_top</span>
                        <span className="ml-3 text-gray-400">Loading match details...</span>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                        <span className="material-icons text-red-400 text-2xl mb-2">warning</span>
                        <p className="text-red-400 text-sm">Could not load detailed stats: {error}</p>
                        <p className="text-gray-500 text-xs mt-1">Showing available data below.</p>
                    </div>
                )}

                {/* Player Stats Table (from series-state) */}
                {ourTeamStats && ourTeamStats.players && ourTeamStats.players.length > 0 && (
                    <div className="bg-surface-darker rounded-xl p-5 border border-white/5">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-icons-outlined text-primary text-base">group</span>
                            Team Performance
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                                        <th className="text-left py-2 px-2">Player</th>
                                        <th className="text-center py-2 px-2">K</th>
                                        <th className="text-center py-2 px-2">D</th>
                                        <th className="text-center py-2 px-2">A</th>
                                        <th className="text-center py-2 px-2">CS</th>
                                        <th className="text-center py-2 px-2">Gold</th>
                                        <th className="text-center py-2 px-2">Wards</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ourTeamStats.players.map((player, idx) => (
                                        <tr key={player.id || idx} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-2 px-2 font-medium text-white">{player.name}</td>
                                            <td className="py-2 px-2 text-center text-green-400">{player.kills}</td>
                                            <td className="py-2 px-2 text-center text-red-400">{player.deaths}</td>
                                            <td className="py-2 px-2 text-center text-blue-400">{player.assists}</td>
                                            <td className="py-2 px-2 text-center text-gray-300">{player.cs}</td>
                                            <td className="py-2 px-2 text-center text-yellow-400">{(player.gold / 1000).toFixed(1)}k</td>
                                            <td className="py-2 px-2 text-center text-purple-400">{player.wards}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Performance Metrics (fallback if no detailed data) */}
                {!ourTeamStats && !isLoading && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-darker rounded-xl p-5 border border-white/5">
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Macro Control</h3>
                            <div className="flex items-end gap-3">
                                <span className={`text-3xl font-bold font-mono ${match.performance.macroControl >= 70 ? 'text-primary' :
                                    match.performance.macroControl >= 50 ? 'text-yellow-400' : 'text-red-400'
                                    }`}>{match.performance.macroControl}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-800 rounded-full mt-3 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${match.performance.macroControl >= 70 ? 'bg-primary shadow-neon' :
                                        match.performance.macroControl >= 50 ? 'bg-yellow-400' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${match.performance.macroControl}%` }}
                                />
                            </div>
                        </div>
                        <div className="bg-surface-darker rounded-xl p-5 border border-white/5">
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Micro Error Rate</h3>
                            <span className={`text-2xl font-bold ${match.performance.microErrorRate === 'LOW' ? 'text-green-400' :
                                match.performance.microErrorRate === 'MED' ? 'text-yellow-400' : 'text-red-400'
                                }`}>{match.performance.microErrorRate}</span>
                            <p className="text-xs text-gray-500 mt-2">
                                {match.performance.microErrorRate === 'LOW' ? 'Minimal mechanical errors detected' :
                                    match.performance.microErrorRate === 'MED' ? 'Some room for improvement' :
                                        'Significant errors impacted gameplay'}
                            </p>
                        </div>
                    </div>
                )}

                {/* AI Insights */}
                <div className="bg-gradient-to-br from-surface-darker to-surface-dark rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-purple-400 animate-pulse">auto_awesome</span>
                        <h3 className="text-sm font-bold text-white">AI Analysis Insights</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                            <div className="w-1 h-full min-h-[40px] bg-primary/50 rounded-full" />
                            <div>
                                <p className="text-sm text-gray-300">
                                    {isWin
                                        ? 'Strong early game execution led to a gold lead that was maintained throughout.'
                                        : 'Early game mistakes created a deficit that was difficult to recover from.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-1 h-full min-h-[40px] bg-blue-500/50 rounded-full" />
                            <div>
                                <p className="text-sm text-gray-300">
                                    Vision control was {match.performance.macroControl >= 60 ? 'well-maintained' : 'lacking'} around key objectives.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-1 h-full min-h-[40px] bg-purple-500/50 rounded-full" />
                            <div>
                                <p className="text-sm text-gray-300">
                                    Recommend focusing on {isWin ? 'maintaining this momentum in future games' : 'early game decision making and objective priority'}.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline placeholder */}
                <div className="bg-surface-darker rounded-xl p-5 border border-white/5">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-icons-outlined text-gray-400 text-base">timeline</span>
                        Key Moments
                    </h3>
                    <div className="flex items-center gap-4 overflow-x-auto pb-2">
                        <div className="flex-shrink-0 w-32 p-3 bg-surface-dark rounded-lg border border-white/5 text-center">
                            <span className="text-xs text-gray-500 font-mono">03:24</span>
                            <p className="text-xs text-gray-300 mt-1">First Blood</p>
                        </div>
                        <div className="flex-shrink-0 w-32 p-3 bg-surface-dark rounded-lg border border-white/5 text-center">
                            <span className="text-xs text-gray-500 font-mono">12:45</span>
                            <p className="text-xs text-gray-300 mt-1">Herald Take</p>
                        </div>
                        <div className="flex-shrink-0 w-32 p-3 bg-surface-dark rounded-lg border border-white/5 text-center">
                            <span className="text-xs text-gray-500 font-mono">18:30</span>
                            <p className="text-xs text-gray-300 mt-1">Dragon Soul</p>
                        </div>
                        <div className="flex-shrink-0 w-32 p-3 bg-surface-dark rounded-lg border border-primary/20 text-center">
                            <span className="text-xs text-primary font-mono">24:15</span>
                            <p className="text-xs text-primary mt-1">Baron</p>
                        </div>
                    </div>
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
                        <span className="material-icons-outlined text-lg">play_circle</span>
                        Watch VOD
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MatchDetailModal;
