import React, { useState, useEffect, useRef } from 'react';
import { formatTime, loadHighlights, saveHighlights } from '../utils/storage';
import { explainSingleQuestionWithGemini } from '../utils/gemini';

export default function BluebookTestView({
  questions,
  currentIndex,
  selectedAnswers,
  checkedStatus,
  flaggedStatus = [],
  eliminatedStatus = [],
  errorLog,
  autoStartEnabled,
  practiceMode = 'normal',
  user,
  cloudSyncStatus = 'idle',
  onSignOut,
  onOpenSettings,
  onOpenErrorLog,
  onReturnFromErrorDrill,
  onSelectChoice,
  onCheckAnswer,
  onToggleFlag,
  onToggleEliminate,
  onNavigate,
  onToggleAutoStart,
  onReset,
  onExport,
  onImport,
  onReturnToDashboard,
}) {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showNavPopover, setShowNavPopover] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [notes, setNotes] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [eliminatorMode, setEliminatorMode] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [savedHighlights, setSavedHighlights] = useState(() => loadHighlights());
  const [activePen, setActivePen] = useState('yellow'); // 'yellow' | 'pink' | null
  const [dustbinPopover, setDustbinPopover] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(() => !!(typeof document !== 'undefined' && (document.fullscreenElement || document.webkitFullscreenElement)));
  const fileInputRef = useRef(null);
  const passageRef = useRef(null);
  const currentRangeRef = useRef(null);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(err => console.warn("Fullscreen request error:", err));
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => console.warn("Exit fullscreen error:", err));
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn("Fullscreen toggle error:", e);
    }
  };

  const q = questions[currentIndex] || questions[0];
  const isCurrentChecked = checkedStatus[currentIndex];
  const currentSelection = selectedAnswers[currentIndex];
  const isFlagged = flaggedStatus[currentIndex] || false;
  const eliminatedChoices = eliminatedStatus[currentIndex] || [];

  // Stopwatch timer
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Reset per question
  useEffect(() => {
    setTimerSeconds(0);
    setAiExplanation("");
    setAiLoading(false);
    setShowNavPopover(false);
    setShowMoreMenu(false);
    setDustbinPopover(null);
    if (autoStartEnabled && !checkedStatus[currentIndex]) {
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  }, [currentIndex, autoStartEnabled]);

  // Click outside dustbin popover closes it
  useEffect(() => {
    const handleDocClick = (e) => {
      if (dustbinPopover && !e.target.closest('.sat-dustbin-popover')) {
        setDustbinPopover(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [dustbinPopover]);

  const applyHighlight = (color, explicitRange) => {
    const sel = window.getSelection();
    let range = explicitRange;

    if (!range && sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      range = sel.getRangeAt(0);
    }

    if (!range || !passageRef.current) return;
    if (!passageRef.current.contains(range.commonAncestorContainer)) return;

    const text = range.toString().trim();
    if (!text) return;

    const mark = document.createElement('mark');
    mark.className = `sat-hl sat-hl-${color}`;
    mark.title = 'Click to delete';

    try {
      range.surroundContents(mark);
    } catch (e) {
      try {
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
      } catch (err2) {
        console.warn("Could not apply highlight:", err2);
      }
    }

    if (passageRef.current) {
      const updatedHtml = passageRef.current.innerHTML;
      const newMap = { ...savedHighlights, [q.id]: updatedHtml };
      setSavedHighlights(newMap);
      saveHighlights(newMap);
    }

    if (sel) {
      try { sel.removeAllRanges(); } catch (e) {}
    }
    setDustbinPopover(null);
  };

  const handlePassageMouseUp = () => {
    if (!activePen) return;

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
      const text = selection.toString().trim();
      if (!text) return;

      const range = selection.getRangeAt(0);
      if (!passageRef.current || !passageRef.current.contains(range.commonAncestorContainer)) return;

      // Automatically apply highlight with chosen pen without needing extra clicks!
      applyHighlight(activePen, range);
    }, 15);
  };

  const handlePassageClick = (e) => {
    const target = e.target;
    if (target && target.tagName === 'MARK' && target.classList.contains('sat-hl')) {
      e.stopPropagation();
      const rect = target.getBoundingClientRect();
      setDustbinPopover({
        element: target,
        x: rect.left + rect.width / 2,
        y: Math.max(65, rect.top - 38)
      });
    } else {
      setDustbinPopover(null);
    }
  };

  const handleDeleteHighlight = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!dustbinPopover || !dustbinPopover.element) return;
    const target = dustbinPopover.element;
    if (target && target.parentNode) {
      const parent = target.parentNode;
      while (target.firstChild) {
        parent.insertBefore(target.firstChild, target);
      }
      parent.removeChild(target);
      if (passageRef.current) {
        const updatedHtml = passageRef.current.innerHTML;
        const newMap = { ...savedHighlights, [q.id]: updatedHtml };
        setSavedHighlights(newMap);
        saveHighlights(newMap);
      }
    }
    setDustbinPopover(null);
  };

  const clearAllHighlightsForQuestion = () => {
    if (passageRef.current) {
      passageRef.current.innerHTML = renderedPassage;
      const newMap = { ...savedHighlights };
      delete newMap[q.id];
      setSavedHighlights(newMap);
      saveHighlights(newMap);
    }
    setDustbinPopover(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showErrorModal || showNotesDrawer || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentIndex > 0) onNavigate(currentIndex - 1);
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < questions.length - 1) onNavigate(currentIndex + 1);
      } else if (!isCurrentChecked) {
        if (e.key === '1' || e.key.toLowerCase() === 'a') onSelectChoice(currentIndex, 0);
        else if (e.key === '2' || e.key.toLowerCase() === 'b') onSelectChoice(currentIndex, 1);
        else if (e.key === '3' || e.key.toLowerCase() === 'c') onSelectChoice(currentIndex, 2);
        else if (e.key === '4' || e.key.toLowerCase() === 'd') onSelectChoice(currentIndex, 3);
        else if (e.key === 'Enter' && currentSelection !== null) {
          setIsTimerRunning(false);
          onCheckAnswer(currentIndex, timerSeconds);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isCurrentChecked, currentSelection, questions.length, showErrorModal, showNotesDrawer, timerSeconds]);

  const handleCheck = () => {
    if (currentSelection === null) {
      alert("Please select an answer before checking.");
      return;
    }
    setIsTimerRunning(false);
    onCheckAnswer(currentIndex, timerSeconds);
  };

  const handleAskAi = async () => {
    setAiLoading(true);
    setAiExplanation("");
    const res = await explainSingleQuestionWithGemini({
      question: q,
      studentChoice: currentSelection,
      isCorrect: currentSelection === q.answer
    });
    setAiLoading(false);
    if (res.success) {
      setAiExplanation(res.text);
    } else {
      setAiExplanation("AI Error: " + (res.error || "Failed to load Gemini breakdown."));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        onImport(evt.target.result);
        alert("Progress restored successfully!");
      } catch (err) {
        alert("Error reading backup file. Invalid format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const activeBars = q.difficulty === "Easy" ? 1 : q.difficulty === "Medium" ? 2 : 3;
  const isCorrect = currentSelection === q.answer;
  const letters = ["A", "B", "C", "D"];

  // Replace [BLANK] with authentic line
  const renderedPassage = q.passage.replace(
    "[BLANK]",
    '<span style="display:inline-block; min-width:60px; border-bottom:2px solid #000; margin:0 4px; vertical-align:bottom;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#ffffff', color: '#111827', overflow: 'hidden', userSelect: 'text' }}>
      
      {/* 1. Official Bluebook Top Bar (Double-click to toggle Fullscreen) */}
      <header 
        onDoubleClick={(e) => {
          if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;
          handleToggleFullscreen();
        }}
        title="Double-click header to toggle Fullscreen"
        style={{ height: '62px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'relative', zIndex: 30, cursor: 'default' }}
      >
        
        {/* Left: Section and Directions */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Section 1, Module 1: Reading and Writing</span>
            {practiceMode === 'serial-error' && (
              <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '1px 8px', borderRadius: '12px', fontWeight: 700 }}>
                Serial Error Drill
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => setShowDirections(!showDirections)}
              style={{ background: 'none', border: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
            >
              Directions {showDirections ? '▴' : '▾'}
            </button>
            {practiceMode === 'serial-error' && (
              <button 
                onClick={onReturnFromErrorDrill || onReturnToDashboard}
                style={{ background: 'none', border: 'none', padding: 0, margin: 0, fontSize: '0.82rem', color: '#005a9c', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                ← Return to Error Directory
              </button>
            )}
          </div>
        </div>

        {/* Center: Timer + Controls (Pause, Run, Restart, Hide) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'monospace', color: isTimerRunning ? '#111827' : '#ea580c', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{isTimerHidden ? "--:--" : formatTime(timerSeconds)}</span>
            {!isTimerRunning && !isTimerHidden && (
              <span style={{ fontSize: '0.65rem', background: '#ffedd5', color: '#c2410c', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                PAUSED
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            {/* Pause / Run Button */}
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '1px 8px',
                borderRadius: '12px',
                border: `1px solid ${isTimerRunning ? '#94a3b8' : '#f97316'}`,
                background: isTimerRunning ? '#ffffff' : '#fff7ed',
                color: isTimerRunning ? '#334155' : '#c2410c',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title={isTimerRunning ? "Pause clock" : "Run / Resume clock"}
            >
              {isTimerRunning ? "⏸ Pause" : "▶ Run"}
            </button>

            {/* Restart / Re-run from 00:00 Button */}
            <button
              type="button"
              onClick={() => {
                setTimerSeconds(0);
                setIsTimerRunning(true);
              }}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '1px 8px',
                borderRadius: '12px',
                border: '1px solid #94a3b8',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
              title="Reset clock to 00:00 and run"
            >
              ↺ Restart
            </button>

            {/* Hide / Show Button */}
            <button
              type="button"
              onClick={() => setIsTimerHidden(!isTimerHidden)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '1px 8px',
                borderRadius: '12px',
                border: '1px solid #94a3b8',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              {isTimerHidden ? "Show" : "Hide"}
            </button>
          </div>
        </div>

        {/* Right: Battery, Fullscreen, Highlights & Notes, More Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Battery Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
            <span>55%</span>
            <svg width="22" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="19" height="10" rx="2" />
              <rect x="3" y="3" width="10" height="6" fill="#10b981" />
              <path d="M21 4.5V7.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            style={{
              background: isFullscreen ? '#eff6ff' : 'none',
              border: isFullscreen ? '1px solid #bfdbfe' : '1px solid transparent',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: isFullscreen ? '#005a9c' : '#475569'
            }}
            title={isFullscreen ? "Exit Fullscreen (or double-click top bar)" : "Enter Fullscreen (or double-click top bar)"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isFullscreen ? (
                <>
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </>
              ) : (
                <>
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </>
              )}
            </svg>
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>

          {/* Highlights & Notes */}
          <button 
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            style={{ 
              background: showNotesDrawer ? '#f1f5f9' : 'none', 
              border: showNotesDrawer ? '1px solid #cbd5e1' : '1px solid transparent', 
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.82rem', 
              fontWeight: 600, 
              color: showNotesDrawer ? '#005a9c' : '#334155' 
            }}
            title="Open Highlights & Notes"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Highlights & Notes</span>
            {activePen && (
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: activePen === 'yellow' ? '#eab308' : '#ec4899',
                  display: 'inline-block' 
                }} 
                title={`Active Pen: ${activePen}`}
              />
            )}
          </button>

          {/* More Menu (3 vertical dots) */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600, color: showMoreMenu ? '#005a9c' : '#334155' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
              <span>More</span>
            </button>

            {/* More Menu Dropdown */}
            {showMoreMenu && (
              <div style={{ position: 'absolute', right: 0, top: '32px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 4px 14px rgba(0,0,0,0.12)', width: '220px', zIndex: 100, overflow: 'hidden' }}>
                {user && (
                  <div style={{ padding: '8px 14px', background: user.isGuest ? '#f0fdf4' : '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569' }}>
                    <div style={{ fontWeight: 600, color: user.isGuest ? '#15803d' : '#1e293b' }}>
                      {user.isGuest ? 'Mode:' : 'Logged in as:'}
                    </div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.user_metadata?.full_name ? `${user.user_metadata.full_name} (${user.email})` : user.email}>
                      {user.isGuest ? '👤 Guest (Local Storage)' : (user.user_metadata?.full_name || user.user_metadata?.name || user.email)}
                    </div>
                    {user && !user.isGuest && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          color: cloudSyncStatus === 'syncing' ? '#0284c7' : (cloudSyncStatus === 'synced' ? '#15803d' : '#64748b'),
                          background: cloudSyncStatus === 'syncing' ? '#e0f2fe' : (cloudSyncStatus === 'synced' ? '#dcfce7' : '#f1f5f9'),
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          {cloudSyncStatus === 'syncing' ? '☁️ Backing up...' : '☁️ Auto-synced'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <button 
                  onClick={() => { setShowMoreMenu(false); onReturnToDashboard(); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#005a9c' }}
                >
                  ← Return to Dashboard
                </button>
                <button 
                  onClick={() => { setShowMoreMenu(false); onOpenSettings && onOpenSettings(); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}
                >
                  ⚙️ Settings & Cloud Sync
                </button>
                <button 
                  onClick={() => { setShowMoreMenu(false); handleToggleFullscreen(); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem', color: '#334155' }}
                >
                  {isFullscreen ? "⤓ Exit Fullscreen" : "⛶ Enter Fullscreen"}
                </button>
                {practiceMode === 'serial-error' && (
                  <button 
                    onClick={() => { setShowMoreMenu(false); onReturnFromErrorDrill ? onReturnFromErrorDrill() : onReturnToDashboard(); }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#005a9c' }}
                  >
                    ← Return to Error Directory
                  </button>
                )}
                <button 
                  onClick={() => { setShowMoreMenu(false); onOpenErrorLog ? onOpenErrorLog() : setShowErrorModal(true); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem', color: '#b91c1c', fontWeight: 600 }}
                >
                  📁 Error Directory ({errorLog.length})
                </button>
                <button 
                  onClick={() => { setShowMoreMenu(false); onExport(); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem', color: '#334155' }}
                >
                  Backup Data (JSON)
                </button>
                <button 
                  onClick={() => { setShowMoreMenu(false); fileInputRef.current?.click(); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem', color: '#334155' }}
                >
                  Load Backup (JSON)
                </button>
                <button 
                  onClick={() => {
                    setShowMoreMenu(false);
                    if (confirm("Reset all progress and error log?")) onReset();
                  }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: onSignOut ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#64748b' }}
                >
                  Reset Progress
                </button>
                {onSignOut && (
                  <button 
                    onClick={() => {
                      setShowMoreMenu(false);
                      onSignOut();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      color: user?.isGuest ? '#005a9c' : '#b91c1c',
                      fontWeight: 600
                    }}
                  >
                    {user?.isGuest ? '→ Sign In / Register' : 'Sign Out'}
                  </button>
                )}

              </div>
            )}

          </div>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
        </div>
      </header>

      {/* Directions Accordion Drawer */}
      {showDirections && (
        <div style={{ background: '#f8fafc', borderBottom: '2px solid #005a9c', padding: '16px 24px', fontSize: '0.88rem', lineHeight: 1.6, color: '#334155', animation: 'fadeIn 0.2s' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Module 1 Directions</h4>
            <p style={{ marginBottom: '6px' }}>
              The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).
            </p>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '8px' }}>
              All questions in this module are multiple-choice with four answer choices. Each question has a single best answer.
            </div>
          </div>
        </div>
      )}

      {/* 2. Sub-Header: Dashed line and Centered Dark Blue Banner ("THIS IS A PRACTICE TEST" / "SERIAL ERROR RECOVERY DRILL") */}
      <div 
        onDoubleClick={handleToggleFullscreen}
        title="Double-click to toggle Fullscreen"
        style={{ position: 'relative', borderTop: '1.5px dashed #cbd5e1', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
      >
        <div style={{
          background: practiceMode === 'serial-error' ? '#991b1b' : '#23325c',
          color: '#ffffff',
          fontSize: '0.74rem',
          fontWeight: 800,
          letterSpacing: '1px',
          padding: '4px 34px',
          borderRadius: '0 0 10px 10px',
          textTransform: 'uppercase',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {practiceMode === 'serial-error' ? "🔁 SERIAL ERROR RECOVERY DRILL" : "THIS IS A PRACTICE TEST"}
        </div>
      </div>

      {/* 3. Main Split Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Left Pane: Passage Display */}
        <div 
          style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', borderRight: '1.5px solid #cbd5e1', background: '#fff', position: 'relative' }}
          onMouseUp={handlePassageMouseUp}
          onClick={handlePassageClick}
        >
          <div style={{ maxWidth: '640px' }}>
            {/* Left Header matching the right side header height */}
            <div style={{ height: '32px', marginBottom: '14px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Reading and Writing
              </span>
            </div>

            {/* Dashed line matching the right side dashed line */}
            <div style={{ borderBottom: '1.5px dashed #cbd5e1', marginBottom: '20px' }} />

            {/* Passage text */}
            <div 
              key={q.id}
              ref={passageRef}
              style={{
                fontFamily: 'Merriweather, Georgia, Cambria, serif',
                fontSize: '1.08rem',
                lineHeight: 1.85,
                color: '#1f2937',
                userSelect: 'text'
              }} 
              dangerouslySetInnerHTML={{ __html: savedHighlights[q.id] || renderedPassage }} 
            />
          </div>
        </div>

        {/* Center Vertical Divider with Resize Handle Pill */}
        <div style={{ width: '0px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{
            position: 'absolute',
            width: '18px',
            height: '38px',
            background: '#334155',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '0.65rem',
            cursor: 'col-resize',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
          }}>
            ◂▸
          </div>
        </div>

        {/* Right Pane: Question, Header & Choices */}
        <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: '640px', width: '100%' }}>
            
            {/* Question Top Header with Black Square Badge, Bookmark Flag, Inline Metadata, and Blue ABC Option Eliminator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '32px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Black Square Question Badge */}
                <div style={{
                  background: '#111827',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '3px',
                  flexShrink: 0
                }}>
                  {currentIndex + 1}
                </div>

                {/* Mark for Review Button */}
                <button 
                  onClick={() => onToggleFlag(currentIndex)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: isFlagged ? '#d97706' : '#334155'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={isFlagged ? "#d97706" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{isFlagged ? "Marked for Review" : "Mark for Review"}</span>
                </button>

                {/* Inline Subtle Metadata Badges */}
                <span style={{ fontSize: '0.72rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: '4px' }}>
                  {q.skill || "Transitions"}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, background: q.difficulty === 'Easy' ? '#dcfce7' : q.difficulty === 'Medium' ? '#ffedd5' : '#fee2e2', color: q.difficulty === 'Easy' ? '#15803d' : q.difficulty === 'Medium' ? '#c2410c' : '#b91c1c', padding: '2px 7px', borderRadius: '4px' }}>
                  {q.difficulty} {activeBars === 1 ? "▰▱▱" : activeBars === 2 ? "▰▰▱" : "▰▰▰"}
                </span>
              </div>

              {/* Option Eliminator Mode Button (ABC with strikethrough) */}
              <button
                onClick={() => setEliminatorMode(!eliminatorMode)}
                style={{
                  background: eliminatorMode ? '#1e40af' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  flexShrink: 0
                }}
                title="Option Eliminator (cross out wrong choices)"
              >
                <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.5px', textDecoration: 'line-through' }}>
                  ABC
                </span>
              </button>
            </div>

            {/* Dashed line under question header */}
            <div style={{ borderBottom: '1.5px dashed #cbd5e1', marginBottom: '20px' }} />

            {/* Prompt text */}
            <div style={{ fontSize: '1rem', color: '#111827', fontWeight: 500, lineHeight: 1.5, marginBottom: '20px' }}>
              {q.prompt || "Which choice completes the text with the most logical transition?"}
            </div>

          {/* Choices List (Rounded Cards with circle letters and strikethrough eliminators) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {q.choices.map((choice, idx) => {
              const isSelected = currentSelection === idx;
              const isEliminated = eliminatedChoices.includes(idx);

              let cardBorder = '#64748b';
              let cardBg = '#ffffff';
              let textColor = '#111827';

              if (isSelected) {
                cardBorder = '#005a9c';
                cardBg = '#edf4fc';
              }

              if (isEliminated) {
                cardBg = '#f8fafc';
                cardBorder = '#cbd5e1';
                textColor = '#94a3b8';
              }

              if (isCurrentChecked) {
                if (idx === q.answer) {
                  cardBorder = '#16a34a';
                  cardBg = '#dcfce7';
                  textColor = '#14532d';
                } else if (isSelected && idx !== q.answer) {
                  cardBorder = '#dc2626';
                  cardBg = '#fee2e2';
                  textColor = '#7f1d1d';
                }
              }

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (!isCurrentChecked) onSelectChoice(currentIndex, idx);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: `1.5px solid ${cardBorder}`,
                    borderRadius: '8px',
                    padding: '12px 18px',
                    background: cardBg,
                    cursor: isCurrentChecked ? 'default' : 'pointer',
                    transition: 'all 0.12s ease-in-out',
                    boxShadow: isSelected ? '0 0 0 1px #005a9c' : 'none'
                  }}
                >
                  {/* Left: Circle with letter (A), (B), (C), (D) + Option text */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: `1.5px solid ${isSelected ? '#005a9c' : isEliminated ? '#cbd5e1' : '#475569'}`,
                      background: isSelected ? '#005a9c' : '#ffffff',
                      color: isSelected ? '#ffffff' : isEliminated ? '#94a3b8' : '#111827',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {letters[idx]}
                    </div>
                    <span style={{
                      fontSize: '0.98rem',
                      lineHeight: 1.4,
                      color: textColor,
                      fontWeight: isSelected || (isCurrentChecked && idx === q.answer) ? 600 : 400,
                      textDecoration: isEliminated ? 'line-through' : 'none'
                    }}>
                      {choice}
                    </span>
                  </div>

                  {/* Right: Eliminator Strike Button (A̶) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEliminate(currentIndex, idx);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: isEliminated ? '#dc2626' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={isEliminated ? "Restore Choice" : "Cross out choice"}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="#dc2626" strokeWidth="2" opacity={isEliminated ? "1" : "0.35"} />
                      <text x="12" y="15.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" stroke="none">
                        {letters[idx]}
                      </text>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Rationale & Gemini Breakdown Box (When checked) */}
          {isCurrentChecked && (
            <div style={{ background: '#f8fafc', borderLeft: '4px solid var(--cb-blue)', borderRadius: '4px', padding: '16px 20px', marginTop: '10px', fontSize: '0.95rem', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: isCorrect ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{isCorrect ? "✓ Correct" : "✕ Incorrect"}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>
                  — Correct Choice is {q.correctAnswerLetter}
                </span>
              </div>
              <div style={{ color: '#1e293b', marginBottom: '12px' }}>
                {q.rationale}
              </div>

              {/* Gemini AI On-Demand Breakdown */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '10px' }}>
                {!aiExplanation && !aiLoading && (
                  <button 
                    className="btn"
                    style={{ background: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe', fontSize: '0.82rem', padding: '5px 12px', fontWeight: 600 }}
                    onClick={handleAskAi}
                  >
                    ✨ Ask Gemini: Why is this transition used?
                  </button>
                )}
                {aiLoading && (
                  <div style={{ fontSize: '0.85rem', color: '#6d28d9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✦ Gemini is breaking down this question...</span>
                  </div>
                )}
                {aiExplanation && (
                  <div style={{ background: '#ffffff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '12px 16px', marginTop: '6px', fontSize: '0.88rem', lineHeight: 1.55, color: '#334155', whiteSpace: 'pre-wrap' }}>
                    <div style={{ fontWeight: 700, color: '#6d28d9', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>✦ Gemini AI Coach Breakdown</span>
                      <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888', fontSize: '0.78rem' }} onClick={() => setAiExplanation("")}>✕</button>
                    </div>
                    {aiExplanation}
                  </div>
                )}
              </div>
            </div>
          )}

          </div>
        </div>
      </div>

      {/* 4. Official Bluebook Bottom Bar */}
      <footer style={{
        height: '64px',
        padding: '0 24px',
        borderTop: '1.5px dashed #cbd5e1',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 20
      }}>
        {/* Left: Student Name and Return to Dashboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
            Md Twashin Ilahi
          </div>
          <button 
            onClick={onReturnToDashboard}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            ← Dashboard
          </button>
        </div>

        {/* Center: Black Pill Question Navigator */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNavPopover(!showNavPopover)}
            style={{
              background: '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 22px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
            }}
          >
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span style={{ fontSize: '0.75rem' }}>{showNavPopover ? '▾' : '▴'}</span>
          </button>

          {/* Bluebook Question Grid Popover */}
          {showNavPopover && (
            <div style={{
              position: 'absolute',
              bottom: '52px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '380px',
              maxHeight: '360px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              padding: '16px',
              zIndex: 100,
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>Review Questions</span>
                <span style={{ fontSize: '0.78rem', color: '#666' }}>{questions.length} Questions</span>
              </div>

              {/* Grid of question buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {questions.map((qItem, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isChecked = checkedStatus[idx];
                  const flagged = flaggedStatus[idx];

                  let btnBg = '#f8fafc';
                  let btnColor = '#334155';
                  let border = '1px solid #cbd5e1';

                  if (isChecked) {
                    btnBg = selectedAnswers[idx] === qItem.answer ? '#dcfce7' : '#fee2e2';
                    btnColor = selectedAnswers[idx] === qItem.answer ? '#15803d' : '#b91c1c';
                    border = `1px solid ${selectedAnswers[idx] === qItem.answer ? '#86efac' : '#fca5a5'}`;
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        onNavigate(idx);
                        setShowNavPopover(false);
                      }}
                      style={{
                        height: '36px',
                        border: isCurrent ? '2px solid #005a9c' : border,
                        background: btnBg,
                        color: btnColor,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      {idx + 1}
                      {flagged && (
                        <span style={{ position: 'absolute', top: '-3px', right: '1px', color: '#d97706', fontSize: '0.7rem' }}>
                          🔖
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Navigation Buttons (Back, Check Answer, Next) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentIndex > 0 && (
            <button
              onClick={() => onNavigate(currentIndex - 1)}
              style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '20px',
                padding: '8px 20px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
          )}

          <button
            onClick={handleCheck}
            disabled={isCurrentChecked}
            style={{
              background: isCurrentChecked ? '#f1f5f9' : '#ffffff',
              border: '1.5px solid #005a9c',
              borderRadius: '20px',
              padding: '8px 18px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: isCurrentChecked ? '#94a3b8' : '#005a9c',
              cursor: isCurrentChecked ? 'not-allowed' : 'pointer'
            }}
          >
            {isCurrentChecked ? "Checked" : "Check Answer"}
          </button>

          <button
            onClick={() => {
              if (currentIndex < questions.length - 1) onNavigate(currentIndex + 1);
            }}
            disabled={currentIndex === questions.length - 1}
            style={{
              background: '#2563eb',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 26px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#ffffff',
              cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === questions.length - 1 ? 0.6 : 1,
              boxShadow: '0 2px 4px rgba(37,99,235,0.25)'
            }}
          >
            Next
          </button>
        </div>
      </footer>

      {/* Floating Dustbin Delete Popover */}
      {dustbinPopover && (
        <div 
          className="sat-dustbin-popover"
          style={{
            position: 'fixed',
            top: `${dustbinPopover.y}px`,
            left: `${dustbinPopover.x}px`,
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: '#fff',
            borderRadius: '6px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            zIndex: 1000,
            animation: 'fadeIn 0.12s ease-out'
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button 
            type="button"
            onClick={handleDeleteHighlight}
            style={{
              background: '#ef4444',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '3px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Delete this highlight"
          >
            🗑️ Delete
          </button>
          <button 
            type="button"
            onClick={() => setDustbinPopover(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', padding: '2px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Highlights & Notes Scratchpad Drawer */}
      {showNotesDrawer && (
        <div style={{
          position: 'fixed',
          right: '20px',
          top: '74px',
          width: '340px',
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 90,
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111' }}>Highlights & Notes</span>
            <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }} onClick={() => setShowNotesDrawer(false)}>✕</button>
          </div>

          {/* Highlighting Tools in Drawer */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
              HIGHLIGHTER PEN SELECTION
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={() => setActivePen(activePen === 'yellow' ? null : 'yellow')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: activePen === 'yellow' ? '#fef08a' : '#ffffff',
                  border: activePen === 'yellow' ? '2px solid #ca8a04' : '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#854d0e',
                  cursor: 'pointer',
                  boxShadow: activePen === 'yellow' ? '0 1px 4px rgba(202,138,4,0.25)' : 'none'
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }} />
                Yellow Pen {activePen === 'yellow' ? '✓' : ''}
              </button>

              <button 
                type="button"
                onClick={() => setActivePen(activePen === 'pink' ? null : 'pink')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: activePen === 'pink' ? '#fbcfe8' : '#ffffff',
                  border: activePen === 'pink' ? '2px solid #db2777' : '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#9d174d',
                  cursor: 'pointer',
                  boxShadow: activePen === 'pink' ? '0 1px 4px rgba(219,39,119,0.25)' : 'none'
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ec4899' }} />
                Pink Pen {activePen === 'pink' ? '✓' : ''}
              </button>

              <button 
                type="button"
                onClick={() => setActivePen(null)}
                style={{
                  background: activePen === null ? '#e2e8f0' : '#ffffff',
                  border: activePen === null ? '2px solid #64748b' : '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cursor {activePen === null ? '✓' : ''}
              </button>

              <button 
                type="button"
                onClick={clearAllHighlightsForQuestion}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
                title="Clear all highlights on this question"
              >
                Clear All
              </button>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '8px', lineHeight: 1.4 }}>
              💡 Select a pen, then drag over any text in the passage to highlight it immediately. Click any highlight to reveal the 🗑️ dustbin and delete it.
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
            PERSONAL NOTES
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Jot down transition notes, scratchwork, or keywords..."
            style={{ width: '100%', height: '140px', padding: '10px', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'none' }}
          />
        </div>
      )}

      {/* Error Log Modal */}
      {showErrorModal && (
        <div className="modal-backdrop" onClick={() => setShowErrorModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Missed Questions & Error Log ({errorLog.length})</h3>
              <button className="btn" onClick={() => setShowErrorModal(false)}>Close</button>
            </div>
            <div className="modal-body">
              {errorLog.length === 0 ? (
                <p style={{ color: '#666' }}>No mistakes recorded yet. Keep solving!</p>
              ) : (
                errorLog.map((err, i) => (
                  <div key={err.id || i} className="error-card">
                    <div className="error-card-header">
                      <span>#{err.qIndex} (ID: {err.id}) — Difficulty: {err.difficulty}</span>
                      <span>Time: {err.timeSpent}</span>
                    </div>
                    <p style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
                      <strong>Context:</strong> {err.passage}
                    </p>
                    <p style={{ color: 'var(--incorrect)', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <strong>Your Answer:</strong> {err.yourAnswer}
                    </p>
                    <p style={{ color: 'var(--correct)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      <strong>Correct Answer:</strong> {err.correctAnswer}
                    </p>
                    <div style={{ fontSize: '0.88rem', color: '#444', background: '#f9f9f9', padding: '8px', borderLeft: '3px solid #666' }}>
                      <strong>Rationale:</strong> {err.rationale}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
