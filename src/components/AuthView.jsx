import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  sendPasswordReset, 
  updatePassword 
} from '../utils/supabase';

export default function AuthView({ initialMode = 'login', onAuthSuccess, onContinueAsGuest }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'forgot' | 'reset'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetFormState = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setFullName('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (newMode) => {
    resetFormState();
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email && mode !== 'reset') {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
    }

    if (mode === 'signup' || mode === 'reset') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const data = await signInWithEmail(email.trim(), password);
        if (data?.session) {
          if (onAuthSuccess) onAuthSuccess(data.session.user);
        }
      } else if (mode === 'signup') {
        const data = await signUpWithEmail(email.trim(), password, {
          full_name: fullName.trim(),
          name: fullName.trim(),
        });
        if (data?.session) {
          if (onAuthSuccess) onAuthSuccess(data.session.user);
        } else {
          setSuccessMsg('Registration successful! Please check your email inbox to confirm your account (if confirmation is required), or sign in.');
          setMode('login');
        }
      } else if (mode === 'forgot') {
        await sendPasswordReset(email.trim());
        setSuccessMsg(`Password reset instructions have been sent to ${email.trim()}. Please check your email inbox and spam folder.`);
      } else if (mode === 'reset') {
        await updatePassword(password);
        setSuccessMsg('Your password has been successfully updated! You can now continue.');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess();
          else setMode('login');
        }, 1500);
      }
    } catch (err) {
      console.error('Auth error:', err);
      let message = err.message || 'An unexpected error occurred. Please try again.';
      if (message.toLowerCase().includes('invalid login credentials')) {
        message = 'Invalid email or password. Please check your credentials and try again.';
      } else if (message.toLowerCase().includes('user already registered')) {
        message = 'An account with this email already exists. Please sign in instead.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2b48 0%, #1e3a5f 50%, #112233 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      color: '#1a1a1a',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* Header Branding */}
        <div style={{
          background: '#005a9c',
          padding: '24px',
          color: '#ffffff',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            background: '#ffffff',
            color: '#005a9c',
            borderRadius: '6px',
            fontWeight: '800',
            fontSize: '1.4rem',
            marginBottom: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}>
            CB
          </div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            margin: '0 0 4px 0',
            letterSpacing: '-0.2px'
          }}>
            Digital SAT Practice Platform
          </h1>
          <p style={{
            fontSize: '0.82rem',
            color: '#e2edff',
            margin: 0,
            opacity: 0.95
          }}>
            Official Question Bank & Error Log System
          </p>

          <div style={{
            marginTop: '10px',
            display: 'inline-block',
            fontSize: '0.72rem',
            fontWeight: '600',
            background: 'rgba(255,255,255,0.18)',
            padding: '2px 10px',
            borderRadius: '12px',
            letterSpacing: '0.3px'
          }}>
            Developed by Twashin Ilahi
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '28px 28px 24px 28px' }}>
          {/* Subtitle / Mode heading */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
              {mode === 'login' && 'Sign in to your account'}
              {mode === 'signup' && 'Create student account'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'reset' && 'Set new password'}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
              {mode === 'login' && 'Enter your email and password to access the platform.'}
              {mode === 'signup' && 'Register to track your SAT drills, scores, and mastery.'}
              {mode === 'forgot' && "We'll send you an email with instructions to reset your password."}
              {mode === 'reset' && 'Enter your new password below to regain full access.'}
            </p>
          </div>

          {/* Error Message Banner */}
          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              marginBottom: '16px',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span style={{ fontWeight: 'bold' }}>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message Banner */}
          {successMsg && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              marginBottom: '16px',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span style={{ fontWeight: 'bold' }}>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Full Name Field (only for Registration) */}
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  autoComplete="name"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '0.92rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#005a9c'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
            )}

            {/* Email Field (hidden during password reset mode) */}
            {mode !== 'reset' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '0.92rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#005a9c'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
            )}

            {/* Password Field (for login, signup, reset) */}
            {mode !== 'forgot' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#334155' }}>
                    {mode === 'reset' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '0.8rem',
                        color: '#005a9c',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'reset' ? 'At least 6 characters' : 'Enter your password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    style={{
                      width: '100%',
                      padding: '9px 40px 9px 12px',
                      fontSize: '0.92rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#005a9c'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#005a9c'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field (for signup & reset) */}
            {(mode === 'signup' || mode === 'reset') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Confirm {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      padding: '9px 40px 9px 12px',
                      fontSize: '0.92rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#005a9c'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#005a9c'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.92rem',
                fontWeight: '600',
                color: '#ffffff',
                background: loading ? '#64748b' : '#005a9c',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease',
                marginTop: '6px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Password Reset Link'}
                  {mode === 'reset' && 'Update Password & Continue'}
                </>
              )}
            </button>
          </form>

          {/* Mode switch navigation */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            fontSize: '0.84rem',
            color: '#475569'
          }}>
            {mode === 'login' && (
              <div>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#005a9c',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Create one now
                </button>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#005a9c',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Sign in here
                </button>
              </div>
            )}

            {(mode === 'forgot' || mode === 'reset') && (
              <div>
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#005a9c',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>

          {/* Guest Mode Option */}
          {onContinueAsGuest && (mode === 'login' || mode === 'signup') && (
            <div style={{ marginTop: '18px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '0 0 14px 0',
                gap: '12px'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  or continue offline
                </span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>

              <button
                type="button"
                onClick={onContinueAsGuest}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.86rem',
                  fontWeight: '600',
                  color: '#334155',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                <span>👤</span>
                <span>Continue as Guest (Local Browser Storage)</span>
              </button>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '0.74rem',
                color: '#64748b',
                textAlign: 'center',
                lineHeight: 1.3
              }}>
                No login required. All test answers, timer stats, and error logs are saved directly in your browser.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 24px',
          textAlign: 'center',
          fontSize: '0.74rem',
          color: '#64748b'
        }}>
          Powered by Supabase Auth • College Board Practice
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
