import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Trophy,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  GraduationCap,
  Eye,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Printer,
  X,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ActiveSession,
  QuizResult,
  SavedLKPDRecord,
  StudentReportSync,
  UserProgress,
} from '../../types/physics';
import { sounds } from '../../utils/soundEffects';
import { storage, TeacherProfile } from '../../utils/storage';

interface TeacherReportSectionProps {
  activeSession?: ActiveSession | null;
  progress: UserProgress;
}

export const TeacherReportSection: React.FC<TeacherReportSectionProps> = ({
  activeSession,
  progress,
}) => {
  const [subMenu, setSubMenu] = useState<'quiz' | 'lkpd'>('quiz');
  const [lkpdFilter, setLkpdFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

  const [syncedReports, setSyncedReports] = useState<StudentReportSync[]>([]);
  const [syncedQuizList, setSyncedQuizList] = useState<QuizResult[]>([]);
  const [syncedLKPDs, setSyncedLKPDs] = useState<SavedLKPDRecord[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(() => storage.getTeacherProfile());

  const [selectedLKPDDetail, setSelectedLKPDDetail] = useState<SavedLKPDRecord | null>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteQuizId, setConfirmDeleteQuizId] = useState<string | null>(null);
  const [confirmClearQuizAll, setConfirmClearQuizAll] = useState<boolean>(false);
  const [confirmClearLKPDAll, setConfirmClearLKPDAll] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const loadSchoolData = useCallback(() => {
    setTeacherProfile(storage.getTeacherProfile());
    if (!activeSession?.npsn) {
      setSyncedReports([]);
      setSyncedQuizList([]);
      setSyncedLKPDs([]);
      return;
    }
    const npsnFilter = { npsn: activeSession.npsn };
    setSyncedReports(storage.getSchoolStudentReports(activeSession.npsn));
    setSyncedQuizList(storage.getQuizResults(npsnFilter));
    setSyncedLKPDs(storage.getSavedLKPDs(npsnFilter));
  }, [activeSession?.npsn]);

  useEffect(() => {
    loadSchoolData();
    const syncHandler = () => loadSchoolData();
    const profileHandler = (e: any) => {
      if (e.detail) setTeacherProfile(e.detail);
    };
    window.addEventListener('mpi-sync-updated', syncHandler);
    window.addEventListener('storage', syncHandler);
    window.addEventListener('teacher-profile-updated', profileHandler);
    return () => {
      window.removeEventListener('mpi-sync-updated', syncHandler);
      window.removeEventListener('storage', syncHandler);
      window.removeEventListener('teacher-profile-updated', profileHandler);
    };
  }, [loadSchoolData]);

  useEffect(() => {
    if (selectedLKPDDetail) {
      const fresh = syncedLKPDs.find((r) => r.id === selectedLKPDDetail.id);
      if (fresh) {
        setSelectedLKPDDetail(fresh);
      }
    }
  }, [syncedLKPDs, selectedLKPDDetail]);

  // Build unified student roster for Hasil Quiz submenu
  const unifiedStudentMap = new Map<
    string,
    {
      accountId: string;
      studentName: string;
      className: string;
      xp: number;
      level: number;
      lastQuizScore: number;
      lkpdCount: number;
      updatedAt: string;
    }
  >();

  syncedReports.forEach((rep) => {
    unifiedStudentMap.set(rep.accountId, {
      accountId: rep.accountId,
      studentName: rep.studentName,
      className: rep.className,
      xp: rep.xp,
      level: rep.level,
      lastQuizScore: rep.lastQuizScore,
      lkpdCount: 0,
      updatedAt: rep.updatedAt,
    });
  });

  syncedQuizList.forEach((q) => {
    const key = q.studentAccountId || q.studentName || q.id;
    const prev = unifiedStudentMap.get(key);
    unifiedStudentMap.set(key, {
      accountId: key,
      studentName: q.studentName || prev?.studentName || 'Murid',
      className: q.className || prev?.className || 'Kelas X',
      xp: prev?.xp || 0,
      level: prev?.level || 1,
      lastQuizScore: Math.max(prev?.lastQuizScore || 0, q.score),
      lkpdCount: prev?.lkpdCount || 0,
      updatedAt: q.timestamp,
    });
  });

  syncedLKPDs.forEach((l) => {
    const key = l.studentAccountId || l.groupLeader || l.id;
    const prev = unifiedStudentMap.get(key);
    unifiedStudentMap.set(key, {
      accountId: key,
      studentName: prev?.studentName || l.groupLeader || l.groupName || 'Murid',
      className: prev?.className || l.className || 'Kelas X',
      xp: prev?.xp || 0,
      level: prev?.level || 1,
      lastQuizScore: prev?.lastQuizScore || 0,
      lkpdCount: (prev?.lkpdCount || 0) + 1,
      updatedAt: l.timestamp,
    });
  });

  const teacherRosterRows = Array.from(unifiedStudentMap.values());
  const reviewedCount = syncedLKPDs.filter(
    (r) => r.feedbackStatus === 'reviewed' || Boolean(r.teacherFeedback?.trim())
  ).length;
  const pendingCount = syncedLKPDs.length - reviewedCount;

  const filteredLKPDs = syncedLKPDs.filter((rec) => {
    const hasFb = rec.feedbackStatus === 'reviewed' || Boolean(rec.teacherFeedback?.trim());
    if (lkpdFilter === 'reviewed') return hasFb;
    if (lkpdFilter === 'pending') return !hasFb;
    return true;
  });

  const feedbackPresets = [
    'Bagus sekali! Data percobaan GLB & GLBB serta interpretasi grafiknya sudah akurat.',
    'Analisis sudah baik, lengkapi penjelasan hubungan gradien kurva s-t dengan kecepatan.',
    'Kesimpulan sudah tepat. Pertahankan ketelitian dalam pembacaan ticker timer!',
  ];

  const handleSendFeedback = (rec: SavedLKPDRecord) => {
    const trimmed = feedbackDraft.trim();
    if (!trimmed) {
      sounds.playError();
      showToast('Isi pesan umpan balik terlebih dahulu sebelum mengirim.');
      return;
    }
    sounds.playSuccess();
    storage.saveLKPDFeedback(
      rec.id,
      trimmed,
      activeSession?.displayName || teacherProfile.name,
      rec.npsn || activeSession?.npsn
    );
    setEditingFeedbackId(null);
    loadSchoolData();
    showToast(`Umpan balik terkirim ke akun murid (${rec.groupLeader || rec.groupName || rec.className})!`);
  };

  const handleDeleteLKPD = (rec: SavedLKPDRecord) => {
    sounds.playSuccess();
    storage.deleteLKPD(rec.id);
    if (selectedLKPDDetail?.id === rec.id) {
      setSelectedLKPDDetail(null);
    }
    setConfirmDeleteId(null);
    loadSchoolData();
    showToast(`Data LKPD "${rec.groupName || rec.groupLeader || 'Murid'}" berhasil dihapus.`);
  };

  const handleDeleteQuizAttempt = (rec: QuizResult) => {
    sounds.playSuccess();
    storage.deleteQuizResult(rec.id, rec.npsn || activeSession?.npsn);
    setConfirmDeleteQuizId(null);
    loadSchoolData();
    showToast(`Riwayat quiz "${rec.studentName || 'Murid'}" berhasil dihapus.`);
  };

  const handleClearAllQuizSubmenu = () => {
    if (!activeSession?.npsn) return;
    sounds.playSuccess();
    storage.clearSchoolQuizData(activeSession.npsn);
    setConfirmClearQuizAll(false);
    setConfirmDeleteQuizId(null);
    loadSchoolData();
    showToast('Semua data riwayat hasil pengerjaan Quiz berhasil dikosongkan.');
  };

  const handleClearAllLKPDSubmenu = () => {
    if (!activeSession?.npsn) return;
    sounds.playSuccess();
    storage.clearSchoolLKPDData(activeSession.npsn);
    setSelectedLKPDDetail(null);
    setConfirmClearLKPDAll(false);
    setConfirmDeleteId(null);
    loadSchoolData();
    showToast('Semua data LKPD Terkumpul berhasil dikosongkan.');
  };

  return (
    <section
      id="rapor-belajar-guru"
      className="w-full py-2 sm:py-2.5 border-t-2 border-sky-200 bg-gradient-to-b from-[#EFF8FF]/70 via-[#F7FBFF] to-white"
    >
      <div className="w-full max-w-[1640px] mx-auto px-3 sm:px-5 lg:px-6 space-y-2.5 pb-6">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-4 py-2.5 shadow-2xl border border-emerald-400 flex items-center gap-2 text-xs font-bold animate-bounce">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-black text-amber-800 border border-amber-300">
              <Award className="h-3.5 w-3.5 text-amber-600" />
              <span>MENU 8 · RAPOR BELAJAR MURID</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
              <span>Pusat Rapor Belajar &amp; Hasil Kerja Murid</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              loadSchoolData();
              showToast('Data hasil Quiz dan LKPD murid berhasil disegarkan.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 text-sky-600" />
            <span>Segarkan Data</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-sky-700 uppercase block">Murid Tersinkron</span>
              <span className="text-xl font-black font-mono text-sky-950">{teacherRosterRows.length}</span>
            </div>
            <Users className="h-6 w-6 text-sky-500" />
          </div>
          <div className="p-2.5 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-amber-700 uppercase block">Hasil Quiz Masuk</span>
              <span className="text-xl font-black font-mono text-amber-950">{syncedQuizList.length}</span>
            </div>
            <Trophy className="h-6 w-6 text-amber-500" />
          </div>
          <div className="p-2.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-emerald-700 uppercase block">LKPD Terkumpul</span>
              <span className="text-xl font-black font-mono text-emerald-950">{syncedLKPDs.length}</span>
            </div>
            <FileText className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="p-2.5 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-indigo-700 uppercase block">Sudah Diulas Guru</span>
              <span className="text-xl font-black font-mono text-indigo-950">{reviewedCount}</span>
            </div>
            <GraduationCap className="h-6 w-6 text-indigo-500" />
          </div>
        </div>

        {/* 2 Submenu Tabs: Hasil Quiz & LKPD Terkumpul */}
        <div className="flex flex-wrap items-center gap-2.5 p-1.5 rounded-2xl bg-gradient-to-r from-[#EBF5FF] via-[#F4FAFF] to-[#EBF5FF] border border-sky-200/90 shadow-[inset_0_1px_2px_rgba(14,165,233,0.08)]">
          <motion.button
            type="button"
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 440, damping: 26 }}
            onClick={() => {
              sounds.playClick();
              setSubMenu('quiz');
            }}
            className={`group flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors border cursor-pointer ${
              subMenu === 'quiz'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400/70 shadow-[0_8px_20px_-6px_rgba(245,158,11,0.45)]'
                : 'bg-white/95 text-slate-700 border-slate-200/85 hover:border-amber-300 hover:text-amber-950 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.06)]'
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-transform group-hover:scale-105 shrink-0 ${
                subMenu === 'quiz'
                  ? 'bg-white/20 border-white/30 text-white'
                  : 'bg-amber-50 border-amber-200/80 text-amber-600'
              }`}
            >
              <Trophy className="h-4 w-4" strokeWidth={2} />
            </span>
            <span>Submenu 1: Hasil Quiz</span>
            <span
              className={`font-mono text-[11px] px-2 py-0.5 rounded-md tabular-nums ${
                subMenu === 'quiz' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {syncedQuizList.length}
            </span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 440, damping: 26 }}
            onClick={() => {
              sounds.playClick();
              setSubMenu('lkpd');
            }}
            className={`group flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors border cursor-pointer ${
              subMenu === 'lkpd'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/70 shadow-[0_8px_20px_-6px_rgba(5,150,105,0.45)]'
                : 'bg-white/95 text-slate-700 border-slate-200/85 hover:border-emerald-300 hover:text-emerald-950 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.06)]'
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-transform group-hover:scale-105 shrink-0 ${
                subMenu === 'lkpd'
                  ? 'bg-white/20 border-white/30 text-white'
                  : 'bg-emerald-50 border-emerald-200/80 text-emerald-600'
              }`}
            >
              <FileText className="h-4 w-4" strokeWidth={2} />
            </span>
            <span>Submenu 2: LKPD Terkumpul</span>
            <span
              className={`font-mono text-[11px] px-2 py-0.5 rounded-md tabular-nums ${
                subMenu === 'lkpd' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {syncedLKPDs.length}
            </span>
          </motion.button>
        </div>

        {/* =================================================================== */}
        {/* SUBMENU 1: RIWAYAT HASIL PENGERJAAN QUIZ MURID                      */}
        {/* =================================================================== */}
        {subMenu === 'quiz' && (
          <div className="rounded-3xl bg-gradient-to-br from-white via-[#EFF8FF] to-[#DFF0FF] border-2 border-sky-300/90 shadow-[0_10px_0_#93C5FD,0_18px_28px_-10px_rgba(14,165,233,0.2)] p-3 sm:p-4 flex flex-col space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 pb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Riwayat Hasil Pengerjaan Quiz Murid</span>
                </h3>
                <span className="text-[10px] font-semibold text-slate-500 block">
                  Otomatis masuk setiap kali murid menyelesaikan evaluasi Quiz
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <span className="font-mono text-[11px] font-black bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                  {syncedQuizList.length} Riwayat
                </span>
                {confirmClearQuizAll ? (
                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 px-2 py-1 rounded-xl">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span className="text-[11px] font-bold text-rose-800">Hapus semua?</span>
                    <button
                      type="button"
                      onClick={handleClearAllQuizSubmenu}
                      className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black shadow-sm"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearQuizAll(false)}
                      className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-bold"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={syncedQuizList.length === 0}
                    onClick={() => {
                      sounds.playClick();
                      setConfirmClearQuizAll(true);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 text-[11px] font-black transition shadow-sm ${
                      syncedQuizList.length === 0
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-400'
                    }`}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Hapus Semua</span>
                  </button>
                )}
              </div>
            </div>

            {syncedQuizList.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center text-xs text-slate-500 min-h-[200px]">
                Belum ada riwayat hasil pengerjaan Quiz murid yang masuk.
              </div>
            ) : (
              <div className="flex-1 overflow-auto max-h-[420px] custom-scroll-view rounded-xl border border-slate-200">
                <table className="w-full text-left text-[11px] sm:text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-700 font-black">
                    <tr>
                      <th className="p-2.5">Nama Murid</th>
                      <th className="p-2.5">Kelas</th>
                      <th className="p-2.5">Waktu Selesai</th>
                      <th className="p-2.5 text-center">Skor</th>
                      <th className="p-2.5 text-center">Status KKTP</th>
                      <th className="p-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {syncedQuizList.map((att, idx) => (
                      <tr key={att.id || idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-black text-slate-900">{att.studentName || 'Murid'}</td>
                        <td className="p-2.5 font-bold text-slate-600">{att.className || 'Kelas X'}</td>
                        <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">
                          {new Date(att.timestamp).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="p-2.5 text-center font-mono font-black text-sky-800">
                          {att.score}/100
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              att.score >= 75
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {att.score >= 75 ? 'Tuntas' : 'Penguatan'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {confirmDeleteQuizId === att.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-300 px-1.5 py-0.5 rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleDeleteQuizAttempt(att)}
                                className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black"
                              >
                                Ya
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteQuizId(null)}
                                className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-700 text-[10px] font-bold"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setConfirmDeleteQuizId(att.id);
                              }}
                              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 text-[10px] font-black hover:bg-rose-100 transition"
                            >
                              <Trash2 className="h-3 w-3 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* SUBMENU 2: LKPD TERKUMPUL DARI AKUN-AKUN MURID                      */}
        {/* =================================================================== */}
        {subMenu === 'lkpd' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-white via-[#EFF8FF] to-[#E6F3FF] p-3 rounded-2xl border-2 border-sky-300/85 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setLkpdFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                    lkpdFilter === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua ({syncedLKPDs.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setLkpdFilter('pending');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                    lkpdFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 border-amber-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Menunggu Umpan Balik ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setLkpdFilter('reviewed');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                    lkpdFilter === 'reviewed'
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Sudah Diulas ({reviewedCount})
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Umpan balik tampil langsung di akun murid.
                </span>
                {confirmClearLKPDAll ? (
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-xl">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span className="text-xs font-bold text-rose-800">Hapus semua LKPD?</span>
                    <button
                      type="button"
                      onClick={handleClearAllLKPDSubmenu}
                      className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearLKPDAll(false)}
                      className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={syncedLKPDs.length === 0}
                    onClick={() => {
                      sounds.playClick();
                      setConfirmClearLKPDAll(true);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 text-xs font-black transition shadow-sm ${
                      syncedLKPDs.length === 0
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-400'
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Semua</span>
                  </button>
                )}
              </div>
            </div>

            {filteredLKPDs.length === 0 ? (
              <div className="p-8 text-center rounded-3xl border-2 border-dashed border-sky-300 bg-gradient-to-br from-white via-[#EFF8FF] to-[#E6F3FF] space-y-2">
                <AlertCircle className="h-10 w-10 text-sky-400 mx-auto" />
                <h4 className="text-sm font-black text-slate-800">
                  Belum Ada LKPD Terkumpul pada Kategori Ini
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Belum ada murid yang berhasil login dan mengumpulkan LKPD. Saat murid login dan menekan tombol <strong>&quot;Kumpulkan&quot;</strong> di menu Simulasi &amp; LKPD, lembar kerja mereka otomatis masuk ke daftar ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredLKPDs.map((rec) => {
                  const hasFeedback = Boolean(rec.teacherFeedback && rec.teacherFeedback.trim().length > 0);
                  const isEditingThis = editingFeedbackId === rec.id;

                  return (
                    <div
                      key={rec.id}
                      className="p-4 rounded-3xl border-2 border-sky-200/90 hover:border-sky-400 bg-gradient-to-br from-white via-[#F2F9FF] to-[#E6F3FF] transition-all shadow-[0_8px_22px_-10px_rgba(14,165,233,0.18)] space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/70 pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                            {rec.labMode}
                          </span>
                          <h4 className="text-sm font-black text-slate-900">
                            {rec.groupName || rec.groupLeader || 'Kelompok Murid'}
                          </h4>
                          {hasFeedback ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Sudah Diberi Umpan Balik</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span>Menunggu Umpan Balik</span>
                            </span>
                          )}
                        </div>

                        <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(rec.timestamp).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-500 font-bold block">Ketua Kelompok / Murid:</span>
                          <span className="font-bold text-slate-900">{rec.groupLeader || '-'}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-500 font-bold block">Kelas &amp; Tanggal:</span>
                          <span className="font-bold text-slate-900">
                            {rec.className || 'Kelas X · Fase E'} • {rec.date}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-500 font-bold block">Data Percobaan:</span>
                          <span className="font-bold text-emerald-700">
                            {((rec.glbRows?.length || 0) + (rec.glbbRows?.length || 0)) || rec.rows?.length || 0} Titik Data (GLB &amp; GLBB)
                          </span>
                        </div>
                      </div>

                      {rec.members && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700">Anggota: </span>
                          <span className="font-mono text-slate-600">{rec.members.replace(/\n/g, ', ')}</span>
                        </div>
                      )}

                      <div className="text-xs text-slate-600 italic bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 line-clamp-2">
                        &quot;{rec.conclusion || 'Belum ada kesimpulan praktikum yang dicatat.'}&quot;
                      </div>

                      {hasFeedback && !isEditingThis && (
                        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-indigo-950 flex items-center gap-1.5">
                              <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Umpan Balik Guru ({rec.feedbackBy || teacherProfile.name}):</span>
                            </span>
                            {rec.feedbackAt && (
                              <span className="text-[10px] font-mono text-indigo-600">
                                {new Date(rec.feedbackAt).toLocaleString('id-ID', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-indigo-900 font-semibold leading-snug">{rec.teacherFeedback}</p>
                        </div>
                      )}

                      {isEditingThis && (
                        <div className="p-3 rounded-2xl bg-indigo-50/90 border-2 border-indigo-300 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4 text-indigo-600" />
                              <span>
                                Tulis Umpan Balik Langsung untuk Akun Murid ({rec.groupLeader || rec.groupName || rec.className})
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingFeedbackId(null)}
                              className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                            >
                              Tutup
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {feedbackPresets.map((preset, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setFeedbackDraft(preset)}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-900 transition text-left"
                              >
                                + {preset.slice(0, 48)}...
                              </button>
                            ))}
                          </div>

                          <textarea
                            rows={2}
                            value={feedbackDraft}
                            onChange={(e) => setFeedbackDraft(e.target.value)}
                            placeholder="Ketik umpan balik, apresiasi, atau catatan perbaikan LKPD untuk murid..."
                            className="w-full rounded-xl border border-indigo-300 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 outline-none"
                          />

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingFeedbackId(null)}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendFeedback(rec)}
                              className="btn-3d-indigo flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-sm"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Kirim Umpan Balik ke Murid</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setSelectedLKPDDetail(selectedLKPDDetail?.id === rec.id ? null : rec);
                            }}
                            className="btn-3d-cyan flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>
                              {selectedLKPDDetail?.id === rec.id ? 'Tutup Detail LKPD' : 'Buka Detail LKPD'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setEditingFeedbackId(rec.id);
                              setFeedbackDraft(rec.teacherFeedback || '');
                            }}
                            className="btn-3d-indigo flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white shadow-sm"
                          >
                            <MessageSquarePlus className="h-3.5 w-3.5" />
                            <span>{hasFeedback ? 'Edit Umpan Balik' : 'Beri Umpan Balik'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setSelectedLKPDDetail(rec);
                              setTimeout(() => window.print(), 200);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-sm"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {confirmDeleteId === rec.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-xl">
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                              <span className="text-xs font-bold text-rose-800">Yakin hapus?</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteLKPD(rec)}
                                className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setConfirmDeleteId(rec.id);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-700 text-xs font-black hover:bg-rose-100 hover:border-rose-400 transition shadow-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline Detail LKPD Viewer */}
            {selectedLKPDDetail && (
              <div className="p-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50/40 space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b-2 border-emerald-300 pb-2.5 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-emerald-900 bg-emerald-200 px-2.5 py-0.5 rounded-md">
                      Detail Dokumen LKPD Murid
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      {selectedLKPDDetail.groupName || selectedLKPDDetail.groupLeader || selectedLKPDDetail.className}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLKPDDetail(null)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Tutup Detail</span>
                  </button>
                </div>

                {(() => {
                  const glbList =
                    selectedLKPDDetail.glbRows && selectedLKPDDetail.glbRows.length > 0
                      ? selectedLKPDDetail.glbRows
                      : (selectedLKPDDetail.rows || []).filter((r) => !r.type.includes('GLBB'));

                  const legacyGlbb =
                    selectedLKPDDetail.glbbRows && selectedLKPDDetail.glbbRows.length > 0
                      ? selectedLKPDDetail.glbbRows
                      : (selectedLKPDDetail.rows || []).filter((r) => r.type.includes('GLBB'));

                  const glbbAccelList = selectedLKPDDetail.glbbAccelRows
                    ? selectedLKPDDetail.glbbAccelRows
                    : legacyGlbb.filter((r) => r.type.includes('dipercepat') || r.a > 0);

                  const glbbDecelList = selectedLKPDDetail.glbbDecelRows
                    ? selectedLKPDDetail.glbbDecelRows
                    : legacyGlbb.filter((r) => r.type.includes('diperlambat') || r.a < 0);

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                        <h5 className="text-xs font-black text-sky-950">
                          Tabel 1: GLB ({glbList.length} Titik)
                        </h5>
                        <div className="overflow-x-auto rounded-xl border border-sky-200 bg-white max-h-56">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-sky-100/70 font-black text-sky-950">
                              <tr>
                                <th className="p-1.5">t (s)</th>
                                <th className="p-1.5">s (m)</th>
                                <th className="p-1.5">v (m/s)</th>
                                <th className="p-1.5">a</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-mono">
                              {glbList.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-2 text-center text-slate-400 font-sans">
                                    Kosong
                                  </td>
                                </tr>
                              ) : (
                                glbList.map((r, i) => (
                                  <tr key={i}>
                                    <td className="p-1.5">{r.t.toFixed(1)}</td>
                                    <td className="p-1.5">{r.s.toFixed(2)}</td>
                                    <td className="p-1.5">{r.v.toFixed(2)}</td>
                                    <td className="p-1.5">{r.a.toFixed(2)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                        <h5 className="text-xs font-black text-amber-950">
                          Tabel 2: GLBB Dipercepat ({glbbAccelList.length} Titik)
                        </h5>
                        <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white max-h-56">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-amber-100/70 font-black text-amber-950">
                              <tr>
                                <th className="p-1.5">t (s)</th>
                                <th className="p-1.5">s (m)</th>
                                <th className="p-1.5">v (m/s)</th>
                                <th className="p-1.5">+a</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-mono">
                              {glbbAccelList.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-2 text-center text-slate-400 font-sans">
                                    Kosong
                                  </td>
                                </tr>
                              ) : (
                                glbbAccelList.map((r, i) => (
                                  <tr key={i}>
                                    <td className="p-1.5">{r.t.toFixed(1)}</td>
                                    <td className="p-1.5">{r.s.toFixed(2)}</td>
                                    <td className="p-1.5">{r.v.toFixed(2)}</td>
                                    <td className="p-1.5">+{Math.abs(r.a).toFixed(2)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                        <h5 className="text-xs font-black text-rose-950">
                          Tabel 3: GLBB Diperlambat ({glbbDecelList.length} Titik)
                        </h5>
                        <div className="overflow-x-auto rounded-xl border border-rose-200 bg-white max-h-56">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-rose-100/70 font-black text-rose-950">
                              <tr>
                                <th className="p-1.5">t (s)</th>
                                <th className="p-1.5">s (m)</th>
                                <th className="p-1.5">v (m/s)</th>
                                <th className="p-1.5">-a</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-mono">
                              {glbbDecelList.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-2 text-center text-slate-400 font-sans">
                                    Kosong
                                  </td>
                                </tr>
                              ) : (
                                glbbDecelList.map((r, i) => (
                                  <tr key={i}>
                                    <td className="p-1.5">{r.t.toFixed(1)}</td>
                                    <td className="p-1.5">{r.s.toFixed(2)}</td>
                                    <td className="p-1.5">{r.v.toFixed(2)}</td>
                                    <td className="p-1.5">{r.a.toFixed(2)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <p className="font-bold text-slate-800">1. Hubungan waktu (t) dan jarak (s) pada GLB:</p>
                    <p className="text-slate-600 mt-0.5">{selectedLKPDDetail.ans1 || '-'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <p className="font-bold text-slate-800">2. Perubahan kecepatan (v) seiring waktu pada GLBB:</p>
                    <p className="text-slate-600 mt-0.5">{selectedLKPDDetail.ans2 || '-'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <p className="font-bold text-slate-800">3. Pola ketukan pita ticker timer:</p>
                    <p className="text-slate-600 mt-0.5">{selectedLKPDDetail.ans4 || '-'}</p>
                  </div>
                  {selectedLKPDDetail.ans5 !== undefined && (
                    <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
                      <p className="font-bold text-sky-900">4. Analisis &amp; Pembahasan Grafik GLB:</p>
                      <p className="text-slate-700 mt-0.5">{selectedLKPDDetail.ans5 || '-'}</p>
                    </div>
                  )}
                  {selectedLKPDDetail.ans6 !== undefined && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                      <p className="font-bold text-amber-900">
                        5. Analisis &amp; Pembahasan Grafik GLBB (Dipercepat vs Diperlambat):
                      </p>
                      <p className="text-slate-700 mt-0.5">{selectedLKPDDetail.ans6 || '-'}</p>
                    </div>
                  )}
                  <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300">
                    <p className="font-bold text-emerald-950">Kesimpulan Praktikum:</p>
                    <p className="text-emerald-900 mt-0.5 font-medium">
                      {selectedLKPDDetail.conclusion || '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
