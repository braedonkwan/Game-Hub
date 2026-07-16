import React, { useMemo } from 'react';
import RoundResult from '../components/RoundResult';
import ScoreboardTable from '../components/ScoreboardTable';
import Screen from '../components/Screen';
import useSingleSendAction from '../hooks/useSingleSendAction';
import { buildScoreRows } from '../utils/scoreboard';

const ScoreboardScreen = ({
  scoreboard,
  round,
  total,
  roundResult,
  currentUsername = '',
  onReady,
}) => {
  const { isLocked, run } = useSingleSendAction();
  const scoreRows = useMemo(
    () => buildScoreRows(scoreboard, currentUsername),
    [scoreboard, currentUsername]
  );
  const hasProgress = Number.isFinite(round) && Number.isFinite(total) && total > 0;

  const handleReady = () => {
    run(onReady);
  };

  return (
    <Screen
      containerClassName="scoreboard-container"
      contentClassName="scoreboard-screen vertical fade-in"
    >
      <div className="scoreboard">
        <div className="title slide-up">Scoreboard</div>
        <div className="subtitle">
          {hasProgress
            ? `Round ${round} of ${total}. Faster correct guesses earn more points.`
            : 'Faster correct guesses earn more points.'}
        </div>
        <RoundResult result={roundResult} />
        {scoreRows.length ? (
          <ScoreboardTable rows={scoreRows} />
        ) : (
          <div className="hub-empty">No scores yet.</div>
        )}
      </div>
      <input
        type="button"
        value="Ready"
        onClick={handleReady}
        disabled={isLocked}
        className="button"
      />
    </Screen>
  );
};

export default ScoreboardScreen;
