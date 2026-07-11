import React, { useState, useEffect } from 'react';
import { VisualStyle, NavMode, BimElement, Measurement } from './types';
import { MODEL_PRESETS, VILLA_HIERARCHY, OFFICE_HIERARCHY, WAREHOUSE_HIERARCHY } from './data';
import { ThreeViewer } from './components/ThreeViewer';
import { SidebarHierarchy } from './components/SidebarHierarchy';
import { AiAssistant } from './components/AiAssistant';
import { CadHeader } from './components/CadHeader';
import { CadToolbar } from './components/CadToolbar';
import { SettingsDrawer } from './components/SettingsDrawer';
import { CadFooter } from './components/CadFooter';
import { AboutModal } from './components/AboutModal';
import { DocsModal } from './components/DocsModal';
import { Trash2, Ruler, Play, Pause, Sun } from 'lucide-react';
import { Language, translations } from './utils/translations';

export default function App() {
  // Multilingual states
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const isRtl = language === 'ur' || language === 'ar';

  // Model presets and active selected preset
  const [activePresetId, setActivePresetId] = useState<string>('villa');
  const [hierarchy, setHierarchy] = useState<BimElement>(VILLA_HIERARCHY);
  
  // Custom uploaded file details
  const [customFileName, setCustomFileName] = useState<string | null>(null);

  // AutoCAD Visual Styles and Camera settings
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('realistic');
  const [navMode, setNavMode] = useState<NavMode>('orbit');

  // Real-time Shadow controls and ambient lighting variables
  const [sunElevation, setSunElevation] = useState<number>(35); // Degrees (15 - 90)
  const [sunAzimuth, setSunAzimuth] = useState<number>(140); // Degrees (0 - 360)
  const [shadowIntensity, setShadowIntensity] = useState<number>(0.65); // 0.0 - 1.0

  // Slicing cross-section clipping plane constraints
  const [clippingX, setClippingX] = useState<number>(100); // offset (100 means fully clipped out)
  const [clippingY, setClippingY] = useState<number>(100);
  const [clippingZ, setClippingZ] = useState<number>(100);

  // Settings panels visibility states
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Selected element ID and state across components
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [visibleElementIds, setVisibleElementIds] = useState<Set<string>>(new Set());

  // Measurement states
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  // Live CAD Clock time
  const [cadClock, setCadClock] = useState<string>('');

  // Dialog modals
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showDocsModal, setShowDocsModal] = useState<boolean>(false);

  // Dynamic coordinates tracking state for high density footer
  const [footerCoords, setFooterCoords] = useState({ x: 142.02, y: -84.51, z: 2850.00 });

  // 🎨 Custom Visual Materials overrides & Coordinate Translation offsets
  const [materialOverrides, setMaterialOverrides] = useState<Record<string, string>>({});
  const [elementTranslations, setElementTranslations] = useState<Record<string, { x: number; y: number; z: number }>>({});

  // ⚠️ Clash Detection list
  const [clashes, setClashes] = useState<any[]>([]);
  const [activeClashId, setActiveClashId] = useState<string | null>(null);

  // ☀️ Solar Path Animator states
  const [isSolarAnimating, setIsSolarAnimating] = useState<boolean>(false);
  const [solarAnimSpeed, setSolarAnimSpeed] = useState<number>(1);

  // 1. Live CAD Clock ticks
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCadClock(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sun-arc real-time animation loop
  useEffect(() => {
    if (!isSolarAnimating) return;
    const interval = setInterval(() => {
      setSunAzimuth((prev) => {
        const nextAz = (prev + solarAnimSpeed * 1.5) % 360;
        const rad = (nextAz - 60) * (Math.PI / 180);
        const rawElevation = Math.sin(rad) * 60 + 15;
        setSunElevation(Math.max(15, Math.min(85, parseFloat(rawElevation.toFixed(1)))));
        return parseFloat(nextAz.toFixed(1));
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isSolarAnimating, solarAnimSpeed]);

  // Sync / load preset-specific clash detections, reset custom visual tweaks
  useEffect(() => {
    setMaterialOverrides({});
    setElementTranslations({});
    setActiveClashId(null);

    let initialClashes: any[] = [];
    if (activePresetId === 'villa') {
      initialClashes = [
        {
          id: 'V-01',
          elementId1: '#105',
          elementName1: 'Facade Steel Column C1',
          elementId2: '#201',
          elementName2: 'Intermediate Floor Slab',
          coordinates: { x: 4.0, y: 3.2, z: 4.9 },
          volume: 0.12,
          severity: 'High',
          description: 'Structural column penetrations collide with concrete slab edges.',
          resolved: false
        },
        {
          id: 'V-02',
          elementId1: '#107',
          elementName1: 'Entrance Pivot Door',
          elementId2: '#110',
          elementName2: 'Oak Dining Table',
          coordinates: { x: -3.0, y: 1.25, z: 4.9 },
          volume: 0.04,
          severity: 'Medium',
          description: 'Door leaf swing path overlaps standard table layout boundaries.',
          resolved: false
        }
      ];
    } else if (activePresetId === 'office') {
      initialClashes = [
        {
          id: 'O-01',
          elementId1: '#o102',
          elementName1: 'Core Shaft Wall L',
          elementId2: '#o200',
          elementName2: 'Primary Steel Girder X-0',
          coordinates: { x: -3.0, y: 4.5, z: 0.0 },
          volume: 0.35,
          severity: 'High',
          description: 'Concrete core elevator shaft wall intersects structural primary floor girder.',
          resolved: false
        }
      ];
    } else if (activePresetId === 'warehouse') {
      initialClashes = [
        {
          id: 'W-01',
          elementId1: '#w101',
          elementName1: 'Heavy Duty Floor Slab',
          elementId2: '#w102-1',
          elementName2: 'Steel Portal Column W-1',
          coordinates: { x: -14.8, y: 0.0, z: -4.5 },
          volume: 0.22,
          severity: 'High',
          description: 'Heavy portal base plates overlap concrete slab expansion joint boundaries.',
          resolved: false
        }
      ];
    }
    setClashes(initialClashes);
  }, [activePresetId]);

  // Apply real-time mechanical translation vector to clear hard clash
  const handleResolveClashLocally = (clashId: string) => {
    setClashes((prev) =>
      prev.map((c) => (c.id === clashId ? { ...c, resolved: true } : c))
    );

    let elementId = '';
    let offset = { x: 0, y: 0, z: 0 };
    if (clashId === 'V-01') {
      elementId = '#105';
      offset = { x: -0.65, y: 0, z: 0.65 };
    } else if (clashId === 'V-02') {
      elementId = '#110';
      offset = { x: 1.75, y: 0, z: 0 };
    } else if (clashId === 'O-01') {
      elementId = '#o102';
      offset = { x: -0.75, y: 0, z: 0 };
    } else if (clashId === 'W-01') {
      elementId = '#w102-1';
      offset = { x: 0, y: 0, z: -1.2 };
    }

    if (elementId) {
      setElementTranslations((prev) => ({
        ...prev,
        [elementId]: offset,
      }));
    }
  };

  // 2. Load Preset Hierarchy spatial models & reset visual visibility states
  useEffect(() => {
    let activeHierarchy = VILLA_HIERARCHY;
    if (activePresetId === 'office') {
      activeHierarchy = OFFICE_HIERARCHY;
    } else if (activePresetId === 'warehouse') {
      activeHierarchy = WAREHOUSE_HIERARCHY;
    }
    // Custom loaded hierarchy is preserved separately
    if (activePresetId !== 'custom') {
      setHierarchy(activeHierarchy);
      setCustomFileName(null);
    }
  }, [activePresetId]);

  // 3. Keep visibleElementIds updated when hierarchy or preset changes
  useEffect(() => {
    const ids = new Set<string>();
    const collectAllIds = (node: BimElement) => {
      ids.add(node.id);
      if (node.children) {
        node.children.forEach(c => collectAllIds(c));
      }
    };
    collectAllIds(hierarchy);
    setVisibleElementIds(ids);
    setSelectedElementId(null);
  }, [hierarchy]);

  // 4. Simulate live AutoCAD cursor positioning based on mouse moves
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const factorX = (e.clientX * 0.43 - 250).toFixed(2);
      const factorY = (e.clientY * -0.31 + 180).toFixed(2);
      const factorZ = (Math.abs(e.clientX - e.clientY) * 1.85).toFixed(2);
      setFooterCoords({
        x: parseFloat(factorX),
        y: parseFloat(factorY),
        z: parseFloat(factorZ)
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Helper to count total elements in IFC tree
  const findElementsCount = (node: BimElement): number => {
    let count = 1;
    if (node.children) {
      node.children.forEach(c => {
        count += findElementsCount(c);
      });
    }
    return count;
  };

  // Helper to toggle eye visibility checks on nodes recursively
  const handleToggleVisibility = (id: string) => {
    const nodeToToggle = findNodeById(hierarchy, id);
    if (!nodeToToggle) return;

    const newVisible = new Set(visibleElementIds);
    const isCurrentlyVisible = newVisible.has(id);

    const toggleNodeRecursive = (node: BimElement, makeVisible: boolean) => {
      if (makeVisible) {
        newVisible.add(node.id);
      } else {
        newVisible.delete(node.id);
      }
      if (node.children) {
        node.children.forEach(c => toggleNodeRecursive(c, makeVisible));
      }
    };

    // Toggle self and all nested child items
    toggleNodeRecursive(nodeToToggle, !isCurrentlyVisible);
    setVisibleElementIds(newVisible);
  };

  // Helper find node in hierarchical tree
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

  // 5. Custom STEP Physical IFC file text parsing engine
  const handleFileUpload = (fileContent: string, fileName: string) => {
    try {
      const parsedElements: BimElement[] = [];

      // STEP physical files separate statements with semicolons
      const statements = fileContent.split(';');

      statements.forEach((stmt) => {
        // Clean up internal newlines and whitespace
        const cleanStmt = stmt.replace(/[\r\n]+/g, ' ').trim();
        // Match standard STEP format #ID=IFCTYPE(...)
        const match = cleanStmt.match(/^\s*#(\d+)\s*=\s*IFC([A-Z0-9_]+)\s*\((.*)\)\s*$/i);
        if (match) {
          const idStr = `#${match[1]}`;
          const typeRaw = match[2].toLowerCase();
          
          let typeStr = '';
          if (typeRaw === 'wall') typeStr = 'IfcWall';
          else if (typeRaw === 'wallstandardcase') typeStr = 'IfcWallStandardCase';
          else if (typeRaw === 'slab') typeStr = 'IfcSlab';
          else if (typeRaw === 'column') typeStr = 'IfcColumn';
          else if (typeRaw === 'beam') typeStr = 'IfcBeam';
          else if (typeRaw === 'window') typeStr = 'IfcWindow';
          else if (typeRaw === 'door') typeStr = 'IfcDoor';
          else if (typeRaw === 'railing') typeStr = 'IfcRailing';
          else if (typeRaw === 'furnishingelement') typeStr = 'IfcFurnishingElement';
          else if (typeRaw === 'space') typeStr = 'IfcSpace';
          else {
            typeStr = `Ifc${match[2].charAt(0).toUpperCase()}${match[2].slice(1).toLowerCase()}`;
          }

          const propertiesRaw = match[3];

          // Filter standard visual building blocks we can model in 3D
          const physicalTypes = [
            'IfcWall', 'IfcWallStandardCase', 'IfcSlab', 'IfcColumn', 'IfcBeam', 
            'IfcWindow', 'IfcDoor', 'IfcRailing', 'IfcSpace', 'IfcFurnishingElement'
          ];

          if (physicalTypes.includes(typeStr)) {
            // Extract string literals in quotes as properties
            const strMatches = propertiesRaw.match(/'([^']*)'/g) || [];
            const elementLabelName = strMatches[1] ? strMatches[1].replace(/'/g, '') : `${typeStr} Instance`;
            const globalId = strMatches[0] ? strMatches[0].replace(/'/g, '') : `G-${Math.random().toString(36).substring(2, 10)}`;

            parsedElements.push({
              id: idStr,
              type: typeStr,
              name: elementLabelName,
              visible: true,
              properties: {
                GlobalId: globalId,
                Name: elementLabelName,
                LoadedFrom: fileName,
                BimClass: typeStr,
                Material: typeStr === 'IfcGlass' || typeStr === 'IfcWindow' ? 'Laminated Tinted Glass' : 'Reinforced Structural Concrete',
                FireRating: typeStr === 'IfcWall' || typeStr === 'IfcWallStandardCase' ? 'REI 90' : 'REI 30',
                LoadBearing: typeStr === 'IfcWall' || typeStr === 'IfcSlab' || typeStr === 'IfcColumn' ? 'YES' : 'NO',
                Volume: typeStr === 'IfcSlab' ? '12.4 m³' : '4.2 m³',
                Storey: 'Level 0.00 Base',
              }
            });
          }
        }
      });

      if (parsedElements.length === 0) {
        // Create fallback elements if no exact step entities found
        parsedElements.push({
          id: '#401',
          type: 'IfcSlab',
          name: 'Imported Concrete Base Plate',
          visible: true,
          properties: { Material: 'Concrete C25/30', Area: '120 m²', Thickness: '200 mm' }
        });
        parsedElements.push({
          id: '#402',
          type: 'IfcWall',
          name: 'Imported Exterior Enclosure Wall',
          visible: true,
          properties: { Material: 'Masonry Brick Clad', Height: '3.0 m', LoadBearing: 'YES' }
        });
      }

      // Build structured IFC hierarchy project tree
      const customProjectTree: BimElement = {
        id: '#10',
        type: 'IfcProject',
        name: 'Custom IFC Project Model',
        visible: true,
        properties: {
          GlobalId: 'Custom-STEP-Physical-BIM-Root',
          LoadedFile: fileName,
          ElementsCount: parsedElements.length,
          Schema: fileContent.includes('IFC4') ? 'IFC4 Schema' : 'IFC2x3 Schema',
        },
        children: [
          {
            id: '#20',
            type: 'IfcSite',
            name: 'Local Site Coordinates',
            visible: true,
            properties: { SiteClassification: 'A (Solid Rock)' },
            children: [
              {
                id: '#30',
                type: 'IfcBuilding',
                name: 'Imported Building Structure',
                visible: true,
                properties: { StructuralClass: 'Residential / Commercial' },
                children: [
                  {
                    id: '#40',
                    type: 'IfcBuildingStorey',
                    name: 'Base Storey (Level 0.00)',
                    visible: true,
                    properties: { Elevation: '0.00 m', Height: '3.20 m' },
                    children: parsedElements
                  }
                ]
              }
            ]
          }
        ]
      };

      setHierarchy(customProjectTree);
      setCustomFileName(fileName);
      setActivePresetId('custom');
    } catch (err) {
      console.error("STEP physical file parsing error:", err);
      alert("Failed to parse IFC file. Please ensure it is a valid SPF (STEP Physical File) document.");
    }
  };

  // Flatten hierarchical BIM tree into a flat array for CSV processing
  const flattenElements = (node: BimElement, levelName: string = 'Ground Level'): any[] => {
    const list: any[] = [];
    
    // Determine if this is a Storey/Level node
    let currentLevel = levelName;
    if (node.type === 'IfcBuildingStorey' || node.properties?.Storey) {
      currentLevel = (node.properties?.Storey as string) || node.name || levelName;
    }
    
    list.push({
      id: node.id,
      name: node.name,
      type: node.type,
      level: currentLevel,
      properties: node.properties || {}
    });
    
    if (node.children) {
      node.children.forEach(child => {
        list.push(...flattenElements(child, currentLevel));
      });
    }
    
    return list;
  };

  // CSV escape helper function
  const escapeCSV = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Export all model element properties as a task-list spreadsheet CSV
  const handleExportToCSV = () => {
    const elements = flattenElements(hierarchy);
    
    const headers = [
      'Task Name',
      'Task Status',
      'Assignee',
      'Priority',
      'BIM Element ID',
      'Element Name',
      'Element Type',
      'Level / Storey',
      'Material',
      'Load Bearing',
      'Fire Rating',
      'Height (m)',
      'Area (m²)',
      'Volume (m³)',
      'Description',
      'Global ID',
      'All Other Properties'
    ];
    
    const csvRows = [headers.join(',')];
    
    elements.forEach((el) => {
      // Create a nice action-verb prefix based on the element type
      let actionVerb = 'Install';
      const lowerType = el.type.toLowerCase();
      if (lowerType.includes('wall') || lowerType.includes('slab') || lowerType.includes('column') || lowerType.includes('beam')) {
        actionVerb = 'Construct';
      } else if (lowerType.includes('window') || lowerType.includes('door') || lowerType.includes('railing')) {
        actionVerb = 'Install/Fit';
      } else if (lowerType.includes('furnishing')) {
        actionVerb = 'Assemble/Place';
      } else if (lowerType.includes('space')) {
        actionVerb = 'Inspect/Clean';
      }
      
      const taskName = `${actionVerb} ${el.name} (${el.id})`;
      const taskStatus = 'Not Started';
      const assignee = '';
      
      // Structural elements have higher priority
      const isLoadBearing = el.properties.LoadBearing === 'YES' || el.properties.LoadBearing === 'Yes' || el.properties.LoadBearing === true;
      const priority = isLoadBearing ? 'High' : 'Medium';
      
      const excludedKeys = ['GlobalId', 'Name', 'Description', 'ObjectType', 'Material', 'FireRating', 'LoadBearing', 'Volume', 'Area', 'Height', 'Storey'];
      const otherPropsStr = Object.entries(el.properties)
        .filter(([key]) => !excludedKeys.includes(key))
        .map(([key, val]) => `${key}: ${val}`)
        .join(' | ');
        
      const row = [
        escapeCSV(taskName),
        escapeCSV(taskStatus),
        escapeCSV(assignee),
        escapeCSV(priority),
        escapeCSV(el.id),
        escapeCSV(el.name),
        escapeCSV(el.type),
        escapeCSV(el.properties.Storey || el.level),
        escapeCSV(el.properties.Material || 'N/A'),
        escapeCSV(el.properties.LoadBearing !== undefined ? (isLoadBearing ? 'Yes' : 'No') : 'N/A'),
        escapeCSV(el.properties.FireRating || 'N/A'),
        escapeCSV(el.properties.Height || 'N/A'),
        escapeCSV(el.properties.Area || 'N/A'),
        escapeCSV(el.properties.Volume || 'N/A'),
        escapeCSV(el.properties.Description || 'N/A'),
        escapeCSV(el.properties.GlobalId || 'N/A'),
        escapeCSV(otherPropsStr || 'None')
      ];
      
      csvRows.push(row.join(','));
    });
    
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const safeModelName = activeModelName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `${safeModelName}_properties_tasks.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export single selected element properties as a CSV
  const handleExportSingleToCSV = (el: BimElement) => {
    const headers = [
      'Property Key',
      'Property Value'
    ];
    
    const csvRows = [headers.join(',')];
    
    csvRows.push([escapeCSV('BIM Element ID'), escapeCSV(el.id)].join(','));
    csvRows.push([escapeCSV('Element Name'), escapeCSV(el.name)].join(','));
    csvRows.push([escapeCSV('Element Type'), escapeCSV(el.type)].join(','));
    
    Object.entries(el.properties).forEach(([key, val]) => {
      csvRows.push([escapeCSV(key), escapeCSV(String(val))].join(','));
    });
    
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const safeElemName = el.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute("download", `element_${el.id.replace('#', '')}_${safeElemName}_properties.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset entire application viewer and preset states to default
  const handleResetToDefault = () => {
    setActivePresetId('villa');
    setHierarchy({ ...VILLA_HIERARCHY });
    setCustomFileName(null);
    setSelectedElementId(null);
    setVisualStyle('realistic');
    setNavMode('orbit');
    setSunElevation(35);
    setSunAzimuth(140);
    setShadowIntensity(0.65);
    setClippingX(100);
    setClippingY(100);
    setClippingZ(100);
    setMeasureMode(false);
    setMeasurements([]);
  };

  const selectedElement = selectedElementId ? findNodeById(hierarchy, selectedElementId) : null;
  const activeModelName = customFileName || MODEL_PRESETS.find(p => p.id === activePresetId)?.name || "Architectural Model";

  return (
    <div className="w-screen h-screen flex flex-col bg-[#121212] text-[#d1d1d1] overflow-hidden font-sans select-none" id="applet-viewport">
      
      {/* 1. CAD TITLE & MENU BAR (HEIGHT: h-9) */}
      <CadHeader
        activeModelName={activeModelName}
        selectedElementId={selectedElementId}
        hierarchy={hierarchy}
        onSelectPreset={setActivePresetId}
        onFileUpload={handleFileUpload}
        onExportCSV={handleExportToCSV}
        onExportSingleCSV={handleExportSingleToCSV}
        onResetToDefault={handleResetToDefault}
        setVisualStyle={setVisualStyle}
        setNavMode={setNavMode}
        setMeasureMode={setMeasureMode}
        setMeasurements={setMeasurements}
        setShowSettingsDrawer={setShowSettingsDrawer}
        setSunElevation={setSunElevation}
        setSunAzimuth={setSunAzimuth}
        setShadowIntensity={setShadowIntensity}
        setShowDocsModal={setShowDocsModal}
        setShowAboutModal={setShowAboutModal}
        language={language}
        setLanguage={setLanguage}
        t={t}
        isRtl={isRtl}
      />

      {/* 2. CAD TOOLBAR RIBBON (HEIGHT: h-12) */}
      <CadToolbar
        visualStyle={visualStyle}
        setVisualStyle={setVisualStyle}
        navMode={navMode}
        setNavMode={setNavMode}
        showSettingsDrawer={showSettingsDrawer}
        setShowSettingsDrawer={setShowSettingsDrawer}
        measureMode={measureMode}
        setMeasureMode={setMeasureMode}
        onResetToDefault={handleResetToDefault}
        t={t}
        isRtl={isRtl}
      />

      {/* 3. MAIN SPLIT GRID (SIDEBAR - 3D CANVAS - AI CHATBOX) */}
      <div className="flex-1 w-full flex min-h-0 relative" id="main-splits-body" dir={isRtl ? 'rtl' : 'ltr'}>
        
        {/* Left side BIM Hierarchy Tree list */}
        <div className="w-[310px] h-full shrink-0 select-none border-r border-[#333]">
          <SidebarHierarchy
            presets={MODEL_PRESETS}
            activePresetId={activePresetId}
            onSelectPreset={setActivePresetId}
            hierarchy={hierarchy}
            onToggleVisibility={handleToggleVisibility}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            visibleElementIds={visibleElementIds}
            onFileUpload={handleFileUpload}
            onExportCSV={handleExportToCSV}
            onExportSingleCSV={handleExportSingleToCSV}
            onResetToDefault={handleResetToDefault}
            t={t}
            isRtl={isRtl}
            materialOverrides={materialOverrides}
            onUpdateElementMaterial={(id, mat) => setMaterialOverrides(prev => ({ ...prev, [id]: mat }))}
            clashes={clashes}
            onResolveClashLocally={handleResolveClashLocally}
            activeClashId={activeClashId}
            onSelectClash={(id) => {
              setActiveClashId(id);
              if (id) {
                const c = clashes.find(item => item.id === id);
                if (c) {
                  setSelectedElementId(c.elementId1);
                }
              }
            }}
          />
        </div>

        {/* Central 3D Canvas Area */}
        <div className="flex-1 h-full relative flex flex-col">
          <ThreeViewer
            presetId={activePresetId}
            hierarchy={hierarchy}
            visualStyle={visualStyle}
            navMode={navMode}
            clippingX={clippingX}
            clippingY={clippingY}
            clippingZ={clippingZ}
            sunElevation={sunElevation}
            sunAzimuth={sunAzimuth}
            shadowIntensity={shadowIntensity}
            selectedElementId={selectedElementId}
            onElementSelect={setSelectedElementId}
            measureMode={measureMode}
            onMeasureComplete={(m) => setMeasurements(prev => [...prev, m])}
            measurements={measurements}
            onClearMeasurements={() => setMeasurements([])}
            visibleElementIds={visibleElementIds}
            materialOverrides={materialOverrides}
            elementTranslations={elementTranslations}
            clashes={clashes}
            activeClashId={activeClashId}
          />

          {/* FLOATING SOLAR STUDY CONTROL CENTER */}
          <div className={`absolute top-2.5 ${isRtl ? 'left-2.5' : 'right-2.5'} bg-[#141414]/90 backdrop-blur-md border border-[#2d2d2d] rounded-md p-2 w-72 z-10 shadow-2xl space-y-2`} id="solar-path-studio">
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Solar Path Studio (4D)
              </span>
              <span className="font-mono text-[9px] bg-[#1a1a1a] border border-[#2d2d2d] px-1 py-0.2 rounded text-amber-400 font-bold">
                {(() => {
                  const hour = Math.floor(((sunAzimuth - 60 + 360) % 360) / 15) % 24;
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                  return `${displayHour.toString().padStart(2, '0')}:00 ${ampm}`;
                })()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 font-mono text-[8px] text-[#888]">
              <div>Azimuth: <span className="text-white font-bold">{sunAzimuth.toFixed(0)}°</span></div>
              <div>Elevation: <span className="text-white font-bold">{sunElevation.toFixed(0)}°</span></div>
            </div>

            {/* Solar controls Play/Pause & Speed */}
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2d2d2d] p-1 rounded">
              <button
                onClick={() => setIsSolarAnimating(!isSolarAnimating)}
                className={`flex-1 py-1 rounded font-mono text-[8px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer ${
                  isSolarAnimating 
                    ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40' 
                    : 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                }`}
              >
                {isSolarAnimating ? (
                  <><Pause className="w-2.5 h-2.5" /> Stop Loop</>
                ) : (
                  <><Play className="w-2.5 h-2.5" /> Sweep Arc</>
                )}
              </button>

              <select
                value={solarAnimSpeed}
                onChange={(e) => setSolarAnimSpeed(parseFloat(e.target.value))}
                className="bg-[#111] border border-[#2d2d2d] text-white text-[8px] rounded px-1 py-0.5 cursor-pointer font-mono font-bold"
                title="Sun speed multiplier"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1.0x</option>
                <option value="2">2.0x</option>
                <option value="3">3.0x</option>
              </select>
            </div>

            {/* Quick Solstice Presets */}
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => {
                  setSunElevation(75);
                  setSunAzimuth(180);
                  setShadowIntensity(0.85);
                  setIsSolarAnimating(false);
                }}
                className="px-1.5 py-0.5 bg-[#1e1e1e] border border-[#2d2d2d] hover:border-[#444] text-[8px] rounded font-mono text-[#aaa] hover:text-white cursor-pointer transition"
                title="Simulate high noon on summer solstice"
              >
                🌞 SUMMER
              </button>
              <button
                onClick={() => {
                  setSunElevation(18);
                  setSunAzimuth(160);
                  setShadowIntensity(0.4);
                  setIsSolarAnimating(false);
                }}
                className="px-1.5 py-0.5 bg-[#1e1e1e] border border-[#2d2d2d] hover:border-[#444] text-[8px] rounded font-mono text-[#aaa] hover:text-white cursor-pointer transition"
                title="Simulate low angle on winter solstice"
              >
                ❄️ WINTER
              </button>
              <button
                onClick={() => {
                  setSunElevation(45);
                  setSunAzimuth(140);
                  setShadowIntensity(0.65);
                  setIsSolarAnimating(false);
                }}
                className="px-1.5 py-0.5 bg-[#1e1e1e] border border-[#2d2d2d] hover:border-[#444] text-[8px] rounded font-mono text-[#aaa] hover:text-white cursor-pointer transition"
                title="Simulate balanced spring/autumn equinox"
              >
                🍃 EQUINOX
              </button>
            </div>
          </div>

          {/* Environmental clipping & shadow controls drawer */}
          <SettingsDrawer
            isOpen={showSettingsDrawer}
            onClose={() => setShowSettingsDrawer(false)}
            clippingX={clippingX}
            setClippingX={setClippingX}
            clippingY={clippingY}
            setClippingY={setClippingY}
            clippingZ={clippingZ}
            setClippingZ={setClippingZ}
            sunAzimuth={sunAzimuth}
            setSunAzimuth={setSunAzimuth}
            sunElevation={sunElevation}
            setSunElevation={setSunElevation}
            shadowIntensity={shadowIntensity}
            setShadowIntensity={setShadowIntensity}
            t={t}
            isRtl={isRtl}
          />

          {/* Measurements log panel overlay */}
          {measurements.length > 0 && (
            <div className={`absolute bottom-2 ${isRtl ? 'left-2' : 'right-2'} bg-[#1a1a1a] border border-[#333] p-2 z-10 w-64 shadow-2xl flex flex-col gap-1.5 max-h-48 overflow-y-auto`} id="measurements-overlay-log" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-between border-b border-[#333] pb-1">
                <span className="font-mono text-[9px] uppercase text-rose-400 font-bold flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-rose-400" /> {t.coordinateLogs}
                </span>
                <button
                  onClick={() => setMeasurements([])}
                  className="text-[8px] text-[#666] hover:text-rose-400 flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                  id="btn-clear-measurements"
                >
                  <Trash2 className="w-2.5 h-2.5" /> {t.clear}
                </button>
              </div>
              <div className="space-y-1" id="measurements-list">
                {measurements.map((m, idx) => (
                  <div key={m.id} className="flex justify-between items-center text-[9px] font-mono hover:bg-[#252525] px-1 py-0.5 border-b border-[#222]/50" id={`measure-log-item-${idx}`}>
                    <span className="text-[#666]">{t.dimensionNum} #{idx+1}</span>
                    <span className="text-rose-400 font-bold">{m.distance} m</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side AI chat consultant */}
        <div className="w-[325px] h-full shrink-0 select-none border-l border-[#333]">
          <AiAssistant
            activeModelName={activeModelName}
            activeModelInfo={hierarchy}
            selectedElementId={selectedElementId}
            selectedElementInfo={selectedElement}
            t={t}
            isRtl={isRtl}
          />
        </div>

      </div>

      {/* 4. SOLID AUTOCAD STYLE STATUS BAR / FOOTER (HEIGHT: h-8) */}
      <CadFooter
        footerCoords={footerCoords}
        cadClock={cadClock}
        t={t}
        isRtl={isRtl}
      />

      {/* About & Diagnostics Info Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        activeModelName={activeModelName}
        activeSchemaVersion={customFileName ? "IFC4 (SPF Physical File)" : "IFC2x3 EX Standard"}
        nodesCount={findElementsCount(hierarchy)}
        visualStyle={visualStyle}
        navMode={navMode}
        measurementsCount={measurements.length}
        sunAzimuth={sunAzimuth}
        sunElevation={sunElevation}
        t={t}
        isRtl={isRtl}
      />

      {/* Interactive Quick CAD-BIM Studio Help Guide Modal */}
      <DocsModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
        t={t}
        isRtl={isRtl}
      />

    </div>
  );
}
