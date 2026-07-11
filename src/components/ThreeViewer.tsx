import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VisualStyle, NavMode, BimElement, Measurement, Clash } from '../types';
import { Ruler, Maximize2, Compass, Sun, ShieldAlert, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface ThreeViewerProps {
  presetId: string;
  hierarchy: BimElement;
  visualStyle: VisualStyle;
  navMode: NavMode;
  clippingX: number;
  clippingY: number;
  clippingZ: number;
  sunElevation: number;
  sunAzimuth: number;
  shadowIntensity: number;
  selectedElementId: string | null;
  onElementSelect: (id: string | null) => void;
  measureMode: boolean;
  onMeasureComplete?: (measurement: Measurement) => void;
  measurements: Measurement[];
  onClearMeasurements?: () => void;
  visibleElementIds: Set<string>;
  materialOverrides?: Record<string, string>;
  elementTranslations?: Record<string, { x: number; y: number; z: number }>;
  clashes?: Clash[];
  activeClashId?: string | null;
}

export const ThreeViewer: React.FC<ThreeViewerProps> = ({
  presetId,
  hierarchy,
  visualStyle,
  navMode,
  clippingX,
  clippingY,
  clippingZ,
  sunElevation,
  sunAzimuth,
  shadowIntensity,
  selectedElementId,
  onElementSelect,
  measureMode,
  onMeasureComplete,
  measurements,
  onClearMeasurements,
  visibleElementIds,
  materialOverrides = {},
  elementTranslations = {},
  clashes = [],
  activeClashId = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ThreeJS core references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const elementMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);

  // Clipping plane references
  const clipPlaneXRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100));
  const clipPlaneYRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, -1, 0), 100));
  const clipPlaneZRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, -1), 100));

  // Hover and selection state
  const [hoveredElementInfo, setHoveredElementInfo] = useState<{ id: string; type: string; name: string } | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Measurement drawing state
  const [measurementStart, setMeasurementStart] = useState<THREE.Vector3 | null>(null);
  const tempMeasureLineRef = useRef<THREE.Line | null>(null);
  const measurementGroupRef = useRef<THREE.Group | null>(null);
  const clashGroupRef = useRef<THREE.Group | null>(null);
  const clashPulseObjectRef = useRef<THREE.Mesh | null>(null);

  // Walkthrough navigation speed and movement state
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const cameraDirectionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const cameraUpRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0));

  // Materials Cache for switching Visual Styles
  const materialsCacheRef = useRef<Map<string, THREE.Material>>(new Map());

  // Sync navMode to a ref to prevent recreation of scene on mode switch
  const navModeRef = useRef(navMode);
  useEffect(() => {
    navModeRef.current = navMode;
  }, [navMode]);

  // Initialize Scene, Camera, Renderer, Controls
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 500;

    // 1. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#121212'); // Dark space resembling AutoCAD dark layout
    sceneRef.current = scene;

    // 2. Create Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(15, 12, 20);
    cameraRef.current = camera;

    // 3. Create WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enable Shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Enable local clipping
    renderer.localClippingEnabled = true;
    
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Allow slightly below horizon
    controls.minDistance = 2;
    controls.maxDistance = 150;
    controlsRef.current = controls;

    // 5. Add Grid & Axes Helpers (AutoCAD layout)
    const gridHelper = new THREE.GridHelper(80, 80, '#3a4454', '#202835');
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const axesHelper = new THREE.AxesHelper(10);
    // Position slightly above grid to prevent z-fighting
    axesHelper.position.set(0, 0.01, 0);
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // 6. Lights & Shadow Mapping Setup
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.4);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight('#ffffff', 1.2);
    directionalLight.position.set(15, 25, 10);
    directionalLight.castShadow = true;
    
    // Crisp shadow mapping bounds for building scale
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    
    const d = 25;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.bias = -0.0005;
    
    scene.add(directionalLight);
    directionalLightRef.current = directionalLight;

    // Add subtle helper dome light (HemisphereLight) for realistic sky ambiance
    const hemiLight = new THREE.HemisphereLight('#6782a1', '#232930', 0.3);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // Group for measurements
    const measurementGroup = new THREE.Group();
    scene.add(measurementGroup);
    measurementGroupRef.current = measurementGroup;

    // Group for clashes
    const clashGroup = new THREE.Group();
    scene.add(clashGroup);
    clashGroupRef.current = clashGroup;

    // 7. Resize Observer for fluid responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (rendererRef.current && cameraRef.current) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    });
    resizeObserver.observe(containerRef.current);

    // Keyboard controls for First Person Walkthrough
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 8. Animation & Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // 1. Walkthrough camera translation logic
      if (navModeRef.current === 'walkthrough' && cameraRef.current) {
        const delta = clock.getDelta();
        const speed = 6.0; // Units per second
        const moveVector = new THREE.Vector3();
        
        // Get camera horizontal direction
        cameraRef.current.getWorldDirection(cameraDirectionRef.current);
        const direction = cameraDirectionRef.current.clone();
        direction.y = 0; // lock to floor plan horizontal plane
        direction.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(direction, cameraUpRef.current).normalize();

        if (keysPressedRef.current['w'] || keysPressedRef.current['arrowup']) {
          moveVector.add(direction);
        }
        if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) {
          moveVector.sub(direction);
        }
        if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) {
          moveVector.add(right);
        }
        if (keysPressedRef.current['a'] || keysPressedRef.current['arrowleft']) {
          moveVector.sub(right);
        }
        if (keysPressedRef.current['e']) {
          moveVector.y += 1; // Rise up
        }
        if (keysPressedRef.current['q']) {
          moveVector.y -= 1; // Lower down
        }

        if (moveVector.lengthSq() > 0) {
          moveVector.normalize().multiplyScalar(speed * delta);
          
          // Collision containment limits (keep user walking on floor level height boundaries)
          const newPos = cameraRef.current.position.clone().add(moveVector);
          
          // Keep above ground grid level safely
          if (newPos.y < 1.2) newPos.y = 1.2;
          if (newPos.y > 20) newPos.y = 20;
          if (Math.abs(newPos.x) < 40 && Math.abs(newPos.z) < 40) {
            cameraRef.current.position.copy(newPos);
          }
        }
      } else {
        // Orbit mode standard damping updates
        if (controlsRef.current) {
          controlsRef.current.update();
        }
      }

      // 2. Refresh Sun shadow camera position in tandem with the light vector
      if (directionalLightRef.current && sceneRef.current && cameraRef.current) {
        // Anchor the shadow maps around camera focal lookAt point
        const target = controlsRef.current?.target || new THREE.Vector3(0, 2, 0);
        directionalLightRef.current.target.position.copy(target);
      }

      // 3. Pulse the 3D clash indicator holographic mesh
      if (clashPulseObjectRef.current) {
        const time = clock.getElapsedTime();
        const pulseScale = 1.0 + Math.sin(time * 8) * 0.12;
        clashPulseObjectRef.current.scale.set(pulseScale, pulseScale, pulseScale);
        
        const mat = clashPulseObjectRef.current.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = 0.35 + Math.sin(time * 8) * 0.15;
        }
      }

      // 4. Final Canvas Redraw
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Cleanups
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      materialsCacheRef.current.forEach((m) => m.dispose());
    };
  }, []);

  // Update Navigation Mode & Controls State
  useEffect(() => {
    if (!controlsRef.current || !cameraRef.current) return;
    
    if (navMode === 'walkthrough') {
      controlsRef.current.enableRotate = true;
      controlsRef.current.enableZoom = false; // keys will move
      controlsRef.current.enablePan = false;
      
      // Focus camera horizontal level for walkthrough entry
      cameraRef.current.position.y = 1.8; // Architectural eye level height (1.8m)
    } else {
      controlsRef.current.enableRotate = true;
      controlsRef.current.enableZoom = true;
      controlsRef.current.enablePan = true;
    }
  }, [navMode]);

  // Update Real-time Shadow lighting and sun coordinates
  useEffect(() => {
    if (!directionalLightRef.current || !ambientLightRef.current) return;

    // Convert Elevation and Azimuth degrees to Spherical Light Coordinates
    const phi = (90 - sunElevation) * (Math.PI / 180); // Elevation angle
    const theta = sunAzimuth * (Math.PI / 180); // Azimuth angle

    const radius = 35; // Solar dome radius
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    directionalLightRef.current.position.set(x, y, z);
    
    // Scale shadow parameters based on customizable slider inputs
    directionalLightRef.current.shadow.intensity = shadowIntensity;
    directionalLightRef.current.intensity = 1.2 * (shadowIntensity + 0.3);
    
  }, [sunElevation, sunAzimuth, shadowIntensity]);

  // Update Cross-section Clipping Planes
  useEffect(() => {
    // Normal vectors pointing in slicing directions
    clipPlaneXRef.current.set(new THREE.Vector3(-1, 0, 0), clippingX);
    clipPlaneYRef.current.set(new THREE.Vector3(0, -1, 0), clippingY);
    clipPlaneZRef.current.set(new THREE.Vector3(0, 0, -1), clippingZ);
  }, [clippingX, clippingY, clippingZ]);

  // Procedurally generate the active architectural preset mesh structures
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove any previous model meshes
    elementMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
    });
    elementMeshesRef.current.clear();

    const clipPlanes = [clipPlaneXRef.current, clipPlaneYRef.current, clipPlaneZRef.current];

    // Build unique materials for different architectural visual properties
    const buildMaterials = () => {
      materialsCacheRef.current.forEach((m) => m.dispose());
      materialsCacheRef.current.clear();

      const baseMatOptions = {
        clippingPlanes: clipPlanes,
        clipShadows: true,
        side: THREE.DoubleSide,
      };

      // Styles: realistic, conceptual, wireframe, xray, hiddenLine
      if (visualStyle === 'realistic') {
        materialsCacheRef.current.set('concrete', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#848a94',
          roughness: 0.6,
          metalness: 0.1,
          bumpScale: 0.05,
        }));
        materialsCacheRef.current.set('drywall', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#dedede',
          roughness: 0.8,
        }));
        materialsCacheRef.current.set('wood', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#8c6239',
          roughness: 0.5,
        }));
        materialsCacheRef.current.set('steel', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#3e444d',
          metalness: 0.8,
          roughness: 0.2,
        }));
        materialsCacheRef.current.set('glass', new THREE.MeshPhysicalMaterial({
          ...baseMatOptions,
          color: '#cbe7f5',
          transparent: true,
          opacity: 0.35,
          transmission: 0.8,
          roughness: 0.1,
          ior: 1.5,
        }));
        materialsCacheRef.current.set('window_frame', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#2a2b2c',
          metalness: 0.4,
          roughness: 0.3,
        }));
        materialsCacheRef.current.set('railing', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#a0a3a6',
          metalness: 0.9,
          roughness: 0.1,
        }));
        materialsCacheRef.current.set('furniture_couch', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#4f555e',
          roughness: 0.9,
        }));
        materialsCacheRef.current.set('soil', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#22291d',
          roughness: 0.9,
        }));
        materialsCacheRef.current.set('gold', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#fbbf24',
          metalness: 0.95,
          roughness: 0.15,
        }));
        materialsCacheRef.current.set('brick', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#ca8a04',
          roughness: 0.85,
        }));
      } else if (visualStyle === 'conceptual') {
        // Warm shaded styling (AutoCAD Conceptual / Shaded)
        const coolColor = new THREE.Color('#3b4b5c');
        const warmColor = new THREE.Color('#ebdfcc');
        
        const conceptualMaterial = (col: string) => new THREE.MeshPhongMaterial({
          ...baseMatOptions,
          color: col,
          specular: '#333333',
          shininess: 30,
          flatShading: true,
        });

        materialsCacheRef.current.set('concrete', conceptualMaterial('#94a3b8'));
        materialsCacheRef.current.set('drywall', conceptualMaterial('#cbd5e1'));
        materialsCacheRef.current.set('wood', conceptualMaterial('#b45309'));
        materialsCacheRef.current.set('steel', conceptualMaterial('#475569'));
        materialsCacheRef.current.set('glass', new THREE.MeshPhongMaterial({
          ...baseMatOptions,
          color: '#38bdf8',
          transparent: true,
          opacity: 0.4,
          shininess: 90,
        }));
        materialsCacheRef.current.set('window_frame', conceptualMaterial('#1e293b'));
        materialsCacheRef.current.set('railing', conceptualMaterial('#94a3b8'));
        materialsCacheRef.current.set('furniture_couch', conceptualMaterial('#64748b'));
        materialsCacheRef.current.set('soil', conceptualMaterial('#14532d'));
      } else if (visualStyle === 'xray') {
        // Translucent neon-blueprint style
        const xrayMat = (col: string) => new THREE.MeshBasicMaterial({
          ...baseMatOptions,
          color: col,
          transparent: true,
          opacity: 0.2,
          wireframe: false,
          depthWrite: false,
        });

        materialsCacheRef.current.set('concrete', xrayMat('#38bdf8'));
        materialsCacheRef.current.set('drywall', xrayMat('#e2e8f0'));
        materialsCacheRef.current.set('wood', xrayMat('#f59e0b'));
        materialsCacheRef.current.set('steel', xrayMat('#10b981'));
        materialsCacheRef.current.set('glass', xrayMat('#a5f3fc'));
        materialsCacheRef.current.set('window_frame', xrayMat('#64748b'));
        materialsCacheRef.current.set('railing', xrayMat('#94a3b8'));
        materialsCacheRef.current.set('furniture_couch', xrayMat('#cbd5e1'));
        materialsCacheRef.current.set('soil', xrayMat('#166534'));
      } else if (visualStyle === 'wireframe') {
        // AutoCAD classic bright wireframes over dark canvas
        const wireMat = (col: string) => new THREE.MeshBasicMaterial({
          ...baseMatOptions,
          color: col,
          wireframe: true,
        });

        materialsCacheRef.current.set('concrete', wireMat('#0ea5e9'));
        materialsCacheRef.current.set('drywall', wireMat('#94a3b8'));
        materialsCacheRef.current.set('wood', wireMat('#f97316'));
        materialsCacheRef.current.set('steel', wireMat('#10b981'));
        materialsCacheRef.current.set('glass', wireMat('#22d3ee'));
        materialsCacheRef.current.set('window_frame', wireMat('#475569'));
        materialsCacheRef.current.set('railing', wireMat('#cbd5e1'));
        materialsCacheRef.current.set('furniture_couch', wireMat('#64748b'));
        materialsCacheRef.current.set('soil', wireMat('#15803d'));
      } else if (visualStyle === 'hiddenLine') {
        // Pure White models with silhouette edges (Sketch blueprint)
        const hiddenMat = () => new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#ffffff',
          roughness: 0.9,
          metalness: 0.0,
        });

        materialsCacheRef.current.set('concrete', hiddenMat());
        materialsCacheRef.current.set('drywall', hiddenMat());
        materialsCacheRef.current.set('wood', hiddenMat());
        materialsCacheRef.current.set('steel', hiddenMat());
        materialsCacheRef.current.set('glass', new THREE.MeshStandardMaterial({
          ...baseMatOptions,
          color: '#ffffff',
          transparent: true,
          opacity: 0.15,
        }));
        materialsCacheRef.current.set('window_frame', hiddenMat());
        materialsCacheRef.current.set('railing', hiddenMat());
        materialsCacheRef.current.set('furniture_couch', hiddenMat());
        materialsCacheRef.current.set('soil', hiddenMat());
      }
    };

    buildMaterials();

    // Helper to register mesh with element hierarchy and enable shadows
    const registerMesh = (mesh: THREE.Object3D, bimId: string, name: string, type: string) => {
      mesh.userData = { id: bimId, type, name };
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Apply local interactive translation offset if any
      if (elementTranslations && elementTranslations[bimId]) {
        const offset = elementTranslations[bimId];
        mesh.position.x += offset.x;
        mesh.position.y += offset.y;
        mesh.position.z += offset.z;
      }

      // Check if there is an active material override
      const overrideKey = materialOverrides && materialOverrides[bimId];
      const overrideMaterial = overrideKey ? (materialsCacheRef.current.get(overrideKey)) : null;
      
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData = { id: bimId, type, name };
          child.castShadow = true;
          child.receiveShadow = true;

          // Apply visual material override
          if (overrideMaterial) {
            child.material = overrideMaterial;
          }
        }
      });

      elementMeshesRef.current.set(bimId, mesh);
      scene.add(mesh);
    };

    // Construct preset 1: VILLA
    if (presetId === 'villa') {
      // Flat Foundation Slab
      const fGeo = new THREE.BoxGeometry(16, 0.3, 10);
      const fMesh = new THREE.Mesh(fGeo, materialsCacheRef.current.get('concrete'));
      fMesh.position.set(0, -0.15, 0);
      registerMesh(fMesh, '#101', 'Foundation Slab - Concrete', 'IfcSlab');

      // Intermediate slab
      const s1Geo = new THREE.BoxGeometry(16, 0.25, 10);
      const s1Mesh = new THREE.Mesh(s1Geo, materialsCacheRef.current.get('concrete'));
      s1Mesh.position.set(0, 3.2 - 0.125, 0);
      registerMesh(s1Mesh, '#201', 'Intermediate Floor Slab', 'IfcSlab');

      // Roof slab
      const s2Geo = new THREE.BoxGeometry(16, 0.3, 10);
      const s2Mesh = new THREE.Mesh(s2Geo, materialsCacheRef.current.get('concrete'));
      s2Mesh.position.set(0, 6.2 - 0.15, 0);
      registerMesh(s2Mesh, '#301', 'Roof Slab', 'IfcSlab');

      // Ground floor North wall (Concrete)
      const wNorthGeo = new THREE.BoxGeometry(16, 3.2, 0.25);
      const wNorthMesh = new THREE.Mesh(wNorthGeo, materialsCacheRef.current.get('concrete'));
      wNorthMesh.position.set(0, 1.6, -4.875);
      registerMesh(wNorthMesh, '#102', 'North Wall - Concrete', 'IfcWallStandardCase');

      // Ground floor South wall (Drywall / wood accent)
      const wSouthGeo = new THREE.BoxGeometry(8, 3.2, 0.2);
      const wSouthMesh = new THREE.Mesh(wSouthGeo, materialsCacheRef.current.get('drywall'));
      wSouthMesh.position.set(-4, 1.6, 4.9);
      registerMesh(wSouthMesh, '#103', 'South Wall - Timber Wood Clad', 'IfcWallStandardCase');

      // West wall
      const wWestGeo = new THREE.BoxGeometry(0.35, 3.2, 10);
      const wWestMesh = new THREE.Mesh(wWestGeo, materialsCacheRef.current.get('concrete'));
      wWestMesh.position.set(-7.825, 1.6, 0);
      registerMesh(wWestMesh, '#104', 'West Party Wall', 'IfcWallStandardCase');

      // Structural steel pillars
      const c1Geo = new THREE.BoxGeometry(0.2, 3.2, 0.2);
      const c1Mesh = new THREE.Mesh(c1Geo, materialsCacheRef.current.get('steel'));
      c1Mesh.position.set(4, 1.6, 4.9);
      registerMesh(c1Mesh, '#105', 'Facade Steel Column C1', 'IfcColumn');

      const c2Geo = new THREE.BoxGeometry(0.2, 3.2, 0.2);
      const c2Mesh = new THREE.Mesh(c2Geo, materialsCacheRef.current.get('steel'));
      c2Mesh.position.set(7.8, 1.6, 4.9);
      registerMesh(c2Mesh, '#106', 'Facade Steel Column C2', 'IfcColumn');

      // Glass sliding doors / panoramic windows
      const winFrameGeo = new THREE.BoxGeometry(3.6, 3.2, 0.15);
      const winFrameMesh = new THREE.Mesh(winFrameGeo, materialsCacheRef.current.get('window_frame'));
      winFrameMesh.position.set(2, 1.6, 4.9);
      
      const glassGeo = new THREE.BoxGeometry(3.4, 3.0, 0.05);
      const glassMesh = new THREE.Mesh(glassGeo, materialsCacheRef.current.get('glass'));
      glassMesh.position.set(2, 1.6, 4.9);
      
      const winGroup1 = new THREE.Group();
      winGroup1.add(winFrameMesh);
      winGroup1.add(glassMesh);
      registerMesh(winGroup1, '#108', 'Panoramic Glass Unit A', 'IfcWindow');

      const winFrameGeo2 = new THREE.BoxGeometry(3.6, 3.2, 0.15);
      const winFrameMesh2 = new THREE.Mesh(winFrameGeo2, materialsCacheRef.current.get('window_frame'));
      winFrameMesh2.position.set(5.8, 1.6, 4.9);
      
      const glassGeo2 = new THREE.BoxGeometry(3.4, 3.0, 0.05);
      const glassMesh2 = new THREE.Mesh(glassGeo2, materialsCacheRef.current.get('glass'));
      glassMesh2.position.set(5.8, 1.6, 4.9);
      
      const winGroup2 = new THREE.Group();
      winGroup2.add(winFrameMesh2);
      winGroup2.add(glassMesh2);
      registerMesh(winGroup2, '#109', 'Panoramic Glass Unit B', 'IfcWindow');

      // Main Entrance Pivot Door
      const doorFrameGeo = new THREE.BoxGeometry(1.6, 2.5, 0.15);
      const doorFrameMesh = new THREE.Mesh(doorFrameGeo, materialsCacheRef.current.get('window_frame'));
      doorFrameMesh.position.set(0, 1.25, 4.9);
      
      const doorPanelGeo = new THREE.BoxGeometry(1.4, 2.4, 0.08);
      const doorPanelMesh = new THREE.Mesh(doorPanelGeo, materialsCacheRef.current.get('wood'));
      doorPanelMesh.position.set(-0.05, 1.25, 4.9); // offset slightly to appear pivots
      
      const doorGroup = new THREE.Group();
      doorGroup.add(doorFrameMesh);
      doorGroup.add(doorPanelMesh);
      registerMesh(doorGroup, '#107', 'Main Entrance Pivot Door', 'IfcDoor');

      // Dining Table
      const tableGroup = new THREE.Group();
      const topGeo = new THREE.BoxGeometry(2.4, 0.05, 1.0);
      const topMesh = new THREE.Mesh(topGeo, materialsCacheRef.current.get('wood'));
      topMesh.position.set(-3, 0.75, -1);
      tableGroup.add(topMesh);

      const legGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.75);
      for (let xPos of [-4.1, -1.9]) {
        for (let zPos of [-1.4, -0.6]) {
          const leg = new THREE.Mesh(legGeo, materialsCacheRef.current.get('steel'));
          leg.position.set(xPos, 0.375, zPos);
          tableGroup.add(leg);
        }
      }
      registerMesh(tableGroup, '#110', 'Bespoke Oak Dining Table', 'IfcFurnishingElement');

      // Sofa lounge
      const sofaGroup = new THREE.Group();
      const sBaseGeo = new THREE.BoxGeometry(3.2, 0.2, 1.0);
      const sBase = new THREE.Mesh(sBaseGeo, materialsCacheRef.current.get('furniture_couch'));
      sBase.position.set(3, 0.1, 1);
      sofaGroup.add(sBase);

      const sCushGeo = new THREE.BoxGeometry(1.0, 0.4, 0.8);
      for (let offset of [-1.1, 0, 1.1]) {
        const cushion = new THREE.Mesh(sCushGeo, materialsCacheRef.current.get('furniture_couch'));
        cushion.position.set(3 + offset, 0.3, 1);
        sofaGroup.add(cushion);
      }

      const sArmGeo = new THREE.BoxGeometry(0.2, 0.6, 1.0);
      const sArmL = new THREE.Mesh(sArmGeo, materialsCacheRef.current.get('furniture_couch'));
      sArmL.position.set(1.4, 0.4, 1);
      sofaGroup.add(sArmL);

      const sArmR = new THREE.Mesh(sArmGeo, materialsCacheRef.current.get('furniture_couch'));
      sArmR.position.set(4.6, 0.4, 1);
      sofaGroup.add(sArmR);

      registerMesh(sofaGroup, '#111', 'Modular Lounge Sofa', 'IfcFurnishingElement');

      // FIRST FLOOR:
      // North Wall Section
      const wNorthF1Geo = new THREE.BoxGeometry(16, 3.0, 0.25);
      const wNorthF1Mesh = new THREE.Mesh(wNorthF1Geo, materialsCacheRef.current.get('concrete'));
      wNorthF1Mesh.position.set(0, 4.7, -4.875);
      registerMesh(wNorthF1Mesh, '#202', 'First Floor North Wall', 'IfcWallStandardCase');

      // Partition 1
      const p1Geo = new THREE.BoxGeometry(0.125, 3.0, 4);
      const p1Mesh = new THREE.Mesh(p1Geo, materialsCacheRef.current.get('drywall'));
      p1Mesh.position.set(-2, 4.7, -2.8);
      registerMesh(p1Mesh, '#203', 'Bedroom Partition Wall 1', 'IfcWallStandardCase');

      // Partition 2
      const p2Geo = new THREE.BoxGeometry(4, 3.0, 0.125);
      const p2Mesh = new THREE.Mesh(p2Geo, materialsCacheRef.current.get('drywall'));
      p2Mesh.position.set(-4, 4.7, -0.8);
      registerMesh(p2Mesh, '#204', 'Bedroom Partition Wall 2', 'IfcWallStandardCase');

      // Balcony Sliding door frame + glass
      const bWinGroup = new THREE.Group();
      const bWinFrameGeo = new THREE.BoxGeometry(3.0, 2.6, 0.12);
      const bWinFrame = new THREE.Mesh(bWinFrameGeo, materialsCacheRef.current.get('window_frame'));
      bWinFrame.position.set(3, 4.5, 4.9);
      bWinGroup.add(bWinFrame);

      const bWinGlassGeo = new THREE.BoxGeometry(2.8, 2.4, 0.04);
      const bWinGlass = new THREE.Mesh(bWinGlassGeo, materialsCacheRef.current.get('glass'));
      bWinGlass.position.set(3, 4.5, 4.9);
      bWinGroup.add(bWinGlass);
      registerMesh(bWinGroup, '#206', 'Master Balcony Slider', 'IfcWindow');

      // Terrace Glass Railing
      const railGroup = new THREE.Group();
      const railGlassGeo = new THREE.BoxGeometry(8, 1.1, 0.02);
      const railGlass = new THREE.Mesh(railGlassGeo, materialsCacheRef.current.get('glass'));
      railGlass.position.set(-4, 3.75, 4.9);
      railGroup.add(railGlass);
      
      const handrailGeo = new THREE.BoxGeometry(8, 0.05, 0.05);
      const handrail = new THREE.Mesh(handrailGeo, materialsCacheRef.current.get('railing'));
      handrail.position.set(-4, 4.3, 4.9);
      railGroup.add(handrail);
      registerMesh(railGroup, '#208', 'Terrace Glass Railing', 'IfcRailing');
    }

    // Construct preset 2: COMMERCIAL TOWER CORE
    else if (presetId === 'office') {
      // Stacked building slabs (Ground, Level 1, Level 2, Level 3)
      const slabHeights = [0, 4.5, 8.1, 11.7, 15.3];
      slabHeights.forEach((sh, idx) => {
        const slabGeo = new THREE.BoxGeometry(20, 0.25, 20);
        const slabMesh = new THREE.Mesh(slabGeo, materialsCacheRef.current.get('concrete'));
        slabMesh.position.set(0, sh - 0.125, 0);
        registerMesh(slabMesh, `#o10${idx + 1}`, `Level ${idx} Concrete Slab Plate`, 'IfcSlab');
      });

      // Concrete Shear core shaft (Elevators & HVAC)
      const coreWallLGeo = new THREE.BoxGeometry(0.4, 16.5, 6);
      const coreWallL = new THREE.Mesh(coreWallLGeo, materialsCacheRef.current.get('concrete'));
      coreWallL.position.set(-3, 8.25, 0);
      registerMesh(coreWallL, '#o102', 'Shear Core Shaft Wall L', 'IfcWall');

      const coreWallRGeo = new THREE.BoxGeometry(0.4, 16.5, 6);
      const coreWallR = new THREE.Mesh(coreWallRGeo, materialsCacheRef.current.get('concrete'));
      coreWallR.position.set(3, 8.25, 0);
      registerMesh(coreWallR, '#o103', 'Shear Core Shaft Wall R', 'IfcWall');

      // Structural steel column grid (LOD 350 composite framing)
      const colPoints = [
        { x: -9, z: -9 }, { x: -9, z: 9 },
        { x: 9, z: -9 }, { x: 9, z: 9 },
        { x: -9, z: 0 }, { x: 9, z: 0 }
      ];

      colPoints.forEach((pt, cIdx) => {
        // Multi-tier composite steel columns
        const colGeo = new THREE.CylinderGeometry(0.25, 0.25, 16.25, 8);
        const colMesh = new THREE.Mesh(colGeo, materialsCacheRef.current.get('steel'));
        colMesh.position.set(pt.x, 8.125, pt.z);
        registerMesh(colMesh, `#o10${4 + cIdx}`, `Structural Column Tier C${cIdx + 1}`, 'IfcColumn');
      });

      // Interconnecting structural steel girder beams (Level 1, 2, 3)
      let beamCount = 200;
      const bHeights = [4.5 - 0.3, 8.1 - 0.3, 11.7 - 0.3, 15.3 - 0.3];
      bHeights.forEach((bh) => {
        // X Beams
        for (let zVal of [-9, 9, 0]) {
          const bGeoX = new THREE.BoxGeometry(18, 0.4, 0.2);
          const bMeshX = new THREE.Mesh(bGeoX, materialsCacheRef.current.get('steel'));
          bMeshX.position.set(0, bh, zVal);
          registerMesh(bMeshX, `#o${beamCount++}`, `Primary Framing Girder X-${zVal}`, 'IfcBeam');
        }
        // Z Beams
        for (let xVal of [-9, 9]) {
          const bGeoZ = new THREE.BoxGeometry(0.2, 0.4, 18);
          const bMeshZ = new THREE.Mesh(bGeoZ, materialsCacheRef.current.get('steel'));
          bMeshZ.position.set(xVal, bh, 0);
          registerMesh(bMeshZ, `#o${beamCount++}`, `Primary Framing Girder Z-${xVal}`, 'IfcBeam');
        }
      });

      // Curtain Glass Facades on levels
      const glassFloors = [0, 4.5, 8.1, 11.7];
      glassFloors.forEach((gh, fIdx) => {
        // Render large panoramic curtain walls spanning between columns on the North and South Facades
        const glassFacGeo = new THREE.BoxGeometry(17.8, 3.2, 0.05);
        const glassFacN = new THREE.Mesh(glassFacGeo, materialsCacheRef.current.get('glass'));
        glassFacN.position.set(0, gh + 1.8, -8.9);
        registerMesh(glassFacN, `#oCurtainN-${fIdx}`, `North Curtain Wall Level ${fIdx}`, 'IfcWindow');

        const glassFacS = new THREE.Mesh(glassFacGeo, materialsCacheRef.current.get('glass'));
        glassFacS.position.set(0, gh + 1.8, 8.9);
        registerMesh(glassFacS, `#oCurtainS-${fIdx}`, `South Curtain Wall Level ${fIdx}`, 'IfcWindow');
      });

      // Revolving Main Entrance Glass door in the Ground lobby
      const dGroup = new THREE.Group();
      const dCylGeo = new THREE.CylinderGeometry(2, 2, 3.5, 16, 1, true);
      const dCyl = new THREE.Mesh(dCylGeo, materialsCacheRef.current.get('glass'));
      dCyl.position.set(0, 1.75, 9.2);
      dGroup.add(dCyl);

      // Rotating blades
      const bladeGeo = new THREE.BoxGeometry(1.9, 3.3, 0.04);
      for (let angle of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
        const blade = new THREE.Mesh(bladeGeo, materialsCacheRef.current.get('glass'));
        blade.rotation.y = angle;
        blade.position.set(0, 1.75, 9.2);
        dGroup.add(blade);
      }
      registerMesh(dGroup, '#o106', 'Main Revolving Glass Door', 'IfcDoor');
    }

    // Construct preset 3: INDUSTRIAL LOGISTICS WAREHOUSE
    else if (presetId === 'warehouse') {
      // Flat reinforced concrete floor slab
      const flGeo = new THREE.BoxGeometry(32, 0.25, 20);
      const flMesh = new THREE.Mesh(flGeo, materialsCacheRef.current.get('concrete'));
      flMesh.position.set(0, -0.125, 0);
      registerMesh(flMesh, '#w101', 'Heavy Duty Concrete Floor Slab', 'IfcSlab');

      // Steel Portal columns along front and back grids
      const columnsZ = [-9, -4.5, 0, 4.5, 9];
      columnsZ.forEach((cz, idx) => {
        // West Columns
        const colWGeo = new THREE.BoxGeometry(0.4, 7.5, 0.4);
        const colWMesh = new THREE.Mesh(colWGeo, materialsCacheRef.current.get('steel'));
        colWMesh.position.set(-14.8, 3.75, cz);
        registerMesh(colWMesh, `#w102-${idx}`, `Steel Portal Column W-${idx}`, 'IfcColumn');

        // East Columns
        const colEGeo = new THREE.BoxGeometry(0.4, 7.5, 0.4);
        const colEMesh = new THREE.Mesh(colEGeo, materialsCacheRef.current.get('steel'));
        colEMesh.position.set(14.8, 3.75, cz);
        registerMesh(colEMesh, `#w103-${idx}`, `Steel Portal Column E-${idx}`, 'IfcColumn');

        // Lattice Web portal Roof Girders meeting at the peak
        const trussGroup = new THREE.Group();
        const beamLGeo = new THREE.BoxGeometry(15.2, 0.25, 0.15);
        
        const beamL = new THREE.Mesh(beamLGeo, materialsCacheRef.current.get('steel'));
        beamL.position.set(-7.5, 7.5 + 1.25, cz);
        beamL.rotation.z = 0.16; // 10 degree roof slope
        trussGroup.add(beamL);

        const beamR = new THREE.Mesh(beamLGeo, materialsCacheRef.current.get('steel'));
        beamR.position.set(7.5, 7.5 + 1.25, cz);
        beamR.rotation.z = -0.16;
        trussGroup.add(beamR);

        // Add some zig-zag lattice lines
        const latGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2);
        for (let i = -13; i < 13; i += 3) {
          const lat = new THREE.Mesh(latGeo, materialsCacheRef.current.get('steel'));
          lat.position.set(i, 8.2, cz);
          lat.rotation.z = (i % 2 === 0 ? 0.8 : -0.8);
          trussGroup.add(lat);
        }

        registerMesh(trussGroup, `#w105-${idx}`, `Lattice Roof Truss T-${idx}`, 'IfcBeam');
      });

      // Insulated sandwich cladding walls
      const wallPGeo = new THREE.BoxGeometry(0.12, 7.5, 20.2);
      const wallPW = new THREE.Mesh(wallPGeo, materialsCacheRef.current.get('drywall'));
      wallPW.position.set(-14.94, 3.75, 0);
      registerMesh(wallPW, '#w107', 'Plinth Sandwich Wall West', 'IfcWall');

      const wallPE = new THREE.Mesh(wallPGeo, materialsCacheRef.current.get('drywall'));
      wallPE.position.set(14.94, 3.75, 0);
      registerMesh(wallPE, '#w108', 'Plinth Sandwich Wall East', 'IfcWall');

      // Overhead Sectional Loading Dock doors
      const dockGroup1 = new THREE.Group();
      const frameGeo = new THREE.BoxGeometry(0.2, 3.8, 3.2);
      const frame1 = new THREE.Mesh(frameGeo, materialsCacheRef.current.get('window_frame'));
      frame1.position.set(14.9, 1.9, -4.5);
      dockGroup1.add(frame1);

      const slattGeo = new THREE.BoxGeometry(0.06, 3.6, 3.0);
      const slatt1 = new THREE.Mesh(slattGeo, materialsCacheRef.current.get('steel'));
      slatt1.position.set(14.9, 1.9, -4.5);
      dockGroup1.add(slatt1);
      registerMesh(dockGroup1, '#w109', 'Overhead Loading Dock Door 1', 'IfcDoor');

      const dockGroup2 = new THREE.Group();
      const frame2 = new THREE.Mesh(frameGeo, materialsCacheRef.current.get('window_frame'));
      frame2.position.set(14.9, 1.9, 4.5);
      dockGroup2.add(frame2);

      const slatt2 = new THREE.Mesh(slattGeo, materialsCacheRef.current.get('steel'));
      slatt2.position.set(14.9, 1.9, 4.5);
      dockGroup2.add(slatt2);
      registerMesh(dockGroup2, '#w110', 'Overhead Loading Dock Door 2', 'IfcDoor');
    }

    // Construct preset 4: CUSTOM UPLOADED MODEL
    else if (presetId === 'custom') {
      const physicalElements: BimElement[] = [];
      const traverse = (node: BimElement) => {
        const physicalTypes = [
          'IfcWall', 'IfcWallStandardCase', 'IfcSlab', 'IfcColumn', 'IfcBeam', 
          'IfcWindow', 'IfcDoor', 'IfcRailing', 'IfcSpace', 'IfcFurnishingElement'
        ];
        if (physicalTypes.includes(node.type)) {
          physicalElements.push(node);
        }
        if (node.children) {
          node.children.forEach(c => traverse(c));
        }
      };
      traverse(hierarchy);

      const slabs = physicalElements.filter(e => e.type === 'IfcSlab');
      const walls = physicalElements.filter(e => e.type === 'IfcWall' || e.type === 'IfcWallStandardCase');
      const columns = physicalElements.filter(e => e.type === 'IfcColumn');
      const beams = physicalElements.filter(e => e.type === 'IfcBeam');
      const windows = physicalElements.filter(e => e.type === 'IfcWindow');
      const doors = physicalElements.filter(e => e.type === 'IfcDoor');
      const railings = physicalElements.filter(e => e.type === 'IfcRailing');
      const furniture = physicalElements.filter(e => e.type === 'IfcFurnishingElement');
      const other = physicalElements.filter(e => !['IfcSlab', 'IfcWall', 'IfcWallStandardCase', 'IfcColumn', 'IfcBeam', 'IfcWindow', 'IfcDoor', 'IfcRailing', 'IfcFurnishingElement'].includes(e.type));

      // Slabs
      slabs.forEach((slab, idx) => {
        const geo = new THREE.BoxGeometry(16, 0.25, 12);
        const mesh = new THREE.Mesh(geo, materialsCacheRef.current.get('concrete'));
        mesh.position.set(0, idx * 3.5 - 0.125, 0);
        registerMesh(mesh, slab.id, slab.name, slab.type);
      });

      // Columns at modular points
      const colGrid = [
        { x: -7.5, z: -5.5 }, { x: -7.5, z: 5.5 },
        { x: 7.5, z: -5.5 }, { x: 7.5, z: 5.5 },
        { x: -7.5, z: 0 }, { x: 7.5, z: 0 },
        { x: 0, z: -5.5 }, { x: 0, z: 5.5 }
      ];
      columns.forEach((col, idx) => {
        const gridPos = colGrid[idx % colGrid.length];
        const floor = Math.floor(idx / colGrid.length);
        const geo = new THREE.CylinderGeometry(0.2, 0.2, 3.5, 8);
        const mesh = new THREE.Mesh(geo, materialsCacheRef.current.get('steel'));
        mesh.position.set(gridPos.x, floor * 3.5 + 1.75, gridPos.z);
        registerMesh(mesh, col.id, col.name, col.type);
      });

      // Beams connecting columns
      beams.forEach((beam, idx) => {
        const floor = Math.floor(idx / 4);
        const dir = idx % 4; // 0: North, 1: South, 2: West, 3: East
        let geo, mesh;
        if (dir === 0 || dir === 1) {
          geo = new THREE.BoxGeometry(16, 0.3, 0.2);
          mesh = new THREE.Mesh(geo, materialsCacheRef.current.get('steel'));
          mesh.position.set(0, floor * 3.5 + 3.35, dir === 0 ? -5.5 : 5.5);
        } else {
          geo = new THREE.BoxGeometry(0.2, 0.3, 12);
          mesh = new THREE.Mesh(geo, materialsCacheRef.current.get('steel'));
          mesh.position.set(dir === 2 ? -7.5 : 7.5, floor * 3.5 + 3.35, 0);
        }
        registerMesh(mesh, beam.id, beam.name, beam.type);
      });

      // Walls
      const wallPositions = [
        { x: -4, z: -5.8, w: 8, d: 0.2 },
        { x: 4, z: -5.8, w: 8, d: 0.2 },
        { x: -4, z: 5.8, w: 8, d: 0.2 },
        { x: 4, z: 5.8, w: 8, d: 0.2 },
        { x: -7.8, z: -3, w: 0.2, d: 6 },
        { x: -7.8, z: 3, w: 0.2, d: 6 },
        { x: 7.8, z: -3, w: 0.2, d: 6 },
        { x: 7.8, z: 3, w: 0.2, d: 6 },
      ];
      walls.forEach((wall, idx) => {
        const pos = wallPositions[idx % wallPositions.length];
        const floor = Math.floor(idx / wallPositions.length);
        const geo = new THREE.BoxGeometry(pos.w, 3.5, pos.d);
        const mesh = new THREE.Mesh(geo, materialsCacheRef.current.get('drywall'));
        mesh.position.set(pos.x, floor * 3.5 + 1.75, pos.z);
        registerMesh(mesh, wall.id, wall.name, wall.type);
      });

      // Windows
      windows.forEach((win, idx) => {
        const floor = Math.floor(idx / 4);
        const dir = idx % 4; // 0: North, 1: South, 2: West, 3: East
        const group = new THREE.Group();
        
        let frameGeo, glassGeo;
        if (dir === 0) { // North
          frameGeo = new THREE.BoxGeometry(2.4, 1.8, 0.15);
          glassGeo = new THREE.BoxGeometry(2.2, 1.6, 0.05);
          group.position.set(-2, floor * 3.5 + 1.75, -5.8);
        } else if (dir === 1) { // South
          frameGeo = new THREE.BoxGeometry(2.4, 1.8, 0.15);
          glassGeo = new THREE.BoxGeometry(2.2, 1.6, 0.05);
          group.position.set(2, floor * 3.5 + 1.75, 5.8);
        } else if (dir === 2) { // West
          frameGeo = new THREE.BoxGeometry(0.15, 1.8, 2.4);
          glassGeo = new THREE.BoxGeometry(0.05, 1.6, 2.2);
          group.position.set(-7.8, floor * 3.5 + 1.75, -1);
        } else { // East
          frameGeo = new THREE.BoxGeometry(0.15, 1.8, 2.4);
          glassGeo = new THREE.BoxGeometry(0.05, 1.6, 2.2);
          group.position.set(7.8, floor * 3.5 + 1.75, 1);
        }
        
        const frameMesh = new THREE.Mesh(frameGeo, materialsCacheRef.current.get('window_frame'));
        const glassMesh = new THREE.Mesh(glassGeo, materialsCacheRef.current.get('glass'));
        group.add(frameMesh);
        group.add(glassMesh);
        registerMesh(group, win.id, win.name, win.type);
      });

      // Doors
      doors.forEach((door, idx) => {
        const floor = Math.floor(idx / 2);
        const side = idx % 2; // 0: South front door, 1: North back door
        const group = new THREE.Group();
        
        const frameGeo = new THREE.BoxGeometry(1.4, 2.4, 0.15);
        const frameMesh = new THREE.Mesh(frameGeo, materialsCacheRef.current.get('window_frame'));
        
        const panelGeo = new THREE.BoxGeometry(1.2, 2.3, 0.08);
        const panelMesh = new THREE.Mesh(panelGeo, materialsCacheRef.current.get('wood'));
        panelMesh.position.x = 0.05; // Pivot offset
        
        group.add(frameMesh);
        group.add(panelMesh);
        
        group.position.set(side === 0 ? -1.5 : 1.5, floor * 3.5 + 1.2, side === 0 ? 5.8 : -5.8);
        registerMesh(group, door.id, door.name, door.type);
      });

      // Railings
      railings.forEach((rail, idx) => {
        const floor = Math.floor(idx / 2) + 1; // start from level 1
        const side = idx % 2;
        const group = new THREE.Group();
        
        const glassGeo = new THREE.BoxGeometry(6, 1.1, 0.02);
        const glassMesh = new THREE.Mesh(glassGeo, materialsCacheRef.current.get('glass'));
        glassMesh.position.y = 0.55;
        group.add(glassMesh);
        
        const handGeo = new THREE.BoxGeometry(6, 0.05, 0.05);
        const handMesh = new THREE.Mesh(handGeo, materialsCacheRef.current.get('railing'));
        handMesh.position.y = 1.1;
        group.add(handMesh);
        
        group.position.set(side === 0 ? -3 : 3, floor * 3.5, 5.8);
        registerMesh(group, rail.id, rail.name, rail.type);
      });

      // Furniture
      furniture.forEach((item, idx) => {
        const floor = Math.floor(idx / 4);
        const slot = idx % 4; // 4 different layout slots on floor
        const group = new THREE.Group();
        
        if (slot === 0) { // Couch
          const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.8), materialsCacheRef.current.get('furniture_couch'));
          base.position.y = 0.1;
          group.add(base);
          const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.8), materialsCacheRef.current.get('furniture_couch'));
          armL.position.set(-1.1, 0.25, 0);
          group.add(armL);
          const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.8), materialsCacheRef.current.get('furniture_couch'));
          armR.position.set(1.1, 0.25, 0);
          group.add(armR);
          group.position.set(-3, floor * 3.5, -2);
        } else if (slot === 1) { // Table
          const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.8), materialsCacheRef.current.get('wood'));
          top.position.y = 0.75;
          group.add(top);
          for (let xPos of [-0.7, 0.7]) {
            for (let zPos of [-0.3, 0.3]) {
              const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.75), materialsCacheRef.current.get('steel'));
              leg.position.set(xPos, 0.375, zPos);
              group.add(leg);
            }
          }
          group.position.set(3, floor * 3.5, -2);
        } else { // Desk / Console
          const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.6), materialsCacheRef.current.get('wood'));
          deskTop.position.y = 0.75;
          group.add(deskTop);
          const legL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.5), materialsCacheRef.current.get('steel'));
          legL.position.set(-0.65, 0.375, 0);
          group.add(legL);
          const legR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.5), materialsCacheRef.current.get('steel'));
          legR.position.set(0.65, 0.375, 0);
          group.add(legR);
          group.position.set(slot === 2 ? -2 : 2, floor * 3.5, 2);
        }
        registerMesh(group, item.id, item.name, item.type);
      });

      // Other physical entities (spaces/shapes)
      other.forEach((item, idx) => {
        const floor = Math.floor(idx / 6);
        const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const mesh = new THREE.Mesh(geo, materialsCacheRef.current.get('concrete'));
        mesh.position.set(-5 + (idx % 3) * 5, floor * 3.5 + 0.75, -4 + Math.floor((idx % 6) / 3) * 8);
        registerMesh(mesh, item.id, item.name, item.type);
      });
    }

  }, [presetId, visualStyle, hierarchy, materialOverrides, elementTranslations]);

  // Adjust Elements Visibility according to the side-hierarchy checkboxes
  useEffect(() => {
    elementMeshesRef.current.forEach((mesh, bimId) => {
      // Toggle visibility based on the visibleElementIds set
      const isVisible = visibleElementIds.has(bimId);
      mesh.visible = isVisible;
    });
  }, [visibleElementIds, presetId]);

  // Handle Raycasting to Hover and Select element meshes
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!canvasRef.current || !cameraRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(Array.from(elementMeshesRef.current.values()), true);

      if (intersects.length > 0) {
        // Find top level registered user data
        let current: THREE.Object3D | null = intersects[0].object;
        let foundId = null;
        let foundType = '';
        let foundName = '';
        while (current) {
          if (current.userData && current.userData.id) {
            foundId = current.userData.id;
            foundType = current.userData.type;
            foundName = current.userData.name;
            break;
          }
          current = current.parent;
        }

        if (foundId) {
          setHoveredElementInfo({ id: foundId, type: foundType, name: foundName });
          return;
        }
      }
      setHoveredElementInfo(null);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!canvasRef.current || !cameraRef.current) return;
      
      // Right click is standard for controls; limit click selection to left-mouse button
      if (e.button !== 0) return;

      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(Array.from(elementMeshesRef.current.values()), true);

      if (intersects.length > 0) {
        // If measure mode is active, handle ruler placements
        if (measureMode) {
          const clickPoint = intersects[0].point;
          
          if (!measurementStart) {
            // First point selection
            setMeasurementStart(clickPoint.clone());
            
            // Draw temporary starter sphere marker
            const markerGeo = new THREE.SphereGeometry(0.12, 16, 16);
            const markerMat = new THREE.MeshBasicMaterial({ color: '#f43f5e' });
            const marker = new THREE.Mesh(markerGeo, markerMat);
            marker.position.copy(clickPoint);
            measurementGroupRef.current?.add(marker);
          } else {
            // Second point selection - complete measurement!
            const endPoint = clickPoint.clone();
            const distance = measurementStart.distanceTo(endPoint);

            // Add new measurement to state log
            if (onMeasureComplete) {
              onMeasureComplete({
                id: `M-${Date.now()}`,
                start: { x: measurementStart.x, y: measurementStart.y, z: measurementStart.z },
                end: { x: endPoint.x, y: endPoint.y, z: endPoint.z },
                distance: parseFloat(distance.toFixed(3)),
              });
            }

            // Clear temporary measure marker
            setMeasurementStart(null);
          }
          return;
        }

        // Standard BIM selection raycasting
        let current: THREE.Object3D | null = intersects[0].object;
        let foundId = null;
        while (current) {
          if (current.userData && current.userData.id) {
            foundId = current.userData.id;
            break;
          }
          current = current.parent;
        }

        if (foundId) {
          onElementSelect(foundId);
          return;
        }
      } else {
        // click on empty grid space clears active selection
        if (!measureMode) {
          onElementSelect(null);
        }
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerdown', handlePointerDown);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerdown', handlePointerDown);
      }
    };
  }, [measureMode, measurementStart, onElementSelect, onMeasureComplete]);

  // Render measurements objects & dimension overlay lines in 3D scene
  useEffect(() => {
    const group = measurementGroupRef.current;
    if (!group) return;

    // Clear previous elements
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    measurements.forEach((m) => {
      const pStart = new THREE.Vector3(m.start.x, m.start.y, m.start.z);
      const pEnd = new THREE.Vector3(m.end.x, m.end.y, m.end.z);

      // Spheres at endpoints
      const sphereGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const sphereMat = new THREE.MeshBasicMaterial({ color: '#f43f5e' });
      
      const sp1 = new THREE.Mesh(sphereGeo, sphereMat);
      sp1.position.copy(pStart);
      group.add(sp1);

      const sp2 = new THREE.Mesh(sphereGeo, sphereMat);
      sp2.position.copy(pEnd);
      group.add(sp2);

      // Dash dimension line connecting them
      const points = [pStart, pEnd];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineDashedMaterial({
        color: '#f43f5e',
        dashSize: 0.5,
        gapSize: 0.25,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      group.add(line);
    });
  }, [measurements]);

  // Render and animate 3D clash coordinate indicators & auto-focus camera
  useEffect(() => {
    const group = clashGroupRef.current;
    if (!group) return;

    // Reset previous elements
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    clashPulseObjectRef.current = null;

    if (!activeClashId || !clashes) return;

    const clash = clashes.find(c => c.id === activeClashId);
    if (!clash || clash.resolved) return;

    const { x, y, z } = clash.coordinates;
    const pos = new THREE.Vector3(x, y, z);

    // 1. Central glowing sphere representing clash intersection
    const sphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      transparent: true,
      opacity: 0.6,
      wireframe: true,
    });
    const clashPulseMesh = new THREE.Mesh(sphereGeo, sphereMat);
    clashPulseMesh.position.copy(pos);
    group.add(clashPulseMesh);
    clashPulseObjectRef.current = clashPulseMesh; // Bind to animate loop!

    // 2. Solid tiny nucleus sphere
    const coreGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({ color: '#f43f5e' });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.copy(pos);
    group.add(coreMesh);

    // 3. Coordinate alignment ring on the floor
    const ringGeo = new THREE.RingGeometry(0.6, 0.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(x, 0.02, z); // anchor to floor helper
    group.add(ringMesh);

    // 4. Dashed altitude laser line going down from clash point to floor target
    const linePoints = [pos, new THREE.Vector3(x, 0.02, z)];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineDashedMaterial({
      color: '#ef4444',
      dashSize: 0.3,
      gapSize: 0.15,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    group.add(line);

    // 5. Smoothly focus camera lookAt on the clash zone coordinates
    if (controlsRef.current && cameraRef.current) {
      // Position camera slightly offset from target to frame it beautifully
      controlsRef.current.target.copy(pos);
      cameraRef.current.position.set(x + 5, y + 4, z + 5);
      controlsRef.current.update();
    }

  }, [activeClashId, clashes]);

  // Handle active selected element wireframe / visual glow overlay
  useEffect(() => {
    // Reset all previous outline glowing materials
    elementMeshesRef.current.forEach((mesh) => {
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.userData.originalMaterial) {
            child.material = child.userData.originalMaterial;
          }
        }
      });
    });

    if (!selectedElementId) return;

    const selectedMesh = elementMeshesRef.current.get(selectedElementId);
    if (selectedMesh) {
      selectedMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Backup original material to restore later
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material;
          }

          // Override with a glowing selected highlight material
          child.material = new THREE.MeshStandardMaterial({
            color: '#38bdf8',
            emissive: '#0284c7',
            emissiveIntensity: 0.4,
            roughness: 0.2,
            metalness: 0.6,
            clippingPlanes: [clipPlaneXRef.current, clipPlaneYRef.current, clipPlaneZRef.current],
            clipShadows: true,
            side: THREE.DoubleSide,
          });
        }
      });
    }
  }, [selectedElementId, presetId, visualStyle]);

  // Quick CAD Views compass rotations
  const handleViewCubeClick = (dir: 'top' | 'front' | 'right' | 'isometric') => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const target = controlsRef.current.target;
    
    if (dir === 'top') {
      cameraRef.current.position.set(target.x, target.y + 25, target.z + 0.01);
    } else if (dir === 'front') {
      cameraRef.current.position.set(target.x, target.y, target.z + 25);
    } else if (dir === 'right') {
      cameraRef.current.position.set(target.x + 25, target.y, target.z);
    } else if (dir === 'isometric') {
      cameraRef.current.position.set(target.x + 18, target.y + 15, target.z + 18);
    }
    
    controlsRef.current.update();
  };

  // Zoom In / Zoom Out camera control
  const handleZoom = (zoomIn: boolean) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    const target = controls.target;
    const dir = new THREE.Vector3().subVectors(camera.position, target);
    const distance = dir.length();
    
    let newDistance = zoomIn ? distance * 0.75 : distance * 1.33;
    // Keep distance within reasonable boundaries for BIM viewing
    newDistance = Math.max(1.5, Math.min(120, newDistance));
    
    dir.normalize().multiplyScalar(newDistance);
    camera.position.copy(target).add(dir);
    controls.update();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#121212] cad-grid overflow-hidden" id="threejs-container-frame">
      {/* Three WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" id="architectural-model-canvas" />

      {/* AutoCAD View Cube Navigation widget */}
      <div className="absolute top-4 right-4 bg-[#1a1a1a] border border-[#333] p-2 rounded flex flex-col gap-1 z-10 text-[10px] text-[#d1d1d1] shadow-2xl" id="autocad-navigation-cube">
        <div className="flex items-center gap-1 font-mono text-[9px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">
          <Compass className="w-3 h-3 text-blue-400" /> View Cube
        </div>
        <div className="grid grid-cols-2 gap-1 font-mono text-[9px]" id="cube-directions">
          <button onClick={() => handleViewCubeClick('top')} className="px-1.5 py-0.5 bg-[#252525] hover:bg-blue-600 hover:text-white rounded border border-[#333] transition text-center" id="nav-btn-top">
            Top
          </button>
          <button onClick={() => handleViewCubeClick('front')} className="px-1.5 py-0.5 bg-[#252525] hover:bg-blue-600 hover:text-white rounded border border-[#333] transition text-center" id="nav-btn-front">
            Front
          </button>
          <button onClick={() => handleViewCubeClick('right')} className="px-1.5 py-0.5 bg-[#252525] hover:bg-blue-600 hover:text-white rounded border border-[#333] transition text-center" id="nav-btn-right">
            Right
          </button>
          <button onClick={() => handleViewCubeClick('isometric')} className="px-1.5 py-0.5 bg-[#252525] hover:bg-blue-600 hover:text-white rounded border border-[#333] transition text-center" id="nav-btn-iso">
            Iso
          </button>
        </div>

        {/* Zoom Controls inside panel */}
        <div className="border-t border-[#333] mt-1.5 pt-1.5 flex items-center justify-between gap-1" id="zoom-control-bar">
          <span className="text-[8px] font-mono text-[#666] uppercase font-bold">Zoom</span>
          <div className="flex gap-1">
            <button onClick={() => handleZoom(true)} className="p-1 bg-[#252525] hover:bg-blue-600 hover:text-white rounded border border-[#333] transition flex items-center justify-center" id="nav-zoom-in" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleZoom(false)} className="p-1 bg-[#252525] hover:bg-blue-600 hover:text-white rounded border border-[#333] transition flex items-center justify-center" id="nav-zoom-out" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hover / Info Banner Overlay */}
      {hoveredElementInfo && (
        <div className="absolute bottom-4 left-4 bg-[#1a1a1a] border border-blue-500/50 p-2 rounded z-10 text-[10px] text-[#d1d1d1] shadow-2xl max-w-sm pointer-events-none transition-all duration-150 animate-fade-in" id="element-hover-box">
          <div className="text-[9px] font-mono text-blue-400 font-bold tracking-wider mb-0.5">{hoveredElementInfo.type.replace('Ifc', '')}</div>
          <div className="font-semibold text-white mb-0.5">{hoveredElementInfo.name}</div>
          <div className="text-[9px] text-[#666] font-mono">BIM Ref: {hoveredElementInfo.id}</div>
        </div>
      )}

      {/* Walkthrough instructions indicator */}
      {navMode === 'walkthrough' && (
        <div className="absolute top-4 left-4 bg-blue-950/90 border border-blue-500 p-2 rounded z-10 shadow-lg text-[10px] text-white flex items-center gap-2" id="walkthrough-tutorial-card">
          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
          <div className="font-mono text-[9px]" id="tutorial-keys">
            Keys: <span className="bg-[#1e1e1e] border border-[#444] text-white px-1 py-0.2 rounded text-[8px]">WASD</span> slide | <span className="bg-[#1e1e1e] border border-[#444] text-white px-1 py-0.2 rounded text-[8px]">QE</span> elevation. Drag canvas to rotate.
          </div>
        </div>
      )}

      {/* Measure Mode instructions banner */}
      {measureMode && (
        <div className="absolute top-4 left-4 bg-rose-950/90 border border-rose-500 p-2 rounded z-10 shadow-lg text-[10px] text-white flex items-center gap-2 animate-pulse" id="measure-tutorial-card">
          <Ruler className="w-3.5 h-3.5 text-rose-400" />
          <div className="font-mono text-[9px]" id="measure-tutorial-steps">
            {measurementStart ? (
              <span>Point 1: <b className="text-rose-400">{measurementStart.x.toFixed(1)}, {measurementStart.y.toFixed(1)}, {measurementStart.z.toFixed(1)}</b>. Select Point 2.</span>
            ) : (
              <span>Ruler: Click any mesh surface to specify the start coordinate.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
