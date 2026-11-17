import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Home, 
  BookOpen, 
  Box, 
  Presentation, 
  LineChart, 
  Trophy, 
  ClipboardCheck, 
  FolderArchive,
  Volume2,
  VolumeX,
  Menu,
  X,
  Download
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { InstallAppModal } from './InstallAppModal';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface FloatingNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({ currentView, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  if (currentView === 'dashboard') {
    return null; // Dashboard has its own integrated controls
  }

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playClick();
  };

  const navLinks = [
    { id: 'dashboard', label: 'Beranda MPI', icon: Home },
    { id: 'module', label: 'Modul Digital', icon: BookOpen },
    { id: 'virtuallab', label: 'Simulasi & LKPD', icon: Box },
    { id: 'challenge', label: 'Quiz', icon: Trophy },
  ];

  const currentItem = navLinks.find((n) => n.id === currentView) || navLinks[0];

  return (
    <>
      {/* Floating Compact Return Dock (Top-Left or Bottom-Left responsive) */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2">
        {/* Back to Bento Dashboard Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onNavigate('dashboard');
          }}
          className="group flex items-center gap-2 rounded-2xl border-2 border-sky-300 bg-white/95 px-4 py-2 text-xs font-black text-slate-900 shadow-xl shadow-sky-900/10 backdrop-blur-md hover:border-sky-500 hover:bg-sky-50 transition"
        >
          <ArrowLeft className="h-4 w-4 text-sky-600 transition-transform group-hover:-translate-x-1" />
          <span className="hidden sm:inline">Kembali ke Beranda</span>
          <span className="sm:hidden">Beranda</span>
        </button>

        {/* Current View Title Tag */}
        <div className="hidden md:flex items-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 backdrop-blur-md shadow-sm">
          <currentItem.icon className="h-3.5 w-3.5 text-sky-600" />
          <span>{currentItem.label}</span>
        </div>

        {/* Quick Menu Opener */}
        <button
          onClick={() => {
            sounds.playClick();
            setMenuOpen(!menuOpen);
          }}
          title="Pindah Cepat Fitur"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-700 hover:text-sky-600 hover:border-sky-300 shadow-md backdrop-blur-md transition"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-700 hover:text-sky-600 shadow-md backdrop-blur-md transition"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-sky-600" />}
        </button>
      </div>

      {/* Quick Jump Drawer Modal */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-start p-4 sm:p-6 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div 
            className="w-full max-w-xs mt-12 rounded-3xl border-2 border-sky-300 bg-white/95 p-4 shadow-2xl backdrop-blur-xl space-y-2 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
              <span className="text-xs font-black text-sky-700 font-mono uppercase tracking-wider">Navigasi Fitur</span>
              <button onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sounds.playClick();
                      onNavigate(item.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm font-black'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setMenuOpen(false);
                    if (isInstallable) {
                      install();
                    } else {
                      setIsInstallModalOpen(true);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:from-sky-600 hover:to-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Pasang Aplikasi (PWA)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-platform install modal */}
      <InstallAppModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />
    </>
  );
};
