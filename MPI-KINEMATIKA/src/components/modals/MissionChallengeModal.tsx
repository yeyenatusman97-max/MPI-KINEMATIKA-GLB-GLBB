import React, { useState } from 'react';
import { X, Star, Trophy, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GAME_LEVELS } from '../../data/newtonData';
import { sounds } from '../../utils/soundEffects';

interface MissionChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelId: number;
  onCompleteLevel: (levelId: number, starsEarned: number) => void;
}

export const MissionChallengeModal: React.FC<MissionChallengeModalProps> = ({
  isOpen,
  onClose,
  levelId,
  onCompleteLevel,
}) => {
  const level = GAME_LEVELS.find((l) => l.id === levelId) || GAME_LEVELS[0];
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const isCorrect = selectedIdx === level.correctIndex;

  const handleSubmit = () => {
    if (selectedIdx === null) return;
    setHasSubmitted(true);
    if (isCorrect) {
      sounds.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
      onCompleteLevel(level.id, 3);
    } else {
      sounds.playError();
    }
  };

  const handleReset = () => {
    setSelectedIdx(null);
    setHasSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden flex flex-col">
        {/* Header with game theme */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
              <Trophy className="w-6 h-6 text-yellow-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                  Level {level.id}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-yellow-100">
                  <Star className="w-3.5 h-3.5 fill-yellow-200" /> +30 Poin
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">{level.title}</h3>
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
        <div className="p-6 space-y-4 text-sm text-slate-700">
          <p className="text-xs text-slate-500">{level.subtitle}</p>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-slate-800">
            <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Tantangan Ilmiah:
            </div>
            <p className="text-sm">{level.challengeQuestion}</p>
          </div>

          <div className="space-y-2">
            {level.challengeOptions.map((opt, idx) => {
              const isSelected = selectedIdx === idx;
              let btnClass = "border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 text-slate-700";

              if (hasSubmitted) {
                if (idx === level.correctIndex) {
                  btnClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-300";
                } else if (isSelected && !isCorrect) {
                  btnClass = "border-rose-400 bg-rose-50 text-rose-800 ring-2 ring-rose-200";
                }
              } else if (isSelected) {
                btnClass = "border-amber-500 bg-amber-50/80 text-amber-900 font-semibold ring-2 ring-amber-300";
              }

              return (
                <button
                  key={idx}
                  disabled={hasSubmitted}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedIdx(idx);
                  }}
                  className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${btnClass}`}
                >
                  <span>{opt}</span>
                  {hasSubmitted && idx === level.correctIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {hasSubmitted && isSelected && !isCorrect && (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {hasSubmitted && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 animate-fade-in ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Luar Biasa! Misi Berhasil Dikuasai.</div>
                    <div>Anda memperoleh 3 Bintang emas dan membuka stage berikutnya!</div>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Kurang Tepat!</div>
                    <div>Coba telaah kembali Hukum Newton yang berlaku pada sistem ini.</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
          >
            Tutup
          </button>

          {!hasSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={selectedIdx === null}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow transition-all flex items-center gap-2 ${
                selectedIdx !== null
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25 active:scale-95'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <span>Verifikasi Jawaban</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              {!isCorrect && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Ulangi Misi
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25"
              >
                Selesai
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
