import {
  canSubmitUsername,
  getUsernameCharactersRemaining,
  getUsernameSubmitLabel,
  MAX_USERNAME_LENGTH,
  normalizeUsername,
} from './usernameForm';

describe('username form helpers', () => {
  test('normalizes usernames before submit', () => {
    expect(normalizeUsername('  Ada  ')).toBe('Ada');
    expect(normalizeUsername(null)).toBe('');
    expect(normalizeUsername('A'.repeat(MAX_USERNAME_LENGTH + 4)).length).toBe(
      MAX_USERNAME_LENGTH
    );
  });

  test('allows submit only after interaction while connected and idle', () => {
    expect(
      canSubmitUsername({
        username: 'Ada',
        isConnected: true,
        isSubmitting: false,
        hasInteracted: true,
      })
    ).toBe(true);

    expect(
      canSubmitUsername({
        username: '   ',
        isConnected: true,
        isSubmitting: false,
        hasInteracted: true,
      })
    ).toBe(false);
    expect(
      canSubmitUsername({
        username: 'Ada',
        isConnected: false,
        isSubmitting: false,
        hasInteracted: true,
      })
    ).toBe(false);
    expect(
      canSubmitUsername({
        username: 'Ada',
        isConnected: true,
        isSubmitting: true,
        hasInteracted: true,
      })
    ).toBe(false);
    expect(
      canSubmitUsername({
        username: 'Ada',
        isConnected: true,
        isSubmitting: false,
        hasInteracted: false,
      })
    ).toBe(false);
  });

  test('formats the submit label from connection state', () => {
    expect(getUsernameSubmitLabel(true)).toBe('Submit');
    expect(getUsernameSubmitLabel(false)).toBe('Connecting...');
  });

  test('calculates remaining username characters', () => {
    expect(getUsernameCharactersRemaining('Ada')).toBe(
      MAX_USERNAME_LENGTH - 3
    );
    expect(
      getUsernameCharactersRemaining('A'.repeat(MAX_USERNAME_LENGTH + 4))
    ).toBe(0);
  });
});
