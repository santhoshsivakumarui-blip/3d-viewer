import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  RotateCcw, 
  Layers, 
  Sparkles, 
  Clock, 
  FileText, 
  Check, 
  ChevronRight, 
  Database,
  Grid
} from 'lucide-react';

interface SessionRestoreModalProps {
  isOpen: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  savedData: {
    activePresetId: string;
    customFileName: string | null;
    timestamp: number;
    nodesCount?: number;
    materialOverridesCount?: number;
    elementTranslationsCount?: number;
    hiddenElementsCount?: number;
  };
  isRtl?: boolean;
}

export const SessionRestoreModal: React.FC<SessionRestoreModalProps> = ({
  isOpen,
  onRestore,
  onDiscard,
  savedData,
  isRtl = false,
}) => {
  if (!isOpen) return null;

  const dateStr = new Date(savedData.timestamp).toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getPresetLabel = (presetId: string, customName: string | null) => {
    if (presetId === 'custom' && customName) {
      return `Custom File (${customName})`;
    }
    switch (presetId) {
      case 'villa': return 'Modernist Luxury Villa';
      case 'office': return 'Commercial High-Rise Office';
      case 'warehouse': return 'Industrial Logistics Warehouse';
      default: return 'Active BIM Model';
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-[#080808]/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-mono text-left" 
        id="session-restore-modal-overlay"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          className="w-full max-w-lg bg-[#111111] border-2 border-emerald-500/30 rounded-xl overflow-hidden shadow-2xl flex flex-col"
          style={{ boxShadow: '0 0 50px -10px rgba(16, 185, 129, 0.2)' }}
        >
          {/* Header */}
          <div className="bg-[#141414] border-b border-[#2a2a2a] px-5 py-4 flex items-center gap-3">
            <div className="bg-emerald-950/60 text-emerald-400 p-2 rounded border border-emerald-900/40 relative shrink-0">
              <History className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="absolute top-0 right-0 h-1.5 w-1.5 bg-emerald-400 rounded-full"></span>
            </div>
            <div>
              <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                Workspace Recovery Detected
              </h3>
              <p className="text-[10px] text-neutral-500 font-sans">
                A previously autosaved background cache session was successfully recovered
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4 bg-[#121212]">
            <p className="text-[11px] text-[#aaa] leading-relaxed font-sans">
              Archiview has detected an unsaved local snapshot containing active coordinate offsets, customized material textures, and visibility overrides. Would you like to restore this workspace snapshot or start fresh?
            </p>

            {/* Snapshot Details Panel */}
            <div className="bg-[#161616] border border-[#2d2d2d] rounded-lg p-4 space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Database className="w-24 h-24 text-emerald-500" />
              </div>

              {/* Timestamp row */}
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#222]">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] text-neutral-500 block uppercase font-bold tracking-wider">Auto-Save Checkpoint</span>
                  <span className="text-[11px] text-neutral-200 font-mono font-bold truncate block">{dateStr}</span>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                {/* Model item */}
                <div className="space-y-0.5">
                  <span className="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block">Active BIM Model</span>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-[10.5px] text-white font-medium truncate" title={getPresetLabel(savedData.activePresetId, savedData.customFileName)}>
                      {getPresetLabel(savedData.activePresetId, savedData.customFileName)}
                    </span>
                  </div>
                </div>

                {/* Nodes count */}
                <div className="space-y-0.5">
                  <span className="text-[8px] text-neutral-500 uppercase font-bold tracking-wider block">Element Count</span>
                  <div className="flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[10.5px] text-white font-medium">
                      {savedData.nodesCount !== undefined ? savedData.nodesCount : 'Unknown'} elements
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Tweaks checklist */}
              <div className="bg-[#1c1c1c]/60 p-2.5 rounded border border-[#262626] space-y-1.5 mt-2">
                <span className="text-[8px] text-emerald-500 uppercase font-bold tracking-wider block">Cached State Overrides</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[9.5px]">
                  {/* Material Overrides */}
                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Materials: <b className="text-white">{savedData.materialOverridesCount || 0}</b></span>
                  </div>

                  {/* Translations */}
                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Translations: <b className="text-white">{savedData.elementTranslationsCount || 0}</b></span>
                  </div>

                  {/* Hidden Elements */}
                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Hidden: <b className="text-white">{savedData.hiddenElementsCount || 0}</b></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical disclaimer */}
            <div className="text-[8.5px] text-neutral-500 leading-normal flex items-start gap-1.5 font-sans">
              <span className="text-amber-500 font-bold">⚠️</span>
              <span>Discarding this recovery snapshot will permanently flush the local state. Saved system preferences (such as your current visual styles, clipping options, or user annotations) will remain untouched.</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-[#141414] border-t border-[#222] px-5 py-4 flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
            <button
              onClick={onDiscard}
              className="px-4 py-2 text-[10.5px] font-bold text-neutral-400 hover:text-rose-400 bg-[#1e1e1e] hover:bg-rose-950/20 border border-[#2d2d2d] hover:border-rose-900/40 rounded transition cursor-pointer flex items-center justify-center gap-1.5 order-2 sm:order-1"
              id="btn-discard-session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard & Start Fresh</span>
            </button>

            <button
              onClick={onRestore}
              className="px-5 py-2.5 text-[10.5px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition cursor-pointer flex items-center justify-center gap-1.5 order-1 sm:order-2 shadow-lg hover:shadow-emerald-950/50"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              id="btn-restore-session"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
              <span>Restore Last Session</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
