import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  BookmarkCheck, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  HelpCircle,
  Activity,
  Gauge,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { storage } from '../../utils/storage';

interface SubTopic {
  id: string;
  title: string;
  badge: string;
  summary: string;
  content: React.ReactNode;
  formulaBox?: {
    formula: string;
    description: string;
    symbols: { sym: string; name: string; unit: string; desc: string }[];
  };
  workedExample?: {
    question: string;
    given: string[];
    find: string;
    steps: string[];
    answer: string;
  };
  funFact: string;
  reflectionQuestion: string;
  miniQuiz: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

export const DigitalModule: React.FC = () => {
  const [selectedChapter, setSelectedChapter] = useState<'GLB' | 'GLBB'>('GLB');
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>(storage.getBookmarks());
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<any | null>(null);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Topics for Bab 1: GLB
  const glbTopics: SubTopic[] = [
    {
      id: 'glb-1',
      title: '1. Pengertian Gerak & Titik Acuan',
      badge: 'Konsep Dasar',
      summary: 'Memahami hakikat gerak sebagai perubahan posisi terhadap kerangka acuan tertentu.',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Dalam ilmu Fisika, suatu benda dikatakan <strong className="text-cyan-400">bergerak</strong> jika kedudukannya atau posisinya berubah terhadap suatu <strong className="text-white">titik acuan (reference point)</strong> dalam selang waktu tertentu.
          </p>
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-4">
            <h4 className="font-bold text-cyan-300 text-xs uppercase tracking-wider mb-1">Konsep Relativitas Gerak</h4>
            <p className="text-xs text-slate-300">
              Gerak bersifat <em>relatif</em>. Ketika Anda duduk di dalam kereta api yang melaju kencang, Anda berada dalam keadaan <strong>diam</strong> terhadap kursi kereta api, namun Anda sedang <strong>bergerak</strong> terhadap stasiun dan pepohonan di luar rel.
            </p>
          </div>
          <p>
            <strong>Gerak lurus</strong> adalah gerak suatu benda yang lintasannya berupa garis lurus dalam satu dimensi (sumbu x horizontal atau sumbu y vertikal).
          </p>
        </div>
      ),
      funFact: 'Penumpang pesawat berkecepatan 900 km/jam merasa seperti duduk tenang di ruang tamu karena tidak ada percepatan dan titik acuan interior pesawat bergerak bersama penumpang.',
      reflectionQuestion: 'Sebutkan contoh benda di sekitar Anda yang diam menurut suatu acuan, tetapi bergerak menurut acuan yang lain!',
      miniQuiz: {
        question: 'Sebuah bus melaju di jalan raya. Manakah pernyataan berikut yang BENAR secara fisika?',
        options: [
          'Sopir bus bergerak relatif terhadap roda kemudi bus',
          'Pohon di pinggir jalan bergerak relatif terhadap penumpang bus',
          'Penumpang bus selalu bergerak relatif terhadap semua titik acuan di alam semesta',
          'Gerak tidak memerlukan titik acuan untuk didefinisikan'
        ],
        correct: 1,
        explanation: 'Menurut kerangka acuan penumpang di dalam bus yang bergerak, pepohonan dan tiang listrik di pinggir jalan terlihat bergerak mendekat lalu menjauh.'
      }
    },
    {
      id: 'glb-2',
      title: '2. Jarak vs Perpindahan',
      badge: 'Besaran Fisis',
      summary: 'Perbedaan mendasar antara besaran skalar (jarak) dan besaran vektor (perpindahan).',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Seringkali orang menganggap jarak dan perpindahan adalah hal yang sama. Namun dalam Fisika, perbedaannya sangat tegas:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Jarak (Distance - s)</span>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                <li>• Besaran <strong>Skalar</strong> (hanya memiliki nilai/besar).</li>
                <li>• Panjang seluruh lintasan yang ditempuh benda.</li>
                <li>• Nilainya <strong>selalu positif</strong> (≥ 0).</li>
                <li>• Satuan SI: meter (m).</li>
              </ul>
            </div>
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Perpindahan (Displacement - Δx)</span>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                <li>• Besaran <strong>Vektor</strong> (memiliki nilai dan arah).</li>
                <li>• Perubahan posisi dari posisi awal ke posisi akhir: <code>Δx = x₂ - x₁</code>.</li>
                <li>• Bernilai <strong>positif</strong> (ke kanan/atas) atau <strong>negatif</strong> (ke kiri/bawah).</li>
                <li>• Satuan SI: meter (m).</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Contoh nyata: Jika seorang atlet lari mengelilingi lapangan sejauh 400 meter dan kembali tepat ke garis start, maka jarak yang ditempuhnya adalah <strong>400 meter</strong>, tetapi perpindahannya adalah <strong>0 meter</strong>!
          </p>
        </div>
      ),
      formulaBox: {
        formula: 'Δx = x₂ - x₁',
        description: 'Perpindahan 1 Dimensi sebagai selisih posisi akhir dan posisi awal',
        symbols: [
          { sym: 'Δx', name: 'Perpindahan', unit: 'm (meter)', desc: 'Vektor perubahan posisi benda' },
          { sym: 'x₂', name: 'Posisi Akhir', unit: 'm (meter)', desc: 'Koordinat kedudukan akhir benda pada sumbu acuan' },
          { sym: 'x₁', name: 'Posisi Awal', unit: 'm (meter)', desc: 'Koordinat kedudukan awal benda pada sumbu acuan' },
        ]
      },
      workedExample: {
        question: 'Sebuah mobil mainan bergerak ke arah kanan sejauh 15 meter dari titik asal (0), kemudian berbalik arah ke kiri sejauh 20 meter. Tentukan jarak total dan perpindahan mobil mainan tersebut!',
        given: ['Posisi awal x₀ = 0 m', 'Lintasan 1: ke kanan d₁ = +15 m', 'Lintasan 2: ke kiri d₂ = -20 m'],
        find: 'Jarak (s) dan Perpindahan (Δx)',
        steps: [
          'Langkah 1 (Jarak): Jumlahkan seluruh panjang lintasan tanpa memperhatikan tanda: s = |d₁| + |d₂| = 15 m + 20 m = 35 meter.',
          'Langkah 2 (Posisi akhir): x_akhir = 0 + 15 - 20 = -5 meter (5 meter di sebelah kiri titik asal).',
          'Langkah 3 (Perpindahan): Δx = x_akhir - x_awal = -5 m - 0 m = -5 meter (arah ke kiri).'
        ],
        answer: 'Jarak total = 35 meter; Perpindahan = -5 meter (ke arah kiri).'
      },
      funFact: 'Odometer pada dashboard kendaraan mengukur JARAK tempuh (selalu bertambah), sedangkan sistem navigasi GPS menghitung PERPINDAHAN dan rute vektor.',
      reflectionQuestion: 'Apakah mungkin jarak yang ditempuh suatu benda bernilai lebih kecil daripada besar perpindahannya? Jelaskan penalaranmu!',
      miniQuiz: {
        question: 'Seorang murid berjalan 8 meter ke timur, kemudian berbalik 6 meter ke barat. Besar perpindahan murid tersebut adalah...',
        options: ['14 meter ke timur', '2 meter ke timur', '2 meter ke barat', '48 meter ke timur'],
        correct: 1,
        explanation: 'Perpindahan adalah posisi akhir dikurangi posisi awal: +8 m + (-6 m) = +2 meter (2 meter ke arah timur).'
      }
    },
    {
      id: 'glb-3',
      title: '3. Kelajuan vs Kecepatan',
      badge: 'Besaran Fisis',
      summary: 'Membedakan besaran skalar kelajuan (speed) dan besaran vektor kecepatan (velocity).',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Sama seperti jarak dan perpindahan, dalam fisika terdapat dua istilah yang sangat berbeda untuk laju gerak:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Kelajuan (Speed - v)</span>
              <p className="text-xs text-slate-300 mt-2">
                Kelajuan adalah rasio jarak total terhadap waktu tempuh. Merupakan besaran <strong>skalar</strong> yang selalu bernilai non-negatif.
              </p>
              <div className="mt-2 font-mono text-xs text-sky-300 bg-sky-950/40 p-2 rounded">
                v = jarak / waktu = s / t
              </div>
            </div>
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Kecepatan (Velocity - v⃗)</span>
              <p className="text-xs text-slate-300 mt-2">
                Kecepatan adalah rasio perpindahan terhadap selang waktu. Merupakan besaran <strong>vektor</strong> yang memiliki nilai dan arah gerak.
              </p>
              <div className="mt-2 font-mono text-xs text-cyan-300 bg-cyan-950/40 p-2 rounded">
                v⃗ = perpindahan / selang waktu = Δx / Δt
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Speedometer pada sepeda motor mengukur <em>kelajuan sesaat</em> karena jarum hanya menunjukkan angka positif tanpa indikator arah mata angin.
          </p>
        </div>
      ),
      formulaBox: {
        formula: 'v = Δx / Δt',
        description: 'Persamaan Kecepatan Rata-rata pada Gerak Satu Dimensi',
        symbols: [
          { sym: 'v', name: 'Kecepatan', unit: 'm/s (meter per sekon)', desc: 'Laju perpindahan posisi tiap satuan waktu' },
          { sym: 'Δx', name: 'Perpindahan', unit: 'm', desc: 'Perubahan koordinat posisi (x₂ - x₁)' },
          { sym: 'Δt', name: 'Selang Waktu', unit: 's (sekon)', desc: 'Durasi waktu pengamatan (t₂ - t₁)' },
        ]
      },
      workedExample: {
        question: 'Sebuah perahu menempuh jarak 120 meter ke arah utara dalam waktu 15 sekon. Berapakah kecepatan perahu tersebut?',
        given: ['Perpindahan Δx = +120 m (ke utara)', 'Selang waktu Δt = 15 s'],
        find: 'Kecepatan perahu (v)',
        steps: [
          'Gunakan rumus v = Δx / Δt',
          'v = 120 m / 15 s = 8 m/s ke arah utara.'
        ],
        answer: 'Kecepatan perahu adalah 8 m/s ke arah utara.'
      },
      funFact: 'Konversi satuan praktis: 36 km/jam = 36 × (1000 m / 3600 s) = 10 m/s. Rumus cepatnya: bagi nilai km/jam dengan 3,6 untuk mendapatkan m/s!',
      reflectionQuestion: 'Mengapa mobil yang melaju di lintasan bundaran dengan kelajuan konstan 40 km/jam dikatakan memiliki kecepatan yang BERUBAH?',
      miniQuiz: {
        question: 'Jika nilai kecepatan suatu benda bertanda negatif (misalnya v = -15 m/s), artinya adalah...',
        options: [
          'Benda bergerak semakin lambat hingga berhenti',
          'Benda bergerak ke arah yang berlawanan dengan arah acuan positif',
          'Benda memiliki kelajuan di bawah nol',
          'Terjadi kesalahan dalam alat ukur'
        ],
        correct: 1,
        explanation: 'Tanda minus (-) pada besaran vektor kecepatan menunjukkan arah gerak yang berlawanan dengan konvensi arah positif pada sistem koordinat.'
      }
    },
    {
      id: 'glb-4',
      title: '4. Karakteristik & Persamaan GLB',
      badge: 'Persamaan Utama',
      summary: 'Ciri utama Gerak Lurus Beraturan: kecepatan konstan dan percepatan nol.',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-cyan-400">Gerak Lurus Beraturan (GLB)</strong> adalah gerak suatu benda pada lintasan lurus dengan <strong>kecepatan tetap (konstan)</strong>.
          </p>
          <div className="rounded-xl border border-cyan-500/40 bg-slate-900/80 p-4">
            <h4 className="font-bold text-cyan-300 text-xs mb-2">Ciri-Ciri Utama GLB:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/20">
                <span className="font-bold text-white block mb-1">1. Lintasan Lurus</span>
                Arah gerak tidak berbelok atau melengkung.
              </div>
              <div className="bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/20">
                <span className="font-bold text-white block mb-1">2. Kecepatan Tetap</span>
                v = konstan, besar & arahnya tidak berubah.
              </div>
              <div className="bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/20">
                <span className="font-bold text-white block mb-1">3. Percepatan Nol</span>
                a = 0 m/s², tidak ada percepatan maupun perlambatan.
              </div>
            </div>
          </div>
          <p>
            Karena kecepatannya tetap, benda menempuh <strong>jarak yang sama dalam setiap selang waktu yang sama</strong>. Jika pada 1 detik pertama benda menempuh 5 m, maka pada 1 detik kedua benda juga menempuh 5 m, begitu seterusnya.
          </p>
        </div>
      ),
      formulaBox: {
        formula: 's = s₀ + v · t',
        description: 'Persamaan Posisi GLB terhadap Waktu',
        symbols: [
          { sym: 's', name: 'Posisi Akhir', unit: 'm', desc: 'Kedudukan benda setelah bergerak selama t detik' },
          { sym: 's₀', name: 'Posisi Awal', unit: 'm', desc: 'Kedudukan awal benda saat t = 0' },
          { sym: 'v', name: 'Kecepatan Konstan', unit: 'm/s', desc: 'Laju perpindahan konstan' },
          { sym: 't', name: 'Waktu Tempuh', unit: 's', desc: 'Durasi waktu pengamatan gerak' },
        ]
      },
      workedExample: {
        question: 'Sebuah kereta eksperimen GLB berada pada posisi awal x₀ = 0 m. Kereta bergerak dengan kecepatan konstan v = 5 m/s selama t = 10 sekon. Tentukan posisi akhir kereta dan percepatannya!',
        given: ['Posisi awal x₀ = 0 m', 'Kecepatan v = 5 m/s (konstan)', 'Waktu t = 10 s'],
        find: 'Posisi akhir (x) dan percepatan (a)',
        steps: [
          'Pada GLB, kecepatan konstan sehingga percepatan a = 0 m/s².',
          'Gunakan persamaan GLB: x = x₀ + v · t',
          'x = 0 + (5 m/s × 10 s) = 50 meter.'
        ],
        answer: 'Posisi akhir kereta adalah 50 meter dan percepatannya a = 0 m/s².'
      },
      funFact: 'Konveyor pengambil bagasi di bandara dirancang menggunakan prinsip GLB agar penumpang dapat mengambil barang bawaan dengan aman dan stabil.',
      reflectionQuestion: 'Apa yang terjadi pada gerak benda jika resultan gaya total yang bekerja pada benda sama dengan nol (Hukum I Newton)? Hubungkan dengan GLB!',
      miniQuiz: {
        question: 'Sebuah mobil bergerak lurus beraturan dengan kecepatan 72 km/jam. Jarak yang ditempuh mobil selama 20 detik adalah...',
        options: ['200 meter', '400 meter', '1.440 meter', '720 meter'],
        correct: 1,
        explanation: 'Konversi dulu ke satuan SI: v = 72 km/jam = 72 / 3,6 = 20 m/s. Maka s = v × t = 20 m/s × 20 s = 400 meter.'
      }
    },
    {
      id: 'glb-5',
      title: '5. Analisis Grafik GLB (s-t, v-t, a-t)',
      badge: 'Representasi Visual',
      summary: 'Membaca dan menafsirkan grafik posisi, kecepatan, dan percepatan pada GLB.',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Grafik kinematika sangat penting untuk memvisualisasikan gerak tanpa harus menghitung rumit:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-3">
              <span className="text-xs font-bold text-cyan-400 block mb-1">1. Grafik s - t</span>
              <p className="text-xs text-slate-300">
                Berupa <strong>garis lurus miring</strong> dengan kemiringan konstan. 
                Kemiringan (gradien) garis menyatakan besar kecepatan: <code>gradien = Δs/Δt = v</code>.
              </p>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-3">
              <span className="text-xs font-bold text-cyan-400 block mb-1">2. Grafik v - t</span>
              <p className="text-xs text-slate-300">
                Berupa <strong>garis lurus mendatar (horizontal)</strong> sejajar sumbu waktu karena v konstan.
                Luas di bawah garis grafik v-t sama dengan jarak/perpindahan: <code>Luas = v × t = s</code>.
              </p>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-3">
              <span className="text-xs font-bold text-cyan-400 block mb-1">3. Grafik a - t</span>
              <p className="text-xs text-slate-300">
                Berupa <strong>garis lurus tepat berimpit pada sumbu waktu (a = 0)</strong> karena benda tidak mengalami percepatan.
              </p>
            </div>
          </div>
        </div>
      ),
      funFact: 'Pada grafik s-t, semakin curam kemiringan garis grafik, semakin cepat benda bergerak!',
      reflectionQuestion: 'Jika grafik s-t berupa garis lurus mendatar sejajar sumbu waktu, apa arti fisis dari keadaan benda tersebut?',
      miniQuiz: {
        question: 'Pada grafik kecepatan terhadap waktu (v-t) untuk GLB, perpindahan yang ditempuh benda diwakili oleh...',
        options: [
          'Gradien atau kemiringan garis grafik',
          'Luas daerah di bawah kurva grafik v-t',
          'Titik potong grafik dengan sumbu vertikal',
          'Panjang diagonal grafik'
        ],
        correct: 1,
        explanation: 'Luas daerah persegi panjang di bawah kurva v-t adalah panjang × lebar = v × t, yang secara matematis sama dengan perpindahan s.'
      }
    }
  ];

  // Topics for Bab 2: GLBB
  const glbbTopics: SubTopic[] = [
    {
      id: 'glbb-1',
      title: '1. Pengertian GLBB & Konsep Percepatan',
      badge: 'Konsep Dasar',
      summary: 'Percepatan konstan sebagai penyebab perubahan kecepatan yang teratur tiap satuan waktu.',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-orange-400">Gerak Lurus Berubah Beraturan (GLBB)</strong> adalah gerak benda pada lintasan lurus dengan <strong>percepatan tetap (konstan)</strong>.
          </p>
          <div className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-4">
            <h4 className="font-bold text-orange-300 text-xs mb-1 uppercase tracking-wider">Arti Fisis Percepatan (Acceleration - a)</h4>
            <p className="text-xs text-slate-300">
              Percepatan adalah laju perubahan kecepatan terhadap waktu: <code>a = Δv / Δt = (vₜ - v₀) / t</code>. Satuan SI percepatan adalah <strong>meter per sekon kuadrat (m/s²)</strong>.
            </p>
          </div>
          <p>
            Jika sebuah mobil memiliki percepatan <strong>2 m/s²</strong>, artinya kecepatan mobil tersebut <strong>bertambah sebesar 2 m/s setiap 1 sekon</strong>.
          </p>
        </div>
      ),
      formulaBox: {
        formula: 'a = (vₜ - v₀) / t',
        description: 'Definisi Percepatan Rata-rata pada Lintasan Lurus',
        symbols: [
          { sym: 'a', name: 'Percepatan', unit: 'm/s²', desc: 'Perubahan kecepatan tiap satu sekon' },
          { sym: 'vₜ', name: 'Kecepatan Akhir', unit: 'm/s', desc: 'Kecepatan benda saat waktu t' },
          { sym: 'v₀', name: 'Kecepatan Awal', unit: 'm/s', desc: 'Kecepatan benda pada saat t = 0' },
          { sym: 't', name: 'Waktu', unit: 's', desc: 'Durasi waktu perubahan kecepatan' },
        ]
      },
      workedExample: {
        question: 'Sebuah sepeda motor mula-mula bergerak dengan kecepatan 10 m/s. Pengendara menarik tuas gas sehingga dalam waktu 5 detik kecepatannya bertambah menjadi 25 m/s. Berapakah percepatan sepeda motor tersebut?',
        given: ['Kecepatan awal v₀ = 10 m/s', 'Kecepatan akhir vₜ = 25 m/s', 'Waktu t = 5 s'],
        find: 'Percepatan (a)',
        steps: [
          'Gunakan rumus a = (vₜ - v₀) / t',
          'a = (25 m/s - 10 m/s) / 5 s',
          'a = 15 / 5 = 3 m/s².'
        ],
        answer: 'Percepatan motor adalah 3 m/s² (kecepatan bertambah 3 m/s tiap sekon).'
      },
      funFact: 'Gravitasi bumi di permukaan menyebabkan percepatan jatuh bebas sebesar kira-kira g ≈ 9,8 m/s² ke arah bawah.',
      reflectionQuestion: 'Bisakah sebuah benda memiliki kecepatan nol pada suatu saat tertentu tetapi percepatannya TIDAK nol? Berikan contohnya!',
      miniQuiz: {
        question: 'Suatu benda bergerak dengan percepatan 4 m/s². Jika kecepatan awalnya 2 m/s, maka kecepatannya setelah 3 detik adalah...',
        options: ['6 m/s', '10 m/s', '14 m/s', '24 m/s'],
        correct: 2,
        explanation: 'vₜ = v₀ + a·t = 2 + (4 × 3) = 2 + 12 = 14 m/s.'
      }
    },
    {
      id: 'glbb-2',
      title: '2. GLBB Dipercepat vs GLBB Diperlambat',
      badge: 'Klasifikasi Gerak',
      summary: 'Analisis arah vektor kecepatan dan percepatan pada kondisi dipercepat dan diperlambat.',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Berdasarkan perubahan nilainya, GLBB dibagi menjadi dua jenis penting:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">GLBB Dipercepat</span>
              <p className="text-xs text-slate-300 mt-2">
                Terjadi jika kecepatan benda bertambah besar seiring waktu. 
                Secara fisis, <strong>arah vektor percepatan (a⃗) searah dengan arah vektor kecepatan (v⃗)</strong>.
              </p>
              <div className="mt-2 text-[11px] text-emerald-300 font-mono bg-emerald-950/60 p-2 rounded">
                Contoh: Pesawat lepas landas, buah jatuh dari pohon.
              </div>
            </div>
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">GLBB Diperlambat</span>
              <p className="text-xs text-slate-300 mt-2">
                Terjadi jika kecepatan benda berkurang seiring waktu.
                Secara fisis, <strong>arah vektor percepatan (a⃗) berlawanan arah dengan arah vektor kecepatan (v⃗)</strong>.
              </p>
              <div className="mt-2 text-[11px] text-rose-300 font-mono bg-rose-950/60 p-2 rounded">
                Contoh: Mobil mengerem di lampu merah, bola dilempar ke atas.
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300">
            <strong>Peringatan Ilmiah:</strong> Jangan langsung menyamakan perlambatan dengan tanda minus tanpa melihat sistem koordinat! Sebuah benda yang bergerak ke kiri (v &lt; 0) jika diberi percepatan ke kiri (a &lt; 0) justru mengalami percepatan (kelajuannya bertambah)!
          </div>
        </div>
      ),
      funFact: 'Gaya pengereman darurat kereta cepat menggunakan rem regeneratif dan eddy current yang mampu menghasilkan perlambatan halus tanpa selip roda.',
      reflectionQuestion: 'Ketika Anda melempar koin vertikal ke atas, di titik tertinggi kecepatannya nol. Berapakah percepatannya saat itu?',
      miniQuiz: {
        question: 'Sebuah mobil melaju ke arah timur dengan kecepatan 20 m/s kemudian direm dengan perlambatan 2 m/s² hingga berhenti. Waktu yang diperlukan mobil hingga berhenti adalah...',
        options: ['5 sekon', '10 sekon', '20 sekon', '40 sekon'],
        correct: 1,
        explanation: 'Gunakan vₜ = v₀ - a·t. Saat berhenti vₜ = 0, maka 0 = 20 - 2·t -> 2·t = 20 -> t = 10 sekon.'
      }
    },
    {
      id: 'glbb-3',
      title: '3. Tiga Persamaan Keramat GLBB',
      badge: 'Persamaan Matematis',
      summary: 'Kombinasi tiga rumus utama untuk memecahkan persoalan gerak lurus berubah beraturan.',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Semua persoalan GLBB dapat diselesaikan dengan memilih rumus yang tepat dari tiga persamaan berikut:
          </p>
          <div className="space-y-3">
            <div className="rounded-xl border border-orange-500/30 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-orange-400">Persamaan 1: Hubungan Kecepatan & Waktu</span>
                <span className="text-[10px] text-slate-400 font-mono">Tanpa variabel jarak (s)</span>
              </div>
              <div className="font-mono text-base text-white font-bold bg-orange-950/40 p-2 rounded border border-orange-500/20">
                vₜ = v₀ + a · t
              </div>
            </div>

            <div className="rounded-xl border border-orange-500/30 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-orange-400">Persamaan 2: Hubungan Posisi/Jarak & Waktu</span>
                <span className="text-[10px] text-slate-400 font-mono">Tanpa variabel kecepatan akhir (vₜ)</span>
              </div>
              <div className="font-mono text-base text-white font-bold bg-orange-950/40 p-2 rounded border border-orange-500/20">
                s = s₀ + v₀ · t + ½ · a · t²
              </div>
            </div>

            <div className="rounded-xl border border-orange-500/30 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-orange-400">Persamaan 3: Persamaan Bebas Waktu</span>
                <span className="text-[10px] text-slate-400 font-mono">Digunakan saat waktu (t) tidak diketahui</span>
              </div>
              <div className="font-mono text-base text-white font-bold bg-orange-950/40 p-2 rounded border border-orange-500/20">
                vₜ² = v₀² + 2 · a · (s - s₀)
              </div>
            </div>
          </div>
        </div>
      ),
      formulaBox: {
        formula: 's = v₀ · t + ½ · a · t²',
        description: 'Persamaan Perpindahan GLBB dengan Percepatan Konstan',
        symbols: [
          { sym: 's', name: 'Perpindahan / Jarak', unit: 'm', desc: 'Jarak tempuh selama bergerak t sekon' },
          { sym: 'v₀', name: 'Kecepatan Awal', unit: 'm/s', desc: 'Kecepatan benda pada awal pengamatan' },
          { sym: 'a', name: 'Percepatan', unit: 'm/s²', desc: 'Laju penambahan kecepatan konstan' },
          { sym: 't', name: 'Waktu', unit: 's', desc: 'Durasi waktu pengamatan' },
        ]
      },
      workedExample: {
        question: 'Sebuah mobil eksperimen mula-mula diam (v₀ = 0). Mobil dipercepat dengan a = 2 m/s² selama t = 5 sekon. Berapakah kecepatan akhir dan posisi akhir yang dicapai mobil?',
        given: ['Posisi awal x₀ = 0 m', 'Kecepatan awal v₀ = 0 m/s (dari keadaan diam)', 'Percepatan a = 2 m/s²', 'Waktu t = 5 s'],
        find: 'Kecepatan akhir (vₜ) dan posisi akhir (x)',
        steps: [
          'Langkah 1 (Kecepatan akhir): vₜ = v₀ + a · t = 0 + (2 m/s² × 5 s) = 10 m/s.',
          'Langkah 2 (Posisi akhir): x = x₀ + v₀ · t + ½ · a · t²',
          'x = 0 + (0 × 5) + ½ · 2 · (5)² = 1 · 25 = 25 meter.'
        ],
        answer: 'Kecepatan akhir vₜ = 10 m/s dan posisi akhir x = 25 meter. (Sesuai dengan Benchmark Uji Ilmiah Validasi).'
      },
      funFact: 'Rumus vₜ² = v₀² + 2as merupakan turunan matematis langsung dari Hukum Kekekalan Energi Mekanik (Usaha = Perubahan Energi Kinetik: F·s = ½mvₜ² - ½mv₀²)!',
      reflectionQuestion: 'Jika waktu gerak digandakan (menjadi 2 kali semula), menjadi berapa kali lipat jarak tempuh benda yang mulai bergerak dari keadaan diam?',
      miniQuiz: {
        question: 'Sebuah benda bergerak dengan kecepatan awal 4 m/s dan percepatan 2 m/s². Berapakah perpindahan benda setelah bergerak selama 3 detik?',
        options: ['12 meter', '18 meter', '21 meter', '24 meter'],
        correct: 2,
        explanation: 's = v₀·t + ½·a·t² = (4 × 3) + (0.5 × 2 × 3²) = 12 + 9 = 21 meter (Validasi Uji GLBB Soal).'
      }
    },
    {
      id: 'glbb-4',
      title: '4. Analisis Grafik GLBB (s-t, v-t, a-t)',
      badge: 'Representasi Visual',
      summary: 'Karakteristik kurva parabola s-t, garis miring v-t, dan garis mendatar a-t.',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Representasi grafik pada GLBB memiliki ciri khas unik yang membedakannya dengan GLB:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-orange-500/30 bg-slate-900/60 p-3">
              <span className="text-xs font-bold text-orange-400 block mb-1">1. Grafik s - t (Parabola)</span>
              <p className="text-xs text-slate-300">
                Berupa <strong>kurva lengkung parabola</strong> karena posisi s sebanding dengan t² (kuadrat waktu). Lengkung membuka ke atas jika dipercepat (a &gt; 0).
              </p>
            </div>
            <div className="rounded-xl border border-orange-500/30 bg-slate-900/60 p-3">
              <span className="text-xs font-bold text-orange-400 block mb-1">2. Grafik v - t (Garis Miring)</span>
              <p className="text-xs text-slate-300">
                Berupa <strong>garis lurus miring</strong>. 
                Gradiennya menyatakan percepatan: <code>gradien = Δv / Δt = a</code>.
                Luas trapesium/segitiga di bawah grafik = perpindahan.
              </p>
            </div>
            <div className="rounded-xl border border-orange-500/30 bg-slate-900/60 p-3">
              <span className="text-xs font-bold text-orange-400 block mb-1">3. Grafik a - t (Mendatar)</span>
              <p className="text-xs text-slate-300">
                Berupa <strong>garis lurus mendatar</strong> sejajar sumbu t pada nilai tertentu (a ≠ 0), karena nilai percepatannya selalu konstan.
              </p>
            </div>
          </div>
        </div>
      ),
      funFact: 'Luas di bawah kurva grafik a-t terhadap waktu menghasilkan perubahan kecepatan (Δv = a × t)!',
      reflectionQuestion: 'Bagaimana bentuk grafik v-t jika suatu benda mengalami GLBB diperlambat sampai akhirnya berhenti?',
      miniQuiz: {
        question: 'Pada grafik kecepatan terhadap waktu (v-t) untuk GLBB, kemiringan (gradien) garis menyatakan...',
        options: ['Jarak tempuh', 'Kecepatan awal', 'Percepatan benda', 'Waktu henti'],
        correct: 2,
        explanation: 'Gradien = sumbu vertikal / sumbu horizontal = Δv / Δt, yang merupakan rumus dari percepatan (a).'
      }
    }
  ];

  const currentTopicList = selectedChapter === 'GLB' ? glbTopics : glbbTopics;
  const currentTopic = currentTopicList[activeTopicIndex] || currentTopicList[0];

  const handleSelectTopic = (index: number) => {
    sounds.playClick();
    setActiveTopicIndex(index);
    setQuizAnswer(null);
    setQuizSubmitted(false);
    setSelectedSymbol(null);
    setReflectionAnswer('');
    setReflectionSaved(false);
  };

  const handleToggleBookmark = (id: string) => {
    sounds.playClick();
    const updated = storage.toggleBookmark(id);
    setBookmarks(storage.getBookmarks());
  };

  const handleQuizSubmit = () => {
    if (quizAnswer === null) return;
    setQuizSubmitted(true);
    if (quizAnswer === currentTopic.miniQuiz.correct) {
      sounds.playSuccess();
      // mark topic completed
      const prog = storage.getProgress();
      if (!prog.modulesCompleted.includes(currentTopic.id)) {
        storage.saveProgress({
          modulesCompleted: [...prog.modulesCompleted, currentTopic.id]
        });
      }
    } else {
      sounds.playError();
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pt-16 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Module Header Bar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                BUKU AJAR DIGITAL FISIKA SMA KELAS X
              </span>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300 border border-cyan-500/30">
                Fase E • Merdeka
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-cyan-400" />
              Modul Digital Interaktif
            </h1>
          </div>

          {/* Chapter Selector Tabs */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedChapter('GLB');
                setActiveTopicIndex(0);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                selectedChapter === 'GLB'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>BAB 1: GLB</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedChapter('GLBB');
                setActiveTopicIndex(0);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                selectedChapter === 'GLBB'
                  ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Gauge className="h-4 w-4" />
              <span>BAB 2: GLBB</span>
            </button>
          </div>
        </div>

        {/* Content Layout: Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Daftar Isi {selectedChapter}
                </span>
                <span className="text-[10px] text-slate-400">
                  {activeTopicIndex + 1} dari {currentTopicList.length} Subbab
                </span>
              </div>

              <div className="space-y-1.5">
                {currentTopicList.map((topic, idx) => {
                  const isActive = idx === activeTopicIndex;
                  const isBookmarked = bookmarks.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => handleSelectTopic(idx)}
                      className={`w-full text-left rounded-xl p-3 text-xs transition flex items-center justify-between border ${
                        isActive
                          ? selectedChapter === 'GLB'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm shadow-cyan-500/20'
                            : 'bg-orange-500/20 border-orange-400 text-orange-300 font-bold shadow-sm shadow-orange-500/20'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${isActive ? (selectedChapter === 'GLB' ? 'bg-cyan-400' : 'bg-orange-400') : 'bg-slate-600'}`} />
                        <span className="line-clamp-1">{topic.title}</span>
                      </div>
                      {isBookmarked && (
                        <BookmarkCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Study Tip */}
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-slate-900/60 p-4 text-xs">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                <Lightbulb className="h-4 w-4" />
                <span>Tips Belajar Bermakna</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Kuasai makna fisis setiap rumus dengan mengklik simbol di kotak rumus. Setelah membaca subbab, uji pemahamanmu dengan mini kuis di bawah!
              </p>
            </div>
          </div>

          {/* Main Reading View */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-sm">
              {/* Top Meta Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedChapter === 'GLB'
                      ? 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30'
                      : 'text-orange-400 bg-orange-950/60 border-orange-500/30'
                  }`}>
                    {currentTopic.badge}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                    {currentTopic.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentTopic.summary}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleBookmark(currentTopic.id)}
                  title={bookmarks.includes(currentTopic.id) ? 'Hapus penanda' : 'Tandai halaman'}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition"
                >
                  {bookmarks.includes(currentTopic.id) ? (
                    <BookmarkCheck className="h-5 w-5 text-amber-400" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Main Text Content */}
              <div className="mb-6">
                {currentTopic.content}
              </div>

              {/* Interactive Formula Box (if present) */}
              {currentTopic.formulaBox && (
                <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/70 p-5 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Kotak Rumus Interaktif
                    </span>
                    <span className="text-[10px] text-slate-400">Klik simbol untuk detail arti</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center py-4 bg-slate-900/60 rounded-xl border border-slate-800 font-mono text-xl sm:text-2xl font-extrabold text-cyan-300 tracking-wide mb-3">
                    {currentTopic.formulaBox.formula}
                  </div>

                  <p className="text-xs text-slate-400 mb-3">
                    {currentTopic.formulaBox.description}
                  </p>

                  {/* Symbols Pill Row */}
                  <div className="flex flex-wrap gap-2">
                    {currentTopic.formulaBox.symbols.map((item) => (
                      <button
                        key={item.sym}
                        onClick={() => setSelectedSymbol(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                          selectedSymbol?.sym === item.sym
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-900 text-cyan-300 border-cyan-500/30 hover:border-cyan-400'
                        }`}
                      >
                        {item.sym}: {item.name}
                      </button>
                    ))}
                  </div>

                  {/* Symbol Detail Explanatory Box */}
                  {selectedSymbol && (
                    <div className="mt-3 rounded-xl border border-cyan-400/40 bg-cyan-950/30 p-3 text-xs text-slate-200">
                      <div className="font-bold text-cyan-300 flex items-center justify-between">
                        <span>{selectedSymbol.name} ({selectedSymbol.sym})</span>
                        <span className="font-mono text-cyan-400">Satuan SI: {selectedSymbol.unit}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{selectedSymbol.desc}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step-by-Step Worked Example (if present) */}
              {currentTopic.workedExample && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <CheckCircle className="h-4 w-4" /> Contoh Soal & Pembahasan Bertahap
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-white mb-3">
                    {currentTopic.workedExample.question}
                  </p>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs mb-3 space-y-1">
                    <span className="text-slate-400 font-bold block mb-1">Diketahui:</span>
                    {currentTopic.workedExample.given.map((g, i) => (
                      <div key={i} className="text-slate-300 font-mono">• {g}</div>
                    ))}
                    <div className="text-slate-400 font-bold pt-1">Ditanyakan: <span className="text-cyan-400 font-mono">{currentTopic.workedExample.find}</span></div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 mb-3">
                    <span className="text-slate-400 font-bold block">Langkah Penyelesaian:</span>
                    {currentTopic.workedExample.steps.map((st, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                        {st}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3 text-xs font-bold text-emerald-300">
                    Jawaban Akhir: {currentTopic.workedExample.answer}
                  </div>
                </div>
              )}

              {/* Fun Fact / Fakta Fisika */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 mb-6 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
                  <Lightbulb className="h-4 w-4" /> Fakta Fisika dalam Kehidupan
                </div>
                <p>{currentTopic.funFact}</p>
              </div>

              {/* Reflection Question (Deep Learning: Mindful) */}
              <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 mb-6 text-xs">
                <div className="flex items-center gap-2 font-bold text-purple-300 mb-1">
                  <HelpCircle className="h-4 w-4" /> Refleksi Pemahaman (Mindful Learning)
                </div>
                <p className="text-slate-300 mb-2">{currentTopic.reflectionQuestion}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reflectionAnswer}
                    onChange={(e) => setReflectionAnswer(e.target.value)}
                    placeholder="Tuliskan refleksimu di sini..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setReflectionSaved(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                  >
                    Simpan
                  </button>
                </div>
                {reflectionSaved && (
                  <p className="text-[11px] text-purple-300 mt-1.5 font-medium">
                    Refleksi berhasil disimpan ke portofolio belajar!
                  </p>
                )}
              </div>

              {/* Mini Quiz */}
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Mini Quiz Pemahaman
                  </span>
                  <span className="text-[10px] text-slate-400">1 Pertanyaan Kunci</span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-white mb-3">
                  {currentTopic.miniQuiz.question}
                </p>

                <div className="space-y-2 mb-4">
                  {currentTopic.miniQuiz.options.map((opt, i) => {
                    const isSelected = quizAnswer === i;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (!quizSubmitted) {
                            sounds.playClick();
                            setQuizAnswer(i);
                          }
                        }}
                        className={`w-full text-left rounded-xl p-3 text-xs transition border flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white font-semibold'
                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{opt}</span>
                        <span className="font-mono text-slate-500">{String.fromCharCode(65 + i)}</span>
                      </button>
                    );
                  })}
                </div>

                {!quizSubmitted ? (
                  <button
                    disabled={quizAnswer === null}
                    onClick={handleQuizSubmit}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 transition"
                  >
                    Periksa Jawaban
                  </button>
                ) : (
                  <div className={`rounded-xl p-4 text-xs ${
                    quizAnswer === currentTopic.miniQuiz.correct
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      {quizAnswer === currentTopic.miniQuiz.correct ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span>Jawaban Benar! Luar Biasa.</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-rose-400" />
                          <span>Jawaban Kurang Tepat. Coba cermati lagi konsepnya!</span>
                        </>
                      )}
                    </div>
                    <p className="text-slate-300 mt-1">{currentTopic.miniQuiz.explanation}</p>
                  </div>
                )}
              </div>

              {/* Bottom Pagination Controls */}
              <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-5">
                <button
                  disabled={activeTopicIndex === 0}
                  onClick={() => handleSelectTopic(activeTopicIndex - 1)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-30 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Subbab Sebelumnya</span>
                </button>

                <button
                  disabled={activeTopicIndex === currentTopicList.length - 1}
                  onClick={() => handleSelectTopic(activeTopicIndex + 1)}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-30 transition"
                >
                  <span>Subbab Selanjutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
