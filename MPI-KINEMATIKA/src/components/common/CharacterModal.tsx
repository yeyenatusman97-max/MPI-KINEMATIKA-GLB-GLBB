import React from 'react';
import { X, Award, Sparkles, Check } from 'lucide-react';
import { CharacterBadge } from '../../types/physics';
import { sounds } from '../../utils/soundEffects';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharId: string;
  userLevel: number;
  onSelectCharacter: (id: string) => void;
}

export const CHARACTERS: CharacterBadge[] = [
  {
    id: 'galileo',
    name: 'Prof. Galileo',
    title: 'Master of Constant Speed',
    specialty: 'Spesialis Gerak Lurus Beraturan (GLB)',
    avatarEmoji: '⚡',
    color: 'text-sky-600',
    bgGrad: 'bg-sky-50 border-sky-300',
    unlockedLevel: 1,
  },
  {
    id: 'newton',
    name: 'Dr. Isaac Newton',
    title: 'Lord of Acceleration',
    specialty: 'Spesialis Gerak Lurus Berubah Beraturan (GLBB)',
    avatarEmoji: '🍎',
    color: 'text-orange-600',
    bgGrad: 'bg-orange-50 border-orange-300',
    unlockedLevel: 1,
  },
  {
    id: 'curie',
    name: 'Marie Curie',
    title: 'Precision Experimentalist',
    specialty: 'Akurasi Sensor Optik & Tabel Telemetri',
    avatarEmoji: '🔬',
    color: 'text-purple-600',
    bgGrad: 'bg-purple-50 border-purple-300',
    unlockedLevel: 2,
  },
  {
    id: 'einstein',
    name: 'Albert Einstein',
    title: 'Spacetime Explorer',
    specialty: 'Analisis Gradien & Relativitas Gerak',
    avatarEmoji: '🌌',
    color: 'text-emerald-600',
    bgGrad: 'bg-emerald-50 border-emerald-300',
    unlockedLevel: 3,
  },
  {
    id: 'robocart',
    name: 'Robo-Kinetic X1',
    title: 'Autonomous Lab Drone',
    specialty: 'Simulasi 3D & Kalkulasi Numerik Otomatis',
    avatarEmoji: '🤖',
    color: 'text-rose-600',
    bgGrad: 'bg-rose-50 border-rose-300',
    unlockedLevel: 4,
  },
];

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  selectedCharId,
  userLevel,
  onSelectCharacter,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-sky-300 bg-white p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            <div>
              <h3 className="text-base font-black text-slate-900">Pilih Avatar & Karakter Fisika</h3>
              <p className="text-xs text-slate-500">Tingkatkan Level & XP untuk membuka avatar legendaris lainnya!</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {CHARACTERS.map((char) => {
            const isSelected = selectedCharId === char.id;
            const isUnlocked = userLevel >= char.unlockedLevel;

            return (
              <div
                key={char.id}
                onClick={() => {
                  if (isUnlocked) {
                    sounds.playSuccess();
                    onSelectCharacter(char.id);
                  } else {
                    sounds.playError();
                  }
                }}
                className={`relative rounded-2xl border-2 p-4 transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? `${char.bgGrad} shadow-md ring-4 ring-sky-300`
                    : isUnlocked
                    ? 'bg-slate-50 border-slate-200 hover:border-sky-300 hover:bg-white'
                    : 'bg-slate-100/60 border-slate-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-2 border-slate-200 text-2xl shadow-sm">
                    {char.avatarEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{char.name}</h4>
                      <span className={`text-[10px] font-mono font-bold ${char.color}`}>
                        {char.title}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{char.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isUnlocked ? (
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl">
                      Terkunci (Level {char.unlockedLevel})
                    </span>
                  ) : isSelected ? (
                    <span className="flex items-center gap-1 text-xs font-black text-sky-800 bg-sky-100 border border-sky-400 px-3 py-1 rounded-xl">
                      <Check className="h-3.5 w-3.5" /> Terpilih
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-600 hover:text-sky-700">
                      Pilih
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="btn-3d-cyan w-full py-2.5 text-xs font-black text-white rounded-xl"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
