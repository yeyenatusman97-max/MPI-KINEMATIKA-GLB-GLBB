/**
 * PHYSICS MOTION LAB - Persistent Storage & Cloud Sync Manager
 * Autentikasi dikelola sepenuhnya oleh Firebase Authentication (tanpa menyimpan password).
 * Menyimpan progres belajar, hasil eksperimen, nilai quiz, rapor murid, dan LKPD.
 */

import {
  UserProgress,
  ExperimentRun,
  QuizResult,
  UserRole,
  SavedLKPDRecord,
  ActiveSession,
  StudentReportSync,
  StudentReflectionRecord,
} from '../types/physics';
import {
  sanitizeId,
  sanitizeNpsn,
  syncLKPDSubmissionToCloud,
  submitTeacherFeedbackToCloud,
  deleteLKPDFromCloud,
  deleteQuizResultFromCloud,
  deleteStudentReportFromCloud,
  syncQuizResultToCloud,
  syncStudentReportToCloud,
  syncStudentReflectionToCloud,
  deleteStudentReflectionFromCloud,
} from '../services/firebaseService';

const KEYS = {
  USER_ROLE: 'motionlab_role',
  PROGRESS: 'motionlab_user_progress',
  EXPERIMENTS: 'motionlab_experiments_history',
  QUIZ_RESULTS: 'motionlab_quiz_results',
  STUDENT_CLASS_RECORDS: 'motionlab_teacher_class_records',
  SAVED_VIDEOS: 'motionlab_custom_videos',
  BOOKMARKS: 'motionlab_module_bookmarks',
  SETTINGS: 'motionlab_app_settings',
  SAVED_LKPD: 'motionlab_saved_lkpd_records',
  TEACHER_PROFILE: 'motionlab_teacher_profile',
  ACTIVE_SESSION: 'motionlab_active_session',
  LAST_MURID_NPSN: 'motionlab_last_murid_npsn',
  LAST_GURU_NPSN: 'motionlab_last_guru_npsn',
  SCHOOL_STUDENT_REPORTS: 'motionlab_school_student_reports',
  STUDENT_REFLECTIONS: 'motionlab_student_reflections',
  CLEAN_STATE_V2: 'motionlab_clean_school_sync_v2',
};

function ensureCleanSchoolSyncState() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('motionlab_registered_accounts');
    if (!localStorage.getItem(KEYS.CLEAN_STATE_V2)) {
      localStorage.removeItem(KEYS.SCHOOL_STUDENT_REPORTS);
      localStorage.removeItem(KEYS.QUIZ_RESULTS);
      localStorage.removeItem(KEYS.SAVED_LKPD);
      localStorage.removeItem(KEYS.STUDENT_CLASS_RECORDS);
      localStorage.setItem(KEYS.CLEAN_STATE_V2, '1');
    }
  } catch {}
}

ensureCleanSchoolSyncState();

export interface TeacherProfile {
  accountId?: string;
  email?: string;
  name: string;
  nip: string;
  school: string;
  subject: string;
  npsn?: string;
}

export const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  name: 'Dra. Hj. Siti Nurhaliza, M.Pd.',
  nip: '19780514 200312 2 001',
  school: 'SMA Negeri 1 Fisika Merdeka',
  subject: 'Fisika Fase E (Kelas X)',
};

const DEFAULT_PROGRESS: UserProgress = {
  studentName: 'Murid Fisika Merdeka',
  studentId: 'X-E-01',
  schoolName: 'SMA Negeri Laboratorium Digital',
  modulesCompleted: [],
  videosWatched: [],
  experimentsCount: 0,
  lastQuizScore: 0,
  badges: ['NEWBIE_PHYSICIST', 'GALILEO_APPRENTICE'],
  level: 2,
  xp: 340,
  streakDays: 4,
  selectedCharacter: 'galileo',
};

let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('mpi_fisika_school_sync');
    syncChannel.onmessage = () => {
      try {
        window.dispatchEvent(new CustomEvent('mpi-sync-updated'));
      } catch {}
    };
  } catch {}
}

function broadcastSyncEvent() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('mpi-sync-updated'));
  } catch {}
  try {
    syncChannel?.postMessage({ type: 'sync', ts: Date.now() });
  } catch {}
}

export const storage = {
  // =========================================================================
  // SESSION MANAGEMENT (NO PASSWORD STORAGE - FIREBASE AUTH ONLY)
  // =========================================================================
  getLastNpsn(role: UserRole): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(role === 'guru' ? KEYS.LAST_GURU_NPSN : KEYS.LAST_MURID_NPSN) || '';
  },

  getActiveSession(): ActiveSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(KEYS.ACTIVE_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setActiveSession(session: ActiveSession | null) {
    if (typeof window === 'undefined') return;
    if (!session) {
      localStorage.removeItem(KEYS.ACTIVE_SESSION);
      broadcastSyncEvent();
      return;
    }
    const cleanSession: ActiveSession = {
      accountId: session.accountId,
      role: session.role,
      npsn: session.npsn,
      className: session.className,
      displayName: session.displayName,
      email: session.email,
      loggedInAt: session.loggedInAt,
    };
    localStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(cleanSession));
    this.setRole(cleanSession.role);
    if (cleanSession.role === 'guru') {
      localStorage.setItem(KEYS.LAST_GURU_NPSN, cleanSession.npsn);
      const currentTP = this.getTeacherProfile();
      const isSameTeacher = Boolean(
        currentTP.accountId && currentTP.accountId === cleanSession.accountId
      );
      const safeSchool =
        isSameTeacher && currentTP.school && !currentTP.school.startsWith('Sekolah NPSN')
          ? currentTP.school
          : 'SMA Negeri Laboratorium Digital';
      this.saveTeacherProfile({
        accountId: cleanSession.accountId,
        email: cleanSession.email || (isSameTeacher ? currentTP.email : ''),
        name: cleanSession.displayName || (isSameTeacher ? currentTP.name : 'Guru Pengampu'),
        nip: isSameTeacher ? currentTP.nip : '',
        school: safeSchool,
        subject: isSameTeacher ? currentTP.subject : DEFAULT_TEACHER_PROFILE.subject,
        npsn: cleanSession.npsn,
      });
    } else {
      localStorage.setItem(KEYS.LAST_MURID_NPSN, cleanSession.npsn);
      this.saveProgress({
        studentName: cleanSession.displayName,
        studentId: cleanSession.className,
        schoolName: 'SMA Negeri Laboratorium Digital',
      });
    }
    broadcastSyncEvent();
  },

  logout() {
    this.setActiveSession(null);
  },

  // =========================================================================
  // PROFILE, ROLE & PROGRESS
  // =========================================================================
  getTeacherProfile(): TeacherProfile {
    if (typeof window === 'undefined') return DEFAULT_TEACHER_PROFILE;
    try {
      const data = localStorage.getItem(KEYS.TEACHER_PROFILE);
      if (!data) return DEFAULT_TEACHER_PROFILE;
      const parsed = JSON.parse(data);
      if (parsed.subject === 'Fisika Fase F (Kelas XI)') {
        parsed.subject = DEFAULT_TEACHER_PROFILE.subject;
      }
      return { ...DEFAULT_TEACHER_PROFILE, ...parsed };
    } catch {
      return DEFAULT_TEACHER_PROFILE;
    }
  },

  saveTeacherProfile(profile: Partial<TeacherProfile>): TeacherProfile {
    if (typeof window === 'undefined') return DEFAULT_TEACHER_PROFILE;
    const current = this.getTeacherProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(KEYS.TEACHER_PROFILE, JSON.stringify(updated));

    const active = this.getActiveSession();
    if (active && active.role === 'guru' && updated.name?.trim() && updated.name.trim() !== active.displayName) {
      const nextSession: ActiveSession = {
        ...active,
        displayName: updated.name.trim(),
      };
      localStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(nextSession));
    }

    try {
      window.dispatchEvent(new CustomEvent('teacher-profile-updated', { detail: updated }));
      window.dispatchEvent(new CustomEvent('mpi-sync-updated'));
    } catch {}
    return updated;
  },

  getRole(): UserRole {
    if (typeof window === 'undefined') return 'murid';
    return (localStorage.getItem(KEYS.USER_ROLE) as UserRole) || 'murid';
  },

  setRole(role: UserRole) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.USER_ROLE, role);
  },

  getProgress(): UserProgress {
    if (typeof window === 'undefined') return DEFAULT_PROGRESS;
    try {
      const data = localStorage.getItem(KEYS.PROGRESS);
      if (!data) return DEFAULT_PROGRESS;
      const parsed = JSON.parse(data);
      if (parsed.studentId === 'XI-F-01') {
        parsed.studentId = DEFAULT_PROGRESS.studentId;
      }
      return {
        ...DEFAULT_PROGRESS,
        ...parsed,
      };
    } catch {
      return DEFAULT_PROGRESS;
    }
  },

  addXP(amount: number): { newXP: number; newLevel: number; leveledUp: boolean } {
    const current = this.getProgress();
    const totalXP = (current.xp || 0) + amount;
    const newLevel = Math.max(1, Math.floor(totalXP / 500) + 1);
    const leveledUp = newLevel > (current.level || 1);
    this.saveProgress({
      xp: totalXP,
      level: newLevel,
    });
    return { newXP: totalXP, newLevel, leveledUp };
  },

  saveProgress(progress: Partial<UserProgress>) {
    if (typeof window === 'undefined') return;
    const current = this.getProgress();
    const updated = { ...current, ...progress };
    localStorage.setItem(KEYS.PROGRESS, JSON.stringify(updated));
    const session = this.getActiveSession();
    if (session && session.role === 'murid') {
      this.syncCurrentStudentReport(session, updated);
    }
  },

  getSchoolStudentReports(npsnFilter?: string): StudentReportSync[] {
    if (typeof window === 'undefined') return [];
    ensureCleanSchoolSyncState();
    try {
      const raw = localStorage.getItem(KEYS.SCHOOL_STUDENT_REPORTS);
      const parsed: StudentReportSync[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      const validStudents = parsed.filter(
        (r) =>
          r &&
          Boolean(r.accountId) &&
          !String(r.accountId).startsWith('guru_') &&
          Boolean(r.npsn)
      );
      if (npsnFilter) {
        return validStudents.filter((r) => r.npsn === sanitizeNpsn(npsnFilter));
      }
      return validStudents;
    } catch {
      return [];
    }
  },

  mergeCloudStudentReports(reports: StudentReportSync[]) {
    if (typeof window === 'undefined' || !Array.isArray(reports)) return;
    ensureCleanSchoolSyncState();
    const existing = this.getSchoolStudentReports();
    const map = new Map<string, StudentReportSync>();
    existing.forEach((r) => map.set(`${r.npsn}_${r.accountId}`, r));
    reports
      .filter((r) => r && r.accountId && !String(r.accountId).startsWith('guru_') && r.npsn)
      .forEach((r) => map.set(`${r.npsn}_${r.accountId}`, r));
    localStorage.setItem(KEYS.SCHOOL_STUDENT_REPORTS, JSON.stringify(Array.from(map.values())));
    broadcastSyncEvent();
  },

  syncCurrentStudentReport(session: ActiveSession, progOverride?: UserProgress) {
    if (typeof window === 'undefined' || session.role !== 'murid') return;
    const prog = progOverride || this.getProgress();
    const npsn = sanitizeNpsn(session.npsn);
    const lkpds = this.getSavedLKPDs({ npsn, studentAccountId: session.accountId });
    const quizzes = this.getQuizResults({ npsn, studentAccountId: session.accountId });
    const bestOrLatestScore = quizzes.length > 0 ? quizzes[0].score : prog.lastQuizScore || 0;

    const report: StudentReportSync = {
      accountId: session.accountId,
      npsn,
      studentName: session.displayName || prog.studentName || `Murid ${session.className}`,
      className: session.className || prog.studentId || 'Kelas X Fase E',
      schoolName: prog.schoolName || `Sekolah NPSN ${npsn}`,
      xp: prog.xp || 0,
      level: prog.level || 1,
      lastQuizScore: bestOrLatestScore,
      experimentsCount: prog.experimentsCount || 0,
      lkpdSubmittedCount: lkpds.length,
      badges: prog.badges || [],
      updatedAt: new Date().toISOString(),
    };

    const all = this.getSchoolStudentReports();
    const idx = all.findIndex((r) => r.accountId === report.accountId && r.npsn === report.npsn);
    const next = idx >= 0 ? all.map((r, i) => (i === idx ? report : r)) : [report, ...all];
    localStorage.setItem(KEYS.SCHOOL_STUDENT_REPORTS, JSON.stringify(next));
    broadcastSyncEvent();

    syncStudentReportToCloud(report, session).catch((err) => {
      console.warn('Cloud sync studentReport skipped/deferred:', err);
    });
  },

  getExperiments(): ExperimentRun[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(KEYS.EXPERIMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveExperiment(run: ExperimentRun) {
    if (typeof window === 'undefined') return;
    const history = this.getExperiments();
    const updated = [run, ...history].slice(0, 30);
    localStorage.setItem(KEYS.EXPERIMENTS, JSON.stringify(updated));

    const prog = this.getProgress();
    const badges = [...prog.badges];
    if (updated.length >= 1 && !badges.includes('LAB_FIRST_STEP')) {
      badges.push('LAB_FIRST_STEP');
    }
    if (updated.length >= 5 && !badges.includes('JUNIOR_RESEARCHER')) {
      badges.push('JUNIOR_RESEARCHER');
    }
    this.saveProgress({
      experimentsCount: (prog.experimentsCount || 0) + 1,
      badges,
    });
  },

  clearExperiments() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.EXPERIMENTS);
  },

  // =========================================================================
  // QUIZ RESULTS (SCOPED & AUTO-SYNCED TO TEACHER VIA NPSN)
  // =========================================================================
  getQuizResults(filter?: { npsn?: string; studentAccountId?: string }): QuizResult[] {
    if (typeof window === 'undefined') return [];
    ensureCleanSchoolSyncState();
    try {
      const data = localStorage.getItem(KEYS.QUIZ_RESULTS);
      const parsed: QuizResult[] = data ? JSON.parse(data) : [];
      if (!Array.isArray(parsed)) return [];
      if (!filter) return parsed;
      return parsed.filter((r) => {
        if (filter.npsn) {
          if (!r.npsn || r.npsn !== sanitizeNpsn(filter.npsn)) return false;
          if (!r.studentAccountId || String(r.studentAccountId).startsWith('guru_')) return false;
        }
        if (filter.studentAccountId && r.studentAccountId !== filter.studentAccountId) {
          return false;
        }
        return true;
      });
    } catch {
      return [];
    }
  },

  mergeCloudQuizResults(results: QuizResult[]) {
    if (typeof window === 'undefined' || !Array.isArray(results)) return;
    ensureCleanSchoolSyncState();
    const current = this.getQuizResults();
    const map = new Map<string, QuizResult>();
    current.forEach((r) => map.set(r.id, r));
    results
      .filter((r) => r && r.npsn && r.studentAccountId && !String(r.studentAccountId).startsWith('guru_'))
      .forEach((r) => map.set(r.id, r));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(merged.slice(0, 100)));
    broadcastSyncEvent();
  },

  clearQuizResults() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.QUIZ_RESULTS);
    this.saveProgress({ lastQuizScore: 0 });
  },

  deleteQuizResult(id: string, npsnOverride?: string) {
    if (typeof window === 'undefined') return;
    const current = this.getQuizResults();
    const target = current.find((r) => r.id === id);
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(updated));

    // Recalculate lastQuizScore on studentReport if this student still exists
    const targetNpsn = npsnOverride || target?.npsn || this.getActiveSession()?.npsn || '';
    if (target?.studentAccountId && targetNpsn) {
      const remainingForStudent = updated.filter(
        (r) => r.npsn === sanitizeNpsn(targetNpsn) && r.studentAccountId === target.studentAccountId
      );
      const nextScore = remainingForStudent.length > 0 ? remainingForStudent[0].score : 0;
      const reports = this.getSchoolStudentReports();
      const updatedReports = reports.map((rep) =>
        rep.accountId === target.studentAccountId && rep.npsn === sanitizeNpsn(targetNpsn)
          ? { ...rep, lastQuizScore: nextScore }
          : rep
      );
      localStorage.setItem(KEYS.SCHOOL_STUDENT_REPORTS, JSON.stringify(updatedReports));
    }

    if (targetNpsn) {
      deleteQuizResultFromCloud(targetNpsn, id).catch(() => {});
    }
    broadcastSyncEvent();
  },

  deleteStudentReport(accountId: string, npsnOverride?: string) {
    if (typeof window === 'undefined') return;
    const targetNpsn = sanitizeNpsn(npsnOverride || this.getActiveSession()?.npsn || '');

    const reports = this.getSchoolStudentReports();
    const nextReports = reports.filter(
      (r) => !(r.accountId === accountId && (!targetNpsn || r.npsn === targetNpsn))
    );
    localStorage.setItem(KEYS.SCHOOL_STUDENT_REPORTS, JSON.stringify(nextReports));

    // Also remove that student's quiz results from Submenu 1
    const quizzes = this.getQuizResults();
    const removedQuizzes = quizzes.filter(
      (q) => q.studentAccountId === accountId && (!targetNpsn || q.npsn === targetNpsn)
    );
    const nextQuizzes = quizzes.filter(
      (q) => !(q.studentAccountId === accountId && (!targetNpsn || q.npsn === targetNpsn))
    );
    localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(nextQuizzes));

    if (targetNpsn) {
      deleteStudentReportFromCloud(targetNpsn, accountId).catch(() => {});
      removedQuizzes.forEach((q) => {
        deleteQuizResultFromCloud(targetNpsn, q.id).catch(() => {});
      });
    }
    broadcastSyncEvent();
  },

  clearSchoolQuizData(npsnRaw: string) {
    if (typeof window === 'undefined' || !npsnRaw) return;
    const npsn = sanitizeNpsn(npsnRaw);

    const quizzes = this.getQuizResults();
    const removedQuizzes = quizzes.filter((q) => q.npsn === npsn);
    const keptQuizzes = quizzes.filter((q) => q.npsn !== npsn);
    localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(keptQuizzes));

    const reports = this.getSchoolStudentReports();
    const removedReports = reports.filter((r) => r.npsn === npsn);
    const keptReports = reports.filter((r) => r.npsn !== npsn);
    localStorage.setItem(KEYS.SCHOOL_STUDENT_REPORTS, JSON.stringify(keptReports));

    removedQuizzes.forEach((q) => {
      deleteQuizResultFromCloud(npsn, q.id).catch(() => {});
    });
    removedReports.forEach((r) => {
      deleteStudentReportFromCloud(npsn, r.accountId).catch(() => {});
    });
    broadcastSyncEvent();
  },

  saveQuizResult(res: QuizResult) {
    if (typeof window === 'undefined') return;
    const session = this.getActiveSession();
    const isMuridSession = session?.role === 'murid';

    // Only sync into school student records if a murid is actively logged in
    const enriched: QuizResult = isMuridSession
      ? {
          ...res,
          npsn: res.npsn || session.npsn,
          studentAccountId: res.studentAccountId || session.accountId,
          studentName: res.studentName || session.displayName || this.getProgress().studentName,
          className: res.className || session.className || this.getProgress().studentId,
        }
      : {
          ...res,
          npsn: '',
          studentAccountId: '',
        };

    const current = this.getQuizResults();
    const updated = [enriched, ...current].slice(0, 100);
    localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(updated));

    const prog = this.getProgress();
    const badges = [...prog.badges];
    if (enriched.score >= 80 && !badges.includes('PHYSICS_MASTER')) {
      badges.push('PHYSICS_MASTER');
    }
    if (enriched.score === 100 && !badges.includes('PERFECT_SCORE')) {
      badges.push('PERFECT_SCORE');
    }

    this.saveProgress({
      lastQuizScore: enriched.score,
      badges,
    });

    if (isMuridSession && session) {
      syncQuizResultToCloud(enriched, session).catch((err) => {
        console.warn('Cloud sync quizResult skipped/deferred:', err);
      });
      this.syncCurrentStudentReport(session);
    }
    broadcastSyncEvent();
  },

  getTeacherClassRecords(): {
    id: string;
    name: string;
    nis: string;
    glbScore: number;
    glbbScore: number;
    pretest: number;
    posttest: number;
    labActivities: number;
    status: 'TUNTAS' | 'PERLU REMEDIAL';
  }[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(KEYS.STUDENT_CLASS_RECORDS);
      if (saved) return JSON.parse(saved);
    } catch {}

    const initialRoster = [
      { id: '1', name: 'Ahmad Fauzan', nis: '20241101', glbScore: 90, glbbScore: 85, pretest: 55, posttest: 92, labActivities: 6, status: 'TUNTAS' as const },
      { id: '2', name: 'Bella Rahmadani', nis: '20241102', glbScore: 88, glbbScore: 92, pretest: 60, posttest: 95, labActivities: 8, status: 'TUNTAS' as const },
      { id: '3', name: 'Christian Pratama', nis: '20241103', glbScore: 78, glbbScore: 75, pretest: 45, posttest: 82, labActivities: 4, status: 'TUNTAS' as const },
      { id: '4', name: 'Dewi Lestari', nis: '20241104', glbScore: 95, glbbScore: 90, pretest: 65, posttest: 96, labActivities: 9, status: 'TUNTAS' as const },
      { id: '5', name: 'Eko Wahyudi', nis: '20241105', glbScore: 70, glbbScore: 68, pretest: 40, posttest: 74, labActivities: 3, status: 'TUNTAS' as const },
      { id: '6', name: 'Farhan Maulana', nis: '20241106', glbScore: 62, glbbScore: 60, pretest: 35, posttest: 68, labActivities: 2, status: 'PERLU REMEDIAL' as const },
      { id: '7', name: 'Gita Safitri', nis: '20241107', glbScore: 85, glbbScore: 88, pretest: 50, posttest: 89, labActivities: 5, status: 'TUNTAS' as const },
      { id: '8', name: 'Hafiz Al-Banna', nis: '20241108', glbScore: 92, glbbScore: 86, pretest: 58, posttest: 91, labActivities: 7, status: 'TUNTAS' as const },
    ];
    this.saveTeacherClassRecords(initialRoster);
    return initialRoster;
  },

  saveTeacherClassRecords(records: any[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.STUDENT_CLASS_RECORDS, JSON.stringify(records));
  },

  getBookmarks(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleBookmark(topicId: string): boolean {
    const marks = this.getBookmarks();
    const idx = marks.indexOf(topicId);
    let isNowBookmarked = false;
    if (idx >= 0) {
      marks.splice(idx, 1);
      isNowBookmarked = false;
    } else {
      marks.push(topicId);
      isNowBookmarked = true;
    }
    localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(marks));
    return isNowBookmarked;
  },

  // =========================================================================
  // LKPD COLLECTION & TWO-WAY FEEDBACK (MURID KUMPULKAN <-> GURU UMPAN BALIK)
  // =========================================================================
  getSavedLKPDs(filter?: { npsn?: string; studentAccountId?: string }): SavedLKPDRecord[] {
    if (typeof window === 'undefined') return [];
    ensureCleanSchoolSyncState();
    try {
      const data = localStorage.getItem(KEYS.SAVED_LKPD);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      const clean = parsed.filter((r: any) => r && r.id !== 'sample-lkpd-1') as SavedLKPDRecord[];
      if (!filter) return clean;
      return clean.filter((r) => {
        if (filter.npsn) {
          if (!r.npsn || r.npsn !== sanitizeNpsn(filter.npsn)) return false;
          if (!r.studentAccountId || String(r.studentAccountId).startsWith('guru_')) return false;
        }
        if (filter.studentAccountId && r.studentAccountId !== filter.studentAccountId) return false;
        return true;
      });
    } catch {
      return [];
    }
  },

  mergeCloudLKPDs(records: SavedLKPDRecord[]) {
    if (typeof window === 'undefined' || !Array.isArray(records)) return;
    ensureCleanSchoolSyncState();
    const current = this.getSavedLKPDs();
    const map = new Map<string, SavedLKPDRecord>();
    current.forEach((r) => map.set(r.id, r));
    records
      .filter((r) => r && r.npsn && r.studentAccountId && !String(r.studentAccountId).startsWith('guru_'))
      .forEach((r) => map.set(r.id, r));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    localStorage.setItem(KEYS.SAVED_LKPD, JSON.stringify(merged.slice(0, 100)));
    broadcastSyncEvent();
  },

  saveLKPD(record: SavedLKPDRecord): SavedLKPDRecord {
    if (typeof window === 'undefined') return record;
    const session = this.getActiveSession();
    const isMuridSession = session?.role === 'murid';
    const current = this.getSavedLKPDs();
    const existingIdx = current.findIndex((r) => r.id === record.id);
    const existingRec = existingIdx >= 0 ? current[existingIdx] : undefined;

    const enriched: SavedLKPDRecord = {
      ...record,
      npsn: isMuridSession ? record.npsn || session.npsn : '',
      studentAccountId: isMuridSession ? record.studentAccountId || session.accountId : '',
      status: record.status || 'submitted',
      feedbackStatus: existingRec?.feedbackStatus || record.feedbackStatus || 'pending',
      teacherFeedback: existingRec?.teacherFeedback ?? record.teacherFeedback ?? '',
      feedbackBy: existingRec?.feedbackBy ?? record.feedbackBy ?? '',
      feedbackByUid: existingRec?.feedbackByUid ?? record.feedbackByUid ?? '',
      feedbackAt: existingRec?.feedbackAt ?? record.feedbackAt ?? '',
    };

    let updated: SavedLKPDRecord[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = enriched;
    } else {
      updated = [enriched, ...current].slice(0, 100);
    }
    localStorage.setItem(KEYS.SAVED_LKPD, JSON.stringify(updated));

    if (isMuridSession && session) {
      syncLKPDSubmissionToCloud(enriched, session).catch((err) => {
        console.warn('Cloud sync LKPD skipped/deferred:', err);
      });
      this.syncCurrentStudentReport(session);
    }
    broadcastSyncEvent();
    return enriched;
  },

  saveLKPDFeedback(
    submissionId: string,
    teacherFeedback: string,
    teacherName: string,
    npsnOverride?: string
  ): SavedLKPDRecord | null {
    if (typeof window === 'undefined') return null;
    const current = this.getSavedLKPDs();
    const idx = current.findIndex((r) => r.id === submissionId);
    if (idx < 0) return null;

    const nowIso = new Date().toISOString();
    const updatedRec: SavedLKPDRecord = {
      ...current[idx],
      teacherFeedback: teacherFeedback.trim(),
      feedbackBy: teacherName.trim() || this.getTeacherProfile().name,
      feedbackAt: nowIso,
      feedbackStatus: 'reviewed',
    };

    const nextList = [...current];
    nextList[idx] = updatedRec;
    localStorage.setItem(KEYS.SAVED_LKPD, JSON.stringify(nextList));

    const targetNpsn = npsnOverride || updatedRec.npsn || this.getActiveSession()?.npsn || '';
    if (targetNpsn) {
      submitTeacherFeedbackToCloud(targetNpsn, submissionId, updatedRec.teacherFeedback || '', updatedRec.feedbackBy || 'Guru').catch((err) => {
        console.warn('Cloud sync feedback skipped/deferred:', err);
      });
    }
    broadcastSyncEvent();
    return updatedRec;
  },

  deleteLKPD(id: string) {
    if (typeof window === 'undefined') return;
    const current = this.getSavedLKPDs();
    const target = current.find((r) => r.id === id);
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(KEYS.SAVED_LKPD, JSON.stringify(updated));
    const npsn = target?.npsn || this.getActiveSession()?.npsn || '';
    if (npsn) {
      deleteLKPDFromCloud(npsn, id).catch(() => {});
    }
    broadcastSyncEvent();
  },

  clearSchoolLKPDData(npsnRaw: string) {
    if (typeof window === 'undefined' || !npsnRaw) return;
    const npsn = sanitizeNpsn(npsnRaw);
    const current = this.getSavedLKPDs();
    const removed = current.filter((r) => r.npsn === npsn);
    const kept = current.filter((r) => r.npsn !== npsn);
    localStorage.setItem(KEYS.SAVED_LKPD, JSON.stringify(kept));

    const reports = this.getSchoolStudentReports();
    const updatedReports = reports.map((rep) =>
      rep.npsn === npsn ? { ...rep, lkpdSubmittedCount: 0 } : rep
    );
    localStorage.setItem(KEYS.SCHOOL_STUDENT_REPORTS, JSON.stringify(updatedReports));

    removed.forEach((rec) => {
      deleteLKPDFromCloud(npsn, rec.id).catch(() => {});
    });
    broadcastSyncEvent();
  },

  // =========================================================================
  // STUDENT REFLECTION COLLECTION (MURID KUMPULKAN <-> GURU HASIL REFLEKSI)
  // =========================================================================
  getReflections(filter?: { npsn?: string; studentAccountId?: string }): StudentReflectionRecord[] {
    if (typeof window === 'undefined') return [];
    ensureCleanSchoolSyncState();
    try {
      const raw = localStorage.getItem(KEYS.STUDENT_REFLECTIONS);
      const parsed: StudentReflectionRecord[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      const sorted = [...parsed].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      if (!filter) return sorted;
      return sorted.filter((r) => {
        if (filter.npsn && sanitizeNpsn(r.npsn || '') !== sanitizeNpsn(filter.npsn)) {
          return false;
        }
        if (filter.studentAccountId && r.studentAccountId !== filter.studentAccountId) {
          return false;
        }
        return true;
      });
    } catch {
      return [];
    }
  },

  mergeCloudReflections(records: StudentReflectionRecord[]) {
    if (typeof window === 'undefined' || !Array.isArray(records)) return;
    ensureCleanSchoolSyncState();
    const current = this.getReflections();
    const map = new Map<string, StudentReflectionRecord>();
    current.forEach((r) => map.set(r.id, r));
    records
      .filter((r) => r && r.id && r.npsn)
      .forEach((r) => map.set(r.id, r));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    localStorage.setItem(KEYS.STUDENT_REFLECTIONS, JSON.stringify(merged.slice(0, 200)));
    broadcastSyncEvent();
  },

  saveReflection(
    record: Omit<StudentReflectionRecord, 'npsn' | 'studentAccountId' | 'studentName' | 'className'> & {
      npsn?: string;
      studentAccountId?: string;
      studentName?: string;
      className?: string;
    }
  ): StudentReflectionRecord {
    const session = this.getActiveSession();
    const prog = this.getProgress();
    const npsn = sanitizeNpsn(record.npsn || session?.npsn || '10000001');
    const studentAccountId =
      record.studentAccountId || session?.accountId || sanitizeId(`murid_${npsn}_local`);
    const studentName =
      record.studentName || session?.displayName || prog.studentName || 'Murid';
    const className =
      record.className || session?.className || prog.studentId || 'Kelas X Fase E';

    const enriched: StudentReflectionRecord = {
      ...record,
      id: sanitizeId(record.id, `refl_${Date.now()}`),
      npsn,
      studentAccountId,
      studentName,
      className,
    };

    if (typeof window !== 'undefined') {
      const current = this.getReflections();
      const idx = current.findIndex((r) => r.id === enriched.id);
      const updated =
        idx >= 0
          ? current.map((r, i) => (i === idx ? enriched : r))
          : [enriched, ...current].slice(0, 200);
      localStorage.setItem(KEYS.STUDENT_REFLECTIONS, JSON.stringify(updated));
      broadcastSyncEvent();
    }

    if (session) {
      syncStudentReflectionToCloud(enriched, session).catch((err) => {
        console.warn('Cloud sync reflection skipped/deferred:', err);
      });
    }
    return enriched;
  },

  deleteReflection(id: string, npsnOverride?: string) {
    if (typeof window === 'undefined') return;
    const current = this.getReflections();
    const target = current.find((r) => r.id === id);
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(KEYS.STUDENT_REFLECTIONS, JSON.stringify(updated));

    const targetNpsn = npsnOverride || target?.npsn || this.getActiveSession()?.npsn || '';
    if (targetNpsn) {
      deleteStudentReflectionFromCloud(targetNpsn, id).catch(() => {});
    }
    broadcastSyncEvent();
  },

  clearSchoolReflections(npsnRaw: string) {
    if (typeof window === 'undefined' || !npsnRaw) return;
    const npsn = sanitizeNpsn(npsnRaw);
    const current = this.getReflections();
    const removed = current.filter((r) => sanitizeNpsn(r.npsn) === npsn);
    const kept = current.filter((r) => sanitizeNpsn(r.npsn) !== npsn);
    localStorage.setItem(KEYS.STUDENT_REFLECTIONS, JSON.stringify(kept));
    removed.forEach((r) => {
      deleteStudentReflectionFromCloud(npsn, r.id).catch(() => {});
    });
    broadcastSyncEvent();
  },

  resetAll() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.PROGRESS);
    localStorage.removeItem(KEYS.EXPERIMENTS);
    localStorage.removeItem(KEYS.QUIZ_RESULTS);
    localStorage.removeItem(KEYS.BOOKMARKS);
    localStorage.removeItem(KEYS.STUDENT_CLASS_RECORDS);
    localStorage.removeItem(KEYS.SAVED_LKPD);
    localStorage.removeItem(KEYS.STUDENT_REFLECTIONS);
  },
};
