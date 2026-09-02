import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Cpu, 
  User, 
  Trash2, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { getApiKey, saveApiKey, getSelectedModel, saveSelectedModel, generateContentWithGemini } from '../utils/gemini';
import { resetAllProgress, getAllRecords, getProfile, saveProfile } from '../utils/storage';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onProfileUpdated, 
  onDataReset 
}) {
  const [apiKey, setApiKeyInput] = useState(getApiKey());
  const [selectedModel, setSelectedModelInput] = useState(getSelectedModel());
  const [studentName, setStudentName] = useState(getProfile().name || 'Mohamed Elkirsh');
  const [testStatus, setTestStatus] = useState(null); // { loading, success, message, latency }
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    // Temporarily save to test
    saveApiKey(apiKey);
    saveSelectedModel(selectedModel);

    const res = await generateContentWithGemini({
      prompt: "Reply with 'API Online' in 2 words."
    });

    if (res.success) {
      setTestStatus({
        loading: false,
        success: true,
        message: `Connected! Model: ${res.raw?.modelVersion || selectedModel} (${res.latencyMs}ms)`,
      });
    } else {
      setTestStatus({
        loading: false,
        success: false,
        message: `Connection failed: ${res.error}`
      });
    }
  };

  const handleSaveSettings = () => {
    saveApiKey(apiKey);
    saveSelectedModel(selectedModel);
    saveProfile({ ...getProfile(), name: studentName.trim() || 'Mohamed Elkirsh' });
    if (onProfileUpdated) onProfileUpdated();

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleExportData = () => {
    const data = {
      profile: getProfile(),
      records: getAllRecords(),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bluebook-sat-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all progress tracking and error log records? This cannot be undone.")) {
      resetAllProgress();
      if (onDataReset) onDataReset();
      alert("All progress has been reset.");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">App Settings & AI Configuration</h2>
              <p className="text-xs text-gray-400">Gemini 3.8 Flash, Student Profile, and Storage</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-6 text-xs sm:text-sm">
          {/* Student Profile Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Student Name (Displayed on Bluebook Bottom Bar)
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Mohamed Elkirsh"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* AI Model & Endpoint */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Google Gemini Model Selection
            </label>
            <div className="flex gap-2">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModelInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs border border-gray-300 rounded-xl font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="gemini-flash-latest">gemini-flash-latest (Gemini 3.8 Flash)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              </select>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus?.loading}
                className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-1 border border-indigo-200 transition-colors"
              >
                {testStatus?.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Test API</span>
              </button>
            </div>

            {testStatus && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span className="leading-tight">{testStatus.message}</span>
              </div>
            )}
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste your Gemini API Key here..."
              className="w-full px-3.5 py-2 text-xs font-mono border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-gray-500">
              Key is stored safely in your browser's localStorage and never transmitted to third parties.
            </p>
          </div>

          {/* Data Management */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Local Browser Data & Backup
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportData}
                className="flex-1 py-2 px-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Progress</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                className="py-2 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully!
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">Press Save to apply changes</span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
