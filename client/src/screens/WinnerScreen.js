import React, { useMemo } from 'react';
import Screen from '../components/Screen';

const WinnerScreen = ({ scoreboard }) => {
  const fireworks = useMemo(() => Array.from({ length: 18 }), []);
  const winner = useMemo(() => {
    const entries = Object.values(scoreboard || {});
    if (!entries.length) return null;
    return entries.reduce((top, entry) =>
      entry.score > top.score ? entry : top
    );
  }, [scoreboard]);

  const winnerText = winner
    ? `The winner is ${winner.username} with a score of ${winner.score}`
    : 'Game over';

  return (
    <>
      {winner && (
        <div className="fireworks" aria-hidden="true">
          {fireworks.map((_, index) => (
            <span key={`firework-${index}`} className="firework" />
          ))}
        </div>
      )}
      <Screen containerClassName="winner-screen">
        <div className="text-container">{winnerText}</div>
      </Screen>
    </>
  );
};

export default WinnerScreen;
