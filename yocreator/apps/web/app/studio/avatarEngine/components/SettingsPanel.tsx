'use client';

import React, { useState } from 'react';
import { useAvatarStore } from '../store';

export default function SettingsPanel() {
  const { avatar, setName, savedAvatars, loadAvatar, deleteAvatar, reset } = useAvatarStore();
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [language, setLanguage] = useState('en');

  return (
    <div className="p-4">
      {/* Avatar Info */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>👤</span> Avatar Info
        </h3>
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 block">Name</label>
          <input
            type="text"
            value={avatar.name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-[#2a2a4a] border border-[#3a3a5a] rounded text-sm"
            placeholder="Enter avatar name..."
          />
        </div>
        <div className="text-xs text-gray-400">
          <p>ID: {avatar.id}</p>
        </div>
      </div>

      {/* Saved Avatars */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>💾</span> Saved Avatars ({savedAvatars.length})
        </h3>
        {savedAvatars.length === 0 ? (
          <div className="text-xs text-gray-500 p-3 bg-[#2a2a4a] rounded">
            No saved avatars yet. Click "Save" to save your current avatar.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {savedAvatars.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center justify-between p-2 bg-[#2a2a4a] rounded hover:bg-[#3a3a5a] transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  <div>
                    <div className="text-sm">{saved.name}</div>
                    <div className="text-xs text-gray-500">
                      {saved.macro.gender > 50 ? 'Male' : 'Female'} • Age {Math.round(saved.macro.age)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => loadAvatar(saved.id)}
                    className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteAvatar(saved.id)}
                    className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Display Settings */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>🖥️</span> Display
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Show Grid</span>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`w-12 h-6 rounded-full transition ${showGrid ? 'bg-cyan-500' : 'bg-[#3a3a5a]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition ${showGrid ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Show Axes</span>
            <button
              onClick={() => setShowAxes(!showAxes)}
              className={`w-12 h-6 rounded-full transition ${showAxes ? 'bg-cyan-500' : 'bg-[#3a3a5a]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition ${showAxes ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Auto-Save</span>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`w-12 h-6 rounded-full transition ${autoSave ? 'bg-cyan-500' : 'bg-[#3a3a5a]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition ${autoSave ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Units */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>📏</span> Units
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setUnits('metric')}
            className={`py-2 rounded-lg text-sm transition ${
              units === 'metric'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-[#2a2a4a] text-gray-400 hover:bg-[#3a3a5a]'
            }`}
          >
            Metric (cm, kg)
          </button>
          <button
            onClick={() => setUnits('imperial')}
            className={`py-2 rounded-lg text-sm transition ${
              units === 'imperial'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-[#2a2a4a] text-gray-400 hover:bg-[#3a3a5a]'
            }`}
          >
            Imperial (in, lb)
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>🌐</span> Language
        </h3>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-3 py-2 bg-[#2a2a4a] border border-[#3a3a5a] rounded text-sm"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
        </select>
      </div>

      {/* Danger Zone */}
      <div className="pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
          <span>⚠️</span> Danger Zone
        </h3>
        <button
          onClick={reset}
          className="w-full py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition"
        >
          Reset All Settings
        </button>
      </div>
    </div>
  );
}
