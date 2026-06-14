import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from './session';

describe('stored session', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test('saves and loads reconnect credentials', () => {
    const session = {
      username: 'Player One',
      resumeToken: 'resume-token',
    };

    saveStoredSession(session);

    expect(loadStoredSession()).toEqual(session);
  });

  test('ignores malformed storage data', () => {
    window.sessionStorage.setItem('game-hub-session', '{"username":"Player"}');

    expect(loadStoredSession()).toBeNull();
  });

  test('clears reconnect credentials', () => {
    saveStoredSession({
      username: 'Player One',
      resumeToken: 'resume-token',
    });

    clearStoredSession();

    expect(loadStoredSession()).toBeNull();
  });
});
