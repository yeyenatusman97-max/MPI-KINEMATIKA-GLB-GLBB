/**
 * PHYSICS MOTION LAB - Core Physics Engine
 * Formulasi & Validasi Matematis Kinematika Gerak Lurus (GLB & GLBB)
 * Memenuhi Uji Ilmiah Wajib Kurikulum Merdeka Fase E
 */

import { TelemetryPoint, ExperimentParams } from '../types/physics';

/**
 * Hitung posisi, kecepatan, dan percepatan seketika untuk GLB
 * Rumus:
 * x(t) = x₀ + v·t
 * v(t) = v (konstan)
 * a(t) = 0
 */
export function calculateGLB(x0: number, v: number, t: number): {
  x: number;
  v: number;
  a: number;
  displacement: number;
  distance: number;
} {
  const displacement = v * t;
  const x = x0 + displacement;
  const distance = Math.abs(displacement); // Pada GLB 1D tanpa balik arah, jarak = |perpindahan|
  return {
    x,
    v,
    a: 0,
    displacement,
    distance,
  };
}

/**
 * Hitung posisi, kecepatan, dan percepatan seketika untuk GLBB
 * Rumus:
 * v(t) = v₀ + a·t
 * x(t) = x₀ + v₀·t + ½·a·t²
 * v(t)² = v₀² + 2·a·(x - x₀)
 * a(t) = a (konstan)
 *
 * Memperhitungkan jarak tempuh skalar (distance) jika terjadi pembalikan arah saat v melintasi 0.
 */
export function calculateGLBB(x0: number, v0: number, a: number, t: number): {
  x: number;
  v: number;
  a: number;
  displacement: number;
  distance: number;
} {
  const v = v0 + a * t;
  const displacement = v0 * t + 0.5 * a * t * t;
  const x = x0 + displacement;

  // Perhitungan Jarak (lintasan skalar sebenarnya):
  // Cek apakah ada titik balik ketika v = 0 pada rentang 0 < t_turn < t
  let distance = 0;
  if (a !== 0) {
    const tTurn = -v0 / a;
    if (tTurn > 0 && tTurn < t) {
      // Benda berbalik arah pada tTurn
      const xTurn = x0 + v0 * tTurn + 0.5 * a * tTurn * tTurn;
      const d1 = Math.abs(xTurn - x0);
      const d2 = Math.abs(x - xTurn);
      distance = d1 + d2;
    } else {
      distance = Math.abs(displacement);
    }
  } else {
    distance = Math.abs(displacement);
  }

  return {
    x,
    v,
    a,
    displacement,
    distance,
  };
}

/**
 * Generate rentetan titik telemetri simulasi (time series)
 */
export function generateTrajectory(params: ExperimentParams, step: number = 0.1): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const duration = Math.max(1, params.maxTime);
  const totalSteps = Math.ceil(duration / step);

  for (let i = 0; i <= totalSteps; i++) {
    const t = Math.min(duration, +(i * step).toFixed(2));
    if (params.motionType === 'GLB') {
      const res = calculateGLB(params.x0, params.v0, t);
      points.push({
        t,
        x: +res.x.toFixed(3),
        v: +res.v.toFixed(3),
        a: 0,
        s: +res.distance.toFixed(3),
      });
    } else {
      const res = calculateGLBB(params.x0, params.v0, params.a, t);
      points.push({
        t,
        x: +res.x.toFixed(3),
        v: +res.v.toFixed(3),
        a: +res.a.toFixed(3),
        s: +res.distance.toFixed(3),
      });
    }
  }

  return points;
}

/**
 * VALIDASI ILMIAH RESMI (Verifikasi Kriteria Soal)
 */
export function runPhysicsValidationTests(): {
  testName: string;
  expected: string;
  actual: string;
  passed: boolean;
}[] {
  const results = [];

  // UJI GLB: x₀ = 0 m, v = 5 m/s, t = 10 s -> x = 50 m, a = 0 m/s²
  const glb = calculateGLB(0, 5, 10);
  const glbPassed = Math.abs(glb.x - 50) < 1e-6 && glb.a === 0;
  results.push({
    testName: 'Uji Standar GLB (x₀ = 0, v = 5 m/s, t = 10 s)',
    expected: 'x = 50.00 m, a = 0.00 m/s²',
    actual: `x = ${glb.x.toFixed(2)} m, a = ${glb.a.toFixed(2)} m/s²`,
    passed: glbPassed,
  });

  // UJI GLBB DARI KEADAAN DIAM: x₀ = 0, v₀ = 0, a = 2 m/s², t = 5 s -> vt = 10 m/s, x = 25 m
  const glbbRest = calculateGLBB(0, 0, 2, 5);
  const glbbRestPassed = Math.abs(glbbRest.v - 10) < 1e-6 && Math.abs(glbbRest.x - 25) < 1e-6;
  results.push({
    testName: 'Uji GLBB Dari Diam (v₀ = 0, a = 2 m/s², t = 5 s)',
    expected: 'vₜ = 10.00 m/s, x = 25.00 m',
    actual: `vₜ = ${glbbRest.v.toFixed(2)} m/s, x = ${glbbRest.x.toFixed(2)} m`,
    passed: glbbRestPassed,
  });

  // UJI GLBB DENGAN KECEPATAN AWAL: v₀ = 4 m/s, a = 2 m/s², t = 3 s -> vt = 10 m/s, Δs = 21 m
  const glbbInit = calculateGLBB(0, 4, 2, 3);
  const glbbInitPassed = Math.abs(glbbInit.v - 10) < 1e-6 && Math.abs(glbbInit.displacement - 21) < 1e-6;
  results.push({
    testName: 'Uji GLBB Dengan v₀ (v₀ = 4 m/s, a = 2 m/s², t = 3 s)',
    expected: 'vₜ = 10.00 m/s, Δs = 21.00 m',
    actual: `vₜ = ${glbbInit.v.toFixed(2)} m/s, Δs = ${glbbInit.displacement.toFixed(2)} m`,
    passed: glbbInitPassed,
  });

  return results;
}

/**
 * Format float untuk tampilan digital HUD sains
 */
export function formatSci(val: number, decimals: number = 2): string {
  if (Math.abs(val) < 1e-6) return (0).toFixed(decimals);
  return val.toFixed(decimals);
}
