import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Activity,
  Gauge,
  Calculator,
  CheckCircle2,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { sounds } from '../../utils/soundEffects';

export interface DigitalModuleSectionProps {
  onSendToWhiteboard?: (payload: any) => void;
}

/* ============================================================================
   TYPOGRAPHIC MATH RENDERING COMPONENTS
   Menyajikan variabel miring bergaya buku teks fisika, pecahan bertingkat
   (stacked fraction), indeks subskrip/superskrip rapi, serta tanda akar.
   ============================================================================ */

const MVar: React.FC<{
  sym: string;
  sub?: string;
  sup?: string;
  className?: string;
}> = ({ sym, sub, sup, className = '' }) => (
  <span className={`inline-flex items-baseline font-serif ${className}`}>
    <span className="italic font-semibold">{sym}</span>
    {sub && (
      <sub className="text-[0.68em] leading-none not-italic font-sans font-bold ml-[1px] -bottom-[0.22em] relative">
        {sub}
      </sub>
    )}
    {sup && (
      <sup className="text-[0.68em] leading-none not-italic font-sans font-bold ml-[1px] -top-[0.42em] relative">
        {sup}
      </sup>
    )}
  </span>
);

const MFrac: React.FC<{
  num: React.ReactNode;
  den: React.ReactNode;
  className?: string;
  barClassName?: string;
}> = ({ num, den, className = '', barClassName = 'border-current' }) => (
  <span
    className={`inline-flex flex-col items-center justify-center align-middle mx-1 leading-tight ${className}`}
  >
    <span className={`px-1.5 pb-0.5 border-b-[1.5px] ${barClassName} text-[0.86em]`}>
      {num}
    </span>
    <span className="px-1.5 pt-0.5 text-[0.86em]">{den}</span>
  </span>
);

const MSqrt: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <span className={`inline-flex items-stretch align-middle mx-0.5 ${className}`}>
    <svg
      viewBox="0 0 14 24"
      className="w-3.5 h-[1.35em] self-stretch shrink-0 -mr-[1px]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 13.5 L4.2 13.5 L7.2 22 L12.5 2 L14 2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span className="border-t-[1.8px] border-current px-1.5 pt-[1px] inline-flex items-center">
      {children}
    </span>
  </span>
);

/* ============================================================================
   TAB 1 BENTO CONTENT: GERAK LURUS BERATURAN (GLB)
   ============================================================================ */
const GLBBentoGrid: React.FC = () => {
  const speedV = 4;
  const maxT = 5;
  const maxS = 40;
  const maxV = 10;

  const plotL = 38;
  const plotR = 258;
  const plotT = 22;
  const plotB = 172;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  const mapT = (t: number) => plotL + (t / maxT) * plotW;
  const mapS = (s: number) => plotB - (Math.min(maxS, s) / maxS) * plotH;

  const tA = 1;
  const tB = 3;
  const sA = speedV * tA;
  const sB = speedV * tB;
  const refV = 2;
  const areaT = 4;
  const areaS = speedV * areaT;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-stretch animate-fadeIn">

      {/* BENTO CARD 1: Konsep & Karakteristik GLB */}
      <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2.5 transition-all hover:border-sky-400">
        <div className="space-y-1.5">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" />
          <div className="text-[10.5px] font-bold text-cyan-800 tracking-wide">
            Konsep Dasar · GLB
          </div>
          <h3 className="text-sm xl:text-base font-black text-slate-900 leading-snug tracking-tight">
            Pengertian Gerak Lurus Beraturan
          </h3>
          <p className="text-[11px] xl:text-xs font-medium text-slate-700 leading-relaxed">
            <strong className="text-cyan-900">GLB</strong> adalah gerak benda pada lintasan lurus dengan kecepatan tetap, sehingga perpindahan tiap selang waktu sama selalu sama besar.
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-cyan-100">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#F0F9FF] to-white border border-cyan-200/80 space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
              <span>Kecepatan Konstan (<MVar sym="v" /> tetap)</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-snug">
              Kelajuan sesaat sama dengan kelajuan rata-rata di seluruh lintasan.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#ECFDF5] to-white border border-emerald-200/80 space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Percepatan Nol (<MVar sym="a" /> = 0)</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-snug">
              Tidak ada perubahan kecepatan (Δ<MVar sym="v" /> = 0) sehingga <MVar sym="a" /> = 0 m/s².
            </p>
          </div>
        </div>
      </div>

      {/* BENTO CARD 2: Persamaan Matematis GLB (Soft Futuristic Dark Console) */}
      <div className="bg-gradient-to-br from-[#0F2747] via-[#173A6B] to-[#0B4F7A] text-white rounded-2xl border border-sky-400/50 shadow-[0_14px_34px_-12px_rgba(2,132,199,0.4)] p-3.5 flex flex-col justify-between gap-2.5">
        <div className="flex items-center justify-between text-[11px] text-cyan-200 font-bold">
          <span>Persamaan GLB</span>
          <span className="font-mono text-[10px] text-cyan-300">Satuan SI</span>
        </div>

        <div className="space-y-2">
          <div className="rounded-xl bg-white/[0.08] backdrop-blur-md border border-cyan-300/25 px-2.5 py-2 text-center">
            <div className="text-[10px] text-cyan-200 font-semibold">Perpindahan</div>
            <div className="text-lg xl:text-xl tracking-wide text-white mt-0.5">
              <MVar sym="s" /> = <MVar sym="v" /> · <MVar sym="t" />
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.08] backdrop-blur-md border border-cyan-300/25 px-2.5 py-2 text-center">
            <div className="text-[10px] text-cyan-200 font-semibold">Kecepatan</div>
            <div className="text-lg xl:text-xl tracking-wide text-sky-200 mt-0.5">
              <MVar sym="v" /> = <MFrac num={<MVar sym="s" />} den={<MVar sym="t" />} barClassName="border-sky-200" />
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.06] border border-indigo-300/25 px-2.5 py-2 text-center text-xs xl:text-sm text-slate-100">
            <div className="text-[10px] text-indigo-200 font-semibold font-sans">Jika <MVar sym="s" sub="0" /> ≠ 0:</div>
            <MVar sym="s" sub="akhir" /> = <MVar sym="s" sub="0" /> + <MVar sym="v" /> · <MVar sym="t" />
          </div>
        </div>

        <div className="space-y-0.5 pt-2 border-t border-cyan-400/25 text-[10px] text-slate-200 font-medium">
          <div><MVar sym="s" className="text-cyan-300" /> : Jarak (<span className="font-mono">m</span>)</div>
          <div><MVar sym="v" className="text-cyan-300" /> : Kelajuan (<span className="font-mono">m/s</span>)</div>
          <div><MVar sym="t" className="text-cyan-300" /> : Waktu (<span className="font-mono">s</span>)</div>
        </div>
      </div>

      {/* BENTO CARD 3: Grafik s-t */}
      <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2 transition-all hover:border-sky-400">
        <div>
          <div className="text-[10px] font-bold text-sky-700">Grafik 1 · Linear Naik</div>
          <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-tight">
            Posisi vs Waktu (s – t)
          </h4>
          <div className="text-[11px] font-serif text-sky-900 font-semibold mt-0.5">
            Gradien = <MFrac num={<>Δ<MVar sym="s" /></>} den={<>Δ<MVar sym="t" /></>} /> = <span className="font-mono tabular-nums">{speedV} m/s</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#F8FBFF] border border-sky-200/75 shadow-inner p-1.5">
          <svg viewBox="0 0 280 205" className="w-full h-auto block">
            <defs>
              <marker id="glb-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
              </marker>
            </defs>

            {[0, 1, 2, 3, 4, 5].map((tVal) => (
              <g key={`gt-${tVal}`}>
                <line x1={mapT(tVal)} y1={plotT} x2={mapT(tVal)} y2={plotB} stroke={tVal === 0 ? '#475569' : '#E2E8F0'} strokeWidth={tVal === 0 ? 1.8 : 1} />
                <text x={mapT(tVal)} y={plotB + 16} textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">{tVal}</text>
              </g>
            ))}

            {[0, 10, 20, 30, 40].map((sVal) => (
              <g key={`gs-${sVal}`}>
                <line x1={plotL} y1={mapS(sVal)} x2={plotR} y2={mapS(sVal)} stroke={sVal === 0 ? '#475569' : '#E2E8F0'} strokeWidth={sVal === 0 ? 1.8 : 1} />
                <text x={plotL - 6} y={mapS(sVal) + 4} textAnchor="end" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">{sVal}</text>
              </g>
            ))}

            <line x1={plotL} y1={plotB} x2={plotL} y2={plotT - 8} stroke="#334155" strokeWidth="2" markerEnd="url(#glb-arrow)" />
            <line x1={plotL} y1={plotB} x2={plotR + 10} y2={plotB} stroke="#334155" strokeWidth="2" markerEnd="url(#glb-arrow)" />
            <text x={plotL - 4} y={13} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">s(m)</text>
            <text x={plotR + 14} y={plotB + 16} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">t(s)</text>

            {/* Reference ghost line v = 2 m/s */}
            <line x1={mapT(0)} y1={mapS(0)} x2={mapT(5)} y2={mapS(refV * 5)} stroke="#94A3B8" strokeWidth="1.6" strokeDasharray="4 4" />
            <text x={mapT(4.9)} y={mapS(refV * 5) - 6} textAnchor="end" fontSize="10" fill="#64748B" fontFamily="JetBrains Mono, monospace">
              v = 2 m/s
            </text>

            {/* Slope Triangle */}
            <polygon points={`${mapT(tA)},${mapS(sA)} ${mapT(tB)},${mapS(sA)} ${mapT(tB)},${mapS(sB)}`} fill="rgba(14, 165, 233, 0.14)" />
            <line x1={mapT(tA)} y1={mapS(sA)} x2={mapT(tB)} y2={mapS(sA)} stroke="#0284C7" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1={mapT(tB)} y1={mapS(sA)} x2={mapT(tB)} y2={mapS(sB)} stroke="#0284C7" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x={(mapT(tA) + mapT(tB)) / 2} y={mapS(sA) + 14} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0369A1" fontFamily="JetBrains Mono, monospace">Δt=2s</text>
            <text x={mapT(tB) + 5} y={(mapS(sA) + mapS(sB)) / 2 + 4} fontSize="10" fontWeight="700" fill="#0369A1" fontFamily="JetBrains Mono, monospace">Δs={sB - sA}m</text>

            <line x1={mapT(0)} y1={mapS(0)} x2={mapT(Math.min(maxT, maxS / speedV))} y2={mapS(Math.min(maxS, speedV * maxT))} stroke="#0284C7" strokeWidth="3.2" strokeLinecap="round" />

            {[0, 1, 2, 3, 4, 5].map((tVal) => {
              const sVal = speedV * tVal;
              if (sVal > maxS) return null;
              return <circle key={`pt-${tVal}`} cx={mapT(tVal)} cy={mapS(sVal)} r="4" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.4" />;
            })}
          </svg>
        </div>

        <p className="text-[10.5px] text-slate-600 leading-snug">
          Tiap <span className="font-mono font-bold text-slate-800">Δt = 1 s</span> menghasilkan pertambahan jarak tetap (<span className="font-mono font-bold text-sky-700">Δs = {speedV} m</span>).
        </p>
      </div>

      {/* BENTO CARD 4: Grafik v-t */}
      <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2 transition-all hover:border-sky-400">
        <div>
          <div className="text-[10px] font-bold text-teal-800">Grafik 2 · Konstan Datar</div>
          <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-tight">
            Kecepatan vs Waktu (v – t)
          </h4>
          <div className="text-[11px] font-serif text-teal-900 font-semibold mt-0.5">
            Luas = <MVar sym="v" /> · <MVar sym="t" /> = <span className="font-mono tabular-nums">{areaS} m</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#F7FCFB] border border-teal-200/75 shadow-inner p-1.5">
          <svg viewBox="0 0 280 205" className="w-full h-auto block">
            <defs>
              <pattern id="glb-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(13, 148, 136, 0.32)" strokeWidth="2.5" />
              </pattern>
              <marker id="glb-arrow-v" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
              </marker>
            </defs>

            {[0, 1, 2, 3, 4, 5].map((tVal) => (
              <g key={`vt-t-${tVal}`}>
                <line x1={mapT(tVal)} y1={plotT} x2={mapT(tVal)} y2={plotB} stroke={tVal === 0 ? '#475569' : '#E2E8F0'} strokeWidth={tVal === 0 ? 1.8 : 1} />
                <text x={mapT(tVal)} y={plotB + 16} textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">{tVal}</text>
              </g>
            ))}

            {[0, 2, 4, 6, 8, 10].map((vVal) => {
              const y = plotB - (vVal / maxV) * plotH;
              return (
                <g key={`vt-v-${vVal}`}>
                  <line x1={plotL} y1={y} x2={plotR} y2={y} stroke={vVal === 0 ? '#475569' : '#E2E8F0'} strokeWidth={vVal === 0 ? 1.8 : 1} />
                  <text x={plotL - 6} y={y + 4} textAnchor="end" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">{vVal}</text>
                </g>
              );
            })}

            {(() => {
              const yV = plotB - (speedV / maxV) * plotH;
              const xEnd = mapT(areaT);
              return (
                <>
                  <rect x={plotL} y={yV} width={xEnd - plotL} height={plotB - yV} fill="rgba(13, 148, 136, 0.14)" />
                  <rect x={plotL} y={yV} width={xEnd - plotL} height={plotB - yV} fill="url(#glb-hatch)" />
                  <line x1={xEnd} y1={yV} x2={xEnd} y2={plotB} stroke="#0D9488" strokeWidth="1.5" strokeDasharray="4 3" />

                  <text x={(plotL + xEnd) / 2} y={(yV + plotB) / 2 + 4} textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#115E59" fontFamily="JetBrains Mono, monospace">
                    s = {speedV}×{areaT} = {areaS} m
                  </text>

                  <line x1={plotL} y1={yV} x2={mapT(5)} y2={yV} stroke="#0D9488" strokeWidth="3.2" strokeLinecap="round" />
                  <circle cx={plotL} cy={yV} r="4" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2.4" />
                  <circle cx={xEnd} cy={yV} r="4" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2.4" />
                </>
              );
            })()}

            <line x1={plotL} y1={plotB} x2={plotL} y2={plotT - 8} stroke="#334155" strokeWidth="2" markerEnd="url(#glb-arrow-v)" />
            <line x1={plotL} y1={plotB} x2={plotR + 10} y2={plotB} stroke="#334155" strokeWidth="2" markerEnd="url(#glb-arrow-v)" />
            <text x={plotL - 4} y={13} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">v(m/s)</text>
            <text x={plotR + 14} y={plotB + 16} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">t(s)</text>
          </svg>
        </div>

        <p className="text-[10.5px] text-slate-600 leading-snug">
          Garis datar (<span className="font-mono font-bold text-teal-700">v = {speedV} m/s</span>); luas arsiran di bawah garis bernilai <span className="font-mono font-bold text-slate-800">{areaS} m</span>.
        </p>
      </div>

      {/* BENTO CARD 5: Grafik a-t */}
      <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2 transition-all hover:border-sky-400">
        <div>
          <div className="text-[10px] font-bold text-indigo-800">Grafik 3 · Tanpa Percepatan</div>
          <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-tight">
            Percepatan vs Waktu (a – t)
          </h4>
          <div className="text-[11px] font-mono font-bold text-indigo-700 mt-0.5">a = 0 m/s²</div>
        </div>

        <div className="rounded-xl bg-[#F8FAFF] border border-indigo-200/75 shadow-inner p-1.5">
          <svg viewBox="0 0 280 205" className="w-full h-auto block">
            {[0, 1, 2, 3, 4, 5].map((tVal) => (
              <g key={`at-t-${tVal}`}>
                <line x1={mapT(tVal)} y1={plotT} x2={mapT(tVal)} y2={plotB} stroke={tVal === 0 ? '#475569' : '#E2E8F0'} strokeWidth={tVal === 0 ? 1.8 : 1} />
                <text x={mapT(tVal)} y={plotB + 16} textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">{tVal}</text>
              </g>
            ))}
            <line x1={plotL} y1={100} x2={plotR + 10} y2={100} stroke="#CBD5E1" strokeWidth="1.6" />
            <line x1={plotL} y1={100} x2={plotR} y2={100} stroke="#4F46E5" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx={plotL} cy={100} r="4.2" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.4" />
            <text x={plotL - 7} y={104} textAnchor="end" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">0</text>
            <text x={plotL - 4} y={13} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">a(m/s²)</text>
            <text x={plotR + 14} y={116} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">t(s)</text>
            <text x={(plotL + plotR) / 2} y={76} textAnchor="middle" fontSize="11" fontWeight="700" fill="#4338CA" fontFamily="JetBrains Mono, monospace">
              Berimpit di sumbu t (a = 0)
            </text>
          </svg>
        </div>

        <p className="text-[10.5px] text-slate-600 leading-snug">
          Tidak ada percepatan maupun perlambatan sehingga nilai garis selalu nol.
        </p>
      </div>

      {/* BENTO CARD 6: Studi Kasus Kontekstual GLB */}
      <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#DFF0FF] backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2.5 transition-all hover:border-sky-400">
        <div className="space-y-1">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-teal-500 to-sky-500" />
          <div className="flex items-center gap-1.5 text-cyan-800 text-[10.5px] font-bold">
            <Lightbulb className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
            <span>Contoh Soal Kontekstual</span>
          </div>
          <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-snug">
            Kereta Cepat Whoosh Melaju Konstan
          </h4>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            Kereta Whoosh melaju konstan <strong className="tabular-nums text-slate-900">270 km/jam</strong> selama <strong className="tabular-nums text-slate-900">20 menit</strong>. Hitung jarak tempuhnya.
          </p>
        </div>

        <div className="rounded-xl bg-white/95 border border-emerald-200/90 p-2.5 space-y-1.5 text-[11px] text-slate-800 shadow-xs">
          <div>
            <span className="font-bold text-emerald-900 block">Diketahui:</span>
            <span>
              <MVar sym="v" /> = <span className="font-mono tabular-nums font-bold">270 km/jam</span>,{' '}
              <MVar sym="t" /> = <MFrac num="20" den="60" barClassName="border-slate-800" /> = <MFrac num="1" den="3" barClassName="border-slate-800" /> jam
            </span>
          </div>
          <div>
            <span className="font-bold text-emerald-900 block">Penyelesaian:</span>
            <span>
              <MVar sym="s" /> = <MVar sym="v" />·<MVar sym="t" /> = 270×<MFrac num="1" den="3" barClassName="border-slate-800" /> ={' '}
              <strong className="font-mono tabular-nums text-emerald-800">90 km</strong>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

/* ============================================================================
   TAB 2 BENTO CONTENT: GERAK LURUS BERUBAH BERATURAN (GLBB)
   ============================================================================ */
const GLBBBentoGrid: React.FC = () => {
  const [mode, setMode] = useState<'dipercepat' | 'diperlambat'>('dipercepat');
  const accelMag = 4;

  const v0 = mode === 'dipercepat' ? 4 : 20;
  const aVal = mode === 'dipercepat' ? accelMag : -accelMag;
  const tStop = mode === 'diperlambat' ? Math.min(5, v0 / accelMag) : 5;
  const tMaxPlot = 5;

  const plotL = 38;
  const plotR = 258;
  const plotT = 22;
  const plotB = 172;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  const mapT = (t: number) => plotL + (t / tMaxPlot) * plotW;

  const vEnd = Math.max(0, v0 + aVal * tStop);
  const sMaxGraph = mode === 'dipercepat'
    ? Math.max(50, Math.ceil((v0 * 5 + 0.5 * accelMag * 25) / 10) * 10)
    : 60;
  const vMaxGraph = mode === 'dipercepat'
    ? Math.max(25, Math.ceil((v0 + accelMag * 5) / 5) * 5)
    : 25;

  const mapV = (v: number) => plotB - (Math.max(0, v) / vMaxGraph) * plotH;
  const mapS = (s: number) => plotB - (Math.max(0, s) / sMaxGraph) * plotH;

  const parabolaPoints = useMemo(() => {
    const pts: string[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tStop;
      const s = v0 * t + 0.5 * aVal * t * t;
      pts.push(`${mapT(t).toFixed(1)},${mapS(s).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [v0, aVal, tStop, sMaxGraph]);

  const sFinal = v0 * tStop + 0.5 * aVal * tStop * tStop;
  const accentStroke = mode === 'dipercepat' ? '#EA580C' : '#DC2626';
  const accentFill = mode === 'dipercepat' ? 'rgba(234, 88, 12, 0.14)' : 'rgba(220, 38, 38, 0.14)';

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Slim Glass Futuristic Mode Selector Strip */}
      <div className="bg-gradient-to-r from-white/95 via-[#EFF8FF]/95 to-[#E1F2FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-black text-slate-900">Mode Kurva Grafik GLBB:</span>
          <span className="text-slate-600 hidden sm:inline">Pilih kondisi percepatan untuk membandingkan bentuk grafik</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100/90 border border-indigo-200/70 p-1 rounded-xl">
          <button
            onClick={() => {
              sounds.playClick();
              setMode('dipercepat');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'dipercepat'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dipercepat (a &gt; 0)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setMode('diperlambat');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'diperlambat'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Diperlambat (a &lt; 0)
          </button>
        </div>
      </div>

      {/* SINGLE ROW: ALL 6 CARDS SIDE BY SIDE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-stretch">

        {/* BENTO CARD 1: Hakikat & Klasifikasi GLBB */}
        <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2.5 transition-all hover:border-sky-400">
          <div className="space-y-1.5">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
            <div className="text-[10.5px] font-bold text-orange-800 tracking-wide">
              Percepatan Konstan · GLBB
            </div>
            <h3 className="text-sm xl:text-base font-black text-slate-900 leading-snug tracking-tight">
              Hakikat Gerak Lurus Berubah Beraturan
            </h3>
            <p className="text-[11px] xl:text-xs font-medium text-slate-700 leading-relaxed">
              <strong className="text-orange-800">GLBB</strong> adalah gerak lurus dengan <strong className="text-slate-900">percepatan tetap (<MVar sym="a" /> ≠ 0)</strong> sehingga kelajuan berubah teratur tiap detik.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-orange-100">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-50/80 to-white border border-orange-200/80 space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-[11px]">
                <Activity className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                <span>Dipercepat (<MVar sym="a" /> &gt; 0)</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-snug">
                Kelajuan naik teratur; percepatan searah gerak benda.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-50/80 to-white border border-rose-200/80 space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-[11px]">
                <Gauge className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>Diperlambat (<MVar sym="a" /> &lt; 0)</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-snug">
                Kelajuan turun teratur; percepatan melawan arah gerak.
              </p>
            </div>
          </div>
        </div>

        {/* BENTO CARD 2: Trisula 3 Persamaan Utama GLBB */}
        <div className="bg-gradient-to-br from-[#0F2747] via-[#173A6B] to-[#0B4F7A] text-white rounded-2xl border border-sky-400/50 shadow-[0_14px_34px_-12px_rgba(2,132,199,0.4)] p-3.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold">
            <span>3 Persamaan GLBB</span>
            <span className="font-mono text-[10px] text-cyan-300">a tetap</span>
          </div>

          <div className="space-y-1.5">
            <div className="px-2.5 py-2 rounded-xl bg-white/[0.08] backdrop-blur-md border border-cyan-300/25 text-center">
              <div className="text-[9.5px] text-amber-300 font-mono font-bold">Persamaan 1 (tanpa s)</div>
              <div className="text-base xl:text-lg text-white">
                <MVar sym="v" sub="t" /> = <MVar sym="v" sub="0" /> + <MVar sym="a" /><MVar sym="t" />
              </div>
            </div>

            <div className="px-2.5 py-2 rounded-xl bg-white/[0.08] backdrop-blur-md border border-cyan-300/25 text-center">
              <div className="text-[9.5px] text-amber-300 font-mono font-bold">Persamaan 2 (tanpa vₜ)</div>
              <div className="text-base xl:text-lg text-white">
                <MVar sym="s" /> = <MVar sym="v" sub="0" /><MVar sym="t" /> + <MFrac num="1" den="2" barClassName="border-white" /><MVar sym="a" /><MVar sym="t" sup="2" />
              </div>
            </div>

            <div className="px-2.5 py-2 rounded-xl bg-white/[0.08] backdrop-blur-md border border-cyan-300/25 text-center">
              <div className="text-[9.5px] text-amber-300 font-mono font-bold">Persamaan 3 (tanpa t)</div>
              <div className="text-base xl:text-lg text-white">
                <MVar sym="v" sub="t" sup="2" /> = <MVar sym="v" sub="0" sup="2" /> + 2<MVar sym="a" /><MVar sym="s" />
              </div>
            </div>
          </div>

          <div className="pt-1.5 border-t border-cyan-400/25 text-xs text-center text-cyan-100">
            <MVar sym="a" /> = <MFrac num={<><MVar sym="v" sub="t" /> − <MVar sym="v" sub="0" /></>} den={<MVar sym="t" />} barClassName="border-cyan-200" />
          </div>
        </div>

        {/* BENTO CARD 3: Grafik v-t GLBB */}
        <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2 transition-all hover:border-sky-400">
          <div>
            <div className="text-[10px] font-bold text-rose-800">Grafik 1 · Linear Miring</div>
            <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-tight">
              Kecepatan vs Waktu (v – t)
            </h4>
            <div className="text-[11px] font-serif font-semibold text-slate-800 mt-0.5">
              Luas = <MVar sym="s" /> = <span className="font-mono tabular-nums">{sFinal.toFixed(1)} m</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#FFF9FA] border border-rose-200/75 shadow-inner p-1.5">
            <svg viewBox="0 0 280 205" className="w-full h-auto block">
              <defs>
                <marker id="glbb-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                </marker>
              </defs>

              {[0, 1, 2, 3, 4, 5].map((tVal) => (
                <g key={`glbb-vt-t-${tVal}`}>
                  <line x1={mapT(tVal)} y1={plotT} x2={mapT(tVal)} y2={plotB} stroke={tVal === 0 ? '#475569' : '#E2E8F0'} strokeWidth={tVal === 0 ? 1.8 : 1} />
                  <text x={mapT(tVal)} y={plotB + 16} textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">{tVal}</text>
                </g>
              ))}

              {[0, 5, 10, 15, 20, 25].filter((v) => v <= vMaxGraph).map((vVal) => (
                <g key={`glbb-vt-v-${vVal}`}>
                  <line x1={plotL} y1={mapV(vVal)} x2={plotR} y2={mapV(vVal)} stroke={vVal === 0 ? '#475569' : '#E2E8F0'} strokeWidth={vVal === 0 ? 1.8 : 1} />
                  <text x={plotL - 6} y={mapV(vVal) + 4} textAnchor="end" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">{vVal}</text>
                </g>
              ))}

              <polygon points={`${mapT(0)},${plotB} ${mapT(0)},${mapV(v0)} ${mapT(tStop)},${mapV(vEnd)} ${mapT(tStop)},${plotB}`} fill={accentFill} />
              <line x1={mapT(0)} y1={mapV(v0)} x2={mapT(tStop)} y2={mapV(vEnd)} stroke={accentStroke} strokeWidth="3.2" strokeLinecap="round" />

              <circle cx={mapT(0)} cy={mapV(v0)} r="4" fill="#FFFFFF" stroke={accentStroke} strokeWidth="2.4" />
              <circle cx={mapT(tStop)} cy={mapV(vEnd)} r="4" fill="#FFFFFF" stroke={accentStroke} strokeWidth="2.4" />

              <text x={mapT(0) + 6} y={mapV(v0) - 7} fontSize="10.5" fontWeight="700" fill={accentStroke} fontFamily="JetBrains Mono, monospace">v₀={v0}</text>
              <text x={mapT(tStop) - 4} y={mapV(vEnd) - 8} textAnchor="end" fontSize="10.5" fontWeight="700" fill={accentStroke} fontFamily="JetBrains Mono, monospace">vₜ={vEnd.toFixed(0)}</text>
              <text x={(mapT(0) + mapT(tStop)) / 2} y={152} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1E293B" fontFamily="JetBrains Mono, monospace">
                s = {sFinal.toFixed(1)} m
              </text>

              <line x1={plotL} y1={plotB} x2={plotL} y2={plotT - 8} stroke="#334155" strokeWidth="2" markerEnd="url(#glbb-arrow)" />
              <line x1={plotL} y1={plotB} x2={plotR + 10} y2={plotB} stroke="#334155" strokeWidth="2" markerEnd="url(#glbb-arrow)" />
              <text x={plotL - 4} y={13} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">v(m/s)</text>
              <text x={plotR + 14} y={plotB + 16} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">t(s)</text>
            </svg>
          </div>

          <p className="text-[10.5px] text-slate-600 leading-snug">
            {mode === 'dipercepat'
              ? 'Garis miring naik: kelajuan meningkat teratur; luas = perpindahan.'
              : 'Garis miring turun: kelajuan berkurang teratur hingga vₜ = 0.'}
          </p>
        </div>

        {/* BENTO CARD 4: Grafik s-t Parabola GLBB */}
        <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2 transition-all hover:border-sky-400">
          <div>
            <div className="text-[10px] font-bold text-violet-800">Grafik 2 · Kurva Kuadratik</div>
            <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-tight">
              Posisi vs Waktu (s – t Parabola)
            </h4>
            <div className="text-[11px] font-serif font-semibold text-violet-800 mt-0.5">
              <MVar sym="s" /> = <MVar sym="v" sub="0" /><MVar sym="t" /> + <MFrac num="1" den="2" /><MVar sym="a" /><MVar sym="t" sup="2" />
            </div>
          </div>

          <div className="rounded-xl bg-[#FAF8FF] border border-violet-200/75 shadow-inner p-1.5">
            <svg viewBox="0 0 280 205" className="w-full h-auto block">
              {[0, 1, 2, 3, 4, 5].map((tVal) => (
                <g key={`glbb-st-t-${tVal}`}>
                  <line x1={mapT(tVal)} y1={plotT} x2={mapT(tVal)} y2={plotB} stroke={tVal === 0 ? '#475569' : '#E2E8F0'} strokeWidth={tVal === 0 ? 1.8 : 1} />
                  <text x={mapT(tVal)} y={plotB + 16} textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">{tVal}</text>
                </g>
              ))}

              {[0, 15, 30, 45, 60, 75].filter((s) => s <= sMaxGraph).map((sVal) => (
                <g key={`glbb-st-s-${sVal}`}>
                  <line x1={plotL} y1={mapS(sVal)} x2={plotR} y2={mapS(sVal)} stroke={sVal === 0 ? '#475569' : '#E2E8F0'} strokeWidth={sVal === 0 ? 1.8 : 1} />
                  <text x={plotL - 6} y={mapS(sVal) + 4} textAnchor="end" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">{sVal}</text>
                </g>
              ))}

              <line x1={mapT(0)} y1={mapS(0)} x2={mapT(tStop)} y2={mapS(sFinal)} stroke="#94A3B8" strokeWidth="1.4" strokeDasharray="4 4" />
              <polyline points={parabolaPoints} fill="none" stroke="#7C3AED" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />

              <circle cx={mapT(0)} cy={mapS(0)} r="4" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="2.4" />
              <circle cx={mapT(tStop)} cy={mapS(sFinal)} r="4" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="2.4" />

              <text x={mapT(tStop) - 4} y={Math.max(36, mapS(sFinal) - 10)} textAnchor="end" fontSize="10" fontWeight="700" fill="#6D28D9" fontFamily="JetBrains Mono, monospace">
                {mode === 'dipercepat' ? 'Cekung ke atas' : 'Melandai (henti)'}
              </text>

              <line x1={plotL} y1={plotB} x2={plotL} y2={plotT - 8} stroke="#334155" strokeWidth="2" markerEnd="url(#glbb-arrow)" />
              <line x1={plotL} y1={plotB} x2={plotR + 10} y2={plotB} stroke="#334155" strokeWidth="2" markerEnd="url(#glbb-arrow)" />
              <text x={plotL - 4} y={13} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">s(m)</text>
              <text x={plotR + 14} y={plotB + 16} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">t(s)</text>
            </svg>
          </div>

          <p className="text-[10.5px] text-slate-600 leading-snug">
            {mode === 'dipercepat'
              ? 'Kurva menanjak curam sebanding kuadrat waktu (t²).'
              : 'Kurva melandai menuju datar saat benda mendekati berhenti.'}
          </p>
        </div>

        {/* BENTO CARD 5: Grafik a-t GLBB */}
        <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2 transition-all hover:border-sky-400">
          <div>
            <div className="text-[10px] font-bold text-sky-800">Grafik 3 · Percepatan Konstan</div>
            <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-tight">
              Percepatan vs Waktu (a – t)
            </h4>
            <div className={`text-[11px] font-mono font-bold mt-0.5 ${mode === 'dipercepat' ? 'text-orange-700' : 'text-rose-700'}`}>
              a = {aVal > 0 ? `+${aVal}` : aVal} m/s²
            </div>
          </div>

          <div className="rounded-xl bg-[#F8FBFF] border border-sky-200/75 shadow-inner p-1.5">
            <svg viewBox="0 0 280 205" className="w-full h-auto block">
              {[0, 1, 2, 3, 4, 5].map((tVal) => (
                <g key={`glbb-at-t-${tVal}`}>
                  <line x1={mapT(tVal)} y1={plotT} x2={mapT(tVal)} y2={plotB} stroke={tVal === 0 ? '#475569' : '#E2E8F0'} strokeWidth={tVal === 0 ? 1.8 : 1} />
                  <text x={mapT(tVal)} y={plotB + 16} textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">{tVal}</text>
                </g>
              ))}
              <line x1={plotL} y1={100} x2={plotR + 10} y2={100} stroke="#94A3B8" strokeWidth="1.6" />
              <text x={plotL - 7} y={104} textAnchor="end" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#475569">0</text>

              {(() => {
                const barY = mode === 'dipercepat' ? 52 : 148;
                const rectY = Math.min(100, barY);
                const rectH = Math.abs(barY - 100);
                const xStop = mapT(tStop);
                return (
                  <>
                    <rect x={plotL} y={rectY} width={xStop - plotL} height={rectH} fill={accentFill} />
                    <line x1={plotL} y1={barY} x2={xStop} y2={barY} stroke={accentStroke} strokeWidth="3.2" />
                    <circle cx={plotL} cy={barY} r="4" fill="#FFFFFF" stroke={accentStroke} strokeWidth="2.2" />
                    <text x={plotL - 6} y={barY + 4} textAnchor="end" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace" fill={accentStroke}>
                      {aVal > 0 ? `+${aVal}` : aVal}
                    </text>
                  </>
                );
              })()}
              <text x={plotL - 4} y={13} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">a(m/s²)</text>
              <text x={plotR + 14} y={116} textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">t(s)</text>
            </svg>
          </div>

          <p className="text-[10.5px] text-slate-600 leading-snug">
            Percepatan konstan: di atas sumbu t (dipercepat) atau di bawah sumbu t (diperlambat).
          </p>
        </div>

        {/* BENTO CARD 6: Studi Kasus Pengereman Mobil */}
        <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#DFF0FF] backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2.5 transition-all hover:border-sky-400">
          <div className="space-y-1">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" />
            <div className="flex items-center gap-1.5 text-teal-800 text-[10.5px] font-bold">
              <Lightbulb className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span>Contoh Kasus Pengereman</span>
            </div>
            <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-snug">
              Menentukan Jarak Henti Mobil
            </h4>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Mobil melaju <strong className="tabular-nums text-slate-900">20 m/s</strong>, direm dengan perlambatan <strong className="tabular-nums text-slate-900">4 m/s²</strong> hingga berhenti (<MVar sym="v" sub="t" /> = 0). Hitung jarak tempuhnya.
            </p>
          </div>

          <div className="rounded-xl bg-white/95 border border-teal-200/90 p-2.5 space-y-1.5 text-[11px] text-slate-800 shadow-xs">
            <div>
              <strong className="text-teal-900 block">Diketahui:</strong>
              <span>
                <MVar sym="v" sub="0" /> = <span className="font-mono font-bold">20 m/s</span>,{' '}
                <MVar sym="a" /> = <span className="font-mono font-bold">−4 m/s²</span>
              </span>
            </div>
            <div>
              <strong className="text-teal-900 block">Penyelesaian:</strong>
              <span>
                <MVar sym="s" /> = <MFrac num={<>0 − 20<sup>2</sup></>} den="2(−4)" barClassName="border-slate-800" /> ={' '}
                <strong className="font-mono tabular-nums text-rose-700">50 m</strong>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ============================================================================
   TAB 3 BENTO CONTENT: GERAK JATUH BEBAS & GERAK VERTIKAL
   ============================================================================ */
const VerticalBentoGrid: React.FC = () => {
  const [vertMode, setVertMode] = useState<'gjb' | 'gva'>('gjb');

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Slim Glass Futuristic Mode Selector Strip */}
      <div className="bg-gradient-to-r from-white/95 via-[#EFF8FF]/95 to-[#E1F2FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-black text-slate-900">Visualisasi Gerak Vertikal:</span>
          <span className="text-slate-600 font-mono">g = 10 m/s²</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100/90 border border-indigo-200/70 p-1 rounded-xl">
          <button
            onClick={() => {
              sounds.playClick();
              setVertMode('gjb');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
              vertMode === 'gjb'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gerak Jatuh Bebas (GJB)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setVertMode('gva');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
              vertMode === 'gva'
                ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gerak Vertikal ke Atas (GVA)
          </button>
        </div>
      </div>

      {/* SINGLE ROW: ALL 6 CARDS SIDE BY SIDE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-stretch">

        {/* BENTO CARD 1: Konsep Gravitasi Bumi */}
        <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2.5 transition-all hover:border-sky-400">
          <div className="space-y-1.5">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
            <div className="text-[10.5px] font-bold text-violet-800 tracking-wide">
              Medan Gravitasi Bumi
            </div>
            <h3 className="text-sm xl:text-base font-black text-slate-900 leading-snug tracking-tight">
              Gerak Vertikal &amp; Jatuh Bebas
            </h3>
            <p className="text-[11px] xl:text-xs font-medium text-slate-700 leading-relaxed">
              Kasus khusus GLBB pada sumbu vertikal dengan percepatan gravitasi <strong className="text-slate-900">(<MVar sym="g" /> ≈ 9,8–10 m/s²)</strong> ke pusat bumi.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-50/80 to-white border border-violet-200/80 space-y-1">
            <div className="text-[11px] font-black text-violet-900">Intisari Penting</div>
            <p className="text-[10px] text-slate-700 leading-snug">
              Di ruang hampa, <MVar sym="t" sub="jatuh" /> tidak bergantung massa. Pada GVA, <MVar sym="t" sub="naik" /> = <MVar sym="t" sub="turun" />.
            </p>
          </div>
        </div>

        {/* BENTO CARD 2: Rumus GJB */}
        <div className="bg-gradient-to-br from-[#0F2747] via-[#1B336B] to-[#134E7A] text-white rounded-2xl border border-sky-400/50 shadow-[0_14px_34px_-12px_rgba(2,132,199,0.4)] p-3.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 font-black text-xs text-violet-200">
              <ArrowDown className="h-3.5 w-3.5 text-violet-300 shrink-0" />
              <span>1. Jatuh Bebas (GJB)</span>
            </div>
            <span className="text-[9.5px] font-mono text-violet-300 whitespace-nowrap">v₀=0</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] border border-violet-300/25 text-center">
              <div className="text-[9.5px] text-violet-200">Kecepatan</div>
              <div className="text-sm"><MVar sym="v" sub="t" /> = <MVar sym="g" /> · <MVar sym="t" /></div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] border border-violet-300/25 text-center">
              <div className="text-[9.5px] text-violet-200">Jarak Jatuh</div>
              <div className="text-sm"><MVar sym="h" /> = <MFrac num="1" den="2" barClassName="border-white" /><MVar sym="g" /><MVar sym="t" sup="2" /></div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] border border-violet-300/25 text-center">
              <div className="text-[9.5px] text-violet-200">Laju dari Tinggi h</div>
              <div className="text-sm text-violet-100">
                <MVar sym="v" sub="t" /> = <MSqrt>2<MVar sym="g" /><MVar sym="h" /></MSqrt>
              </div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] border border-violet-300/25 text-center">
              <div className="text-[9.5px] text-violet-200">Waktu Jatuh</div>
              <div className="text-sm text-violet-100">
                <MVar sym="t" /> = <MSqrt><MFrac num={<>2<MVar sym="h" /></>} den={<MVar sym="g" />} barClassName="border-violet-200" /></MSqrt>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO CARD 3: Rumus GVA */}
        <div className="bg-gradient-to-br from-[#0F2747] via-[#173A6B] to-[#0B4F7A] text-white rounded-2xl border border-sky-400/50 shadow-[0_14px_34px_-12px_rgba(2,132,199,0.4)] p-3.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 font-black text-xs text-cyan-200">
              <ArrowUp className="h-3.5 w-3.5 text-sky-300 shrink-0" />
              <span>2. Vertikal Atas (GVA)</span>
            </div>
            <span className="text-[9.5px] font-mono text-sky-300 whitespace-nowrap">a=−g</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] border border-cyan-300/25 text-center">
              <div className="text-[9.5px] text-indigo-200">Kecepatan Naik</div>
              <div className="text-sm"><MVar sym="v" sub="t" /> = <MVar sym="v" sub="0" /> − <MVar sym="g" /><MVar sym="t" /></div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] border border-cyan-300/25 text-center">
              <div className="text-[9.5px] text-indigo-200">Ketinggian saat t</div>
              <div className="text-sm"><MVar sym="h" /> = <MVar sym="v" sub="0" /><MVar sym="t" /> − <MFrac num="1" den="2" barClassName="border-white" /><MVar sym="g" /><MVar sym="t" sup="2" /></div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] border border-cyan-300/25 text-center">
              <div className="text-[9.5px] text-indigo-200">Tinggi Maksimum</div>
              <div className="text-sm text-sky-200">
                <MVar sym="h" sub="maks" /> = <MFrac num={<MVar sym="v" sub="0" sup="2" />} den={<>2<MVar sym="g" /></>} barClassName="border-sky-200" />
              </div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] border border-cyan-300/25 text-center">
              <div className="text-[9.5px] text-indigo-200">Waktu Puncak</div>
              <div className="text-sm text-sky-200">
                <MVar sym="t" sub="puncak" /> = <MFrac num={<MVar sym="v" sub="0" />} den={<MVar sym="g" />} barClassName="border-sky-200" />
              </div>
            </div>
          </div>
        </div>

        {/* BENTO CARD 4: Diagram Stroboskopik */}
        <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2 transition-all hover:border-sky-400">
          <div>
            <div className="text-[10px] font-bold text-indigo-800">Visual 1 · Pola Posisi</div>
            <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-tight">
              {vertMode === 'gjb' ? 'Stroboskopik GJB' : 'Lintasan Naik – Turun'}
            </h4>
          </div>

          <div className="rounded-xl bg-[#F8FAFF] border border-indigo-200/75 shadow-inner p-1.5 flex-1 flex items-center justify-center">
            {vertMode === 'gjb' ? (
              <svg viewBox="0 0 280 230" className="w-full h-auto">
                <defs>
                  <marker id="gjb-vec" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#7C3AED" />
                  </marker>
                  <marker id="gjb-g" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
                  </marker>
                </defs>

                <line x1="20" y1="208" x2="260" y2="208" stroke="#334155" strokeWidth="2.5" />
                <text x="140" y="223" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#475569">Tanah (h = 0)</text>
                <line x1="95" y1="24" x2="95" y2="208" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4" />

                {[
                  { t: 0, y: 28, v: 0, hDrop: 0 },
                  { t: 1, y: 46, v: 10, hDrop: 5 },
                  { t: 2, y: 100, v: 20, hDrop: 20 },
                  { t: 3, y: 190, v: 30, hDrop: 45 },
                ].map((pt) => (
                  <g key={`gjb-${pt.t}`}>
                    <line x1="80" y1={pt.y} x2="112" y2={pt.y} stroke="#E2E8F0" strokeWidth="1" />
                    <circle cx="95" cy={pt.y} r="8" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2" />
                    {pt.v > 0 && (
                      <line
                        x1="95"
                        y1={pt.y + 8}
                        x2="95"
                        y2={Math.min(206, pt.y + 8 + pt.v * 0.65)}
                        stroke="#7C3AED"
                        strokeWidth="2"
                        markerEnd="url(#gjb-vec)"
                      />
                    )}
                    <text x="118" y={pt.y + 4} fontSize="10.5" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="#1E293B">
                      t={pt.t}s · Δh={pt.hDrop}m
                    </text>
                  </g>
                ))}

                <line x1="38" y1="55" x2="38" y2="115" stroke="#DC2626" strokeWidth="2.5" markerEnd="url(#gjb-g)" />
                <text x="38" y="45" textAnchor="middle" fontSize="11" fontWeight="800" fill="#DC2626" fontFamily="JetBrains Mono, monospace">g=10</text>
              </svg>
            ) : (
              <svg viewBox="0 0 280 230" className="w-full h-auto">
                <defs>
                  <marker id="gva-up" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#4F46E5" />
                  </marker>
                  <marker id="gva-down" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
                  </marker>
                </defs>

                <line x1="20" y1="204" x2="260" y2="204" stroke="#334155" strokeWidth="2.5" />
                <path d="M 85 194 Q 140 -90, 195 194" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />

                <circle cx="140" cy="52" r="8.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                <text x="140" y="34" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#B45309" fontFamily="JetBrains Mono, monospace">
                  Puncak (vₜ = 0)
                </text>

                <circle cx="85" cy="194" r="7.5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="85" y1="184" x2="85" y2="146" stroke="#4F46E5" strokeWidth="2.2" markerEnd="url(#gva-up)" />
                <text x="18" y="180" fontSize="10" fontWeight="700" fill="#3730A3" fontFamily="JetBrains Mono, monospace">+v₀</text>

                <circle cx="105" cy="108" r="7" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="105" y1="98" x2="105" y2="76" stroke="#4F46E5" strokeWidth="2" markerEnd="url(#gva-up)" />
                <text x="20" y="110" fontSize="10" fontWeight="700" fill="#4338CA" fontFamily="JetBrains Mono, monospace">Naik</text>

                <circle cx="175" cy="108" r="7" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="175" y1="118" x2="175" y2="140" stroke="#DC2626" strokeWidth="2" markerEnd="url(#gva-down)" />
                <text x="192" y="110" fontSize="10" fontWeight="700" fill="#B91C1C" fontFamily="JetBrains Mono, monospace">Turun</text>

                <circle cx="195" cy="194" r="7.5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
                <text x="206" y="182" fontSize="10" fontWeight="700" fill="#991B1B" fontFamily="JetBrains Mono, monospace">|v|=v₀</text>
              </svg>
            )}
          </div>

          <p className="text-[10.5px] text-slate-600 leading-snug">
            {vertMode === 'gjb' ? 'Perbandingan jarak tempuh tiap detik mengikuti pola 1 : 3 : 5.' : 'Gerak naik diperlambat hingga puncak, lalu turun dipercepat.'}
          </p>
        </div>

        {/* BENTO CARD 5: Grafik v-t Vertikal */}
        <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2 transition-all hover:border-sky-400">
          <div>
            <div className="text-[10px] font-bold text-purple-800">Grafik 2 · Kecepatan</div>
            <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-tight">Grafik v – t</h4>
            <span className="text-[10.5px] font-mono font-bold text-purple-800">Gradien = g</span>
          </div>

          <div className="rounded-xl bg-[#FAF8FF] border border-purple-200/75 shadow-inner p-1.5 flex-1 flex items-center">
            <svg viewBox="0 0 240 165" className="w-full h-auto block">
              {vertMode === 'gjb' ? (
                <>
                  <line x1="36" y1="18" x2="36" y2="138" stroke="#475569" strokeWidth="1.8" />
                  <line x1="36" y1="138" x2="220" y2="138" stroke="#475569" strokeWidth="1.8" />
                  <polygon points="36,138 198,32 198,138" fill="rgba(124, 58, 237, 0.14)" />
                  <line x1="36" y1="138" x2="198" y2="32" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="36" cy="138" r="3.8" fill="#FFF" stroke="#7C3AED" strokeWidth="2.2" />
                  <text x="135" y="114" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5B21B6" fontFamily="JetBrains Mono, monospace">Luas = h</text>
                  <text x="30" y="15" textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">v</text>
                  <text x="220" y="154" textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">t</text>
                  <text x="44" y="152" fontSize="10" fill="#64748B" fontFamily="JetBrains Mono, monospace">v₀=0</text>
                </>
              ) : (
                <>
                  <line x1="36" y1="16" x2="36" y2="146" stroke="#475569" strokeWidth="1.8" />
                  <line x1="36" y1="82" x2="220" y2="82" stroke="#475569" strokeWidth="1.8" />
                  <polygon points="36,82 36,26 122,82" fill="rgba(79, 70, 229, 0.15)" />
                  <polygon points="122,82 208,138 208,82" fill="rgba(220, 38, 38, 0.14)" />
                  <line x1="36" y1="26" x2="208" y2="138" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="122" cy="82" r="4.2" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.8" />
                  <text x="122" y="66" textAnchor="middle" fontSize="10" fontWeight="700" fill="#B45309" fontFamily="JetBrains Mono, monospace">puncak (v=0)</text>
                  <text x="30" y="15" textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">v</text>
                  <text x="220" y="96" textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">t</text>
                  <text x="42" y="25" fontSize="10" fontWeight="700" fill="#4338CA" fontFamily="JetBrains Mono, monospace">+v₀</text>
                  <text x="184" y="146" fontSize="10" fontWeight="700" fill="#B91C1C" fontFamily="JetBrains Mono, monospace">−v₀</text>
                </>
              )}
            </svg>
          </div>

          <p className="text-[10.5px] text-slate-600 leading-snug">
            {vertMode === 'gjb'
              ? 'Kecepatan bertambah linear sebanding waktu jatuh.'
              : 'Kecepatan turun hingga 0 di puncak, lalu berbalik arah.'}
          </p>
        </div>

        {/* BENTO CARD 6: Grafik h-t Vertikal */}
        <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-2xl border border-sky-300/85 shadow-[0_12px_30px_-14px_rgba(14,165,233,0.24)] p-3.5 flex flex-col justify-between gap-2 transition-all hover:border-sky-400">
          <div>
            <div className="text-[10px] font-bold text-cyan-800">Grafik 3 · Ketinggian</div>
            <h4 className="text-xs xl:text-sm font-black text-slate-900 leading-tight">Grafik h – t</h4>
            <span className="text-[10.5px] font-mono font-bold text-cyan-800">Kurva Kuadratik</span>
          </div>

          <div className="rounded-xl bg-[#F8FBFF] border border-cyan-200/75 shadow-inner p-1.5 flex-1 flex items-center">
            <svg viewBox="0 0 240 165" className="w-full h-auto block">
              <line x1="36" y1="18" x2="36" y2="138" stroke="#475569" strokeWidth="1.8" />
              <line x1="36" y1="138" x2="220" y2="138" stroke="#475569" strokeWidth="1.8" />
              <text x="30" y="15" textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">h</text>
              <text x="220" y="154" textAnchor="end" fontSize="11" fontWeight="700" fill="#0F172A">t</text>

              {vertMode === 'gjb' ? (
                <>
                  <path d="M 36 32 Q 125 36, 198 138" fill="none" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="36" cy="32" r="3.8" fill="#FFF" stroke="#7C3AED" strokeWidth="2.2" />
                  <text x="44" y="30" fontSize="10.5" fontWeight="700" fill="#5B21B6" fontFamily="JetBrains Mono, monospace">h₀</text>
                  <text x="142" y="102" fontSize="10" fontWeight="700" fill="#6D28D9" fontFamily="JetBrains Mono, monospace">Jatuh cepat</text>
                </>
              ) : (
                <>
                  <path d="M 36 138 Q 122 -52, 208 138" fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
                  <line x1="36" y1="43" x2="122" y2="43" stroke="#F59E0B" strokeWidth="1.3" strokeDasharray="3 3" />
                  <circle cx="122" cy="43" r="4.2" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.8" />
                  <text x="122" y="30" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#B45309" fontFamily="JetBrains Mono, monospace">h_maks</text>
                </>
              )}
            </svg>
          </div>

          <p className="text-[10.5px] text-slate-600 leading-snug">
            {vertMode === 'gjb'
              ? 'Ketinggian turun semakin curam seiring bertambahnya waktu.'
              : 'Lintasan parabola simetris mencapai h_maks di tengah waktu.'}
          </p>
        </div>

      </div>
    </div>
  );
};

/* ============================================================================
   MAIN COMPONENT: DIGITAL MODULE SECTION (HYBRID MODERN + SOFT FUTURISTIC)
   ============================================================================ */
export const DigitalModuleSection: React.FC<DigitalModuleSectionProps> = () => {
  const [activeTab, setActiveTab] = useState<'glb' | 'glbb' | 'vertikal' | 'kalkulator'>('glb');

  // Interactive Solver state
  const [solverType, setSolverType] = useState<'GLB' | 'GLBB'>('GLBB');
  const [inputV0, setInputV0] = useState<number>(5);
  const [inputA, setInputA] = useState<number>(2);
  const [inputT, setInputT] = useState<number>(4);
  const [inputS0, setInputS0] = useState<number>(0);
  const [solvedData, setSolvedData] = useState<{
    vt: number;
    s: number;
    stot: number;
    v0Used: number;
    aUsed: number;
    tUsed: number;
    s0Used: number;
    mode: 'GLB' | 'GLBB';
  } | null>(null);

  const handleSolve = () => {
    sounds.playSuccess();
    if (solverType === 'GLB') {
      const s = inputV0 * inputT;
      const stot = inputS0 + s;
      setSolvedData({
        vt: inputV0,
        s,
        stot,
        v0Used: inputV0,
        aUsed: 0,
        tUsed: inputT,
        s0Used: inputS0,
        mode: 'GLB',
      });
    } else {
      const vt = inputV0 + inputA * inputT;
      const s = inputV0 * inputT + 0.5 * inputA * (inputT * inputT);
      const stot = inputS0 + s;
      setSolvedData({
        vt,
        s,
        stot,
        v0Used: inputV0,
        aUsed: inputA,
        tUsed: inputT,
        s0Used: inputS0,
        mode: 'GLBB',
      });
    }
  };

  return (
    <section
      id="modul"
      className="relative w-full py-4 sm:py-5 border-t border-sky-200/90 bg-gradient-to-br from-[#E6F3FF] via-[#F3F9FF] to-[#E0F5FF] overflow-hidden"
    >
      {/* Subtle Hybrid Modern Futuristic Grid & Soft Ambient Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 bg-[linear-gradient(to_right,rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-[size:28px_28px]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-300/35 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[1560px] mx-auto px-3 sm:px-5 lg:px-6 space-y-3.5">

        {/* Hybrid Modern Glass Command Header */}
        <div className="bg-gradient-to-r from-white/95 via-[#EFF8FF]/95 to-[#E1F2FF]/95 backdrop-blur-xl rounded-3xl border border-sky-300/85 shadow-[0_14px_38px_-16px_rgba(14,165,233,0.28)] px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 mb-0.5">
                <span>Menu 3</span>
                <span aria-hidden="true">·</span>
                <span>Modul Pembelajaran Digital</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                Materi Lengkap: Kinematika GLB &amp; GLBB
              </h2>
            </div>
          </div>

          {/* Elegant Interactive Module Tab Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ scale: 0.965 }}
              transition={{ type: 'spring', stiffness: 440, damping: 26 }}
              onClick={() => {
                sounds.playClick();
                setActiveTab('glb');
              }}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                activeTab === 'glb'
                  ? 'bg-gradient-to-br from-indigo-600 to-sky-600 text-white border-indigo-400/60 shadow-[0_8px_18px_-6px_rgba(79,70,229,0.45)]'
                  : 'bg-white/95 text-slate-700 border-slate-200/80 hover:border-indigo-300 hover:text-indigo-950 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.06)]'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-lg border shrink-0 transition-transform group-hover:scale-105 ${
                  activeTab === 'glb'
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-sky-50 border-sky-200/80 text-sky-600'
                }`}
              >
                <Activity className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span>1. Gerak Lurus Beraturan (GLB)</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ scale: 0.965 }}
              transition={{ type: 'spring', stiffness: 440, damping: 26 }}
              onClick={() => {
                sounds.playClick();
                setActiveTab('glbb');
              }}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                activeTab === 'glbb'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400/60 shadow-[0_8px_18px_-6px_rgba(234,88,12,0.45)]'
                  : 'bg-white/95 text-slate-700 border-slate-200/80 hover:border-amber-300 hover:text-amber-950 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.06)]'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-lg border shrink-0 transition-transform group-hover:scale-105 ${
                  activeTab === 'glbb'
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-orange-50 border-orange-200/80 text-orange-600'
                }`}
              >
                <Gauge className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span>2. Gerak Berubah Beraturan (GLBB)</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ scale: 0.965 }}
              transition={{ type: 'spring', stiffness: 440, damping: 26 }}
              onClick={() => {
                sounds.playClick();
                setActiveTab('vertikal');
              }}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                activeTab === 'vertikal'
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-violet-400/60 shadow-[0_8px_18px_-6px_rgba(124,58,237,0.45)]'
                  : 'bg-white/95 text-slate-700 border-slate-200/80 hover:border-violet-300 hover:text-violet-950 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.06)]'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-lg border shrink-0 transition-transform group-hover:scale-105 ${
                  activeTab === 'vertikal'
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-violet-50 border-violet-200/80 text-violet-600'
                }`}
              >
                <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span>3. Gerak Jatuh Bebas &amp; Vertikal</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ scale: 0.965 }}
              transition={{ type: 'spring', stiffness: 440, damping: 26 }}
              onClick={() => {
                sounds.playClick();
                setActiveTab('kalkulator');
              }}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                activeTab === 'kalkulator'
                  ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white border-teal-400/60 shadow-[0_8px_18px_-6px_rgba(13,148,136,0.45)]'
                  : 'bg-white/95 text-slate-700 border-slate-200/80 hover:border-teal-300 hover:text-teal-950 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.06)]'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-lg border shrink-0 transition-transform group-hover:scale-105 ${
                  activeTab === 'kalkulator'
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-emerald-50 border-emerald-200/80 text-emerald-600'
                }`}
              >
                <Calculator className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span>4. Kalkulator Rumus</span>
            </motion.button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: GERAK LURUS BERATURAN (GLB) — HYBRID MODERN BENTO GRID             */}
        {/* ========================================================================= */}
        {activeTab === 'glb' && <GLBBentoGrid />}

        {/* ========================================================================= */}
        {/* TAB 2: GERAK LURUS BERUBAH BERATURAN (GLBB) — HYBRID MODERN BENTO GRID    */}
        {/* ========================================================================= */}
        {activeTab === 'glbb' && <GLBBBentoGrid />}

        {/* ========================================================================= */}
        {/* TAB 3: GERAK JATUH BEBAS & GERAK VERTIKAL — HYBRID MODERN BENTO GRID      */}
        {/* ========================================================================= */}
        {activeTab === 'vertikal' && <VerticalBentoGrid />}

        {/* ========================================================================= */}
        {/* TAB 4: KALKULATOR RUMUS INTERAKTIF (SOLVER MATEMATIS HYBRID MODERN)       */}
        {/* ========================================================================= */}
        {activeTab === 'kalkulator' && (
          <div className="bg-gradient-to-br from-white via-[#EFF8FF] to-[#E1F1FF]/95 backdrop-blur-xl rounded-3xl border-2 border-sky-300/90 shadow-[0_16px_40px_-16px_rgba(14,165,233,0.26)] p-5 sm:p-6 space-y-5 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-sm">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Kalkulator &amp; Pembuktian Rumus Kinematika
                  </h3>
                  <p className="text-xs font-medium text-slate-600">
                    Masukkan nilai parameter untuk melihat substitusi rumus dan hasil perhitungan secara sistematis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-indigo-200/75">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSolverType('GLB');
                    setSolvedData(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    solverType === 'GLB'
                      ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hitung GLB
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSolverType('GLBB');
                    setSolvedData(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    solverType === 'GLBB'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hitung GLBB
                </button>
              </div>
            </div>

            {/* Active Formula Preview (Soft Futuristic Dark Console) */}
            <div className="rounded-2xl bg-gradient-to-r from-[#0F2747] via-[#173A6B] to-[#0B4F7A] border border-sky-400/50 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <span className="text-xs font-semibold text-cyan-200">
                Persamaan Aktif ({solverType}):
              </span>
              {solverType === 'GLB' ? (
                <div className="flex flex-wrap items-center gap-5 text-base sm:text-lg">
                  <span><MVar sym="s" /> = <MVar sym="v" /> · <MVar sym="t" /></span>
                  <span className="text-cyan-400/60">|</span>
                  <span><MVar sym="s" sub="akhir" /> = <MVar sym="s" sub="0" /> + <MVar sym="v" /> · <MVar sym="t" /></span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-5 text-base sm:text-lg">
                  <span><MVar sym="v" sub="t" /> = <MVar sym="v" sub="0" /> + <MVar sym="a" /><MVar sym="t" /></span>
                  <span className="text-cyan-400/60">|</span>
                  <span>
                    <MVar sym="s" /> = <MVar sym="v" sub="0" /><MVar sym="t" /> + <MFrac num="1" den="2" barClassName="border-white" /><MVar sym="a" /><MVar sym="t" sup="2" />
                  </span>
                </div>
              )}
            </div>

            {/* Parameter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 bg-gradient-to-br from-sky-50/85 to-white rounded-2xl border border-sky-200/80 focus-within:border-sky-500 transition">
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Posisi Awal <MVar sym="s" sub="0" /> (meter):
                </label>
                <input
                  type="number"
                  value={inputS0}
                  onChange={(e) => setInputS0(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums font-bold bg-white border border-sky-200 rounded-xl focus:border-sky-500 outline-none"
                />
              </div>

              <div className="p-3.5 bg-gradient-to-br from-indigo-50/85 to-white rounded-2xl border border-indigo-200/80 focus-within:border-indigo-500 transition">
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  {solverType === 'GLB' ? <>Kecepatan <MVar sym="v" /></> : <>Kecepatan Awal <MVar sym="v" sub="0" /></>} (m/s):
                </label>
                <input
                  type="number"
                  value={inputV0}
                  onChange={(e) => setInputV0(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums font-bold bg-white border border-indigo-200 rounded-xl focus:border-indigo-500 outline-none"
                />
              </div>

              {solverType === 'GLBB' && (
                <div className="p-3.5 bg-gradient-to-br from-amber-50/85 to-white rounded-2xl border border-amber-200/80 focus-within:border-amber-500 transition">
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Percepatan <MVar sym="a" /> (m/s²):
                  </label>
                  <input
                    type="number"
                    value={inputA}
                    onChange={(e) => setInputA(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums font-bold bg-white border border-amber-200 rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>
              )}

              <div className="p-3.5 bg-gradient-to-br from-teal-50/85 to-white rounded-2xl border border-teal-200/80 focus-within:border-teal-500 transition">
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Selang Waktu <MVar sym="t" /> (sekon):
                </label>
                <input
                  type="number"
                  value={inputT}
                  onChange={(e) => setInputT(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums font-bold bg-white border border-teal-200 rounded-xl focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSolve}
                className="btn-3d-emerald bg-emerald-600 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Calculator className="h-4 w-4" />
                <span>Hitung Besaran Sekarang</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setInputV0(5);
                  setInputA(2);
                  setInputT(4);
                  setInputS0(0);
                  setSolvedData(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Nilai</span>
              </button>
            </div>

            {/* Solved Results Showcase with Real Formatted Math */}
            {solvedData && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#ECFDF5] via-white to-[#F0FDFA] border border-emerald-300 space-y-4 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                    Hasil Penyelesaian Matematis ({solvedData.mode})
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums font-bold text-emerald-950">
                    <span className="bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-xs">
                      <MVar sym="v" sub="t" /> = {solvedData.vt} m/s
                    </span>
                    <span className="bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-xs">
                      <MVar sym="s" /> = {solvedData.s} m
                    </span>
                    <span className="bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-xs">
                      <MVar sym="s" sub="akhir" /> = {solvedData.stot} m
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/95 border border-emerald-200 text-xs sm:text-sm text-slate-800 space-y-2.5">
                  <div>
                    <strong className="text-emerald-800">Diketahui:</strong>{' '}
                    <MVar sym="s" sub="0" /> = <span className="font-mono font-bold">{solvedData.s0Used} m</span>,{' '}
                    {solvedData.mode === 'GLB' ? <MVar sym="v" /> : <MVar sym="v" sub="0" />} ={' '}
                    <span className="font-mono font-bold">{solvedData.v0Used} m/s</span>,{' '}
                    {solvedData.mode === 'GLBB' && (
                      <>
                        <MVar sym="a" /> = <span className="font-mono font-bold">{solvedData.aUsed} m/s²</span>,{' '}
                      </>
                    )}
                    <MVar sym="t" /> = <span className="font-mono font-bold">{solvedData.tUsed} s</span>
                  </div>

                  {solvedData.mode === 'GLB' ? (
                    <>
                      <div>
                        <strong className="text-emerald-800">Langkah 1 (Perpindahan):</strong>{' '}
                        <MVar sym="s" /> = <MVar sym="v" /> · <MVar sym="t" /> ={' '}
                        <span className="font-mono">{solvedData.v0Used} × {solvedData.tUsed} = <strong>{solvedData.s} meter</strong></span>
                      </div>
                      <div>
                        <strong className="text-emerald-800">Langkah 2 (Posisi Akhir):</strong>{' '}
                        <MVar sym="s" sub="akhir" /> = <MVar sym="s" sub="0" /> + <MVar sym="s" /> ={' '}
                        <span className="font-mono">{solvedData.s0Used} + {solvedData.s} = <strong>{solvedData.stot} meter</strong></span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong className="text-emerald-800">Langkah 1 (Kecepatan Akhir):</strong>{' '}
                        <MVar sym="v" sub="t" /> = <MVar sym="v" sub="0" /> + <MVar sym="a" /><MVar sym="t" /> ={' '}
                        <span className="font-mono">{solvedData.v0Used} + ({solvedData.aUsed} × {solvedData.tUsed}) = <strong>{solvedData.vt} m/s</strong></span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <strong className="text-emerald-800">Langkah 2 (Perpindahan):</strong>
                        <span>
                          <MVar sym="s" /> = <MVar sym="v" sub="0" /><MVar sym="t" /> +{' '}
                          <MFrac num="1" den="2" barClassName="border-slate-700" /><MVar sym="a" /><MVar sym="t" sup="2" /> ={' '}
                          <span className="font-mono">
                            ({solvedData.v0Used} × {solvedData.tUsed}) + 0,5 × {solvedData.aUsed} × ({solvedData.tUsed})² = <strong>{solvedData.s} meter</strong>
                          </span>
                        </span>
                      </div>
                      <div>
                        <strong className="text-emerald-800">Langkah 3 (Verifikasi Kuadrat):</strong>{' '}
                        <MVar sym="v" sub="t" sup="2" /> = <MVar sym="v" sub="0" sup="2" /> + 2<MVar sym="a" /><MVar sym="s" />{' '}
                        <span className="font-mono text-emerald-800 font-bold">
                          ({Math.round(solvedData.vt * solvedData.vt)} = {Math.round(solvedData.v0Used * solvedData.v0Used + 2 * solvedData.aUsed * solvedData.s)} · Terbukti Konsisten)
                        </span>
                      </div>
                      <div>
                        <strong className="text-emerald-800">Posisi Akhir Total:</strong>{' '}
                        <MVar sym="s" sub="akhir" /> = <MVar sym="s" sub="0" /> + <MVar sym="s" /> ={' '}
                        <span className="font-mono">{solvedData.s0Used} + {solvedData.s} = <strong>{solvedData.stot} meter</strong></span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
