import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Users, 
  Award, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  BarChart3, 
  User, 
  GraduationCap, 
  RotateCcw,
  BookOpen,
  Box
} from 'lucide-react';
import { UserRole } from '../../types/physics';
import { storage } from '../../utils/storage';
import { sounds } from '../../utils/soundEffects';

interface EvaluationCenterProps {
  userRole?: UserRole;
}

export const EvaluationCenter: React.FC<EvaluationCenterProps> = () => {
  const [activeTab, setActiveTab] = useState<'pretest' | 'posttest' | 'analytics' | 'history'>('analytics');
  const [classRecords, setClassRecords] = useState(storage.getTeacherClassRecords());
  const [studentProgress, setStudentProgress] = useState(storage.getProgress());
  const [experimentsHistory, setExperimentsHistory] = useState(storage.getExperiments());

  // Quick Pretest / Posttest State
  const [testMode, setTestMode] = useState<'pretest' | 'posttest' | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testScore, setTestScore] = useState<number | null>(null);

  const testQuestions = [
    {
      q: 'Sebuah benda dikatakan melakukan GLB jika memiliki...',
      opts: ['Kecepatan berubah beraturan', 'Kecepatan konstan dan percepatan nol', 'Percepatan berubah beraturan', 'Kecepatan nol dan percepatan konstan'],
      ans: 1
    },
    {
      q: 'Rumus posisi akhir pada GLBB dengan percepatan konstan adalah...',
      opts: ['s = v / t', 's = v₀ · t + ½ · a · t²', 's = a · t²', 's = v₀ · t - a · t'],
      ans: 1
    },
    {
      q: 'Gradien kemiringan pada kurva kecepatan terhadap waktu (v-t) menyatakan...',
      opts: ['Jarak tempuh', 'Perpindahan', 'Percepatan', 'Gaya gesek'],
      ans: 2
    },
    {
      q: 'Luas daerah di bawah grafik kecepatan terhadap waktu (v-t) menyatakan...',
      opts: ['Perpindahan / Jarak tempuh', 'Percepatan rata-rata', 'Daya mekanik', 'Tekanan'],
      ans: 0
    },
    {
      q: 'Jika v₀ = 4 m/s, a = 2 m/s², maka kecepatan benda setelah t = 3 sekon adalah...',
      opts: ['8 m/s', '10 m/s', '12 m/s', '14 m/s'],
      ans: 1
    }
  ];

  const handleStartTest = (type: 'pretest' | 'posttest') => {
    sounds.playStart();
    setTestMode(type);
    setTestAnswers({});
    setTestScore(null);
  };

  const handleSubmitTest = () => {
    let correct = 0;
    testQuestions.forEach((q, idx) => {
      if (testAnswers[idx] === q.ans) correct++;
    });
    const finalScore = Math.round((correct / testQuestions.length) * 100);
    setTestScore(finalScore);

    if (finalScore >= 70) {
      sounds.playSuccess();
    } else {
      sounds.playError();
    }

    if (testMode === 'pretest') {
      storage.saveProgress({ pretestScore: finalScore });
    } else if (testMode === 'posttest') {
      storage.saveProgress({ posttestScore: finalScore });
    }
    setStudentProgress(storage.getProgress());
  };

  const handleExportCSV = () => {
    sounds.playClick();
    const headers = ['No', 'Nama Murid', 'NIS', 'Skor GLB', 'Skor GLBB', 'Pretest', 'Posttest', 'Aktivitas Lab', 'Status'];
    const rows = classRecords.map((r, i) => [
      i + 1,
      r.name,
      r.nis,
      r.glbScore,
      r.glbbScore,
      r.pretest,
      r.posttest,
      r.labActivities,
      r.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_nilai_kinematika_kelas_xi.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Class stats
  const totalStudents = classRecords.length;
  const avgPosttest = Math.round(classRecords.reduce((acc, c) => acc + c.posttest, 0) / totalStudents);
  const passCount = classRecords.filter((c) => c.status === 'TUNTAS').length;
  const passRate = Math.round((passCount / totalStudents) * 100);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pt-16 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
              ASESMEN & LEARNING ANALYTICS
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2 mt-1">
              <ClipboardCheck className="h-7 w-7 text-rose-400" />
              Pusat Evaluasi Pembelajaran
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Penilaian formatif, sumatif, pretest/posttest, dan dashboard analisis ketercapaian belajar
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'analytics' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rekapitulasi Kelas (Guru)
            </button>
            <button
              onClick={() => setActiveTab('pretest')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'pretest' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ujian & Asesmen
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'history' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Portofolio Murid
            </button>
          </div>
        </div>

        {/* Tab 1: Teacher Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xs text-slate-400 block mb-1">Total Peserta Didik</span>
                <span className="text-2xl font-black text-white font-mono">{totalStudents} Murid</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xs text-slate-400 block mb-1">Rata-Rata Posttest</span>
                <span className="text-2xl font-black text-cyan-400 font-mono">{avgPosttest} / 100</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xs text-slate-400 block mb-1">Tingkat Ketuntasan (KKTP)</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{passRate}%</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xs text-slate-400 block mb-1">Perlu Remedial</span>
                <span className="text-2xl font-black text-rose-400 font-mono">{totalStudents - passCount} Murid</span>
              </div>
            </div>

            {/* Class Roster Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-400" />
                    Daftar Nilai Murid Kelas X Fase E
                  </h3>
                  <p className="text-xs text-slate-400">Rekapitulasi nilai pemahaman GLB, GLBB, dan aktivitas praktikum</p>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Ekspor Rekap (CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                    <tr>
                      <th className="p-3">No</th>
                      <th className="p-3">Nama Murid</th>
                      <th className="p-3">NIS</th>
                      <th className="p-3">Nilai GLB</th>
                      <th className="p-3">Nilai GLBB</th>
                      <th className="p-3">Pretest</th>
                      <th className="p-3">Posttest</th>
                      <th className="p-3">Sesi Lab</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {classRecords.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-slate-900/60">
                        <td className="p-3 text-slate-500">{idx + 1}</td>
                        <td className="p-3 text-white font-sans font-semibold">{st.name}</td>
                        <td className="p-3 text-slate-400">{st.nis}</td>
                        <td className="p-3 text-cyan-300">{st.glbScore}</td>
                        <td className="p-3 text-orange-300">{st.glbbScore}</td>
                        <td className="p-3 text-slate-400">{st.pretest}</td>
                        <td className="p-3 text-emerald-400 font-bold">{st.posttest}</td>
                        <td className="p-3 text-purple-300">{st.labActivities}x</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.status === 'TUNTAS'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}>
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pretest / Posttest Interactive Engine */}
        {activeTab === 'pretest' && (
          <div className="space-y-6">
            {!testMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pretest Card */}
                <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/70 p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                      Asesmen Diagnostik
                    </span>
                    <h3 className="text-xl font-bold text-white mt-2">PRETEST KINEMATIKA</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Tes awal untuk mengukur pemahaman awal sebelum memulai modul. Tidak mempengaruhi nilai rapor.
                    </p>
                    <div className="mt-4 text-xs font-mono text-slate-400">
                      Nilai Terakhir: <strong className="text-cyan-400">{studentProgress.pretestScore ?? 'Belum Ujian'}</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartTest('pretest')}
                    className="w-full rounded-xl bg-cyan-500 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                  >
                    Mulai Pretest Sekarang
                  </button>
                </div>

                {/* Posttest Card */}
                <div className="rounded-3xl border border-orange-500/30 bg-slate-900/70 p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/30">
                      Asesmen Sumatif
                    </span>
                    <h3 className="text-xl font-bold text-white mt-2">POSTTEST KINEMATIKA</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Evaluasi tuntas di akhir materi untuk mengukur peningkatan capaian pembelajaran (KKTP).
                    </p>
                    <div className="mt-4 text-xs font-mono text-slate-400">
                      Nilai Terakhir: <strong className="text-orange-400">{studentProgress.posttestScore ?? 'Belum Ujian'}</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartTest('posttest')}
                    className="w-full rounded-xl bg-orange-500 py-3 text-xs font-bold text-slate-950 hover:bg-orange-400 transition"
                  >
                    Mulai Posttest Sekarang
                  </button>
                </div>
              </div>
            ) : (
              /* Test execution view */
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white uppercase font-mono">
                    {testMode === 'pretest' ? 'Asesmen Pretest' : 'Asesmen Posttest'}
                  </h3>
                  <button
                    onClick={() => setTestMode(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Tutup Ujian
                  </button>
                </div>

                <div className="space-y-6">
                  {testQuestions.map((item, qIdx) => (
                    <div key={qIdx} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        {qIdx + 1}. {item.q}
                      </p>
                      <div className="space-y-2">
                        {item.opts.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className={`flex items-center gap-3 rounded-xl p-3 text-xs border cursor-pointer transition ${
                              testAnswers[qIdx] === oIdx
                                ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`test_q_${qIdx}`}
                              checked={testAnswers[qIdx] === oIdx}
                              onChange={() => {
                                sounds.playClick();
                                setTestAnswers({ ...testAnswers, [qIdx]: oIdx });
                              }}
                              className="hidden"
                            />
                            <span className="font-mono text-slate-500">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {testScore === null ? (
                  <button
                    disabled={Object.keys(testAnswers).length < testQuestions.length}
                    onClick={handleSubmitTest}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 transition"
                  >
                    Kirim Lembar Jawaban Asesmen
                  </button>
                ) : (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 text-center space-y-3">
                    <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
                    <h4 className="text-lg font-bold text-white">Asesmen Selesai!</h4>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                      Skor: {testScore} / 100
                    </div>
                    <button
                      onClick={() => setTestMode(null)}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition"
                    >
                      Kembali ke Menu Asesmen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Student Portfolio & Lab Run History */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Box className="h-5 w-5 text-orange-400" />
                Riwayat Rekaman Eksperimen Virtual Lab ({experimentsHistory.length})
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Setiap kali Anda menekan "Simpan Sesi" di Virtual Lab, rekaman snapshot parameter disimpan di sini.
              </p>

              <div className="space-y-3">
                {experimentsHistory.map((run) => (
                  <div
                    key={run.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          run.params.motionType === 'GLB' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30' : 'bg-orange-950 text-orange-400 border border-orange-500/30'
                        }`}>
                          {run.params.motionType}
                        </span>
                        <span className="font-bold text-white">{run.title}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        Waktu: {run.date} • Posisi Akhir: {run.finalPosition.toFixed(2)}m • Kecepatan Akhir: {run.finalVelocity.toFixed(2)}m/s
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-500/20">
                      {run.telemetry.length} Titik Data Terverifikasi
                    </span>
                  </div>
                ))}

                {experimentsHistory.length === 0 && (
                  <p className="p-8 text-center text-xs text-slate-500">
                    Belum ada riwayat eksperimen yang disimpan. Buka Virtual Lab 3D untuk mencoba!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
