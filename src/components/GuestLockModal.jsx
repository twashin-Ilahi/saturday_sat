import React from 'react';

export default function GuestLockModal({
  isOpen,
  onClose,
  onOpenAuth,
  skillName = "this skill",
  totalSkillQuestions = 70,
  freeLimit = 10,
  questionNumber = null,
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        animation: 'modalFadeIn 0.18s ease-out'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #005a9c 0%, #003e6b 100%)',
          color: '#ffffff',
          padding: '24px 28px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
            title="Close"
          >
            ✕
          </button>

          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            margin: '0 auto 12px'
          }}>
            🔒
          </div>

          <h2 style={{ fontSize: '1.28rem', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
            {questionNumber ? `Question ${questionNumber} is Locked` : 'Full Question Bank Locked'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#e0f2fe', lineHeight: 1.4 }}>
            Guest access includes a free <strong>{freeLimit}-question sample preview</strong> per skill.
          </p>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px 28px' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '20px',
            fontSize: '0.86rem',
            color: '#334155',
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#0f172a' }}>Why is this locked?</strong><br />
            You're currently practicing in an offline guest session. You can practice the first <strong>{freeLimit} questions</strong> of {skillName} for free. To unlock the remaining <strong>{Math.max(0, totalSkillQuestions - freeLimit)} questions</strong> in this module (and all <strong>314 questions</strong> platform-wide), create a free account or sign in.
          </div>

          {/* Account Benefits */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
              What you get with a free student account:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: '#1e293b' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                <span><strong>All 314 Authentic Questions:</strong> Full access to Transitions (70), Rhetorical Synthesis (82), Boundaries (84), and Form & Structure (78).</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: '#1e293b' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                <span><strong>Real-Time Automatic Cloud Backup:</strong> Never lose your progress, answers, or flags when switching devices.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: '#1e293b' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                <span><strong>Missed Questions Directory & Serial Drills:</strong> Systematically drill errors until mastered.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: '#1e293b' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                <span><strong>Personalized Student Profile:</strong> Display your own name on the official Bluebook test footer.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              style={{
                background: '#005a9c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 20px',
                fontSize: '0.94rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,90,156,0.25)'
              }}
            >
              <span>Create Free Account / Sign In</span>
              <span>→</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: '#ffffff',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '9px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Continue with Free Preview Questions
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
