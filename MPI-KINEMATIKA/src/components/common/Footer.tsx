import React from 'react';
import { Compass, BookOpen, Layers, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t-2 border-slate-200 bg-white py-8 text-xs text-slate-600 no-print">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-black text-sm text-sky-700 tracking-wider">
                MPI FISIKA KELAS X FASE E
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Media Pembelajaran Interaktif (MPI) Fisika Kelas X Fase E Kinematika Gerak Lurus (GLB &amp; GLBB) dengan simulasi virtual lab, LKPD digital, kuis multi-format, dan refleksi mandiri.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 font-black mb-2 flex items-center gap-1.5 text-xs">
              <Compass className="h-4 w-4 text-sky-600" />
              Capaian Pembelajaran (CP)
            </h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Murid mampu menganalisis gerak dua dimensi.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 font-black mb-2 flex items-center gap-1.5 text-xs">
              <Layers className="h-4 w-4 text-orange-600" />
              Tujuan Pembelajaran (TP)
            </h4>
            <ol className="space-y-1.5 text-[11px] text-slate-500 leading-relaxed list-decimal list-outside pl-4">
              <li>
                Murid dapat menganalisis karakteristik Gerak Lurus Beraturan (GLB) dan Gerak Lurus Berubah Beraturan (GLBB) melalui interpretasi grafik hubungan jarak, kecepatan, dan percepatan terhadap waktu serta mengaplikasikan persamaannya untuk menyelesaikan masalah.
              </li>
              <li>
                Murid melakukan percobaan gerak lurus (GLB dan GLBB), mengolah data menjadi grafik, serta menganalisisnya untuk memverifikasi konsep yang dipelajari.
              </li>
            </ol>
          </div>

          <div>
            <h4 className="text-slate-900 font-black mb-2 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              Validasi Sains Fisika
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Semua perhitungan gerak diuji secara ilmiah konsisten dengan standar SI dan persamaan gerak kinematika 1 dimensi ($s = vt$, $v_t = v_0 + at$, $s = v_0 t + \frac{1}{2}at^2$).
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            Kurikulum Merdeka · Fisika SMA Kelas X Fase E · Kinematika Gerak Lurus
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-slate-700 font-semibold">
              Pengembang: <strong className="text-sky-900">Yeyen Atusman Mangidi, S.Pd., Gr</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-sky-700 font-bold font-mono">PWA Offline-First</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
