import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Trash2,
  Printer,
  Eye,
  RotateCcw,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  MessageSquarePlus,
  Send,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { SavedLKPDRecord, UserRole } from '../../types/physics';
import { sounds } from '../../utils/soundEffects';
import { storage } from '../../utils/storage';

interface SavedLKPDModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: UserRole;
  schoolNpsn?: string;
  teacherName?: string;
  savedRecords: SavedLKPDRecord[];
  onDeleteRecord: (id: string) => void;
  onLoadRecord: (record: SavedLKPDRecord) => void;
  onSubmitFeedback?: (submissionId: string, feedbackText: string) => void;
}

export const SavedLKPDModal: React.FC<SavedLKPDModalProps> = ({
  isOpen,
  onClose,
  userRole = 'guru',
  schoolNpsn,
  teacherName,
  savedRecords,
  onDeleteRecord,
  onLoadRecord,
  onSubmitFeedback,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<SavedLKPDRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRecord) {
      const fresh = savedRecords.find((r) => r.id === selectedRecord.id);
      if (fresh) {
        setSelectedRecord(fresh);
      }
    }
  }, [savedRecords, selectedRecord]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handlePrint = (rec: SavedLKPDRecord) => {
    sounds.playClick();
    setSelectedRecord(rec);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleExecuteDelete = (id: string, groupName: string) => {
    sounds.playSuccess();
    onDeleteRecord(id);
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
    }
    setConfirmDeleteId(null);
    showToast(`Data LKPD "${groupName || 'Murid'}" berhasil dihapus.`);
  };

  const handleOpenFeedbackBox = (rec: SavedLKPDRecord) => {
    sounds.playClick();
    setEditingFeedbackId(rec.id);
    setFeedbackDraft(rec.teacherFeedback || '');
  };

  const handleSaveFeedback = (rec: SavedLKPDRecord) => {
    const trimmed = feedbackDraft.trim();
    if (!trimmed) {
      sounds.playError();
      showToast('Isi pesan umpan balik terlebih dahulu sebelum mengirim.');
      return;
    }
    sounds.playSuccess();
    if (onSubmitFeedback) {
      onSubmitFeedback(rec.id, trimmed);
    } else {
      storage.saveLKPDFeedback(rec.id, trimmed, teacherName || storage.getTeacherProfile().name, rec.npsn);
    }
    setEditingFeedbackId(null);
    showToast(`Umpan balik terkirim ke akun murid (${rec.groupName || rec.className})!`);
  };

  const feedbackPresets = [
    'Bagus sekali! Data percobaan GLB & GLBB serta interpretasi grafiknya sudah akurat.',
    'Analisis sudah baik, lengkapi penjelasan hubungan gradien kurva s-t dengan kecepatan.',
    'Kesimpulan sudah tepat. Pertahankan ketelitian dalam pembacaan ticker timer!',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border-2 border-emerald-300 bg-white shadow-2xl text-slate-900 overflow-hidden">

        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-slate-900 text-white px-4 py-2.5 shadow-2xl border border-emerald-400 flex items-center gap-2 text-xs font-bold animate-bounce">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-100 bg-emerald-50/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex flex-wrap items-center gap-2">
                <span>Daftar LKPD Terkumpul</span>
                {schoolNpsn && (
                  <span className="text-[11px] font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full">
                    NPSN {schoolNpsn}
                  </span>
                )}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Seluruh LKPD yang dikumpulkan murid tersinkron otomatis ke akun guru beserta fitur pengiriman Umpan Balik langsung ke akun masing-masing murid.
              </p>
            </div>
          </div>

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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

          {savedRecords.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 space-y-2">
              <AlertCircle className="h-10 w-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-black text-slate-800">Belum Ada LKPD yang Dikumpulkan Murid</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ketika murid login dengan NPSN sekolah yang sama dan menekan tombol <strong>"Kumpulkan"</strong> pada menu Simulasi &amp; LKPD, data LKPD murid akan otomatis masuk di daftar ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500 px-1">
                <span>Tersinkron {savedRecords.length} LKPD Terkumpul dari Murid:</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {savedRecords.filter((r) => r.feedbackStatus === 'reviewed' || Boolean(r.teacherFeedback)).length} Sudah Diberi Umpan Balik
                  </span>
                  <span className="text-[11px] font-mono text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {savedRecords.filter((r) => !r.teacherFeedback).length} Menunggu Umpan Balik
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {savedRecords.map((rec) => {
                  const hasFeedback = Boolean(rec.teacherFeedback && rec.teacherFeedback.trim().length > 0);
                  const isEditingThis = editingFeedbackId === rec.id;

                  return (
                    <div
                      key={rec.id}
                      className="p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-300 bg-white transition-all shadow-sm space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            {rec.labMode}
                          </span>
                          <h4 className="text-sm font-black text-slate-900">
                            {rec.groupName || rec.groupLeader || 'Kelompok Murid'}
                          </h4>
                          {hasFeedback ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Sudah Diberi Umpan Balik</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span>Menunggu Umpan Balik</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{new Date(rec.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-500 font-bold block">Ketua Kelompok / Murid:</span>
                          <span className="font-bold text-slate-900">{rec.groupLeader || '-'}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-500 font-bold block">Kelas &amp; Tanggal:</span>
                          <span className="font-bold text-slate-900">{rec.className || 'Kelas X · Fase E'} • {rec.date}</span>
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
                        "{rec.conclusion || 'Belum ada kesimpulan praktikum yang dicatat.'}"
                      </div>

                      {/* Umpan Balik Tersimpan Preview */}
                      {hasFeedback && !isEditingThis && (
                        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-indigo-950 flex items-center gap-1.5">
                              <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Umpan Balik Guru ({rec.feedbackBy || teacherName || 'Guru'}):</span>
                            </span>
                            {rec.feedbackAt && (
                              <span className="text-[10px] font-mono text-indigo-600">
                                {new Date(rec.feedbackAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            )}
                          </div>
                          <p className="text-indigo-900 font-semibold leading-snug">{rec.teacherFeedback}</p>
                        </div>
                      )}

                      {/* Inline Teacher Feedback Editor */}
                      {isEditingThis && userRole === 'guru' && (
                        <div className="p-3 rounded-2xl bg-indigo-50/90 border-2 border-indigo-300 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4 text-indigo-600" />
                              <span>Tulis Umpan Balik Langsung untuk Akun Murid ({rec.groupName || rec.className})</span>
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
                              onClick={() => handleSaveFeedback(rec)}
                              className="btn-3d-indigo flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-sm"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Kirim Umpan Balik ke Murid</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              sounds.playClick();
                              setSelectedRecord(rec);
                            }}
                            className="btn-3d-cyan flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Buka Detail LKPD</span>
                          </button>

                          {userRole === 'guru' && (
                            <button
                              onClick={() => handleOpenFeedbackBox(rec)}
                              className="btn-3d-indigo flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white shadow-sm"
                            >
                              <MessageSquarePlus className="h-3.5 w-3.5" />
                              <span>{hasFeedback ? 'Edit Umpan Balik' : 'Beri Umpan Balik'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              sounds.playClick();
                              onLoadRecord(rec);
                              onClose();
                            }}
                            className="btn-3d-emerald flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white shadow-sm"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Muat ke Editor</span>
                          </button>

                          <button
                            onClick={() => handlePrint(rec)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-sm"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {confirmDeleteId === rec.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-xl animate-fadeIn">
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                              <span className="text-xs font-bold text-rose-800">Yakin hapus?</span>
                              <button
                                onClick={() => handleExecuteDelete(rec.id, rec.groupName)}
                                className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm transition"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                setConfirmDeleteId(rec.id);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-700 text-xs font-black hover:bg-rose-100 hover:border-rose-400 transition shadow-sm"
                              title="Hapus data LKPD ini"
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
            </div>
          )}

          {/* Detailed Full Screen Viewer for Selected Record */}
          {selectedRecord && (
            <div className="mt-4 p-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50/40 space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b-2 border-emerald-300 pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-emerald-900 bg-emerald-200 px-2.5 py-0.5 rounded-full">
                    Detail Dokumen LKPD
                  </span>
                  <h4 className="text-base font-black text-slate-900">{selectedRecord.groupName || selectedRecord.className}</h4>
                </div>

                <div className="flex items-center gap-2">
                  {userRole === 'guru' && (
                    <button
                      onClick={() => handleOpenFeedbackBox(selectedRecord)}
                      className="flex items-center gap-1 text-xs font-black text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded-lg border border-indigo-300 transition"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      <span>{selectedRecord.teacherFeedback ? 'Ubah Umpan Balik' : 'Beri Umpan Balik'}</span>
                    </button>
                  )}

                  {confirmDeleteId === selectedRecord.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-xl">
                      <span className="text-xs font-bold text-rose-800">Hapus dokumen ini?</span>
                      <button
                        onClick={() => handleExecuteDelete(selectedRecord.id, selectedRecord.groupName)}
                        className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white text-xs font-black shadow-sm"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(selectedRecord.id)}
                      className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-300 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus LKPD Ini</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      sounds.playClick();
                      onLoadRecord(selectedRecord);
                      onClose();
                    }}
                    className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-300"
                  >
                    Muat ke Editor
                  </button>

                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-300"
                  >
                    Tutup Detail
                  </button>
                </div>
              </div>

              {/* Observation Tables: GLB, GLBB Dipercepat & GLBB Diperlambat */}
              <div className="space-y-4">
                {(() => {
                  const glbList = selectedRecord.glbRows && selectedRecord.glbRows.length > 0
                    ? selectedRecord.glbRows
                    : (selectedRecord.rows || []).filter((r) => !r.type.includes('GLBB'));

                  const legacyGlbb = selectedRecord.glbbRows && selectedRecord.glbbRows.length > 0
                    ? selectedRecord.glbbRows
                    : (selectedRecord.rows || []).filter((r) => r.type.includes('GLBB'));

                  const glbbAccelList = selectedRecord.glbbAccelRows
                    ? selectedRecord.glbbAccelRows
                    : legacyGlbb.filter((r) => r.type.includes('dipercepat') || r.a > 0);

                  const glbbDecelList = selectedRecord.glbbDecelRows
                    ? selectedRecord.glbbDecelRows
                    : legacyGlbb.filter((r) => r.type.includes('diperlambat') || r.a < 0);

                  return (
                    <>
                      <div className="space-y-1.5 p-3 rounded-2xl bg-sky-50/70 border border-sky-200">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-sky-950 uppercase flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-600 text-white text-[10px]">1</span>
                            <span>Tabel 1: Data Percobaan GLB (Kecepatan Konstan, a = 0 m/s²)</span>
                          </h5>
                          <span className="text-[10px] text-sky-700 font-bold">{glbList.length} Titik Data</span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-sky-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-sky-100/70 border-b border-sky-200 font-black text-sky-950">
                              <tr>
                                <th className="p-2 w-14">No</th>
                                <th className="p-2">Waktu (s)</th>
                                <th className="p-2">Posisi (m)</th>
                                <th className="p-2">Kecepatan (m/s)</th>
                                <th className="p-2">Percepatan (m/s²)</th>
                                <th className="p-2">Rasio (s/t)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-mono">
                              {glbList.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-3 text-center text-slate-400 font-sans italic text-[11px]">
                                    Tidak ada data pengamatan GLB yang tercatat pada sesi ini.
                                  </td>
                                </tr>
                              ) : (
                                glbList.map((r, i) => (
                                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-sky-50/30'}>
                                    <td className="p-2 font-bold font-sans text-slate-700">#{r.no}</td>
                                    <td className="p-2 text-sky-800 font-bold">{r.t.toFixed(1)}</td>
                                    <td className="p-2 text-emerald-800 font-bold">{r.s.toFixed(2)}</td>
                                    <td className="p-2 text-sky-700 font-bold">{r.v.toFixed(2)}</td>
                                    <td className="p-2 text-slate-500 font-bold">{r.a.toFixed(2)}</td>
                                    <td className="p-2 text-emerald-700 font-bold font-sans">
                                      {r.t > 0 ? (r.s / r.t).toFixed(2) : r.v.toFixed(2)} m/s
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-600 text-white text-[10px]">2</span>
                            <span>Tabel 2: Data Percobaan GLBB Dipercepat (+a &gt; 0 m/s²)</span>
                          </h5>
                          <span className="text-[10px] text-amber-700 font-bold">{glbbAccelList.length} Titik Data</span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-amber-100/70 border-b border-amber-200 font-black text-amber-950">
                              <tr>
                                <th className="p-2 w-14">No</th>
                                <th className="p-2">Waktu (s)</th>
                                <th className="p-2">Posisi (m)</th>
                                <th className="p-2">Kecepatan (m/s)</th>
                                <th className="p-2">Percepatan (m/s²)</th>
                                <th className="p-2">Status Gerak</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-mono">
                              {glbbAccelList.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-3 text-center text-slate-400 font-sans italic text-[11px]">
                                    Tidak ada data pengamatan GLBB Dipercepat pada sesi ini.
                                  </td>
                                </tr>
                              ) : (
                                glbbAccelList.map((r, i) => (
                                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}>
                                    <td className="p-2 font-bold font-sans text-slate-700">#{r.no}</td>
                                    <td className="p-2 text-amber-800 font-bold">{r.t.toFixed(1)}</td>
                                    <td className="p-2 text-emerald-800 font-bold">{r.s.toFixed(2)}</td>
                                    <td className="p-2 text-amber-700 font-bold">{r.v.toFixed(2)}</td>
                                    <td className="p-2 text-purple-800 font-bold">+{Math.abs(r.a).toFixed(2)}</td>
                                    <td className="p-2 font-sans font-bold text-amber-900">GLBB Dipercepat</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-1.5 p-3 rounded-2xl bg-rose-50/70 border border-rose-200">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-rose-950 uppercase flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-600 text-white text-[10px]">3</span>
                            <span>Tabel 3: Data Percobaan GLBB Diperlambat (-a &lt; 0 m/s²)</span>
                          </h5>
                          <span className="text-[10px] text-rose-700 font-bold">{glbbDecelList.length} Titik Data</span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-rose-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-rose-100/70 border-b border-rose-200 font-black text-rose-950">
                              <tr>
                                <th className="p-2 w-14">No</th>
                                <th className="p-2">Waktu (s)</th>
                                <th className="p-2">Posisi (m)</th>
                                <th className="p-2">Kecepatan (m/s)</th>
                                <th className="p-2">Perlambatan (m/s²)</th>
                                <th className="p-2">Status Gerak</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-mono">
                              {glbbDecelList.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-3 text-center text-slate-400 font-sans italic text-[11px]">
                                    Tidak ada data pengamatan GLBB Diperlambat pada sesi ini.
                                  </td>
                                </tr>
                              ) : (
                                glbbDecelList.map((r, i) => (
                                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-rose-50/30'}>
                                    <td className="p-2 font-bold font-sans text-slate-700">#{r.no}</td>
                                    <td className="p-2 text-rose-800 font-bold">{r.t.toFixed(1)}</td>
                                    <td className="p-2 text-emerald-800 font-bold">{r.s.toFixed(2)}</td>
                                    <td className="p-2 text-rose-700 font-bold">{r.v.toFixed(2)}</td>
                                    <td className="p-2 text-purple-800 font-bold">{r.a.toFixed(2)}</td>
                                    <td className="p-2 font-sans font-bold text-rose-900">GLBB Diperlambat</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Answers */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <p className="font-bold text-slate-800">1. Hubungan waktu (t) dan jarak (s) pada GLB:</p>
                  <p className="text-slate-600 mt-0.5">{selectedRecord.ans1 || '-'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <p className="font-bold text-slate-800">2. Perubahan kecepatan (v) seiring waktu pada GLBB:</p>
                  <p className="text-slate-600 mt-0.5">{selectedRecord.ans2 || '-'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <p className="font-bold text-slate-800">3. Pola ketukan pita ticker timer:</p>
                  <p className="text-slate-600 mt-0.5">{selectedRecord.ans4 || '-'}</p>
                </div>
                {selectedRecord.ans5 !== undefined && (
                  <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
                    <p className="font-bold text-sky-900">4. Analisis &amp; Pembahasan Grafik GLB:</p>
                    <p className="text-slate-700 mt-0.5">{selectedRecord.ans5 || '-'}</p>
                  </div>
                )}
                {selectedRecord.ans6 !== undefined && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <p className="font-bold text-amber-900">5. Analisis &amp; Pembahasan Grafik GLBB (Dipercepat vs Diperlambat):</p>
                    <p className="text-slate-700 mt-0.5">{selectedRecord.ans6 || '-'}</p>
                  </div>
                )}
                <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300">
                  <p className="font-bold text-emerald-950">Kesimpulan Praktikum:</p>
                  <p className="text-emerald-900 mt-0.5 font-medium">{selectedRecord.conclusion || '-'}</p>
                </div>

                {/* Umpan Balik Guru box in Detail View */}
                <div className="p-3 rounded-xl bg-indigo-50 border-2 border-indigo-300 space-y-1.5">
                  <p className="font-black text-indigo-950 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                    <span>Umpan Balik Guru Pengampu:</span>
                  </p>
                  <p className="text-indigo-900 font-semibold">
                    {selectedRecord.teacherFeedback || 'Belum ada umpan balik tertulis. Klik "Beri Umpan Balik" untuk mengirim masukan ke akun murid.'}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs">
                  <div className="text-center space-y-10">
                    <p className="font-semibold text-slate-600">Ketua Kelompok Praktikan,</p>
                    <div>
                      <p className="font-black text-slate-900 underline">{selectedRecord.groupLeader || '............................'}</p>
                      <p className="text-[10px] text-slate-500">Praktikan Fisika</p>
                    </div>
                  </div>
                  <div className="text-center space-y-10">
                    <p className="font-semibold text-slate-600">Guru Pengampu Pembimbing,</p>
                    <div>
                      <p className="font-black text-slate-900 underline">{teacherName || storage.getTeacherProfile().name}</p>
                      <p className="text-[10px] text-slate-500">NIP. {storage.getTeacherProfile().nip || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold">
            Setiap umpan balik yang Anda kirim akan langsung tampil di akun murid yang bersangkutan.
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="btn-3d-cyan px-4 py-1.5 rounded-xl text-xs font-black text-white"
          >
            Tutup Daftar
          </button>
        </div>

      </div>
    </div>
  );
};
