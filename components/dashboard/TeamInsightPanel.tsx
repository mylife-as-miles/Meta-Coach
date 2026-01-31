import React from 'react';
import { Champion } from '../../lib/mockData';

// Radar Chart Component (SVG)
const RadarChart = ({ attributes }: { attributes: { label: string; value: number }[] }) => {
    const size = 100;
    const center = size / 2;
    const radius = 35;
    const angleStep = (Math.PI * 2) / attributes.length;

    // Calculate points for the data polygon
    const points = attributes.map((attr, i) => {
        const angle = i * angleStep - Math.PI / 2; // Start at top
        const r = (attr.value / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    // Calculate points for the background pentagon (100% value)
    const backgroundPoints = attributes.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="relative w-full aspect-square flex items-center justify-center">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full max-w-[120px]">
                {/* Background Pentagon */}
                <polygon points={backgroundPoints} fill="none" stroke="#334155" strokeWidth="1" />

                {/* Data Polygon */}
                <polygon points={points} fill="rgba(210, 249, 111, 0.2)" stroke="#D2F96F" strokeWidth="2" />

                {/* Labels (Simplified for size) */}
                {attributes.map((attr, i) => {
                    // Only show small dots for simplified view, distinct labels might clutter
                    const angle = i * angleStep - Math.PI / 2;
                    const x = center + (radius + 8) * Math.cos(angle);
                    const y = center + (radius + 8) * Math.sin(angle);

                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="6"
                            fill="#64748b"
                            className="uppercase font-mono"
                        >
                            {attr.label.substring(0, 3)}
                        </text>
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-primary font-mono tracking-wider opacity-80">Rating</span>
            </div>
        </div>
    );
};

interface TeamInsightPanelProps {
    teamName?: string;
    winRate?: number;
    avgGameTime?: string;
    firstBloodRate?: number;
    dragonControl?: number;
    players?: {
        name: string;
        role: string;
        image?: string;
        banPriority: 'CRITICAL' | 'HIGH' | 'MED' | 'LOW';
        attributes: { label: string; value: number }[];
        powerPicks: { name: string; winRate: number }[];
    }[];
    onSearchClick?: () => void;
}

const TeamInsightPanel: React.FC<TeamInsightPanelProps> = ({
    teamName = "T1",
    winRate = 75,
    avgGameTime = "28:42",
    firstBloodRate = 62.5,
    dragonControl = 71,
    players = [
        // Default Mock Data matching the reference image style
        {
            name: "Zeus",
            role: "TOP",
            banPriority: "HIGH",
            attributes: [
                { label: "Laning", value: 95 },
                { label: "Teamfight", value: 88 },
                { label: "Vision", value: 70 },
                { label: "Economy", value: 90 },
                { label: "Pathing", value: 85 },
            ],
            powerPicks: [
                { name: "Yone", winRate: 78 },
                { name: "Jayce", winRate: 71 },
                { name: "Gnar", winRate: 65 }
            ]
        },
        {
            name: "Oner",
            role: "JUNGLE",
            banPriority: "MED",
            attributes: [
                { label: "Gank", value: 85 },
                { label: "Control", value: 80 },
                { label: "Farming", value: 92 },
                { label: "Combat", value: 88 },
                { label: "Vision", value: 75 },
            ],
            powerPicks: [
                { name: "Lee Sin", winRate: 68 },
                { name: "Viego", winRate: 62 },
                { name: "Sejuani", winRate: 58 }
            ]
        },
        {
            name: "Faker",
            role: "MID",
            banPriority: "CRITICAL",
            attributes: [
                { label: "Macro", value: 99 },
                { label: "Micro", value: 95 },
                { label: "Roam", value: 90 },
                { label: "Lane", value: 92 },
                { label: "Team", value: 100 },
            ],
            powerPicks: [
                { name: "Orianna", winRate: 82 },
                { name: "Azir", winRate: 75 },
                { name: "Ahri", winRate: 70 }
            ]
        },
        {
            name: "Gumayusi",
            role: "ADC",
            banPriority: "LOW",
            attributes: [
                { label: "Dmg", value: 98 },
                { label: "Survive", value: 85 },
                { label: "Lane", value: 90 },
                { label: "Gold", value: 95 },
                { label: "Micro", value: 92 },
            ],
            powerPicks: [
                { name: "Varus", winRate: 64 },
                { name: "Draven", winRate: 60 },
                { name: "Caitlyn", winRate: 55 }
            ]
        },
        {
            name: "Keria",
            role: "SUPPORT",
            banPriority: "HIGH",
            attributes: [
                { label: "Vision", value: 98 },
                { label: "Roam", value: 95 },
                { label: "Engage", value: 92 },
                { label: "Peel", value: 88 },
                { label: "Lane", value: 94 },
            ],
            powerPicks: [
                { name: "Ashe", winRate: 75 },
                { name: "Rell", winRate: 68 },
                { name: "Nautilus", winRate: 62 }
            ]
        }
    ],
    onSearchClick
}) => {
    return (
        <div className="w-full h-full bg-[#050505] rounded-2xl overflow-hidden flex flex-col font-sans">
            {/* Header */}
            <header className="px-6 py-6 border-b border-white/5 flex items-center justify-between bg-[#0a0c0f]">
                <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={onSearchClick} title="Click to change team">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center shadow-lg relative group">
                        <span className="text-2xl font-bold text-white group-hover:hidden">{teamName.substring(0, 2)}</span>
                        <span className="material-icons text-white hidden group-hover:block">search</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-white tracking-tight">{teamName}</h1>
                            <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">LCK</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-400 text-sm">Summer Split Record</span>
                            <span className="text-white font-bold text-sm">15W - 3L</span>
                            <span className="bg-green-500/10 text-green-400 text-[10px] px-1.5 py-0.5 rounded font-mono border border-green-500/20">#1 Standing</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="text-center">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Avg Game Time</div>
                        <div className="text-2xl font-bold text-white font-mono">{avgGameTime}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">First Blood %</div>
                        <div className={`text-2xl font-bold font-mono ${firstBloodRate > 50 ? 'text-[#D2F96F]' : 'text-white'}`}>{firstBloodRate}%</div>
                    </div>
                    <div className="text-center px-4 border-r border-white/10">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Dragon Control</div>
                        <div className={`text-2xl font-bold font-mono ${dragonControl > 50 ? 'text-green-400' : 'text-white'}`}>{dragonControl}%</div>
                    </div>
                    <button className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                        <span className="material-icons text-sm">download</span>
                        Export PDF
                    </button>
                </div>
            </header>

            {/* Roster Grid */}
            <div className="flex-1 p-6 grid grid-cols-5 gap-4 overflow-y-auto">
                {players.map((player, idx) => (
                    <div key={idx} className="bg-[#0f1115] rounded-xl border border-white/5 p-4 flex flex-col h-full hover:border-[#D2F96F]/30 transition-colors group">
                        {/* Player Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-widest">
                                <span className="material-icons text-xs opacity-50">
                                    {player.role === 'TOP' ? 'arrow_upward' :
                                        player.role === 'JUNGLE' ? 'nature' :
                                            player.role === 'MID' ? 'bolt' :
                                                player.role === 'ADC' ? 'gps_fixed' : 'support'}
                                </span>
                                {player.role}
                            </div>
                            <div className={`
                                px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider
                                ${player.banPriority === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' :
                                    player.banPriority === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                        player.banPriority === 'MED' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                            'bg-green-500/10 text-green-500 border-green-500/20'}
                            `}>
                                Ban Prio: {player.banPriority}
                            </div>
                        </div>

                        {/* Player Info */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden border border-white/10 relative">
                                {player.image ? (
                                    <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                        <span className="text-xl">👤</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-xl font-bold text-white leading-none">{player.name}</div>
                                <div className="text-xs text-gray-500 font-mono mt-1">Tier 1 • Veteran</div>
                            </div>
                        </div>

                        {/* Radar Chart */}
                        <div className="flex-1 flex items-center justify-center mb-6 relative">
                            <RadarChart attributes={player.attributes} />
                        </div>

                        {/* Power Picks */}
                        <div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Power Picks</div>
                            <div className="space-y-1.5">
                                {player.powerPicks.map((pick, pIdx) => (
                                    <div key={pIdx} className="flex items-center justify-between text-sm bg-black/20 p-2 rounded border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 bg-gray-800 rounded-full text-[10px] flex items-center justify-center text-gray-400 border border-white/10">
                                                {pick.name[0]}
                                            </span>
                                            <span className="text-gray-300 font-medium">{pick.name}</span>
                                        </div>
                                        <span className={`font-mono font-bold ${pick.winRate >= 70 ? 'text-[#D2F96F]' : 'text-gray-400'}`}>
                                            {pick.winRate}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamInsightPanel;
