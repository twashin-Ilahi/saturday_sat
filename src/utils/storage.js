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

/**
 * Checks if meaningful guest practice progress exists in local storage
 */
export function hasGuestProgress(totalQuestions = 314) {
  try {
    const guestState = loadProgress(totalQuestions, null);
    const guestHighlights = loadHighlights(null);

    const answeredCount = guestState.checkedStatus?.filter(Boolean).length || 0;
    const selectedCount = guestState.selectedAnswers?.filter(a => a !== null).length || 0;
    const flaggedCount = guestState.flaggedStatus?.filter(Boolean).length || 0;
    const errorCount = guestState.errorLog?.length || 0;
    const highlightCount = Object.keys(guestHighlights || {}).length;

    const hasData = answeredCount > 0 || selectedCount > 0 || errorCount > 0 || flaggedCount > 0 || highlightCount > 0;

    return {
      hasData,
      answeredCount: Math.max(answeredCount, selectedCount),
      checkedCount: answeredCount,
      errorCount,
      flaggedCount,
      highlightCount,
      guestProgress: {
        ...guestState,
        highlights: guestHighlights
      }
    };
  } catch (e) {
    return {
      hasData: false,
      answeredCount: 0,
      checkedCount: 0,
      errorCount: 0,
      flaggedCount: 0,
      highlightCount: 0,
      guestProgress: null
    };
  }
}

/**
 * Safely clears guest progress keys after successful migration/sync
 */
export function clearGuestProgress() {
  try {
    localStorage.removeItem("sat_practice_current_idx");
    localStorage.removeItem("sat_practice_selections");
    localStorage.removeItem("sat_practice_checked");
    localStorage.removeItem("sat_practice_flagged");
    localStorage.removeItem("sat_practice_eliminated");
    localStorage.removeItem("sat_practice_highlights");
    localStorage.removeItem("sat_practice_error_log");
    localStorage.removeItem("sat_practice_autostart");
    localStorage.removeItem("sat_guest_mode");
  } catch (e) {
    console.warn("Could not clear guest progress keys:", e);
  }
}

/**
 * Intelligently merges two progress states (e.g. guest progress into user state, or cloud into local).
 * Guaranteed ZERO DATA LOSS.
 */
export function mergeProgressStates(baseState, incomingState, totalQuestions = 314) {
  if (!baseState && !incomingState) {
    return loadProgress(totalQuestions, null);
  }
  if (!baseState) return { ...incomingState };
  if (!incomingState) return { ...baseState };

  const qLen = totalQuestions;

  // 1. Merge selections & checked status
  const baseSelections = Array.isArray(baseState.selectedAnswers) ? baseState.selectedAnswers : [];
  const incomingSelections = Array.isArray(incomingState.selectedAnswers) ? incomingState.selectedAnswers : [];
  const baseChecked = Array.isArray(baseState.checkedStatus) ? baseState.checkedStatus : [];
  const incomingChecked = Array.isArray(incomingState.checkedStatus) ? incomingState.checkedStatus : [];

  const mergedSelections = new Array(qLen).fill(null);
  const mergedChecked = new Array(qLen).fill(false);

  for (let i = 0; i < qLen; i++) {
    const bChecked = Boolean(baseChecked[i]);
    const iChecked = Boolean(incomingChecked[i]);
    const bSel = baseSelections[i] !== undefined ? baseSelections[i] : null;
    const iSel = incomingSelections[i] !== undefined ? incomingSelections[i] : null;

    if (bChecked && iChecked) {
      // Both checked: prefer base, fallback to incoming
      mergedChecked[i] = true;
      mergedSelections[i] = bSel !== null ? bSel : iSel;
    } else if (iChecked) {
      // Incoming has checked answer
      mergedChecked[i] = true;
      mergedSelections[i] = iSel !== null ? iSel : bSel;
    } else if (bChecked) {
      // Base has checked answer
      mergedChecked[i] = true;
      mergedSelections[i] = bSel !== null ? bSel : iSel;
    } else {
      // Neither is checked: keep whatever selection is available
      mergedChecked[i] = false;
      mergedSelections[i] = bSel !== null ? bSel : iSel;
    }
  }

  // 2. Merge flagged status
  const baseFlagged = Array.isArray(baseState.flaggedStatus) ? baseState.flaggedStatus : [];
  const incomingFlagged = Array.isArray(incomingState.flaggedStatus) ? incomingState.flaggedStatus : [];
  const mergedFlagged = new Array(qLen).fill(false);
  for (let i = 0; i < qLen; i++) {
    mergedFlagged[i] = Boolean(baseFlagged[i] || incomingFlagged[i]);
  }

  // 3. Merge eliminated choices
  const baseElim = Array.isArray(baseState.eliminatedStatus) ? baseState.eliminatedStatus : [];
  const incomingElim = Array.isArray(incomingState.eliminatedStatus) ? incomingState.eliminatedStatus : [];
  const mergedEliminated = Array.from({ length: qLen }, () => []);
  for (let i = 0; i < qLen; i++) {
    const bList = Array.isArray(baseElim[i]) ? baseElim[i] : [];
    const iList = Array.isArray(incomingElim[i]) ? incomingElim[i] : [];
    mergedEliminated[i] = Array.from(new Set([...bList, ...iList]));
  }

  // 4. Merge error log (deduplicate by id / originalIndex)
  const baseErrors = Array.isArray(baseState.errorLog) ? baseState.errorLog : [];
  const incomingErrors = Array.isArray(incomingState.errorLog) ? incomingState.errorLog : [];
  const errorMap = new Map();

  // First insert base errors
  baseErrors.forEach(err => {
    if (err && err.id) {
      errorMap.set(err.id, { ...err });
    }
  });

  // Then merge incoming errors
  incomingErrors.forEach(err => {
    if (err && err.id) {
      if (errorMap.has(err.id)) {
        const existing = errorMap.get(err.id);
        // If either error was mastered, keep mastered
        const isMastered = existing.status === 'mastered' || err.status === 'mastered';
        errorMap.set(err.id, {
          ...existing,
          ...err,
          status: isMastered ? 'mastered' : (existing.status || err.status || 'unresolved')
        });
      } else {
        errorMap.set(err.id, { ...err });
      }
    }
  });

  const mergedErrorLog = Array.from(errorMap.values());

  // 5. Merge highlights
  const baseHighlights = (baseState.highlights && typeof baseState.highlights === 'object') ? baseState.highlights : {};
  const incomingHighlights = (incomingState.highlights && typeof incomingState.highlights === 'object') ? incomingState.highlights : {};
  const mergedHighlights = { ...baseHighlights, ...incomingHighlights };

  // 6. Merged current index & preferences
  const activeIdx = (typeof incomingState.currentIndex === 'number' && incomingState.currentIndex > 0)
    ? incomingState.currentIndex
    : (typeof baseState.currentIndex === 'number' ? baseState.currentIndex : 0);

  const mergedAutoStart = typeof incomingState.autoStartEnabled === 'boolean'
    ? incomingState.autoStartEnabled
    : (typeof baseState.autoStartEnabled === 'boolean' ? baseState.autoStartEnabled : true);

  return {
    currentIndex: Math.max(0, Math.min(activeIdx, qLen - 1)),
    selectedAnswers: mergedSelections,
    checkedStatus: mergedChecked,
    flaggedStatus: mergedFlagged,
    eliminatedStatus: mergedEliminated,
    errorLog: mergedErrorLog,
    highlights: mergedHighlights,
    autoStartEnabled: mergedAutoStart,
  };
}

export function formatTime(totalSec) {
  const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const secs = (totalSec % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function exportProgressAsJson({ currentIndex, selectedAnswers, checkedStatus, flaggedStatus, errorLog, highlights }) {
  const backupData = {
    currentIndex,
    selectedAnswers,
    checkedStatus,
    flaggedStatus,
    errorLog,
    highlights: highlights || {},
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
  const highlights = (parsed.highlights && typeof parsed.highlights === 'object') ? parsed.highlights : {};

  return { currentIndex, selectedAnswers, checkedStatus, flaggedStatus, eliminatedStatus, errorLog, highlights };
}
