import React, { useState } from 'react';
import { Search, Filter, Cpu, TrendingUp, Trophy, Activity, Zap } from 'lucide-react';
import { calculate_eOBP, calculate_eSLG, calculate_eWAR } from '../../lib/MoneyballMetrics';
import ScoutingReportModal from './modals/ScoutingReportModal';

// Defined specifically for Market/Scouting usage (External Players)
export interface ScoutPlayer {
    id: string;
    name: string;
    role: 'TOP' | 'JG' | 'MID' | 'ADC' | 'SUP';
    team: string;
    avatarUrl?: string;
    stats: {
        kills: number;
        deaths: number;
        assists: number;
        goldEarned: number;
        damageToChampions: number;
        wins: number;
        gamesPlayed: number;
    };
}

// Mock data extension for scouting (simulation)
const MARKET_PLAYERS: ScoutPlayer[] = [
    {
        id: 'p1', name: 'Gumayusi', role: 'ADC', team: 'T1', avatarUrl: 'https://am-a.akamaihd.net/image?resize=60:&f=http%3A%2F%2Fstatic.lolesports.com%2Fplayers%2F1633604810793_Gumayusi.png',
        stats: { kills: 180, deaths: 40, assists: 120, goldEarned: 350000, damageToChampions: 550000, wins: 35, gamesPlayed: 50 }
    },
    {
        id: 'p2', name: 'Ruler', role: 'ADC', team: 'JDG', avatarUrl: 'https://am-a.akamaihd.net/image?resize=60:&f=http%3A%2F%2Fstatic.lolesports.com%2Fplayers%2F1673891461463_Ruler_JDG_2023.png',
        stats: { kills: 200, deaths: 60, assists: 100, goldEarned: 380000, damageToChampions: 580000, wins: 33, gamesPlayed: 50 }
    },
    {
        id: 'p3', name: 'Berserker', role: 'ADC', team: 'C9', avatarUrl: '',
        stats: { kills: 140, deaths: 30, assists: 90, goldEarned: 320000, damageToChampions: 480000, wins: 28, gamesPlayed: 45 }
    },
    // Undervalued Prospect
    {
        id: 'p4', name: 'Peyz', role: 'ADC', team: 'GEN', avatarUrl: '',
        stats: { kills: 150, deaths: 25, assists: 150, goldEarned: 310000, damageToChampions: 520000, wins: 40, gamesPlayed: 50 }
    }
];

const ScoutingView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'moneyball' | 'traditional'>('moneyball');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ADC');
    const [selectedPlayer, setSelectedPlayer] = useState<ScoutPlayer | null>(null); // For Modal

    // Calculate metrics for all players
    const scoutingDatabase = MARKET_PLAYERS.map(p => ({
        ...p,
        eOBP: calculate_eOBP(p.stats),
        eSLG: calculate_eSLG(p.stats),
        eWAR: calculate_eWAR(p.stats, 0.50), // Approx role avg
    }));

    const filteredPlayers = scoutingDatabase.filter(p =>
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.team?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (roleFilter === 'All' || p.role === roleFilter)
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold font-display text-white mb-2 tracking-tight">Market Scouting</h1>
                    <p className="text-gray-400">Discover undervalued talent using advanced sabermetrics</p>
                </div>

                <div className="flex gap-4">
                    <div className="flex bg-surface-dark border border-white/10 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('traditional')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'traditional' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Traditional
                        </button>
                        <button
                            onClick={() => setViewMode('moneyball')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'moneyball' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Cpu size={14} />
                            Moneyball
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="flex gap-4 bg-surface-dark p-4 rounded-xl border border-white/5 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search player, team..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="w-px h-8 bg-white/10 mx-2"></div>

                <div className="flex gap-2">
                    {['Top', 'Jungle', 'Mid', 'ADC', 'Support'].map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-4 py-2 rounded-lg text-sm border transition-all ${roleFilter === role ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Player Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlayers.map(player => (
                    <div key={player.id} className="group bg-surface-dark border border-white/5 rounded-2xl p-5 hover:border-primary/30 transition-all hover:shadow-[0_0_30px_-10px_rgba(196,240,66,0.2)] relative overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-xl bg-black/50 border border-white/10 overflow-hidden relative">
                                {player.avatarUrl ? (
                                    <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">{player.role[0]}</div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white leading-none mb-1">{player.name}</h3>
                                <div className="text-sm text-gray-400 font-mono">{player.team || 'Free Agent'} • {player.role}</div>
                            </div>
                        </div>

                        {/* Stats Display */}
                        {viewMode === 'moneyball' ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
                                        <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 flex justify-center items-center gap-1">
                                            eOBP <Activity size={10} className="text-blue-400" />
                                        </div>
                                        <div className="text-xl font-mono text-blue-400 font-bold">{player.eOBP.toFixed(3)}</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
                                        <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 flex justify-center items-center gap-1">
                                            eSLG <Zap size={10} className="text-yellow-400" />
                                        </div>
                                        <div className="text-xl font-mono text-yellow-400 font-bold">{player.eSLG.toFixed(0)}</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
                                        <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 flex justify-center items-center gap-1">
                                            eWAR <Trophy size={10} className="text-primary" />
                                        </div>
                                        <div className="text-xl font-mono text-primary font-bold">{player.eWAR.toFixed(1)}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedPlayer(player)}
                                    className="w-full py-3 mt-2 bg-gradient-to-r from-gray-800 to-gray-900 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-primary/50 transition-all flex items-center justify-center gap-2 group-hover:from-gray-800 group-hover:to-gray-800"
                                >
                                    <Cpu size={14} />
                                    Generate Scout Report (Gemini)
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                    <span className="text-gray-500">KDA Ratio</span>
                                    <span className="text-white font-mono">{((player.stats.kills + player.stats.assists) / (player.stats.deaths || 1)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                    <span className="text-gray-500">Avg Gold</span>
                                    <span className="text-white font-mono">{(player.stats.goldEarned / player.stats.gamesPlayed / 1000).toFixed(1)}k</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pb-2">
                                    <span className="text-gray-500">Win Rate</span>
                                    <span className="text-white font-mono">{((player.stats.wins / player.stats.gamesPlayed) * 100).toFixed(1)}%</span>
                                </div>
                                <button className="w-full py-3 mt-2 bg-white text-black font-bold rounded-lg text-sm hover:bg-gray-200 transition-colors">
                                    View Full Profile
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* AI Scout Report Modal */}
            {selectedPlayer && (
                <ScoutingReportModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </div>
    );
};

export default ScoutingView;
