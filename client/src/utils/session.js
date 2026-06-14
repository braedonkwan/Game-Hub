const STORAGE_KEY = 'game-hub-session';

export const loadStoredSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const session = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
    if (
      typeof session?.username !== 'string' ||
      !session.username.trim() ||
      typeof session?.resumeToken !== 'string' ||
      !session.resumeToken
    ) {
      return null;
    }
    return {
      username: session.username.trim(),
      resumeToken: session.resumeToken,
    };
  } catch {
    return null;
  }
};

export const saveStoredSession = (session) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Reconnection still works for the current tab when storage is unavailable.
  }
};

export const clearStoredSession = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable or restricted storage.
  }
};
