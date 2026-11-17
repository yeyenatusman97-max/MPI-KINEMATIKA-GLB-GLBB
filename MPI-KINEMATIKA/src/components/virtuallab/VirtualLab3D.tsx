import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Plus, 
  Trash2, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Activity, 
  Gauge, 
  Zap, 
  Compass, 
  Clock, 
  Split, 
  BookmarkCheck,
  Maximize2,
  Table
} from 'lucide-react';
import { MotionType, TelemetryPoint, ExperimentParams, ExperimentRun } from '../../types/physics';
import { calculateGLB, calculateGLBB, formatSci } from '../../utils/physicsEngine';
import { sounds } from '../../utils/soundEffects';
import { storage } from '../../utils/storage';
import { createProcedural3DCar } from './procedural3DCar';

// Pre-allocated reusable Three.js math vectors (Zero GC in render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export const VirtualLab3D: React.FC = () => {
  // Mode selection: GLB or GLBB
  const [labMode, setLabMode] = useState<MotionType>('GLB');
  const [dualMode, setDualMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'graphs' | 'table' | 'compare'>('controls');
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'top' | 'side' | 'follow'>('perspective');

  // Primary Experiment parameters
  const [x0, setX0] = useState(0); // initial position (m)
  const [v0, setV0] = useState(5); // initial velocity (m/s)
  const [a, setA] = useState(2);   // acceleration (m/s²)
  const [maxTime, setMaxTime] = useState(10); // observation duration (s)
  const [direction, setDirection] = useState<1 | -1>(1);

  // Secondary Cart (Dual comparison) parameters
  const [cart2V0, setCart2V0] = useState(3);
  const [cart2A, setCart2A] = useState(1);

  // Simulation execution state
  const [isRunning, setIsRunning] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 0.5x, 1x, 2x

  // Telemetry buffer & Table logs
  const [tableLogs, setTableLogs] = useState<TelemetryPoint[]>([]);
  const [isRecording, setIsRecording] = useState(true);

  // Canvas container ref
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number>(0);

  // 3D Subject Meshes
  const cart1GroupRef = useRef<THREE.Group | null>(null);
  const cart2GroupRef = useRef<THREE.Group | null>(null);
  const velArrow1Ref = useRef<THREE.ArrowHelper | null>(null);
  const accArrow1Ref = useRef<THREE.ArrowHelper | null>(null);
  const velArrow2Ref = useRef<THREE.ArrowHelper | null>(null);
  const accArrow2Ref = useRef<THREE.ArrowHelper | null>(null);
  const photogate1Ref = useRef<THREE.Group | null>(null);
  const photogate2Ref = useRef<THREE.Group | null>(null);

  // Current physics values (mutable refs for high-frequency animation loop)
  const simStateRef = useRef({
    isRunning: false,
    simTime: 0,
    labMode: 'GLB' as MotionType,
    x0: 0,
    v0: 5,
    a: 0,
    direction: 1,
    maxTime: 10,
    speedMultiplier: 1,
    dualMode: false,
    cart2V0: 3,
    cart2A: 1,
    lastTableLogTime: 0,
    currentX1: 0,
    currentV1: 0,
    currentA1: 0,
    currentDist1: 0,
    currentX2: 0,
    currentV2: 0,
    currentA2: 0,
  });

  // Graph Canvas refs
  const stCanvasRef = useRef<HTMLCanvasElement>(null);
  const vtCanvasRef = useRef<HTMLCanvasElement>(null);
  const atCanvasRef = useRef<HTMLCanvasElement>(null);
  const historyPointsRef = useRef<{ t: number; x: number; v: number; a: number; x2?: number; v2?: number; a2?: number }[]>([]);

  // Synchronize mutable refs with React state
  useEffect(() => {
    simStateRef.current.labMode = labMode;
    simStateRef.current.x0 = x0;
    simStateRef.current.v0 = v0;
    simStateRef.current.a = labMode === 'GLB' ? 0 : a;
    simStateRef.current.direction = direction;
    simStateRef.current.maxTime = maxTime;
    simStateRef.current.speedMultiplier = speedMultiplier;
    simStateRef.current.dualMode = dualMode;
    simStateRef.current.cart2V0 = cart2V0;
    simStateRef.current.cart2A = labMode === 'GLB' ? 0 : cart2A;
  }, [labMode, x0, v0, a, direction, maxTime, speedMultiplier, dualMode, cart2V0, cart2A]);

  // Three.js Scene Setup (Mount once)
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // Detect software GL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.008);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 38);
    camera.lookAt(20, 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x091122, 0.7);
    hemiLight.position.set(25, 30, 25);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(20, 35, 20);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 120;
      dirLight.shadow.camera.left = -40;
      dirLight.shadow.camera.right = 80;
      dirLight.shadow.camera.top = 40;
      dirLight.shadow.camera.bottom = -40;
      dirLight.shadow.bias = -0.0005;
    }
    scene.add(dirLight);

    // Floor Ground with Sci-Fi Grid
    const floorGeo = new THREE.PlaneGeometry(300, 160);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(40, -0.01, 0);
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    // Grid helper on floor
    const gridHelper = new THREE.GridHelper(200, 100, 0x06b6d4, 0x1e293b);
    gridHelper.position.set(40, 0, 0);
    scene.add(gridHelper);

    // BUILD AIR TRACK (Lintasan Lurus Presisi: panjang 120 meter)
    const trackGroup = new THREE.Group();

    // Aluminum Rail base
    const railGeo = new THREE.BoxGeometry(140, 0.6, 3.2);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.25,
    });
    const railMesh = new THREE.Mesh(railGeo, railMat);
    railMesh.position.set(50, 0.3, 0);
    railMesh.receiveShadow = true;
    railMesh.castShadow = true;
    trackGroup.add(railMesh);

    // Precision Top Guide Ridge (Electric track)
    const guideGeo = new THREE.BoxGeometry(140, 0.2, 0.4);
    const guideMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.3,
      metalness: 0.9,
      roughness: 0.1,
    });
    const guideMesh = new THREE.Mesh(guideGeo, guideMat);
    guideMesh.position.set(50, 0.65, 0);
    trackGroup.add(guideMesh);

    // Distance Markings & Scale (Every 5 meters a distinct marker post)
    for (let meter = -10; meter <= 110; meter += 5) {
      const isMajor = meter % 10 === 0;
      const tickGeo = new THREE.BoxGeometry(0.12, isMajor ? 0.35 : 0.2, 3.4);
      const tickMat = new THREE.MeshStandardMaterial({
        color: isMajor ? 0x38bdf8 : 0x94a3b8,
        emissive: isMajor ? 0x0284c7 : 0x000000,
        emissiveIntensity: isMajor ? 0.4 : 0,
      });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(meter, 0.62, 0);
      trackGroup.add(tick);

      // Support legs every 15 meters
      if (meter % 15 === 0) {
        const legGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 12);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(meter, 0.1, 0);
        trackGroup.add(leg);
      }
    }

    // End Stop Bumpers with springs
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.5 });
    [-10, 110].forEach((pos) => {
      const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 3.6), bumperMat);
      bumper.position.set(pos, 0.8, 0);
      bumper.castShadow = true;
      trackGroup.add(bumper);
    });

    scene.add(trackGroup);

    // Optical Photogates (Gate 1 at 10m, Gate 2 at 40m)
    const createPhotogate = (xPos: number, labelColor: number) => {
      const gate = new THREE.Group();
      const archShape = new THREE.BoxGeometry(0.8, 3.2, 4.2);
      const gateMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.7,
        roughness: 0.3,
      });
      const arch = new THREE.Mesh(archShape, gateMat);
      arch.position.set(0, 1.8, 0);
      gate.add(arch);

      // Optical beam (Laser line across track)
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.8, 8);
      const beamMat = new THREE.MeshBasicMaterial({ color: labelColor });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.x = Math.PI / 2;
      beam.position.set(0, 1.6, 0);
      gate.add(beam);

      gate.position.set(xPos, 0, 0);
      return gate;
    };

    const gate1 = createPhotogate(15, 0x06b6d4);
    photogate1Ref.current = gate1;
    scene.add(gate1);

    const gate2 = createPhotogate(50, 0xf97316);
    photogate2Ref.current = gate2;
    scene.add(gate2);

    // PROCEDURAL 3D EXPERIMENTAL CARS (Composite Multi-Part ExtrudeGeometry + Wheels)
    const cart1Handle = createProcedural3DCar({
      bodyColor: 0x0284c7,
      accentColor: 0x38bdf8,
      scale: 1.0,
      includeFlag: true,
    });
    const cart1 = cart1Handle.group;
    cart1.position.set(0, 0.6, 0);
    cart1GroupRef.current = cart1;
    scene.add(cart1);

    // Cart 2 (Dual Compare Orange)
    const cart2Handle = createProcedural3DCar({
      bodyColor: 0xea580c,
      accentColor: 0xfb923c,
      scale: 1.0,
      includeFlag: true,
    });
    const cart2 = cart2Handle.group;
    cart2.position.set(0, 0.6, 3.8); // Offset on Z
    cart2.visible = false;
    cart2GroupRef.current = cart2;
    scene.add(cart2);

    // Vector Indicators (Velocity Arrow & Acceleration Arrow)
    // Velocity Vector Arrow (Greenish cyan)
    const velArrow1 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 2.5, 0),
      4,
      0x22c55e,
      0.8,
      0.5
    );
    cart1.add(velArrow1);
    velArrow1Ref.current = velArrow1;

    // Acceleration Vector Arrow (Orange/Red)
    const accArrow1 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 3.2, 0),
      3,
      0xf97316,
      0.7,
      0.4
    );
    cart1.add(accArrow1);
    accArrow1Ref.current = accArrow1;

    // Cart 2 Arrows
    const velArrow2 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 2.5, 0),
      4,
      0x38bdf8,
      0.8,
      0.5
    );
    cart2.add(velArrow2);
    velArrow2Ref.current = velArrow2;

    const accArrow2 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 3.2, 0),
      3,
      0xf59e0b,
      0.7,
      0.4
    );
    cart2.add(accArrow2);
    accArrow2Ref.current = accArrow2;

    // High performance animation loop
    let lastTimestamp = performance.now();

    const tick = (now: number) => {
      const deltaSec = Math.min(0.1, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      const state = simStateRef.current;

      if (state.isRunning) {
        state.simTime += deltaSec * state.speedMultiplier;

        if (state.simTime >= state.maxTime) {
          state.simTime = state.maxTime;
          state.isRunning = false;
          setIsRunning(false);
          sounds.stopMotionHum();
          sounds.playFinish();
        } else {
          sounds.updateMotionHum(state.currentV1);
        }

        setSimTime(+state.simTime.toFixed(2));

        // Physics Calculation for Cart 1
        const t = state.simTime;
        let c1;
        if (state.labMode === 'GLB') {
          c1 = calculateGLB(state.x0, state.v0 * state.direction, t);
        } else {
          c1 = calculateGLBB(state.x0, state.v0 * state.direction, state.a * state.direction, t);
        }

        state.currentX1 = c1.x;
        state.currentV1 = c1.v;
        state.currentA1 = c1.a;
        state.currentDist1 = c1.distance;

        // Position Cart 1 & Rotate Alloy Wheels
        if (cart1GroupRef.current) {
          cart1GroupRef.current.position.x = c1.x;
          const rot1 = -(c1.x / 0.42);
          for (let i = 0; i < cart1Handle.wheels.length; i++) {
            cart1Handle.wheels[i].rotation.z = rot1;
          }
        }

        // Update Vector Arrows 1
        if (velArrow1Ref.current) {
          const vMag = Math.abs(c1.v);
          const vDir = c1.v >= 0 ? 1 : -1;
          velArrow1Ref.current.setDirection(_v1.set(vDir, 0, 0));
          velArrow1Ref.current.setLength(Math.max(0.1, Math.min(12, vMag * 0.8)), 0.6, 0.4);
          velArrow1Ref.current.visible = vMag > 0.05;
        }

        if (accArrow1Ref.current) {
          const aMag = Math.abs(c1.a);
          const aDir = c1.a >= 0 ? 1 : -1;
          accArrow1Ref.current.setDirection(_v2.set(aDir, 0, 0));
          accArrow1Ref.current.setLength(Math.max(0.1, Math.min(10, aMag * 1.2)), 0.5, 0.3);
          accArrow1Ref.current.visible = aMag > 0.01;
        }

        // If Dual Mode: Calculate Cart 2
        let c2: any = null;
        if (state.dualMode && cart2GroupRef.current) {
          cart2GroupRef.current.visible = true;
          if (state.labMode === 'GLB') {
            c2 = calculateGLB(state.x0, state.cart2V0 * state.direction, t);
          } else {
            c2 = calculateGLBB(state.x0, state.cart2V0 * state.direction, state.cart2A * state.direction, t);
          }
          state.currentX2 = c2.x;
          state.currentV2 = c2.v;
          state.currentA2 = c2.a;
          cart2GroupRef.current.position.x = c2.x;
          const rot2 = -(c2.x / 0.42);
          for (let i = 0; i < cart2Handle.wheels.length; i++) {
            cart2Handle.wheels[i].rotation.z = rot2;
          }

          if (velArrow2Ref.current) {
            velArrow2Ref.current.setLength(Math.max(0.1, Math.min(12, Math.abs(c2.v) * 0.8)));
          }
        } else if (cart2GroupRef.current) {
          cart2GroupRef.current.visible = false;
        }

        // Buffer points for Real-time Graphs
        historyPointsRef.current.push({
          t: +t.toFixed(2),
          x: +c1.x.toFixed(2),
          v: +c1.v.toFixed(2),
          a: +c1.a.toFixed(2),
          x2: c2 ? +c2.x.toFixed(2) : undefined,
          v2: c2 ? +c2.v.toFixed(2) : undefined,
          a2: c2 ? +c2.a.toFixed(2) : undefined,
        });

        // Periodic logging into Data Table (every 0.5s)
        if (t - state.lastTableLogTime >= 0.5 || t === state.maxTime) {
          state.lastTableLogTime = t;
          setTableLogs((prev) => [
            ...prev,
            {
              t: +t.toFixed(2),
              x: +c1.x.toFixed(2),
              v: +c1.v.toFixed(2),
              a: +c1.a.toFixed(2),
              s: +c1.distance.toFixed(2),
            },
          ]);
        }
      }

      // Camera preset updates
      if (cameraRef.current) {
        if (cameraPreset === 'follow' && cart1GroupRef.current) {
          const targetX = cart1GroupRef.current.position.x;
          cameraRef.current.position.x = THREE.MathUtils.damp(cameraRef.current.position.x, targetX + 15, 4, deltaSec);
          cameraRef.current.position.y = 8;
          cameraRef.current.position.z = 24;
          cameraRef.current.lookAt(targetX, 1.5, 0);
        } else if (cameraPreset === 'top') {
          cameraRef.current.position.set(40, 65, 0.1);
          cameraRef.current.lookAt(40, 0, 0);
        } else if (cameraPreset === 'side') {
          cameraRef.current.position.set(40, 6, 42);
          cameraRef.current.lookAt(40, 2, 0);
        } else {
          // Perspective default
          cameraRef.current.position.set(15, 16, 44);
          cameraRef.current.lookAt(35, 2, 0);
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        // Pace loop on software GL to avoid thread starvation
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            animFrameIdRef.current = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            animFrameIdRef.current = window.setTimeout(() => tick(performance.now()), 80);
          }
        };
        animFrameIdRef.current = window.setTimeout(poll, 5);
      } else {
        animFrameIdRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    // Resize listener
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameIdRef.current);
      clearTimeout(animFrameIdRef.current);
      sounds.stopMotionHum();
      cart1Handle.dispose();
      cart2Handle.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 2D Canvas Graphs whenever history points update
  useEffect(() => {
    const points = historyPointsRef.current;
    if (points.length < 2) return;

    const drawGraph = (
      canvas: HTMLCanvasElement | null,
      title: string,
      yLabel: string,
      getY: (p: any) => number,
      getY2?: (p: any) => number | undefined,
      color1: string = '#06b6d4',
      color2: string = '#f97316'
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, w, h);

      // Padding
      const padL = 40;
      const padR = 20;
      const padT = 30;
      const padB = 30;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;

      // Find Min and Max
      let minY = 0;
      let maxY = 1;
      points.forEach((p) => {
        const val1 = getY(p);
        if (val1 < minY) minY = val1;
        if (val1 > maxY) maxY = val1;
        if (getY2) {
          const val2 = getY2(p);
          if (val2 !== undefined) {
            if (val2 < minY) minY = val2;
            if (val2 > maxY) maxY = val2;
          }
        }
      });

      const maxT = Math.max(1, maxTime);
      const ySpan = Math.max(0.1, maxY - minY) * 1.15;
      const zeroY = padT + plotH - ((0 - minY) / ySpan) * plotH;

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padT + (plotH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();

        const gridVal = (maxY - (i / 5) * (maxY - minY)).toFixed(1);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText(gridVal, 4, y + 3);
      }

      // X Axis (Time)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, Math.min(h - padB, Math.max(padT, zeroY)));
      ctx.lineTo(w - padR, Math.min(h - padB, Math.max(padT, zeroY)));
      ctx.stroke();

      // Title & Labels
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`${title} (${yLabel})`, padL, 16);

      // Line 1 (Cart 1)
      ctx.strokeStyle = color1;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      points.forEach((p, idx) => {
        const x = padL + (p.t / maxT) * plotW;
        const y = padT + plotH - ((getY(p) - minY) / ySpan) * plotH;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Current moving cursor dot 1
      const lastP = points[points.length - 1];
      const curX = padL + (lastP.t / maxT) * plotW;
      const curY = padT + plotH - ((getY(lastP) - minY) / ySpan) * plotH;
      ctx.fillStyle = color1;
      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Line 2 (Dual Compare Cart 2)
      if (dualMode && getY2) {
        ctx.strokeStyle = color2;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        points.forEach((p, idx) => {
          const val2 = getY2(p);
          if (val2 !== undefined) {
            const x = padL + (p.t / maxT) * plotW;
            const y = padT + plotH - ((val2 - minY) / ySpan) * plotH;
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    drawGraph(stCanvasRef.current, 'Posisi terhadap Waktu', 's [m]', (p) => p.x, (p) => p.x2, '#06b6d4', '#f97316');
    drawGraph(vtCanvasRef.current, 'Kecepatan terhadap Waktu', 'v [m/s]', (p) => p.v, (p) => p.v2, '#38bdf8', '#fb923c');
    drawGraph(atCanvasRef.current, 'Percepatan terhadap Waktu', 'a [m/s²]', (p) => p.a, (p) => p.a2, '#a855f7', '#ec4899');
  }, [simTime, dualMode, maxTime]);

  // Controls Handlers
  const handleStart = () => {
    sounds.playStart();
    sounds.startMotionHum(speedMultiplier);
    simStateRef.current.isRunning = true;
    setIsRunning(true);
  };

  const handlePause = () => {
    sounds.playClick();
    sounds.stopMotionHum();
    simStateRef.current.isRunning = false;
    setIsRunning(false);
  };

  const handleReset = () => {
    sounds.playClick();
    sounds.stopMotionHum();
    simStateRef.current.isRunning = false;
    simStateRef.current.simTime = 0;
    simStateRef.current.lastTableLogTime = 0;
    setIsRunning(false);
    setSimTime(0);
    setTableLogs([]);
    historyPointsRef.current = [];

    // Reset 3D Carts
    if (cart1GroupRef.current) {
      cart1GroupRef.current.position.x = x0;
    }
    if (cart2GroupRef.current) {
      cart2GroupRef.current.position.x = x0;
    }

    // Reset graph canvases
    [stCanvasRef, vtCanvasRef, atCanvasRef].forEach((cRef) => {
      const c = cRef.current;
      if (c) {
        const ctx = c.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, c.width, c.height);
      }
    });
  };

  const handleSaveExperiment = () => {
    sounds.playClick();
    const state = simStateRef.current;
    const run: ExperimentRun = {
      id: 'exp_' + Date.now(),
      date: new Date().toLocaleTimeString('id-ID'),
      title: `Eksperimen ${state.labMode} (v₀=${state.v0} m/s, a=${state.a} m/s²)`,
      params: {
        id: 'p_' + Date.now(),
        name: `${state.labMode} Run`,
        motionType: state.labMode,
        x0: state.x0,
        v0: state.v0,
        a: state.a,
        maxTime: state.maxTime,
        color: state.labMode === 'GLB' ? '#06b6d4' : '#f97316',
      },
      telemetry: tableLogs,
      finalPosition: state.currentX1,
      finalVelocity: state.currentV1,
      duration: simTime,
    };
    storage.saveExperiment(run);
    alert('Hasil eksperimen berhasil disimpan ke riwayat dan portofolio!');
  };

  const handleExportCSV = () => {
    sounds.playClick();
    if (tableLogs.length === 0) {
      alert('Belum ada data pengamatan untuk diekspor!');
      return;
    }
    const headers = ['No', 'Waktu (s)', 'Posisi (m)', 'Kecepatan (m/s)', 'Percepatan (m/s²)', 'Jarak Tempuh (m)'];
    const rows = tableLogs.map((p, idx) => [
      idx + 1,
      p.t,
      p.x,
      p.v,
      p.a,
      p.s,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `physics_lab_${labMode.toLowerCase()}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Instant calculated current values
  const currentPos = simStateRef.current.currentX1;
  const currentVel = simStateRef.current.currentV1;
  const currentAcc = simStateRef.current.currentA1;
  const currentDist = simStateRef.current.currentDist1;

  return (
    <div className="relative min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* 3D Lab Top Bar */}
      <div className="border-b border-slate-800 bg-[#0a0f1d] pl-36 sm:pl-40 pr-4 py-3 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 font-mono tracking-wider">
              VIRTUAL LAB 3D
            </span>
            <span className="hidden sm:inline-block h-3 w-px bg-slate-700" />
            <span className="text-xs text-slate-400 hidden sm:inline">
              Simulasi Kereta & Lintasan Udara
            </span>
          </div>

          {/* Mode Switcher: GLB / GLBB */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => {
                sounds.playClick();
                setLabMode('GLB');
                handleReset();
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                labMode === 'GLB'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              GLB Lab (a = 0)
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setLabMode('GLBB');
                handleReset();
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                labMode === 'GLBB'
                  ? 'bg-orange-500 text-slate-950 shadow-sm shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              GLBB Lab (a ≠ 0)
            </button>
          </div>
        </div>

        {/* Camera Views & Dual Comparison */}
        <div className="flex items-center gap-2">
          {/* Dual Cart Comparison Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              setDualMode(!dualMode);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition ${
              dualMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-sm shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Split className="h-3.5 w-3.5" />
            <span>{dualMode ? 'Mode 2 Kereta Aktif' : 'Komparasi 2 Kereta'}</span>
          </button>

          {/* Camera Preset Selector */}
          <div className="hidden md:flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setCameraPreset('perspective')}
              className={`px-2 py-1 rounded ${cameraPreset === 'perspective' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              Perspektif
            </button>
            <button
              onClick={() => setCameraPreset('follow')}
              className={`px-2 py-1 rounded ${cameraPreset === 'follow' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              Ikuti Kereta
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              className={`px-2 py-1 rounded ${cameraPreset === 'top' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              Tampak Atas
            </button>
            <button
              onClick={() => setCameraPreset('side')}
              className={`px-2 py-1 rounded ${cameraPreset === 'side' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              Samping
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D Viewport Area */}
      <div className="relative flex-1 min-h-[440px] md:min-h-[520px] w-full overflow-hidden">
        {/* Three.js Isolated Canvas Mount */}
        <div ref={canvasMountRef} className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />

        {/* Minimal Spec Badge (Top-Left HUD) */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="hud-panel rounded-xl px-3.5 py-2 text-xs flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">STATUS SIMULASI</span>
              <span className={`font-bold ${isRunning ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isRunning ? 'SEDANG BERJALAN' : simTime > 0 ? 'TERJEDA / SELESAI' : 'STANDBY'}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">WAKTU (t)</span>
              <span className="font-mono font-extrabold text-cyan-300 text-sm">
                {simTime.toFixed(2)} s
              </span>
            </div>
          </div>
        </div>

        {/* Primary Telemetry Floating HUD (Top-Right) */}
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <div className="hud-panel rounded-xl p-3 text-xs w-60 sm:w-64 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
              <span className="font-bold text-cyan-400 flex items-center gap-1 font-mono text-[11px]">
                <Activity className="h-3.5 w-3.5" /> TELEMETRI KERETA 1
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SI UNITS</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Posisi (x)</span>
                <span className="font-mono font-bold text-white text-sm">{formatSci(currentPos)} m</span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Kecepatan (v)</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">{formatSci(currentVel)} m/s</span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Percepatan (a)</span>
                <span className="font-mono font-bold text-orange-400 text-sm">{formatSci(currentAcc)} m/s²</span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Jarak Tempuh</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{formatSci(currentDist)} m</span>
              </div>
            </div>

            {dualMode && (
              <div className="pt-2 border-t border-slate-800 text-[11px] text-orange-300 font-mono">
                Kereta 2: x={formatSci(simStateRef.current.currentX2)} m | v={formatSci(simStateRef.current.currentV2)} m/s
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion Directive) */}
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl transition-all duration-300 ${
          hudCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}>
          {/* Collapse / Expand Tab */}
          <div className="flex justify-center mb-1">
            <button
              onClick={() => {
                sounds.playClick();
                setHudCollapsed(!hudCollapsed);
              }}
              className="flex items-center gap-1.5 rounded-t-lg bg-slate-900/95 px-4 py-1 text-[11px] font-bold text-cyan-400 border-t border-x border-cyan-500/30 hover:bg-slate-800 shadow-md backdrop-blur-md"
            >
              {hudCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{hudCollapsed ? 'TAMPILKAN KONTROL LAB' : 'SEMBUNYIKAN KONTROL'}</span>
            </button>
          </div>

          {/* Unified Dock Container */}
          <div className="hud-panel rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
            {/* Control Dock Header: Tab switchers & Primary Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                {!isRunning ? (
                  <button
                    onClick={handleStart}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition"
                  >
                    <Play className="h-4 w-4 fill-slate-950" />
                    <span>MULAI</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 transition"
                  >
                    <Pause className="h-4 w-4 fill-slate-950" />
                    <span>JEDA</span>
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>RESET</span>
                </button>

                {/* Speed Multiplier */}
                <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
                  {[0.5, 1, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeedMultiplier(s)}
                      className={`px-2 py-1 rounded font-bold ${
                        speedMultiplier === s ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Panel Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('controls')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    activeTab === 'controls' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Parameter
                </button>
                <button
                  onClick={() => setActiveTab('graphs')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    activeTab === 'graphs' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Grafik Real-Time
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    activeTab === 'table' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tabel Data ({tableLogs.length})
                </button>
              </div>

              {/* Snapshot / Export */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveExperiment}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1.5 rounded-lg transition"
                >
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Simpan Sesi</span>
                </button>
              </div>
            </div>

            {/* Tab Body: 1. Controls / Sliders */}
            {activeTab === 'controls' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Initial Velocity v0 Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Kecepatan Awal (v₀):</span>
                    <span className="font-mono text-cyan-400 font-bold">{v0} m/s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    disabled={isRunning}
                    value={v0}
                    onChange={(e) => setV0(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0 m/s</span>
                    <span>10 m/s</span>
                    <span>20 m/s</span>
                  </div>
                </div>

                {/* Acceleration (a) Slider (for GLBB) */}
                {labMode === 'GLBB' ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Percepatan (a):</span>
                      <span className="font-mono text-orange-400 font-bold">{a} m/s²</span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="8"
                      step="0.5"
                      disabled={isRunning}
                      value={a}
                      onChange={(e) => setA(parseFloat(e.target.value))}
                      className="w-full slider-orange"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>-5 (Perlambatan)</span>
                      <span>0</span>
                      <span>+8 (Percepatan)</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Percepatan GLB</span>
                      <span className="font-mono font-bold text-cyan-400">a = 0.00 m/s²</span>
                    </div>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                      Konstan
                    </span>
                  </div>
                )}

                {/* Observation Time & Initial Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Posisi Awal (x₀)</label>
                    <input
                      type="number"
                      disabled={isRunning}
                      value={x0}
                      onChange={(e) => setX0(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Waktu Maks (s)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      disabled={isRunning}
                      value={maxTime}
                      onChange={(e) => setMaxTime(Math.max(1, parseFloat(e.target.value) || 10))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {/* Dual Comparison Controls (if enabled) */}
                {dualMode && (
                  <div className="md:col-span-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-amber-300 font-semibold">
                        <span>Kereta 2 Kecepatan Awal (v₀):</span>
                        <span className="font-mono font-bold">{cart2V0} m/s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.5"
                        disabled={isRunning}
                        value={cart2V0}
                        onChange={(e) => setCart2V0(parseFloat(e.target.value))}
                        className="w-full slider-orange"
                      />
                    </div>
                    {labMode === 'GLBB' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-amber-300 font-semibold">
                          <span>Kereta 2 Percepatan (a):</span>
                          <span className="font-mono font-bold">{cart2A} m/s²</span>
                        </div>
                        <input
                          type="range"
                          min="-5"
                          max="8"
                          step="0.5"
                          disabled={isRunning}
                          value={cart2A}
                          onChange={(e) => setCart2A(parseFloat(e.target.value))}
                          className="w-full slider-orange"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab Body: 2. Real-Time Graphs */}
            {activeTab === 'graphs' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                  <canvas ref={stCanvasRef} width={280} height={160} className="w-full h-auto rounded" />
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                  <canvas ref={vtCanvasRef} width={280} height={160} className="w-full h-auto rounded" />
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                  <canvas ref={atCanvasRef} width={280} height={160} className="w-full h-auto rounded" />
                </div>
              </div>
            )}

            {/* Tab Body: 3. Telemetry Data Table */}
            {activeTab === 'table' && (
              <div className="pt-1 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Pencatatan interval 0.5s otomatis selama simulasi</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTableLogs([])}
                      className="flex items-center gap-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 px-2.5 py-1 text-[11px] font-semibold text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" /> Bersihkan Tabel
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400">
                      <tr>
                        <th className="p-2">No</th>
                        <th className="p-2">Waktu (s)</th>
                        <th className="p-2">Posisi x (m)</th>
                        <th className="p-2">Kecepatan v (m/s)</th>
                        <th className="p-2">Percepatan a (m/s²)</th>
                        <th className="p-2">Jarak s (m)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {tableLogs.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="p-2 text-slate-500">{idx + 1}</td>
                          <td className="p-2 text-cyan-300 font-bold">{row.t.toFixed(2)}</td>
                          <td className="p-2 text-white">{row.x.toFixed(2)}</td>
                          <td className="p-2 text-sky-400">{row.v.toFixed(2)}</td>
                          <td className="p-2 text-orange-400">{row.a.toFixed(2)}</td>
                          <td className="p-2 text-emerald-400">{row.s.toFixed(2)}</td>
                        </tr>
                      ))}
                      {tableLogs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            Belum ada rekaman data. Tekan MULAI untuk menjalankan eksperimen.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
