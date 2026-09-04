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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          margin: 'auto',
          animation: 'modalFadeIn 0.18s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #005a9c 0%, #003e6b 100%)',
            color: '#ffffff',
            padding: '18px 24px',
            textAlign: 'center',
            position: 'relative',
            flexShrink: 0
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '14px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              color: '#ffffff',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
            title="Close"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
          >
            ✕
          </button>

          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.18)',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.45rem',
              margin: '0 auto 8px'
            }}
          >
            🔒
          </div>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff' }}>
            {questionNumber ? `Question ${questionNumber} is Locked` : 'Full Question Bank Locked'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#e0f2fe', lineHeight: 1.35 }}>
            Guest access includes a free <strong>{freeLimit}-question sample preview</strong> per module.
          </p>
        </div>

        {/* Scrollable Body Content */}
        <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.84rem',
              color: '#334155',
              lineHeight: 1.45
            }}
          >
            <strong style={{ color: '#0f172a' }}>Why is this locked?</strong><br />
            You're currently practicing in an offline guest session. You can practice the first <strong>{freeLimit} questions</strong> of {skillName} for free. To unlock the remaining <strong>{Math.max(0, totalSkillQuestions - freeLimit)} questions</strong> in this module (and all <strong>314 questions</strong> platform-wide), create a free account or sign in.
          </div>

          {/* Account Benefits */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px'
              }}
            >
              What you get with a free student account:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '0.82rem', color: '#1e293b' }}>
                <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span><strong>All 314 Authentic Questions:</strong> Transitions (70), Rhetorical Synthesis (82), Boundaries (84), and Form & Structure (78).</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '0.82rem', color: '#1e293b' }}>
                <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span><strong>Instant Auto-Migration (Zero Data Loss):</strong> Everything you've practiced as a guest will automatically merge and back up to your account.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '0.82rem', color: '#1e293b' }}>
                <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span><strong>Real-Time Automatic Cloud Backup:</strong> Never lose your progress, answers, or flags when switching devices.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '0.82rem', color: '#1e293b' }}>
                <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span><strong>Missed Questions Directory & Serial Drills:</strong> Systematically drill errors until mastered.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '0.82rem', color: '#1e293b' }}>
                <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span><strong>Personalized Student Profile:</strong> Display your own name on the official Bluebook test footer.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px', flexShrink: 0 }}>
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
                padding: '11px 18px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,90,156,0.25)',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#00487d'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#005a9c'}
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
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
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
