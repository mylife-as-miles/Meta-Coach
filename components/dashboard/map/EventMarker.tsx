import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface EventMarkerProps {
    position: [number, number, number];
    type: string; // 'KILL', 'DRAGON', 'TOWER', 'BARON'
    teamId: string;
    timestamp: number;
}

const EventMarker: React.FC<EventMarkerProps> = ({ position, type, teamId }) => {
    const meshRef = useRef<THREE.Group>(null);

    const isBlue = teamId === 'blue' || teamId === '100';
    const color = isBlue ? '#3b82f6' : '#ef4444';

    // Icon mapping
    const icon = useMemo(() => {
        switch (type) {
            case 'KILL': return '⚔️';
            case 'DRAGON': return '🐉';
            case 'BARON': return '👾';
            case 'TOWER': return '🏰';
            case 'INHIBITOR': return '💎';
            default: return '📍';
        }
    }, [type]);

    useFrame((state) => {
        if (meshRef.current) {
            // Bobbing animation handled by Float, but we can add rotation or scaling pulse
            const t = state.clock.getElapsedTime();
            const scale = 1 + Math.sin(t * 3) * 0.1;
            meshRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5} position={position}>
            <group ref={meshRef}>
                {/* Vertical Beam */}
                <mesh position={[0, -2, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
                    <meshBasicMaterial color={color} transparent opacity={0.6} />
                </mesh>

                {/* Ground Ripple Ring */}
                <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.5, 0.6, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
                </mesh>

                {/* Icon */}
                <Text
                    position={[0, 0.5, 0]}
                    fontSize={1.5}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.05}
                    outlineColor={color}
                >
                    {icon}
                </Text>

                {/* Event Label */}
                <Text
                    position={[0, -0.8, 0]}
                    fontSize={0.4}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/Inter-Bold.ttf"
                >
                    {type}
                </Text>
            </group>
        </Float>
    );
};

export default EventMarker;
