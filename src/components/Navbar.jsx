import React from 'react';
import { 
  BookOpen, 
  BarChart3, 
  AlertCircle, 
  Layers, 
  HelpCircle, 
  Settings, 
  Play,
  Sparkles,
  User
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  errorCount, 
  onStartSimulation, 
  profile, 
  onOpenSettings,
  onOpenGuide 
}) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-900 tracking-tight">Bluebook SAT</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Transitions Focus
                </span>
              </div>
              <p className="text-xs text-gray-500">College Board Practice Hub & AI Tutor</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={() => setCurrentTab('bank')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                currentTab === 'bank'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              Question Bank
            </button>

            <button
              onClick={() => setCurrentTab('errorLog')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                currentTab === 'errorLog'
                  ? 'bg-rose-50 text-rose-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Error Log</span>
              {errorCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-rose-600 text-white">
                  {errorCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenGuide}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              Transition Rules
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onStartSimulation({ mode: 'simulation' })}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow"
            >
              <Play className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">Start Bluebook Exam</span>
              <span className="sm:hidden">Test</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              title="Settings & AI Model"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Student Chip */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <span className="text-xs font-medium text-gray-700 max-w-[120px] truncate">
                {profile?.name || 'Student'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
