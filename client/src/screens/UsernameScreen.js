import React, { useEffect, useState } from 'react';
import Screen from '../components/Screen';
import {
  canSubmitUsername,
  getUsernameCharactersRemaining,
  getUsernameSubmitLabel,
  MAX_USERNAME_LENGTH,
  normalizeUsername,
} from '../utils/usernameForm';

const UsernameScreen = ({ onSubmit, isConnected, error }) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!isConnected || error) {
      setIsSubmitting(false);
    }
  }, [isConnected, error]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (
      !canSubmitUsername({
        username,
        isConnected,
        isSubmitting,
        hasInteracted,
      })
    ) {
      return;
    }
    const trimmed = normalizeUsername(username);
    const sent = onSubmit(trimmed);
    if (sent) {
      setIsSubmitting(true);
    }
  };

  const canSubmit = canSubmitUsername({
    username,
    isConnected,
    isSubmitting,
    hasInteracted,
  });
  const charactersRemaining = getUsernameCharactersRemaining(username);

  return (
    <Screen contentClassName="">
      <form className="vertical fade-in" onSubmit={handleSubmit} autoComplete="off">
        <div className="title">Enter your name</div>
        <div className="subtitle">Pick a name and jump into the lobby.</div>
        {error ? <div className="error-text">{error}</div> : null}
        <label className="muted-label" htmlFor="username-input">
          Player name
        </label>
        <input
          id="username-input"
          type="text"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setHasInteracted(true);
          }}
          onKeyDown={() => setHasInteracted(true)}
          onPaste={() => setHasInteracted(true)}
          className="long-input"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          maxLength={MAX_USERNAME_LENGTH}
          aria-describedby="username-help"
        />
        <div id="username-help" className="field-help">
          Use the same name to reconnect to your seat. Max {MAX_USERNAME_LENGTH} characters.
          <span>{charactersRemaining} characters left.</span>
        </div>
        <input
          type="submit"
          value={getUsernameSubmitLabel(isConnected)}
          disabled={!canSubmit}
          className="button"
        />
      </form>
    </Screen>
  );
};

export default UsernameScreen;
