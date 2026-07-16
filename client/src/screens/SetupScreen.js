import React, { useEffect, useState } from 'react';
import NumberField from '../components/NumberField';
import Screen from '../components/Screen';
import SetupSelect from '../components/SetupSelect';
import SetupSummary from '../components/SetupSummary';
import useSingleSendAction from '../hooks/useSingleSendAction';
import { parseSetupNumber } from '../utils/setupNumber';
import { buildSetupSummary } from '../utils/setupSummary';

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
  const { isLocked, reset, run } = useSingleSendAction();
  const hasPlaylists = playlists.length > 0;

  useEffect(() => {
    const firstPlaylist = playlists[0]?.playlistID || '';
    setSelectedPlaylist((current) => {
      const exists = playlists.some(
        (playlist) => playlist.playlistID === current
      );
      return exists ? current : firstPlaylist;
    });
    reset();
  }, [playlists, error, reset]);

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
    !isLocked;
  const setupSummary = buildSetupSummary({
    rounds: parsedRounds,
    guessSeconds: parsedGuessSeconds,
    timerLabel: 'guess',
  });
  const playlistOptions = playlists.map((playlist) => ({
    value: playlist.playlistID,
    label: playlist.name,
  }));

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    run(onStart, {
      maxRounds: parsedRounds,
      playlistId: selectedPlaylist,
      guessSeconds: parsedGuessSeconds,
    });
  };

  return (
    <Screen>
      <div className="title">Set up the game</div>
      <div className="subtitle">Choose your playlist and the number of rounds.</div>
      {error ? <div className="error-text">{error}</div> : null}
      {!hasPlaylists ? (
        <div className="error-text">No playlists are available yet.</div>
      ) : null}
      <SetupSummary text={setupSummary} />
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
      <SetupSelect
        label="Select Playlist"
        value={selectedPlaylist}
        options={playlistOptions}
        onChange={setSelectedPlaylist}
        disabled={!hasPlaylists}
      />
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
