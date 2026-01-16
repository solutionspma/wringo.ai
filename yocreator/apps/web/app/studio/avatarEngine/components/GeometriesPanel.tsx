'use client';

import React from 'react';
import { useAvatarStore, clothingCatalog, hairCatalog, eyeCatalog, teethCatalog, eyebrowCatalog, eyelashCatalog, GeometriesTab, ClothingItem } from '../store';

// Geometries sub-tabs
const geometriesTabs: { id: GeometriesTab; label: string; icon: string }[] = [
  { id: 'clothes', label: 'Clothes', icon: '👕' },
  { id: 'hair', label: 'Hair', icon: '💇' },
  { id: 'eyes', label: 'Eyes', icon: '👁️' },
  { id: 'teeth', label: 'Teeth', icon: '🦷' },
  { id: 'eyebrows', label: 'Eyebrows', icon: '🤨' },
  { id: 'eyelashes', label: 'Eyelashes', icon: '👁️' },
];

// Item card component (like MakeHuman)
function ItemCard({ 
  item, 
  isSelected, 
  onClick 
}: { 
  item: { id: string; name: string; thumbnail: string }; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center p-2 ${
        isSelected
          ? 'border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-400/20'
          : 'border-[#3a3a5a] bg-[#2a2a4a] hover:border-[#4a4a6a] hover:bg-[#3a3a5a]'
      }`}
    >
      <span className="text-3xl mb-1">{item.thumbnail}</span>
      <span className="text-xs text-gray-300 truncate w-full text-center">{item.name}</span>
    </button>
  );
}

// Clothes panel
function ClothesPanel() {
  const { avatar, toggleClothing } = useAvatarStore();
  
  const categories = ['tops', 'bottoms', 'shoes', 'fullbody', 'accessories'] as const;
  
  return (
    <div className="p-4">
      {categories.map((cat) => {
        const items = clothingCatalog.filter((c) => c.category === cat);
        if (items.length === 0) return null;
        
        return (
          <div key={cat} className="mb-6">
            <h4 className="text-xs font-semibold text-gray-400 mb-3 capitalize">{cat}</h4>
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isSelected={avatar.clothing.includes(item.id)}
                  onClick={() => toggleClothing(item.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Hair panel
function HairPanel() {
  const { avatar, setHair } = useAvatarStore();
  
  return (
    <div className="p-4">
      <h4 className="text-xs font-semibold text-gray-400 mb-3">Hair Styles</h4>
      <div className="grid grid-cols-3 gap-2">
        {hairCatalog.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isSelected={avatar.hair === item.id}
            onClick={() => setHair(avatar.hair === item.id ? null : item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Eyes panel
function EyesPanel() {
  const { faceGeometry, setEyeType } = useAvatarStore();

  return (
    <div className="p-4">
      <h4 className="text-xs font-semibold text-gray-400 mb-3">Eye Types</h4>
      <div className="grid grid-cols-3 gap-2">
        {eyeCatalog.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isSelected={faceGeometry.eyeType === item.id}
            onClick={() => setEyeType(item.id)}
          />
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-[#2a2a4a] rounded-lg text-xs text-gray-400">
        <p>👁️ Eye type affects 3D eye shape on avatar</p>
      </div>
    </div>
  );
}

// Teeth panel
function TeethPanel() {
  const { faceGeometry, setTeeth } = useAvatarStore();

  return (
    <div className="p-4">
      <h4 className="text-xs font-semibold text-gray-400 mb-3">Teeth Types</h4>
      <div className="grid grid-cols-3 gap-2">
        {teethCatalog.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isSelected={faceGeometry.teethType === item.id}
            onClick={() => setTeeth(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Eyebrows panel
function EyebrowsPanel() {
  const { faceGeometry, setEyebrows } = useAvatarStore();

  return (
    <div className="p-4">
      <h4 className="text-xs font-semibold text-gray-400 mb-3">Eyebrow Styles</h4>
      <div className="grid grid-cols-3 gap-2">
        {eyebrowCatalog.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isSelected={faceGeometry.eyebrowType === item.id}
            onClick={() => setEyebrows(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Eyelashes panel
function EyelashesPanel() {
  const { faceGeometry, setEyelashes } = useAvatarStore();

  return (
    <div className="p-4">
      <h4 className="text-xs font-semibold text-gray-400 mb-3">Eyelash Styles</h4>
      <div className="grid grid-cols-3 gap-2">
        {eyelashCatalog.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isSelected={faceGeometry.eyelashType === item.id}
            onClick={() => setEyelashes(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function GeometriesPanel() {
  const { ui, setGeometriesTab } = useAvatarStore();

  const renderContent = () => {
    switch (ui.geometriesTab) {
      case 'clothes': return <ClothesPanel />;
      case 'hair': return <HairPanel />;
      case 'eyes': return <EyesPanel />;
      case 'teeth': return <TeethPanel />;
      case 'eyebrows': return <EyebrowsPanel />;
      case 'eyelashes': return <EyelashesPanel />;
      default: return <ClothesPanel />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-[#2a2a4a] bg-[#1a1a2e]">
        {geometriesTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setGeometriesTab(tab.id)}
            className={`px-2 py-1 text-xs rounded transition flex items-center gap-1 ${
              ui.geometriesTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2a4a]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
}
