/**
 * PHYSICS MOTION LAB - Core Data Types
 * Kinematika Gerak Lurus (GLB & GLBB) Kelas X SMA Fase E
 */

export type MotionType = 'GLB' | 'GLBB';

export type UserRole = 'murid' | 'guru';

export interface TelemetryPoint {
  t: number;      // time in seconds
  x: number;      // position in meters
  v: number;      // velocity in m/s
  a: number;      // acceleration in m/s²
  s: number;      // total distance in meters
}

export interface ExperimentParams {
  id: string;
  name: string;
  motionType: MotionType;
  x0: number;         // Initial position (m)
  v0: number;         // Initial velocity (m/s)
  a: number;          // Acceleration (m/s²)
  maxTime: number;    // Observation limit (s)
  color: string;      // Visual identifier (hex)
}

export interface ExperimentRun {
  id: string;
  date: string;
  title: string;
  params: ExperimentParams;
  telemetry: TelemetryPoint[];
  finalPosition: number;
  finalVelocity: number;
  duration: number;
}

export interface QuizQuestion {
  id: string;
  category: 'GLB' | 'GLBB' | 'GRAFIK' | 'HOTS';
  type: 'mc' | 'tf' | 'calc' | 'graph';
  difficulty: 'Mudah' | 'Sedang' | 'Sukar' | 'HOTS';
  question: string;
  options?: string[];
  correctAnswer: string | number | boolean;
  explanation: string;
  hint?: string;
  tolerance?: number; // for numeric calculation tolerance
  unit?: string;
  graphData?: { type: 's-t' | 'v-t' | 'a-t'; points: { t: number; val: number }[] };
}

export interface QuizResult {
  id: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  category: string;
  answers: { questionId: string; userAns: any; isCorrect: boolean }[];
  npsn?: string;
  studentAccountId?: string;
  studentName?: string;
  className?: string;
}

export interface CharacterBadge {
  id: string;
  name: string;
  title: string;
  specialty: string;
  avatarEmoji: string;
  color: string;
  bgGrad: string;
  unlockedLevel: number;
}

export interface UserProgress {
  studentName: string;
  studentId: string;
  schoolName: string;
  modulesCompleted: string[];
  videosWatched: string[];
  experimentsCount: number;
  lastQuizScore: number;
  badges: string[];
  pretestScore?: number;
  posttestScore?: number;
  level: number;
  xp: number;
  streakDays: number;
  selectedCharacter: string;
}

export interface VideoItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  description: string;
  youtubeId?: string; // Fallback or embed ID
  interactiveStops: {
    time: number; // in seconds
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }[];
}

export interface AudioItem {
  id: string;
  topic: string;
  duration: string;
  summary: string;
  keyPoints: string[];
}

export interface SavedLKPDRecord {
  id: string;
  timestamp: string;
  title: string;
  groupName: string;
  groupLeader: string;
  members: string;
  className: string;
  school: string;
  date: string;
  labMode: 'GLB' | 'GLBB';
  rows: {
    no: number;
    t: number;
    s: number;
    v: number;
    a: number;
    type: string;
  }[];
  glbRows?: {
    no: number;
    t: number;
    s: number;
    v: number;
    a: number;
    type: string;
  }[];
  glbbRows?: {
    no: number;
    t: number;
    s: number;
    v: number;
    a: number;
    type: string;
  }[];
  glbbAccelRows?: {
    no: number;
    t: number;
    s: number;
    v: number;
    a: number;
    type: string;
  }[];
  glbbDecelRows?: {
    no: number;
    t: number;
    s: number;
    v: number;
    a: number;
    type: string;
  }[];
  ans1: string;
  ans2: string;
  ans3?: string;
  ans4: string;
  ans5?: string;
  ans6?: string;
  conclusion: string;
  npsn?: string;
  studentAccountId?: string;
  studentUid?: string;
  status?: 'submitted' | 'finalized';
  feedbackStatus?: 'pending' | 'reviewed';
  teacherFeedback?: string;
  feedbackBy?: string;
  feedbackByUid?: string;
  feedbackAt?: string;
}

export interface ActiveSession {
  accountId: string;
  role: UserRole;
  npsn: string;
  className: string;
  displayName: string;
  email?: string;
  loggedInAt: string;
}

export interface StudentReportSync {
  accountId: string;
  npsn: string;
  studentUid?: string;
  studentName: string;
  className: string;
  schoolName: string;
  xp: number;
  level: number;
  lastQuizScore: number;
  experimentsCount: number;
  lkpdSubmittedCount: number;
  badges: string[];
  updatedAt: string;
}

export interface StudentReflectionRecord {
  id: string;
  npsn: string;
  studentUid?: string;
  studentAccountId: string;
  studentName: string;
  className: string;
  date: string;
  ratings: {
    glb: number;
    glbb: number;
    graph: number;
    lab: number;
  };
  mood: string;
  interestingThing: string;
  challengingThing: string;
  labExperience: string;
  nextTarget: string;
  submittedAt: string;
}

