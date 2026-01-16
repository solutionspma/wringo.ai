'use client';

import React from 'react';
import { useAvatarStore, skinTonePresets, eyeColorPresets } from '../store';

// Color picker component
function ColorPicker({ 
  label, 
  value, 
  onChange, 
  presets 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  presets?: { name: string; color: string }[];
}) {
  return (
    <div className="mb-4">
      <label className="text-xs text-gray-400 mb-2 block">{label}</label>
      <div className="flex gap-2 items-center mb-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border-2 border-[#3a3a5a]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-[#2a2a4a] border border-[#3a3a5a] rounded text-sm"
        />
      </div>
      {presets && (
        <div className="flex flex-wrap gap-1 mt-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(preset.color)}
              className={`w-6 h-6 rounded-full border-2 transition ${
                value === preset.color ? 'border-cyan-400 scale-110' : 'border-[#3a3a5a]'
              }`}
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Slider component
function Slider({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-cyan-400">{Math.round(value)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[#2a2a4a] rounded-lg appearance-none cursor-pointer slider-thumb"
      />
    </div>
  );
}

export default function MaterialsPanel() {
  const { avatar, setMaterial } = useAvatarStore();
  const m = avatar.materials;

  return (
    <div className="p-4">
      {/* Skin */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>🎨</span> Skin
        </h3>
        <ColorPicker
          label="Skin Tone"
          value={m.skinTone}
          onChange={(v) => setMaterial('skinTone', v)}
          presets={skinTonePresets}
        />
        
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Skin Texture</label>
          <div className="grid grid-cols-2 gap-2">
            {(['smooth', 'freckled', 'aged', 'scarred'] as const).map((tex) => (
              <button
                key={tex}
                onClick={() => setMaterial('skinTexture', tex)}
                className={`px-3 py-2 rounded text-sm capitalize transition ${
                  m.skinTexture === tex
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-[#2a2a4a] text-gray-400 hover:bg-[#3a3a5a]'
                }`}
              >
                {tex}
              </button>
            ))}
          </div>
        </div>

        <Slider
          label="Subsurface Scattering"
          value={m.subsurfaceScattering}
          onChange={(v) => setMaterial('subsurfaceScattering', v)}
        />
        <Slider
          label="Roughness"
          value={m.roughness}
          onChange={(v) => setMaterial('roughness', v)}
        />
      </div>

      {/* Eyes */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>👁️</span> Eyes
        </h3>
        <ColorPicker
          label="Eye Color"
          value={m.eyeColor}
          onChange={(v) => setMaterial('eyeColor', v)}
          presets={eyeColorPresets}
        />
      </div>

      {/* Hair */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>💇</span> Hair
        </h3>
        <ColorPicker
          label="Hair Color"
          value={m.hairColor}
          onChange={(v) => setMaterial('hairColor', v)}
          presets={[
            { name: 'Black', color: '#1a1a1a' },
            { name: 'Dark Brown', color: '#2C1810' },
            { name: 'Brown', color: '#5C3317' },
            { name: 'Light Brown', color: '#8B4513' },
            { name: 'Blonde', color: '#D4A574' },
            { name: 'Platinum', color: '#E8DCC4' },
            { name: 'Ginger', color: '#B5651D' },
            { name: 'Red', color: '#8B0000' },
            { name: 'Gray', color: '#808080' },
            { name: 'White', color: '#DCDCDC' },
            { name: 'Blue', color: '#4169E1' },
            { name: 'Pink', color: '#FF69B4' },
            { name: 'Purple', color: '#8B008B' },
            { name: 'Green', color: '#228B22' },
          ]}
        />
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
