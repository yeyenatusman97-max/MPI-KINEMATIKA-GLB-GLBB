import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Copy, Check, Smartphone, Sparkles, Box, FileText, Share2, Layers } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface SimulasiLKPDQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  labMode?: 'GLB' | 'GLBB';
}

export const SimulasiLKPDQRCodeModal: React.FC<SimulasiLKPDQRCodeModalProps> = ({
  isOpen,
  onClose,
  labMode = 'GLB',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [targetUrl, setTargetUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Build link to direct simulation & LKPD section
    const currentOrigin = window.location.origin || 'https://ais-pre-splw2rcdynb4ztkvxadkia-737384806847.asia-southeast1.run.app';
    const currentPath = window.location.pathname || '/';
    const url = `${currentOrigin}${currentPath}?menu=simulasi#simulasi`;
    setTargetUrl(url);

    QRCode.toDataURL(url, {
      width: 300,
      margin: 1.5,
      color: {
        dark: '#0f766e', // Deep emerald teal
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('Error generating QR Code for Simulasi & LKPD', err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    sounds.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-emerald-400 bg-white p-5 sm:p-6 shadow-2xl text-slate-900 space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  QR Code Akses Handphone Murid
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Praktikum &amp; LKPD
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">
                Pindai kode QR untuk membuka Simulasi Virtual Lab &amp; LKPD di smartphone murid
              </p>
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

        {/* QR Code Presentation Box */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-50/80 via-teal-50/40 to-white border-2 border-emerald-200 text-center space-y-3">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-emerald-300 text-xs font-bold text-emerald-800 shadow-sm">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            <span>Kamera Smartphone • Langsung Terbuka di Browser HP</span>
          </div>

          {/* Scannable QR Code */}
          <div className="p-3 bg-white rounded-2xl border-2 border-emerald-400 shadow-xl relative group">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="QR Code Simulasi & LKPD Digital" 
                className="w-52 h-52 sm:w-60 sm:h-60 rounded-xl"
              />
            ) : (
              <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-slate-400 text-xs font-mono">
                Membuat Kode QR Simulasi...
              </div>
            )}
            
            {/* Center Logo Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-lg border-2 border-emerald-500 text-xl">
              🔬
            </div>
          </div>

          <div className="space-y-1 max-w-sm">
            <p className="text-xs font-black text-slate-800">
              Arahkan kamera smartphone ke kode QR di atas!
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Seluruh anggota kelompok dapat membuka simulasi kereta kinematika 3D dan mengisi lembar kerja LKPD digital langsung di layar ponsel masing-masing.
            </p>
          </div>
        </div>

        {/* Copy Link URL Option */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 block">
            Atau Bagikan Tautan Langsung ke Grup Belajar Kelas:
          </label>
          <div className="flex items-center gap-1.5">
            <input 
              type="text" 
              readOnly 
              value={targetUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-700 outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'btn-3d-emerald text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Instructions Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
            <span className="font-bold flex items-center gap-1 text-slate-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Langkah Akses Murid:
            </span>
            <p>1. Buka kamera ponsel (Android / iPhone).</p>
            <p>2. Arahkan ke QR Code di layar PID/komputer.</p>
            <p>3. Ketuk banner tautan yang muncul.</p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
            <span className="font-bold flex items-center gap-1 text-emerald-900">
              <FileText className="h-3.5 w-3.5 text-emerald-700" />
              Keunggulan di HP:
            </span>
            <p>• Praktikum mandiri per murid di genggaman.</p>
            <p>• Data telemetri dan LKPD sinkron.</p>
            <p>• Responsif dan hemat kuota.</p>
          </div>
        </div>

        {/* Modal Footer */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
        >
          Tutup Tampilan QR Code
        </button>

      </div>
    </div>
  );
};
