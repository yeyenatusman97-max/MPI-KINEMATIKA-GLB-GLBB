import React, { useState, useRef, useEffect } from 'react';
import { 
  LineChart, 
  Activity, 
  Gauge, 
  HelpCircle, 
  Sliders, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { calculateGLB, calculateGLBB } from '../../utils/physicsEngine';
import { sounds } from '../../utils/soundEffects';

export const MotionGraphAnalyzer: React.FC = () => {
  const [motionType, setMotionType] = useState<'GLB' | 'GLBB'>('GLBB');
  const [v0, setV0] = useState(4);
  const [a, setA] = useState(2);
  const [inspectionTime, setInspectionTime] = useState(3);
  const [duration, setDuration] = useState(6);
  const [showAreaUnderCurve, setShowAreaUnderCurve] = useState(true);
  const [showTangentSlope, setShowTangentSlope] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate values at current inspection time
  const currentCalc = motionType === 'GLB'
    ? calculateGLB(0, v0, inspectionTime)
    : calculateGLBB(0, v0, a, inspectionTime);

  // Area under v-t graph = displacement
  const displacement = currentCalc.displacement;

  // Draw High-Resolution Vector Kinematics Graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Dark sleek background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, w, h);

    const padL = 60;
    const padR = 40;
    const padT = 40;
    const padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Calculate max values to scale graph
    const maxT = duration;
    let maxV = 10;
    let minV = 0;

    for (let t = 0; t <= maxT; t += 0.2) {
      const vVal = motionType === 'GLB' ? v0 : v0 + a * t;
      if (vVal > maxV) maxV = vVal;
      if (vVal < minV) minV = vVal;
    }
    const vSpan = Math.max(1, maxV - minV) * 1.25;

    // Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = padT + (plotH / 6) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();

      const vLabel = (maxV - (i / 6) * (maxV - minV)).toFixed(1);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(vLabel + ' m/s', 8, y + 3);
    }

    for (let i = 0; i <= maxT; i++) {
      const x = padL + (i / maxT) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, h - padB);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`${i}s`, x - 6, h - padB + 16);
    }

    // Zero line
    const zeroY = padT + plotH - ((0 - minV) / vSpan) * plotH;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, Math.min(h - padB, Math.max(padT, zeroY)));
    ctx.lineTo(w - padR, Math.min(h - padB, Math.max(padT, zeroY)));
    ctx.stroke();

    // 1. Shaded Area Under v-t curve (from t=0 to inspectionTime)
    if (showAreaUnderCurve && inspectionTime > 0) {
      const inspectX = padL + (inspectionTime / maxT) * plotW;

      ctx.beginPath();
      const startV = v0;
      const startY = padT + plotH - ((startV - minV) / vSpan) * plotH;
      ctx.moveTo(padL, zeroY);
      ctx.lineTo(padL, startY);

      const steps = 30;
      for (let i = 1; i <= steps; i++) {
        const tCur = (i / steps) * inspectionTime;
        const vCur = motionType === 'GLB' ? v0 : v0 + a * tCur;
        const xCur = padL + (tCur / maxT) * plotW;
        const yCur = padT + plotH - ((vCur - minV) / vSpan) * plotH;
        ctx.lineTo(xCur, yCur);
      }

      ctx.lineTo(inspectX, zeroY);
      ctx.closePath();

      const areaGrad = ctx.createLinearGradient(0, padT, 0, h - padB);
      areaGrad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      areaGrad.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Shaded Area Label
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`Luas Daerah = Perpindahan Δx = ${displacement.toFixed(2)} m`, padL + 12, padT + 24);
    }

    // 2. Plot Velocity Curve v(t)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = 0; t <= maxT; t += 0.1) {
      const vVal = motionType === 'GLB' ? v0 : v0 + a * t;
      const x = padL + (t / maxT) * plotW;
      const y = padT + plotH - ((vVal - minV) / vSpan) * plotH;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 3. Tangent Slope at Inspection Point
    const currentV = currentCalc.v;
    const inspX = padL + (inspectionTime / maxT) * plotW;
    const inspY = padT + plotH - ((currentV - minV) / vSpan) * plotH;

    if (showTangentSlope) {
      // Slope tangent indicator
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      const slope = motionType === 'GLB' ? 0 : a;
      const dt = 1.2;
      const tA = Math.max(0, inspectionTime - dt);
      const tB = Math.min(maxT, inspectionTime + dt);
      const vA = currentV - slope * (inspectionTime - tA);
      const vB = currentV + slope * (tB - inspectionTime);

      const xA = padL + (tA / maxT) * plotW;
      const yA = padT + plotH - ((vA - minV) / vSpan) * plotH;
      const xB = padL + (tB / maxT) * plotW;
      const yB = padT + plotH - ((vB - minV) / vSpan) * plotH;

      ctx.beginPath();
      ctx.moveTo(xA, yA);
      ctx.lineTo(xB, yB);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Inspection Point Dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(inspX, inspY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Coordinate Label at Inspection Point
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`t=${inspectionTime}s, v=${currentV.toFixed(1)}m/s`, inspX + 8, inspY - 8);

    // Chart Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Grafik Kecepatan terhadap Waktu (v - t)', padL, 24);
  }, [motionType, v0, a, inspectionTime, duration, showAreaUnderCurve, showTangentSlope]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pt-16 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
              MOTION GRAPH ANALYZER
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2 mt-1">
              <LineChart className="h-7 w-7 text-emerald-400" />
              Laboratorium Analisis Grafik Kinematika
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Eksplorasi hubungan matematis mendalam: Gradien grafik v-t = Percepatan, Luas daerah kurva v-t = Perpindahan
            </p>
          </div>

          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => {
                sounds.playClick();
                setMotionType('GLB');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                motionType === 'GLB' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mode GLB (a = 0)
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setMotionType('GLBB');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                motionType === 'GLBB' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mode GLBB (a ≠ 0)
            </button>
          </div>
        </div>

        {/* Main Grid: Controls + Canvas Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" /> Pengatur Besaran Gerak
              </h3>

              {/* v0 Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Kecepatan Awal (v₀):</span>
                  <span className="font-mono text-cyan-400 font-bold">{v0} m/s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={v0}
                  onChange={(e) => setV0(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Acceleration a Slider (GLBB only) */}
              {motionType === 'GLBB' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Percepatan (a):</span>
                    <span className="font-mono text-orange-400 font-bold">{a} m/s²</span>
                  </div>
                  <input
                    type="range"
                    min="-4"
                    max="6"
                    step="0.5"
                    value={a}
                    onChange={(e) => setA(parseFloat(e.target.value))}
                    className="w-full slider-orange"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-4 (Perlambatan)</span>
                    <span>0</span>
                    <span>+6 (Percepatan)</span>
                  </div>
                </div>
              )}

              {/* Inspection Time Slider */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Waktu Pengamatan (t):</span>
                  <span className="font-mono text-emerald-400 font-bold">{inspectionTime} sekon</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.2"
                  value={inspectionTime}
                  onChange={(e) => setInspectionTime(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Toggles: Show Area / Show Slope */}
              <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showAreaUnderCurve}
                    onChange={(e) => setShowAreaUnderCurve(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Tampilkan Luas Daerah (Perpindahan Δx)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showTangentSlope}
                    onChange={(e) => setShowTangentSlope(e.target.checked)}
                    className="rounded border-slate-700 text-orange-500 focus:ring-0"
                  />
                  <span>Tampilkan Garis Kemiringan (Gradien = Percepatan)</span>
                </label>
              </div>
            </div>

            {/* Instant Calculated Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Hasil Analisis Pada t = {inspectionTime} s
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Kecepatan Akhir</span>
                  <span className="text-white font-bold text-sm">{currentCalc.v.toFixed(2)} m/s</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Percepatan (Gradien)</span>
                  <span className="text-orange-400 font-bold text-sm">
                    {motionType === 'GLB' ? '0.00' : a.toFixed(2)} m/s²
                  </span>
                </div>
                <div className="col-span-2 bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Perpindahan (Luas Area)</span>
                  <span className="text-cyan-400 font-bold text-base">{displacement.toFixed(2)} meter</span>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Graph View */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl">
              <canvas
                ref={canvasRef}
                width={720}
                height={380}
                className="w-full h-auto rounded-xl block"
              />
            </div>

            {/* Scientific Explanation Box */}
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-5 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-cyan-400">
                <Sparkles className="h-4 w-4" /> Prinsip Kalkulus & Geometri Kinematika
              </div>
              <p className="leading-relaxed">
                • <strong>Gradien Kurva:</strong> Kemiringan garis singgung pada grafik v-t adalah turunan pertama kecepatan terhadap waktu: <code>dv/dt = a</code> (percepatan).
              </p>
              <p className="leading-relaxed">
                • <strong>Luas Daerah:</strong> Luas daerah yang dibatasi kurva v-t dan sumbu waktu adalah integral tertentu dari kecepatan: <code>∫ v dt = Δx</code> (perpindahan benda).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
