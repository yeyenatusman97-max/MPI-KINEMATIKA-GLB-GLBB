import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  Camera, 
  Layers, 
  Compass, 
  Eye, 
  Activity, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Maximize2 
} from 'lucide-react';

interface EscalatorGLB3DPlayerProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
}

export type CinematicSceneMode = 'auto' | 'scene1' | 'scene2' | 'scene5';

// Pre-allocated math objects to avoid garbage collection
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _currentLook = new THREE.Vector3();

export const EscalatorGLB3DPlayer: React.FC<EscalatorGLB3DPlayerProps> = ({
  currentTime,
  duration,
  isPlaying,
  onSeek
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sceneMode, setSceneMode] = useState<CinematicSceneMode>('auto');
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('Adegan 1: Tampilan Awal');
  const [showKinematicsOverlay, setShowKinematicsOverlay] = useState<boolean>(true);
  const [showReferenceFrames, setShowReferenceFrames] = useState<boolean>(true);

  // References for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Dynamic scene meshes to animate
  const riderGroupRef = useRef<THREE.Group | null>(null);
  const stepsGroupRef = useRef<THREE.Group | null>(null);
  const handrailStripeRef = useRef<THREE.Mesh | null>(null);
  const intervalMarkersGroupRef = useRef<THREE.Group | null>(null);
  const vectorArrowRef = useRef<THREE.Group | null>(null);
  const teenChestRef = useRef<THREE.Mesh | null>(null);
  const teenHeadRef = useRef<THREE.Group | null>(null);

  // Escalator geometric constants
  const ESC_ANGLE = Math.PI / 6; // 30 degrees standard incline
  const ESC_LENGTH = 11.0;
  const ESC_START_X = -4.5;
  const ESC_START_Y = 0.35;
  const ESC_START_Z = 0.0;
  const ESC_DX = Math.cos(ESC_ANGLE) * ESC_LENGTH; // ~9.52m
  const ESC_DY = Math.sin(ESC_ANGLE) * ESC_LENGTH; // ~5.50m
  const NUM_STEPS = 22;
  const STEP_DEPTH = 0.52;
  const STEP_WIDTH = 1.35;
  const STEP_HEIGHT = 0.28;
  const SPEED_V = 0.60; // m/s constant velocity (GLB)

  // Current effective scene depending on 'auto' or manual selection
  const getEffectiveScene = (mode: CinematicSceneMode, t: number): 'scene1' | 'scene2' | 'scene5' => {
    if (mode !== 'auto') return mode;
    // Auto Cinematic Sequence
    // 0s - 3.8s: Adegan 1 (Tampilan Awal Sinematik Atrium Mall)
    // 3.8s - 7.6s: Adegan 2 (Sudut Pandang Samping - Gerak Konstan & Diam Relatif)
    // 7.6s - 12s: Adegan 5 (Visualisasi Interval Waktu & Jarak Sama GLB)
    if (t < 3.8) return 'scene1';
    if (t < 7.6) return 'scene2';
    return 'scene5';
  };

  const effectiveScene = getEffectiveScene(sceneMode, currentTime);

  useEffect(() => {
    if (effectiveScene === 'scene1') {
      setActiveCameraLabel('Adegan 1: Tampilan Awal Sinematik (Atrium Mall)');
    } else if (effectiveScene === 'scene2') {
      setActiveCameraLabel('Adegan 2: Sudut Pandang Samping (Gerak Konstan)');
    } else {
      setActiveCameraLabel('Adegan 5: Visualisasi Interval Waktu Sama (Δs Konstan)');
    }
  }, [effectiveScene]);

  // Initialize Three.js Scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#080d1a');
    scene.fog = new THREE.FogExp2('#080d1a', 0.022);

    const aspect = container.clientWidth / (container.clientHeight || 1);
    const camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    camera.position.set(4.5, 3.8, 8.2);
    _currentLook.set(0.5, 2.5, 0);
    camera.lookAt(_currentLook);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 3. Procedural Studio / Room Environment for PBR reflections
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback ambient
    }

    // 4. Lighting Rig (Warm/Cool Contrast & Soft Key Light)
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x1e293b, 1.2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirKeyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    dirKeyLight.position.set(6, 14, 8);
    dirKeyLight.castShadow = !isSoftwareGl;
    if (dirKeyLight.shadow) {
      dirKeyLight.shadow.mapSize.width = 1024;
      dirKeyLight.shadow.mapSize.height = 1024;
      dirKeyLight.shadow.camera.near = 0.5;
      dirKeyLight.shadow.camera.far = 30;
      dirKeyLight.shadow.camera.left = -10;
      dirKeyLight.shadow.camera.right = 10;
      dirKeyLight.shadow.camera.top = 10;
      dirKeyLight.shadow.camera.bottom = -10;
      dirKeyLight.shadow.bias = -0.0004;
    }
    scene.add(dirKeyLight);

    const interiorFillLight = new THREE.PointLight(0x38bdf8, 1.5, 25);
    interiorFillLight.position.set(-4, 6, 2);
    scene.add(interiorFillLight);

    const warmBalconyLight = new THREE.PointLight(0xfbbf24, 1.2, 20);
    warmBalconyLight.position.set(5, 7, -2);
    scene.add(warmBalconyLight);

    // -------------------------------------------------------------------------
    // 5. PROCEDURAL TEXTURES (Zero 404 dependencies)
    // -------------------------------------------------------------------------
    const createFloorTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 512, 512);

      // Marble tiles with light joints
      ctx.strokeStyle = 'rgba(75, 85, 99, 0.45)';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 250, 250);
      ctx.strokeRect(258, 4, 250, 250);
      ctx.strokeRect(4, 258, 250, 250);
      ctx.strokeRect(258, 258, 250, 250);

      // Subtle marble vein texture
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.12)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, Math.random() * 512);
        ctx.bezierCurveTo(
          Math.random() * 512, Math.random() * 512,
          Math.random() * 512, Math.random() * 512,
          Math.random() * 512, Math.random() * 512
        );
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 8);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const createStoreSignTexture = (text: string, color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 500, 116);
      ctx.fillStyle = color;
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 64);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    // -------------------------------------------------------------------------
    // 6. MODERN SHOPPING MALL ENVIRONMENT
    // -------------------------------------------------------------------------
    const mallGroup = new THREE.Group();
    scene.add(mallGroup);

    // Ground Floor: Polished Marble Floor
    const floorGeo = new THREE.PlaneGeometry(35, 25);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createFloorTexture(),
      roughness: 0.15,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !isSoftwareGl;
    mallGroup.add(floor);

    // Upper Floor / Mezzanine Balcony Level (y = ESC_DY)
    const upperFloorGeo = new THREE.BoxGeometry(22, 0.4, 16);
    const upperFloorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.2
    });
    const upperFloor = new THREE.Mesh(upperFloorGeo, upperFloorMat);
    upperFloor.position.set(ESC_START_X + ESC_DX + 7.5, ESC_DY - 0.2, 0);
    upperFloor.receiveShadow = !isSoftwareGl;
    mallGroup.add(upperFloor);

    // Balcony Glass Railing
    const railingGeo = new THREE.BoxGeometry(16, 1.1, 0.08);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.6,
      ior: 1.5
    });
    const railing = new THREE.Mesh(railingGeo, glassMat);
    railing.position.set(ESC_START_X + ESC_DX + 4.5, ESC_DY + 0.55, 3.2);
    mallGroup.add(railing);

    // Upper Balcony Edge Chrome Trim with LED Strip
    const trimGeo = new THREE.BoxGeometry(16, 0.08, 0.12);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });
    const trim = new THREE.Mesh(trimGeo, ledMat);
    trim.position.set(ESC_START_X + ESC_DX + 4.5, ESC_DY + 1.1, 3.2);
    mallGroup.add(trim);

    // Architectural Mall Columns (Pillars)
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.4
    });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.1,
      metalness: 0.85
    });

    const addPillar = (x: number, z: number, height: number) => {
      const pGroup = new THREE.Group();
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, height, 24), pillarMat);
      col.position.y = height / 2;
      col.castShadow = !isSoftwareGl;
      col.receiveShadow = !isSoftwareGl;
      pGroup.add(col);

      // Metallic trim rings
      for (const ry of [0.5, height - 0.5]) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.18, 24), ringMat);
        ring.position.y = ry;
        pGroup.add(ring);
      }
      pGroup.position.set(x, 0, z);
      mallGroup.add(pGroup);
    };

    addPillar(-6.5, -4.5, 9.5);
    addPillar(2.0, -4.5, 9.5);
    addPillar(9.5, -4.5, 9.5);
    addPillar(-6.5, 4.5, 9.5);

    // Mall Storefronts on Back Wall (y = 0 to 8, z = -6.5)
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(35, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
    );
    backWall.position.set(2, 5.5, -6.5);
    mallGroup.add(backWall);

    // Glowing Storefront Sign 1: "NEWTON DYNAMICS"
    const sign1Mat = new THREE.MeshStandardMaterial({
      map: createStoreSignTexture('NEWTON PHYSICS HUB', '#38bdf8'),
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const sign1 = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.3), sign1Mat);
    sign1.position.set(-2, 4.8, -6.4);
    mallGroup.add(sign1);

    // Glowing Storefront Sign 2: "MODERN ATRIUM"
    const sign2Mat = new THREE.MeshStandardMaterial({
      map: createStoreSignTexture('ATRIUM CAFE & BOOKS', '#f59e0b'),
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const sign2 = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.3), sign2Mat);
    sign2.position.set(6.5, 4.8, -6.4);
    mallGroup.add(sign2);

    // Suspended Atrium LED Ring Chandelier (Ceiling Feature)
    const ringChandelier = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.08, 16, 48),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfef08a,
        emissiveIntensity: 2.2,
        roughness: 0.1
      })
    );
    ringChandelier.rotation.x = Math.PI / 2;
    ringChandelier.position.set(1.5, 8.8, 0);
    mallGroup.add(ringChandelier);

    // Potted Ornamental Palm Plant near escalator landing
    const plantGroup = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.32, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2, metalness: 0.7 })
    );
    pot.position.y = 0.4;
    plantGroup.add(pot);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.4, 5), leafMat);
      leaf.position.set(0, 0.8, 0);
      leaf.rotation.z = 0.4 + (i % 2) * 0.2;
      leaf.rotation.y = (i * Math.PI * 2) / 7;
      plantGroup.add(leaf);
    }
    plantGroup.position.set(-3.5, 0, 2.2);
    mallGroup.add(plantGroup);

    // -------------------------------------------------------------------------
    // 7. 3D ESCALATOR RIG (Structure, Glass Balustrades & Steps)
    // -------------------------------------------------------------------------
    const escalatorMain = new THREE.Group();
    scene.add(escalatorMain);

    // Metallic Side Truss Body
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.75
    });
    const trussTrimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.15,
      metalness: 0.95
    });

    // Main inclined truss beam
    const trussBeamGeo = new THREE.BoxGeometry(ESC_LENGTH + 1.2, 0.7, 1.75);
    const trussBeam = new THREE.Mesh(trussBeamGeo, trussMat);
    trussBeam.position.set(
      ESC_START_X + ESC_DX / 2,
      ESC_START_Y + ESC_DY / 2 - 0.45,
      ESC_START_Z
    );
    trussBeam.rotation.z = ESC_ANGLE;
    trussBeam.castShadow = !isSoftwareGl;
    trussBeam.receiveShadow = !isSoftwareGl;
    escalatorMain.add(trussBeam);

    // Lower and Upper Landing Comb Plates (Stainless steel with yellow safety demarcation)
    const lowerComb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.75), trussTrimMat);
    lowerComb.position.set(ESC_START_X - 0.7, ESC_START_Y - 0.1, ESC_START_Z);
    escalatorMain.add(lowerComb);

    const upperComb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.75), trussTrimMat);
    upperComb.position.set(ESC_START_X + ESC_DX + 0.7, ESC_START_Y + ESC_DY - 0.1, ESC_START_Z);
    escalatorMain.add(upperComb);

    // Yellow safety comb teeth stripe
    const yellowCombMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      emissive: 0xca8a04,
      emissiveIntensity: 0.3,
      roughness: 0.3
    });
    const lowerYellowComb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 1.5), yellowCombMat);
    lowerYellowComb.position.set(ESC_START_X + 0.05, ESC_START_Y + 0.02, ESC_START_Z);
    escalatorMain.add(lowerYellowComb);

    // Glass Balustrades (Left & Right)
    const balustradeGeo = new THREE.BoxGeometry(ESC_LENGTH + 0.8, 1.1, 0.05);
    const leftGlass = new THREE.Mesh(balustradeGeo, glassMat);
    leftGlass.position.set(
      ESC_START_X + ESC_DX / 2,
      ESC_START_Y + ESC_DY / 2 + 0.55,
      ESC_START_Z + STEP_WIDTH / 2 + 0.08
    );
    leftGlass.rotation.z = ESC_ANGLE;
    escalatorMain.add(leftGlass);

    const rightGlass = new THREE.Mesh(balustradeGeo, glassMat);
    rightGlass.position.set(
      ESC_START_X + ESC_DX / 2,
      ESC_START_Y + ESC_DY / 2 + 0.55,
      ESC_START_Z - STEP_WIDTH / 2 - 0.08
    );
    rightGlass.rotation.z = ESC_ANGLE;
    escalatorMain.add(rightGlass);

    // Black Rubber Moving Handrails (Left & Right)
    const handrailGeo = new THREE.BoxGeometry(ESC_LENGTH + 1.2, 0.12, 0.16);
    const handrailMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.2
    });
    const leftHandrail = new THREE.Mesh(handrailGeo, handrailMat);
    leftHandrail.position.set(
      ESC_START_X + ESC_DX / 2,
      ESC_START_Y + ESC_DY / 2 + 1.1,
      ESC_START_Z + STEP_WIDTH / 2 + 0.08
    );
    leftHandrail.rotation.z = ESC_ANGLE;
    escalatorMain.add(leftHandrail);

    const rightHandrail = new THREE.Mesh(handrailGeo, handrailMat);
    rightHandrail.position.set(
      ESC_START_X + ESC_DX / 2,
      ESC_START_Y + ESC_DY / 2 + 1.1,
      ESC_START_Z - STEP_WIDTH / 2 - 0.08
    );
    rightHandrail.rotation.z = ESC_ANGLE;
    escalatorMain.add(rightHandrail);

    // Moving indicator stripe along right handrail to visualize constant speed
    const stripeGeo = new THREE.BoxGeometry(0.35, 0.13, 0.18);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const handrailStripe = new THREE.Mesh(stripeGeo, stripeMat);
    handrailStripe.rotation.z = ESC_ANGLE;
    escalatorMain.add(handrailStripe);
    handrailStripeRef.current = handrailStripe;

    // -------------------------------------------------------------------------
    // 8. ESCALATOR STEPS HIERARCHY (Procedural Grooved Metal Steps)
    // -------------------------------------------------------------------------
    const stepsGroup = new THREE.Group();
    escalatorMain.add(stepsGroup);
    stepsGroupRef.current = stepsGroup;

    const stepBodyMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.8
    });
    const stepYellowMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.4,
      metalness: 0.2
    });

    // Create pooled step meshes
    for (let i = 0; i < NUM_STEPS; i++) {
      const stepMeshGroup = new THREE.Group();

      // Step Tread (Horizontal top face)
      const tread = new THREE.Mesh(new THREE.BoxGeometry(STEP_DEPTH, 0.04, STEP_WIDTH), stepBodyMat);
      tread.position.set(0, 0, 0);
      tread.castShadow = !isSoftwareGl;
      tread.receiveShadow = !isSoftwareGl;
      stepMeshGroup.add(tread);

      // Yellow Demarcation lines (Front & Side borders of step tread)
      const frontYellow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.042, STEP_WIDTH), stepYellowMat);
      frontYellow.position.set(STEP_DEPTH / 2 - 0.02, 0.002, 0);
      stepMeshGroup.add(frontYellow);

      const sideYellow1 = new THREE.Mesh(new THREE.BoxGeometry(STEP_DEPTH, 0.042, 0.04), stepYellowMat);
      sideYellow1.position.set(0, 0.002, STEP_WIDTH / 2 - 0.02);
      stepMeshGroup.add(sideYellow1);

      const sideYellow2 = new THREE.Mesh(new THREE.BoxGeometry(STEP_DEPTH, 0.042, 0.04), stepYellowMat);
      sideYellow2.position.set(0, 0.002, -STEP_WIDTH / 2 + 0.02);
      stepMeshGroup.add(sideYellow2);

      // Step Riser (Vertical face)
      const riser = new THREE.Mesh(new THREE.BoxGeometry(0.03, STEP_HEIGHT, STEP_WIDTH), stepBodyMat);
      riser.position.set(-STEP_DEPTH / 2 + 0.015, -STEP_HEIGHT / 2, 0);
      riser.castShadow = !isSoftwareGl;
      riser.receiveShadow = !isSoftwareGl;
      stepMeshGroup.add(riser);

      stepMeshGroup.userData = { index: i };
      stepsGroup.add(stepMeshGroup);
    }

    // -------------------------------------------------------------------------
    // 9. TEENAGER 3D CHARACTER (Procedural Cartoon-Realistic 3D Character)
    // Berdiri tegak di atas SATU anak tangga eskalator.
    // Kedua kaki tetap berada pada anak tangga yang sama.
    // -------------------------------------------------------------------------
    const riderGroup = new THREE.Group();
    scene.add(riderGroup);
    riderGroupRef.current = riderGroup;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.55,
      metalness: 0.05
    });
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Trendy Cyan/Blue Jacket
      roughness: 0.45,
      metalness: 0.15
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.6
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark denim jeans
      roughness: 0.7
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x3b1e08, // Stylish dark brown layered hair
      roughness: 0.65
    });
    const phoneMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.8,
      roughness: 0.2
    });

    // 1. Shoes & Feet: Firmly placed side-by-side on the step tread
    // Left shoe
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.10, 0.12), shoeMat);
    leftShoe.position.set(0.04, 0.05, 0.14);
    riderGroup.add(leftShoe);

    // Right shoe
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.10, 0.12), shoeMat);
    rightShoe.position.set(0.04, 0.05, -0.14);
    riderGroup.add(rightShoe);

    // Sole trims
    const soleTrimMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });
    const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.13), soleTrimMat);
    leftSole.position.set(0.04, 0.01, 0.14);
    riderGroup.add(leftSole);
    const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.13), soleTrimMat);
    rightSole.position.set(0.04, 0.01, -0.14);
    riderGroup.add(rightSole);

    // 2. Legs: Straight upright standing posture (No walking, no stepping)
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.82, 16);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(0, 0.50, 0.14);
    leftLeg.castShadow = !isSoftwareGl;
    riderGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0, 0.50, -0.14);
    rightLeg.castShadow = !isSoftwareGl;
    riderGroup.add(rightLeg);

    // Pelvis / Hips
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.42), pantsMat);
    pelvis.position.set(0, 0.96, 0);
    riderGroup.add(pelvis);

    // 3. Torso / Trendy Jacket & Inner Shirt
    const chestGroup = new THREE.Group();
    chestGroup.position.set(0, 1.30, 0);
    riderGroup.add(chestGroup);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.54, 0.48), jacketMat);
    torso.castShadow = !isSoftwareGl;
    chestGroup.add(torso);
    teenChestRef.current = torso;

    // White shirt collar visible in front
    const shirtCollar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.16), shirtMat);
    shirtCollar.position.set(0.14, 0.18, 0);
    chestGroup.add(shirtCollar);

    // 4. Arms: Natural relaxed posture with handrail support
    // Right arm holding moving handrail stably
    const rArmUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.38, 12), jacketMat);
    rArmUpper.position.set(0.05, 1.25, -0.32);
    rArmUpper.rotation.x = -0.35;
    rArmUpper.rotation.z = -0.30;
    riderGroup.add(rArmUpper);

    const rArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.42, 12), jacketMat);
    rArmLower.position.set(0.18, 1.05, -0.48);
    rArmLower.rotation.x = -0.7;
    rArmLower.rotation.z = -0.45;
    riderGroup.add(rArmLower);

    // Right Hand securely resting on the moving handrail
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), skinMat);
    rightHand.position.set(0.24, 0.92, -0.62);
    riderGroup.add(rightHand);

    // Left arm relaxed, holding modern phone
    const lArmUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.38, 12), jacketMat);
    lArmUpper.position.set(0.04, 1.25, 0.30);
    lArmUpper.rotation.x = 0.25;
    lArmUpper.rotation.z = -0.2;
    riderGroup.add(lArmUpper);

    const lArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.34, 12), jacketMat);
    lArmLower.position.set(0.12, 1.05, 0.34);
    lArmLower.rotation.x = 0.4;
    lArmLower.rotation.z = -0.6;
    riderGroup.add(lArmLower);

    // Left Hand holding phone
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), skinMat);
    leftHand.position.set(0.18, 0.98, 0.32);
    riderGroup.add(leftHand);

    const smartphone = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.08), phoneMat);
    smartphone.position.set(0.20, 1.00, 0.32);
    smartphone.rotation.y = 0.2;
    riderGroup.add(smartphone);

    // 5. Head & Face
    const headGroup = new THREE.Group();
    headGroup.position.set(0.02, 1.74, 0);
    riderGroup.add(headGroup);
    teenHeadRef.current = headGroup;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), skinMat);
    head.castShadow = !isSoftwareGl;
    headGroup.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), hairMat);
    hair.position.set(-0.01, 0.04, 0);
    headGroup.add(hair);

    // Stylized eyes looking forward
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
    eye1.position.set(0.14, 0.01, 0.05);
    headGroup.add(eye1);

    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
    eye2.position.set(0.14, 0.01, -0.05);
    headGroup.add(eye2);

    // -------------------------------------------------------------------------
    // 10. ADEGAN 5: KINEMATICS TIME-INTERVAL MARKERS & VELOCITY VECTOR
    // Visualisasi perpindahan posisi pada setiap interval waktu sama besar (Δs konstan)
    // -------------------------------------------------------------------------
    const intervalGroup = new THREE.Group();
    scene.add(intervalGroup);
    intervalMarkersGroupRef.current = intervalGroup;

    // Fixed Spatial Checkpoints along the escalator track at each second (t = 0s, 1s, 2s, ... 10s)
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.1
    });

    const createTextCanvasTexture = (str: string, bg: string, textCol: string) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = bg;
      ctx.roundRect(4, 4, 248, 120, 16);
      ctx.fill();
      ctx.strokeStyle = textCol;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = textCol;
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(str, 128, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const numCheckpoints = 8;
    for (let k = 0; k <= numCheckpoints; k++) {
      const prog = (k * 0.60) / ESC_LENGTH; // speed v=0.6m/s, dt=1.0s -> ds=0.60m
      if (prog > 0.85) break;

      const mx = ESC_START_X + prog * ESC_DX;
      const my = ESC_START_Y + prog * ESC_DY + 0.15;
      const mz = ESC_START_Z + STEP_WIDTH / 2 + 0.45;

      const markerPin = new THREE.Group();
      markerPin.position.set(mx, my, mz);

      // Glowing vertical beacon cylinder
      const pinCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12), markerMat);
      pinCyl.position.y = 0.3;
      markerPin.add(pinCyl);

      // Glowing sphere at top of pin
      const pinSphere = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), markerMat);
      pinSphere.position.y = 0.65;
      markerPin.add(pinSphere);

      // Text billboard displaying time and position
      const labelTex = createTextCanvasTexture(`t=${k}s\nΔs=0.6m`, 'rgba(15,23,42,0.85)', '#38bdf8');
      const labelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.35),
        new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, side: THREE.DoubleSide })
      );
      labelMesh.position.set(0, 0.95, 0);
      labelMesh.rotation.y = -Math.PI / 6;
      markerPin.add(labelMesh);

      intervalGroup.add(markerPin);

      // Interval distance bracket connecting k and k+1
      if (k < numCheckpoints - 1) {
        const nextProg = ((k + 1) * 0.60) / ESC_LENGTH;
        if (nextProg <= 0.85) {
          const nmx = ESC_START_X + nextProg * ESC_DX;
          const nmy = ESC_START_Y + nextProg * ESC_DY + 0.15;

          const bracketGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(mx, my + 0.3, mz),
            new THREE.Vector3((mx + nmx) / 2, (my + nmy) / 2 + 0.45, mz),
            new THREE.Vector3(nmx, nmy + 0.3, mz)
          ]);
          const bracketLine = new THREE.Line(
            bracketGeo,
            new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 })
          );
          intervalGroup.add(bracketLine);
        }
      }
    }

    // Dynamic Velocity Vector Arrow attached to the rider
    const vectorGroup = new THREE.Group();
    scene.add(vectorGroup);
    vectorArrowRef.current = vectorGroup;

    // Arrow Shaft
    const arrowShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.4, 12),
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x16a34a,
        emissiveIntensity: 1.5
      })
    );
    arrowShaft.position.set(0.7, 0, 0);
    arrowShaft.rotation.z = -Math.PI / 2;
    vectorGroup.add(arrowShaft);

    // Arrow Head
    const arrowHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.35, 16),
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x16a34a,
        emissiveIntensity: 1.5
      })
    );
    arrowHead.position.set(1.45, 0, 0);
    arrowHead.rotation.z = -Math.PI / 2;
    vectorGroup.add(arrowHead);

    vectorGroup.rotation.z = ESC_ANGLE;

    // -------------------------------------------------------------------------
    // 11. ANIMATION TICK LOOP
    // -------------------------------------------------------------------------
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 1;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();

      // Read latest props/time via ref or calculate
      // Person & Step Motion GLB:
      // Person stays firmly locked on Step #4 (for example)
      // All steps glide upward at constant speed: v = 0.60 m/s
      const currentT = currentTime;
      const totalDist = currentT * SPEED_V;
      const normProgress = ((totalDist % (ESC_LENGTH * 0.72)) / ESC_LENGTH);

      // Position of the rider's designated step:
      // The person's feet remain locked onto the EXACT same step!
      const riderProg = 0.12 + normProgress;
      const riderX = ESC_START_X + riderProg * ESC_DX;
      const riderY = ESC_START_Y + riderProg * ESC_DY + 0.02; // stands exactly on the tread top
      const riderZ = ESC_START_Z;

      if (riderGroupRef.current) {
        riderGroupRef.current.position.set(riderX, riderY, riderZ);

        // Natural subtle idle breathing & micro-motion (character feels alive, feet locked)
        const breathe = Math.sin(currentT * 2.5) * 0.015;
        if (teenChestRef.current) {
          teenChestRef.current.scale.set(1 + breathe * 0.8, 1 + breathe * 0.5, 1 + breathe * 0.8);
        }
        if (teenHeadRef.current) {
          teenHeadRef.current.rotation.x = Math.sin(currentT * 1.5) * 0.03;
          teenHeadRef.current.rotation.y = Math.sin(currentT * 0.8) * 0.04;
        }
      }

      // Update moving handrail stripe to show rubber motion
      if (handrailStripeRef.current) {
        const hProg = (riderProg + 0.15) % 0.85;
        const hx = ESC_START_X + hProg * ESC_DX;
        const hy = ESC_START_Y + hProg * ESC_DY + 1.1;
        handrailStripeRef.current.position.set(hx, hy, ESC_START_Z - STEP_WIDTH / 2 - 0.08);
      }

      // Update escalator steps: continuous cyclical glide at constant speed
      if (stepsGroupRef.current) {
        const stepSpacing = 1.0 / NUM_STEPS;
        stepsGroupRef.current.children.forEach((stepChild, idx) => {
          // Each step advances by normProgress
          const baseOffset = (idx / NUM_STEPS);
          const stepP = (baseOffset + normProgress) % 1.0;
          if (stepP >= 0.0 && stepP <= 0.88) {
            stepChild.visible = true;
            const sx = ESC_START_X + stepP * ESC_DX;
            const sy = ESC_START_Y + stepP * ESC_DY;
            stepChild.position.set(sx, sy, ESC_START_Z);
          } else {
            stepChild.visible = false;
          }
        });
      }

      // Velocity Vector Arrow: tracks the rider
      if (vectorArrowRef.current) {
        vectorArrowRef.current.position.set(riderX + 0.1, riderY + 1.1, riderZ + 0.35);
      }

      // -----------------------------------------------------------------------
      // CAMERA CINEMATICS (Adegan 1, Adegan 2, Adegan 5)
      // Smooth exponential damping transitions
      // -----------------------------------------------------------------------
      const currentCamera = cameraRef.current;
      if (currentCamera) {
        if (effectiveScene === 'scene1') {
          // Adegan 1: Tampilan Awal Sinematik (Atrium Mall Overview & Eskalator)
          _targetPos.set(ESC_START_X + 2.5, 3.8, 6.8);
          _targetLook.set(riderX + 0.8, riderY + 0.8, riderZ);
        } else if (effectiveScene === 'scene2') {
          // Adegan 2: Sudut Pandang Samping (True Side Profile)
          // Kamera sejajar dengan sumbu gerak eskalator
          _targetPos.set(riderX, riderY + 0.8, riderZ + 4.8);
          _targetLook.set(riderX, riderY + 0.7, riderZ);
        } else {
          // Adegan 5: Visualisasi Kinematika Interval Waktu Konstan GLB
          // Sudut miring 3/4 mengamati checkpoint interval waktu dan vektor kecepatan
          _targetPos.set(riderX - 1.8, riderY + 1.8, riderZ + 3.4);
          _targetLook.set(riderX + 1.0, riderY + 0.9, riderZ);
        }

        currentCamera.position.lerp(_targetPos, 0.06);
        _currentLook.lerp(_targetLook, 0.06);
        currentCamera.lookAt(_currentLook);
      }

      // Render scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full block" />

      {/* Top Left: Cinematic Active Scene Badge */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-md shadow-xl text-white">
          <Camera className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-black tracking-tight">{activeCameraLabel}</span>
        </div>

        {/* GLB Key Kinematic Telemetry */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono backdrop-blur-md text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Kecepatan:</span>
            <span className="font-bold text-emerald-400">v = 0.60 m/s (Konstan)</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Percepatan:</span>
            <span className="font-bold text-sky-400">a = 0.00 m/s²</span>
          </div>
        </div>
      </div>

      {/* Top Right: Reference Frames Comparison Badge (Kerangka Acuan) */}
      {showReferenceFrames && (
        <div className="absolute top-3 right-3 z-20 hidden sm:flex flex-col gap-1.5 max-w-[270px] pointer-events-none">
          <div className="p-2.5 rounded-2xl bg-slate-950/85 border border-sky-500/30 backdrop-blur-md shadow-xl space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-sky-300 font-bold font-mono">
              <Compass className="h-3.5 w-3.5" />
              <span>PENGAMATAN KERANGKA ACUAN:</span>
            </div>
            <div className="space-y-1 text-slate-300 leading-tight">
              <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">1. Terhadap Anak Tangga:</span>
                <span className="font-bold text-amber-300 font-mono">v_rel = 0 m/s (DIAM)</span>
                <p className="text-[10px] text-slate-400">Kaki tetap di anak tangga yang sama</p>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">2. Terhadap Lantai Gedung:</span>
                <span className="font-bold text-emerald-400 font-mono">v = 0.60 m/s (GLB)</span>
                <p className="text-[10px] text-slate-400">Berpindah konstan terhadap mall</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Center: Camera & Scene Director Dock (Zero Occlusion, Sleek Pill Controls) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-md shadow-2xl max-w-[95%] overflow-x-auto">
        <button
          onClick={() => setSceneMode('auto')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            sceneMode === 'auto'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-indigo-300'
              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Urutan Otomatis Mengikuti Alur Video"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>Auto Sinematik</span>
        </button>

        <button
          onClick={() => setSceneMode('scene1')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            sceneMode === 'scene1'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/40'
              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Adegan 1: Tampilan Awal Eskalator & Atrium Mall"
        >
          <span>Adegan 1 (Awal)</span>
        </button>

        <button
          onClick={() => setSceneMode('scene2')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            sceneMode === 'scene2'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/40'
              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Adegan 2: Sudut Pandang Samping Memperlihatkan Gerak & Kaki Diam"
        >
          <span>Adegan 2 (Samping)</span>
        </button>

        <button
          onClick={() => setSceneMode('scene5')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            sceneMode === 'scene5'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40'
              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Adegan 5: Visualisasi Interval Waktu & Jarak Konstan GLB"
        >
          <Clock className="h-3.5 w-3.5 text-emerald-300" />
          <span>Adegan 5 (Interval Δs)</span>
        </button>
      </div>
    </div>
  );
};
