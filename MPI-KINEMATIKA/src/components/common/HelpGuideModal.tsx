import React from 'react';
import { HelpCircle, X, Compass, Layers, Monitor, Keyboard } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-sky-300 bg-white p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-sky-600" />
            <div>
              <h3 className="text-base font-black text-slate-900">Panduan Pembelajaran MPI Kinematika Gerak Lurus</h3>
              <p className="text-xs text-slate-500">Media Pembelajaran Interaktif (MPI) Fisika Kelas X Fase E (Kurikulum Merdeka)</p>
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

        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4 space-y-1.5">
            <h4 className="font-black text-sky-950 text-xs flex items-center gap-1.5 uppercase">
              <Compass className="h-4 w-4 text-sky-700" /> Alur Belajar Kinematika Terpadu
            </h4>
            <p>1. <strong>Beranda:</strong> Eksplorasi konsep awal dan panduan belajar MPI.</p>
            <p>2. <strong>Modul Digital:</strong> Baca materi GLB &amp; GLBB, rumus, dan coba kalkulator rumus.</p>
            <p>3. <strong>Simulasi &amp; LKPD:</strong> Jalankan percobaan virtual, amati tabel data, dan isi lembar kerja.</p>
            <p>4. <strong>Papan Tulis Interaktif:</strong> Papan tulis digital untuk penjelasan konsep dan anotasi grafik.</p>
            <p>5. <strong>Quiz:</strong> Evaluasi pemahaman dengan 4 ragam bentuk soal dan ulasan.</p>
            <p>6. <strong>Refleksi:</strong> Tuliskan pemahaman diri dan simpan jurnal refleksi belajar.</p>
          </div>

          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 space-y-1.5">
            <h4 className="font-black text-purple-950 text-xs flex items-center gap-1.5 uppercase">
              <Monitor className="h-4 w-4 text-purple-700" /> Optimasi Papan Interaktif Digital & Layar Sentuh
            </h4>
            <p>• Aplikasi dirancang ramah layar sentuh (touch-friendly) dengan tombol bervolume 3D yang jelas.</p>
            <p>• Setiap menu dilengkapi scroll view halus dan tombol cepat kembali ke atas halaman.</p>
            <p>• LKPD Digital dan Jurnal Refleksi dapat langsung dicetak atau disimpan dalam bentuk PDF resmi.</p>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 space-y-2">
            <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5 uppercase">
              <Keyboard className="h-4 w-4 text-sky-600" /> Petunjuk Navigasi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-slate-700">
              <div>• Gunakan bilah navigasi di atas untuk langsung melompat ke 6 menu utama.</div>
              <div>• Tombol panah "Ke Atas" di kanan bawah mengembalikan layar ke posisi atas menu.</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="btn-3d-cyan w-full py-2.5 text-xs font-black text-white rounded-xl"
        >
          Mengerti & Tutup Panduan
        </button>
      </div>
    </div>
  );
};
