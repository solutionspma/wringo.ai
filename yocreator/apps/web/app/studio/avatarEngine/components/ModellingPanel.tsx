'use client';

import React from 'react';
import { useAvatarStore, MacroMorphs, FaceMorphs, TorsoMorphs, ArmsMorphs, LegsMorphs, ModellingTab } from '../store';

// Modelling sub-tabs
const modellingTabs: { id: ModellingTab; label: string }[] = [
  { id: 'main', label: 'Main' },
  { id: 'gender', label: 'Gender' },
  { id: 'face', label: 'Face' },
  { id: 'torso', label: 'Torso' },
  { id: 'arms', label: 'Arms' },
  { id: 'legs', label: 'Legs' },
  { id: 'random', label: 'Random' },
  { id: 'custom', label: 'Custom' },
  { id: 'measure', label: 'Measure' },
];

// Slider component
function Slider({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
  min?: number; 
  max?: number;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-cyan-400">{Math.round(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[#2a2a4a] rounded-lg appearance-none cursor-pointer slider-thumb"
      />
    </div>
  );
}

// Macro sliders (Main tab)
function MacroSliders() {
  const { avatar, setMacro } = useAvatarStore();
  const m = avatar.macro;

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span>📊</span> Macro Details
      </h3>
      <Slider label="Gender" value={m.gender} onChange={(v) => setMacro('gender', v)} />
      <Slider label="Age" value={m.age} onChange={(v) => setMacro('age', v)} />
      <Slider label="Muscle" value={m.muscle} onChange={(v) => setMacro('muscle', v)} />
      <Slider label="Weight" value={m.weight} onChange={(v) => setMacro('weight', v)} />
      <Slider label="Height" value={m.height} onChange={(v) => setMacro('height', v)} />
      <Slider label="Proportions" value={m.proportions} onChange={(v) => setMacro('proportions', v)} />
      
      <div className="mt-4 pt-4 border-t border-[#2a2a4a]">
        <h4 className="text-xs font-semibold text-gray-400 mb-3">Ethnicity</h4>
        <Slider label="African" value={m.african} onChange={(v) => setMacro('african', v)} />
        <Slider label="Asian" value={m.asian} onChange={(v) => setMacro('asian', v)} />
        <Slider label="Caucasian" value={m.caucasian} onChange={(v) => setMacro('caucasian', v)} />
      </div>
    </div>
  );
}

// Face sliders
function FaceSliders() {
  const { avatar, setFace } = useAvatarStore();
  const f = avatar.face;

  const sections = [
    {
      title: 'Head',
      sliders: [
        { key: 'headWidth', label: 'Head Width' },
        { key: 'headHeight', label: 'Head Height' },
        { key: 'headDepth', label: 'Head Depth' },
      ],
    },
    {
      title: 'Forehead',
      sliders: [
        { key: 'foreheadHeight', label: 'Forehead Height' },
        { key: 'foreheadWidth', label: 'Forehead Width' },
        { key: 'foreheadProtrusion', label: 'Forehead Protrusion' },
      ],
    },
    {
      title: 'Eyes',
      sliders: [
        { key: 'eyeSize', label: 'Eye Size' },
        { key: 'eyeSpacing', label: 'Eye Spacing' },
        { key: 'eyeHeight', label: 'Eye Height' },
        { key: 'eyeDepth', label: 'Eye Depth' },
        { key: 'eyeAngle', label: 'Eye Angle' },
      ],
    },
    {
      title: 'Brow',
      sliders: [
        { key: 'browHeight', label: 'Brow Height' },
        { key: 'browProtrusion', label: 'Brow Protrusion' },
        { key: 'browAngle', label: 'Brow Angle' },
      ],
    },
    {
      title: 'Nose',
      sliders: [
        { key: 'noseWidth', label: 'Nose Width' },
        { key: 'noseLength', label: 'Nose Length' },
        { key: 'noseBridge', label: 'Nose Bridge' },
        { key: 'noseProtrusion', label: 'Nose Protrusion' },
        { key: 'nostrilWidth', label: 'Nostril Width' },
        { key: 'nostrilHeight', label: 'Nostril Height' },
        { key: 'noseTip', label: 'Nose Tip' },
      ],
    },
    {
      title: 'Mouth',
      sliders: [
        { key: 'mouthWidth', label: 'Mouth Width' },
        { key: 'mouthHeight', label: 'Mouth Height' },
        { key: 'lipUpperFullness', label: 'Upper Lip' },
        { key: 'lipLowerFullness', label: 'Lower Lip' },
        { key: 'mouthProtrusion', label: 'Mouth Protrusion' },
      ],
    },
    {
      title: 'Cheeks',
      sliders: [
        { key: 'cheekboneWidth', label: 'Cheekbone Width' },
        { key: 'cheekboneHeight', label: 'Cheekbone Height' },
        { key: 'cheekFullness', label: 'Cheek Fullness' },
      ],
    },
    {
      title: 'Jaw & Chin',
      sliders: [
        { key: 'jawWidth', label: 'Jaw Width' },
        { key: 'jawHeight', label: 'Jaw Height' },
        { key: 'jawAngle', label: 'Jaw Angle' },
        { key: 'chinWidth', label: 'Chin Width' },
        { key: 'chinHeight', label: 'Chin Height' },
        { key: 'chinProtrusion', label: 'Chin Protrusion' },
      ],
    },
    {
      title: 'Ears',
      sliders: [
        { key: 'earSize', label: 'Ear Size' },
        { key: 'earAngle', label: 'Ear Angle' },
        { key: 'earHeight', label: 'Ear Height' },
      ],
    },
    {
      title: 'Neck',
      sliders: [
        { key: 'neckWidth', label: 'Neck Width' },
        { key: 'neckLength', label: 'Neck Length' },
      ],
    },
  ];

  return (
    <div className="p-4">
      {sections.map((section) => (
        <div key={section.title} className="mb-4">
          <h4 className="text-xs font-semibold text-gray-400 mb-2">{section.title}</h4>
          {section.sliders.map((s) => (
            <Slider
              key={s.key}
              label={s.label}
              value={f[s.key as keyof FaceMorphs]}
              onChange={(v) => setFace(s.key as keyof FaceMorphs, v)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Torso sliders
function TorsoSliders() {
  const { avatar, setTorso } = useAvatarStore();
  const t = avatar.torso;

  const sliders = [
    { key: 'shoulderWidth', label: 'Shoulder Width' },
    { key: 'shoulderHeight', label: 'Shoulder Height' },
    { key: 'chestWidth', label: 'Chest Width' },
    { key: 'chestDepth', label: 'Chest Depth' },
    { key: 'chestHeight', label: 'Chest Height' },
    { key: 'bustSize', label: 'Bust Size' },
    { key: 'waistWidth', label: 'Waist Width' },
    { key: 'waistHeight', label: 'Waist Height' },
    { key: 'hipWidth', label: 'Hip Width' },
    { key: 'hipHeight', label: 'Hip Height' },
    { key: 'buttockSize', label: 'Buttock Size' },
    { key: 'buttockProtrusion', label: 'Buttock Protrusion' },
    { key: 'stomachSize', label: 'Stomach Size' },
    { key: 'backCurvature', label: 'Back Curvature' },
  ];

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span>👕</span> Torso Details
      </h3>
      {sliders.map((s) => (
        <Slider
          key={s.key}
          label={s.label}
          value={t[s.key as keyof TorsoMorphs]}
          onChange={(v) => setTorso(s.key as keyof TorsoMorphs, v)}
        />
      ))}
    </div>
  );
}

// Arms sliders
function ArmsSliders() {
  const { avatar, setArms } = useAvatarStore();
  const a = avatar.arms;

  const sliders = [
    { key: 'armLength', label: 'Arm Length' },
    { key: 'upperArmWidth', label: 'Upper Arm Width' },
    { key: 'forearmWidth', label: 'Forearm Width' },
    { key: 'wristWidth', label: 'Wrist Width' },
    { key: 'handSize', label: 'Hand Size' },
    { key: 'fingerLength', label: 'Finger Length' },
    { key: 'shoulderMuscle', label: 'Shoulder Muscle' },
    { key: 'bicepSize', label: 'Bicep Size' },
    { key: 'tricepSize', label: 'Tricep Size' },
  ];

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span>💪</span> Arms Details
      </h3>
      {sliders.map((s) => (
        <Slider
          key={s.key}
          label={s.label}
          value={a[s.key as keyof ArmsMorphs]}
          onChange={(v) => setArms(s.key as keyof ArmsMorphs, v)}
        />
      ))}
    </div>
  );
}

// Legs sliders
function LegsSliders() {
  const { avatar, setLegs } = useAvatarStore();
  const l = avatar.legs;

  const sliders = [
    { key: 'legLength', label: 'Leg Length' },
    { key: 'upperLegWidth', label: 'Upper Leg Width' },
    { key: 'lowerLegWidth', label: 'Lower Leg Width' },
    { key: 'ankleWidth', label: 'Ankle Width' },
    { key: 'footSize', label: 'Foot Size' },
    { key: 'toeLength', label: 'Toe Length' },
    { key: 'thighGap', label: 'Thigh Gap' },
    { key: 'calfSize', label: 'Calf Size' },
    { key: 'gluteSize', label: 'Glute Size' },
  ];

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span>🦵</span> Legs Details
      </h3>
      {sliders.map((s) => (
        <Slider
          key={s.key}
          label={s.label}
          value={l[s.key as keyof LegsMorphs]}
          onChange={(v) => setLegs(s.key as keyof LegsMorphs, v)}
        />
      ))}
    </div>
  );
}

// Random generator panel
function RandomPanel() {
  const { randomize, reset } = useAvatarStore();

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span>🎲</span> Random Generator
      </h3>
      <div className="space-y-3">
        <button
          onClick={randomize}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition"
        >
          🎲 Generate Random Avatar
        </button>
        <button
          onClick={reset}
          className="w-full py-3 bg-[#2a2a4a] hover:bg-[#3a3a5a] rounded-lg font-medium transition"
        >
          ↺ Reset to Default
        </button>
      </div>
      
      <div className="mt-6 text-xs text-gray-400">
        <p>Click "Generate Random" to create a unique character with randomized attributes.</p>
        <p className="mt-2">Use "Reset" to return to the default neutral character.</p>
      </div>
    </div>
  );
}

// Custom morphs panel (placeholder)
function CustomPanel() {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span>✏️</span> Custom Morphs
      </h3>
      <div className="text-sm text-gray-400">
        <p>Import custom morph targets or blend shapes here.</p>
        <button className="mt-4 w-full py-2 border border-dashed border-[#3a3a5a] rounded-lg hover:border-cyan-400 transition">
          + Import Custom Morphs
        </button>
      </div>
    </div>
  );
}

// Measure panel
function MeasurePanel() {
  const { avatar } = useAvatarStore();
  const height = 1.4 + (avatar.macro.height / 100) * 0.6;

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span>📏</span> Measurements
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between p-2 bg-[#2a2a4a] rounded">
          <span className="text-gray-400">Height</span>
          <span>{(height * 100).toFixed(1)} cm</span>
        </div>
        <div className="flex justify-between p-2 bg-[#2a2a4a] rounded">
          <span className="text-gray-400">Weight (est.)</span>
          <span>{Math.round(50 + avatar.macro.weight * 0.7)} kg</span>
        </div>
        <div className="flex justify-between p-2 bg-[#2a2a4a] rounded">
          <span className="text-gray-400">BMI (est.)</span>
          <span>{(18 + avatar.macro.weight * 0.15).toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ModellingPanel() {
  const { ui, setModellingTab } = useAvatarStore();

  const renderContent = () => {
    switch (ui.modellingTab) {
      case 'main': return <MacroSliders />;
      case 'gender': return <MacroSliders />;
      case 'face': return <FaceSliders />;
      case 'torso': return <TorsoSliders />;
      case 'arms': return <ArmsSliders />;
      case 'legs': return <LegsSliders />;
      case 'random': return <RandomPanel />;
      case 'custom': return <CustomPanel />;
      case 'measure': return <MeasurePanel />;
      default: return <MacroSliders />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-[#2a2a4a] bg-[#1a1a2e]">
        {modellingTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setModellingTab(tab.id)}
            className={`px-2 py-1 text-xs rounded transition ${
              ui.modellingTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2a4a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {renderContent()}
      </div>

      {/* Slider thumb styles */}
      <style jsx global>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0, 212, 255, 0.5);
        }
        .slider-thumb::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
