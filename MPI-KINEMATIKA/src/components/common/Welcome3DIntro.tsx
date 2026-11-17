import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { motion } from 'motion/react';
import { Atom } from 'lucide-react';

interface Welcome3DIntroProps {
  isAppReady?: boolean;
  onComplete: () => void;
}

const MIN_SHOWCASE_MS = 2600;

export const Welcome3DIntro: React.FC<Welcome3DIntroProps> = ({
  isAppReady = true,
  onComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pointerTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerCurrentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const completedRef = useRef(false);
  const sceneReadyRef = useRef(false);
  const appReadyRef = useRef(isAppReady);
  const onCompleteRef = useRef(onComplete);
  const startTimeRef = useRef<number | null>(null);
  const progressValueRef = useRef(1);
  const finishTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    appReadyRef.current = isAppReady;
  }, [isAppReady]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const [progress, setProgress] = useState(1);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [isExiting, setIsExiting] = useState(false);

  const triggerExit = React.useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      onCompleteRef.current();
    }, 360);
  }, []);

  // Single-run monotonic 1-100% progress synchronized with 3D scene & app readiness
  useEffect(() => {
    let timerRaf = 0;
    const nowInit = performance.now();
    if (startTimeRef.current === null) {
      startTimeRef.current = nowInit;
    }
    let lastTime = nowInit;
    let finishedAt100 = false;

    const updateProgress = (now: number) => {
      if (completedRef.current || finishedAt100) return;

      const dt = Math.min(0.08, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const elapsed = now - (startTimeRef.current ?? now);
      const ready = sceneReadyRef.current && appReadyRef.current;

      const baselineTarget = 1 + Math.min(1, elapsed / MIN_SHOWCASE_MS) * 99;
      const targetPct = !ready ? Math.min(94, baselineTarget) : baselineTarget;

      const rate = ready && elapsed >= MIN_SHOWCASE_MS ? 12 : 6;
      const nextPct = Math.max(
        progressValueRef.current,
        progressValueRef.current + (targetPct - progressValueRef.current) * Math.min(1, dt * rate)
      );
      progressValueRef.current = nextPct;

      if (ready && nextPct >= 99.4) {
        progressValueRef.current = 100;
        finishedAt100 = true;
        setProgress(100);
        finishTimerRef.current = window.setTimeout(() => {
          triggerExit();
        }, 160);
        return;
      }

      const displayPct = Math.max(1, Math.min(99, Math.round(nextPct)));
      setProgress((prev) => (displayPct > prev ? displayPct : prev));
      timerRaf = requestAnimationFrame(updateProgress);
    };

    timerRaf = requestAnimationFrame(updateProgress);
    return () => {
      cancelAnimationFrame(timerRaf);
      if (finishTimerRef.current !== null) {
        clearTimeout(finishTimerRef.current);
      }
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, [triggerExit]);

  // True 3D Three.js Futuristic Kinematics Gyroscope & Warp Field
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      sceneReadyRef.current = true;
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x030816, 1);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030816);
    scene.fog = new THREE.FogExp2(0x030816, 0.042);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 120);
    camera.position.set(0, 0.6, 13.5);

    // Studio Environment Reflection for Metallic Rings
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Warm Key + Cool Hemisphere + Cyan Rim Lighting
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x091124, 1.1);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1e6, 2.2);
    keyLight.position.set(6, 8, 9);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.4);
    rimLight.position.set(-7, -4, -6);
    scene.add(rimLight);

    // Futuristic Spatial Grid Floor
    const grid = new THREE.GridHelper(64, 48, 0x0ea5e9, 0x1e3a5f);
    grid.position.y = -4.2;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((m) => {
      m.transparent = true;
      m.opacity = 0.28;
    });
    scene.add(grid);

    // Composite 3D Gyroscope Assembly (THREE.Group)
    const gyroGroup = new THREE.Group();
    gyroGroup.position.set(0, 0.1, -1.5);
    scene.add(gyroGroup);

    const titaniumMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      metalness: 0.92,
      roughness: 0.16,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
    });

    const accentSilverMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 1.0,
    });

    const cyanEnergyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.3,
    });

    const ringOuterGeo = new THREE.TorusGeometry(4.4, 0.085, 20, 120);
    const ringOuter = new THREE.Mesh(ringOuterGeo, titaniumMat);
    ringOuter.rotation.x = Math.PI * 0.22;
    gyroGroup.add(ringOuter);

    const ringMidGeo = new THREE.TorusGeometry(3.45, 0.06, 18, 100);
    const ringMid = new THREE.Mesh(ringMidGeo, accentSilverMat);
    ringMid.rotation.y = Math.PI * 0.3;
    gyroGroup.add(ringMid);

    const ringInnerGeo = new THREE.TorusGeometry(2.55, 0.045, 16, 90);
    const ringInner = new THREE.Mesh(ringInnerGeo, cyanEnergyMat);
    ringInner.rotation.x = -Math.PI * 0.28;
    gyroGroup.add(ringInner);

    // Instanced Orbital Nodes on Outer Ring
    const nodeCount = 24;
    const nodeGeo = new THREE.SphereGeometry(0.085, 12, 12);
    const orbitalNodes = new THREE.InstancedMesh(nodeGeo, cyanEnergyMat, nodeCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < nodeCount; i++) {
      const theta = (i / nodeCount) * Math.PI * 2;
      dummy.position.set(Math.cos(theta) * 4.4, Math.sin(theta) * 4.4, 0);
      dummy.scale.setScalar(i % 2 === 0 ? 1.15 : 0.75);
      dummy.updateMatrix();
      orbitalNodes.setMatrixAt(i, dummy.matrix);
    }
    orbitalNodes.instanceMatrix.needsUpdate = true;
    orbitalNodes.computeBoundingSphere();
    ringOuter.add(orbitalNodes);

    // 3D Forward Kinematic Star / Coordinate Particle Field
    const particleCount = 420;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const c1 = new THREE.Color(0x38bdf8);
    const c2 = new THREE.Color(0xa5f3fc);
    const c3 = new THREE.Color(0x818cf8);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = -Math.random() * 48 + 4;
      const pick = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
      colors[i * 3] = pick.r;
      colors[i * 3 + 1] = pick.g;
      colors[i * 3 + 2] = pick.b;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Pre-compile shaders cleanly on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;

    const afterDraw = (cb: () => void) => {
      try {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (gl && typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (isDisposed) return;
            const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (state === gl.UNSIGNALED) {
              frameId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              frameId = window.setTimeout(cb, 80);
            }
          };
          frameId = window.setTimeout(poll, 5);
          return;
        }
      } catch {
        // Fallback pacing
      }
      frameId = window.setTimeout(cb, 80);
    };

    const tick = () => {
      if (isDisposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);

      // Exponential damping camera parallax + smooth zoom-in arrival
      pointerCurrentRef.current.x = THREE.MathUtils.damp(
        pointerCurrentRef.current.x,
        pointerTargetRef.current.x,
        5,
        delta
      );
      pointerCurrentRef.current.y = THREE.MathUtils.damp(
        pointerCurrentRef.current.y,
        pointerTargetRef.current.y,
        5,
        delta
      );

      camera.position.z = THREE.MathUtils.damp(camera.position.z, 9.6, 1.8, delta);
      camera.position.x = pointerCurrentRef.current.x * 1.15;
      camera.position.y = 0.35 + pointerCurrentRef.current.y * 0.8;
      camera.lookAt(0, 0, -1.5);

      // Rotate Futuristic Orbital Rings
      ringOuter.rotation.z += delta * 0.28;
      ringOuter.rotation.y += delta * 0.15;
      ringMid.rotation.x += delta * 0.38;
      ringMid.rotation.z -= delta * 0.2;
      ringInner.rotation.y -= delta * 0.52;
      ringInner.rotation.z += delta * 0.32;

      // Forward particle stream toward viewer (kinematics velocity warp)
      const posAttr = starGeo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3 + 2] += delta * 9.5;
        if (arr[i * 3 + 2] > 6) {
          arr[i * 3 + 2] = -44;
        }
      }
      posAttr.needsUpdate = true;

      // Scroll grid toward viewer subtly
      grid.position.z = (grid.position.z + delta * 3.2) % 2.66;

      renderer.render(scene, camera);
      if (!sceneReadyRef.current) {
        sceneReadyRef.current = true;
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);

      ringOuterGeo.dispose();
      ringMidGeo.dispose();
      ringInnerGeo.dispose();
      nodeGeo.dispose();
      starGeo.dispose();
      titaniumMat.dispose();
      accentSilverMat.dispose();
      cyanEnergyMat.dispose();
      starMat.dispose();
      grid.geometry.dispose();
      gridMaterials.forEach((m) => m.dispose());
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = -(e.clientY / window.innerHeight - 0.5) * 2;
    pointerTargetRef.current = { x: nx, y: ny };
    setTilt({
      rx: Number((ny * 8).toFixed(2)),
      ry: Number((nx * 10).toFixed(2)),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        scale: isExiting ? 1.06 : 1,
      }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onPointerMove={handlePointerMove}
      className="fixed inset-0 h-dvh z-[100] overflow-hidden bg-[#030816] text-white select-none flex flex-col items-center justify-between px-3 py-4 sm:px-8 sm:py-6"
      style={{ perspective: '1200px' }}
    >
      {/* Dedicated WebGL 3D Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle Radial Vignette for High Typographic Legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(14,165,233,0.12) 0%, rgba(3,8,22,0.52) 55%, rgba(2,6,23,0.88) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Top Subtle Identity Line */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 flex items-center gap-2.5 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-sky-300/90"
      >
        <Atom className="h-4 w-4 text-sky-400" />
        <span>MPI Fisika Kelas X Fase E</span>
      </motion.div>

      {/* Center 3D Extruded Perspective Welcome Stage */}
      <motion.div
        initial={{ opacity: 0, scale: 0.86, rotateX: 16 }}
        animate={{ opacity: 1, scale: 1, rotateX: tilt.rx, rotateY: tilt.ry }}
        transition={{
          opacity: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          rotateX: { type: 'spring', stiffness: 120, damping: 18 },
          rotateY: { type: 'spring', stiffness: 120, damping: 18 },
        }}
        className="relative z-10 w-full max-w-3xl text-center px-5 py-7 sm:px-10 sm:py-11 rounded-3xl border border-sky-400/25 shadow-[0_30px_90px_-15px_rgba(14,165,233,0.35)]"
        style={{
          transformStyle: 'preserve-3d',
          background:
            'linear-gradient(145deg, rgba(10, 22, 48, 0.78) 0%, rgba(6, 14, 34, 0.68) 100%)',
        }}
      >
        {/* Corner Futuristic Precision Brackets */}
        <div className="pointer-events-none absolute top-3 left-3 h-5 w-5 border-t-2 border-l-2 border-sky-400/70 rounded-tl-md" />
        <div className="pointer-events-none absolute top-3 right-3 h-5 w-5 border-t-2 border-r-2 border-sky-400/70 rounded-tr-md" />
        <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-sky-400/70 rounded-bl-md" />
        <div className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-sky-400/70 rounded-br-md" />

        {/* Depth Plane Behind Text */}
        <div
          className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.24em] uppercase text-cyan-300/90 mb-2.5 sm:mb-3"
          style={{ transform: 'translateZ(22px)' }}
        >
          Ruang Belajar Interaktif Futuristik
        </div>

        {/* Volumetric 3D Extruded "SELAMAT DATANG" Display Title */}
        <div
          className="relative inline-block my-1"
          style={{ transform: 'translateZ(48px)', transformStyle: 'preserve-3d' }}
        >
          {/* Extruded 3D Back Layers */}
          <span
            aria-hidden="true"
            className="absolute inset-0 text-3xl sm:text-5xl md:text-7xl font-black tracking-tight text-sky-900/80 select-none pointer-events-none"
            style={{ transform: 'translate3d(0px, 6px, -18px)' }}
          >
            Selamat Datang
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-0 text-3xl sm:text-5xl md:text-7xl font-black tracking-tight text-cyan-600/45 select-none pointer-events-none"
            style={{ transform: 'translate3d(0px, 3px, -9px)' }}
          >
            Selamat Datang
          </span>
          {/* Main Front Luminous 3D Surface */}
          <h1 className="relative text-3xl sm:text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-b from-white via-[#E0F2FE] to-[#38BDF8] bg-clip-text text-transparent drop-shadow-[0_10px_28px_rgba(56,189,248,0.45)]">
            Selamat Datang
          </h1>
        </div>

        {/* Floating Topic Layer */}
        <div
          className="mt-4 space-y-1.5"
          style={{ transform: 'translateZ(30px)' }}
        >
          <p className="text-sm sm:text-lg font-extrabold text-sky-100 tracking-tight">
            Kinematika Gerak Lurus
          </p>
          <p className="text-xs sm:text-sm font-semibold text-sky-300/90">
            &quot;Gerak Lurus Beraturan (GLB) &amp; Gerak Lurus Berubah Beraturan (GLBB)&quot;
          </p>
        </div>

        {/* Sleek Linear Progress Indicator */}
        <div
          className="mt-7 max-w-sm mx-auto space-y-2.5"
          style={{ transform: 'translateZ(36px)' }}
        >
          <div className="h-1.5 w-full rounded-full bg-slate-800/90 overflow-hidden border border-sky-500/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0284C7] via-[#38BDF8] to-[#A5F3FC]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-center text-[11px] font-mono text-sky-300/80">
            <span className="tabular-nums">Memuat tampilan awal · {progress}%</span>
          </div>
        </div>
      </motion.div>

      {/* Bottom Subtle Attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 text-[11px] sm:text-xs font-medium text-sky-200/75 text-center"
      >
        Pengembang: <span className="font-bold text-white">Yeyen Atusman Mangidi, S.Pd., Gr</span>
      </motion.div>
    </motion.div>
  );
};
