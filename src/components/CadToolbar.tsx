import React from 'react';
import { VisualStyle, NavMode } from '../types';
import { Settings, Ruler, RefreshCw } from 'lucide-react';
import { TranslationDict } from '../utils/translations';

interface CadToolbarProps {
  visualStyle: VisualStyle;
  setVisualStyle: (v: VisualStyle) => void;
  navMode: NavMode;
  setNavMode: (m: NavMode) => void;
  showSettingsDrawer: boolean;
  setShowSettingsDrawer: (b: boolean) => void;
  measureMode: boolean;
  setMeasureMode: (b: boolean) => void;
  onResetToDefault: () => void;
  t: TranslationDict;
  isRtl: boolean;
}

export const CadToolbar: React.FC<CadToolbarProps> = ({
  visualStyle,
  setVisualStyle,
  navMode,
  setNavMode,
  showSettingsDrawer,
  setShowSettingsDrawer,
  measureMode,
  setMeasureMode,
  onResetToDefault,
  t,
  isRtl,
}) => {
  return (
    <header className="h-12 bg-[#252525] border-b border-black px-3 flex items-center justify-between shrink-0 relative z-10 font-mono" id="cad-toolbar-ribbon" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-4" id="ribbon-tools-container">
        
        {/* Shading Visual Styles */}
        <div className="flex items-center gap-1.5" id="ribbon-shading-group">
          <span className="text-[9px] text-[#666] uppercase font-bold tracking-wider">{t.visualStyle}</span>
          <div className="flex bg-[#1a1a1a] border border-[#333] p-0.5 rounded-sm">
            {(['realistic', 'conceptual', 'wireframe', 'xray', 'hiddenLine'] as VisualStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => setVisualStyle(style)}
                className={`text-[9px] px-2 py-0.5 transition rounded-sm ${
                  visualStyle === style 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'text-[#888] hover:text-white hover:bg-[#2a2a2a] cursor-pointer'
                }`}
                id={`btn-style-${style}`}
              >
                {style === 'hiddenLine' ? t.menuStyleSketch.split(':').pop()?.trim() || 'SKETCH' : style.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="h-5 w-[1px] bg-[#333]" />

        {/* Camera Nav modes */}
        <div className="flex items-center gap-1.5" id="ribbon-nav-group">
          <span className="text-[9px] text-[#666] uppercase font-bold tracking-wider">{t.camera}</span>
          <div className="flex bg-[#1a1a1a] border border-[#333] p-0.5 rounded-sm">
            {(['orbit', 'walkthrough'] as NavMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setNavMode(mode)}
                className={`text-[9px] px-2 py-0.5 transition rounded-sm ${
                  navMode === mode 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'text-[#888] hover:text-white hover:bg-[#2a2a2a] cursor-pointer'
                }`}
                id={`btn-nav-mode-${mode}`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Controls Buttons */}
      <div className="flex items-center gap-2" id="ribbon-controls-group">
        {/* Setups (Clipping/Light coords drawer) */}
        <button
          onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
          className={`flex items-center gap-1 px-2.5 py-1 border text-[10px] transition rounded-sm cursor-pointer ${
            showSettingsDrawer 
              ? 'bg-blue-950 border-blue-500 text-blue-400 font-bold' 
              : 'bg-[#1a1a1a] border-[#333] text-[#d1d1d1] hover:border-[#555]'
          }`}
          id="btn-toggle-drawer"
          title={t.slicingAndLights}
        >
          <Settings className="w-3 h-3 text-blue-400" /> {t.setups}
        </button>

        {/* Interactive Ruler tool */}
        <button
          onClick={() => setMeasureMode(!measureMode)}
          className={`flex items-center gap-1 px-2.5 py-1 border text-[10px] transition rounded-sm cursor-pointer ${
            measureMode 
              ? 'bg-rose-950 border-rose-500 text-rose-400 font-bold' 
              : 'bg-[#1a1a1a] border-[#333] text-[#d1d1d1] hover:border-[#555]'
          }`}
          id="btn-toggle-measure"
          title={t.ruler}
        >
          <Ruler className="w-3 h-3 text-rose-400" /> {t.ruler}: {measureMode ? t.rulerOn : t.rulerOff}
        </button>

        {/* Reset to Default */}
        <button
          onClick={onResetToDefault}
          className="flex items-center gap-1 px-2.5 py-1 border border-[#333] hover:border-amber-500/50 hover:bg-amber-950/20 text-amber-400 text-[10px] transition rounded-sm cursor-pointer bg-[#1a1a1a]"
          id="btn-reset-default"
          title={t.menuReset}
        >
          <RefreshCw className="w-3 h-3 text-amber-400" /> {t.resetDefault}
        </button>
      </div>
    </header>
  );
};
