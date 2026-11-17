import React, { useState, useEffect } from 'react';
import { 
  Atom, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Download, 
  UserCheck, 
  GraduationCap, 
  HelpCircle,
  Menu,
  X,
  RotateCcw
} from 'lucide-react';
import { UserRole } from '../../types/physics';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { sounds } from '../../utils/soundEffects';
import { InstallAppModal } from './InstallAppModal';
import { TeacherProfileModal } from './TeacherProfileModal';
import { storage, TeacherProfile } from '../../utils/storage';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole?: UserRole;
  onToggleRole?: () => void;
  onOpenHelp: () => void;
  onResetProgress: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenHelp,
  onResetProgress,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(storage.getTeacherProfile());

  useEffect(() => {
    setTeacherProfile(storage.getTeacherProfile());
    const handler = (e: any) => {
      if (e.detail) setTeacherProfile(e.detail);
    };
    window.addEventListener('teacher-profile-updated', handler);
    return () => window.removeEventListener('teacher-profile-updated', handler);
  }, []);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playClick();
  };

  const navItems = [
    { id: 'dashboard', label: 'Beranda' },
    { id: 'module', label: 'Modul Digital' },
    { id: 'virtuallab', label: 'Virtual Lab 3D' },
    { id: 'presentation', label: 'Smart Presentation' },
    { id: 'graph', label: 'Grafik Gerak' },
    { id: 'challenge', label: 'Tantangan Fisika' },
    { id: 'evaluation', label: 'Evaluasi' },
    { id: 'resources', label: 'Sumber Belajar' },
  ];

  const handleNavClick = (id: string) => {
    sounds.playClick();
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[#0a0f1d]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div 
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0a0f1d]">
              <Atom className="h-6 w-6 text-cyan-400 animate-spin-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-orange-400 bg-clip-text text-transparent">
                MPI FISIKA KELAS X
              </span>
              <span className="hidden md:inline-flex rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/30">
                FASE E
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide hidden sm:block">
              Kinematika GLB & GLBB • Kurikulum Merdeka
            </p>
          </div>
        </div>

        {/* Desktop Quick Nav */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.slice(0, 7).map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions / Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Connection Status Badge */}
          <div 
            title={isOnline ? 'Terhubung Online' : 'Mode Offline Aktif (Cache Siap)'}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
          </button>

          {/* Universal Install / Download Button (Laptop, PID, PC, & Handphone) */}
          <button
            onClick={() => {
              sounds.playClick();
              if (isInstallable) {
                install();
              } else {
                setIsInstallModalOpen(true);
              }
            }}
            title="Download & Pasang Aplikasi ke Laptop, Layar PID, PC, atau Handphone"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 transition hover:scale-105"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Pasang App</span>
          </button>

          {/* Tombol Pengeditan Profil & Nama Guru Pengampu (Terintegrasi ke LKPD & Rapor) */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsTeacherModalOpen(true);
            }}
            title={`Profil Guru: ${teacherProfile.name || 'Guru Pengampu'} (Terintegrasi Otomatis ke LKPD & Rapor Belajar)`}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition shadow-sm"
          >
            <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="hidden md:inline max-w-[140px] truncate">
              {teacherProfile.name ? `Guru: ${teacherProfile.name}` : 'Profil Guru'}
            </span>
            <span className="md:hidden">Guru</span>
          </button>

          {/* Help modal */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenHelp();
            }}
            title="Panduan Pembelajaran & Capaian"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex xl:hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-800 bg-[#0a0f1d]/95 p-4 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-start rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 bg-slate-900/50 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => {
                sounds.playClick();
                setIsTeacherModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-bold"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Edit Nama Guru</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                if (confirm('Atur ulang seluruh progres belajar dan riwayat eksperimen?')) {
                  onResetProgress();
                }
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Progres
            </button>
          </div>
        </div>
      )}

      {/* Multi-Platform App Installation Modal (Laptop, PID, Komputer, HP) */}
      <InstallAppModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />

      {/* Teacher Profile & Signatory Modal (Integrated with LKPD & Rapor) */}
      <TeacherProfileModal isOpen={isTeacherModalOpen} onClose={() => setIsTeacherModalOpen(false)} />
    </header>
  );
};
