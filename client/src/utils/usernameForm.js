export const MAX_USERNAME_LENGTH = 24;

export const normalizeUsername = (value) =>
  String(value || '').trim().slice(0, MAX_USERNAME_LENGTH);

export const getUsernameCharactersRemaining = (value) =>
  Math.max(0, MAX_USERNAME_LENGTH - String(value || '').length);

export const canSubmitUsername = ({
  username,
  isConnected,
  isSubmitting,
  hasInteracted,
}) =>
  Boolean(normalizeUsername(username)) &&
  Boolean(isConnected) &&
  !isSubmitting &&
  Boolean(hasInteracted);

export const getUsernameSubmitLabel = (isConnected) =>
  isConnected ? 'Submit' : 'Connecting...';
