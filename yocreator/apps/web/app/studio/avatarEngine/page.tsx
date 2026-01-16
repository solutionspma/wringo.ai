'use client';

import React from 'react';
import { useAvatarStore, MainTab, ModellingTab, GeometriesTab } from './store';
import AvatarCanvas from './components/AvatarCanvas';
import ModellingPanel from './components/ModellingPanel';
import GeometriesPanel from './components/GeometriesPanel';
import MaterialsPanel from './components/MaterialsPanel';
import PosePanel from './components/PosePanel';
import RenderingPanel from './components/RenderingPanel';
import SettingsPanel from './components/SettingsPanel';
import ExportPanel from './components/ExportPanel';

// Main tabs configuration
const mainTabs: { id: MainTab; label: string; icon: string }[] = [
  { id: 'modelling', label: 'Modelling', icon: '🧍' },
  { id: 'geometries', label: 'Geometries', icon: '👕' },
  { id: 'materials', label: 'Materials', icon: '🎨' },
  { id: 'pose', label: 'Pose/Animate', icon: '💃' },
  { id: 'rendering', label: 'Rendering', icon: '📷' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'export', label: 'Export', icon: '📤' },
];

export default function AvatarEnginePage() {
  const { ui, setMainTab, toggleWireframe, toggleSkeleton, setCameraView, avatar, reset, randomize, saveAvatar } = useAvatarStore();

  const renderPanel = () => {
    switch (ui.mainTab) {
      case 'modelling': return <ModellingPanel />;
      case 'geometries': return <GeometriesPanel />;
      case 'materials': return <MaterialsPanel />;
      case 'pose': return <PosePanel />;
      case 'rendering': return <RenderingPanel />;
      case 'settings': return <SettingsPanel />;
      case 'export': return <ExportPanel />;
      default: return <ModellingPanel />;
    }
  };

  return (
    <div className="h-screen w-full bg-[#1a1a2e] text-white flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-12 bg-[#16162a] border-b border-[#2a2a4a] flex items-center px-4 gap-4">
        <h1 className="text-lg font-bold text-cyan-400">YOcreator</h1>
        <span className="text-gray-400">|</span>
        <span className="text-sm text-gray-300">Avatar Engine</span>
        
        <div className="flex-1" />
        
        {/* Quick actions */}
        <button onClick={reset} className="px-3 py-1 text-xs bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded transition">
          Reset
        </button>
        <button onClick={randomize} className="px-3 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded transition">
          Random
        </button>
        <button onClick={saveAvatar} className="px-3 py-1 text-xs bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 rounded transition">
          Save
        </button>
      </div>

      {/* Main Tab Bar */}
      <div className="h-10 bg-[#1e1e3a] border-b border-[#2a2a4a] flex items-center px-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition rounded-t ${
              ui.mainTab === tab.id
                ? 'bg-[#2a2a4a] text-cyan-400 border-t-2 border-cyan-400'
                : 'text-gray-400 hover:text-white hover:bg-[#252545]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-80 bg-[#16162a] border-r border-[#2a2a4a] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {renderPanel()}
          </div>
        </div>

        {/* Center - 3D Viewport */}
        <div className="flex-1 relative bg-gradient-to-b from-[#1a1a2e] to-[#12121f]">
          <AvatarCanvas />
          
          {/* Viewport Controls */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <button
              onClick={toggleWireframe}
              className={`p-2 rounded text-sm ${ui.showWireframe ? 'bg-cyan-500 text-white' : 'bg-[#2a2a4a] text-gray-300'}`}
            >
              Wireframe
            </button>
            <button
              onClick={toggleSkeleton}
              className={`p-2 rounded text-sm ${ui.showSkeleton ? 'bg-cyan-500 text-white' : 'bg-[#2a2a4a] text-gray-300'}`}
            >
              Skeleton
            </button>
          </div>

          {/* Camera Views */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {(['front', 'side', 'back', 'face'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCameraView(view)}
                className={`px-3 py-1 rounded text-sm capitalize ${
                  ui.cameraView === view ? 'bg-cyan-500 text-white' : 'bg-[#2a2a4a] text-gray-300'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Info overlay */}
          <div className="absolute top-4 right-4 bg-[#16162a]/80 backdrop-blur px-3 py-2 rounded text-xs">
            <div className="text-gray-400">Avatar: <span className="text-white">{avatar.name}</span></div>
            <div className="text-gray-400">Gender: <span className="text-white">{avatar.macro.gender > 50 ? 'Male' : 'Female'}</span></div>
            <div className="text-gray-400">Age: <span className="text-white">{Math.round(avatar.macro.age)}</span></div>
          </div>
        </div>

        {/* Right Panel - Preview/Assets */}
        <div className="w-72 bg-[#16162a] border-l border-[#2a2a4a] flex flex-col">
          <div className="p-3 border-b border-[#2a2a4a]">
            <h3 className="text-sm font-semibold text-gray-300">Quick Preview</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {/* Mini previews */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="aspect-square bg-[#2a2a4a] rounded flex items-center justify-center text-4xl">🧍</div>
              <div className="aspect-square bg-[#2a2a4a] rounded flex items-center justify-center text-4xl">👤</div>
            </div>
            
            {/* Current stats */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Muscle</span>
                <span>{avatar.macro.muscle}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Weight</span>
                <span>{avatar.macro.weight}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Height</span>
                <span>{avatar.macro.height}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">African</span>
                <span>{avatar.macro.african}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Asian</span>
                <span>{avatar.macro.asian}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Caucasian</span>
                <span>{avatar.macro.caucasian}%</span>
              </div>
            </div>

            {/* Clothing equipped */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">Equipped</h4>
              <div className="flex flex-wrap gap-1">
                {avatar.clothing.map((c) => (
                  <span key={c} className="px-2 py-1 bg-[#2a2a4a] rounded text-xs">{c}</span>
                ))}
                {avatar.hair && <span className="px-2 py-1 bg-[#2a2a4a] rounded text-xs">{avatar.hair}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #16162a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3a3a5a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4a4a6a;
        }
      `}</style>
    </div>
  );
}
