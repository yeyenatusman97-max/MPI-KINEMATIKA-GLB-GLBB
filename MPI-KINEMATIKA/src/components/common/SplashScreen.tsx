import React, { useState } from 'react';
import {
  Sparkles,
  Activity,
  Gauge,
  Atom,
  GraduationCap,
  Users,
  UserRound,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
  Mail,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/soundEffects';
import { storage } from '../../utils/storage';
import { ActiveSession, UserRole } from '../../types/physics';
import {
  VolumetricKinematicsCar,
  VolumetricStopwatch,
  VolumetricMotionGraphIcon,
} from './Kinematics3DVisuals';
import { KinematicsPhysicsBackground } from './KinematicsPhysicsBackground';
import {
  DEFAULT_SCHOOL_NPSN,
  formatFirebaseAuthError,
  loginWithFirebaseEmail,
  registerWithFirebaseEmail,
  sendFirebasePasswordReset,
} from '../../services/firebaseService';

type AuthView = 'welcome' | 'login' | 'register' | 'forgot';

interface SplashScreenProps {
  onLoginSuccess: (session: ActiveSession) => void;
  onSessionInvalidated?: () => void;
  activeSession?: ActiveSession | null;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onLoginSuccess,
  onSessionInvalidated,
  activeSession,
}) => {
  const [authView, setAuthView] = useState<AuthView>('welcome');
  const [roleMode, setRoleMode] = useState<UserRole>(
    activeSession?.role || storage.getRole() || 'murid'
  );

  // Login Form State
  const [loginName, setLoginName] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Register Form State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState<string>('');

  // Notifications & Transition State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const showToast = (
    type: 'success' | 'error' | 'warning',
    title: string,
    message: string
  ) => {
    setNotification({ type, title, message });
  };

  const navigateAuthView = (nextView: AuthView, keepNotification = false) => {
    sounds.playClick();
    if (!keepNotification) {
      setNotification(null);
    }
    setLoginPassword('');
    setRegPassword('');
    setRegConfirmPassword('');
    setShowLoginPassword(false);
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setAuthView(nextView);
  };

  const enterLearningSpace = (session: ActiveSession) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    sounds.playStart();
    confetti({
      particleCount: 55,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#0284c7', '#38bdf8', '#f59e0b', '#10b981'],
    });
    window.setTimeout(() => {
      onLoginSuccess(session);
    }, 950);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const cleanName = loginName.trim();
    const cleanEmail = loginEmail.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !loginPassword) {
      sounds.playError();
      showToast(
        'warning',
        'Data Belum Lengkap',
        roleMode === 'murid'
          ? 'Harap lengkapi Nama Murid, Email, dan Password Anda terlebih dahulu.'
          : 'Harap lengkapi Nama Guru, Email, dan Password Anda terlebih dahulu.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      sounds.playError();
      showToast(
        'warning',
        'Format Email Tidak Valid',
        'Masukkan alamat email yang valid (contoh: nama@sekolah.sch.id).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await loginWithFirebaseEmail({
        preferredRole: roleMode,
        fullName: cleanName,
        email: cleanEmail,
        password: loginPassword,
        npsn: DEFAULT_SCHOOL_NPSN,
      });

      storage.setActiveSession(session);
      setLoginPassword('');
      enterLearningSpace(session);
    } catch (err: any) {
      sounds.playError();
      if (err?.code === 'auth/role-mismatch') {
        storage.logout();
        onSessionInvalidated?.();
      }
      showToast(
        'error',
        err?.code === 'auth/role-mismatch' ? 'Akses Portal Ditolak' : 'Login Gagal',
        formatFirebaseAuthError(err)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const cleanName = regFullName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !regPassword || !regConfirmPassword) {
      sounds.playError();
      showToast(
        'warning',
        'Data Registrasi Belum Lengkap',
        'Mohon isi Nama lengkap, Email, Password, dan Konfirmasi password.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      sounds.playError();
      showToast(
        'warning',
        'Format Email Tidak Valid',
        'Masukkan alamat email aktif yang valid (contoh: nama@gmail.com).'
      );
      return;
    }

    if (regPassword.length < 6) {
      sounds.playError();
      showToast(
        'warning',
        'Password Terlalu Pendek',
        'Password minimal terdiri dari 6 karakter.'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      sounds.playError();
      showToast(
        'error',
        'Konfirmasi Password Tidak Cocok',
        'Password dan Konfirmasi password harus sama persis.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await registerWithFirebaseEmail({
        role: roleMode,
        fullName: cleanName,
        email: cleanEmail,
        password: regPassword,
        npsn: DEFAULT_SCHOOL_NPSN,
      });

      sounds.playSuccess();
      setLoginName(created.displayName);
      setLoginEmail(created.email);
      setLoginPassword('');
      setRegPassword('');
      setRegConfirmPassword('');
      setAuthView('login');
      showToast(
        'success',
        'Registrasi Berhasil!',
        `Akun ${created.role === 'guru' ? 'Guru' : 'Murid'} untuk ${created.displayName} telah terdaftar (${created.email}). Silakan masuk menggunakan ${created.role === 'guru' ? 'Nama Guru' : 'Nama Murid'}, Email, dan Password Anda.`
      );
    } catch (err: any) {
      sounds.playError();
      showToast('error', 'Registrasi Gagal', formatFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      sounds.playError();
      showToast(
        'warning',
        'Email Diperlukan',
        'Masukkan alamat email akun yang terdaftar untuk menerima tautan pemulihan password.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await sendFirebasePasswordReset(cleanEmail);
      sounds.playSuccess();
      showToast(
        'success',
        'Email Pemulihan Terkirim',
        `Tautan reset password telah dikirim ke ${cleanEmail}. Periksa kotak masuk atau folder spam email Anda.`
      );
    } catch (err: any) {
      sounds.playError();
      showToast('error', 'Gagal Mengirim Reset Password', formatFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnterRoleAuth = (targetRole: UserRole, targetView: 'login' | 'register') => {
    sounds.playClick();
    if (targetRole !== roleMode) {
      setLoginName('');
      setLoginEmail('');
      setRegFullName('');
      setRegEmail('');
    }
    setRoleMode(targetRole);
    setNotification(null);
    setLoginPassword('');
    setRegPassword('');
    setRegConfirmPassword('');
    setShowLoginPassword(false);
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setAuthView(targetView);
  };

  return (
    <div className="fixed inset-0 h-dvh z-50 flex flex-col justify-between bg-gradient-to-br from-[#EEF2FF] via-[#F7FAFF] to-[#ECFEFF] overflow-y-auto px-3 py-2.5 sm:px-5 sm:py-4 lg:px-8 text-slate-900 select-none">
      <KinematicsPhysicsBackground />

      {/* Soft futuristic pastel aurora ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-28 -left-24 h-80 w-80 rounded-full bg-indigo-200/45 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto my-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center py-1">
        {/* LEFT COLUMN: MPI Soft Futuristic Hero & 3D Kinematics Visuals */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-2.5 px-1 sm:px-2">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-indigo-300/90 bg-white/95 backdrop-blur-md px-3 py-1 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs font-black text-slate-900 tracking-tight">
              Media Pembelajaran Interaktif (MPI) Fisika Kelas X Fase E
            </span>
          </div>

          <div className="space-y-1 max-w-xl">
            <h1 className="text-2xl sm:text-3xl xl:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Kinematika Gerak Lurus
            </h1>
            <p className="text-sm sm:text-lg xl:text-2xl font-extrabold text-indigo-700 leading-snug">
              &quot;Gerak Lurus Beraturan (GLB) &amp; Gerak Lurus Berubah Beraturan (GLBB)&quot;
            </p>
          </div>

          {/* Compact 3D Diorama */}
          <div className="relative flex items-center justify-center gap-4 py-0.5 w-full lg:justify-start">
            <div className="hidden sm:block animate-float-delayed">
              <VolumetricStopwatch size="sm" />
            </div>
            <div className="animate-float-3d">
              <VolumetricKinematicsCar size="md" speed={18} isMoving={true} />
            </div>
            <div className="hidden sm:block animate-float-fast">
              <VolumetricMotionGraphIcon size="sm" />
            </div>
          </div>

          {/* Live Motion Track Preview */}
          <div className="w-full max-w-md rounded-2xl border-2 border-indigo-200/80 bg-white/95 p-3 shadow-md backdrop-blur-md space-y-2.5">
            <div>
              <div className="flex justify-between text-[11px] font-mono font-black text-indigo-900 mb-1">
                <span className="flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-indigo-600" /> Lintasan GLB
                </span>
                <span>v = konstan (a = 0)</span>
              </div>
              <div className="relative h-2.5 w-full rounded-full bg-indigo-50 border border-indigo-200 overflow-hidden">
                <div className="absolute top-0 bottom-0 w-7 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 shadow animate-[moveGlb_3s_linear_infinite]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-mono font-black text-teal-900 mb-1">
                <span className="flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5 text-teal-600" /> Lintasan GLBB
                </span>
                <span>a = konstan (Δv ≠ 0)</span>
              </div>
              <div className="relative h-2.5 w-full rounded-full bg-teal-50 border border-teal-200 overflow-hidden">
                <div className="absolute top-0 bottom-0 w-7 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 shadow animate-[moveGlbb_3s_ease-in_infinite]" />
              </div>
            </div>
          </div>

          <div className="w-full flex flex-nowrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-800 font-bold overflow-x-auto no-scrollbar">
            <span className="shrink-0 whitespace-nowrap px-2 sm:px-2.5 py-1 rounded-xl bg-white/90 border border-indigo-200 shadow-xs">
              • Mindful (Berkesadaran)
            </span>
            <span className="shrink-0 whitespace-nowrap px-2 sm:px-2.5 py-1 rounded-xl bg-white/90 border border-indigo-200 shadow-xs">
              • Meaningful (Bermakna)
            </span>
            <span className="shrink-0 whitespace-nowrap px-2 sm:px-2.5 py-1 rounded-xl bg-white/90 border border-indigo-200 shadow-xs">
              • Joyful (Menggembirakan)
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: SOFT FUTURISTIC HYBRID AUTH PORTAL */}
        <div className="lg:col-span-6 w-full">
          <div className="bg-white/95 backdrop-blur-2xl border-2 border-indigo-200/90 rounded-3xl shadow-[0_24px_60px_-15px_rgba(55,48,163,0.14)] overflow-hidden">
            {/* Soft Futuristic Header Strip */}
            <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F0F9FF] to-[#ECFDF5] px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-indigo-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black tracking-wide uppercase text-slate-900 truncate">
                    {authView === 'welcome' && 'Gerbang Akses MPI Fisika'}
                    {authView === 'login' &&
                      (roleMode === 'guru' ? 'Login Akun Guru' : 'Login Akun Murid')}
                    {authView === 'register' &&
                      (roleMode === 'guru' ? 'Registrasi Akun Guru' : 'Registrasi Akun Murid')}
                    {authView === 'forgot' && 'Pemulihan Password'}
                  </div>
                  <p className="text-[11px] text-slate-700 font-semibold truncate">
                    {authView === 'welcome' && 'Hybrid Modern Portal • Murid & Guru'}
                    {authView === 'login' &&
                      (roleMode === 'guru'
                        ? 'Masuk dengan Nama Guru, Email, & Password terdaftar'
                        : 'Masuk dengan Nama Murid, Email, & Password terdaftar')}
                    {authView === 'register' &&
                      'Daftarkan akun dengan Email aktif untuk akses & sinkronisasi penuh'}
                    {authView === 'forgot' && 'Kirim tautan reset password ke email Anda'}
                  </p>
                </div>
              </div>

              {authView !== 'welcome' && (
                <button
                  type="button"
                  onClick={() => navigateAuthView('welcome')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-xs font-black text-slate-800 shadow-xs transition shrink-0"
                  title="Kembali ke Halaman Pembuka"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Pembuka</span>
                </button>
              )}
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Notification Banner */}
              <AnimatePresence mode="wait">
                {notification && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`p-3.5 rounded-2xl border-2 text-xs flex items-start justify-between gap-2.5 shadow-sm ${
                      notification.type === 'success'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : notification.type === 'warning'
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                    role="alert"
                  >
                    <div className="flex items-start gap-2">
                      {notification.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            notification.type === 'warning' ? 'text-amber-600' : 'text-rose-600'
                          }`}
                        />
                      )}
                      <div>
                        <div className="font-black">{notification.title}</div>
                        <div className="font-semibold leading-relaxed mt-0.5">
                          {notification.message}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotification(null)}
                      className="p-1 rounded-lg hover:bg-black/5 text-slate-600 shrink-0"
                      aria-label="Tutup notifikasi"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* =============================================================== */}
              {/* A. HALAMAN PEMBUKA (WELCOME PAGE)                               */}
              {/* =============================================================== */}
              {authView === 'welcome' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Pilih Kartu Akses Akun Anda
                    </h2>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Pilih kartu akses <strong>Akun Murid</strong> atau <strong>Akun Guru</strong> di bawah ini untuk langsung diarahkan ke menu <strong>MASUK</strong> atau <strong>BUAT AKUN</strong> masing-masing.
                    </p>
                  </div>

                  {/* Role Access Cards: Murid & Guru — refined typography, consistent icons, soft shadows & tactile motion */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Card Akun Murid */}
                    <motion.div
                      whileHover={{ y: -5, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                      onClick={() => handleEnterRoleAuth('murid', 'login')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEnterRoleAuth('murid', 'login');
                        }
                      }}
                      className="group cursor-pointer flex flex-col justify-between p-5 rounded-2xl border border-sky-200/90 bg-gradient-to-br from-[#F4F9FF] via-white to-[#EAF4FF] shadow-[0_10px_28px_-10px_rgba(2,132,199,0.16)] hover:border-sky-400 hover:shadow-[0_18px_36px_-10px_rgba(2,132,199,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0284C7] to-[#2563EB] text-white flex items-center justify-center shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform duration-200">
                            <UserRound className="h-5 w-5" strokeWidth={2} />
                          </div>
                          <span className="text-[11px] font-bold text-sky-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>Portal Murid</span>
                            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                          Akun Murid
                        </h3>
                        <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
                          Akses modul interaktif, praktikum virtual 3D, pengumpulan LKPD, kuis berhadiah XP, dan refleksi belajar.
                        </p>
                      </div>

                      <div
                        className="grid grid-cols-2 gap-2 pt-3 border-t border-sky-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleEnterRoleAuth('murid', 'login')}
                          className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#0369A1] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0EA5E9] text-xs font-bold text-white shadow-sm shadow-sky-600/20 transition-all active:scale-[0.97] whitespace-nowrap cursor-pointer"
                        >
                          <LogIn className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                          <span>Masuk</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEnterRoleAuth('murid', 'register')}
                          className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-xs font-bold text-sky-900 transition-all active:scale-[0.97] whitespace-nowrap cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5 shrink-0 text-sky-700" strokeWidth={2} />
                          <span>Buat Akun</span>
                        </button>
                      </div>
                    </motion.div>

                    {/* Card Akun Guru */}
                    <motion.div
                      whileHover={{ y: -5, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                      onClick={() => handleEnterRoleAuth('guru', 'login')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEnterRoleAuth('guru', 'login');
                        }
                      }}
                      className="group cursor-pointer flex flex-col justify-between p-5 rounded-2xl border border-teal-200/90 bg-gradient-to-br from-[#F0FDFA] via-white to-[#ECFDF5] shadow-[0_10px_28px_-10px_rgba(13,148,136,0.16)] hover:border-teal-400 hover:shadow-[0_18px_36px_-10px_rgba(13,148,136,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#059669] text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform duration-200">
                            <GraduationCap className="h-5 w-5" strokeWidth={2} />
                          </div>
                          <span className="text-[11px] font-bold text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>Portal Pendidik</span>
                            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                          Akun Guru
                        </h3>
                        <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
                          Pantau Rapor Belajar murid tersinkron otomatis, rekap kuis, hasil refleksi murid, dan umpan balik LKPD.
                        </p>
                      </div>

                      <div
                        className="grid grid-cols-2 gap-2 pt-3 border-t border-teal-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleEnterRoleAuth('guru', 'login')}
                          className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#059669] hover:from-[#0D9488] hover:to-[#10B981] text-xs font-bold text-white shadow-sm shadow-teal-600/20 transition-all active:scale-[0.97] whitespace-nowrap cursor-pointer"
                        >
                          <LogIn className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                          <span>Masuk</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEnterRoleAuth('guru', 'register')}
                          className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900 transition-all active:scale-[0.97] whitespace-nowrap cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5 shrink-0 text-teal-700" strokeWidth={2} />
                          <span>Buat Akun</span>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* B. HALAMAN LOGIN (TERPISAH PER AKUN: MURID ATAU GURU)           */}
              {/* =============================================================== */}
              {authView === 'login' && (
                <form onSubmit={handleLoginSubmit} noValidate className="space-y-3.5 text-xs">
                  {/* Exclusive Role Identity Card (Tanpa Penggabungan Murid & Guru) */}
                  {roleMode === 'murid' ? (
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-[#F4F7FF] to-[#ECFEFF] border-2 border-indigo-200">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">
                          Portal Login Akun Murid
                        </div>
                        <div className="text-[11px] font-semibold text-indigo-800 truncate">
                          Khusus akun Murid terdaftar · Akun Guru tidak dapat masuk di sini
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-[#F0FDFA] to-[#ECFDF5] border-2 border-teal-200">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">
                          Portal Login Akun Guru
                        </div>
                        <div className="text-[11px] font-semibold text-teal-800 truncate">
                          Khusus akun Guru terdaftar · Akun Murid tidak dapat masuk di sini
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nama Murid / Nama Guru */}
                  <div className="space-y-1">
                    <label className="font-black text-slate-900 flex items-center gap-1.5">
                      <User
                        className={`h-3.5 w-3.5 ${
                          roleMode === 'guru' ? 'text-teal-600' : 'text-indigo-600'
                        }`}
                      />
                      <span>{roleMode === 'guru' ? 'Nama Guru *' : 'Nama Murid *'}</span>
                    </label>
                    <input
                      type="text"
                      autoComplete="name"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder={
                        roleMode === 'guru'
                          ? 'Masukkan nama lengkap & gelar guru'
                          : 'Masukkan nama lengkap murid'
                      }
                      className={`w-full min-h-[44px] rounded-xl border-2 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 outline-none ${
                        roleMode === 'guru'
                          ? 'border-teal-100 focus:border-teal-400 focus:ring-teal-100'
                          : 'border-indigo-100 focus:border-indigo-400 focus:ring-indigo-100'
                      }`}
                    />
                  </div>

                  {/* Email (Murid & Guru) */}
                  <div className="space-y-1">
                    <label className="font-black text-slate-900 flex items-center gap-1.5">
                      <Mail
                        className={`h-3.5 w-3.5 ${
                          roleMode === 'guru' ? 'text-teal-600' : 'text-indigo-600'
                        }`}
                      />
                      <span>Email *</span>
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={
                        roleMode === 'guru'
                          ? 'email.guru@sekolah.sch.id'
                          : 'email.murid@sekolah.sch.id'
                      }
                      className={`w-full min-h-[44px] rounded-xl border-2 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 outline-none ${
                        roleMode === 'guru'
                          ? 'border-teal-100 focus:border-teal-400 focus:ring-teal-100'
                          : 'border-indigo-100 focus:border-indigo-400 focus:ring-indigo-100'
                      }`}
                    />
                  </div>

                  {/* Password + Show/Hide */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-slate-900 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Password *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (loginEmail.trim() && !forgotEmail.trim()) {
                            setForgotEmail(loginEmail.trim());
                          }
                          navigateAuthView('forgot');
                        }}
                        className="text-[11px] font-black text-indigo-700 hover:text-indigo-900 underline"
                      >
                        Lupa Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Masukkan password akun Anda"
                        className="w-full min-h-[44px] rounded-xl border-2 border-indigo-100 bg-white px-3.5 py-2 pr-11 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        aria-label={
                          showLoginPassword ? 'Sembunyikan password' : 'Tampilkan password'
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-900"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tombol Masuk */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white shadow-lg transition disabled:opacity-60 ${
                      roleMode === 'guru'
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-600/20'
                        : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 shadow-indigo-600/20'
                    }`}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>{isSubmitting ? 'MEMPROSES LOGIN...' : 'MASUK'}</span>
                  </button>

                  {/* Tautan menuju Buat Akun */}
                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-700 font-medium">
                      Belum memiliki akun {roleMode === 'guru' ? 'guru' : 'murid'}?
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateAuthView('register')}
                      className={`font-black underline inline-flex items-center gap-1 ${
                        roleMode === 'guru'
                          ? 'text-teal-700 hover:text-teal-950'
                          : 'text-indigo-700 hover:text-indigo-950'
                      }`}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Buat Akun {roleMode === 'guru' ? 'Guru' : 'Murid'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* =============================================================== */}
              {/* C. HALAMAN REGISTRASI (TERPISAH PER AKUN: MURID ATAU GURU)      */}
              {/* =============================================================== */}
              {authView === 'register' && (
                <form onSubmit={handleRegisterSubmit} noValidate className="space-y-3 text-xs">
                  {/* Exclusive Role Identity Card (Tanpa Penggabungan Daftar Murid & Guru) */}
                  {roleMode === 'murid' ? (
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-[#F4F7FF] to-[#ECFEFF] border-2 border-indigo-200">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">
                          Registrasi Akun Murid
                        </div>
                        <div className="text-[11px] font-semibold text-indigo-800 truncate">
                          Isi Nama lengkap, Email aktif, &amp; Password murid
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-[#F0FDFA] to-[#ECFDF5] border-2 border-teal-200">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">
                          Registrasi Akun Guru
                        </div>
                        <div className="text-[11px] font-semibold text-teal-800 truncate">
                          Isi Nama lengkap, Email aktif, &amp; Password guru pengampu
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Nama Lengkap */}
                    <div className="space-y-1">
                      <label className="font-black text-slate-900 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Nama lengkap *</span>
                      </label>
                      <input
                        type="text"
                        autoComplete="name"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder={
                          roleMode === 'guru'
                            ? 'Nama lengkap & gelar guru'
                            : 'Nama lengkap murid'
                        }
                        className="w-full min-h-[42px] rounded-xl border-2 border-indigo-100 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="font-black text-slate-900 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Email *</span>
                      </label>
                      <input
                        type="email"
                        autoComplete="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder={
                          roleMode === 'guru'
                            ? 'email.guru@sekolah.sch.id'
                            : 'email.murid@sekolah.sch.id'
                        }
                        className="w-full min-h-[42px] rounded-xl border-2 border-indigo-100 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Password */}
                    <div className="space-y-1">
                      <label className="font-black text-slate-900 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Password *</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 6 karakter"
                          className="w-full min-h-[42px] rounded-xl border-2 border-indigo-100 bg-white px-3 py-2 pr-10 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword((v) => !v)}
                          aria-label={
                            showRegPassword ? 'Sembunyikan password' : 'Tampilkan password'
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-900"
                        >
                          {showRegPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Konfirmasi Password */}
                    <div className="space-y-1">
                      <label className="font-black text-slate-900 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Konfirmasi password *</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Ulangi password"
                          className="w-full min-h-[42px] rounded-xl border-2 border-indigo-100 bg-white px-3 py-2 pr-10 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword((v) => !v)}
                          aria-label={
                            showRegConfirmPassword
                              ? 'Sembunyikan konfirmasi password'
                              : 'Tampilkan konfirmasi password'
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-900"
                        >
                          {showRegConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Daftar */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white shadow-lg transition disabled:opacity-60 ${
                      roleMode === 'guru'
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-600/20'
                        : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 shadow-indigo-600/20'
                    }`}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>
                      {isSubmitting
                        ? 'MENDAFTARKAN AKUN...'
                        : roleMode === 'guru'
                        ? 'DAFTAR AKUN GURU'
                        : 'DAFTAR AKUN MURID'}
                    </span>
                  </button>

                  {/* Tautan Kembali ke Halaman Login */}
                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-700 font-medium">
                      Sudah punya akun {roleMode === 'guru' ? 'guru' : 'murid'}?
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateAuthView('login')}
                      className={`font-black underline inline-flex items-center gap-1 ${
                        roleMode === 'guru'
                          ? 'text-teal-700 hover:text-teal-950'
                          : 'text-indigo-700 hover:text-indigo-950'
                      }`}
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Kembali ke Login {roleMode === 'guru' ? 'Guru' : 'Murid'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* =============================================================== */}
              {/* FORGOT PASSWORD VIEW                                            */}
              {/* =============================================================== */}
              {authView === 'forgot' && (
                <form onSubmit={handleForgotSubmit} noValidate className="space-y-4 text-xs">
                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-slate-900 font-medium leading-relaxed">
                    Masukkan alamat <strong>Email</strong> yang Anda gunakan saat registrasi. Kami akan mengirimkan tautan pemulihan password resmi melalui Firebase Authentication.
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-slate-900 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Email *</span>
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="contoh@sekolah.sch.id"
                      className="w-full min-h-[44px] rounded-xl border-2 border-indigo-100 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-60"
                  >
                    <KeyRound className="h-4 w-4" />
                    <span>
                      {isSubmitting ? 'MENGIRIM TAUTAN...' : 'KIRIM TAUTAN RESET PASSWORD'}
                    </span>
                  </button>

                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => navigateAuthView('login')}
                      className="font-black text-indigo-700 hover:text-indigo-900 underline inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Kembali ke Halaman Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateAuthView('register')}
                      className="font-bold text-slate-700 hover:text-slate-950 underline"
                    >
                      Buat Akun Baru
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Developer Credit Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl pt-4 pb-1 border-t border-indigo-200/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <div className="font-medium text-slate-500 text-center sm:text-left">
          Kurikulum Merdeka · Fisika SMA Kelas X Fase E · Kinematika Gerak Lurus
        </div>
        <div className="font-semibold text-slate-800 text-center sm:text-right">
          Pengembang: <span className="font-extrabold text-indigo-900">Yeyen Atusman Mangidi, S.Pd., Gr</span>
        </div>
      </footer>

      {/* Automatic Transition Overlay: Masuk Ruang Belajar */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-950/75 backdrop-blur-md text-white p-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center max-w-sm p-6 rounded-3xl bg-white text-slate-900 border-2 border-indigo-300 shadow-2xl space-y-3"
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 flex items-center justify-center shadow-lg">
                <Atom className="h-7 w-7 text-white animate-spin" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Masuk Ruang Belajar ({roleMode === 'guru' ? 'Akun Guru' : 'Akun Murid'})...
              </h3>
              <p className="text-xs text-slate-700 font-medium">
                Menyinkronkan profil pengguna &amp; modul Kinematika GLB &amp; GLBB
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes moveGlb {
          0% { left: 0%; }
          100% { left: calc(100% - 28px); }
        }
        @keyframes moveGlbb {
          0% { left: 0%; }
          100% { left: calc(100% - 28px); }
        }
      `}</style>
    </div>
  );
};
