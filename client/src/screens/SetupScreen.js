import React, { useEffect, useState } from 'react';
import Screen from '../components/Screen';

const SetupScreen = ({ playlists, config, onStart, error }) => {
  const defaultRounds = config?.maxRoundsDefault ?? 5;
  const minRounds = config?.maxRoundsMin ?? 1;
  const maxRounds = config?.maxRoundsMax ?? 50;
  const [rounds, setRounds] = useState(String(defaultRounds));
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

  const handleRoundsChange = (event) => {
    const value = event.target.value;
    if (/^([1-9][0-9]{0,2})?$/.test(value)) {
      setRounds(value);
    }
  };

  const handleSubmit = () => {
    const parsedRounds = parseInt(rounds, 10);
    if (
      !parsedRounds ||
      parsedRounds < minRounds ||
      parsedRounds > maxRounds ||
      !selectedPlaylist
    ) {
      return;
    }
    const sent = onStart({ maxRounds: parsedRounds, playlistId: selectedPlaylist });
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
      <label className="muted-label">
        Number of Rounds ({minRounds}-{maxRounds})
      </label>
      <input
        type="text"
        value={rounds}
        onChange={handleRoundsChange}
        className="short-input"
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
        disabled={isSubmitting || !hasPlaylists}
        className="button"
      />
    </Screen>
  );
};

export default SetupScreen;
