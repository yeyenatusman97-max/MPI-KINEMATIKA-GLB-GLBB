import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ActiveSession,
  QuizResult,
  SavedLKPDRecord,
  StudentReflectionRecord,
  StudentReportSync,
  UserRole,
} from '../types/physics';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

export const DEFAULT_SCHOOL_NPSN = '10000001';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function sanitizeId(raw: string, fallback = 'item'): string {
  const cleaned = (raw || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
  const trimmed = cleaned.slice(0, 128);
  return trimmed.length > 0 ? trimmed : fallback;
}

export function sanitizeNpsn(raw: string): string {
  const cleaned = (raw || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '');
  if (cleaned.length >= 4 && cleaned.length <= 20) return cleaned;
  const padded = (cleaned || '0000').padEnd(4, '0').slice(0, 20);
  return padded;
}

function clampStr(val: string | undefined | null, maxLen: number): string {
  return String(val ?? '').slice(0, maxLen);
}

export function isFirebaseUserVerified(): boolean {
  if (!auth.currentUser) return false;
  return Boolean(
    auth.currentUser.emailVerified ||
      auth.currentUser.providerData.some((p) => p.providerId === 'password')
  );
}

export function formatFirebaseAuthError(error: any): string {
  const code = String(error?.code || '');
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Alamat email ini sudah terdaftar pada aplikasi. Silakan masuk melalui halaman Login atau gunakan email lain.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid. Periksa kembali penulisan email Anda.';
    case 'auth/weak-password':
      return 'Password terlalu lemah. Gunakan minimal 6 karakter kombinasi huruf atau angka.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau password tidak sesuai. Periksa kembali penulisan Anda atau klik "Lupa Password?".';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan login yang gagal. Silakan tunggu beberapa menit sebelum mencoba lagi.';
    case 'auth/network-request-failed':
      return 'Koneksi internet terputus. Periksa jaringan Anda lalu coba kembali.';
    case 'auth/operation-not-allowed':
      return 'Metode Login Email/Password belum diaktifkan di Firebase Console (Authentication → Sign-in method → Email/Password).';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan. Hubungi administrator sekolah.';
    case 'auth/role-mismatch':
      return String(
        error?.message ||
          'Akun ini tidak sesuai dengan portal login yang dipilih. Gunakan portal Murid atau Guru sesuai akun Anda.'
      );
    default:
      return error?.message
        ? `Autentikasi gagal: ${error.message}`
        : 'Terjadi kesalahan saat memproses autentikasi. Silakan coba lagi.';
  }
}

function createRoleMismatchError(actualRole: UserRole): Error {
  const err = new Error(
    actualRole === 'murid'
      ? 'Akses ditolak: Akun ini terdaftar sebagai Akun Murid dan tidak bisa dipakai untuk masuk ke Akun Guru. Silakan kembali ke Pembuka dan pilih kartu Akun Murid.'
      : 'Akses ditolak: Akun ini terdaftar sebagai Akun Guru dan tidak bisa dipakai untuk masuk ke Akun Murid. Silakan kembali ke Pembuka dan pilih kartu Akun Guru.'
  ) as Error & { code?: string };
  err.code = 'auth/role-mismatch';
  return err;
}


export function subscribeFirebaseAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function connectGoogleCloudSync(): Promise<User | null> {
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function disconnectGoogleCloudSync(): Promise<void> {
  await signOut(auth);
}

export async function logoutFromFirebase(): Promise<void> {
  await signOut(auth);
}

export interface CloudUserProfile {
  uid: string;
  role: UserRole;
  npsn: string;
  accountId: string;
  displayName: string;
  className: string;
  email?: string;
}

export async function fetchUserProfileFromCloud(uidRaw: string): Promise<CloudUserProfile | null> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return null;
  const uid = sanitizeId(uidRaw, 'user');
  const userPath = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return {
      uid,
      role: data.role === 'guru' ? 'guru' : 'murid',
      npsn: sanitizeNpsn(data.npsn || DEFAULT_SCHOOL_NPSN),
      accountId: sanitizeId(data.accountId || uid, uid),
      displayName: clampStr(data.displayName || 'Pengguna MPI', 120),
      className: clampStr(data.className || '', 60),
      email: data.email ? clampStr(data.email, 160) : undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }
}

export async function fetchMemberProfileFromCloud(
  uidRaw: string,
  npsnRaw: string
): Promise<CloudUserProfile | null> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return null;
  const uid = sanitizeId(uidRaw, 'user');
  const npsn = sanitizeNpsn(npsnRaw || DEFAULT_SCHOOL_NPSN);
  try {
    const snap = await getDoc(doc(db, 'schools', npsn, 'members', uid));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return {
      uid,
      role: data.role === 'guru' ? 'guru' : 'murid',
      npsn: sanitizeNpsn(data.npsn || npsn),
      accountId: sanitizeId(data.accountId || uid, uid),
      displayName: clampStr(data.displayName || 'Pengguna MPI', 120),
      className: clampStr(data.className || '', 60),
    };
  } catch {
    return null;
  }
}

let registrationInProgress = false;
let loginInProgress = false;

export function isRegistrationInProgress(): boolean {
  return registrationInProgress;
}

export function isAuthTransitionInProgress(): boolean {
  return registrationInProgress || loginInProgress;
}

export async function registerWithFirebaseEmail(params: {
  role: UserRole;
  fullName: string;
  className?: string;
  email: string;
  password: string;
  npsn?: string;
}): Promise<{ email: string; role: UserRole; className: string; npsn: string; displayName: string }> {
  registrationInProgress = true;
  try {
    await setPersistence(auth, browserLocalPersistence);
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = clampStr(params.fullName.trim(), 120) || 'Pengguna MPI';
    const cleanNpsn = sanitizeNpsn(params.npsn?.trim() || DEFAULT_SCHOOL_NPSN);
    const cleanClass =
      params.role === 'murid'
        ? clampStr(params.className?.trim() || 'Kelas X Fase E', 60)
        : 'Guru Pengampu';

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
    await updateProfile(cred.user, { displayName: cleanName });

    const uid = sanitizeId(cred.user.uid, 'user');
    const accountId = sanitizeId(`${params.role}_${cleanNpsn}_${uid}`, uid);
    const tempSession: ActiveSession = {
      accountId,
      role: params.role,
      npsn: cleanNpsn,
      className: cleanClass,
      displayName: cleanName,
      email: cleanEmail,
      loggedInAt: new Date().toISOString(),
    };

    await ensureSchoolMembershipInCloud(tempSession, undefined, cleanEmail);

    if (params.role === 'murid') {
      await syncStudentReportToCloud(
        {
          accountId,
          npsn: cleanNpsn,
          studentUid: uid,
          studentName: cleanName,
          className: cleanClass,
          schoolName: `Sekolah NPSN ${cleanNpsn}`,
          xp: 0,
          level: 1,
          lastQuizScore: 0,
          experimentsCount: 0,
          lkpdSubmittedCount: 0,
          badges: [],
          updatedAt: new Date().toISOString(),
        },
        tempSession
      );
    }

    // Sign out cleanly after registration so user logs in through Halaman Login
    await signOut(auth);

    return {
      email: cleanEmail,
      role: params.role,
      className: cleanClass,
      npsn: cleanNpsn,
      displayName: cleanName,
    };
  } finally {
    registrationInProgress = false;
  }
}

export async function loginWithFirebaseEmail(params: {
  preferredRole: UserRole;
  fullName?: string;
  email: string;
  password: string;
  npsn?: string;
}): Promise<ActiveSession> {
  loginInProgress = true;
  try {
    await setPersistence(auth, browserLocalPersistence);
    const cleanEmail = params.email.trim().toLowerCase();
    const providedName = clampStr((params.fullName || '').trim(), 120);
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, params.password);
    const uid = sanitizeId(cred.user.uid, 'user');

    const profile = await fetchUserProfileFromCloud(uid);
    const resolvedNpsnHint = sanitizeNpsn(params.npsn?.trim() || profile?.npsn || DEFAULT_SCHOOL_NPSN);
    const memberProfile = !profile
      ? await fetchMemberProfileFromCloud(uid, resolvedNpsnHint)
      : null;

    const existingCloudRole: UserRole | undefined = profile?.role || memberProfile?.role;
    if (existingCloudRole && existingCloudRole !== params.preferredRole) {
      await signOut(auth).catch(() => {});
      throw createRoleMismatchError(existingCloudRole);
    }

    const resolvedRole: UserRole = existingCloudRole || params.preferredRole;
    const resolvedNpsn = sanitizeNpsn(
      params.npsn?.trim() || profile?.npsn || memberProfile?.npsn || DEFAULT_SCHOOL_NPSN
    );
    const resolvedName =
      providedName ||
      profile?.displayName ||
      memberProfile?.displayName ||
      clampStr(cred.user.displayName || cleanEmail.split('@')[0] || 'Pengguna MPI', 120);

    if (providedName && cred.user.displayName !== providedName) {
      await updateProfile(cred.user, { displayName: providedName }).catch(() => {});
    }

    const resolvedClass =
      resolvedRole === 'murid'
        ? clampStr(profile?.className || memberProfile?.className || 'Kelas X Fase E', 60)
        : 'Guru Pengampu';
    const resolvedAccountId =
      profile?.accountId ||
      memberProfile?.accountId ||
      sanitizeId(`${resolvedRole}_${resolvedNpsn}_${uid}`, uid);

    const session: ActiveSession = {
      accountId: resolvedAccountId,
      role: resolvedRole,
      npsn: resolvedNpsn,
      className: resolvedClass,
      displayName: resolvedName,
      email: cred.user.email || cleanEmail,
      loggedInAt: new Date().toISOString(),
    };

    await ensureSchoolMembershipInCloud(session, undefined, cred.user.email || cleanEmail).catch(
      () => {}
    );

    return session;
  } finally {
    loginInProgress = false;
  }
}

export async function restoreSessionFromFirebaseUser(
  user: User,
  existingLocal?: ActiveSession | null
): Promise<ActiveSession> {
  const uid = sanitizeId(user.uid, 'user');
  const localMatchesUser = Boolean(
    existingLocal &&
      ((existingLocal.email &&
        user.email &&
        existingLocal.email.toLowerCase() === user.email.toLowerCase()) ||
        existingLocal.accountId === uid ||
        existingLocal.accountId?.endsWith(`_${uid}`))
  );
  const safeLocal = localMatchesUser ? existingLocal : null;

  let profile: CloudUserProfile | null = null;
  try {
    profile = await fetchUserProfileFromCloud(uid);
  } catch {
    profile = null;
  }

  const candidateNpsn = sanitizeNpsn(
    profile?.npsn || safeLocal?.npsn || DEFAULT_SCHOOL_NPSN
  );
  const memberProfile = !profile
    ? await fetchMemberProfileFromCloud(uid, candidateNpsn)
    : null;

  const role: UserRole = profile?.role || memberProfile?.role || safeLocal?.role || 'murid';
  const npsn = sanitizeNpsn(
    profile?.npsn || memberProfile?.npsn || safeLocal?.npsn || DEFAULT_SCHOOL_NPSN
  );
  const displayName =
    profile?.displayName ||
    memberProfile?.displayName ||
    safeLocal?.displayName ||
    clampStr(user.displayName || user.email?.split('@')[0] || 'Pengguna MPI', 120);
  const className =
    role === 'murid'
      ? clampStr(
          profile?.className || memberProfile?.className || safeLocal?.className || 'Kelas X Fase E',
          60
        )
      : 'Guru Pengampu';
  const accountId =
    profile?.accountId ||
    memberProfile?.accountId ||
    safeLocal?.accountId ||
    sanitizeId(`${role}_${npsn}_${uid}`, uid);

  return {
    accountId,
    role,
    npsn,
    className,
    displayName,
    email: user.email || safeLocal?.email || '',
    loggedInAt: safeLocal?.loggedInAt || new Date().toISOString(),
  };
}

export async function updateUserDisplayNameInCloud(displayNameRaw: string): Promise<void> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return;
  const cleanName = clampStr(displayNameRaw.trim(), 120);
  if (!cleanName) return;
  await updateProfile(auth.currentUser, { displayName: cleanName }).catch(() => {});
  const uid = sanitizeId(auth.currentUser.uid, 'user');
  const userPath = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, {
        displayName: cleanName,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function sendFirebasePasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Ensures the signed-in user has a UserProfile and School + SchoolMember docs in Firestore.
 * Returns the latest allowedTeacherUids for the school (up to 10).
 */
const membershipSyncQueue = new Map<string, Promise<string[]>>();

export async function ensureSchoolMembershipInCloud(
  session: ActiveSession,
  schoolName?: string,
  emailOverride?: string
): Promise<string[]> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return [];

  const uid = sanitizeId(auth.currentUser.uid, 'user');
  const npsn = sanitizeNpsn(session.npsn);
  const queueKey = `${npsn}_${uid}`;
  const previous = membershipSyncQueue.get(queueKey) || Promise.resolve([] as string[]);

  const nextTask = previous
    .catch(() => [] as string[])
    .then(async (): Promise<string[]> => {
      if (!isFirebaseUserVerified() || !auth.currentUser) return [];

      const accountId = sanitizeId(session.accountId, uid);
      const displayName = clampStr(session.displayName || 'Pengguna MPI', 120) || 'Pengguna MPI';
      const className = clampStr(session.className || '', 60);
      const emailVal = clampStr(emailOverride || session.email || auth.currentUser.email || '', 160);
      const resolvedSchool = clampStr(schoolName || `Sekolah NPSN ${npsn}`, 150) || `Sekolah NPSN ${npsn}`;

      const userPath = `users/${uid}`;
      try {
        const userRef = doc(db, 'users', uid);
        const existingUser = await getDoc(userRef);
        if (!existingUser.exists()) {
          await setDoc(userRef, {
            uid,
            role: session.role,
            npsn,
            accountId,
            displayName,
            className,
            ...(emailVal ? { email: emailVal } : {}),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const existingData = existingUser.data() as { role?: UserRole } | undefined;
          if (existingData?.role && existingData.role !== session.role) {
            return [];
          }
          await updateDoc(userRef, {
            npsn,
            accountId,
            displayName,
            className,
            ...(emailVal ? { email: emailVal } : {}),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userPath);
      }

      const schoolPath = `schools/${npsn}`;
      let teacherUids: string[] = [];
      try {
        const schoolRef = doc(db, 'schools', npsn);
        let schoolSnap: Awaited<ReturnType<typeof getDoc>> | null = null;
        try {
          schoolSnap = await getDoc(schoolRef);
        } catch {
          schoolSnap = null;
        }

        if (!schoolSnap || !schoolSnap.exists()) {
          const initialTeachers = session.role === 'guru' ? [uid] : [];
          try {
            await setDoc(schoolRef, {
              npsn,
              schoolName: resolvedSchool,
              ownerUid: uid,
              teacherUids: initialTeachers,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            teacherUids = initialTeachers;
          } catch {
            // School already exists if non-member couldn't read before joining; proceed to member creation
          }
        } else {
          const data = schoolSnap.data() as { teacherUids?: string[] };
          teacherUids = Array.isArray(data.teacherUids) ? data.teacherUids.slice(0, 10) : [];
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, schoolPath);
      }

      // Register/Update School Member
      const memberPath = `schools/${npsn}/members/${uid}`;
      try {
        const memberRef = doc(db, 'schools', npsn, 'members', uid);
        const memberSnap = await getDoc(memberRef);
        if (!memberSnap.exists()) {
          await setDoc(memberRef, {
            uid,
            npsn,
            role: session.role,
            accountId,
            displayName,
            className,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const existingMemberData = memberSnap.data() as { role?: UserRole } | undefined;
          if (existingMemberData?.role && existingMemberData.role !== session.role) {
            return [];
          }
          await updateDoc(memberRef, {
            displayName,
            className,
            accountId,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, memberPath);
      }

      // Now that user is a member, fetch school doc and register teacher UID if guru
      try {
        const schoolRef = doc(db, 'schools', npsn);
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists()) {
          const data = schoolSnap.data() as { teacherUids?: string[] };
          teacherUids = Array.isArray(data.teacherUids) ? data.teacherUids.slice(0, 10) : [];
          if (session.role === 'guru' && !teacherUids.includes(uid) && teacherUids.length < 10) {
            const nextTeachers = [...teacherUids, uid];
            await updateDoc(schoolRef, {
              teacherUids: nextTeachers,
              schoolName: resolvedSchool,
              updatedAt: serverTimestamp(),
            });
            teacherUids = nextTeachers;
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, schoolPath);
      }

      return teacherUids;
    });

  membershipSyncQueue.set(queueKey, nextTask);
  return nextTask;
}

export async function syncLKPDSubmissionToCloud(
  record: SavedLKPDRecord,
  session: ActiveSession
): Promise<void> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return;

  const uid = sanitizeId(auth.currentUser.uid, 'user');
  const npsn = sanitizeNpsn(record.npsn || session.npsn);
  const submissionId = sanitizeId(record.id, `lkpd_${Date.now()}`);
  const teacherUids = await ensureSchoolMembershipInCloud(session, record.school);
  const allowedTeachers = teacherUids.filter((t) => typeof t === 'string').slice(0, 10);

  const docPath = `schools/${npsn}/lkpdSubmissions/${submissionId}`;
  const ref = doc(db, 'schools', npsn, 'lkpdSubmissions', submissionId);

  try {
    const existingSnap = await getDoc(ref);
    const payloadCommon = {
      allowedTeacherUids: allowedTeachers,
      title: clampStr(record.title || 'LKPD Kinematika', 200),
      groupName: clampStr(record.groupName || '', 120),
      groupLeader: clampStr(record.groupLeader || '', 120),
      members: clampStr(record.members || '', 600),
      className: clampStr(record.className || session.className || '', 60),
      school: clampStr(record.school || '', 150),
      date: clampStr(record.date || '', 30),
      labMode: (record.labMode === 'GLBB' ? 'GLBB' : 'GLB') as 'GLB' | 'GLBB',
      glbRows: (record.glbRows || []).slice(0, 50),
      glbbAccelRows: (record.glbbAccelRows || []).slice(0, 50),
      glbbDecelRows: (record.glbbDecelRows || []).slice(0, 50),
      ans1: clampStr(record.ans1 || '', 2000),
      ans2: clampStr(record.ans2 || '', 2000),
      ans4: clampStr(record.ans4 || '', 2000),
      ans5: clampStr(record.ans5 || '', 2000),
      ans6: clampStr(record.ans6 || '', 2000),
      conclusion: clampStr(record.conclusion || '', 2000),
      submittedAt: clampStr(record.timestamp || new Date().toISOString(), 64),
      updatedAt: serverTimestamp(),
    };

    if (!existingSnap.exists()) {
      await setDoc(ref, {
        id: submissionId,
        npsn,
        studentUid: uid,
        studentAccountId: sanitizeId(record.studentAccountId || session.accountId, uid),
        ...payloadCommon,
        status: 'submitted',
        feedbackStatus: 'pending',
        teacherFeedback: '',
        feedbackBy: '',
        feedbackByUid: '',
        feedbackAt: '',
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, payloadCommon);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function submitTeacherFeedbackToCloud(
  npsnRaw: string,
  submissionIdRaw: string,
  teacherFeedback: string,
  teacherName: string
): Promise<void> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return;

  const uid = sanitizeId(auth.currentUser.uid, 'guru');
  const npsn = sanitizeNpsn(npsnRaw);
  const submissionId = sanitizeId(submissionIdRaw, 'lkpd');
  const docPath = `schools/${npsn}/lkpdSubmissions/${submissionId}`;
  const ref = doc(db, 'schools', npsn, 'lkpdSubmissions', submissionId);

  try {
    await updateDoc(ref, {
      teacherFeedback: clampStr(teacherFeedback, 2000),
      feedbackBy: clampStr(teacherName || 'Guru Pengampu', 120),
      feedbackByUid: uid,
      feedbackAt: new Date().toISOString(),
      feedbackStatus: 'reviewed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteLKPDFromCloud(npsnRaw: string, submissionIdRaw: string): Promise<void> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return;
  const npsn = sanitizeNpsn(npsnRaw);
  const submissionId = sanitizeId(submissionIdRaw, 'lkpd');
  const docPath = `schools/${npsn}/lkpdSubmissions/${submissionId}`;
  try {
    await deleteDoc(doc(db, 'schools', npsn, 'lkpdSubmissions', submissionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function deleteQuizResultFromCloud(npsnRaw: string, resultIdRaw: string): Promise<void> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return;
  const npsn = sanitizeNpsn(npsnRaw);
  const resultId = sanitizeId(resultIdRaw, 'quiz');
  const docPath = `schools/${npsn}/quizResults/${resultId}`;
  try {
    await deleteDoc(doc(db, 'schools', npsn, 'quizResults', resultId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function deleteStudentReportFromCloud(npsnRaw: string, accountIdRaw: string): Promise<void> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return;
  const npsn = sanitizeNpsn(npsnRaw);
  const accountId = sanitizeId(accountIdRaw, 'student');
  const docPath = `schools/${npsn}/studentReports/${accountId}`;
  try {
    await deleteDoc(doc(db, 'schools', npsn, 'studentReports', accountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function syncStudentReflectionToCloud(
  record: StudentReflectionRecord,
  session: ActiveSession
): Promise<void> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return;

  const uid = sanitizeId(auth.currentUser.uid, 'user');
  const npsn = sanitizeNpsn(record.npsn || session.npsn);
  const reflectionId = sanitizeId(record.id, `refl_${Date.now()}`);
  const teacherUids = await ensureSchoolMembershipInCloud(session);

  const docPath = `schools/${npsn}/reflections/${reflectionId}`;
  const ref = doc(db, 'schools', npsn, 'reflections', reflectionId);

  const clampRating = (n: number) => Math.max(1, Math.min(5, Math.round(Number(n) || 4)));

  try {
    const existingSnap = await getDoc(ref);
    const commonPayload = {
      studentName: clampStr(record.studentName || session.displayName || 'Murid', 120) || 'Murid',
      className: clampStr(record.className || session.className || '', 60),
      allowedTeacherUids: teacherUids.filter((t) => typeof t === 'string').slice(0, 10),
      date: clampStr(record.date || '', 64),
      ratingGLB: clampRating(record.ratings?.glb),
      ratingGLBB: clampRating(record.ratings?.glbb),
      ratingGraph: clampRating(record.ratings?.graph),
      ratingLab: clampRating(record.ratings?.lab),
      mood: clampStr(record.mood || 'semangat', 40) || 'semangat',
      interestingThing: clampStr(record.interestingThing || '', 2000),
      challengingThing: clampStr(record.challengingThing || '', 2000),
      labExperience: clampStr(record.labExperience || '', 2000),
      nextTarget: clampStr(record.nextTarget || '', 2000),
      submittedAt: clampStr(record.submittedAt || new Date().toISOString(), 64),
      updatedAt: serverTimestamp(),
    };

    if (!existingSnap.exists()) {
      await setDoc(ref, {
        id: reflectionId,
        npsn,
        studentUid: uid,
        studentAccountId: sanitizeId(record.studentAccountId || session.accountId, uid),
        ...commonPayload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, commonPayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteStudentReflectionFromCloud(
  npsnRaw: string,
  reflectionIdRaw: string
): Promise<void> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return;
  const npsn = sanitizeNpsn(npsnRaw);
  const reflectionId = sanitizeId(reflectionIdRaw, 'refl');
  const docPath = `schools/${npsn}/reflections/${reflectionId}`;
  try {
    await deleteDoc(doc(db, 'schools', npsn, 'reflections', reflectionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function syncQuizResultToCloud(
  result: QuizResult,
  session: ActiveSession
): Promise<void> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return;

  const uid = sanitizeId(auth.currentUser.uid, 'user');
  const npsn = sanitizeNpsn(result.npsn || session.npsn);
  const resultId = sanitizeId(result.id, `quiz_${Date.now()}`);
  const teacherUids = await ensureSchoolMembershipInCloud(session);

  const docPath = `schools/${npsn}/quizResults/${resultId}`;
  try {
    await setDoc(doc(db, 'schools', npsn, 'quizResults', resultId), {
      id: resultId,
      npsn,
      studentUid: uid,
      studentAccountId: sanitizeId(result.studentAccountId || session.accountId, uid),
      studentName: clampStr(result.studentName || session.displayName || 'Murid', 120) || 'Murid',
      className: clampStr(result.className || session.className || '', 60),
      allowedTeacherUids: teacherUids.slice(0, 10),
      score: Math.max(0, Math.min(100, Number(result.score) || 0)),
      totalQuestions: Math.max(1, Math.min(100, Number(result.totalQuestions) || 10)),
      timeSpentSeconds: Math.max(0, Math.min(86400, Number(result.timeSpentSeconds) || 0)),
      category: clampStr(result.category || 'GLB_GLBB_COMPREHENSIVE', 80),
      submittedAt: clampStr(result.timestamp || new Date().toISOString(), 64),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

const studentReportWriteQueue = new Map<string, Promise<void>>();

export async function syncStudentReportToCloud(
  report: StudentReportSync,
  session: ActiveSession
): Promise<void> {
  if (!isFirebaseUserVerified() || !auth.currentUser) return;

  const uid = sanitizeId(auth.currentUser.uid, 'user');
  const npsn = sanitizeNpsn(report.npsn || session.npsn);
  const accountId = sanitizeId(report.accountId || session.accountId, uid);
  const docPath = `schools/${npsn}/studentReports/${accountId}`;

  const previous = studentReportWriteQueue.get(docPath) || Promise.resolve();
  const nextWrite = previous
    .catch(() => {})
    .then(async () => {
      if (!isFirebaseUserVerified() || !auth.currentUser) return;
      const teacherUids = await ensureSchoolMembershipInCloud(session, report.schoolName);
      const ref = doc(db, 'schools', npsn, 'studentReports', accountId);
      const payload = {
        studentName: clampStr(report.studentName || session.displayName || 'Murid', 120) || 'Murid',
        className: clampStr(report.className || session.className || '', 60),
        schoolName: clampStr(report.schoolName || `Sekolah NPSN ${npsn}`, 150),
        allowedTeacherUids: teacherUids.slice(0, 10),
        xp: Math.max(0, Math.min(1000000, Number(report.xp) || 0)),
        level: Math.max(1, Math.min(500, Number(report.level) || 1)),
        lastQuizScore: Math.max(0, Math.min(100, Number(report.lastQuizScore) || 0)),
        experimentsCount: Math.max(0, Math.min(10000, Number(report.experimentsCount) || 0)),
        lkpdSubmittedCount: Math.max(0, Math.min(1000, Number(report.lkpdSubmittedCount) || 0)),
        badges: (report.badges || []).map((b) => clampStr(b, 64)).slice(0, 20),
        updatedAt: serverTimestamp(),
      };

      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            accountId,
            npsn,
            studentUid: uid,
            ...payload,
            status: 'active',
            createdAt: serverTimestamp(),
          });
        } else {
          await updateDoc(ref, payload);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    });

  studentReportWriteQueue.set(docPath, nextWrite);
  return nextWrite;
}

export function subscribeSchoolCloudData(
  session: ActiveSession,
  handlers: {
    onLKPDs: (records: SavedLKPDRecord[]) => void;
    onQuizResults: (results: QuizResult[]) => void;
    onStudentReports: (reports: StudentReportSync[]) => void;
    onReflections?: (reflections: StudentReflectionRecord[]) => void;
  }
): () => void {
  if (!isFirebaseUserVerified() || !auth.currentUser) {
    return () => {};
  }

  const uid = sanitizeId(auth.currentUser.uid, 'user');
  const npsn = sanitizeNpsn(session.npsn);
  const filterField = session.role === 'guru' ? 'allowedTeacherUids' : 'studentUid';
  const filterOp = session.role === 'guru' ? 'array-contains' : '==';

  const lkpdPath = `schools/${npsn}/lkpdSubmissions`;
  const lkpdQ = query(collection(db, lkpdPath), where(filterField, filterOp, uid));
  const unsubLkpd = onSnapshot(
    lkpdQ,
    (snap) => {
      const list: SavedLKPDRecord[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: data.id || d.id,
          timestamp: data.submittedAt || (data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString()),
          title: data.title || 'LKPD Kinematika',
          groupName: data.groupName || '',
          groupLeader: data.groupLeader || '',
          members: data.members || '',
          className: data.className || '',
          school: data.school || '',
          date: data.date || '',
          labMode: data.labMode === 'GLBB' ? 'GLBB' : 'GLB',
          rows: [...(data.glbRows || []), ...(data.glbbAccelRows || []), ...(data.glbbDecelRows || [])],
          glbRows: data.glbRows || [],
          glbbRows: [...(data.glbbAccelRows || []), ...(data.glbbDecelRows || [])],
          glbbAccelRows: data.glbbAccelRows || [],
          glbbDecelRows: data.glbbDecelRows || [],
          ans1: data.ans1 || '',
          ans2: data.ans2 || '',
          ans4: data.ans4 || '',
          ans5: data.ans5 || '',
          ans6: data.ans6 || '',
          conclusion: data.conclusion || '',
          npsn: data.npsn,
          studentAccountId: data.studentAccountId,
          studentUid: data.studentUid,
          status: data.status,
          feedbackStatus: data.feedbackStatus,
          teacherFeedback: data.teacherFeedback || '',
          feedbackBy: data.feedbackBy || '',
          feedbackByUid: data.feedbackByUid || '',
          feedbackAt: data.feedbackAt || '',
        };
      });
      handlers.onLKPDs(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, lkpdPath);
    }
  );

  const quizPath = `schools/${npsn}/quizResults`;
  const quizQ = query(collection(db, quizPath), where(filterField, filterOp, uid));
  const unsubQuiz = onSnapshot(
    quizQ,
    (snap) => {
      const list: QuizResult[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: data.id || d.id,
          timestamp: data.submittedAt || new Date().toISOString(),
          score: Number(data.score) || 0,
          totalQuestions: Number(data.totalQuestions) || 10,
          timeSpentSeconds: Number(data.timeSpentSeconds) || 0,
          category: data.category || 'GLB_GLBB_COMPREHENSIVE',
          answers: [],
          npsn: data.npsn,
          studentAccountId: data.studentAccountId,
          studentName: data.studentName,
          className: data.className,
        };
      });
      handlers.onQuizResults(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, quizPath);
    }
  );

  const reportsPath = `schools/${npsn}/studentReports`;
  const reportQ = query(collection(db, reportsPath), where(filterField, filterOp, uid));
  const unsubReports = onSnapshot(
    reportQ,
    (snap) => {
      const list: StudentReportSync[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          accountId: data.accountId || d.id,
          npsn: data.npsn || npsn,
          studentUid: data.studentUid,
          studentName: data.studentName || 'Murid',
          className: data.className || '',
          schoolName: data.schoolName || '',
          xp: Number(data.xp) || 0,
          level: Number(data.level) || 1,
          lastQuizScore: Number(data.lastQuizScore) || 0,
          experimentsCount: Number(data.experimentsCount) || 0,
          lkpdSubmittedCount: Number(data.lkpdSubmittedCount) || 0,
          badges: Array.isArray(data.badges) ? data.badges : [],
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        };
      });
      handlers.onStudentReports(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, reportsPath);
    }
  );

  const reflectionsPath = `schools/${npsn}/reflections`;
  const reflectionsQ = query(collection(db, reflectionsPath), where(filterField, filterOp, uid));
  const unsubReflections = onSnapshot(
    reflectionsQ,
    (snap) => {
      if (!handlers.onReflections) return;
      const list: StudentReflectionRecord[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: data.id || d.id,
          npsn: data.npsn || npsn,
          studentUid: data.studentUid,
          studentAccountId: data.studentAccountId || '',
          studentName: data.studentName || 'Murid',
          className: data.className || '',
          date: data.date || '',
          ratings: {
            glb: Number(data.ratingGLB) || 4,
            glbb: Number(data.ratingGLBB) || 4,
            graph: Number(data.ratingGraph) || 4,
            lab: Number(data.ratingLab) || 4,
          },
          mood: data.mood || 'semangat',
          interestingThing: data.interestingThing || '',
          challengingThing: data.challengingThing || '',
          labExperience: data.labExperience || '',
          nextTarget: data.nextTarget || '',
          submittedAt:
            data.submittedAt ||
            (data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate().toISOString()
              : new Date().toISOString()),
        };
      });
      handlers.onReflections(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, reflectionsPath);
    }
  );

  return () => {
    unsubLkpd();
    unsubQuiz();
    unsubReports();
    unsubReflections();
  };
}
