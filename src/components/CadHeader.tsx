import React, { useState, useEffect } from 'react';
import { VisualStyle, NavMode, BimElement, Measurement } from '../types';
import { 
  Building2, 
  Search, 
  History, 
  Clock,
  Globe,
  Tv
} from 'lucide-react';
import { Language, languagesList, TranslationDict } from '../utils/translations';

interface CadHeaderProps {
  activeModelName: string;
  selectedElementId: string | null;
  hierarchy: BimElement;
  onSelectPreset: (presetId: string) => void;
  onFileUpload: (content: string, name: string) => void;
  onExportCSV: () => void;
  onExportSingleCSV: (el: BimElement) => void;
  onResetToDefault: () => void;
  setVisualStyle: (style: VisualStyle) => void;
  setNavMode: (mode: NavMode) => void;
  setMeasureMode: (b: boolean) => void;
  setMeasurements: (m: Measurement[]) => void;
  setShowSettingsDrawer: (b: boolean) => void;
  setSunElevation: (v: number) => void;
  setSunAzimuth: (v: number) => void;
  setShadowIntensity: (v: number) => void;
  setShowDocsModal: (b: boolean) => void;
  setShowAboutModal: (b: boolean) => void;
  setShowLearningHubModal: (b: boolean) => void;
  setShowElectronModal?: (b: boolean) => void;
  setShowWasmLabModal?: (b: boolean) => void;
  setShowPerformanceMonitor?: (b: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDict;
  isRtl: boolean;
}

export const CadHeader: React.FC<CadHeaderProps> = ({
  activeModelName,
  selectedElementId,
  hierarchy,
  onSelectPreset,
  onFileUpload,
  onExportCSV,
  onExportSingleCSV,
  onResetToDefault,
  setVisualStyle,
  setNavMode,
  setMeasureMode,
  setMeasurements,
  setShowSettingsDrawer,
  setSunElevation,
  setSunAzimuth,
  setShadowIntensity,
  setShowDocsModal,
  setShowAboutModal,
  setShowLearningHubModal,
  setShowElectronModal,
  setShowWasmLabModal,
  setShowPerformanceMonitor,
  language,
  setLanguage,
  t,
  isRtl,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Command Search and Execution History States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cad_search_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Synchronize search history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cad_search_history', JSON.stringify(searchHistory));
    } catch (err) {
      console.error(err);
    }
  }, [searchHistory]);

  // Command palette focus handler (Ctrl+K or Cmd+K) and Escape to close
  useEffect(() => {
    const handleCmdK = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-box-input');
        if (searchInput) {
          (searchInput as HTMLInputElement).focus();
          setSearchFocused(true);
        }
      } else if (e.key === 'Escape') {
        const searchInput = document.getElementById('search-box-input');
        if (searchInput) {
          (searchInput as HTMLInputElement).blur();
        }
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleCmdK);
    return () => window.removeEventListener('keydown', handleCmdK);
  }, []);

  // Global click handler to close active dropdown menu & search box dropdown on outside clicks
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#menu-dropdown-triggers') && !target.closest('.menu-dropdown-list')) {
        setActiveDropdown(null);
      }
      if (!target.closest('#commands-search-box')) {
        setSearchFocused(false);
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  // Find node by ID helper
  const findNodeById = (node: BimElement, id: string): BimElement | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Real-time executable CAD command palette definitions
  const availableCommands = [
    {
      id: 'visual-realistic',
      name: t.menuStyleRealistic,
      category: t.visualStyle,
      description: 'Switch visual shading style to realistic render',
      keywords: ['realistic', 'render', 'style', 'shading'],
      action: () => setVisualStyle('realistic')
    },
    {
      id: 'visual-conceptual',
      name: t.menuStyleConceptual,
      category: t.visualStyle,
      description: 'Switch visual style to conceptual colors',
      keywords: ['conceptual', 'color', 'style', 'shading'],
      action: () => setVisualStyle('conceptual')
    },
    {
      id: 'visual-wireframe',
      name: t.menuStyleWireframe,
      category: t.visualStyle,
      description: 'Switch style to wireframe outline',
      keywords: ['wireframe', 'outline', 'mesh', 'style'],
      action: () => setVisualStyle('wireframe')
    },
    {
      id: 'visual-xray',
      name: t.menuStyleXray,
      category: t.visualStyle,
      description: 'Switch style to translucent X-Ray',
      keywords: ['xray', 'x-ray', 'translucent', 'style'],
      action: () => setVisualStyle('xray')
    },
    {
      id: 'visual-sketch',
      name: t.menuStyleSketch,
      category: t.visualStyle,
      description: 'Switch style to hand-drawn sketch lines',
      keywords: ['sketch', 'hiddenline', 'drawing', 'style'],
      action: () => setVisualStyle('hiddenLine')
    },
    {
      id: 'camera-orbit',
      name: t.menuNavOrbit,
      category: t.camera,
      description: 'Switch navigation mode to orbit rotation',
      keywords: ['orbit', 'rotation', 'navigation', 'camera'],
      action: () => setNavMode('orbit')
    },
    {
      id: 'camera-walkthrough',
      name: t.menuNavWalkthrough,
      category: t.camera,
      description: 'Switch navigation mode to walkthrough controls',
      keywords: ['walkthrough', 'first person', 'navigation', 'camera'],
      action: () => setNavMode('walkthrough')
    },
    {
      id: 'ruler-enable',
      name: `${t.ruler}: ${t.rulerOn}`,
      category: t.ruler,
      description: 'Activate coordinate distance measurement ruler',
      keywords: ['ruler', 'measure', 'enable', 'distance', 'coordinate'],
      action: () => setMeasureMode(true)
    },
    {
      id: 'ruler-disable',
      name: `${t.ruler}: ${t.rulerOff}`,
      category: t.ruler,
      description: 'Deactivate coordinate distance measurement ruler',
      keywords: ['ruler', 'measure', 'disable', 'off'],
      action: () => setMeasureMode(false)
    },
    {
      id: 'ruler-clear',
      name: `${t.ruler}: ${t.clear}`,
      category: t.ruler,
      description: 'Clear all active measured points',
      keywords: ['ruler', 'clear', 'reset measurements', 'delete points'],
      action: () => setMeasurements([])
    },
    {
      id: 'export-properties',
      name: t.menuExportCsv,
      category: 'Export',
      description: 'Download flat list of all BIM elements and properties to Excel CSV',
      keywords: ['export', 'excel', 'csv', 'properties', 'download', 'save'],
      action: onExportCSV
    },
    {
      id: 'reset-default',
      name: t.menuReset,
      category: 'System',
      description: 'Reset all active overrides, filters, styles, and values to initial default',
      keywords: ['reset', 'default', 'restore', 'restart'],
      action: onResetToDefault
    },
    {
      id: 'load-villa',
      name: t.menuLoadVilla,
      category: 'Model Preset',
      description: 'Load default architectural villa model dataset',
      keywords: ['villa', 'residential', 'load preset'],
      action: () => onSelectPreset('villa')
    },
    {
      id: 'load-office',
      name: t.menuLoadOffice,
      category: 'Model Preset',
      description: 'Load industrial office structural model dataset',
      keywords: ['office', 'commercial', 'load preset'],
      action: () => onSelectPreset('office')
    },
    {
      id: 'audit-ai',
      name: t.menuStructuralAudit,
      category: 'Analysis',
      description: 'Execute a context-aware structural safety audit via Gemini API',
      keywords: ['audit', 'ai', 'safety', 'inspect', 'gemini'],
      action: () => {
        if (selectedElementId) {
          const matchedEl = findNodeById(hierarchy, selectedElementId);
          if (matchedEl) {
            window.dispatchEvent(new CustomEvent('archi-ai-prompt', {
              detail: { prompt: `Perform a detailed structural, load-bearing, and safety audit on the selected element: name "${matchedEl.name}" of type "${matchedEl.type}" with id "${matchedEl.id}". What standard guidelines apply here?` }
            }));
            return;
          }
        }
        window.dispatchEvent(new CustomEvent('archi-ai-prompt', {
          detail: { prompt: `Perform a structural engineering overview and safety audit of the active model: "${activeModelName}".` }
        }));
      }
    },
    {
      id: 'simulate-sun',
      name: t.menuSolarStudy,
      category: 'Analysis',
      description: 'Simulate high intensity solar path on active 3D model',
      keywords: ['sun', 'study', 'shading', 'solar', 'light', 'simulate'],
      action: () => {
        setSunElevation(35);
        setSunAzimuth(120);
        setShadowIntensity(0.85);
        setShowSettingsDrawer(true);
        window.dispatchEvent(new CustomEvent('archi-ai-prompt', {
          detail: { prompt: `How does solar azimuth and light elevation angle affect structural shading design and heating/cooling loads for a model like "${activeModelName}"?` }
        }));
      }
    },
    {
      id: 'open-settings',
      name: t.menuToggleSettings,
      category: 'System',
      description: 'Open visual and environmental adjustments sidebar',
      keywords: ['settings', 'drawer', 'sun', 'clipping', 'shadows'],
      action: () => setShowSettingsDrawer(true)
    },
    {
      id: 'open-guide',
      name: t.menuOpenGuide,
      category: 'Help',
      description: 'Open tutorial instructions and CAD reference documentation',
      keywords: ['guide', 'help', 'tutorial', 'documentation', 'manual'],
      action: () => setShowDocsModal(true)
    },
    {
      id: 'open-learning',
      name: '🎬 Training & Video Center',
      category: 'Help',
      description: 'Open simulated videos, interactive walkthroughs, and learning certifications',
      keywords: ['video', 'learning', 'training', 'demo', 'tutorial', 'quiz', 'certify'],
      action: () => setShowLearningHubModal(true)
    },
    {
      id: 'open-electron',
      name: '🖥️ Desktop App Mode (Electron)',
      category: 'System',
      description: 'Open native packaging guide, command lines, and diagnostic monitor telemetry',
      keywords: ['electron', 'desktop', 'app', 'package', 'offline', 'exe', 'applet'],
      action: () => setShowElectronModal && setShowElectronModal(true)
    },
    {
      id: 'open-wasmlab',
      name: '⚡ WebAssembly Performance Lab',
      category: 'System',
      description: 'Run native collision performance benchmarks and view Rust/C++ compilation pipelines',
      keywords: ['wasm', 'webassembly', 'performance', 'benchmark', 'speed', 'rust', 'c++'],
      action: () => setShowWasmLabModal && setShowWasmLabModal(true)
    },
    {
      id: 'open-perfmonitor',
      name: '📊 Engine Performance Monitor',
      category: 'System',
      description: 'Calculate rendering frame rate, measure parsing time, and view real-time Wasm vs JS comparison graph',
      keywords: ['fps', 'framerate', 'monitor', 'diagnostics', 'telemetry', 'benchmark', 'graph', 'wasm', 'javascript'],
      action: () => setShowPerformanceMonitor && setShowPerformanceMonitor(true)
    },
    {
      id: 'open-about',
      name: t.menuDiagnostics,
      category: 'Help',
      description: 'Show version and license details of the application',
      keywords: ['about', 'version', 'license', 'archi-view'],
      action: () => setShowAboutModal(true)
    }
  ];

  // Executes a CAD command, logs it into the search history stack
  const executeCommand = (command: any) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter(item => item !== command.name);
      return [command.name, ...filtered].slice(0, 5);
    });
    
    command.action();
    setSearchQuery('');
    setSearchFocused(false);
  };

  // Submits the typed search box command, running the first keyword match
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase().trim();
    const match = availableCommands.find(cmd => 
      cmd.name.toLowerCase().includes(query) || 
      cmd.category.toLowerCase().includes(query) ||
      cmd.keywords.some(k => k.toLowerCase().includes(query))
    );

    if (match) {
      executeCommand(match);
    }
  };

  // Filter commands as user types
  const filteredCommands = searchQuery.trim() === ''
    ? []
    : availableCommands.filter(cmd => 
        cmd.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) || 
        cmd.category.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        cmd.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase().trim()))
      );

  const menuOptions = [
    {
      name: t.menuFile,
      items: [
        {
          label: t.menuImport,
          action: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.ifc,.step,.stp';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                  if (evt.target?.result) {
                    onFileUpload(evt.target.result as string, file.name);
                  }
                };
                reader.readAsText(file);
              }
            };
            input.click();
          }
        },
        { label: t.menuExportCsv, action: onExportCSV },
        { label: t.menuReset, action: onResetToDefault },
        { label: t.menuLoadVilla, action: () => onSelectPreset('villa') },
        { label: t.menuLoadOffice, action: () => onSelectPreset('office') }
      ]
    },
    {
      name: t.menuView,
      items: [
        { label: t.menuStyleRealistic, action: () => setVisualStyle('realistic') },
        { label: t.menuStyleConceptual, action: () => setVisualStyle('conceptual') },
        { label: t.menuStyleWireframe, action: () => setVisualStyle('wireframe') },
        { label: t.menuStyleXray, action: () => setVisualStyle('xray') },
        { label: t.menuStyleSketch, action: () => setVisualStyle('hiddenLine') },
        { label: t.menuNavOrbit, action: () => setNavMode('orbit') },
        { label: t.menuNavWalkthrough, action: () => setNavMode('walkthrough') },
        { label: t.menuToggleSettings, action: () => setShowSettingsDrawer(true) }
      ]
    },
    {
      name: t.menuAiTools,
      items: [
        {
          label: t.menuStructuralAudit,
          action: () => {
            if (selectedElementId) {
              const matchedEl = findNodeById(hierarchy, selectedElementId);
              if (matchedEl) {
                window.dispatchEvent(new CustomEvent('archi-ai-prompt', {
                  detail: { prompt: `Perform a detailed structural, load-bearing, and safety audit on the selected element: name "${matchedEl.name}" of type "${matchedEl.type}" with id "${matchedEl.id}". What standard guidelines apply here?` }
                }));
                return;
              }
            }
            window.dispatchEvent(new CustomEvent('archi-ai-prompt', {
              detail: { prompt: `Perform a structural engineering overview and safety audit of the active model: "${activeModelName}".` }
            }));
          }
        },
        {
          label: t.menuSolarStudy,
          action: () => {
            setSunElevation(35);
            setSunAzimuth(120);
            setShadowIntensity(0.85);
            setShowSettingsDrawer(true);
            window.dispatchEvent(new CustomEvent('archi-ai-prompt', {
              detail: { prompt: `How does solar azimuth and light elevation angle affect structural shading design and heating/cooling loads for a model like "${activeModelName}"?` }
            }));
          }
        },
        {
          label: t.menuCarbonFootprint,
          action: () => {
            if (selectedElementId) {
              const matchedEl = findNodeById(hierarchy, selectedElementId);
              if (matchedEl) {
                window.dispatchEvent(new CustomEvent('archi-ai-prompt', {
                  detail: { prompt: `Perform a detailed carbon footprint assessment and embodied carbon analysis on selected element: name "${matchedEl.name}" of type "${matchedEl.type}" with id "${matchedEl.id}". How can we lower its environmental impact?` }
                }));
                return;
              }
            }
            window.dispatchEvent(new CustomEvent('archi-ai-prompt', {
              detail: { prompt: `Provide an embodied carbon footprint overview and green sustainability recommendations for active model "${activeModelName}".` }
            }));
          }
        }
      ]
    },
    {
      name: t.menuHelp,
      items: [
        { label: '🎬 Training & Video Center', action: () => setShowLearningHubModal(true) },
        { label: '🖥️ Desktop App Mode (Electron)', action: () => setShowElectronModal && setShowElectronModal(true) },
        { label: '⚡ WebAssembly Performance Lab', action: () => setShowWasmLabModal && setShowWasmLabModal(true) },
        { label: '📊 Engine Performance Monitor', action: () => setShowPerformanceMonitor && setShowPerformanceMonitor(true) },
        { label: t.menuOpenGuide, action: () => setShowDocsModal(true) },
        { label: t.menuDiagnostics, action: () => setShowAboutModal(true) }
      ]
    }
  ];

  return (
    <div className="h-9 bg-[#111] border-b border-[#333] flex items-center justify-between px-3 shrink-0 relative z-40 select-none" id="cad-main-menubar" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Left Side: Brand Logo & Interactive Dropdowns */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 cursor-default" id="cad-studio-brand">
          <Building2 className="w-3.5 h-3.5 text-blue-500" />
          <span className="font-sans font-bold text-[10px] tracking-wider text-white uppercase">ArchiView <span className="text-blue-500 text-[8px] px-1 py-0.2 bg-blue-950/40 rounded border border-blue-900/30 font-mono tracking-normal ml-0.5 font-bold">BIM</span></span>
        </div>

        {/* Dropdowns triggers row */}
        <div className="flex items-center gap-1 font-mono" id="menu-dropdown-triggers">
          {menuOptions.map((menu) => {
            const isOpen = activeDropdown === menu.name;
            return (
              <div key={menu.name} className="relative inline-block text-left">
                <button 
                  onClick={() => setActiveDropdown(isOpen ? null : menu.name)}
                  className={`px-2 py-1 rounded transition duration-150 cursor-pointer text-[10px] ${
                    isOpen ? 'bg-[#252525] text-white font-bold' : 'text-[#888] hover:text-white hover:bg-[#252525]'
                  }`}
                  id={`menu-${menu.name.toLowerCase().replace(/[^a-z0-9]/gi, '')}`}
                >
                  {menu.name}
                </button>
                
                {isOpen && (
                  <div className={`absolute ${isRtl ? 'right-0' : 'left-0'} mt-1 w-56 bg-[#1a1a1a] border border-[#333] shadow-2xl z-50 py-1 font-mono text-[10px] menu-dropdown-list animate-fade-in rounded-sm`}>
                    {menu.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-[#d1d1d1] hover:text-white hover:bg-blue-600 transition duration-100 border-b border-[#222]/20 last:border-0 cursor-pointer flex items-center bg-transparent border-0"
                        id={`menu-${menu.name.toLowerCase().replace(/[^a-z0-9]/gi, '')}-item-${idx}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Side: Active Project details & language select & search input */}
      <div className="flex items-center gap-3">
        {/* Language selector */}
        <div className="flex items-center gap-1.5 bg-[#121212] border border-[#333] px-2 py-0.5 rounded-sm" id="language-switcher-container">
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-white text-[10px] focus:outline-none cursor-pointer font-medium font-sans border-none"
            id="language-select-dropdown"
          >
            {languagesList.map((langOption) => (
              <option key={langOption.code} value={langOption.code} className="bg-[#1a1a1a] text-white">
                {langOption.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[10px] text-[#888] flex items-center gap-1.5 bg-[#121212] border border-[#333] px-2 py-0.5 rounded-sm" id="active-project-tag">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span>{t.project}: <b className="text-white font-medium">{activeModelName.endsWith('.ifc') ? activeModelName : `${activeModelName}.ifc`}</b></span>
        </div>

        {/* Quick Diagnostics/Performance Monitor trigger button */}
        <button
          onClick={() => setShowPerformanceMonitor && setShowPerformanceMonitor(true)}
          className="bg-[#181a15] hover:bg-[#20251b] text-cyan-400 font-mono text-[9.5px] px-2 py-0.5 rounded-sm flex items-center gap-1.5 transition duration-150 cursor-pointer border border-emerald-500/20 shadow-md"
          id="btn-trigger-perf-hud"
          title="Open WebAssembly Engine Performance Diagnostics HUD"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span><b>Engine Telemetry</b></span>
        </button>

        {/* Pulsing Training Center Demo & Learning Video Link */}
        <button
          onClick={() => setShowLearningHubModal(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white font-sans text-[9.5px] px-2.5 py-0.5 rounded-sm flex items-center gap-1.5 transition duration-150 cursor-pointer shadow-lg animate-pulse"
          id="btn-trigger-learning-center"
          title="Watch Simulated Video Demos and Get Certified!"
          style={{ animationDuration: '3s' }}
        >
          <Tv className="w-3 h-3 text-white" />
          <span><b>Training Center</b></span>
        </button>

        <div className="relative hidden sm:block" id="commands-search-box">
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="relative flex items-center">
              <Search className={`w-3 h-3 absolute ${isRtl ? 'right-2' : 'left-2'} text-[#555]`} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                placeholder={t.searchPlaceholder} 
                className={`bg-[#252525] border border-[#333] text-white text-[10px] ${isRtl ? 'pr-7 pl-2' : 'pl-7 pr-2'} py-0.5 w-40 focus:w-56 transition-all duration-200 outline-none placeholder-[#555] rounded-sm focus:border-blue-500/50`}
                id="search-box-input"
                autoComplete="off"
              />
            </div>
          </form>

          {/* Dropdown overlay */}
          {searchFocused && (
            <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-1.5 w-64 bg-[#1a1a1a] border border-[#333] shadow-2xl z-50 py-1.5 font-mono text-[9px] rounded-sm max-h-80 overflow-y-auto`} id="search-box-dropdown">
              {searchQuery.trim() === '' ? (
                <>
                  {/* Render search history if available */}
                  {searchHistory.length > 0 ? (
                    <div className="px-2 py-1.5 border-b border-[#222]">
                      <div className="flex items-center justify-between text-[#666] font-bold text-[8px] tracking-wider uppercase mb-1">
                        <span className="flex items-center gap-1">
                          <History className="w-2.5 h-2.5 text-amber-500" /> Recent Commands
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchHistory([]);
                          }}
                          className="text-rose-400 hover:text-rose-300 font-normal hover:underline cursor-pointer bg-transparent border-0 p-0"
                        >
                          Clear History
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        {searchHistory.map((histName, idx) => {
                          const cmd = availableCommands.find(c => c.name === histName);
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (cmd) executeCommand(cmd);
                              }}
                              className="w-full text-left px-2 py-1 hover:bg-[#252525] text-[#d1d1d1] hover:text-white rounded-sm transition flex items-start gap-1.5 group cursor-pointer border-0 bg-transparent"
                            >
                              <Clock className="w-2.5 h-2.5 text-[#555] group-hover:text-amber-500 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{histName}</div>
                                {cmd?.description && (
                                  <div className="text-[8px] text-[#555] truncate group-hover:text-[#777]">
                                    {cmd.description}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="px-2 py-2 text-center text-[#555] border-b border-[#222]">
                      No recent commands. Try typing "realistic" or "ruler"!
                    </div>
                  )}

                  {/* Quick Access Popular Commands */}
                  <div className="px-2 py-1.5">
                    <div className="text-[#666] font-bold text-[8px] tracking-wider uppercase mb-1">
                      Popular Commands
                    </div>
                    <div className="space-y-0.5">
                      {availableCommands.slice(0, 4).map((cmd) => (
                        <button
                          key={cmd.id}
                          onClick={() => executeCommand(cmd)}
                          className="w-full text-left px-2 py-1 hover:bg-[#252525] text-[#d1d1d1] hover:text-white rounded-sm transition flex items-center justify-between cursor-pointer border-0 bg-transparent"
                        >
                          <span className="font-semibold truncate">{cmd.name}</span>
                          <span className="text-[7px] bg-[#222] border border-[#333] px-1 text-[#666] rounded uppercase font-bold tracking-tight">
                            {cmd.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                // Render filtered commands
                <div className="p-1">
                  <div className="px-2 py-1 text-[#666] font-bold text-[8px] tracking-wider uppercase mb-1">
                    Matching Commands ({filteredCommands.length})
                  </div>
                  {filteredCommands.length > 0 ? (
                    <div className="space-y-0.5">
                      {filteredCommands.map((cmd) => (
                        <button
                          key={cmd.id}
                          onClick={() => executeCommand(cmd)}
                          className="w-full text-left px-2 py-1 hover:bg-[#252525] text-[#d1d1d1] hover:text-white rounded-sm transition flex flex-col cursor-pointer border-0 bg-transparent"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-blue-400">{cmd.name}</span>
                            <span className="text-[7px] bg-[#222] border border-[#333] px-1 text-[#666] rounded uppercase font-bold">
                              {cmd.category}
                            </span>
                          </div>
                          <span className="text-[8px] text-[#555] mt-0.5 leading-tight">
                            {cmd.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-2 py-3 text-center text-[#555]">
                      No matching commands. Try "realistic", "ruler", "export", or "reset".
                    </div>
                  )}
                </div>
              )}
              
              {/* Search footer guidelines */}
              <div className="px-2 py-1 bg-[#121212] border-t border-[#222] text-[#444] text-[7px] font-mono flex justify-between items-center mt-1">
                <span>{t.pressEsc}</span>
                <span>{t.enterToRun}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
