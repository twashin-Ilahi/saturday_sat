const STORAGE_KEY_INDEX = "sat_practice_current_idx";
const STORAGE_KEY_SELECTIONS = "sat_practice_selections";
const STORAGE_KEY_CHECKED = "sat_practice_checked";
const STORAGE_KEY_ERRORS = "sat_practice_error_log";
const STORAGE_KEY_AUTOSTART = "sat_practice_autostart";

export function loadProgress(totalQuestions) {
  let currentIndex = 0;
  let selectedAnswers = new Array(totalQuestions).fill(null);
  let checkedStatus = new Array(totalQuestions).fill(false);
  let errorLog = [];
  let autoStartEnabled = true;

  try {
    const savedIndex = localStorage.getItem(STORAGE_KEY_INDEX);
    if (savedIndex !== null) currentIndex = parseInt(savedIndex, 10);

    const savedSelections = localStorage.getItem(STORAGE_KEY_SELECTIONS);
    if (savedSelections) {
      const parsed = JSON.parse(savedSelections);
      if (Array.isArray(parsed)) {
        selectedAnswers = parsed;
        // ensure length
        while (selectedAnswers.length < totalQuestions) selectedAnswers.push(null);
      }
    }

    const savedChecked = localStorage.getItem(STORAGE_KEY_CHECKED);
    if (savedChecked) {
      const parsed = JSON.parse(savedChecked);
      if (Array.isArray(parsed)) {
        checkedStatus = parsed;
        while (checkedStatus.length < totalQuestions) checkedStatus.push(false);
      }
    }

    const savedErrors = localStorage.getItem(STORAGE_KEY_ERRORS);
    if (savedErrors) {
      const parsed = JSON.parse(savedErrors);
      if (Array.isArray(parsed)) errorLog = parsed;
    }

    const savedAutoStart = localStorage.getItem(STORAGE_KEY_AUTOSTART);
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
    errorLog,
    autoStartEnabled,
  };
}

export function saveProgress({ currentIndex, selectedAnswers, checkedStatus, errorLog, autoStartEnabled }) {
  try {
    if (currentIndex !== undefined) localStorage.setItem(STORAGE_KEY_INDEX, currentIndex);
    if (selectedAnswers !== undefined) localStorage.setItem(STORAGE_KEY_SELECTIONS, JSON.stringify(selectedAnswers));
    if (checkedStatus !== undefined) localStorage.setItem(STORAGE_KEY_CHECKED, JSON.stringify(checkedStatus));
    if (errorLog !== undefined) localStorage.setItem(STORAGE_KEY_ERRORS, JSON.stringify(errorLog));
    if (autoStartEnabled !== undefined) localStorage.setItem(STORAGE_KEY_AUTOSTART, String(autoStartEnabled));
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

export function resetAllProgress(totalQuestions) {
  try {
    localStorage.removeItem(STORAGE_KEY_INDEX);
    localStorage.removeItem(STORAGE_KEY_SELECTIONS);
    localStorage.removeItem(STORAGE_KEY_CHECKED);
    localStorage.removeItem(STORAGE_KEY_ERRORS);
  } catch (e) {
    console.warn("Could not clear localStorage:", e);
  }

  return {
    currentIndex: 0,
    selectedAnswers: new Array(totalQuestions).fill(null),
    checkedStatus: new Array(totalQuestions).fill(false),
    errorLog: [],
    autoStartEnabled: true,
  };
}

export function formatTime(totalSec) {
  const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const secs = (totalSec % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function exportProgressAsJson({ currentIndex, selectedAnswers, checkedStatus, errorLog }) {
  const backupData = {
    currentIndex,
    selectedAnswers,
    checkedStatus,
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
  const errorLog = Array.isArray(parsed.errorLog) ? parsed.errorLog : [];

  return { currentIndex, selectedAnswers, checkedStatus, errorLog };
}
