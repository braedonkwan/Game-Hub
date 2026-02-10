import React, { useEffect, useState } from 'react';
import Screen from '../components/Screen';

const UsernameScreen = ({ onSubmit, isConnected }) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setIsSubmitting(false);
    }
  }, [isConnected]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || !isConnected || !hasInteracted) return;
    setIsSubmitting(true);
    onSubmit(trimmed);
  };

  return (
    <Screen contentClassName="">
      <form className="vertical fade-in" onSubmit={handleSubmit} autoComplete="off">
        <div className="title">Enter your name</div>
        <div className="subtitle">Pick a name and jump into the lobby.</div>
        <input
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
        />
        <input
          type="submit"
          value={isConnected ? 'Submit' : 'Connecting...'}
          disabled={!username.trim() || isSubmitting || !isConnected || !hasInteracted}
          className="button"
        />
      </form>
    </Screen>
  );
};

export default UsernameScreen;
