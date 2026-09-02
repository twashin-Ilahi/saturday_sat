import React, { useState } from 'react';
import { 
  AlertCircle, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Search, 
  BookOpen, 
  Check, 
  ArrowRight,
  BrainCircuit,
  MessageSquare,
  Edit2
} from 'lucide-react';

export default function ErrorLogView({ 
  errorList, 
  onRetryQuestion, 
  onOpenAiTutor, 
  onStartErrorTest,
  onUpdateNotes,
  onResolveQuestion
}) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [tempNote, setTempNote] = useState('');

  const filteredErrors = errorList.filter(({ question }) => {
    if (selectedDifficulty !== 'all' && question.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPassage = question.passage.toLowerCase().includes(q);
      const matchId = question.id.toLowerCase().includes(q);
      if (!matchPassage && !matchId) return false;
    }
    return true;
  });

  const handleStartEditNote = (questionId, currentNote) => {
    setEditingNotesId(questionId);
    setTempNote(currentNote || '');
  };

  const handleSaveNote = (questionId) => {
    onUpdateNotes(questionId, tempNote);
    setEditingNotesId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            Student Weakness & Error Log
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Targeted Mistake Analysis
          </h1>
          <p className="text-gray-600 text-sm max-w-2xl leading-relaxed">
            Every mistake is a learning opportunity. The SAT tests recurring transition patterns. Review why you chose the wrong distractor, read the College Board rationale, and re-test to solidify mastery.
          </p>
        </div>

        {errorList.length > 0 && (
          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onStartErrorTest}
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry All Missed Questions ({errorList.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        {/* Difficulty filter tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'easy', 'medium', 'hard'].map(diff => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                selectedDifficulty === diff
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passage or Question ID..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>
      </div>

      {/* Error Cards List */}
      {filteredErrors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-gray-900">No Mistakes Found!</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {errorList.length === 0 
                ? "You haven't logged any incorrect questions yet. Start a Bluebook simulation or practice drill!"
                : "No errors matching the selected filter."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredErrors.map(({ question, record }) => {
            const isEditingNote = editingNotesId === question.id;

            return (
              <div 
                key={question.id} 
                className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 shadow-xs overflow-hidden transition-all"
              >
                {/* Card Top Bar */}
                <div className="px-6 py-3.5 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-gray-700 bg-gray-200/80 px-2 py-0.5 rounded">
                      ID: {question.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      question.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                      question.difficulty === 'Medium' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {question.difficulty}
                    </span>
                    <span className="text-gray-500 font-medium">
                      Category: <strong className="text-gray-800">{question.category}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRetryQuestion(question)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Question</span>
                    </button>

                    <button
                      onClick={() => onOpenAiTutor(question, record.selectedChoice)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ask AI Tutor</span>
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-5">
                  {/* Passage */}
                  <div className="bluebook-passage text-gray-800 text-base leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-gray-100">
                    {question.passage.split('______').map((segment, sIdx, arr) => (
                      <React.Fragment key={sIdx}>
                        {segment}
                        {sIdx < arr.length - 1 && (
                          <span className="inline-block mx-1 px-2.5 py-0.5 bg-yellow-100 border-b-2 border-yellow-500 font-mono text-yellow-900 font-bold text-sm rounded">
                            [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Answers Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User's choice */}
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Your Answer: Choice {record.selectedChoice}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 font-medium">
                        "{question.options.find(o => o.key === record.selectedChoice)?.text || 'No choice selected'}"
                      </p>
                    </div>

                    {/* Correct choice */}
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Correct Answer: Choice {question.correctAnswer}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 font-medium">
                        "{question.options.find(o => o.key === question.correctAnswer)?.text}"
                      </p>
                    </div>
                  </div>

                  {/* College Board Official Rationale */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm space-y-2">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Official College Board Rationale
                    </h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {question.rationale}
                    </p>
                  </div>

                  {/* Student Study Notes Section */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {isEditingNote ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="Write why you fell for this trap (e.g., 'Confused contrast with addition')..."
                          className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleSaveNote(question.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-2 py-1.5 text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {record.notes ? (
                            <strong className="text-gray-800">Note: {record.notes}</strong>
                          ) : (
                            <span className="text-gray-400 italic">No notes added yet</span>
                          )}
                        </span>
                        <button
                          onClick={() => handleStartEditNote(question.id, record.notes)}
                          className="text-blue-600 hover:underline flex items-center gap-1 font-medium ml-2"
                        >
                          <Edit2 className="w-3 h-3" />
                          {record.notes ? 'Edit' : 'Add Note'}
                        </button>
                      </div>
                    )}

                    <div className="text-[11px] text-gray-400 font-mono">
                      Attempts: {record.attempts || 1}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
