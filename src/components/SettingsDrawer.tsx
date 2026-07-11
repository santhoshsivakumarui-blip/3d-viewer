import React from 'react';
import { Settings, X, Layers, Sun } from 'lucide-react';
import { TranslationDict } from '../utils/translations';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clippingX: number;
  setClippingX: (v: number) => void;
  clippingY: number;
  setClippingY: (v: number) => void;
  clippingZ: number;
  setClippingZ: (v: number) => void;
  sunAzimuth: number;
  setSunAzimuth: (v: number) => void;
  sunElevation: number;
  setSunElevation: (v: number) => void;
  shadowIntensity: number;
  setShadowIntensity: (v: number) => void;
  t: TranslationDict;
  isRtl: boolean;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  clippingX,
  setClippingX,
  clippingY,
  setClippingY,
  clippingZ,
  setClippingZ,
  sunAzimuth,
  setSunAzimuth,
  sunElevation,
  setSunElevation,
  shadowIntensity,
  setShadowIntensity,
  t,
  isRtl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-2 left-2 bg-[#1a1a1a] border border-[#333] p-3 z-20 w-72 shadow-2xl space-y-3 text-[10px] animate-fade-in" id="settings-drawer-slider-card" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between border-b border-[#333] pb-1.5">
        <span className="font-mono text-[9px] uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1">
          <Settings className="w-3 h-3 text-blue-400" /> {t.slicingAndLights}
        </span>
        <button onClick={onClose} className="text-[#666] hover:text-white cursor-pointer">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Cross-section slice clipping sliders */}
      <div className="space-y-2.5" id="sliders-slicing-group">
        <div className="font-bold text-[9px] font-mono text-[#666] uppercase tracking-wider flex items-center gap-1">
          <Layers className="w-2.5 h-2.5 text-blue-400" /> {t.crossSectionClipping}
        </div>
        
        {/* Clipping X */}
        <div className="space-y-0.5">
          <div className="flex justify-between font-mono text-[9px] text-[#888]">
            <span>{t.xAxisCut}</span>
            <span className="text-blue-400 font-bold">{clippingX === 100 ? t.off : `${clippingX} m`}</span>
          </div>
          <input
            type="range"
            min="-15"
            max="15"
            value={clippingX === 100 ? 15 : clippingX}
            onChange={(e) => setClippingX(parseFloat(e.target.value))}
            className="w-full accent-blue-500 bg-[#252525]"
          />
          <div className="flex justify-between">
            <button onClick={() => setClippingX(100)} className="text-[8px] text-[#555] hover:text-blue-400 font-mono">{t.disableCut}</button>
          </div>
        </div>

        {/* Clipping Y */}
        <div className="space-y-0.5">
          <div className="flex justify-between font-mono text-[9px] text-[#888]">
            <span>{t.yAxisHeightCut}</span>
            <span className="text-blue-400 font-bold">{clippingY === 100 ? t.off : `${clippingY} m`}</span>
          </div>
          <input
            type="range"
            min="0"
            max="18"
            value={clippingY === 100 ? 18 : clippingY}
            onChange={(e) => setClippingY(parseFloat(e.target.value))}
            className="w-full accent-blue-500 bg-[#252525]"
          />
          <div className="flex justify-between">
            <button onClick={() => setClippingY(100)} className="text-[8px] text-[#555] hover:text-blue-400 font-mono">{t.disableCut}</button>
          </div>
        </div>

        {/* Clipping Z */}
        <div className="space-y-0.5">
          <div className="flex justify-between font-mono text-[9px] text-[#888]">
            <span>{t.zAxisCut}</span>
            <span className="text-blue-400 font-bold">{clippingZ === 100 ? t.off : `${clippingZ} m`}</span>
          </div>
          <input
            type="range"
            min="-15"
            max="15"
            value={clippingZ === 100 ? 15 : clippingZ}
            onChange={(e) => setClippingZ(parseFloat(e.target.value))}
            className="w-full accent-blue-500 bg-[#252525]"
          />
          <div className="flex justify-between">
            <button onClick={() => setClippingZ(100)} className="text-[8px] text-[#555] hover:text-blue-400 font-mono">{t.disableCut}</button>
          </div>
        </div>
      </div>

      {/* Solar light and Shadows coord adjustments */}
      <div className="space-y-2.5 pt-2 border-t border-[#333]" id="sliders-sunlight-group">
        <div className="font-bold text-[9px] font-mono text-[#666] uppercase tracking-wider flex items-center gap-1">
          <Sun className="w-2.5 h-2.5 text-blue-400" /> {t.sunShadowCoords}
        </div>

        {/* Solar azimuth slider */}
        <div className="space-y-0.5">
          <div className="flex justify-between font-mono text-[9px] text-[#888]">
            <span>{t.azimuthAngle}</span>
            <span className="text-blue-400 font-bold">{sunAzimuth}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={sunAzimuth}
            onChange={(e) => setSunAzimuth(parseInt(e.target.value))}
            className="w-full accent-blue-500 bg-[#252525]"
          />
        </div>

        {/* Solar height slider */}
        <div className="space-y-0.5">
          <div className="flex justify-between font-mono text-[9px] text-[#888]">
            <span>{t.elevationAngle}</span>
            <span className="text-blue-400 font-bold">{sunElevation}°</span>
          </div>
          <input
            type="range"
            min="15"
            max="90"
            value={sunElevation}
            onChange={(e) => setSunElevation(parseInt(e.target.value))}
            className="w-full accent-blue-500 bg-[#252525]"
          />
        </div>

        {/* Shadows density */}
        <div className="space-y-0.5">
          <div className="flex justify-between font-mono text-[9px] text-[#888]">
            <span>{t.shadowIntensity}</span>
            <span className="text-blue-400 font-bold">{(shadowIntensity * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={shadowIntensity}
            onChange={(e) => setShadowIntensity(parseFloat(e.target.value))}
            className="w-full accent-blue-500 bg-[#252525]"
          />
        </div>
      </div>
    </div>
  );
};
