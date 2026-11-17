import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  HeartHandshake,
  Sparkles,
  Star,
  Smile,
  Send,
  CheckCircle2,
  MessageSquareHeart,
  ChevronRight,
  ChevronLeft,
  Users,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Search,
  Inbox,
  Clock,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { storage } from '../../utils/storage';
import { ActiveSession, StudentReflectionRecord, UserRole } from '../../types/physics';

interface StudentReflectionSectionProps {
  userRole?: UserRole;
  activeSession?: ActiveSession | null;
  onRefreshProgress?: () => void;
}

const MOODS = [
  { id: 'semangat', emoji: '🤩', label: 'Sangat Bersemangat & Takjub' },
  { id: 'senang', emoji: '😊', label: 'Senang & Puas Bereksperimen' },
  { id: 'penasaran', emoji: '🧐', label: 'Makin Penasaran & Tertantang' },
  { id: 'butuh_latihan', emoji: '🤔', label: 'Paham, Butuh Tambah Latihan' },
];

export const StudentReflectionSection: React.FC<StudentReflectionSectionProps> = ({
  userRole = 'murid',
  activeSession,
  onRefreshProgress,
}) => {
  // Student Star Ratings (1-5)
  const [ratingGLB, setRatingGLB] = useState<number>(4);
  const [ratingGLBB, setRatingGLBB] = useState<number>(4);
  const [ratingGraph, setRatingGraph] = useState<number>(4);
  const [ratingLab, setRatingLab] = useState<number>(5);
  const [selectedMood, setSelectedMood] = useState<string>('semangat');

  // Student Qualitative Inputs
  const [qInteresting, setQInteresting] = useState('');
  const [qChallenging, setQChallenging] = useState('');
  const [qLabExp, setQLabExp] = useState('');
  const [qNextTarget, setQNextTarget] = useState('');

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [reflectionStep, setReflectionStep] = useState<number>(0); // 0: Pemahaman & Mood, 1: Pertanyaan Refleksi

  // Teacher State ("Hasil Refleksi Murid")
  const [studentReflections, setStudentReflections] = useState<StudentReflectionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const [teacherToast, setTeacherToast] = useState<string | null>(null);

  const showTeacherToast = (msg: string) => {
    setTeacherToast(msg);
    setTimeout(() => setTeacherToast(null), 3200);
  };

  const loadReflections = useCallback(() => {
    if (!activeSession?.npsn) {
      setStudentReflections(userRole === 'guru' ? [] : storage.getReflections());
      return;
    }
    setStudentReflections(storage.getReflections({ npsn: activeSession.npsn }));
  }, [activeSession?.npsn, userRole]);

  useEffect(() => {
    loadReflections();
    const syncHandler = () => loadReflections();
    window.addEventListener('mpi-sync-updated', syncHandler);
    window.addEventListener('storage', syncHandler);
    return () => {
      window.removeEventListener('mpi-sync-updated', syncHandler);
      window.removeEventListener('storage', syncHandler);
    };
  }, [loadReflections]);

  const handleSubmitReflection = () => {
    sounds.playSuccess();
    const now = new Date();
    const uniqueSuffix = `${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`;
    const accountPrefix = activeSession?.accountId || 'murid';

    storage.saveReflection({
      id: `refl_${accountPrefix}_${uniqueSuffix}`,
      date: now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      ratings: {
        glb: ratingGLB,
        glbb: ratingGLBB,
        graph: ratingGraph,
        lab: ratingLab,
      },
      mood: selectedMood,
      interestingThing: qInteresting.trim(),
      challengingThing: qChallenging.trim(),
      labExperience: qLabExp.trim(),
      nextTarget: qNextTarget.trim(),
      submittedAt: now.toISOString(),
    });

    storage.addXP(40);
    if (onRefreshProgress) onRefreshProgress();

    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 4500);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  const handleDeleteReflection = (rec: StudentReflectionRecord) => {
    sounds.playSuccess();
    storage.deleteReflection(rec.id, rec.npsn || activeSession?.npsn);
    setConfirmDeleteId(null);
    loadReflections();
    showTeacherToast(`Data refleksi "${rec.studentName}" berhasil dihapus.`);
  };

  const handleClearAllReflections = () => {
    if (!activeSession?.npsn) return;
    sounds.playSuccess();
    storage.clearSchoolReflections(activeSession.npsn);
    setConfirmClearAll(false);
    setConfirmDeleteId(null);
    loadReflections();
    showTeacherToast('Semua data Hasil Refleksi Murid berhasil dikosongkan.');
  };

  const renderStarPicker = (val: number, setVal: (n: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              sounds.playClick();
              setVal(star);
            }}
            className="p-1 hover:scale-125 transition-transform"
          >
            <Star
              className={`h-5 w-5 ${
                star <= val ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs font-mono font-bold text-amber-700">{val}/5</span>
      </div>
    );
  };

  // =========================================================================
  // TAMPILAN KHUSUS AKUN GURU: HASIL REFLEKSI MURID
  // =========================================================================
  if (userRole === 'guru') {
    const filteredReflections = studentReflections.filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.studentName.toLowerCase().includes(q) ||
        r.className.toLowerCase().includes(q) ||
        r.interestingThing.toLowerCase().includes(q) ||
        r.challengingThing.toLowerCase().includes(q);
      const matchesMood = moodFilter === 'all' || r.mood === moodFilter;
      return matchesSearch && matchesMood;
    });

    const totalCount = studentReflections.length;
    const avgConcept =
      totalCount > 0
        ? (
            studentReflections.reduce(
              (acc, r) => acc + ((r.ratings?.glb || 0) + (r.ratings?.glbb || 0)) / 2,
              0
            ) / totalCount
          ).toFixed(1)
        : '0.0';
    const avgLabGraph =
      totalCount > 0
        ? (
            studentReflections.reduce(
              (acc, r) => acc + ((r.ratings?.graph || 0) + (r.ratings?.lab || 0)) / 2,
              0
            ) / totalCount
          ).toFixed(1)
        : '0.0';

    const moodCounts = MOODS.map((m) => ({
      ...m,
      count: studentReflections.filter((r) => r.mood === m.id).length,
    }));
    const topMood = [...moodCounts].sort((a, b) => b.count - a.count)[0];

    return (
      <section
        id="refleksi"
        className="w-full py-6 sm:py-8 border-t-2 border-sky-200 bg-gradient-to-b from-[#EFF8FF]/70 via-[#F7FBFF] to-white"
      >
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {teacherToast && (
            <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-4 py-2.5 shadow-2xl border border-emerald-400 flex items-center gap-2 text-xs font-bold animate-bounce">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{teacherToast}</span>
            </div>
          )}

          {/* Header Guru: Hasil Refleksi Murid */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-200/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-300 mb-1.5">
                <HeartHandshake className="h-4 w-4 text-emerald-600" />
                <span>MENU 7 · HASIL REFLEKSI MURID</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Hasil Refleksi Murid
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                Rekap data refleksi pemahaman konsep, perasaan belajar, tantangan, dan target belajar yang dikumpulkan murid.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 no-print">
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md shadow-emerald-600/20">
                <Inbox className="h-4 w-4" />
                <span>Hasil Refleksi Murid ({totalCount})</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  loadReflections();
                  showTeacherToast('Data Hasil Refleksi Murid berhasil disegarkan.');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                <span>Segarkan</span>
              </button>
            </div>
          </div>

          {/* Ringkasan Statistik Refleksi Kelas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-700 uppercase block">
                  Refleksi Masuk
                </span>
                <span className="text-2xl font-black font-mono text-emerald-950">{totalCount}</span>
              </div>
              <Users className="h-7 w-7 text-emerald-500" />
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-amber-700 uppercase block">
                  Rata-rata GLB &amp; GLBB
                </span>
                <span className="text-2xl font-black font-mono text-amber-950">{avgConcept} ★</span>
              </div>
              <Star className="h-7 w-7 text-amber-500 fill-amber-400" />
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-sky-700 uppercase block">
                  Rata-rata Grafik &amp; Lab
                </span>
                <span className="text-2xl font-black font-mono text-sky-950">{avgLabGraph} ★</span>
              </div>
              <Sparkles className="h-7 w-7 text-sky-500" />
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-black text-indigo-700 uppercase block">
                  Mood Dominan Kelas
                </span>
                <span className="text-xs sm:text-sm font-black text-indigo-950 truncate block mt-0.5">
                  {totalCount > 0 && topMood ? topMood.label : 'Belum ada data'}
                </span>
              </div>
              <span className="text-2xl shrink-0">
                {totalCount > 0 && topMood ? topMood.emoji : '😊'}
              </span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-white via-[#EFF8FF] to-[#E6F3FF] p-3 rounded-2xl border-2 border-sky-300/85 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama murid, kelas, atau isi refleksi..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMoodFilter('all');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border transition ${
                    moodFilter === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua ({totalCount})
                </button>
                {moodCounts.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setMoodFilter(m.id);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 ${
                      moodFilter === m.id
                        ? 'bg-sky-600 text-white border-sky-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {confirmClearAll ? (
                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-xl">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span className="text-xs font-bold text-rose-800">Hapus semua?</span>
                  <button
                    type="button"
                    onClick={handleClearAllReflections}
                    className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={totalCount === 0}
                  onClick={() => {
                    sounds.playClick();
                    setConfirmClearAll(true);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 text-xs font-black transition ${
                    totalCount === 0
                      ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus Semua</span>
                </button>
              )}
            </div>
          </div>

          {/* Daftar Hasil Refleksi Murid */}
          {filteredReflections.length === 0 ? (
            <div className="p-10 text-center rounded-3xl border-2 border-dashed border-sky-300 bg-gradient-to-br from-white via-[#EFF8FF] to-[#E6F3FF] space-y-2.5">
              <HeartHandshake className="h-10 w-10 text-sky-500 mx-auto" />
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                {totalCount === 0
                  ? 'Belum Ada Refleksi yang Dikumpulkan Murid'
                  : 'Tidak Ada Data Refleksi yang Cocok dengan Pencarian'}
              </h4>
              <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                Saat murid mengisi skala pemahaman, perasaan belajar, dan jawaban refleksi lalu menekan tombol{' '}
                <strong>&quot;Kumpulkan Refleksi&quot;</strong> di akun murid, datanya akan otomatis masuk ke halaman{' '}
                <strong>Hasil Refleksi Murid</strong> ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 pb-4">
              {filteredReflections.map((ent, idx) => {
                const moodObj = MOODS.find((m) => m.id === ent.mood) || MOODS[0];
                return (
                  <div
                    key={ent.id || idx}
                    className="p-5 rounded-3xl bg-gradient-to-br from-white via-[#F2F9FF] to-[#E6F3FF] border-2 border-sky-200/90 hover:border-sky-400 shadow-[0_8px_24px_-10px_rgba(14,165,233,0.18)] transition space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black">
                          <Users className="h-3.5 w-3.5 text-emerald-700" />
                          <span>{ent.studentName || 'Murid'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
                          {ent.className || 'Kelas X Fase E'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-900 text-[11px] font-bold">
                          <span>{moodObj.emoji}</span>
                          <span>{moodObj.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {ent.submittedAt
                              ? new Date(ent.submittedAt).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : ent.date}
                          </span>
                        </span>

                        {confirmDeleteId === ent.id ? (
                          <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleDeleteReflection(ent)}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black"
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 text-[10px] font-bold"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setConfirmDeleteId(ent.id);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-bold hover:bg-rose-100 transition"
                            title="Hapus data refleksi ini"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Skala Pemahaman Bintang */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                        <span className="font-bold text-slate-700">GLB</span>
                        <span className="font-mono font-black text-amber-700">
                          {ent.ratings?.glb ?? 4}/5 ★
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                        <span className="font-bold text-slate-700">GLBB</span>
                        <span className="font-mono font-black text-amber-700">
                          {ent.ratings?.glbb ?? 4}/5 ★
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                        <span className="font-bold text-slate-700">Grafik s-t &amp; v-t</span>
                        <span className="font-mono font-black text-amber-700">
                          {ent.ratings?.graph ?? 4}/5 ★
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                        <span className="font-bold text-slate-700">Virtual Lab &amp; LKPD</span>
                        <span className="font-mono font-black text-amber-700">
                          {ent.ratings?.lab ?? 5}/5 ★
                        </span>
                      </div>
                    </div>

                    {/* Jawaban Kualitatif Murid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                        <span className="text-[11px] font-black text-emerald-900 block">
                          1. Hal Paling Menarik &amp; Dipahami:
                        </span>
                        <p className="text-slate-700 leading-relaxed">
                          {ent.interestingThing || '-'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200 space-y-1">
                        <span className="text-[11px] font-black text-orange-900 block">
                          2. Materi yang Masih Menantang / Butuh Latihan:
                        </span>
                        <p className="text-slate-700 leading-relaxed">
                          {ent.challengingThing || '-'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200 space-y-1">
                        <span className="text-[11px] font-black text-sky-900 block">
                          3. Pengalaman Simulasi &amp; Pengisian LKPD:
                        </span>
                        <p className="text-slate-700 leading-relaxed">
                          {ent.labExperience || '-'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1">
                        <span className="text-[11px] font-black text-indigo-900 block">
                          4. Target &amp; Komitmen Belajar Selanjutnya:
                        </span>
                        <p className="text-slate-700 leading-relaxed">
                          {ent.nextTarget || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  }

  // =========================================================================
  // TAMPILAN AKUN MURID: PENGISIAN REFLEKSI & KUMPULKAN REFLEKSI
  // =========================================================================
  return (
    <section
      id="refleksi"
      className="w-full py-10 border-t-2 border-sky-200 bg-gradient-to-b from-[#EFF8FF]/70 via-[#F7FBFF] to-white"
    >
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Murid */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-800 border border-sky-300 mb-1.5">
              <HeartHandshake className="h-4 w-4 text-sky-600" />
              <span>MENU 7 · REFLEKSI PEMBELAJARAN</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Refleksi Mandiri Peserta Didik
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
              Menyadari apa yang telah dipahami, apa yang masih menantang, dan menyusun strategi belajar yang lebih efektif.
            </p>
          </div>
        </div>

        {/* Feedback Submitted Alert */}
        {isSubmitted && (
          <div className="p-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-900 text-xs font-black flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
            <span>
              Refleksi berhasil dikumpulkan dan otomatis masuk ke menu Hasil Refleksi Murid di akun Guru (+40 XP prestasi belajar)!
            </span>
          </div>
        )}

        {/* Reflection 2-Step Bar (Tanpa Riwayat Jurnal) */}
        <div className="no-print flex items-center justify-between bg-gradient-to-r from-white via-[#EFF8FF] to-white p-2.5 rounded-2xl border-2 border-sky-300/85 shadow-sm">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setReflectionStep((prev) => Math.max(0, prev - 1));
            }}
            disabled={reflectionStep === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-200 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Sebelumnya</span>
          </button>

          <div className="flex items-center gap-1.5">
            {[
              { id: 0, label: '1. Pemahaman & Mood' },
              { id: 1, label: '2. Pertanyaan Refleksi' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setReflectionStep(st.id);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                  reflectionStep === st.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setReflectionStep((prev) => Math.min(1, prev + 1));
            }}
            disabled={reflectionStep === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-200 transition"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* STEP 1: Skala Pemahaman Bintang & Mood */}
        {reflectionStep === 0 && (
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-[#EFF8FF] to-[#DFF0FF] border-2 border-sky-300/90 shadow-[0_10px_0_#93C5FD,0_20px_30px_-10px_rgba(14,165,233,0.2)] space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>A. Skala Pemahaman Materi Saya (1 - 5 Bintang)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-2xl bg-white/95 border-2 border-sky-200/90 space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    1. Konsep Dasar &amp; GLB (v konstan):
                  </span>
                  {renderStarPicker(ratingGLB, setRatingGLB)}
                </div>

                <div className="p-3.5 rounded-2xl bg-white/95 border-2 border-sky-200/90 space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    2. Konsep GLBB &amp; 3 Rumus:
                  </span>
                  {renderStarPicker(ratingGLBB, setRatingGLBB)}
                </div>

                <div className="p-3.5 rounded-2xl bg-white/95 border-2 border-sky-200/90 space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    3. Analisis Grafik (s-t &amp; v-t):
                  </span>
                  {renderStarPicker(ratingGraph, setRatingGraph)}
                </div>

                <div className="p-3.5 rounded-2xl bg-white/95 border-2 border-sky-200/90 space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    4. Percobaan Virtual Lab &amp; LKPD:
                  </span>
                  {renderStarPicker(ratingLab, setRatingLab)}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Smile className="h-4 w-4 text-sky-500" />
                <span>B. Perasaan Belajar Fisika Hari Ini</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {MOODS.map((m) => {
                  const isSelected = selectedMood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setSelectedMood(m.id);
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-sky-50 border-sky-500 text-sky-950 font-black shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-300'
                      }`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-xs leading-snug">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end no-print">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setReflectionStep(1);
                }}
                className="btn-3d-emerald px-6 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2"
              >
                <span>Lanjut ke Pertanyaan Refleksi</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: 4 Pertanyaan Reflektif Terpandu & Kumpulkan Refleksi */}
        {reflectionStep === 1 && (
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-[#EFF8FF] to-[#DFF0FF] border-2 border-sky-300/90 shadow-[0_10px_0_#93C5FD,0_20px_30px_-10px_rgba(14,165,233,0.2)] space-y-5 animate-fadeIn">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
              <MessageSquareHeart className="h-4 w-4 text-sky-600" />
              <span>C. Pertanyaan Refleksi Kualitatif</span>
            </h3>

            <div className="p-4 rounded-2xl bg-white/95 border-2 border-sky-200/90 space-y-1.5">
              <label className="text-xs font-black text-slate-900 block">
                1. Apa hal paling menarik dan paling kamu pahami dari pembelajaran kinematika hari ini?
              </label>
              <textarea
                rows={2}
                value={qInteresting}
                placeholder="Tuliskan hal paling menarik dan konsep yang paling kamu pahami di sini..."
                onChange={(e) => setQInteresting(e.target.value)}
                className="w-full p-2.5 text-xs font-medium bg-white border border-sky-200 rounded-xl focus:border-sky-500 outline-none leading-relaxed"
              />
            </div>

            <div className="p-4 rounded-2xl bg-white/95 border-2 border-sky-200/90 space-y-1.5">
              <label className="text-xs font-black text-slate-900 block">
                2. Bagian materi apa yang masih terasa membingungkan atau membutuhkan latihan lebih lanjut?
              </label>
              <textarea
                rows={2}
                value={qChallenging}
                placeholder="Tuliskan materi atau konsep yang masih membingungkan atau perlu latihan tambahan di sini..."
                onChange={(e) => setQChallenging(e.target.value)}
                className="w-full p-2.5 text-xs font-medium bg-white border border-sky-200 rounded-xl focus:border-sky-500 outline-none leading-relaxed"
              />
            </div>

            <div className="p-4 rounded-2xl bg-white/95 border-2 border-sky-200/90 space-y-1.5">
              <label className="text-xs font-black text-slate-900 block">
                3. Bagaimana pengalamanmu saat menguji gerak di rel simulasi dan mengisi LKPD digital?
              </label>
              <textarea
                rows={2}
                value={qLabExp}
                placeholder="Ceritakan pengalamanmu saat melakukan uji coba simulasi dan menyalin data ke LKPD di sini..."
                onChange={(e) => setQLabExp(e.target.value)}
                className="w-full p-2.5 text-xs font-medium bg-white border border-sky-200 rounded-xl focus:border-sky-500 outline-none leading-relaxed"
              />
            </div>

            <div className="p-4 rounded-2xl bg-white/95 border-2 border-sky-200/90 space-y-1.5">
              <label className="text-xs font-black text-slate-900 block">
                4. Apa target atau komitmen belajarmu untuk pertemuan fisika selanjutnya?
              </label>
              <textarea
                rows={2}
                value={qNextTarget}
                placeholder="Tuliskan target belajar, komitmen latihan soal, atau rencana belajarmu di sini..."
                onChange={(e) => setQNextTarget(e.target.value)}
                className="w-full p-2.5 text-xs font-medium bg-white border border-sky-200 rounded-xl focus:border-sky-500 outline-none leading-relaxed"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 no-print">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setReflectionStep(0);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Kembali ke Skala Bintang
              </button>

              <button
                type="button"
                onClick={handleSubmitReflection}
                className="btn-3d-emerald px-8 py-3 rounded-2xl text-xs sm:text-sm font-black text-white flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>KUMPULKAN REFLEKSI</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
