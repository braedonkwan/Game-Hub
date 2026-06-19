import React, { useEffect, useState } from 'react';
import NumberField from '../components/NumberField';
import Screen from '../components/Screen';
import { parseSetupNumber } from '../utils/setupNumber';

const SetupScreen = ({ playlists, config, onStart, error }) => {
  const defaultRounds = config?.maxRoundsDefault ?? 5;
  const minRounds = config?.maxRoundsMin ?? 1;
  const maxRounds = config?.maxRoundsMax ?? 50;
  const defaultGuessSeconds = config?.guessSecondsDefault ?? 30;
  const minGuessSeconds = config?.guessSecondsMin ?? 5;
  const maxGuessSeconds = config?.guessSecondsMax ?? 120;
  const [rounds, setRounds] = useState(String(defaultRounds));
  const [guessSeconds, setGuessSeconds] = useState(String(defaultGuessSeconds));
  const [selectedPlaylist, setSelectedPlaylist] = useState(
    playlists[0]?.playlistID || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasPlaylists = playlists.length > 0;

  useEffect(() => {
    const firstPlaylist = playlists[0]?.playlistID || '';
    setSelectedPlaylist((current) => {
      const exists = playlists.some(
        (playlist) => playlist.playlistID === current
      );
      return exists ? current : firstPlaylist;
    });
    setIsSubmitting(false);
  }, [playlists, error]);

  useEffect(() => {
    setRounds(String(defaultRounds));
  }, [defaultRounds]);

  useEffect(() => {
    setGuessSeconds(String(defaultGuessSeconds));
  }, [defaultGuessSeconds]);

  const parsedRounds = parseSetupNumber(rounds, minRounds, maxRounds);
  const parsedGuessSeconds = parseSetupNumber(
    guessSeconds,
    minGuessSeconds,
    maxGuessSeconds
  );
  const canSubmit =
    Boolean(parsedRounds && parsedGuessSeconds && selectedPlaylist) &&
    hasPlaylists &&
    !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    const sent = onStart({
      maxRounds: parsedRounds,
      playlistId: selectedPlaylist,
      guessSeconds: parsedGuessSeconds,
    });
    if (sent) {
      setIsSubmitting(true);
    }
  };

  return (
    <Screen>
      <div className="title">Set up the game</div>
      <div className="subtitle">Choose your playlist and the number of rounds.</div>
      {error ? <div className="error-text">{error}</div> : null}
      {!hasPlaylists ? (
        <div className="error-text">No playlists are available yet.</div>
      ) : null}
      <NumberField
        label="Number of Rounds"
        value={rounds}
        min={minRounds}
        max={maxRounds}
        onChange={setRounds}
      />
      <NumberField
        label="Guess Time"
        value={guessSeconds}
        min={minGuessSeconds}
        max={maxGuessSeconds}
        unit="seconds"
        onChange={setGuessSeconds}
      />
      <label className="muted-label">Select Playlist</label>
      <select
        value={selectedPlaylist}
        onChange={(event) => setSelectedPlaylist(event.target.value)}
        className="long-input"
        disabled={!hasPlaylists}
      >
        {playlists.map((playlist) => (
          <option key={playlist.playlistID} value={playlist.playlistID}>
            {playlist.name}
          </option>
        ))}
      </select>
      <input
        type="button"
        value="Start Game"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="button"
      />
    </Screen>
  );
};

export default SetupScreen;
