import React, { useState } from 'react';
import PlayerList from '../components/PlayerList';
import Screen from '../components/Screen';
import { copyRoomUrl, getRoomUrl } from '../utils/shareRoom';

const WaitingScreen = ({
  message,
  players,
  currentUsername = '',
  roomUrl = getRoomUrl(),
  copyRoomUrlFn = copyRoomUrl,
}) => {
  const [copyStatus, setCopyStatus] = useState('');

  const handleCopyRoomUrl = async () => {
    const copied = await copyRoomUrlFn(roomUrl);
    setCopyStatus(copied ? 'Copied' : 'Copy unavailable');
  };

  return (
    <Screen>
      <div className="text-container slide-up">{message}</div>
      {roomUrl ? (
        <div className="room-share">
          <div>
            <span>Room link</span>
            <code>{roomUrl}</code>
          </div>
          <button type="button" className="button button-small" onClick={handleCopyRoomUrl}>
            Copy
          </button>
          {copyStatus ? <span className="room-share-status">{copyStatus}</span> : null}
        </div>
      ) : null}
      <PlayerList
        players={players}
        currentUsername={currentUsername}
        className="player-panel"
      />
    </Screen>
  );
};

export default WaitingScreen;
