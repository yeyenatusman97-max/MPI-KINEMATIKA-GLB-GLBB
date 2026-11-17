import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Puzzle, 
  Sliders, 
  ChevronDown, 
  Atom, 
  PlayCircle, 
  RotateCcw, 
  Check, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface UIComponentShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialComponent?: string; // 'flip' | 'drag' | 'slider' | 'accordion' | 'infographic' | 'video'
}

export const UIComponentShowcaseModal: React.FC<UIComponentShowcaseModalProps> = ({
  isOpen,
  onClose,
  initialComponent = 'flip'
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialComponent);

  // 1. Flip card state
  const [isFlipped, setIsFlipped] = useState(false);

  // 2. Drag & Drop state
  const [items, setItems] = useState([
    { id: '1', text: 'Gaya Gesek Lantai', category: 'sentuh' },
    { id: '2', text: 'Gaya Gravitasi Bumi', category: 'taksentuh' },
    { id: '3', text: 'Gaya Tarik Tali (Tegangan)', category: 'sentuh' },
    { id: '4', text: 'Gaya Magnet Batang', category: 'taksentuh' },
    { id: '5', text: 'Gaya Dorong Tangan', category: 'sentuh' },
  ]);
  const [placed, setPlaced] = useState<{ [key: string]: 'sentuh' | 'taksentuh' }>({});
  const [dragCheckResult, setDragCheckResult] = useState<string | null>(null);

  // 3. Slider state
  const [massVal, setMassVal] = useState(5);
  const [muVal, setMuVal] = useState(0.2); // friction coefficient
  const normalForce = massVal * 9.8;
  const frictionForce = +(normalForce * muVal).toFixed(2);

  // 4. Accordion state
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  // 5. Video state
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoTimestamp, setVideoTimestamp] = useState(0);
  const [videoQuestionAnswered, setVideoQuestionAnswered] = useState(false);

  if (!isOpen) return null;

  const handleFlip = () => {
    sounds.playClick();
    setIsFlipped(!isFlipped);
  };

  const handlePlaceItem = (id: string, targetCategory: 'sentuh' | 'taksentuh') => {
    sounds.playClick();
    setPlaced(prev => ({ ...prev, [id]: targetCategory }));
  };

  const checkDragDrop = () => {
    let allCorrect = true;
    items.forEach(it => {
      if (placed[it.id] !== it.category) {
        allCorrect = false;
      }
    });
    if (Object.keys(placed).length < items.length) {
      setDragCheckResult('Belum semua item dikelompokkan!');
      sounds.playError();
      return;
    }
    if (allCorrect) {
      sounds.playSuccess();
      setDragCheckResult('Hebat! Semua konsep gaya sentuh dan tak-sentuh terkelompokkan dengan benar.');
    } else {
      sounds.playError();
      setDragCheckResult('Ada konsep yang belum tepat posisinya. Periksa kembali gaya medan vs gaya kontak!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border-2 border-indigo-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Komponen UI Unggulan Interactive Sandbox</h3>
              <p className="text-xs text-sky-100">Uji langsung 6 komponen interaktif media pembelajaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'flip', label: '1. Flip Card', icon: Layers },
            { id: 'drag', label: '2. Drag & Drop', icon: Puzzle },
            { id: 'slider', label: '3. Slider Interaktif', icon: Sliders },
            { id: 'accordion', label: '4. Accordion', icon: ChevronDown },
            { id: 'infographic', label: '5. Infografis', icon: Atom },
            { id: 'video', label: '6. Video Interaktif', icon: PlayCircle },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Playground Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 1. FLIP CARD */}
          {activeTab === 'flip' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <p className="text-xs text-slate-500">
                Klik kartu di bawah ini untuk membalikkan informasi rahasia konsep Hukum Kelembaman secara 3D!
              </p>
              <div
                onClick={handleFlip}
                className="w-72 sm:w-80 h-48 cursor-pointer [perspective:1000px] select-none group"
              >
                <div
                  className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] rounded-2xl shadow-xl ${
                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                  }`}
                >
                  {/* Front */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 flex flex-col justify-between [backface-visibility:hidden] border-2 border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                        Tampak Depan
                      </span>
                      <Atom className="w-5 h-5 text-sky-300 animate-spin-slow" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">Hukum I Newton</h4>
                      <p className="text-xs text-sky-100 mt-1">Mengapa sabuk pengaman mobil sangat krusial?</p>
                    </div>
                    <div className="text-[11px] text-yellow-300 font-medium">
                      👆 Klik kartu untuk membalik
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] border-2 border-indigo-400">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md">
                        Penjelasan Ilmiah
                      </span>
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed text-left">
                      <strong>Sifat Kelembaman (Inersia):</strong> Ketika mobil mengerem mendadak, tubuh penumpang memiliki kecenderungan alamiah untuk terus melaju ke depan sesuai kecepatan awal. Sabuk pengaman memberikan gaya penahan luar untuk melindungi penumpang.
                    </p>
                    <div className="text-[11px] text-sky-300 font-mono text-left">
                      Formula: ΣF = 0 ⇒ dv/dt = 0
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. DRAG & DROP / GROUPING */}
          {activeTab === 'drag' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Kelompokkan jenis-jenis gaya ke dalam kategori yang tepat: <strong>Gaya Sentuh (Kontak)</strong> atau <strong>Gaya Tak Sentuh (Medan)</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Zone 1: Gaya Sentuh */}
                <div className="p-4 bg-sky-50 border-2 border-dashed border-sky-300 rounded-2xl min-h-[160px]">
                  <h4 className="text-xs font-bold text-sky-900 mb-2 uppercase tracking-wide">
                    📦 Gaya Sentuh (Kontak Langsung)
                  </h4>
                  <div className="space-y-1.5">
                    {items.filter(it => placed[it.id] === 'sentuh').map(it => (
                      <div key={it.id} className="p-2 bg-white rounded-xl shadow-xs border border-sky-200 text-xs flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{it.text}</span>
                        <button
                          onClick={() => handlePlaceItem(it.id, 'taksentuh')}
                          className="text-[10px] text-sky-600 hover:underline"
                        >
                          Pindah ➔
                        </button>
                      </div>
                    ))}
                    {items.filter(it => placed[it.id] === 'sentuh').length === 0 && (
                      <p className="text-[11px] text-sky-400 italic py-6 text-center">Pilih item untuk diletakkan di sini</p>
                    )}
                  </div>
                </div>

                {/* Zone 2: Gaya Tak Sentuh */}
                <div className="p-4 bg-purple-50 border-2 border-dashed border-purple-300 rounded-2xl min-h-[160px]">
                  <h4 className="text-xs font-bold text-purple-900 mb-2 uppercase tracking-wide">
                    ⚡ Gaya Tak Sentuh (Gaya Medan)
                  </h4>
                  <div className="space-y-1.5">
                    {items.filter(it => placed[it.id] === 'taksentuh').map(it => (
                      <div key={it.id} className="p-2 bg-white rounded-xl shadow-xs border border-purple-200 text-xs flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{it.text}</span>
                        <button
                          onClick={() => handlePlaceItem(it.id, 'sentuh')}
                          className="text-[10px] text-purple-600 hover:underline"
                        >
                          ➔ Pindah
                        </button>
                      </div>
                    ))}
                    {items.filter(it => placed[it.id] === 'taksentuh').length === 0 && (
                      <p className="text-[11px] text-purple-400 italic py-6 text-center">Pilih item untuk diletakkan di sini</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Pool */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2">Item Belum Dikelompokkan:</div>
                <div className="flex flex-wrap gap-2">
                  {items.filter(it => !placed[it.id]).map(it => (
                    <div key={it.id} className="p-2 bg-white rounded-xl border border-slate-300 text-xs flex items-center gap-2 shadow-xs">
                      <span className="font-medium text-slate-800">{it.text}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handlePlaceItem(it.id, 'sentuh')}
                          className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold"
                        >
                          + Sentuh
                        </button>
                        <button
                          onClick={() => handlePlaceItem(it.id, 'taksentuh')}
                          className="px-2 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold"
                        >
                          + Medan
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.filter(it => !placed[it.id]).length === 0 && (
                    <p className="text-xs text-emerald-600 font-semibold">Semua item sudah dimasukkan ke kotak kategori!</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setPlaced({});
                    setDragCheckResult(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs hover:bg-slate-100 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button
                  onClick={checkDragDrop}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow"
                >
                  Cek Pengelompokan
                </button>
              </div>

              {dragCheckResult && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-semibold animate-fade-in">
                  {dragCheckResult}
                </div>
              )}
            </div>
          )}

          {/* 3. SLIDER INTERAKTIF */}
          {activeTab === 'slider' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Ubah parameter variabel massa dan koefisien gesek permukaan secara langsung untuk melihat dampaknya pada gaya gesek dan gaya normal secara visual!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Massa Balok (m):</span>
                      <span className="text-blue-600 font-mono font-bold">{massVal} kg</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={massVal}
                      onChange={(e) => setMassVal(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Koefisien Gesek (μ):</span>
                      <span className="text-amber-600 font-mono font-bold">{muVal.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.8}
                      step={0.05}
                      value={muVal}
                      onChange={(e) => setMuVal(Number(e.target.value))}
                      className="w-full slider-orange"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 rounded-2xl flex flex-col justify-between">
                  <div className="text-xs text-sky-200 font-semibold uppercase tracking-wider">
                    Hasil Analisis Dinamika
                  </div>
                  <div className="space-y-3 my-2">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-xs text-slate-300">Gaya Normal (N = m · g):</span>
                      <span className="font-mono font-bold text-sky-300">{normalForce.toFixed(1)} N</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-xs text-slate-300">Gaya Gesek Maks (f_g = μ · N):</span>
                      <span className="font-mono font-bold text-amber-300">{frictionForce} N</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    💡 Balok akan mulai bergerak hanya jika gaya dorong melebihi <strong>{frictionForce} N</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. ACCORDION */}
          {activeTab === 'accordion' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Eksplorasi ringkasan komprehensif 3 Hukum Gerak Newton secara bertahap:
              </p>

              {[
                {
                  id: 0,
                  title: 'Hukum I Newton (Inersia / Kelembaman)',
                  formula: 'ΣF = 0 ⇒ a = 0',
                  content: 'Benda yang diam akan tetap diam, dan benda yang bergerak lurus beraturan akan tetap bergerak lurus beraturan selama tidak ada resultan gaya yang bekerja padanya.'
                },
                {
                  id: 1,
                  title: 'Hukum II Newton (Percepatan & Gaya)',
                  formula: 'F = m · a  atau  a = F / m',
                  content: 'Percepatan yang dialami suatu benda berbanding lurus dengan resultan gaya yang bekerja padanya dan berbanding terbalik dengan massa benda tersebut.'
                },
                {
                  id: 2,
                  title: 'Hukum III Newton (Aksi - Reaksi)',
                  formula: 'F_aksi = - F_reaksi',
                  content: 'Jika benda A memberikan gaya pada benda B, maka benda B akan memberikan gaya yang sama besar namun berlawanan arah pada benda A. Pasangan aksi-reaksi bekerja pada dua benda berbeda.'
                }
              ].map(item => {
                const isOpen = openAccordion === item.id;
                return (
                  <div key={item.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <button
                      onClick={() => setOpenAccordion(isOpen ? null : item.id)}
                      className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                          {item.id + 1}
                        </span>
                        {item.title}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white text-xs text-slate-700 space-y-2 border-t border-slate-100 animate-fade-in">
                        <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-xl font-mono text-blue-900 font-bold inline-block">
                          {item.formula}
                        </div>
                        <p className="leading-relaxed">{item.content}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. INFOGRAFIS INTERAKTIF */}
          {activeTab === 'infographic' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-500">
                Diagram Benda Bebas (Free Body Diagram) pada balok di atas bidang datar:
              </p>

              <div className="relative mx-auto w-full max-w-md h-64 bg-slate-900 rounded-2xl p-4 flex items-center justify-center border-2 border-indigo-500/40 shadow-inner">
                {/* Ground */}
                <div className="absolute bottom-10 left-6 right-6 h-1 bg-slate-600" />
                
                {/* Block */}
                <div className="relative w-28 h-20 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl border-2 border-amber-300 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                  Balok (m)
                  
                  {/* Normal Force Arrow (Up) */}
                  <div className="absolute -top-16 flex flex-col items-center">
                    <span className="text-[10px] text-cyan-300 font-bold font-mono">Gaya Normal (N)</span>
                    <div className="w-0.5 h-10 bg-cyan-400" />
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-cyan-400 rotate-180" />
                  </div>

                  {/* Gravity Force Arrow (Down) */}
                  <div className="absolute -bottom-16 flex flex-col items-center">
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-emerald-400" />
                    <div className="w-0.5 h-10 bg-emerald-400" />
                    <span className="text-[10px] text-emerald-300 font-bold font-mono">Berat (W = m·g)</span>
                  </div>

                  {/* Applied Force Arrow (Right) */}
                  <div className="absolute -right-20 flex items-center">
                    <div className="w-12 h-0.5 bg-rose-400" />
                    <div className="w-0 h-0 border-y-4 border-y-transparent border-l-8 border-l-rose-400" />
                    <span className="text-[10px] text-rose-300 font-bold font-mono ml-1">F (Tarik)</span>
                  </div>

                  {/* Friction Force Arrow (Left) */}
                  <div className="absolute -left-20 flex items-center flex-row-reverse">
                    <div className="w-12 h-0.5 bg-yellow-400" />
                    <div className="w-0 h-0 border-y-4 border-y-transparent border-r-8 border-r-yellow-400" />
                    <span className="text-[10px] text-yellow-300 font-bold font-mono mr-1">f_gesek</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-left">
                <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900">
                  <strong>N:</strong> Gaya tegak lurus bidang
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <strong>W:</strong> Gravitasi bumi ke bawah
                </div>
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                  <strong>F:</strong> Gaya eksternal penyebab gerak
                </div>
                <div className="p-2 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900">
                  <strong>f:</strong> Gesekan penghambat gerak
                </div>
              </div>
            </div>
          )}

          {/* 6. VIDEO INTERAKTIF DENGAN CHECKPOINT */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Simulasi pemutaran video pembelajaran interaktif dengan checkpoint kuis otomatis di pertengahan video:
              </p>

              <div className="relative aspect-video max-w-lg mx-auto bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 flex flex-col items-center justify-center p-4">
                {!videoPlaying ? (
                  <div className="text-center space-y-2">
                    <button
                      onClick={() => {
                        sounds.playStart();
                        setVideoPlaying(true);
                      }}
                      className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform mx-auto"
                    >
                      <PlayCircle className="w-8 h-8 ml-0.5" />
                    </button>
                    <p className="text-xs text-slate-300 font-semibold">Tonton: Eksperimen Tabung Hampa Galileo</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col justify-between text-white p-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-sky-400">00:15 / 00:30</span>
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Checkpoint Soal
                      </span>
                    </div>

                    <div className="p-4 bg-slate-800/90 rounded-xl border border-sky-400/50 my-auto text-center space-y-3">
                      <div className="text-xs font-bold text-yellow-300">
                        Pertanyaan Video: Di dalam tabung hampa udara, apakah bulu ayam dan kelereng jatuh bersamaan?
                      </div>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => {
                            sounds.playSuccess();
                            setVideoQuestionAnswered(true);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          Ya, Jatuh Bersamaan
                        </button>
                        <button
                          onClick={() => {
                            sounds.playError();
                          }}
                          className="px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs"
                        >
                          Kelereng Lebih Dulu
                        </button>
                      </div>
                      {videoQuestionAnswered && (
                        <div className="text-xs text-emerald-400 font-semibold animate-fade-in">
                          ✓ Benar! Tanpa hambatan udara, percepatan gravitasi bernilai sama untuk semua massa benda (g = 9.8 m/s²).
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setVideoPlaying(false);
                          setVideoQuestionAnswered(false);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        Reset Video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow"
          >
            Selesai Eksplorasi Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
