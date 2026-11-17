import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Plus, 
  Trash2, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Gauge, 
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Zap,
  Info,
  BarChart3,
  Edit3,
  Send,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { storage, TeacherProfile } from '../../utils/storage';
import { ActiveSession, SavedLKPDRecord, UserRole } from '../../types/physics';
import { TeacherProfileModal } from '../common/TeacherProfileModal';
import { Simulation3DTrack } from './Simulation3DTrack';

interface TelemetryRow {
  no: number;
  t: number;
  s: number;
  v: number;
  a: number;
  type: string;
}

interface LKPDFDraftState {
  labMode?: 'GLB' | 'GLBB';
  subType?: 'dipercepat' | 'diperlambat';
  v0?: number;
  acc?: number;
  simTime?: number;
  currentPos?: number;
  currentVel?: number;
  currentAcc?: number;
  isFinished?: boolean;
  gateTimes?: { g1: number | null; g2: number | null; g3: number | null };
  tickerDots?: number[];
  lkpdGroupName?: string;
  lkpdGroupLeader?: string;
  lkpdClass?: string;
  lkpdSchool?: string;
  lkpdDate?: string;
  lkpdMembers?: string;
  activeSubmissionId?: string;
  lkpdGlbRows?: TelemetryRow[];
  lkpdGlbbAccelRows?: TelemetryRow[];
  lkpdGlbbDecelRows?: TelemetryRow[];
  lkpdTableFilter?: 'all' | 'glb' | 'glbb-accel' | 'glbb-decel';
  lkpdGraphFilter?: 'glb' | 'glbb-accel' | 'glbb-decel';
  lkpdAns1?: string;
  lkpdAns2?: string;
  lkpdAns4?: string;
  lkpdAns5?: string;
  lkpdAns6?: string;
  lkpdConclusion?: string;
  lkpdStep?: number;
}

const loadLKPDDraft = (draftKey: string): LKPDFDraftState => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export interface VirtualLabLKPDSectionProps {
  userRole?: UserRole;
  activeSession?: ActiveSession | null;
  onSendToWhiteboard?: (payload: any) => void;
}

export const VirtualLabLKPDSection: React.FC<VirtualLabLKPDSectionProps> = ({
  userRole = 'murid',
  activeSession,
}) => {
  const draftStorageKey = `motionlab_lkpd_draft_v1_${activeSession?.accountId || userRole}`;
  const initialDraft = React.useMemo(() => loadLKPDDraft(draftStorageKey), [draftStorageKey]);

  // Experiment mode: GLB or GLBB
  const [labMode, setLabMode] = useState<'GLB' | 'GLBB'>(() =>
    initialDraft.labMode === 'GLBB' ? 'GLBB' : 'GLB'
  );
  const [subType, setSubType] = useState<'dipercepat' | 'diperlambat'>(() =>
    initialDraft.subType === 'diperlambat' ? 'diperlambat' : 'dipercepat'
  );

  // Input Parameters
  const [v0, setV0] = useState<number>(() =>
    typeof initialDraft.v0 === 'number' ? initialDraft.v0 : 6
  ); // m/s
  const [acc, setAcc] = useState<number>(() =>
    typeof initialDraft.acc === 'number' ? initialDraft.acc : 4
  ); // m/s²
  const [trackLength] = useState<number>(100); // 100 meters rail track
  const maxTime = 12; // safety timeout in seconds

  // Active Simulation State (always paused cleanly on remount after switching menus)
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simTime, setSimTime] = useState<number>(() =>
    typeof initialDraft.simTime === 'number' ? initialDraft.simTime : 0
  );
  const [currentPos, setCurrentPos] = useState<number>(() =>
    typeof initialDraft.currentPos === 'number' ? initialDraft.currentPos : 0
  );
  const [currentVel, setCurrentVel] = useState<number>(() =>
    typeof initialDraft.currentVel === 'number'
      ? initialDraft.currentVel
      : typeof initialDraft.v0 === 'number'
        ? initialDraft.v0
        : 6
  );
  const [currentAcc, setCurrentAcc] = useState<number>(() =>
    typeof initialDraft.currentAcc === 'number' ? initialDraft.currentAcc : 0
  );
  const [isFinished, setIsFinished] = useState<boolean>(() =>
    Boolean(initialDraft.isFinished)
  );

  // Photogate Split Time Memory
  const [gateTimes, setGateTimes] = useState<{ g1: number | null; g2: number | null; g3: number | null }>(() =>
    initialDraft.gateTimes && typeof initialDraft.gateTimes === 'object'
      ? {
          g1: initialDraft.gateTimes.g1 ?? null,
          g2: initialDraft.gateTimes.g2 ?? null,
          g3: initialDraft.gateTimes.g3 ?? null,
        }
      : { g1: null, g2: null, g3: null }
  );

  // Ticker timer generated dots on paper ribbon
  const [tickerDots, setTickerDots] = useState<number[]>(() =>
    Array.isArray(initialDraft.tickerDots) ? initialDraft.tickerDots : []
  );

  // Feedback Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // LKPD State (Kolom Pengisian Identitas Kelompok Peserta Didik Dikosongkan agar Langsung Diisi Murid, & Dipertahankan Selama Belum Dikumpulkan)
  const [lkpdGroupName, setLkpdGroupName] = useState(() => initialDraft.lkpdGroupName ?? '');
  const [lkpdGroupLeader, setLkpdGroupLeader] = useState(() => initialDraft.lkpdGroupLeader ?? '');
  const [lkpdClass, setLkpdClass] = useState(
    () => initialDraft.lkpdClass ?? activeSession?.className ?? ''
  );
  const [lkpdSchool, setLkpdSchool] = useState(
    () => initialDraft.lkpdSchool ?? (activeSession?.npsn ? `Sekolah NPSN ${activeSession.npsn}` : '')
  );
  const [lkpdDate, setLkpdDate] = useState(
    () => initialDraft.lkpdDate || new Date().toISOString().split('T')[0]
  );
  const [lkpdMembers, setLkpdMembers] = useState(() => initialDraft.lkpdMembers ?? '');
  const [activeSubmissionId, setActiveSubmissionId] = useState<string>(
    () => initialDraft.activeSubmissionId || (activeSession?.accountId ? `lkpd_${activeSession.accountId}` : '')
  );

  // LKPD Data Table Rows: Terpisah antara Percobaan GLB, GLBB Dipercepat, dan GLBB Diperlambat
  const [lkpdGlbRows, setLkpdGlbRows] = useState<TelemetryRow[]>(() =>
    Array.isArray(initialDraft.lkpdGlbRows) ? initialDraft.lkpdGlbRows : []
  );
  const [lkpdGlbbAccelRows, setLkpdGlbbAccelRows] = useState<TelemetryRow[]>(() =>
    Array.isArray(initialDraft.lkpdGlbbAccelRows) ? initialDraft.lkpdGlbbAccelRows : []
  );
  const [lkpdGlbbDecelRows, setLkpdGlbbDecelRows] = useState<TelemetryRow[]>(() =>
    Array.isArray(initialDraft.lkpdGlbbDecelRows) ? initialDraft.lkpdGlbbDecelRows : []
  );
  const [lkpdTableFilter, setLkpdTableFilter] = useState<'all' | 'glb' | 'glbb-accel' | 'glbb-decel'>(() =>
    initialDraft.lkpdTableFilter || 'all'
  );
  const [lkpdGraphFilter, setLkpdGraphFilter] = useState<'glb' | 'glbb-accel' | 'glbb-decel'>(() =>
    initialDraft.lkpdGraphFilter || 'glb'
  );

  // Kolom Jawaban Pertanyaan Analisis & Kesimpulan
  const [lkpdAns1, setLkpdAns1] = useState(() => initialDraft.lkpdAns1 ?? '');
  const [lkpdAns2, setLkpdAns2] = useState(() => initialDraft.lkpdAns2 ?? '');
  const [lkpdAns4, setLkpdAns4] = useState(() => initialDraft.lkpdAns4 ?? '');
  const [lkpdAns5, setLkpdAns5] = useState(() => initialDraft.lkpdAns5 ?? '');
  const [lkpdAns6, setLkpdAns6] = useState(() => initialDraft.lkpdAns6 ?? '');
  const [lkpdConclusion, setLkpdConclusion] = useState(() => initialDraft.lkpdConclusion ?? '');
  const [lkpdSavedNotice, setLkpdSavedNotice] = useState(false);
  const [lkpdStep, setLkpdStep] = useState<number>(() =>
    typeof initialDraft.lkpdStep === 'number' ? initialDraft.lkpdStep : 0
  );
  const [savedRecords, setSavedRecords] = useState<SavedLKPDRecord[]>(() => {
    if (!activeSession?.npsn) {
      return userRole === 'guru' ? [] : storage.getSavedLKPDs();
    }
    return storage.getSavedLKPDs({ npsn: activeSession.npsn });
  });

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(storage.getTeacherProfile());
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);

  const latestDraftRef = useRef<LKPDFDraftState>({});
  latestDraftRef.current = {
    labMode,
    subType,
    v0,
    acc,
    simTime,
    currentPos,
    currentVel,
    currentAcc,
    isFinished,
    gateTimes,
    tickerDots,
    lkpdGroupName,
    lkpdGroupLeader,
    lkpdClass,
    lkpdSchool,
    lkpdDate,
    lkpdMembers,
    activeSubmissionId,
    lkpdGlbRows,
    lkpdGlbbAccelRows,
    lkpdGlbbDecelRows,
    lkpdTableFilter,
    lkpdGraphFilter,
    lkpdAns1,
    lkpdAns2,
    lkpdAns4,
    lkpdAns5,
    lkpdAns6,
    lkpdConclusion,
    lkpdStep,
  };

  const persistLKPDDraftNow = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify(latestDraftRef.current));
    } catch {
      // Ignore quota errors
    }
  }, [draftStorageKey]);

  // Simpan otomatis setiap perubahan LKPD / parameter & saat simulasi dijeda atau selesai (tanpa thrashing 60fps)
  useEffect(() => {
    if (isRunning) return;
    persistLKPDDraftNow();
  }, [
    isRunning,
    persistLKPDDraftNow,
    labMode,
    subType,
    v0,
    acc,
    isFinished,
    lkpdGroupName,
    lkpdGroupLeader,
    lkpdClass,
    lkpdSchool,
    lkpdDate,
    lkpdMembers,
    activeSubmissionId,
    lkpdGlbRows,
    lkpdGlbbAccelRows,
    lkpdGlbbDecelRows,
    lkpdTableFilter,
    lkpdGraphFilter,
    lkpdAns1,
    lkpdAns2,
    lkpdAns4,
    lkpdAns5,
    lkpdAns6,
    lkpdConclusion,
    lkpdStep,
  ]);

  // Simpan juga secara sinkron saat murid berpindah ke menu lain (unmount) agar posisi simulasi & isian LKPD tetap utuh
  useEffect(() => {
    return () => {
      persistLKPDDraftNow();
    };
  }, [persistLKPDDraftNow]);

  const refreshSyncedLKPDs = React.useCallback(() => {
    if (!activeSession?.npsn) {
      setSavedRecords(userRole === 'guru' ? [] : storage.getSavedLKPDs());
      return;
    }
    setSavedRecords(storage.getSavedLKPDs({ npsn: activeSession.npsn }));
  }, [activeSession?.npsn, userRole]);

  useEffect(() => {
    setTeacherProfile(storage.getTeacherProfile());
    refreshSyncedLKPDs();
    const handler = (e: any) => {
      if (e.detail) setTeacherProfile(e.detail);
    };
    const syncHandler = () => {
      refreshSyncedLKPDs();
    };
    window.addEventListener('teacher-profile-updated', handler);
    window.addEventListener('mpi-sync-updated', syncHandler);
    window.addEventListener('storage', syncHandler);
    return () => {
      window.removeEventListener('teacher-profile-updated', handler);
      window.removeEventListener('mpi-sync-updated', syncHandler);
      window.removeEventListener('storage', syncHandler);
    };
  }, [refreshSyncedLKPDs]);

  // Calculation parameters
  const effectiveAcc = labMode === 'GLB' ? 0 : (subType === 'diperlambat' ? -Math.abs(acc) : Math.abs(acc));

  // High-Precision 60FPS Physics Simulation Loop
  const lastTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Helper: Append one telemetry point directly into the active LKPD experiment table
  const appendRowToActiveLKPDTable = React.useCallback(
    (row: Omit<TelemetryRow, 'no'>) => {
      const appendWithRenumber = (prev: TelemetryRow[]) => [
        ...prev,
        { ...row, no: prev.length + 1 }
      ];
      if (labMode === 'GLB') {
        setLkpdGlbRows(appendWithRenumber);
      } else if (subType === 'dipercepat') {
        setLkpdGlbbAccelRows(appendWithRenumber);
      } else {
        setLkpdGlbbDecelRows(appendWithRenumber);
      }
    },
    [labMode, subType]
  );

  // Helper: Seed initial t = 0 point directly into active LKPD table when starting a fresh simulation run
  const resetActiveLKPDTableWithInitialPoint = () => {
    const initialRow: TelemetryRow = {
      no: 1,
      t: 0,
      s: 0,
      v: Number(v0.toFixed(2)),
      a: effectiveAcc,
      type: labMode === 'GLB' ? 'GLB' : `GLBB (${subType})`
    };
    if (labMode === 'GLB') {
      setLkpdGlbRows([initialRow]);
    } else if (subType === 'dipercepat') {
      setLkpdGlbbAccelRows([initialRow]);
    } else {
      setLkpdGlbbDecelRows([initialRow]);
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000); // capped for stability
      lastTimeRef.current = now;

      setSimTime((prevT) => {
        const nextT = prevT + dt;

        // Kinematic state at nextT
        let newV = v0 + (effectiveAcc * nextT);
        let newS = (v0 * nextT) + (0.5 * effectiveAcc * nextT * nextT);

        // Check if stopped during braking
        if (labMode === 'GLBB' && subType === 'diperlambat' && newV <= 0) {
          newV = 0;
          const stopTime = v0 / Math.abs(effectiveAcc);
          newS = (v0 * stopTime) + (0.5 * effectiveAcc * stopTime * stopTime);
          setIsRunning(false);
          setIsFinished(true);
          sounds.playSuccess();
          setCurrentVel(0);
          setCurrentPos(Number(newS.toFixed(2)));
          if (Math.abs(stopTime - Math.floor(stopTime)) > 0.08) {
            appendRowToActiveLKPDTable({
              t: Number(stopTime.toFixed(2)),
              s: Number(newS.toFixed(2)),
              v: 0,
              a: effectiveAcc,
              type: `GLBB (${subType})`
            });
          }
          return stopTime;
        }

        // Check if reached finish line (100 meters)
        if (newS >= trackLength || nextT >= maxTime) {
          setIsRunning(false);
          setIsFinished(true);
          sounds.playSuccess();
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
          const finalS = Math.min(trackLength, newS);
          const finalV = Math.sqrt(Math.max(0, (v0 * v0) + (2 * effectiveAcc * finalS)));
          setCurrentVel(Number(finalV.toFixed(2)));
          setCurrentPos(Number(finalS.toFixed(2)));
          if (Math.abs(nextT - Math.floor(nextT)) > 0.08) {
            appendRowToActiveLKPDTable({
              t: Number(nextT.toFixed(2)),
              s: Number(finalS.toFixed(2)),
              v: Number(finalV.toFixed(2)),
              a: effectiveAcc,
              type: labMode === 'GLB' ? 'GLB' : `GLBB (${subType})`
            });
          }
          return nextT;
        }

        // Normal smooth step
        setCurrentVel(Number(newV.toFixed(2)));
        setCurrentPos(Number(newS.toFixed(2)));
        setCurrentAcc(effectiveAcc);

        // Check photogate trigger milestones
        setGateTimes((prev) => {
          let updated = { ...prev };
          if (newS >= 25 && prev.g1 === null) updated.g1 = Number(nextT.toFixed(2));
          if (newS >= 50 && prev.g2 === null) updated.g2 = Number(nextT.toFixed(2));
          if (newS >= 75 && prev.g3 === null) updated.g3 = Number(nextT.toFixed(2));
          return updated;
        });

        // Ticker tape dot recording every 0.5s
        if (Math.floor(nextT * 2) > Math.floor(prevT * 2)) {
          const tapePct = Math.min(96, Math.max(2, (newS / trackLength) * 94));
          setTickerDots((prev) => [...prev.slice(-25), Number(tapePct.toFixed(1))]);
        }

        // Auto-log directly to the corresponding LKPD table on 1.0 second intervals
        if (Math.floor(nextT) > Math.floor(prevT)) {
          const recTime = Math.floor(nextT);
          const recV = Math.max(0, v0 + (effectiveAcc * recTime));
          const recS = Math.max(0, (v0 * recTime) + (0.5 * effectiveAcc * recTime * recTime));
          appendRowToActiveLKPDTable({
            t: Number(recTime.toFixed(1)),
            s: Number(recS.toFixed(2)),
            v: Number(recV.toFixed(2)),
            a: effectiveAcc,
            type: labMode === 'GLB' ? 'GLB' : `GLBB (${subType})`
          });
        }

        return nextT;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, v0, effectiveAcc, trackLength, maxTime, labMode, subType, appendRowToActiveLKPDTable]);

  // Mode Selection
  const handleSelectMode = (mode: 'GLB' | 'GLBB') => {
    sounds.playClick();
    setLabMode(mode);
    setIsRunning(false);
    setIsFinished(false);
    setSimTime(0);
    setCurrentPos(0);
    setCurrentVel(v0);
    setCurrentAcc(mode === 'GLB' ? 0 : (subType === 'diperlambat' ? -acc : acc));
    setGateTimes({ g1: null, g2: null, g3: null });
    setTickerDots([]);
  };

  const handleReset = () => {
    sounds.playClick();
    setIsRunning(false);
    setIsFinished(false);
    setSimTime(0);
    setCurrentPos(0);
    setCurrentVel(v0);
    setCurrentAcc(effectiveAcc);
    setGateTimes({ g1: null, g2: null, g3: null });
    setTickerDots([]);
    showToast('Simulasi kereta diatur ulang ke titik 0 meter.');
  };

  const handleToggleRunSimulation = () => {
    sounds.playStart();
    if (isRunning) {
      setIsRunning(false);
      return;
    }
    if (isFinished || simTime === 0) {
      setIsFinished(false);
      setSimTime(0);
      setCurrentPos(0);
      setCurrentVel(v0);
      setCurrentAcc(effectiveAcc);
      setGateTimes({ g1: null, g2: null, g3: null });
      setTickerDots([]);
      resetActiveLKPDTableWithInitialPoint();
    }
    setIsRunning(true);
  };

  const handleDeleteLKPDGlbRow = (index: number) => {
    sounds.playClick();
    setLkpdGlbRows((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      return updated.map((item, i) => ({ ...item, no: i + 1 }));
    });
    showToast('Baris data GLB LKPD dihapus.');
  };

  const handleDeleteLKPDGlbbAccelRow = (index: number) => {
    sounds.playClick();
    setLkpdGlbbAccelRows((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      return updated.map((item, i) => ({ ...item, no: i + 1 }));
    });
    showToast('Baris data GLBB Dipercepat LKPD dihapus.');
  };

  const handleDeleteLKPDGlbbDecelRow = (index: number) => {
    sounds.playClick();
    setLkpdGlbbDecelRows((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      return updated.map((item, i) => ({ ...item, no: i + 1 }));
    });
    showToast('Baris data GLBB Diperlambat LKPD dihapus.');
  };

  const handleClearLKPDGlbTable = () => {
    sounds.playClick();
    setLkpdGlbRows([]);
    showToast('Tabel data GLB LKPD dibersihkan.');
  };

  const handleClearLKPDGlbbAccelTable = () => {
    sounds.playClick();
    setLkpdGlbbAccelRows([]);
    showToast('Tabel data GLBB Dipercepat LKPD dibersihkan.');
  };

  const handleClearLKPDGlbbDecelTable = () => {
    sounds.playClick();
    setLkpdGlbbDecelRows([]);
    showToast('Tabel data GLBB Diperlambat LKPD dibersihkan.');
  };

  const handleSaveLKPD = () => {
    sounds.playSuccess();
    const combinedGlbb = [...lkpdGlbbAccelRows, ...lkpdGlbbDecelRows];
    const resolvedId = activeSubmissionId || `lkpd_${Date.now()}`;
    if (!activeSubmissionId) setActiveSubmissionId(resolvedId);

    const newRecord: SavedLKPDRecord = {
      id: resolvedId,
      timestamp: new Date().toISOString(),
      title: `LKPD ${labMode} - ${lkpdGroupName || lkpdClass || activeSession?.className || 'Kelompok Praktikum'}`,
      groupName: lkpdGroupName || activeSession?.displayName || '',
      groupLeader: lkpdGroupLeader || activeSession?.displayName || '',
      members: lkpdMembers,
      className: lkpdClass || activeSession?.className || '',
      school: lkpdSchool || (activeSession?.npsn ? `Sekolah NPSN ${activeSession.npsn}` : ''),
      date: lkpdDate,
      labMode: labMode,
      rows: [...lkpdGlbRows, ...combinedGlbb],
      glbRows: [...lkpdGlbRows],
      glbbRows: combinedGlbb,
      glbbAccelRows: [...lkpdGlbbAccelRows],
      glbbDecelRows: [...lkpdGlbbDecelRows],
      ans1: lkpdAns1,
      ans2: lkpdAns2,
      ans3: '',
      ans4: lkpdAns4,
      ans5: lkpdAns5,
      ans6: lkpdAns6,
      conclusion: lkpdConclusion,
      npsn: activeSession?.npsn || '',
      studentAccountId: activeSession?.accountId || '',
      status: 'submitted',
    };
    storage.saveLKPD(newRecord);
    refreshSyncedLKPDs();
    setLkpdSavedNotice(true);
    setTimeout(() => setLkpdSavedNotice(false), 4000);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    showToast(
      userRole === 'murid'
        ? `LKPD berhasil dikumpulkan & otomatis tersinkron ke akun Guru!`
        : `Data LKPD berhasil disimpan!`
    );
  };

  const handlePrintLKPD = () => {
    sounds.playClick();
    window.print();
  };

  return (
    <section id="simulasi" className="relative w-full py-1.5 sm:py-2 border-t-2 border-sky-200 bg-gradient-to-b from-[#EFF8FF]/65 via-[#F7FBFF] to-white">
      <div className="w-full max-w-[1600px] mx-auto px-2.5 sm:px-5 space-y-2">
        
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900/95 text-white px-4 py-2.5 shadow-2xl border border-sky-400 flex items-center gap-2 text-xs font-bold animate-bounce">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-black text-orange-800 border border-orange-300">
              <Gauge className="h-3 w-3 text-orange-600" />
              <span>MENU 4 · SIMULASI &amp; LKPD</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Praktikum Virtual Kinematika GLB &amp; GLBB
            </h2>
            <p className="text-[11px] font-semibold text-slate-500 hidden xl:block">
              · Eksperimen rel udara presisi &amp; LKPD digital dalam satu layar
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">

            <div className="flex items-center gap-1 bg-sky-100/80 p-0.5 rounded-xl border border-sky-200">
              <button
                onClick={() => handleSelectMode('GLB')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                  labMode === 'GLB'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Percobaan GLB (a = 0)
              </button>
              <button
                onClick={() => handleSelectMode('GLBB')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                  labMode === 'GLBB'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Percobaan GLBB (a ≠ 0)
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BARIS SEJAJAR: KIRI = SIMULASI PERCOBAAN | KANAN = LKPD DIGITAL           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch print:block">

        {/* ========================================================================= */}
        {/* SIMULATOR GERAK KERETA (TERINTEGRASI LANGSUNG KE TABEL DATA LKPD)         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 rounded-3xl p-2.5 sm:p-3 bg-gradient-to-br from-white via-[#EFF8FF] to-[#DFF0FF] border-2 border-sky-300/90 flex flex-col justify-between space-y-1.5 shadow-[0_8px_0_#93C5FD,0_16px_28px_-10px_rgba(14,165,233,0.22)] h-full lg:h-[clamp(430px,calc(100dvh-185px),680px)] no-print">
            
            {/* Top Panel Compact: Variabel Tetap & Variabel Kontrol */}
            {labMode === 'GLB' ? (
              <div className="px-2 py-1.5 rounded-lg border bg-sky-50/90 border-sky-300 transition">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-black text-sky-950 tracking-tight truncate">
                    Variabel GLB (Gerak Lurus Beraturan)
                  </span>
                  <span className="text-[9px] font-bold font-mono text-sky-800 shrink-0">
                    a = 0 m/s²
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] leading-tight">
                  <div className="px-2 py-1 rounded-md bg-white/95 border border-sky-200/80 truncate">
                    <span className="font-bold text-slate-500">Tetap: </span>
                    <span className="font-mono tabular-nums font-black text-sky-950">
                      v = {v0} m/s · a = 0
                    </span>
                  </div>
                  <div className="px-2 py-1 rounded-md bg-white/95 border border-sky-200/80 truncate">
                    <span className="font-bold text-slate-500">Kontrol: </span>
                    <span className="font-mono tabular-nums font-bold text-slate-800">
                      Rel {trackLength}m · s₀=0 · S 25/50/75m
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-2 py-1.5 rounded-lg border bg-amber-50/90 border-orange-300 transition">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-black text-orange-950 tracking-tight truncate">
                    Variabel GLBB ({subType === 'dipercepat' ? 'Dipercepat' : 'Diperlambat'})
                  </span>
                  <span className="text-[9px] font-bold font-mono text-orange-800 shrink-0">
                    a = {subType === 'dipercepat' ? `+${acc}` : `-${acc}`} m/s²
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] leading-tight">
                  <div className="px-2 py-1 rounded-md bg-white/95 border border-orange-200/80 truncate">
                    <span className="font-bold text-slate-500">Tetap: </span>
                    <span className="font-mono tabular-nums font-black text-orange-950">
                      a = {subType === 'dipercepat' ? `+${acc}` : `-${acc}`} m/s² · v₀ = {v0}
                    </span>
                  </div>
                  <div className="px-2 py-1 rounded-md bg-white/95 border border-orange-200/80 truncate">
                    <span className="font-bold text-slate-500">Kontrol: </span>
                    <span className="font-mono tabular-nums font-bold text-slate-800">
                      Rel {trackLength}m · s₀=0 · S 25/50/75m
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* RUNWAY ARENA 3D: MOBIL KINEMATIKA 3D REAL-TIME & PHOTOGATE LASER */}
          <div className="relative flex-1 min-h-[240px] sm:min-h-[270px] lg:min-h-0 w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-2 border-2 border-slate-700 overflow-hidden flex flex-col justify-between gap-1.5 shadow-lg">
            <Simulation3DTrack
              currentPos={currentPos}
              currentVel={currentVel}
              currentAcc={currentAcc}
              trackLength={trackLength}
              labMode={labMode}
              subType={subType}
              gateTimes={gateTimes}
            />

            {/* Simulated Ticker Tape Strip at bottom */}
            <div className="relative h-6 shrink-0 w-full rounded-lg bg-amber-100 border border-amber-300 flex items-center px-3 overflow-hidden shadow-sm">
              <span className="text-[8px] font-mono font-black text-amber-950 shrink-0 mr-2 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-900 inline-block" />
                <span>PITA TICKER TIMER:</span>
              </span>
              <div className="relative flex-1 h-full flex items-center">
                {tickerDots.map((pos, idx) => (
                  <div 
                    key={idx}
                    className="absolute w-1.5 h-1.5 rounded-full bg-slate-900 shadow-xs"
                    style={{ left: `${pos}%` }}
                  />
                ))}
              </div>
              <span className="text-[8px] font-mono text-slate-600 hidden sm:inline">
                {labMode === 'GLB' 
                  ? 'GLB: Jarak titik konstan (v tetap)' 
                  : subType === 'dipercepat' 
                    ? 'GLBB (+a): Jarak titik merenggang' 
                    : 'GLBB (-a): Jarak titik merapat'}
              </span>
            </div>

          </div>

          {/* Controls & Sliders Panel */}
          <div className="space-y-1.5 pt-0.5 shrink-0">
            
            {/* Sliders Area */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              
              {/* v0 slider */}
              <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between text-[11px] font-bold text-slate-800 mb-0.5">
                  <span>v₀:</span>
                  <span className="font-mono text-sky-700">{v0} m/s</span>
                </div>
                <input 
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  value={v0}
                  disabled={isRunning}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setV0(val);
                    if (!isRunning) setCurrentVel(val);
                  }}
                  className="w-full"
                />
              </div>

              {/* Acceleration slider */}
              <div className={`p-1.5 rounded-xl border ${
                labMode === 'GLB' 
                  ? 'bg-slate-100/60 border-slate-200 opacity-60' 
                  : 'bg-slate-50 border-orange-200'
              }`}>
                <div className="flex justify-between text-[11px] font-bold text-slate-800 mb-0.5">
                  <span>a:</span>
                  <span className="font-mono text-orange-700">
                    {labMode === 'GLB' ? '0 m/s²' : `${acc} m/s²`}
                  </span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={acc}
                  disabled={isRunning || labMode === 'GLB'}
                  onChange={(e) => setAcc(parseFloat(e.target.value))}
                  className="w-full slider-orange"
                />
              </div>

              {/* GLBB Sub-mode (Dipercepat vs Diperlambat) */}
              <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-800 block mb-0.5">
                  Arah GLBB:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={labMode === 'GLB'}
                    onClick={() => setSubType('dipercepat')}
                    className={`flex-1 py-1 text-[10px] font-black rounded-lg border transition ${
                      subType === 'dipercepat' && labMode === 'GLBB'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    +a
                  </button>
                  <button
                    disabled={labMode === 'GLB'}
                    onClick={() => setSubType('diperlambat')}
                    className={`flex-1 py-1 text-[10px] font-black rounded-lg border transition ${
                      subType === 'diperlambat' && labMode === 'GLBB'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    -a
                  </button>
                </div>
              </div>

            </div>

            {/* Action Buttons & Live LKPD Integration Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleRunSimulation}
                  className={`btn-3d-${isRunning ? 'orange' : 'emerald'} flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-black text-white`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      <span>JEDA SIMULASI</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-white" />
                      <span>JALANKAN SIMULASI</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  title="Atur ulang ke titik 0 meter"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-[11px] font-bold shadow-sm transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span className={`h-2 w-2 rounded-full shrink-0 ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-sky-500'}`} />
                <span className="font-bold text-slate-600">
                  Ke:{' '}
                  <strong className={labMode === 'GLB' ? 'text-sky-700' : subType === 'dipercepat' ? 'text-amber-700' : 'text-rose-700'}>
                    {labMode === 'GLB'
                      ? `GLB (${lkpdGlbRows.length})`
                      : subType === 'dipercepat'
                        ? `GLBB +a (${lkpdGlbbAccelRows.length})`
                        : `GLBB -a (${lkpdGlbbDecelRows.length})`}
                  </strong>
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* LKPD DIGITAL DENGAN PENGISIAN LENGKAP IDENTITAS KELOMPOK                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 rounded-3xl p-2.5 sm:p-3 bg-gradient-to-br from-white via-[#EFF8FF] to-[#E0F2FE] border-2 border-sky-300/90 flex flex-col space-y-2 shadow-[0_8px_0_#93C5FD,0_16px_28px_-10px_rgba(14,165,233,0.22)] h-full lg:h-[clamp(430px,calc(100dvh-185px),680px)] print:h-auto print:bg-white print:border-0 print:shadow-none print:p-0">
          
          {/* LKPD Formal Header */}
          <div className="border-b-2 border-slate-900 pb-2 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    LKPD DIGITAL · KELAS X FASE E
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-950 truncate">
                    Lembar Kerja Peserta Didik: Kinematika Gerak Lurus
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 no-print">
                {/* Tombol Kumpulkan & PDF (hanya tampil di akun Murid; dihilangkan di akun Guru) */}
                {userRole !== 'guru' && (
                  <>
                    <button
                      onClick={handleSaveLKPD}
                      className="btn-3d-emerald flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-black text-white shadow-sm"
                      title="Kumpulkan LKPD ke Akun Guru"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Kumpulkan</span>
                    </button>

                    <button
                      onClick={handlePrintLKPD}
                      className="btn-3d-cyan flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black text-white shadow-sm"
                      title="Unduh Lembar Kerja Peserta Didik (LKPD) dalam format PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {lkpdSavedNotice && (
              <div className="mt-1.5 p-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                <span>
                  {userRole === 'murid'
                    ? 'LKPD berhasil dikumpulkan & otomatis tersinkron ke akun Guru sekolah Anda!'
                    : 'Isian identitas kelompok dan jawaban LKPD berhasil tersimpan!'}
                </span>
              </div>
            )}

            {/* Umpan Balik Guru Real-Time untuk Akun Murid */}
            {userRole === 'murid' && (() => {
              const myFeedbackRecords = savedRecords.filter(
                (r) =>
                  Boolean(r.teacherFeedback && r.teacherFeedback.trim().length > 0) &&
                  (!activeSession?.accountId || r.studentAccountId === activeSession.accountId)
              );
              if (myFeedbackRecords.length === 0) return null;
              const latestFb = myFeedbackRecords[0];
              return (
                <div className="mt-2 p-2.5 rounded-2xl bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 border-2 border-indigo-300 shadow-sm space-y-1 no-print">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>Umpan Balik Guru ({latestFb.feedbackBy || 'Guru Pengampu'})</span>
                    </span>
                    {latestFb.feedbackAt && (
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                        {new Date(latestFb.feedbackAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-indigo-900 leading-snug">
                    "{latestFb.teacherFeedback}"
                  </p>
                </div>
              );
            })()}
          </div>

          {/* LKPD Step Navigation */}
          <div className="no-print shrink-0 flex items-center justify-between gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                sounds.playClick();
                setLkpdStep((prev) => Math.max(0, prev - 1));
              }}
              disabled={lkpdStep === 0}
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition shrink-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {[
                { id: 0, label: '1. Identitas' },
                { id: 1, label: '2. Tabel Data' },
                { id: 2, label: '3. Grafik' },
                { id: 3, label: '4. Diskusi' },
                { id: 4, label: '5. Kesimpulan' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    sounds.playClick();
                    setLkpdStep(st.id);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap shrink-0 transition ${
                    lkpdStep === st.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                setLkpdStep((prev) => Math.min(4, prev + 1));
              }}
              disabled={lkpdStep === 4}
              className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition shrink-0"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* KONTEN LANGKAH LKPD (MENGISI PENUH TINGGI CARD SEJAJAR SIMULASI PERCOBAAN) */}
          <div className="flex-1 min-h-0 flex flex-col lg:overflow-y-auto pr-0.5 print:block print:max-h-none print:overflow-visible print:space-y-4">

          {/* LKPD STEP 1: FORM PENGISIAN IDENTITAS KELOMPOK LENGKAP */}
          <div className={`${lkpdStep === 0 ? 'flex-1 min-h-0 flex flex-col gap-2.5 animate-fadeIn' : 'hidden print:block print:space-y-2.5'}`}>
            <div className="flex-1 min-h-0 flex flex-col justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                  <span>A. IDENTITAS KELOMPOK PESERTA DIDIK</span>
                </h4>
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  Wajib Diisi Kelompok
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                {/* Nama Kelompok */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama / No. Kelompok:
                  </label>
                  <input 
                    type="text"
                    value={lkpdGroupName}
                    placeholder="Contoh: Kelompok 3 (Newton)"
                    onChange={(e) => setLkpdGroupName(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Ketua Kelompok */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Ketua Kelompok:
                  </label>
                  <input 
                    type="text"
                    value={lkpdGroupLeader}
                    placeholder="Nama ketua kelompok"
                    onChange={(e) => setLkpdGroupLeader(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Kelas / Fase */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Kelas &amp; Fase:
                  </label>
                  <input 
                    type="text"
                    value={lkpdClass}
                    placeholder="Contoh: X-1 · Fase E"
                    onChange={(e) => setLkpdClass(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Tanggal Praktikum */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tanggal Praktikum:
                  </label>
                  <input 
                    type="date"
                    value={lkpdDate}
                    onChange={(e) => setLkpdDate(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Guru Pembimbing Terintegrasi */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Guru Pembimbing:</span>
                    <button
                      type="button"
                      onClick={() => setIsTeacherModalOpen(true)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-0.5 no-print"
                      title="Ubah Nama Guru (Terintegrasi ke LKPD & Rapor)"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Ubah</span>
                    </button>
                  </label>
                  <div className="px-2.5 py-1.5 font-bold bg-slate-100 border border-slate-300 rounded-xl text-slate-900 truncate text-[11px]">
                    {teacherProfile.name}
                  </div>
                </div>
              </div>

              {/* Anggota Kelompok List Field */}
              <div className="flex-1 min-h-0 flex flex-col">
                <label className="font-bold text-slate-700 block mb-0.5 text-[11px] shrink-0">
                  Daftar Anggota Kelompok:
                </label>
                <textarea 
                  rows={3}
                  value={lkpdMembers}
                  placeholder="1. Nama Anggota 1&#10;2. Nama Anggota 2"
                  onChange={(e) => setLkpdMembers(e.target.value)}
                  className="w-full flex-1 min-h-[64px] p-2 font-mono text-[11px] font-semibold bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none leading-snug resize-none"
                />
              </div>
            </div>

            {/* Tujuan Praktikum & Alat Bahan */}
            <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-snug items-stretch">
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex flex-col justify-center">
                <h4 className="font-black text-sky-950 uppercase mb-1">B. TUJUAN PRAKTIKUM</h4>
                <ul className="space-y-0.5 text-slate-700 list-disc list-inside">
                  <li>Menyelidiki gerak kecepatan konstan (GLB).</li>
                  <li>Menganalisis percepatan, kecepatan &amp; waktu (GLBB).</li>
                  <li>Menginterpretasi grafik s-t dan v-t hasil eksperimen.</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col justify-center">
                <h4 className="font-black text-amber-950 uppercase mb-1">C. ALAT &amp; BAHAN VIRTUAL</h4>
                <ul className="space-y-0.5 text-slate-700 list-disc list-inside">
                  <li>Rel Udara Presisi Skala 100 Meter.</li>
                  <li>Kereta Dinamika &amp; Pita Ticker Timer Simulator.</li>
                  <li>Photogate Sensor Laser &amp; Stopwatch Digital.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* LKPD STEP 2: TABEL DATA DI LKPD TERPISAH DALAM 1 BARIS SEJAJAR (GLB, GLBB DIPERCEPAT & GLBB DIPERLAMBAT) */}
          <div className={`${lkpdStep === 1 ? 'flex-1 min-h-0 flex flex-col gap-2.5 animate-fadeIn' : 'hidden print:block print:space-y-3'}`}>
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 border-b pb-2 border-slate-200">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                  D. TABEL HASIL PENGAMATAN PERCOBAAN KELOMPOK
                </h4>
                <p className="text-[11px] font-medium text-slate-500">
                  Tabel GLB, GLBB Dipercepat, dan GLBB Diperlambat tampil sejajar dalam satu baris agar mudah dibandingkan langsung.
                </p>
              </div>

              {/* Sub-tab Filter Switcher (no-print) */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 no-print">
                <button
                  type="button"
                  onClick={() => setLkpdTableFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    lkpdTableFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Tabel (Sejajar)
                </button>
                <button
                  type="button"
                  onClick={() => setLkpdTableFilter('glb')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    lkpdTableFilter === 'glb'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tabel 1: GLB ({lkpdGlbRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLkpdTableFilter('glbb-accel')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    lkpdTableFilter === 'glbb-accel'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tabel 2: GLBB (+a) ({lkpdGlbbAccelRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLkpdTableFilter('glbb-decel')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    lkpdTableFilter === 'glbb-decel'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tabel 3: GLBB (-a) ({lkpdGlbbDecelRows.length})
                </button>
              </div>
            </div>

            {/* BARIS DERET 3 TABEL LKPD SEJAJAR (GLB, GLBB DIPERCEPAT, GLBB DIPERLAMBAT) */}
            <div className={`flex-1 min-h-0 grid grid-cols-1 ${
              lkpdTableFilter === 'all' ? 'lg:grid-cols-3' : ''
            } gap-2 items-stretch print:block print:space-y-4`}>

              {/* ============================================================== */}
              {/* TABEL 1: PERCOBAAN GLB (Gerak Lurus Beraturan)                 */}
              {/* ============================================================== */}
              <div className={`${lkpdTableFilter === 'all' || lkpdTableFilter === 'glb' ? 'flex flex-col h-full min-h-0' : 'hidden print:block'} space-y-1.5 p-2 rounded-xl bg-sky-50/70 border border-sky-200 print:bg-transparent print:border print:p-2`}>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-sky-600 text-white font-black text-[10px] shrink-0">
                      1
                    </span>
                    <div className="min-w-0">
                      <h5 className="text-[10px] font-black text-sky-950 uppercase tracking-tight truncate">
                        GLB (a = 0)
                      </h5>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 no-print shrink-0">
                    <button
                      onClick={handleClearLKPDGlbTable}
                      className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-rose-200 transition whitespace-nowrap"
                      title="Bersihkan isi Tabel 1 GLB"
                    >
                      <Trash2 className="h-2.5 w-2.5 text-rose-500" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-[140px] overflow-auto rounded-lg border border-sky-200 bg-white shadow-xs">
                  <table className="w-full text-left text-[10px]">
                    <thead className="sticky top-0 z-10 bg-sky-100 border-b border-sky-200 font-black text-sky-950">
                      <tr>
                        <th className="py-1 px-1">No</th>
                        <th className="py-1 px-1">t</th>
                        <th className="py-1 px-1">s</th>
                        <th className="py-1 px-1">v</th>
                        <th className="py-1 px-1">a</th>
                        <th className="py-1 px-1">s/t</th>
                        <th className="py-1 px-1 text-center no-print">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {lkpdGlbRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-3 text-center text-slate-400 font-sans italic">
                            Belum ada data GLB. Jalankan simulasi.
                          </td>
                        </tr>
                      ) : (
                        lkpdGlbRows.map((r, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-sky-50/30'}>
                            <td className="py-1 px-1 font-bold font-sans text-slate-700">#{r.no}</td>
                            <td className="py-1 px-1 font-bold text-sky-800">{r.t.toFixed(1)}</td>
                            <td className="py-1 px-1 font-bold text-emerald-800">{r.s.toFixed(1)}</td>
                            <td className="py-1 px-1 font-bold text-sky-700">{r.v.toFixed(1)}</td>
                            <td className="py-1 px-1 font-bold text-slate-500">{r.a.toFixed(1)}</td>
                            <td className="py-1 px-1 font-bold text-emerald-700">
                              {r.t > 0 ? (r.s / r.t).toFixed(1) : r.v.toFixed(1)}
                            </td>
                            <td className="py-1 px-1 text-center no-print">
                              <button
                                onClick={() => handleDeleteLKPDGlbRow(i)}
                                className="text-rose-600 hover:text-rose-800 p-0.5 rounded hover:bg-rose-50"
                                title="Hapus baris ini dari Tabel GLB"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ============================================================== */}
              {/* TABEL 2: PERCOBAAN GLBB DIPERCEPAT (+a)                        */}
              {/* ============================================================== */}
              <div className={`${lkpdTableFilter === 'all' || lkpdTableFilter === 'glbb-accel' ? 'flex flex-col h-full min-h-0' : 'hidden print:block'} space-y-1.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200 print:bg-transparent print:border print:p-2`}>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-600 text-white font-black text-[10px] shrink-0">
                      2
                    </span>
                    <div className="min-w-0">
                      <h5 className="text-[10px] font-black text-amber-950 uppercase tracking-tight truncate">
                        GLBB (+a)
                      </h5>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 no-print shrink-0">
                    <button
                      onClick={handleClearLKPDGlbbAccelTable}
                      className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-rose-200 transition whitespace-nowrap"
                      title="Bersihkan isi Tabel 2 GLBB Dipercepat"
                    >
                      <Trash2 className="h-2.5 w-2.5 text-rose-500" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-[140px] overflow-auto rounded-lg border border-amber-200 bg-white shadow-xs">
                  <table className="w-full text-left text-[10px]">
                    <thead className="sticky top-0 z-10 bg-amber-100 border-b border-amber-200 font-black text-amber-950">
                      <tr>
                        <th className="py-1 px-1">No</th>
                        <th className="py-1 px-1">t</th>
                        <th className="py-1 px-1">s</th>
                        <th className="py-1 px-1">v</th>
                        <th className="py-1 px-1">+a</th>
                        <th className="py-1 px-1 text-center no-print">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {lkpdGlbbAccelRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-slate-400 font-sans italic">
                            Belum ada data GLBB (+a). Jalankan simulasi.
                          </td>
                        </tr>
                      ) : (
                        lkpdGlbbAccelRows.map((r, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}>
                            <td className="py-1 px-1 font-bold font-sans text-slate-700">#{r.no}</td>
                            <td className="py-1 px-1 font-bold text-amber-800">{r.t.toFixed(1)}</td>
                            <td className="py-1 px-1 font-bold text-emerald-800">{r.s.toFixed(1)}</td>
                            <td className="py-1 px-1 font-bold text-amber-700">{r.v.toFixed(1)}</td>
                            <td className="py-1 px-1 font-bold text-purple-800">+{Math.abs(r.a).toFixed(1)}</td>
                            <td className="py-1 px-1 text-center no-print">
                              <button
                                onClick={() => handleDeleteLKPDGlbbAccelRow(i)}
                                className="text-rose-600 hover:text-rose-800 p-0.5 rounded hover:bg-rose-50"
                                title="Hapus baris ini dari Tabel GLBB Dipercepat"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ============================================================== */}
              {/* TABEL 3: PERCOBAAN GLBB DIPERLAMBAT (-a)                       */}
              {/* ============================================================== */}
              <div className={`${lkpdTableFilter === 'all' || lkpdTableFilter === 'glbb-decel' ? 'flex flex-col h-full min-h-0' : 'hidden print:block'} space-y-1.5 p-2 rounded-xl bg-rose-50/70 border border-rose-200 print:bg-transparent print:border print:p-2`}>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-600 text-white font-black text-[10px] shrink-0">
                      3
                    </span>
                    <div className="min-w-0">
                      <h5 className="text-[10px] font-black text-rose-950 uppercase tracking-tight truncate">
                        GLBB (-a)
                      </h5>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 no-print shrink-0">
                    <button
                      onClick={handleClearLKPDGlbbDecelTable}
                      className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-rose-200 transition whitespace-nowrap"
                      title="Bersihkan isi Tabel 3 GLBB Diperlambat"
                    >
                      <Trash2 className="h-2.5 w-2.5 text-rose-500" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-[200px] overflow-auto rounded-lg border border-rose-200 bg-white shadow-xs">
                  <table className="w-full text-left text-[10px]">
                    <thead className="sticky top-0 z-10 bg-rose-100 border-b border-rose-200 font-black text-rose-950">
                      <tr>
                        <th className="py-1 px-1">No</th>
                        <th className="py-1 px-1">t</th>
                        <th className="py-1 px-1">s</th>
                        <th className="py-1 px-1">v</th>
                        <th className="py-1 px-1">-a</th>
                        <th className="py-1 px-1 text-center no-print">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {lkpdGlbbDecelRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-slate-400 font-sans italic">
                            Belum ada data GLBB (-a). Jalankan simulasi.
                          </td>
                        </tr>
                      ) : (
                        lkpdGlbbDecelRows.map((r, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-rose-50/30'}>
                            <td className="py-1 px-1 font-bold font-sans text-slate-700">#{r.no}</td>
                            <td className="py-1 px-1 font-bold text-rose-800">{r.t.toFixed(1)}</td>
                            <td className="py-1 px-1 font-bold text-emerald-800">{r.s.toFixed(1)}</td>
                            <td className="py-1 px-1 font-bold text-rose-700">{r.v.toFixed(1)}</td>
                            <td className="py-1 px-1 font-bold text-purple-800">{r.a.toFixed(1)}</td>
                            <td className="py-1 px-1 text-center no-print">
                              <button
                                onClick={() => handleDeleteLKPDGlbbDecelRow(i)}
                                className="text-rose-600 hover:text-rose-800 p-0.5 rounded hover:bg-rose-50"
                                title="Hapus baris ini dari Tabel GLBB Diperlambat"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* LKPD STEP 3: GRAFIK HASIL PENGAMATAN TERPISAH (GLB, GLBB DIPERCEPAT & GLBB DIPERLAMBAT) */}
          <div className={`${lkpdStep === 2 ? 'flex-1 min-h-0 flex flex-col gap-2.5 animate-fadeIn' : 'hidden print:block print:space-y-3'}`}>
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b pb-1.5 border-slate-200">
              <div>
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>E. GRAFIK HASIL PENGAMATAN KELOMPOK</span>
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 no-print">
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLkpdGraphFilter('glb')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      lkpdGraphFilter === 'glb'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    GLB ({lkpdGlbRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLkpdGraphFilter('glbb-accel')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      lkpdGraphFilter === 'glbb-accel'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    GLBB +a ({lkpdGlbbAccelRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLkpdGraphFilter('glbb-decel')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      lkpdGraphFilter === 'glbb-decel'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    GLBB -a ({lkpdGlbbDecelRows.length})
                  </button>
                </div>
              </div>
            </div>

            {(() => {
              const padL = 52;
              const padR = 24;
              const padT = 22;
              const padB = 38;
              const plotW = 420 - padL - padR;
              const plotH = 240 - padT - padB;

              const renderMotionCharts = (
                rows: TelemetryRow[],
                strokeColor: string,
                emptyTitle: string,
                modeLabel: string
              ) => {
                const sorted = [...rows].sort((a, b) => a.t - b.t);
                if (sorted.length === 0) {
                  return (
                    <div className="flex-1 min-h-[140px] flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 bg-white/80 text-center space-y-2">
                      <p className="text-[11px] font-bold text-slate-700">{emptyTitle}</p>
                      <p className="text-[10px] text-slate-500 max-w-md mx-auto">
                        Pilih mode <strong>{modeLabel}</strong> pada panel simulasi di samping lalu tekan <strong>Jalankan Simulasi</strong> — grafik akan langsung terbentuk.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 no-print">
                        <button
                          type="button"
                          onClick={() => setLkpdStep(1)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold hover:bg-slate-200 transition whitespace-nowrap shrink-0"
                        >
                          <ChevronLeft className="h-3 w-3" />
                          <span>Ke Tabel Data LKPD</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                const maxT = Math.max(1, ...sorted.map((r) => r.t));
                const maxS = Math.max(10, ...sorted.map((r) => r.s));
                const maxV = Math.max(5, ...sorted.map((r) => r.v));

                const toX = (t: number) => padL + (t / maxT) * plotW;
                const toYs = (s: number) => padT + plotH - (Math.max(0, s) / maxS) * plotH;
                const toYv = (v: number) => padT + plotH - (Math.max(0, v) / maxV) * plotH;

                const initialV0 = sorted[0].t > 0
                  ? Math.max(0, sorted[0].v - sorted[0].a * sorted[0].t)
                  : sorted[0].v;

                const ptsSource = sorted[0].t > 0
                  ? [{ t: 0, s: 0, v: initialV0, a: sorted[0].a, no: 0, type: sorted[0].type }, ...sorted]
                  : sorted;

                const ptsST = ptsSource.map((r) => `${toX(r.t).toFixed(1)},${toYs(r.s).toFixed(1)}`).join(' ');
                const ptsVT = ptsSource.map((r) => `${toX(r.t).toFixed(1)},${toYv(r.v).toFixed(1)}`).join(' ');

                return (
                  <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-stretch">
                    {/* Grafik s - t */}
                    <div className="flex flex-col justify-between rounded-xl bg-white border border-slate-200 p-2.5 shadow-sm gap-1">
                      <div className="flex items-center justify-between shrink-0">
                        <h6 className="text-[11px] font-black text-slate-900">
                          Grafik Hubungan Jarak – Waktu (s – t)
                        </h6>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {sorted.length} titik
                        </span>
                      </div>
                      <svg viewBox="0 0 420 240" className="w-full flex-1 min-h-[115px] max-h-full" preserveAspectRatio="xMidYMid meet">
                        {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                          const gy = padT + plotH * (1 - frac);
                          const gx = padL + plotW * frac;
                          return (
                            <g key={idx}>
                              <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                              <line x1={gx} y1={padT} x2={gx} y2={padT + plotH} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                              <text x={padL - 6} y={gy + 3} textAnchor="end" fontSize="9" fill="#64748B" fontFamily="monospace">
                                {(maxS * frac).toFixed(0)}
                              </text>
                              <text x={gx} y={padT + plotH + 14} textAnchor="middle" fontSize="9" fill="#64748B" fontFamily="monospace">
                                {(maxT * frac).toFixed(1)}
                              </text>
                            </g>
                          );
                        })}
                        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#0F172A" strokeWidth="1.8" />
                        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#0F172A" strokeWidth="1.8" />
                        <text x={padL + plotW / 2} y={232} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0F172A">
                          Waktu t (s)
                        </text>
                        <text x={14} y={padT + plotH / 2} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0F172A" transform={`rotate(-90 14 ${padT + plotH / 2})`}>
                          Jarak s (m)
                        </text>
                        <polyline fill="none" stroke={strokeColor} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" points={ptsST} />
                        {sorted.map((r, i) => (
                          <circle key={`s-${i}`} cx={toX(r.t)} cy={toYs(r.s)} r="4" fill={strokeColor} stroke="#FFFFFF" strokeWidth="1.5">
                            <title>{`t=${r.t}s, s=${r.s}m`}</title>
                          </circle>
                        ))}
                      </svg>
                    </div>

                    {/* Grafik v - t */}
                    <div className="flex flex-col justify-between rounded-xl bg-white border border-slate-200 p-2.5 shadow-sm gap-1">
                      <div className="flex items-center justify-between shrink-0">
                        <h6 className="text-xs font-black text-slate-900">
                          Grafik Hubungan Kecepatan – Waktu (v – t)
                        </h6>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {sorted.length} titik
                        </span>
                      </div>
                      <svg viewBox="0 0 420 240" className="w-full flex-1 min-h-[160px] max-h-full" preserveAspectRatio="xMidYMid meet">
                        {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                          const gy = padT + plotH * (1 - frac);
                          const gx = padL + plotW * frac;
                          return (
                            <g key={idx}>
                              <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                              <line x1={gx} y1={padT} x2={gx} y2={padT + plotH} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                              <text x={padL - 6} y={gy + 3} textAnchor="end" fontSize="9" fill="#64748B" fontFamily="monospace">
                                {(maxV * frac).toFixed(1)}
                              </text>
                              <text x={gx} y={padT + plotH + 14} textAnchor="middle" fontSize="9" fill="#64748B" fontFamily="monospace">
                                {(maxT * frac).toFixed(1)}
                              </text>
                            </g>
                          );
                        })}
                        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#0F172A" strokeWidth="1.8" />
                        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#0F172A" strokeWidth="1.8" />
                        <text x={padL + plotW / 2} y={232} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0F172A">
                          Waktu t (s)
                        </text>
                        <text x={14} y={padT + plotH / 2} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0F172A" transform={`rotate(-90 14 ${padT + plotH / 2})`}>
                          Kecepatan v (m/s)
                        </text>
                        <polyline fill="none" stroke={strokeColor} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" points={ptsVT} />
                        {sorted.map((r, i) => (
                          <circle key={`v-${i}`} cx={toX(r.t)} cy={toYv(r.v)} r="4" fill={strokeColor} stroke="#FFFFFF" strokeWidth="1.5">
                            <title>{`t=${r.t}s, v=${r.v}m/s`}</title>
                          </circle>
                        ))}
                      </svg>
                    </div>
                  </div>
                );
              };

              return (
                <div className="flex-1 min-h-0 flex flex-col print:block print:space-y-5">
                  {/* BAGIAN 1: GRAFIK PERCOBAAN GLB */}
                  <div className={`${lkpdGraphFilter === 'glb' ? 'flex-1 min-h-0 flex flex-col' : 'hidden print:block'} gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-sky-50/60 border-2 border-sky-200 print:bg-transparent print:border print:p-2`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-600 text-white font-black text-xs">
                          1
                        </span>
                        <div>
                          <h5 className="text-xs font-black text-sky-950 uppercase tracking-tight">
                            Grafik 1: Kurva Percobaan GLB (Kecepatan Konstan, a = 0 m/s²)
                          </h5>
                          <span className="text-[10px] text-sky-800 font-medium">
                            {lkpdGlbRows.length > 0
                              ? `Kecepatan konstan v ≈ ${lkpdGlbRows[0].v.toFixed(2)} m/s • Grafik s–t linear & v–t mendatar`
                              : 'Menunggu data pengamatan GLB dari Tabel 1'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {renderMotionCharts(
                      lkpdGlbRows,
                      '#0284C7',
                      'Belum ada data pengamatan GLB pada Tabel 1 LKPD.',
                      'GLB'
                    )}
                  </div>

                  {/* BAGIAN 2: GRAFIK PERCOBAAN GLBB DIPERCEPAT */}
                  <div className={`${lkpdGraphFilter === 'glbb-accel' ? 'flex-1 min-h-0 flex flex-col' : 'hidden print:block'} gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-amber-50/60 border-2 border-amber-200 print:bg-transparent print:border print:p-2`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-600 text-white font-black text-xs">
                          2
                        </span>
                        <div>
                          <h5 className="text-xs font-black text-amber-950 uppercase tracking-tight">
                            Grafik 2: Kurva Percobaan GLBB Dipercepat (Percepatan +a &gt; 0 m/s²)
                          </h5>
                          <span className="text-[10px] text-amber-800 font-medium">
                            {lkpdGlbbAccelRows.length > 0
                              ? `Percepatan +${Math.abs(lkpdGlbbAccelRows[0].a).toFixed(2)} m/s² • Grafik s–t melengkung ke atas & v–t naik linear`
                              : 'Menunggu data pengamatan GLBB Dipercepat dari Tabel 2'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {renderMotionCharts(
                      lkpdGlbbAccelRows,
                      '#D97706',
                      'Belum ada data pengamatan GLBB Dipercepat pada Tabel 2 LKPD.',
                      'GLBB Dipercepat (+a)'
                    )}
                  </div>

                  {/* BAGIAN 3: GRAFIK PERCOBAAN GLBB DIPERLAMBAT */}
                  <div className={`${lkpdGraphFilter === 'glbb-decel' ? 'flex-1 min-h-0 flex flex-col' : 'hidden print:block'} gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-rose-50/60 border-2 border-rose-200 print:bg-transparent print:border print:p-2`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-600 text-white font-black text-xs">
                          3
                        </span>
                        <div>
                          <h5 className="text-xs font-black text-rose-950 uppercase tracking-tight">
                            Grafik 3: Kurva Percobaan GLBB Diperlambat (Perlambatan -a &lt; 0 m/s²)
                          </h5>
                          <span className="text-[10px] text-rose-800 font-medium">
                            {lkpdGlbbDecelRows.length > 0
                              ? `Perlambatan ${lkpdGlbbDecelRows[0].a.toFixed(2)} m/s² • Grafik s–t melandai & v–t turun linear menuju 0`
                              : 'Menunggu data pengamatan GLBB Diperlambat dari Tabel 3'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {renderMotionCharts(
                      lkpdGlbbDecelRows,
                      '#E11D48',
                      'Belum ada data pengamatan GLBB Diperlambat pada Tabel 3 LKPD.',
                      'GLBB Diperlambat (-a)'
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* LKPD STEP 4: PERTANYAAN ANALISIS & PEMBAHASAN */}
          <div className={`${lkpdStep === 3 ? 'flex-1 min-h-0 flex flex-col gap-2 animate-fadeIn' : 'hidden print:block print:space-y-2.5'}`}>
            <h4 className="shrink-0 text-[11px] font-black text-slate-900 uppercase">
              F. PERTANYAAN ANALISIS &amp; PEMBAHASAN KELOMPOK
            </h4>

            <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-rows-3 gap-2 items-stretch">
              {/* Q1 */}
              <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 border border-slate-200 gap-1">
                <label className="text-[11px] font-black text-slate-900 block shrink-0">
                  1. Hubungan waktu tempuh (t) dan jarak (s) pada GLB?
                </label>
                <textarea 
                  rows={2}
                  value={lkpdAns1}
                  placeholder="Tuliskan analisis hubungan t dan s pada GLB..."
                  onChange={(e) => setLkpdAns1(e.target.value)}
                  className="w-full flex-1 min-h-[52px] p-2 text-[11px] font-medium bg-white border border-slate-300 rounded-lg focus:border-emerald-500 outline-none leading-snug resize-none"
                />
              </div>

              {/* Q2 */}
              <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 border border-slate-200 gap-1">
                <label className="text-[11px] font-black text-slate-900 block shrink-0">
                  2. Perubahan kecepatan (v) terhadap waktu (t) pada GLBB?
                </label>
                <textarea 
                  rows={2}
                  value={lkpdAns2}
                  placeholder="Tuliskan analisis perubahan v pada GLBB (+a dan -a)..."
                  onChange={(e) => setLkpdAns2(e.target.value)}
                  className="w-full flex-1 min-h-[52px] p-2 text-[11px] font-medium bg-white border border-slate-300 rounded-lg focus:border-emerald-500 outline-none leading-snug resize-none"
                />
              </div>

              {/* Q3 */}
              <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 border border-slate-200 gap-1">
                <label className="text-[11px] font-black text-slate-900 block shrink-0">
                  3. Pola jarak titik pita ticker timer pada GLB vs GLBB?
                </label>
                <textarea 
                  rows={2}
                  value={lkpdAns4}
                  placeholder="Tuliskan pola kerapatan titik ketukan ticker timer..."
                  onChange={(e) => setLkpdAns4(e.target.value)}
                  className="w-full flex-1 min-h-[52px] p-2 text-[11px] font-medium bg-white border border-slate-300 rounded-lg focus:border-emerald-500 outline-none leading-snug resize-none"
                />
              </div>

              {/* Q4: Analisis Grafik GLB */}
              <div className="flex flex-col p-2.5 rounded-xl bg-sky-50/70 border border-sky-200 gap-1">
                <label className="text-[11px] font-black text-sky-950 block shrink-0">
                  4. Analisis Grafik GLB: Bentuk kurva s–t, v–t &amp; makna gradiennya?
                </label>
                <textarea 
                  rows={2}
                  value={lkpdAns5}
                  placeholder="Diskusikan bentuk kurva s–t & v–t hasil percobaan GLB..."
                  onChange={(e) => setLkpdAns5(e.target.value)}
                  className="w-full flex-1 min-h-[52px] p-2 text-[11px] font-medium bg-white border border-sky-300 rounded-lg focus:border-sky-600 outline-none leading-snug resize-none"
                />
              </div>

              {/* Q5: Analisis Grafik GLBB Dipercepat & Diperlambat */}
              <div className="sm:col-span-2 flex flex-col p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 gap-1">
                <label className="text-[11px] font-black text-amber-950 block shrink-0">
                  5. Analisis &amp; Pembahasan Grafik GLBB: Bandingkan kurva (+a) vs (-a) beserta penyebabnya!
                </label>
                <textarea 
                  rows={2}
                  value={lkpdAns6}
                  placeholder="Bandingkan bentuk grafik s–t & v–t GLBB Dipercepat vs Diperlambat..."
                  onChange={(e) => setLkpdAns6(e.target.value)}
                  className="w-full flex-1 min-h-[52px] p-2 text-[11px] font-medium bg-white border border-amber-300 rounded-lg focus:border-amber-600 outline-none leading-snug resize-none"
                />
              </div>
            </div>
          </div>

          {/* LKPD STEP 5: KESIMPULAN & LEMBAR PENGESAHAN */}
          <div className={`${lkpdStep === 4 ? 'flex-1 min-h-0 flex flex-col gap-2.5 animate-fadeIn' : 'hidden print:block print:space-y-2.5'}`}>
            <div className="flex-1 min-h-0 flex flex-col p-3 rounded-xl bg-emerald-50 border border-emerald-300 gap-1.5">
              <h4 className="shrink-0 text-[11px] font-black text-emerald-950 uppercase">
                G. KESIMPULAN HASIL PRAKTIKUM
              </h4>
              <textarea 
                rows={4}
                value={lkpdConclusion}
                placeholder="Tuliskan kesimpulan menyeluruh hasil praktikum penyelidikan kinematika GLB & GLBB kelompokmu di sini..."
                onChange={(e) => setLkpdConclusion(e.target.value)}
                className="w-full flex-1 min-h-[64px] p-2 text-[11px] font-medium bg-white border border-emerald-300 rounded-lg focus:border-emerald-600 outline-none leading-snug resize-none"
              />
            </div>

            {/* Signature & Assessment Boxes */}
            <div className="shrink-0 grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-[11px] text-center font-bold">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-600 mb-7">
                  Ketua Kelompok ({lkpdGroupName}),
                </p>
                <p className="border-t border-slate-400 pt-1 font-black text-slate-900">
                  ( {lkpdGroupLeader} )
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-7">
                  <p className="text-slate-600 text-center w-full">Guru Fisika Kelas X Fase E,</p>
                  {userRole === 'guru' && (
                    <button
                      type="button"
                      onClick={() => setIsTeacherModalOpen(true)}
                      className="text-indigo-600 hover:text-indigo-800 p-0.5 rounded no-print shrink-0"
                      title="Ubah Nama Guru Pengampu (Terintegrasi)"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="border-t border-slate-400 pt-1 font-black text-slate-900">
                  ( {teacherProfile.name || 'Dra. Hj. Siti Nurhaliza, M.Pd.'} )
                </p>
                {teacherProfile.nip && (
                  <p className="text-[10px] font-mono text-slate-500 font-normal">
                    NIP. {teacherProfile.nip}
                  </p>
                )}
              </div>
            </div>
          </div>

          </div>
        </div>
        </div>

        {/* Modal Pengaturan Guru Pengampu Terintegrasi */}
        <TeacherProfileModal
          isOpen={isTeacherModalOpen}
          onClose={() => setIsTeacherModalOpen(false)}
          onProfileUpdated={(p) => setTeacherProfile(p)}
        />

      </div>
    </section>
  );
};
