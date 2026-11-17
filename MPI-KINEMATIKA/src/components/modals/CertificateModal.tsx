import React from 'react';
import { X, Award, CheckCircle, Printer, Download, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { storage } from '../../utils/storage';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  score?: number;
  dateStr?: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  studentName = "Andi Pratama",
  score = 92,
  dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar */}
        <div className="bg-slate-900 px-6 py-3 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Sparkles className="w-4 h-4" />
            <span>Sertifikat Kelulusan Resmi Newton Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerConfetti}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium"
            >
              🎉 Rayakan
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Sheet (Printable) */}
        <div className="p-8 bg-gradient-to-br from-amber-50/50 via-white to-sky-50/40 relative overflow-hidden flex flex-col items-center text-center border-8 border-double border-amber-200 m-3 rounded-2xl shadow-inner">
          {/* Subtle Watermark Atom */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 opacity-5 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="currentColor" className="text-slate-900">
              <ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(0 50 50)" stroke="currentColor" fill="none" strokeWidth="2" />
              <ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(60 50 50)" stroke="currentColor" fill="none" strokeWidth="2" />
              <ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(120 50 50)" stroke="currentColor" fill="none" strokeWidth="2" />
              <circle cx="50" cy="50" r="6" />
            </svg>
          </div>

          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-0.5 shadow-lg mb-3">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <Award className="w-9 h-9 text-amber-500" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">SERTIFIKAT PENGHARGAAN</h2>
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-1 font-semibold">
            Newton Physics Learning Hub • Master Inersia & Dinamika Gerak
          </p>

          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-sky-400 rounded-full my-4" />

          <p className="text-xs text-slate-600">Diberikan secara terhormat kepada:</p>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-900 mt-1 mb-2 font-serif tracking-wide border-b-2 border-slate-300 pb-1 px-8">
            {studentName}
          </div>
          <p className="text-xs text-slate-500 font-medium">Murid Kelas X — SMA Fase E</p>

          <p className="text-xs text-slate-700 max-w-lg mt-4 leading-relaxed">
            Telah menyelesaikan seluruh rangkaian modul <strong>Hukum Newton I, II, dan III</strong>,
            berhasil mengeksekusi simulasi virtual lab, dan lulus evaluasi komprehensif dengan predikat istimewa:
          </p>

          {/* Score Badge */}
          <div className="mt-4 inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-2xl shadow-md">
            <div className="text-xs uppercase tracking-wider text-blue-200">Nilai Akhir:</div>
            <div className="text-xl font-black">{score} / 100</div>
            <div className="h-4 w-px bg-white/30" />
            <div className="text-xs font-bold text-yellow-300">Lulus Berprestasi ⭐</div>
          </div>

          {/* Date & Signatures */}
          <div className="w-full grid grid-cols-2 mt-8 pt-6 border-t border-slate-200 text-xs text-slate-600">
            <div>
              <p className="font-bold text-slate-900">{storage.getTeacherProfile().name || 'Dra. Hj. Siti Nurhaliza, M.Pd.'}</p>
              <p className="text-[10px] text-slate-500">Guru Pengampu Fisika Kelas X Fase E</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">{dateStr}</p>
              <p className="text-[10px] text-slate-500">Terverifikasi Digital via MPI Fisika</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 no-print">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> ID Sertifikat: NWT-2026-X92-004
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
