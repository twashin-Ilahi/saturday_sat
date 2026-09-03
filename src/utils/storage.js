const getPrefix = (userId) => (userId ? `sat_practice_${userId}_` : `sat_practice_`);

const getKey = (key, userId) => `${getPrefix(userId)}${key}`;

export function loadHighlights(userId = null) {
  try {
    let saved = localStorage.getItem(getKey("highlights", userId));
    if (!saved && userId) {
      // Fallback to non-scoped highlights if exists
      saved = localStorage.getItem("sat_practice_highlights");
    }
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

export function saveHighlights(highlights, userId = null) {
  try {
    localStorage.setItem(getKey("highlights", userId), JSON.stringify(highlights));
  } catch (e) {}
}

export function loadProgress(totalQuestions, userId = null) {
  let currentIndex = 0;
  let selectedAnswers = new Array(totalQuestions).fill(null);
  let checkedStatus = new Array(totalQuestions).fill(false);
  let flaggedStatus = new Array(totalQuestions).fill(false);
  let eliminatedStatus = Array.from({ length: totalQuestions }, () => []);
  let errorLog = [];
  let autoStartEnabled = true;

  try {
    const getItem = (subKey) => {
      let val = localStorage.getItem(getKey(subKey, userId));
      if (val === null && userId) {
        // Fallback to generic key
        val = localStorage.getItem(`sat_practice_${subKey}`);
      }
      return val;
    };

    const savedIndex = getItem("current_idx");
    if (savedIndex !== null) currentIndex = parseInt(savedIndex, 10);

    const savedSelections = getItem("selections");
    if (savedSelections) {
      const parsed = JSON.parse(savedSelections);
      if (Array.isArray(parsed)) {
        selectedAnswers = parsed;
        while (selectedAnswers.length < totalQuestions) selectedAnswers.push(null);
      }
    }

    const savedChecked = getItem("checked");
    if (savedChecked) {
      const parsed = JSON.parse(savedChecked);
      if (Array.isArray(parsed)) {
        checkedStatus = parsed;
        while (checkedStatus.length < totalQuestions) checkedStatus.push(false);
      }
    }

    const savedFlagged = getItem("flagged");
    if (savedFlagged) {
      const parsed = JSON.parse(savedFlagged);
      if (Array.isArray(parsed)) {
        flaggedStatus = parsed;
        while (flaggedStatus.length < totalQuestions) flaggedStatus.push(false);
      }
    }

    const savedEliminated = getItem("eliminated");
    if (savedEliminated) {
      const parsed = JSON.parse(savedEliminated);
      if (Array.isArray(parsed)) {
        eliminatedStatus = parsed;
        while (eliminatedStatus.length < totalQuestions) eliminatedStatus.push([]);
      }
    }

    const savedErrors = getItem("error_log");
    if (savedErrors) {
      const parsed = JSON.parse(savedErrors);
      if (Array.isArray(parsed)) errorLog = parsed;
    }

    const savedAutoStart = getItem("autostart");
    if (savedAutoStart !== null) {
      autoStartEnabled = savedAutoStart === "true";
    }
  } catch (e) {
    console.warn("Could not read from localStorage:", e);
  }

  // Bound index
  if (currentIndex < 0 || currentIndex >= totalQuestions) currentIndex = 0;

  return {
    currentIndex,
    selectedAnswers,
    checkedStatus,
    flaggedStatus,
    eliminatedStatus,
    errorLog,
    autoStartEnabled,
  };
}

export function saveProgress({ currentIndex, selectedAnswers, checkedStatus, flaggedStatus, eliminatedStatus, errorLog, autoStartEnabled }, userId = null) {
  try {
    if (currentIndex !== undefined) localStorage.setItem(getKey("current_idx", userId), currentIndex);
    if (selectedAnswers !== undefined) localStorage.setItem(getKey("selections", userId), JSON.stringify(selectedAnswers));
    if (checkedStatus !== undefined) localStorage.setItem(getKey("checked", userId), JSON.stringify(checkedStatus));
    if (flaggedStatus !== undefined) localStorage.setItem(getKey("flagged", userId), JSON.stringify(flaggedStatus));
    if (eliminatedStatus !== undefined) localStorage.setItem(getKey("eliminated", userId), JSON.stringify(eliminatedStatus));
    if (errorLog !== undefined) localStorage.setItem(getKey("error_log", userId), JSON.stringify(errorLog));
    if (autoStartEnabled !== undefined) localStorage.setItem(getKey("autostart", userId), String(autoStartEnabled));
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

export function resetAllProgress(totalQuestions, userId = null) {
  try {
    localStorage.removeItem(getKey("current_idx", userId));
    localStorage.removeItem(getKey("selections", userId));
    localStorage.removeItem(getKey("checked", userId));
    localStorage.removeItem(getKey("flagged", userId));
    localStorage.removeItem(getKey("eliminated", userId));
    localStorage.removeItem(getKey("highlights", userId));
    localStorage.removeItem(getKey("error_log", userId));
    localStorage.removeItem(getKey("autostart", userId));
  } catch (e) {
    console.warn("Could not clear localStorage:", e);
  }

  return {
    currentIndex: 0,
    selectedAnswers: new Array(totalQuestions).fill(null),
    checkedStatus: new Array(totalQuestions).fill(false),
    flaggedStatus: new Array(totalQuestions).fill(false),
    eliminatedStatus: Array.from({ length: totalQuestions }, () => []),
    errorLog: [],
    autoStartEnabled: true,
  };
}


export function formatTime(totalSec) {
  const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const secs = (totalSec % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function exportProgressAsJson({ currentIndex, selectedAnswers, checkedStatus, flaggedStatus, errorLog }) {
  const backupData = {
    currentIndex,
    selectedAnswers,
    checkedStatus,
    flaggedStatus,
    errorLog,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sat_transitions_progress_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportJson(jsonString, totalQuestions) {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.selectedAnswers) || !Array.isArray(parsed.checkedStatus)) {
    throw new Error("Invalid SAT practice backup file format.");
  }
  const currentIndex = typeof parsed.currentIndex === 'number' && parsed.currentIndex < totalQuestions ? parsed.currentIndex : 0;
  const selectedAnswers = parsed.selectedAnswers;
  while (selectedAnswers.length < totalQuestions) selectedAnswers.push(null);
  const checkedStatus = parsed.checkedStatus;
  while (checkedStatus.length < totalQuestions) checkedStatus.push(false);
  const flaggedStatus = Array.isArray(parsed.flaggedStatus) ? parsed.flaggedStatus : new Array(totalQuestions).fill(false);
  while (flaggedStatus.length < totalQuestions) flaggedStatus.push(false);
  const eliminatedStatus = Array.from({ length: totalQuestions }, () => []);
  const errorLog = Array.isArray(parsed.errorLog) ? parsed.errorLog : [];

  return { currentIndex, selectedAnswers, checkedStatus, flaggedStatus, eliminatedStatus, errorLog };
}
