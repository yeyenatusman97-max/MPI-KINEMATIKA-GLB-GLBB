import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Copy, Check, Smartphone, ExternalLink, Sparkles, Share2 } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface QuizQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuizQRCodeModal: React.FC<QuizQRCodeModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [quizUrl, setQuizUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Construct the direct link to the quiz
    const url = `${window.location.origin}${window.location.pathname}?menu=quiz#quiz`;
    setQuizUrl(url);

    QRCode.toDataURL(url, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0284C7', // Playful high-contrast sky blue / navy
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('Error generating QR Code', err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    sounds.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(quizUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border-2 border-amber-300 bg-white p-6 shadow-2xl text-slate-900 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-md">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Akses Quiz Melalui Handphone (HP)
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Scan kode QR dengan kamera HP murid untuk mengerjakan kuis
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
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-sky-50 to-amber-50/50 border-2 border-sky-100 text-center space-y-3">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-sky-200 text-[11px] font-bold text-sky-800 shadow-sm">
            <Smartphone className="h-3.5 w-3.5 text-sky-600" />
            <span>Kamera Smartphone • Siap Scan Seketika</span>
          </div>

          {/* Rendered Scannable QR Code */}
          <div className="p-3 bg-white rounded-2xl border-2 border-sky-300 shadow-lg relative group">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="QR Code Quiz Kinematika" 
                className="w-52 h-52 sm:w-56 sm:h-56 rounded-xl"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs font-mono">
                Membuat Kode QR...
              </div>
            )}
            {/* Center Logo Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md border-2 border-amber-400 text-lg">
              ⚛️
            </div>
          </div>

          <p className="text-xs text-slate-600 max-w-xs leading-relaxed font-medium">
            Arahkan kamera smartphone ke kode QR di atas untuk langsung membuka dan menjawab 10 nomor quiz formatif tanpa perlu login.
          </p>
        </div>

        {/* Copy Link URL Option */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 block">
            Atau Bagikan Tautan Quiz Langsung ke Grup Kelas:
          </label>
          <div className="flex items-center gap-1.5">
            <input 
              type="text" 
              readOnly 
              value={quizUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-700 outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black transition ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'btn-3d-cyan text-white'
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

        {/* Quick Help Steps */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 space-y-1">
          <div className="font-bold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Petunjuk Guru / Murid:</span>
          </div>
          <p>1. Buka aplikasi kamera pada HP (Android/iOS).</p>
          <p>2. Arahkan ke QR Code hingga muncul notifikasi tautan kuning/biru.</p>
          <p>3. Ketuk tautan untuk membuka kuis langsung di browser handphone.</p>
        </div>

        {/* Footer */}
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
