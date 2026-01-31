import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface ChampionMarkerProps {
    position: [number, number, number];
    teamId: string;
    role: string;
    name: string;
    isHovered: boolean;
    onClick?: () => void;
}

const ChampionMarker: React.FC<ChampionMarkerProps> = ({ position, teamId, role, name, isHovered, onClick }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    const isBlue = teamId === 'blue' || teamId === '100';
    const color = isBlue ? '#3b82f6' : '#ef4444'; // Blue vs Red

    useFrame((state) => {
        if (meshRef.current) {
            // Idle animation
            meshRef.current.rotation.y += 0.02;

            // Pulse scale on hover
            const targetScale = hovered || isHovered ? 1.2 : 1.0;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    return (
        <group position={position}>
            {/* Floating Label */}
            <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
                <Text
                    position={[0, 2.5, 0]}
                    fontSize={0.4}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="black"
                >
                    {name}
                </Text>
                <Text
                    position={[0, 2.1, 0]}
                    fontSize={0.25}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                >
                    {role}
                </Text>
            </Float>

            {/* Champion Model Representation (Capsule for now) */}
            <mesh
                ref={meshRef}
                position={[0, 1, 0]}
                onClick={onClick}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                castShadow
            >
                <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered || isHovered ? 0.8 : 0.2}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>

            {/* Role Icon / Ring */}
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.6, 0.7, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>

            {/* Soft Contact Shadow - The "Fake Soft Shadow" requested */}
            <ContactShadows
                opacity={0.6}
                scale={4}
                blur={1.5}
                far={2}
                resolution={256}
                color="#000000"
            />
        </group>
    );
};

export default ChampionMarker;
