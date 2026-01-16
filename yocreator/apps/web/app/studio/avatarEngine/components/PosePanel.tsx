'use client';

import React from 'react';
import { useAvatarStore } from '../store';

// Pose presets
const posePresets = [
  { id: 'tpose', name: 'T-Pose', icon: '🧍' },
  { id: 'apose', name: 'A-Pose', icon: '🧎' },
  { id: 'relaxed', name: 'Relaxed', icon: '😌' },
  { id: 'arms_crossed', name: 'Arms Crossed', icon: '🙆' },
  { id: 'hands_hips', name: 'Hands on Hips', icon: '💁' },
  { id: 'walking', name: 'Walking', icon: '🚶' },
  { id: 'running', name: 'Running', icon: '🏃' },
  { id: 'sitting', name: 'Sitting', icon: '🧘' },
  { id: 'waving', name: 'Waving', icon: '👋' },
  { id: 'thinking', name: 'Thinking', icon: '🤔' },
  { id: 'pointing', name: 'Pointing', icon: '👆' },
  { id: 'presenting', name: 'Presenting', icon: '🎤' },
];

// Animation presets
const animationPresets = [
  { id: 'idle', name: 'Idle', icon: '🧍', duration: '∞' },
  { id: 'walk', name: 'Walk Cycle', icon: '🚶', duration: '1.0s' },
  { id: 'run', name: 'Run Cycle', icon: '🏃', duration: '0.6s' },
  { id: 'jump', name: 'Jump', icon: '🦘', duration: '0.8s' },
  { id: 'wave', name: 'Wave', icon: '👋', duration: '1.5s' },
  { id: 'dance', name: 'Dance', icon: '💃', duration: '4.0s' },
  { id: 'clap', name: 'Clap', icon: '👏', duration: '1.2s' },
  { id: 'nod', name: 'Nod', icon: '😊', duration: '1.0s' },
  { id: 'shake_head', name: 'Shake Head', icon: '😔', duration: '1.0s' },
  { id: 'talk', name: 'Talking', icon: '🗣️', duration: '∞' },
];

export default function PosePanel() {
  const { pose, setPose } = useAvatarStore();

  return (
    <div className="p-4">
      {/* Poses */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>🧍</span> Poses
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {posePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPose({ preset: preset.id, animation: null, isPlaying: false })}
              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                pose.preset === preset.id
                  ? 'border-cyan-400 bg-cyan-400/20'
                  : 'border-[#3a3a5a] bg-[#2a2a4a] hover:border-[#4a4a6a]'
              }`}
            >
              <span className="text-2xl">{preset.icon}</span>
              <span className="text-xs text-gray-300">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Animations */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>🎬</span> Animations
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {animationPresets.map((anim) => (
            <button
              key={anim.id}
              onClick={() => setPose({ animation: anim.id })}
              className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                pose.animation === anim.id
                  ? 'border-purple-400 bg-purple-400/20'
                  : 'border-[#3a3a5a] bg-[#2a2a4a] hover:border-[#4a4a6a]'
              }`}
            >
              <span className="text-xl">{anim.icon}</span>
              <div className="text-left">
                <div className="text-xs text-gray-300">{anim.name}</div>
                <div className="text-[10px] text-gray-500">{anim.duration}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Playback controls */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setPose({ isPlaying: !pose.isPlaying })}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              pose.isPlaying
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-green-500/20 text-green-400 border border-green-500/50'
            }`}
          >
            {pose.isPlaying ? '⏹️ Stop' : '▶️ Play'}
          </button>
          <button 
            onClick={() => setPose({ animation: null, isPlaying: false })}
            className="px-4 py-2 bg-[#2a2a4a] rounded-lg hover:bg-[#3a3a5a] transition"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Bone Controls */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>🦴</span> Bone Controls
        </h3>
        <div className="text-xs text-gray-400 mb-3">
          Click on a bone in the viewport to select and rotate it
        </div>
        <div className="space-y-2">
          {['Head', 'Neck', 'Spine', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'].map((bone) => (
            <div key={bone} className="flex items-center justify-between p-2 bg-[#2a2a4a] rounded">
              <span className="text-sm">{bone}</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 text-xs bg-[#3a3a5a] rounded hover:bg-[#4a4a6a]">X</button>
                <button className="px-2 py-1 text-xs bg-[#3a3a5a] rounded hover:bg-[#4a4a6a]">Y</button>
                <button className="px-2 py-1 text-xs bg-[#3a3a5a] rounded hover:bg-[#4a4a6a]">Z</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import/Export */}
      <div className="pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>📦</span> Import/Export
        </h3>
        <div className="space-y-2">
          <button className="w-full py-2 bg-[#2a2a4a] hover:bg-[#3a3a5a] rounded-lg text-sm transition">
            📥 Import BVH Animation
          </button>
          <button className="w-full py-2 bg-[#2a2a4a] hover:bg-[#3a3a5a] rounded-lg text-sm transition">
            📥 Import Mixamo Animation
          </button>
          <button className="w-full py-2 bg-[#2a2a4a] hover:bg-[#3a3a5a] rounded-lg text-sm transition">
            📤 Export Current Pose
          </button>
        </div>
      </div>
    </div>
  );
}
