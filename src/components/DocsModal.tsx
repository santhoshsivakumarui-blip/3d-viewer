import React from 'react';
import { TranslationDict } from '../utils/translations';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: TranslationDict;
  isRtl: boolean;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose, t, isRtl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="docs-quick-guide-modal" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-[#1a1a1a] border border-[#444] rounded-sm shadow-2xl w-full max-w-lg overflow-hidden font-mono text-[11px] text-[#d1d1d1]">
        <div className="bg-[#252525] px-3 py-2 border-b border-[#333] flex items-center justify-between">
          <span className="text-white font-bold flex items-center gap-1.5 text-[10px]">
            <span className="bg-blue-600 text-white px-1 py-0.2 rounded-sm text-[8px]">DOC</span>
            {t.docsTitle}
          </span>
          <button 
            onClick={onClose}
            className="text-[#666] hover:text-white transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 space-y-3 leading-relaxed max-h-[400px] overflow-y-auto">
          <div className="space-y-1">
            <div className="text-white font-bold text-[12px] border-b border-[#333] pb-1 flex items-center gap-1 text-blue-400">
              {t.docsSec1Title}
            </div>
            <div className="text-[#888] text-[10px]">
              {t.docsSec1Desc}
            </div>
            <ul className="list-disc pl-4 pr-4 space-y-0.5 text-[10px]">
              <li>{t.docsSec1Item1}</li>
              <li>{t.docsSec1Item2}</li>
            </ul>
          </div>

          <div className="space-y-1 pt-1">
            <div className="text-white font-bold text-[12px] border-b border-[#333] pb-1 flex items-center gap-1 text-blue-400">
              {t.docsSec2Title}
            </div>
            <div className="text-[#888] text-[10px]">
              {t.docsSec2Desc}
            </div>
            <ul className="list-disc pl-4 pr-4 space-y-0.5 text-[10px]">
              <li>{t.docsSec2Item1}</li>
              <li>{t.docsSec2Item2}</li>
              <li>{t.docsSec2Item3}</li>
            </ul>
          </div>

          <div className="space-y-1 pt-1">
            <div className="text-white font-bold text-[12px] border-b border-[#333] pb-1 flex items-center gap-1 text-blue-400">
              {t.docsSec3Title}
            </div>
            <div className="text-[#888] text-[10px]">
              {t.docsSec3Desc}
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="text-white font-bold text-[12px] border-b border-[#333] pb-1 flex items-center gap-1 text-blue-400">
              {t.docsSec4Title}
            </div>
            <div className="text-[#888] text-[10px]">
              {t.docsSec4Desc}
            </div>
          </div>
        </div>

        <div className="bg-[#252525] px-3 py-2 border-t border-[#333] flex justify-end">
          <button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-sm text-[10px] cursor-pointer"
          >
            {t.docsGotIt}
          </button>
        </div>
      </div>
    </div>
  );
};
