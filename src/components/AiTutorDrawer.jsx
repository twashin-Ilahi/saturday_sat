import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  BrainCircuit, 
  Lightbulb, 
  AlertOctagon, 
  BookOpen, 
  Code2, 
  RefreshCw,
  Clock,
  Layers,
  Cpu,
  CheckCircle,
  Copy
} from 'lucide-react';
import { generateContentWithGemini, buildTutorPrompt, getSelectedModel } from '../utils/gemini';

export default function AiTutorDrawer({ 
  isOpen, 
  onClose, 
  question, 
  userChoice = null 
}) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastApiMeta, setLastApiMeta] = useState(null);
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatBottomRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // When a new question is opened, initialize greeting
  useEffect(() => {
    if (isOpen && question) {
      setMessages([
        {
          sender: 'ai',
          text: `👋 Hello! I am your **Gemini 3.8 Flash SAT Tutor**.\n\nI'm ready to break down **Question ${question.id}** (${question.difficulty} difficulty).\n\nWhat would you like help with? Select a quick action below or ask me any question!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, question?.id]);

  if (!isOpen || !question) return null;

  const handleActionClick = async (actionType) => {
    let promptText = "";
    let userMsg = "";

    if (actionType === 'explain') {
      userMsg = "Explain the logic of this question and why the correct answer works.";
      promptText = buildTutorPrompt({ question, userChoice, tutorMode: 'explain' });
    } else if (actionType === 'why_wrong') {
      if (!userChoice) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: "Please select an answer choice on the test screen first so I can analyze why that specific option is a trap!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }
      userMsg = `Why is Choice (${userChoice}) wrong?`;
      promptText = buildTutorPrompt({ question, userChoice, tutorMode: 'why_wrong' });
    } else if (actionType === 'hint') {
      userMsg = "Can you give me a Socratic hint without spoiling the answer?";
      promptText = buildTutorPrompt({ question, userChoice, tutorMode: 'hint' });
    } else if (actionType === 'category') {
      userMsg = "What transition category is being tested here and what are common traps?";
      promptText = `
You are an elite SAT Tutor. For this question:
Passage: ${question.passage}
Prompt: ${question.prompt}
Explain the transition category (e.g. Contrast, Cause-and-Effect, Addition, Example).
Provide 3 high-yield SAT tips on how to identify this relationship in 15 seconds.
`;
    }

    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: userMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setIsLoading(true);

    const result = await generateContentWithGemini({
      prompt: promptText,
      systemInstruction: "You are an elite Digital SAT Verbal and Writing specialist. You help students understand logical transitions, sentence relationships, and distractor traps with extreme clarity."
    });

    setIsLoading(false);

    if (result.success) {
      setLastApiMeta({
        latencyMs: result.latencyMs,
        model: result.model,
        modelVersion: result.raw?.modelVersion || 'gemini-3.8-flash',
        usageMetadata: result.usageMetadata,
        raw: result.raw,
        timestamp: new Date().toISOString()
      });

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: result.text,
          meta: { latencyMs: result.latencyMs, model: result.model },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ Error calling Gemini API: ${result.error || 'Check API key in Settings.'}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userText = inputVal.trim();
    setInputVal("");

    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setIsLoading(true);

    const contextPrompt = `
Context SAT Transitions Question:
Passage: ${question.passage}
Prompt: ${question.prompt}
Choices: ${question.options.map(o => `${o.key}. ${o.text}`).join('; ')}
Correct Answer: ${question.correctAnswer}
Official Rationale: ${question.rationale}

User's Question/Follow-up:
${userText}
`;

    const result = await generateContentWithGemini({
      prompt: contextPrompt,
      systemInstruction: "You are an expert SAT tutor answering a student's question about an SAT Transitions problem. Keep your tone encouraging, precise, and practical."
    });

    setIsLoading(false);

    if (result.success) {
      setLastApiMeta({
        latencyMs: result.latencyMs,
        model: result.model,
        modelVersion: result.raw?.modelVersion || 'gemini-3.8-flash',
        usageMetadata: result.usageMetadata,
        raw: result.raw,
        timestamp: new Date().toISOString()
      });

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: result.text,
          meta: { latencyMs: result.latencyMs, model: result.model },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ Could not get response: ${result.error}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleCopyJson = () => {
    if (!lastApiMeta?.raw) return;
    navigator.clipboard.writeText(JSON.stringify(lastApiMeta.raw, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] lg:w-[540px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-gray-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Gemini AI Tutor</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Live College Board Transitions Coach</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastApiMeta && (
            <button
              onClick={() => setShowJsonInspector(!showJsonInspector)}
              className="px-2 py-1 rounded text-[10px] font-mono bg-white/10 hover:bg-white/20 text-indigo-200 flex items-center gap-1 transition-colors"
              title="Inspect Raw Gemini Response & Updates"
            >
              <Code2 className="w-3 h-3" />
              <span>{lastApiMeta.latencyMs}ms</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Model & Live Update Inspector Drawer */}
      {showJsonInspector && lastApiMeta && (
        <div className="bg-gray-950 text-emerald-400 p-4 border-b border-gray-800 text-xs font-mono max-h-56 overflow-y-auto space-y-2 shrink-0 animate-in fade-in">
          <div className="flex items-center justify-between text-gray-400 pb-1 border-b border-gray-800 text-[11px]">
            <span className="flex items-center gap-1 text-white">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              API Telemetry & Model Version
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopyJson} 
                className="hover:text-white flex items-center gap-1"
              >
                {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
              <button onClick={() => setShowJsonInspector(false)} className="hover:text-white">
                ✕
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300">
            <div>Model Version: <span className="text-emerald-300 font-bold">{lastApiMeta.modelVersion}</span></div>
            <div>Latency: <span className="text-emerald-300 font-bold">{lastApiMeta.latencyMs} ms</span></div>
            <div>Prompt Tokens: <span className="text-gray-300">{lastApiMeta.usageMetadata?.promptTokenCount || '--'}</span></div>
            <div>Candidate Tokens: <span className="text-gray-300">{lastApiMeta.usageMetadata?.candidatesTokenCount || '--'}</span></div>
          </div>
          <pre className="text-[10px] text-gray-400 overflow-x-auto p-2 bg-black/40 rounded">
            {JSON.stringify(lastApiMeta.raw, null, 2)}
          </pre>
        </div>
      )}

      {/* Current Question Context Summary Bar */}
      <div className="px-4 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900 shrink-0">
        <span className="font-semibold">
          Question ID: <span className="font-mono">{question.id}</span>
        </span>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-indigo-200/60 font-medium">
            {question.difficulty}
          </span>
          {userChoice && (
            <span className="text-gray-600">
              Selected: <strong className="text-indigo-800">{userChoice}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
        {messages.map((msg, index) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={index}
              className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isAi
                    ? msg.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : 'bg-white border border-gray-200 text-gray-800'
                    : 'bg-indigo-600 text-white rounded-br-xs'
                }`}
              >
                {/* Text with basic markdown rendering */}
                <div className="whitespace-pre-line space-y-2">
                  {msg.text.split('\n\n').map((para, pIdx) => {
                    if (para.startsWith('### ')) {
                      return <h4 key={pIdx} className="font-bold text-gray-900 pt-1 text-sm">{para.replace('### ', '')}</h4>;
                    }
                    if (para.startsWith('## ')) {
                      return <h3 key={pIdx} className="font-bold text-gray-900 pt-1 text-sm">{para.replace('## ', '')}</h3>;
                    }
                    return <p key={pIdx}>{para}</p>;
                  })}
                </div>

                {/* AI Response Meta Badge */}
                {isAi && msg.meta && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {msg.meta.latencyMs}ms via gemini-flash-latest
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-4 bg-white rounded-2xl border border-gray-200 text-xs text-gray-500 shadow-xs max-w-[80%] animate-pulse">
            <BrainCircuit className="w-4 h-4 text-indigo-600 animate-spin" />
            <span>Gemini 3.8 Flash is analyzing transitions logic...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Action Buttons */}
      <div className="p-3 bg-white border-t border-gray-200 shrink-0 space-y-2">
        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-1">
          Quick Tutor Actions
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleActionClick('explain')}
            disabled={isLoading}
            className="p-2 rounded-lg bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-gray-700 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1.5 transition-all text-left"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Explain Logic</span>
          </button>

          <button
            onClick={() => handleActionClick('why_wrong')}
            disabled={isLoading}
            className="p-2 rounded-lg bg-gray-50 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-700 hover:text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-all text-left"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">Why is my choice wrong?</span>
          </button>

          <button
            onClick={() => handleActionClick('hint')}
            disabled={isLoading}
            className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-700 hover:text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-all text-left"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Socratic Hint</span>
          </button>

          <button
            onClick={() => handleActionClick('category')}
            disabled={isLoading}
            className="p-2 rounded-lg bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 text-gray-700 hover:text-purple-800 text-xs font-semibold flex items-center gap-1.5 transition-all text-left"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="truncate">Transition Rules</span>
          </button>
        </div>

        {/* Text Input for Custom Student Questions */}
        <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask Gemini Flash any question..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
