import React, { useState } from 'react';
import { 
  Download, 
  Laptop, 
  Smartphone, 
  Tv, 
  Monitor, 
  CheckCircle2, 
  X, 
  Sparkles, 
  HelpCircle,
  Share2,
  PlusSquare,
  ShieldCheck
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'laptop' | 'pid' | 'android' | 'ios'>('laptop');

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    sounds.playClick();
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        sounds.playSuccess();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="card-3d-volumetric w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 border-sky-300 overflow-hidden space-y-0 text-slate-900">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 border-2 border-white/40 shadow-inner">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                PWA MULTI-PLATFORM READY
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                Download &amp; Pasang Aplikasi Fisika
              </h3>
              <p className="text-xs text-sky-100 font-medium">
                Kompatibel penuh untuk Laptop, Layar PID Kelas, Komputer PC, &amp; Handphone
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          
          {/* Quick Install Action Button (if browser supports beforeinstallprompt) */}
          {isInstallable && !isInstalled && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border-2 border-emerald-400 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-black text-slate-900 text-xs sm:text-sm">
                    Perangkat Anda Siap Menginstal Langsung!
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    Klik tombol di samping untuk memasang aplikasi ke layar utama secara otomatis.
                  </div>
                </div>
              </div>

              <button
                onClick={handleInstallClick}
                className="btn-3d-emerald px-4 py-2 rounded-xl font-black text-xs text-white shadow-md flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>PASANG SEKARANG</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Aplikasi ini telah terpasang di perangkat Anda sebagai aplikasi mandiri (standalone).</span>
            </div>
          )}

          {/* Device Tabs */}
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
              Pilih Panduan Pemasangan Berdasarkan Perangkat:
            </div>

            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 font-bold">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('laptop');
                }}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition ${
                  activeTab === 'laptop'
                    ? 'bg-sky-600 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="h-4 w-4" />
                <span className="text-[10px]">Laptop / PC</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('pid');
                }}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition ${
                  activeTab === 'pid'
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tv className="h-4 w-4" />
                <span className="text-[10px]">Layar PID</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('android');
                }}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition ${
                  activeTab === 'android'
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-[10px]">Android HP</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('ios');
                }}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition ${
                  activeTab === 'ios'
                    ? 'bg-purple-600 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-[10px]">iPhone / iPad</span>
              </button>
            </div>
          </div>

          {/* Device Guide Content */}
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 leading-relaxed text-slate-700">
            {activeTab === 'laptop' && (
              <div className="space-y-2">
                <div className="font-black text-slate-900 flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-sky-600" />
                  <span>Pemasangan di Laptop / Komputer (Windows, Mac, Linux):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium text-slate-700">
                  <li>Buka aplikasi menggunakan peramban <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong>.</li>
                  <li>Lihat pada sudut kanan atas bilah alamat URL (Address Bar), klik ikon <strong>"Install / Pasang Aplikasi"</strong> (<Download className="inline h-3.5 w-3.5 text-sky-600" />).</li>
                  <li>Atau klik menu titik tiga (⋮) di Chrome ➔ pilih <strong>"Simpan dan Bagikan"</strong> ➔ <strong>"Pasang PHYSICS MOTION LAB"</strong>.</li>
                  <li>Ikon aplikasi akan otomatis muncul di Desktop &amp; Start Menu, berjalan cepat tanpa frame browser.</li>
                </ol>
              </div>
            )}

            {activeTab === 'pid' && (
              <div className="space-y-2">
                <div className="font-black text-slate-900 flex items-center gap-2">
                  <Tv className="h-4 w-4 text-indigo-600" />
                  <span>Pemasangan di Layar PID (Papan Interaktif Digital Smartboard Sekolah):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium text-slate-700">
                  <li>Buka browser bawaan PID (Chrome / Chromium / Edge pada Android/Windows OS PID).</li>
                  <li>Klik tombol <strong>"Instal"</strong> di bagian atas menu aplikasi ini atau melalui menu browser (titik tiga) ➔ <strong>"Tambahkan ke Layar Beranda"</strong>.</li>
                  <li>Aplikasi akan tersimpan di halaman beranda Smart Board kelas sehingga guru dan murid dapat membuka materi &amp; kuis battle secara instan cukup dengan satu sentuhan.</li>
                  <li>Mendukung sentuhan multi-touch stylus pen PID tanpa latensi.</li>
                </ol>
              </div>
            )}

            {activeTab === 'android' && (
              <div className="space-y-2">
                <div className="font-black text-slate-900 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  <span>Pemasangan di Handphone Android:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium text-slate-700">
                  <li>Buka tautan ini di browser <strong>Chrome</strong> pada handphone murid.</li>
                  <li>Tekan spanduk <strong>"Tambahkan ke Layar Utama"</strong> yang muncul di bagian bawah layar.</li>
                  <li>Jika tidak muncul, sentuh menu titik tiga (⋮) di pojok kanan atas Chrome ➔ pilih <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                  <li>Aplikasi akan terpasang layaknya aplikasi Play Store dengan ukuran sangat ringan (&lt; 2 MB).</li>
                </ol>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-2">
                <div className="font-black text-slate-900 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-purple-600" />
                  <span>Pemasangan di iPhone &amp; iPad (iOS Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium text-slate-700">
                  <li>Buka tautan ini menggunakan peramban <strong>Safari</strong> (bukan Chrome di iOS).</li>
                  <li>Sentuh ikon <strong>Bagikan / Share</strong> (<Share2 className="inline h-3.5 w-3.5 text-purple-600" />) di bagian bawah layar.</li>
                  <li>Gulir ke bawah dan pilih opsi <strong>"Tambahkan ke Layar Utama (Add to Home Screen)"</strong> (<PlusSquare className="inline h-3.5 w-3.5 text-purple-600" />).</li>
                  <li>Tekan <strong>"Tambah / Add"</strong> di pojok kanan atas. Ikon aplikasi akan langsung hadir di layar utama iPhone.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Highlights & Security */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-600">
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-emerald-600 block text-xs mb-0.5">⚡ Ringan</span>
              Tanpa unduh file berat
            </div>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-sky-600 block text-xs mb-0.5">📶 Offline Ready</span>
              Tetap jalan tanpa kuota
            </div>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-indigo-600 block text-xs mb-0.5">🛡️ Aman</span>
              Standar PWA Google &amp; W3C
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Progressive Web App (PWA) Standar Resmi Kemendikbudristek</span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
