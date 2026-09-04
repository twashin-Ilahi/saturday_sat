import React, { useState, useMemo } from 'react';
import { formatTime } from '../utils/storage';
import { explainSingleQuestionWithGemini } from '../utils/gemini';
import VisualExplanation from './VisualExplanation';

export default function ErrorLogView({
  errorLog = [],
  allQuestions = [],
  user,
  cloudSyncStatus = 'idle',
  initialSkill = 'All',
  onSignOut,
  onOpenSettings,
  onOpenProfile,
  onReturnToDashboard,
  onStartSerialErrorDrill,
  onJumpToQuestion,
  onRemoveError,
  onMarkMastered
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(initialSkill || "All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [sortBy, setSortBy] = useState("qIndex"); // qIndex | difficulty | recent
  const [statusFilter, setStatusFilter] = useState("All"); // All | Unresolved | Mastered
  const [expandedRationales, setExpandedRationales] = useState({});
  const [aiBreakdownModal, setAiBreakdownModal] = useState(null); // { error, loading, text }

  // Sync when initialSkill changes
  React.useEffect(() => {
    if (initialSkill) {
      setSelectedSkill(initialSkill);
    }
  }, [initialSkill]);

  // Enhance error objects with question data if missing
  const richErrors = useMemo(() => {
    return errorLog.map(err => {
      const originalQ = allQuestions.find(q => q.id === err.id) || (err.originalIndex !== undefined ? allQuestions[err.originalIndex] : null);
      return {
        ...err,
        originalIndex: err.originalIndex !== undefined ? err.originalIndex : (originalQ ? allQuestions.indexOf(originalQ) : (err.qIndex - 1)),
        category: err.category || (originalQ ? originalQ.category : "Continuation / Addition"),
        skill: err.skill || (originalQ ? originalQ.skill : "Transitions"),
        domain: err.domain || (originalQ ? originalQ.domain : "Expression of Ideas"),
        difficulty: err.difficulty || (originalQ ? originalQ.difficulty : "Medium"),
        passage: err.passage || (originalQ ? originalQ.passage : ""),
        prompt: err.prompt || (originalQ ? originalQ.prompt : "Which choice completes the text with the most logical transition?"),
        choices: err.choices || (originalQ ? originalQ.choices : []),
        correctAnswer: err.correctAnswer || (originalQ ? originalQ.choices[originalQ.answer] : ""),
        rationale: err.rationale || (originalQ ? originalQ.rationale : "No rationale available."),
        status: err.status || 'unresolved'
      };
    });
  }, [errorLog, allQuestions]);

  // Skill counts
  const skillCounts = useMemo(() => {
    const counts = { All: richErrors.length };
    richErrors.forEach(err => {
      const s = err.skill || 'Transitions';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [richErrors]);

  const availableSkills = ["All", "Transitions", "Rhetorical Synthesis", "Boundaries", "Form, Structure, and Sense"];

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { All: richErrors.length };
    richErrors.forEach(err => {
      const cat = err.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [richErrors]);

  // Difficulty counts
  const difficultyCounts = useMemo(() => {
    return {
      Easy: richErrors.filter(e => e.difficulty === 'Easy').length,
      Medium: richErrors.filter(e => e.difficulty === 'Medium').length,
      Hard: richErrors.filter(e => e.difficulty === 'Hard').length,
    };
  }, [richErrors]);

  // Identify top trap category
  const topTrapCategory = useMemo(() => {
    let topCat = null;
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (cat !== 'All' && count > maxCount) {
        maxCount = count;
        topCat = cat;
      }
    });
    return topCat ? { name: topCat, count: maxCount, percent: Math.round((maxCount / richErrors.length) * 100) } : null;
  }, [categoryCounts, richErrors.length]);

  // Filtered and sorted errors
  const filteredErrors = useMemo(() => {
    let list = richErrors.filter(err => {
      if (selectedSkill !== "All" && err.skill !== selectedSkill) return false;
      if (selectedCategory !== "All" && err.category !== selectedCategory) return false;
      if (selectedDifficulty !== "All" && err.difficulty !== selectedDifficulty) return false;
      if (statusFilter === "Unresolved" && err.status === "mastered") return false;
      if (statusFilter === "Mastered" && err.status !== "mastered") return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inPassage = err.passage?.toLowerCase().includes(query);
        const inId = err.id?.toLowerCase().includes(query);
        const inYourAnswer = err.yourAnswer?.toLowerCase().includes(query);
        const inCorrectAnswer = err.correctAnswer?.toLowerCase().includes(query);
        const inCategory = err.category?.toLowerCase().includes(query);
        const inSkill = err.skill?.toLowerCase().includes(query);
        return inPassage || inId || inYourAnswer || inCorrectAnswer || inCategory || inSkill;
      }

      return true;
    });

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'difficulty') {
        const order = { 'Hard': 3, 'Medium': 2, 'Easy': 1 };
        return (order[b.difficulty] || 0) - (order[a.difficulty] || 0);
      }
      if (sortBy === 'recent') {
        return (b.timestamp || '').localeCompare(a.timestamp || '');
      }
      return a.qIndex - b.qIndex;
    });

    return list;
  }, [richErrors, selectedSkill, selectedCategory, selectedDifficulty, statusFilter, searchQuery, sortBy]);

  const toggleRationale = (id) => {
    setExpandedRationales(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAskGeminiForError = async (err) => {
    const originalQ = allQuestions[err.originalIndex] || err;
    setAiBreakdownModal({
      error: err,
      loading: true,
      text: ""
    });

    try {
      const explanation = await explainSingleQuestionWithGemini(originalQ, err.yourAnswer);
      setAiBreakdownModal(prev => prev ? { ...prev, loading: false, text: explanation } : null);
    } catch (e) {
      setAiBreakdownModal(prev => prev ? { ...prev, loading: false, text: "Unable to generate explanation. Please check API key." } : null);
    }
  };

  const categoriesList = ["All", "Contrast", "Continuation / Addition", "Cause & Effect", "Exemplification / Restatement", "Sequence / Chronology"];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#111827', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Header Bar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onReturnToDashboard}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.15s'
            }}
          >
            ← Dashboard
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Error Log Directory & Diagnostics
              </h1>
              <span style={{ fontSize: '0.72rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                {errorLog.length} Missed
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Review your mistake history, isolate transition trap patterns, and drill errors sequentially in the Bluebook simulator.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Developed By Attribution */}
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#1e40af',
            background: '#dbeafe',
            border: '1px solid #bfdbfe',
            padding: '4px 10px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>★</span>
            <span>Developed by Twashin Ilahi</span>
          </div>

          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '7px 12px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#005a9c',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Student Profile & Target Scores"
            >
              👤 Profile
            </button>
          )}

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #cbd5e1' }}>
              <span 
                onClick={onOpenProfile || onOpenSettings}
                style={{ 
                  fontSize: '0.8rem', 
                  color: user.isGuest ? '#15803d' : '#334155', 
                  background: user.isGuest ? '#f0fdf4' : 'transparent',
                  border: user.isGuest ? '1px solid #bbf7d0' : 'none',
                  padding: user.isGuest ? '4px 9px' : '0',
                  borderRadius: '4px',
                  fontWeight: 600, 
                  maxWidth: '200px', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }} 
                title={user.isGuest ? "Guest Mode: Click to open Profile & Settings" : `${user.user_metadata?.full_name ? `${user.user_metadata.full_name} (${user.email})` : user.email} (Click to open Profile)`}
              >
                👤 {user.isGuest ? (user.user_metadata?.full_name || 'Guest (Offline)') : (user.user_metadata?.full_name || user.user_metadata?.name || user.email)}
              </span>
              {user && !user.isGuest && (
                <span 
                  onClick={onOpenSettings}
                  style={{ 
                    fontSize: '0.72rem', 
                    color: cloudSyncStatus === 'syncing' ? '#0284c7' : (cloudSyncStatus === 'synced' ? '#15803d' : '#64748b'),
                    background: cloudSyncStatus === 'syncing' ? '#f0f9ff' : (cloudSyncStatus === 'synced' ? '#f0fdf4' : '#f8fafc'),
                    border: `1px solid ${cloudSyncStatus === 'syncing' ? '#bae6fd' : (cloudSyncStatus === 'synced' ? '#bbf7d0' : '#e2e8f0')}`,
                    padding: '3px 7px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title={cloudSyncStatus === 'syncing' ? "Backing up progress to cloud..." : "Automatic cloud backup is active"}
                >
                  {cloudSyncStatus === 'syncing' ? '☁️ Backing up...' : '☁️ Auto-synced'}
                </span>
              )}
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  style={{
                    fontSize: '0.78rem',
                    color: '#334155',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '4px 9px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Settings & Cloud Sync"
                >
                  ⚙️ Settings
                </button>
              )}
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  style={{
                    fontSize: '0.78rem',
                    color: user.isGuest ? '#005a9c' : '#b91c1c',
                    background: user.isGuest ? '#eff6ff' : '#fef2f2',
                    border: user.isGuest ? '1px solid #bfdbfe' : '1px solid #fecaca',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title={user.isGuest ? "Sign in or register an account" : "Sign out of your account"}
                >
                  {user.isGuest ? "Sign In / Register" : "Sign Out"}
                </button>
              )}
            </div>
          )}

          {/* Primary Action: Start Serial Error Drill */}
          {filteredErrors.length > 0 && (
            <button
              onClick={() => onStartSerialErrorDrill(filteredErrors)}
              style={{
                background: '#2563eb',
                border: 'none',
                borderRadius: '20px',
                padding: '9px 22px',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                transition: 'transform 0.1s'
              }}
              title="Enter full Bluebook testing interface and solve all filtered errors sequentially"
            >
              <span>▶</span>
              <span>Start Serial Error Drill ({filteredErrors.length})</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '28px 24px' }}>
        
        {/* Diagnostic Overview Banner */}
        {richErrors.length > 0 && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Total Recorded Errors
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#b91c1c' }}>
                {richErrors.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                Out of {allQuestions.length} practice questions
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Difficulty Spread
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  Easy: {difficultyCounts.Easy}
                </span>
                <span style={{ fontSize: '0.82rem', background: '#dbeafe', color: '#1d4ed8', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  Medium: {difficultyCounts.Medium}
                </span>
                <span style={{ fontSize: '0.82rem', background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  Hard: {difficultyCounts.Hard}
                </span>
              </div>
            </div>

            {topTrapCategory && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Primary Trap Category
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e40af' }}>
                  {topTrapCategory.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                  Accounts for {topTrapCategory.percent}% of all recorded mistakes
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <button
                onClick={() => onStartSerialErrorDrill(filteredErrors.length > 0 ? filteredErrors : richErrors)}
                style={{
                  background: '#1e293b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🔁 {filteredErrors.length !== richErrors.length ? `Drill ${filteredErrors.length} Filtered Errors Serially` : `Review All ${richErrors.length} Errors Serially`}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Filter and Search Controls */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '18px 20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Top Filter Row: Search, Type, Difficulty, Status, Sort */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Live Search */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search passage context, transition word, or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  fontSize: '0.88rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>
                🔍
              </span>
            </div>

            {/* Question Type Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Type:</span>
              <select
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', color: '#334155', fontWeight: selectedSkill !== 'All' ? 700 : 500 }}
              >
                <option value="All">All Question Types ({richErrors.length})</option>
                {availableSkills.filter(s => s !== 'All').map(sk => (
                  <option key={sk} value={sk}>{sk} ({skillCounts[sk] || 0})</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', color: '#334155' }}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', color: '#334155' }}
              >
                <option value="All">All ({richErrors.length})</option>
                <option value="Unresolved">Unresolved</option>
                <option value="Mastered">Mastered</option>
              </select>
            </div>

            {/* Sort Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', color: '#334155' }}
              >
                <option value="qIndex">Question # (Low to High)</option>
                <option value="difficulty">Difficulty (Hardest)</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>

          {/* Question Type Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: '4px' }}>
              Question Type:
            </span>
            {availableSkills.map(sk => {
              const count = skillCounts[sk] || 0;
              const isSelected = selectedSkill === sk;
              return (
                <button
                  key={sk}
                  onClick={() => setSelectedSkill(sk)}
                  style={{
                    background: isSelected ? '#005a9c' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: `1px solid ${isSelected ? '#005a9c' : '#cbd5e1'}`,
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.12s'
                  }}
                >
                  <span>{sk}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    padding: '1px 5px',
                    borderRadius: '10px'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Filter Row: Transition Category Pills (if Transitions or All) */}
          {(selectedSkill === 'All' || selectedSkill === 'Transitions') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: '4px' }}>
                Transition Category:
              </span>
              {categoriesList.map(cat => {
                const count = categoryCounts[cat] || 0;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: isSelected ? '#1e293b' : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#475569',
                      border: `1px solid ${isSelected ? '#1e293b' : '#cbd5e1'}`,
                      borderRadius: '16px',
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.12s'
                    }}
                  >
                    <span>{cat}</span>
                    <span style={{
                      fontSize: '0.7rem',
                      background: isSelected ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                      padding: '1px 5px',
                      borderRadius: '10px'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Error Cards Directory */}
        {filteredErrors.length === 0 ? (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
              {richErrors.length === 0 ? "🎉" : "🔍"}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              {richErrors.length === 0 
                ? "No mistakes recorded yet!" 
                : "No error questions match your current filters."}
            </h3>
            <p style={{ fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 18px', color: '#64748b' }}>
              {richErrors.length === 0
                ? "As you solve questions in the Bluebook simulator, any missed questions will be automatically catalogued here for systematic review."
                : "Try clearing search queries or switching categories to see more missed questions."}
            </p>
            {richErrors.length === 0 ? (
              <button
                onClick={onReturnToDashboard}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Go to Practice Dashboard
              </button>
            ) : (
              <button
                onClick={() => { setSelectedCategory("All"); setSelectedDifficulty("All"); setSearchQuery(""); setStatusFilter("All"); }}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredErrors.map((err, idx) => {
              const isExpanded = expandedRationales[err.id];
              const isMastered = err.status === 'mastered';

              return (
                <div
                  key={err.id || idx}
                  style={{
                    background: '#ffffff',
                    border: `1.5px solid ${isMastered ? '#86efac' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    padding: '20px 24px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    transition: 'border 0.15s ease'
                  }}
                >
                  {/* Top Bar of Error Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Black Question Badge */}
                      <div style={{
                        background: '#111827',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        #{err.qIndex}
                      </div>

                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        ID: {err.id}
                      </span>

                      {/* Skill Badge */}
                      {err.skill && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: err.skill === 'Rhetorical Synthesis' ? '#f5f3ff' : '#f1f5f9',
                          color: err.skill === 'Rhetorical Synthesis' ? '#7c3aed' : '#475569',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: err.skill === 'Rhetorical Synthesis' ? '1px solid #ddd6fe' : '1px solid #cbd5e1'
                        }}>
                          {err.skill}
                        </span>
                      )}

                      {/* Category Badge */}
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #dbeafe'
                      }}>
                        {err.category}
                      </span>

                      {/* Difficulty Badge */}
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: err.difficulty === 'Easy' ? '#dcfce7' : err.difficulty === 'Medium' ? '#dbeafe' : '#fee2e2',
                        color: err.difficulty === 'Easy' ? '#15803d' : err.difficulty === 'Medium' ? '#1d4ed8' : '#b91c1c',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {err.difficulty}
                      </span>

                      {/* Time spent */}
                      {err.timeSpent && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span>⏱</span>
                          <span>{err.timeSpent}</span>
                        </span>
                      )}

                      {isMastered && (
                        <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                          ✓ Mastered
                        </span>
                      )}
                    </div>

                    {/* Quick Drill & Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Drill This Question in Bluebook View */}
                      <button
                        onClick={() => onJumpToQuestion(err.originalIndex)}
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Jump to this question in authentic Bluebook view"
                      >
                        <span>▶</span>
                        <span>Drill in Bluebook</span>
                      </button>

                      {/* Ask Gemini AI Breakdown */}
                      <button
                        onClick={() => handleAskGeminiForError(err)}
                        style={{
                          background: '#fdf4ff',
                          border: '1px solid #f0abfc',
                          color: '#a21caf',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Ask Gemini why you were trapped and how to avoid it"
                      >
                        <span>✨</span>
                        <span>Ask AI Tutor</span>
                      </button>

                      {/* Mark Mastered Toggle */}
                      <button
                        onClick={() => onMarkMastered && onMarkMastered(err.id)}
                        style={{
                          background: isMastered ? '#f0fdf4' : '#ffffff',
                          border: `1px solid ${isMastered ? '#86efac' : '#cbd5e1'}`,
                          color: isMastered ? '#166534' : '#64748b',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title={isMastered ? "Mark as unresolved" : "Mark as mastered"}
                      >
                        {isMastered ? "✓ Mastered" : "Mark Mastered"}
                      </button>

                      {/* Remove from Error Log */}
                      <button
                        onClick={() => {
                          if (confirm(`Remove Question #${err.qIndex} from the error log?`)) {
                            onRemoveError(err.id);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          padding: '4px'
                        }}
                        title="Remove from Error Log"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Context Passage */}
                  <div style={{
                    fontFamily: 'Merriweather, Georgia, Cambria, serif',
                    fontSize: '1rem',
                    lineHeight: 1.7,
                    color: '#1e293b',
                    background: '#f8fafc',
                    padding: '14px 18px',
                    borderRadius: '6px',
                    borderLeft: '4px solid #3b82f6',
                    marginBottom: '14px'
                  }}>
                    {err.passage.includes('•') ? (
                      <div>
                        {err.passage.split('\n\n').map((block, bIdx) => {
                          if (block.includes('•')) {
                            const lines = block.split('\n');
                            const leadText = lines[0].startsWith('•') ? null : lines[0];
                            const bullets = lines.filter(l => l.trim().startsWith('•')).map(l => l.replace(/^•\s*/, ''));
                            return (
                              <div key={bIdx} style={{ marginBottom: '8px' }}>
                                {leadText && <p style={{ marginBottom: '6px' }}>{leadText}</p>}
                                <ul style={{ paddingLeft: '22px', margin: '4px 0', listStyleType: 'disc' }}>
                                  {bullets.map((bText, bulletIdx) => (
                                    <li key={bulletIdx} style={{ marginBottom: '6px', lineHeight: 1.6 }}>
                                      {bText}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                          return <p key={bIdx} style={{ marginBottom: '8px' }}>{block.replace('[BLANK]', '_______')}</p>;
                        })}
                      </div>
                    ) : (
                      err.passage.replace('[BLANK]', '_______')
                    )}
                  </div>

                  {/* Prompt */}
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>
                    {err.prompt}
                  </div>

                  {/* Answer Comparison: Your Answer vs Correct Answer */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                    {/* Your Missed Answer */}
                    <div style={{
                      background: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      borderRadius: '6px',
                      padding: '10px 14px'
                    }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', marginBottom: '2px' }}>
                        ❌ Your Selected Answer:
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#991b1b' }}>
                        {err.yourAnswer}
                      </div>
                    </div>

                    {/* Correct Answer */}
                    <div style={{
                      background: '#f0fdf4',
                      border: '1.5px solid #bbf7d0',
                      borderRadius: '6px',
                      padding: '10px 14px'
                    }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', marginBottom: '2px' }}>
                        ✅ {err.skill === 'Transitions' ? 'Correct Transition:' : 'Correct Answer:'}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#166534' }}>
                        {err.correctAnswer}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible College Board Rationale */}
                  <div>
                    <button
                      onClick={() => toggleRationale(err.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#005a9c',
                        cursor: 'pointer',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0
                      }}
                    >
                      <span>{isExpanded ? "▾ Hide" : "▸ Show"} Official College Board Rationale</span>
                    </button>

                    {isExpanded && (
                      <div style={{
                        marginTop: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '14px 18px',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        color: '#334155'
                      }}>
                        <VisualExplanation
                          rationale={err.rationale}
                          correctAnswerLetter={err.correctAnswerLetter}
                          userChoiceLetter={err.yourAnswer !== undefined && err.yourAnswer !== null ? ['A', 'B', 'C', 'D'][err.yourAnswer] : null}
                          isCorrect={false}
                          showViewToggle={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* 5. Gemini AI Coach Breakdown Modal */}
      {aiBreakdownModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }} onClick={() => setAiBreakdownModal(null)}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed' }}>
                  Gemini AI Diagnostic for Question #{aiBreakdownModal.error?.qIndex}
                </h3>
              </div>
              <button
                onClick={() => setAiBreakdownModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.85rem' }}>
              <div><strong>Your Answer:</strong> <span style={{ color: '#b91c1c' }}>{aiBreakdownModal.error?.yourAnswer}</span></div>
              <div><strong>Correct Answer:</strong> <span style={{ color: '#15803d' }}>{aiBreakdownModal.error?.correctAnswer}</span></div>
            </div>

            {aiBreakdownModal.loading ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#7c3aed' }}>
                <div style={{ fontSize: '1.8rem', animation: 'spin 1s infinite linear', marginBottom: '10px' }}>✦</div>
                <div style={{ fontWeight: 600 }}>Gemini is analyzing the transition trap and formulating recommendations...</div>
              </div>
            ) : (
              <div style={{ fontSize: '0.92rem', lineHeight: 1.65, color: '#334155', whiteSpace: 'pre-wrap' }}>
                {aiBreakdownModal.text}
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setAiBreakdownModal(null)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  const err = aiBreakdownModal.error;
                  setAiBreakdownModal(null);
                  onJumpToQuestion(err.originalIndex);
                }}
                style={{
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 16px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Drill Question Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
