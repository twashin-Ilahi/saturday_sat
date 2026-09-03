import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import BluebookTestView from './components/BluebookTestView';
import ErrorLogView from './components/ErrorLogView';
import AuthView from './components/AuthView';
import SettingsModal from './components/SettingsModal';
import { ALL_QUESTIONS } from './data/questions';
import { 
  loadProgress, 
  saveProgress, 
  resetAllProgress, 
  exportProgressAsJson, 
  parseImportJson,
  formatTime
} from './utils/storage';
import { supabase, signOut } from './utils/supabase';
import { syncLocalToCloud, fetchCloudProgress } from './utils/cloudSync';

// Helper to determine the exact active view, question index, and mode across page refreshes
const loadPersistedRoute = () => {
  if (typeof window === 'undefined') {
    return { view: 'dashboard', mode: 'normal', index: 0, serialSubset: [], serialIndex: 0 };
  }

  const hash = window.location.hash || '';
  let fromHash = null;

  if (hash.startsWith('#/practice') || hash.startsWith('#practice')) {
    const query = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(query);
    const q = parseInt(params.get('q'), 10);
    fromHash = {
      view: 'practice',
      mode: 'normal',
      index: !isNaN(q) && q > 0 ? q - 1 : undefined,
    };
  } else if (hash.startsWith('#/drill') || hash.startsWith('#drill')) {
    const query = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(query);
    const q = parseInt(params.get('q'), 10);
    fromHash = {
      view: 'practice',
      mode: 'serial-error',
      serialIndex: !isNaN(q) && q > 0 ? q - 1 : 0,
    };
  } else if (hash.startsWith('#/error-log') || hash.startsWith('#error-log')) {
    fromHash = { view: 'error-log', mode: 'normal' };
  } else if (hash.startsWith('#/dashboard') || hash.startsWith('#dashboard')) {
    fromHash = { view: 'dashboard', mode: 'normal' };
  }

  let saved = null;
  try {
    const raw = localStorage.getItem('sat_persisted_route');
    if (raw) saved = JSON.parse(raw);
  } catch (e) {}

  if (fromHash) {
    return {
      view: fromHash.view,
      mode: fromHash.mode || saved?.mode || 'normal',
      index: fromHash.index !== undefined ? fromHash.index : (saved?.index ?? 0),
      serialSubset: saved?.serialSubset || [],
      serialIndex: fromHash.serialIndex !== undefined ? fromHash.serialIndex : (saved?.serialIndex ?? 0),
    };
  }

  if (saved && saved.view) {
    return saved;
  }

  return { view: 'dashboard', mode: 'normal', index: 0, serialSubset: [], serialIndex: 0 };
};

export default function App() {
  const [initialRoute] = useState(() => loadPersistedRoute());
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [currentView, setCurrentView] = useState(() => initialRoute.view);
  const [practiceMode, setPracticeMode] = useState(() => initialRoute.mode);
  const [serialErrorSubset, setSerialErrorSubset] = useState(() => initialRoute.serialSubset || []);
  const [serialCurrentIndex, setSerialCurrentIndex] = useState(() => initialRoute.serialIndex || 0);
  const [state, setState] = useState(() => {
    const loaded = loadProgress(ALL_QUESTIONS.length);
    if (typeof initialRoute.index === 'number' && initialRoute.view === 'practice' && initialRoute.mode === 'normal') {
      loaded.currentIndex = Math.max(0, Math.min(initialRoute.index, ALL_QUESTIONS.length - 1));
    }
    return loaded;
  });

  const handleApplyCloudProgress = (cloudData) => {
    if (!cloudData) return;
    setState(prev => {
      const qLen = ALL_QUESTIONS.length;
      let newSelections = Array.isArray(cloudData.selectedAnswers) ? [...cloudData.selectedAnswers] : [...prev.selectedAnswers];
      while (newSelections.length < qLen) newSelections.push(null);

      let newChecked = Array.isArray(cloudData.checkedStatus) ? [...cloudData.checkedStatus] : [...prev.checkedStatus];
      while (newChecked.length < qLen) newChecked.push(false);

      let newFlagged = Array.isArray(cloudData.flaggedStatus) ? [...cloudData.flaggedStatus] : (prev.flaggedStatus || new Array(qLen).fill(false));
      while (newFlagged.length < qLen) newFlagged.push(false);

      let newEliminated = Array.isArray(cloudData.eliminatedStatus) ? [...cloudData.eliminatedStatus] : (prev.eliminatedStatus || Array.from({ length: qLen }, () => []));
      while (newEliminated.length < qLen) newEliminated.push([]);

      let newErrors = Array.isArray(cloudData.errorLog) ? [...cloudData.errorLog] : prev.errorLog;
      let newIdx = typeof cloudData.currentIndex === 'number' && cloudData.currentIndex >= 0 && cloudData.currentIndex < qLen 
        ? cloudData.currentIndex 
        : prev.currentIndex;

      return {
        ...prev,
        currentIndex: newIdx,
        selectedAnswers: newSelections,
        checkedStatus: newChecked,
        flaggedStatus: newFlagged,
        eliminatedStatus: newEliminated,
        errorLog: newErrors,
        autoStartEnabled: typeof cloudData.autoStartEnabled === 'boolean' ? cloudData.autoStartEnabled : prev.autoStartEnabled,
      };
    });
  };

  // Initialize Supabase Auth & Session listener
  useEffect(() => {
    // Check if recovery link is in URL hash
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsPasswordReset(true);
    }

    const initUserSession = async (sessionUser) => {
      setUser(sessionUser);
      try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}

      // 1. Load local progress while keeping refreshed question index if active
      const localData = loadProgress(ALL_QUESTIONS.length, sessionUser.id);
      if (typeof initialRoute.index === 'number' && initialRoute.view === 'practice' && initialRoute.mode === 'normal') {
        localData.currentIndex = Math.max(0, Math.min(initialRoute.index, ALL_QUESTIONS.length - 1));
      }
      setState(localData);

      // 2. Automatically restore from cloud if cloud has data
      try {
        const cloudData = await fetchCloudProgress(sessionUser);
        if (cloudData) {
          const localAnswered = localData.checkedStatus?.filter(Boolean).length || 0;
          const cloudAnswered = Array.isArray(cloudData.checkedStatus) 
            ? cloudData.checkedStatus.filter(Boolean).length 
            : 0;

          if (cloudAnswered >= localAnswered && cloudAnswered > 0) {
            handleApplyCloudProgress(cloudData);
            setCloudSyncStatus('synced');
          } else if (localAnswered > cloudAnswered) {
            // Local data is newer, auto-upload to cloud
            setCloudSyncStatus('syncing');
            syncLocalToCloud(localData, sessionUser)
              .then(() => setCloudSyncStatus('synced'))
              .catch(() => setCloudSyncStatus('error'));
          }
        }
      } catch (err) {
        console.warn("Could not check initial cloud backup:", err);
      }
    };

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user) {
        initUserSession(session.user);
      } else {
        const isGuestSaved = localStorage.getItem('sat_guest_mode') === 'true';
        if (isGuestSaved) {
          setUser({ isGuest: true, email: 'Guest User' });
          setState(loadProgress(ALL_QUESTIONS.length, null));
        }
      }
      setAuthLoading(false);
    }).catch(err => {
      console.warn("Session check error:", err);
      const isGuestSaved = localStorage.getItem('sat_guest_mode') === 'true';
      if (isGuestSaved) {
        setUser({ isGuest: true, email: 'Guest User' });
        setState(loadProgress(ALL_QUESTIONS.length, null));
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(true);
        setUser(session?.user || null);
      } else if (event === 'SIGNED_IN') {
        if (session?.user) {
          initUserSession(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsPasswordReset(false);
        setCloudSyncStatus('idle');
        try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}
        setState(loadProgress(ALL_QUESTIONS.length, null));
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user || null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sync state to localStorage and automatically back up to Supabase cloud
  useEffect(() => {
    if (!authLoading && user) {
      const scopeId = user.isGuest ? null : user.id;
      saveProgress(state, scopeId);

      // Automatic background backup for email-authenticated accounts
      if (!user.isGuest && user.id) {
        setCloudSyncStatus('syncing');

        const timer = setTimeout(async () => {
          try {
            const res = await syncLocalToCloud(state, user);
            if (res?.success) {
              setCloudSyncStatus('synced');
            }
          } catch (err) {
            console.warn("Auto-backup to cloud failed:", err);
            setCloudSyncStatus('error');
          }
        }, 1500); // 1.5s debounce to batch rapid interactions

        return () => clearTimeout(timer);
      } else {
        setCloudSyncStatus('idle');
      }
    }
  }, [state, user, authLoading]);

  // Helper to parse route from URL hash
  const parseRouteFromUrl = () => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash || '';
    if (hash.startsWith('#/practice') || hash.startsWith('#practice')) {
      const query = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(query);
      const q = parseInt(params.get('q'), 10);
      return {
        view: 'practice',
        mode: 'normal',
        index: !isNaN(q) && q > 0 ? q - 1 : 0,
      };
    }
    if (hash.startsWith('#/drill') || hash.startsWith('#drill')) {
      const query = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(query);
      const q = parseInt(params.get('q'), 10);
      return {
        view: 'practice',
        mode: 'serial-error',
        index: !isNaN(q) && q > 0 ? q - 1 : 0,
      };
    }
    if (hash.startsWith('#/error-log') || hash.startsWith('#error-log')) {
      return { view: 'error-log', mode: 'normal' };
    }
    if (hash.startsWith('#/dashboard') || hash.startsWith('#dashboard')) {
      return { view: 'dashboard', mode: 'normal' };
    }
    return null;
  };

  const pushHistoryState = (view, mode = 'normal', index = null, replace = false) => {
    if (typeof window === 'undefined') return;

    let hash = '#/dashboard';
    if (view === 'practice') {
      const targetIdx = index !== null ? index : (mode === 'serial-error' ? serialCurrentIndex : state.currentIndex);
      hash = mode === 'serial-error' ? `#/drill?q=${targetIdx + 1}` : `#/practice?q=${targetIdx + 1}`;
    } else if (view === 'error-log') {
      hash = '#/error-log';
    }

    const historyState = {
      view,
      mode,
      index: index !== null ? index : (mode === 'serial-error' ? serialCurrentIndex : state.currentIndex),
      serialSubset: mode === 'serial-error' ? serialErrorSubset : [],
      serialIndex: mode === 'serial-error' ? (index !== null ? index : serialCurrentIndex) : 0,
    };

    if (replace) {
      window.history.replaceState(historyState, '', hash);
    } else {
      window.history.pushState(historyState, '', hash);
    }

    try {
      localStorage.setItem('sat_persisted_route', JSON.stringify(historyState));
    } catch (e) {}
  };

  // Persist current active view, mode, and index whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('sat_persisted_route', JSON.stringify({
        view: currentView,
        mode: practiceMode,
        index: state.currentIndex,
        serialSubset: serialErrorSubset,
        serialIndex: serialCurrentIndex,
      }));
    } catch (e) {}
  }, [currentView, practiceMode, state.currentIndex, serialErrorSubset, serialCurrentIndex]);

  // Synchronize browser history and handle Back / Forward buttons
  useEffect(() => {
    // Initial route sync
    const route = loadPersistedRoute();
    if (route) {
      let hash = '#/dashboard';
      if (route.view === 'practice') {
        const qNum = (route.mode === 'serial-error' ? (route.serialIndex || 0) : (route.index || 0)) + 1;
        hash = route.mode === 'serial-error' ? `#/drill?q=${qNum}` : `#/practice?q=${qNum}`;
      } else if (route.view === 'error-log') {
        hash = '#/error-log';
      }

      window.history.replaceState({
        view: route.view,
        mode: route.mode,
        index: route.index,
        serialSubset: route.serialSubset,
        serialIndex: route.serialIndex
      }, '', hash);
    }

    const handlePopState = (event) => {
      const currentRoute = event.state || loadPersistedRoute();
      if (currentRoute && currentRoute.view) {
        setCurrentView(currentRoute.view);
        const mode = currentRoute.mode || 'normal';
        setPracticeMode(mode);

        if (Array.isArray(currentRoute.serialSubset) && currentRoute.serialSubset.length > 0) {
          setSerialErrorSubset(currentRoute.serialSubset);
        }

        if (typeof currentRoute.index === 'number') {
          if (mode === 'serial-error') {
            setSerialCurrentIndex(currentRoute.serialIndex || 0);
          } else {
            setState(prev => ({
              ...prev,
              currentIndex: Math.max(0, Math.min(currentRoute.index, ALL_QUESTIONS.length - 1))
            }));
          }
        }
      } else {
        setCurrentView('dashboard');
        setPracticeMode('normal');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept Backspace when outside inputs so Chrome doesn't exit to Home page
  useEffect(() => {
    const handleGlobalBackspace = (e) => {
      if (e.key === 'Backspace') {
        const target = e.target;
        const isEditable = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        );

        if (!isEditable) {
          // Prevent browser from navigating away to Chrome home page
          e.preventDefault();

          if (currentView === 'practice') {
            if (practiceMode === 'serial-error') {
              if (serialCurrentIndex > 0) {
                setSerialCurrentIndex(prev => {
                  const nextIdx = prev - 1;
                  pushHistoryState('practice', 'serial-error', nextIdx);
                  return nextIdx;
                });
              } else {
                handleReturnFromErrorDrill();
              }
            } else {
              if (state.currentIndex > 0) {
                handleNavigate(state.currentIndex - 1);
              } else {
                handleReturnToDashboard();
              }
            }
          } else if (currentView === 'error-log') {
            handleReturnToDashboard();
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalBackspace);
    return () => window.removeEventListener('keydown', handleGlobalBackspace);
  }, [currentView, practiceMode, state.currentIndex, serialCurrentIndex]);

  const handleContinueAsGuest = () => {
    try {
      localStorage.setItem('sat_guest_mode', 'true');
    } catch (e) {}
    setUser({ isGuest: true, email: 'Guest User' });
    setState(loadProgress(ALL_QUESTIONS.length, null));
  };

  const handleSignOut = async () => {
    if (user?.isGuest) {
      try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}
      setUser(null);
      setCurrentView('dashboard');
      return;
    }
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}
    setUser(null);
    setIsPasswordReset(false);
    setCurrentView('dashboard');
  };

  const handleOpenSettings = () => setShowSettingsModal(true);
  const handleCloseSettings = () => setShowSettingsModal(false);

  const handleSelectChoice = (questionIndex, choiceIndex) => {
    setState(prev => {
      const newSelections = [...prev.selectedAnswers];
      newSelections[questionIndex] = choiceIndex;
      return { ...prev, selectedAnswers: newSelections };
    });
  };

  const handleCheckAnswer = (questionIndex, timerSeconds) => {
    setState(prev => {
      const newChecked = [...prev.checkedStatus];
      newChecked[questionIndex] = true;

      const q = ALL_QUESTIONS[questionIndex];
      const selected = prev.selectedAnswers[questionIndex];
      const newErrors = [...prev.errorLog];

      if (selected !== q.answer) {
        const errorRecord = {
          id: q.id,
          qIndex: questionIndex + 1,
          originalIndex: questionIndex,
          domain: q.domain,
          skill: q.skill,
          category: q.category,
          difficulty: q.difficulty,
          passage: q.passage,
          prompt: q.prompt,
          choices: q.choices,
          yourAnswerIndex: selected,
          yourAnswer: q.choices[selected] || "None",
          correctAnswerIndex: q.answer,
          correctAnswer: q.choices[q.answer],
          rationale: q.rationale,
          timeSpent: formatTime(timerSeconds),
          timestamp: new Date().toISOString(),
          status: 'unresolved'
        };
        const existingIdx = newErrors.findIndex(e => e.id === q.id);
        if (existingIdx === -1) {
          newErrors.push(errorRecord);
        } else {
          newErrors[existingIdx] = { ...errorRecord, status: 'unresolved' };
        }
      } else {
        // If question was previously in error log and answered correctly on retry, mark as mastered
        const existingIdx = newErrors.findIndex(e => e.id === q.id);
        if (existingIdx !== -1) {
          newErrors[existingIdx] = {
            ...newErrors[existingIdx],
            status: 'mastered'
          };
        }
      }

      return {
        ...prev,
        checkedStatus: newChecked,
        errorLog: newErrors
      };
    });
  };

  const handleNavigate = (newIndex, shouldPush = true) => {
    if (newIndex >= 0 && newIndex < ALL_QUESTIONS.length) {
      setState(prev => ({ ...prev, currentIndex: newIndex }));
      if (shouldPush) {
        pushHistoryState('practice', 'normal', newIndex);
      }
    }
  };

  const handleToggleAutoStart = (val) => {
    setState(prev => ({ ...prev, autoStartEnabled: val }));
  };

  const handleReset = () => {
    const blank = resetAllProgress(ALL_QUESTIONS.length);
    setState(blank);
  };

  const handleExport = () => {
    exportProgressAsJson(state);
  };

  const handleImport = (jsonString) => {
    const imported = parseImportJson(jsonString, ALL_QUESTIONS.length);
    setState(prev => ({
      ...prev,
      ...imported
    }));
  };

  const handleStartPractice = (index = 0) => {
    setPracticeMode('normal');
    setState(prev => ({ ...prev, currentIndex: index }));
    pushHistoryState('practice', 'normal', index);
    setCurrentView('practice');
  };

  const handleJumpToQuestion = (targetIndex) => {
    setPracticeMode('normal');
    setState(prev => ({ ...prev, currentIndex: targetIndex }));
    pushHistoryState('practice', 'normal', targetIndex);
    setCurrentView('practice');
  };

  const handleOpenErrorLog = () => {
    pushHistoryState('error-log');
    setCurrentView('error-log');
  };

  const handleStartSerialErrorDrill = (errorList) => {
    if (!errorList || errorList.length === 0) return;
    const indices = errorList.map(err => {
      if (err.originalIndex !== undefined) return err.originalIndex;
      const foundIdx = ALL_QUESTIONS.findIndex(q => q.id === err.id);
      return foundIdx !== -1 ? foundIdx : (err.qIndex - 1);
    });
    setSerialErrorSubset(indices);
    setSerialCurrentIndex(0);
    setPracticeMode('serial-error');
    pushHistoryState('practice', 'serial-error', 0);
    setCurrentView('practice');
  };

  const handleRemoveError = (questionId) => {
    setState(prev => ({
      ...prev,
      errorLog: prev.errorLog.filter(e => e.id !== questionId)
    }));
  };

  const handleMarkMastered = (questionId) => {
    setState(prev => ({
      ...prev,
      errorLog: prev.errorLog.map(e => {
        if (e.id === questionId) {
          return {
            ...e,
            status: e.status === 'mastered' ? 'unresolved' : 'mastered'
          };
        }
        return e;
      })
    }));
  };

  const handleToggleFlag = (questionIndex) => {
    setState(prev => {
      const newFlagged = [...(prev.flaggedStatus || new Array(ALL_QUESTIONS.length).fill(false))];
      newFlagged[questionIndex] = !newFlagged[questionIndex];
      return { ...prev, flaggedStatus: newFlagged };
    });
  };

  const handleToggleEliminate = (questionIndex, choiceIndex) => {
    setState(prev => {
      const currentElim = prev.eliminatedStatus || Array.from({ length: ALL_QUESTIONS.length }, () => []);
      const qElim = [...(currentElim[questionIndex] || [])];
      const foundIdx = qElim.indexOf(choiceIndex);
      if (foundIdx > -1) {
        qElim.splice(foundIdx, 1);
      } else {
        qElim.push(choiceIndex);
      }
      const newAllElim = [...currentElim];
      newAllElim[questionIndex] = qElim;
      return { ...prev, eliminatedStatus: newAllElim };
    });
  };

  const handleReturnToDashboard = () => {
    setPracticeMode('normal');
    pushHistoryState('dashboard');
    setCurrentView('dashboard');
  };

  const handleReturnFromErrorDrill = () => {
    setPracticeMode('normal');
    pushHistoryState('error-log');
    setCurrentView('error-log');
  };

  // Loading screen while verifying initial session
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1e293b',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #005a9c',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'appSpin 0.8s linear infinite'
        }} />
        <p style={{ marginTop: '16px', fontSize: '0.92rem', fontWeight: 600, color: '#475569' }}>
          Loading Digital SAT Practice Platform...
        </p>
        <style>{`
          @keyframes appSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Password reset recovery mode
  if (isPasswordReset) {
    return (
      <AuthView
        initialMode="reset"
        onAuthSuccess={() => {
          setIsPasswordReset(false);
          if (typeof window !== 'undefined' && window.history.replaceState) {
            window.history.replaceState(null, null, window.location.pathname);
          }
        }}
      />
    );
  }

  // Authentication gate: User must be signed in or enter as guest
  if (!user) {
    return (
      <AuthView
        initialMode="login"
        onContinueAsGuest={handleContinueAsGuest}
        onAuthSuccess={(authenticatedUser) => {
          try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}
          setUser(authenticatedUser);
          if (authenticatedUser) {
            setState(loadProgress(ALL_QUESTIONS.length, authenticatedUser.id));
          }
        }}
      />
    );
  }

  // If in practice view:
  if (currentView === 'practice') {
    if (practiceMode === 'serial-error' && serialErrorSubset.length > 0) {
      // Serial error drill mode: map questions & state to the error subset
      const activeQuestions = serialErrorSubset.map(idx => ALL_QUESTIONS[idx]);
      const currentOrigIdx = serialErrorSubset[serialCurrentIndex] || 0;

      return (
        <>
          <BluebookTestView
            questions={activeQuestions}
            currentIndex={serialCurrentIndex}
            selectedAnswers={serialErrorSubset.map(idx => state.selectedAnswers[idx])}
            checkedStatus={serialErrorSubset.map(idx => state.checkedStatus[idx])}
            flaggedStatus={serialErrorSubset.map(idx => (state.flaggedStatus || [])[idx])}
            eliminatedStatus={serialErrorSubset.map(idx => (state.eliminatedStatus || [])[idx])}
            errorLog={state.errorLog}
            autoStartEnabled={state.autoStartEnabled}
            practiceMode="serial-error"
            user={user}
            cloudSyncStatus={cloudSyncStatus}
            onSignOut={handleSignOut}
            onOpenSettings={handleOpenSettings}
            onOpenErrorLog={handleOpenErrorLog}
            onReturnFromErrorDrill={handleReturnFromErrorDrill}
            onSelectChoice={(subIdx, choiceIdx) => {
              const origIdx = serialErrorSubset[subIdx];
              handleSelectChoice(origIdx, choiceIdx);
            }}
            onCheckAnswer={(subIdx, timerSeconds) => {
              const origIdx = serialErrorSubset[subIdx];
              handleCheckAnswer(origIdx, timerSeconds);
            }}
            onToggleFlag={(subIdx) => {
              const origIdx = serialErrorSubset[subIdx];
              handleToggleFlag(origIdx);
            }}
            onToggleEliminate={(subIdx, choiceIdx) => {
              const origIdx = serialErrorSubset[subIdx];
              handleToggleEliminate(origIdx, choiceIdx);
            }}
            onNavigate={(newSubIndex) => {
              if (newSubIndex >= 0 && newSubIndex < serialErrorSubset.length) {
                setSerialCurrentIndex(newSubIndex);
                pushHistoryState('practice', 'serial-error', newSubIndex);
              }
            }}
            onToggleAutoStart={handleToggleAutoStart}
            onReset={handleReset}
            onExport={handleExport}
            onImport={handleImport}
            onReturnToDashboard={handleReturnToDashboard}
          />
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={handleCloseSettings}
            user={user}
            cloudSyncStatus={cloudSyncStatus}
            currentState={state}
            totalQuestions={ALL_QUESTIONS.length}
            onApplyCloudProgress={handleApplyCloudProgress}
            onResetProgress={handleReset}
            onExportProgress={handleExport}
            onImportProgress={handleImport}
            onOpenAuth={() => {
              setUser(null);
              try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}
            }}
          />
        </>
      );
    }

    // Normal practice mode
    return (
      <>
        <BluebookTestView
          questions={ALL_QUESTIONS}
          currentIndex={state.currentIndex}
          selectedAnswers={state.selectedAnswers}
          checkedStatus={state.checkedStatus}
          flaggedStatus={state.flaggedStatus || []}
          eliminatedStatus={state.eliminatedStatus || []}
          errorLog={state.errorLog}
          autoStartEnabled={state.autoStartEnabled}
          practiceMode="normal"
          user={user}
          cloudSyncStatus={cloudSyncStatus}
          onSignOut={handleSignOut}
          onOpenSettings={handleOpenSettings}
          onOpenErrorLog={handleOpenErrorLog}
          onSelectChoice={handleSelectChoice}
          onCheckAnswer={handleCheckAnswer}
          onToggleFlag={handleToggleFlag}
          onToggleEliminate={handleToggleEliminate}
          onNavigate={handleNavigate}
          onToggleAutoStart={handleToggleAutoStart}
          onReset={handleReset}
          onExport={handleExport}
          onImport={handleImport}
          onReturnToDashboard={handleReturnToDashboard}
        />
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={handleCloseSettings}
          user={user}
          cloudSyncStatus={cloudSyncStatus}
          currentState={state}
          totalQuestions={ALL_QUESTIONS.length}
          onApplyCloudProgress={handleApplyCloudProgress}
          onResetProgress={handleReset}
          onExportProgress={handleExport}
          onImportProgress={handleImport}
          onOpenAuth={() => {
            setUser(null);
            try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}
          }}
        />
      </>
    );
  }

  // If in dedicated Error Log Directory view:
  if (currentView === 'error-log') {
    return (
      <>
        <ErrorLogView
          errorLog={state.errorLog}
          allQuestions={ALL_QUESTIONS}
          user={user}
          cloudSyncStatus={cloudSyncStatus}
          onSignOut={handleSignOut}
          onOpenSettings={handleOpenSettings}
          onReturnToDashboard={handleReturnToDashboard}
          onStartSerialErrorDrill={handleStartSerialErrorDrill}
          onJumpToQuestion={handleJumpToQuestion}
          onRemoveError={handleRemoveError}
          onMarkMastered={handleMarkMastered}
        />
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={handleCloseSettings}
          user={user}
          cloudSyncStatus={cloudSyncStatus}
          currentState={state}
          totalQuestions={ALL_QUESTIONS.length}
          onApplyCloudProgress={handleApplyCloudProgress}
          onResetProgress={handleReset}
          onExportProgress={handleExport}
          onImportProgress={handleImport}
          onOpenAuth={() => {
            setUser(null);
            try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}
          }}
        />
      </>
    );
  }

  // Default: Dashboard
  return (
    <>
      <Dashboard
        questions={ALL_QUESTIONS}
        currentIndex={state.currentIndex}
        selectedAnswers={state.selectedAnswers}
        checkedStatus={state.checkedStatus}
        errorLog={state.errorLog}
        user={user}
        cloudSyncStatus={cloudSyncStatus}
        onSignOut={handleSignOut}
        onOpenSettings={handleOpenSettings}
        onStartPractice={handleStartPractice}
        onJumpToQuestion={handleJumpToQuestion}
        onOpenErrorLog={handleOpenErrorLog}
        onStartSerialErrorDrill={handleStartSerialErrorDrill}
        onReset={handleReset}
        onExport={handleExport}
        onImport={handleImport}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={handleCloseSettings}
        user={user}
        cloudSyncStatus={cloudSyncStatus}
        currentState={state}
        totalQuestions={ALL_QUESTIONS.length}
        onApplyCloudProgress={handleApplyCloudProgress}
        onResetProgress={handleReset}
        onExportProgress={handleExport}
        onImportProgress={handleImport}
        onOpenAuth={() => {
          setUser(null);
          try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}
        }}
      />
    </>
  );
}


