import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronLeft,
  ChevronRight,
  Compass,
  Layers,
  Lightbulb,
  CheckCircle2,
  Atom,
  Download,
  GraduationCap,
  Pencil
} from 'lucide-react';
import { motion } from 'motion/react';
import { ActiveSession, UserProgress, UserRole } from '../../types/physics';
import { CHARACTERS } from '../common/CharacterModal';
import { sounds } from '../../utils/soundEffects';
import { TeacherProfile, storage } from '../../utils/storage';
import { InstallAppModal } from '../common/InstallAppModal';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { 
  VolumetricKinematicsCar, 
  VolumetricStopwatch, 
  VolumetricMotionGraphIcon, 
  VolumetricGravitySphere,
  VolumetricPhotogateSensor 
} from '../common/Kinematics3DVisuals';

interface HomeHeroSectionProps {
  progress: UserProgress;
  userRole?: UserRole;
  activeSession?: ActiveSession | null;
  teacherProfile?: TeacherProfile;
  onOpenCharacterModal: () => void;
  onOpenTeacherModal?: () => void;
  onOpenHelp: () => void;
  onOpenValidationModal: () => void;
  onToggleRole?: () => void;
  onRefreshProgress: () => void;
  onReturnToSplash: () => void;
  onSelectTab: (tabId: string) => void;
}

export const HomeHeroSection: React.FC<HomeHeroSectionProps> = ({
  progress,
  userRole = 'murid',
  activeSession,
  teacherProfile,
  onOpenCharacterModal,
  onOpenTeacherModal,
  onSelectTab,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  // Active Character Lore
  const activeChar = CHARACTERS.find((c) => c.id === progress.selectedCharacter) || CHARACTERS[0];
  const currentXP = progress.xp || 380;
  const currentLevel = progress.level || Math.max(1, Math.floor(currentXP / 500) + 1);
  const xpInCurrentLevel = currentXP % 500;
  const xpPercent = Math.min(100, Math.round((xpInCurrentLevel / 500) * 100));

  const rankTitles: Record<number, string> = {
    1: 'Kadet Kinematika Muda',
    2: 'Operator Rel Presisi',
    3: 'Analis Vektor Gerak',
    4: 'Master GLB & GLBB',
    5: 'Profesor Fisika Digital',
  };
  const currentRank = rankTitles[currentLevel] || 'Pakar Fisika Digital';

  // 4 Slides for Pengenalan Awal Terkait MPI
  const mpiSlides = [
    {
      id: 0,
      tag: 'PENGENALAN MEDIA',
      title: 'Media Pembelajaran Interaktif (MPI) Kinematika Gerak Lurus',
      description: 'Lingkungan belajar digital interaktif untuk peserta didik SMA/MA Kelas X Fase E dalam mendalami konsep Gerak Lurus Beraturan (GLB) dan Gerak Lurus Berubah Beraturan (GLBB) secara visual, matematis, dan aplikatif.',
      highlights: [
        'Visualisasi konkret konsep gerak melalui simulasi bervolume 3D.',
        'Pembelajaran mandiri berbantuan telemetri data real-time.',
        'Integrasi teori, virtual lab, LKPD resmi, dan kuis formatif.'
      ],
      icon: Atom,
      color: 'sky'
    },
    {
      id: 1,
      tag: 'CAPAIAN & TUJUAN PEMBELAJARAN',
      title: 'Capaian Pembelajaran dan Tujuan Pembelajaran',
      description: 'Capaian Pembelajaran: Murid mampu menganalisis gerak dua dimensi.',
      highlights: [
        'Tujuan Pembelajaran 1: Murid dapat menganalisis karakteristik Gerak Lurus Beraturan (GLB) dan Gerak Lurus Berubah Beraturan (GLBB) melalui interpretasi grafik hubungan jarak, kecepatan, dan percepatan terhadap waktu serta mengaplikasikan persamaannya untuk menyelesaikan masalah.',
        'Tujuan Pembelajaran 2: Murid melakukan percobaan gerak lurus (GLB dan GLBB), mengolah data menjadi grafik, serta menganalisisnya untuk memverifikasi konsep yang dipelajari.'
      ],
      icon: Compass,
      color: 'amber'
    },
    {
      id: 2,
      tag: 'FITUR UTAMA MPI',
      title: 'Menu Belajar Interaktif Lengkap',
      description: 'Ekosistem lengkap untuk pembelajaran di kelas maupun belajar mandiri:',
      highlights: [
        '1. Video Interaktif: Tayangan fenomena GLB & GLBB terpisah beserta pemantik konsep.',
        '2. Modul Digital: Teori komprehensif GLB, GLBB, dan kalkulator rumus.',
        '3. Simulasi & LKPD: Virtual lab rel presisi dengan tabel data dan lembar kerja.',
        '4. Papan Tulis Interaktif: Papan tulis digital untuk penjelasan guru & stylus.',
        '5. Quiz: Beragam format soal formatif interaktif beserta pembahasan resmi.',
        '6. Refleksi: Jurnal penilaian diri untuk target belajar selanjutnya.'
      ],
      icon: Layers,
      color: 'emerald'
    },
    {
      id: 3,
      tag: 'PETUNJUK BELAJAR',
      title: 'Petunjuk Penggunaan & Pemanfaatan Media',
      description: 'Alur terpandu pemanfaatan platform pembelajaran:',
      highlights: [
        'Langkah 1: Amati fenomena nyata GLB & GLBB pada menu "Video Interaktif".',
        'Langkah 2: Baca dan telaah konsep di menu "Modul Digital".',
        'Langkah 3: Uji coba variabel gerak di menu "Simulasi & LKPD".',
        'Langkah 4: Gunakan "Papan Tulis Interaktif" untuk anotasi & grafik.',
        'Langkah 5: Kerjakan asesmen di "Quiz" lalu isi jurnal di "Refleksi".'
      ],
      icon: Lightbulb,
      color: 'purple'
    }
  ];

  const nextSlide = () => {
    sounds.playClick();
    setCurrentSlide((prev) => (prev + 1) % mpiSlides.length);
  };

  const prevSlide = () => {
    sounds.playClick();
    setCurrentSlide((prev) => (prev - 1 + mpiSlides.length) % mpiSlides.length);
  };

  const activeSlideData = mpiSlides[currentSlide];

  const slideMenuTargets: Record<number, string> = {
    0: 'video',
    1: 'modul',
    2: 'simulasi',
    3: 'papan',
    4: 'quiz',
    5: 'refleksi',
  };

  return (
    <section className="relative w-full py-1.5 sm:py-2 overflow-hidden">
      {/* Background Blobs (Snug & compact) */}
      <div className="absolute top-5 left-8 w-60 h-60 rounded-full bg-sky-200/30 blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-8 w-60 h-60 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[1600px] mx-auto px-2.5 sm:px-5 space-y-2.5">
        
        {/* ========================================================================= */}
        {/* TOP STATUS BAR: PROFIL GURU (GURU) ATAU NAMA MURID LOGIN (MURID)          */}
        {/* ========================================================================= */}
        {(() => {
          const isGuru = userRole === 'guru';
          const resolvedTeacher = teacherProfile || storage.getTeacherProfile();
          const guruName = resolvedTeacher.name || activeSession?.displayName || 'Guru Pengampu';
          const muridName = activeSession?.displayName || progress.studentName || 'Murid Fisika Merdeka';
          const muridClass = activeSession?.className || progress.studentId || 'Kelas X Fase E';

          return (
            <div className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-white via-[#EFF8FF] to-[#DFF0FF] border-2 border-sky-300/85 shadow-[0_10px_28px_-10px_rgba(14,165,233,0.22)] flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
              {isGuru ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-700 text-white shadow-md shadow-teal-500/20 shrink-0">
                    <GraduationCap className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-black text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                        PROFIL GURU
                      </span>
                      <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {resolvedTeacher.subject || 'Fisika Fase E (Kelas X)'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <h2 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                        {guruName}
                      </h2>
                      {resolvedTeacher.school && (
                        <span className="text-[11px] font-semibold text-slate-600 truncate">
                          • {resolvedTeacher.school}
                        </span>
                      )}
                      {resolvedTeacher.nip && (
                        <span className="text-[10px] font-mono font-bold text-teal-700">
                          • NIP/NUPTK: {resolvedTeacher.nip}
                        </span>
                      )}
                      {activeSession?.email &&
                        !activeSession.email.endsWith('@accounts.mpikinematika.app') && (
                          <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">
                            ({activeSession.email})
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    onClick={onOpenCharacterModal}
                    title="Klik untuk memilih Avatar Ilmuwan Fisika"
                    className="relative group cursor-pointer shrink-0"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                      <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white text-xl shadow-inner">
                        {activeChar.avatarEmoji}
                      </div>
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-md bg-amber-400 px-1 text-[8px] font-black text-slate-900 font-mono shadow border border-white">
                      LV.{currentLevel}
                    </span>
                  </div>

                  <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                          AKUN MURID · {muridClass}
                        </span>
                        <span className="hidden sm:inline-flex text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200">
                          FASE E · KURIKULUM MERDEKA
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <h2 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                          {muridName}
                        </h2>
                        <span className="text-[10px] font-bold text-sky-600 hidden sm:inline">
                          • Avatar {activeChar.name.split(' ')[0]} ({currentRank})
                        </span>
                      </div>
                    </div>

                    {/* XP Progress Bar Inline */}
                    <div className="flex items-center gap-1.5 w-36 sm:w-44">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 p-0.5 border border-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${xpPercent}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-black text-sky-700 whitespace-nowrap">
                        {currentXP} XP
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Right: Quick Utilities */}
              <div className="flex flex-wrap items-center gap-1.5 justify-start lg:justify-end">
                {isGuru && onOpenTeacherModal && (
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 440, damping: 26 }}
                    onClick={() => {
                      sounds.playClick();
                      onOpenTeacherModal();
                    }}
                    title="Ubah Data Profil Guru Pengampu"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-teal-700" strokeWidth={2} />
                    <span>Edit Profil Guru</span>
                  </motion.button>
                )}

                {/* Universal Install / Download Button */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 440, damping: 26 }}
                  onClick={() => {
                    sounds.playClick();
                    if (isInstallable) {
                      install();
                    } else {
                      setIsInstallModalOpen(true);
                    }
                  }}
                  title="Download & Pasang Aplikasi di Laptop, Layar PID, Komputer, atau Handphone"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-400/60 bg-gradient-to-r from-[#0284C7] to-[#2563EB] hover:from-[#0369A1] hover:to-[#1D4ED8] text-white text-xs font-bold shadow-[0_6px_16px_-4px_rgba(2,132,199,0.38)] transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Pasang App</span>
                </motion.button>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* SATU BARIS DERET SEJAJAR: HERO BANNER MPI (KIRI) & SLIDER MPI (KANAN)     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">

          {/* CARD KIRI (6 KOLOM): HERO BANNER & VISUAL 3D BERVOLUME */}
          <div className="lg:col-span-6 relative rounded-3xl bg-gradient-to-br from-[#38BDF8] via-[#0284C7] to-[#2563EB] p-3.5 sm:p-4 shadow-[0_18px_38px_-12px_rgba(14,165,233,0.42)] overflow-hidden text-white border-2 border-sky-200/80 flex flex-col justify-between gap-2.5">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black text-white border border-white/30 shadow-sm">
                <Sparkles className="h-3 w-3 text-amber-300" />
                <span>Media Pembelajaran Interaktif (MPI) Fisika Kelas X Fase E</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                Kinematika Gerak Lurus : <span className="text-amber-300 underline decoration-wavy decoration-orange-400">GLB &amp; GLBB</span>
              </h1>

              <p className="text-xs text-sky-100/95 leading-relaxed">
                Jelajahi dinamika gerak lurus satu dimensi melalui observasi terpadu. Manfaatkan menu navigasi di atas untuk mengakses materi modul, simulasi virtual lab, asesmen kuis, dan refleksi mandiri.
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold backdrop-blur-xs border border-white/30 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-amber-300" /> Gerak Lurus Beraturan (GLB)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold backdrop-blur-xs border border-white/30 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-amber-300" /> Gerak Lurus Berubah Beraturan (GLBB)
                </span>
              </div>
            </div>

            {/* 3D Volumetric Visual Diorama Showcase (Compact Horizontal Strip) */}
            <div className="relative z-10 rounded-2xl bg-white/12 backdrop-blur-md p-3 border border-white/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="animate-float-3d shrink-0">
                <VolumetricKinematicsCar size="md" speed={15} isMoving={true} />
              </div>

              <div className="grid grid-cols-4 gap-2 flex-1 w-full sm:border-l sm:border-white/20 sm:pl-3">
                <div className="flex flex-col items-center" title="Stopwatch & Ticker Timer 3D">
                  <VolumetricStopwatch size="sm" />
                  <span className="text-[9px] font-bold text-sky-100 mt-0.5">Timer 3D</span>
                </div>
                <div className="flex flex-col items-center" title="Grafik Gerak 3D">
                  <VolumetricMotionGraphIcon size="sm" />
                  <span className="text-[9px] font-bold text-sky-100 mt-0.5">Grafik 3D</span>
                </div>
                <div className="flex flex-col items-center" title="Gerak Vertikal & Gravitasi 3D">
                  <VolumetricGravitySphere size="sm" />
                  <span className="text-[9px] font-bold text-sky-100 mt-0.5">Gravitasi 3D</span>
                </div>
                <div className="flex flex-col items-center" title="Sensor Photogate 3D">
                  <VolumetricPhotogateSensor size="sm" />
                  <span className="text-[9px] font-bold text-sky-100 mt-0.5">Sensor 3D</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD KANAN (6 KOLOM): SLIDER PENGENALAN AWAL TERKAIT MPI */}
          <div className="lg:col-span-6 rounded-3xl p-3.5 sm:p-4 bg-gradient-to-br from-white via-[#EFF8FF] to-[#DFF0FF] border-2 border-sky-300/90 shadow-[0_10px_0_#93C5FD,0_20px_30px_-10px_rgba(14,165,233,0.22)] flex flex-col justify-between gap-2.5">
            <div className="space-y-2.5">
              {/* Slider Header & Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm shrink-0">
                    <activeSlideData.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-sky-700 bg-sky-100 px-2 py-0.2 rounded-full border border-sky-300 inline-block">
                      {activeSlideData.tag} · SLIDE {currentSlide + 1} DARI {mpiSlides.length}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5 truncate">
                      {activeSlideData.title}
                    </h3>
                  </div>
                </div>

                {/* Slider Navigation Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={prevSlide}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-sm"
                    title="Slide Sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {mpiSlides.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          sounds.playClick();
                          setCurrentSlide(idx);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          currentSlide === idx
                            ? 'w-4 bg-sky-600'
                            : 'w-2 bg-slate-200 hover:bg-slate-400'
                        }`}
                        title={`Lompat ke slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextSlide}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-sm"
                    title="Slide Selanjutnya"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Slide Description & Key Highlights */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  {activeSlideData.description}
                </p>

                <div className={`grid grid-cols-1 ${activeSlideData.highlights.length >= 4 ? 'sm:grid-cols-2' : activeSlideData.highlights.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-2`}>
                  {activeSlideData.highlights.map((item, idx) => {
                    const targetTab = activeSlideData.id === 2 ? slideMenuTargets[idx] : undefined;
                    if (targetTab) {
                      return (
                        <motion.button
                          key={idx}
                          type="button"
                          whileHover={{ y: -2, scale: 1.015 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                          onClick={() => onSelectTab(targetTab)}
                          className="text-left p-2.5 rounded-xl bg-gradient-to-br from-sky-50/90 via-white to-sky-50/60 border border-sky-200/80 hover:border-sky-400 shadow-[0_4px_12px_-4px_rgba(2,132,199,0.14)] hover:shadow-[0_10px_20px_-6px_rgba(2,132,199,0.24)] flex items-start gap-2 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" strokeWidth={2} />
                          <span className="text-[11px] font-bold text-slate-800 leading-snug">
                            {item}
                          </span>
                        </motion.button>
                      );
                    }
                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-white/90 border border-sky-200/90 shadow-xs flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" strokeWidth={2} />
                        <span className="text-[11px] font-bold text-slate-800 leading-snug">
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Slide guidance & counter */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-sky-200/80 text-[11px] text-slate-600">
              <span className="font-medium text-slate-600">
                Gunakan panah di atas untuk membaca ringkasan pengenalan MPI.
              </span>
              <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 tabular-nums">
                Slide {currentSlide + 1} / {mpiSlides.length}
              </span>
            </div>
          </div>

        </div>

      </div>
      
      {/* Modal Panduan & Pemasangan PWA Multi-Platform */}
      <InstallAppModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />
    </section>
  );
};
