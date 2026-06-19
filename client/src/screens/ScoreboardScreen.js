import React, { useMemo, useState } from 'react';
import RoundResult from '../components/RoundResult';
import Screen from '../components/Screen';
import { buildScoreRows } from '../utils/scoreboard';

const ScoreboardScreen = ({ scoreboard, round, total, roundResult, onReady }) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const scoreRows = useMemo(
    () => buildScoreRows(scoreboard),
    [scoreboard]
  );
  const hasProgress = Number.isFinite(round) && Number.isFinite(total) && total > 0;

  const handleReady = () => {
    const sent = onReady();
    if (sent) {
      setIsButtonDisabled(true);
    }
  };

  return (
    <Screen>
      <div className="scoreboard">
        <div className="title slide-up">Scoreboard</div>
        <div className="subtitle">
          {hasProgress
            ? `Round ${round} of ${total}. Faster correct guesses earn more points.`
            : 'Faster correct guesses earn more points.'}
        </div>
        <RoundResult result={roundResult} />
        {scoreRows.length ? (
          <table className="scoreboard-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {scoreRows.map((entry) => (
                <tr
                  key={entry.key}
                  className={`scoreboard-row${
                    entry.isLeader ? ' scoreboard-row--leader' : ''
                  }`}
                >
                  <td>
                    <span className="scoreboard-rank">{entry.rank}</span>
                    <span className="scoreboard-name">{entry.username}</span>
                    <span
                      className={`scoreboard-delta${
                        entry.delta ? ' scoreboard-delta--points' : ''
                      }`}
                    >
                      {entry.deltaLabel}
                    </span>
                  </td>
                  <td className="scoreboard-score">{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="hub-empty">No scores yet.</div>
        )}
      </div>
      <input
        type="button"
        value="Ready"
        onClick={handleReady}
        disabled={isButtonDisabled}
        className="button"
      />
    </Screen>
  );
};

export default ScoreboardScreen;
