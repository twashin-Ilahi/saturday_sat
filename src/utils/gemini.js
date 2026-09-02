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

export function saveSelectedModel(model) {
  localStorage.setItem("sat_gemini_model", model);
}

export async function generateContentWithGemini({ prompt, systemInstruction = "" }) {
  const apiKey = getApiKey();
  const model = getSelectedModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  if (!apiKey) {
    return {
      success: false,
      error: "No Gemini API key found. Please add your API key in Settings (top-right gear icon) or in your .env file.",
      latencyMs: 0,
      model
    };
  }

  const startTime = Date.now();

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1200,
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
        model,
        raw: parsedErr
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
      usageMetadata: data.usageMetadata,
      raw: data
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

export function buildTutorPrompt({ question, userChoice, tutorMode = 'explain' }) {
  const optionsText = question.options.map(o => `${o.key}. ${o.text}`).join("\n");

  if (tutorMode === 'why_wrong' && userChoice) {
    return `
You are an expert Digital SAT Reading & Writing tutor.
The student missed this SAT "Transitions" question.

Passage & Question:
${question.passage}
${question.prompt}

Choices:
${optionsText}

Correct Answer: Choice ${question.correctAnswer}
Student's Chosen Answer: Choice ${userChoice}

Official Rationale:
${question.rationale}

Please provide a concise, high-impact breakdown:
1. Explain WHY the student's chosen answer (${userChoice}) is a trap (what false logic or tone mismatch does it introduce?).
2. Walk through the relationship between Sentence 1 and Sentence 2 (e.g., Contrast, Cause/Effect, Addition, Example).
3. Give an SAT rule of thumb for this exact transition pattern.
Format with clear bullet points.
`;
  }

  if (tutorMode === 'hint') {
    return `
You are an expert Digital SAT Reading & Writing tutor.
The student is working on this SAT "Transitions" question and needs a Socratic hint without spoiling the answer.

Passage:
${question.passage}

Choices:
${optionsText}

Please provide:
1. Identify the core idea of the sentence BEFORE the blank.
2. Identify the core idea of the sentence AFTER the blank.
3. Ask the student one guiding question about how these two ideas connect (do they agree, disagree, explain cause, or give an example?).
DO NOT reveal the correct answer letter or word.
`;
  }

  // Default: explain logic
  return `
You are an expert Digital SAT Reading & Writing tutor.
Break down this SAT "Transitions" question clearly and pedagogically.

Passage:
${question.passage}
${question.prompt}

Choices:
${optionsText}

Correct Answer: Choice ${question.correctAnswer}
Official College Board Rationale:
${question.rationale}

Please format your response into 3 crisp sections:
### 1. The Core Sentence Relationship
Identify whether the text transitions into a Contrast, Cause/Effect, Addition, or Example.

### 2. Why Choice ${question.correctAnswer} Fits
Explain why this transition makes the flow logical.

### 3. Why the Distractors Fail
1-sentence explanation for each incorrect option.

### 4. Pro SAT Transition Strategy
A key takeaway the student can remember for future tests.
`;
}
