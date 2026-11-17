import React, { useState, useEffect, useRef } from 'react';
import { 
  Presentation, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Eye, 
  EyeOff, 
  Crosshair, 
  FileText, 
  Download, 
  HelpCircle, 
  Sparkles, 
  CheckCircle,
  Activity,
  Gauge
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface Slide {
  id: number;
  category: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  formula?: string;
  interactiveChallenge?: {
    question: string;
    answer: string;
  };
  teacherNotes: string;
}

export const SmartPresentation: React.FC = () => {
  const [deck, setDeck] = useState<'GLB' | 'GLBB'>('GLB');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [laserPointerActive, setLaserPointerActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  const [showPresenterNotes, setShowPresenterNotes] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // GLB 12 Slides Deck
  const glbSlides: Slide[] = [
    {
      id: 1,
      category: '1. Cover & Judul Materi',
      title: 'GERAK LURUS BERATURAN (GLB)',
      subtitle: 'Fisika SMA Kelas X Fase E • Kurikulum Merdeka',
      bullets: [
        'Media Pembelajaran Interaktif Papan Digital',
        'Fokus: Analisis Kecepatan Konstan & Grafik Kinematika 1 Dimensi',
        'Laboratorium Virtual Sains Digital'
      ],
      teacherNotes: 'Sampaikan salam pembuka, arahkan murid memperhatikan judul besar di layar PID.'
    },
    {
      id: 2,
      category: '2. Apersepsi',
      title: 'Kereta Cepat Whoosh di Jalur Lurus',
      subtitle: 'Mengapa air di dalam cangkir tidak tumpah saat melaju 350 km/jam?',
      bullets: [
        'Ketika kereta melaju stabil di lintasan lurus datar tanpa percepatan, kita merasa seperti diam.',
        'Hukum I Newton (Inersia): benda mempertahankan keadaannya jika resultan gaya luar nol.',
        'Inilah esensi Gerak Lurus Beraturan (GLB).'
      ],
      teacherNotes: 'Minta 2-3 murid menjawab fenomena air di cangkir kereta sebelum berpindah ke slide berikutnya.'
    },
    {
      id: 3,
      category: '3. Pertanyaan Pemantik',
      title: 'Pertanyaan Pemantik Diskusi',
      bullets: [
        '1. Apakah seorang pelari 100 meter di lintasan lurus selalu mengalami GLB?',
        '2. Apa perbedaan fisik antara pembacaan speedometer dan perpindahan pada peta?',
        '3. Mengapa tidak ada kendaraan di jalan raya biasa yang bisa 100% bergerak GLB selamanya?'
      ],
      teacherNotes: 'Gunakan pertanyaan ini untuk menggugah rasa ingin tahu dan nalar kritis murid.'
    },
    {
      id: 4,
      category: '4. Tujuan Pembelajaran',
      title: 'Tujuan Pembelajaran Fase E',
      bullets: [
        '• Peserta didik mampu membedakan konsep jarak dan perpindahan secara ilmiah.',
        '• Peserta didik mampu merumuskan hubungan matematis posisi, kecepatan, dan waktu pada GLB.',
        '• Peserta didik mampu membaca, membuat, dan menafsirkan grafik s-t, v-t, dan a-t.',
        '• Peserta didik mampu membuktikan sifat GLB melalui eksperimen rel udara virtual.'
      ],
      teacherNotes: 'Jelaskan kriteria ketercapaian tujuan pembelajaran kepada peserta didik.'
    },
    {
      id: 5,
      category: '5. Konsep Dasar',
      title: 'Jarak vs Perpindahan',
      bullets: [
        'Jarak (Distance - s): Besaran skalar, panjang seluruh lintasan, bernilai selalu positif.',
        'Perpindahan (Displacement - Δx): Besaran vektor, selisih kedudukan akhir dan awal (Δx = x₂ - x₁), memiliki arah (+/-).'
      ],
      interactiveChallenge: {
        question: 'Seorang murid berjalan 6 meter ke timur lalu 8 meter ke utara. Berapa jarak dan perpindahannya?',
        answer: 'Jarak = 6 + 8 = 14 meter. Perpindahan = √(6² + 8²) = √100 = 10 meter arah timur laut.'
      },
      teacherNotes: 'Tekankan perbedaan skalar dan vektor menggunakan teorema phytagoras sederhana.'
    },
    {
      id: 6,
      category: '6. Penjelasan Materi',
      title: 'Definisi & Karakteristik GLB',
      bullets: [
        '1. Lintasan berupa garis lurus dalam satu dimensi.',
        '2. Kecepatan (v) bernilai TETAP (konstan), baik besar maupun arahnya.',
        '3. Percepatan (a) sama dengan NOL (a = 0 m/s²).',
        '4. Menempuh jarak yang sama dalam setiap selang waktu yang sama.'
      ],
      teacherNotes: 'Tunjukkan kata kunci: lintasan lurus, kecepatan konstan, percepatan nol.'
    },
    {
      id: 7,
      category: '7. Persamaan & Rumus',
      title: 'Formulasi Matematis GLB',
      formula: 's = s₀ + v · t',
      bullets: [
        's = kedudukan akhir benda (meter)',
        's₀ = kedudukan awal benda (meter)',
        'v = kecepatan konstan (m/s)',
        't = waktu tempuh pengamatan (sekon)'
      ],
      teacherNotes: 'Jelaskan jika benda mulai dari titik acuan nol (s₀ = 0), maka s = v · t.'
    },
    {
      id: 8,
      category: '8. Ilustrasi Eksperimen',
      title: 'Eksperimen Rel Udara (Air Track)',
      bullets: [
        'Glider di atas bantalan udara bergerak hampir tanpa gaya gesek.',
        'Dua gerbang cahaya (photogate) mengukur waktu tempuh delta t.',
        'Hasil bagi jarak gerbang terhadap selang waktu selalu menghasilkan kecepatan yang identik.'
      ],
      teacherNotes: 'Hubungkan dengan fitur Virtual Lab 3D pada aplikasi Motion Lab.'
    },
    {
      id: 9,
      category: '9. Grafik Gerak GLB',
      title: 'Tiga Serangkai Grafik GLB',
      bullets: [
        '• Grafik s-t: Garis lurus miring. Gradiennya = kecepatan (v = Δs/Δt).',
        '• Grafik v-t: Garis mendatar sejajar sumbu t. Luas persegi panjang = perpindahan (s = v · t).',
        '• Grafik a-t: Berimpit tepat pada garis nol sumbu waktu (a = 0).'
      ],
      teacherNotes: 'Ajak murid menyimpulkan arti fisis kemiringan grafik posisi terhadap waktu.'
    },
    {
      id: 10,
      category: '10. Contoh Soal & Penyelesaian',
      title: 'Contoh Soal Pembahasan GLB',
      interactiveChallenge: {
        question: 'Sebuah mobil melaju dengan kecepatan konstan 72 km/jam di jalan tol lurus selama 15 menit. Berapakah jarak yang ditempuh mobil tersebut dalam satuan kilometer dan meter?',
        answer: 'Kecepatan v = 72 km/jam = 20 m/s. Waktu t = 15 menit = 0,25 jam = 900 s. Jarak s = 72 km/jam × 0,25 jam = 18 km (atau 20 m/s × 900 s = 18.000 meter).'
      },
      teacherNotes: 'Ingatkan murid selalu berhati-hati saat menyamakan satuan waktu (menit ke jam atau sekon).'
    },
    {
      id: 11,
      category: '11. Tantangan Analisis',
      title: 'Tantangan Gerak Dua Benda',
      interactiveChallenge: {
        question: 'Mobil A (v = 20 m/s) dan Mobil B (v = 30 m/s) bergerak searah dari titik awal yang sama. Mobil A berangkat 5 detik lebih dulu. Kapan dan di mana Mobil B menyusul Mobil A?',
        answer: 'Persamaan posisi: sA = 20(t + 5) = 20t + 100. sB = 30t. Saat menyusul sA = sB -> 20t + 100 = 30t -> 10t = 100 -> t = 10 sekon setelah B berangkat. Jarak susul = 30 × 10 = 300 meter!'
      },
      teacherNotes: 'Soal level HOTS untuk menguji kemampuan analitis aljabar gerak berpasangan.'
    },
    {
      id: 12,
      category: '12. Refleksi & Kesimpulan',
      title: 'Refleksi & Rangkuman Pembelajaran',
      bullets: [
        '1. GLB adalah gerak lurus dengan kecepatan konstan dan percepatan nol.',
        '2. Hubungan jarak dan waktu berbanding lurus linier.',
        '3. Kecepatan adalah kemiringan grafik s-t, sedangkan perpindahan adalah luas di bawah kurva v-t.',
        'Siap melangkah ke materi Gerak Lurus Berubah Beraturan (GLBB)!'
      ],
      teacherNotes: 'Tutup sesi pembelajaran GLB dan arahkan murid membuka Virtual Lab untuk membuktikan.'
    }
  ];

  // GLBB 12 Slides Deck
  const glbbSlides: Slide[] = [
    {
      id: 1,
      category: '1. Cover & Judul Materi',
      title: 'GERAK LURUS BERUBAH BERATURAN (GLBB)',
      subtitle: 'Fisika SMA Kelas X Fase E • Kurikulum Merdeka',
      bullets: [
        'Konsep Percepatan Konstan & Formulasi Gerak Dinamis',
        'Analisis Parabola s-t & Kemiringan v-t',
        'Simulasi & Evaluasi Terpadu'
      ],
      teacherNotes: 'Sambut murid dengan materi GLBB yang melibatkan perubahan kecepatan teratur.'
    },
    {
      id: 2,
      category: '2. Apersepsi',
      title: 'Sensasi Dorongan Pesawat Lepas Landas',
      subtitle: 'Mengapa tubuh kita terdorong ke belakang saat pesawat meluncur di landasan?',
      bullets: [
        'Mesin jet memberikan gaya dorong besar sehingga pesawat mengalami peningkatan kecepatan secara pesat.',
        'Perubahan kecepatan per satuan waktu inilah yang kita rasakan sebagai PERCEPATAN.',
        'Ketika percepatan bernilai tetap, terjadilah GLBB.'
      ],
      teacherNotes: 'Kaitkan dengan pengalaman murid naik kendaraan bermotor saat digas atau direm.'
    },
    {
      id: 3,
      category: '3. Pertanyaan Pemantik',
      title: 'Pertanyaan Pemantik GLBB',
      bullets: [
        '1. Jika kelajuan mobil digandakan menjadi 2 kali lipat, apakah jarak pengereman daruratnya juga menjadi 2 kali lipat? (Jawabannya: TIDAK, melainkan 4 kali lipat!)',
        '2. Mengapa apel jatuh dari pohon kecepatannya semakin lama semakin kencang?'
      ],
      teacherNotes: 'Tegaskan kaitan kuadratik s sebanding v² yang krusial untuk keselamatan berkendara.'
    },
    {
      id: 4,
      category: '4. Tujuan Pembelajaran',
      title: 'Tujuan Pembelajaran GLBB',
      bullets: [
        '• Mendefinisikan arti fisis percepatan dan lambang satuannya (m/s²).',
        '• Menurunkan dan menerapkan tiga persamaan utama GLBB.',
        '• Menganalisis grafik lengkung s-t, grafik garis miring v-t, dan garis datar a-t.',
        '• Membedakan kondisi GLBB dipercepat dan GLBB diperlambat secara vektor.'
      ],
      teacherNotes: 'Arahkan murid fokus pada penguasaan 3 rumus utama.'
    },
    {
      id: 5,
      category: '5. Konsep Dasar',
      title: 'Hakikat Percepatan (a)',
      bullets: [
        'Percepatan adalah besaran vektor yang menyatakan laju perubahan kecepatan terhadap waktu.',
        'Rumus dasar: a = Δv / Δt = (vₜ - v₀) / t',
        'Satuan SI: m/s² (artinya: kecepatan bertambah sekian m/s setiap satu detik).'
      ],
      teacherNotes: 'Latih pemahaman satuan m/s² sebagai (m/s)/s agar murid tidak sekadar menghafal rumus.'
    },
    {
      id: 6,
      category: '6. Penjelasan Materi',
      title: 'GLBB Dipercepat vs Diperlambat',
      bullets: [
        '• Dipercepat: arah vektor kecepatan dan percepatan SEARAH. Kelajuan semakin bertambah.',
        '• Diperlambat: arah vektor kecepatan dan percepatan BERLAWANAN. Kelajuan semakin berkurang.',
        'Penting: Jangan selalu menganggap percepatan negatif otomatis memperlambat tanpa melihat arah gerak!'
      ],
      teacherNotes: 'Ingatkan konvensi koordinat kartesius untuk menghindari miskonsepsi tanda minus.'
    },
    {
      id: 7,
      category: '7. Tiga Rumus Utama GLBB',
      title: 'Trisula Persamaan GLBB',
      formula: 'vₜ = v₀ + a·t  |  s = v₀·t + ½·a·t²  |  vₜ² = v₀² + 2·a·s',
      bullets: [
        '1. vₜ = v₀ + a·t -> jika jarak tempuh (s) tidak diketahui.',
        '2. s = v₀·t + ½·a·t² -> jika kecepatan akhir (vₜ) tidak diketahui.',
        '3. vₜ² = v₀² + 2·a·s -> jika waktu pengamatan (t) tidak diketahui.'
      ],
      teacherNotes: 'Berikan trik pemilihan rumus berdasarkan besaran yang diketahui dan ditanyakan.'
    },
    {
      id: 8,
      category: '8. Ilustrasi Eksperimen',
      title: 'Eksperimen Pita Ticker Timer',
      bullets: [
        'Ticker timer mengetik dengan frekuensi tetap (misal 50 Hz atau 50 ketukan per detik).',
        'Pada GLBB dipercepat, jarak antar titik semakin lama semakin MELEBAR.',
        'Pada GLBB diperlambat, jarak antar titik semakin lama semakin MERAPAT.'
      ],
      teacherNotes: 'Perlihatkan analogi pembacaan arah pita ticker timer dari titik awal ke titik akhir.'
    },
    {
      id: 9,
      category: '9. Analisis Grafik GLBB',
      title: 'Karakteristik Grafik GLBB',
      bullets: [
        '• Grafik s-t: Kurva lengkung parabola (karena ada komponen t²).',
        '• Grafik v-t: Garis lurus miring dengan gradien kemiringan = percepatan (a).',
        '• Luas trapesium di bawah garis v-t = jarak/perpindahan s.',
        '• Grafik a-t: Garis mendatar pada nilai percepatan konstan a.'
      ],
      teacherNotes: 'Ajak murid menghitung luas trapesium grafik v-t dan membandingkannya dengan rumus s.'
    },
    {
      id: 10,
      category: '10. Contoh Soal & Penyelesaian',
      title: 'Contoh Soal GLBB',
      interactiveChallenge: {
        question: 'Sebuah mobil mula-mula bergerak dengan kecepatan 10 m/s. Mobil dipercepat konstan 2 m/s² selama 5 detik. Berapakah kecepatan akhir dan jarak yang ditempuh mobil?',
        answer: '1. vₜ = v₀ + a·t = 10 + (2 × 5) = 20 m/s. 2. s = v₀·t + ½·a·t² = (10 × 5) + ½ · 2 · (5)² = 50 + 25 = 75 meter.'
      },
      teacherNotes: 'Uraikan langkah penyelesaian bertahap di papan digital.'
    },
    {
      id: 11,
      category: '11. Tantangan Analisis',
      title: 'Analisis Pengereman Darurat (HOTS)',
      interactiveChallenge: {
        question: 'Sebuah mobil berkecepatan 30 m/s direm dengan perlambatan maksimal 6 m/s². Berapakah jarak minimum yang dibutuhkan mobil sampai berhenti total?',
        answer: 'v₀ = 30 m/s, vₜ = 0 (berhenti), a = -6 m/s². Gunakan rumus bebas waktu: vₜ² = v₀² + 2as -> 0 = (30)² + 2(-6)s -> 12s = 900 -> s = 75 meter!'
      },
      teacherNotes: 'Diskusikan implikasi keselamatan lalu lintas: pentingnya menjaga jarak aman antar mobil di tol.'
    },
    {
      id: 12,
      category: '12. Refleksi & Rangkuman',
      title: 'Refleksi Akhir Kinematika Gerak Lurus',
      bullets: [
        '1. GLBB memiliki percepatan konstan yang mengubah kecepatan secara teratur.',
        '2. Pemilihan rumus GLBB bergantung pada data yang tersedia di soal.',
        '3. Kuasai keterkaitan antara simulasi 3D, representasi grafik, dan rumus matematis.',
        'Selamat, Anda telah menguasai fondasi Kinematika Gerak Lurus SMA Kelas X Fase E!'
      ],
      teacherNotes: 'Berikan apresiasi kepada seluruh murid atas keterlibatan aktif selama presentasi.'
    }
  ];

  const currentSlides = deck === 'GLB' ? glbSlides : glbbSlides;
  const currentSlide = currentSlides[currentSlideIndex] || currentSlides[0];

  const handleNext = () => {
    sounds.playClick();
    setShowAnswer(false);
    if (currentSlideIndex < currentSlides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    setShowAnswer(false);
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  // Keyboard navigation listener (ArrowRight / ArrowLeft / F for fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, currentSlides.length]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    sounds.playClick();
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Laser pointer mouse mover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!laserPointerActive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setLaserPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative min-h-screen bg-[#070b14] text-slate-100 flex flex-col ${
        isFullscreen ? 'p-6 sm:p-10 justify-between' : 'pt-16 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8'
      }`}
    >
      <div className="mx-auto w-full max-w-[1600px] flex flex-col flex-1">
        {/* Top Control Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Presentation className="h-4 w-4" /> SMART PRESENTATION
            </span>
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => {
                  sounds.playClick();
                  setDeck('GLB');
                  setCurrentSlideIndex(0);
                  setShowAnswer(false);
                }}
                className={`px-3 py-1 rounded font-bold transition ${
                  deck === 'GLB' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Paket GLB (12 Slide)
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setDeck('GLBB');
                  setCurrentSlideIndex(0);
                  setShowAnswer(false);
                }}
                className={`px-3 py-1 rounded font-bold transition ${
                  deck === 'GLBB' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Paket GLBB (12 Slide)
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Laser Pointer Mode */}
            <button
              onClick={() => {
                sounds.playClick();
                setLaserPointerActive(!laserPointerActive);
              }}
              title="Aktifkan Penunjuk Laser Merah (Whiteboard / PID)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                laserPointerActive
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm shadow-rose-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Crosshair className="h-3.5 w-3.5 text-rose-500" />
              <span>{laserPointerActive ? 'Laser ON' : 'Laser Pointer'}</span>
            </button>

            {/* Presenter Notes */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowPresenterNotes(!showPresenterNotes);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showPresenterNotes
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-purple-400" />
              <span>Catatan Guru</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="Layar Penuh (F11)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            >
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Keluar' : 'Layar Penuh'}</span>
            </button>
          </div>
        </div>

        {/* Laser Pointer Dot */}
        {laserPointerActive && (
          <div
            className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 opacity-90 shadow-lg shadow-rose-500/80 animate-ping z-50"
            style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
          />
        )}
        {laserPointerActive && (
          <div
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border border-rose-600 shadow-md z-50"
            style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
          />
        )}

        {/* Main Slide Card Container */}
        <div className="relative flex-1 rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0c1322] via-[#091120] to-[#070b14] p-6 sm:p-12 shadow-2xl flex flex-col justify-between overflow-hidden">
          {/* Top category pill & Slide counter */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
            <span className="text-xs font-bold text-cyan-400 font-mono tracking-wider">
              {currentSlide.category}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                Slide <strong className="text-white">{currentSlideIndex + 1}</strong> / {currentSlides.length}
              </span>
            </div>
          </div>

          {/* Slide Content Body */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {currentSlide.title}
              </h2>
              {currentSlide.subtitle && (
                <p className="text-base sm:text-xl text-cyan-300 font-semibold mt-2">
                  {currentSlide.subtitle}
                </p>
              )}
            </div>

            {/* Bullets List */}
            {currentSlide.bullets && (
              <div className="space-y-3 pt-2">
                {currentSlide.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0 mt-2" />
                    <p className="leading-relaxed">{bullet}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Formula Block */}
            {currentSlide.formula && (
              <div className="my-6 rounded-2xl border border-cyan-500/40 bg-slate-950/80 p-6 text-center font-mono text-xl sm:text-3xl font-extrabold text-cyan-300 tracking-wider shadow-inner">
                {currentSlide.formula}
              </div>
            )}

            {/* Interactive Question / Challenge with Reveal Answer */}
            {currentSlide.interactiveChallenge && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" /> Tantangan Diskusi Kelas
                  </span>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowAnswer(!showAnswer);
                    }}
                    className="flex items-center gap-1 text-xs text-amber-300 hover:text-white bg-amber-900/40 border border-amber-500/30 px-3 py-1 rounded-lg transition"
                  >
                    {showAnswer ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showAnswer ? 'Sembunyikan Solusi' : 'Tampilkan Solusi'}</span>
                  </button>
                </div>

                <p className="text-sm font-semibold text-white">
                  {currentSlide.interactiveChallenge.question}
                </p>

                {showAnswer && (
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-xs text-emerald-300 leading-relaxed font-mono">
                    <strong className="block text-emerald-400 mb-1">Kunci & Pembahasan:</strong>
                    {currentSlide.interactiveChallenge.answer}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Teacher Presenter Notes (Collapsible footer) */}
          {showPresenterNotes && (
            <div className="mt-6 rounded-xl border border-purple-500/30 bg-purple-950/30 p-3 text-xs text-purple-200">
              <strong className="block text-purple-300 mb-0.5">Panduan Guru (Presenter Notes):</strong>
              {currentSlide.teacherNotes}
            </div>
          )}

          {/* Slide Navigation Bottom Bar */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              disabled={currentSlideIndex === 0}
              onClick={handlePrev}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-30 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Quick Slide Dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {currentSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    sounds.playClick();
                    setCurrentSlideIndex(i);
                    setShowAnswer(false);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    i === currentSlideIndex
                      ? 'w-6 bg-cyan-400'
                      : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            <button
              disabled={currentSlideIndex === currentSlides.length - 1}
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 transition"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
