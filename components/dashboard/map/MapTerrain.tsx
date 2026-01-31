import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vPos;

void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform vec3 uColor;
uniform float uGridSize;
varying vec2 vUv;
varying vec3 vPos;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  // Grid pattern
  float grid = step(0.98, fract(vUv.x * uGridSize)) + step(0.98, fract(vUv.y * uGridSize));
  
  // Matrix / Digital Rain effect
  vec2 matrixUv = vUv * 50.0;
  vec2 matrixIp = floor(matrixUv); // Integer position
  
  float rainSpeed = 2.0;
  float rain = random(vec2(matrixIp.x, 1.0)); // Random drop per column
  float drop = fract(rain + uTime * rainSpeed + random(matrixIp) * 0.5);
  
  // Bright head of the drop
  float head = 1.0 - step(0.1, drop);
  // Trail fade
  float trail = smoothstep(0.0, 1.0, drop);
  
  // Combine effects
  vec3 matrixColor = uColor * (head + trail * 0.3);
  
  // Final composite
  // Base dark floor + Grid lines + Matrix rain in active areas
  vec3 color = vec3(0.02, 0.02, 0.04); // Deep dark blue background
  color += vec3(grid) * uColor * 0.2; // Dim grid
  
  // Pulse effect from center (Nexus)
  float dist = distance(vUv, vec2(0.5));
  float pulse = sin(uTime * 2.0 - dist * 10.0) * 0.5 + 0.5;
  color += uColor * pulse * 0.05 * (1.0 - dist); // Subtle pulse

  gl_FragColor = vec4(color + matrixColor * 0.1, 1.0);
}
`;

const MapTerrain = () => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('#D2F96F') }, // Primary neon green
            uGridSize: { value: 40.0 },
        }),
        []
    );

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <planeGeometry args={[50, 50, 1, 1]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={VERTEX_SHADER}
                fragmentShader={FRAGMENT_SHADER}
                uniforms={uniforms}
                transparent
            />
        </mesh>
    );
};

export default MapTerrain;
