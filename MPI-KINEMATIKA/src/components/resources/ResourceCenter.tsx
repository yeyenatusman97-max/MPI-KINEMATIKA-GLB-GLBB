import React, { useState } from 'react';
import { 
  FolderArchive, 
  BookOpen, 
  FileText, 
  Image as ImageIcon, 
  Volume2, 
  Download, 
  Search, 
  Printer, 
  Sparkles, 
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export const ResourceCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'glossary' | 'formulas' | 'gallery' | 'audio' | 'lkpd'>('glossary');
  const [glossarySearch, setGlossarySearch] = useState('');
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<any | null>(null);

  // Kamus Istilah Kinematika
  const glossary = [
    { term: 'Titik Acuan (Reference Point)', desc: 'Suatu titik atau posisi patokan awal yang digunakan untuk menentukan apakah sebuah benda mengalami perubahan kedudukan atau gerak.' },
    { term: 'Jarak (Distance)', desc: 'Panjang total seluruh lintasan yang ditempuh oleh suatu objek yang bergerak. Merupakan besaran skalar dan selalu bernilai positif.' },
    { term: 'Perpindahan (Displacement)', desc: 'Perubahan kedudukan benda dihitung dari posisi awal langsung ke posisi akhir dalam garis lurus. Merupakan besaran vektor (memiliki nilai dan arah).' },
    { term: 'Kelajuan (Speed)', desc: 'Jarak yang ditempuh tiap satu satuan waktu (v = s/t). Besaran skalar, selalu positif.' },
    { term: 'Kecepatan (Velocity)', desc: 'Perpindahan posisi tiap satu satuan waktu (v⃗ = Δx/Δt). Besaran vektor yang dapat bernilai positif atau negatif.' },
    { term: 'Kecepatan Sesaat', desc: 'Kecepatan benda pada satu waktu tertentu yang sangat singkat (limit Δt mendekati nol).' },
    { term: 'Percepatan (Acceleration)', desc: 'Laju perubahan kecepatan terhadap waktu (a = Δv/Δt). Satuan SI adalah meter per sekon kuadrat (m/s²).' },
    { term: 'GLB (Gerak Lurus Beraturan)', desc: 'Gerak benda pada lintasan lurus dengan kecepatan tetap (konstan) dan percepatan sama dengan nol.' },
    { term: 'GLBB (Gerak Lurus Berubah Beraturan)', desc: 'Gerak benda pada lintasan lurus dengan percepatan tetap (konstan).' },
    { term: 'Rel Udara (Air Track)', desc: 'Alat laboratorium fisika berupa rel berlubang halus yang meniupkan udara untuk meminimalisir gaya gesek pada kereta/glider hingga mendekati nol.' },
    { term: 'Ticker Timer', desc: 'Alat perekam gerak berupa pita kertas dan jarum ketuk berfrekuensi konstan (misal 50 Hz) untuk menganalisis sifat GLB dan GLBB.' },
    { term: 'Gerbang Cahaya (Photogate)', desc: 'Sensor optik inframerah yang mendeteksi benda saat memotong berkas cahaya untuk mengukur selang waktu dengan presisi milisekon.' }
  ];

  const filteredGlossary = glossary.filter((g) =>
    g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    g.desc.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  // Gallery of Kinematics Experiments
  const galleryItems = [
    {
      id: 1,
      title: 'Pita Ticker Timer: GLB vs GLBB',
      category: 'Eksperimen',
      desc: 'Pola titik dengan spasi seragam (GLB) berbanding pola titik yang semakin renggang (GLBB dipercepat).',
      svgVisual: (
        <svg viewBox="0 0 300 120" className="w-full h-auto bg-slate-950 rounded-xl p-2 border border-slate-800">
          <text x="10" y="24" fill="#38bdf8" fontSize="10" fontFamily="monospace">Pita GLB: Spasi Konstan (v tetap)</text>
          <line x1="20" y1="40" x2="280" y2="40" stroke="#475569" strokeWidth="2" strokeDasharray="3,3" />
          {[30, 70, 110, 150, 190, 230, 270].map((cx, i) => (
            <circle key={i} cx={cx} cy="40" r="3.5" fill="#38bdf8" />
          ))}
          <text x="10" y="74" fill="#fb923c" fontSize="10" fontFamily="monospace">Pita GLBB: Spasi Melebar (a tetap)</text>
          <line x1="20" y1="95" x2="280" y2="95" stroke="#475569" strokeWidth="2" strokeDasharray="3,3" />
          {[30, 45, 70, 105, 155, 220, 280].map((cx, i) => (
            <circle key={i} cx={cx} cy="95" r="3.5" fill="#fb923c" />
          ))}
        </svg>
      )
    },
    {
      id: 2,
      title: 'Diagram Vektor Kecepatan & Percepatan',
      category: 'Konseptual',
      desc: 'Visualisasi arah panah vektor v⃗ dan a⃗ pada GLBB dipercepat (searah) dan diperlambat (berlawanan).',
      svgVisual: (
        <svg viewBox="0 0 300 120" className="w-full h-auto bg-slate-950 rounded-xl p-2 border border-slate-800">
          <text x="10" y="20" fill="#22c55e" fontSize="10" fontFamily="monospace">Dipercepat (a searah v):</text>
          <rect x="20" y="30" width="30" height="15" rx="3" fill="#0284c7" />
          {/* Velocity arrow */}
          <line x1="55" y1="37" x2="110" y2="37" stroke="#22c55e" strokeWidth="3" markerEnd="url(#arrow)" />
          <text x="115" y="40" fill="#22c55e" fontSize="9" fontFamily="monospace">v⃗</text>
          {/* Acceleration arrow */}
          <line x1="55" y1="48" x2="95" y2="48" stroke="#f97316" strokeWidth="2" />
          <text x="100" y="52" fill="#f97316" fontSize="9" fontFamily="monospace">a⃗</text>

          <text x="10" y="75" fill="#ef4444" fontSize="10" fontFamily="monospace">Diperlambat (a melawan v):</text>
          <rect x="200" y="85" width="30" height="15" rx="3" fill="#ea580c" />
          <line x1="235" y1="92" x2="280" y2="92" stroke="#22c55e" strokeWidth="3" />
          <text x="285" y="95" fill="#22c55e" fontSize="9" fontFamily="monospace">v⃗</text>
          <line x1="195" y1="92" x2="165" y2="92" stroke="#ef4444" strokeWidth="2" />
          <text x="145" y="95" fill="#ef4444" fontSize="9" fontFamily="monospace">a⃗</text>
        </svg>
      )
    }
  ];

  // Audio Narration Playlist
  const audioList = [
    { id: 1, title: 'Ringkasan Inti Konsep GLB & Kecepatan Konstan', duration: '03:15' },
    { id: 2, title: 'Menaklukkan Tiga Rumus Utama GLBB', duration: '04:20' },
    { id: 3, title: 'Membaca Arti Fisik Kemiringan & Luas Grafik Gerak', duration: '03:45' }
  ];

  const handleToggleAudio = (idx: number) => {
    sounds.playClick();
    if (playingAudioIndex === idx) {
      setPlayingAudioIndex(null);
    } else {
      setPlayingAudioIndex(idx);
    }
  };

  const handlePrintLKPD = () => {
    sounds.playClick();
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pt-16 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono">
              PUSAT SUMBER BELAJAR
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2 mt-1">
              <FolderArchive className="h-7 w-7 text-teal-400" />
              Perpustakaan & Sumber Belajar
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Kamus istilah, rangkuman rumus cepat, galeri ilustrasi, audio penjelasan, dan LKPD
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('glossary')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                activeTab === 'glossary' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kamus Istilah
            </button>
            <button
              onClick={() => setActiveTab('formulas')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                activeTab === 'formulas' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kumpulan Rumus
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                activeTab === 'gallery' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Galeri Ilustrasi
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                activeTab === 'audio' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Audio Narasi
            </button>
            <button
              onClick={() => setActiveTab('lkpd')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                activeTab === 'lkpd' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              LKPD Digital
            </button>
          </div>
        </div>

        {/* Tab 1: Kamus Istilah */}
        {activeTab === 'glossary' && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                placeholder="Cari istilah kinematika..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGlossary.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                  <h4 className="text-sm font-bold text-cyan-300 font-mono">{item.term}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Formula Cheat Sheet */}
        {activeTab === 'formulas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GLB Table */}
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-sm text-cyan-400 font-mono">FORMULA GLB (a = 0)</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">Kecepatan Konstan</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                    <span className="text-cyan-300 font-bold block text-sm mb-1">s = s₀ + v · t</span>
                    <span className="text-slate-400 text-[11px]">Posisi akhir terhadap waktu</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                    <span className="text-cyan-300 font-bold block text-sm mb-1">v = Δs / Δt</span>
                    <span className="text-slate-400 text-[11px]">Kecepatan rata-rata</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                    <span className="text-cyan-300 font-bold block text-sm mb-1">a = 0</span>
                    <span className="text-slate-400 text-[11px]">Percepatan selalu nol</span>
                  </div>
                </div>
              </div>

              {/* GLBB Table */}
              <div className="rounded-2xl border border-orange-500/30 bg-slate-900/70 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-sm text-orange-400 font-mono">FORMULA GLBB (a = konstan)</span>
                  <span className="text-[10px] bg-orange-950 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30">Percepatan Konstan</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                    <span className="text-orange-300 font-bold block text-sm mb-1">vₜ = v₀ + a · t</span>
                    <span className="text-slate-400 text-[11px]">Kecepatan akhir (tanpa variabel jarak)</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                    <span className="text-orange-300 font-bold block text-sm mb-1">s = s₀ + v₀·t + ½·a·t²</span>
                    <span className="text-slate-400 text-[11px]">Posisi akhir (tanpa variabel v akhir)</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                    <span className="text-orange-300 font-bold block text-sm mb-1">vₜ² = v₀² + 2·a·(s - s₀)</span>
                    <span className="text-slate-400 text-[11px]">Persamaan bebas waktu t</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Gallery */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {galleryItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  </div>
                  {item.svgVisual}
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Audio Narration */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-cyan-400" />
                Player Audio Narasi Penjelasan Konsep
              </h3>
              <p className="text-xs text-slate-400">
                Dengarkan intisari materi untuk mempermudah gaya belajar auditori di mana saja
              </p>

              <div className="space-y-3">
                {audioList.map((audio, idx) => {
                  const isPlaying = playingAudioIndex === idx;
                  return (
                    <div
                      key={audio.id}
                      className={`rounded-xl border p-4 flex items-center justify-between transition ${
                        isPlaying
                          ? 'bg-cyan-500/20 border-cyan-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleAudio(idx)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition"
                        >
                          {isPlaying ? <Pause className="h-5 w-5 fill-slate-950" /> : <Play className="h-5 w-5 fill-slate-950 ml-0.5" />}
                        </button>
                        <div>
                          <span className="text-xs font-bold block">{audio.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Durasi: {audio.duration}</span>
                        </div>
                      </div>

                      {isPlaying && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                          <span className="text-xs font-mono text-cyan-300">Memutar...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: LKPD Digital (Print Ready) */}
        {activeTab === 'lkpd' && (
          <div className="rounded-3xl border border-slate-800 bg-white text-slate-900 p-8 sm:p-12 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight">LEMBAR KERJA PESERTA DIDIK (LKPD) DIGITAL</h2>
                <p className="text-xs text-slate-600 font-semibold">Materi: Kinematika Gerak Lurus (GLB & GLBB) • Kelas X SMA Fase E</p>
              </div>
              <button
                onClick={handlePrintLKPD}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800 transition"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak / PDF</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b pb-4">
              <div>Nama Murid: ______________________</div>
              <div>Kelas / Kelompok: _________________</div>
              <div>Tanggal Praktikum: _______________</div>
              <div>Guru Pengampu: ___________________</div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <h3 className="font-bold text-sm uppercase">A. TUJUAN PRAKTIKUM VIRTUAL</h3>
              <p>1. Membuktikan karakteristik kecepatan konstan pada GLB menggunakan rel udara digital.</p>
              <p>2. Menentukan besar percepatan pada GLBB dari kemiringan grafik v-t dan tabel telemetri.</p>

              <h3 className="font-bold text-sm uppercase pt-2">B. TABEL PENGAMATAN MURID</h3>
              <table className="w-full border-collapse border border-slate-400 text-center font-mono text-[11px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-400 p-2">Percobaan</th>
                    <th className="border border-slate-400 p-2">Kecepatan Awal v₀ (m/s)</th>
                    <th className="border border-slate-400 p-2">Percepatan a (m/s²)</th>
                    <th className="border border-slate-400 p-2">Waktu t (s)</th>
                    <th className="border border-slate-400 p-2">Posisi Akhir x (m)</th>
                    <th className="border border-slate-400 p-2">Kecepatan Akhir vₜ (m/s)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 p-2">1 (GLB)</td>
                    <td className="border border-slate-400 p-2">5,0</td>
                    <td className="border border-slate-400 p-2">0,0</td>
                    <td className="border border-slate-400 p-2">10,0</td>
                    <td className="border border-slate-400 p-2">50,0</td>
                    <td className="border border-slate-400 p-2">5,0</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2">2 (GLBB)</td>
                    <td className="border border-slate-400 p-2">0,0</td>
                    <td className="border border-slate-400 p-2">2,0</td>
                    <td className="border border-slate-400 p-2">5,0</td>
                    <td className="border border-slate-400 p-2">25,0</td>
                    <td className="border border-slate-400 p-2">10,0</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2">3 (GLBB v₀)</td>
                    <td className="border border-slate-400 p-2">4,0</td>
                    <td className="border border-slate-400 p-2">2,0</td>
                    <td className="border border-slate-400 p-2">3,0</td>
                    <td className="border border-slate-400 p-2">21,0</td>
                    <td className="border border-slate-400 p-2">10,0</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="font-bold text-sm uppercase pt-2">C. KESIMPULAN ANALISIS</h3>
              <div className="h-20 border border-slate-300 rounded p-2 text-slate-400 italic">
                Tuliskan kesimpulan ilmiah kelompokmu di sini...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
