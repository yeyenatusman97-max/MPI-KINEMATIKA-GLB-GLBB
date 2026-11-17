import React, { useState } from 'react';
import { Play, RotateCcw, Zap, Compass, Activity, Gauge } from 'lucide-react';

/**
 * Kinematics3DVisuals
 * Set of playful, high-contrast, volumetric 3D icons & interactive dioramas
 * representing core Kinematics concepts:
 * 1. 3D Volumetric Kinematics Cart & Track (Mobil Balap Kinematika 3D)
 * 2. 3D Volumetric Stopwatch & Ticker Timer (Stopwatch & Pita Pewaktu Ketik 3D)
 * 3. 3D Volumetric Coordinate Motion Graph (Grafik Gerak 3D Bergradasi)
 * 4. 3D Volumetric Velocity & Acceleration Vectors (Vektor Kecepatan & Percepatan 3D)
 * 5. 3D Volumetric Freefall Gravity Sphere (Bola Jatuh Bebas Gravitasi 3D)
 * 6. 3D Volumetric Photogate Laser Sensor (Gerbang Sensor Fotolistrik 3D)
 */

interface VolumetricIconProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export const VolumetricKinematicsCar: React.FC<VolumetricIconProps & { speed?: number; isMoving?: boolean }> = ({ 
  size = 'md',
  className = '',
  speed = 15,
  isMoving = true 
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* 3D Volumetric Isometric Car Container */}
      <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105" style={{ perspective: 1000 }}>
        {/* Ground Volumetric Shadow */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-400/30 rounded-full blur-md" />
        
        {/* Velocity Vector Badge Above Car (Compact & Non-overflowing) */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-sky-600 text-white font-mono font-black text-[9px] px-2 py-0.5 rounded-full shadow-sm z-10">
          <span>v⃗ = {speed} m/s</span>
          <span className="text-amber-300">➔</span>
        </div>

        {/* 3D Volumetric Car Body SVG */}
        <svg 
          viewBox="0 0 200 120" 
          className={size === 'hero' ? 'w-56 h-36' : size === 'lg' ? 'w-44 h-28' : 'w-32 h-20'}
          style={{ filter: 'drop-shadow(0 12px 14px rgba(2, 132, 199, 0.25))' }}
        >
          <defs>
            {/* Gradients for rich 3D volumetric metallic feel */}
            <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="40%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="carRoofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="carGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#BAE6FD" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="60%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="spoilerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>

          {/* Spoiler 3D */}
          <path d="M 22 42 L 45 42 L 42 49 L 26 49 Z" fill="url(#spoilerGrad)" />
          <path d="M 30 49 L 33 65 L 28 65 Z" fill="#C2410C" />
          <path d="M 40 49 L 43 65 L 38 65 Z" fill="#C2410C" />

          {/* Main Car Lower Chassis (Volumetric Rounded) */}
          <path 
            d="M 25 65 C 25 58, 38 56, 55 56 L 145 56 C 165 56, 185 64, 192 78 C 195 84, 192 90, 180 90 L 30 90 C 24 90, 22 84, 25 65 Z" 
            fill="url(#carBodyGrad)"
          />
          {/* Chassis highlight bevel (creates 3D sheen) */}
          <path 
            d="M 35 60 L 150 60 C 168 60, 180 66, 186 76 L 175 76 C 160 67, 145 64, 50 64 Z" 
            fill="#BAE6FD" 
            opacity="0.6"
          />

          {/* Cabin / Cockpit 3D Roof */}
          <path 
            d="M 60 56 L 80 32 C 84 28, 92 26, 105 26 L 132 26 C 142 26, 148 30, 154 38 L 168 56 Z" 
            fill="url(#carRoofGrad)"
          />

          {/* Windshield & Windows (Glossy 3D Glass) */}
          <path 
            d="M 83 34 L 100 34 L 100 52 L 68 52 Z" 
            fill="url(#carGlassGrad)" 
            stroke="#0284C7" 
            strokeWidth="1.5"
          />
          <path 
            d="M 104 34 L 130 34 L 160 52 L 104 52 Z" 
            fill="url(#carGlassGrad)" 
            stroke="#0284C7" 
            strokeWidth="1.5"
          />
          {/* Glass Glare Highlights */}
          <line x1="88" y1="36" x2="74" y2="50" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <line x1="120" y1="36" x2="148" y2="50" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

          {/* Racing Stripe (Volumetric Accent) */}
          <path d="M 45 74 L 180 74 L 178 78 L 45 78 Z" fill="#F59E0B" />
          <path d="M 45 80 L 182 80 L 180 83 L 45 83 Z" fill="#FFFFFF" />

          {/* Front Headlight (3D Volumetric Glow) */}
          <ellipse cx="185" cy="74" rx="6" ry="4" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1" />
          <ellipse cx="186" cy="74" rx="3" ry="2" fill="#FFFFFF" />

          {/* Rear Wheel (3D Volumetric Depth) */}
          <g className={isMoving ? 'animate-spin-slow' : ''} style={{ transformOrigin: '55px 90px' }}>
            {/* Outer Tire */}
            <circle cx="55" cy="90" r="18" fill="url(#wheelGrad)" stroke="#334155" strokeWidth="2" />
            <circle cx="55" cy="90" r="15" fill="#1E293B" />
            {/* Golden Rim */}
            <circle cx="55" cy="90" r="10" fill="url(#rimGrad)" />
            <circle cx="55" cy="90" r="4" fill="#0F172A" />
            {/* Spokes */}
            <line x1="55" y1="80" x2="55" y2="100" stroke="#B45309" strokeWidth="2" />
            <line x1="45" y1="90" x2="65" y2="90" stroke="#B45309" strokeWidth="2" />
          </g>

          {/* Front Wheel (3D Volumetric Depth) */}
          <g className={isMoving ? 'animate-spin-slow' : ''} style={{ transformOrigin: '150px 90px' }}>
            {/* Outer Tire */}
            <circle cx="150" cy="90" r="18" fill="url(#wheelGrad)" stroke="#334155" strokeWidth="2" />
            <circle cx="150" cy="90" r="15" fill="#1E293B" />
            {/* Golden Rim */}
            <circle cx="150" cy="90" r="10" fill="url(#rimGrad)" />
            <circle cx="150" cy="90" r="4" fill="#0F172A" />
            {/* Spokes */}
            <line x1="150" y1="80" x2="150" y2="100" stroke="#B45309" strokeWidth="2" />
            <line x1="140" y1="90" x2="160" y2="90" stroke="#B45309" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export const VolumetricStopwatch: React.FC<VolumetricIconProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105" style={{ perspective: 1000 }}>
        {/* Soft Volumetric Shadow */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-amber-400/25 rounded-full blur-md" />

        {/* 3D Volumetric Stopwatch SVG */}
        <svg 
          viewBox="0 0 140 160" 
          className={size === 'hero' ? 'w-40 h-44' : size === 'lg' ? 'w-32 h-36' : 'w-24 h-28'}
          style={{ filter: 'drop-shadow(0 10px 12px rgba(245, 158, 11, 0.25))' }}
        >
          <defs>
            <linearGradient id="watchBezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="watchFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
            <linearGradient id="buttonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>
          </defs>

          {/* Top Plunger / Crown (Volumetric 3D Button) */}
          <rect x="62" y="8" width="16" height="14" rx="3" fill="url(#buttonGrad)" stroke="#7C2D12" strokeWidth="1" />
          <rect x="58" y="20" width="24" height="8" rx="2" fill="url(#watchBezelGrad)" />
          {/* Side Lap Buttons */}
          <rect x="24" y="24" width="12" height="10" rx="2" transform="rotate(-30 24 24)" fill="url(#watchBezelGrad)" />
          <rect x="104" y="18" width="12" height="10" rx="2" transform="rotate(30 104 18)" fill="url(#watchBezelGrad)" />

          {/* Outer Volumetric Metallic Bezel Ring */}
          <circle cx="70" cy="90" r="56" fill="url(#watchBezelGrad)" stroke="#92400E" strokeWidth="2" />
          {/* Inner Depth Rim */}
          <circle cx="70" cy="90" r="50" fill="#78350F" />
          {/* Dial Face */}
          <circle cx="70" cy="90" r="46" fill="url(#watchFaceGrad)" stroke="#CBD5E1" strokeWidth="2" />

          {/* Dial Ticks (Every 5 units) */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 70 + 40 * Math.sin(angle);
            const y1 = 90 - 40 * Math.cos(angle);
            const x2 = 70 + (i % 3 === 0 ? 32 : 36) * Math.sin(angle);
            const y2 = 90 - (i % 3 === 0 ? 32 : 36) * Math.cos(angle);
            return (
              <line 
                key={i} 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2} 
                stroke={i % 3 === 0 ? '#0F172A' : '#94A3B8'} 
                strokeWidth={i % 3 === 0 ? 2.5 : 1.5} 
              />
            );
          })}

          {/* Sub-Dial */}
          <circle cx="70" cy="74" r="14" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="70" y1="74" x2="70" y2="64" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />

          {/* Main Stopwatch Hand (Volumetric Needle) */}
          <line x1="70" y1="90" x2="88" y2="62" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
          <line x1="70" y1="90" x2="65" y2="98" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
          {/* Center Pin */}
          <circle cx="70" cy="90" r="4.5" fill="#991B1B" stroke="#FFFFFF" strokeWidth="1.5" />

          {/* Digital Timer Readout Pill */}
          <rect x="52" y="106" width="36" height="14" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
          <text x="70" y="116" textAnchor="middle" fill="#38BDF8" fontSize="8" fontFamily="monospace" fontWeight="bold">
            04.28s
          </text>

          {/* Glass Glare Sheen 3D */}
          <path 
            d="M 32 68 C 42 50, 72 45, 95 54 C 105 58, 110 65, 114 74 C 95 62, 60 62, 32 68 Z" 
            fill="#FFFFFF" 
            opacity="0.45" 
          />
        </svg>
      </div>
    </div>
  );
};

export const VolumetricMotionGraphIcon: React.FC<VolumetricIconProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-emerald-400/25 rounded-full blur-md" />

        {/* 3D Volumetric Graph Isometric Board */}
        <svg 
          viewBox="0 0 160 140" 
          className={size === 'hero' ? 'w-44 h-36' : size === 'lg' ? 'w-36 h-30' : 'w-28 h-24'}
          style={{ filter: 'drop-shadow(0 10px 14px rgba(16, 185, 129, 0.25))' }}
        >
          <defs>
            <linearGradient id="boardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F8FAFC" />
            </linearGradient>
            <linearGradient id="areaFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="curveLineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* 3D Volumetric Isometric Tablet Board */}
          {/* Bottom Depth Shadow */}
          <polygon points="15,108 145,108 152,116 22,116" fill="#CBD5E1" />
          <polygon points="145,18 152,26 152,116 145,108" fill="#94A3B8" />
          {/* Main Board Surface */}
          <rect x="15" y="18" width="130" height="90" rx="12" fill="url(#boardGrad)" stroke="#10B981" strokeWidth="2.5" />

          {/* Grid Lines */}
          <line x1="30" y1="36" x2="135" y2="36" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="30" y1="56" x2="135" y2="56" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="30" y1="76" x2="135" y2="76" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="65" y1="26" x2="65" y2="92" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="100" y1="26" x2="100" y2="92" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

          {/* Axes with 3D Arrowheads */}
          <line x1="30" y1="24" x2="30" y2="94" stroke="#0F172A" strokeWidth="2.5" />
          <polygon points="30,20 27,26 33,26" fill="#0F172A" />
          <text x="36" y="26" fill="#0F172A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">v (m/s)</text>

          <line x1="28" y1="92" x2="138" y2="92" stroke="#0F172A" strokeWidth="2.5" />
          <polygon points="142,92 136,89 136,95" fill="#0F172A" />
          <text x="130" y="104" fill="#0F172A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">t (s)</text>

          {/* Shaded Area Under v-t Curve = Displacement s (3D Volumetric Area) */}
          <polygon points="30,92 30,68 115,38 115,92" fill="url(#areaFillGrad)" />

          {/* Motion Slope Line (GLBB v_t = v_0 + a*t) */}
          <line x1="30" y1="68" x2="115" y2="38" stroke="url(#curveLineGrad)" strokeWidth="4" strokeLinecap="round" />
          
          {/* Data Points (3D Spherical Beads) */}
          <circle cx="30" cy="68" r="4.5" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="115" cy="38" r="4.5" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />

          {/* Annotation Badges */}
          <rect x="44" y="74" width="46" height="13" rx="3" fill="#ECFDF5" stroke="#10B981" strokeWidth="1" />
          <text x="67" y="83" textAnchor="middle" fill="#065F46" fontSize="7" fontWeight="black" fontFamily="sans-serif">
            Luas = Δs (m)
          </text>
        </svg>
      </div>
    </div>
  );
};

export const VolumetricGravitySphere: React.FC<VolumetricIconProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-purple-400/25 rounded-full blur-md" />

        <svg 
          viewBox="0 0 130 140" 
          className={size === 'hero' ? 'w-36 h-40' : size === 'lg' ? 'w-28 h-32' : 'w-22 h-26'}
          style={{ filter: 'drop-shadow(0 10px 12px rgba(124, 58, 237, 0.25))' }}
        >
          <defs>
            {/* Radial 3D Sphere Highlight */}
            <radialGradient id="sphere3DGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#E9D5FF" />
              <stop offset="35%" stopColor="#A855F7" />
              <stop offset="80%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#4C1D95" />
            </radialGradient>
            <linearGradient id="dropTailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" stopOpacity="0" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Vertical Trajectory Ruler Pole */}
          <rect x="18" y="15" width="6" height="110" rx="3" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="18" y1="25" x2="28" y2="25" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="18" y1="50" x2="28" y2="50" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="18" y1="75" x2="28" y2="75" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="18" y1="100" x2="28" y2="100" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="32" y="27" fill="#64748B" fontSize="7" fontWeight="bold">20m</text>
          <text x="32" y="77" fill="#64748B" fontSize="7" fontWeight="bold">10m</text>
          <text x="32" y="102" fill="#64748B" fontSize="7" fontWeight="bold">0m</text>

          {/* Falling Motion Blur Stream */}
          <path d="M 62 25 L 78 25 L 82 58 L 58 58 Z" fill="url(#dropTailGrad)" />

          {/* 3D Volumetric Metallic Gravity Ball */}
          <circle cx="70" cy="65" r="24" fill="url(#sphere3DGrad)" stroke="#581C87" strokeWidth="1.5" />
          {/* Specular White Light Highlight (Creates realistic glossy volume) */}
          <ellipse cx="61" cy="56" rx="6" ry="3.5" transform="rotate(-30 61 56)" fill="#FFFFFF" opacity="0.8" />
          <circle cx="68" cy="51" r="1.5" fill="#FFFFFF" opacity="0.9" />

          {/* Downward Gravity Acceleration Vector g Panah 3D */}
          <g className="animate-bounce">
            <line x1="70" y1="94" x2="70" y2="122" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
            <polygon points="70,128 65,120 75,120" fill="#EA580C" />
            <rect x="80" y="104" width="38" height="14" rx="4" fill="#FFEDD5" stroke="#EA580C" strokeWidth="1" />
            <text x="99" y="114" textAnchor="middle" fill="#9A3412" fontSize="7" fontWeight="black" fontFamily="monospace">
              g=9.8 m/s²
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export const VolumetricPhotogateSensor: React.FC<VolumetricIconProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-cyan-400/25 rounded-full blur-md" />

        <svg 
          viewBox="0 0 130 140" 
          className={size === 'hero' ? 'w-36 h-40' : size === 'lg' ? 'w-28 h-32' : 'w-22 h-26'}
          style={{ filter: 'drop-shadow(0 10px 12px rgba(2, 132, 199, 0.25))' }}
        >
          <defs>
            <linearGradient id="gateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>

          {/* Heavy Base Footing 3D */}
          <polygon points="20,122 110,122 118,130 28,130" fill="#94A3B8" />
          <rect x="25" y="112" width="80" height="12" rx="4" fill="#0F172A" />

          {/* U-Shaped Photogate Frame (Volumetric 3D Bevel) */}
          <path 
            d="M 35 112 L 35 25 C 35 18, 42 12, 50 12 L 80 12 C 88 12, 95 18, 95 25 L 95 112 L 78 112 L 78 35 C 78 32, 75 30, 72 30 L 58 30 C 55 30, 52 32, 52 35 L 52 112 Z" 
            fill="url(#gateGrad)"
            stroke="#0369A1"
            strokeWidth="2"
          />

          {/* Infrared Optical Laser Emitter & Receiver */}
          <circle cx="52" cy="65" r="4" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="78" cy="65" r="4" fill="#059669" stroke="#FFFFFF" strokeWidth="1" />

          {/* Glowing Red Laser Beam Across the Gate */}
          <line x1="56" y1="65" x2="74" y2="65" stroke="url(#laserGrad)" strokeWidth="2.5" strokeDasharray="3 2" />

          {/* Status Indicator LED (Blinking Green) */}
          <circle cx="65" cy="20" r="3.5" fill="#22C55E" className="animate-pulse" />
          
          <rect x="45" y="80" width="40" height="12" rx="3" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1" />
          <text x="65" y="89" textAnchor="middle" fill="#0369A1" fontSize="7" fontWeight="black" fontFamily="monospace">
            GATE 1
          </text>
        </svg>
      </div>
    </div>
  );
};
