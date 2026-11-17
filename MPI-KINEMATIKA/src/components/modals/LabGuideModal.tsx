import React from 'react';
import { X, HelpCircle, ArrowRight, Gauge, Scale, Activity } from 'lucide-react';

interface LabGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabGuideModal: React.FC<LabGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-sky-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <HelpCircle className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Panduan Laboratorium Virtual</h3>
              <p className="text-xs text-blue-100">Eksplorasi Hukum II Newton (F = m · a)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex gap-3 items-start">
            <div className="p-2 bg-sky-500 text-white rounded-xl font-bold text-xs mt-0.5">Rumus</div>
            <div>
              <div className="font-bold text-sky-900 text-base">F = m × a &nbsp;atau&nbsp; a = F / m</div>
              <p className="text-xs text-sky-700 mt-1">
                Gaya (F dalam Newton) sebanding dengan massa (m dalam kg) dikali percepatan (a dalam m/s²).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-500" /> Atur Massa (m)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Geser slider massa kereta (1 kg hingga 10 kg). Semakin besar massa, semakin besar kelembaman benda (semakin sulit dipercepat).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-indigo-500" /> Atur Gaya Dorong (F)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Atur besaran gaya horizontal (0 N hingga 50 N). Perhatikan panjang panah merah yang mewakili vektor gaya resultan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" /> Jalankan & Amati Grafik
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Klik tombol <strong>▶ Jalankan</strong> untuk melihat troli melaju. Grafik F vs a akan memetakan titik data secara presisi membentuk garis linear lurus!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-transform active:scale-95"
          >
            <span>Saya Paham, Mulai Eksplorasi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
