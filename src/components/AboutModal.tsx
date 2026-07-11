import React from 'react';
import { TranslationDict } from '../utils/translations';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelName: string;
  activeSchemaVersion: string;
  nodesCount: number;
  visualStyle: string;
  navMode: string;
  measurementsCount: number;
  sunAzimuth: number;
  sunElevation: number;
  t: TranslationDict;
  isRtl: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  activeModelName,
  activeSchemaVersion,
  nodesCount,
  visualStyle,
  navMode,
  measurementsCount,
  sunAzimuth,
  sunElevation,
  t,
  isRtl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="about-diagnostics-modal" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-[#1a1a1a] border border-[#444] rounded-sm shadow-2xl w-full max-w-md overflow-hidden font-mono text-[11px] text-[#d1d1d1]">
        <div className="bg-[#252525] px-3 py-2 border-b border-[#333] flex items-center justify-between">
          <span className="text-white font-bold flex items-center gap-1.5 text-[10px]">
            <span className="bg-blue-600 text-white px-1 py-0.2 rounded-sm text-[8px]">SYS</span>
            {t.aboutTitle}
          </span>
          <button 
            onClick={onClose}
            className="text-[#666] hover:text-white transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 space-y-3 leading-relaxed">
          <div className="border-b border-[#333] pb-2 space-y-1">
            <div className="text-white font-bold">{t.aboutSub}</div>
            <div className="text-[#888] text-[10px]">Version 24.1.0-Release-Build (Web-Native)</div>
            <div className="text-[#888] text-[10px]">{t.aboutEngine}</div>
          </div>

          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-[#666]">{t.aboutProj}:</span>
              <span className="text-blue-400 font-bold">{activeModelName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">{t.aboutSchema}:</span>
              <span className="text-white">{activeSchemaVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">{t.aboutNodes}:</span>
              <span className="text-white font-bold">{nodesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">{t.aboutShading}:</span>
              <span className="text-white capitalize">{visualStyle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">{t.aboutNavigator}:</span>
              <span className="text-white capitalize">{navMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">{t.aboutLogs}:</span>
              <span className="text-rose-400 font-bold">{measurementsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">{t.aboutAzimuth}:</span>
              <span className="text-white">{sunAzimuth}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">{t.aboutElevation}:</span>
              <span className="text-white">{sunElevation}°</span>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#222] p-2 text-[9px] text-[#888] rounded-sm space-y-1">
            <div>{t.aboutCheckedBg1}</div>
            <div>{t.aboutCheckedBg2}</div>
            <div>{t.aboutCheckedBg3}</div>
          </div>
        </div>

        <div className="bg-[#252525] px-3 py-2 border-t border-[#333] flex justify-end">
          <button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-sm text-[10px] cursor-pointer"
          >
            {t.aboutClose}
          </button>
        </div>
      </div>
    </div>
  );
};
