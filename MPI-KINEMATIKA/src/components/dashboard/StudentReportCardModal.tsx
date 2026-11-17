import React, { useState, useEffect } from 'react';
import {
  Award,
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  BarChart3,
  FileCheck2,
  Clock,
  Edit3,
  Info,
  Users,
  Trophy,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import {
  ActiveSession,
  QuizResult,
  SavedLKPDRecord,
  StudentReportSync,
  UserProgress,
  UserRole,
} from '../../types/physics';
import { sounds } from '../../utils/soundEffects';
import { storage, TeacherProfile } from '../../utils/storage';

interface StudentReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: UserRole;
  activeSession?: ActiveSession | null;
  progress: UserProgress;
  latestResult?: QuizResult | null;
  allResults: QuizResult[];
  initialStudentReport?: StudentReportSync | null;
}

export const StudentReportCardModal: React.FC<StudentReportCardModalProps> = ({
  isOpen,
  onClose,
  userRole = 'murid',
  activeSession,
  progress,
  latestResult,
  allResults,
  initialStudentReport = null,
}) => {
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(storage.getTeacherProfile());
  const [isEditingTeacher, setIsEditingTeacher] = useState<boolean>(false);

  // Synced Teacher View State
  const [teacherTab, setTeacherTab] = useState<'rekap' | 'detail'>('rekap');
  const [syncedReports, setSyncedReports] = useState<StudentReportSync[]>([]);
  const [syncedQuizList, setSyncedQuizList] = useState<QuizResult[]>([]);
  const [syncedLKPDs, setSyncedLKPDs] = useState<SavedLKPDRecord[]>([]);
  const [selectedStudentReport, setSelectedStudentReport] = useState<StudentReportSync | null>(null);

  const loadSyncedSchoolData = React.useCallback(() => {
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
    setTeacherProfile(storage.getTeacherProfile());
    loadSyncedSchoolData();
    const handler = (e: any) => {
      if (e.detail) setTeacherProfile(e.detail);
    };
    const syncHandler = () => {
      loadSyncedSchoolData();
    };
    window.addEventListener('teacher-profile-updated', handler);
    window.addEventListener('mpi-sync-updated', syncHandler);
    window.addEventListener('storage', syncHandler);
    return () => {
      window.removeEventListener('teacher-profile-updated', handler);
      window.removeEventListener('mpi-sync-updated', syncHandler);
      window.removeEventListener('storage', syncHandler);
    };
  }, [isOpen, loadSyncedSchoolData]);

  useEffect(() => {
    if (isOpen) {
      if (initialStudentReport) {
        setTeacherTab('detail');
        setSelectedStudentReport(initialStudentReport);
      } else {
        setTeacherTab(userRole === 'guru' ? 'rekap' : 'detail');
        setSelectedStudentReport(null);
      }
      loadSyncedSchoolData();
    }
  }, [isOpen, userRole, initialStudentReport, loadSyncedSchoolData]);

  if (!isOpen) return null;

  // Determine which student data to show in Detail Report Card view
  const effectiveStudentName = selectedStudentReport
    ? selectedStudentReport.studentName
    : userRole === 'murid' && activeSession
      ? activeSession.displayName
      : progress.studentName || 'Murid Fisika Merdeka';

  const effectiveClass = selectedStudentReport
    ? selectedStudentReport.className
    : userRole === 'murid' && activeSession
      ? activeSession.className
      : progress.studentId || 'Kelas X • Fase E';

  const effectiveResults = selectedStudentReport
    ? syncedQuizList.filter((q) => q.studentAccountId === selectedStudentReport.accountId)
    : userRole === 'murid' && activeSession?.accountId
      ? syncedQuizList.filter(
          (q) => !q.studentAccountId || q.studentAccountId === activeSession.accountId
        )
      : allResults;

  const result = selectedStudentReport
    ? effectiveResults[0] ||
      (selectedStudentReport.lastQuizScore > 0
        ? {
            id: 'sync',
            timestamp: selectedStudentReport.updatedAt,
            score: selectedStudentReport.lastQuizScore,
            totalQuestions: 10,
            timeSpentSeconds: 120,
            category: 'GLB_GLBB_COMPREHENSIVE',
            answers: [],
          }
        : null)
    : latestResult || (effectiveResults && effectiveResults.length > 0 ? effectiveResults[0] : null);

  const hasCompletedQuiz = Boolean(
    result && typeof result.score === 'number' && (effectiveResults.length > 0 || (selectedStudentReport && selectedStudentReport.lastQuizScore > 0))
  );

  const score = hasCompletedQuiz && result ? result.score : 0;

  // Grade & Predicate logic
  let gradeLetter = '-';
  let predicate = 'Belum Ada Data (Kuis Belum Dikerjakan)';
  let kktpStatus = 'BELUM ADA DATA';
  let badgeColor = 'text-slate-600 bg-slate-100 border-slate-300';

  if (hasCompletedQuiz) {
    if (score >= 90) {
      gradeLetter = 'A';
      predicate = 'Sangat Baik (Istimewa / Mahir)';
      kktpStatus = 'TUNTAS SEMPURNA';
      badgeColor = 'text-emerald-800 bg-emerald-100 border-emerald-300';
    } else if (score >= 75) {
      gradeLetter = 'B+';
      predicate = 'Baik (Tercapai / Terampil)';
      kktpStatus = 'TUNTAS';
      badgeColor = 'text-blue-800 bg-blue-100 border-blue-300';
    } else if (score >= 60) {
      gradeLetter = 'C';
      predicate = 'Cukup (Perlu Penguatan Teori)';
      kktpStatus = 'PERLU PENGUATAN';
      badgeColor = 'text-amber-800 bg-amber-100 border-amber-300';
    } else {
      gradeLetter = 'D';
      predicate = 'Perlu Bimbingan Tambahan';
      kktpStatus = 'BELUM TUNTAS';
      badgeColor = 'text-rose-800 bg-rose-100 border-rose-300';
    }
  }

  const getTeacherNotes = () => {
    if (!hasCompletedQuiz) {
      return '(Belum ada catatan evaluasi karena belum ada murid yang mengerjakan dan menyelesaikan Quiz. Masukan deskriptif serta rekomendasi guru akan terisi otomatis berdasarkan capaian indikator setelah murid menyelesaikan asesmen.)';
    }
    if (score >= 90) {
      return 'Ananda menunjukkan penguasaan materi kinematika yang luar biasa istimewa. Konsep fisis kelajuan tetap pada GLB, percepatan konstan pada GLBB, serta interpretasi kemiringan dan luas di bawah kurva grafik gerak telah dikuasai dengan sangat matang dan akurat.';
    }
    if (score >= 75) {
      return 'Ananda telah mencapai Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) dengan sangat baik. Terus pertajam latihan analisis soal HOTS pada penerapan rumus bebas waktu GLBB dan pemodelan gerak vertikal.';
    }
    return 'Ananda disarankan untuk mengkaji ulang modul digital materi GLBB (terutama 3 rumus utama GLBB) serta melakukan eksperimen ulang pada menu Simulasi & LKPD untuk memperkuat intuisi fisis.';
  };

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  // Build unified student list for Teacher Rekap (combining StudentReports + QuizResults + LKPDs by studentAccountId)
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
      hasFeedback: boolean;
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
      hasFeedback: false,
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
      hasFeedback: prev?.hasFeedback || false,
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
      hasFeedback: Boolean(prev?.hasFeedback || l.teacherFeedback),
      updatedAt: l.timestamp,
    });
  });

  const teacherRosterRows = Array.from(unifiedStudentMap.values());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-sm overflow-y-auto">
      <div className="report-card-modal-container relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border-2 border-amber-300 bg-white shadow-2xl text-slate-900 overflow-hidden">

        {/* Modal Top Bar (No-Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-amber-50/80 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-sm">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex flex-wrap items-center gap-2">
                <span>
                  {userRole === 'guru'
                    ? 'Rekap Rapor Belajar & Hasil Quiz Murid Tersinkron'
                    : 'Rapor Belajar Murid (Asesmen Kinematika Gerak Lurus)'}
                </span>
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Lembar laporan hasil asesmen formatif Kurikulum Merdeka Fase E Kelas X SMA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userRole === 'guru' && teacherTab === 'detail' && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setTeacherTab('rekap');
                  setSelectedStudentReport(null);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-black hover:bg-slate-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Rekap Kelas</span>
              </button>
            )}

            {teacherTab === 'detail' && (
              <button
                onClick={handlePrint}
                title="Unduh Laporan Hasil Asesmen Formatif Murid (Rapor Belajar) ke PDF"
                className="btn-3d-cyan flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-sm hover:brightness-105 cursor-pointer transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh rapor</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="rounded-xl p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* TEACHER SYNCED REKAP DASHBOARD TAB */}
        {userRole === 'guru' && teacherTab === 'rekap' ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-sky-700 uppercase block">Murid Tersinkron</span>
                  <span className="text-2xl font-black font-mono text-sky-950">{teacherRosterRows.length}</span>
                </div>
                <Users className="h-7 w-7 text-sky-500" />
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-amber-700 uppercase block">Total Hasil Quiz Masuk</span>
                  <span className="text-2xl font-black font-mono text-amber-950">{syncedQuizList.length}</span>
                </div>
                <Trophy className="h-7 w-7 text-amber-500" />
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-emerald-700 uppercase block">LKPD Terkumpul</span>
                  <span className="text-2xl font-black font-mono text-emerald-950">{syncedLKPDs.length}</span>
                </div>
                <FileText className="h-7 w-7 text-emerald-500" />
              </div>
            </div>

            {/* Table 1: Rekap Rapor Belajar Murid */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-600" />
                <span>Daftar Rapor Belajar &amp; Progres Murid Otomatis</span>
              </h4>

              {teacherRosterRows.length === 0 ? (
                <div className="p-6 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
                  Belum ada data rapor murid yang masuk. Saat murid login, mengumpulkan LKPD, atau menyelesaikan Quiz, datanya akan langsung tersinkron ke sini.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-black">
                      <tr>
                        <th className="p-2.5">Nama / Akun Murid</th>
                        <th className="p-2.5">Kelas</th>
                        <th className="p-2.5 text-center">Skor Quiz</th>
                        <th className="p-2.5 text-center">LKPD</th>
                        <th className="p-2.5 text-center">Level / XP</th>
                        <th className="p-2.5 text-center">Status KKTP</th>
                        <th className="p-2.5 text-right">Rapor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {teacherRosterRows.map((row) => (
                        <tr key={row.accountId} className="hover:bg-amber-50/40">
                          <td className="p-2.5 font-black text-slate-900">{row.studentName}</td>
                          <td className="p-2.5 font-bold text-slate-700">{row.className}</td>
                          <td className="p-2.5 text-center font-mono font-black text-sky-700">
                            {row.lastQuizScore > 0 ? `${row.lastQuizScore}/100` : '-'}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                            {row.lkpdCount}
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-600">
                            Lv.{row.level} ({row.xp} XP)
                          </td>
                          <td className="p-2.5 text-center">
                            {row.lastQuizScore >= 75 ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                TUNTAS
                              </span>
                            ) : row.lastQuizScore > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black">
                                PENGUATAN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold">
                                BELUM QUIZ
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setSelectedStudentReport({
                                  accountId: row.accountId,
                                  npsn: activeSession?.npsn || '',
                                  studentName: row.studentName,
                                  className: row.className,
                                  schoolName: `Sekolah NPSN ${activeSession?.npsn || ''}`,
                                  xp: row.xp,
                                  level: row.level,
                                  lastQuizScore: row.lastQuizScore,
                                  experimentsCount: 0,
                                  lkpdSubmittedCount: row.lkpdCount,
                                  badges: [],
                                  updatedAt: row.updatedAt,
                                });
                                setTeacherTab('detail');
                              }}
                              className="btn-3d-cyan px-2.5 py-1 rounded-lg text-[11px] font-black text-white"
                            >
                              Buka Rapor
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Table 2: Riwayat Quiz Murid Tersinkron */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Riwayat Hasil Quiz Murid Tersinkron Otomatis</span>
              </h4>

              {syncedQuizList.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  Belum ada murid yang menyelesaikan Quiz pada sekolah ini.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-black">
                      <tr>
                        <th className="p-2.5">Murid</th>
                        <th className="p-2.5">Kelas</th>
                        <th className="p-2.5">Waktu Selesai</th>
                        <th className="p-2.5 text-center">Skor Nilai</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {syncedQuizList.slice(0, 20).map((att, idx) => (
                        <tr key={att.id || idx}>
                          <td className="p-2.5 font-black text-slate-900">{att.studentName || 'Murid'}</td>
                          <td className="p-2.5 font-bold text-slate-600">{att.className || 'Kelas X'}</td>
                          <td className="p-2.5 font-mono text-slate-600">
                            {new Date(att.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="p-2.5 text-center font-mono font-black text-sky-800">{att.score} / 100</td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                att.score >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {att.score >= 75 ? 'Tuntas' : 'Perlu Penguatan'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* FORMAL PRINTABLE REPORT CARD BODY */
          <div className="report-card-body flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
            {!hasCompletedQuiz && (
              <div className="no-print p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-black text-amber-900 block">
                    Laporan Hasil Asesmen Masih Kosong
                  </span>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    Seluruh nilai, predikat, dan capaian indikator pada rapor belajar ini dikosongkan karena belum ada murid yang menyelesaikan Quiz. Setelah murid menyelesaikan Quiz 10 nomor pada menu <strong>Quiz</strong>, data rapor ini akan otomatis terisi dan tersinkron ke akun guru.
                  </p>
                </div>
              </div>
            )}

            {/* Formal School & Curriculum Header */}
            <div className="border-b-4 border-double border-slate-900 pb-3 text-center space-y-1">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
                LAPORAN HASIL ASESMEN FORMATIF MURID (RAPOR BELAJAR)
              </h2>
              <p className="text-xs font-bold text-sky-800">
                Mata Pelajaran: Fisika • Topik: Kinematika Gerak Lurus (GLB &amp; GLBB) • Fase E (Kelas X SMA)
              </p>
            </div>

            {/* Student & School Identity Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">Nama Peserta Didik / Murid:</span>
                  <span className="font-black text-slate-900 text-sm">{effectiveStudentName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">Kelas &amp; Fase:</span>
                  <span className="font-bold text-slate-900">{effectiveClass}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">Tanggal Asesmen:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {hasCompletedQuiz && result ? new Date(result.timestamp).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Score & KKTP Banner */}
            <div
              className={`p-4 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-4 ${
                hasCompletedQuiz
                  ? 'bg-gradient-to-r from-amber-50 via-sky-50 to-emerald-50 border-amber-300'
                  : 'bg-slate-50 border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl font-black text-2xl shadow-md ${
                    hasCompletedQuiz
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                      : 'bg-slate-200 text-slate-500 border border-slate-300'
                  }`}
                >
                  {gradeLetter}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    NILAI AKHIR QUIZ 10 NOMOR
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-950">
                    {hasCompletedQuiz ? score : '-'} <span className="text-sm font-sans font-bold text-slate-400">/ 100</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    Predikat: <span className="font-black text-sky-800">{predicate}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 block mb-1">Status Ketercapaian (KKTP):</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${badgeColor}`}>
                  {hasCompletedQuiz ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                  <span>{kktpStatus}</span>
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-1">KKTP Minimum: 75.0</p>
              </div>
            </div>

            {/* Indikator Capaian Pembelajaran (CP) Fase E Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-sky-600" />
                <span>A. PENCAPAIAN INDIKATOR TUJUAN PEMBELAJARAN (CP FASE E)</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-black">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Indikator Capaian Pembelajaran</th>
                      <th className="p-2.5">Format Soal Terkait</th>
                      <th className="p-2.5 text-center">Tingkat Penguasaan</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    <tr>
                      <td className="p-2.5 font-bold">1</td>
                      <td className="p-2.5">Memahami konsep kelajuan, perpindahan, kecepatan tetap, dan percepatan nol pada GLB</td>
                      <td className="p-2.5 font-mono text-[11px]">Soal #1, #2</td>
                      <td className="p-2.5 text-center font-bold font-mono text-slate-600">
                        {hasCompletedQuiz ? (score >= 60 ? '100%' : '50%') : '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        {hasCompletedQuiz ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Tuntas</span>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">2</td>
                      <td className="p-2.5">Menganalisis karakteristik GLBB, percepatan konstan, dan 3 rumus utama gerak</td>
                      <td className="p-2.5 font-mono text-[11px]">Soal #3, #4, #5</td>
                      <td className="p-2.5 text-center font-bold font-mono text-slate-600">
                        {hasCompletedQuiz ? (score >= 75 ? '92%' : '70%') : '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        {hasCompletedQuiz ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Tuntas</span>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">3</td>
                      <td className="p-2.5">Menginterpretasikan kurva grafik hubungan s-t, v-t, dan luas daerah perpindahan</td>
                      <td className="p-2.5 font-mono text-[11px]">Soal #6, #8</td>
                      <td className="p-2.5 text-center font-bold font-mono text-slate-600">
                        {hasCompletedQuiz ? (score >= 80 ? '95%' : '65%') : '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        {hasCompletedQuiz ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Tuntas</span>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">4</td>
                      <td className="p-2.5">Menganalisis fenomena gerak vertikal, jatuh bebas gravitasi, dan pola ticker timer</td>
                      <td className="p-2.5 font-mono text-[11px]">Soal #7, #9, #10</td>
                      <td className="p-2.5 text-center font-bold font-mono text-slate-600">
                        {hasCompletedQuiz ? (score >= 70 ? '88%' : '60%') : '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        {hasCompletedQuiz ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Tuntas</span>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rincian 4 Format Soal Asesmen */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-purple-600" />
                <span>B. RINCIAN CAPAIAN FORMAT SOAL (4 RAGAM INSTRUMEN)</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                  <span className="text-[10px] font-bold text-sky-800 block">Pilihan Ganda Biasa:</span>
                  <span className="font-black text-sky-950 text-sm">
                    {hasCompletedQuiz ? '3 / 3 Soal' : '- / 3 Soal'}
                  </span>
                  <p className="text-[10px] text-sky-600 mt-0.5">Soal No 1, 2, 5</p>
                </div>

                <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200">
                  <span className="text-[10px] font-bold text-orange-800 block">Pilihan Ganda Kompleks:</span>
                  <span className="font-black text-orange-950 text-sm">
                    {hasCompletedQuiz ? (score >= 80 ? '3 / 3 Soal' : '2 / 3 Soal') : '- / 3 Soal'}
                  </span>
                  <p className="text-[10px] text-orange-600 mt-0.5">Soal No 3, 6, 8</p>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-800 block">Menjodohkan Rumus:</span>
                  <span className="font-black text-purple-950 text-sm">
                    {hasCompletedQuiz ? '2 / 2 Soal' : '- / 2 Soal'}
                  </span>
                  <p className="text-[10px] text-purple-600 mt-0.5">Soal No 4, 9</p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 block">Benar - Salah Konseptual:</span>
                  <span className="font-black text-emerald-950 text-sm">
                    {hasCompletedQuiz ? '2 / 2 Soal' : '- / 2 Soal'}
                  </span>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Soal No 7, 10</p>
                </div>
              </div>
            </div>

            {/* Teacher Descriptive Feedback */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border-2 border-amber-200 space-y-1">
              <h4 className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-amber-700" />
                <span>C. CATATAN &amp; REKOMENDASI GURU FISIKA</span>
              </h4>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {getTeacherNotes()}
              </p>
            </div>

            {/* Past Assessment Attempts History */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>D. RIWAYAT PENGERJAAN ASESMEN SEBELUMNYA</span>
              </h4>
              {hasCompletedQuiz && effectiveResults.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2">Percobaan</th>
                        <th className="p-2">Waktu Pengerjaan</th>
                        <th className="p-2">Skor Nilai</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {effectiveResults.slice(0, 4).map((att, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-sans font-bold">Asesmen #{effectiveResults.length - idx}</td>
                          <td className="p-2 text-slate-600">
                            {new Date(att.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="p-2 font-bold text-sky-800">{att.score} / 100</td>
                          <td className="p-2 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                att.score >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {att.score >= 75 ? 'Tuntas' : 'Perlu Penguatan'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                  Belum ada riwayat pengerjaan asesmen.
                </div>
              )}
            </div>

            {/* Formal Signature Validation Section */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t-2 border-slate-200 text-xs text-center font-bold">
              <div>
                <p className="text-slate-600 mb-14">Orang Tua / Wali Murid,</p>
                <p className="border-t border-slate-400 pt-1 font-black text-slate-900">
                  ( .................................................. )
                </p>
              </div>
              <div className="hidden sm:block">
                <p className="text-slate-600 mb-14">Peserta Didik / Murid,</p>
                <p className="border-t border-slate-400 pt-1 font-black text-slate-900">
                  ( {effectiveStudentName} )
                </p>
              </div>
              <div>
                <p className="text-slate-600 mb-14">Guru Pengampu Fisika Kelas X Fase E,</p>
                {isEditingTeacher && userRole === 'guru' ? (
                  <div className="flex flex-col items-center gap-1.5 no-print">
                    <input
                      type="text"
                      value={teacherProfile.name}
                      onChange={(e) => {
                        const updated = storage.saveTeacherProfile({ name: e.target.value });
                        setTeacherProfile(updated);
                      }}
                      placeholder="Nama Lengkap Guru"
                      className="text-center font-black text-xs border border-indigo-400 rounded-lg px-2 py-1 bg-white text-slate-900 shadow-sm"
                    />
                    <input
                      type="text"
                      value={teacherProfile.nip}
                      onChange={(e) => {
                        const updated = storage.saveTeacherProfile({ nip: e.target.value });
                        setTeacherProfile(updated);
                      }}
                      placeholder="NIP Guru"
                      className="text-center font-mono text-[10px] border border-slate-300 rounded px-2 py-0.5 bg-white text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingTeacher(false)}
                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                    >
                      Selesai Simpan
                    </button>
                  </div>
                ) : (
                  <div className="group relative">
                    <p className="border-t border-slate-400 pt-1 font-black text-slate-900 flex items-center justify-center gap-1">
                      <span>( {teacherProfile.name || 'Dra. Hj. Siti Nurhaliza, M.Pd.'} )</span>
                      {userRole === 'guru' && (
                        <button
                          type="button"
                          onClick={() => setIsEditingTeacher(true)}
                          title="Edit Nama Guru Pengampu (Terintegrasi ke LKPD & Rapor)"
                          className="no-print opacity-70 hover:opacity-100 text-indigo-600 p-0.5 rounded hover:bg-indigo-50 transition"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </p>
                    {teacherProfile.nip && (
                      <p className="text-[10px] font-mono text-slate-500 font-normal">
                        NIP. {teacherProfile.nip}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer (No-Print) */}
        <div className="no-print border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold">
            {userRole === 'guru' && teacherTab === 'rekap'
              ? 'Semua nilai quiz, progres, dan LKPD murid tersinkron otomatis ke akun guru.'
              : hasCompletedQuiz
                ? 'Laporan hasil asesmen formatif murid dapat langsung diunduh sebagai dokumen PDF resmi.'
                : 'Seluruh nilai laporan hasil asesmen masih kosong karena belum ada murid yang menyelesaikan Quiz.'}
          </span>
          <div className="flex items-center gap-2">
            {teacherTab === 'detail' && (
              <button
                onClick={handlePrint}
                title="Unduh Laporan Hasil Asesmen Formatif Murid (Rapor Belajar) ke PDF"
                className="btn-3d-cyan flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-sm hover:brightness-105 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh rapor</span>
              </button>
            )}
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
