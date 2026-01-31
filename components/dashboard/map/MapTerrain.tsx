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
uniform vec2 uHotspots[10]; // Max 10 hotspots for now
uniform int uHotspotCount;

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
  
  // Heatmap effect
  float heat = 0.0;
  for(int i = 0; i < 10; i++) {
    if(i >= uHotspotCount) break;
    // Map UV (0-1) to roughly world space or match hotspot coordinates logic
    // Assuming hotspots passed as UV coordinates (0-1)
    float dist = distance(vUv, uHotspots[i]);
    // Gaussian falloff
    heat += exp(-pow(dist / 0.15, 2.0));
  }
  
  // Heat color ramp (Blue -> Red -> Yellow)
  vec3 heatColor = mix(vec3(0.0), vec3(1.0, 0.2, 0.0), smoothstep(0.0, 0.5, heat));
  heatColor = mix(heatColor, vec3(1.0, 0.9, 0.2), smoothstep(0.5, 1.0, heat));

  // Combine effects
  // Base dark floor + Grid lines + Matrix rain in active areas
  vec3 color = vec3(0.02, 0.02, 0.04); // Deep dark blue background
  
  // Add heat
  color += heatColor * 0.8;
  
  color += vec3(grid) * uColor * 0.2; // Dim grid
  
  // Pulse effect from center (Nexus)
  float dist = distance(vUv, vec2(0.5));
  float pulse = sin(uTime * 2.0 - dist * 10.0) * 0.5 + 0.5;
  color += uColor * pulse * 0.05 * (1.0 - dist); // Subtle pulse

  gl_FragColor = vec4(color + matrixColor * 0.1, 1.0);
}
`;

const MapTerrain = ({ hotspots = [] }: { hotspots?: { x: number, y: number }[] }) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    // Prepare hotspot uniforms
    // Map grid coordinates (0-500) to UVs (0-1)
    // Note: In 3D logic x is x, y is z. And UV is 0-1. 
    // If Map size is 500x500 in game units.
    const hotspotVectors = useMemo(() => {
        const vecs = new Array(10).fill(new THREE.Vector2(0, 0));
        hotspots.slice(0, 10).forEach((h, i) => {
            // Flip Y because texture UV y=0 is bottom
            vecs[i] = new THREE.Vector2(h.x / 500, 1.0 - (h.y / 500));
        });
        return vecs;
    }, [hotspots]);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('#D2F96F') }, // Primary neon green
            uGridSize: { value: 40.0 },
            uHotspots: { value: hotspotVectors },
            uHotspotCount: { value: hotspots.length }
        }),
        [] // Initial setup only
    );

    // Update uniforms when props change
    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
            materialRef.current.uniforms.uHotspots.value = hotspotVectors;
            materialRef.current.uniforms.uHotspotCount.value = hotspots.length;
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
