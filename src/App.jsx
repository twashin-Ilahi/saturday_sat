import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import BluebookTestView from './components/BluebookTestView';
import ErrorLogView from './components/ErrorLogView';
import AuthView from './components/AuthView';
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

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'practice' | 'error-log'
  const [practiceMode, setPracticeMode] = useState('normal'); // 'normal' | 'serial-error'
  const [serialErrorSubset, setSerialErrorSubset] = useState([]); // array of original question indices
  const [serialCurrentIndex, setSerialCurrentIndex] = useState(0); // 0 to serialErrorSubset.length - 1
  const [state, setState] = useState(() => loadProgress(ALL_QUESTIONS.length));

  // Initialize Supabase Auth & Session listener
  useEffect(() => {
    // Check if recovery link is in URL hash
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsPasswordReset(true);
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user) {
        setUser(session.user);
        try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}
        setState(loadProgress(ALL_QUESTIONS.length, session.user.id));
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
        setUser(session?.user || null);
        try { localStorage.removeItem('sat_guest_mode'); } catch (e) {}
        if (session?.user) {
          setState(loadProgress(ALL_QUESTIONS.length, session.user.id));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsPasswordReset(false);
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

  // Sync state to localStorage scoped by user id (or unscoped for guest)
  useEffect(() => {
    if (!authLoading && user) {
      const scopeId = user.isGuest ? null : user.id;
      saveProgress(state, scopeId);
    }
  }, [state, user, authLoading]);

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

  const handleNavigate = (newIndex) => {
    if (newIndex >= 0 && newIndex < ALL_QUESTIONS.length) {
      setState(prev => ({ ...prev, currentIndex: newIndex }));
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
    handleNavigate(index);
    setCurrentView('practice');
  };

  const handleJumpToQuestion = (targetIndex) => {
    setPracticeMode('normal');
    handleNavigate(targetIndex);
    setCurrentView('practice');
  };

  const handleOpenErrorLog = () => {
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
    setCurrentView('dashboard');
  };

  const handleReturnFromErrorDrill = () => {
    setPracticeMode('normal');
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
          onSignOut={handleSignOut}
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
            }
          }}
          onToggleAutoStart={handleToggleAutoStart}
          onReset={handleReset}
          onExport={handleExport}
          onImport={handleImport}
          onReturnToDashboard={handleReturnToDashboard}
        />
      );
    }

    // Normal practice mode
    return (
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
        onSignOut={handleSignOut}
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
    );
  }

  // If in dedicated Error Log Directory view:
  if (currentView === 'error-log') {
    return (
      <ErrorLogView
        errorLog={state.errorLog}
        allQuestions={ALL_QUESTIONS}
        user={user}
        onSignOut={handleSignOut}
        onReturnToDashboard={handleReturnToDashboard}
        onStartSerialErrorDrill={handleStartSerialErrorDrill}
        onJumpToQuestion={handleJumpToQuestion}
        onRemoveError={handleRemoveError}
        onMarkMastered={handleMarkMastered}
      />
    );
  }

  // Default: Dashboard
  return (
    <Dashboard
      questions={ALL_QUESTIONS}
      currentIndex={state.currentIndex}
      selectedAnswers={state.selectedAnswers}
      checkedStatus={state.checkedStatus}
      errorLog={state.errorLog}
      user={user}
      onSignOut={handleSignOut}
      onStartPractice={handleStartPractice}
      onJumpToQuestion={handleJumpToQuestion}
      onOpenErrorLog={handleOpenErrorLog}
      onStartSerialErrorDrill={handleStartSerialErrorDrill}
      onReset={handleReset}
      onExport={handleExport}
      onImport={handleImport}
    />
  );
}

