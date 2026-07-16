import React, { useMemo } from 'react';
import Fireworks from '../components/Fireworks';
import Screen from '../components/Screen';
import ScoreboardTable from '../components/ScoreboardTable';
import { buildScoreRows, getWinnerSummary } from '../utils/scoreboard';

const WinnerScreen = ({ scoreboard, currentUsername = '' }) => {
  const scoreRows = useMemo(
    () => buildScoreRows(scoreboard, currentUsername),
    [scoreboard, currentUsername]
  );
  const winnerSummary = useMemo(() => getWinnerSummary(scoreboard), [scoreboard]);

  return (
    <>
      {winnerSummary.hasWinner ? <Fireworks /> : null}
      <Screen containerClassName="winner-screen">
        <div className="text-container">{winnerSummary.text}</div>
        {scoreRows.length ? (
          <div className="scoreboard winner-board">
            <div className="title">Final leaderboard</div>
            <ScoreboardTable rows={scoreRows} />
          </div>
        ) : null}
      </Screen>
    </>
  );
};

export default WinnerScreen;
