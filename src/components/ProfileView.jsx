import React, { useState } from 'react';
import { updateUserProfile } from '../utils/supabase';

export default function ProfileView({
  user,
  cloudSyncStatus = 'idle',
  currentState,
  totalQuestions = 314,
  onUpdateUser,
  onReturnToDashboard,
  onStartPractice,
  onSignOut,
  onOpenSettings,
  onOpenAuth,
}) {
  const isGuest = !user || user.isGuest;
  const userMeta = user?.user_metadata || {};

  // Form states
  const [fullName, setFullName] = useState(userMeta.full_name || userMeta.name || (isGuest ? 'Guest Student' : ''));
  const [targetScore, setTargetScore] = useState(userMeta.target_score || '1550+');
  const [targetDate, setTargetDate] = useState(userMeta.target_date || 'October 2026');
  const [highSchool, setHighSchool] = useState(userMeta.high_school || '');
  const [gradeLevel, setGradeLevel] = useState(userMeta.grade_level || 'Grade 11 (Junior)');
  const [studyGoal, setStudyGoal] = useState(userMeta.study_goal || '');

  // Password change states (email users only)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Profile save states
  const [saving, setSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Performance calculations
  const answeredCount = currentState?.checkedStatus?.filter(Boolean)?.length || 0;
  const errorCount = currentState?.errorLog?.length || 0;
  const correctCount = Math.max(0, answeredCount - errorCount);
  const accuracyPct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Initials for avatar
  const getInitials = (name) => {
    if (!name || !name.trim()) return 'SAT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (!fullName.trim()) {
      setProfileFeedback({ type: 'error', text: 'Full Name cannot be empty.' });
      return;
    }

    setSaving(true);
    const updatedMetadata = {
      ...userMeta,
      full_name: fullName.trim(),
      name: fullName.trim(),
      target_score: targetScore,
      target_date: targetDate,
      high_school: highSchool.trim(),
      grade_level: gradeLevel,
      study_goal: studyGoal.trim(),
    };

    try {
      if (isGuest) {
        // Save to localStorage for guest
        try {
          localStorage.setItem('sat_guest_profile', JSON.stringify(updatedMetadata));
        } catch (err) {}
        const updatedUser = {
          ...user,
          isGuest: true,
          email: user?.email || 'Guest User',
          user_metadata: updatedMetadata,
        };
        if (onUpdateUser) onUpdateUser(updatedUser);
        setProfileFeedback({
          type: 'success',
          text: 'Guest profile updated! Your name will now be displayed in the Bluebook simulator.'
        });
      } else {
        // Save to Supabase
        const updatedUser = await updateUserProfile(updatedMetadata);
        if (onUpdateUser) onUpdateUser(updatedUser);
        setProfileFeedback({
          type: 'success',
          text: 'Profile updated successfully! Changes synced to your cloud account.'
        });
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfileFeedback({
        type: 'error',
        text: err.message || 'Failed to update profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await updateUserProfile({}, newPassword);
      setPasswordFeedback({
        type: 'success',
        text: 'Your password has been changed successfully!'
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password update failed:', err);
      setPasswordFeedback({
        type: 'error',
        text: err.message || 'Failed to update password. Please try again.'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#111827', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Header Bar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 32px',
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
                Student Profile & Account Settings
              </h1>
              <span style={{ fontSize: '0.72rem', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                Digital SAT® Suite
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Customize your student profile, target score, and Bluebook testing interface name.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Developed By Badge */}
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

          <button
            onClick={onStartPractice}
            style={{
              background: '#005a9c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ▶ Start Practice
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '7px 12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer'
              }}
              title="Open Settings & Cloud Sync"
            >
              ⚙️ Settings
            </button>
          )}

          {user && (
            <button
              onClick={onSignOut}
              style={{
                fontSize: '0.82rem',
                color: isGuest ? '#005a9c' : '#b91c1c',
                border: `1px solid ${isGuest ? '#bfdbfe' : '#fca5a5'}`,
                background: isGuest ? '#eff6ff' : '#fef2f2',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {isGuest ? 'Sign In / Register' : 'Sign Out'}
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '28px 24px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Guest Warning / CTA Banner */}
        {isGuest && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ fontSize: '1.8rem' }}>💡</div>
              <div>
                <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.95rem', marginBottom: '2px' }}>
                  You are currently using an Offline Guest Session
                </div>
                <div style={{ fontSize: '0.83rem', color: '#b45309', lineHeight: 1.4 }}>
                  Your profile details and practice progress are currently stored locally in this browser. Create a free account or sign in to sync your profile, test records, and error log automatically across all your devices.
                </div>
              </div>
            </div>
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Create Account / Sign In →
              </button>
            )}
          </div>
        )}

        {/* Profile Identity Card (Hero) */}
        <div style={{
          background: 'linear-gradient(135deg, #005a9c 0%, #003e6b 100%)',
          borderRadius: '12px',
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 20px rgba(0,90,156,0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 2 }}>
            {/* Avatar Initials Circle */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#ffffff',
              color: '#005a9c',
              fontSize: '1.6rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid rgba(255,255,255,0.4)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
            }}>
              {getInitials(fullName)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {fullName || (isGuest ? 'Guest Student' : 'Student')}
                </h2>
                <span style={{
                  background: isGuest ? 'rgba(255,255,255,0.2)' : '#22c55e',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isGuest ? 'Guest Session' : '✓ Verified Account'}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#bae6fd', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>✉️ {isGuest ? 'Offline Local Storage' : user?.email}</span>
                <span>•</span>
                <span>🎯 Target: {targetScore}</span>
                <span>•</span>
                <span>📅 Test: {targetDate}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#93c5fd', fontWeight: 700 }}>
              Bluebook Display Name
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {fullName || 'Student'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#e0f2fe', marginTop: '2px' }}>
              Displayed on bottom-left test bar
            </div>
          </div>
        </div>

        {/* Form and Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
          
          {/* Left Column: Edit Profile Form */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                Student Profile Information
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                Update your student name, target exam date, and preparation preferences.
              </p>
            </div>

            {profileFeedback && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: profileFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: profileFeedback.type === 'success' ? '#15803d' : '#b91c1c',
                border: `1px solid ${profileFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{profileFeedback.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{profileFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Full Name (Displayed in Bluebook Simulator) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#0f172a'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  This name will appear on your Bluebook testing footer, question review reports, and score summaries.
                </span>
              </div>

              {/* Email Address (Read-Only) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="text"
                  value={isGuest ? 'Guest Session (Offline)' : (user?.email || '')}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    color: '#64748b',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              {/* Target SAT Score & Target Date in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Target SAT Score
                  </label>
                  <select
                    value={targetScore}
                    onChange={e => setTargetScore(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="1600 (Perfect Score)">1600 (Perfect Score)</option>
                    <option value="1550+">1550+</option>
                    <option value="1500+">1500+</option>
                    <option value="1450+">1450+</option>
                    <option value="1400+">1400+</option>
                    <option value="1350+">1350+</option>
                    <option value="1300+">1300+</option>
                    <option value="1200+">1200+</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Target Test Date
                  </label>
                  <select
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="October 2026">October 2026</option>
                    <option value="November 2026">November 2026</option>
                    <option value="December 2026">December 2026</option>
                    <option value="March 2027">March 2027</option>
                    <option value="May 2027">May 2027</option>
                    <option value="June 2027">June 2027</option>
                    <option value="August 2027">August 2027</option>
                  </select>
                </div>
              </div>

              {/* Grade Level & High School */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Grade / Graduation Year
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={e => setGradeLevel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Grade 12 (Senior)">Grade 12 (Senior)</option>
                    <option value="Grade 11 (Junior)">Grade 11 (Junior)</option>
                    <option value="Grade 10 (Sophomore)">Grade 10 (Sophomore)</option>
                    <option value="Grade 9 (Freshman)">Grade 9 (Freshman)</option>
                    <option value="College / Gap Year">College / Gap Year</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    High School / School Name
                  </label>
                  <input
                    type="text"
                    value={highSchool}
                    onChange={e => setHighSchool(e.target.value)}
                    placeholder="e.g. Stuyvesant High School"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Personal Study Goal / Bio */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Study Focus & Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={studyGoal}
                  onChange={e => setStudyGoal(e.target.value)}
                  placeholder="e.g. Focus on Rhetorical Synthesis and Boundaries to achieve 750+ in Reading & Writing."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.88rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Save Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#005a9c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '11px 24px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0,90,156,0.2)'
                  }}
                >
                  {saving ? 'Saving...' : '💾 Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Statistics & Security */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Study Progress & Stats Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📊</span>
                <span>Your Practice Statistics</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Questions Solved
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {answeredCount} <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>/ {totalQuestions}</span>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Accuracy
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: accuracyPct >= 75 ? '#15803d' : (accuracyPct >= 50 ? '#d97706' : '#dc2626'), marginTop: '4px' }}>
                    {accuracyPct}%
                  </div>
                </div>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                    Logged Mistakes
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b91c1c', marginTop: '2px' }}>
                    {errorCount} Missed Questions
                  </div>
                </div>
                <button
                  onClick={onReturnToDashboard}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fca5a5',
                    color: '#b91c1c',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Review Mistakes →
                </button>
              </div>

              {/* Cloud Sync Status */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                <span>Cloud Auto-Sync:</span>
                <span style={{
                  color: isGuest ? '#94a3b8' : (cloudSyncStatus === 'syncing' ? '#0284c7' : '#15803d'),
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isGuest ? '⚠️ Offline (Guest)' : (cloudSyncStatus === 'syncing' ? '☁️ Syncing...' : '☁️ Connected')}
                </span>
              </div>
            </div>

            {/* Change Password Card (Only for Authenticated Accounts) */}
            {!isGuest && (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔒</span>
                  <span>Change Password</span>
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Update the password used to sign in to your SAT account.
                </p>

                {passwordFeedback && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    marginBottom: '14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: passwordFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: passwordFeedback.type === 'success' ? '#15803d' : '#b91c1c',
                    border: `1px solid ${passwordFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                  }}>
                    {passwordFeedback.text}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        style={{
                          width: '100%',
                          padding: '8px 36px 8px 12px',
                          fontSize: '0.86rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: '#64748b'
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '0.86rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    style={{
                      background: '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '9px 16px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: passwordLoading ? 'wait' : 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
