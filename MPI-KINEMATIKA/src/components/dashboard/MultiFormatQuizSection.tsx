import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft, 
  Award, 
  Check, 
  X as XIcon,
  ChevronRight,
  FileCheck2,
  Users,
  Swords,
  Bell,
  Settings,
  Plus,
  Minus,
  RefreshCw,
  Flame,
  Volume2,
  Maximize,
  Minimize
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { storage } from '../../utils/storage';
import { StudentReportCardModal } from './StudentReportCardModal';
import { ActiveSession, QuizResult, UserRole } from '../../types/physics';

export interface BattleTeam {
  id: string;
  name: string;
  score: number;
  color: 'blue' | 'red' | 'emerald' | 'amber';
  badge: string;
}

export const MultiFormatQuizSection: React.FC<{
  userRole?: UserRole;
  activeSession?: ActiveSession | null;
  onRefreshProgress?: () => void;
}> = ({ userRole = 'murid', activeSession, onRefreshProgress }) => {
  // Current active question index (0 to 9)
  const [activeQIdx, setActiveQIdx] = useState<number>(0);

  // Mode: Individu (Solo) vs Quiz Battle (Layar PID)
  const [quizMode, setQuizMode] = useState<'solo' | 'battle'>('solo');

  // Battle Mode State
  const [teams, setTeams] = useState<BattleTeam[]>([
    { id: 'teamA', name: 'Kelompok 1 (Galileo - Biru)', score: 0, color: 'blue', badge: '🔵' },
    { id: 'teamB', name: 'Kelompok 2 (Newton - Merah)', score: 0, color: 'red', badge: '🔴' }
  ]);
  const [activeBuzzerTeam, setActiveBuzzerTeam] = useState<string | null>(null);
  const [isBattleSettingsOpen, setIsBattleSettingsOpen] = useState<boolean>(false);
  const [pointsPerCorrect, setPointsPerCorrect] = useState<number>(10);
  const [penaltyPoints, setPenaltyPoints] = useState<number>(0);
  const [battleHistory, setBattleHistory] = useState<Record<number, { teamId: string; isCorrect: boolean }>>({});
  const [battleWinner, setBattleWinner] = useState<BattleTeam | null>(null);
  const [isPidFullscreen, setIsPidFullscreen] = useState<boolean>(false);

  // Instant Battle Feedback Overlay State (Benar -> Confetti + Sound, Salah -> Red Cross Effect + Sound)
  const [battleFeedback, setBattleFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    teamName: string;
    points: number;
    message: string;
  } | null>(null);

  // User Answers State:
  // Q1 (mc): number
  // Q2 (mc): number
  // Q3 (complex): number[]
  // Q4 (match): Record<number, number>
  // Q5 (mc): number
  // Q6 (complex): number[]
  // Q7 (tf): boolean
  // Q8 (complex): number[]
  // Q9 (match): Record<number, number>
  // Q10 (tf): boolean
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [soloHistory, setSoloHistory] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [isReportCardOpen, setIsReportCardOpen] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<QuizResult | null>(null);
  const [userProgress, setUserProgress] = useState(() => storage.getProgress());
  const [allQuizResults, setAllQuizResults] = useState<QuizResult[]>(() => {
    if (!activeSession?.npsn) {
      return userRole === 'guru' ? [] : storage.getQuizResults();
    }
    return storage.getQuizResults(
      userRole === 'guru'
        ? { npsn: activeSession.npsn }
        : { npsn: activeSession.npsn, studentAccountId: activeSession.accountId }
    );
  });

  // 10 Soal Berbobot Memadukan 4 Format Soal
  const questions = [
    // 1. Pilihan Ganda Biasa
    {
      id: 1,
      type: 'mc' as const,
      formatLabel: 'Pilihan Ganda Biasa',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      question: 'Sebuah kereta maglev melaju pada lintasan lurus dengan kecepatan konstan 120 km/jam. Manakah pernyataan yang BENAR mengenai percepatan kereta tersebut?',
      options: [
        'Percepatannya bertambah 120 m/s setiap jamnya',
        'Percepatannya bernilai tepat nol (a = 0 m/s²)',
        'Percepatannya sama dengan kecepatan gravitasinya',
        'Percepatannya tidak dapat ditentukan tanpa data massa kereta'
      ],
      correctAnswer: 1,
      explanation: 'Tepat sekali! Pada Gerak Lurus Beraturan (GLB), nilai kelajuan dan arah gerak tetap konstan (tidak ada perubahan kecepatan Δv = 0), sehingga percepatan a = Δv/Δt = 0 m/s².'
    },

    // 2. Pilihan Ganda Biasa
    {
      id: 2,
      type: 'mc' as const,
      formatLabel: 'Pilihan Ganda Biasa',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      question: 'Sebuah drone patroli bergerak lurus dengan kelajuan konstan 15 m/s selama 40 detik. Berapakah jarak total yang ditempuh drone tersebut?',
      options: [
        '300 meter',
        '450 meter',
        '600 meter',
        '900 meter'
      ],
      correctAnswer: 2,
      explanation: 'Benar! Rumus GLB adalah s = v × t. Jarak tempuh s = 15 m/s × 40 s = 600 meter.'
    },

    // 3. Pilihan Ganda Kompleks
    {
      id: 3,
      type: 'complex' as const,
      formatLabel: 'Pilihan Ganda Kompleks (Pilih 2 atau lebih)',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      question: 'Pilihlah semua pernyataan yang BENAR mengenai karakteristik Gerak Lurus Berubah Beraturan (GLBB):',
      options: [
        'Percepatan gerak benda bernilai konstan atau tetap (a = konstan)',
        'Kecepatan benda berubah secara teratur setiap detiknya',
        'Jarak tempuh selalu berbanding lurus secara linier dengan waktu (s ∝ t)',
        'Luas daerah di bawah kurva grafik v-t menyatakan besar perpindahan benda'
      ],
      correctAnswer: [0, 1, 3], // 3 answers correct
      explanation: 'Tepat! Pada GLBB: (1) a bernilai tetap, (2) v berubah teratur linier v = v₀ + at, dan (4) luas kurva v-t adalah perpindahan. Opsi (3) salah karena s berbanding kuadratik terhadap t (s ∝ t²).'
    },

    // 4. Mencocokkan / Menjodohkan
    {
      id: 4,
      type: 'match' as const,
      formatLabel: 'Menjodohkan / Mencocokkan',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      question: 'Pasangkanlah 3 Rumus Utama GLBB dengan Kondisi Penggunaannya yang tepat:',
      leftItems: [
        { id: 0, text: 'A. vt = v₀ + a·t' },
        { id: 1, text: 'B. s = v₀·t + ½·a·t²' },
        { id: 2, text: 'C. vt² = v₀² + 2·a·s' }
      ],
      rightItems: [
        { id: 0, text: '1. Digunakan saat perpindahan / jarak (s) TIDAK diketahui' },
        { id: 1, text: '2. Digunakan saat kecepatan akhir (vt) TIDAK diketahui' },
        { id: 2, text: '3. Digunakan saat selang waktu (t) TIDAK diketahui' }
      ],
      correctAnswer: { 0: 0, 1: 1, 2: 2 },
      explanation: 'Sempurna! Rumus 1 menghubungkan v dan t tanpa s. Rumus 2 menghubungkan s dan t tanpa vt. Rumus 3 menghubungkan v dan s tanpa waktu t.'
    },

    // 5. Pilihan Ganda Biasa
    {
      id: 5,
      type: 'mc' as const,
      formatLabel: 'Pilihan Ganda Biasa',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      question: 'Sebuah mobil melaju dengan kelajuan 25 m/s. Pengemudi mengerem sehingga mengalami perlambatan konstan 5 m/s² hingga berhenti total. Waktu henti mobil adalah...',
      options: [
        '3 sekon',
        '5 sekon',
        '8 sekon',
        '10 sekon'
      ],
      correctAnswer: 1,
      explanation: 'Luar biasa! Gunakan rumus vt = v₀ - at ➔ 0 = 25 - (5 × t) ➔ 5t = 25 ➔ t = 5 sekon.'
    },

    // 6. Pilihan Ganda Kompleks
    {
      id: 6,
      type: 'complex' as const,
      formatLabel: 'Pilihan Ganda Kompleks (Pilih 2 opsi)',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      question: 'Perhatikan grafik kecepatan terhadap waktu (v-t). Manakah DUA pernyataan yang BENAR secara fisis?',
      options: [
        'Gradien kemiringan garis kurva v-t menyatakan nilai percepatan (a = Δv/Δt)',
        'Luas bidang daerah di bawah kurva grafik v-t sama dengan nilai perpindahan (s)',
        'Grafik v-t pada GLB selalu berupa garis miring dengan sudut 45 derajat',
        'Titik potong garis pada sumbu vertikal menyatakan jarak tempuh total'
      ],
      correctAnswer: [0, 1],
      explanation: 'Benar! Dalam kalkulus kinematika: turunan posisi adalah kecepatan (kemiringan), dan integral kecepatan terhadap waktu (luas di bawah kurva v-t) adalah perpindahan s.'
    },

    // 7. Benar - Salah
    {
      id: 7,
      type: 'tf' as const,
      formatLabel: 'Pernyataan Benar - Salah',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      question: 'Dalam ruang hampa udara (tanpa gesekan udara), sebuah bola besi bermassa 10 kg dan bulu unggas bermassa 2 gram yang dijatuhkan bersamaan dari ketinggian yang sama akan menyentuh tanah pada waktu yang bersamaan.',
      options: ['BENAR', 'SALAH'],
      correctAnswer: true,
      explanation: 'BENAR! Hukum gravitasi Galileo membuktikan bahwa percepatan jatuh bebas g ≈ 9,8 m/s² berlaku sama untuk semua benda tanpa memandang massanya, asalkan gesekan udara diabaikan.'
    },

    // 8. Pilihan Ganda Kompleks
    {
      id: 8,
      type: 'complex' as const,
      formatLabel: 'Pilihan Ganda Kompleks',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      question: 'Pilihlah semua besaran fisika berikut yang termasuk ke dalam BESARAN VEKTOR (memiliki nilai dan arah):',
      options: [
        'Perpindahan (Displacement)',
        'Jarak Tempuh (Distance)',
        'Kecepatan (Velocity)',
        'Percepatan (Acceleration)',
        'Kelajuan (Speed)'
      ],
      correctAnswer: [0, 2, 3], // Perpindahan, Kecepatan, Percepatan
      explanation: 'Tepat sekali! Perpindahan, kecepatan, dan percepatan adalah besaran VEKTOR. Sedangkan jarak dan kelajuan adalah besaran SKALAR yang hanya memiliki nilai tanpa arah.'
    },

    // 9. Mencocokkan / Menjodohkan
    {
      id: 9,
      type: 'match' as const,
      formatLabel: 'Menjodohkan / Mencocokkan',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      question: 'Pasangkanlah Jenis Grafik Kinematika dengan Bentuk Kurvanya yang sesuai:',
      leftItems: [
        { id: 0, text: 'A. Grafik Posisi (s-t) pada GLB' },
        { id: 1, text: 'B. Grafik Kecepatan (v-t) pada GLB' },
        { id: 2, text: 'C. Grafik Posisi (s-t) pada GLBB' }
      ],
      rightItems: [
        { id: 0, text: '1. Garis lurus miring dengan kemiringan konstan' },
        { id: 1, text: '2. Garis horizontal mendatar sejajar sumbu waktu' },
        { id: 2, text: '3. Garis lengkung parabola kuadratik' }
      ],
      correctAnswer: { 0: 0, 1: 1, 2: 2 },
      explanation: 'Sempurna! Pada GLB s = vt (linier miring) dan v konstan (mendatar). Pada GLBB s = ½at² (parabola lengkung).'
    },

    // 10. Benar - Salah
    {
      id: 10,
      type: 'tf' as const,
      formatLabel: 'Pernyataan Benar - Salah',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      question: 'Jika percepatan sebuah benda bernilai nol (a = 0 m/s²), maka benda tersebut dipastikan selalu dalam keadaan berhenti diam total.',
      options: ['BENAR', 'SALAH'],
      correctAnswer: false,
      explanation: 'SALAH! Percepatan nol (a = 0) dapat berarti dua kemungkinan: benda diam (v = 0), ATAU benda sedang bergerak lurus dengan kecepatan konstan yang tidak nol (GLB).'
    }
  ];

  // Helper check for correctness
  const isQuestionCorrect = (qIdx: number): boolean => {
    const q = questions[qIdx];
    const userAns = answers[qIdx];
    if (userAns === undefined) return false;

    if (q.type === 'mc') {
      return userAns === q.correctAnswer;
    } else if (q.type === 'tf') {
      return userAns === q.correctAnswer;
    } else if (q.type === 'complex') {
      if (!Array.isArray(userAns)) return false;
      const expected = q.correctAnswer as number[];
      if (userAns.length !== expected.length) return false;
      return expected.every((val) => userAns.includes(val));
    } else if (q.type === 'match') {
      const expected = q.correctAnswer as Record<number, number>;
      return Object.keys(expected).every((k) => userAns[Number(k)] === expected[Number(k)]);
    }
    return false;
  };

  // Instant Battle Response Trigger (Confetti + Sound for Correct, Red Cross + Error Sound for Wrong)
  const triggerBattleResponse = (isCorrect: boolean, teamId: string, answerPayload: any) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    if (isCorrect) {
      sounds.playSuccess();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.55 },
        colors: team.color === 'blue' ? ['#0284c7', '#38bdf8', '#fbbf24', '#ffffff'] : ['#e11d48', '#fb7185', '#fbbf24', '#ffffff']
      });

      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId ? { ...t, score: t.score + pointsPerCorrect } : t
        )
      );

      setBattleHistory((prev) => ({
        ...prev,
        [activeQIdx]: { teamId: teamId, isCorrect: true }
      }));

      // Lock correct answer for this question
      setAnswers((prev) => ({ ...prev, [activeQIdx]: answerPayload }));

      setBattleFeedback({
        show: true,
        isCorrect: true,
        teamName: team.name,
        points: pointsPerCorrect,
        message: `LUAR BIASA! Jawaban ${team.name} TEPAT & BENAR!`
      });

    } else {
      sounds.playError();

      if (penaltyPoints > 0) {
        setTeams((prev) =>
          prev.map((t) =>
            t.id === teamId ? { ...t, score: Math.max(0, t.score - penaltyPoints) } : t
          )
        );
      }

      setBattleHistory((prev) => ({
        ...prev,
        [activeQIdx]: { teamId: teamId, isCorrect: false }
      }));

      // Kunci soal: tidak ada kesempatan menjawab bagi tim lain ketika jawaban salah
      setAnswers((prev) => ({ ...prev, [activeQIdx]: answerPayload }));

      setBattleFeedback({
        show: true,
        isCorrect: false,
        teamName: team.name,
        points: penaltyPoints,
        message: `SALAH! Jawaban ${team.name} Kurang Tepat! ${penaltyPoints > 0 ? `(-${penaltyPoints} Poin). ` : ''}Tidak ada kesempatan bagi tim lain. Silakan klik 'Lanjutkan Soal' untuk beralih ke soal berikutnya.`
      });
    }
  };

  // Instant Solo Response Trigger (Identical Benar/Salah overlay + confetti + sound as Battle Mode)
  const triggerSoloResponse = (isCorrect: boolean) => {
    setSoloHistory((prev) => ({
      ...prev,
      [activeQIdx]: isCorrect
    }));

    if (isCorrect) {
      sounds.playSuccess();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#059669', '#34d399', '#fbbf24', '#ffffff']
      });
    } else {
      sounds.playError();
    }

    setBattleFeedback({
      show: true,
      isCorrect,
      teamName: `Mode Individu · Soal #${activeQIdx + 1}`,
      points: isCorrect ? 10 : 0,
      message: isCorrect
        ? `LUAR BIASA! Jawaban Kamu pada Soal #${activeQIdx + 1} BENAR!`
        : `SALAH! Jawaban Kamu pada Soal #${activeQIdx + 1} Kurang Tepat.`
    });
  };

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;

    // In Battle Mode: If a team has buzzed in, this click is their answer and gives INSTANT feedback!
    if (quizMode === 'battle') {
      if (!activeBuzzerTeam) {
        sounds.playClick();
        // Prompt them to hit the buzzer first
        setBattleFeedback({
          show: true,
          isCorrect: false,
          teamName: 'Peringatan PID',
          points: 0,
          message: 'Tekan BEL KELOMPOK terlebih dahulu sebelum memilih jawaban!'
        });
        setTimeout(() => setBattleFeedback(null), 1800);
        return;
      }

      const isCorrect = optIdx === currentQ.correctAnswer;
      triggerBattleResponse(isCorrect, activeBuzzerTeam, optIdx);
      return;
    }

    // Solo Mode: save answer & trigger identical Benar/Salah feedback overlay
    setAnswers((prev) => ({ ...prev, [activeQIdx]: optIdx }));
    const isCorrect = optIdx === currentQ.correctAnswer;
    triggerSoloResponse(isCorrect);
  };

  const handleToggleComplexOption = (optIdx: number) => {
    if (isSubmitted) return;
    sounds.playClick();
    const currentList: number[] = answers[activeQIdx] || [];
    const nextList = currentList.includes(optIdx)
      ? currentList.filter((x) => x !== optIdx)
      : [...currentList, optIdx];
    setAnswers({ ...answers, [activeQIdx]: nextList });
  };

  // Submit complex answer button for battle mode
  const handleConfirmBattleComplexAnswer = () => {
    if (quizMode !== 'battle' || !activeBuzzerTeam) return;
    const currentList: number[] = answers[activeQIdx] || [];
    const expected = currentQ.correctAnswer as number[];
    const isCorrect = currentList.length === expected.length && expected.every((val) => currentList.includes(val));
    triggerBattleResponse(isCorrect, activeBuzzerTeam, currentList);
  };

  // Submit complex answer button for solo mode
  const handleConfirmSoloComplexAnswer = () => {
    if (isSubmitted) return;
    const currentList: number[] = answers[activeQIdx] || [];
    const expected = currentQ.correctAnswer as number[];
    const isCorrect = currentList.length === expected.length && expected.every((val) => currentList.includes(val));
    triggerSoloResponse(isCorrect);
  };

  const handleSelectTF = (val: boolean) => {
    if (isSubmitted) return;

    // In Battle Mode: If a team has buzzed in, this gives INSTANT feedback!
    if (quizMode === 'battle') {
      if (!activeBuzzerTeam) {
        sounds.playClick();
        setBattleFeedback({
          show: true,
          isCorrect: false,
          teamName: 'Peringatan PID',
          points: 0,
          message: 'Tekan BEL KELOMPOK terlebih dahulu sebelum memilih jawaban!'
        });
        setTimeout(() => setBattleFeedback(null), 1800);
        return;
      }

      const isCorrect = val === currentQ.correctAnswer;
      triggerBattleResponse(isCorrect, activeBuzzerTeam, val);
      return;
    }

    // Solo Mode: save answer & trigger identical Benar/Salah feedback overlay
    setAnswers((prev) => ({ ...prev, [activeQIdx]: val }));
    const isCorrect = val === currentQ.correctAnswer;
    triggerSoloResponse(isCorrect);
  };

  const handleMatchPair = (leftId: number, rightId: number) => {
    if (isSubmitted) return;
    sounds.playClick();
    const currentMatches: Record<number, number> = answers[activeQIdx] || {};
    const updated = { ...currentMatches, [leftId]: rightId };
    setAnswers({
      ...answers,
      [activeQIdx]: updated
    });
  };

  // Submit matching answer button for battle mode
  const handleConfirmBattleMatchAnswer = () => {
    if (quizMode !== 'battle' || !activeBuzzerTeam) return;
    const currentMatches: Record<number, number> = answers[activeQIdx] || {};
    const expected = currentQ.correctAnswer as Record<number, number>;
    const isCorrect = Object.keys(expected).every((k) => currentMatches[Number(k)] === expected[Number(k)]);
    triggerBattleResponse(isCorrect, activeBuzzerTeam, currentMatches);
  };

  // Submit matching answer button for solo mode
  const handleConfirmSoloMatchAnswer = () => {
    if (isSubmitted) return;
    const currentMatches: Record<number, number> = answers[activeQIdx] || {};
    const expected = currentQ.correctAnswer as Record<number, number>;
    const isCorrect = Object.keys(expected).every((k) => currentMatches[Number(k)] === expected[Number(k)]);
    triggerSoloResponse(isCorrect);
  };

  const handleSubmitAll = () => {
    sounds.playSuccess();
    let correctCount = 0;
    questions.forEach((_, idx) => {
      if (isQuestionCorrect(idx)) correctCount++;
    });
    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    setFinalScore(calculatedScore);
    setIsSubmitted(true);

    // Save to storage & sync to teacher account via NPSN
    const newRes: QuizResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      score: calculatedScore,
      totalQuestions: 10,
      category: 'GLB_GLBB_COMPREHENSIVE',
      timeSpentSeconds: 120,
      answers: [],
      npsn: activeSession?.npsn || '',
      studentAccountId: activeSession?.accountId || '',
      studentName: activeSession?.displayName || userProgress.studentName,
      className: activeSession?.className || userProgress.studentId,
    };
    storage.saveQuizResult(newRes);
    storage.addXP(calculatedScore * 2);
    setLatestResult(newRes);
    setAllQuizResults(
      storage.getQuizResults(
        activeSession?.npsn
          ? userRole === 'guru'
            ? { npsn: activeSession.npsn }
            : { npsn: activeSession.npsn, studentAccountId: activeSession.accountId }
          : undefined
      )
    );
    setUserProgress(storage.getProgress());
    if (onRefreshProgress) onRefreshProgress();

    if (calculatedScore >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleResetQuiz = () => {
    sounds.playClick();
    setAnswers({});
    setSoloHistory({});
    setIsSubmitted(false);
    setFinalScore(null);
    setActiveQIdx(0);
    setActiveBuzzerTeam(null);
    setBattleWinner(null);
    setBattleFeedback(null);
  };

  // Battle Mode Actions for PID Screen
  const handleBuzzerPress = (teamId: string) => {
    if (activeBuzzerTeam) return; // already locked by first team to buzz
    sounds.playBuzzer();
    setActiveBuzzerTeam(teamId);
  };

  const handleClearBuzzer = () => {
    sounds.playClick();
    setActiveBuzzerTeam(null);
    setBattleFeedback(null);
  };

  const handleContinueToNextQuestion = () => {
    sounds.playClick();
    setBattleFeedback(null);
    setActiveBuzzerTeam(null);
    if (activeQIdx < questions.length - 1) {
      setActiveQIdx((prev) => prev + 1);
    } else if (quizMode === 'battle') {
      handleFinishBattle();
    } else {
      handleSubmitAll();
    }
  };

  const handleJudgeBattleAnswer = (isCorrect: boolean) => {
    if (!activeBuzzerTeam) return;
    triggerBattleResponse(isCorrect, activeBuzzerTeam, questions[activeQIdx].correctAnswer);
  };

  const handleAdjustScore = (teamId: string, delta: number) => {
    sounds.playClick();
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t))
    );
  };

  const handleResetBattle = () => {
    sounds.playClick();
    setTeams((prev) => prev.map((t) => ({ ...t, score: 0 })));
    setBattleHistory({});
    setSoloHistory({});
    setActiveBuzzerTeam(null);
    setBattleWinner(null);
    setBattleFeedback(null);
    setAnswers({});
    setIsSubmitted(false);
    setActiveQIdx(0);
  };

  const handleFinishBattle = () => {
    sounds.playSuccess();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    if (sorted[0].score > sorted[1].score) {
      setBattleWinner(sorted[0]);
    } else {
      // Tie
      setBattleWinner({
        id: 'tie',
        name: 'Seri / Juara Bersama!',
        score: sorted[0].score,
        color: 'amber',
        badge: '🤝'
      });
    }
  };

  const currentQ = questions[activeQIdx];
  const userAns = answers[activeQIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <section id="quiz" className="w-full py-3 sm:py-4 border-t-2 border-amber-100 bg-gradient-to-b from-white via-amber-50/25 to-white">
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-amber-100 pb-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-black text-amber-800 border border-amber-300">
              <Trophy className="h-3.5 w-3.5 text-amber-600" />
              <span>MENU 5 · EVALUASI FORMATIF</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Quiz Multi-Format
            </h2>
            <p className="hidden xl:block text-xs font-semibold text-slate-500">
              — 4 ragam soal (PG, PG Kompleks, Menjodohkan, Benar-Salah) dengan skor &amp; pembahasan otomatis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Mode Selector: Individu vs Battle Kelompok (Layar PID) */}
            <div className="flex items-center gap-1 bg-sky-100/80 p-0.5 rounded-xl border border-sky-200">
              <button
                onClick={() => {
                  sounds.playClick();
                  setBattleFeedback(null);
                  setQuizMode('solo');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                  quizMode === 'solo'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👤 Mode Individu</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setBattleFeedback(null);
                  setQuizMode('battle');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                  quizMode === 'battle'
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Swords className="h-3.5 w-3.5" />
                <span>⚔️ Quiz Battle</span>
              </button>
            </div>

            {quizMode === 'battle' && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsBattleSettingsOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-indigo-400 bg-indigo-50 text-indigo-900 text-xs font-black hover:bg-indigo-100 transition shadow-sm"
                title="Pengaturan Quiz Battle PID (Nama Kelompok, Skor, dan Poin)"
              >
                <Settings className="h-3.5 w-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Atur Battle</span>
              </button>
            )}

            {userRole !== 'guru' && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setUserProgress(storage.getProgress());
                  setAllQuizResults(
                    storage.getQuizResults(
                      activeSession?.npsn
                        ? { npsn: activeSession.npsn, studentAccountId: activeSession.accountId }
                        : undefined
                    )
                  );
                  setIsReportCardOpen(true);
                }}
                className="btn-3d-cyan flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black text-white shadow-sm"
                title="Lihat Rapor Belajar & Analisis Capaian Pembelajaran"
              >
                <Award className="h-3.5 w-3.5" />
                <span>Rapor</span>
              </button>
            )}

            {isSubmitted && (
              <button
                onClick={handleResetQuiz}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-black hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Ulangi</span>
              </button>
            )}
          </div>
        </div>

        {/* Final Score Banner (if submitted) */}
        {isSubmitted && finalScore !== null && (
          <div className={`px-4 py-2.5 rounded-2xl border-2 text-white shadow-md animate-fadeIn ${
            finalScore >= 80 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-white' 
              : finalScore >= 60 
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 border-white'
              : 'bg-gradient-to-r from-rose-500 to-pink-600 border-white'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  HASIL EVALUASI
                </span>
                <h3 className="text-sm sm:text-base font-black">
                  {finalScore >= 80 ? 'Luar Biasa! Pemahaman Sangat Baik 🎉' : finalScore >= 60 ? 'Bagus! Cukup Menguasai Materi 👍' : 'Tetap Semangat! Pelajari Ulang Modul 💪'}
                </h3>
                <span className="text-xs font-medium text-white/90">
                  ({questions.filter((_, i) => isQuestionCorrect(i)).length}/10 benar — cek pembahasan di kartu soal)
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {userRole !== 'guru' && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setUserProgress(storage.getProgress());
                      setAllQuizResults(
                        storage.getQuizResults(
                          activeSession?.npsn
                            ? { npsn: activeSession.npsn, studentAccountId: activeSession.accountId }
                            : undefined
                        )
                      );
                      setIsReportCardOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-black hover:bg-amber-50 shadow flex items-center gap-1.5"
                  >
                    <Award className="h-3.5 w-3.5 text-amber-600" />
                    <span>BUKA RAPOR BELAJAR</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/40">
                  <span className="text-[10px] font-bold uppercase">SKOR:</span>
                  <span className="text-xl font-black font-mono">{finalScore}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* QUIZ BATTLE ARENA (SATU LAYAR PID PENUH TANPA SCROLLING)                */}
        {/* ======================================================================= */}
        {quizMode === 'battle' ? (
          <div className={`bg-gradient-to-br from-[#0B1E44] via-[#12306B] to-[#0A2558] border-2 border-sky-400/80 text-white rounded-3xl shadow-[0_18px_40px_-12px_rgba(14,165,233,0.38)] p-3 sm:p-4 space-y-2.5 transition-all ${
            isPidFullscreen ? 'fixed inset-2 sm:inset-4 z-50 flex flex-col justify-between overflow-hidden shadow-2xl' : ''
          }`}>
            
            {/* 1. TOP PID CONTROL BAR & NUMBER PILLS */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-500/30 text-indigo-300 border border-indigo-400">
                  <Swords className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wide text-indigo-100 flex items-center gap-1.5">
                    <span>ARENA QUIZ BATTLE · SATU LAYAR PID</span>
                    <span className="text-[9px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse">
                      FULLSCREEN PID
                    </span>
                  </h3>
                </div>
              </div>

              {/* Soal 1-10 Pills inside PID Bar */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
                {questions.map((q, idx) => {
                  const hist = battleHistory[idx];
                  const isCurrent = activeQIdx === idx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        sounds.playClick();
                        setActiveQIdx(idx);
                        setActiveBuzzerTeam(null);
                      }}
                      className={`h-7 px-2.5 rounded-xl font-mono text-[11px] font-black border transition-all shrink-0 ${
                        isCurrent ? 'ring-2 ring-yellow-400 scale-105' : ''
                      } ${
                        hist
                          ? hist.isCorrect
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-rose-600 text-white border-rose-400'
                          : isCurrent
                          ? 'bg-yellow-400 text-slate-950 border-white'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={`Pilih Soal Nomor ${idx + 1}`}
                    >
                      Q{idx + 1}
                      {hist && (hist.isCorrect ? ' ✓' : ' ✗')}
                    </button>
                  );
                })}
              </div>

              {/* Utility actions: Reset, Finish, Fullscreen */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPidFullscreen(!isPidFullscreen)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-indigo-100 border border-indigo-600 text-xs font-bold transition"
                  title={isPidFullscreen ? 'Perkecil Layar PID' : 'Buka Satu Layar Penuh PID'}
                >
                  {isPidFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{isPidFullscreen ? 'Perkecil' : 'Layar Penuh PID'}</span>
                </button>
                <button
                  onClick={handleResetBattle}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition"
                  title="Atur ulang skor battle"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleFinishBattle}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-md hover:brightness-110 transition"
                  title="Umumkan Pemenang Battle"
                >
                  <Trophy className="h-3.5 w-3.5 text-slate-950" />
                  <span>Juara</span>
                </button>
              </div>
            </div>

            {/* Winner Celebration Modal / Banner */}
            {battleWinner && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-xl border-2 border-white flex items-center justify-between gap-3 animate-bounce">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div className="text-xs sm:text-sm">
                    Selamat! <strong>{battleWinner.name}</strong> memenangkan Quiz Battle dengan skor <strong>{battleWinner.score} Poin</strong>!
                  </div>
                </div>
                <button
                  onClick={() => setBattleWinner(null)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* 2. DUAL TEAM SCOREBOARD & LARGE TOUCH BUZZERS */}
            <div className="grid grid-cols-2 gap-2.5">
              {teams.map((tm) => {
                const isLocked = activeBuzzerTeam === tm.id;
                const isOtherLocked = activeBuzzerTeam !== null && !isLocked;
                const isBlue = tm.color === 'blue';
                const hasAnsweredCurrent = battleHistory[activeQIdx]?.teamId === tm.id;

                return (
                  <div
                    key={tm.id}
                    className={`rounded-2xl p-2 sm:p-2.5 border-2 transition-all flex flex-col justify-between ${
                      isLocked
                        ? 'border-yellow-400 bg-yellow-400/25 ring-2 ring-yellow-400/50'
                        : isBlue
                        ? 'border-sky-500 bg-sky-950/40'
                        : 'border-rose-500 bg-rose-950/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tm.badge}</span>
                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-white truncate max-w-[140px] sm:max-w-none">
                            {tm.name}
                          </h4>
                          <span className="text-[10px] text-slate-300 font-semibold block">
                            {hasAnsweredCurrent ? (
                              battleHistory[activeQIdx]?.isCorrect ? (
                                <span className="text-emerald-400 font-bold">✓ Benar Nomor Ini</span>
                              ) : (
                                <span className="text-rose-400 font-bold">✗ Belum Tepat</span>
                              )
                            ) : (
                              'Menunggu bel...'
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">SKOR</span>
                          <span className="text-xl sm:text-2xl font-black font-mono text-yellow-300">
                            {tm.score}
                          </span>
                        </div>
                        {/* Manual +/- adjust */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleAdjustScore(tm.id, pointsPerCorrect)}
                            className="h-4 w-4 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold flex items-center justify-center text-[10px]"
                            title={`+${pointsPerCorrect}`}
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleAdjustScore(tm.id, -pointsPerCorrect)}
                            className="h-4 w-4 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold flex items-center justify-center text-[10px]"
                            title={`-${pointsPerCorrect}`}
                          >
                            -
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Touch Buzzer Button on PID */}
                    <button
                      onClick={() => handleBuzzerPress(tm.id)}
                      disabled={isOtherLocked}
                      className={`w-full py-1.5 sm:py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 ${
                        isLocked
                          ? 'bg-yellow-400 text-slate-950 border-2 border-white animate-pulse'
                          : isOtherLocked
                          ? 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : isBlue
                          ? 'btn-3d-cyan text-white border-2 border-sky-300'
                          : 'btn-3d-rose text-white border-2 border-rose-300'
                      }`}
                    >
                      <Bell className={`h-3.5 w-3.5 ${isLocked ? 'animate-spin' : ''}`} />
                      <span>
                        {isLocked
                          ? `🔔 BEL ${tm.name.toUpperCase()} TERKUNCI!`
                          : `BEL ${tm.name.toUpperCase()}`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 3. ACTIVE QUESTION & INTERACTIVE OPTIONS (DIRECT PID TOUCH TARGETS) */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-indigo-400/80 space-y-2">
              {/* Question header in battle */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-black text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-600">
                    SOAL #{activeQIdx + 1} DARI 10
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentQ.badgeColor}`}>
                    {currentQ.formatLabel}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  {activeBuzzerTeam ? (
                    <span className="text-yellow-300 animate-pulse font-black">
                      👉 Sentuh jawaban di bawah untuk {teams.find((t) => t.id === activeBuzzerTeam)?.name}!
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      💡 Tekan bel salah satu tim untuk menjawab (+{pointsPerCorrect} Poin)
                    </span>
                  )}
                  {activeBuzzerTeam && (
                    <button
                      onClick={handleClearBuzzer}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      Batal Bel
                    </button>
                  )}
                </div>
              </div>

              {/* Question Prompt */}
              <p className="text-sm sm:text-base font-black text-white leading-snug">
                {currentQ.question}
              </p>

              {/* FORMAT 1: Pilihan Ganda (MC) */}
              {currentQ.type === 'mc' && currentQ.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = userAns === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`text-left p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-sky-900/90 border-sky-400 text-white font-bold'
                            : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-amber-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 font-mono text-xs font-black text-amber-300 shrink-0 border border-slate-700">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-xs sm:text-sm font-medium leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FORMAT 2: Pilihan Ganda Kompleks (Complex Checkbox) */}
              {currentQ.type === 'complex' && currentQ.options && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentQ.options.map((opt, optIdx) => {
                      const checkedList: number[] = userAns || [];
                      const isChecked = checkedList.includes(optIdx);
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleToggleComplexOption(optIdx)}
                          className={`text-left p-2.5 rounded-xl border-2 transition-all flex items-center gap-2.5 ${
                            isChecked
                              ? 'bg-orange-950/80 border-orange-500 text-white font-bold'
                              : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-orange-400'
                          }`}
                        >
                          <div className={`flex h-5 w-5 items-center justify-center rounded border shrink-0 ${
                            isChecked ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-900 border-slate-600'
                          }`}>
                            {isChecked && <Check className="h-3.5 w-3.5" />}
                          </div>
                          <span className="text-xs font-medium leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-orange-300 font-semibold">
                      *Bisa pilih 2 atau lebih opsi benar
                    </span>
                    <button
                      disabled={!activeBuzzerTeam}
                      onClick={handleConfirmBattleComplexAnswer}
                      className="btn-3d-amber px-4 py-1.5 rounded-xl text-xs font-black text-slate-950 disabled:opacity-40"
                    >
                      Kirim Jawaban Kompleks Tim {activeBuzzerTeam ? teams.find(t => t.id === activeBuzzerTeam)?.name : ''}
                    </button>
                  </div>
                </div>
              )}

              {/* FORMAT 3: Menjodohkan (Matching) */}
              {currentQ.type === 'match' && currentQ.leftItems && currentQ.rightItems && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentQ.leftItems.map((leftItem) => {
                      const currentRightMatch = (userAns || {})[leftItem.id];
                      return (
                        <div key={leftItem.id} className="p-2 rounded-xl bg-slate-800/90 border border-purple-500/50 flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-purple-200">{leftItem.text}</span>
                          <select
                            value={currentRightMatch !== undefined ? currentRightMatch : ''}
                            onChange={(e) => handleMatchPair(leftItem.id, parseInt(e.target.value))}
                            className="px-2 py-1 rounded-lg border border-purple-400 bg-slate-900 text-xs font-bold text-white outline-none"
                          >
                            <option value="">-- Pilih --</option>
                            {currentQ.rightItems?.map((r) => (
                              <option key={r.id} value={r.id}>{r.text}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={!activeBuzzerTeam}
                      onClick={handleConfirmBattleMatchAnswer}
                      className="btn-3d-indigo bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-xl text-xs font-black text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 shadow-sm"
                    >
                      Kirim Jawaban Menjodohkan
                    </button>
                  </div>
                </div>
              )}

              {/* FORMAT 4: Benar / Salah (TF) */}
              {currentQ.type === 'tf' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleSelectTF(true)}
                    className="p-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-950/60 hover:bg-emerald-800/80 text-white font-black text-center flex items-center justify-center gap-2 active:scale-95 transition"
                  >
                    <span className="text-xl">👍</span>
                    <span className="text-base">BENAR</span>
                  </button>
                  <button
                    onClick={() => handleSelectTF(false)}
                    className="p-3.5 rounded-xl border-2 border-rose-500 bg-rose-950/60 hover:bg-rose-800/80 text-white font-black text-center flex items-center justify-center gap-2 active:scale-95 transition"
                  >
                    <span className="text-xl">👎</span>
                    <span className="text-base">SALAH</span>
                  </button>
                </div>
              )}

              {/* 4. BOTTOM NAVIGATION FOR BATTLE */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                <button
                  disabled={activeQIdx === 0}
                  onClick={() => {
                    sounds.playClick();
                    setActiveQIdx(prev => Math.max(0, prev - 1));
                    setActiveBuzzerTeam(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Soal Sebelumnya</span>
                </button>

                <span className="text-[11px] text-indigo-300">
                  Total Soal Battle Terjawab: {Object.keys(battleHistory).length} / 10
                </span>

                <button
                  disabled={activeQIdx === questions.length - 1}
                  onClick={() => {
                    sounds.playClick();
                    setActiveQIdx(prev => Math.min(questions.length - 1, prev + 1));
                    setActiveBuzzerTeam(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40"
                >
                  <span>Soal Selanjutnya</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* ======================================================================= */
          /* MODE INDIVIDU STANDAR (SATU LAYAR PENUH SIDE-BY-SIDE TANPA SCROLL)      */
          /* ======================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* Active Question Card (Left 9 Cols) */}
            <div className="lg:col-span-9 rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#EFF6FF] via-[#F4F9FF] to-[#E0F2FE]/80 border-2 border-sky-200/90 shadow-[0_10px_0_#BAE6FD,0_20px_28px_-8px_rgba(2,132,199,0.16)] flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                {/* Top question tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      SOAL NOMOR {activeQIdx + 1} DARI 10
                    </span>
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${currentQ.badgeColor}`}>
                      {currentQ.formatLabel}
                    </span>
                  </div>

                  {isSubmitted && (
                    <div className={`flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-xl ${
                      isQuestionCorrect(activeQIdx) 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {isQuestionCorrect(activeQIdx) ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Benar (+10 Poin)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Kurang Tepat (0 Poin)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  {currentQ.question}
                </p>

                {/* FORMAT 1: PILIHAN GANDA BIASA (MC) */}
                {currentQ.type === 'mc' && currentQ.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = userAns === optIdx;
                      const isCorrectOpt = isSubmitted && optIdx === currentQ.correctAnswer;
                      const isWrongSelection = isSubmitted && isSelected && !isCorrectOpt;

                      return (
                        <button
                          key={optIdx}
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`text-left p-3 rounded-2xl border-2 transition-all flex items-start gap-2.5 ${
                            isSubmitted
                              ? isCorrectOpt
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                                : isWrongSelection
                                ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold'
                                : 'bg-white/70 border-sky-200/70 text-slate-400 opacity-60'
                              : isSelected
                              ? 'bg-sky-200 border-sky-500 text-sky-950 shadow-sm ring-2 ring-sky-300/80 font-bold'
                              : 'bg-gradient-to-r from-sky-100/90 to-cyan-50/90 border-sky-300 text-slate-900 hover:border-sky-500 hover:from-sky-200/80 hover:to-sky-100'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-lg font-mono text-xs font-black shrink-0 border ${
                              isSubmitted
                                ? isCorrectOpt
                                  ? 'bg-emerald-500 text-white border-emerald-600'
                                  : isWrongSelection
                                  ? 'bg-rose-500 text-white border-rose-600'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                                : isSelected
                                ? 'bg-sky-600 text-white border-sky-700'
                                : 'bg-sky-200/90 text-sky-900 border-sky-300'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-xs sm:text-sm font-medium leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* FORMAT 2: PILIHAN GANDA KOMPLEKS (CHECKBOX) */}
                {currentQ.type === 'complex' && currentQ.options && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-amber-800">
                        *Pilih semua opsi yang kamu anggap benar (bisa lebih dari satu):
                      </p>
                      {!isSubmitted && (
                        <button
                          type="button"
                          disabled={(userAns || []).length === 0}
                          onClick={handleConfirmSoloComplexAnswer}
                          className="btn-3d-amber bg-amber-400 hover:bg-amber-500 px-4 py-1.5 rounded-xl text-xs font-black text-slate-950 cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 shadow-sm"
                        >
                          Periksa Jawaban
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentQ.options.map((opt, optIdx) => {
                        const checkedList: number[] = userAns || [];
                        const isChecked = checkedList.includes(optIdx);
                        const isAnswerExpected = (currentQ.correctAnswer as number[]).includes(optIdx);

                        return (
                          <button
                            key={optIdx}
                            disabled={isSubmitted}
                            onClick={() => handleToggleComplexOption(optIdx)}
                            className={`w-full text-left p-2.5 sm:p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 ${
                              isSubmitted
                                ? isAnswerExpected
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                                  : isChecked
                                  ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold'
                                  : 'bg-white/70 border-sky-200/70 text-slate-400 opacity-60'
                                : isChecked
                                ? 'bg-sky-200 border-sky-500 text-sky-950 shadow-sm ring-2 ring-sky-300/80 font-bold'
                                : 'bg-gradient-to-r from-sky-100/90 to-cyan-50/90 border-sky-300 text-slate-900 hover:border-sky-500 hover:from-sky-200/80 hover:to-sky-100'
                            }`}
                          >
                            <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 shrink-0 mt-0.5 ${
                              isChecked
                                ? 'bg-sky-600 border-sky-700 text-white'
                                : 'bg-white border-sky-300'
                            }`}>
                              {isChecked && <Check className="h-3.5 w-3.5" />}
                            </div>
                            <span className="text-xs sm:text-sm font-medium leading-snug">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* FORMAT 3: MENJODOHKAN / MENCOCOKKAN (MATCHING) */}
                {currentQ.type === 'match' && currentQ.leftItems && currentQ.rightItems && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-purple-800">
                        *Pilih pasangan yang sesuai di sebelah kanan untuk setiap butir kiri:
                      </p>
                      {!isSubmitted && (
                        <button
                          type="button"
                          disabled={Object.keys(userAns || {}).length < currentQ.leftItems.length}
                          onClick={handleConfirmSoloMatchAnswer}
                          className="btn-3d-indigo bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-xl text-xs font-black text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 shadow-sm"
                        >
                          Periksa Jawaban
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentQ.leftItems.map((leftItem) => {
                        const currentRightMatch = (userAns || {})[leftItem.id];

                        return (
                          <div key={leftItem.id} className="p-2.5 rounded-xl bg-gradient-to-r from-sky-100/90 to-cyan-50/90 border-2 border-sky-300 flex flex-col justify-between gap-2">
                            <div className="text-xs font-black text-sky-950 leading-snug">
                              {leftItem.text}
                            </div>
                            <select
                              disabled={isSubmitted}
                              value={currentRightMatch !== undefined ? currentRightMatch : ''}
                              onChange={(e) => handleMatchPair(leftItem.id, parseInt(e.target.value))}
                              className="w-full px-2.5 py-1.5 rounded-lg border-2 border-sky-300 bg-white text-xs font-bold text-slate-800 outline-none focus:border-sky-500"
                            >
                              <option value="">-- Pilih Pasangan --</option>
                              {currentQ.rightItems?.map((rightItem) => (
                                <option key={rightItem.id} value={rightItem.id}>
                                  {rightItem.text}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* FORMAT 4: BENAR - SALAH (TRUE / FALSE) */}
                {currentQ.type === 'tf' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      disabled={isSubmitted}
                      onClick={() => handleSelectTF(true)}
                      className={`p-4 rounded-2xl border-3 text-center font-black transition-all flex items-center justify-center gap-2.5 ${
                        isSubmitted
                          ? currentQ.correctAnswer === true
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                            : userAns === true
                            ? 'bg-rose-100 border-rose-500 text-rose-950'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                          : userAns === true
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-md'
                          : 'bg-gradient-to-r from-sky-100/90 to-cyan-50/90 border-sky-300 text-sky-950 hover:border-emerald-400 hover:bg-emerald-50/70'
                      }`}
                    >
                      <span className="text-2xl">👍</span>
                      <span className="text-base sm:text-lg">BENAR</span>
                    </button>

                    <button
                      disabled={isSubmitted}
                      onClick={() => handleSelectTF(false)}
                      className={`p-4 rounded-2xl border-3 text-center font-black transition-all flex items-center justify-center gap-2.5 ${
                        isSubmitted
                          ? currentQ.correctAnswer === false
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                            : userAns === false
                            ? 'bg-rose-100 border-rose-500 text-rose-950'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                          : userAns === false
                          ? 'bg-rose-500 border-rose-600 text-white shadow-md'
                          : 'bg-gradient-to-r from-sky-100/90 to-cyan-50/90 border-sky-300 text-sky-950 hover:border-rose-400 hover:bg-rose-50/70'
                      }`}
                    >
                      <span className="text-2xl">👎</span>
                      <span className="text-base sm:text-lg">SALAH</span>
                    </button>
                  </div>
                )}

                {/* Explanation Box (Visible if submitted) */}
                {isSubmitted && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-slate-800 max-h-24 overflow-y-auto animate-fadeIn">
                    <div className="font-black text-amber-900 flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-amber-700" />
                      <span>PEMBAHASAN ILMIAH RESMI:</span>
                    </div>
                    <p className="leading-relaxed font-medium mt-0.5">
                      {currentQ.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Prev/Next Navigation */}
              <div className="pt-2.5 border-t border-sky-200/70 flex items-center justify-between gap-2">
                <button
                  disabled={activeQIdx === 0}
                  onClick={() => {
                    sounds.playClick();
                    setActiveQIdx((prev) => Math.max(0, prev - 1));
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 border-2 border-sky-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                  Gunakan panel nomor di kanan untuk lompat antar soal
                </span>

                <button
                  disabled={activeQIdx === questions.length - 1}
                  onClick={() => {
                    sounds.playClick();
                    setActiveQIdx((prev) => Math.min(questions.length - 1, prev + 1));
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 border-2 border-sky-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <span>Selanjutnya</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Sidebar: Navigasi Soal 1-10 & Tombol Kirim (Right 3 Cols) */}
            <div className="lg:col-span-3 rounded-3xl p-4 bg-gradient-to-br from-white via-[#EFF8FF] to-[#DFF0FF] border-2 border-sky-300/90 shadow-[0_10px_0_#93C5FD,0_20px_28px_-8px_rgba(14,165,233,0.2)] flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Navigasi Soal
                  </span>
                  <span className="text-[11px] font-mono font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                    {answeredCount}/10 Terjawab
                  </span>
                </div>

                {/* 10 Number Navigation Pills */}
                <div className="grid grid-cols-5 lg:grid-cols-2 gap-1.5">
                  {questions.map((q, idx) => {
                    const isAnswered = answers[idx] !== undefined;
                    const isCurrent = activeQIdx === idx;
                    const checkedStatus = isSubmitted ? isQuestionCorrect(idx) : soloHistory[idx];
                    const hasCheckedStatus = checkedStatus !== undefined;

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          sounds.playClick();
                          setActiveQIdx(idx);
                        }}
                        className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-black font-mono border-2 transition-all ${
                          isCurrent
                            ? 'ring-2 ring-amber-400 scale-[1.03] z-10'
                            : ''
                        } ${
                          hasCheckedStatus
                            ? checkedStatus
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : 'bg-rose-500 text-white border-rose-600'
                            : isAnswered
                            ? 'bg-amber-400 text-slate-950 border-amber-500'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <span>No. {idx + 1}</span>
                        {hasCheckedStatus && (checkedStatus ? '✓' : '✗')}
                      </button>
                    );
                  })}
                </div>

                {/* Compact Legend */}
                <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-bold text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 border border-emerald-600 inline-block shrink-0" />
                    <span>Benar</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-rose-500 border border-rose-600 inline-block shrink-0" />
                    <span>Salah</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-slate-50 border border-slate-300 inline-block shrink-0" />
                    <span>Belum</span>
                  </div>
                </div>
              </div>

              {!isSubmitted ? (
                <button
                  onClick={handleSubmitAll}
                  className="btn-3d-amber w-full px-3 py-2.5 rounded-xl text-xs font-black text-slate-950 shadow-md flex items-center justify-center gap-1.5 text-center"
                >
                  <Trophy className="h-4 w-4 shrink-0" />
                  <span>KIRIM &amp; LIHAT NILAI</span>
                </button>
              ) : (
                <div className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-300 text-center">
                  ✓ Nilai Tersimpan di Rapor
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modal Pengaturan Battle Antar Kelompok PID */}
      {isBattleSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-gradient-to-br from-white via-[#EFF8FF] to-[#DFF0FF] rounded-3xl p-6 shadow-2xl border-4 border-sky-300 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Settings className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Pengaturan Battle Kelompok PID
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Sesuaikan nama tim, poin kemenangan, dan sistem penalti
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBattleSettingsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              {/* Team Names */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-500">
                  Nama Kelompok Peserta (2 Tim PID)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔵</span>
                    <input
                      type="text"
                      value={teams[0]?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeams((prev) => [
                          { ...prev[0], name: val },
                          prev[1]
                        ]);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border-2 border-sky-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="Nama Kelompok Biru"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔴</span>
                    <input
                      type="text"
                      value={teams[1]?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeams((prev) => [
                          prev[0],
                          { ...prev[1], name: val }
                        ]);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border-2 border-rose-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      placeholder="Nama Kelompok Merah"
                    />
                  </div>
                </div>
              </div>

              {/* Point Settings */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-500">
                    Poin Benar (+/Soal)
                  </label>
                  <select
                    value={pointsPerCorrect}
                    onChange={(e) => setPointsPerCorrect(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 font-bold bg-white text-slate-900"
                  >
                    <option value={5}>+5 Poin</option>
                    <option value={10}>+10 Poin (Standar)</option>
                    <option value={15}>+15 Poin</option>
                    <option value={20}>+20 Poin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-500">
                    Penalti Salah (-/Soal)
                  </label>
                  <select
                    value={penaltyPoints}
                    onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 font-bold bg-white text-slate-900"
                  >
                    <option value={0}>0 Poin (Tanpa Pengurangan)</option>
                    <option value={5}>-5 Poin (Ketegangan Ringan)</option>
                    <option value={10}>-10 Poin (Kompetitif Penuh)</option>
                  </select>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500">
                  Preset Cepat Tema Fisikawan
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setTeams([
                        { id: 'teamA', name: 'Kelompok Galileo (Tim Biru)', score: teams[0].score, color: 'blue', badge: '🔵' },
                        { id: 'teamB', name: 'Kelompok Newton (Tim Merah)', score: teams[1].score, color: 'red', badge: '🔴' }
                      ]);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-bold"
                  >
                    Galileo vs Newton
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setTeams([
                        { id: 'teamA', name: 'Tim Einstein (Relativitas)', score: teams[0].score, color: 'blue', badge: '⚡' },
                        { id: 'teamB', name: 'Tim Maxwell (Elektrodinamika)', score: teams[1].score, color: 'red', badge: '🔥' }
                      ]);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-bold"
                  >
                    Einstein vs Maxwell
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setTeams([
                        { id: 'teamA', name: 'Kelompok Alpha (Tim 1)', score: teams[0].score, color: 'blue', badge: '🔵' },
                        { id: 'teamB', name: 'Kelompok Beta (Tim 2)', score: teams[1].score, color: 'red', badge: '🔴' }
                      ]);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-bold"
                  >
                    Alpha vs Beta
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsBattleSettingsOpen(false);
                }}
                className="btn-3d-indigo px-5 py-2 rounded-xl text-xs font-black text-white shadow-md"
              >
                Simpan &amp; Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dramatic Instant Battle Response Overlay (Confetti vs Giant Red Cross Effect) */}
      {battleFeedback && battleFeedback.show && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fadeIn" />
          
          <div
            className={`relative z-10 max-w-md w-full p-6 sm:p-8 rounded-3xl border-4 text-center shadow-2xl transform transition-all duration-300 animate-scaleIn pointer-events-auto ${
              battleFeedback.isCorrect
                ? 'bg-gradient-to-b from-emerald-600 via-teal-700 to-emerald-900 border-emerald-300 text-white'
                : 'bg-gradient-to-b from-rose-600 via-red-700 to-rose-950 border-rose-300 text-white'
            }`}
          >
            {/* Visual Icon Badge */}
            <div className="mx-auto mb-4 flex items-center justify-center">
              {battleFeedback.isCorrect ? (
                <div className="h-28 w-28 rounded-full bg-emerald-500/30 border-4 border-emerald-200 flex items-center justify-center animate-bounce shadow-2xl">
                  <Check className="h-20 w-20 text-white stroke-[4]" />
                </div>
              ) : (
                <div className="h-28 w-28 rounded-full bg-rose-500/30 border-4 border-rose-200 flex items-center justify-center animate-pulse shadow-2xl">
                  {/* Giant Red Cross Effect with XIcon */}
                  <XIcon className="h-20 w-20 text-white stroke-[4]" />
                </div>
              )}
            </div>

            {/* Respon Jawaban Kelompok: Cukup Benar atau Salah & Lanjutkan Soal */}
            {battleFeedback.teamName === 'Peringatan PID' ? (
              <div className="space-y-3">
                <h2 className="text-xl font-black text-white">{battleFeedback.teamName}</h2>
                <p className="text-sm font-semibold text-white/90">{battleFeedback.message}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                    {quizMode === 'battle' ? 'Respon Jawaban Kelompok' : 'Respon Jawaban Individu'}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                    {battleFeedback.teamName}
                  </h2>
                </div>

                <div className="inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-2xl text-xl sm:text-2xl font-black tracking-wider border-2 border-white/50 bg-white/20 shadow-lg text-white">
                  {battleFeedback.isCorrect ? (
                    <>
                      <Check className="h-7 w-7 text-white stroke-[3.5]" />
                      <span>BENAR</span>
                    </>
                  ) : (
                    <>
                      <XIcon className="h-7 w-7 text-white stroke-[3.5]" />
                      <span>SALAH</span>
                    </>
                  )}
                </div>

                {/* Tombol Lanjutkan Soal */}
                <div className="pt-2 flex items-center justify-center">
                  <button
                    onClick={handleContinueToNextQuestion}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 text-sm sm:text-base font-black transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{activeQIdx < questions.length - 1 ? 'Lanjutkan Soal' : 'Selesaikan Quiz'}</span>
                    <ArrowRight className="h-5 w-5 text-indigo-700" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Rapor Belajar Murid */}
      <StudentReportCardModal
        isOpen={isReportCardOpen}
        onClose={() => setIsReportCardOpen(false)}
        userRole={userRole}
        activeSession={activeSession}
        progress={userProgress}
        latestResult={latestResult}
        allResults={allQuizResults}
      />
    </section>
  );
};
