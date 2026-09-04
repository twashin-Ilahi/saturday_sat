import React from 'react';
import Footer from './Footer';
import SaturdayLogo from './SaturdayLogo';

export default function DisclaimerView({
  onReturnToDashboard,
  onStartPractice,
  user,
  onOpenAuth,
  onOpenProfile,
  onSignOut
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', color: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--cb-border, #e2e8f0)',
        padding: '14px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SaturdayLogo size={34} variant="icon" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111', margin: 0 }}>
                Disclaimer & Trademark Notice
              </h1>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#005a9c',
                background: '#edf4fc',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #c9dff7'
              }}>
                Independent Educational Resource
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Built by students, for students • Not an official College Board website
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={onReturnToDashboard}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '0.86rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>←</span>
            <span>Return to Dashboard</span>
          </button>
          <button
            onClick={onStartPractice}
            style={{
              background: '#005a9c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,90,156,0.2)'
            }}
          >
            Start Practice (314 Questions) →
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '880px', margin: '32px auto', padding: '0 20px', flex: 1, width: '100%' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          padding: '36px 32px',
          marginBottom: '24px'
        }}>
          {/* Top Banner Alert */}
          <div style={{
            background: '#f8fafc',
            borderLeft: '5px solid #005a9c',
            borderTop: '1px solid #e2e8f0',
            borderRight: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '16px 20px',
            marginBottom: '28px'
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#0f172a', marginBottom: '4px' }}>
              Important Summary
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.55 }}>
              This website is an <strong>independent, unofficial practice platform</strong> created by students to help learners prepare for the Digital SAT®. It is <strong>not affiliated with, endorsed by, or connected to the College Board</strong>.
            </p>
          </div>

          {/* Section 1: Non-Affiliation Declaration */}
          <section style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
              1. Non-Affiliation Declaration
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.65, margin: '0 0 10px 0' }}>
              We hereby declare and state that:
            </p>
            <ul style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.65, paddingLeft: '22px', margin: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                This platform is an independent study tool and is <strong>not</strong> an official College Board service, product, or application.
              </li>
              <li style={{ marginBottom: '8px' }}>
                We are <strong>not affiliated with, associated with, authorized by, sponsored by, or endorsed by</strong> the College Board or any of its subsidiaries or affiliates.
              </li>
              <li style={{ marginBottom: '8px' }}>
                College Board has not reviewed, approved, tested, or certified any software, practice questions, visual explanations, or AI tutor tools provided on this website.
              </li>
            </ul>
          </section>

          {/* Section 2: Trademark Acknowledgments */}
          <section style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
              2. Trademark Notice & Acknowledgments
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.65, margin: '0 0 10px 0' }}>
              <strong>SAT®</strong>, <strong>Digital SAT®</strong>, and <strong>AP®</strong> are registered trademarks of the <strong>College Board</strong>, which is not affiliated with, and does not endorse, this platform.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.65, margin: '0 0 10px 0' }}>
              <strong>Bluebook™</strong> is a trademark of the College Board.
            </p>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, margin: 0, background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              All product names, logos, trademarks, and registered trademarks displayed on this website are the property of their respective owners. The use of these trademarks on this platform is solely for nominative identification, descriptive reference, and educational purposes, and does not imply any affiliation with, endorsement by, or sponsorship from the respective trademark holders.
            </p>
          </section>

          {/* Section 3: Student-Driven Purpose & Educational Fair Use */}
          <section style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
              3. Educational Purpose & Fair Use
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.65, margin: '0 0 10px 0' }}>
              This platform was created as a student-led initiative to assist high school students worldwide in preparing for standard university admissions tests. All features—including timed question simulation, visual rationale card breakdowns, error logging, and question type categorization—are provided freely for educational and self-study purposes.
            </p>
          </section>

          {/* Section 4: Official Test Information */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
              4. Official Examination & Registration Information
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.65, margin: '0 0 10px 0' }}>
              For official examination information, official test dates, testing accommodation requests, score sends, and registration for the official SAT®, please visit the official College Board website directly at:
            </p>
            <div style={{ marginTop: '10px' }}>
              <a
                href="https://www.collegeboard.org"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#005a9c',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textDecoration: 'underline'
                }}
              >
                <span>Visit Official College Board Website (collegeboard.org)</span>
                <span>↗</span>
              </a>
            </div>
          </section>

          {/* Bottom Action CTAs */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <button
              onClick={onReturnToDashboard}
              style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '6px',
                padding: '10px 18px',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              ← Return to Dashboard
            </button>

            <button
              onClick={onStartPractice}
              style={{
                background: '#005a9c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 22px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,90,156,0.25)'
              }}
            >
              Continue Practice (314 Questions) →
            </button>
          </div>
        </div>
      </main>

      {/* 2-Line Footer */}
      <Footer onOpenDisclaimer={() => {}} />
    </div>
  );
}
