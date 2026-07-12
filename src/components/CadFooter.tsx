import React from 'react';
import { TranslationDict } from '../utils/translations';

interface CadFooterProps {
  footerCoords: { x: number; y: number; z: number };
  cadClock: string;
  t: TranslationDict;
  isRtl: boolean;
  autoSaveStatus: 'idle' | 'saving' | 'saved';
  lastAutoSaveTime: string;
}

export const CadFooter: React.FC<CadFooterProps> = ({ 
  footerCoords, 
  cadClock, 
  t, 
  isRtl,
  autoSaveStatus,
  lastAutoSaveTime
}) => {
  return (
    <footer className="h-8 bg-[#1a1a1a] border-t border-[#333] px-3 flex items-center justify-between shrink-0 font-mono text-[10px] text-[#666]" id="cad-footer-status-bar" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Left Section: Pulsing status + coordinates + auto-save */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-emerald-950"></span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider text-[9px]">{t.statusReady}</span>
        </div>

        <div className="h-4 w-[1px] bg-[#333]" />

        {/* Auto-save background task status indicator */}
        <div className="flex items-center gap-1.5 text-[8.5px] font-bold" id="auto-save-hud-indicator">
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-cyan-400 uppercase animate-pulse">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>AUTO-SAVING...</span>
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-400 uppercase">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>AUTO-SAVED {lastAutoSaveTime}</span>
            </span>
          )}
          {autoSaveStatus === 'idle' && (
            <span className="flex items-center gap-1 text-neutral-600 uppercase font-medium">
              <span className="inline-block w-1 h-1 rounded-full bg-neutral-600"></span>
              <span>AUTO-SAVE ACTIVE</span>
            </span>
          )}
        </div>
        
        <div className="h-4 w-[1px] bg-[#333] hidden md:block" />
        
        <div className="flex items-center gap-2 text-[#d1d1d1]" id="footer-coordinates">
          <span className="text-blue-500">X:</span> <span className="text-white select-all">{footerCoords.x}</span>
          <span className="text-blue-500">Y:</span> <span className="text-white select-all">{footerCoords.y}</span>
          <span className="text-blue-500">Z:</span> <span className="text-white select-all">{footerCoords.z}</span>
        </div>
      </div>

      {/* Right Section: Badges & Clock */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <span className="bg-[#252525] border border-[#333] px-1.5 py-0.2 rounded-sm text-blue-400 font-bold text-[8px]" id="grid-status-badge">{t.gridOn}</span>
          <span className="bg-[#252525] border border-[#333] px-1.5 py-0.2 rounded-sm text-[#888] text-[8px]" id="snap-status-badge">{t.snap10mm}</span>
          <span className="bg-[#252525] border border-[#333] px-1.5 py-0.2 rounded-sm text-[#888] text-[8px]" id="ortho-status-badge">{t.ortho}</span>
          <span className="bg-[#252525] border border-[#333] px-1.5 py-0.2 rounded-sm text-[#d1d1d1] font-bold text-[8px]" id="unit-status-badge">{t.metric}</span>
        </div>
        
        <div className="h-4 w-[1px] bg-[#333] hidden sm:block" />

        <div className="text-blue-400 font-bold text-[9px]" id="dynamic-clock-display">
          {cadClock}
        </div>
      </div>
    </footer>
  );
};
