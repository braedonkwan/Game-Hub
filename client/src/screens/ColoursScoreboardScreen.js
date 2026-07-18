import React, { useMemo } from 'react';
import ColoursScoreboardTable from '../components/ColoursScoreboardTable';
import Screen from '../components/Screen';
import useSingleSendAction from '../hooks/useSingleSendAction';
import { buildColoursScoreRows, COLOUR_LABELS } from '../utils/colours';

const ColoursScoreboardScreen = ({ payload, currentUsername, onReady }) => {
  const { isLocked, run } = useSingleSendAction();
  const rows = useMemo(
    () => buildColoursScoreRows(payload?.scores, currentUsername),
    [payload?.scores, currentUsername]
  );
  const colour = payload?.winningColour;

  return (
    <Screen containerClassName="scoreboard-container" contentClassName="scoreboard-screen vertical fade-in">
      <div className="scoreboard">
        <div className="title">Colours scoreboard</div>
        <div className="subtitle">Round {payload?.round} · Banker: {payload?.banker}</div>
        {payload?.skipped ? (
          <div className="round-result">This banker round was skipped because the per-colour limit was $0.00.</div>
        ) : (
          <div className={`colour-result colour-result--${colour}`}>
            <span className="colour-swatch" aria-hidden="true" />
            Winning colour: <strong>{COLOUR_LABELS[colour] || colour}</strong>
          </div>
        )}
        <ColoursScoreboardTable rows={rows} />
      </div>
      <input
        type="button"
        value="Ready"
        onClick={() => run(onReady)}
        disabled={isLocked}
        className="button"
      />
    </Screen>
  );
};

export default ColoursScoreboardScreen;
