import React, { useState } from 'react';
import { analyzePerformanceAndRecommendDrills, getApiKey, saveApiKey } from '../utils/gemini';

export default function AiAnalysisModal({
  isOpen,
  onClose,
  totalCount,
  completedCount,
  correctCount,
  incorrectCount,
  accuracy,
  errorLog,
  difficultyBreakdown,
  onJumpToQuestion,
  onStartDrill,
}) {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [customKey, setCustomKey] = useState(getApiKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [latency, setLatency] = useState(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    setLoading(true);
    setErrorMsg("");
    setAnalysisText("");

    const res = await analyzePerformanceAndRecommendDrills({
      totalCount,
      completedCount,
      correctCount,
      incorrectCount,
      accuracy,
      errorLog,
      difficultyBreakdown
    });

    setLoading(false);
    if (res.success) {
      setAnalysisText(res.text);
      setLatency(res.latencyMs);
    } else {
      setErrorMsg(res.error || "Failed to analyze performance.");
    }
  };

  const handleSaveKey = () => {
    saveApiKey(customKey);
    setShowKeyInput(false);
    alert("Gemini API key updated!");
  };

  // Simple markdown renderer for headers, bold, bullet points
  const formatMarkdown = (md) => {
    if (!md) return null;

    const lines = md.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cb-blue)', marginTop: '18px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111', marginTop: '20px', marginBottom: '10px' }}>
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const content = line.substring(2);
        return (
          <li key={idx} style={{ marginLeft: '20px', marginBottom: '6px', lineHeight: 1.6 }}>
            <span dangerouslySetInnerHTML={{ __html: parseBold(content) }} />
          </li>
        );
      }
      if (line.trim().length === 0) {
        return <div key={idx} style={{ height: '8px' }} />;
      }
      return (
        <p key={idx} style={{ marginBottom: '8px', lineHeight: 1.65, color: '#222' }} dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
      );
    });
  };

  const parseBold = (str) => {
    return str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#f8fafc', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'var(--cb-blue)', color: '#fff', fontSize: '1rem', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              ✦
            </span>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Gemini AI Performance Analysis & Drilling Coach
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
                Powered by Gemini 3.8 Flash • Digital SAT Transitions Diagnostic
              </p>
            </div>
          </div>
          <button className="btn" onClick={onClose}>✕ Close</button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Quick Metrics Bar inside Modal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px', background: '#f1f5f9', padding: '12px 16px', borderRadius: '6px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>COMPLETED</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111' }}>{completedCount} / {totalCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>ACCURACY</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: accuracy >= 75 ? 'var(--correct)' : 'var(--cb-blue)' }}>{accuracy}%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>LOGGED MISTAKES</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: errorLog.length > 0 ? 'var(--incorrect)' : '#555' }}>{errorLog.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>DIFFICULTY SPREAD</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '3px' }}>
                <span style={{ color: '#16a34a' }}>E: {difficultyBreakdown.easy.accuracy}%</span> • <span style={{ color: '#ea580c' }}>M: {difficultyBreakdown.medium.accuracy}%</span> • <span style={{ color: '#dc2626' }}>H: {difficultyBreakdown.hard.accuracy}%</span>
              </div>
            </div>
          </div>

          {/* Key configuration toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '8px 18px', fontSize: '0.92rem', gap: '8px' }}
              disabled={loading}
              onClick={handleRunAnalysis}
            >
              {loading ? "Analyzing Performance..." : (analysisText ? "Re-Run Gemini Analysis" : "Generate Gemini Analysis & Drilling Plan")}
            </button>

            <button 
              className="btn" 
              style={{ fontSize: '0.78rem', color: '#666' }}
              onClick={() => setShowKeyInput(!showKeyInput)}
            >
              ⚙ Gemini API Key {showKeyInput ? "▲" : "▼"}
            </button>
          </div>

          {showKeyInput && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Custom Google Gemini API Key:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="password"
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                  placeholder="Paste AI Studio API key (starts with AIza...)"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
                <button className="btn btn-primary" onClick={handleSaveKey}>Save Key</button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '6px' }}>
                Uses your local key securely in-browser without sending it to external servers.
              </p>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ padding: '36px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--cb-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 600, color: '#333' }}>Gemini is analyzing your error patterns & pacing...</div>
              <p style={{ fontSize: '0.82rem', color: '#666', marginTop: '6px' }}>Synthesizing transition logic rules and tailoring high-yield drilling drills.</p>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '14px 18px', color: '#b91c1c', fontSize: '0.9rem', marginBottom: '16px' }}>
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          {/* Report Output */}
          {analysisText && !loading && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#166534', background: '#dcfce7', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                  ✓ Analysis Complete {latency ? `(${latency}ms)` : ''}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#888' }}>Model: gemini-flash-latest</span>
              </div>

              <div>{formatMarkdown(analysisText)}</div>

              {/* Action drill buttons */}
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {errorLog.length > 0 && (
                  <button 
                    className="btn btn-danger" 
                    onClick={() => {
                      onClose();
                      onStartDrill('errors');
                    }}
                  >
                    ⚡ Drill Missed Questions ({errorLog.length})
                  </button>
                )}
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onStartDrill('hard');
                  }}
                >
                  ⚡ Drill Hard Level Questions
                </button>
                <button 
                  className="btn"
                  onClick={() => {
                    onClose();
                    onStartDrill('all');
                  }}
                >
                  Resume Next Unanswered
                </button>
              </div>
            </div>
          )}

          {!analysisText && !loading && (
            <div style={{ textAlign: 'center', padding: '36px 20px', border: '1.5px dashed #cbd5e1', borderRadius: '6px', background: '#f8fafc' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111', marginBottom: '6px' }}>
                Ready to Analyze Your SAT Performance
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#555', maxWidth: '520px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                Gemini will inspect all {completedCount} answered questions, uncover the exact transition traps you tend to fall for, and design a custom drill sequence to reach mastery.
              </p>
              <button className="btn btn-primary" style={{ padding: '8px 20px' }} onClick={handleRunAnalysis}>
                Run AI Performance Analysis Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
