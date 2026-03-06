import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import type { DiceSkin } from '@/data/diceSkins';

interface D20MeshProps {
  skin: DiceSkin;
  phase: 'tumbling' | 'landing' | 'settled';
  onSettled: () => void;
}

const LAND_ROTATION = new THREE.Euler(0.3, 0.5, 0.1);

export function D20Mesh({ skin, phase, onSettled }: D20MeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tumbleSpeed = useRef({
    x: 8 + Math.random() * 4,
    y: 6 + Math.random() * 4,
    z: 5 + Math.random() * 3,
  });
  const landingProgress = useRef(0);
  const settledCalled = useRef(false);
  const capturedRotation = useRef<THREE.Euler | null>(null);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skin.faceColor),
      metalness: skin.metalness,
      roughness: skin.roughness,
      flatShading: true,
    });
    if (skin.emissiveColor) {
      mat.emissive = new THREE.Color(skin.emissiveColor);
      mat.emissiveIntensity = skin.emissiveIntensity ?? 0.1;
    }
    return mat;
  }, [skin]);

  useFrame((_state: any, delta: number) => {
    if (!meshRef.current) return;

    if (phase === 'tumbling') {
      meshRef.current.rotation.x += tumbleSpeed.current.x * delta;
      meshRef.current.rotation.y += tumbleSpeed.current.y * delta;
      meshRef.current.rotation.z += tumbleSpeed.current.z * delta;
      settledCalled.current = false;
      landingProgress.current = 0;
      capturedRotation.current = null;
    } else if (phase === 'landing') {
      if (!capturedRotation.current) {
        capturedRotation.current = meshRef.current.rotation.clone();
      }

      landingProgress.current = Math.min(1, landingProgress.current + delta * 2.5);
      const t = easeOutBounce(landingProgress.current);

      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        capturedRotation.current.x,
        LAND_ROTATION.x,
        t
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        capturedRotation.current.y,
        LAND_ROTATION.y,
        t
      );
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        capturedRotation.current.z,
        LAND_ROTATION.z,
        t
      );

      if (landingProgress.current >= 1 && !settledCalled.current) {
        settledCalled.current = true;
        onSettled();
      }
    }
  });

  return (
    <mesh ref={meshRef} material={material}>
      <icosahedronGeometry args={[1.2, 0]} />
    </mesh>
  );
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) {
    t -= 1.5 / 2.75;
    return 7.5625 * t * t + 0.75;
  }
  if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75;
    return 7.5625 * t * t + 0.9375;
  }
  t -= 2.625 / 2.75;
  return 7.5625 * t * t + 0.984375;
}
