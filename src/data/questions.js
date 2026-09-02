import rawQuestions from './questions.json';

export const ALL_QUESTIONS = rawQuestions;

export const TRANSITION_CATEGORIES = [
  {
    name: "Contrast / Disagreement",
    description: "Connects two opposing, contradictory, or unexpected ideas.",
    commonWords: ["However", "By contrast", "Conversely", "Nevertheless", "Nonetheless", "That said", "Even so", "Instead", "On the other hand", "Though"],
    tip: "Look for a pivot where the second sentence qualifies, challenges, or offers an alternative to the first."
  },
  {
    name: "Cause & Effect / Result",
    description: "The second idea happens because of, or as a direct result of, the first idea.",
    commonWords: ["Therefore", "As a result", "Consequently", "Thus", "Hence", "Accordingly", "For this reason"],
    tip: "Ask yourself: Did sentence A directly cause sentence B? If yes, use a cause-and-effect transition."
  },
  {
    name: "Addition / Continuation",
    description: "Introduces an additional, complementary point that supports the previous idea.",
    commonWords: ["Moreover", "Furthermore", "Additionally", "In addition", "What's more", "Likewise", "Similarly"],
    tip: "Ensure the two ideas do NOT contradict and that the second is not simply explaining or causing the first."
  },
  {
    name: "Example / Elaboration / Restatement",
    description: "Provides a specific case or clarifies a preceding claim in different terms.",
    commonWords: ["For example", "For instance", "Specifically", "In other words", "That is", "In fact", "Indeed"],
    tip: "\"That is\" and \"In other words\" restate or define; \"For example\" narrows from a general claim to a specific instance."
  },
  {
    name: "Sequence / Chronology / Location",
    description: "Indicates temporal order, a step in a process, or a physical setting.",
    commonWords: ["Then", "Later", "Earlier", "Eventually", "Subsequently", "There"],
    tip: "Look for shifts in time (e.g. 1929 -> 1928 = 'Earlier') or locations where actions unfold ('There')."
  }
];

export function getQuestionById(id) {
  return ALL_QUESTIONS.find(q => q.id === id);
}

export function filterQuestions(questions, { difficulty = 'all', status = 'all', search = '', userRecords = {} }) {
  return questions.filter(q => {
    // Difficulty filter
    if (difficulty !== 'all' && q.difficulty.toLowerCase() !== difficulty.toLowerCase()) {
      return false;
    }

    // Status filter
    const record = userRecords[q.id];
    if (status === 'unanswered' && (record && record.answered)) {
      return false;
    }
    if (status === 'correct' && (!record || !record.isCorrect)) {
      return false;
    }
    if (status === 'incorrect' && (!record || record.isCorrect || !record.answered)) {
      return false;
    }
    if (status === 'flagged' && (!record || !record.flagged)) {
      return false;
    }

    // Search query
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchPassage = q.passage.toLowerCase().includes(term);
      const matchPrompt = q.prompt.toLowerCase().includes(term);
      const matchId = q.id.toLowerCase().includes(term);
      const matchChoices = q.options.some(opt => opt.text.toLowerCase().includes(term));
      if (!matchPassage && !matchPrompt && !matchId && !matchChoices) {
        return false;
      }
    }

    return true;
  });
}
