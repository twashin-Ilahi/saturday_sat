import React, { useState, useEffect } from 'react';
import { syncLocalToCloud, fetchCloudProgress, getLastSyncedTime } from '../utils/cloudSync';

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  cloudSyncStatus = 'idle',
  currentState,
  totalQuestions,
  onApplyCloudProgress,
  onResetProgress,
  onExportProgress,
  onImportProgress,
  onOpenAuth,
  onOpenProfile,
}) {
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [lastSync, setLastSync] = useState(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLastSync(getLastSyncedTime(user));
      setFeedback(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const answeredCount = currentState?.checkedStatus?.filter(Boolean)?.length || 0;
  const errorCount = currentState?.errorLog?.length || 0;

  const handleSyncToCloud = async () => {
    if (!user || user.isGuest) {
      setFeedback({
        type: 'error',
        message: 'Please sign in or create an account to sync your data to the cloud.'
      });
      return;
    }

    setSyncing(true);
    setFeedback(null);

    try {
      const res = await syncLocalToCloud(currentState, user);
      setLastSync(res.timestamp);
      setFeedback({
        type: 'success',
        message: `Successfully synced ${answeredCount} answered questions and ${errorCount} error records to your Supabase cloud account!`
      });
    } catch (err) {
      console.error("Sync error:", err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to sync data to the cloud. Please check your network connection.'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!user || user.isGuest) {
      setFeedback({
        type: 'error',
        message: 'Please sign in or create an account to pull data from the cloud.'
      });
      return;
    }

    if (!confirm("Restoring from cloud will replace your current browser progress with your saved cloud backup. Continue?")) {
      return;
    }

    setPulling(true);
    setFeedback(null);

    try {
      const cloudData = await fetchCloudProgress(user);
      if (onApplyCloudProgress) {
        onApplyCloudProgress(cloudData);
      }
      setFeedback({
        type: 'success',
        message: 'Cloud backup restored successfully to your browser!'
      });
      setLastSync(cloudData.lastSyncedAt || new Date().toISOString());
    } catch (err) {
      console.error("Pull error:", err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to fetch cloud backup.'
      });
    } finally {
      setPulling(false);
    }
  };

  const formatSyncDate = (isoStr) => {
    if (!isoStr) return 'Never';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚙️</span>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                User Settings & Cloud Sync
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Manage account profile, local browser data, and Supabase cloud synchronization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '4px',
              lineHeight: 1
            }}
            title="Close Settings"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Feedback Alert Banner */}
          {feedback && (
            <div style={{
              background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: feedback.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
              color: feedback.type === 'success' ? '#15803d' : '#b91c1c',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              lineHeight: 1.4
            }}>
              <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{feedback.message}</span>
            </div>
          )}

          {/* 1. User Profile Section */}
          <div style={{
            background: user?.isGuest ? '#f8fafc' : '#edf7ff',
            border: user?.isGuest ? '1px solid #e2e8f0' : '1px solid #c9e6fc',
            borderRadius: '8px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.95rem' }}>{user?.isGuest ? '👤' : '🛡️'}</span>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                  {user?.isGuest ? 'Guest User (Local Session)' : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                {user?.isGuest 
                  ? 'Data is saved exclusively in this browser. Sign in to back up and sync across devices.'
                  : `${user?.email} • UID: ${user?.id?.slice(0, 8)}...`}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#005a9c',
                    cursor: 'pointer'
                  }}
                >
                  👤 Edit Profile
                </button>
              )}
              {user?.isGuest && onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>

          {/* 2. Cloud Sync Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px 18px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>☁️</span>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                  Supabase Cloud Synchronization
                </span>
              </div>
              <span style={{
                fontSize: '0.75rem',
                color: user?.isGuest ? '#64748b' : (cloudSyncStatus === 'syncing' ? '#0284c7' : '#15803d'),
                fontWeight: 600
              }}>
                {user?.isGuest ? 'Disabled in Guest Mode' : (cloudSyncStatus === 'syncing' ? '☁️ Backing up now...' : '✓ Auto-Sync Active')}
              </span>
            </div>

            {!user?.isGuest && (
              <div style={{
                marginBottom: '14px',
                padding: '9px 12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                lineHeight: 1.4
              }}>
                <span style={{ fontSize: '1.1rem' }}>⚡</span>
                <div>
                  <strong>Automatic Cloud Backup:</strong> Every question you answer, check, flag, or eliminate is automatically backed up to your account. No manual backup needed!
                </div>
              </div>
            )}

            <div style={{
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              borderRadius: '6px',
              padding: '8px 12px',
              marginBottom: '14px',
              fontSize: '0.78rem',
              color: '#475569',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Last Synced to Cloud:</span>
              <strong style={{ color: '#0f172a' }}>{formatSyncDate(lastSync)}</strong>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={syncing || pulling || user?.isGuest}
                onClick={handleSyncToCloud}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  padding: '9px 14px',
                  fontSize: '0.84rem'
                }}
              >
                {syncing ? 'Syncing to Cloud...' : '⬆️ Sync Local Data to Cloud'}
              </button>

              <button
                type="button"
                disabled={syncing || pulling || user?.isGuest}
                onClick={handlePullFromCloud}
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  padding: '9px 14px',
                  fontSize: '0.84rem',
                  color: '#005a9c',
                  borderColor: '#93c5fd',
                  background: '#f0f9ff'
                }}
              >
                {pulling ? 'Downloading...' : '⬇️ Restore from Cloud'}
              </button>
            </div>
            {user?.isGuest && (
              <p style={{ margin: '8px 0 0 0', fontSize: '0.74rem', color: '#dc2626', textAlign: 'center' }}>
                * Sign in to activate Supabase cloud synchronization.
              </p>
            )}
          </div>

          {/* 3. Local Browser Data Management */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px 18px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>💾</span>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                Local Browser Storage
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              marginBottom: '14px'
            }}>
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Answered</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  {answeredCount} / {totalQuestions}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Error Log</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#b91c1c' }}>
                  {errorCount} missed
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Storage Type</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                  {user?.isGuest ? 'Local Browser' : 'Scoped User'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onExportProgress}
                className="btn btn-backup"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
              >
                Export Backup (JSON)
              </button>
              <button
                type="button"
                onClick={onImportProgress}
                className="btn btn-backup"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
              >
                Load Backup (JSON)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all practice answers, timer history, and error logs from this browser?")) {
                    onResetProgress();
                    setFeedback({ type: 'success', message: 'Local practice data reset successfully.' });
                  }
                }}
                className="btn"
                style={{ color: '#b91c1c', fontSize: '0.8rem', borderColor: '#fca5a5', background: '#fef2f2' }}
              >
                Reset Local Data
              </button>
            </div>
          </div>

          {/* 4. Optional Developer SQL Guide (Accordion) */}
          <div style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: '12px'
          }}>
            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#64748b',
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              <span>{showSqlGuide ? '▼' : '▶'}</span>
              <span>Advanced: Supabase Database Table Schema (Optional)</span>
            </button>

            {showSqlGuide && (
              <div style={{
                marginTop: '10px',
                background: '#0f172a',
                color: '#e2e8f0',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontFamily: 'monospace',
                overflowX: 'auto',
                lineHeight: 1.4
              }}>
                <div style={{ color: '#94a3b8', marginBottom: '6px' }}>
                  -- Cloud sync is already active via user metadata! To also persist to a PostgreSQL table, run this in your Supabase SQL Editor:
                </div>
                <code>{`CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  progress JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = id);`}</code>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '7px 18px', fontSize: '0.84rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
