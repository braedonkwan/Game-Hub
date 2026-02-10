import React, { useEffect, useState } from 'react';
import Screen from '../components/Screen';

const SetupScreen = ({ playlists, onStart, error }) => {
  const [rounds, setRounds] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(
    playlists[0]?.playlistID || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleRoundsChange = (event) => {
    const value = event.target.value;
    if (/^([1-9][0-9]{0,2})?$/.test(value)) {
      setRounds(value);
    }
  };

  const handleSubmit = () => {
    const maxRounds = parseInt(rounds, 10);
    if (!maxRounds || !selectedPlaylist) return;
    setIsSubmitting(true);
    onStart({ maxRounds, playlistId: selectedPlaylist });
  };

  return (
    <Screen>
      <div className="title">Set up the game</div>
      <div className="subtitle">Choose your playlist and the number of rounds.</div>
      {error ? <div className="error-text">{error}</div> : null}
      <label className="muted-label">Number of Rounds</label>
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
        disabled={isSubmitting}
        className="button"
      />
    </Screen>
  );
};

export default SetupScreen;
