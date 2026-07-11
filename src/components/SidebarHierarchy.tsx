import React, { useState } from 'react';
import { BimElement, ModelPreset, Clash } from '../types';
import { 
  FileText, Info, Layers, RefreshCw, Upload, Database, 
  Flame, Zap, Download, FileSpreadsheet, Leaf, DollarSign, 
  Hammer, AlertTriangle, CheckCircle, Sparkles, Scale, Settings
} from 'lucide-react';
import { TranslationDict } from '../utils/translations';
import { BimTreeNode } from './BimTreeNode';

interface SidebarHierarchyProps {
  presets: ModelPreset[];
  activePresetId: string;
  onSelectPreset: (id: string) => void;
  hierarchy: BimElement;
  onToggleVisibility: (id: string) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  visibleElementIds: Set<string>;
  onFileUpload: (fileContent: string, fileName: string) => void;
  onExportCSV?: () => void;
  onExportSingleCSV?: (el: BimElement) => void;
  onResetToDefault?: () => void;
  t: TranslationDict;
  isRtl: boolean;

  // New market-leading Interactive additions
  materialOverrides?: Record<string, string>;
  onUpdateElementMaterial?: (id: string, mat: string) => void;
  clashes?: Clash[];
  onResolveClashLocally?: (clashId: string) => void;
  activeClashId?: string | null;
  onSelectClash?: (clashId: string | null) => void;
}

const SUPPORTED_MATERIALS = [
  { id: 'concrete', label: 'Concrete', color: '#848a94', class: 'bg-[#848a94]' },
  { id: 'drywall', label: 'Drywall', color: '#dedede', class: 'bg-[#dedede]' },
  { id: 'wood', label: 'Oak Wood', color: '#8c6239', class: 'bg-[#8c6239]' },
  { id: 'steel', label: 'Steel', color: '#3e444d', class: 'bg-[#3e444d]' },
  { id: 'glass', label: 'Glass', color: '#cbe7f5', class: 'bg-[#cbe7f5]' },
  { id: 'gold', label: 'Brass/Gold', color: '#fbbf24', class: 'bg-[#fbbf24]' },
  { id: 'brick', label: 'Brick Red', color: '#ca8a04', class: 'bg-[#ca8a04]' },
];

export const SidebarHierarchy: React.FC<SidebarHierarchyProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  hierarchy,
  onToggleVisibility,
  selectedElementId,
  onSelectElement,
  visibleElementIds,
  onFileUpload,
  onExportCSV,
  onExportSingleCSV,
  onResetToDefault,
  t,
  isRtl,

  materialOverrides = {},
  onUpdateElementMaterial,
  clashes = [],
  onResolveClashLocally,
  activeClashId = null,
  onSelectClash,
}) => {
  const [activeTab, setActiveTab] = useState<'model' | 'eco' | 'clash'>('model');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['#10', '#20', '#30', '#40', '#50', '#60']));
  const [dragActive, setDragActive] = useState(false);

  // Takeoff Local Multiplier sliders
  const [localCostMultiplier, setLocalCostMultiplier] = useState<number>(1.0);
  const [localCarbonMultiplier, setLocalCarbonMultiplier] = useState<number>(1.0);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  // Find selected element properties
  const findElementById = (node: BimElement, id: string): BimElement | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findElementById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedElement = selectedElementId ? findElementById(hierarchy, selectedElementId) : null;

  // File drag & drop handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileUpload(event.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileUpload(event.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  // Aggregated Dynamic Takeoff Engine
  const calculateTakeoff = () => {
    const counts: Record<string, number> = {};
    const volumes: Record<string, number> = {};
    const weights: Record<string, number> = {};
    const costs: Record<string, number> = {};
    const carbons: Record<string, number> = {};

    const traverse = (node: BimElement) => {
      if (visibleElementIds.has(node.id)) {
        const type = node.type.replace('Ifc', '');
        counts[type] = (counts[type] || 0) + 1;

        let vol = 0.5;
        if (node.properties.Volume) {
          const parsed = parseFloat(String(node.properties.Volume).replace(/[^\d.-]/g, ''));
          if (!isNaN(parsed)) vol = parsed;
        } else {
          if (type.includes('Slab')) vol = 12.0;
          else if (type.includes('Wall')) vol = 3.0;
          else if (type.includes('Column')) vol = 0.3;
          else if (type.includes('Beam')) vol = 0.45;
          else if (type.includes('Window')) vol = 0.12;
          else if (type.includes('Door')) vol = 0.2;
          else if (type.includes('Furnishing')) vol = 0.6;
        }
        volumes[type] = (volumes[type] || 0) + vol;

        let density = 1.5; // t/m3
        let baseRate = 150; // $/m3
        let baseCarbon = 300; // kg CO2/tonne

        const mat = (materialOverrides[node.id] || String(node.properties.Material || '')).toLowerCase();
        if (mat.includes('concrete')) {
          density = 2.4;
          baseRate = 125;
          baseCarbon = 320;
        } else if (mat.includes('drywall') || mat.includes('gypsum')) {
          density = 0.8;
          baseRate = 45;
          baseCarbon = 110;
        } else if (mat.includes('wood') || mat.includes('timber')) {
          density = 0.65;
          baseRate = 350;
          baseCarbon = -420; // carbon sequestrating
        } else if (mat.includes('steel')) {
          density = 7.85;
          baseRate = 1800; // steel costed per tonne
          baseCarbon = 1850;
        } else if (mat.includes('glass')) {
          density = 2.5;
          baseRate = 750;
          baseCarbon = 800;
        } else if (mat.includes('gold') || mat.includes('brass')) {
          density = 19.3;
          baseRate = 38000;
          baseCarbon = 12000;
        } else if (mat.includes('brick')) {
          density = 1.8;
          baseRate = 140;
          baseCarbon = 240;
        }

        const wt = vol * density;
        let cost = vol * baseRate * localCostMultiplier;
        if (mat.includes('steel')) {
          cost = wt * 1150 * localCostMultiplier; // cost based on steel tonnage
        }
        const carbon = wt * baseCarbon * localCarbonMultiplier;

        weights[type] = (weights[type] || 0) + wt;
        costs[type] = (costs[type] || 0) + cost;
        carbons[type] = (carbons[type] || 0) + carbon;
      }

      if (node.children) {
        node.children.forEach(c => traverse(c));
      }
    };

    traverse(hierarchy);

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);
    const totalCarbon = Object.values(carbons).reduce((a, b) => a + b, 0);

    return { counts, volumes, weights, costs, carbons, totalWeight, totalCost, totalCarbon };
  };

  const takeoff = calculateTakeoff();

  // Export cost & carbon report
  const handleExportEcoReport = () => {
    const headers = ['Category', 'Elements Count', 'Total Volume (m³)', 'Total Weight (tonnes)', 'Estimated Cost ($)', 'Carbon Footprint (kg CO₂e)'];
    const rows = [headers.join(',')];

    Object.keys(takeoff.counts).forEach((cat) => {
      const row = [
        cat,
        takeoff.counts[cat],
        takeoff.volumes[cat].toFixed(2),
        takeoff.weights[cat].toFixed(2),
        takeoff.costs[cat].toFixed(2),
        takeoff.carbons[cat].toFixed(2)
      ];
      rows.push(row.join(','));
    });

    // Totals line
    rows.push(['TOTAL', '', '', takeoff.totalWeight.toFixed(2), takeoff.totalCost.toFixed(2), takeoff.totalCarbon.toFixed(2)].join(','));

    const csvContent = "\uFEFF" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BIM_Cost_Carbon_Takeoff_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dispatches global custom prompt event to AI consultant box
  const triggerAiResolution = (clash: Clash) => {
    const prompt = `Perform a structural, code compliance, and safety audit on the hard geometric clash between:
- Element A: **${clash.elementName1}** (ID: ${clash.elementId1})
- Element B: **${clash.elementName2}** (ID: ${clash.elementId2})
At geometric coordinate location **X: ${clash.coordinates.x.toFixed(2)}, Y: ${clash.coordinates.y.toFixed(2)}, Z: ${clash.coordinates.z.toFixed(2)}**.
Cite standard international building codes (IBC) or steel/concrete standards (ACI, AISC) to justify your structural resolution steps. Highlight safe clearances.`;
    
    // Dispatch customized event to AiAssistant
    const event = new CustomEvent('archi-ai-prompt', { detail: { prompt } });
    window.dispatchEvent(event);
  };

  const activeClash = activeClashId ? clashes.find(c => c.id === activeClashId) : null;

  return (
    <div className="w-full h-full flex flex-col bg-[#111111] border-r border-[#2d2d2d] text-[#d1d1d1] text-[11px] overflow-hidden" id="ifc-sidebar-frame" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* 1. Model Preset Selector & Dropdown */}
      <div className="p-2 border-b border-[#2d2d2d] bg-[#161616]" id="preset-selector-header">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[9px] font-mono text-[#666] uppercase tracking-wider font-bold flex items-center gap-1">
            <Database className="w-3 h-3 text-blue-400" /> {t.project}
          </label>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <select
            value={activePresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="flex-1 bg-[#1e1e1e] border border-[#2d2d2d] text-white text-[10px] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
            id="model-preset-dropdown"
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
            {activePresetId === 'custom' && (
              <option value="custom">
                Custom Model: {hierarchy.properties.LoadedFile || 'Uploaded IFC'}
              </option>
            )}
          </select>
          
          <button
            onClick={onResetToDefault}
            className="p-1 border border-[#2d2d2d] hover:border-amber-500/50 hover:bg-amber-950/20 text-amber-400 rounded cursor-pointer transition flex items-center justify-center shrink-0"
            title={t.menuReset}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dynamic Tab Bar */}
      <div className="flex border-b border-[#2d2d2d] bg-[#161616] select-none shrink-0" id="sidebar-tabs-bar">
        <button
          onClick={() => setActiveTab('model')}
          className={`flex-1 py-2 text-center font-mono text-[9px] font-bold tracking-wider border-b transition ${
            activeTab === 'model'
              ? 'border-blue-500 text-blue-400 bg-[#1e1e1e]'
              : 'border-transparent text-[#666] hover:text-[#bbb] bg-transparent'
          }`}
        >
          📂 MODEL TREE
        </button>
        <button
          onClick={() => setActiveTab('eco')}
          className={`flex-1 py-2 text-center font-mono text-[9px] font-bold tracking-wider border-b transition ${
            activeTab === 'eco'
              ? 'border-emerald-500 text-emerald-400 bg-[#1e1e1e]'
              : 'border-transparent text-[#666] hover:text-[#bbb] bg-transparent'
          }`}
        >
          📊 ECO-COST
        </button>
        <button
          onClick={() => setActiveTab('clash')}
          className={`flex-1 py-2 text-center font-mono text-[9px] font-bold tracking-wider border-b transition relative ${
            activeTab === 'clash'
              ? 'border-rose-500 text-rose-400 bg-[#1e1e1e]'
              : 'border-transparent text-[#666] hover:text-[#bbb] bg-transparent'
          }`}
        >
          ⚠️ CLASHES
          {clashes.filter(c => !c.resolved).length > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-rose-600 text-white text-[8px] px-1 rounded-full animate-pulse font-sans shrink-0">
              {clashes.filter(c => !c.resolved).length}
            </span>
          )}
        </button>
      </div>

      {/* Scrollable Contents based on Tabs */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-[#111]" id="sidebar-scrollable-body">
        
        {/* TAB 1: MODEL TREE & SELECTION */}
        {activeTab === 'model' && (
          <div className="flex-1 flex flex-col min-h-0 divide-y divide-[#2d2d2d]">
            {/* 2. Drag & Drop Custom IFC Upload Area */}
            <div className="p-2 bg-[#141414]" id="ifc-file-drag-container">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded p-2 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-950/15' 
                    : 'border-[#2d2d2d] hover:border-[#444] bg-[#1a1a1a]/40 hover:bg-[#1a1a1a]'
                }`}
                id="drag-area-box"
              >
                <Upload className="w-4 h-4 text-[#555] mx-auto mb-1 group-hover:text-blue-400" />
                <div className="text-[10px] font-medium text-[#c1c1c1]">
                  Drag & Drop `.ifc` File
                </div>
                <input
                  type="file"
                  accept=".ifc"
                  onChange={handleFileChange}
                  className="hidden"
                  id="local-file-input"
                />
                <button
                  onClick={() => document.getElementById('local-file-input')?.click()}
                  className="mt-1 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2d2d2d] text-[#ccc] text-[9px] px-2 py-0.5 rounded transition"
                  id="browse-files-btn"
                >
                  Select file
                </button>
              </div>
            </div>

            {/* Tree hierarchy viewport */}
            <div className="p-2 flex-1 max-h-[300px] overflow-y-auto" id="ifc-spatial-tree-panel">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono text-[#666] uppercase tracking-wider font-bold flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-400" /> {t.bimHierarchy}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onExportCSV}
                    className="text-[8px] font-mono text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 bg-emerald-950/20 border border-emerald-900/40 px-1 py-0.5 rounded cursor-pointer transition"
                    title="Export properties list to Excel CSV"
                  >
                    <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-400" /> EXCEL
                  </button>
                </div>
              </div>

              <div className="space-y-0.5" id="tree-container-scroll">
                <BimTreeNode
                  node={hierarchy}
                  expandedNodes={expandedNodes}
                  toggleExpand={toggleExpand}
                  selectedElementId={selectedElementId}
                  onSelectElement={onSelectElement}
                  visibleElementIds={visibleElementIds}
                  onToggleVisibility={onToggleVisibility}
                  isRtl={isRtl}
                />
              </div>
            </div>

            {/* Selected Properties Inspector */}
            <div className="p-2 flex-1 bg-[#141414] min-h-[220px]" id="ifc-attributes-inspector-panel">
              {selectedElement ? (
                <div className="space-y-2" id={`inspector-${selectedElement.id.replace('#', '')}`}>
                  <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1">
                    <span className="text-[9px] font-mono text-blue-400 uppercase tracking-wider font-bold flex items-center gap-1">
                      <FileText className="w-3 h-3 text-blue-400" /> {t.propertiesPanel}
                    </span>
                    <span className="text-[9px] font-mono bg-[#1e1e1e] border border-[#2d2d2d] text-blue-400 px-1 py-0.2 rounded">
                      {selectedElement.id}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2 bg-[#1e1e1e] p-1.5 border border-[#2d2d2d] rounded-sm">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white text-[10px] leading-tight truncate">{selectedElement.name}</div>
                      <div className="text-[8px] text-[#666] font-mono mt-0.5">{t.elementType}: {selectedElement.type}</div>
                    </div>
                    <button
                      onClick={() => onExportSingleCSV?.(selectedElement)}
                      className="text-[8px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-0.5 bg-[#1a1a1a] border border-[#2d2d2d] px-1.5 py-0.5 rounded cursor-pointer transition shrink-0"
                      title={t.exportSingleCsv}
                    >
                      <Download className="w-2.5 h-2.5" /> CSV
                    </button>
                  </div>

                  {/* 🎨 MATERIAL STUDIO: Dynamic color overrides inside properties panel */}
                  {onUpdateElementMaterial && !['IfcProject', 'IfcSite', 'IfcBuilding', 'IfcBuildingStorey'].includes(selectedElement.type) && (
                    <div className="bg-[#1e1e1e] border border-blue-500/25 rounded p-1.5 space-y-1">
                      <div className="text-[8px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Visual Material Studio
                      </div>
                      <div className="text-[8px] text-[#888] mb-1">
                        Override this element's physical material in the 3D viewport:
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {SUPPORTED_MATERIALS.map((mat) => {
                          const isActive = materialOverrides[selectedElement.id] === mat.id;
                          return (
                            <button
                              key={mat.id}
                              onClick={() => onUpdateElementMaterial(selectedElement.id, mat.id)}
                              className={`px-1 py-0.5 rounded text-[8px] font-mono flex items-center justify-center gap-0.5 transition cursor-pointer border ${
                                isActive 
                                  ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-bold' 
                                  : 'border-[#2d2d2d] bg-[#161616] text-[#777] hover:text-white hover:border-[#444]'
                              }`}
                              title={`Override with ${mat.label}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${mat.class} shrink-0`} />
                              {mat.label.substring(0, 5)}
                            </button>
                          );
                        })}
                        {materialOverrides[selectedElement.id] && (
                          <button
                            onClick={() => onUpdateElementMaterial(selectedElement.id, '')}
                            className="px-1 py-0.5 rounded text-[8px] font-mono bg-[#221c1c] text-rose-400 border border-rose-900/40 hover:bg-[#321c1c] transition cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attributes list */}
                  <div className="border border-[#2d2d2d] rounded overflow-hidden max-h-[160px] overflow-y-auto">
                    <table className="w-full text-left border-collapse font-mono text-[9px]">
                      <thead>
                        <tr className="bg-[#1a1a1a] text-[#666] border-b border-[#2d2d2d]">
                          <th className="py-1 px-1.5">Property</th>
                          <th className="py-1 px-1.5 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2d2d2d]">
                        {Object.entries(selectedElement.properties).map(([key, val]) => (
                          <tr key={key} className="hover:bg-[#1e1e1e]">
                            <td className="py-1 px-1.5 text-[#555]">{key}</td>
                            <td className="py-1 px-1.5 text-white font-medium text-right">
                              {val === 'YES' ? (
                                <span className="text-emerald-400">Yes</span>
                              ) : val === 'NO' ? (
                                <span className="text-rose-400">No</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 gap-1" id="specialty-chips">
                    {selectedElement.properties.FireRating && (
                      <div className="bg-rose-950/10 border border-rose-900/20 p-1.5 rounded flex flex-col">
                        <span className="text-[8px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" /> Fire Rating
                        </span>
                        <span className="font-semibold text-white font-mono text-[9px] mt-0.5">{selectedElement.properties.FireRating}</span>
                      </div>
                    )}
                    {selectedElement.properties.LoadBearing === 'YES' && (
                      <div className="bg-emerald-950/10 border border-emerald-900/20 p-1.5 rounded flex flex-col">
                        <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" /> Structural
                        </span>
                        <span className="font-semibold text-white text-[9px] mt-0.5">Load Bearing</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#444] py-6" id="attributes-empty-state">
                  <Info className="w-5 h-5 text-[#333] mb-1" />
                  <div className="font-medium text-[10px] text-[#555]">{t.noElementSelected}</div>
                  <p className="text-[9px] mt-0.5 max-w-[180px] leading-normal text-[#444]">
                    {t.selectAnElement}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ECO & COST ESTIMATION (REAL-TIME TAKEOFF) */}
        {activeTab === 'eco' && (
          <div className="p-3 space-y-4 flex-1 flex flex-col min-h-0 bg-[#111]">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" /> Dynamic Takeoff (BOM)
              </div>
              <button
                onClick={handleExportEcoReport}
                className="text-[8px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900 hover:bg-emerald-900/30 px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-1 shrink-0"
              >
                <Download className="w-2.5 h-2.5" /> SAVE ECO CSV
              </button>
            </div>

            {/* Big Aggregate Cards */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-[#161616] border border-[#2d2d2d] p-1.5 rounded flex flex-col">
                <span className="text-[8px] text-[#666] font-mono uppercase">Mass (Tonnes)</span>
                <span className="text-[11px] font-bold text-white font-mono mt-0.5">
                  {takeoff.totalWeight.toFixed(1)} t
                </span>
              </div>
              <div className="bg-[#161616] border border-emerald-950/30 border-emerald-900/20 p-1.5 rounded flex flex-col">
                <span className="text-[8px] text-emerald-400 font-mono uppercase flex items-center gap-0.5">
                  <DollarSign className="w-2.5 h-2.5" /> Est. Cost
                </span>
                <span className="text-[11px] font-bold text-emerald-400 font-mono mt-0.5">
                  ${takeoff.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="bg-[#161616] border border-cyan-950/30 border-cyan-900/20 p-1.5 rounded flex flex-col">
                <span className="text-[8px] text-cyan-400 font-mono uppercase flex items-center gap-0.5">
                  <Leaf className="w-2.5 h-2.5" /> CO₂ Embodied
                </span>
                <span className="text-[11px] font-bold text-cyan-400 font-mono mt-0.5">
                  {takeoff.totalCarbon.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
                </span>
              </div>
            </div>

            {/* Adjustable Market Multipliers Controls */}
            <div className="bg-[#161616] border border-[#2d2d2d] rounded p-2 space-y-2">
              <div className="text-[8px] font-mono text-[#888] font-bold uppercase tracking-wider flex items-center gap-1">
                <Settings className="w-2.5 h-2.5 text-[#888]" /> Global Economics Sliders
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[8px] text-[#666]">
                  <span>Local Cost Index:</span>
                  <span className="text-emerald-400 font-bold">{localCostMultiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={localCostMultiplier}
                  onChange={(e) => setLocalCostMultiplier(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#252525] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[8px] text-[#666]">
                  <span>Green Concrete/Carbon Offset:</span>
                  <span className="text-cyan-400 font-bold">{localCarbonMultiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={localCarbonMultiplier}
                  onChange={(e) => setLocalCarbonMultiplier(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#252525] rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* Category Breakdown list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[220px]" id="eco-breakdown-list">
              <div className="text-[8px] font-mono text-[#555] uppercase tracking-wider font-bold mb-1">
                Breakdown by IFC Element Type:
              </div>
              {Object.keys(takeoff.counts).map((cat) => {
                const count = takeoff.counts[cat];
                const cost = takeoff.costs[cat];
                const carbon = takeoff.carbons[cat];
                const maxCost = Math.max(...Object.values(takeoff.costs), 1);
                const percent = (cost / maxCost) * 100;

                return (
                  <div key={cat} className="bg-[#161616]/70 border border-[#232323] p-1.5 rounded space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-white font-bold">{cat} <span className="text-[#666] font-normal">({count} units)</span></span>
                      <span className="text-emerald-400 font-semibold">${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    {/* Progress Bar visual indicator */}
                    <div className="w-full h-1.5 bg-[#252525] rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-[#555]">
                      <span>Volume: {takeoff.volumes[cat].toFixed(1)} m³</span>
                      <span className="text-cyan-500/80">Embodied Carbon: {carbon.toFixed(0)} kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SMART GEOMETRIC CLASH DETECTION & AI AUDIT */}
        {activeTab === 'clash' && (
          <div className="p-3 space-y-3.5 flex-1 flex flex-col min-h-0 bg-[#111]">
            <div className="text-rose-400 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> AI Clash Detection Core
            </div>

            <p className="text-[9px] text-[#666] leading-normal">
              Below is a list of physical intersections, architectural spatial conflicts, or safety clearance clashes identified in this model:
            </p>

            {/* Clash list */}
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {clashes.map((c) => {
                const isSelected = activeClashId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectClash?.(isSelected ? null : c.id)}
                    className={`w-full text-left p-1.5 rounded border transition cursor-pointer flex flex-col ${
                      isSelected
                        ? 'bg-rose-950/20 border-rose-500'
                        : c.resolved
                        ? 'bg-emerald-950/5 border-emerald-900/30 opacity-70 hover:opacity-100'
                        : 'bg-[#161616] border-[#2d2d2d] hover:border-[#444]'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full font-mono text-[9px]">
                      <span className="font-bold text-white flex items-center gap-1">
                        {c.resolved ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            c.severity === 'High' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                          }`} />
                        )}
                        Clash ID: {c.id}
                      </span>
                      <span className={`px-1 py-0.2 rounded text-[7px] font-bold uppercase ${
                        c.resolved 
                          ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
                          : c.severity === 'High' 
                          ? 'bg-rose-900/20 text-rose-400 border border-rose-800/40' 
                          : 'bg-amber-900/20 text-amber-400 border border-amber-800/40'
                      }`}>
                        {c.resolved ? 'RESOLVED' : c.severity}
                      </span>
                    </div>
                    <div className="text-[9px] font-semibold text-[#aaa] mt-1 leading-tight line-clamp-1">{c.description}</div>
                    <div className="text-[8px] text-[#555] font-mono mt-0.5">
                      Coordinates: ({c.coordinates.x.toFixed(1)}, {c.coordinates.y.toFixed(1)}, {c.coordinates.z.toFixed(1)})
                    </div>
                  </button>
                );
              })}
              {clashes.length === 0 && (
                <div className="text-center py-6 text-[#555] font-mono text-[9px]">
                  No active clashes found for custom uploaded models.
                </div>
              )}
            </div>

            {/* Active Clash Diagnostic Inspector */}
            {activeClash ? (
              <div className="bg-[#161616] border border-[#2d2d2d] rounded p-2.5 space-y-2.5 animate-fade-in">
                <div className="border-b border-[#2d2d2d] pb-1.5">
                  <div className="text-[8px] font-mono text-[#666] uppercase tracking-wider">Active Diagnostic:</div>
                  <div className="font-bold text-rose-400 text-[10px] mt-0.5 leading-tight">{activeClash.description}</div>
                </div>

                <div className="space-y-1 font-mono text-[9px] text-[#888]">
                  <div className="flex justify-between">
                    <span>Element A:</span>
                    <span className="text-white max-w-[150px] truncate">{activeClash.elementName1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Element B:</span>
                    <span className="text-white max-w-[150px] truncate">{activeClash.elementName2}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overlap Volume:</span>
                    <span className="text-white font-bold">{activeClash.volume} m³</span>
                  </div>
                </div>

                {/* Local Action Resolutions buttons */}
                <div className="flex flex-col gap-1.5 pt-1">
                  {!activeClash.resolved ? (
                    <>
                      <button
                        onClick={() => onResolveClashLocally?.(activeClash.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2 rounded cursor-pointer transition flex items-center justify-center gap-1 text-[9px] uppercase font-mono shadow-md border border-emerald-500/20"
                      >
                        <Hammer className="w-3.5 h-3.5" /> Resolve Locally (Shift Coordinate)
                      </button>
                      
                      <button
                        onClick={() => triggerAiResolution(activeClash)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-2 rounded cursor-pointer transition flex items-center justify-center gap-1 text-[9px] uppercase font-mono shadow-md border border-blue-500/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Ask AI to Audit Compliance
                      </button>
                    </>
                  ) : (
                    <div className="bg-emerald-950/20 border border-emerald-500/30 p-2 rounded text-emerald-400 flex flex-col items-center justify-center text-center font-mono text-[9px] animate-pulse">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mb-1 shrink-0" />
                      <div className="font-bold uppercase">Clash Resolved Successfully</div>
                      <div className="text-[8px] text-emerald-500/80 mt-0.5">
                        Interactive physical translation applied! Coordinate cleared.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-[#444] border border-[#1e1e1e] border-dashed rounded p-4">
                <Info className="w-5 h-5 text-[#333] mb-1" />
                <div className="text-[9px] text-[#555] font-mono">Select a conflict clash from the list above to execute structural diagnostics and AI resolution.</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
