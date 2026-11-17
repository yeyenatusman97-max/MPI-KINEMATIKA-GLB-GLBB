import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, X } from 'lucide-react';
import { runPhysicsValidationTests } from '../../utils/physicsEngine';
import { sounds } from '../../utils/soundEffects';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const testResults = runPhysicsValidationTests();
  const allPassed = testResults.every((t) => t.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border-2 border-emerald-300 bg-white p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <div>
              <h3 className="text-base font-black text-slate-900">Uji Validasi Ilmiah Rumus Fisika</h3>
              <p className="text-xs text-slate-500">Verifikasi akurasi matematis rumus GLB dan GLBB Kelas X Fase E</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {testResults.map((test, idx) => (
            <div
              key={idx}
              className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">{test.testName}</span>
                <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                  test.passed ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}>
                  {test.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-rose-600" />}
                  {test.passed ? 'VALID 100%' : 'GAGAL'}
                </span>
              </div>
              <div className="text-[11px] font-mono grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div>Ekspektasi: <span className="font-bold text-sky-800">{test.expected}</span></div>
                <div>Aktual: <span className="font-bold text-emerald-800">{test.actual}</span></div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="btn-3d-emerald w-full py-2.5 text-xs font-black text-white rounded-xl"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
