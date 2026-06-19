import React, { useMemo } from 'react';
import Screen from '../components/Screen';
import { getWinners } from '../utils/scoreboard';

const WinnerScreen = ({ scoreboard }) => {
  const fireworks = useMemo(() => Array.from({ length: 18 }), []);
  const winners = useMemo(() => getWinners(scoreboard), [scoreboard]);
  const hasWinner = winners.length > 0;
  const winnerScore = hasWinner ? winners[0].score : 0;
  const winnerNames = winners.map((entry) => entry.username).join(', ');

  const winnerText = hasWinner
    ? winners.length === 1
      ? `The winner is ${winnerNames} with a score of ${winnerScore}`
      : `Tie game: ${winnerNames} with ${winnerScore} points`
    : 'Game over';

  return (
    <>
      {hasWinner && (
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
