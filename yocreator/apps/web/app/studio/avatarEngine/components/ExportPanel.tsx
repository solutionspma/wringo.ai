'use client';

import React, { useState, useCallback } from 'react';
import { useAvatarStore, getSceneRef } from '../store';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';

// Export formats
const exportFormats = [
  { id: 'glb', name: 'GLB', desc: 'GLTF Binary - Best for web & Unity', icon: '🌐' },
  { id: 'gltf', name: 'GLTF', desc: 'GL Transmission Format - JSON', icon: '📄' },
  { id: 'obj', name: 'OBJ', desc: 'Wavefront OBJ - Universal mesh format', icon: '📐' },
  { id: 'json', name: 'JSON', desc: 'Avatar data - Reload later', icon: '💾' },
  { id: 'png', name: 'PNG', desc: 'Screenshot - Current view', icon: '📸' },
];

// Export options
const exportOptions = [
  { id: 'mesh', label: 'Include Mesh', default: true },
  { id: 'clothing', label: 'Include Clothing', default: true },
  { id: 'hair', label: 'Include Hair', default: true },
  { id: 'pose', label: 'Apply Current Pose', default: true },
  { id: 'scale', label: 'Scale to Real World Units', default: true },
];

export default function ExportPanel() {
  const { avatar } = useAvatarStore();
  const [selectedFormat, setSelectedFormat] = useState('glb');
  const [options, setOptions] = useState(
    exportOptions.reduce((acc, opt) => ({ ...acc, [opt.id]: opt.default }), {} as Record<string, boolean>)
  );
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const toggleOption = (id: string) => {
    setOptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Download helper
  const downloadFile = (data: Blob | string, filename: string) => {
    const url = typeof data === 'string' ? data : URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof data !== 'string') URL.revokeObjectURL(url);
  };

  // Export GLB/GLTF
  const exportGLTF = useCallback(async (binary: boolean) => {
    const scene = getSceneRef();
    if (!scene) {
      setExportStatus('❌ Scene not ready');
      return;
    }
    
    const exporter = new GLTFExporter();
    const options = { binary, trs: true };
    
    return new Promise<void>((resolve) => {
      exporter.parse(
        scene,
        (result) => {
          if (binary) {
            const blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' });
            downloadFile(blob, `${avatar.name || 'avatar'}.glb`);
          } else {
            const json = JSON.stringify(result, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            downloadFile(blob, `${avatar.name || 'avatar'}.gltf`);
          }
          resolve();
        },
        (error) => {
          console.error('GLTF export error:', error);
          setExportStatus('❌ Export failed');
          resolve();
        },
        options
      );
    });
  }, [avatar.name]);

  // Export OBJ
  const exportOBJ = useCallback(async () => {
    const scene = getSceneRef();
    if (!scene) {
      setExportStatus('❌ Scene not ready');
      return;
    }
    
    const exporter = new OBJExporter();
    const result = exporter.parse(scene);
    const blob = new Blob([result], { type: 'text/plain' });
    downloadFile(blob, `${avatar.name || 'avatar'}.obj`);
  }, [avatar.name]);

  // Export JSON (avatar data)
  const exportJSON = useCallback(() => {
    const data = JSON.stringify(avatar, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    downloadFile(blob, `${avatar.name || 'avatar'}.json`);
  }, [avatar]);

  // Export PNG screenshot
  const exportPNG = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      setExportStatus('❌ Canvas not found');
      return;
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, `${avatar.name || 'avatar'}.png`);
      }
    }, 'image/png');
  }, [avatar.name]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('Preparing export...');
    
    try {
      switch (selectedFormat) {
        case 'glb':
          await exportGLTF(true);
          break;
        case 'gltf':
          await exportGLTF(false);
          break;
        case 'obj':
          await exportOBJ();
          break;
        case 'json':
          exportJSON();
          break;
        case 'png':
          exportPNG();
          break;
        default:
          setExportStatus('❌ Unsupported format');
      }
      
      setExportStatus(`✅ Exported as ${selectedFormat.toUpperCase()}`);
    } catch (err) {
      console.error('Export error:', err);
      setExportStatus('❌ Export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  // Copy avatar JSON to clipboard
  const copyJSON = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(avatar, null, 2));
      setExportStatus('✅ Copied to clipboard');
      setTimeout(() => setExportStatus(null), 2000);
    } catch {
      setExportStatus('❌ Failed to copy');
    }
  }, [avatar]);

  return (
    <div className="p-4">
      {/* Format Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>📦</span> Export Format
        </h3>
        <div className="space-y-2">
          {exportFormats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 text-left ${
                selectedFormat === fmt.id
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-[#3a3a5a] bg-[#2a2a4a] hover:border-[#4a4a6a]'
              }`}
            >
              <span className="text-2xl">{fmt.icon}</span>
              <div>
                <div className="font-medium text-sm">{fmt.name}</div>
                <div className="text-xs text-gray-400">{fmt.desc}</div>
              </div>
              {selectedFormat === fmt.id && (
                <span className="ml-auto text-cyan-400">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>⚙️</span> Options
        </h3>
        <div className="space-y-2">
          {exportOptions.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center justify-between p-2 bg-[#2a2a4a] rounded hover:bg-[#3a3a5a] cursor-pointer transition"
              onClick={() => toggleOption(opt.id)}
            >
              <span className="text-sm text-gray-300">{opt.label}</span>
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                  options[opt.id]
                    ? 'bg-cyan-500 border-cyan-500'
                    : 'border-[#4a4a6a]'
                }`}
              >
                {options[opt.id] && <span className="text-xs">✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>📏</span> Scale
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0.01}
            max={10}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1 h-2 bg-[#2a2a4a] rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <input
            type="number"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-20 px-2 py-1 bg-[#2a2a4a] border border-[#3a3a5a] rounded text-sm text-center"
            min={0.01}
            step={0.01}
          />
        </div>
        <div className="text-xs text-gray-400 mt-2">
          1.0 = Original MakeHuman units (decimeters)
        </div>
      </div>

      {/* Preview */}
      <div className="mb-6 pt-4 border-t border-[#2a2a4a]">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span>📋</span> Export Summary
        </h3>
        <div className="bg-[#2a2a4a] rounded-lg p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Avatar Name</span>
            <span>{avatar.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Format</span>
            <span className="uppercase">{selectedFormat}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Estimated Size</span>
            <span>~2.4 MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Polygons</span>
            <span>~15,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Textures</span>
            <span>3 × 2K</span>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`w-full py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 ${
          isExporting
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400'
        }`}
      >
        {isExporting ? (
          <>
            <span className="animate-spin">⏳</span>
            Exporting...
          </>
        ) : (
          <>
            <span>📤</span>
            Export Avatar
          </>
        )}
      </button>

      {/* Export Status */}
      {exportStatus && (
        <div className="mt-3 p-2 bg-[#2a2a4a] rounded-lg text-center text-sm">
          {exportStatus}
        </div>
      )}

      {/* Quick Export Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button 
          onClick={copyJSON}
          className="py-2 bg-[#2a2a4a] hover:bg-[#3a3a5a] rounded-lg text-sm transition"
        >
          📋 Copy JSON
        </button>
        <button 
          onClick={exportPNG}
          className="py-2 bg-[#2a2a4a] hover:bg-[#3a3a5a] rounded-lg text-sm transition"
        >
          📸 Screenshot
        </button>
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
