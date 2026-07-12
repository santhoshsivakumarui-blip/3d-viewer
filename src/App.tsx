import React, { useState, useEffect, useRef } from 'react';
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
import { LearningHubModal } from './components/LearningHubModal';
import { ElectronModal } from './components/ElectronModal';
import { WasmLabModal } from './components/WasmLabModal';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { SessionRestoreModal } from './components/SessionRestoreModal';
import { Trash2, Ruler, Play, Pause, Sun } from 'lucide-react';
import { Language, translations } from './utils/translations';
import { usePersistentAnnotations } from './utils/usePersistentAnnotations';

export default function App() {
  // Multilingual states
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const isRtl = language === 'ur' || language === 'ar';

  // User annotations persistence
  const { annotations, updateAnnotation, clearAllAnnotations } = usePersistentAnnotations();

  // Model presets and active selected preset
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('archiview_activePresetId');
      return saved !== null ? saved : 'villa';
    } catch {
      return 'villa';
    }
  });
  const [hierarchy, setHierarchy] = useState<BimElement>(VILLA_HIERARCHY);
  
  // Custom uploaded file details
  const [customFileName, setCustomFileName] = useState<string | null>(null);

  // AutoCAD Visual Styles and Camera settings
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(() => {
    try {
      const saved = localStorage.getItem('archiview_visualStyle');
      return saved !== null ? (saved as VisualStyle) : 'realistic';
    } catch {
      return 'realistic';
    }
  });
  const [navMode, setNavMode] = useState<NavMode>('orbit');

  // Shared 2D Drawing & Projection Views state
  const [is2DDrawingView, setIs2DDrawingView] = useState<boolean>(false);
  const [twoDStyle, setTwoDStyle] = useState<'blueprint' | 'paper' | 'dark'>('blueprint');
  const [twoDProjection, setTwoDProjection] = useState<'top' | 'front' | 'side'>('top');

  // Real-time Shadow controls and ambient lighting variables
  const [sunElevation, setSunElevation] = useState<number>(35); // Degrees (15 - 90)
  const [sunAzimuth, setSunAzimuth] = useState<number>(140); // Degrees (0 - 360)
  const [shadowIntensity, setShadowIntensity] = useState<number>(0.65); // 0.0 - 1.0

  // Slicing cross-section clipping plane constraints
  const [clippingX, setClippingX] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('archiview_clippingX');
      return saved !== null ? Number(saved) : 100;
    } catch {
      return 100;
    }
  });
  const [clippingY, setClippingY] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('archiview_clippingY');
      return saved !== null ? Number(saved) : 100;
    } catch {
      return 100;
    }
  });
  const [clippingZ, setClippingZ] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('archiview_clippingZ');
      return saved !== null ? Number(saved) : 100;
    } catch {
      return 100;
    }
  });

  // Automatically persist selected parameters to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('archiview_activePresetId', activePresetId);
      localStorage.setItem('archiview_visualStyle', visualStyle);
      localStorage.setItem('archiview_clippingX', String(clippingX));
      localStorage.setItem('archiview_clippingY', String(clippingY));
      localStorage.setItem('archiview_clippingZ', String(clippingZ));
    } catch (e) {
      console.error('Failed to save parameters to localStorage:', e);
    }
  }, [activePresetId, visualStyle, clippingX, clippingY, clippingZ]);

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
  const [showLearningHubModal, setShowLearningHubModal] = useState<boolean>(false);
  const [showElectronModal, setShowElectronModal] = useState<boolean>(false);
  const [showWasmLabModal, setShowWasmLabModal] = useState<boolean>(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState<boolean>(false);

  // 💾 Auto-save and Workspace Recovery state variables
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [recoveredSessionData, setRecoveredSessionData] = useState<any | null>(null);

  // Ref to protect against automatic preset model loading/visual state resets when restoring
  const isRestoringSessionRef = useRef<boolean>(false);

  // Live 3D Interactive flight tour state
  const [activeTourStep, setActiveTourStep] = useState<{
    tourId: string;
    stepIndex: number;
    title: string;
    description: string;
  } | null>(null);

  const [activeTourSteps, setActiveTourSteps] = useState<any[] | null>(null);
  const [activeTourIndex, setActiveTourIndex] = useState<number>(0);
  const [tourPaused, setTourPaused] = useState<boolean>(false);
  const [tourCountdown, setTourCountdown] = useState<number>(6);

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
    if (isRestoringSessionRef.current) return;
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

  // Controllable Stateful Tour Loop
  useEffect(() => {
    if (!activeTourSteps) return;
    if (tourPaused) return;

    const timer = setInterval(() => {
      setTourCountdown((prev) => {
        if (prev <= 1) {
          // Time to advance!
          setActiveTourIndex((prevIdx) => {
            const nextIdx = prevIdx + 1;
            if (nextIdx < activeTourSteps.length) {
              const step = activeTourSteps[nextIdx];
              setActiveTourStep({
                tourId: activeTourStep?.tourId || '',
                stepIndex: nextIdx,
                title: step.title,
                description: step.description
              });
              step.action();
              return nextIdx;
            } else {
              // End of tour
              stopActiveTour();
              return 0;
            }
          });
          return 6; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTourSteps, tourPaused, activeTourIndex, activeTourStep]);

  const stopActiveTour = () => {
    setActiveTourStep(null);
    setActiveTourSteps(null);
    setActiveTourIndex(0);
    setTourPaused(false);
    setTourCountdown(6);
  };

  const runTourSequence = (tourId: string, steps: { title: string; description: string; action: () => void }[]) => {
    setActiveTourSteps(steps);
    setActiveTourIndex(0);
    setTourPaused(false);
    setTourCountdown(6);
    
    // Trigger first step action immediately
    setActiveTourStep({
      tourId,
      stepIndex: 0,
      title: steps[0].title,
      description: steps[0].description
    });
    steps[0].action();
  };

  const handlePrevTourStep = () => {
    if (!activeTourSteps || activeTourIndex <= 0) return;
    const prevIdx = activeTourIndex - 1;
    setActiveTourIndex(prevIdx);
    setTourCountdown(6);
    const step = activeTourSteps[prevIdx];
    setActiveTourStep({
      tourId: activeTourStep?.tourId || '',
      stepIndex: prevIdx,
      title: step.title,
      description: step.description
    });
    step.action();
  };

  const handleNextTourStep = () => {
    if (!activeTourSteps) return;
    const nextIdx = activeTourIndex + 1;
    if (nextIdx < activeTourSteps.length) {
      setActiveTourIndex(nextIdx);
      setTourCountdown(6);
      const step = activeTourSteps[nextIdx];
      setActiveTourStep({
        tourId: activeTourStep?.tourId || '',
        stepIndex: nextIdx,
        title: step.title,
        description: step.description
      });
      step.action();
    } else {
      stopActiveTour();
    }
  };

  const handleStartLiveTour = (tourId: string) => {
    // Stop any current solar animation
    setIsSolarAnimating(false);
    setActiveClashId(null);
    setSelectedElementId(null);

    // Hide the learning hub modal so the user can see the 3D model flying!
    setShowLearningHubModal(false);

    // Run custom sequence depending on the selected course
    if (tourId === 'nav-basics') {
      setNavMode('orbit');
      setVisualStyle('realistic');
      
      const steps = [
        {
          title: "1. Viewport Alignment",
          description: "Positioning camera automatically around the model envelope to audit secondary framework.",
          action: () => {
            window.dispatchEvent(new CustomEvent('archi-tour-command', {
              detail: { action: 'fly', x: 22, y: 15, z: 25, tx: 0, ty: 2, tz: 0 }
            }));
          }
        },
        {
          title: "2. Deep Zoom Analysis",
          description: "Scanning structural frames and concrete layout from a close-up perspective.",
          action: () => {
            window.dispatchEvent(new CustomEvent('archi-tour-command', {
              detail: { action: 'fly', x: 8, y: 5, z: 10, tx: 0, ty: 2, tz: 0 }
            }));
          }
        },
        {
          title: "3. Column Frame Detail",
          description: "Zooming in on the outer support pillars supporting the cantilever timber roof.",
          action: () => {
            window.dispatchEvent(new CustomEvent('archi-tour-command', {
              detail: { action: 'fly', x: -5, y: 3, z: 8, tx: -2, ty: 1, tz: 1 }
            }));
            setSelectedElementId('#105');
          }
        },
        {
          title: "4. Roof Trusses Inspection",
          description: "Adjusting pitch to audit structural roof beams and load paths from above.",
          action: () => {
            window.dispatchEvent(new CustomEvent('archi-tour-command', {
              detail: { action: 'fly', x: 12, y: 16, z: 12, tx: 0, ty: 4, tz: 0 }
            }));
            setSelectedElementId(null);
          }
        },
        {
          title: "5. Walkthrough Perspective",
          description: "Positioning camera at 1.8m architectural eye-level height inside the building space.",
          action: () => {
            setNavMode('walkthrough');
            window.dispatchEvent(new CustomEvent('archi-tour-command', {
              detail: { action: 'fly', x: 0, y: 1.8, z: 6, tx: 0, ty: 1.8, tz: -5 }
            }));
          }
        }
      ];

      runTourSequence('nav-basics', steps);
    } 
    else if (tourId === 'clash-detection') {
      setNavMode('orbit');
      setVisualStyle('xray'); // X-ray mode makes it super cool to view internal clashes

      const firstClashId = activePresetId === 'office' ? 'O-01' : 'V-01';
      const steps = [
        {
          title: "1. Sourcing Spatial Conflict",
          description: `Highlighting reported structural collision ID: ${firstClashId} in X-Ray translucent mode.`,
          action: () => {
            setActiveClashId(firstClashId);
          }
        },
        {
          title: "2. Visualizing Physical Overlap Volume",
          description: "Zooming into intersection point. The red dashed laser points to floor altitude target.",
          action: () => {
            const clashX = activePresetId === 'office' ? -3.0 : 4.0;
            const clashY = activePresetId === 'office' ? 4.5 : 3.2;
            const clashZ = activePresetId === 'office' ? 0.0 : 4.9;
            window.dispatchEvent(new CustomEvent('archi-tour-command', {
              detail: { action: 'fly', x: clashX + 4, y: clashY + 3, z: clashZ + 4, tx: clashX, ty: clashY, tz: clashZ }
            }));
          }
        },
        {
          title: "3. Resolving the Clash",
          description: "Marking structural intersection as approved and resolved under educational training codes.",
          action: () => {
            setClashes(prev => prev.map(c => c.id === firstClashId ? { ...c, resolved: true } : c));
          }
        }
      ];

      runTourSequence('clash-detection', steps);
    } 
    else if (tourId === 'solar-study') {
      setNavMode('orbit');
      setVisualStyle('realistic');
      
      const steps = [
        {
          title: "1. Activating Solar Study",
          description: "Opening environment shadow configuration. Azimuth set to 140 degrees, elevation 35.",
          action: () => {
            setSunElevation(35);
            setSunAzimuth(140);
            setShadowIntensity(0.85);
          }
        },
        {
          title: "2. Simulating Peak Summer Solstice",
          description: "Swerving sun elevation to 75 degrees representing high midday sun angles with short crisp shadows.",
          action: () => {
            setSunElevation(75);
            setSunAzimuth(180);
          }
        },
        {
          title: "3. Winter Solstice Long Shadows",
          description: "Lowering sun path to 18 degrees. Observe the deep casting shadows across the CAD baseline grid.",
          action: () => {
            setSunElevation(18);
            setSunAzimuth(130);
          }
        }
      ];

      runTourSequence('solar-study', steps);
    } 
    else if (tourId === 'ai-audits') {
      setNavMode('orbit');
      setVisualStyle('conceptual');

      const colId = activePresetId === 'office' ? '#o102' : '#105';
      const steps = [
        {
          title: "1. Locating Audit Element",
          description: `Selecting Concrete Column element ID: ${colId} inside the viewport.`,
          action: () => {
            setSelectedElementId(colId);
            const targetX = activePresetId === 'office' ? -3.0 : 4.0;
            const targetY = activePresetId === 'office' ? 4.5 : 3.2;
            const targetZ = activePresetId === 'office' ? 0.0 : 4.9;
            window.dispatchEvent(new CustomEvent('archi-tour-command', {
              detail: { action: 'fly', x: targetX + 5, y: targetY + 3, z: targetZ + 5, tx: targetX, ty: targetY, tz: targetZ }
            }));
          }
        },
        {
          title: "2. Connecting to Gemini AI Consultant",
          description: "Triggering a structural safety audit prompt to the right-side Gemini consultant panel.",
          action: () => {
            window.dispatchEvent(new CustomEvent('archi-ai-prompt', {
              detail: { prompt: `Conduct an exhaustive structural audit on active selected Concrete Column: ID is "${colId}". Describe typical safety factors, loading calculations, and shear stress warnings.` }
            }));
          }
        }
      ];

      runTourSequence('ai-audits', steps);
    }
  };

  // Cleanup active tour on unmount
  useEffect(() => {
    return () => {
      stopActiveTour();
    };
  }, []);

  // 2. Load Preset Hierarchy spatial models & reset visual visibility states
  useEffect(() => {
    if (isRestoringSessionRef.current) return;
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

  // 🔍 Startup check for previous autosaved workspace recovery snapshot
  useEffect(() => {
    try {
      const rawData = localStorage.getItem('archiview_autosave_data');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed && parsed.timestamp) {
          // Count override metrics to display inside the recovery dialog
          const materialCount = parsed.materialOverrides ? Object.keys(parsed.materialOverrides).length : 0;
          const translationCount = parsed.elementTranslations ? Object.keys(parsed.elementTranslations).length : 0;
          
          const countNodes = (node: BimElement): number => {
            let cnt = 1;
            if (node.children) {
              node.children.forEach(c => cnt += countNodes(c));
            }
            return cnt;
          };
          const nodesCount = parsed.hierarchy ? countNodes(parsed.hierarchy) : 0;
          const visibleCount = parsed.visibleElementIds ? parsed.visibleElementIds.length : 0;
          const hiddenCount = Math.max(0, nodesCount - visibleCount);

          setRecoveredSessionData({
            ...parsed,
            materialOverridesCount: materialCount,
            elementTranslationsCount: translationCount,
            hiddenElementsCount: hiddenCount,
            nodesCount: nodesCount
          });
          setShowRestoreModal(true);
        }
      }
    } catch (e) {
      console.error('Archiview: Failed to check for autosaved session:', e);
    }
  }, []);

  // 💾 Periodic Auto-save background task
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        // If restoring or modal is open, avoid overwriting with incomplete states
        if (isRestoringSessionRef.current || showRestoreModal) return;

        setAutoSaveStatus('saving');

        const saveData = {
          hierarchy,
          materialOverrides,
          elementTranslations,
          visibleElementIds: Array.from(visibleElementIds),
          activePresetId,
          customFileName,
          selectedElementId,
          visualStyle,
          clippingX,
          clippingY,
          clippingZ,
          sunElevation,
          sunAzimuth,
          shadowIntensity,
          clashes,
          activeClashId,
          timestamp: Date.now()
        };

        localStorage.setItem('archiview_autosave_data', JSON.stringify(saveData));

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        setLastAutoSaveTime(timeStr);

        setTimeout(() => {
          setAutoSaveStatus('saved');
        }, 600);

        // Reset status label to idle
        setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 2500);

      } catch (e) {
        console.error('Archiview: Auto-save checkpoint failed:', e);
        setAutoSaveStatus('idle');
      }
    }, 6000); // Checkpoint every 6 seconds

    return () => clearInterval(interval);
  }, [
    hierarchy,
    materialOverrides,
    elementTranslations,
    visibleElementIds,
    activePresetId,
    customFileName,
    selectedElementId,
    visualStyle,
    clippingX,
    clippingY,
    clippingZ,
    sunElevation,
    sunAzimuth,
    shadowIntensity,
    clashes,
    activeClashId,
    showRestoreModal
  ]);

  // 🟢 Action to restore previous workspace checkpoint
  const handleRestoreSession = () => {
    if (!recoveredSessionData) return;

    try {
      isRestoringSessionRef.current = true;

      if (recoveredSessionData.hierarchy) {
        setHierarchy(recoveredSessionData.hierarchy);
      }
      setCustomFileName(recoveredSessionData.customFileName || null);

      if (recoveredSessionData.activePresetId) {
        setActivePresetId(recoveredSessionData.activePresetId);
      }

      setMaterialOverrides(recoveredSessionData.materialOverrides || {});
      setElementTranslations(recoveredSessionData.elementTranslations || {});

      if (recoveredSessionData.visibleElementIds) {
        setVisibleElementIds(new Set(recoveredSessionData.visibleElementIds));
      }

      setSelectedElementId(recoveredSessionData.selectedElementId || null);

      if (recoveredSessionData.visualStyle) setVisualStyle(recoveredSessionData.visualStyle);
      if (recoveredSessionData.clippingX !== undefined) setClippingX(recoveredSessionData.clippingX);
      if (recoveredSessionData.clippingY !== undefined) setClippingY(recoveredSessionData.clippingY);
      if (recoveredSessionData.clippingZ !== undefined) setClippingZ(recoveredSessionData.clippingZ);
      if (recoveredSessionData.sunElevation !== undefined) setSunElevation(recoveredSessionData.sunElevation);
      if (recoveredSessionData.sunAzimuth !== undefined) setSunAzimuth(recoveredSessionData.sunAzimuth);
      if (recoveredSessionData.shadowIntensity !== undefined) setShadowIntensity(recoveredSessionData.shadowIntensity);

      if (recoveredSessionData.clashes) {
        setClashes(recoveredSessionData.clashes);
      }
      if (recoveredSessionData.activeClashId) {
        setActiveClashId(recoveredSessionData.activeClashId);
      }

      setShowRestoreModal(false);
      setRecoveredSessionData(null);

      // Reset the lock guard after all state updates batch and resolve
      setTimeout(() => {
        isRestoringSessionRef.current = false;
      }, 200);

    } catch (e) {
      console.error('Archiview: Failed to restore session:', e);
      isRestoringSessionRef.current = false;
    }
  };

  // 🔴 Action to discard previous workspace and start fresh
  const handleDiscardSession = () => {
    try {
      localStorage.removeItem('archiview_autosave_data');
      setShowRestoreModal(false);
      setRecoveredSessionData(null);
    } catch (e) {
      console.error('Archiview: Failed to discard session:', e);
    }
  };

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
    clearAllAnnotations();
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
        setShowLearningHubModal={setShowLearningHubModal}
        setShowElectronModal={setShowElectronModal}
        setShowWasmLabModal={setShowWasmLabModal}
        setShowPerformanceMonitor={setShowPerformanceMonitor}
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
            onBatchUpdateElementMaterials={(updates) => setMaterialOverrides(prev => ({ ...prev, ...updates }))}
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
            annotations={annotations}
            onUpdateAnnotation={updateAnnotation}
            is2DDrawingView={is2DDrawingView}
            setIs2DDrawingView={setIs2DDrawingView}
            twoDStyle={twoDStyle}
            setTwoDStyle={setTwoDStyle}
            twoDProjection={twoDProjection}
            setTwoDProjection={setTwoDProjection}
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
            is2DDrawingView={is2DDrawingView}
            setIs2DDrawingView={setIs2DDrawingView}
            twoDStyle={twoDStyle}
            setTwoDStyle={setTwoDStyle}
            twoDProjection={twoDProjection}
            setTwoDProjection={setTwoDProjection}
          />

          {/* HIGH-TECH CAD HOLOGRAPHIC HUD OVERLAY FOR TUTORIAL FLIGHT TOURS */}
          {activeTourStep && activeTourSteps && (
            <div className="absolute bottom-4 left-4 right-4 bg-[#141414]/95 backdrop-blur-md border border-amber-500/40 rounded-lg p-3.5 z-20 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-slide-up" id="hud-flight-simulation">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <div className="bg-[#1f1f1f] border border-amber-500/30 p-2.5 rounded text-amber-500">
                    <Play className={`w-5 h-5 ${tourPaused ? '' : 'animate-pulse'}`} />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">Live 3D Tour Mode</span>
                    <span className="h-3.5 w-[1px] bg-neutral-700" />
                    <span className="text-[10px] font-mono text-neutral-400">Step {activeTourIndex + 1} of {activeTourSteps.length}</span>
                    <span className="h-3.5 w-[1px] bg-neutral-700" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 border border-emerald-900/30 rounded">
                      {tourPaused ? '⏸️ PAUSED' : `⏱️ AUTO-ADVANCE: ${tourCountdown}s`}
                    </span>
                  </div>
                  <h4 className="text-sm font-sans font-bold text-white tracking-tight text-left">{activeTourStep.title}</h4>
                  <p className="text-xs text-neutral-300 max-w-xl font-sans text-left">{activeTourStep.description}</p>
                </div>
              </div>

              {/* FLIGHT ENGINE INTERACTIVE CONTROLS */}
              <div className="flex flex-wrap items-center gap-3 font-mono justify-end">
                {/* Telemetry info */}
                <div className="hidden lg:flex flex-col text-[8.5px] text-[#888] bg-[#1a1a1a] p-1.5 rounded border border-[#2d2d2d] leading-tight min-w-[120px] text-left">
                  <span>LATENCY: 1.2ms</span>
                  <span>AUTOCUT: ENABLED</span>
                  <span>CAM: [{(footerCoords.x + activeTourIndex * 4).toFixed(1)}, {(footerCoords.y - activeTourIndex * 2).toFixed(1)}, {(footerCoords.z + activeTourIndex * 15).toFixed(1)}]</span>
                </div>

                {/* Navigation Buttons Row */}
                <div className="flex items-center gap-1.5 bg-[#1c1c1c] p-1 rounded border border-[#333]">
                  <button
                    onClick={handlePrevTourStep}
                    disabled={activeTourIndex === 0}
                    className={`text-[10px] px-2.5 py-1 rounded transition border-0 font-bold ${
                      activeTourIndex === 0 
                        ? 'text-neutral-600 bg-neutral-900 cursor-not-allowed' 
                        : 'text-neutral-300 bg-[#2d2d2d] hover:bg-[#3d3d3d] cursor-pointer'
                    }`}
                    title="Previous Tour Step"
                  >
                    ◀ Prev
                  </button>

                  <button
                    onClick={() => setTourPaused(!tourPaused)}
                    className="text-[10px] px-2.5 py-1 rounded transition border-0 font-bold bg-[#2d2d2d] hover:bg-[#3d3d3d] text-amber-400 cursor-pointer"
                    title={tourPaused ? 'Resume auto-advance' : 'Pause auto-advance timer'}
                  >
                    {tourPaused ? '▶ Play' : '⏸ Pause'}
                  </button>

                  <button
                    onClick={handleNextTourStep}
                    disabled={activeTourIndex === activeTourSteps.length - 1}
                    className={`text-[10px] px-2.5 py-1 rounded transition border-0 font-bold ${
                      activeTourIndex === activeTourSteps.length - 1 
                        ? 'text-neutral-600 bg-neutral-900 cursor-not-allowed' 
                        : 'text-neutral-300 bg-[#2d2d2d] hover:bg-[#3d3d3d] cursor-pointer'
                    }`}
                    title="Skip to Next Tour Step"
                  >
                    Next ▶
                  </button>
                </div>
                
                <button
                  onClick={stopActiveTour}
                  className="bg-red-950 hover:bg-red-900 border border-red-500/50 hover:border-red-500 text-red-200 text-xs px-3.5 py-1.5 rounded transition cursor-pointer font-bold shrink-0"
                  id="btn-stop-flight-tour"
                >
                  Stop Tour
                </button>
              </div>
            </div>
          )}

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
        autoSaveStatus={autoSaveStatus}
        lastAutoSaveTime={lastAutoSaveTime}
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

      {/* 🎬 Interactive Video Demo & Certifications Learning Hub Modal */}
      <LearningHubModal
        isOpen={showLearningHubModal}
        onClose={() => setShowLearningHubModal(false)}
        onStartLiveTour={handleStartLiveTour}
        isRtl={isRtl}
        userEmail="santhosh.sivakumar.ui@gmail.com"
      />

      {/* 🖥️ Desktop App Mode (Electron) Integration Modal */}
      <ElectronModal
        isOpen={showElectronModal}
        onClose={() => setShowElectronModal(false)}
        isRtl={isRtl}
      />

      {/* ⚡ WebAssembly Performance Lab Modal */}
      <WasmLabModal
        isOpen={showWasmLabModal}
        onClose={() => setShowWasmLabModal(false)}
        isRtl={isRtl}
      />

      {/* 📊 Engine Performance Monitor Modal */}
      <PerformanceMonitor
        isOpen={showPerformanceMonitor}
        onClose={() => setShowPerformanceMonitor(false)}
        activeModelName={activeModelName}
        nodesCount={findElementsCount(hierarchy)}
        isRtl={isRtl}
      />

      {/* 💾 Session Restore Recovery Modal */}
      <SessionRestoreModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreSession}
        onDiscard={handleDiscardSession}
        savedData={recoveredSessionData || { activePresetId: 'villa', customFileName: null, timestamp: Date.now() }}
        isRtl={isRtl}
      />

    </div>
  );
}
