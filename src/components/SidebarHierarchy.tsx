import React, { useState, useEffect } from 'react';
import { BimElement, ModelPreset, Clash } from '../types';
import { 
  FileText, Info, Layers, RefreshCw, Upload, Database, 
  Flame, Zap, Download, FileSpreadsheet, Leaf, DollarSign, 
  Hammer, AlertTriangle, CheckCircle, Sparkles, Scale, Settings,
  MessageSquare, Save, Search, X, Calculator, Ruler, Globe, Sliders
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
  onBatchUpdateElementMaterials?: (updates: Record<string, string>) => void;
  clashes?: Clash[];
  onResolveClashLocally?: (clashId: string) => void;
  activeClashId?: string | null;
  onSelectClash?: (clashId: string | null) => void;

  // Local storage annotations persistence
  annotations?: Record<string, string>;
  onUpdateAnnotation?: (elementId: string, text: string) => void;

  is2DDrawingView?: boolean;
  setIs2DDrawingView?: (val: boolean) => void;
  twoDStyle?: 'blueprint' | 'paper' | 'dark';
  setTwoDStyle?: (val: 'blueprint' | 'paper' | 'dark') => void;
  twoDProjection?: 'top' | 'front' | 'side';
  setTwoDProjection?: (val: 'top' | 'front' | 'side') => void;
}

const CURRENCY_MAP = {
  USD: { symbol: '$', rate: 1.0, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 0.92, label: 'EUR (€)' },
  GBP: { symbol: '£', rate: 0.78, label: 'GBP (£)' },
  JPY: { symbol: '¥', rate: 158.0, label: 'JPY (¥)' },
  INR: { symbol: '₹', rate: 83.5, label: 'INR (₹)' },
};

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
  onBatchUpdateElementMaterials,
  clashes = [],
  onResolveClashLocally,
  activeClashId = null,
  onSelectClash,

  annotations = {},
  onUpdateAnnotation,

  is2DDrawingView = false,
  setIs2DDrawingView = () => {},
  twoDStyle = 'blueprint',
  setTwoDStyle = () => {},
  twoDProjection = 'top',
  setTwoDProjection = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'model' | 'survey' | 'eco' | 'clash'>('model');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['#10', '#20', '#30', '#40', '#50', '#60']));
  const [dragActive, setDragActive] = useState(false);

  // Takeoff Local Multiplier sliders
  const [localCostMultiplier, setLocalCostMultiplier] = useState<number>(1.0);
  const [localCarbonMultiplier, setLocalCarbonMultiplier] = useState<number>(1.0);

  // Quantity Surveying State Variables
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR'>('USD');
  const [wastageFactor, setWastageFactor] = useState<number>(5); // % wastage on construction site
  const [markupFactor, setMarkupFactor] = useState<number>(10); // % contractor overhead / profit
  const [customRates, setCustomRates] = useState<Record<string, number>>({
    concrete: 125,
    drywall: 45,
    wood: 350,
    steel: 1150, // costed per tonne
    glass: 750,
    gold: 38000,
    brick: 140
  });

  const [budgetLimit, setBudgetLimit] = useState<number>(220000);
  const [costVisibleOnly, setCostVisibleOnly] = useState<boolean>(false);
  const [isRatesPanelOpen, setIsRatesPanelOpen] = useState<boolean>(false);
  const [boqSearchText, setBoqSearchText] = useState<string>('');

  // Sync budget based on current preset
  useEffect(() => {
    if (activePresetId === 'villa') setBudgetLimit(220000);
    else if (activePresetId === 'office') setBudgetLimit(1100000);
    else setBudgetLimit(650000);
  }, [activePresetId]);

  // Local note input buffer state to prevent typing lag
  const [localNote, setLocalNote] = useState<string>('');

  // Clash Audit Filter state
  const [clashFilter, setClashFilter] = useState<'all' | 'unresolved'>('all');

  // Real-time element tree search filter text state
  const [filterText, setFilterText] = useState<string>('');

  // Quick Material Library panel state
  const [isMaterialLibraryOpen, setIsMaterialLibraryOpen] = useState<boolean>(true);
  const [batchTarget, setBatchTarget] = useState<'selected' | 'type' | 'descendants'>('selected');

  // Sync localNote state whenever selectedElementId or annotations change
  useEffect(() => {
    if (selectedElementId) {
      setLocalNote(annotations[selectedElementId] || '');
    } else {
      setLocalNote('');
    }
  }, [selectedElementId, annotations]);

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

  // Batch-apply common architectural materials
  const handleBatchApplyMaterial = (materialId: string) => {
    if (!onBatchUpdateElementMaterials && !onUpdateElementMaterial) return;

    if (batchTarget === 'selected') {
      if (selectedElementId && onUpdateElementMaterial) {
        onUpdateElementMaterial(selectedElementId, materialId);
      }
    } else if (batchTarget === 'type') {
      if (selectedElement) {
        const targetType = selectedElement.type;
        const updates: Record<string, string> = {};
        
        const traverseAndCollect = (node: BimElement) => {
          if (node.type === targetType && !['IfcProject', 'IfcSite', 'IfcBuilding', 'IfcBuildingStorey'].includes(node.type)) {
            updates[node.id] = materialId;
          }
          if (node.children) {
            node.children.forEach(traverseAndCollect);
          }
        };
        
        traverseAndCollect(hierarchy);
        
        if (Object.keys(updates).length > 0) {
          if (onBatchUpdateElementMaterials) {
            onBatchUpdateElementMaterials(updates);
          } else {
            Object.entries(updates).forEach(([id, mat]) => {
              onUpdateElementMaterial?.(id, mat);
            });
          }
        }
      }
    } else if (batchTarget === 'descendants') {
      if (selectedElement) {
        const updates: Record<string, string> = {};
        
        const traverseAndCollect = (node: BimElement) => {
          if (!['IfcProject', 'IfcSite', 'IfcBuilding', 'IfcBuildingStorey'].includes(node.type)) {
            updates[node.id] = materialId;
          }
          if (node.children) {
            node.children.forEach(traverseAndCollect);
          }
        };
        
        traverseAndCollect(selectedElement);
        
        if (Object.keys(updates).length > 0) {
          if (onBatchUpdateElementMaterials) {
            onBatchUpdateElementMaterials(updates);
          } else {
            Object.entries(updates).forEach(([id, mat]) => {
              onUpdateElementMaterial?.(id, mat);
            });
          }
        }
      }
    }
  };

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

  // Aggregated Dynamic Takeoff Engine with detailed Quantity Surveying
  const calculateTakeoff = () => {
    const counts: Record<string, number> = {};
    const volumes: Record<string, number> = {};
    const weights: Record<string, number> = {};
    const costs: Record<string, number> = {};
    const carbons: Record<string, number> = {};
    const measuredElements: any[] = [];

    let totalBaseCost = 0;
    let totalWastageCost = 0;
    let totalMarkupCost = 0;

    const traverse = (node: BimElement) => {
      // Skip generic IFC structures that aren't physical elements
      const isPhysical = !['IfcProject', 'IfcSite', 'IfcBuilding', 'IfcBuildingStorey'].includes(node.type);
      const isVisible = visibleElementIds.has(node.id);

      if (isPhysical && (!costVisibleOnly || isVisible)) {
        const type = node.type.replace('Ifc', '');
        counts[type] = (counts[type] || 0) + 1;

        // 1. Calculate volume (m³)
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

        // 2. Calculate area (m²)
        let area = 2.0;
        if (node.properties.Area) {
          const parsed = parseFloat(String(node.properties.Area).replace(/[^\d.-]/g, ''));
          if (!isNaN(parsed)) area = parsed;
        } else {
          if (type.includes('Slab')) area = 40.0;
          else if (type.includes('Wall')) area = 12.0;
          else if (type.includes('Window')) area = 1.5;
          else if (type.includes('Door')) area = 2.0;
        }

        // 3. Calculate height (m)
        let height = 3.0;
        if (node.properties.Height) {
          const parsed = parseFloat(String(node.properties.Height).replace(/[^\d.-]/g, ''));
          if (!isNaN(parsed)) height = parsed;
        }

        // 4. Resolve Material Key
        const rawMat = (materialOverrides[node.id] || String(node.properties.Material || '')).toLowerCase();
        let matKey = 'drywall';
        let matLabel = 'Drywall';

        if (rawMat.includes('concrete')) {
          matKey = 'concrete';
          matLabel = 'Concrete';
        } else if (rawMat.includes('wood') || rawMat.includes('timber')) {
          matKey = 'wood';
          matLabel = 'Oak Wood';
        } else if (rawMat.includes('steel')) {
          matKey = 'steel';
          matLabel = 'Steel';
        } else if (rawMat.includes('glass')) {
          matKey = 'glass';
          matLabel = 'Glass';
        } else if (rawMat.includes('gold') || rawMat.includes('brass')) {
          matKey = 'gold';
          matLabel = 'Brass/Gold';
        } else if (rawMat.includes('brick')) {
          matKey = 'brick';
          matLabel = 'Brick Red';
        }

        // 5. Quantity Surveying Economics (Rates, Densities, and Carbon emissions)
        let density = 1.5; // t/m³
        let baseRate = customRates[matKey] || 150;
        let baseCarbon = 300; // kg CO₂ / tonne

        if (matKey === 'concrete') {
          density = 2.4;
          baseCarbon = 320;
        } else if (matKey === 'drywall') {
          density = 0.8;
          baseCarbon = 110;
        } else if (matKey === 'wood') {
          density = 0.65;
          baseCarbon = -420; // Wood sequesters carbon
        } else if (matKey === 'steel') {
          density = 7.85;
          baseCarbon = 1850;
        } else if (matKey === 'glass') {
          density = 2.5;
          baseCarbon = 800;
        } else if (matKey === 'gold') {
          density = 19.3;
          baseCarbon = 12000;
        } else if (matKey === 'brick') {
          density = 1.8;
          baseCarbon = 240;
        }

        const wt = vol * density;
        let unit = 'm³';
        let baseCost = 0;
        let formula = '';

        const currSymbol = CURRENCY_MAP[currency].symbol;
        const currRate = CURRENCY_MAP[currency].rate;

        // Apply customized rates based on typical QS practices
        if (matKey === 'steel') {
          unit = 'tonnes';
          baseCost = wt * baseRate * localCostMultiplier;
          formula = `${wt.toFixed(2)} t × ${currSymbol}${(baseRate * currRate * localCostMultiplier).toFixed(0)}/t`;
        } else if (type.includes('Furnishing') || type.includes('Door') || type.includes('Equipment')) {
          unit = 'units';
          baseCost = baseRate * localCostMultiplier;
          formula = `1 unit × ${currSymbol}${(baseRate * currRate * localCostMultiplier).toFixed(0)}/unit`;
        } else if (matKey === 'drywall' || matKey === 'glass') {
          unit = 'm²';
          baseCost = area * baseRate * localCostMultiplier;
          formula = `${area.toFixed(1)} m² × ${currSymbol}${(baseRate * currRate * localCostMultiplier).toFixed(0)}/m²`;
        } else {
          unit = 'm³';
          baseCost = vol * baseRate * localCostMultiplier;
          formula = `${vol.toFixed(1)} m³ × ${currSymbol}${(baseRate * currRate * localCostMultiplier).toFixed(0)}/m³`;
        }

        const wastageCost = baseCost * (wastageFactor / 100);
        const subtotal = baseCost + wastageCost;
        const markupCost = subtotal * (markupFactor / 100);
        const finalCost = subtotal + markupCost;
        const carbon = wt * baseCarbon * localCarbonMultiplier;

        totalBaseCost += baseCost;
        totalWastageCost += wastageCost;
        totalMarkupCost += markupCost;

        weights[type] = (weights[type] || 0) + wt;
        costs[type] = (costs[type] || 0) + finalCost;
        carbons[type] = (carbons[type] || 0) + carbon;

        measuredElements.push({
          id: node.id,
          name: node.name,
          type: type,
          material: matLabel,
          matKey: matKey,
          isOverridden: !!materialOverrides[node.id],
          volume: vol,
          area: area,
          height: height,
          weight: wt,
          baseRate: baseRate,
          unit: unit,
          baseCost: baseCost,
          wastageCost: wastageCost,
          markupCost: markupCost,
          finalCost: finalCost,
          carbon: carbon,
          formula: formula,
          visible: isVisible,
        });
      }

      if (node.children) {
        node.children.forEach(c => traverse(c));
      }
    };

    traverse(hierarchy);

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);
    const totalCarbon = Object.values(carbons).reduce((a, b) => a + b, 0);

    return { 
      counts, 
      volumes, 
      weights, 
      costs, 
      carbons, 
      totalWeight, 
      totalCost, 
      totalCarbon,
      measuredElements,
      totalBaseCost,
      totalWastageCost,
      totalMarkupCost,
    };
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

  // Export full Bill of Quantities (BoQ) to CSV for Quantity Surveying Tab
  const handleExportBoQReport = () => {
    const symbol = CURRENCY_MAP[currency].symbol;
    const rate = CURRENCY_MAP[currency].rate;
    const headers = [
      'Element ID',
      'Element Name',
      'IFC Class',
      'Material',
      'Volume (m³)',
      'Area (m²)',
      'Height (m)',
      'Mass (tonnes)',
      `Base Unit Rate (${currency})`,
      'Measurement Unit',
      `Base Cost (${currency})`,
      `Wastage Cost (${currency})`,
      `Markup Cost (${currency})`,
      `Final Cost (${currency})`,
      'Calculation Formula',
    ];

    const rows = [headers.join(',')];

    takeoff.measuredElements.forEach((el) => {
      const row = [
        `"${el.id}"`,
        `"${el.name.replace(/"/g, '""')}"`,
        `"${el.type}"`,
        `"${el.material}"`,
        el.volume.toFixed(2),
        el.area.toFixed(2),
        el.height.toFixed(2),
        el.weight.toFixed(2),
        (el.baseRate * rate).toFixed(2),
        `"${el.unit}"`,
        (el.baseCost * rate).toFixed(2),
        (el.wastageCost * rate).toFixed(2),
        (el.markupCost * rate).toFixed(2),
        (el.finalCost * rate).toFixed(2),
        `"${el.formula.replace(/"/g, '""')}"`,
      ];
      rows.push(row.join(','));
    });

    const csvContent = "\uFEFF" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Archiview_BoQ_Report_${activePresetId.toUpperCase()}_${currency}.csv`);
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

  const filteredClashes = clashes.filter(c => {
    if (clashFilter === 'unresolved') {
      return !c.resolved;
    }
    return true;
  });

  // Recursive function to filter the hierarchy tree by name, type or ID
  const filterHierarchy = (node: BimElement, term: string): BimElement | null => {
    if (!term.trim()) return node;
    
    const searchLower = term.toLowerCase().trim();
    const isMatch = node.name.toLowerCase().includes(searchLower) || 
                    node.type.toLowerCase().includes(searchLower) ||
                    node.id.toLowerCase().includes(searchLower);

    const matchedChildren: BimElement[] = [];
    if (node.children) {
      for (const child of node.children) {
        const filteredChild = filterHierarchy(child, term);
        if (filteredChild) {
          matchedChildren.push(filteredChild);
        }
      }
    }

    if (isMatch || matchedChildren.length > 0) {
      return {
        ...node,
        children: matchedChildren.length > 0 ? matchedChildren : undefined
      };
    }

    return null;
  };

  const filteredHierarchy = filterHierarchy(hierarchy, filterText);

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
          title="BIM Tree & Element Properties"
        >
          📂 MODEL
        </button>
        <button
          onClick={() => setActiveTab('survey')}
          className={`flex-1 py-2 text-center font-mono text-[9px] font-bold tracking-wider border-b transition ${
            activeTab === 'survey'
              ? 'border-amber-500 text-amber-400 bg-[#1e1e1e]'
              : 'border-transparent text-[#666] hover:text-[#bbb] bg-transparent'
          }`}
          title="Quantity Takeoff & Bill of Quantities (BoQ)"
        >
          📐 SURVEY
        </button>
        <button
          onClick={() => setActiveTab('eco')}
          className={`flex-1 py-2 text-center font-mono text-[9px] font-bold tracking-wider border-b transition ${
            activeTab === 'eco'
              ? 'border-emerald-500 text-emerald-400 bg-[#1e1e1e]'
              : 'border-transparent text-[#666] hover:text-[#bbb] bg-transparent'
          }`}
          title="Ecology & Embodied Carbon Estimation"
        >
          📊 ECO
        </button>
        <button
          onClick={() => setActiveTab('clash')}
          className={`flex-1 py-2 text-center font-mono text-[9px] font-bold tracking-wider border-b transition relative ${
            activeTab === 'clash'
              ? 'border-rose-500 text-rose-400 bg-[#1e1e1e]'
              : 'border-transparent text-[#666] hover:text-[#bbb] bg-transparent'
          }`}
          title="Smart Clash Detective Engine"
        >
          ⚠️ CLASH
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

            {/* Real-time Search Filter Input */}
            <div className="p-2 bg-[#161616]" id="ifc-tree-search-container">
              <div className="relative">
                <span className={`absolute inset-y-0 flex items-center pointer-events-none text-neutral-500 ${isRtl ? 'right-0 pr-2.5' : 'left-0 pl-2.5'}`}>
                  <Search className="w-3.5 h-3.5 text-neutral-400" />
                </span>
                <input
                  type="text"
                  placeholder={t.searchElements || "Search elements..."}
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className={`w-full bg-[#1e1e1e] border border-[#2d2d2d] hover:border-[#444] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-neutral-500 text-[10px] rounded py-1 focus:outline-none transition font-sans ${
                    isRtl ? 'pr-8 pl-7' : 'pl-8 pr-7'
                  }`}
                  id="ifc-tree-search-input"
                />
                {filterText && (
                  <button
                    onClick={() => setFilterText('')}
                    className={`absolute inset-y-0 flex items-center text-neutral-500 hover:text-neutral-300 transition cursor-pointer bg-transparent border-0 ${
                      isRtl ? 'left-0 pl-2.5' : 'right-0 pr-2.5'
                    }`}
                    title="Clear filter"
                    id="ifc-tree-search-clear-btn"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Material Library Collapsible Panel */}
            <div className="bg-[#141414] border-b border-[#2d2d2d]" id="quick-material-library-section">
              <button
                onClick={() => setIsMaterialLibraryOpen(!isMaterialLibraryOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider bg-[#181818] hover:bg-[#202020] transition border-b border-[#222]"
                id="quick-material-library-toggle"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  Quick Material Library
                </span>
                <span className="text-[8px] bg-blue-950 text-blue-300 border border-blue-900/40 px-1 py-0.2 rounded font-mono">
                  {isMaterialLibraryOpen ? 'COLLAPSE' : 'EXPAND'}
                </span>
              </button>

              {isMaterialLibraryOpen && (
                <div className="p-2.5 space-y-2.5" id="quick-material-library-content">
                  <div className="text-[8.5px] text-neutral-500 leading-normal font-sans">
                    💡 <strong className="text-neutral-300">Drag & Drop:</strong> Drag any material swatch and drop it directly onto any node in the model tree. <br />
                    ⚡ <strong className="text-neutral-300">Click to Batch Apply:</strong> Set the click scope below, then click a swatch to apply.
                  </div>

                  {/* Click Scope Selector */}
                  <div className="space-y-1 bg-[#1a1a1a] p-1.5 rounded border border-[#2d2d2d]" id="batch-scope-selector">
                    <div className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                      Click Application Target Scope:
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => setBatchTarget('selected')}
                        className={`py-1 px-1 rounded text-[8px] font-mono font-bold border transition cursor-pointer text-center ${
                          batchTarget === 'selected'
                            ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                            : 'bg-[#121212] border-[#222] text-neutral-500 hover:text-neutral-300'
                        }`}
                        title="Apply material to only the currently selected element"
                      >
                        🎯 Single Selected
                      </button>
                      <button
                        onClick={() => setBatchTarget('type')}
                        className={`py-1 px-1 rounded text-[8px] font-mono font-bold border transition cursor-pointer text-center ${
                          batchTarget === 'type'
                            ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                            : 'bg-[#121212] border-[#222] text-neutral-500 hover:text-neutral-300'
                        }`}
                        title={selectedElement ? `Apply to all ${selectedElement.type} elements` : 'Apply to all of same type (Select an element first)'}
                        disabled={!selectedElement}
                      >
                        📦 Same Type {selectedElement ? `(${selectedElement.type.replace('Ifc', '')})` : ''}
                      </button>
                      <button
                        onClick={() => setBatchTarget('descendants')}
                        className={`py-1 px-1 rounded text-[8px] font-mono font-bold border transition cursor-pointer text-center ${
                          batchTarget === 'descendants'
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                            : 'bg-[#121212] border-[#222] text-neutral-500 hover:text-neutral-300'
                        }`}
                        title={selectedElement ? `Apply to ${selectedElement.name} and all its children recursively` : 'Apply to branch hierarchy (Select an element first)'}
                        disabled={!selectedElement}
                      >
                        🌲 Branch Hierarchy
                      </button>
                    </div>
                  </div>

                  {/* Material Swatches Grid */}
                  <div className="grid grid-cols-4 gap-1.5" id="material-swatches-grid">
                    {SUPPORTED_MATERIALS.map((mat) => {
                      return (
                        <div
                          key={mat.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', mat.id);
                            // Visual cue for dragging
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onClick={() => handleBatchApplyMaterial(mat.id)}
                          className="group relative flex flex-col items-center bg-[#181818] hover:bg-[#202020] active:scale-95 border border-[#2d2d2d] hover:border-[#444] rounded p-1.5 cursor-grab active:cursor-grabbing transition text-center select-none"
                          title={`Click to batch-apply or Drag onto any tree node`}
                        >
                          <span className={`w-4 h-4 rounded-full ${mat.class} border border-white/10 shadow-inner flex items-center justify-center shrink-0 mb-1 group-hover:scale-110 transition`} />
                          <span className="text-[8.5px] font-sans font-medium text-neutral-300 group-hover:text-white truncate w-full">
                            {mat.label}
                          </span>
                        </div>
                      );
                    })}

                    {/* Reset Button */}
                    <button
                      onClick={() => handleBatchApplyMaterial('')}
                      className="flex flex-col items-center justify-center bg-[#221c1c] hover:bg-[#2c1c1c] active:scale-95 border border-rose-950/40 hover:border-rose-900 rounded p-1.5 transition text-center cursor-pointer text-rose-400 font-bold"
                      title="Clear overrides for selected scope"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mb-1 text-rose-500" />
                      <span className="text-[8.5px] font-sans font-bold">
                        Reset Scope
                      </span>
                    </button>
                  </div>
                </div>
              )}
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
                {filteredHierarchy ? (
                  <BimTreeNode
                    node={filteredHierarchy}
                    expandedNodes={expandedNodes}
                    toggleExpand={toggleExpand}
                    selectedElementId={selectedElementId}
                    onSelectElement={onSelectElement}
                    visibleElementIds={visibleElementIds}
                    onToggleVisibility={onToggleVisibility}
                    isRtl={isRtl}
                    annotations={annotations}
                    alwaysExpanded={!!filterText.trim()}
                    onUpdateElementMaterial={onUpdateElementMaterial}
                  />
                ) : (
                  <div className="text-center py-8 text-neutral-500 font-mono text-[9px]">
                    No elements match "{filterText}"
                  </div>
                )}
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

                  {/* 📝 ELEMENT ANNOTATIONS / NOTES */}
                  {onUpdateAnnotation && (
                    <div className="bg-[#191919] border border-amber-500/20 rounded p-2 space-y-1.5 mt-2 text-left" id="element-annotation-container">
                      <div className="text-[8.5px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-amber-400" /> Element Annotation Note
                        </span>
                        {annotations[selectedElement.id] && (
                          <span className="text-[7.5px] bg-amber-950/40 text-amber-300 px-1 py-0.2 rounded border border-amber-900/50">
                            Saved
                          </span>
                        )}
                      </div>
                      <div className="text-[8px] text-[#888] font-sans">
                        Attach design remarks, safety audit details, or structural notes to this BIM element:
                      </div>
                      <textarea
                        value={localNote}
                        onChange={(e) => setLocalNote(e.target.value)}
                        onBlur={() => onUpdateAnnotation(selectedElement.id, localNote)}
                        placeholder="e.g. Needs shear wall validation / checked during local audit."
                        rows={2}
                        className="w-full bg-[#0e0e0e] border border-[#2d2d2d] focus:border-amber-500/60 text-white text-[9px] font-mono p-1.5 rounded resize-none outline-none placeholder-[#444] transition-colors"
                      />
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <button
                          onClick={() => {
                            setLocalNote('');
                            onUpdateAnnotation(selectedElement.id, '');
                          }}
                          disabled={!annotations[selectedElement.id] && !localNote}
                          className="text-[8px] font-mono text-rose-400 hover:text-rose-300 disabled:opacity-30 disabled:pointer-events-none transition-colors bg-rose-950/10 hover:bg-rose-950/20 border border-rose-900/30 rounded px-1.5 py-0.5 cursor-pointer border-0"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => onUpdateAnnotation(selectedElement.id, localNote)}
                          disabled={(annotations[selectedElement.id] || '') === localNote.trim()}
                          className="text-[8px] font-mono text-amber-400 hover:text-amber-300 disabled:opacity-40 disabled:pointer-events-none transition-colors bg-amber-950/40 hover:bg-amber-950/60 border border-amber-900/50 rounded px-2 py-0.5 font-bold cursor-pointer flex items-center gap-1 border-0"
                        >
                          <Save className="w-2.5 h-2.5" /> Save Note
                        </button>
                      </div>
                    </div>
                  )}
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

        {/* TAB 4: QUANTITY SURVEYING & BILL OF QUANTITIES (BoQ) */}
        {activeTab === 'survey' && (() => {
          const rate = CURRENCY_MAP[currency].rate;
          const symbol = CURRENCY_MAP[currency].symbol;

          const formatCost = (val: number) => {
            return symbol + (val * rate).toLocaleString(undefined, { maximumFractionDigits: 0 });
          };

          const isOverBudget = takeoff.totalCost > budgetLimit;
          const selectedElement = selectedElementId 
            ? takeoff.measuredElements.find((el: any) => el.id === selectedElementId) 
            : null;

          // Filter elements for Ledger list
          const filteredBoqElements = takeoff.measuredElements.filter((el: any) => {
            if (!boqSearchText) return true;
            const search = boqSearchText.toLowerCase();
            return (
              el.id.toLowerCase().includes(search) ||
              el.name.toLowerCase().includes(search) ||
              el.type.toLowerCase().includes(search) ||
              el.material.toLowerCase().includes(search)
            );
          });

          return (
            <div className="p-3 space-y-4 flex-1 flex flex-col min-h-0 bg-[#111]">
              
              {/* Header of Survey Tab */}
              <div className="flex items-center justify-between shrink-0">
                <div className="font-mono text-[9px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-400" /> Bill of Quantities
                </div>
                <button
                  onClick={handleExportBoQReport}
                  className="text-[8px] font-mono text-amber-400 bg-amber-950/20 border border-amber-900 hover:bg-amber-900/30 px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-1 shrink-0"
                >
                  <Download className="w-2.5 h-2.5" /> EXPORT FULL BoQ
                </button>
              </div>

              {/* DRAWING CONTEXT MODE (2D vs 3D INDICATOR) */}
              <div className={`p-2 rounded border flex items-center justify-between gap-2 shrink-0 ${
                is2DDrawingView 
                  ? 'bg-amber-950/15 border-amber-900/40 text-amber-300' 
                  : 'bg-blue-950/15 border-blue-900/40 text-blue-300'
              }`}>
                <div className="flex items-center gap-1.5 font-mono text-[8.5px]">
                  {is2DDrawingView ? (
                    <>
                      <Ruler className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                      <div>
                        <span className="font-bold block uppercase tracking-wide">2D Drawing Takeoff Mode</span>
                        <span className="text-[#888] text-[7.5px]">Projection: {twoDProjection.toUpperCase()} VIEW ({twoDStyle} style)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />
                      <div>
                        <span className="font-bold block uppercase tracking-wide">3D BIM Takeoff Mode</span>
                        <span className="text-[#888] text-[7.5px]">Space: MODEL COORDINATES (LOD 400)</span>
                      </div>
                    </>
                  )}
                </div>
                {/* Fast toggle view mode button inside surveying to help coordinate */}
                <button
                  onClick={() => setIs2DDrawingView?.(!is2DDrawingView)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 font-mono text-[7px] cursor-pointer shrink-0"
                >
                  {is2DDrawingView ? 'Switch 3D' : 'Switch 2D'}
                </button>
              </div>

              {/* BIG COST & BUDGET STATUS CARD */}
              <div className={`bg-[#161616] border rounded p-2.5 space-y-2 relative overflow-hidden transition-all duration-300 shrink-0 ${
                isOverBudget ? 'border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-[#2d2d2d]'
              }`}>
                {isOverBudget && (
                  <div className="absolute top-0 right-0 left-0 h-0.5 bg-rose-500 animate-pulse" />
                )}
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] text-[#666] font-mono uppercase block text-left">Estimated Contract Sum</span>
                    <span className={`text-base font-bold font-mono mt-0.5 block text-left ${isOverBudget ? 'text-rose-400' : 'text-amber-400'}`}>
                      {formatCost(takeoff.totalCost)}
                    </span>
                  </div>
                  
                  {/* Currency Selector */}
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] text-[#555] font-mono uppercase mb-0.5 flex items-center gap-0.5">
                      <Globe className="w-2.5 h-2.5" /> Currency
                    </span>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="bg-[#111] border border-[#2d2d2d] text-[#bbb] text-[8.5px] rounded px-1.5 py-0.5 cursor-pointer font-mono font-bold hover:border-[#444] transition focus:outline-none"
                    >
                      {Object.keys(CURRENCY_MAP).map((c) => (
                        <option key={c} value={c}>{CURRENCY_MAP[c as keyof typeof CURRENCY_MAP].label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subtotals Breakdown (Base vs Waste vs Markup) */}
                <div className="grid grid-cols-3 gap-1 border-t border-[#222]/50 pt-1.5 text-[8px] font-mono text-left">
                  <div>
                    <span className="text-[#555] block">Base Cost</span>
                    <span className="text-[#aaa] font-bold">{formatCost(takeoff.totalBaseCost)}</span>
                  </div>
                  <div>
                    <span className="text-[#555] block">Wastage ({wastageFactor}%)</span>
                    <span className="text-[#aaa] font-bold">+{formatCost(takeoff.totalWastageCost)}</span>
                  </div>
                  <div>
                    <span className="text-[#555] block">Markup ({markupFactor}%)</span>
                    <span className="text-[#aaa] font-bold">+{formatCost(takeoff.totalMarkupCost)}</span>
                  </div>
                </div>

                {/* Budget Limit Tracker */}
                <div className="border-t border-[#222]/50 pt-1.5 space-y-1">
                  <div className="flex justify-between items-center text-[8px] font-mono">
                    <span className="text-[#666]">Budget Limit:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#aaa] font-bold">{formatCost(budgetLimit)}</span>
                      <button
                        onClick={() => {
                          const val = prompt('Set custom budget limit:', String(budgetLimit));
                          if (val !== null) {
                            const num = parseFloat(val);
                            if (!isNaN(num)) setBudgetLimit(num);
                          }
                        }}
                        className="text-[7.5px] text-amber-500 hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        [EDIT]
                      </button>
                    </div>
                  </div>
                  
                  {/* Budget progress bar */}
                  <div className="w-full h-1.5 bg-[#252525] rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverBudget ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min((takeoff.totalCost / budgetLimit) * 100, 100)}%` }}
                    />
                  </div>

                  {isOverBudget && (
                    <div className="bg-rose-950/20 border border-rose-900/30 rounded p-1.5 text-[8px] text-rose-300 font-sans leading-relaxed text-left animate-pulse mt-1">
                      <span className="font-bold flex items-center gap-0.5 text-rose-400">
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" /> BUDGET EXCEEDED
                      </span>
                      <span>
                        Over budget by <strong>{formatCost(takeoff.totalCost - budgetLimit)}</strong>. Cost-engineering advice: Swap concrete walls to timber partitions or reduce markup margins to return below cap.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* COLLAPSIBLE PARAMETERS & RATES PANEL */}
              <div className="bg-[#161616] border border-[#2d2d2d] rounded overflow-hidden shrink-0">
                <button
                  onClick={() => setIsRatesPanelOpen(!isRatesPanelOpen)}
                  className="w-full px-2 py-1.5 bg-[#1b1b1b] hover:bg-[#222] flex items-center justify-between font-mono text-[8.5px] text-[#aaa] transition border-0 cursor-pointer"
                >
                  <span className="font-bold flex items-center gap-1 text-left">
                    <Sliders className="w-3 h-3 text-[#888] shrink-0" /> Construction costing options
                  </span>
                  <span>{isRatesPanelOpen ? '▼ Hide' : '▶ Expand Rates'}</span>
                </button>

                {isRatesPanelOpen && (
                  <div className="p-2.5 space-y-3.5 border-t border-[#2d2d2d]">
                    
                    {/* Filter to visible only check */}
                    <div className="flex items-center justify-between font-mono text-[8.5px] text-[#888] bg-[#111] p-1.5 rounded border border-[#222]">
                      <span className="font-bold text-left">QS calculation mode:</span>
                      <button
                        onClick={() => setCostVisibleOnly(!costVisibleOnly)}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition border ${
                          costVisibleOnly
                            ? 'bg-amber-950/30 text-amber-400 border-amber-900/50'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}
                      >
                        {costVisibleOnly ? 'Visible Only' : 'Whole Model'}
                      </button>
                    </div>

                    {/* Wastage Slider */}
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between font-mono text-[8px] text-[#666]">
                        <span>Construction Wastage Factor:</span>
                        <span className="text-amber-400 font-bold">{wastageFactor}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={wastageFactor}
                        onChange={(e) => setWastageFactor(parseInt(e.target.value))}
                        className="w-full h-1 bg-[#252525] rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    {/* Markup Slider */}
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between font-mono text-[8px] text-[#666]">
                        <span>Contractor Overhead & Markup:</span>
                        <span className="text-amber-400 font-bold">{markupFactor}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={markupFactor}
                        onChange={(e) => setMarkupFactor(parseInt(e.target.value))}
                        className="w-full h-1 bg-[#252525] rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    {/* Live Unit Rates Input Tables */}
                    <div className="space-y-1.5 pt-1.5 border-t border-[#222]/30 text-left">
                      <span className="text-[7.5px] font-mono uppercase text-[#666] tracking-wider block font-bold">Standard Base Unit Pricing Rates:</span>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[8px]">
                        {Object.keys(customRates).map((mat) => {
                          const rateUnit = mat === 'steel' ? 't' : (mat === 'drywall' || mat === 'glass' ? 'm²' : 'm³');
                          return (
                            <div key={mat} className="flex flex-col gap-1 bg-[#1a1a1a] p-1.5 border border-[#2d2d2d] rounded">
                              <span className="capitalize text-[#888] font-bold">{mat}:</span>
                              <div className="flex items-center gap-0.5">
                                <span className="text-[#555]">{symbol}</span>
                                <input
                                  type="number"
                                  value={Math.round(customRates[mat] * rate)}
                                  onChange={(e) => {
                                    const numVal = parseFloat(e.target.value);
                                    if (!isNaN(numVal)) {
                                      setCustomRates(prev => ({
                                        ...prev,
                                        [mat]: numVal / rate
                                      }));
                                    }
                                  }}
                                  className="bg-[#111] border border-[#333] text-white px-1 py-0.2 rounded w-16 text-[8px] focus:outline-none focus:border-amber-500 font-bold"
                                />
                                <span className="text-[#555]">/{rateUnit}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SELECTED ELEMENT SURVEY INSPECTOR */}
              <div className="bg-[#161616] border border-[#2d2d2d] rounded p-2.5 space-y-2 shrink-0">
                <div className="text-[8px] font-mono text-[#888] font-bold uppercase tracking-wider flex items-center gap-1 border-b border-[#222] pb-1.5">
                  <Ruler className="w-2.5 h-2.5 text-amber-400 shrink-0" /> Survey Measurement Inspector
                </div>

                {selectedElement ? (
                  <div className="space-y-2 text-[8.5px] font-mono text-left" id="survey-inspector">
                    <div className="flex justify-between items-start gap-1">
                      <div className="max-w-[170px] truncate">
                        <span className="text-white font-bold block truncate">{selectedElement.name}</span>
                        <span className="text-[#666] text-[7.5px] block mt-0.5">ID: {selectedElement.id} • Class: {selectedElement.type}</span>
                      </div>
                      <span className={`px-1.5 py-0.2 rounded text-[7.5px] uppercase font-bold border shrink-0 ${
                        selectedElement.visible 
                          ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' 
                          : 'bg-rose-950/20 text-rose-400 border-rose-900/40 animate-pulse'
                      }`}>
                        {selectedElement.visible ? 'VISIBLE' : 'HIDDEN'}
                      </span>
                    </div>

                    {/* Physical/Geometric Survey Specifications */}
                    <div className="grid grid-cols-2 gap-1 bg-[#1a1a1a] p-1.5 rounded border border-[#222] text-[#aaa]">
                      <div>Vol. Displacement: <strong className="text-white">{selectedElement.volume.toFixed(2)} m³</strong></div>
                      <div>Surface Area: <strong className="text-white">{selectedElement.area.toFixed(1)} m²</strong></div>
                      <div>Element Height: <strong className="text-white">{selectedElement.height.toFixed(2)} m</strong></div>
                      <div>Material Weight: <strong className="text-white">{selectedElement.weight.toFixed(2)} t</strong></div>
                    </div>

                    {/* Material Override directly inside inspector */}
                    <div className="flex items-center justify-between bg-[#111] p-1.5 rounded border border-[#222]">
                      <span className="text-[#666] font-bold">Surveyed Material:</span>
                      <select
                        value={selectedElement.matKey}
                        onChange={(e) => onUpdateElementMaterial?.(selectedElement.id, e.target.value)}
                        className="bg-[#161616] border border-[#333] text-amber-400 text-[8px] rounded px-1.5 py-0.5 cursor-pointer font-bold focus:outline-none"
                      >
                        <option value="concrete">Concrete</option>
                        <option value="drywall">Drywall</option>
                        <option value="wood">Oak Wood</option>
                        <option value="steel">Steel</option>
                        <option value="glass">Glass</option>
                        <option value="gold">Brass/Gold</option>
                        <option value="brick">Brick Red</option>
                      </select>
                    </div>

                    {/* Takeoff calculations and formulas */}
                    <div className="space-y-1 p-1.5 bg-amber-950/10 border border-amber-900/20 rounded">
                      <div className="text-[7.5px] text-amber-500 font-bold uppercase tracking-wide">QUANTITY SURVEY FORMULA:</div>
                      <code className="text-amber-400 text-[8.5px] block py-0.5 font-bold leading-tight font-mono">{selectedElement.formula}</code>
                      <div className="flex justify-between items-center text-[8px] text-[#888] border-t border-amber-900/20 pt-1 mt-1 leading-normal">
                        <span>Base Cost: {formatCost(selectedElement.baseCost)}</span>
                        <span>Waste: +{formatCost(selectedElement.wastageCost)}</span>
                        <span>Markup: +{formatCost(selectedElement.markupCost)}</span>
                      </div>
                    </div>

                    {/* Final Cost Highlight */}
                    <div className="flex justify-between items-center bg-[#201b13] border border-amber-500/20 p-2 rounded">
                      <span className="text-amber-400 font-bold uppercase text-[8px]">ITEMIZED SURVEY TOTAL</span>
                      <span className="text-amber-300 font-bold text-xs">{formatCost(selectedElement.finalCost)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-[#111] rounded border border-dashed border-[#2d2d2d] flex flex-col items-center justify-center p-2 text-left">
                    <Ruler className="w-5 h-5 text-[#444] mb-1 animate-pulse shrink-0" />
                    <span className="text-[8px] font-bold text-[#666] uppercase tracking-wide block">Inspector Idle</span>
                    <p className="text-[7.5px] text-[#444] mt-0.5 max-w-[180px] leading-relaxed text-center">
                      Select any slab, column, or wall in 2D blueprint or 3D viewer to audit its measured area, volume, mass, and pricing formula.
                    </p>
                  </div>
                )}
              </div>

              {/* BILL OF QUANTITIES SEARCHABLE LEDGER */}
              <div className="flex-1 flex flex-col min-h-[160px] max-h-[300px] bg-[#161616] border border-[#2d2d2d] rounded overflow-hidden">
                <div className="p-2 bg-[#1c1c1c] border-b border-[#2d2d2d] space-y-1.5 shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#aaa] flex items-center gap-1 text-left">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400 shrink-0" /> BoQ Ledger List ({filteredBoqElements.length} items)
                    </span>
                    {boqSearchText && (
                      <button
                        onClick={() => setBoqSearchText('')}
                        className="text-[7px] text-[#666] hover:text-[#aaa] border-0 bg-transparent cursor-pointer font-mono"
                      >
                        [CLEAR]
                      </button>
                    )}
                  </div>
                  
                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-1.5 top-1.5 text-[#555] shrink-0" />
                    <input
                      type="text"
                      placeholder="Filter by ID, Name, Material or Class..."
                      value={boqSearchText}
                      onChange={(e) => setBoqSearchText(e.target.value)}
                      className="w-full bg-[#111] border border-[#2d2d2d] rounded pl-5.5 pr-2 py-1 text-[8px] text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Ledger Body */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#222] min-h-0 text-left" id="boq-ledger-body">
                  {filteredBoqElements.length > 0 ? (
                    filteredBoqElements.map((el) => {
                      const isSelected = selectedElementId === el.id;
                      return (
                        <div
                          key={el.id}
                          onClick={() => onSelectElement(el.id)}
                          className={`p-2 transition-all cursor-pointer font-mono text-[8.5px] hover:bg-[#252525]/40 flex justify-between items-center ${
                            isSelected 
                              ? 'bg-amber-950/15 border-l-2 border-amber-500 text-white font-bold' 
                              : 'text-[#aaa]'
                          }`}
                        >
                          <div className="space-y-0.5 truncate pr-2 max-w-[160px] text-left">
                            <div className="flex items-center gap-1">
                              <span className="text-amber-500 font-bold font-mono">{el.id}</span>
                              <span className="text-[#555] font-normal">•</span>
                              <span className="text-white truncate">{el.name}</span>
                            </div>
                            <div className="text-[#555] text-[7.5px] flex items-center gap-1">
                              <span>{el.type}</span>
                              <span>•</span>
                              <span className="text-amber-500/50">{el.material}</span>
                              <span>•</span>
                              <span>{el.unit === 'tonnes' ? `${el.weight.toFixed(1)} t` : (el.unit === 'm²' ? `${el.area.toFixed(0)} m²` : `${el.volume.toFixed(1)} m³`)}</span>
                            </div>
                          </div>
                          <span className={`font-bold font-mono ${isSelected ? 'text-amber-300' : 'text-amber-500/80'}`}>
                            {formatCost(el.finalCost)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-[8px] text-[#444] font-mono">
                      No matching BoQ ledger items found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

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
          <div className="p-3 space-y-3 flex-1 flex flex-col min-h-0 bg-[#111]">
            <div className="text-rose-400 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-between" id="clash-header-row">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> AI Clash Detection Core
              </span>
              <span className="text-[8.5px] text-[#666] font-normal">
                {filteredClashes.length} / {clashes.length} listed
              </span>
            </div>

            <p className="text-[9px] text-[#666] leading-normal">
              Below is a list of physical intersections, architectural spatial conflicts, or safety clearance clashes identified in this model:
            </p>

            {/* Filter Dropdown */}
            <div className="flex items-center justify-between gap-2 bg-[#161616] border border-[#2d2d2d] rounded-md p-1.5" id="clash-filter-row">
              <span className="text-[8px] font-mono font-bold uppercase text-[#777] tracking-wider">Audit Filter</span>
              <select
                value={clashFilter}
                onChange={(e) => setClashFilter(e.target.value as 'all' | 'unresolved')}
                className="bg-[#1e1e1e] border border-[#2d2d2d] text-[#d1d1d1] text-[9.5px] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer font-medium"
                id="clash-filter-dropdown"
              >
                <option value="all">Show Resolved Clashes</option>
                <option value="unresolved">Only Unresolved Clashes</option>
              </select>
            </div>

            {/* Clash list */}
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {filteredClashes.map((c) => {
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
              {filteredClashes.length === 0 && (
                <div className="text-center py-6 text-[#555] font-mono text-[9px]">
                  {clashFilter === 'unresolved' 
                    ? 'All conflicts resolved! Excellent job.' 
                    : 'No active clashes found for custom uploaded models.'}
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
