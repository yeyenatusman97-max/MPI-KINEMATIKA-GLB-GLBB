import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Maximize, 
  Minimize, 
  SkipBack, 
  SkipForward
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { storage } from '../../utils/storage';

const GLB_ESCALATOR_VIDEO_SRC = '/assets/aistudio/Teenager_riding_escalator_physic__370f5d2b__1__68274bd8.mp4';
const GLBB_BRAKING_CAR_VIDEO_SRC = '/assets/aistudio/GLBB_diperlambat_76d13094.mp4';

export interface NarrationPhase {
  id: string;
  start: number;
  end: number;
  label: string;
  badge: string;
  text: string;
  physicsDetail: string;
}

interface VideoPhenomenon {
  id: string;
  menuGroup: 'GLB' | 'GLBB';
  category: 'GLB' | 'GLBB Dipercepat' | 'GLBB Diperlambat' | 'GLBB Vertikal';
  shortLabel: string;
  title: string;
  tagline: string;
  duration: number; // in seconds
  defaultSpeed?: number;
  videoSrc?: string;
  muteNativeVideoAudio?: boolean;
  description: string;
  voiceNarration?: string; // Penjelasan suara detail kegiatan tanpa langsung memberitahu penyebab
  narrationPhases: NarrationPhase[];
  // Tepat SATU pertanyaan pemantik dasar mengenai konsep fisikanya (tanpa soal hitungan angka)
  pemantikQuestion: {
    question: string;
    hint: string;
    explanation: string;
  };
}

export const InteractiveVideoSection: React.FC = () => {
  // Active Phenomenon selection (0: GLB Eskalator, 1: GLBB Mobil Mengerem, 2: GLBB Bersepeda)
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  // Default to false: Jangan langsung tampilkan penjelasan konsep ilmiah sebelum diklik
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Audio & Playback State (Suara Efek & Suara Narasi Penjelasan)
  const [audioVolume, setAudioVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [mp4Durations, setMp4Durations] = useState<Record<string, number>>({
    'eskalator-3d-glb': 14,
    'mobil-mengerem-glbb-diperlambat': 14,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fenomena Nyata Terpisah: 1 GLB (Video Eskalator) dan 2 GLBB (Mobil Mengerem Diperlambat & Bersepeda)
  const phenomena: VideoPhenomenon[] = [
    {
      id: 'eskalator-3d-glb',
      menuGroup: 'GLB',
      category: 'GLB',
      shortLabel: 'Video Eskalator',
      title: 'Remaja Berdiri di Atas Tangga Eskalator',
      tagline: 'Video Animasi GLB: Kecepatan eskalator konstan v = 0,5 m/s dengan perpindahan teratur terhadap lantai gedung',
      duration: mp4Durations['eskalator-3d-glb'] || 14,
      videoSrc: GLB_ESCALATOR_VIDEO_SRC,
      muteNativeVideoAudio: false,
      description: 'Seorang remaja berdiri tegak di atas satu anak tangga eskalator di pusat perbelanjaan modern. Kedua kaki tetap berada pada anak tangga yang sama tanpa melangkah, eskalator bergerak naik stabil dengan kecepatan konstan 0,5 m/s, dan grafik perpindahan terhadap waktu meningkat secara linear (s = 6,0 m).',
      narrationPhases: [
        {
          id: 'esk-p1',
          start: 0,
          end: 4,
          label: 'Bagian 1: Gerak Awal di Eskalator',
          badge: 'Posisi Awal (A)',
          text: 'Remaja berdiri tegak di atas satu anak tangga eskalator yang mulai bergerak stabil.',
          physicsDetail: 'Posisi kaki tetap di anak tangga yang sama (diam relatif terhadap tangga)'
        },
        {
          id: 'esk-p2',
          start: 4,
          end: 9,
          label: 'Bagian 2: Kecepatan Konstan 0,5 m/s',
          badge: 'v = 0,5 m/s Konstan',
          text: 'Eskalator melaju naik dengan kecepatan konstan 0,5 m/s dan perpindahan bertambah teratur.',
          physicsDetail: 'Grafik perpindahan terhadap waktu membentuk garis lurus linear'
        },
        {
          id: 'esk-p3',
          start: 9,
          end: 15,
          label: 'Bagian 3: Total Perpindahan (GLB)',
          badge: 'Total Perpindahan s = 6,0 m',
          text: 'Perpindahan posisi pada setiap selang waktu selalu sama besar sehingga percepatan nol.',
          physicsDetail: 'v konstan (0,5 m/s) dan percepatan a = 0 m/s²'
        }
      ],
      pemantikQuestion: {
        question: 'Mengapa remaja yang berdiri diam di atas anak tangga eskalator dapat berpindah sejauh 6,0 meter menuju lantai atas, dan mengapa grafik perpindahan terhadap waktunya berbentuk garis lurus miring?',
        hint: 'Amati indikator kecepatan pada video (0,5 m/s) serta pertambahan nilai perpindahan (s) pada setiap selang waktu (t).',
        explanation: 'Peristiwa ini merupakan contoh nyata Gerak Lurus Beraturan (GLB). Eskalator bergerak pada lintasan lurus dengan kecepatan tetap (v = 0,5 m/s konstan) dan percepatan nol (a = 0 m/s²). Karena jarak perpindahan bertambah sama besar untuk setiap selang waktu yang sama (Δs/Δt tetap), grafik hubungan perpindahan terhadap waktu membentuk garis lurus miring (linear).'
      }
    },
    {
      id: 'mobil-mengerem-glbb-diperlambat',
      menuGroup: 'GLBB',
      category: 'GLBB Diperlambat',
      shortLabel: 'Mobil Mengerem (GLBB Diperlambat)',
      title: 'Mobil Mengerem di Jalan Lurus (GLBB Diperlambat)',
      tagline: 'Video Animasi GLBB Diperlambat: Mobil melaju kencang lalu direm teratur (a = -4 m/s²) hingga berhenti total',
      duration: mp4Durations['mobil-mengerem-glbb-diperlambat'] || 14,
      defaultSpeed: 0.75,
      videoSrc: GLBB_BRAKING_CAR_VIDEO_SRC,
      muteNativeVideoAudio: true,
      description: 'Sebuah mobil melaju dengan kecepatan tinggi, tiba-tiba mengerem sehingga mengalami penurunan kecepatan setiap detiknya hingga akhirnya berhenti total.',
      voiceNarration: 'Sebuah mobil yang sedang melaju dengan kecepatan tinggi, tiba-tiba mengerem sehingga mobil mulai mengalami penurunan kecepatan setiap detiknya, hingga akhirnya mobil berhenti total.',
      narrationPhases: [
        {
          id: 'mbl-p1',
          start: 0,
          end: 2.5,
          label: 'Fase 1: Laju Tinggi & Mulai Direm',
          badge: 'v = 20 m/s → Pedal Rem Diinjak',
          text: 'Mobil melaju cepat di jalan lurus lalu pengemudi menginjak pedal rem dan lampu rem menyala.',
          physicsDetail: 'Kecepatan awal v₀ = 20 m/s, mobil mulai mengalami perlambatan'
        },
        {
          id: 'mbl-p2',
          start: 2.5,
          end: 6,
          label: 'Fase 2: Perlambatan Teratur',
          badge: 'Kecepatan Berkurang Teratur (a = -4 m/s²)',
          text: 'Mobil tetap bergerak maju namun kelajuannya menurun secara teratur setiap detik.',
          physicsDetail: 'Perlambatan konstan a = -4 m/s² berlawanan arah gerak maju'
        },
        {
          id: 'mbl-p3',
          start: 6,
          end: 15,
          label: 'Fase 3: Mobil Berhenti Total',
          badge: 'Berhenti Total (v = 0 m/s, s = 50 m)',
          text: 'Setelah menempuh jarak pengereman 50 meter, mobil akhirnya berhenti total.',
          physicsDetail: 'Kecepatan akhir vₜ = 0 m/s setelah t = 5 s dan total jarak s = 50 m'
        }
      ],
      pemantikQuestion: {
        question: 'Saat pengemudi menginjak pedal rem, mengapa mobil tetap bergerak maju hingga menempuh jarak tertentu dan kecepatannya menurun secara teratur sebelum akhirnya berhenti total?',
        hint: 'Perhatikan perubahan angka speedometer dari 20 m/s hingga 0 m/s setiap detik serta lampu rem dan nilai percepatan a = -4 m/s².',
        explanation: 'Peristiwa ini adalah contoh Gerak Lurus Berubah Beraturan (GLBB) diperlambat. Karena sifat kelembaman benda (Hukum I Newton), mobil yang sedang melaju kencang (v₀ = 20 m/s) tetap bergerak maju saat direm. Gaya pengereman menghasilkan percepatan negatif atau perlambatan konstan (a = -4 m/s²) yang berlawanan arah dengan kecepatan gerak, sehingga laju mobil berkurang 4 m/s setiap detik secara teratur hingga berhenti total (vₜ = 0 m/s) pada jarak 50 meter.'
      }
    }
  ];

  const currentPhenomenon = phenomena[selectedIdx] || phenomena[0];
  const activeMenuGroup = currentPhenomenon.menuGroup;
  const glbbPhenomena = phenomena.filter((p) => p.menuGroup === 'GLBB');
  const isMp4Video = Boolean(currentPhenomenon.videoSrc);
  const usesReplacedSpeechAudio = Boolean(currentPhenomenon.muteNativeVideoAudio || !isMp4Video);


  // Current active narration phase based on video timestamp
  const currentPhase = currentPhenomenon.narrationPhases.find(
    (p) => currentTime >= p.start && currentTime < p.end
  ) || currentPhenomenon.narrationPhases[currentPhenomenon.narrationPhases.length - 1];

  // =========================================================================
  // SUARA PENJELASAN PERISTIWA (Voice Explanation via SpeechSynthesis id-ID)
  // Menjelaskan isi video yang sedang diputar tanpa perlu teks narasi di bawah
  // =========================================================================
  const stopVoiceNarration = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const playVoiceNarration = useCallback((phenomenon: VideoPhenomenon, forceUnmute = false) => {
    if (isMuted && !forceUnmute) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Penjelasan to-the-point peristiwa yang ditampilkan pada video
    const speechText = phenomenon.voiceNarration || `${phenomenon.title}. ${phenomenon.description}`;

    const utter = new SpeechSynthesisUtterance(speechText);
    utter.lang = 'id-ID';
    utter.rate = phenomenon.defaultSpeed && speed === phenomenon.defaultSpeed
      ? 0.92
      : Math.min(1.2, Math.max(0.85, speed));
    utter.pitch = 1.0;
    utter.volume = forceUnmute ? audioVolume : (isMuted ? 0 : audioVolume);

    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(
      (v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
    );
    if (indonesianVoice) {
      utter.voice = indonesianVoice;
    }

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utter);
  }, [audioVolume, isMuted, speed]);

  // Sync HTML5 video volume, mute, and playback rate for MP4 videos
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !isMp4Video) return;
    // Jika video ini menggunakan narasi audio pengganti (GLBB Mobil Mengerem),
    // audio asli pada elemen <video> HARUS selalu dimute agar tidak bertumpuk!
    const shouldMuteVideoElement = Boolean(currentPhenomenon.muteNativeVideoAudio || isMuted);
    vid.muted = shouldMuteVideoElement;
    vid.volume = shouldMuteVideoElement ? 0 : audioVolume;
    vid.playbackRate = speed;
  }, [audioVolume, isMuted, speed, selectedIdx, isMp4Video, currentPhenomenon.muteNativeVideoAudio]);

  const handleMp4VideoEnded = () => {
    setIsPlaying(false);
    if (usesReplacedSpeechAudio) {
      stopVoiceNarration();
    }
    sounds.playFinish();
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    const prog = storage.getProgress();
    if (!prog.videosWatched.includes(currentPhenomenon.id)) {
      storage.saveProgress({
        videosWatched: [...prog.videosWatched, currentPhenomenon.id],
        xp: (prog.xp || 380) + 50
      });
      showToast(`+50 XP Berhasil Mengamati Video ${currentPhenomenon.menuGroup}!`);
    }
  };

  const handlePlayPause = () => {
    sounds.playClick();
    const nextPlay = !isPlaying;

    if (isMp4Video) {
      const vid = videoRef.current;
      if (vid) {
        if (nextPlay) {
          if (vid.currentTime >= (vid.duration || currentPhenomenon.duration) - 0.1) {
            vid.currentTime = 0;
            setCurrentTime(0);
          }
          const shouldMuteVideoElement = Boolean(currentPhenomenon.muteNativeVideoAudio || isMuted);
          vid.muted = shouldMuteVideoElement;
          vid.volume = shouldMuteVideoElement ? 0 : audioVolume;
          vid.playbackRate = speed;
          vid.play().catch(() => {});

          if (currentPhenomenon.muteNativeVideoAudio && !isMuted) {
            playVoiceNarration(currentPhenomenon);
          }
        } else {
          vid.pause();
          if (currentPhenomenon.muteNativeVideoAudio) {
            stopVoiceNarration();
          }
        }
      }
      setIsPlaying(nextPlay);
      return;
    }

    setIsPlaying(nextPlay);
    if (nextPlay) {
      if (currentTime >= currentPhenomenon.duration) {
        setCurrentTime(0);
      }
      if (!isMuted) {
        sounds.startMotionHum(1.1);
        playVoiceNarration(currentPhenomenon);
      }
    } else {
      sounds.stopMotionHum();
      stopVoiceNarration();
    }
  };

  const handleReset = () => {
    sounds.playClick();
    setIsPlaying(false);
    setCurrentTime(0);
    if (isMp4Video && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    stopVoiceNarration();
    sounds.stopMotionHum();
  };

  const handleSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(currentPhenomenon.duration, newTime));
    setCurrentTime(clamped);
    if (isMp4Video && videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const handleSelectPhenomenon = (idx: number) => {
    sounds.playClick();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    stopVoiceNarration();
    setSelectedIdx(idx);
    setSpeed(phenomena[idx]?.defaultSpeed ?? 1);
    setCurrentTime(0);
    setIsPlaying(false);
    setShowExplanation(false); // Sembunyikan penjelasan saat berganti video
    sounds.stopMotionHum();
  };

  useEffect(() => {
    return () => {
      stopVoiceNarration();
      sounds.stopMotionHum();
    };
  }, [selectedIdx, stopVoiceNarration]);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="w-full py-2 border-t-2 border-sky-200/80 bg-gradient-to-b from-[#EFF8FF]/70 via-[#F7FBFF] to-white animate-fadeIn">
      <div className="w-full max-w-[1560px] mx-auto px-3 sm:px-6 space-y-2.5">
        
        {/* ========================================================================= */}
        {/* HEADER MENU & SUB-MENU TERPISAH GLB & GLBB (SEJAJAR 1 BARIS RINGKAS)      */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 pb-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-black text-indigo-700">
              Menu 2 · Video Interaktif
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Fenomena GLB &amp; GLBB
            </h2>
            <p className="hidden xl:block text-xs font-semibold text-slate-500">
              — Amati tayangan animasi beserta suara penjelasan dan diskusikan pemantik di samping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex flex-wrap items-center gap-1 bg-sky-100/80 p-1 rounded-xl border border-sky-200 shadow-xs">
              <button
                onClick={() => handleSelectPhenomenon(0)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-left transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeMenuGroup === 'GLB'
                    ? 'bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-sm'
                    : 'bg-white/95 text-slate-700 hover:bg-sky-50 border border-sky-200/80'
                }`}
              >
                <div>
                  <div className="text-xs font-black leading-tight">Menu GLB</div>
                  <div className={`text-[9.5px] font-medium leading-tight ${
                    activeMenuGroup === 'GLB' ? 'text-sky-100' : 'text-slate-500'
                  }`}>
                    Gerak Lurus Beraturan
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (activeMenuGroup !== 'GLBB') {
                    handleSelectPhenomenon(1);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-left transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeMenuGroup === 'GLBB'
                    ? 'bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-sm'
                    : 'bg-white/95 text-slate-700 hover:bg-sky-50 border border-sky-200/80'
                }`}
              >
                <div>
                  <div className="text-xs font-black leading-tight">Menu GLBB</div>
                  <div className={`text-[9.5px] font-medium leading-tight ${
                    activeMenuGroup === 'GLBB' ? 'text-sky-100' : 'text-slate-500'
                  }`}>
                    Gerak Lurus Berubah Beraturan
                  </div>
                </div>
              </button>
            </div>

            {activeMenuGroup === 'GLBB' && glbbPhenomena.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-indigo-200 shadow-xs">
                {glbbPhenomena.map((item, gIdx) => {
                  const actualIdx = phenomena.findIndex((p) => p.id === item.id);
                  const isSelectedGlbb = actualIdx === selectedIdx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectPhenomenon(actualIdx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                        isSelectedGlbb
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {gIdx + 1}. {item.shortLabel}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN VIDEO PLAYER & SIDEBAR PERTANYAAN PEMANTIK                           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Main Video Screen & Audio Player Column (6 Cols, Equal Size with Right Card) */}
          <div className="lg:col-span-6 flex flex-col">
            
            {/* CINEMA GRADE VIDEO PLAYER FRAME */}
            <div 
              ref={playerContainerRef}
              className={`relative rounded-3xl border-2 border-sky-400/75 bg-slate-950 overflow-hidden shadow-[0_16px_36px_-12px_rgba(14,165,233,0.28)] ring-1 ring-sky-300/20 ${
                isFullscreen ? 'w-full h-full flex flex-col' : 'w-full flex-1 flex flex-col justify-between'
              }`}
            >
              {/* Top Glassmorphic Header Bar inside Video Frame */}
              <div className="px-3.5 py-1.5 bg-gradient-to-b from-slate-900/95 to-slate-900/70 border-b border-slate-800/80 flex items-center justify-between text-xs backdrop-blur-md z-10 relative shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] font-bold text-sky-300 whitespace-nowrap">
                    {activeMenuGroup === 'GLB' ? 'VIDEO GLB' : 'VIDEO GLBB'}
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="font-bold text-slate-200 truncate max-w-[200px] sm:max-w-[340px]">
                    {currentPhenomenon.title}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] font-bold text-slate-300">
                    1080p HD
                  </span>
                  <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Video Display Area with MP4 Video / Canvas & Overlays */}
              <div className={`relative w-full bg-slate-950 group overflow-hidden ${
                isFullscreen ? 'flex-1' : 'h-[225px] sm:h-[250px]'
              }`}>
                {currentPhenomenon.videoSrc ? (
                  <video
                    key={currentPhenomenon.id}
                    ref={videoRef}
                    src={currentPhenomenon.videoSrc}
                    muted={Boolean(currentPhenomenon.muteNativeVideoAudio || isMuted)}
                    playsInline
                    preload="auto"
                    onClick={handlePlayPause}
                    onLoadedMetadata={(e) => {
                      e.currentTarget.playbackRate = speed;
                      const d = e.currentTarget.duration;
                      if (d && Number.isFinite(d)) {
                        setMp4Durations((prev) => ({
                          ...prev,
                          [currentPhenomenon.id]: d,
                        }));
                      }
                    }}
                    onTimeUpdate={(e) => {
                      setCurrentTime(e.currentTarget.currentTime);
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={handleMp4VideoEnded}
                    className="w-full h-full object-contain bg-black cursor-pointer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                    Video tidak tersedia
                  </div>
                )}

                {/* Center Big Play / Replay Overlay Button when Paused or Finished */}
                {!isPlaying && (
                  <div 
                    onClick={handlePlayPause}
                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer transition-opacity animate-fadeIn"
                  >
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 hover:scale-110 hover:bg-indigo-500 transition-all border-2 border-indigo-300/50">
                      {currentTime >= currentPhenomenon.duration - 0.15 ? (
                        <RotateCcw className="h-7 w-7 text-white" />
                      ) : (
                        <Play className="h-7 w-7 text-white fill-white ml-1" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Video Player Timeline & Controls Dock */}
              <div className="p-2.5 sm:p-3 bg-slate-900 border-t border-slate-800 space-y-1.5 shrink-0">
                
                {/* Modern Interactive Timeline Scrubber with Milestone Pins */}
                <div className="space-y-1">
                  <div 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      handleSeek(ratio * currentPhenomenon.duration);
                    }}
                    className="group relative h-2.5 w-full bg-slate-800 hover:h-3.5 rounded-full cursor-pointer overflow-visible transition-all"
                  >
                    {/* Progress track */}
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all relative"
                      style={{ width: `${(currentTime / currentPhenomenon.duration) * 100}%` }}
                    >
                      {/* Scrubber Knob */}
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 rounded-full bg-white shadow-md ring-2 ring-indigo-500 scale-90 group-hover:scale-110 transition-transform" />
                    </div>

                    {/* Milestone Phase Markers along scrub bar */}
                    {currentPhenomenon.narrationPhases.map((phase) => {
                      const posPercent = Math.min(98, Math.max(0, (phase.start / currentPhenomenon.duration) * 100));
                      return (
                        <div
                          key={phase.id}
                          style={{ left: `${posPercent}%` }}
                          title={`${phase.label}: ${phase.badge}`}
                          className="absolute top-0 bottom-0 w-1 bg-white/40 hover:bg-amber-400 transition-colors pointer-events-none"
                        />
                      );
                    })}
                  </div>

                  {/* Scrubber Milestone Labels */}
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-0.5">
                    <span>00:00 (Mulai)</span>
                    <span className="text-slate-400">{currentPhase?.label}</span>
                    <span>{formatTime(currentPhenomenon.duration)}</span>
                  </div>
                </div>

                {/* Bottom Video Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-slate-300">
                  
                  {/* Left Controls: Play/Pause, Skips, Reset, Time */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePlayPause}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30"
                      title={isPlaying ? 'Jeda (Pause)' : 'Putar Video (Play)'}
                    >
                      {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
                    </button>

                    <button
                      onClick={() => handleSeek(currentTime - 5)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      title="Mundur 5 detik"
                    >
                      <SkipBack className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleSeek(currentTime + 5)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      title="Maju 5 detik"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={handleReset}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      title="Ulangi dari Awal"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>

                    <div className="font-mono text-slate-300 font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
                      {formatTime(currentTime)} / {formatTime(currentPhenomenon.duration)}
                    </div>
                  </div>

                  {/* Right Controls: Voice Narration Toggle, Volume, Speed */}
                  <div className="flex items-center gap-1.5">

                    {/* Tombol Suara Narasi Penjelasan Peristiwa */}
                    <button
                      onClick={() => {
                        sounds.playClick();
                        if (!usesReplacedSpeechAudio) {
                          const nextMuted = !isMuted;
                          setIsMuted(nextMuted);
                          if (!nextMuted && !isPlaying && videoRef.current) {
                            videoRef.current.muted = false;
                            videoRef.current.volume = audioVolume;
                            videoRef.current.play().catch(() => {});
                            setIsPlaying(true);
                          }
                        } else {
                          if (isSpeaking) {
                            stopVoiceNarration();
                          } else {
                            if (isMuted) setIsMuted(false);
                            playVoiceNarration(currentPhenomenon, true);
                          }
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition whitespace-nowrap ${
                        (!usesReplacedSpeechAudio ? (!isMuted && isPlaying) : isSpeaking)
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow' 
                          : 'bg-slate-950 text-sky-300 border-slate-800 hover:text-white'
                      }`}
                      title={
                        !usesReplacedSpeechAudio
                          ? (isMuted ? 'Nyalakan Audio Penjelasan Video' : 'Audio Penjelasan Video Aktif')
                          : (isSpeaking ? 'Hentikan Suara Narasi Penjelasan' : 'Dengarkan Suara Narasi Penjelasan')
                      }
                    >
                      <Volume2 className="h-3 w-3" />
                      <span>
                        {!usesReplacedSpeechAudio
                          ? (isMuted ? 'Audio Dibisukan' : 'Suara Video Aktif')
                          : (isSpeaking ? 'Narasi Aktif' : 'Suara Narasi')}
                      </span>
                    </button>

                    {/* Quick Volume / Mute button */}
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => {
                          const nextMuted = !isMuted;
                          setIsMuted(nextMuted);
                          if (usesReplacedSpeechAudio) {
                            if (nextMuted) {
                              stopVoiceNarration();
                            } else if (isPlaying) {
                              playVoiceNarration(currentPhenomenon, true);
                            }
                          }
                        }}
                        className="text-slate-400 hover:text-white"
                        title={isMuted ? 'Buka Suara' : 'Bisukan Suara'}
                      >
                        {isMuted ? (
                          <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                        ) : audioVolume > 0.5 ? (
                          <Volume2 className="h-3.5 w-3.5 text-sky-400" />
                        ) : (
                          <Volume1 className="h-3.5 w-3.5 text-sky-400" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : audioVolume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setAudioVolume(val);
                          if (isMuted && val > 0) setIsMuted(false);
                        }}
                        className="w-14 h-1 accent-indigo-500 cursor-pointer"
                        title={`Volume: ${Math.round((isMuted ? 0 : audioVolume) * 100)}%`}
                      />
                    </div>

                    {/* Playback Speed selector */}
                    <div className="hidden sm:flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      {[0.65, 0.75, 1, 1.25].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            sounds.playClick();
                            setSpeed(s);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                            speed === s ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

          {/* Sidebar: TEPAT SATU Pertanyaan Pemantik Konsep Dasar (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col">
            
            {/* Kartu Pertanyaan Pemantik Konsep Dasar */}
            <div className="rounded-3xl p-4 bg-gradient-to-br from-white via-[#EFF8FF] to-[#DFF0FF] border-2 border-sky-300/90 shadow-[0_10px_0_#93C5FD,0_18px_28px_-10px_rgba(14,165,233,0.22)] flex-1 flex flex-col gap-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700">
                        <span>Pertanyaan Pemantik Diskusi</span>
                        <span aria-hidden="true">·</span>
                        <span>Konseptual</span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900">
                        Pemantik Konsep Esensial
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Teks Pertanyaan Dasar */}
                <div className="p-3 rounded-2xl bg-white/95 border-2 border-sky-200 shadow-xs">
                  <p className="text-xs sm:text-sm font-black text-sky-950 leading-relaxed">
                    "{currentPhenomenon.pemantikQuestion.question}"
                  </p>
                </div>
              </div>

              {/* Penjelasan Konsep Ilmiah (JANGAN LANGSUNG DITAMPILKAN - DIKLIK DULU BARU TAMPIL) */}
              <div className="border-2 border-indigo-200 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-sky-50/70 overflow-hidden text-xs">
                
                {/* Trigger Button */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    setShowExplanation(!showExplanation);
                  }}
                  className={`w-full p-3 text-left font-black flex items-center justify-between transition ${
                    showExplanation 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white hover:bg-indigo-50 text-indigo-950'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className={`h-4 w-4 ${showExplanation ? 'text-amber-300' : 'text-indigo-600'}`} />
                    <span>
                      {showExplanation 
                        ? 'Penjelasan Ilmiah Berdasarkan Konsep Fisika' 
                        : '💡 Klik untuk Menampilkan Penjelasan Konsep Ilmiah'}
                    </span>
                  </span>
                  {showExplanation ? (
                    <ChevronUp className="h-4 w-4 text-white shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-indigo-600 shrink-0" />
                  )}
                </button>

                {/* Pesan Instruksi Sebelum Diklik */}
                {!showExplanation && (
                  <div className="p-2.5 text-[11px] text-slate-600 bg-white/60 border-t border-indigo-100">
                    <p className="italic">
                      Silakan amati video tayangan dan diskusikan jawaban Anda terlebih dahulu. Klik tombol di atas untuk membuka ulasan konsep ilmiah resmi.
                    </p>
                  </div>
                )}

                {/* Penjelasan Resmi Setelah Diklik */}
                {showExplanation && (
                  <div className="p-2.5 bg-white border-t border-indigo-200 space-y-1.5 text-xs leading-relaxed text-slate-800 animate-fadeIn max-h-[115px] overflow-y-auto">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Ulasan Konsep Fisika Terverifikasi
                    </div>
                    <p className="font-medium text-slate-700 leading-relaxed text-[11.5px]">
                      {currentPhenomenon.pemantikQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Toast Message */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </section>
  );
};
