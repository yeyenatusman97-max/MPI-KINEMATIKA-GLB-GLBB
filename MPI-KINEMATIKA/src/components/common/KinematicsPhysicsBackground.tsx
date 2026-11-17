import React from 'react';

/**
 * KinematicsPhysicsBackground
 * Background fisika elegan dengan kontras dan saturasi warna rendah (low-contrast, low-saturation):
 * - Grid milimeter blok tipis (opacity 3.5%)
 * - Ikon-ikon ilustrasi fisika: Atom orbit, pendulum, bidang miring, pegas, katrol, stopwatch, grafik v-t
 * - Watermark rumus gerak kinematika & dinamika (s = vt, vt = v0 + at, s = v0t + 1/2at^2, Sigma F = m.a)
 * Dirancang lembut dan tidak mencolok agar teks dan konten pembelajaran selalu terbaca jelas (WCAG AAA).
 */
export const KinematicsPhysicsBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#F8FAFC]" aria-hidden="true">
      {/* 1. Kertas Milimeter Blok Fisika Muted (Super Faint 20px & 100px Grid) */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #475569 1px, transparent 1px),
            linear-gradient(to bottom, #475569 1px, transparent 1px),
            linear-gradient(to right, #334155 1.5px, transparent 1.5px),
            linear-gradient(to bottom, #334155 1.5px, transparent 1.5px)
          `,
          backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px',
        }}
      />

      {/* 2. Soft Ambient Radial Vignettes (Low Saturation Slate/Blue Tint) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-slate-300/15 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-sky-200/15 blur-[140px]" />

      {/* 3. Grid of Subtle Physics Icons & Diagrams (Monochrome Slate Line-Art, Opacity 0.045 - 0.06) */}
      <div className="absolute inset-0 overflow-hidden text-slate-700 opacity-[0.055]">
        
        {/* Top-Left: Atom Orbit Structure */}
        <div className="absolute top-12 left-10 w-32 h-32">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="50" cy="50" r="5" fill="currentColor" />
            <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(0 50 50)" />
            <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(60 50 50)" />
            <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(120 50 50)" />
            <circle cx="85" cy="50" r="2" fill="currentColor" />
            <circle cx="32" cy="20" r="2" fill="currentColor" />
          </svg>
        </div>

        {/* Top-Center-Left: Formula Watermark GLB (s = v . t) */}
        <div className="absolute top-20 left-[26%] font-mono text-xl font-bold tracking-wider hidden md:block">
          s = v · t &nbsp;[GLB, a = 0]
        </div>

        {/* Top-Center-Right: Vector Velocity and Acceleration */}
        <div className="absolute top-16 right-[24%] w-36 h-20 hidden md:block">
          <svg viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth="1.2">
            {/* Horizontal Velocity Vector */}
            <line x1="10" y1="20" x2="90" y2="20" />
            <polygon points="90,20 82,16 82,24" fill="currentColor" />
            <text x="45" y="14" fontSize="10" fill="currentColor" fontFamily="monospace">v⃗ (m/s)</text>

            {/* Acceleration Vector */}
            <line x1="10" y1="42" x2="60" y2="42" strokeDasharray="3 2" />
            <polygon points="60,42 54,39 54,45" fill="currentColor" />
            <text x="30" y="54" fontSize="9" fill="currentColor" fontFamily="monospace">a⃗ = Δv/Δt</text>
          </svg>
        </div>

        {/* Top-Right: Stopwatch & Timer */}
        <div className="absolute top-10 right-12 w-28 h-28 hidden sm:block">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="50" cy="55" r="32" />
            <rect x="46" y="14" width="8" height="9" rx="2" />
            <line x1="50" y1="55" x2="68" y2="42" strokeWidth="1.5" />
            <circle cx="50" cy="55" r="3" fill="currentColor" />
            {/* Ticks */}
            <line x1="50" y1="27" x2="50" y2="31" />
            <line x1="50" y1="79" x2="50" y2="83" />
            <line x1="22" y1="55" x2="26" y2="55" />
            <line x1="74" y1="55" x2="78" y2="55" />
          </svg>
        </div>

        {/* Mid-Left: Harmonic Pendulum Oscillation Arc */}
        <div className="absolute top-[38%] left-8 w-28 h-40 hidden lg:block">
          <svg viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="20" y1="10" x2="80" y2="10" strokeWidth="2" />
            <line x1="50" y1="10" x2="70" y2="85" />
            <circle cx="70" cy="85" r="8" fill="currentColor" fillOpacity="0.2" />
            {/* Oscillation dashed path */}
            <path d="M 30,85 Q 50,95 70,85" strokeDasharray="2 3" />
            <line x1="50" y1="10" x2="50" y2="92" strokeDasharray="2 3" />
            <text x="42" y="112" fontSize="9" fill="currentColor" fontFamily="monospace">T = 2π√(l/g)</text>
          </svg>
        </div>

        {/* Mid-Right: Spring-Mass Oscillator (Hooke's Law) */}
        <div className="absolute top-[40%] right-8 w-28 h-40 hidden lg:block">
          <svg viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="20" y1="10" x2="80" y2="10" strokeWidth="2" />
            {/* Coiled spring */}
            <path d="M 50,10 L 50,20 L 40,26 L 60,34 L 40,42 L 60,50 L 40,58 L 60,66 L 40,74 L 50,80 L 50,90" />
            <rect x="35" y="90" width="30" height="24" rx="3" fill="currentColor" fillOpacity="0.15" />
            <text x="44" y="106" fontSize="10" fill="currentColor" fontFamily="monospace">m</text>
            <text x="32" y="126" fontSize="9" fill="currentColor" fontFamily="monospace">F = -kx</text>
          </svg>
        </div>

        {/* Mid-Left-Center: Formula Watermark GLBB (vt = v0 + at) */}
        <div className="absolute top-[48%] left-[18%] font-mono text-lg font-bold tracking-wider hidden xl:block">
          vₜ = v₀ + a · t
        </div>

        {/* Mid-Right-Center: Formula Watermark GLBB (s = v0t + 1/2at^2) */}
        <div className="absolute top-[48%] right-[18%] font-mono text-lg font-bold tracking-wider hidden xl:block">
          s = v₀t + ½at²
        </div>

        {/* Lower-Left: Cartesian Graph Coordinate (v vs t) with slope */}
        <div className="absolute bottom-28 left-12 w-44 h-32 hidden md:block">
          <svg viewBox="0 0 120 90" fill="none" stroke="currentColor" strokeWidth="1.2">
            {/* X and Y Axes */}
            <line x1="15" y1="75" x2="110" y2="75" />
            <polygon points="110,75 104,72 104,78" fill="currentColor" />
            <text x="102" y="87" fontSize="9" fill="currentColor" fontFamily="monospace">t (s)</text>

            <line x1="15" y1="75" x2="15" y2="10" />
            <polygon points="15,10 12,16 18,16" fill="currentColor" />
            <text x="6" y="12" fontSize="9" fill="currentColor" fontFamily="monospace">v</text>

            {/* Linear Curve GLBB */}
            <line x1="15" y1="60" x2="95" y2="25" strokeWidth="1.8" />
            <text x="18" y="58" fontSize="8" fill="currentColor" fontFamily="monospace">v₀</text>
            <text x="96" y="24" fontSize="8" fill="currentColor" fontFamily="monospace">vₜ</text>

            {/* Dotted Area */}
            <line x1="95" y1="25" x2="95" y2="75" strokeDasharray="2 2" />
            <text x="46" y="68" fontSize="8" fill="currentColor" fontFamily="monospace">Luas = s</text>
          </svg>
        </div>

        {/* Lower-Center: Dynamic Newton Equation */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 font-mono text-xl font-bold tracking-widest hidden md:block">
          ΣF⃗ = m · a⃗ &nbsp;·&nbsp; vₜ² = v₀² + 2as
        </div>

        {/* Lower-Right: Incline Plane with Block & Vectors */}
        <div className="absolute bottom-24 right-14 w-44 h-32 hidden md:block">
          <svg viewBox="0 0 130 90" fill="none" stroke="currentColor" strokeWidth="1.2">
            {/* Wedge */}
            <polygon points="15,75 110,75 110,35" />
            <text x="35" y="72" fontSize="8" fill="currentColor">θ</text>
            
            {/* Block on slope */}
            <g transform="translate(60, 42) rotate(-22)">
              <rect x="-12" y="-14" width="24" height="14" rx="2" fill="currentColor" fillOpacity="0.15" />
              {/* Normal force arrow */}
              <line x1="0" y1="-14" x2="0" y2="-32" />
              <polygon points="0,-32 -3,-26 3,-26" fill="currentColor" />
              <text x="3" y="-28" fontSize="7" fill="currentColor" fontFamily="monospace">N</text>
            </g>
            {/* Gravity vector straight down */}
            <line x1="60" y1="48" x2="60" y2="74" />
            <polygon points="60,74 57,68 63,68" fill="currentColor" />
            <text x="63" y="70" fontSize="7" fill="currentColor" fontFamily="monospace">W=mg</text>
          </svg>
        </div>

        {/* Subtle Ticker Timer Tape Dots across bottom */}
        <div className="absolute bottom-6 left-0 right-0 h-4 flex items-center justify-center gap-6 overflow-hidden">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span className="w-1.5 h-1.5 rounded-full bg-current ml-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-current ml-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-current ml-7" />
          <span className="w-1.5 h-1.5 rounded-full bg-current ml-11" />
          <span className="w-1.5 h-1.5 rounded-full bg-current ml-16" />
          <span className="w-1.5 h-1.5 rounded-full bg-current ml-22" />
          <span className="w-1.5 h-1.5 rounded-full bg-current ml-30" />
        </div>

      </div>
    </div>
  );
};
