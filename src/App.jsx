import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import BluebookTestView from './components/BluebookTestView';
import { ALL_QUESTIONS } from './data/questions';
import { 
  loadProgress, 
  saveProgress, 
  resetAllProgress, 
  exportProgressAsJson, 
  parseImportJson,
  formatTime
} from './utils/storage';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'practice'
  const [state, setState] = useState(() => loadProgress(ALL_QUESTIONS.length));

  // Sync state to localStorage
  useEffect(() => {
    saveProgress(state);
  }, [state]);

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
          difficulty: q.difficulty,
          passage: q.passage,
          yourAnswer: q.choices[selected] || "None",
          correctAnswer: q.choices[q.answer],
          rationale: q.rationale,
          timeSpent: formatTime(timerSeconds)
        };
        const existingIdx = newErrors.findIndex(e => e.id === q.id);
        if (existingIdx === -1) {
          newErrors.push(errorRecord);
        } else {
          newErrors[existingIdx] = errorRecord;
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
    handleNavigate(index);
    setCurrentView('practice');
  };

  const handleJumpToQuestion = (targetIndex) => {
    handleNavigate(targetIndex);
    setCurrentView('practice');
  };

  const handleReturnToDashboard = () => {
    setCurrentView('dashboard');
  };

  if (currentView === 'practice') {
    return (
      <BluebookTestView
        questions={ALL_QUESTIONS}
        currentIndex={state.currentIndex}
        selectedAnswers={state.selectedAnswers}
        checkedStatus={state.checkedStatus}
        errorLog={state.errorLog}
        autoStartEnabled={state.autoStartEnabled}
        onSelectChoice={handleSelectChoice}
        onCheckAnswer={handleCheckAnswer}
        onNavigate={handleNavigate}
        onToggleAutoStart={handleToggleAutoStart}
        onReset={handleReset}
        onExport={handleExport}
        onImport={handleImport}
        onReturnToDashboard={handleReturnToDashboard}
      />
    );
  }

  return (
    <Dashboard
      questions={ALL_QUESTIONS}
      currentIndex={state.currentIndex}
      selectedAnswers={state.selectedAnswers}
      checkedStatus={state.checkedStatus}
      errorLog={state.errorLog}
      onStartPractice={handleStartPractice}
      onJumpToQuestion={handleJumpToQuestion}
      onReset={handleReset}
      onExport={handleExport}
      onImport={handleImport}
    />
  );
}
