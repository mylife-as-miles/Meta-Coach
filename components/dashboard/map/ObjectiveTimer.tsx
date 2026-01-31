import React from 'react';
import { Html } from '@react-three/drei';

interface ObjectiveTimerProps {
    position: [number, number, number];
    label: string;
    type: 'dragon' | 'baron' | 'herald';
    nextSpawnTime: number | null; // Seconds until spawn, or null if live
    currentTime: number;
}

const ObjectiveTimer: React.FC<ObjectiveTimerProps> = ({ position, label, type, nextSpawnTime, currentTime }) => {

    // Calculate display
    let display = 'LIVE';
    let isLive = true;

    if (nextSpawnTime !== null && nextSpawnTime > currentTime) {
        const diff = nextSpawnTime - currentTime;
        const mins = Math.floor(diff / 60);
        const secs = Math.floor(diff % 60);
        display = `${mins}:${secs.toString().padStart(2, '0')}`;
        isLive = false;
    }

    const color = type === 'baron' ? '#a855f7' : type === 'dragon' ? '#f97316' : '#a855f7'; // Purple for Baron/Herald, Orange for Dragon

    return (
        <group position={position}>
            <Html center distanceFactor={15} zIndexRange={[100, 0]}>
                <div className={`flex flex-col items-center pointer-events-none transform transition-all duration-300 ${isLive ? 'scale-110' : 'scale-100 opacity-80'}`}>
                    <div
                        className={`px-3 py-1 rounded-full border backdrop-blur-md shadow-lg flex items-center gap-2
                        ${isLive ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-black/60 border-white/10'}
                        `}
                    >
                        <span className="material-icons text-sm" style={{ color }}>
                            {type === 'dragon' ? 'whatshot' : 'visibility'}
                        </span>
                        <span className={`text-xs font-bold font-mono ${isLive ? 'text-white' : 'text-gray-300'}`}>
                            {display}
                        </span>
                    </div>
                    <div className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-wider bg-black/40 px-1 rounded">
                        {label}
                    </div>
                    {/* Vertical line to ground */}
                    <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent mx-auto mt-1"></div>
                </div>
            </Html>
        </group>
    );
};

export default ObjectiveTimer;
