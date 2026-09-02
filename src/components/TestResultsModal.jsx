import React, { useEffect } from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  Sparkles,
  AlertCircle,
  Layers,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TestResultsModal({ 
  session, 
  onClose, 
  onRetryTest, 
  onReviewErrors,
  onOpenAiTutor,
  questions
}) {
  if (!session) return null;

  const { score, total, timeTakenSec, results, mode } = session;
  const accuracy = Math.round((score / total) * 100);
  const incorrectCount = total - score;

  // Trigger confetti on 80%+ accuracy!
  useEffect(() => {
    if (accuracy >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [accuracy]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
        {/* Banner */}
        <div className="p-8 text-center bg-gradient-to-b from-blue-900 to-indigo-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-lg backdrop-blur-sm">
            <Trophy className={`w-8 h-8 ${accuracy >= 80 ? 'text-amber-300' : 'text-blue-300'}`} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Section Completed!
          </h2>
          <p className="text-blue-200 text-xs sm:text-sm mt-1">
            {mode === 'simulation' ? 'Bluebook Timed Test' : 'Targeted Practice Drill'}
          </p>

          <div className="mt-6 flex items-center justify-center gap-6">
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                {score} / {total}
              </div>
              <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mt-1">
                Raw Score
              </div>
            </div>

            <div className="h-10 w-px bg-white/20" />

            <div>
              <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${
                accuracy >= 80 ? 'text-emerald-300' : accuracy >= 60 ? 'text-amber-300' : 'text-rose-300'
              }`}>
                {accuracy}%
              </div>
              <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mt-1">
                Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-3 divide-x divide-gray-200 border-b border-gray-200 bg-gray-50 text-center py-4 text-xs font-medium text-gray-600">
          <div className="flex flex-col items-center gap-1">
            <span className="text-emerald-600 font-bold text-base flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {score}
            </span>
            <span>Correct</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-rose-600 font-bold text-base flex items-center gap-1">
              <XCircle className="w-4 h-4" /> {incorrectCount}
            </span>
            <span>Mistakes</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-900 font-bold text-base flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              {Math.floor(timeTakenSec / 60)}m {timeTakenSec % 60}s
            </span>
            <span>Time Taken</span>
          </div>
        </div>

        {/* Questions Breakdown List */}
        <div className="p-6 max-h-72 overflow-y-auto divide-y divide-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Question Breakdown
          </h3>
          {results.map((res, index) => {
            const originalQ = questions.find(q => q.id === res.id);
            return (
              <div key={res.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-gray-100 text-gray-700 font-bold flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-mono text-gray-600 font-medium">ID: {res.id}</span>
                    <span className="ml-2 text-gray-400">({res.difficulty})</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-gray-600">
                    Your choice: <strong className={res.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                      {res.selectedChoice || 'Omitted'}
                    </strong>
                  </span>
                  <span className="text-gray-600">
                    Key: <strong className="text-emerald-700">{res.correctAnswer}</strong>
                  </span>
                  {res.isCorrect ? (
                    <span className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-rose-100 text-rose-700">
                      <XCircle className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onRetryTest}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Test</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {incorrectCount > 0 && (
              <button
                onClick={onReviewErrors}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Go to Error Log</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
