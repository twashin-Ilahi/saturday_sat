import React from 'react';

export default function Footer({ onOpenDisclaimer }) {
  return (
    <footer style={{
      background: '#ffffff',
      borderTop: '1px solid var(--cb-border, #e2e8f0)',
      padding: '16px 24px',
      textAlign: 'center',
      fontSize: '0.82rem',
      color: '#64748b',
      lineHeight: 1.6
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: 500, color: '#475569' }}>
          This is an independent platform for SAT® practice, built for students, developed by students. Not an official practice platform and not affiliated with or endorsed by College Board.
        </p>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
          SAT® and Digital SAT® are registered trademarks of the College Board. College Board has not reviewed, approved, or endorsed this platform. •{' '}
          <a
            href="#/disclaimer"
            onClick={(e) => {
              if (onOpenDisclaimer) {
                e.preventDefault();
                onOpenDisclaimer();
              }
            }}
            style={{
              color: '#005a9c',
              textDecoration: 'underline',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Disclaimer & Trademark Notice
          </a>
        </p>
      </div>
    </footer>
  );
}
