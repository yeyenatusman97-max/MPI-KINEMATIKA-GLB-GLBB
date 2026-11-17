import React, { useState, useEffect, useRef } from 'react';
import {
  Atom,
  GraduationCap,
  FlaskConical,
  Gamepad2,
  BarChart3,
  Award,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Home,
  BookOpen,
  Trophy,
  User,
  LogOut,
  Sparkles,
  Layers,
  Puzzle,
  Sliders,
  Compass,
  ArrowRight,
  Smartphone,
  Tablet,
  Laptop,
  Check,
  Star,
  Lock,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NEWTON_ASSETS, NEWTON_QUIZ_QUESTIONS, GAME_LEVELS } from '../../data/newtonData';
import { sounds } from '../../utils/soundEffects';
import { LabGuideModal } from '../modals/LabGuideModal';
import { QuizReviewModal } from '../modals/QuizReviewModal';
import { MissionChallengeModal } from '../modals/MissionChallengeModal';
import { CertificateModal } from '../modals/CertificateModal';
import { UIComponentShowcaseModal } from '../modals/UIComponentShowcaseModal';

interface NewtonUIBoardProps {
  onNavigateToView?: (view: string) => void;
}

export const NewtonUIBoard: React.FC<NewtonUIBoardProps> = ({ onNavigateToView }) => {
  // Global Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isMissionOpen, setIsMissionOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const [showcaseInitialTab, setShowcaseInitialTab] = useState<string>('flip');
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);

  // Section 2: Materi Interaktif State
  const [materiTab, setMateriTab] = useState<'pengantar' | 'konsep' | 'contoh' | 'rangkuman'>('pengantar');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isKickingBall, setIsKickingBall] = useState(false);

  // Section 3: Virtual Lab Simulation State
  const [cartMass, setCartMass] = useState<number>(4); // kg
  const [cartForce, setCartForce] = useState<number>(20); // N
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [cartPosition, setCartPosition] = useState<number>(0); // 0% to 85%
  const [simTime, setSimTime] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Calculated acceleration a = F / m
  const acceleration = cartMass > 0 ? +(cartForce / cartMass).toFixed(2) : 0;

  // Section 4: Latihan & Kuis State
  const [quizIndex, setQuizIndex] = useState<number>(2); // Start at Question 3 (index 2) to match image ("Soal 3 dari 10")
  const [userSelectedAnswers, setUserSelectedAnswers] = useState<{ [qId: number]: string }>({
    1: 'A',
    2: 'B',
    3: 'B' // Option B "Semakin besar" selected as in image
  });

  // Section 5: Game Adventure State
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1, 2]);
  const [totalStars, setTotalStars] = useState<number>(120);
  const [totalTrophies, setTotalTrophies] = useState<number>(3);

  // Section 6: Evaluation State
  const [evalScore, setEvalScore] = useState<number>(92);

  // Audio / Sound FX toggle
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());

  const toggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  // Section 2 TTS Reading
  const handleToggleSpeech = () => {
    sounds.playClick();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = "Benda cenderung mempertahankan keadaannya, baik diam maupun bergerak lurus beraturan, kecuali ada gaya luar yang mengubahnya. Sebuah benda akan tetap diam atau bergerak lurus beraturan, selama tidak ada gaya resultan yang bekerja padanya. Hukum Pertama Newton.";
    if (materiTab === 'konsep') {
      textToSpeak = "Konsep Kelembaman atau inersia. Resultan gaya sama dengan nol, maka percepatan benda bernilai nol. Kecepatan benda konstan.";
    } else if (materiTab === 'contoh') {
      textToSpeak = "Contoh soal: Ketika mobil direm mendadak, tubuh penumpang terdorong ke depan karena mempertahankan keadaan geraknya.";
    } else if (materiTab === 'rangkuman') {
      textToSpeak = "Rangkuman: Hukum Pertama Newton juga dikenal sebagai Hukum Inersia atau Kelembaman.";
    }

    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.lang = 'id-ID';
    utter.rate = 0.95;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
    setIsSpeaking(true);
  };

  // Soccer ball kick animation
  const handleKickBall = () => {
    sounds.playStart();
    setIsKickingBall(true);
    setTimeout(() => {
      setIsKickingBall(false);
    }, 1200);
  };

  // Virtual Lab Cart Animation Loop
  useEffect(() => {
    if (isSimRunning) {
      sounds.startMotionHum(acceleration / 5);
      const startTime = performance.now() - simTime * 1000;

      const loop = (now: number) => {
        const elapsedSec = (now - startTime) / 1000;
        setSimTime(elapsedSec);

        // Calculate visual cart displacement (pixels/percentage)
        // distance x = 0.5 * a * t^2
        const rawDist = 0.5 * acceleration * elapsedSec * elapsedSec;
        const maxDist = 20; // 20 meters equivalent to 85% width
        const progressPct = Math.min(85, (rawDist / maxDist) * 85);

        setCartPosition(progressPct);
        sounds.updateMotionHum(elapsedSec * acceleration);

        if (progressPct >= 85) {
          setIsSimRunning(false);
          sounds.stopMotionHum();
          sounds.playFinish();
        } else {
          animFrameRef.current = requestAnimationFrame(loop);
        }
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      sounds.stopMotionHum();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      sounds.stopMotionHum();
    };
  }, [isSimRunning, acceleration, simTime]);

  const handleRunSim = () => {
    sounds.playStart();
    setIsSimRunning(true);
  };

  const handlePauseSim = () => {
    sounds.playClick();
    setIsSimRunning(false);
  };

  const handleResetSim = () => {
    sounds.playClick();
    setIsSimRunning(false);
    setCartPosition(0);
    setSimTime(0);
  };

  // Complete game mission handler
  const handleCompleteMission = (lvlId: number, starsEarned: number) => {
    if (!unlockedLevels.includes(lvlId + 1) && lvlId < 5) {
      setUnlockedLevels([...unlockedLevels, lvlId + 1]);
    }
    setTotalStars(prev => prev + starsEarned * 10);
    setTotalTrophies(prev => prev + 1);
  };

  // Trigger celebration confetti
  const triggerCelebration = () => {
    sounds.playFinish();
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 }
      });
    } catch {}
  };

  const openShowcase = (tabId: string) => {
    sounds.playClick();
    setShowcaseInitialTab(tabId);
    setIsShowcaseOpen(true);
  };

  const currentQuiz = NEWTON_QUIZ_QUESTIONS[quizIndex] || NEWTON_QUIZ_QUESTIONS[0];
  const userChoiceForCurrent = userSelectedAnswers[currentQuiz.id];

  return (
    <div className="w-full bg-[#EBF3FC] text-slate-900 pb-12 font-sans select-none overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* TOP HEADER BANNER (Newton Physics Learning Hub + Ribbon + 4 Feature Badges) */}
      {/* ========================================================================= */}
      <header className="w-full bg-gradient-to-r from-[#DCEAFC] via-[#E7F0FD] to-[#DCEAFC] border-b border-sky-200/80 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-[1520px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left: Atom Logo & Main Brand Title */}
          <div className="flex items-center gap-3.5 shrink-0">
            {/* Glowing 3D Atom Badge */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] via-[#1D4ED8] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/40 relative group">
              <Atom className="w-7 h-7 text-white animate-spin-slow" />
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0F2856] flex items-center gap-1.5">
                <span>Newton Physics Learning</span>
                <span className="text-[#2563EB]">Hub</span>
              </h1>
              <p className="text-xs font-semibold text-slate-500 tracking-wide">
                Explore • Experiment • Challenge • Achieve
              </p>
            </div>
          </div>

          {/* Center: Purple Pill Ribbon "Media Pembelajaran Interaktif Fisika" */}
          <div className="hidden lg:flex items-center gap-2.5 px-6 py-2 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-indigo-500/20 border border-white/25">
            <GraduationCap className="w-5 h-5 text-yellow-300 shrink-0" />
            <div className="text-center">
              <div className="text-xs font-extrabold tracking-wide">Media Pembelajaran Interaktif Fisika</div>
              <div className="text-[11px] text-purple-100 font-medium italic">
                “Belajar Fisika lebih mudah, seru dan bermakna”
              </div>
            </div>
          </div>

          {/* Right: 4 3D Circular Badges + Sound Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {/* Virtual Lab */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsGuideOpen(true);
              }}
              className="flex flex-col items-center group cursor-pointer"
              title="Laboratorium Virtual 3D"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-white to-sky-100 border-2 border-sky-300 shadow-md shadow-sky-400/25 flex items-center justify-center text-sky-600 group-hover:scale-105 group-hover:shadow-sky-400/40 transition-all">
                <FlaskConical className="w-5 h-5 text-sky-600 group-hover:rotate-6 transition-transform" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Virtual Lab</span>
            </button>

            {/* Gamifikasi */}
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedLevelId(1);
                setIsMissionOpen(true);
              }}
              className="flex flex-col items-center group cursor-pointer"
              title="Gamifikasi & Level Misi"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-white to-purple-100 border-2 border-purple-300 shadow-md shadow-purple-400/25 flex items-center justify-center text-purple-600 group-hover:scale-105 group-hover:shadow-purple-400/40 transition-all">
                <Gamepad2 className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Gamifikasi</span>
            </button>

            {/* Analitik Belajar */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsReviewOpen(true);
              }}
              className="flex flex-col items-center group cursor-pointer"
              title="Analitik Belajar & Pembahasan"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-white to-blue-100 border-2 border-blue-300 shadow-md shadow-blue-400/25 flex items-center justify-center text-blue-600 group-hover:scale-105 group-hover:shadow-blue-400/40 transition-all">
                <BarChart3 className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Analitik Belajar</span>
            </button>

            {/* Sertifikat */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsCertOpen(true);
              }}
              className="flex flex-col items-center group cursor-pointer"
              title="Sertifikat Penghargaan Resmi"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-white to-amber-100 border-2 border-amber-300 shadow-md shadow-amber-400/25 flex items-center justify-center text-amber-500 group-hover:scale-105 group-hover:shadow-amber-400/40 transition-all">
                <Award className="w-5 h-5 text-amber-500 group-hover:rotate-12 transition-transform" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 mt-1">Sertifikat</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all ml-1 ${
                !isMuted ? 'bg-white border-blue-300 text-blue-700 shadow-xs' : 'bg-slate-200 border-slate-300 text-slate-500'
              }`}
              title={!isMuted ? "Suara Aktif" : "Suara Dibisukan"}
            >
              {!isMuted ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN BOARD CANVAS - MATCHING THE POSTER LAYOUT AND PALETTE                */}
      {/* ========================================================================= */}
      <main className="max-w-[1520px] mx-auto px-3 sm:px-5 lg:px-7 pt-5 space-y-6">

        {/* ----------------------------------------------------------------------- */}
        {/* ROW 1: 1. Dashboard  |  2. Halaman Materi  |  3. Simulasi Virtual Lab   */}
        {/* ----------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          
          {/* ===================================================================== */}
          {/* SECTION 1: HALAMAN BERANDA (DASHBOARD)                                */}
          {/* ===================================================================== */}
          <div className="flex flex-col bg-white rounded-3xl border-2 border-blue-200 shadow-lg shadow-blue-900/5 overflow-hidden">
            {/* Blue Capsule Header */}
            <div className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                1. Halaman Beranda (Dashboard)
              </span>
              <button
                onClick={() => onNavigateToView?.('dashboard')}
                className="text-[11px] text-blue-100 hover:text-white flex items-center gap-1 transition-colors"
                title="Buka tampilan dashboard penuh"
              >
                <span>Fokus</span>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dashboard Inner Layout: Left Mini Sidebar + Right Dashboard Area */}
            <div className="flex flex-1 p-3 gap-3 min-h-[380px]">
              
              {/* Left Mini Sidebar */}
              <div className="w-24 sm:w-28 bg-gradient-to-b from-[#0F1E4A] to-[#1E293B] rounded-2xl p-2.5 flex flex-col justify-between text-white shrink-0">
                <div className="space-y-3">
                  {/* Brand Atom Mark */}
                  <div className="text-center pt-1">
                    <div className="w-9 h-9 mx-auto rounded-xl bg-blue-600/60 border border-blue-400/40 flex items-center justify-center shadow-xs">
                      <Atom className="w-5 h-5 text-sky-300" />
                    </div>
                    <div className="text-[10px] font-black leading-tight mt-1 text-slate-100">
                      Newton
                    </div>
                    <div className="text-[8px] text-sky-300 font-semibold uppercase tracking-tighter">
                      Physics Hub
                    </div>
                  </div>

                  {/* Nav Links */}
                  <div className="space-y-1 text-[11px] font-semibold">
                    <button
                      onClick={() => sounds.playClick()}
                      className="w-full px-2 py-1.5 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Beranda</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setMateriTab('pengantar');
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Materi</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsGuideOpen(true);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Simulasi</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setQuizIndex(0);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Latihan</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsMissionOpen(true);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Tantangan</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsCertOpen(true);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Profil</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Logout */}
                <button
                  onClick={() => sounds.playClick()}
                  className="w-full px-2 py-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-white/5 text-[10px] flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Keluar</span>
                </button>
              </div>

              {/* Right Dashboard Body */}
              <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
                {/* Greeting & Student Profile Card */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
                      Halo, Murid! 👋
                    </h2>
                    <p className="text-[11px] text-slate-500 truncate">
                      Siap menjelajahi dunia Fisika hari ini?
                    </p>
                  </div>

                  <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl shrink-0">
                    <img
                      src={NEWTON_ASSETS.studentMascot}
                      alt="Andi Pratama"
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-blue-300 shrink-0"
                    />
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-slate-900 leading-tight">Andi Pratama</div>
                      <div className="text-[9px] text-slate-500 font-medium">Kelas X</div>
                    </div>
                  </div>
                </div>

                {/* Big Hero Banner (Space Astronaut Theme) */}
                <div className="relative rounded-2xl overflow-hidden shadow-md group min-h-[120px] flex items-center p-4">
                  <img
                    src={NEWTON_ASSETS.heroAstronaut}
                    alt="Hukum Newton Space"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/70 to-transparent" />
                  
                  <div className="relative z-10 text-white max-w-[65%] space-y-1">
                    <div className="text-base sm:text-lg font-black tracking-tight leading-tight">
                      Hukum Newton
                    </div>
                    <p className="text-[10px] sm:text-xs text-sky-100 leading-snug">
                      Memahami gerak, menguasai kehidupan!
                    </p>
                    <button
                      onClick={() => {
                        sounds.playStart();
                        setMateriTab('konsep');
                      }}
                      className="mt-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-extrabold shadow flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <span>Mulai Belajar</span>
                      <Play className="w-3 h-3 fill-slate-950" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Menu Pembelajaran (4 cards) & Progres Belajar Gauge */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                  
                  {/* Left 3 cols: 4 colorful feature cards */}
                  <div className="sm:col-span-3 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                      <span>Menu Pembelajaran</span>
                      <span className="text-blue-600 hover:underline cursor-pointer">Lihat Semua →</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {/* Materi */}
                      <div
                        onClick={() => {
                          sounds.playClick();
                          setMateriTab('pengantar');
                        }}
                        className="p-2 rounded-xl bg-blue-500 text-white text-center flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-xs"
                      >
                        <BookOpen className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold leading-tight">Materi Interaktif</span>
                      </div>

                      {/* Virtual Lab */}
                      <div
                        onClick={() => {
                          sounds.playClick();
                          setIsGuideOpen(true);
                        }}
                        className="p-2 rounded-xl bg-emerald-500 text-white text-center flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-xs"
                      >
                        <FlaskConical className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold leading-tight">Virtual Lab</span>
                      </div>

                      {/* Tantangan & Kuis */}
                      <div
                        onClick={() => {
                          sounds.playClick();
                          setIsMissionOpen(true);
                        }}
                        className="p-2 rounded-xl bg-purple-600 text-white text-center flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-xs"
                      >
                        <Gamepad2 className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold leading-tight">Tantangan & Kuis</span>
                      </div>

                      {/* Raih Prestasi */}
                      <div
                        onClick={() => {
                          sounds.playClick();
                          setIsCertOpen(true);
                        }}
                        className="p-2 rounded-xl bg-amber-500 text-white text-center flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-xs"
                      >
                        <Trophy className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold leading-tight">Raih Prestasi</span>
                      </div>
                    </div>
                  </div>

                  {/* Right 1 col: Circular Progres Belajar (70%) */}
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-bold text-slate-600 mb-1">Progres Belajar</span>
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12 -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="19"
                          stroke="#E2E8F0"
                          strokeWidth="3.5"
                          fill="none"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="19"
                          stroke="#059669"
                          strokeWidth="3.5"
                          fill="none"
                          strokeDasharray="119.38"
                          strokeDashoffset={119.38 * (1 - 0.70)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute font-black text-[11px] text-slate-800">70%</span>
                    </div>
                    <span className="text-[8px] text-slate-500 font-semibold mt-1">3 dari 5 Topik</span>
                  </div>

                </div>
              </div>

            </div>
          </div>


          {/* ===================================================================== */}
          {/* SECTION 2: HALAMAN MATERI INTERAKTIF                                  */}
          {/* ===================================================================== */}
          <div className="flex flex-col bg-white rounded-3xl border-2 border-blue-200 shadow-lg shadow-blue-900/5 overflow-hidden">
            {/* Blue Capsule Header */}
            <div className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                2. Halaman Materi Interaktif
              </span>
              <button
                onClick={() => onNavigateToView?.('module')}
                className="text-[11px] text-blue-100 hover:text-white flex items-center gap-1 transition-colors"
                title="Buka materi penuh"
              >
                <span>Fokus</span>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inner Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              
              {/* Breadcrumb & Media Controls */}
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <span className="hover:text-blue-600 cursor-pointer">‹ Beranda</span>
                  <span>›</span>
                  <span className="hover:text-blue-600 cursor-pointer">Materi</span>
                  <span>›</span>
                  <span className="font-bold text-blue-700">Hukum Newton I</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleSpeech}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isSpeaking ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title={isSpeaking ? "Hentikan Suara" : "Dengarkan Teks (Text to Speech)"}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onNavigateToView?.('module');
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    title="Perbesar Tampilan Materi"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title Lockup */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Hukum Newton I</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Hukum Kelembaman</p>
                </div>
              </div>

              {/* 4 Tabs: Pengantar | Konsep | Contoh Soal | Rangkuman */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                {[
                  { id: 'pengantar', label: 'Pengantar' },
                  { id: 'konsep', label: 'Konsep' },
                  { id: 'contoh', label: 'Contoh Soal' },
                  { id: 'rangkuman', label: 'Rangkuman' },
                ].map((tab) => {
                  const isActive = materiTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        sounds.playClick();
                        setMateriTab(tab.id as any);
                      }}
                      className={`flex-1 py-1 px-2 rounded-lg text-center text-[11px] font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Content Grid: Text & Quote on Left, Soccer Ball Illustration on Right */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center py-1">
                {/* Left: Text & Quote Box */}
                <div className="space-y-2 text-xs">
                  {materiTab === 'pengantar' && (
                    <>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        Benda cenderung mempertahankan keadaannya, baik diam maupun bergerak lurus beraturan, kecuali ada gaya luar yang mengubahnya.
                      </p>

                      {/* Quote Box with blue background */}
                      <div className="bg-[#E0F2FE] border border-sky-300 rounded-xl p-2.5 relative text-slate-800">
                        <span className="text-sky-600 font-serif text-lg leading-none absolute top-1 left-2">“</span>
                        <p className="text-[11px] italic text-sky-950 font-medium pl-3 pr-2">
                          Sebuah benda akan tetap diam atau bergerak lurus beraturan, selama tidak ada gaya resultan yang bekerja padanya.
                        </p>
                        <div className="text-right text-[9px] font-bold text-sky-800 mt-1 uppercase tracking-wider">
                          — Hukum I Newton
                        </div>
                      </div>
                    </>
                  )}

                  {materiTab === 'konsep' && (
                    <div className="space-y-1.5 text-[11px] text-slate-700">
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl font-mono font-bold text-blue-900 text-center">
                        ΣF = 0 ⟹ a = 0 ⟹ v = konstan
                      </div>
                      <p className="leading-snug">
                        Sifat mempertahankan keadaan ini disebut <strong>Inersia</strong> atau <strong>Kelembaman</strong>. Massa adalah ukuran kuantitatif dari inersia suatu benda.
                      </p>
                    </div>
                  )}

                  {materiTab === 'contoh' && (
                    <div className="space-y-1.5 text-[11px] text-slate-700">
                      <div className="font-bold text-slate-900">Studi Kasus Penumpang Bus:</div>
                      <p className="leading-snug">
                        Ketika bus mendadak di rem, tubuh penumpang terdorong ke depan karena mempertahankan gerak majunya.
                      </p>
                    </div>
                  )}

                  {materiTab === 'rangkuman' && (
                    <div className="space-y-1 text-[11px] text-slate-700">
                      <div className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Check className="w-3.5 h-3.5" /> Benda diam tetap diam
                      </div>
                      <div className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Check className="w-3.5 h-3.5" /> Benda bergerak tetap lurus beraturan
                      </div>
                      <div className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Check className="w-3.5 h-3.5" /> Berlaku jika ΣF = 0
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Soccer Ball in Motion on Grass */}
                <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200 group">
                  <img
                    src={NEWTON_ASSETS.conceptSoccerBall}
                    alt="Soccer ball rolling on grass"
                    referrerPolicy="no-referrer"
                    className={`w-full h-32 sm:h-36 object-cover transition-transform duration-500 ${
                      isKickingBall ? 'scale-110 translate-x-2' : 'group-hover:scale-105'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Interactive Kick Button */}
                  <button
                    onClick={handleKickBall}
                    className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-[10px] font-bold shadow-md flex items-center gap-1 active:scale-95 transition-transform"
                  >
                    <span>{isKickingBall ? '⚽ Bergerak!' : '⚽ Tendang Bola'}</span>
                  </button>
                </div>
              </div>

              {/* Bottom Buttons: Sebelumnya & Lanjut */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (materiTab === 'konsep') setMateriTab('pengantar');
                    else if (materiTab === 'contoh') setMateriTab('konsep');
                    else if (materiTab === 'rangkuman') setMateriTab('contoh');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    if (materiTab === 'pengantar') setMateriTab('konsep');
                    else if (materiTab === 'konsep') setMateriTab('contoh');
                    else if (materiTab === 'contoh') setMateriTab('rangkuman');
                    else setMateriTab('pengantar');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                >
                  <span>Lanjut</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>


          {/* ===================================================================== */}
          {/* SECTION 3: SIMULASI VIRTUAL LAB                                       */}
          {/* ===================================================================== */}
          <div className="flex flex-col bg-white rounded-3xl border-2 border-blue-200 shadow-lg shadow-blue-900/5 overflow-hidden">
            {/* Blue Capsule Header */}
            <div className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                3. Simulasi Virtual Lab
              </span>
              <button
                onClick={() => onNavigateToView?.('virtuallab')}
                className="text-[11px] text-blue-100 hover:text-white flex items-center gap-1 transition-colors"
                title="Buka Lab 3D Penuh"
              >
                <span>Fokus</span>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inner Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              
              {/* Header inside: Laboratorium Virtual + Panduan ? button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                      Laboratorium Virtual
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Eksplorasi Hukum Newton II</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsGuideOpen(true);
                  }}
                  className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1"
                >
                  <span>Panduan</span>
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main Simulation Stage & Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                
                {/* Left 8 cols: Interactive Canvas (Sky, Grass, Track, Cart, Arrow) */}
                <div className="sm:col-span-8 bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100 rounded-2xl border border-sky-300 relative h-40 overflow-hidden flex flex-col justify-between p-2 shadow-inner">
                  {/* Sun / Clouds */}
                  <div className="flex justify-between items-start">
                    <div className="w-7 h-7 rounded-full bg-yellow-300/80 shadow-md shadow-yellow-400/40" />
                    <div className="px-2 py-0.5 rounded-md bg-white/70 backdrop-blur-xs text-[9px] font-mono text-slate-700">
                      t = {simTime.toFixed(1)}s • x = {(0.5 * acceleration * simTime * simTime).toFixed(1)}m
                    </div>
                  </div>

                  {/* Force Arrow Indicator */}
                  <div
                    className="absolute top-10 transition-all duration-100 flex flex-col items-start"
                    style={{ left: `${Math.min(75, 10 + cartPosition)}%` }}
                  >
                    <div className="bg-white/95 px-2 py-0.5 rounded-full border border-rose-300 shadow-xs text-[10px] font-extrabold text-rose-600 whitespace-nowrap mb-0.5">
                      Gaya (F) = {cartForce} N
                    </div>
                    {/* Animated Red Arrow */}
                    <div className="flex items-center">
                      <div
                        className="h-1.5 bg-rose-500 rounded-l"
                        style={{ width: `${Math.max(20, cartForce * 1.5)}px` }}
                      />
                      <div className="w-0 h-0 border-y-4 border-y-transparent border-l-8 border-l-rose-500" />
                    </div>
                  </div>

                  {/* Ground & Track with Cart */}
                  <div className="relative w-full pt-4">
                    {/* Cart with Payload */}
                    <div
                      className="absolute -top-11 transition-all duration-75 flex flex-col items-center"
                      style={{ left: `${Math.min(75, 5 + cartPosition)}%` }}
                    >
                      {/* Cart Cargo Body */}
                      <div className="w-16 h-8 bg-gradient-to-r from-amber-700 to-amber-600 rounded-md border-2 border-amber-900 shadow-md flex items-center justify-center text-white text-[9px] font-black">
                        {cartMass} kg
                      </div>
                      {/* Wheels */}
                      <div className="w-14 flex justify-between px-1 -mt-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-slate-400 animate-spin" />
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-slate-400 animate-spin" />
                      </div>
                    </div>

                    {/* Rails & Tie Sleepers */}
                    <div className="w-full h-2.5 bg-slate-700 rounded-full border-t border-slate-500 flex justify-between px-2 items-center">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-1 h-3 bg-amber-950 rounded-xs" />
                      ))}
                    </div>
                    {/* Green Ground Line */}
                    <div className="w-full h-3 bg-gradient-to-b from-emerald-600 to-emerald-700" />
                  </div>
                </div>

                {/* Right 4 cols: Parameter Deck & Mini Live Graph */}
                <div className="sm:col-span-4 space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
                  {/* Mass Slider */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-0.5">
                      <span>Massa (m)</span>
                      <span className="text-emerald-700 font-mono">{cartMass} kg</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={cartMass}
                      onChange={(e) => {
                        sounds.playClick();
                        setCartMass(Number(e.target.value));
                      }}
                      className="w-full h-1.5"
                    />
                  </div>

                  {/* Force Slider */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-0.5">
                      <span>Gaya (F)</span>
                      <span className="text-rose-600 font-mono">{cartForce} N</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={5}
                      value={cartForce}
                      onChange={(e) => {
                        sounds.playClick();
                        setCartForce(Number(e.target.value));
                      }}
                      className="w-full h-1.5 slider-orange"
                    />
                  </div>

                  {/* Big Acceleration Display */}
                  <div className="p-1.5 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <span className="text-[10px] text-blue-700 font-semibold uppercase">Percepatan (a)</span>
                    <div className="text-base font-black text-blue-900 font-mono">
                      {acceleration.toFixed(2)} m/s²
                    </div>
                  </div>

                  {/* Live SVG Graph: F vs a */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-600 mb-1">Grafik F vs a</div>
                    <div className="w-full h-16 bg-white rounded-lg border border-slate-200 p-1 relative">
                      <svg className="w-full h-full" viewBox="0 0 100 60">
                        {/* Axes */}
                        <line x1="12" y1="5" x2="12" y2="52" stroke="#94A3B8" strokeWidth="1" />
                        <line x1="12" y1="52" x2="95" y2="52" stroke="#94A3B8" strokeWidth="1" />
                        
                        {/* Linear Line */}
                        <line x1="12" y1="52" x2="90" y2="12" stroke="#2563EB" strokeWidth="1.5" />
                        
                        {/* Static points */}
                        {[
                          { x: 12, y: 52 },
                          { x: 28, y: 44 },
                          { x: 48, y: 34 },
                          { x: 68, y: 24 },
                          { x: 88, y: 14 },
                        ].map((pt, i) => (
                          <circle key={i} cx={pt.x} cy={pt.y} r="2" fill="#2563EB" />
                        ))}

                        {/* Active Dynamic Current Point */}
                        <circle
                          cx={12 + (cartForce / 50) * 78}
                          cy={52 - (acceleration / 12) * 40}
                          r="3.5"
                          fill="#EF4444"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          className="animate-pulse"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Action Controls: Jalankan | Pause | Reset */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                <button
                  onClick={handleRunSim}
                  disabled={isSimRunning}
                  className={`flex-1 py-1.5 rounded-xl text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-transform ${
                    isSimRunning
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Jalankan</span>
                </button>

                <button
                  onClick={handlePauseSim}
                  disabled={!isSimRunning}
                  className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 border border-slate-200"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>

                <button
                  onClick={handleResetSim}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 border border-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

            </div>
          </div>

        </div>


        {/* ----------------------------------------------------------------------- */}
        {/* ROW 2: 4. Latihan & Kuis  |  5. Tantangan Game  |  6. Evaluasi & Hasil  */}
        {/* ----------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          
          {/* ===================================================================== */}
          {/* SECTION 4: LATIHAN & KUIS INTERAKTIF                                  */}
          {/* ===================================================================== */}
          <div className="flex flex-col bg-white rounded-3xl border-2 border-blue-200 shadow-lg shadow-blue-900/5 overflow-hidden">
            {/* Blue Capsule Header */}
            <div className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                4. Latihan & Kuis Interaktif
              </span>
              <button
                onClick={() => onNavigateToView?.('challenge')}
                className="text-[11px] text-blue-100 hover:text-white flex items-center gap-1 transition-colors"
                title="Buka Kuis Penuh"
              >
                <span>Fokus</span>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inner Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              
              {/* Header: Trophy + Kuis: Hukum Newton + Soal X dari 10 + Progress Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs sm:text-sm">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Kuis: Hukum Newton</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-bold">
                    Soal {quizIndex + 1} dari 10
                  </span>
                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${((quizIndex + 1) / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Question & Mascot Reaction Split */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                
                {/* Left 8 cols: Question & 4 Choice Options */}
                <div className="sm:col-span-8 space-y-2">
                  {/* Question Stem */}
                  <div className="flex items-start gap-2 p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl">
                    <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      Q
                    </div>
                    <p className="text-[11px] font-semibold text-slate-800 leading-snug">
                      {currentQuiz.question}
                    </p>
                  </div>

                  {/* 4 Radio Options */}
                  <div className="space-y-1.5">
                    {currentQuiz.options.map((opt) => {
                      const isSelected = userChoiceForCurrent === opt.key;
                      const isCorrect = opt.key === currentQuiz.correctKey;

                      let btnStyle = "border-slate-200 hover:border-blue-300 bg-white text-slate-700";
                      if (isSelected) {
                        btnStyle = isCorrect
                          ? "border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold ring-2 ring-emerald-300"
                          : "border-rose-400 bg-rose-50 text-rose-900 font-semibold ring-2 ring-rose-200";
                      }

                      return (
                        <button
                          key={opt.key}
                          onClick={() => {
                            sounds.playClick();
                            setUserSelectedAnswers({
                              ...userSelectedAnswers,
                              [currentQuiz.id]: opt.key
                            });
                            if (opt.key === currentQuiz.correctKey) {
                              sounds.playSuccess();
                            } else {
                              sounds.playError();
                            }
                          }}
                          className={`w-full p-2 rounded-xl border text-left text-[11px] flex items-center justify-between transition-all ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-300 text-center font-bold text-[10px] leading-5 shrink-0">
                              {opt.key}
                            </span>
                            <span className="truncate">{opt.text}</span>
                          </div>
                          {isSelected && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right 4 cols: Mascot Card with Speech Bubble */}
                <div className="sm:col-span-4 flex flex-col items-center text-center p-2 bg-gradient-to-b from-sky-50 to-blue-50/50 rounded-2xl border border-sky-100">
                  {/* Feedback speech bubble */}
                  <div className="w-full p-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-[10px] text-emerald-950 font-bold mb-1 shadow-xs">
                    <div>Benar!</div>
                    <div className="text-[9px] font-medium text-emerald-800">Jawaban Anda tepat.</div>
                  </div>

                  {/* Mascot image */}
                  <img
                    src={NEWTON_ASSETS.studentMascot}
                    alt="Student mascot reaction"
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 object-contain drop-shadow-md hover:scale-105 transition-transform"
                  />
                </div>

              </div>

              {/* Bottom Buttons: Soal Sebelumnya & Soal Berikutnya */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (quizIndex > 0) setQuizIndex(quizIndex - 1);
                  }}
                  disabled={quizIndex === 0}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 ${
                    quizIndex === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Soal Sebelumnya</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    if (quizIndex < NEWTON_QUIZ_QUESTIONS.length - 1) {
                      setQuizIndex(quizIndex + 1);
                    } else {
                      setIsReviewOpen(true);
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                >
                  <span>Soal Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>


          {/* ===================================================================== */}
          {/* SECTION 5: TANTANGAN / GAME EDUKASI                                   */}
          {/* ===================================================================== */}
          <div className="flex flex-col bg-white rounded-3xl border-2 border-blue-200 shadow-lg shadow-blue-900/5 overflow-hidden">
            {/* Blue Capsule Header */}
            <div className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                5. Tantangan / Game Edukasi
              </span>
              <button
                onClick={() => onNavigateToView?.('challenge')}
                className="text-[11px] text-blue-100 hover:text-white flex items-center gap-1 transition-colors"
                title="Buka Game Penuh"
              >
                <span>Fokus</span>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inner Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              
              {/* Header: Petualangan Fisika + Star Badge + Trophy Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>Petualangan Fisika</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Selesaikan misi, raih bintang!</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-full text-amber-900 text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    <span>{totalStars}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-yellow-50 border border-yellow-300 rounded-full text-yellow-900 text-xs font-black">
                    <Trophy className="w-3.5 h-3.5 text-yellow-600" />
                    <span>{totalTrophies}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Quest Map Image with 5 Interactive Level Nodes */}
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 h-44 group">
                <img
                  src={NEWTON_ASSETS.gameIslandMap}
                  alt="Game Quest Island Map"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

                {/* 5 Clickable Nodes on the Map */}
                {/* Node 1: Unlocked / Active (Bottom-Left) */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedLevelId(1);
                    setIsMissionOpen(true);
                  }}
                  className={`absolute left-[15%] bottom-[20%] w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shadow-lg transition-transform hover:scale-110 active:scale-95 ${
                    selectedLevelId === 1
                      ? 'bg-gradient-to-tr from-blue-600 to-sky-400 text-white ring-4 ring-sky-300/80 animate-bounce'
                      : 'bg-blue-600 text-white ring-2 ring-white'
                  }`}
                  title="Level 1: Konsep Gaya & Gerak"
                >
                  1
                </button>

                {/* Node 2: Unlocked (Mid-Left) */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedLevelId(2);
                    setIsMissionOpen(true);
                  }}
                  className={`absolute left-[35%] bottom-[42%] w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-transform hover:scale-110 active:scale-95 ${
                    selectedLevelId === 2
                      ? 'bg-gradient-to-tr from-indigo-600 to-purple-400 text-white ring-4 ring-purple-300/80 animate-bounce'
                      : 'bg-indigo-600 text-white ring-2 ring-white'
                  }`}
                  title="Level 2: Eksplorasi Percepatan Balok"
                >
                  2
                </button>

                {/* Node 3: Locked (Mid-Center) */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedLevelId(3);
                    setIsMissionOpen(true);
                  }}
                  className="absolute left-[54%] bottom-[32%] w-8 h-8 rounded-full bg-slate-800/90 text-slate-300 ring-2 ring-white/60 flex items-center justify-center font-bold text-xs shadow-lg hover:scale-105 transition-transform"
                  title="Level 3: Aksi & Reaksi"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>

                {/* Node 4: Locked (Mid-Right) */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedLevelId(4);
                    setIsMissionOpen(true);
                  }}
                  className="absolute left-[68%] bottom-[45%] w-8 h-8 rounded-full bg-slate-800/90 text-slate-300 ring-2 ring-white/60 flex items-center justify-center font-bold text-xs shadow-lg hover:scale-105 transition-transform"
                  title="Level 4: Gaya Gesek & Permukaan"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>

                {/* Node 5: Boss Dome (Top Observatory) */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedLevelId(5);
                    setIsMissionOpen(true);
                  }}
                  className="absolute left-[78%] top-[18%] w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 text-white ring-3 ring-amber-300 flex items-center justify-center font-black text-xs shadow-xl hover:scale-110 transition-transform"
                  title="Boss Level 5: Kuil Observatorium Newton"
                >
                  5
                </button>
              </div>

              {/* Active Mission Preview Card & Mulai Misi Button */}
              <div className="p-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl flex items-center justify-between gap-2 shadow-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-[11px] font-bold text-yellow-300 flex items-center gap-1 truncate">
                    <Star className="w-3.5 h-3.5 fill-yellow-300" />
                    <span>Misi Level {selectedLevelId}: Pahami konsep gaya dan gerak!</span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">
                    Selesaikan tantangan kuis untuk membuka stage berikutnya.
                  </p>
                </div>

                <button
                  onClick={() => {
                    sounds.playStart();
                    setIsMissionOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] shadow flex items-center gap-1 shrink-0 active:scale-95 transition-transform"
                >
                  <span>Mulai Misi</span>
                  <Play className="w-3 h-3 fill-slate-950" />
                </button>
              </div>

            </div>
          </div>


          {/* ===================================================================== */}
          {/* SECTION 6: HALAMAN EVALUASI & HASIL                                   */}
          {/* ===================================================================== */}
          <div className="flex flex-col bg-white rounded-3xl border-2 border-blue-200 shadow-lg shadow-blue-900/5 overflow-hidden">
            {/* Blue Capsule Header */}
            <div className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                6. Halaman Evaluasi & Hasil
              </span>
              <button
                onClick={() => onNavigateToView?.('evaluation')}
                className="text-[11px] text-blue-100 hover:text-white flex items-center gap-1 transition-colors"
                title="Buka Evaluasi Penuh"
              >
                <span>Fokus</span>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inner Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                
                {/* Left 7 cols: Celebration Trophy, Score 92/100, Actions */}
                <div className="sm:col-span-7 flex flex-col items-center text-center p-2 bg-gradient-to-b from-amber-50/60 via-white to-sky-50/50 rounded-2xl border border-amber-200/80">
                  
                  {/* Golden Trophy Icon & Laurel */}
                  <div
                    onClick={triggerCelebration}
                    className="cursor-pointer group flex flex-col items-center"
                    title="Klik untuk merayakan dengan konfeti!"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-400/30 group-hover:scale-110 transition-transform">
                      <Trophy className="w-8 h-8 text-amber-900" />
                    </div>
                    {/* Ribbon Selamat */}
                    <div className="px-3 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black tracking-wide -mt-2 shadow-xs">
                      Selamat!
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 mt-2 max-w-[200px]">
                    Anda telah menyelesaikan pembelajaran Hukum Newton dengan hasil:
                  </p>

                  {/* Big Score Pill 92 / 100 */}
                  <div className="my-1.5 px-6 py-1 rounded-2xl bg-[#EDE9FE] border border-purple-300 text-purple-900 text-xl font-black font-mono shadow-xs">
                    {evalScore} / 100
                  </div>

                  {/* 2 Buttons: Lihat Pembahasan & Ulangi Quiz */}
                  <div className="flex items-center gap-1.5 w-full mt-1">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsReviewOpen(true);
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-[10px] shadow-xs"
                    >
                      Lihat Pembahasan
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setQuizIndex(0);
                        triggerCelebration();
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-[10px]"
                    >
                      Ulangi Quiz
                    </button>
                  </div>
                </div>

                {/* Right 5 cols: Ringkasan Belajar & Lencana yang Diperoleh */}
                <div className="sm:col-span-5 space-y-2.5 text-xs">
                  {/* Ringkasan Belajar */}
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-[11px] mb-1.5">
                      Ringkasan Belajar
                    </h4>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between p-1.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                        <span className="flex items-center gap-1 text-emerald-900 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Materi Dipelajari
                        </span>
                        <span className="font-bold text-emerald-800">3 / 3</span>
                      </div>

                      <div className="flex items-center justify-between p-1.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                        <span className="flex items-center gap-1 text-emerald-900 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kuis Diselesaikan
                        </span>
                        <span className="font-bold text-emerald-800">10 / 10</span>
                      </div>

                      <div className="flex items-center justify-between p-1.5 bg-sky-50/70 border border-sky-200 rounded-lg">
                        <span className="flex items-center gap-1 text-sky-900 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-sky-600" /> Waktu Belajar
                        </span>
                        <span className="font-bold text-sky-800">32 menit</span>
                      </div>
                    </div>
                  </div>

                  {/* Lencana yang Diperoleh */}
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-[11px] mb-1.5">
                      Lencana yang Diperoleh
                    </h4>
                    <div
                      onClick={() => {
                        sounds.playClick();
                        setIsCertOpen(true);
                      }}
                      className="p-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform shadow-xs"
                      title="Klik untuk membuka sertifikat kelulusan!"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-400 flex items-center justify-center shadow-xs">
                        <Award className="w-5 h-5 text-amber-950" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-amber-950 leading-tight">
                          Newton Explorer
                        </div>
                        <div className="text-[9px] font-bold text-amber-700">+50 Poin</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>


        {/* ----------------------------------------------------------------------- */}
        {/* ROW 3: 7. Komponen UI  |  8. Desain Responsif  |  9. Fitur Inovatif     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* ===================================================================== */}
          {/* SECTION 7: KOMPONEN UI UNGGULAN (Span 6 cols)                         */}
          {/* ===================================================================== */}
          <div className="lg:col-span-6 flex flex-col bg-white rounded-3xl border-2 border-blue-200 shadow-lg shadow-blue-900/5 overflow-hidden">
            {/* Blue Capsule Header */}
            <div className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                7. Komponen UI Unggulan
              </span>
              <span className="text-[11px] text-blue-200">Interactive Sandbox</span>
            </div>

            {/* 6 Feature Showcase Cards Grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1">
              
              {/* 1. Flip Card */}
              <div
                onClick={() => openShowcase('flip')}
                className="p-3 bg-gradient-to-b from-sky-50 to-blue-50/60 border border-sky-200 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:border-sky-400 hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900">Flip Card</div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Buka informasi secara interaktif
                </p>
              </div>

              {/* 2. Drag & Drop */}
              <div
                onClick={() => openShowcase('drag')}
                className="p-3 bg-gradient-to-b from-amber-50 to-orange-50/60 border border-amber-200 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:border-amber-400 hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                  <Puzzle className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900">Drag & Drop</div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Kelompokkan konsep
                </p>
              </div>

              {/* 3. Slider Interaktif */}
              <div
                onClick={() => openShowcase('slider')}
                className="p-3 bg-gradient-to-b from-cyan-50 to-sky-50/60 border border-cyan-200 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:border-cyan-400 hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                  <Sliders className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900">Slider Interaktif</div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Ubah variabel & lihat hasil
                </p>
              </div>

              {/* 4. Accordion */}
              <div
                onClick={() => openShowcase('accordion')}
                className="p-3 bg-gradient-to-b from-purple-50 to-indigo-50/60 border border-purple-200 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:border-purple-400 hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900">Accordion</div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Pelajari materi bertahap
                </p>
              </div>

              {/* 5. Infografis */}
              <div
                onClick={() => openShowcase('infographic')}
                className="p-3 bg-gradient-to-b from-indigo-50 to-blue-50/60 border border-indigo-200 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:border-indigo-400 hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                  <Atom className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900">Infografis</div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Visualisasi konsep
                </p>
              </div>

              {/* 6. Video Interaktif */}
              <div
                onClick={() => openShowcase('video')}
                className="p-3 bg-gradient-to-b from-rose-50 to-pink-50/60 border border-rose-200 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:border-rose-400 hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
                <div className="text-xs font-bold text-slate-900">Video Interaktif</div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Tonton & jawab pertanyaan
                </p>
              </div>

            </div>
          </div>


          {/* ===================================================================== */}
          {/* SECTION 8: DESAIN RESPONSIF (Span 3 cols)                             */}
          {/* ===================================================================== */}
          <div className="lg:col-span-3 flex flex-col bg-white rounded-3xl border-2 border-blue-200 shadow-lg shadow-blue-900/5 overflow-hidden">
            {/* Blue Capsule Header */}
            <div className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                8. Desain Responsif
              </span>
            </div>

            {/* Visual Devices Display */}
            <div className="p-4 flex-1 flex flex-col items-center justify-between text-center space-y-3">
              <div className="relative w-full max-w-[240px] py-2 flex items-center justify-center">
                {/* Laptop Mockup */}
                <div className="w-36 h-24 bg-slate-900 rounded-t-lg border-2 border-slate-700 p-1 flex flex-col shadow-md">
                  <div className="w-full h-full bg-gradient-to-br from-blue-900 to-sky-700 rounded-sm flex items-center justify-center text-white text-[8px] font-bold">
                    Newton Hub
                  </div>
                  <div className="w-44 h-1.5 bg-slate-700 rounded-b-md -mx-4 mt-1" />
                </div>

                {/* Smartphone Mockup */}
                <div className="absolute right-1 -bottom-1 w-12 h-24 bg-slate-900 rounded-xl border-2 border-slate-600 p-0.5 shadow-lg flex flex-col justify-between">
                  <div className="w-3 h-0.5 bg-slate-700 rounded-full mx-auto" />
                  <div className="w-full h-full bg-gradient-to-b from-blue-700 to-indigo-900 rounded-lg flex items-center justify-center text-white text-[7px] font-bold">
                    App
                  </div>
                  <div className="w-2 h-2 rounded-full border border-slate-700 mx-auto" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 w-full">
                <p className="text-xs font-bold text-slate-800">
                  Optimal di Laptop, Tablet dan Smartphone
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Antarmuka responsif adaptif untuk segala ukuran layar.
                </p>
              </div>
            </div>
          </div>


          {/* ===================================================================== */}
          {/* SECTION 9: FITUR INOVATIF (Span 3 cols)                               */}
          {/* ===================================================================== */}
          <div className="lg:col-span-3 flex flex-col bg-white rounded-3xl border-2 border-blue-200 shadow-lg shadow-blue-900/5 overflow-hidden">
            {/* Blue Capsule Header */}
            <div className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide">
                9. Fitur Inovatif
              </span>
            </div>

            {/* Checklist & Glowing Brand Card */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              {/* 5 Checklist Items */}
              <div className="space-y-1.5 text-xs text-slate-700">
                {[
                  'Pembelajaran berbasis skenario & cerita',
                  'Simulasi interaktif real-time',
                  'Gamifikasi (level, poin, badge)',
                  'Analitik belajar & laporan progres',
                  'Akses offline (PWA)',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 leading-tight">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Glowing Right Brand Card */}
              <div className="p-3 bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 rounded-2xl text-white text-center flex flex-col items-center justify-center shadow-md border border-blue-500/30">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-sky-400 flex items-center justify-center mb-1.5 shadow-md shadow-sky-500/40">
                  <Atom className="w-6 h-6 text-sky-300 animate-spin-slow" />
                </div>
                <div className="text-xs font-black text-sky-200 tracking-tight leading-snug">
                  Belajar Fisika Jadi Lebih Seru, Interaktif dan Bermakna!
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* INTERACTIVE MODALS                                                        */}
      {/* ========================================================================= */}
      <LabGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <QuizReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        userAnswers={userSelectedAnswers}
        score={evalScore}
      />

      <MissionChallengeModal
        isOpen={isMissionOpen}
        onClose={() => setIsMissionOpen(false)}
        levelId={selectedLevelId}
        onCompleteLevel={handleCompleteMission}
      />

      <CertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
        score={evalScore}
        studentName="Andi Pratama"
      />

      <UIComponentShowcaseModal
        isOpen={isShowcaseOpen}
        onClose={() => setIsShowcaseOpen(false)}
        initialComponent={showcaseInitialTab}
      />

    </div>
  );
};
