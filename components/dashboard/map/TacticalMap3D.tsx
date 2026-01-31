import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import MapTerrain from './MapTerrain';
import ChampionMarker from './ChampionMarker';

interface Player {
    id: string;
    teamId: string;
    name: string;
    role: string;
    position: { x: number; y: number };
}

interface TacticalMap3DProps {
    players: Player[];
    onPlayerClick?: (player: Player) => void;
}

const TacticalMap3D: React.FC<TacticalMap3DProps> = ({ players, onPlayerClick }) => {
    return (
        <div className="w-full h-full bg-[#050505] rounded-2xl overflow-hidden relative">
            <Canvas shadows gl={{ antialias: true, alpha: false }}>
                {/* Scene Settings */}
                <color attach="background" args={['#050505']} />
                <fog attach="fog" args={['#050505', 10, 50]} />

                {/* Camera */}
                <PerspectiveCamera makeDefault position={[0, 40, 30]} fov={50} />
                <OrbitControls
                    enablePan={false}
                    maxPolarAngle={Math.PI / 2.2}
                    minDistance={20}
                    maxDistance={60}
                    autoRotate={true}
                    autoRotateSpeed={0.5}
                />

                {/* Lighting */}
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
                <pointLight position={[-10, 10, -10]} intensity={1} color="#ef4444" />
                <spotLight
                    position={[0, 50, 0]}
                    angle={0.5}
                    penumbra={1}
                    intensity={2}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />

                {/* Environment */}
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <MapTerrain />

                {/* Players */}
                <Suspense fallback={null}>
                    {players.map((player) => {
                        // Map 0-500 simulation coordinates to 3D world space (-25 to 25)
                        // x: 0..500 -> -25..25
                        // y: 0..500 -> -25..25 (mapped to Z in 3D)
                        const x = (player.position.x / 500) * 50 - 25;
                        const z = (player.position.y / 500) * 50 - 25;

                        return (
                            <ChampionMarker
                                key={player.id}
                                position={[x, 0, z]}
                                teamId={player.teamId}
                                role={player.role}
                                name={player.name}
                                isHovered={false}
                                onClick={() => onPlayerClick?.(player)}
                            />
                        );
                    })}
                </Suspense>
            </Canvas>

            {/* Overlay UI elements can go here if needed */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <div className="bg-black/50 backdrop-blur px-3 py-1 text-xs text-white/50 border border-white/10 rounded font-mono">
                    3D TACTICAL VIEW // LIVE
                </div>
            </div>
        </div>
    );
};

export default TacticalMap3D;
