import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as THREE from 'three';

// ============================================
// MAKEHUMAN-STYLE AVATAR ENGINE - STATE
// ============================================

// Scene reference for export (not persisted)
let sceneRef: THREE.Scene | null = null;
export const setSceneRef = (scene: THREE.Scene | null) => { sceneRef = scene; };
export const getSceneRef = () => sceneRef;

export type MainTab = 'modelling' | 'geometries' | 'materials' | 'pose' | 'rendering' | 'settings' | 'export';
export type ModellingTab = 'main' | 'gender' | 'face' | 'torso' | 'arms' | 'legs' | 'random' | 'custom' | 'measure';
export type GeometriesTab = 'clothes' | 'eyes' | 'hair' | 'teeth' | 'eyebrows' | 'eyelashes';

// Macro sliders (Main tab)
export interface MacroMorphs {
  gender: number;      // 0 = female, 100 = male
  age: number;         // 0 = baby, 50 = adult, 100 = elderly
  muscle: number;      // 0-100
  weight: number;      // 0-100
  height: number;      // 0-100
  proportions: number; // 0-100
  african: number;     // 0-100
  asian: number;       // 0-100
  caucasian: number;   // 0-100
}

// Face morphs
export interface FaceMorphs {
  headWidth: number; headHeight: number; headDepth: number;
  foreheadHeight: number; foreheadWidth: number; foreheadProtrusion: number;
  eyeSize: number; eyeSpacing: number; eyeHeight: number; eyeDepth: number; eyeAngle: number;
  browHeight: number; browProtrusion: number; browAngle: number;
  noseWidth: number; noseLength: number; noseBridge: number; noseProtrusion: number;
  nostrilWidth: number; nostrilHeight: number; noseTip: number;
  mouthWidth: number; mouthHeight: number; lipUpperFullness: number; lipLowerFullness: number; mouthProtrusion: number;
  cheekboneWidth: number; cheekboneHeight: number; cheekFullness: number;
  jawWidth: number; jawHeight: number; jawAngle: number;
  chinWidth: number; chinHeight: number; chinProtrusion: number;
  earSize: number; earAngle: number; earHeight: number;
  neckWidth: number; neckLength: number;
}

// Torso morphs
export interface TorsoMorphs {
  shoulderWidth: number; shoulderHeight: number;
  chestWidth: number; chestDepth: number; chestHeight: number; bustSize: number;
  waistWidth: number; waistHeight: number;
  hipWidth: number; hipHeight: number;
  buttockSize: number; buttockProtrusion: number;
  stomachSize: number; backCurvature: number;
}

// Arms morphs
export interface ArmsMorphs {
  armLength: number; upperArmWidth: number; forearmWidth: number; wristWidth: number;
  handSize: number; fingerLength: number;
  shoulderMuscle: number; bicepSize: number; tricepSize: number;
}

// Legs morphs
export interface LegsMorphs {
  legLength: number; upperLegWidth: number; lowerLegWidth: number; ankleWidth: number;
  footSize: number; toeLength: number;
  thighGap: number; calfSize: number; gluteSize: number;
}

// Clothing item
export interface ClothingItem {
  id: string;
  name: string;
  category: 'tops' | 'bottoms' | 'shoes' | 'fullbody' | 'accessories';
  thumbnail: string;
}

// Materials
export interface MaterialSettings {
  skinTone: string;
  skinTexture: 'smooth' | 'freckled' | 'aged' | 'scarred';
  eyeColor: string;
  hairColor: string;
  subsurfaceScattering: number;
  roughness: number;
}

// Avatar state
export interface AvatarState {
  id: string;
  name: string;
  macro: MacroMorphs;
  face: FaceMorphs;
  torso: TorsoMorphs;
  arms: ArmsMorphs;
  legs: LegsMorphs;
  materials: MaterialSettings;
  clothing: string[];
  hair: string | null;
  pose: string;
}

// UI State
export interface UIState {
  mainTab: MainTab;
  modellingTab: ModellingTab;
  geometriesTab: GeometriesTab;
  selectedCategory: string | null;
  showWireframe: boolean;
  showSkeleton: boolean;
  cameraView: 'front' | 'side' | 'back' | 'face' | 'custom';
  zoom: number;
}

// Rendering settings
export interface RenderSettings {
  resolution: string;
  width: number;
  height: number;
  format: string;
  background: string;
  backgroundColor: string;
  shadows: boolean;
  antiAliasing: string;
  mode: string;
}

// Pose settings
export interface PoseSettings {
  preset: string;
  animation: string | null;
  isPlaying: boolean;
  playbackSpeed: number;
}

// Eye/face geometry settings
export interface FaceGeometry {
  eyeType: string;
  teethType: string;
  eyebrowType: string;
  eyelashType: string;
}

// Defaults
export const defaultMacro: MacroMorphs = {
  gender: 50, age: 25, muscle: 50, weight: 100, height: 50,
  proportions: 50, african: 0, asian: 0, caucasian: 100,
};

export const defaultFace: FaceMorphs = {
  headWidth: 50, headHeight: 50, headDepth: 50,
  foreheadHeight: 50, foreheadWidth: 50, foreheadProtrusion: 50,
  eyeSize: 50, eyeSpacing: 50, eyeHeight: 50, eyeDepth: 50, eyeAngle: 50,
  browHeight: 50, browProtrusion: 50, browAngle: 50,
  noseWidth: 50, noseLength: 50, noseBridge: 50, noseProtrusion: 50,
  nostrilWidth: 50, nostrilHeight: 50, noseTip: 50,
  mouthWidth: 50, mouthHeight: 50, lipUpperFullness: 50, lipLowerFullness: 50, mouthProtrusion: 50,
  cheekboneWidth: 50, cheekboneHeight: 50, cheekFullness: 50,
  jawWidth: 50, jawHeight: 50, jawAngle: 50,
  chinWidth: 50, chinHeight: 50, chinProtrusion: 50,
  earSize: 50, earAngle: 50, earHeight: 50,
  neckWidth: 50, neckLength: 50,
};

export const defaultTorso: TorsoMorphs = {
  shoulderWidth: 50, shoulderHeight: 50,
  chestWidth: 50, chestDepth: 50, chestHeight: 50, bustSize: 50,
  waistWidth: 50, waistHeight: 50, hipWidth: 50, hipHeight: 50,
  buttockSize: 50, buttockProtrusion: 50, stomachSize: 50, backCurvature: 50,
};

export const defaultArms: ArmsMorphs = {
  armLength: 50, upperArmWidth: 50, forearmWidth: 50, wristWidth: 50,
  handSize: 50, fingerLength: 50, shoulderMuscle: 50, bicepSize: 50, tricepSize: 50,
};

export const defaultLegs: LegsMorphs = {
  legLength: 50, upperLegWidth: 50, lowerLegWidth: 50, ankleWidth: 50,
  footSize: 50, toeLength: 50, thighGap: 50, calfSize: 50, gluteSize: 50,
};

export const defaultMaterials: MaterialSettings = {
  skinTone: '#C68642',
  skinTexture: 'smooth',
  eyeColor: '#634e34',
  hairColor: '#2C1810',
  subsurfaceScattering: 50,
  roughness: 50,
};

// Clothing catalog
export const clothingCatalog: ClothingItem[] = [
  { id: 'jeans01', name: 'Jeans', category: 'bottoms', thumbnail: '👖' },
  { id: 'shirt01', name: 'T-Shirt', category: 'tops', thumbnail: '👕' },
  { id: 'shoes01', name: 'Sneakers', category: 'shoes', thumbnail: '👟' },
  { id: 'shoes02', name: 'Dress Shoes', category: 'shoes', thumbnail: '👞' },
  { id: 'short01', name: 'Shorts', category: 'bottoms', thumbnail: '🩳' },
  { id: 'suit01', name: 'Suit Jacket', category: 'tops', thumbnail: '🤵' },
  { id: 'suit01res', name: 'Suit Pants', category: 'bottoms', thumbnail: '👔' },
  { id: 'tshirt02', name: 'Polo', category: 'tops', thumbnail: '👕' },
  { id: 'hoodie01', name: 'Hoodie', category: 'tops', thumbnail: '🧥' },
  { id: 'dress01', name: 'Dress', category: 'fullbody', thumbnail: '👗' },
  { id: 'jacket01', name: 'Jacket', category: 'tops', thumbnail: '🧥' },
  { id: 'worksuit', name: 'Work Suit', category: 'fullbody', thumbnail: '🧑‍💼' },
];

// Hair catalog - Real hairstyles
export const hairCatalog = [
  { id: 'bald', name: 'Bald', thumbnail: '👨‍🦲', type: 'none' },
  { id: 'baldfade', name: 'Bald Fade', thumbnail: '💈', type: 'fade' },
  { id: 'lowfade', name: 'Low Fade', thumbnail: '✂️', type: 'fade' },
  { id: 'highfade', name: 'High Fade', thumbnail: '💇‍♂️', type: 'fade' },
  { id: 'buzzcut', name: 'Buzz Cut', thumbnail: '👮', type: 'short' },
  { id: 'crewcut', name: 'Crew Cut', thumbnail: '👨‍✈️', type: 'short' },
  { id: 'short01', name: 'Short', thumbnail: '👨', type: 'short' },
  { id: 'medium01', name: 'Medium', thumbnail: '🧑', type: 'medium' },
  { id: 'long01', name: 'Long', thumbnail: '👩', type: 'long' },
  { id: 'curly01', name: 'Curly', thumbnail: '🧑‍🦱', type: 'curly' },
  { id: 'afro01', name: 'Afro', thumbnail: '✊🏿', type: 'afro' },
  { id: 'afropuff', name: 'Afro Puff', thumbnail: '🌺', type: 'afro' },
  { id: 'dreads', name: 'Dreadlocks', thumbnail: '🦁', type: 'dreads' },
  { id: 'dreadslong', name: 'Long Dreads', thumbnail: '🎸', type: 'dreads' },
  { id: 'dreadsshort', name: 'Short Dreads', thumbnail: '🎤', type: 'dreads' },
  { id: 'cornrows', name: 'Cornrows', thumbnail: '🌾', type: 'braids' },
  { id: 'boxbraids', name: 'Box Braids', thumbnail: '🎀', type: 'braids' },
  { id: 'twists', name: 'Twists', thumbnail: '🌀', type: 'braids' },
  { id: 'ponytail01', name: 'Ponytail', thumbnail: '👧', type: 'long' },
  { id: 'bun01', name: 'Bun', thumbnail: '🥮', type: 'long' },
  { id: 'mohawk01', name: 'Mohawk', thumbnail: '🤘', type: 'mohawk' },
  { id: 'waves', name: '360 Waves', thumbnail: '🌊', type: 'short' },
  { id: 'flatop', name: 'Flat Top', thumbnail: '📦', type: 'short' },
];

// Skin tone presets
export const skinTonePresets = [
  { name: 'Pale', color: '#FFDFC4' },
  { name: 'Fair', color: '#F0D5BE' },
  { name: 'Light', color: '#EECEB3' },
  { name: 'Medium Light', color: '#E0B594' },
  { name: 'Medium', color: '#C68642' },
  { name: 'Medium Dark', color: '#8D5524' },
  { name: 'Dark', color: '#5C3317' },
  { name: 'Deep', color: '#3C1810' },
];

// Eye color presets
export const eyeColorPresets = [
  { name: 'Brown', color: '#634e34' },
  { name: 'Hazel', color: '#8E7618' },
  { name: 'Amber', color: '#B5651D' },
  { name: 'Green', color: '#3D8C4F' },
  { name: 'Blue', color: '#4169E1' },
  { name: 'Gray', color: '#778899' },
];

// Eye type catalog
export const eyeCatalog = [
  { id: 'normal', name: 'Normal', thumbnail: '👁️' },
  { id: 'anime', name: 'Anime', thumbnail: '🌸' },
  { id: 'realistic', name: 'Realistic', thumbnail: '👀' },
  { id: 'cartoon', name: 'Cartoon', thumbnail: '😃' },
];

// Teeth catalog
export const teethCatalog = [
  { id: 'normal', name: 'Normal', thumbnail: '🦷' },
  { id: 'braces', name: 'Braces', thumbnail: '🔧' },
  { id: 'vampire', name: 'Vampire', thumbnail: '🧛' },
  { id: 'gold', name: 'Gold', thumbnail: '✨' },
];

// Eyebrow catalog
export const eyebrowCatalog = [
  { id: 'natural', name: 'Natural', thumbnail: '🤨' },
  { id: 'thick', name: 'Thick', thumbnail: '😤' },
  { id: 'thin', name: 'Thin', thumbnail: '🙂' },
  { id: 'arched', name: 'Arched', thumbnail: '😏' },
  { id: 'straight', name: 'Straight', thumbnail: '😐' },
];

// Eyelash catalog
export const eyelashCatalog = [
  { id: 'natural', name: 'Natural', thumbnail: '👁️' },
  { id: 'long', name: 'Long', thumbnail: '🦋' },
  { id: 'dramatic', name: 'Dramatic', thumbnail: '💃' },
  { id: 'none', name: 'None', thumbnail: '⚪' },
];

// Default render settings
export const defaultRenderSettings: RenderSettings = {
  resolution: '1080p',
  width: 1920,
  height: 1080,
  format: 'png',
  background: 'transparent',
  backgroundColor: '#12121f',
  shadows: true,
  antiAliasing: '4x',
  mode: 'single',
};

// Default pose settings
export const defaultPoseSettings: PoseSettings = {
  preset: 'tpose',
  animation: null,
  isPlaying: false,
  playbackSpeed: 1,
};

// Default face geometry
export const defaultFaceGeometry: FaceGeometry = {
  eyeType: 'normal',
  teethType: 'normal',
  eyebrowType: 'natural',
  eyelashType: 'natural',
};

// Create default avatar
export const createDefaultAvatar = (): AvatarState => ({
  id: `avatar_${Date.now()}`,
  name: 'Untitled',
  macro: { ...defaultMacro },
  face: { ...defaultFace },
  torso: { ...defaultTorso },
  arms: { ...defaultArms },
  legs: { ...defaultLegs },
  materials: { ...defaultMaterials },
  clothing: ['shirt01', 'jeans01', 'shoes01'],
  hair: 'short01',
  pose: 'tpose',
});

// Store interface
interface AvatarStore {
  avatar: AvatarState;
  ui: UIState;
  render: RenderSettings;
  pose: PoseSettings;
  faceGeometry: FaceGeometry;
  savedAvatars: AvatarState[];
  setMacro: (key: keyof MacroMorphs, value: number) => void;
  setFace: (key: keyof FaceMorphs, value: number) => void;
  setTorso: (key: keyof TorsoMorphs, value: number) => void;
  setArms: (key: keyof ArmsMorphs, value: number) => void;
  setLegs: (key: keyof LegsMorphs, value: number) => void;
  setMaterial: (key: keyof MaterialSettings, value: any) => void;
  toggleClothing: (id: string) => void;
  setHair: (id: string | null) => void;
  setMainTab: (tab: MainTab) => void;
  setModellingTab: (tab: ModellingTab) => void;
  setGeometriesTab: (tab: GeometriesTab) => void;
  setCategory: (cat: string | null) => void;
  toggleWireframe: () => void;
  toggleSkeleton: () => void;
  setCameraView: (view: UIState['cameraView']) => void;
  setZoom: (zoom: number) => void;
  setRender: (updates: Partial<RenderSettings>) => void;
  setPose: (updates: Partial<PoseSettings>) => void;
  setFaceGeometry: (updates: Partial<FaceGeometry>) => void;
  setEyeType: (eyeType: string) => void;
  setTeeth: (teethType: string) => void;
  setEyebrows: (eyebrowType: string) => void;
  setEyelashes: (eyelashType: string) => void;
  randomize: () => void;
  reset: () => void;
  setName: (name: string) => void;
  saveAvatar: () => void;
  loadAvatar: (id: string) => void;
  deleteAvatar: (id: string) => void;
}

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set, get) => ({
      avatar: createDefaultAvatar(),
      ui: {
        mainTab: 'modelling',
        modellingTab: 'main',
        geometriesTab: 'clothes',
        selectedCategory: 'Macro',
        showWireframe: false,
        showSkeleton: false,
        cameraView: 'front',
        zoom: 1,
      },
      render: { ...defaultRenderSettings },
      pose: { ...defaultPoseSettings },
      faceGeometry: { ...defaultFaceGeometry },
      savedAvatars: [],

      setMacro: (key, value) => set((s) => ({ avatar: { ...s.avatar, macro: { ...s.avatar.macro, [key]: value } } })),
      setFace: (key, value) => set((s) => ({ avatar: { ...s.avatar, face: { ...s.avatar.face, [key]: value } } })),
      setTorso: (key, value) => set((s) => ({ avatar: { ...s.avatar, torso: { ...s.avatar.torso, [key]: value } } })),
      setArms: (key, value) => set((s) => ({ avatar: { ...s.avatar, arms: { ...s.avatar.arms, [key]: value } } })),
      setLegs: (key, value) => set((s) => ({ avatar: { ...s.avatar, legs: { ...s.avatar.legs, [key]: value } } })),
      setMaterial: (key, value) => set((s) => ({ avatar: { ...s.avatar, materials: { ...s.avatar.materials, [key]: value } } })),
      
      toggleClothing: (id) => set((s) => {
        const c = s.avatar.clothing;
        return { avatar: { ...s.avatar, clothing: c.includes(id) ? c.filter(x => x !== id) : [...c, id] } };
      }),
      
      setHair: (id) => set((s) => ({ avatar: { ...s.avatar, hair: id } })),
      
      setMainTab: (mainTab) => set((s) => ({ ui: { ...s.ui, mainTab } })),
      setModellingTab: (modellingTab) => set((s) => ({ ui: { ...s.ui, modellingTab } })),
      setGeometriesTab: (geometriesTab) => set((s) => ({ ui: { ...s.ui, geometriesTab } })),
      setCategory: (selectedCategory) => set((s) => ({ ui: { ...s.ui, selectedCategory } })),
      toggleWireframe: () => set((s) => ({ ui: { ...s.ui, showWireframe: !s.ui.showWireframe } })),
      toggleSkeleton: () => set((s) => ({ ui: { ...s.ui, showSkeleton: !s.ui.showSkeleton } })),
      setCameraView: (cameraView) => set((s) => ({ ui: { ...s.ui, cameraView } })),
      setZoom: (zoom) => set((s) => ({ ui: { ...s.ui, zoom } })),

      // Render settings - accepts partial update
      setRender: (updates) => set((s) => ({ render: { ...s.render, ...updates } })),
      
      // Pose settings - accepts partial update
      setPose: (updates) => set((s) => ({ 
        pose: { ...s.pose, ...updates },
        avatar: updates.preset ? { ...s.avatar, pose: updates.preset } : s.avatar
      })),
      
      // Face geometry - accepts partial update
      setFaceGeometry: (updates) => set((s) => ({ faceGeometry: { ...s.faceGeometry, ...updates } })),
      
      // Convenience setters for face geometry
      setEyeType: (eyeType) => set((s) => ({ faceGeometry: { ...s.faceGeometry, eyeType } })),
      setTeeth: (teethType) => set((s) => ({ faceGeometry: { ...s.faceGeometry, teethType } })),
      setEyebrows: (eyebrowType) => set((s) => ({ faceGeometry: { ...s.faceGeometry, eyebrowType } })),
      setEyelashes: (eyelashType) => set((s) => ({ faceGeometry: { ...s.faceGeometry, eyelashType } })),

      randomize: () => set((s) => {
        const r = () => Math.floor(Math.random() * 100);
        return {
          avatar: {
            ...s.avatar,
            macro: { gender: r(), age: 15 + Math.floor(Math.random() * 60), muscle: r(), weight: r(), height: r(), proportions: r(), african: r(), asian: r(), caucasian: r() },
          }
        };
      }),

      reset: () => set({ avatar: createDefaultAvatar() }),
      setName: (name) => set((s) => ({ avatar: { ...s.avatar, name } })),
      
      saveAvatar: () => set((s) => {
        const idx = s.savedAvatars.findIndex(a => a.id === s.avatar.id);
        if (idx >= 0) {
          const arr = [...s.savedAvatars];
          arr[idx] = { ...s.avatar };
          return { savedAvatars: arr };
        }
        return { savedAvatars: [...s.savedAvatars, { ...s.avatar }] };
      }),
      
      loadAvatar: (id) => set((s) => {
        const found = s.savedAvatars.find(a => a.id === id);
        return found ? { avatar: { ...found } } : s;
      }),
      
      deleteAvatar: (id) => set((s) => ({ savedAvatars: s.savedAvatars.filter(a => a.id !== id) })),
    }),
    { name: 'yocreator-makehuman-avatar', partialize: (s) => ({ avatar: s.avatar, savedAvatars: s.savedAvatars }) }
  )
);
