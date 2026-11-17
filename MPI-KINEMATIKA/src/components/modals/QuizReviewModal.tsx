import React from 'react';
import { X, CheckCircle2, XCircle, Award, BookOpen } from 'lucide-react';
import { NEWTON_QUIZ_QUESTIONS } from '../../data/newtonData';

interface QuizReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAnswers?: Record<number, string>;
  score?: number;
}

export const QuizReviewModal: React.FC<QuizReviewModalProps> = ({
  isOpen,
  onClose,
  userAnswers = { 1: 'A', 2: 'B', 3: 'B', 4: 'B', 5: 'A', 6: 'C', 7: 'C', 8: 'B', 9: 'B', 10: 'A' },
  score = 92
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-indigo-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Award className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Pembahasan Kuis: Hukum Newton</h3>
              <p className="text-xs text-indigo-100">Review Kunci Jawaban & Penjelasan Ilmiah (Skor: {score}/100)</p>
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
        <div className="p-6 overflow-y-auto space-y-4 text-sm divide-y divide-slate-100">
          {NEWTON_QUIZ_QUESTIONS.map((q, idx) => {
            const userChoice = userAnswers[q.id] || q.correctKey;
            const isCorrect = userChoice === q.correctKey;

            return (
              <div key={q.id} className="pt-4 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{q.question}</span>
                  </div>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Benar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full shrink-0">
                      <XCircle className="w-3.5 h-3.5" /> Kurang Tepat
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {q.options.map((opt) => {
                    const isOptionCorrect = opt.key === q.correctKey;
                    const isOptionUser = opt.key === userChoice;

                    let bgClass = "bg-slate-50 border-slate-200 text-slate-700";
                    if (isOptionCorrect) {
                      bgClass = "bg-emerald-50/80 border-emerald-400 text-emerald-800 font-semibold";
                    } else if (isOptionUser && !isCorrect) {
                      bgClass = "bg-rose-50 border-rose-300 text-rose-800";
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${bgClass}`}
                      >
                        <span className="w-5 h-5 rounded-md bg-white border border-slate-300 text-center font-bold text-[11px] leading-5 shrink-0">
                          {opt.key}
                        </span>
                        <span className="truncate">{opt.text}</span>
                        {isOptionCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-blue-50/80 rounded-xl p-3 border border-blue-100 text-xs text-blue-900 mt-2 flex gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-950">Penjelasan: </span>
                    {q.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow transition-transform active:scale-95"
          >
            Tutup Pembahasan
          </button>
        </div>
      </div>
    </div>
  );
};
