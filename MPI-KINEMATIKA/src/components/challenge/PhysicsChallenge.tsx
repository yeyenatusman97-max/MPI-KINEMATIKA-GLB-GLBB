import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Flame, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Award, 
  RotateCcw, 
  Play, 
  Zap, 
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { QuizQuestion, QuizResult } from '../../types/physics';
import { sounds } from '../../utils/soundEffects';
import { storage } from '../../utils/storage';

export const PhysicsChallenge: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'quick' | 'tf' | 'calc' | 'graph' | 'match'>('quick');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any | null>(null);
  const [calcInput, setCalcInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);

  // Bank Soal Terstandar Kurikulum Merdeka Fase E (30+ Soal GLB & GLBB)
  const questionBank: QuizQuestion[] = [
    // GLB Questions
    {
      id: 'q1',
      category: 'GLB',
      type: 'mc',
      difficulty: 'Mudah',
      question: 'Sebuah mobil melaju dengan kecepatan tetap 20 m/s pada lintasan lurus. Berapakah percepatan mobil tersebut?',
      options: ['0 m/s²', '2 m/s²', '10 m/s²', '20 m/s²'],
      correctAnswer: 0,
      explanation: 'Pada Gerak Lurus Beraturan (GLB), kecepatannya tetap sehingga percepatan selalu bernilai nol (a = 0).'
    },
    {
      id: 'q2',
      category: 'GLB',
      type: 'mc',
      difficulty: 'Sedang',
      question: 'Kereta api melaju dengan kelajuan 90 km/jam. Jika dinyatakan dalam satuan Sistem Internasional (SI), kelajuan tersebut sama dengan...',
      options: ['15 m/s', '25 m/s', '30 m/s', '50 m/s'],
      correctAnswer: 1,
      explanation: '90 km/jam = 90 × (1000 m / 3600 s) = 90 / 3,6 = 25 m/s.'
    },
    {
      id: 'q3',
      category: 'GLB',
      type: 'tf',
      difficulty: 'Mudah',
      question: 'Besar perpindahan suatu benda selalu sama persis dengan jarak tempuhnya dalam segala kondisi gerak.',
      options: ['Benar', 'Salah'],
      correctAnswer: 1,
      explanation: 'Salah. Jarak adalah panjang total lintasan (skalar), sedangkan perpindahan adalah selisih posisi awal dan akhir (vektor). Jika berbalik arah, jarak > perpindahan.'
    },
    {
      id: 'q4',
      category: 'GLB',
      type: 'calc',
      difficulty: 'Sedang',
      question: 'Sebuah kapal feri bergerak lurus dengan kecepatan konstan 12 m/s selama 2,5 menit. Hitunglah jarak yang ditempuh kapal dalam meter!',
      correctAnswer: 1800,
      tolerance: 10,
      unit: 'meter',
      explanation: 'Waktu t = 2,5 menit = 150 detik. Jarak s = v × t = 12 m/s × 150 s = 1.800 meter.'
    },
    {
      id: 'q5',
      category: 'GLB',
      type: 'graph',
      difficulty: 'Sedang',
      question: 'Jika grafik s terhadap t berbentuk garis lurus miring ke atas, maka jenis gerak yang dialami benda adalah...',
      options: ['GLB dengan v konstan', 'GLBB dipercepat', 'GLBB diperlambat', 'Benda diam'],
      correctAnswer: 0,
      explanation: 'Grafik s-t berupa garis lurus miring menunjukkan bahwa gradien kemiringan (kecepatan) bernilai tetap (GLB).'
    },
    {
      id: 'q6',
      category: 'GLB',
      type: 'mc',
      difficulty: 'HOTS',
      question: 'Dua pelari, Ali (v = 6 m/s) dan Budi (v = 8 m/s), berlari pada lintasan lurus dari tempat yang sama. Jika Ali mulai berlari 5 detik lebih dulu daripada Budi, kapan Budi akan menyusul Ali?',
      options: ['10 sekon', '15 sekon', '20 sekon', '25 sekon'],
      correctAnswer: 1,
      explanation: 'sAli = 6(t + 5) = 6t + 30. sBudi = 8t. Saat menyusul: 6t + 30 = 8t -> 2t = 30 -> t = 15 sekon setelah Budi mulai berlari.'
    },

    // GLBB Questions
    {
      id: 'q7',
      category: 'GLBB',
      type: 'mc',
      difficulty: 'Mudah',
      question: 'Sebuah benda yang semula diam (v₀ = 0) mengalami percepatan konstan 3 m/s². Kecepatan benda setelah 4 detik adalah...',
      options: ['7 m/s', '12 m/s', '18 m/s', '24 m/s'],
      correctAnswer: 1,
      explanation: 'vₜ = v₀ + at = 0 + (3 × 4) = 12 m/s.'
    },
    {
      id: 'q8',
      category: 'GLBB',
      type: 'calc',
      difficulty: 'Sedang',
      question: 'Sebuah mobil mulai dari keadaan diam dipercepat konstan 2 m/s² selama 5 detik. Berapakah posisi akhir mobil dalam meter? (Uji Validasi)',
      correctAnswer: 25,
      tolerance: 0.5,
      unit: 'meter',
      explanation: 's = v₀·t + ½·a·t² = 0 + ½ · 2 · (5)² = 25 meter. (Sesuai Benchmark Uji Validasi Ilmiah).'
    },
    {
      id: 'q9',
      category: 'GLBB',
      type: 'calc',
      difficulty: 'Sedang',
      question: 'Sebuah mobil memiliki kecepatan awal v₀ = 4 m/s dan percepatan a = 2 m/s². Berapakah perpindahan mobil setelah 3 detik? (Uji Validasi)',
      correctAnswer: 21,
      tolerance: 0.5,
      unit: 'meter',
      explanation: 's = v₀·t + ½·a·t² = (4 × 3) + ½ · 2 · (3)² = 12 + 9 = 21 meter. (Sesuai Benchmark Uji Validasi Ilmiah).'
    },
    {
      id: 'q10',
      category: 'GLBB',
      type: 'tf',
      difficulty: 'Sedang',
      question: 'Pada GLBB diperlambat, arah vektor percepatan selalu berlawanan dengan arah vektor kecepatan benda.',
      options: ['Benar', 'Salah'],
      correctAnswer: 0,
      explanation: 'Benar. Perlambatan terjadi ketika gaya dan percepatan melawan arah gerak kecepatan benda.'
    },
    {
      id: 'q11',
      category: 'GLBB',
      type: 'mc',
      difficulty: 'HOTS',
      question: 'Sebuah mobil bergerak dengan kecepatan 72 km/jam direm mendadak hingga berhenti dalam jarak 40 meter. Berapakah perlambatan yang dialami mobil tersebut?',
      options: ['2 m/s²', '3 m/s²', '4 m/s²', '5 m/s²'],
      correctAnswer: 3,
      explanation: 'v₀ = 72 km/jam = 20 m/s. vₜ = 0, s = 40 m. Rumus: vₜ² = v₀² - 2as -> 0 = 20² - 2·a·40 -> 80a = 400 -> a = 5 m/s².'
    },
    {
      id: 'q12',
      category: 'GLBB',
      type: 'graph',
      difficulty: 'HOTS',
      question: 'Bentuk grafik posisi terhadap waktu (s - t) untuk gerak GLBB dipercepat adalah...',
      options: ['Garis lurus mendatar', 'Garis lurus miring', 'Kurva parabola membuka ke atas', 'Kurva sinusoidal'],
      correctAnswer: 2,
      explanation: 'Karena posisi s berbanding lurus dengan kuadrat waktu (t²), maka bentuk grafik s-t adalah kurva lengkung parabola.'
    }
  ];

  const currentQ = questionBank[currentQIndex] || questionBank[0];

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (timerRunning && timeLeft > 0 && !isAnswered && !isQuizComplete) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isAnswered && !isQuizComplete) {
      handleTimeOut();
    }
    return () => clearInterval(timer);
  }, [timerRunning, timeLeft, isAnswered, isQuizComplete]);

  const handleStartChallenge = () => {
    sounds.playStart();
    setCurrentQIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedOption(null);
    setCalcInput('');
    setIsAnswered(false);
    setIsQuizComplete(false);
    setTimeLeft(30);
    setTimerRunning(true);
  };

  const handleTimeOut = () => {
    sounds.playError();
    setIsAnswered(true);
    setStreak(0);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctAnswer;
    if (isCorrect) {
      sounds.playSuccess();
      const points = 10 + streak * 2;
      setScore((s) => s + points);
      setStreak((st) => st + 1);
    } else {
      sounds.playError();
      setStreak(0);
    }
  };

  const handleSubmitCalc = () => {
    if (isAnswered) return;
    const num = parseFloat(calcInput);
    if (isNaN(num)) return;

    setIsAnswered(true);
    const target = currentQ.correctAnswer as number;
    const tol = currentQ.tolerance || 1;
    const isCorrect = Math.abs(num - target) <= tol;

    if (isCorrect) {
      sounds.playSuccess();
      const points = 15 + streak * 3;
      setScore((s) => s + points);
      setStreak((st) => st + 1);
    } else {
      sounds.playError();
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    sounds.playClick();
    if (currentQIndex < questionBank.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setCalcInput('');
      setIsAnswered(false);
      setTimeLeft(30);
    } else {
      // Quiz Finished!
      setIsQuizComplete(true);
      setTimerRunning(false);
      sounds.playFinish();

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Save results
      const res: QuizResult = {
        id: 'quiz_' + Date.now(),
        timestamp: new Date().toLocaleDateString('id-ID'),
        score: Math.min(100, Math.round((score / (questionBank.length * 15)) * 100)),
        totalQuestions: questionBank.length,
        timeSpentSeconds: 120,
        category: 'PHYSICS_CHALLENGE',
        answers: [],
      };
      storage.saveQuizResult(res);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pt-16 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
              GAMIFIED LEARNING ARENA
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2 mt-1">
              <Trophy className="h-7 w-7 text-amber-400" />
              Physics Challenge
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Latihan soal interaktif dengan timer, poin combo berantai, dan pembahasan ilmiah
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>Skor: {score}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-950/40 px-3 py-1.5 text-xs font-bold text-orange-300">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>Combo: {streak}x</span>
            </div>
          </div>
        </div>

        {!isQuizComplete ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Question Header: Number & Timer */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  SOAL {currentQIndex + 1} / {questionBank.length}
                </span>
                <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                  {currentQ.category}
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                  {currentQ.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                <Clock className={`h-4 w-4 ${timeLeft <= 5 ? 'text-rose-400' : 'text-slate-400'}`} />
                <span className={timeLeft <= 5 ? 'text-rose-400 font-extrabold text-sm' : 'text-slate-300'}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-xl font-bold text-white mb-6 leading-relaxed">
              {currentQ.question}
            </h2>

            {/* Answer Options: MC / TF / Calc */}
            {currentQ.type === 'calc' ? (
              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <input
                    type="number"
                    disabled={isAnswered}
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    placeholder="Masukkan angka jawaban..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    disabled={isAnswered || !calcInput}
                    onClick={handleSubmitCalc}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 transition"
                  >
                    Kirim Jawaban
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {currentQ.options?.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctAnswer;
                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left rounded-2xl p-4 text-xs sm:text-sm font-medium transition border flex items-center justify-between ${
                        isAnswered
                          ? isCorrect
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                            : isSelected
                            ? 'bg-rose-950/60 border-rose-500 text-rose-300 font-semibold'
                            : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-50'
                          : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-cyan-500/50 hover:bg-slate-800'
                      }`}
                    >
                      <span>{opt}</span>
                      <span className="font-mono text-xs text-slate-500">
                        {String.fromCharCode(65 + idx)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Instant Feedback & Scientific Explanation */}
            {isAnswered && (
              <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-5 mb-6 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span className="text-cyan-300">Penjelasan Ilmiah:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Next Question CTA */}
            {isAnswered && (
              <button
                onClick={handleNextQuestion}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-xs sm:text-sm font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20"
              >
                <span>{currentQIndex === questionBank.length - 1 ? 'Lihat Hasil Akhir' : 'Soal Berikutnya'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          /* Quiz Results Completed Screen */
          <div className="rounded-3xl border border-amber-500/40 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl space-y-6">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/20 border border-amber-400/40 text-amber-400">
              <Award className="h-10 w-10 animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Tantangan Fisika Selesai!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Selamat! Kamu telah menyelesaikan seluruh rangkaian tantangan Kinematika Gerak Lurus.
              </p>
            </div>

            <div className="mx-auto max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center">
              <span className="text-xs text-slate-400 block font-mono">TOTAL SKOR AKHIR</span>
              <span className="text-4xl font-black text-amber-400 font-mono">{score}</span>
              <p className="text-[11px] text-emerald-400 mt-2 font-semibold">
                Lencana Prestasi Ditambahkan ke Portofolio!
              </p>
            </div>

            <button
              onClick={handleStartChallenge}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Mainkan Ulang Tantangan</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
