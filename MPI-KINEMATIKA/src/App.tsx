/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Atom } from 'lucide-react';
import { ActiveSession, UserProgress } from './types/physics';
import { storage } from './utils/storage';
import { Footer } from './components/common/Footer';
import { SplashScreen } from './components/common/SplashScreen';
import { Welcome3DIntro } from './components/common/Welcome3DIntro';
import { ValidationModal } from './components/common/ValidationModal';
import { HelpGuideModal } from './components/common/HelpGuideModal';
import { CharacterModal } from './components/common/CharacterModal';
import { FloatingNav } from './components/common/FloatingNav';
import { Dashboard } from './components/dashboard/Dashboard';
import { DigitalModule } from './components/module/DigitalModule';
import { VirtualLab3D } from './components/virtuallab/VirtualLab3D';
import { SmartPresentation } from './components/presentation/SmartPresentation';
import { MotionGraphAnalyzer } from './components/graph/MotionGraphAnalyzer';
import { PhysicsChallenge } from './components/challenge/PhysicsChallenge';
import { EvaluationCenter } from './components/evaluation/EvaluationCenter';
import { ResourceCenter } from './components/resources/ResourceCenter';
import { KinematicsPhysicsBackground } from './components/common/KinematicsPhysicsBackground';
import {
  auth,
  subscribeFirebaseAuth,
  subscribeSchoolCloudData,
  ensureSchoolMembershipInCloud,
  isFirebaseUserVerified,
  isAuthTransitionInProgress,
  restoreSessionFromFirebaseUser,
  logoutFromFirebase,
} from './services/firebaseService';

export default function App() {
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(() =>
    storage.getActiveSession()
  );
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [userProgress, setUserProgress] = useState<UserProgress>(storage.getProgress());
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [firebaseReadyUid, setFirebaseReadyUid] = useState<string | null>(null);
  const initialBootResolvedRef = useRef(false);
  const handleWelcomeComplete = useCallback(() => {
    setShowWelcomeIntro(false);
  }, []);

  useEffect(() => {
    setUserProgress(storage.getProgress());
    let mounted = true;

    const unsubAuth = subscribeFirebaseAuth(async (user) => {
      if (!mounted) return;
      if (isAuthTransitionInProgress()) {
        return;
      }

      const verified = Boolean(
        user &&
          (user.emailVerified ||
            user.providerData.some((p) => p.providerId === 'password'))
      );

      if (user && verified) {
        setFirebaseReadyUid(user.uid);
        try {
          const existingLocal = storage.getActiveSession();
          const restored = await restoreSessionFromFirebaseUser(user, existingLocal);
          if (!mounted) return;
          storage.setActiveSession(restored);
          setActiveSession(restored);
          setUserProgress(storage.getProgress());
          if (!initialBootResolvedRef.current) {
            setShowSplash(false);
          }
        } catch (err) {
          console.warn('Session restoration error:', err);
        }
      } else {
        setFirebaseReadyUid(null);
        storage.logout();
        setActiveSession(null);
        setShowSplash(true);
      }

      if (mounted) {
        initialBootResolvedRef.current = true;
        setAuthChecked(true);
      }
    });

    const onStorageSync = () => {
      setUserProgress(storage.getProgress());
      const latest = storage.getActiveSession();
      setActiveSession((prev) => {
        if (!latest && !prev) return prev;
        if (!latest || !prev) return latest;
        if (
          prev.accountId === latest.accountId &&
          prev.role === latest.role &&
          prev.displayName === latest.displayName &&
          prev.className === latest.className
        ) {
          return prev;
        }
        return latest;
      });
    };
    window.addEventListener('mpi-sync-updated', onStorageSync);
    window.addEventListener('storage', onStorageSync);
    return () => {
      mounted = false;
      unsubAuth();
      window.removeEventListener('mpi-sync-updated', onStorageSync);
      window.removeEventListener('storage', onStorageSync);
    };
  }, []);

  // Attach Firestore realtime listener only when auth & app session are ready
  useEffect(() => {
    if (!activeSession || !firebaseReadyUid || !isFirebaseUserVerified()) return;

    let unsubData = () => {};
    let cancelled = false;

    ensureSchoolMembershipInCloud(activeSession)
      .then(() => {
        if (cancelled) return;
        unsubData = subscribeSchoolCloudData(activeSession, {
          onLKPDs: (records) => {
            storage.mergeCloudLKPDs(records);
          },
          onQuizResults: (results) => {
            storage.mergeCloudQuizResults(results);
          },
          onStudentReports: (reports) => {
            storage.mergeCloudStudentReports(reports);
          },
          onReflections: (reflections) => {
            storage.mergeCloudReflections(reflections);
          },
        });
      })
      .catch((err) => {
        console.warn('Firestore school sync init skipped:', err);
      });

    return () => {
      cancelled = true;
      unsubData();
    };
  }, [activeSession, firebaseReadyUid]);

  const refreshProgress = () => {
    setUserProgress(storage.getProgress());
  };

  const handleSelectCharacter = (charId: string) => {
    storage.saveProgress({ selectedCharacter: charId });
    refreshProgress();
    setIsCharacterModalOpen(false);
  };

  const handleLoginSuccess = (session: ActiveSession) => {
    storage.setActiveSession(session);
    setActiveSession(session);
    setFirebaseReadyUid(auth.currentUser?.uid || session.accountId);
    setAuthChecked(true);
    refreshProgress();
    setShowSplash(false);
  };

  const handleSessionInvalidated = () => {
    storage.logout();
    setFirebaseReadyUid(null);
    setActiveSession(null);
  };

  const handleLogout = async () => {
    try {
      await logoutFromFirebase();
    } catch (err) {
      console.warn('Firebase signOut error:', err);
    }
    storage.logout();
    setFirebaseReadyUid(null);
    setActiveSession(null);
    setCurrentView('dashboard');
    setShowSplash(true);
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      <KinematicsPhysicsBackground />

      <AnimatePresence>
        {showWelcomeIntro && (
          <Welcome3DIntro
            key="welcome-3d-intro"
            isAppReady={authChecked}
            onComplete={handleWelcomeComplete}
          />
        )}
      </AnimatePresence>

      {!authChecked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="relative z-10 flex flex-col items-center gap-3 bg-white/95 border-2 border-sky-300 rounded-3xl px-8 py-6 shadow-xl">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md">
              <Atom className="h-6 w-6 text-white animate-spin" />
            </div>
            <p className="text-sm font-black text-slate-900">Memeriksa Sesi Autentikasi...</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            <SplashScreen
              onLoginSuccess={handleLoginSuccess}
              onSessionInvalidated={handleSessionInvalidated}
              activeSession={activeSession}
            />
          </motion.div>
        ) : (
          <motion.div
            key="app-body"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col w-full"
          >
            <FloatingNav
              currentView={currentView}
              onNavigate={(view) => {
                setCurrentView(view);
                refreshProgress();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <main className="flex-1 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{
                    duration: 0.32,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="w-full"
                >
                  {currentView === 'dashboard' && (
                    <Dashboard
                      progress={userProgress}
                      userRole={activeSession?.role || storage.getRole()}
                      activeSession={activeSession}
                      onNavigate={(view) => {
                        setCurrentView(view);
                        refreshProgress();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onOpenValidationModal={() => setIsValidationOpen(true)}
                      onOpenHelp={() => setIsHelpOpen(true)}
                      onOpenCharacterModal={() => setIsCharacterModalOpen(true)}
                      onRefreshProgress={refreshProgress}
                      onReturnToSplash={() => setShowSplash(true)}
                      onLogout={handleLogout}
                    />
                  )}

                  {currentView === 'module' && <DigitalModule />}

                  {currentView === 'virtuallab' && <VirtualLab3D />}

                  {currentView === 'presentation' && <SmartPresentation />}

                  {currentView === 'graph' && <MotionGraphAnalyzer />}

                  {currentView === 'challenge' && <PhysicsChallenge />}

                  {currentView === 'evaluation' && <EvaluationCenter />}

                  {currentView === 'resources' && <ResourceCenter />}
                </motion.div>
              </AnimatePresence>
            </main>

            <Footer />
          </motion.div>
        )}
        </AnimatePresence>
      )}

      <ValidationModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
      />

      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <CharacterModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        selectedCharId={userProgress.selectedCharacter || 'galileo'}
        userLevel={userProgress.level || 1}
        onSelectCharacter={handleSelectCharacter}
      />
    </div>
  );
}
