'use client';

import React, { useRef, useMemo, useEffect, Suspense, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { useAvatarStore, setSceneRef } from '../store';
import * as THREE from 'three';

// Loading spinner
function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-white text-sm">Loading Avatar...</span>
      </div>
    </Html>
  );
}

// Hair Mesh Component - Different hairstyles
function HairMesh({ 
  hairId, 
  headWidth, 
  headHeight, 
  headDepth, 
  hairMat,
  seg 
}: { 
  hairId: string | null; 
  headWidth: number; 
  headHeight: number; 
  headDepth: number;
  hairMat: THREE.Material;
  seg: number;
}) {
  if (!hairId || hairId === 'bald') return null;
  
  // Different hair geometry based on style
  switch (hairId) {
    // FADE CUTS - Lil Boosie style
    case 'baldfade':
    case 'lowfade':
    case 'highfade':
      const fadeHeight = hairId === 'baldfade' ? 0.25 : hairId === 'lowfade' ? 0.35 : 0.4;
      return (
        <group>
          {/* Low hair on top */}
          <mesh position={[0, headHeight * fadeHeight, 0]} material={hairMat} scale={[headWidth * 0.95, headHeight * 0.15, headDepth * 0.9]} castShadow>
            <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
          {/* Fade sides - darker gradient simulated with smaller pieces */}
          <mesh position={[0, headHeight * 0.1, 0]} material={hairMat} scale={[headWidth * 0.98, headHeight * 0.08, headDepth * 0.95]} castShadow>
            <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.25]} />
          </mesh>
        </group>
      );
    
    // BUZZ CUT / CREW CUT
    case 'buzzcut':
    case 'crewcut':
      return (
        <mesh position={[0, headHeight * 0.35, 0]} material={hairMat} scale={[headWidth * 1.02, headHeight * 0.2, headDepth * 0.98]} castShadow>
          <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
      );
    
    // 360 WAVES
    case 'waves':
      return (
        <group>
          <mesh position={[0, headHeight * 0.3, 0]} material={hairMat} scale={[headWidth * 1.01, headHeight * 0.18, headDepth * 0.98]} castShadow>
            <sphereGeometry args={[1, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
          {/* Wave pattern - rings */}
          {[0, 0.05, 0.1].map((offset, i) => (
            <mesh key={i} position={[0, headHeight * (0.35 - offset), 0]} material={hairMat} castShadow>
              <torusGeometry args={[headWidth * (0.7 - i * 0.1), 0.003, 8, 32]} />
            </mesh>
          ))}
        </group>
      );
    
    // FLAT TOP
    case 'flatop':
      return (
        <mesh position={[0, headHeight * 0.45, 0]} material={hairMat} castShadow>
          <cylinderGeometry args={[headWidth * 0.85, headWidth * 0.9, headHeight * 0.35, seg]} />
        </mesh>
      );
    
    // AFRO - sits on TOP of head, doesn't cover face
    case 'afro01':
      return (
        <mesh position={[0, headHeight * 1.2, 0]} material={hairMat} scale={[headWidth * 1.8, headHeight * 1.4, headDepth * 1.6]} castShadow>
          <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
        </mesh>
      );
    
    // AFRO PUFF - higher on head
    case 'afropuff':
      return (
        <mesh position={[0, headHeight * 1.4, 0]} material={hairMat} scale={[headWidth * 1.2, headHeight * 1.0, headDepth * 1.1]} castShadow>
          <sphereGeometry args={[1, seg, seg]} />
        </mesh>
      );
    
    // DREADLOCKS
    case 'dreads':
    case 'dreadslong':
    case 'dreadsshort':
      const dreadLength = hairId === 'dreadsshort' ? 0.08 : hairId === 'dreads' ? 0.15 : 0.25;
      const dreadCount = 20;
      return (
        <group>
          {/* Base cap */}
          <mesh position={[0, headHeight * 0.4, 0]} material={hairMat} scale={[headWidth * 1.05, headHeight * 0.5, headDepth * 1.02]} castShadow>
            <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          {/* Individual dreads */}
          {Array.from({ length: dreadCount }).map((_, i) => {
            const angle = (i / dreadCount) * Math.PI * 2;
            const row = Math.floor(i / 8);
            const tilt = 0.3 + row * 0.15;
            const x = Math.sin(angle) * headWidth * (0.7 + row * 0.2);
            const z = Math.cos(angle) * headDepth * (0.7 + row * 0.2);
            const y = headHeight * (0.4 - row * 0.1);
            return (
              <mesh 
                key={i} 
                position={[x, y, z]} 
                rotation={[tilt * Math.cos(angle), 0, tilt * Math.sin(angle)]}
                material={hairMat} 
                castShadow
              >
                <cylinderGeometry args={[0.008, 0.005, dreadLength, 6]} />
              </mesh>
            );
          })}
        </group>
      );
    
    // CORNROWS
    case 'cornrows':
      return (
        <group>
          {/* Cornrow lines going back */}
          {[-0.08, -0.04, 0, 0.04, 0.08].map((offset, i) => (
            <mesh 
              key={i} 
              position={[offset, headHeight * 0.35, -headDepth * 0.2]} 
              rotation={[Math.PI * 0.35, 0, 0]}
              material={hairMat} 
              castShadow
            >
              <capsuleGeometry args={[0.006, headDepth * 1.5, 4, 8]} />
            </mesh>
          ))}
        </group>
      );
    
    // BOX BRAIDS
    case 'boxbraids':
      const braidCount = 30;
      return (
        <group>
          {/* Base */}
          <mesh position={[0, headHeight * 0.35, 0]} material={hairMat} scale={[headWidth * 1.02, headHeight * 0.4, headDepth * 1]} castShadow>
            <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          </mesh>
          {/* Braids hanging down */}
          {Array.from({ length: braidCount }).map((_, i) => {
            const angle = (i / braidCount) * Math.PI * 2;
            const x = Math.sin(angle) * headWidth * 0.9;
            const z = Math.cos(angle) * headDepth * 0.9;
            return (
              <mesh 
                key={i} 
                position={[x, -0.02, z]} 
                material={hairMat} 
                castShadow
              >
                <cylinderGeometry args={[0.005, 0.004, 0.18, 4]} />
              </mesh>
            );
          })}
        </group>
      );
    
    // TWISTS
    case 'twists':
      return (
        <group>
          <mesh position={[0, headHeight * 0.4, 0]} material={hairMat} scale={[headWidth * 1.1, headHeight * 0.6, headDepth * 1.05]} castShadow>
            <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          </mesh>
          {/* Twist texture bumps */}
          {Array.from({ length: 15 }).map((_, i) => {
            const angle = (i / 15) * Math.PI * 2;
            const x = Math.sin(angle) * headWidth * 0.8;
            const z = Math.cos(angle) * headDepth * 0.75;
            return (
              <mesh key={i} position={[x, headHeight * 0.5, z]} material={hairMat} castShadow>
                <sphereGeometry args={[0.015, 8, 8]} />
              </mesh>
            );
          })}
        </group>
      );
    
    // MOHAWK
    case 'mohawk01':
      return (
        <group>
          {/* Main mohawk strip */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh 
              key={i} 
              position={[0, headHeight * (0.5 + i * 0.05), -headDepth * (0.3 - i * 0.1)]} 
              material={hairMat} 
              castShadow
            >
              <sphereGeometry args={[0.02 + i * 0.005, 8, 8]} />
            </mesh>
          ))}
        </group>
      );
    
    // PONYTAIL - hair on top with tail in back
    case 'ponytail01':
      return (
        <group>
          {/* Hair on top */}
          <mesh position={[0, headHeight * 0.75, 0]} material={hairMat} scale={[headWidth * 1.05, headHeight * 0.5, headDepth * 1]} castShadow>
            <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          {/* Ponytail - in back */}
          <mesh position={[0, headHeight * 0.5, -headDepth * 0.9]} rotation={[Math.PI * 0.4, 0, 0]} material={hairMat} castShadow>
            <cylinderGeometry args={[0.03, 0.015, 0.25, 8]} />
          </mesh>
        </group>
      );
    
    // BUN - on top/back of head
    case 'bun01':
      return (
        <group>
          {/* Hair on top */}
          <mesh position={[0, headHeight * 0.75, 0]} material={hairMat} scale={[headWidth * 1.03, headHeight * 0.45, headDepth * 0.98]} castShadow>
            <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          {/* Bun - on top back */}
          <mesh position={[0, headHeight * 1.1, -headDepth * 0.4]} material={hairMat} castShadow>
            <sphereGeometry args={[0.05, seg, seg]} />
          </mesh>
        </group>
      );
    
    // SHORT - sits on top of head
    case 'short01':
      return (
        <mesh position={[0, headHeight * 0.8, 0]} material={hairMat} scale={[headWidth * 1.06, headHeight * 0.5, headDepth * 1.02]} castShadow>
          <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
      );
    
    // MEDIUM - sits on top, doesn't cover eyes
    case 'medium01':
      return (
        <group>
          {/* Top cap */}
          <mesh position={[0, headHeight * 0.75, 0]} material={hairMat} scale={[headWidth * 1.1, headHeight * 0.6, headDepth * 1.05]} castShadow>
            <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          </mesh>
          {/* Side hair - beside ears, not over face */}
          <mesh position={[-headWidth * 1.0, -headHeight * 0.1, 0]} material={hairMat} scale={[0.3, 0.5, 0.5]} castShadow>
            <sphereGeometry args={[0.08, 12, 12]} />
          </mesh>
          <mesh position={[headWidth * 1.0, -headHeight * 0.1, 0]} material={hairMat} scale={[0.3, 0.5, 0.5]} castShadow>
            <sphereGeometry args={[0.08, 12, 12]} />
          </mesh>
        </group>
      );
    
    // LONG - flows down back and sides, not over face
    case 'long01':
      return (
        <group>
          {/* Top cap */}
          <mesh position={[0, headHeight * 0.75, 0]} material={hairMat} scale={[headWidth * 1.08, headHeight * 0.55, headDepth * 1.05]} castShadow>
            <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          </mesh>
          {/* Long back hair - flowing down */}
          <mesh position={[0, -headHeight * 0.5, -headDepth * 0.7]} material={hairMat} castShadow>
            <boxGeometry args={[headWidth * 2.2, headHeight * 1.5, 0.03]} />
          </mesh>
          {/* Side drapes - beside face */}
          <mesh position={[-headWidth * 1.0, -headHeight * 0.3, 0]} material={hairMat} castShadow>
            <boxGeometry args={[0.02, headHeight * 1.2, 0.04]} />
          </mesh>
          <mesh position={[headWidth * 1.0, -headHeight * 0.3, 0]} material={hairMat} castShadow>
            <boxGeometry args={[0.02, headHeight * 1.2, 0.04]} />
          </mesh>
        </group>
      );
    
    // CURLY - on top of head
    case 'curly01':
      return (
        <group>
          {/* Base curly mass - higher position */}
          <mesh position={[0, headHeight * 0.9, 0]} material={hairMat} scale={[headWidth * 1.3, headHeight * 0.8, headDepth * 1.2]} castShadow>
            <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          </mesh>
          {/* Curl bumps for texture - positioned higher */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * Math.PI * 2;
            const row = Math.floor(i / 8);
            const radius = headWidth * (1.15 - row * 0.15);
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius * 0.9;
            const y = headHeight * (1.0 - row * 0.2);
            return (
              <mesh key={i} position={[x, y, z]} material={hairMat} castShadow>
                <sphereGeometry args={[0.018, 6, 6]} />
              </mesh>
            );
          })}
        </group>
      );
    
    default:
      // Default short hair - on top of head
      return (
        <mesh position={[0, headHeight * 0.8, 0]} material={hairMat} scale={[headWidth * 1.06, headHeight * 0.5, headDepth * 1.02]} castShadow>
          <sphereGeometry args={[1, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
      );
  }
}

// Scaled Sphere component for body parts
function ScaledSphere({ 
  scaleX, scaleY, scaleZ, material, segments = 32, ...props 
}: { 
  scaleX: number; scaleY: number; scaleZ: number; 
  material: THREE.Material; segments?: number;
} & JSX.IntrinsicElements['mesh']) {
  return (
    <mesh {...props} material={material} scale={[scaleX, scaleY, scaleZ]} castShadow>
      <sphereGeometry args={[1, segments, segments]} />
    </mesh>
  );
}

// Human body built with smooth geometry
function RealisticHumanBody() {
  const { avatar, ui, faceGeometry, pose } = useAvatarStore();
  const groupRef = useRef<THREE.Group>(null);
  
  // Calculate body dimensions from all sliders
  const body = useMemo(() => {
    const m = avatar.macro;
    const f = avatar.face;
    const t = avatar.torso;
    const a = avatar.arms;
    const l = avatar.legs;
    
    // Core parameters
    const gender = m.gender / 100;
    const muscle = m.muscle / 100;
    const weight = m.weight / 100;
    const height = 1.6 + (m.height / 100) * 0.4;
    const proportions = m.proportions / 100;
    
    // Ethnicity
    const african = m.african / 100;
    const asian = m.asian / 100;
    
    // === HEAD ===
    const headScale = 0.95 + proportions * 0.1;
    const headWidth = (0.14 + (f.headWidth / 100 - 0.5) * 0.04) * headScale;
    const headHeight = (0.18 + (f.headHeight / 100 - 0.5) * 0.04) * headScale;
    const headDepth = (0.16 + (f.headDepth / 100 - 0.5) * 0.03) * headScale;
    
    // Face features - BIGGER sizes for visibility
    const eyeSize = 0.022 + (f.eyeSize / 100 - 0.5) * 0.012;  // 2x bigger
    const eyeSpacing = 0.045 + (f.eyeSpacing / 100 - 0.5) * 0.015;
    const noseSize = 1.2 + (f.noseWidth / 100 - 0.5) * 0.6 + african * 0.3;  // Bigger
    const noseLength = 0.045 + (f.noseLength / 100 - 0.5) * 0.025;  // Longer
    const mouthWidth = 0.045 + (f.mouthWidth / 100 - 0.5) * 0.02 + african * 0.008;  // Wider
    const lipFullness = (f.lipUpperFullness + f.lipLowerFullness) / 200;
    const jawWidth = headWidth * (0.9 + (f.jawWidth / 100 - 0.5) * 0.2 + gender * 0.1);
    const chinSize = 0.8 + (f.chinHeight / 100 - 0.5) * 0.4;
    const earSize = 0.025 + (f.earSize / 100 - 0.5) * 0.012;  // Bigger
    
    // Neck
    const neckRadius = 0.045 + gender * 0.015 + muscle * 0.01 + (f.neckWidth / 100 - 0.5) * 0.015;
    const neckLength = 0.08 + (f.neckLength / 100 - 0.5) * 0.03;
    
    // === TORSO ===
    const shoulderWidth = 0.18 + gender * 0.06 + muscle * 0.03 + (t.shoulderWidth / 100 - 0.5) * 0.04;
    const chestWidth = 0.15 + gender * 0.02 + muscle * 0.02 + weight * 0.02 + (t.chestWidth / 100 - 0.5) * 0.03;
    const chestDepth = 0.1 + muscle * 0.03 + weight * 0.025 + (t.chestDepth / 100 - 0.5) * 0.025;
    const bustSize = (1 - gender) * (t.bustSize / 100) * 0.06;
    const waistWidth = 0.12 + weight * 0.06 - gender * 0.02 + (t.waistWidth / 100 - 0.5) * 0.03;
    const hipWidth = 0.15 + (1 - gender) * 0.04 + weight * 0.03 + (t.hipWidth / 100 - 0.5) * 0.03;
    const stomachDepth = chestDepth * (0.9 + weight * 0.3 + (t.stomachSize / 100 - 0.5) * 0.2);
    const buttockSize = 0.02 + (1 - gender) * 0.015 + (t.buttockSize / 100 - 0.5) * 0.02;
    
    // === ARMS ===
    const armLength = 0.28 + (a.armLength / 100 - 0.5) * 0.06;
    const bicepRadius = (0.03 + muscle * 0.015 + (a.upperArmWidth / 100 - 0.5) * 0.01) * (1 + (a.bicepSize / 100 - 0.5) * 0.3);
    const forearmRadius = 0.025 + muscle * 0.01 + (a.forearmWidth / 100 - 0.5) * 0.008;
    const wristRadius = 0.018 + (a.wristWidth / 100 - 0.5) * 0.005;
    const handScale = 0.8 + gender * 0.15 + (a.handSize / 100 - 0.5) * 0.2;
    
    // === LEGS ===
    const legLength = 0.42 + (l.legLength / 100 - 0.5) * 0.08;
    const thighRadius = 0.055 + muscle * 0.015 + weight * 0.02 + (l.upperLegWidth / 100 - 0.5) * 0.015;
    const calfRadius = 0.04 + muscle * 0.015 + (l.calfSize / 100 - 0.5) * 0.015;
    const ankleRadius = 0.025 + (l.ankleWidth / 100 - 0.5) * 0.008;
    const footScale = 0.8 + gender * 0.15 + (l.footSize / 100 - 0.5) * 0.2;
    const gluteSize = buttockSize + (l.gluteSize / 100 - 0.5) * 0.015;
    
    return {
      height, gender, muscle, weight, proportions,
      headWidth, headHeight, headDepth, eyeSize, eyeSpacing,
      noseSize, noseLength, mouthWidth, lipFullness, jawWidth, chinSize, earSize,
      neckRadius, neckLength,
      shoulderWidth, chestWidth, chestDepth, bustSize,
      waistWidth, hipWidth, stomachDepth, buttockSize,
      armLength, bicepRadius, forearmRadius, wristRadius, handScale,
      legLength, thighRadius, calfRadius, ankleRadius, footScale, gluteSize
    };
  }, [avatar.macro, avatar.face, avatar.torso, avatar.arms, avatar.legs]);

  // Colors
  const skinColor = useMemo(() => new THREE.Color(avatar.materials.skinTone), [avatar.materials.skinTone]);
  const eyeColor = useMemo(() => new THREE.Color(avatar.materials.eyeColor), [avatar.materials.eyeColor]);
  const hairColor = useMemo(() => new THREE.Color(avatar.materials.hairColor), [avatar.materials.hairColor]);
  
  // Materials
  const skinMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: skinColor,
    roughness: 0.5 + (avatar.materials.roughness / 100) * 0.3,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.8,
    wireframe: ui.showWireframe,
  }), [skinColor, avatar.materials.roughness, ui.showWireframe]);

  const eyeWhiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 'white' }), []);
  const irisMat = useMemo(() => new THREE.MeshStandardMaterial({ color: eyeColor }), [eyeColor]);
  const pupilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 'black' }), []);
  const lipMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(skinColor).multiplyScalar(0.6), 
    roughness: 0.3 
  }), [skinColor]);
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: hairColor, 
    roughness: 0.8, 
    wireframe: ui.showWireframe 
  }), [hairColor, ui.showWireframe]);

  const scale = body.height;
  const seg = 32;
  
  // ===== ANIMATION STATE =====
  const [animTime, setAnimTime] = useState(0);
  
  // Animation loop
  useFrame((state, delta) => {
    if (pose.isPlaying && pose.animation) {
      setAnimTime(prev => prev + delta * pose.playbackSpeed);
    }
  });
  
  // ===== POSE CALCULATIONS =====
  // Calculate arm and leg rotations based on selected pose + animation
  const poseRotations = useMemo(() => {
    const currentPose = pose.preset || 'tpose';
    const anim = pose.animation;
    const playing = pose.isPlaying;
    
    // Default T-Pose - arms out to sides
    let leftArmRotation: [number, number, number] = [0, 0, Math.PI / 2];  // Arms horizontal
    let rightArmRotation: [number, number, number] = [0, 0, -Math.PI / 2];
    let leftLegRotation: [number, number, number] = [0, 0, 0];
    let rightLegRotation: [number, number, number] = [0, 0, 0];
    let headRotation: [number, number, number] = [0, 0, 0];
    let torsoRotation: [number, number, number] = [0, 0, 0];
    
    // Apply animation if playing
    if (playing && anim) {
      const t = animTime;
      switch (anim) {
        case 'idle':
          // Subtle breathing/swaying
          leftArmRotation = [0.05 * Math.sin(t * 0.8), 0, 0.1 + 0.02 * Math.sin(t * 0.5)];
          rightArmRotation = [0.05 * Math.sin(t * 0.8 + 0.3), 0, -0.1 - 0.02 * Math.sin(t * 0.5)];
          torsoRotation = [0, 0.02 * Math.sin(t * 0.3), 0];
          break;
          
        case 'walk':
          // Walk cycle
          leftArmRotation = [-0.4 * Math.sin(t * 4), 0, 0.1];
          rightArmRotation = [0.4 * Math.sin(t * 4), 0, -0.1];
          leftLegRotation = [0.5 * Math.sin(t * 4), 0, 0];
          rightLegRotation = [-0.5 * Math.sin(t * 4), 0, 0];
          torsoRotation = [0, 0.05 * Math.sin(t * 4), 0];
          break;
          
        case 'run':
          // Run cycle - faster, more exaggerated
          leftArmRotation = [-0.8 * Math.sin(t * 8), 0, 0.15];
          rightArmRotation = [0.8 * Math.sin(t * 8), 0, -0.15];
          leftLegRotation = [0.8 * Math.sin(t * 8), 0, 0];
          rightLegRotation = [-0.8 * Math.sin(t * 8), 0, 0];
          torsoRotation = [0.1, 0.08 * Math.sin(t * 8), 0];
          break;
          
        case 'jump':
          // Jump - crouch then extend
          const jumpPhase = (Math.sin(t * 3) + 1) / 2;
          leftLegRotation = [-0.3 * (1 - jumpPhase), 0, 0];
          rightLegRotation = [-0.3 * (1 - jumpPhase), 0, 0];
          leftArmRotation = [-0.5 * jumpPhase, 0, 0.3 + 0.4 * jumpPhase];
          rightArmRotation = [-0.5 * jumpPhase, 0, -0.3 - 0.4 * jumpPhase];
          break;
          
        case 'wave':
          // Waving hand
          leftArmRotation = [0.1, 0, 0.1];
          rightArmRotation = [-0.3, -0.2, -Math.PI * 0.7 + 0.3 * Math.sin(t * 6)];
          headRotation = [0, 0.1 * Math.sin(t * 2), 0];
          break;
          
        case 'dance':
          // Dance moves
          leftArmRotation = [0.3 * Math.sin(t * 3), 0.2 * Math.cos(t * 3), 0.4 + 0.3 * Math.sin(t * 3)];
          rightArmRotation = [0.3 * Math.sin(t * 3 + Math.PI), 0.2 * Math.cos(t * 3 + Math.PI), -0.4 - 0.3 * Math.sin(t * 3)];
          leftLegRotation = [0.2 * Math.sin(t * 6), 0, 0.1 * Math.sin(t * 3)];
          rightLegRotation = [0.2 * Math.sin(t * 6 + Math.PI), 0, -0.1 * Math.sin(t * 3)];
          torsoRotation = [0, 0.2 * Math.sin(t * 3), 0.05 * Math.sin(t * 6)];
          headRotation = [0.1 * Math.sin(t * 3), 0.15 * Math.sin(t * 1.5), 0];
          break;
          
        case 'clap':
          // Clapping hands
          const clapPhase = Math.sin(t * 8);
          leftArmRotation = [0.6, 0.4 + 0.4 * clapPhase, 0.3];
          rightArmRotation = [0.6, -0.4 - 0.4 * clapPhase, -0.3];
          break;
          
        case 'nod':
          // Nodding head
          headRotation = [0.2 * Math.sin(t * 3), 0, 0];
          leftArmRotation = [0.1, 0, 0.1];
          rightArmRotation = [0.1, 0, -0.1];
          break;
          
        case 'shake_head':
          // Shaking head no
          headRotation = [0, 0.3 * Math.sin(t * 4), 0];
          leftArmRotation = [0.1, 0, 0.1];
          rightArmRotation = [0.1, 0, -0.1];
          break;
          
        case 'talk':
          // Talking with gestures
          leftArmRotation = [0.2 + 0.15 * Math.sin(t * 2), 0.1 * Math.sin(t * 1.5), 0.2 + 0.1 * Math.sin(t * 2.5)];
          rightArmRotation = [0.2 + 0.15 * Math.sin(t * 2 + 1), -0.1 * Math.sin(t * 1.5), -0.2 - 0.1 * Math.sin(t * 2.5)];
          headRotation = [0.05 * Math.sin(t * 1.5), 0.1 * Math.sin(t * 0.8), 0];
          break;
      }
    } else {
      // Static pose (no animation)
      switch (currentPose) {
        case 'tpose':
          // Arms straight out (default above)
          break;
          
        case 'apose':
          // Arms at 45 degrees down
          leftArmRotation = [0, 0, Math.PI / 4];
          rightArmRotation = [0, 0, -Math.PI / 4];
          break;
          
        case 'relaxed':
          // Arms relaxed at sides, slight bend
          leftArmRotation = [0.1, 0.1, 0.15];
          rightArmRotation = [0.1, -0.1, -0.15];
          break;
          
        case 'arms_crossed':
          // Arms crossed over chest
          leftArmRotation = [0.3, 0.8, 0.5];
          rightArmRotation = [0.3, -0.8, -0.5];
          break;
          
        case 'hands_hips':
          // Hands on hips
          leftArmRotation = [0.2, 0.5, 0.3];
          rightArmRotation = [0.2, -0.5, -0.3];
          break;
          
        case 'walking':
          // Walking pose - one arm forward, one back
          leftArmRotation = [-0.4, 0, 0.1];
          rightArmRotation = [0.4, 0, -0.1];
          leftLegRotation = [0.3, 0, 0];
          rightLegRotation = [-0.3, 0, 0];
          break;
          
        case 'running':
          // Running pose - more extreme arm/leg positions
          leftArmRotation = [-0.8, 0, 0.2];
          rightArmRotation = [0.8, 0, -0.2];
          leftLegRotation = [0.6, 0, 0];
          rightLegRotation = [-0.5, 0, 0];
          break;
          
        case 'sitting':
          // Sitting - legs bent forward
          leftLegRotation = [-Math.PI / 2, 0, 0];
          rightLegRotation = [-Math.PI / 2, 0, 0];
          leftArmRotation = [0.2, 0, 0.1];
          rightArmRotation = [0.2, 0, -0.1];
          break;
          
        case 'waving':
          // Right arm raised waving
          leftArmRotation = [0.1, 0, 0.1];
          rightArmRotation = [-0.3, -0.2, -Math.PI * 0.7];
          break;
          
        case 'thinking':
          // Hand on chin pose
          leftArmRotation = [0.1, 0, 0.1];
          rightArmRotation = [0.5, -0.8, -0.3];
          headRotation = [0.1, 0.1, 0];
          break;
          
        case 'pointing':
          // Right arm pointing forward
          leftArmRotation = [0.1, 0, 0.1];
          rightArmRotation = [Math.PI / 2, 0, 0];
          break;
          
        case 'presenting':
          // Both arms out presenting
          leftArmRotation = [0, 0.3, Math.PI / 3];
          rightArmRotation = [0, -0.3, -Math.PI / 3];
          break;
      }
    }
    
    return { leftArmRotation, rightArmRotation, leftLegRotation, rightLegRotation, headRotation, torsoRotation };
  }, [pose.preset, pose.animation, pose.isPlaying, animTime]);
  
  // Position avatar so feet are at Y=0 (standing on floor)
  const avatarHeight = 1.0; // Normalized height before scaling

  return (
    <group ref={groupRef} scale={scale} position={[0, scale * 0.48, 0]}>
      {/* ===== HEAD ===== */}
      <group position={[0, 0.42, 0]} rotation={poseRotations.headRotation}>
        {/* Skull */}
        <ScaledSphere 
          scaleX={body.headWidth} scaleY={body.headHeight} scaleZ={body.headDepth} 
          material={skinMat} 
        />
        
        {/* Jaw */}
        <ScaledSphere 
          position={[0, -body.headHeight * 0.6, body.headDepth * 0.2]}
          scaleX={body.jawWidth} scaleY={body.headHeight * 0.35 * body.chinSize} scaleZ={body.headDepth * 0.5}
          material={skinMat}
        />
        
        {/* Left Eye - varies by eye type */}
        <mesh 
          position={[-body.eyeSpacing, 0.01, body.headDepth * 0.85]} 
          material={eyeWhiteMat} 
          scale={[
            faceGeometry.eyeType === 'anime' ? 1.3 : faceGeometry.eyeType === 'cartoon' ? 1.2 : 1,
            faceGeometry.eyeType === 'anime' ? 1.5 : faceGeometry.eyeType === 'cartoon' ? 1.3 : 1,
            1
          ]}
          castShadow
        >
          <sphereGeometry args={[body.eyeSize, 16, 16]} />
        </mesh>
        <mesh 
          position={[-body.eyeSpacing, 0.01, body.headDepth * 0.85 + body.eyeSize * 0.5]} 
          material={irisMat}
          scale={[
            faceGeometry.eyeType === 'anime' ? 1.3 : faceGeometry.eyeType === 'cartoon' ? 1.2 : 1,
            faceGeometry.eyeType === 'anime' ? 1.5 : faceGeometry.eyeType === 'cartoon' ? 1.3 : 1,
            1
          ]}
        >
          <sphereGeometry args={[body.eyeSize * (faceGeometry.eyeType === 'anime' ? 0.6 : 0.5), 16, 16]} />
        </mesh>
        <mesh position={[-body.eyeSpacing, 0.01, body.headDepth * 0.85 + body.eyeSize * 0.7]} material={pupilMat}>
          <sphereGeometry args={[body.eyeSize * (faceGeometry.eyeType === 'anime' ? 0.35 : 0.25), 8, 8]} />
        </mesh>
        
        {/* Right Eye - varies by eye type */}
        <mesh 
          position={[body.eyeSpacing, 0.01, body.headDepth * 0.85]} 
          material={eyeWhiteMat} 
          scale={[
            faceGeometry.eyeType === 'anime' ? 1.3 : faceGeometry.eyeType === 'cartoon' ? 1.2 : 1,
            faceGeometry.eyeType === 'anime' ? 1.5 : faceGeometry.eyeType === 'cartoon' ? 1.3 : 1,
            1
          ]}
          castShadow
        >
          <sphereGeometry args={[body.eyeSize, 16, 16]} />
        </mesh>
        <mesh 
          position={[body.eyeSpacing, 0.01, body.headDepth * 0.85 + body.eyeSize * 0.5]} 
          material={irisMat}
          scale={[
            faceGeometry.eyeType === 'anime' ? 1.3 : faceGeometry.eyeType === 'cartoon' ? 1.2 : 1,
            faceGeometry.eyeType === 'anime' ? 1.5 : faceGeometry.eyeType === 'cartoon' ? 1.3 : 1,
            1
          ]}
        >
          <sphereGeometry args={[body.eyeSize * (faceGeometry.eyeType === 'anime' ? 0.6 : 0.5), 16, 16]} />
        </mesh>
        <mesh position={[body.eyeSpacing, 0.01, body.headDepth * 0.85 + body.eyeSize * 0.7]} material={pupilMat}>
          <sphereGeometry args={[body.eyeSize * (faceGeometry.eyeType === 'anime' ? 0.35 : 0.25), 8, 8]} />
        </mesh>
        
        {/* Nose */}
        <mesh position={[0, -0.025, body.headDepth * 0.9]} material={skinMat} castShadow rotation={[Math.PI * 0.5, 0, 0]}>
          <coneGeometry args={[0.012 * body.noseSize, body.noseLength, 8]} />
        </mesh>
        <mesh position={[0, -0.025 - body.noseLength * 0.4, body.headDepth * 0.95]} material={skinMat} castShadow>
          <sphereGeometry args={[0.01 * body.noseSize, 8, 8]} />
        </mesh>
        
        {/* Mouth */}
        <mesh position={[0, -0.06, body.headDepth * 0.88]} material={lipMat} castShadow rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.004 * (1 + body.lipFullness), body.mouthWidth, 4, 8]} />
        </mesh>
        
        {/* ===== TEETH ===== */}
        {faceGeometry.teethType !== 'none' && (
          <mesh 
            position={[0, -0.058, body.headDepth * 0.82]} 
            material={new THREE.MeshStandardMaterial({ 
              color: faceGeometry.teethType === 'gold' ? '#FFD700' : '#FFFAFA',
              roughness: faceGeometry.teethType === 'gold' ? 0.3 : 0.5,
              metalness: faceGeometry.teethType === 'gold' ? 0.8 : 0
            })}
          >
            <boxGeometry args={[body.mouthWidth * 1.5, 0.006, 0.008]} />
          </mesh>
        )}
        {/* Vampire fangs */}
        {faceGeometry.teethType === 'vampire' && (
          <>
            <mesh position={[-0.012, -0.06, body.headDepth * 0.85]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.003, 0.012, 4]} />
              <meshStandardMaterial color="#FFFAFA" />
            </mesh>
            <mesh position={[0.012, -0.06, body.headDepth * 0.85]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.003, 0.012, 4]} />
              <meshStandardMaterial color="#FFFAFA" />
            </mesh>
          </>
        )}
        {/* Braces */}
        {faceGeometry.teethType === 'braces' && (
          <mesh position={[0, -0.056, body.headDepth * 0.86]}>
            <boxGeometry args={[body.mouthWidth * 1.6, 0.003, 0.003]} />
            <meshStandardMaterial color="#A8A8A8" metalness={0.8} roughness={0.2} />
          </mesh>
        )}
        
        {/* Ears */}
        <mesh position={[-body.headWidth * 0.95, 0, 0]} material={skinMat} scale={[0.4, 1, 0.6]} castShadow>
          <sphereGeometry args={[body.earSize, 8, 8]} />
        </mesh>
        <mesh position={[body.headWidth * 0.95, 0, 0]} material={skinMat} scale={[0.4, 1, 0.6]} castShadow>
          <sphereGeometry args={[body.earSize, 8, 8]} />
        </mesh>
        
        {/* ===== EYEBROWS ===== */}
        {faceGeometry.eyebrowType !== 'none' && (
          <>
            {/* Left Eyebrow */}
            <mesh 
              position={[
                -body.eyeSpacing, 
                0.01 + body.eyeSize * 1.3, 
                body.headDepth * 0.88
              ]} 
              rotation={[0.1, 0, faceGeometry.eyebrowType === 'arched' ? -0.15 : 0]}
              material={hairMat} 
              castShadow
            >
              <boxGeometry args={[
                0.025 * (faceGeometry.eyebrowType === 'thick' ? 1.3 : faceGeometry.eyebrowType === 'thin' ? 0.8 : 1), 
                0.004 * (faceGeometry.eyebrowType === 'thick' ? 1.5 : faceGeometry.eyebrowType === 'thin' ? 0.7 : 1), 
                0.006
              ]} />
            </mesh>
            {/* Right Eyebrow */}
            <mesh 
              position={[
                body.eyeSpacing, 
                0.01 + body.eyeSize * 1.3, 
                body.headDepth * 0.88
              ]} 
              rotation={[0.1, 0, faceGeometry.eyebrowType === 'arched' ? 0.15 : 0]}
              material={hairMat} 
              castShadow
            >
              <boxGeometry args={[
                0.025 * (faceGeometry.eyebrowType === 'thick' ? 1.3 : faceGeometry.eyebrowType === 'thin' ? 0.8 : 1), 
                0.004 * (faceGeometry.eyebrowType === 'thick' ? 1.5 : faceGeometry.eyebrowType === 'thin' ? 0.7 : 1), 
                0.006
              ]} />
            </mesh>
          </>
        )}
        
        {/* ===== EYELASHES ===== */}
        {faceGeometry.eyelashType !== 'none' && (
          <>
            {/* Left Eye Lashes */}
            {Array.from({ length: faceGeometry.eyelashType === 'dramatic' ? 8 : faceGeometry.eyelashType === 'long' ? 6 : 4 }).map((_, i, arr) => {
              const angle = ((i - (arr.length - 1) / 2) / arr.length) * 0.6;
              const lashLength = 0.008 * (faceGeometry.eyelashType === 'long' ? 1.5 : faceGeometry.eyelashType === 'dramatic' ? 2 : 1);
              return (
                <mesh 
                  key={`left-lash-${i}`}
                  position={[
                    -body.eyeSpacing + Math.sin(angle) * body.eyeSize * 0.9,
                    0.01 + body.eyeSize * 0.5 + Math.cos(angle) * body.eyeSize * 0.3,
                    body.headDepth * 0.88 + body.eyeSize
                  ]}
                  rotation={[0.8, angle * 0.5, 0]}
                  material={hairMat}
                >
                  <cylinderGeometry args={[0.001, 0.0005, lashLength, 4]} />
                </mesh>
              );
            })}
            {/* Right Eye Lashes */}
            {Array.from({ length: faceGeometry.eyelashType === 'dramatic' ? 8 : faceGeometry.eyelashType === 'long' ? 6 : 4 }).map((_, i, arr) => {
              const angle = ((i - (arr.length - 1) / 2) / arr.length) * 0.6;
              const lashLength = 0.008 * (faceGeometry.eyelashType === 'long' ? 1.5 : faceGeometry.eyelashType === 'dramatic' ? 2 : 1);
              return (
                <mesh 
                  key={`right-lash-${i}`}
                  position={[
                    body.eyeSpacing + Math.sin(angle) * body.eyeSize * 0.9,
                    0.01 + body.eyeSize * 0.5 + Math.cos(angle) * body.eyeSize * 0.3,
                    body.headDepth * 0.88 + body.eyeSize
                  ]}
                  rotation={[0.8, -angle * 0.5, 0]}
                  material={hairMat}
                >
                  <cylinderGeometry args={[0.001, 0.0005, lashLength, 4]} />
                </mesh>
              );
            })}
          </>
        )}
        
        {/* ===== HAIR STYLES ===== */}
        <HairMesh hairId={avatar.hair} headWidth={body.headWidth} headHeight={body.headHeight} headDepth={body.headDepth} hairMat={hairMat} seg={seg} />
      </group>
      
      {/* ===== NECK ===== */}
      <mesh position={[0, 0.30, 0]} material={skinMat} castShadow>
        <cylinderGeometry args={[body.neckRadius, body.neckRadius * 1.1, body.neckLength, seg]} />
      </mesh>
      
      {/* ===== TORSO ===== */}
      <group position={[0, 0.02, 0]} rotation={poseRotations.torsoRotation}>
        {/* Shoulders */}
        <mesh material={skinMat} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[body.chestDepth, body.shoulderWidth * 2 - body.chestDepth * 2, 4, seg]} />
        </mesh>
        
        {/* Chest */}
        <ScaledSphere 
          position={[0, -0.08, body.bustSize * 0.5]}
          scaleX={body.chestWidth} scaleY={0.12} scaleZ={body.chestDepth + body.bustSize}
          material={skinMat}
        />
        
        {/* Bust (female) */}
        {body.bustSize > 0.01 && (
          <>
            <mesh position={[-0.05, -0.06, body.chestDepth + body.bustSize * 0.3]} material={skinMat} castShadow>
              <sphereGeometry args={[body.bustSize, seg, seg]} />
            </mesh>
            <mesh position={[0.05, -0.06, body.chestDepth + body.bustSize * 0.3]} material={skinMat} castShadow>
              <sphereGeometry args={[body.bustSize, seg, seg]} />
            </mesh>
          </>
        )}
        
        {/* Waist */}
        <ScaledSphere 
          position={[0, -0.2, 0]}
          scaleX={body.waistWidth} scaleY={0.1} scaleZ={body.stomachDepth}
          material={skinMat}
        />
        
        {/* Hips */}
        <ScaledSphere 
          position={[0, -0.32, 0]}
          scaleX={body.hipWidth} scaleY={0.08} scaleZ={body.chestDepth * 0.9}
          material={skinMat}
        />
        
        {/* Glutes */}
        <mesh position={[-0.05, -0.35, -body.chestDepth * 0.5]} material={skinMat} castShadow>
          <sphereGeometry args={[body.gluteSize, seg, seg]} />
        </mesh>
        <mesh position={[0.05, -0.35, -body.chestDepth * 0.5]} material={skinMat} castShadow>
          <sphereGeometry args={[body.gluteSize, seg, seg]} />
        </mesh>
      </group>
      
      {/* ===== LEFT ARM ===== */}
      <group position={[-body.shoulderWidth - 0.02, 0.02, 0]} rotation={poseRotations.leftArmRotation}>
        <mesh position={[0, -body.armLength * 0.35, 0]} material={skinMat} castShadow>
          <capsuleGeometry args={[body.bicepRadius, body.armLength * 0.45, 4, seg]} />
        </mesh>
        <mesh position={[0, -body.armLength * 0.85, 0]} material={skinMat} castShadow>
          <capsuleGeometry args={[body.forearmRadius, body.armLength * 0.4, 4, seg]} />
        </mesh>
        <mesh position={[0, -body.armLength * 1.1, 0]} material={skinMat} castShadow>
          <sphereGeometry args={[body.wristRadius, 8, 8]} />
        </mesh>
        <mesh position={[0, -body.armLength * 1.2, 0]} material={skinMat} castShadow>
          <boxGeometry args={[0.025 * body.handScale, 0.06 * body.handScale, 0.015 * body.handScale]} />
        </mesh>
      </group>
      
      {/* ===== RIGHT ARM ===== */}
      <group position={[body.shoulderWidth + 0.02, 0.02, 0]} rotation={poseRotations.rightArmRotation}>
        <mesh position={[0, -body.armLength * 0.35, 0]} material={skinMat} castShadow>
          <capsuleGeometry args={[body.bicepRadius, body.armLength * 0.45, 4, seg]} />
        </mesh>
        <mesh position={[0, -body.armLength * 0.85, 0]} material={skinMat} castShadow>
          <capsuleGeometry args={[body.forearmRadius, body.armLength * 0.4, 4, seg]} />
        </mesh>
        <mesh position={[0, -body.armLength * 1.1, 0]} material={skinMat} castShadow>
          <sphereGeometry args={[body.wristRadius, 8, 8]} />
        </mesh>
        <mesh position={[0, -body.armLength * 1.2, 0]} material={skinMat} castShadow>
          <boxGeometry args={[0.025 * body.handScale, 0.06 * body.handScale, 0.015 * body.handScale]} />
        </mesh>
      </group>
      
      {/* ===== LEFT LEG ===== */}
      <group position={[-body.hipWidth * 0.5, -0.33, 0]} rotation={poseRotations.leftLegRotation}>
        <mesh position={[0, -body.legLength * 0.3, 0]} material={skinMat} castShadow>
          <capsuleGeometry args={[body.thighRadius, body.legLength * 0.45, 4, seg]} />
        </mesh>
        <mesh position={[0, -body.legLength * 0.55, 0]} material={skinMat} castShadow>
          <sphereGeometry args={[body.thighRadius * 0.9, 16, 16]} />
        </mesh>
        <mesh position={[0, -body.legLength * 0.8, 0]} material={skinMat} castShadow>
          <capsuleGeometry args={[body.calfRadius, body.legLength * 0.4, 4, seg]} />
        </mesh>
        <mesh position={[0, -body.legLength * 1.05, 0]} material={skinMat} castShadow>
          <sphereGeometry args={[body.ankleRadius, 8, 8]} />
        </mesh>
        <mesh position={[0, -body.legLength * 1.1, 0.025 * body.footScale]} material={skinMat} castShadow>
          <boxGeometry args={[0.04 * body.footScale, 0.02, 0.09 * body.footScale]} />
        </mesh>
      </group>
      
      {/* ===== RIGHT LEG ===== */}
      <group position={[body.hipWidth * 0.5, -0.33, 0]} rotation={poseRotations.rightLegRotation}>
        <mesh position={[0, -body.legLength * 0.3, 0]} material={skinMat} castShadow>
          <capsuleGeometry args={[body.thighRadius, body.legLength * 0.45, 4, seg]} />
        </mesh>
        <mesh position={[0, -body.legLength * 0.55, 0]} material={skinMat} castShadow>
          <sphereGeometry args={[body.thighRadius * 0.9, 16, 16]} />
        </mesh>
        <mesh position={[0, -body.legLength * 0.8, 0]} material={skinMat} castShadow>
          <capsuleGeometry args={[body.calfRadius, body.legLength * 0.4, 4, seg]} />
        </mesh>
        <mesh position={[0, -body.legLength * 1.05, 0]} material={skinMat} castShadow>
          <sphereGeometry args={[body.ankleRadius, 8, 8]} />
        </mesh>
        <mesh position={[0, -body.legLength * 1.1, 0.025 * body.footScale]} material={skinMat} castShadow>
          <boxGeometry args={[0.04 * body.footScale, 0.02, 0.09 * body.footScale]} />
        </mesh>
      </group>
    </group>
  );
}

// Clothing layer - improved realistic clothing shapes
function ClothingLayer() {
  const { avatar, ui, pose } = useAvatarStore();
  
  // Check what clothing items are equipped
  const hasTshirt = avatar.clothing.includes('shirt01') || avatar.clothing.includes('tshirt02');
  const hasHoodie = avatar.clothing.includes('hoodie01');
  const hasJacket = avatar.clothing.includes('jacket01');
  const hasSuit = avatar.clothing.includes('suit01');
  const hasJeans = avatar.clothing.includes('jeans01');
  const hasShorts = avatar.clothing.includes('short01');
  const hasSuitPants = avatar.clothing.includes('suit01res');
  const hasSneakers = avatar.clothing.includes('shoes01');
  const hasDressShoes = avatar.clothing.includes('shoes02');
  const hasDress = avatar.clothing.includes('dress01');
  const hasWorksuit = avatar.clothing.includes('worksuit');
  
  const m = avatar.macro;
  const t = avatar.torso;
  const l = avatar.legs;
  const a = avatar.arms;
  
  const gender = m.gender / 100;
  const muscle = m.muscle / 100;
  const weight = m.weight / 100;
  const height = 1.6 + (m.height / 100) * 0.4;
  
  const shoulderWidth = 0.18 + gender * 0.06 + muscle * 0.03 + (t.shoulderWidth / 100 - 0.5) * 0.04;
  const chestWidth = 0.15 + gender * 0.02 + muscle * 0.02 + weight * 0.02 + (t.chestWidth / 100 - 0.5) * 0.03;
  const chestDepth = 0.1 + muscle * 0.03 + weight * 0.025 + (t.chestDepth / 100 - 0.5) * 0.025;
  const waistWidth = 0.12 + weight * 0.06 - gender * 0.02 + (t.waistWidth / 100 - 0.5) * 0.03;
  const hipWidth = 0.15 + (1 - gender) * 0.04 + weight * 0.03 + (t.hipWidth / 100 - 0.5) * 0.03;
  const legLength = 0.42 + (l.legLength / 100 - 0.5) * 0.08;
  const thighRadius = 0.055 + muscle * 0.015 + weight * 0.02 + (l.upperLegWidth / 100 - 0.5) * 0.015;
  const armLength = 0.28 + (a.armLength / 100 - 0.5) * 0.06;
  const bicepRadius = (0.03 + muscle * 0.015 + (a.upperArmWidth / 100 - 0.5) * 0.01);
  
  // Get pose rotations from store
  const poseRotations = useMemo(() => {
    const currentPose = pose.preset || 'tpose';
    let leftArmRotation: [number, number, number] = [0, 0, Math.PI / 2];
    let rightArmRotation: [number, number, number] = [0, 0, -Math.PI / 2];
    let leftLegRotation: [number, number, number] = [0, 0, 0];
    let rightLegRotation: [number, number, number] = [0, 0, 0];
    
    switch (currentPose) {
      case 'apose':
        leftArmRotation = [0, 0, Math.PI / 4];
        rightArmRotation = [0, 0, -Math.PI / 4];
        break;
      case 'relaxed':
        leftArmRotation = [0.1, 0.1, 0.15];
        rightArmRotation = [0.1, -0.1, -0.15];
        break;
      case 'walking':
        leftArmRotation = [-0.4, 0, 0.1];
        rightArmRotation = [0.4, 0, -0.1];
        leftLegRotation = [0.3, 0, 0];
        rightLegRotation = [-0.3, 0, 0];
        break;
    }
    return { leftArmRotation, rightArmRotation, leftLegRotation, rightLegRotation };
  }, [pose.preset]);
  
  // Material definitions with better colors
  const tshirtMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#3366CC',  // Blue t-shirt
    roughness: 0.85,
    wireframe: ui.showWireframe,
  }), [ui.showWireframe]);
  
  const hoodieMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4A4A4A',  // Dark gray hoodie
    roughness: 0.9,
    wireframe: ui.showWireframe,
  }), [ui.showWireframe]);
  
  const jacketMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2C1810',  // Brown leather
    roughness: 0.4,
    wireframe: ui.showWireframe,
  }), [ui.showWireframe]);
  
  const suitMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a2e',  // Dark navy suit
    roughness: 0.6,
    wireframe: ui.showWireframe,
  }), [ui.showWireframe]);
  
  const jeansMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1E3A5F',  // Denim blue
    roughness: 0.8,
    wireframe: ui.showWireframe,
  }), [ui.showWireframe]);
  
  const shortsMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4A4A4A',  // Khaki/dark
    roughness: 0.75,
    wireframe: ui.showWireframe,
  }), [ui.showWireframe]);
  
  const sneakerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFFFFF',  // White sneakers
    roughness: 0.5,
    wireframe: ui.showWireframe,
  }), [ui.showWireframe]);
  
  const dressShoeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a1a',  // Black dress shoes
    roughness: 0.3,
    wireframe: ui.showWireframe,
  }), [ui.showWireframe]);

  const dressMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8B4557',  // Burgundy dress
    roughness: 0.6,
    wireframe: ui.showWireframe,
  }), [ui.showWireframe]);
  
  const worksuitMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a4a6a',  // Work blue
    roughness: 0.7,
    wireframe: ui.showWireframe,
  }), [ui.showWireframe]);
  
  const clothOffset = 0.008; // Offset clothes from body
  
  return (
    <group scale={height} position={[0, height * 0.48, 0]}>
      
      {/* ===== T-SHIRT ===== */}
      {hasTshirt && !hasHoodie && !hasJacket && !hasSuit && (
        <group position={[0, 0.02, 0]}>
          {/* Torso */}
          <mesh material={tshirtMat} castShadow>
            <cylinderGeometry args={[chestWidth + clothOffset, waistWidth + clothOffset, 0.32, 24]} />
          </mesh>
          {/* Collar */}
          <mesh position={[0, 0.17, chestDepth * 0.3]} material={tshirtMat}>
            <torusGeometry args={[0.04, 0.01, 8, 16, Math.PI]} />
          </mesh>
          {/* Short sleeves - left */}
          <group position={[-shoulderWidth - 0.01, 0.02, 0]} rotation={poseRotations.leftArmRotation}>
            <mesh position={[0, -0.06, 0]} material={tshirtMat} castShadow>
              <cylinderGeometry args={[bicepRadius + clothOffset, bicepRadius + clothOffset + 0.01, 0.1, 12]} />
            </mesh>
          </group>
          {/* Short sleeves - right */}
          <group position={[shoulderWidth + 0.01, 0.02, 0]} rotation={poseRotations.rightArmRotation}>
            <mesh position={[0, -0.06, 0]} material={tshirtMat} castShadow>
              <cylinderGeometry args={[bicepRadius + clothOffset, bicepRadius + clothOffset + 0.01, 0.1, 12]} />
            </mesh>
          </group>
        </group>
      )}
      
      {/* ===== HOODIE ===== */}
      {hasHoodie && (
        <group position={[0, 0.02, 0]}>
          {/* Torso - thicker for hoodie */}
          <mesh material={hoodieMat} castShadow>
            <cylinderGeometry args={[chestWidth + clothOffset * 2, waistWidth + clothOffset * 2, 0.35, 24]} />
          </mesh>
          {/* Hood (folded down on back) */}
          <mesh position={[0, 0.2, -chestDepth * 0.6]} rotation={[0.5, 0, 0]} material={hoodieMat}>
            <sphereGeometry args={[0.06, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
          {/* Long sleeves - left */}
          <group position={[-shoulderWidth - 0.01, 0.02, 0]} rotation={poseRotations.leftArmRotation}>
            <mesh position={[0, -armLength * 0.5, 0]} material={hoodieMat} castShadow>
              <cylinderGeometry args={[bicepRadius * 0.9 + clothOffset, bicepRadius + clothOffset * 2, armLength * 0.9, 12]} />
            </mesh>
          </group>
          {/* Long sleeves - right */}
          <group position={[shoulderWidth + 0.01, 0.02, 0]} rotation={poseRotations.rightArmRotation}>
            <mesh position={[0, -armLength * 0.5, 0]} material={hoodieMat} castShadow>
              <cylinderGeometry args={[bicepRadius * 0.9 + clothOffset, bicepRadius + clothOffset * 2, armLength * 0.9, 12]} />
            </mesh>
          </group>
          {/* Kangaroo pocket */}
          <mesh position={[0, -0.12, chestDepth + 0.01]} material={hoodieMat}>
            <boxGeometry args={[0.12, 0.06, 0.015]} />
          </mesh>
        </group>
      )}
      
      {/* ===== JACKET ===== */}
      {hasJacket && (
        <group position={[0, 0.02, 0]}>
          {/* Torso */}
          <mesh material={jacketMat} castShadow>
            <cylinderGeometry args={[chestWidth + clothOffset * 2, waistWidth + clothOffset * 1.5, 0.32, 24]} />
          </mesh>
          {/* Collar/lapels */}
          <mesh position={[-0.04, 0.15, chestDepth * 0.5]} rotation={[0, 0.3, 0]} material={jacketMat}>
            <boxGeometry args={[0.04, 0.08, 0.015]} />
          </mesh>
          <mesh position={[0.04, 0.15, chestDepth * 0.5]} rotation={[0, -0.3, 0]} material={jacketMat}>
            <boxGeometry args={[0.04, 0.08, 0.015]} />
          </mesh>
          {/* Long sleeves */}
          <group position={[-shoulderWidth - 0.01, 0.02, 0]} rotation={poseRotations.leftArmRotation}>
            <mesh position={[0, -armLength * 0.5, 0]} material={jacketMat} castShadow>
              <cylinderGeometry args={[bicepRadius * 0.85 + clothOffset, bicepRadius + clothOffset * 2, armLength * 0.95, 12]} />
            </mesh>
          </group>
          <group position={[shoulderWidth + 0.01, 0.02, 0]} rotation={poseRotations.rightArmRotation}>
            <mesh position={[0, -armLength * 0.5, 0]} material={jacketMat} castShadow>
              <cylinderGeometry args={[bicepRadius * 0.85 + clothOffset, bicepRadius + clothOffset * 2, armLength * 0.95, 12]} />
            </mesh>
          </group>
        </group>
      )}
      
      {/* ===== SUIT JACKET ===== */}
      {hasSuit && (
        <group position={[0, 0.02, 0]}>
          {/* Torso - structured */}
          <mesh material={suitMat} castShadow>
            <cylinderGeometry args={[chestWidth + clothOffset * 1.5, waistWidth + clothOffset, 0.34, 24]} />
          </mesh>
          {/* Structured shoulders */}
          <mesh material={suitMat} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[chestDepth + clothOffset * 2, shoulderWidth * 2.1, 4, 16]} />
          </mesh>
          {/* Lapels */}
          <mesh position={[-0.035, 0.12, chestDepth * 0.6]} rotation={[0, 0.2, 0]} material={suitMat}>
            <boxGeometry args={[0.035, 0.12, 0.01]} />
          </mesh>
          <mesh position={[0.035, 0.12, chestDepth * 0.6]} rotation={[0, -0.2, 0]} material={suitMat}>
            <boxGeometry args={[0.035, 0.12, 0.01]} />
          </mesh>
          {/* Sleeves */}
          <group position={[-shoulderWidth - 0.01, 0.02, 0]} rotation={poseRotations.leftArmRotation}>
            <mesh position={[0, -armLength * 0.5, 0]} material={suitMat} castShadow>
              <cylinderGeometry args={[bicepRadius * 0.8 + clothOffset, bicepRadius + clothOffset * 1.5, armLength * 0.95, 12]} />
            </mesh>
          </group>
          <group position={[shoulderWidth + 0.01, 0.02, 0]} rotation={poseRotations.rightArmRotation}>
            <mesh position={[0, -armLength * 0.5, 0]} material={suitMat} castShadow>
              <cylinderGeometry args={[bicepRadius * 0.8 + clothOffset, bicepRadius + clothOffset * 1.5, armLength * 0.95, 12]} />
            </mesh>
          </group>
        </group>
      )}
      
      {/* ===== WORK SUIT (COVERALLS) ===== */}
      {hasWorksuit && (
        <group>
          {/* Upper body */}
          <group position={[0, 0.02, 0]}>
            <mesh material={worksuitMat} castShadow>
              <cylinderGeometry args={[chestWidth + clothOffset * 2, waistWidth + clothOffset * 2, 0.35, 24]} />
            </mesh>
            {/* Collar */}
            <mesh position={[0, 0.18, chestDepth * 0.4]} material={worksuitMat}>
              <boxGeometry args={[0.08, 0.03, 0.02]} />
            </mesh>
            {/* Sleeves */}
            <group position={[-shoulderWidth - 0.01, 0.02, 0]} rotation={poseRotations.leftArmRotation}>
              <mesh position={[0, -armLength * 0.5, 0]} material={worksuitMat} castShadow>
                <cylinderGeometry args={[bicepRadius * 0.9, bicepRadius + clothOffset * 2, armLength * 0.9, 12]} />
              </mesh>
            </group>
            <group position={[shoulderWidth + 0.01, 0.02, 0]} rotation={poseRotations.rightArmRotation}>
              <mesh position={[0, -armLength * 0.5, 0]} material={worksuitMat} castShadow>
                <cylinderGeometry args={[bicepRadius * 0.9, bicepRadius + clothOffset * 2, armLength * 0.9, 12]} />
              </mesh>
            </group>
          </group>
          {/* Lower body / pants portion */}
          <group position={[0, -0.33, 0]}>
            <mesh material={worksuitMat} castShadow>
              <cylinderGeometry args={[hipWidth + clothOffset * 2, hipWidth + clothOffset * 2, 0.1, 24]} />
            </mesh>
            <group rotation={poseRotations.leftLegRotation}>
              <mesh position={[-hipWidth * 0.5, -legLength * 0.5, 0]} material={worksuitMat} castShadow>
                <cylinderGeometry args={[thighRadius * 0.75, thighRadius + clothOffset * 2, legLength * 0.95, 16]} />
              </mesh>
            </group>
            <group rotation={poseRotations.rightLegRotation}>
              <mesh position={[hipWidth * 0.5, -legLength * 0.5, 0]} material={worksuitMat} castShadow>
                <cylinderGeometry args={[thighRadius * 0.75, thighRadius + clothOffset * 2, legLength * 0.95, 16]} />
              </mesh>
            </group>
          </group>
        </group>
      )}
      
      {/* ===== JEANS ===== */}
      {hasJeans && !hasWorksuit && (
        <group position={[0, -0.33, 0]}>
          {/* Waistband */}
          <mesh position={[0, 0.02, 0]} material={jeansMat} castShadow>
            <cylinderGeometry args={[hipWidth + clothOffset * 1.5, hipWidth + clothOffset, 0.05, 24]} />
          </mesh>
          {/* Belt loops hint */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} position={[
              Math.sin(i * Math.PI / 3) * (hipWidth + clothOffset * 2),
              0.025,
              Math.cos(i * Math.PI / 3) * (hipWidth + clothOffset * 2) * 0.8
            ]} material={jeansMat}>
              <boxGeometry args={[0.008, 0.02, 0.003]} />
            </mesh>
          ))}
          {/* Left leg */}
          <group rotation={poseRotations.leftLegRotation}>
            <mesh position={[-hipWidth * 0.5, -legLength * 0.5, 0]} material={jeansMat} castShadow>
              <cylinderGeometry args={[thighRadius * 0.7, thighRadius + clothOffset * 1.5, legLength * 0.95, 16]} />
            </mesh>
          </group>
          {/* Right leg */}
          <group rotation={poseRotations.rightLegRotation}>
            <mesh position={[hipWidth * 0.5, -legLength * 0.5, 0]} material={jeansMat} castShadow>
              <cylinderGeometry args={[thighRadius * 0.7, thighRadius + clothOffset * 1.5, legLength * 0.95, 16]} />
            </mesh>
          </group>
        </group>
      )}
      
      {/* ===== SHORTS ===== */}
      {hasShorts && !hasWorksuit && (
        <group position={[0, -0.33, 0]}>
          <mesh position={[0, 0.02, 0]} material={shortsMat} castShadow>
            <cylinderGeometry args={[hipWidth + clothOffset * 1.5, hipWidth + clothOffset, 0.05, 24]} />
          </mesh>
          {/* Short legs */}
          <group rotation={poseRotations.leftLegRotation}>
            <mesh position={[-hipWidth * 0.5, -0.12, 0]} material={shortsMat} castShadow>
              <cylinderGeometry args={[thighRadius * 0.85, thighRadius + clothOffset * 1.5, 0.2, 16]} />
            </mesh>
          </group>
          <group rotation={poseRotations.rightLegRotation}>
            <mesh position={[hipWidth * 0.5, -0.12, 0]} material={shortsMat} castShadow>
              <cylinderGeometry args={[thighRadius * 0.85, thighRadius + clothOffset * 1.5, 0.2, 16]} />
            </mesh>
          </group>
        </group>
      )}
      
      {/* ===== SUIT PANTS ===== */}
      {hasSuitPants && !hasWorksuit && (
        <group position={[0, -0.33, 0]}>
          <mesh position={[0, 0.02, 0]} material={suitMat} castShadow>
            <cylinderGeometry args={[hipWidth + clothOffset, hipWidth + clothOffset, 0.05, 24]} />
          </mesh>
          <group rotation={poseRotations.leftLegRotation}>
            <mesh position={[-hipWidth * 0.5, -legLength * 0.5, 0]} material={suitMat} castShadow>
              <cylinderGeometry args={[thighRadius * 0.65, thighRadius + clothOffset, legLength * 0.95, 16]} />
            </mesh>
          </group>
          <group rotation={poseRotations.rightLegRotation}>
            <mesh position={[hipWidth * 0.5, -legLength * 0.5, 0]} material={suitMat} castShadow>
              <cylinderGeometry args={[thighRadius * 0.65, thighRadius + clothOffset, legLength * 0.95, 16]} />
            </mesh>
          </group>
        </group>
      )}
      
      {/* ===== SNEAKERS ===== */}
      {hasSneakers && (
        <>
          <group position={[-hipWidth * 0.5, -legLength - 0.82, 0]} rotation={poseRotations.leftLegRotation}>
            {/* Main shoe body */}
            <mesh position={[0, 0, 0.015]} material={sneakerMat} castShadow>
              <boxGeometry args={[0.05, 0.035, 0.11]} />
            </mesh>
            {/* Toe cap */}
            <mesh position={[0, 0.005, 0.055]} material={sneakerMat}>
              <sphereGeometry args={[0.025, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            </mesh>
            {/* Sole */}
            <mesh position={[0, -0.02, 0.015]} material={new THREE.MeshStandardMaterial({ color: '#333' })}>
              <boxGeometry args={[0.052, 0.012, 0.115]} />
            </mesh>
          </group>
          <group position={[hipWidth * 0.5, -legLength - 0.82, 0]} rotation={poseRotations.rightLegRotation}>
            <mesh position={[0, 0, 0.015]} material={sneakerMat} castShadow>
              <boxGeometry args={[0.05, 0.035, 0.11]} />
            </mesh>
            <mesh position={[0, 0.005, 0.055]} material={sneakerMat}>
              <sphereGeometry args={[0.025, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            </mesh>
            <mesh position={[0, -0.02, 0.015]} material={new THREE.MeshStandardMaterial({ color: '#333' })}>
              <boxGeometry args={[0.052, 0.012, 0.115]} />
            </mesh>
          </group>
        </>
      )}
      
      {/* ===== DRESS SHOES ===== */}
      {hasDressShoes && (
        <>
          <group position={[-hipWidth * 0.5, -legLength - 0.82, 0]} rotation={poseRotations.leftLegRotation}>
            <mesh position={[0, 0, 0.02]} material={dressShoeMat} castShadow>
              <boxGeometry args={[0.042, 0.025, 0.1]} />
            </mesh>
            {/* Pointed toe */}
            <mesh position={[0, -0.005, 0.065]} rotation={[-0.2, 0, 0]} material={dressShoeMat}>
              <boxGeometry args={[0.035, 0.015, 0.04]} />
            </mesh>
            {/* Heel */}
            <mesh position={[0, -0.015, -0.03]} material={dressShoeMat}>
              <boxGeometry args={[0.035, 0.025, 0.025]} />
            </mesh>
          </group>
          <group position={[hipWidth * 0.5, -legLength - 0.82, 0]} rotation={poseRotations.rightLegRotation}>
            <mesh position={[0, 0, 0.02]} material={dressShoeMat} castShadow>
              <boxGeometry args={[0.042, 0.025, 0.1]} />
            </mesh>
            <mesh position={[0, -0.005, 0.065]} rotation={[-0.2, 0, 0]} material={dressShoeMat}>
              <boxGeometry args={[0.035, 0.015, 0.04]} />
            </mesh>
            <mesh position={[0, -0.015, -0.03]} material={dressShoeMat}>
              <boxGeometry args={[0.035, 0.025, 0.025]} />
            </mesh>
          </group>
        </>
      )}
      
      {/* ===== DRESS ===== */}
      {hasDress && (
        <group position={[0, 0, 0]}>
          {/* Bodice */}
          <mesh position={[0, 0.02, 0]} material={dressMat} castShadow>
            <cylinderGeometry args={[waistWidth + clothOffset, chestWidth + clothOffset * 2, 0.25, 24]} />
          </mesh>
          {/* Skirt - flared */}
          <mesh position={[0, -0.22, 0]} material={dressMat} castShadow>
            <coneGeometry args={[hipWidth + 0.1, 0.5, 24]} />
          </mesh>
          {/* Straps */}
          <mesh position={[-0.04, 0.18, 0]} rotation={[0, 0, 0.2]} material={dressMat}>
            <boxGeometry args={[0.015, 0.1, 0.01]} />
          </mesh>
          <mesh position={[0.04, 0.18, 0]} rotation={[0, 0, -0.2]} material={dressMat}>
            <boxGeometry args={[0.015, 0.1, 0.01]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Camera controller
function CameraController() {
  const { ui } = useAvatarStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    
    const positions: Record<string, [number, number, number]> = {
      front: [0, 1.2, 3],
      side: [3, 1.2, 0],
      back: [0, 1.2, -3],
      face: [0, 1.6, 1.2],
      custom: [2, 1.5, 2],
    };
    
    const pos = positions[ui.cameraView] || positions.front;
    camera.position.set(pos[0], pos[1], pos[2]);
    controlsRef.current.target.set(0, 0.6, 0);
    controlsRef.current.update();
  }, [ui.cameraView, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={0.5}
      maxDistance={10}
      target={[0, 1.0, 0]}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
    />
  );
}

// Floor
function Floor() {
  return (
    <group>
      <gridHelper args={[10, 20, '#3a3a5a', '#2a2a4a']} />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={10} blur={2} far={4} />
    </group>
  );
}

// Scene Reference Setter - shares scene with export
function SceneExporter() {
  const { scene } = useThree();
  useEffect(() => {
    setSceneRef(scene);
    return () => setSceneRef(null);
  }, [scene]);
  return null;
}

export default function AvatarCanvas() {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 1.2, 3], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => { gl.setClearColor('#12121f'); }}
      >
        <Suspense fallback={<Loader />}>
          <SceneExporter />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
          <directionalLight position={[-3, 3, -3]} intensity={0.4} />
          <hemisphereLight intensity={0.3} groundColor="#1a1a2e" />
          <Environment preset="studio" />
          <RealisticHumanBody />
          <ClothingLayer />
          <Floor />
          <CameraController />
        </Suspense>
      </Canvas>
    </div>
  );
}
