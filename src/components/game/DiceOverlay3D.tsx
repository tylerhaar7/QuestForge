// 3D Dice Roll Overlay — BG3-style d20 with physics tumble
// Uses react-native-wgpu + Three.js WebGPU + cannon-es
// Die result is pre-determined server-side — physics lands on correct face

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, PixelRatio } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Canvas as WGPUCanvas } from 'react-native-wgpu';
import type { CanvasRef } from 'react-native-wgpu';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAccessibility } from '@/providers/AccessibilityProvider';
import { CriticalBurst } from './CriticalBurst';
import type { DiceRollResult } from '@/types/game';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GL_SIZE = 240;

// ─── ReactNativeCanvas wrapper for Three.js ────────────────────────

class ReactNativeCanvas {
  constructor(private canvas: any) {}
  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }
  set width(w: number) { this.canvas.width = w; }
  set height(h: number) { this.canvas.height = h; }
  get clientWidth() { return this.canvas.width; }
  get clientHeight() { return this.canvas.height; }
  set clientWidth(w: number) { this.canvas.width = w; }
  set clientHeight(h: number) { this.canvas.height = h; }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {}
  setPointerCapture() {}
  releasePointerCapture() {}
}

// ─── D20 Geometry + Physics ────────────────────────────────────────

// Pre-compute face normals for landing orientation
function computeFaceNormals(): THREE.Vector3[] {
  const geo = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();
  const pos = geo.getAttribute('position');
  const normals: THREE.Vector3[] = [];

  for (let face = 0; face < 20; face++) {
    const i = face * 3;
    const a = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    const b = new THREE.Vector3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
    const c = new THREE.Vector3(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
    const normal = new THREE.Vector3()
      .crossVectors(b.clone().sub(a), c.clone().sub(a))
      .normalize();
    normals.push(normal);
  }
  return normals;
}

const FACE_NORMALS = computeFaceNormals();

// Get quaternion that lands a specific face (1-20) pointing up
function getLandingQuaternion(faceNum: number): THREE.Quaternion {
  const idx = Math.max(0, Math.min(19, faceNum - 1));
  const normal = FACE_NORMALS[idx];
  const up = new THREE.Vector3(0, 1, 0);
  return new THREE.Quaternion().setFromUnitVectors(normal, up);
}

function createD20Mesh(): THREE.Mesh {
  const geo = new THREE.IcosahedronGeometry(0.8, 0).toNonIndexed();

  const material = new THREE.MeshStandardMaterial({
    color: 0x1a1410,
    metalness: 0.6,
    roughness: 0.3,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(geo, material);

  // Gold wireframe edges
  const edges = new THREE.EdgesGeometry(geo);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xb48c3c });
  const wireframe = new THREE.LineSegments(edges, lineMat);
  mesh.add(wireframe);

  return mesh;
}

// ─── Physics World ─────────────────────────────────────────────────

function createPhysicsWorld() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -15, 0) });
  world.broadphase = new CANNON.NaiveBroadphase();
  (world.solver as CANNON.GSSolver).iterations = 10;

  // Ground plane
  const ground = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: new CANNON.Material({ friction: 0.6, restitution: 0.3 }),
  });
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  ground.position.set(0, -1.5, 0);
  world.addBody(ground);

  // Invisible walls to keep die in view
  const wallShape = new CANNON.Plane();
  const wallMat = new CANNON.Material({ friction: 0.2, restitution: 0.5 });

  const walls = [
    { pos: [2, 0, 0], rot: [0, -Math.PI / 2, 0] },
    { pos: [-2, 0, 0], rot: [0, Math.PI / 2, 0] },
    { pos: [0, 0, 2], rot: [Math.PI / 2, 0, 0] },
    { pos: [0, 0, -2], rot: [-Math.PI / 2, 0, 0] },
  ];

  for (const w of walls) {
    const wall = new CANNON.Body({ mass: 0, shape: wallShape, material: wallMat });
    wall.position.set(w.pos[0] as number, w.pos[1] as number, w.pos[2] as number);
    wall.quaternion.setFromEuler(w.rot[0] as number, w.rot[1] as number, w.rot[2] as number);
    world.addBody(wall);
  }

  // Die body — approximate as sphere for physics
  const dieBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(0.8),
    material: new CANNON.Material({ friction: 0.5, restitution: 0.4 }),
    linearDamping: 0.3,
    angularDamping: 0.3,
  });

  // Random initial velocity for dramatic tumble
  const angle = Math.random() * Math.PI * 2;
  dieBody.position.set(0, 3, 0);
  dieBody.velocity.set(
    Math.cos(angle) * 3,
    -2,
    Math.sin(angle) * 3,
  );
  dieBody.angularVelocity.set(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
  );

  world.addBody(dieBody);

  return { world, dieBody };
}

// ─── Component ─────────────────────────────────────────────────────

interface DiceOverlay3DProps {
  roll: DiceRollResult;
  onComplete: () => void;
}

const PHYSICS_DURATION = 2200; // ms before we force settle
const SETTLE_THRESHOLD = 0.3; // velocity threshold for "settled"

export function DiceOverlay3D({ roll, onComplete }: DiceOverlay3DProps) {
  const [settled, setSettled] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const hapticsEnabled = useSettingsStore((s) => s.accessibility.hapticFeedback);
  const { skipAnimations } = useAccessibility();

  const canvasRef = useRef<CanvasRef>(null);
  const settledRef = useRef(false);
  const rafRef = useRef<number>(0);

  // Reanimated values for result card
  const overlayOpacity = useSharedValue(0);
  const resultOpacity = useSharedValue(0);
  const resultTranslateY = useSharedValue(20);
  const flashOpacity = useSharedValue(0);
  const critGlowOpacity = useSharedValue(0);

  const resultColor = roll.isCritical
    ? colors.gold.primary
    : roll.isFumble
      ? '#8b0000'
      : roll.success
        ? '#4a8c3c'
        : colors.combat.red;

  const verdictText = roll.isCritical
    ? 'CRITICAL SUCCESS'
    : roll.isFumble
      ? 'CRITICAL FAIL'
      : roll.success
        ? 'SUCCESS'
        : 'FAILED';

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  const triggerSettle = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    setSettled(true);

    resultOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    resultTranslateY.value = withDelay(200, withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    }));

    if (roll.isCritical && !skipAnimations) {
      setShowBurst(true);
      setShowFlash(true);
      flashOpacity.value = withSequence(
        withTiming(0.4, { duration: 100, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }),
      );
      critGlowOpacity.value = withDelay(200, withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.6, { duration: 400 }),
      ));
    }

    if (hapticsEnabled) {
      if (roll.isCritical) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 250);
      } else if (roll.success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [roll, hapticsEnabled, skipAnimations]);

  // Set up 3D scene when canvas mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('webgpu');
    if (!context) return;

    const rnCanvas = new ReactNativeCanvas(context.canvas);

    const renderer = new (THREE as any).WebGPURenderer({
      antialias: true,
      canvas: rnCanvas,
      context,
    });

    const dpr = PixelRatio.get();
    const w = GL_SIZE;
    const h = GL_SIZE;
    renderer.setSize(w * dpr, h * dpr);
    renderer.setClearColor(0x000000, 0);

    // Scene
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const keyLight = new THREE.DirectionalLight(0xffe4b5, 1.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8899bb, 0.4);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);

    // Die mesh
    const dieMesh = createD20Mesh();
    scene.add(dieMesh);

    // Physics
    const { world, dieBody } = createPhysicsWorld();

    const startTime = Date.now();
    let hasTriggeredHapticOnBounce = false;

    const initPromise = renderer.init();

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      const elapsed = Date.now() - startTime;
      const dt = 1 / 60;
      world.step(dt);

      // Sync Three.js mesh to physics body
      dieMesh.position.copy(dieBody.position as any);
      dieMesh.quaternion.copy(dieBody.quaternion as any);

      // Haptic on first bounce
      if (!hasTriggeredHapticOnBounce && dieBody.position.y < -0.5 && dieBody.velocity.y > 0) {
        hasTriggeredHapticOnBounce = true;
        if (hapticsEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      // Check if die has settled (low velocity) or timeout
      const speed = dieBody.velocity.length() + dieBody.angularVelocity.length();
      if ((elapsed > 1200 && speed < SETTLE_THRESHOLD) || elapsed > PHYSICS_DURATION) {
        if (!settledRef.current) {
          // Snap to correct landing face
          const landQ = getLandingQuaternion(roll.roll);
          dieMesh.quaternion.copy(landQ);
          dieMesh.position.y = -0.7; // Rest on ground
          dieBody.velocity.setZero();
          dieBody.angularVelocity.setZero();
          triggerSettle();
        }
      }

      renderer.render(scene, camera);
      context.present();
    };

    initPromise.then(() => {
      animate();
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderer.dispose();
    };
  }, [roll.roll, triggerSettle, hapticsEnabled]);

  const handleTap = useCallback(() => {
    if (!settled) {
      triggerSettle();
    } else {
      onComplete();
    }
  }, [settled, triggerSettle, onComplete]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ translateY: resultTranslateY.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const critGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: critGlowOpacity.value,
  }));

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={handleTap}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        {showFlash && !skipAnimations && (
          <Animated.View style={[styles.screenFlash, flashStyle]} pointerEvents="none" />
        )}

        {/* 3D Die Canvas */}
        <View style={styles.canvasContainer}>
          <WGPUCanvas ref={canvasRef} style={styles.canvas} />
        </View>

        {/* Critical burst */}
        {showBurst && !skipAnimations && (
          <CriticalBurst centerX={SCREEN_W / 2} centerY={SCREEN_H * 0.35} />
        )}

        {/* Result card */}
        <Animated.View
          style={[
            styles.resultCard,
            resultStyle,
            settled && { borderColor: resultColor },
            settled && roll.isCritical && styles.critResultCard,
            settled && roll.isCritical && critGlowStyle,
          ]}
        >
          <Text style={styles.rollType}>
            {roll.type === 'attack_roll' ? 'ATTACK ROLL' : roll.type === 'skill_check' ? 'SKILL CHECK' : roll.type === 'saving_throw' ? 'SAVING THROW' : 'DAMAGE ROLL'}
          </Text>
          <Text style={styles.rollerName}>{roll.roller.toUpperCase()}</Text>
          <Text style={styles.rollTarget}>{roll.label.replace(/\b\w/g, c => c.toUpperCase())}</Text>

          <View style={styles.numberRow}>
            <Text style={[styles.totalNumber, { color: resultColor }]}>
              {roll.total}
            </Text>
            {roll.dc != null && (
              <Text style={styles.dcText}>
                vs {roll.type === 'attack_roll' ? 'AC' : 'DC'} {roll.dc}
              </Text>
            )}
          </View>

          <Text style={styles.breakdown}>
            d20({roll.roll}) {roll.modifier >= 0 ? '+' : ''}{roll.modifier}
          </Text>

          <Text style={[styles.verdict, { color: resultColor }]}>
            {verdictText}
          </Text>
        </Animated.View>

        <Text style={styles.tapHint}>
          {settled ? 'Tap to continue' : 'Tap to skip'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  canvasContainer: {
    width: GL_SIZE,
    height: GL_SIZE,
    marginBottom: spacing.xl,
    borderRadius: 12,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    minWidth: 220,
  },
  rollType: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    color: colors.gold.primary,
    letterSpacing: 3,
    marginBottom: 2,
  },
  rollerName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.text.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  rollTarget: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  totalNumber: {
    fontFamily: fonts.heading,
    fontSize: 48,
    letterSpacing: 1,
  },
  dcText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  breakdown: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  verdict: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  tapHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.text.disabled,
    marginTop: spacing.xl,
  },
  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  critResultCard: {
    borderWidth: 2,
    borderColor: colors.gold.primary,
    shadowColor: colors.gold.bright,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
});
