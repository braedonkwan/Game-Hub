import React from 'react';

const ScoreboardTable = ({ rows }) => (
  <div
    className="scoreboard-table-wrap"
    role="region"
    aria-label="Scoreboard rankings"
    tabIndex="0"
  >
    <table className="scoreboard-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((entry) => (
          <tr
            key={entry.key}
            className={`scoreboard-row${
              entry.isCurrentPlayer ? ' scoreboard-row--current' : ''
            }${
              entry.isLeader ? ' scoreboard-row--leader' : ''
            }`}
          >
            <td>
              <div className="scoreboard-player">
                <span className="scoreboard-rank">{entry.rank}</span>
                <span className="scoreboard-name">{entry.username}</span>
                {entry.isCurrentPlayer ? (
                  <span className="scoreboard-you">You</span>
                ) : null}
              </div>
              <div className="scoreboard-details">
                <span
                  className={`scoreboard-delta${
                    entry.delta ? ' scoreboard-delta--points' : ''
                  }`}
                >
                  {entry.deltaLabel}
                </span>
                {entry.roundOutcomeLabel ? (
                  <span
                    className={`scoreboard-outcome scoreboard-outcome--${entry.roundOutcomeTone}`}
                  >
                    {entry.roundOutcomeLabel}
                  </span>
                ) : null}
                {entry.answerTimeLabel ? (
                  <span className="scoreboard-time">{entry.answerTimeLabel}</span>
                ) : null}
                {entry.roundBestLabel ? (
                  <span className="scoreboard-best">{entry.roundBestLabel}</span>
                ) : null}
                {entry.streakLabel ? (
                  <span className="scoreboard-streak">{entry.streakLabel}</span>
                ) : null}
              </div>
            </td>
            <td className="scoreboard-score">{entry.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ScoreboardTable;
