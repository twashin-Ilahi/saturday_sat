import React, { useState, useEffect, useRef } from 'react';
import { 
  Bookmark, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  ArrowRight, 
  HelpCircle, 
  MoreVertical, 
  Edit3, 
  Battery, 
  Maximize2, 
  Minimize2, 
  Check, 
  X, 
  BrainCircuit, 
  Sparkles, 
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

export default function BluebookTestView({ 
  questions, 
  initialIndex = 0, 
  mode = 'simulation', // 'simulation' or 'practice'
  studentName = "Mohamed Elkirsh", 
  onExitTest, 
  onCompleteTest, 
  userRecords = {},
  onSaveAnswer,
  onToggleFlag,
  onOpenAiTutor
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [eliminatedOptions, setEliminatedOptions] = useState({}); // { [qId]: Set of keys }
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [isStrikethroughActive, setIsStrikethroughActive] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(questions.length * 75); // ~75 sec per question standard SAT pace
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showNavigator, setShowNavigator] = useState(false);
  const [leftPaneExpanded, setLeftPaneExpanded] = useState(false);
  const [showImmediateFeedback, setShowImmediateFeedback] = useState(false);
  const [highlightedText, setHighlightedText] = useState({}); // { [qId]: array of highlights }
  const [activeTabMode, setActiveTabMode] = useState(mode);

  const currentQ = questions[currentIndex] || questions[0];
  const qId = currentQ?.id;

  // Initialize from existing records if any
  useEffect(() => {
    const initialSelections = {};
    const initialFlags = {};
    questions.forEach(q => {
      const rec = userRecords[q.id];
      if (rec && rec.answered) {
        initialSelections[q.id] = rec.selectedChoice;
      }
      if (rec && rec.flagged) {
        initialFlags[q.id] = true;
      }
    });
    setSelectedAnswers(initialSelections);
    setFlaggedQuestions(initialFlags);
  }, [questions, userRecords]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSelectChoice = (choiceKey) => {
    if (!qId) return;
    // If strikethrough tool is actively eliminating, toggle elimination instead
    if (isStrikethroughActive) {
      handleToggleEliminate(choiceKey);
      return;
    }

    const newSelections = { ...selectedAnswers, [qId]: choiceKey };
    setSelectedAnswers(newSelections);

    const isCorrect = choiceKey === currentQ.correctAnswer;
    onSaveAnswer(qId, choiceKey, isCorrect);
  };

  const handleToggleEliminate = (choiceKey, e) => {
    if (e) e.stopPropagation();
    if (!qId) return;

    setEliminatedOptions(prev => {
      const currentElim = new Set(prev[qId] || []);
      if (currentElim.has(choiceKey)) {
        currentElim.delete(choiceKey);
      } else {
        currentElim.add(choiceKey);
      }
      return { ...prev, [qId]: currentElim };
    });
  };

  const handleToggleFlag = () => {
    if (!qId) return;
    const isFlagged = !flaggedQuestions[qId];
    setFlaggedQuestions(prev => ({ ...prev, [qId]: isFlagged }));
    onToggleFlag(qId);
  };

  const handleNext = () => {
    setShowImmediateFeedback(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowNavigator(true);
    }
  };

  const handleBack = () => {
    setShowImmediateFeedback(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleFinishTest = () => {
    const results = questions.map(q => {
      const selected = selectedAnswers[q.id];
      return {
        id: q.id,
        difficulty: q.difficulty,
        selectedChoice: selected || null,
        correctAnswer: q.correctAnswer,
        isCorrect: selected === q.correctAnswer,
        omitted: !selected,
      };
    });

    const totalSecondsSpent = (questions.length * 75) - timeRemaining;
    onCompleteTest({
      mode: activeTabMode,
      results,
      timeTakenSec: Math.max(1, totalSecondsSpent),
      total: questions.length,
      score: results.filter(r => r.isCorrect).length,
    });
  };

  const currentSelection = selectedAnswers[qId];
  const isAnswered = Boolean(currentSelection);
  const isCorrect = currentSelection === currentQ?.correctAnswer;
  const isFlagged = Boolean(flaggedQuestions[qId]);
  const eliminated = eliminatedOptions[qId] || new Set();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f3f4f6] text-gray-900 select-none overflow-hidden font-sans">
      {/* 1. BLUEBOOK TOP BAR */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
        {/* Left: Section title & Directions dropdown */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-600" />
              Bluebook
            </span>
            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              Transitions Question Bank
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
              Section 1: Reading and Writing
            </h1>
            <button
              onClick={() => setShowDirections(!showDirections)}
              className="text-xs font-semibold text-gray-600 hover:text-blue-600 flex items-center gap-1 underline underline-offset-2 ml-1"
            >
              Directions
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDirections ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Center: Official Bluebook Timer with Hide pill */}
        <div className="flex flex-col items-center justify-center">
          {!isTimerHidden ? (
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-gray-900">
              {formatTimer(timeRemaining)}
            </div>
          ) : (
            <div className="text-xs font-medium text-gray-400 py-1">Timer Hidden</div>
          )}
          <button
            onClick={() => setIsTimerHidden(!isTimerHidden)}
            className="px-3 py-0.5 rounded-full border border-gray-300 hover:border-gray-400 bg-white text-[11px] font-semibold text-gray-700 transition-colors shadow-2xs mt-0.5"
          >
            {isTimerHidden ? 'Show' : 'Hide'}
          </button>
        </div>

        {/* Right: Tools, Battery, Exit & Mode */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mode Switcher */}
          <div className="hidden md:flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200 text-xs font-medium">
            <button
              onClick={() => setActiveTabMode('simulation')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTabMode === 'simulation' ? 'bg-white shadow-xs font-bold text-blue-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Exam Mode
            </button>
            <button
              onClick={() => setActiveTabMode('practice')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTabMode === 'practice' ? 'bg-white shadow-xs font-bold text-indigo-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Practice Mode
            </button>
          </div>

          {/* Annotate Tool */}
          <button 
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-md hover:bg-gray-100 text-gray-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Annotate (Passage Highlighter)"
            onClick={() => alert("Tip: You can select text in the passage to highlight key contrast and transition signal words!")}
          >
            <Edit3 className="w-4 h-4 text-gray-600" />
            <span className="hidden sm:inline">Annotate</span>
          </button>

          {/* More menu */}
          <button
            onClick={onExitTest}
            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors"
          >
            Exit Test
          </button>

          {/* Battery Status (Authentic Bluebook Detail) */}
          <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-gray-500 pl-2 border-l border-gray-200">
            <span>96%</span>
            <Battery className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </header>

      {/* Directions Dropdown Drawer */}
      {showDirections && (
        <div className="bg-gray-50 border-b border-gray-300 p-4 sm:p-6 text-sm text-gray-700 shrink-0 shadow-inner max-h-48 overflow-y-auto z-10 animate-in fade-in slide-in-from-top-2">
          <div className="max-w-4xl mx-auto space-y-2">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
              Official Section 1: Reading and Writing Directions
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
              The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              All questions in this section are multiple-choice with four options. There is a single best answer for each question.
            </p>
          </div>
        </div>
      )}

      {/* 2. SPLIT SCREEN TEST WORKSPACE */}
      <main className="flex-1 flex overflow-hidden p-3 sm:p-6 gap-3 sm:gap-6">
        {/* LEFT COLUMN: PASSAGE */}
        <div className={`bg-white rounded-xl border border-gray-300 shadow-xs flex flex-col transition-all duration-300 ${
          leftPaneExpanded ? 'w-full' : 'w-1/2'
        } overflow-hidden`}>
          {/* Passage Header */}
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500 font-semibold bg-gray-50/50">
            <span className="uppercase tracking-wider">Passage</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[11px]">
                ID: {currentQ?.id}
              </span>
              <button
                onClick={() => setLeftPaneExpanded(!leftPaneExpanded)}
                className="p-1 hover:bg-gray-200 rounded text-gray-500"
                title={leftPaneExpanded ? "Collapse column" : "Expand column"}
              >
                {leftPaneExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Passage Text */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto bluebook-passage">
            <p className="text-base sm:text-lg leading-relaxed text-gray-800 selection:bg-yellow-200 selection:text-black">
              {currentQ?.passage.split('______').map((part, index, arr) => (
                <React.Fragment key={index}>
                  {part}
                  {index < arr.length - 1 && (
                    <span className="inline-block mx-1 px-3 py-0.5 bg-yellow-100 border-b-2 border-yellow-500 font-mono text-yellow-900 font-bold text-sm rounded">
                      [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
                    </span>
                  )}
                </React.Fragment>
              ))}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTION & CHOICES */}
        {!leftPaneExpanded && (
          <div className="w-1/2 bg-white rounded-xl border border-gray-300 shadow-xs flex flex-col overflow-hidden">
            {/* Question Toolbar */}
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              {/* Question Number Badge & Mark for Review */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-black text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {currentIndex + 1}
                </div>

                <button
                  onClick={handleToggleFlag}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded transition-all ${
                    isFlagged 
                      ? 'bg-red-50 text-red-700 border border-red-200 shadow-2xs' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isFlagged ? 'fill-red-600 text-red-600' : 'text-gray-400'}`} />
                  <span>Mark for Review</span>
                </button>
              </div>

              {/* Tools: Strikethrough elimination mode */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsStrikethroughActive(!isStrikethroughActive)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition-all ${
                    isStrikethroughActive 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Strikethrough Tool (Eliminate Answer Choices)"
                >
                  <span className="line-through font-mono font-bold tracking-tight">ABC</span>
                  <span className="text-[10px] uppercase ml-1 hidden sm:inline">
                    {isStrikethroughActive ? 'Active' : 'Strike'}
                  </span>
                </button>

                {activeTabMode === 'practice' && (
                  <button
                    onClick={() => onOpenAiTutor(currentQ, currentSelection)}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 shadow-2xs transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Ask AI Tutor</span>
                  </button>
                )}
              </div>
            </div>

            {/* Question Body */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Question Stem */}
              <div className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
                {currentQ?.prompt}
              </div>

              {/* Answer Choices List */}
              <div className="space-y-3">
                {currentQ?.options.map(option => {
                  const isSelected = currentSelection === option.key;
                  const isElim = eliminated.has(option.key);
                  const isOptionCorrect = option.key === currentQ.correctAnswer;

                  let borderStyle = "border-gray-300 hover:border-gray-400 bg-white";
                  let circleStyle = "border-gray-400 text-gray-700 bg-gray-50";

                  if (isSelected) {
                    borderStyle = "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600";
                    circleStyle = "border-blue-600 bg-blue-600 text-white";
                  }

                  if (showImmediateFeedback && activeTabMode === 'practice') {
                    if (isOptionCorrect) {
                      borderStyle = "border-emerald-500 bg-emerald-50 shadow-xs ring-1 ring-emerald-500";
                      circleStyle = "border-emerald-600 bg-emerald-600 text-white";
                    } else if (isSelected && !isOptionCorrect) {
                      borderStyle = "border-rose-500 bg-rose-50 shadow-xs ring-1 ring-rose-500";
                      circleStyle = "border-rose-600 bg-rose-600 text-white";
                    }
                  }

                  return (
                    <div
                      key={option.key}
                      onClick={() => handleSelectChoice(option.key)}
                      className={`group relative flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${borderStyle} ${
                        isElim ? 'opacity-40 bg-gray-50' : ''
                      }`}
                    >
                      {/* Radio Circle */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${circleStyle}`}>
                        {option.key}
                      </div>

                      {/* Text */}
                      <div className={`flex-1 text-sm sm:text-base text-gray-900 leading-normal ${
                        isElim ? 'line-through text-gray-500' : ''
                      }`}>
                        {option.text}
                      </div>

                      {/* Option Strikethrough Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleEliminate(option.key, e)}
                        className={`opacity-0 group-hover:opacity-100 sm:opacity-60 hover:!opacity-100 p-1 rounded text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-opacity ${
                          isElim ? '!opacity-100 text-rose-500' : ''
                        }`}
                        title="Eliminate / Cross out choice"
                      >
                        <span className="font-mono text-xs line-through font-bold">ABC</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Practice Mode: Instant Rationale & Gemini breakdown */}
              {activeTabMode === 'practice' && (
                <div className="pt-2 border-t border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowImmediateFeedback(!showImmediateFeedback)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                        showImmediateFeedback 
                          ? 'bg-gray-200 text-gray-800' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {showImmediateFeedback ? 'Hide Answer Rationale' : 'Check Answer & Official Rationale'}
                    </button>

                    <button
                      onClick={() => onOpenAiTutor(currentQ, currentSelection)}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <BrainCircuit className="w-4 h-4" />
                      Ask AI Tutor
                    </button>
                  </div>

                  {showImmediateFeedback && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">Correct Answer:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Choice {currentQ.correctAnswer}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">({currentQ.category})</span>
                      </div>
                      <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                        {currentQ.rationale}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. BLUEBOOK BOTTOM NAVIGATION BAR */}
      <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
        {/* Left: Student Name */}
        <div className="text-xs sm:text-sm font-bold text-gray-800 tracking-tight">
          {studentName}
        </div>

        {/* Center: Question Navigator Pill */}
        <div className="relative">
          <button
            onClick={() => setShowNavigator(!showNavigator)}
            className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <ChevronUp className={`w-4 h-4 transition-transform ${showNavigator ? 'rotate-180' : ''}`} />
          </button>

          {/* QUESTION NAVIGATOR POPOVER (Exact Bluebook Grid) */}
          {showNavigator && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[340px] sm:w-[500px] bg-white rounded-2xl border border-gray-300 shadow-2xl p-5 z-30 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Section 1: Reading and Writing Questions
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-gray-800 inline-block" /> Answered
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm border border-gray-400 inline-block" /> Unanswered
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="w-3 h-3 fill-red-600 text-red-600 inline" /> For Review
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowNavigator(false)}
                  className="p-1 hover:bg-gray-100 rounded-md text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of question buttons */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 py-4 max-h-60 overflow-y-auto">
                {questions.map((q, idx) => {
                  const answered = Boolean(selectedAnswers[q.id]);
                  const flagged = Boolean(flaggedQuestions[q.id]);
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowNavigator(false);
                      }}
                      className={`relative h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                        isCurrent 
                          ? 'ring-2 ring-blue-600 text-blue-600 bg-blue-50 font-extrabold' 
                          : answered
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {idx + 1}
                      {flagged && (
                        <div className="absolute -top-1 -right-1">
                          <Bookmark className="w-3 h-3 fill-red-600 text-red-600" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setShowNavigator(false)}
                  className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleFinishTest}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Finish & Submit Section
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Back & Next Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors ${
              currentIndex === 0 
                ? 'opacity-40 text-gray-400 cursor-not-allowed bg-transparent' 
                : 'border border-gray-300 text-gray-700 hover:bg-gray-100 bg-white shadow-2xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishTest}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
            >
              <span>Submit Test</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
