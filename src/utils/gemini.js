const ENV_API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || "";
const DEFAULT_MODEL = import.meta.env?.VITE_GEMINI_MODEL || "gemini-flash-latest";

export function getApiKey() {
  const saved = localStorage.getItem("sat_gemini_api_key");
  if (saved && saved.trim()) return saved.trim();
  return ENV_API_KEY;
}

export function saveApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem("sat_gemini_api_key", key.trim());
  } else {
    localStorage.removeItem("sat_gemini_api_key");
  }
}

export function getSelectedModel() {
  return localStorage.getItem("sat_gemini_model") || DEFAULT_MODEL;
}

export async function generateContentWithGemini({ prompt, systemInstruction = "" }) {
  const apiKey = getApiKey();
  const model = getSelectedModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  if (!apiKey) {
    return {
      success: false,
      error: "No Gemini API key found. Please add your key in the AI Coach settings or check your .env file.",
      latencyMs: 0,
      model
    };
  }

  const startTime = Date.now();

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1600,
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        parsedErr = JSON.parse(errText);
      } catch (e) {}
      return {
        success: false,
        error: parsedErr?.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        latencyMs,
        model
      };
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text || "No response generated.";

    return {
      success: true,
      text: textPart,
      latencyMs,
      model,
      usageMetadata: data.usageMetadata
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Network error connecting to Gemini API.",
      latencyMs: Date.now() - startTime,
      model
    };
  }
}

export async function analyzePerformanceAndRecommendDrills({ 
  totalCount, 
  completedCount, 
  correctCount, 
  incorrectCount, 
  accuracy,
  errorLog,
  difficultyBreakdown
}) {
  const systemInstruction = `You are a master College Board Digital SAT Reading and Writing Coach specializing in "Transitions" (Expression of Ideas). Your goal is to analyze the student's actual performance data, diagnose their underlying reasoning traps, and generate an actionable, customized drill plan. Write in an encouraging, crisp, authoritative, and actionable tone. Use clean GitHub markdown with clear headings, bullet points, and callouts.`;

  const errorsSummary = errorLog.slice(0, 10).map((err, i) => `
${i + 1}. [Question #${err.qIndex} - ID: ${err.id} - ${err.difficulty}]
Passage: "${err.passage}"
Student Picked: "${err.yourAnswer}"
Correct Transition: "${err.correctAnswer}"
College Board Rationale: "${err.rationale}"
Time Spent: ${err.timeSpent}
`).join("\n");

  const prompt = `
Student Performance Telemetry:
- Total Transition Bank: ${totalCount} Questions
- Completed So Far: ${completedCount} / ${totalCount} (${Math.round((completedCount / totalCount) * 100)}%)
- Overall Accuracy: ${accuracy}% (${correctCount} correct, ${incorrectCount} incorrect)
- Difficulty Mastery:
  • Easy: ${difficultyBreakdown.easy.correct}/${difficultyBreakdown.easy.total} (${difficultyBreakdown.easy.accuracy}%)
  • Medium: ${difficultyBreakdown.medium.correct}/${difficultyBreakdown.medium.total} (${difficultyBreakdown.medium.accuracy}%)
  • Hard: ${difficultyBreakdown.hard.correct}/${difficultyBreakdown.hard.total} (${difficultyBreakdown.hard.accuracy}%)

Sample of Logged Mistakes (${Math.min(errorLog.length, 10)} of ${errorLog.length}):
${errorsSummary || "No mistakes logged yet!"}

Please generate a comprehensive, structured Coaching Report with the following exact sections:

### 1. 🎯 Performance Diagnostic & Pattern Analysis
- Summarize their current skill level and trajectory.
- Identify the recurring pattern in their errors (e.g. choosing Cause/Effect when it's Restatement, falling for subtle Concession words like "Granted" vs "Indeed", or rushing on Hard questions).

### 2. ⚠️ Specific Transition Traps Identified
- Break down 2-3 specific transition word confusions evident in their mistakes (e.g., "Specifically" vs "For example", "Conversely" vs "By contrast", "That is" vs "Furthermore").
- Explain the precise SAT rule they need to internalize to stop making those errors.

### 3. 📋 Tailored Action & Drill Plan
- Immediate action steps: which specific questions or difficulty levels they should re-drill right now.
- Recommended drilling sequence (e.g. Clear the Error Log -> Drill Medium questions -> Attack Hard questions).

### 4. 💡 Master Coach's Top 3 SAT Transition Golden Rules
- 3 unforgettable mental models or elimination heuristics they can apply on test day to score 750+.
`;

  return generateContentWithGemini({ prompt, systemInstruction });
}

export async function explainSingleQuestionWithGemini({ question, studentChoice, isCorrect }) {
  const systemInstruction = `You are an expert Digital SAT Reading & Writing tutor. Explain SAT transitions logically and concisely.`;

  const prompt = `
Passage: "${question.passage}"
Prompt: "${question.prompt}"
Choices:
${question.choices.map((c, i) => `${['A', 'B', 'C', 'D'][i]}. ${c}`).join('\n')}

Correct Answer: ${question.correctAnswerLetter} (${question.choices[question.answer]})
Student Choice: ${['A', 'B', 'C', 'D'][studentChoice]} (${question.choices[studentChoice]})
Verdict: ${isCorrect ? "Correct" : "Incorrect"}
Official Rationale: "${question.rationale}"

Please explain:
1. The logical relationship connecting the ideas before and after the blank.
2. ${isCorrect ? "Why the student's choice was right on target." : `Why the student's choice of "${question.choices[studentChoice]}" fails (the specific logic mismatch or trap).`}
3. One quick elimination rule to remember for this pattern.
Keep it concise and easy to read.
`;

  return generateContentWithGemini({ prompt, systemInstruction });
}
