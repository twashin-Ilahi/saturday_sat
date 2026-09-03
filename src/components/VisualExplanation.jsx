import React, { useState } from 'react';

/**
 * Helper to split and parse a College Board rationale into:
 * - correct choice explanation
 * - incorrect choices explanations
 * Strictly maintains 100% of College Board's text.
 */
export function parseRationale(rawText) {
  if (!rawText) return { correct: null, incorrect: [], isSplit: false, raw: '' };

  const text = rawText.trim();

  // Split on Choice boundaries: e.g. "Choice A is...", "Choice B is..."
  const parts = text.split(/(?=(?:Choice\s+[A-D]\s+is\s+(?:the best answer|correct|incorrect)))/i)
    .map(p => p.trim())
    .filter(Boolean);

  let correct = null;
  const incorrect = [];

  parts.forEach(p => {
    const match = p.match(/^Choice\s+([A-D])\s+is\s+(the best answer|correct|incorrect)/i);
    if (match) {
      const letter = match[1].toUpperCase();
      const isIncorrect = /incorrect/i.test(match[2]);
      if (!isIncorrect) {
        correct = { letter, text: p };
      } else {
        incorrect.push({ letter, text: p });
      }
    } else {
      if (!correct) {
        correct = { letter: null, text: p };
      } else {
        incorrect.push({ letter: null, text: p });
      }
    }
  });

  return {
    correct,
    incorrect,
    isSplit: parts.length > 1,
    raw: text,
  };
}

/**
 * Formats rationale text with subtle highlights on quoted terms and logical signals
 * without changing or removing a single character of the original text.
 */
function FormattedRationaleText({ text, isCorrectCard }) {
  if (!text) return null;

  // Regex matches quoted phrases (e.g. “Granted”, "indeed") and key logical signals
  const regex = /([“\"].*?[”\"])|(logically signals)|(illogically signals)/gi;
  const elements = [];
  let lastIdx = 0;
  let match;
  let keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      elements.push(
        <span key={`txt-${keyCounter++}`}>
          {text.substring(lastIdx, match.index)}
        </span>
      );
    }

    if (match[1]) {
      // Quoted transition word
      elements.push(
        <strong
          key={`q-${keyCounter++}`}
          style={{
            background: isCorrectCard ? '#dcfce7' : '#fee2e2',
            color: isCorrectCard ? '#14532d' : '#991b1b',
            padding: '1px 5px',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.94em',
            border: `1px solid ${isCorrectCard ? '#bbf7d0' : '#fecaca'}`
          }}
        >
          {match[1]}
        </strong>
      );
    } else if (match[2]) {
      // "logically signals"
      elements.push(
        <strong key={`ls-${keyCounter++}`} style={{ color: '#15803d', fontWeight: 700 }}>
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // "illogically signals"
      elements.push(
        <strong key={`is-${keyCounter++}`} style={{ color: '#b91c1c', fontWeight: 700 }}>
          {match[3]}
        </strong>
      );
    }

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    elements.push(
      <span key={`txt-${keyCounter++}`}>
        {text.substring(lastIdx)}
      </span>
    );
  }

  return <>{elements}</>;
}

export default function VisualExplanation({
  rationale,
  correctAnswerLetter,
  userChoiceLetter = null,
  isCorrect = false,
  showViewToggle = true
}) {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'text'

  if (!rationale) return null;

  const parsed = parseRationale(rationale);

  return (
    <div style={{ marginTop: '4px' }}>
      {/* View Mode Toggle Header */}
      {showViewToggle && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Official College Board Rationale
            </span>
            <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
              Original Content
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? '#ffffff' : 'transparent',
                border: viewMode === 'cards' ? '1px solid #cbd5e1' : 'none',
                boxShadow: viewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                color: viewMode === 'cards' ? '#0f172a' : '#64748b',
                padding: '3px 9px',
                borderRadius: '4px',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>🗂️</span>
              <span>Visual Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('text')}
              style={{
                background: viewMode === 'text' ? '#ffffff' : 'transparent',
                border: viewMode === 'text' ? '1px solid #cbd5e1' : 'none',
                boxShadow: viewMode === 'text' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                color: viewMode === 'text' ? '#0f172a' : '#64748b',
                padding: '3px 9px',
                borderRadius: '4px',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>📄</span>
              <span>Full Text</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Full Raw Text Mode */}
      {viewMode === 'text' ? (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '14px 16px',
          fontSize: '0.92rem',
          lineHeight: 1.65,
          color: '#334155'
        }}>
          <FormattedRationaleText text={parsed.raw} isCorrectCard={true} />
        </div>
      ) : (
        /* 2. Visual Cards Mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Correct Answer Card */}
          {parsed.correct && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderLeft: '5px solid #16a34a',
              borderRadius: '6px',
              padding: '14px 16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    letterSpacing: '0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>✓</span>
                    <span>Choice {parsed.correct.letter || correctAnswerLetter || 'Correct'}</span>
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#15803d' }}>
                    Correct Answer Rationale
                  </span>
                </div>

                {userChoiceLetter && userChoiceLetter === (parsed.correct.letter || correctAnswerLetter) && (
                  <span style={{
                    fontSize: '0.72rem',
                    background: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #86efac',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    Your Selection ✓
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.92rem', lineHeight: 1.65, color: '#1e293b' }}>
                <FormattedRationaleText text={parsed.correct.text} isCorrectCard={true} />
              </div>
            </div>
          )}

          {/* Incorrect Choices Section */}
          {parsed.incorrect && parsed.incorrect.length > 0 && (
            <div style={{ marginTop: '2px' }}>
              <div style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>Why Other Choices Are Incorrect</span>
                <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                  {parsed.incorrect.length} choices
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {parsed.incorrect.map((item, idx) => {
                  const isUserMistake = userChoiceLetter && item.letter === userChoiceLetter;

                  return (
                    <div
                      key={item.letter || idx}
                      style={{
                        background: isUserMistake ? '#fff5f5' : '#ffffff',
                        border: isUserMistake ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                        borderLeft: isUserMistake ? '5px solid #dc2626' : '3px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '12px 14px',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        marginBottom: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            background: isUserMistake ? '#dc2626' : '#f1f5f9',
                            color: isUserMistake ? '#ffffff' : '#475569',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>✕</span>
                            <span>Choice {item.letter}</span>
                          </span>
                          <span style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: isUserMistake ? '#991b1b' : '#475569'
                          }}>
                            {isUserMistake ? "Why your answer was incorrect" : "Incorrect Option"}
                          </span>
                        </div>

                        {isUserMistake && (
                          <span style={{
                            fontSize: '0.72rem',
                            background: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #fca5a5',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            Your Selection ⚠️
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#334155' }}>
                        <FormattedRationaleText text={item.text} isCorrectCard={false} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fallback if single-choice explanation without explicit incorrect sections */}
          {(!parsed.incorrect || parsed.incorrect.length === 0) && (
            <div style={{
              fontSize: '0.8rem',
              color: '#64748b',
              padding: '6px 10px',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>💡 College Board provided the focused rationale for the correct answer above.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
