import React from 'react';
import { 
  Trophy, 
  Target, 
  Flame, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  ArrowRight, 
  Sparkles, 
  BrainCircuit, 
  AlertTriangle, 
  Play,
  RotateCcw,
  BookOpenCheck
} from 'lucide-react';
import { ALL_QUESTIONS } from '../data/questions';

export default function Dashboard({ 
  stats, 
  profile, 
  onStartSimulation, 
  setCurrentTab, 
  onOpenGuide, 
  testHistory = [] 
}) {
  const easyStats = stats.difficultyStats?.Easy || { total: 0, answered: 0, correct: 0 };
  const mediumStats = stats.difficultyStats?.Medium || { total: 0, answered: 0, correct: 0 };
  const hardStats = stats.difficultyStats?.Hard || { total: 0, answered: 0, correct: 0 };

  const easyAcc = easyStats.answered > 0 ? Math.round((easyStats.correct / easyStats.answered) * 100) : 0;
  const medAcc = mediumStats.answered > 0 ? Math.round((mediumStats.correct / mediumStats.answered) * 100) : 0;
  const hardAcc = hardStats.answered > 0 ? Math.round((hardStats.correct / hardStats.answered) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Digital SAT Transition Mastery
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Welcome back, {profile?.name || 'Student'}!
          </h1>
          <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
            Transitions are one of the most predictable, high-yield skills on the SAT Reading & Writing section. Practice with official College Board question styles and leverage Gemini 3.8 Flash for instant logical breakdown.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartSimulation({ mode: 'simulation', count: 20 })}
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Timed Bluebook Test (20 Qs)
            </button>

            <button
              onClick={() => onStartSimulation({ mode: 'practice', count: 10 })}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 backdrop-blur-sm transition-all"
            >
              <BrainCircuit className="w-4 h-4 text-cyan-300 inline mr-2" />
              Practice Drill (Instant Tutor)
            </button>

            <button
              onClick={onOpenGuide}
              className="px-4 py-2.5 rounded-xl text-blue-200 hover:text-white text-sm font-medium transition-colors"
            >
              Transition Rules Cheat Sheet →
            </button>
          </div>
        </div>

        {/* Decorative background grid pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <div className="w-full h-full border-l border-white/20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Completed */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BookOpenCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{stats.answeredCount}</span>
            <span className="text-xs text-gray-500">/ {stats.totalQuestions} questions</span>
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.completionRate}%` }} 
            />
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accuracy Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{stats.accuracy}%</span>
            <span className="text-xs text-emerald-600 font-medium">({stats.correctCount} correct)</span>
          </div>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.accuracy}%` }} 
            />
          </div>
        </div>

        {/* Error Log Count */}
        <div 
          onClick={() => setCurrentTab('errorLog')} 
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-rose-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-rose-600 transition-colors">
              Error Log
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-600">{stats.incorrectCount}</span>
            <span className="text-xs text-gray-500">to review</span>
          </div>
          <p className="mt-2 text-xs text-rose-500 group-hover:underline flex items-center gap-1">
            Open error clinic <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* Flagged */}
        <div 
          onClick={() => setCurrentTab('bank')}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-amber-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">
              Marked for Review
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Bookmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-600">{stats.flaggedCount}</span>
            <span className="text-xs text-gray-500">bookmarked</span>
          </div>
          <p className="mt-2 text-xs text-amber-600 group-hover:underline flex items-center gap-1">
            View in bank <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* Difficulty Breakdown & Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Difficulty Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Difficulty Mastery</h2>
              <p className="text-xs text-gray-500">Track your performance across question difficulty tiers</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-100 text-gray-700">
              Total 70 Questions
            </span>
          </div>

          <div className="space-y-4">
            {/* Easy */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                    EASY
                  </span>
                  <span className="text-gray-600 text-xs">
                    {easyStats.answered} of {easyStats.total} attempted
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  {easyStats.answered > 0 ? `${easyAcc}% Accuracy` : 'Not started'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${(easyStats.correct / (easyStats.total || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-800">
                    MEDIUM
                  </span>
                  <span className="text-gray-600 text-xs">
                    {mediumStats.answered} of {mediumStats.total} attempted
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  {mediumStats.answered > 0 ? `${medAcc}% Accuracy` : 'Not started'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${(mediumStats.correct / (mediumStats.total || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Hard */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-purple-100 text-purple-800">
                    HARD
                  </span>
                  <span className="text-gray-600 text-xs">
                    {hardStats.answered} of {hardStats.total} attempted
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  {hardStats.answered > 0 ? `${hardAcc}% Accuracy` : 'Not started'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                <div 
                  className="bg-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${(hardStats.correct / (hardStats.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Launch Cards (1 Col) */}
        <div className="space-y-4">
          {/* Bluebook Exam Mode */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                BB
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Full Bluebook Simulation</h3>
                <p className="text-xs text-gray-500">Official timer, split screen, strikethrough</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onStartSimulation({ mode: 'simulation', count: 10 })}
                className="flex-1 py-2 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors text-center"
              >
                10 Qs Quick Test
              </button>
              <button
                onClick={() => onStartSimulation({ mode: 'simulation', count: 20 })}
                className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold transition-colors text-center"
              >
                20 Qs Module
              </button>
            </div>
          </div>

          {/* Practice & Tutor Mode */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Tutor Practice Mode</h3>
                <p className="text-xs text-gray-500">Instant answers + Gemini 3.8 Flash Tutor</p>
              </div>
            </div>
            <button
              onClick={() => onStartSimulation({ mode: 'practice', count: ALL_QUESTIONS.length })}
              className="w-full py-2 px-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
            >
              Practice Full 70 Questions Drill <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Error Clinic Button */}
          {stats.incorrectCount > 0 ? (
            <div className="bg-rose-50/80 rounded-2xl border border-rose-200 p-5 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Error Log Weakness Clinic
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                You have {stats.incorrectCount} missed questions. Re-test them now to master tricky transitions!
              </p>
              <button
                onClick={() => onStartSimulation({ mode: 'errors' })}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Missed Questions ({stats.incorrectCount})
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Error Log Clean!
              </div>
              <p className="text-xs text-emerald-700">
                You have no unresolved mistakes right now. Keep practicing to build exam stamina!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Test History Section */}
      {testHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Test Attempts</h2>
            <span className="text-xs text-gray-500">{testHistory.length} completed tests</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-400 font-semibold bg-gray-50/50">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Time Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {testHistory.slice(0, 5).map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {new Date(t.date).toLocaleDateString()} at {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.mode === 'simulation' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {t.mode === 'simulation' ? 'Bluebook Simulation' : 'Practice Drill'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {t.score} / {t.total}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        t.accuracy >= 80 ? 'text-emerald-600' : t.accuracy >= 60 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {t.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {t.timeTakenSec ? `${Math.floor(t.timeTakenSec / 60)}m ${t.timeTakenSec % 60}s` : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
