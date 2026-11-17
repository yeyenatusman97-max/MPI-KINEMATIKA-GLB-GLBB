import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Eye } from 'lucide-react';
import { createProcedural3DCar, Procedural3DCarHandle } from '../virtuallab/procedural3DCar';

interface Simulation3DTrackProps {
  currentPos: number;
  currentVel: number;
  currentAcc: number;
  trackLength: number;
  labMode: 'GLB' | 'GLBB';
  subType: 'dipercepat' | 'diperlambat';
  gateTimes: {
    g1: number | null;
    g2: number | null;
    g3: number | null;
  };
}

export const Simulation3DTrack: React.FC<Simulation3DTrackProps> = ({
  currentPos,
  currentVel,
  currentAcc,
  trackLength,
  labMode,
  subType,
  gateTimes,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cameraMode, setCameraMode] = useState<'follow' | 'overview'>('follow');
  const [webglFailed, setWebglFailed] = useState(false);

  // Store latest dynamic simulation state in refs so WebGL loop never recreates
  const simStateRef = useRef({
    currentPos,
    currentVel,
    currentAcc,
    trackLength,
    labMode,
    subType,
    cameraMode,
  });

  useEffect(() => {
    simStateRef.current = {
      currentPos,
      currentVel,
      currentAcc,
      trackLength,
      labMode,
      subType,
      cameraMode,
    };
  }, [currentPos, currentVel, currentAcc, trackLength, labMode, subType, cameraMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

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

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 190;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1324);
    scene.fog = new THREE.FogExp2(0x0b1324, 0.011);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 280);
    camera.position.set(6, 4.2, 11.5);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Studio Warm Key + Cool Fill Lighting
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e8, 2.0);
    keyLight.position.set(35, 32, 24);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -70;
    keyLight.shadow.camera.right = 70;
    keyLight.shadow.camera.top = 30;
    keyLight.shadow.camera.bottom = -30;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    rimLight.position.set(-20, 12, -18);
    scene.add(rimLight);

    // Disposed asset registries
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // Laboratory Ground & Coordinate Grid
    const floorGeo = new THREE.PlaneGeometry(240, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.88,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(50, -0.46, 0);
    floor.receiveShadow = true;
    scene.add(floor);
    geometries.push(floorGeo);
    materials.push(floorMat);

    const gridHelper = new THREE.GridHelper(180, 90, 0x0284c7, 0x1e293b);
    gridHelper.position.set(50, -0.44, 0);
    const gridMats = Array.isArray(gridHelper.material)
      ? gridHelper.material
      : [gridHelper.material];
    gridMats.forEach((m) => {
      m.transparent = true;
      m.opacity = 0.35;
      materials.push(m);
    });
    geometries.push(gridHelper.geometry);
    scene.add(gridHelper);

    // 100m Precision Roadway / Air Track Deck
    const roadGeo = new THREE.BoxGeometry(108, 0.44, 5.2);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.48,
      metalness: 0.52,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.set(50, -0.22, 0);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);
    geometries.push(roadGeo);
    materials.push(roadMat);

    // Center Glowing Track Lane Strip & Side Rails
    const laneMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const railEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.25,
    });
    materials.push(laneMat, railEdgeMat);

    const sideRailGeo = new THREE.BoxGeometry(108, 0.18, 0.22);
    geometries.push(sideRailGeo);
    [-2.5, 2.5].forEach((zSide) => {
      const sideRail = new THREE.Mesh(sideRailGeo, railEdgeMat);
      sideRail.position.set(50, 0.08, zSide);
      scene.add(sideRail);
    });

    // Instanced Distance Tick Markers Every 5m (0m .. 100m)
    const tickCount = 21;
    const tickGeo = new THREE.BoxGeometry(0.18, 0.04, 4.4);
    const tickMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      metalness: 0.3,
    });
    const tickInst = new THREE.InstancedMesh(tickGeo, tickMat, tickCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < tickCount; i++) {
      const mPos = i * 5;
      dummy.position.set(mPos, 0.015, 0);
      dummy.scale.set(i % 5 === 0 ? 1.8 : 1.0, 1, i % 5 === 0 ? 1.08 : 0.75);
      dummy.updateMatrix();
      tickInst.setMatrixAt(i, dummy.matrix);
    }
    tickInst.instanceMatrix.needsUpdate = true;
    tickInst.computeBoundingSphere();
    scene.add(tickInst);
    geometries.push(tickGeo);
    materials.push(tickMat);

    // Start (0m) & Finish (100m) Bumpers
    const startBumperGeo = new THREE.BoxGeometry(0.7, 0.65, 4.8);
    const startBumperMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.4,
      roughness: 0.4,
    });
    const finishBumperMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      metalness: 0.4,
      roughness: 0.4,
    });
    const startBumper = new THREE.Mesh(startBumperGeo, startBumperMat);
    startBumper.position.set(-2.6, 0.32, 0);
    const finishBumper = new THREE.Mesh(startBumperGeo, finishBumperMat);
    finishBumper.position.set(102.6, 0.32, 0);
    scene.add(startBumper, finishBumper);
    geometries.push(startBumperGeo);
    materials.push(startBumperMat, finishBumperMat);

    // 3 Photogate Optical Sensor Arches at 25m, 50m, 75m
    const gatePositions = [25, 50, 75];
    const gateBeamMats: THREE.MeshBasicMaterial[] = [];
    const postGeo = new THREE.BoxGeometry(0.32, 3.3, 0.32);
    const crossbarGeo = new THREE.BoxGeometry(0.42, 0.34, 5.4);
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 4.8, 8);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.25,
    });
    geometries.push(postGeo, crossbarGeo, beamGeo);
    materials.push(postMat);

    gatePositions.forEach((gx) => {
      const gateGroup = new THREE.Group();
      gateGroup.position.set(gx, 0, 0);

      const leftPost = new THREE.Mesh(postGeo, postMat);
      leftPost.position.set(0, 1.65, -2.55);
      const rightPost = new THREE.Mesh(postGeo, postMat);
      rightPost.position.set(0, 1.65, 2.55);
      const topBar = new THREE.Mesh(crossbarGeo, postMat);
      topBar.position.set(0, 3.3, 0);

      const bMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.55,
      });
      gateBeamMats.push(bMat);
      materials.push(bMat);

      const beam = new THREE.Mesh(beamGeo, bMat);
      beam.rotation.x = Math.PI / 2;
      beam.position.set(0, 1.5, 0);

      gateGroup.add(leftPost, rightPost, topBar, beam);
      scene.add(gateGroup);
    });

    // Procedural Composite 3D Physics Car
    const carHandle: Procedural3DCarHandle = createProcedural3DCar({
      bodyColor: 0x0284c7,
      accentColor: 0xf59e0b,
      scale: 1.05,
      includeFlag: true,
    });
    scene.add(carHandle.group);

    // 3D Vector Arrows Above Car (v and a)
    const dirRight = new THREE.Vector3(1, 0, 0);
    const dirLeft = new THREE.Vector3(-1, 0, 0);
    const velArrow = new THREE.ArrowHelper(
      dirRight,
      new THREE.Vector3(0, 2.55, 0),
      1.8,
      0x38bdf8,
      0.55,
      0.34
    );
    const accArrow = new THREE.ArrowHelper(
      dirRight,
      new THREE.Vector3(0, 3.15, 0),
      1.2,
      0xf97316,
      0.5,
      0.3
    );
    scene.add(velArrow, accArrow);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    const lookTarget = new THREE.Vector3(2, 0.9, 0);
    const glbColor = new THREE.Color(0x0284c7);
    const glbbColor = new THREE.Color(0xea580c);
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
      const st = simStateRef.current;

      const clampedX = Math.min(st.trackLength, Math.max(0, st.currentPos));
      carHandle.group.position.x = clampedX;

      // Smoothly tint car paint between Sky Blue (GLB) and Racing Orange (GLBB)
      const targetColor = st.labMode === 'GLB' ? glbColor : glbbColor;
      carHandle.bodyMat.color.lerp(targetColor, Math.min(1, delta * 8));

      // Taillight glow stronger when decelerating
      carHandle.taillightMat.emissiveIntensity =
        st.labMode === 'GLBB' && st.subType === 'diperlambat' && st.currentVel > 0.1
          ? 2.8
          : 0.9;
      carHandle.headlightMat.emissiveIntensity = st.currentVel > 0.1 ? 2.1 : 0.8;

      // Spin all 4 wheels accurately based on linear displacement x = theta * r
      const wheelRot = -(clampedX / 0.42);
      for (let i = 0; i < carHandle.wheels.length; i++) {
        carHandle.wheels[i].rotation.z = wheelRot;
      }

      // Highlight triggered photogate laser beams
      gatePositions.forEach((gx, idx) => {
        const triggered = clampedX >= gx;
        gateBeamMats[idx].color.setHex(triggered ? 0x22c55e : 0xf43f5e);
        gateBeamMats[idx].opacity = triggered ? 0.95 : 0.45;
      });

      // Position & scale 3D velocity vector arrow
      velArrow.position.set(clampedX, 2.35, 0);
      if (Math.abs(st.currentVel) > 0.2) {
        velArrow.visible = true;
        velArrow.setDirection(st.currentVel >= 0 ? dirRight : dirLeft);
        const vLen = Math.min(5.5, Math.max(1.0, Math.abs(st.currentVel) * 0.18));
        velArrow.setLength(vLen, 0.55, 0.34);
      } else {
        velArrow.visible = false;
      }

      // Position & scale 3D acceleration vector arrow
      accArrow.position.set(clampedX, 2.95, 0);
      if (st.labMode === 'GLBB' && Math.abs(st.currentAcc) > 0.05) {
        accArrow.visible = true;
        accArrow.setDirection(st.currentAcc >= 0 ? dirRight : dirLeft);
        accArrow.setColor(st.currentAcc >= 0 ? 0xf59e0b : 0xf43f5e);
        const aLen = Math.min(4.2, Math.max(1.2, Math.abs(st.currentAcc) * 0.45));
        accArrow.setLength(aLen, 0.5, 0.3);
      } else {
        accArrow.visible = false;
      }

      // Camera damping (Follow Car 3/4 view vs Full Track Overview)
      if (st.cameraMode === 'overview') {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, 50, 4.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 16, 4.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 54, 4.5, delta);
        lookTarget.x = THREE.MathUtils.damp(lookTarget.x, 50, 4.5, delta);
        lookTarget.y = THREE.MathUtils.damp(lookTarget.y, 0.8, 4.5, delta);
      } else {
        const camX = clampedX + 2.8;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, camX, 6.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 3.6, 5.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 9.8, 5.5, delta);
        lookTarget.x = THREE.MathUtils.damp(lookTarget.x, clampedX + 1.0, 7.0, delta);
        lookTarget.y = THREE.MathUtils.damp(lookTarget.y, 0.95, 5.5, delta);
      }
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();

      carHandle.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  if (webglFailed) {
    const pct = Math.min(92, Math.max(4, (currentPos / trackLength) * 88 + 4));
    return (
      <div className="relative flex-1 min-h-[190px] sm:min-h-[220px] lg:min-h-[180px] w-full rounded-xl bg-slate-900 border border-slate-700 flex items-center px-4 text-xs text-slate-300">
        <div className="w-full h-3 bg-slate-800 rounded-full relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-12 rounded-lg bg-sky-500 shadow-lg"
            style={{ left: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-[190px] sm:min-h-[220px] lg:min-h-[180px] w-full rounded-xl border border-slate-700 overflow-hidden bg-[#0b1324] shadow-inner">
      {/* Dedicated WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Solid/Translucent Non-Blur HUD Overlay (Safe over WebGL) */}
      <div className="pointer-events-none absolute top-2 left-2 right-2 flex flex-wrap items-center justify-between gap-1.5 z-10">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { label: 'S1 (25m)', time: gateTimes.g1, passed: currentPos >= 25 },
            { label: 'S2 (50m)', time: gateTimes.g2, passed: currentPos >= 50 },
            { label: 'S3 (75m)', time: gateTimes.g3, passed: currentPos >= 75 },
          ].map((s) => (
            <span
              key={s.label}
              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border tabular-nums"
              style={{
                backgroundColor: s.passed ? 'rgba(5, 150, 105, 0.88)' : 'rgba(15, 23, 42, 0.82)',
                borderColor: s.passed ? 'rgba(110, 231, 183, 0.8)' : 'rgba(148, 163, 184, 0.35)',
                color: s.passed ? '#FFFFFF' : '#CBD5E1',
              }}
            >
              {s.label}
              {s.time !== null ? ` · ${s.time}s` : ''}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setCameraMode((prev) => (prev === 'follow' ? 'overview' : 'follow'))
          }
          className="pointer-events-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            borderColor: 'rgba(56, 189, 248, 0.45)',
            color: '#E0F2FE',
          }}
        >
          <Eye className="h-3 w-3 text-sky-400" />
          <span>{cameraMode === 'follow' ? 'Kamera: Ikuti Mobil' : 'Kamera: Lintasan Penuh'}</span>
        </button>
      </div>

      {/* Bottom-Left Live 3D Vector & Position Readout */}
      <div
        className="pointer-events-none absolute bottom-2 left-2 z-10 flex flex-wrap items-center gap-2 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold tabular-nums"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.86)',
          borderColor: 'rgba(56, 189, 248, 0.35)',
          color: '#E2E8F0',
        }}
      >
        <span className="text-sky-300">s = {currentPos.toFixed(1)} m</span>
        <span className="text-slate-500">·</span>
        <span className="text-cyan-300">v⃗ = {currentVel.toFixed(1)} m/s</span>
        {currentAcc !== 0 && (
          <>
            <span className="text-slate-500">·</span>
            <span className={currentAcc > 0 ? 'text-amber-300' : 'text-rose-300'}>
              a⃗ = {currentAcc > 0 ? `+${currentAcc}` : currentAcc} m/s²
            </span>
          </>
        )}
      </div>
    </div>
  );
};
