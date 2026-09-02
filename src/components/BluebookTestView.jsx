import React, { useState, useEffect, useRef } from 'react';
import { formatTime } from '../utils/storage';

export default function BluebookTestView({
  questions,
  currentIndex,
  selectedAnswers,
  checkedStatus,
  errorLog,
  autoStartEnabled,
  onSelectChoice,
  onCheckAnswer,
  onNavigate,
  onToggleAutoStart,
  onReset,
  onExport,
  onImport,
  onReturnToDashboard,
}) {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const fileInputRef = useRef(null);

  const q = questions[currentIndex] || questions[0];
  const isCurrentChecked = checkedStatus[currentIndex];
  const currentSelection = selectedAnswers[currentIndex];

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // When question changes, reset timer and auto-start if configured
  useEffect(() => {
    setTimerSeconds(0);
    if (autoStartEnabled && !checkedStatus[currentIndex]) {
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  }, [currentIndex, autoStartEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if modal is open or target is an input
      if (showErrorModal || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

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
          setIsRunning(false);
          onCheckAnswer(currentIndex, timerSeconds);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isCurrentChecked, currentSelection, questions.length, showErrorModal, timerSeconds]);

  const handleCheck = () => {
    if (currentSelection === null) {
      alert("Please select an answer before checking.");
      return;
    }
    setIsRunning(false);
    onCheckAnswer(currentIndex, timerSeconds);
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

  // Difficulty bars active count: Easy = 1, Medium = 2, Hard = 3
  const activeBars = q.difficulty === "Easy" ? 1 : q.difficulty === "Medium" ? 2 : 3;

  // Render passage with blank styled
  const renderedPassage = q.passage.replace(
    "[BLANK]",
    '<span class="blank-space">______</span>'
  );

  const letters = ["A", "B", "C", "D"];
  const isCorrect = currentSelection === q.answer;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fff' }}>
      {/* Top Utilities */}
      <div className="top-utility-bar">
        <div className="utility-group">
          <button className="btn" onClick={onReturnToDashboard} title="Return to Dashboard">
            ← Dashboard
          </button>
          <div className="timer-display">{formatTime(timerSeconds)}</div>
          <button 
            className={`btn ${isRunning ? 'btn-danger' : ''}`}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? "Pause Clock" : "Start Clock"}
          </button>
          <button className="btn" onClick={() => { setIsRunning(false); setTimerSeconds(0); }}>
            Reset Clock
          </button>
          <label style={{ fontSize: '0.85rem', color: '#555', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoStartEnabled} 
              onChange={(e) => onToggleAutoStart(e.target.checked)} 
            /> 
            Auto-start
          </label>
        </div>

        <div className="utility-group">
          <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#444' }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <select 
            className="btn" 
            value={currentIndex} 
            onChange={(e) => onNavigate(parseInt(e.target.value, 10))}
          >
            {questions.map((item, idx) => (
              <option key={item.id || idx} value={idx}>
                Q{idx + 1} ({item.difficulty}){checkedStatus[idx] ? " ✓" : ""}
              </option>
            ))}
          </select>
          <button className="btn btn-danger" onClick={() => setShowErrorModal(true)}>
            Error Log ({errorLog.length})
          </button>
          <button className="btn btn-backup" onClick={onExport}>
            Backup Data
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".json" 
            onChange={handleFileChange} 
          />
          <button className="btn btn-backup" onClick={() => fileInputRef.current?.click()}>
            Load Backup
          </button>
          <button 
            className="btn" 
            style={{ color: '#666', fontSize: '0.8rem' }} 
            onClick={() => {
              if (confirm("Are you sure you want to reset all progress and the error log?")) {
                onReset();
                setTimerSeconds(0);
                setIsRunning(false);
              }
            }}
          >
            Reset All
          </button>
        </div>
      </div>

      {/* College Board Header Table */}
      <table className="cb-meta-table">
        <thead>
          <tr>
            <th style={{ width: '18%' }}>Assessment</th>
            <th style={{ width: '26%' }}>Section</th>
            <th style={{ width: '24%' }}>Domain</th>
            <th style={{ width: '18%' }}>Skill</th>
            <th style={{ width: '14%' }}>Difficulty</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{q.assessment || "SAT"}</td>
            <td>{q.section || "Reading and Writing"}</td>
            <td>{q.domain || "Expression of Ideas"}</td>
            <td>{q.skill || "Transitions"}</td>
            <td>
              <div className="diff-bars">
                <div className={`diff-bar ${activeBars >= 1 ? 'active' : ''}`} />
                <div className={`diff-bar ${activeBars >= 2 ? 'active' : ''}`} />
                <div className={`diff-bar ${activeBars >= 3 ? 'active' : ''}`} />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Main Question Split Workspace */}
      <div className="workspace">
        {/* Left Pane: Passage */}
        <div className="left-pane">
          <div className="section-header">{q.section || "Reading and Writing"}</div>
          <div className="diff-text">Difficulty: {q.difficulty}</div>
          <div 
            className="passage-body" 
            dangerouslySetInnerHTML={{ __html: renderedPassage }} 
          />
          <div className="prompt-text">
            {q.prompt || "Which choice completes the text with the most logical transition?"}
          </div>
        </div>

        {/* Right Pane: Answer Choices */}
        <div className="right-pane">
          <div className="answer-title">Answer</div>
          <div className="choices-container">
            {q.choices.map((choice, idx) => {
              let choiceClass = "choice-item";
              if (currentSelection === idx) choiceClass += " selected";
              if (isCurrentChecked) {
                if (idx === q.answer) choiceClass += " correct-revealed";
                if (currentSelection === idx && idx !== q.answer) choiceClass += " incorrect-revealed";
              }

              return (
                <label 
                  key={idx} 
                  className={choiceClass} 
                  onClick={() => {
                    if (!isCurrentChecked) onSelectChoice(currentIndex, idx);
                  }}
                >
                  <input 
                    type="radio" 
                    name={`choice_${q.id}`} 
                    value={idx} 
                    checked={currentSelection === idx} 
                    disabled={isCurrentChecked} 
                    onChange={() => {
                      if (!isCurrentChecked) onSelectChoice(currentIndex, idx);
                    }} 
                  />
                  <span><strong>{letters[idx]}.</strong> {choice}</span>
                </label>
              );
            })}
          </div>

          {/* Rationale Container */}
          {isCurrentChecked && (
            <div className="rationale-container">
              <div 
                className="rationale-title" 
                style={{ color: isCorrect ? 'var(--correct)' : 'var(--incorrect)' }}
              >
                {isCorrect ? "✓ Correct" : "✕ Incorrect"}
              </div>
              <div style={{ color: '#222' }}>{q.rationale}</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="footer-bar">
        <div className="qid-indicator">Question ID: {q.id}</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn" 
            disabled={currentIndex === 0} 
            onClick={() => onNavigate(currentIndex - 1)}
          >
            Previous
          </button>
          <button 
            className="btn btn-primary" 
            disabled={isCurrentChecked} 
            onClick={handleCheck}
          >
            {isCurrentChecked ? "Checked" : "Check Answer"}
          </button>
          <button 
            className="btn" 
            disabled={currentIndex === questions.length - 1} 
            onClick={() => onNavigate(currentIndex + 1)}
          >
            Next
          </button>
        </div>
      </div>

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
                      <span>Time Spent: {err.timeSpent}</span>
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
