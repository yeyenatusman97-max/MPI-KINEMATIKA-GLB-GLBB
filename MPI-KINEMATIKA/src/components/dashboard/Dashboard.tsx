import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  PlayCircle,
  BookOpen, 
  Box, 
  Trophy, 
  HeartHandshake, 
  ArrowLeft,
  ArrowUp,
  Atom,
  HelpCircle,
  Volume2,
  VolumeX,
  Compass,
  Presentation,
  LogOut,
  Cloud,
  Award
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ActiveSession, UserProgress, UserRole } from '../../types/physics';
import { sounds } from '../../utils/soundEffects';
import { CHARACTERS } from '../common/CharacterModal';
import { HomeHeroSection } from './HomeHeroSection';
import { InteractiveVideoSection } from './InteractiveVideoSection';
import { DigitalModuleSection } from './DigitalModuleSection';
import { VirtualLabLKPDSection } from './VirtualLabLKPDSection';
import { InteractiveWhiteboard, WhiteboardGraphPayload } from '../board/InteractiveWhiteboard';
import { MultiFormatQuizSection } from './MultiFormatQuizSection';
import { StudentReflectionSection } from './StudentReflectionSection';
import { TeacherReportSection } from './TeacherReportSection';
import { KinematicsPhysicsBackground } from '../common/KinematicsPhysicsBackground';
import { TeacherProfileModal } from '../common/TeacherProfileModal';
import { storage, TeacherProfile } from '../../utils/storage';
import {
  connectGoogleCloudSync,
  disconnectGoogleCloudSync,
  subscribeFirebaseAuth,
} from '../../services/firebaseService';

interface DashboardProps {
  progress: UserProgress;
  userRole?: UserRole;
  activeSession?: ActiveSession | null;
  onNavigate: (view: string) => void;
  onOpenValidationModal: () => void;
  onOpenHelp: () => void;
  onToggleRole?: () => void;
  onOpenCharacterModal: () => void;
  onRefreshProgress: () => void;
  onReturnToSplash: () => void;
  onLogout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progress,
  userRole = 'murid',
  activeSession,
  onNavigate,
  onOpenValidationModal,
  onOpenHelp,
  onOpenCharacterModal,
  onRefreshProgress,
  onReturnToSplash,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<string>('beranda');
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(storage.getTeacherProfile());
  const [cloudUserEmail, setCloudUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setTeacherProfile(storage.getTeacherProfile());
    if (userRole !== 'guru' && activeTab === 'rapor') {
      setActiveTab('beranda');
    }
    const handler = (e: any) => {
      if (e.detail) setTeacherProfile(e.detail);
    };
    window.addEventListener('teacher-profile-updated', handler);
    const unsubAuth = subscribeFirebaseAuth((user) => {
      setCloudUserEmail(user?.email || null);
    });
    return () => {
      window.removeEventListener('teacher-profile-updated', handler);
      unsubAuth();
    };
  }, [activeSession?.accountId, activeSession?.displayName, userRole, activeTab]);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [whiteboardPayload, setWhiteboardPayload] = useState<WhiteboardGraphPayload | null>(null);

  const handleSendToWhiteboard = (payload: WhiteboardGraphPayload) => {
    sounds.playSuccess();
    setWhiteboardPayload(payload);
    setActiveTab('papan');
    setShowScrollTop(false);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeChar = CHARACTERS.find((c) => c.id === progress.selectedCharacter) || CHARACTERS[0];
  const currentLevel = progress.level || 1;

  const navMenuItems = [
    {
      id: 'beranda',
      label: '1. Beranda',
      icon: Home,
      iconBg: 'bg-sky-50 border-sky-200/80 text-sky-600 group-hover:bg-sky-100 group-hover:text-sky-700',
    },
    {
      id: 'video',
      label: '2. Video Interaktif',
      icon: PlayCircle,
      iconBg: 'bg-indigo-50 border-indigo-200/80 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700',
    },
    {
      id: 'modul',
      label: '3. Modul Digital',
      icon: BookOpen,
      iconBg: 'bg-blue-50 border-blue-200/80 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700',
    },
    {
      id: 'simulasi',
      label: '4. Simulasi & LKPD',
      icon: Box,
      iconBg: 'bg-orange-50 border-orange-200/80 text-orange-600 group-hover:bg-orange-100 group-hover:text-orange-700',
    },
    {
      id: 'papan',
      label: '5. Papan Tulis Interaktif',
      icon: Presentation,
      iconBg: 'bg-violet-50 border-violet-200/80 text-violet-600 group-hover:bg-violet-100 group-hover:text-violet-700',
    },
    {
      id: 'quiz',
      label: '6. Quiz',
      icon: Trophy,
      iconBg: 'bg-amber-50 border-amber-200/80 text-amber-600 group-hover:bg-amber-100 group-hover:text-amber-700',
    },
    {
      id: 'refleksi',
      label: '7. Refleksi',
      icon: HeartHandshake,
      iconBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700',
    },
    ...(userRole === 'guru'
      ? [
          {
            id: 'rapor',
            label: '8. Rapor Belajar',
            icon: Award,
            iconBg: 'bg-teal-50 border-teal-200/80 text-teal-600 group-hover:bg-teal-100 group-hover:text-teal-700',
          },
        ]
      : []),
  ];

  const handleSelectTab = (tabId: string) => {
    sounds.playClick();
    setActiveTab(tabId);
    setShowScrollTop(false);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    if (top > 280) {
      if (!showScrollTop) setShowScrollTop(true);
    } else {
      if (showScrollTop) setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    sounds.playClick();
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  const handleToggleCloudSync = async () => {
    sounds.playClick();
    try {
      if (cloudUserEmail) {
        await disconnectGoogleCloudSync();
      } else {
        await connectGoogleCloudSync();
        sounds.playSuccess();
      }
    } catch {
      sounds.playError();
    }
  };

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-sky-400 selection:text-white">
      <KinematicsPhysicsBackground />

      <div className="relative z-10 w-full max-w-[1640px] mx-auto px-1.5 sm:px-3 lg:px-5 py-1 sm:py-2 flex-1 min-h-0 flex flex-col">
        
        <div className="bg-gradient-to-b from-[#F0F7FF] via-white to-[#F4FAFF] border border-sky-200/90 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_-15px_rgba(14,165,233,0.2)] overflow-hidden flex flex-col flex-1 min-h-0">
          
          <div className="shrink-0 bg-gradient-to-r from-[#0A1E46] via-[#0F3270] to-[#0B2559] text-white px-2.5 sm:px-5 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 border-b border-sky-500/30">
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <motion.button
                type="button"
                whileHover={{ y: -1.5, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 440, damping: 26 }}
                onClick={() => {
                  sounds.playClick();
                  onReturnToSplash();
                }}
                title="Kembali ke Tampilan Awal (Portal Login)"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 border border-sky-300/40 text-[11px] sm:text-xs font-bold text-white shrink-0 shadow-[0_6px_16px_-4px_rgba(14,165,233,0.45)] cursor-pointer transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="hidden sm:inline">Portal Awal</span>
                <span className="sm:hidden">Awal</span>
              </motion.button>

              <div 
                onClick={() => handleSelectTab('beranda')}
                className="flex items-center gap-2 cursor-pointer group select-none min-w-0"
                title="Menuju Beranda"
              >
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-sky-500/30 border border-white/20 group-hover:scale-105 transition-transform shrink-0">
                  <Atom className="h-4 w-4 animate-spin-slow text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-sm font-extrabold tracking-tight text-white leading-tight flex items-center gap-1.5 truncate">
                    <span className="truncate">MPI KINEMATIKA FISIKA KELAS X</span>
                    <span className="hidden md:inline-flex text-[10px] font-bold text-sky-300 shrink-0">
                      · Fase E
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium hidden md:block">
                    Kurikulum Merdeka · Kinematika GLB &amp; GLBB
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Google Cloud Sync Toggle */}
              <motion.button
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 440, damping: 26 }}
                onClick={handleToggleCloudSync}
                title={cloudUserEmail ? `Cloud Aktif (${cloudUserEmail}) — Klik untuk Putus` : 'Aktifkan Sinkronisasi Cloud Google Lintas Perangkat'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer ${
                  cloudUserEmail
                    ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200 hover:bg-emerald-500/30'
                    : 'bg-white/10 hover:bg-white/18 border-white/15 hover:border-white/30 text-slate-200'
                }`}
              >
                <Cloud className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="hidden xl:inline">{cloudUserEmail ? 'Cloud ON' : 'Sync Cloud'}</span>
              </motion.button>

              {/* Avatar Murid (Khusus Akun Murid) */}
              {userRole !== 'guru' && (
                <motion.button
                  type="button"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 440, damping: 26 }}
                  onClick={onOpenCharacterModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/18 border border-white/15 hover:border-white/30 text-xs text-white transition-colors cursor-pointer"
                  title="Pilih Avatar Karakter Ilmuwan"
                >
                  <span className="text-sm">{activeChar.avatarEmoji}</span>
                  <span className="text-[11px] font-bold hidden sm:inline">{activeChar.name.split(' ')[0]}</span>
                  <span className="text-[9px] font-mono bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md">
                    Lv.{currentLevel}
                  </span>
                </motion.button>
              )}

              {/* Panduan Help */}
              <motion.button
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 440, damping: 26 }}
                onClick={() => {
                  sounds.playClick();
                  onOpenHelp();
                }}
                title="Petunjuk Penggunaan & Panduan Media"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/18 border border-white/15 hover:border-white/30 text-white transition-colors cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5 text-amber-300" strokeWidth={2} />
              </motion.button>

              {/* Toggle Suara */}
              <motion.button
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 440, damping: 26 }}
                onClick={toggleSound}
                title={isMuted ? "Aktifkan Audio" : "Bisukan Audio"}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/18 border border-white/15 hover:border-white/30 text-white transition-colors cursor-pointer"
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-sky-300" strokeWidth={2} />
                )}
              </motion.button>

              {/* Tombol Logout */}
              {onLogout && (
                <motion.button
                  type="button"
                  whileHover={{ y: -1.5, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 440, damping: 26 }}
                  onClick={() => {
                    sounds.playClick();
                    onLogout();
                  }}
                  title="Logout dari akun saat ini dan kembali ke Halaman Pembuka"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 border border-rose-400/50 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="text-[11px]">Logout</span>
                </motion.button>
              )}
            </div>

          </div>

          {/* ===================================================================== */}
          {/* CONTAINER MENU TABS BAR (Menu Utama Dashboard Elegan & Interaktif)    */}
          {/* ===================================================================== */}
          <nav
            aria-label="Menu Utama Dashboard"
            className="shrink-0 bg-gradient-to-r from-[#EBF5FF] via-[#F4FAFF] to-[#EBF5FF] border-b border-sky-200/90 px-2 sm:px-4 py-1.5 sm:py-2"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 px-0.5">
              {navMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    whileHover={{ y: -2, scale: 1.015 }}
                    whileTap={{ scale: 0.965, y: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-[#0EA5E9] via-[#0284C7] to-[#2563EB] text-white border border-sky-300/80 shadow-[0_8px_20px_-6px_rgba(14,165,233,0.55)] ring-1 ring-sky-300/40'
                        : 'bg-gradient-to-b from-white via-[#F0F8FF] to-[#E1F1FF] text-sky-950 hover:text-sky-900 border border-sky-200/90 hover:border-sky-400 shadow-[0_3px_10px_-4px_rgba(14,165,233,0.16)] hover:shadow-[0_8px_18px_-6px_rgba(14,165,233,0.28)]'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg sm:rounded-xl border transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                        isActive
                          ? 'bg-white/20 border-white/30 text-white shadow-inner'
                          : item.iconBg
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <span className="tracking-tight pr-0.5">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </nav>

          {/* ===================================================================== */}
          {/* CONTAINER VIEWPORT: Wadah Komponen Pembelajaran Aktif                */}
          {/* Mengisi 100% sisa tinggi layar secara fleksibel di Laptop, HP, & PID  */}
          {/* ===================================================================== */}
          <div 
            ref={scrollViewRef}
            onScroll={handleScroll}
            className={`w-full flex-1 min-h-0 bg-gradient-to-b from-[#F4F9FF]/80 via-white/75 to-[#EEF6FF]/65 relative focus:outline-none ${
              activeTab === 'papan'
                ? 'overflow-hidden p-1 sm:p-1.5 flex flex-col'
                : 'overflow-y-auto overscroll-contain custom-scroll-view scroll-smooth'
            }`}
            tabIndex={0}
            role="region"
            aria-label="Viewport Konten Pembelajaran Kinematika"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: activeTab === 'papan' ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: activeTab === 'papan' ? 0 : -8 }}
                transition={{ duration: activeTab === 'papan' ? 0.16 : 0.24, ease: [0.16, 1, 0.3, 1] }}
                className={activeTab === 'papan' ? 'w-full flex-1 min-h-0 flex flex-col' : 'w-full min-h-full'}
              >
                {/* 1. BERANDA (Fokus pada Pengenalan Media, Profil Murid, & Panduan Belajar) */}
                {activeTab === 'beranda' && (
                  <HomeHeroSection
                    progress={progress}
                    userRole={userRole}
                    activeSession={activeSession}
                    teacherProfile={teacherProfile}
                    onOpenCharacterModal={onOpenCharacterModal}
                    onOpenTeacherModal={() => setIsTeacherModalOpen(true)}
                    onOpenHelp={onOpenHelp}
                    onOpenValidationModal={onOpenValidationModal}
                    onRefreshProgress={onRefreshProgress}
                    onReturnToSplash={onReturnToSplash}
                    onSelectTab={handleSelectTab}
                  />
                )}

                {/* 2. VIDEO INTERAKTIF (Menu Terpisah GLB & GLBB) */}
                {activeTab === 'video' && (
                  <InteractiveVideoSection />
                )}

                {/* 3. MODUL DIGITAL (Materi GLB & GLBB, Teori, Rumus & Kalkulator) */}
                {activeTab === 'modul' && (
                  <DigitalModuleSection onSendToWhiteboard={handleSendToWhiteboard} />
                )}

                {/* 3. SIMULASI & LKPD (Virtual Lab Rel Kinematika 3D, Tabel Telemetri & LKPD) */}
                {activeTab === 'simulasi' && (
                  <VirtualLabLKPDSection
                    userRole={userRole}
                    activeSession={activeSession}
                    onSendToWhiteboard={handleSendToWhiteboard}
                  />
                )}

                {/* 4. PAPAN TULIS INTERAKTIF (Papan Tulis Digital untuk PID / Stylus Pen Smart Board) */}
                {activeTab === 'papan' && (
                  <InteractiveWhiteboard 
                    initialPayload={whiteboardPayload}
                    onClearPayload={() => setWhiteboardPayload(null)}
                  />
                )}

                {/* 5. QUIZ (Multi-format Asesmen Formatif & Pembahasan) */}
                {activeTab === 'quiz' && (
                  <MultiFormatQuizSection
                    userRole={userRole}
                    activeSession={activeSession}
                    onRefreshProgress={onRefreshProgress}
                  />
                )}

                {/* 7. REFLEKSI (Jurnal Penilaian Diri & Hasil Refleksi Murid) */}
                {activeTab === 'refleksi' && (
                  <StudentReflectionSection
                    userRole={userRole}
                    activeSession={activeSession}
                    onRefreshProgress={onRefreshProgress}
                  />
                )}

                {/* 8. RAPOR BELAJAR (Khusus Akun Guru: Submenu Hasil Quiz & LKPD Terkumpul) */}
                {activeTab === 'rapor' && userRole === 'guru' && (
                  <TeacherReportSection
                    activeSession={activeSession}
                    progress={progress}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Floating Quick Scroll-to-Top Button */}
            <AnimatePresence>
              {showScrollTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  onClick={scrollToTop}
                  title="Kembali ke Atas Menu"
                  className="sticky float-right bottom-5 right-5 z-40 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 text-white font-bold text-xs shadow-2xl border-2 border-sky-400 hover:bg-sky-600 hover:border-sky-300 backdrop-blur-md transition-all group mr-4 mb-2"
                >
                  <ArrowUp className="h-4 w-4 text-sky-400 group-hover:text-white transition-transform group-hover:-translate-y-0.5" />
                  <span className="hidden sm:inline">Ke Atas</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ===================================================================== */}
          {/* CONTAINER FOOTER STRIP: Status & Validasi Pembelajaran                */}
          {/* ===================================================================== */}
          <div className="shrink-0 bg-gradient-to-r from-[#EBF5FF] via-[#F7FBFF] to-[#EBF5FF] border-t border-sky-200/90 px-3 sm:px-5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 truncate">
                <Compass className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="truncate">Kelas X Fase E • GLB &amp; GLBB</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline font-mono text-sky-700 font-bold truncate">
                Tab: {navMenuItems.find(i => i.id === activeTab)?.label}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-medium text-slate-500 shrink-0">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                PWA Offline Ready
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Kurikulum Merdeka 2026</span>
            </div>
          </div>

        </div>

      </div>

      {/* Teacher Profile & Signatory Modal (Integrated with LKPD & Rapor) */}
      <TeacherProfileModal isOpen={isTeacherModalOpen} onClose={() => setIsTeacherModalOpen(false)} />

    </div>
  );
};
