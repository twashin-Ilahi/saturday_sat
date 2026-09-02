import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BluebookTestView from './components/BluebookTestView';
import ErrorLogView from './components/ErrorLogView';
import QuestionBankView from './components/QuestionBankView';
import AiTutorDrawer from './components/AiTutorDrawer';
import TransitionGuideModal from './components/TransitionGuideModal';
import SettingsModal from './components/SettingsModal';
import TestResultsModal from './components/TestResultsModal';

import { ALL_QUESTIONS } from './data/questions';
import { 
  getProfile, 
  getAllRecords, 
  saveQuestionRecord, 
  toggleQuestionFlag, 
  getErrorLog, 
  getOverallStats, 
  saveTestHistorySession, 
  getTestHistory 
} from './utils/storage';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' | 'bank' | 'errorLog' | 'test'
  const [profile, setProfile] = useState(getProfile());
  const [userRecords, setUserRecords] = useState(getAllRecords());
  const [testHistory, setTestHistory] = useState(getTestHistory());
  
  // Active test state
  const [activeTest, setActiveTest] = useState(null);
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const [completedSession, setCompletedSession] = useState(null);

  // Modals & drawers
  const [aiTutorState, setAiTutorState] = useState({ isOpen: false, question: null, userChoice: null });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync state whenever records change
  const refreshRecords = () => {
    setUserRecords(getAllRecords());
    setProfile(getProfile());
    setTestHistory(getTestHistory());
  };

  const overallStats = getOverallStats();
  const errorList = getErrorLog();

  // Test Launcher
  const startTest = ({ mode = 'simulation', questions = null, count = 20, initialIndex = 0 }) => {
    let testQuestions = questions;
    if (!testQuestions) {
      if (mode === 'errors') {
        const errors = getErrorLog().map(e => e.question);
        testQuestions = errors.length > 0 ? errors : ALL_QUESTIONS.slice(0, 10);
      } else {
        testQuestions = ALL_QUESTIONS.slice(0, count);
      }
    }

    setActiveTest({
      mode,
      questions: testQuestions,
    });
    setActiveTestIndex(initialIndex);
    setCurrentTab('test');
  };

  const handleSaveAnswer = (questionId, choice, isCorrect) => {
    saveQuestionRecord(questionId, { selectedChoice: choice, isCorrect });
    setUserRecords(getAllRecords());
  };

  const handleToggleFlag = (questionId) => {
    toggleQuestionFlag(questionId);
    setUserRecords(getAllRecords());
  };

  const handleCompleteTest = (session) => {
    saveTestHistorySession({
      mode: session.mode,
      score: session.score,
      total: session.total,
      accuracy: Math.round((session.score / session.total) * 100),
      timeTakenSec: session.timeTakenSec,
      results: session.results,
    });
    setCompletedSession(session);
    refreshRecords();
  };

  const handleCloseResults = () => {
    setCompletedSession(null);
    setActiveTest(null);
    setCurrentTab('dashboard');
  };

  const handleRetryFromResults = () => {
    if (!completedSession || !activeTest) return;
    setCompletedSession(null);
    startTest({
      mode: activeTest.mode,
      questions: activeTest.questions,
    });
  };

  const handleRetrySingleQuestion = (question) => {
    startTest({
      mode: 'practice',
      questions: [question],
      initialIndex: 0,
    });
  };

  const handleOpenAiTutor = (question, userChoice = null) => {
    setAiTutorState({
      isOpen: true,
      question,
      userChoice,
    });
  };

  const handleCloseAiTutor = () => {
    setAiTutorState(prev => ({ ...prev, isOpen: false }));
  };

  const handleUpdateNotes = (questionId, notes) => {
    saveQuestionRecord(questionId, { notes });
    setUserRecords(getAllRecords());
  };

  // If in active Bluebook test view
  if (currentTab === 'test' && activeTest) {
    return (
      <div className="min-h-screen bg-[#f3f4f6]">
        <BluebookTestView
          questions={activeTest.questions}
          initialIndex={activeTestIndex}
          mode={activeTest.mode}
          studentName={profile?.name || "Mohamed Elkirsh"}
          onExitTest={() => {
            if (window.confirm("Are you sure you want to leave the practice test? Your recorded answers are saved.")) {
              setActiveTest(null);
              setCurrentTab('dashboard');
            }
          }}
          onCompleteTest={handleCompleteTest}
          userRecords={userRecords}
          onSaveAnswer={handleSaveAnswer}
          onToggleFlag={handleToggleFlag}
          onOpenAiTutor={handleOpenAiTutor}
        />

        {/* AI Tutor Drawer inside test */}
        <AiTutorDrawer
          isOpen={aiTutorState.isOpen}
          onClose={handleCloseAiTutor}
          question={aiTutorState.question}
          userChoice={aiTutorState.userChoice}
        />

        {/* Results Modal */}
        <TestResultsModal
          session={completedSession}
          questions={activeTest.questions}
          onClose={handleCloseResults}
          onRetryTest={handleRetryFromResults}
          onReviewErrors={() => {
            setCompletedSession(null);
            setActiveTest(null);
            setCurrentTab('errorLog');
          }}
          onOpenAiTutor={handleOpenAiTutor}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Standard Platform Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        errorCount={errorList.length}
        onStartSimulation={startTest}
        profile={profile}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <Dashboard
            stats={overallStats}
            profile={profile}
            onStartSimulation={startTest}
            setCurrentTab={setCurrentTab}
            onOpenGuide={() => setIsGuideOpen(true)}
            testHistory={testHistory}
          />
        )}

        {currentTab === 'bank' && (
          <QuestionBankView
            userRecords={userRecords}
            onStartCustomTest={(qs) => startTest({ mode: 'practice', questions: qs })}
            onPracticeSingleQuestion={handleRetrySingleQuestion}
            onToggleFlag={handleToggleFlag}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {currentTab === 'errorLog' && (
          <ErrorLogView
            errorList={errorList}
            onRetryQuestion={handleRetrySingleQuestion}
            onOpenAiTutor={handleOpenAiTutor}
            onStartErrorTest={() => startTest({ mode: 'errors' })}
            onUpdateNotes={handleUpdateNotes}
          />
        )}
      </main>

      {/* Persistent Modals and Drawers */}
      <AiTutorDrawer
        isOpen={aiTutorState.isOpen}
        onClose={handleCloseAiTutor}
        question={aiTutorState.question}
        userChoice={aiTutorState.userChoice}
      />

      <TransitionGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onProfileUpdated={refreshRecords}
        onDataReset={refreshRecords}
      />
    </div>
  );
}
