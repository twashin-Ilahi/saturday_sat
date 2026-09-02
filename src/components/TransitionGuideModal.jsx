import React from 'react';
import { X, BookOpen, CheckCircle, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';
import { TRANSITION_CATEGORIES } from '../data/questions';

export default function TransitionGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-gray-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">SAT Transitions Master Strategy</h2>
              <p className="text-xs text-gray-400">The 5 Core Logical Relationships Tested on the Digital SAT</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Strategy Heuristic Banner */}
        <div className="p-5 bg-blue-50 border-b border-blue-100 flex items-start gap-3 shrink-0">
          <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-blue-900 space-y-1">
            <span className="font-bold">The 3-Step SAT Transition Formula:</span>
            <ol className="list-decimal pl-4 space-y-0.5 text-xs text-blue-800">
              <li><strong>Read Sentence 1</strong> and summarize its core takeaway in 3–5 words.</li>
              <li><strong>Read Sentence 2</strong> (ignoring the blank) and determine if it <em>agrees, reverses, explains cause, or gives an example</em>.</li>
              <li><strong>Match the relationship</strong> to the category before looking at the choices. If two choices mean the same thing (e.g. <em>Furthermore</em> and <em>Moreover</em>), both are usually wrong!</li>
            </ol>
          </div>
        </div>

        {/* Scrollable Categories List */}
        <div className="p-6 overflow-y-auto space-y-6 divide-y divide-gray-100">
          {TRANSITION_CATEGORIES.map((cat, idx) => (
            <div key={idx} className={`${idx > 0 ? 'pt-6' : ''} space-y-3`}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  {cat.name}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {cat.description}
              </p>

              {/* Common words pills */}
              <div className="flex flex-wrap gap-1.5">
                {cat.commonWords.map((word, wIdx) => (
                  <span
                    key={wIdx}
                    className="px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-mono font-medium text-gray-800"
                  >
                    {word}
                  </span>
                ))}
              </div>

              {/* SAT Tip */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>SAT Pro-Tip: </strong>
                  {cat.tip}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            Got it, Back to Practice
          </button>
        </div>
      </div>
    </div>
  );
}
