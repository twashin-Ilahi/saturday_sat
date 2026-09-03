import React, { useState, useRef } from 'react';
import { SYLLABUS } from '../data/questions';
import AiAnalysisModal from './AiAnalysisModal';

export default function Dashboard({
  questions,
  currentIndex,
  selectedAnswers,
  checkedStatus,
  errorLog,
  user,
  onSignOut,
  onOpenSettings,
  onStartPractice,
  onJumpToQuestion,
  onOpenErrorLog,
  onStartSerialErrorDrill,
  onReset,
  onExport,
  onImport,
}) {
  const [selectedSection, setSelectedSection] = useState("Reading and Writing");
  const [selectedSkillId, setSelectedSkillId] = useState("transitions");
  const [difficultyFilter, setDifficultyFilter] = useState("All"); // All | Easy | Medium | Hard
  const [statusFilter, setStatusFilter] = useState("All"); // All | Unanswered | Missed | Correct
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const fileInputRef = useRef(null);

  // Compute metrics
  const totalCount = questions.length;
  const answeredIndices = [];
  let correctCount = 0;
  let incorrectCount = 0;

  questions.forEach((q, idx) => {
    if (checkedStatus[idx]) {
      answeredIndices.push(idx);
      if (selectedAnswers[idx] === q.answer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
  });

  const accuracy = answeredIndices.length > 0 
    ? Math.round((correctCount / answeredIndices.length) * 100) 
    : 0;

  // Question counts by difficulty
  const easyCount = questions.filter(q => q.difficulty === 'Easy').length;
  const medCount = questions.filter(q => q.difficulty === 'Medium').length;
  const hardCount = questions.filter(q => q.difficulty === 'Hard').length;

  const difficultyBreakdown = {
    easy: {
      total: easyCount,
      answered: questions.filter((q, i) => q.difficulty === 'Easy' && checkedStatus[i]).length,
      correct: questions.filter((q, i) => q.difficulty === 'Easy' && checkedStatus[i] && selectedAnswers[i] === q.answer).length,
    },
    medium: {
      total: medCount,
      answered: questions.filter((q, i) => q.difficulty === 'Medium' && checkedStatus[i]).length,
      correct: questions.filter((q, i) => q.difficulty === 'Medium' && checkedStatus[i] && selectedAnswers[i] === q.answer).length,
    },
    hard: {
      total: hardCount,
      answered: questions.filter((q, i) => q.difficulty === 'Hard' && checkedStatus[i]).length,
      correct: questions.filter((q, i) => q.difficulty === 'Hard' && checkedStatus[i] && selectedAnswers[i] === q.answer).length,
    }
  };

  difficultyBreakdown.easy.accuracy = difficultyBreakdown.easy.answered > 0 
    ? Math.round((difficultyBreakdown.easy.correct / difficultyBreakdown.easy.answered) * 100) 
    : 0;
  difficultyBreakdown.medium.accuracy = difficultyBreakdown.medium.answered > 0 
    ? Math.round((difficultyBreakdown.medium.correct / difficultyBreakdown.medium.answered) * 100) 
    : 0;
  difficultyBreakdown.hard.accuracy = difficultyBreakdown.hard.answered > 0 
    ? Math.round((difficultyBreakdown.hard.correct / difficultyBreakdown.hard.answered) * 100) 
    : 0;

  const handleStartDrill = (drillType) => {
    if (drillType === 'errors') {
      if (errorLog.length > 0) {
        onJumpToQuestion(errorLog[0].qIndex - 1);
      }
    } else if (drillType === 'hard') {
      const firstHard = questions.findIndex((q, i) => q.difficulty === 'Hard' && !checkedStatus[i]);
      onJumpToQuestion(firstHard !== -1 ? firstHard : questions.findIndex(q => q.difficulty === 'Hard'));
    } else {
      const nextUnanswered = checkedStatus.findIndex(s => !s);
      onJumpToQuestion(nextUnanswered !== -1 ? nextUnanswered : 0);
    }
  };

  // Filter questions for the grid
  const filteredQuestions = questions.map((q, idx) => ({ ...q, originalIndex: idx })).filter(q => {
    if (difficultyFilter !== "All" && q.difficulty !== difficultyFilter) return false;
    if (statusFilter === "Unanswered" && checkedStatus[q.originalIndex]) return false;
    if (statusFilter === "Correct" && (!checkedStatus[q.originalIndex] || selectedAnswers[q.originalIndex] !== q.answer)) return false;
    if (statusFilter === "Missed" && (!checkedStatus[q.originalIndex] || selectedAnswers[q.originalIndex] === q.answer)) return false;
    return true;
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        onImport(evt.target.result);
        alert("Progress restored successfully!");
      } catch (err) {
        alert("Error importing backup: Invalid format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const currentSectionData = SYLLABUS.find(s => s.section === selectedSection) || SYLLABUS[0];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', color: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid var(--cb-border)', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--cb-blue)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '1.1rem' }}>
            CB
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111', lineHeight: 1.2 }}>
                Digital SAT Practice Platform
              </h1>
              <span style={{ 
                fontSize: '0.76rem', 
                fontWeight: 600, 
                color: 'var(--cb-blue)', 
                background: '#edf4fc', 
                padding: '2px 8px', 
                borderRadius: '4px', 
                border: '1px solid #c9dff7',
                letterSpacing: '0.2px'
              }}>
                Developed by Twashin Ilahi
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#666' }}>
              Official College Board Question Bank & Practice System
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ 
            fontSize: '0.82rem', 
            fontWeight: 600, 
            color: '#334155', 
            background: '#f8fafc', 
            padding: '5px 12px', 
            borderRadius: '4px', 
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Developed by Twashin Ilahi
          </div>
          <button 
            className="btn" 
            style={{ background: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe', fontWeight: 600 }}
            onClick={() => setShowAiModal(true)}
          >
            ✨ AI Analysis & Drills
          </button>
          <button 
            className="btn btn-danger" 
            onClick={onOpenErrorLog || (() => setShowErrorModal(true))}
            title="Open comprehensive Error Log Directory"
          >
            Error Directory ({errorLog.length})
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
              if (confirm("Are you sure you want to reset all progress and error log?")) {
                onReset();
              }
            }}
          >
            Reset All
          </button>

          <button
            className="btn"
            onClick={onOpenSettings}
            style={{
              background: '#f8fafc',
              color: '#1e293b',
              borderColor: '#cbd5e1',
              fontWeight: 600,
              fontSize: '0.82rem'
            }}
            title="Settings & Cloud Sync"
          >
            ⚙️ Settings & Cloud Sync
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #cbd5e1' }}>
              <div 
                onClick={onOpenSettings}
                style={{ 
                  fontSize: '0.8rem', 
                  color: user.isGuest ? '#15803d' : '#334155', 
                  background: user.isGuest ? '#f0fdf4' : 'transparent',
                  border: user.isGuest ? '1px solid #bbf7d0' : 'none',
                  padding: user.isGuest ? '4px 9px' : '0',
                  borderRadius: '4px',
                  fontWeight: 600,
                  maxWidth: '200px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer'
                }} 
                title={user.isGuest ? "Guest Mode: Click to open Settings & Sync" : `${user.email} (Click to open Settings & Sync)`}
              >
                👤 {user.isGuest ? 'Guest (Offline)' : user.email}
              </div>
              <button 
                className="btn" 
                onClick={onSignOut}
                style={{
                  fontSize: '0.78rem',
                  color: user.isGuest ? '#005a9c' : '#b91c1c',
                  borderColor: user.isGuest ? '#bfdbfe' : '#fca5a5',
                  background: user.isGuest ? '#eff6ff' : '#fef2f2',
                  padding: '5px 10px'
                }}
                title={user.isGuest ? "Sign in or register an account" : "Sign out of your account"}
              >
                {user.isGuest ? "Sign In / Register" : "Sign Out"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Dashboard Container */}
      <div style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 20px', width: '100%', flex: 1 }}>
        
        {/* Progress Stats Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '6px', border: '1px solid var(--cb-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Questions</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111', marginTop: '4px' }}>{totalCount}</div>
            <div style={{ fontSize: '0.82rem', color: '#555', marginTop: '4px' }}>Transitions Skill Set</div>
          </div>

          <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '6px', border: '1px solid var(--cb-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--cb-blue)', marginTop: '4px' }}>
              {answeredIndices.length} <span style={{ fontSize: '1rem', color: '#888', fontWeight: 500 }}>/ {totalCount}</span>
            </div>
            <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--cb-blue)', height: '100%', width: `${(answeredIndices.length / totalCount) * 100}%` }} />
            </div>
          </div>

          <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '6px', border: '1px solid var(--cb-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Accuracy Rate</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--correct)', marginTop: '4px' }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: '0.82rem', color: '#555', marginTop: '4px' }}>
              {correctCount} correct • {incorrectCount} incorrect
            </div>
          </div>

          <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '6px', border: '1px solid var(--cb-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logged Mistakes</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: errorLog.length > 0 ? 'var(--incorrect)' : '#555', marginTop: '4px' }}>
              {errorLog.length}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#555', marginTop: '4px' }}>
              {errorLog.length > 0 ? "Saved in Error Directory for review" : "Clean sheet!"}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button 
                onClick={onOpenErrorLog}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#b91c1c',
                  cursor: 'pointer'
                }}
              >
                Open Directory
              </button>
              {errorLog.length > 0 && (
                <button 
                  onClick={() => onStartSerialErrorDrill(errorLog)}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>▶</span> Serial Drill
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Type & Skill Selector (The requested core feature!) */}
        <div style={{ background: '#fff', borderRadius: '6px', border: '1px solid var(--cb-border)', marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--cb-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>
                Question Types & Skill Navigator
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>
                Select your target SAT domain and skill to practice
              </p>
            </div>

            {/* Section Switcher Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px', gap: '4px' }}>
              {SYLLABUS.map(sec => (
                <button
                  key={sec.section}
                  onClick={() => setSelectedSection(sec.section)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: selectedSection === sec.section ? '#ffffff' : 'transparent',
                    color: selectedSection === sec.section ? 'var(--cb-blue)' : '#555',
                    boxShadow: selectedSection === sec.section ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {sec.section}
                </button>
              ))}
            </div>
          </div>

          {/* Domains and Skills list */}
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {currentSectionData.domains.map(dom => (
                <div key={dom.name} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px 16px', background: '#fafbfc' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#222', marginBottom: '4px' }}>
                    {dom.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '12px', minHeight: '36px' }}>
                    {dom.description}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dom.skills.map(sk => {
                      const isSelected = sk.id === selectedSkillId;
                      return (
                        <div
                          key={sk.id}
                          onClick={() => {
                            if (sk.available) setSelectedSkillId(sk.id);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '4px',
                            border: isSelected ? '1.5px solid var(--cb-blue)' : '1px solid #e0e0e0',
                            background: isSelected ? '#edf4fc' : sk.available ? '#ffffff' : '#f9fafb',
                            cursor: sk.available ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: isSelected ? 700 : 600, fontSize: '0.88rem', color: isSelected ? 'var(--cb-blue)' : sk.available ? '#111' : '#888' }}>
                              {sk.name}
                            </div>
                            {sk.available && (
                              <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px' }}>
                                {sk.questionCount} Questions Available
                              </div>
                            )}
                          </div>

                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '10px',
                            background: sk.available ? '#dcfce7' : '#f1f5f9',
                            color: sk.available ? '#166534' : '#94a3b8'
                          }}>
                            {sk.available ? "Active" : "Coming Soon"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Skill: Practice Launch Bar & Question Matrix */}
        <div style={{ background: '#fff', borderRadius: '6px', border: '1px solid var(--cb-border)', padding: '22px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--cb-border)', paddingBottom: '18px', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                  READY TO PRACTICE
                </span>
                <span style={{ fontSize: '0.85rem', color: '#555' }}>
                  Reading and Writing &gt; Expression of Ideas
                </span>
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111', marginTop: '4px' }}>
                Transitions (70 Authentic Practice Questions)
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className="btn" 
                style={{ background: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe', padding: '9px 16px', fontSize: '0.92rem', fontWeight: 600 }}
                onClick={() => setShowAiModal(true)}
              >
                ✨ AI Recommendations & Drills
              </button>
              {errorLog.length > 0 && (
                <button 
                  className="btn btn-danger" 
                  style={{ padding: '9px 16px', fontSize: '0.92rem' }}
                  onClick={() => {
                    const firstError = errorLog[0];
                    if (firstError) onJumpToQuestion(firstError.qIndex - 1);
                  }}
                >
                  Review Missed Questions ({errorLog.length})
                </button>
              )}
              <button 
                className="btn btn-primary" 
                style={{ padding: '9px 20px', fontSize: '0.95rem' }}
                onClick={() => onStartPractice(currentIndex)}
              >
                {answeredIndices.length === 0 ? "Start Practice" : `Resume Practice (Q${currentIndex + 1})`} →
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Difficulty:</span>
              {["All", "Easy", "Medium", "Hard"].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: difficultyFilter === diff ? 'var(--cb-blue)' : '#dcdcdc',
                    background: difficultyFilter === diff ? '#edf4fc' : '#fff',
                    color: difficultyFilter === diff ? 'var(--cb-blue)' : '#444',
                    cursor: 'pointer'
                  }}
                >
                  {diff} {diff === "All" ? `(${totalCount})` : diff === "Easy" ? `(${easyCount})` : diff === "Medium" ? `(${medCount})` : `(${hardCount})`}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Status:</span>
              {[
                { id: "All", label: "All" },
                { id: "Unanswered", label: `Unanswered (${totalCount - answeredIndices.length})` },
                { id: "Correct", label: `Correct (${correctCount})` },
                { id: "Missed", label: `Missed (${incorrectCount})` }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: statusFilter === st.id ? 'var(--cb-blue)' : '#dcdcdc',
                    background: statusFilter === st.id ? '#edf4fc' : '#fff',
                    color: statusFilter === st.id ? 'var(--cb-blue)' : '#444',
                    cursor: 'pointer'
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Question Matrix Grid (Click any number to jump directly) */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Click any question number to start practicing immediately:</span>
              <span style={{ fontSize: '0.78rem' }}>
                Showing {filteredQuestions.length} of {totalCount} questions
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: '8px' }}>
              {filteredQuestions.map((q) => {
                const idx = q.originalIndex;
                const isChecked = checkedStatus[idx];
                const isCorrect = isChecked && selectedAnswers[idx] === q.answer;
                const isIncorrect = isChecked && selectedAnswers[idx] !== q.answer;
                const isCurrent = idx === currentIndex;

                let bg = "#f8f9fa";
                let borderColor = "#dcdcdc";
                let textColor = "#333";

                if (isCorrect) {
                  bg = "#e8f5e9";
                  borderColor = "var(--correct)";
                  textColor = "var(--correct)";
                } else if (isIncorrect) {
                  bg = "#ffebee";
                  borderColor = "var(--incorrect)";
                  textColor = "var(--incorrect)";
                }

                // difficulty dot color
                const dotColor = q.difficulty === "Easy" ? "#16a34a" : q.difficulty === "Medium" ? "#ea580c" : "#dc2626";

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => onJumpToQuestion(idx)}
                    title={`Q${idx + 1} (${q.difficulty}) - ${q.id} ${isChecked ? (isCorrect ? '- Correct' : '- Incorrect') : '- Unanswered'}`}
                    style={{
                      height: '44px',
                      borderRadius: '4px',
                      border: `1px solid ${borderColor}`,
                      background: bg,
                      color: textColor,
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: isCurrent ? '0 0 0 2px var(--cb-blue)' : 'none',
                      transition: 'transform 0.1s'
                    }}
                  >
                    <span>{idx + 1}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: dotColor, marginTop: '2px' }} />
                  </button>
                );
              })}
            </div>

            {/* Matrix Legend */}
            <div style={{ display: 'flex', gap: '18px', marginTop: '16px', fontSize: '0.8rem', color: '#666', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#e8f5e9', border: '1px solid var(--correct)' }} />
                <span>Correct</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ffebee', border: '1px solid var(--incorrect)' }} />
                <span>Incorrect</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#f8f9fa', border: '1px solid #dcdcdc' }} />
                <span>Unanswered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                <span>Easy</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ea580c' }} />
                <span>Medium</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }} />
                <span>Hard</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{ background: '#fff', borderTop: '1px solid var(--cb-border)', padding: '14px 28px', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
        Digital SAT® Suite of Assessments • Transitions Practice Platform • Developed by Twashin Ilahi
      </footer>

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
                      <button 
                        className="btn btn-primary" 
                        style={{ fontSize: '0.78rem', padding: '3px 8px' }}
                        onClick={() => {
                          setShowErrorModal(false);
                          onJumpToQuestion(err.qIndex - 1);
                        }}
                      >
                        Go to Question →
                      </button>
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

      {/* Gemini AI Performance Analysis & Recommendations Modal */}
      <AiAnalysisModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        totalCount={totalCount}
        completedCount={answeredIndices.length}
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        accuracy={accuracy}
        errorLog={errorLog}
        difficultyBreakdown={difficultyBreakdown}
        onJumpToQuestion={onJumpToQuestion}
        onStartDrill={handleStartDrill}
      />
    </div>
  );
}
