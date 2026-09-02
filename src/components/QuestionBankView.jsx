import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Play, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { filterQuestions, ALL_QUESTIONS } from '../data/questions';

export default function QuestionBankView({ 
  userRecords = {}, 
  onStartCustomTest, 
  onPracticeSingleQuestion,
  onToggleFlag,
  onOpenGuide 
}) {
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return filterQuestions(ALL_QUESTIONS, {
      difficulty,
      status,
      search,
      userRecords
    });
  }, [difficulty, status, search, userRecords]);

  // Counts
  const counts = useMemo(() => {
    let unans = 0, corr = 0, incorr = 0, flagged = 0;
    ALL_QUESTIONS.forEach(q => {
      const rec = userRecords[q.id];
      if (rec?.flagged) flagged++;
      if (!rec || !rec.answered) unans++;
      else if (rec.isCorrect) corr++;
      else incorr++;
    });
    return { unans, corr, incorr, flagged, total: ALL_QUESTIONS.length };
  }, [userRecords]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            70 Official Question Transitions Bank
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            SAT Transitions Explorer & Filter
          </h1>
          <p className="text-gray-600 text-sm max-w-2xl leading-relaxed">
            Search and filter through the complete collection of College Board SAT Transitions questions. Target your practice by difficulty, practice only unanswered questions, or drill your flagged items.
          </p>
        </div>

        {filtered.length > 0 && (
          <button
            onClick={() => onStartCustomTest(filtered)}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Practice Filtered ({filtered.length} Qs)</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Difficulty selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Difficulty
            </label>
            <div className="flex items-center gap-1">
              {['all', 'easy', 'medium', 'hard'].map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
                    difficulty === d
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
            >
              <option value="all">All Statuses ({counts.total})</option>
              <option value="unanswered">Unanswered ({counts.unans})</option>
              <option value="correct">Correct ({counts.corr})</option>
              <option value="incorrect">Incorrect / Errors ({counts.incorr})</option>
              <option value="flagged">Marked for Review ({counts.flagged})</option>
            </select>
          </div>

          {/* Search bar */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Keyword or Question ID
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search text or e.g. e3edc138..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Showing <strong className="text-gray-900">{filtered.length}</strong> of {ALL_QUESTIONS.length} questions</span>
          <button
            onClick={onOpenGuide}
            className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Transition Rules Guide
          </button>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((q, idx) => {
          const rec = userRecords[q.id];
          const answered = rec && rec.answered;
          const isCorrect = rec && rec.isCorrect;
          const flagged = rec && rec.flagged;

          return (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      ID: {q.id}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      q.difficulty === 'Medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    {answered ? (
                      isCorrect ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          <XCircle className="w-3.5 h-3.5" /> Missed
                        </span>
                      )
                    ) : (
                      <span className="text-[11px] text-gray-400 font-medium">Unattempted</span>
                    )}

                    <button
                      onClick={() => onToggleFlag(q.id)}
                      className="p-1 text-gray-400 hover:text-amber-500 rounded"
                      title="Bookmark question"
                    >
                      <Bookmark className={`w-4 h-4 ${flagged ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Passage Preview */}
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed line-clamp-3 font-serif">
                  {q.passage}
                </p>

                {/* Options Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {q.options.map(opt => (
                    <span 
                      key={opt.key}
                      className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono"
                    >
                      ({opt.key}) {opt.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-medium">
                  {q.category}
                </span>
                <button
                  onClick={() => onPracticeSingleQuestion(q)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Practice Question <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
