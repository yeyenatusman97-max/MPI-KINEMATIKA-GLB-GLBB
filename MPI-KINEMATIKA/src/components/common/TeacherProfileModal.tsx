import React, { useState, useEffect } from 'react';
import { GraduationCap, Save, X, CheckCircle, School, BookOpen, User } from 'lucide-react';
import { storage, TeacherProfile, DEFAULT_TEACHER_PROFILE } from '../../utils/storage';
import { sounds } from '../../utils/soundEffects';
import { updateUserDisplayNameInCloud } from '../../services/firebaseService';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: TeacherProfile) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<TeacherProfile>(storage.getTeacherProfile());
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setProfile(storage.getTeacherProfile());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    const updated = storage.saveTeacherProfile(profile);
    if (updated.name?.trim()) {
      updateUserDisplayNameInCloud(updated.name.trim()).catch(() => {});
    }
    setIsSaved(true);
    if (onProfileUpdated) onProfileUpdated(updated);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const handleResetDefault = () => {
    sounds.playClick();
    setProfile(DEFAULT_TEACHER_PROFILE);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-fadeIn">
      <div 
        className="w-full max-w-md rounded-3xl bg-white border-2 border-indigo-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-sky-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <GraduationCap className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                Profil Guru: {profile.name || 'Guru Pengampu'}
              </h3>
              <p className="text-[11px] text-sky-100 font-medium">
                Terintegrasi otomatis ke Lembar LKPD &amp; Rapor Belajar
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="rounded-xl p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Info Banner */}
          <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 leading-relaxed">
            Perubahan nama dan data guru di sini akan <strong>langsung tampil</strong> pada kolom tanda tangan pembimbing di <strong>LKPD Praktikum</strong> dan tanda tangan resmi pada <strong>Rapor Belajar Murid</strong>.
          </div>

          {/* Nama Guru Lengkap & Gelar */}
          <div className="space-y-1">
            <label className="font-black text-slate-800 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-600" />
              <span>Nama Lengkap Guru (dengan gelar):</span>
            </label>
            <input 
              type="text"
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Contoh: Dra. Hj. Siti Nurhaliza, M.Pd."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          {/* NIP / NUPTK */}
          <div className="space-y-1">
            <label className="font-black text-slate-800 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
              <span>NIP / NUPTK:</span>
            </label>
            <input 
              type="text"
              value={profile.nip}
              onChange={(e) => setProfile({ ...profile, nip: e.target.value })}
              placeholder="Contoh: 19780514 200312 2 001"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          {/* Nama Sekolah */}
          <div className="space-y-1">
            <label className="font-black text-slate-800 flex items-center gap-1.5">
              <School className="h-3.5 w-3.5 text-indigo-600" />
              <span>Nama Sekolah / Satuan Pendidikan:</span>
            </label>
            <input 
              type="text"
              value={profile.school}
              onChange={(e) => setProfile({ ...profile, school: e.target.value })}
              placeholder="Contoh: SMA Negeri 1 Fisika Merdeka"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          {/* Mata Pelajaran */}
          <div className="space-y-1">
            <label className="font-black text-slate-800 block">
              Mata Pelajaran &amp; Fase:
            </label>
            <input 
              type="text"
              value={profile.subject}
              onChange={(e) => setProfile({ ...profile, subject: e.target.value })}
              placeholder="Contoh: Fisika Kelas X Fase E"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition"
            >
              Atur Ulang Bawaan
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>

              <button
                type="submit"
                className="btn-3d-cyan flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white shadow-md"
              >
                {isSaved ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-300" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
