import { ALL_QUESTIONS } from '../data/questions';

const STORAGE_KEYS = {
  PROFILE: 'bluebook_sat_profile',
  RECORDS: 'bluebook_sat_records',
  HISTORY: 'bluebook_sat_test_history',
  SETTINGS: 'bluebook_sat_settings',
};

export function getProfile() {
  const defaultProfile = {
    name: "Mohamed Elkirsh",
    targetScore: 750,
    dailyGoal: 15,
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
  } catch (e) {
    return defaultProfile;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function getAllRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

export function saveQuestionRecord(questionId, { selectedChoice, isCorrect, flagged, notes }) {
  const records = getAllRecords();
  const existing = records[questionId] || {
    attempts: 0,
    history: [],
  };

  const newAttempts = existing.attempts + (selectedChoice !== undefined ? 1 : 0);
  const newHistory = existing.history || [];
  if (selectedChoice !== undefined) {
    newHistory.push({
      choice: selectedChoice,
      isCorrect,
      timestamp: Date.now(),
    });
  }

  records[questionId] = {
    ...existing,
    questionId,
    answered: selectedChoice !== undefined ? true : existing.answered || false,
    selectedChoice: selectedChoice !== undefined ? selectedChoice : existing.selectedChoice,
    isCorrect: isCorrect !== undefined ? isCorrect : existing.isCorrect,
    flagged: flagged !== undefined ? flagged : existing.flagged || false,
    attempts: newAttempts,
    notes: notes !== undefined ? notes : existing.notes || "",
    lastAttemptedAt: Date.now(),
    history: newHistory,
  };

  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  return records[questionId];
}

export function toggleQuestionFlag(questionId) {
  const records = getAllRecords();
  const existing = records[questionId] || { answered: false, flagged: false, attempts: 0 };
  existing.flagged = !existing.flagged;
  records[questionId] = existing;
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  return existing.flagged;
}

export function getErrorLog() {
  const records = getAllRecords();
  const errorList = [];

  for (const q of ALL_QUESTIONS) {
    const rec = records[q.id];
    if (rec && rec.answered && !rec.isCorrect) {
      errorList.push({
        question: q,
        record: rec,
      });
    }
  }

  // Sort by most recently attempted
  return errorList.sort((a, b) => (b.record.lastAttemptedAt || 0) - (a.record.lastAttemptedAt || 0));
}

export function getOverallStats() {
  const records = getAllRecords();
  const totalQuestions = ALL_QUESTIONS.length;
  let answeredCount = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let flaggedCount = 0;

  const difficultyStats = {
    Easy: { total: 0, answered: 0, correct: 0 },
    Medium: { total: 0, answered: 0, correct: 0 },
    Hard: { total: 0, answered: 0, correct: 0 },
  };

  for (const q of ALL_QUESTIONS) {
    const diff = q.difficulty || 'Medium';
    if (!difficultyStats[diff]) {
      difficultyStats[diff] = { total: 0, answered: 0, correct: 0 };
    }
    difficultyStats[diff].total += 1;

    const rec = records[q.id];
    if (rec) {
      if (rec.flagged) flaggedCount++;
      if (rec.answered) {
        answeredCount++;
        difficultyStats[diff].answered += 1;
        if (rec.isCorrect) {
          correctCount++;
          difficultyStats[diff].correct += 1;
        } else {
          incorrectCount++;
        }
      }
    }
  }

  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const completionRate = Math.round((answeredCount / totalQuestions) * 100);

  return {
    totalQuestions,
    answeredCount,
    correctCount,
    incorrectCount,
    flaggedCount,
    accuracy,
    completionRate,
    difficultyStats,
  };
}

export function saveTestHistorySession(session) {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const history = saved ? JSON.parse(saved) : [];
    history.unshift({
      id: 'test_' + Date.now(),
      date: new Date().toISOString(),
      ...session,
    });
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 30)));
  } catch (e) {
    console.error("Failed to save test history", e);
  }
}

export function getTestHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function resetAllProgress() {
  localStorage.removeItem(STORAGE_KEYS.RECORDS);
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}
