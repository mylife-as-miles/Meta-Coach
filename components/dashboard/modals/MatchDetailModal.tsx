import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import { Match } from '../../../lib/mockData';
import { useSession } from '../../../hooks/useAuth';
import { useWorkspace, useTeamProfile, useMatchStats, useHighImpactPlays } from '../../../hooks/useDashboardQueries';

const LogoWithFallback: React.FC<{ src?: string | null; alt: string; fallbackText: string; className?: string; color?: string; size?: string }> = ({ src, alt, fallbackText, className, color, size = "w-14 h-14" }) => {
    const [error, setError] = React.useState(false);

    if (!src || error) {
        return (
            <div className={`${size} rounded-full border flex items-center justify-center mb-2 overflow-hidden ${color === 'red' ? 'bg-red-900/20 border-red-500/30' : color === 'blue' ? 'bg-blue-900/20 border-blue-500/30' : color === 'orange' ? 'bg-orange-900/20 border-orange-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
                <span className={`font-bold ${size === 'w-14 h-14' ? 'text-lg' : 'text-base'} ${color === 'red' ? 'text-red-400' : color === 'blue' ? 'text-blue-400' : color === 'orange' ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {fallbackText}
                </span>
            </div>
        );
    }

    return (
        <div className={`${size} rounded-full bg-surface-darker/50 border border-white/10 flex items-center justify-center p-1.5 overflow-hidden mb-2`}>
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-contain"
                onError={() => {
                    setError(true);
                }}
            />
        </div>
    );
};

const HighImpactPlaysSection: React.FC<{ matchId: string }> = ({ matchId }) => {
    const { data: plays, isLoading } = useHighImpactPlays(matchId);

    if (isLoading) return <div className="text-center py-4 text-gray-400 text-xs animate-pulse">Analyzing strategic impact...</div>;
    if (!plays || plays.length === 0) return null;

    return (
        <div className="bg-surface-darker rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-icons-outlined text-yellow-400 text-base">emoji_events</span>
                AI Strategic Insights: High-Impact Plays
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                            <th className="py-2 px-2">Time</th>
                            <th className="py-2 px-2">Play</th>
                            <th className="py-2 px-2">Outcome</th>
                            <th className="py-2 px-2 text-right">AI Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plays.map((play, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-2 px-2 font-mono text-gray-400">{play.time}</td>
                                <td className="py-2 px-2 font-medium text-white">{play.play}</td>
                                <td className="py-2 px-2 text-gray-300">{play.outcome}</td>
                                <td className="py-2 px-2 text-right">
                                    <span className={`font-mono font-bold ${play.score >= 90 ? 'text-primary shadow-neon-text' :
                                        play.score >= 80 ? 'text-green-400' :
                                            play.score >= 70 ? 'text-yellow-400' : 'text-gray-400'
                                        }`}>
                                        {play.score}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

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
                            <LogoWithFallback
                                src={teamProfile?.logoUrl}
                                alt={teamName}
                                fallbackText={teamAbbr}
                                color="blue"
                            />
                            <span className="text-xs text-gray-400">{teamName}</span>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white font-mono">{match.score}</div>
                            <span className={`text-sm font-bold ${isWin ? 'text-primary' : 'text-red-400'}`}>
                                {match.result}
                            </span>
                        </div>
                        <div className="text-center">
                            <LogoWithFallback
                                src={match.opponent.logoUrl}
                                alt={match.opponent.name}
                                fallbackText={match.opponent.abbreviation || match.opponent.name.substring(0, 2).toUpperCase()}
                                color={match.opponent.color || 'orange'}
                            />
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

                {/* Map Breakdown (Detailed Area Scores) */}
                {match.areaScores && match.areaScores.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {match.areaScores.map((as, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-all hover:border-primary/40 group ${as.won ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20 opacity-80 hover:opacity-100'
                                }`}>
                                <div className={`absolute top-0 right-0 px-2 py-0.5 text-[8px] font-mono tracking-tighter uppercase ${as.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    Map {idx + 1}
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">{as.map}</span>
                                <div className="text-xl font-bold text-white font-mono flex items-center gap-2">
                                    <span className={as.won ? 'text-green-400' : 'text-gray-400'}>{as.yourScore}</span>
                                    <span className="text-gray-700 text-sm">/</span>
                                    <span className={!as.won ? 'text-red-400' : 'text-gray-400'}>{as.opponentScore}</span>
                                </div>
                                <div className={`mt-2 text-[9px] font-black px-2 py-0.5 rounded ${as.won ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                                    }`}>
                                    {as.won ? 'VICTORY' : 'DEFEAT'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-6 animate-pulse">
                        <div className="p-5 rounded-xl border border-white/5 bg-white/5 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-400 text-sm animate-pulse">auto_awesome</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Strategic Deep Scan in Progress...</span>
                            </div>
                            <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                            <div className="h-3 w-1/2 bg-white/5 rounded"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-32 bg-white/5 rounded-xl border border-white/5"></div>
                            <div className="h-32 bg-white/5 rounded-xl border border-white/5"></div>
                        </div>
                        <div className="h-40 bg-white/5 rounded-xl border border-white/5"></div>
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

                {/* Player Stats Table */}
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
                                    {ourTeamStats.players.map((player: any, idx: number) => (
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

                {/* Performance Metrics fallback */}
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
                        <p className="text-sm text-gray-300">
                            {isWin
                                ? 'Strong early game execution led to a gold lead that was maintained throughout.'
                                : 'Early game mistakes created a deficit that was difficult to recover from.'}
                        </p>
                        <p className="text-sm text-gray-300">
                            Vision control was {match.performance.macroControl >= 60 ? 'well-maintained' : 'lacking'} around key objectives.
                        </p>
                    </div>
                </div>

                {/* High-Impact Plays */}
                <HighImpactPlaysSection matchId={match.id} />

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
