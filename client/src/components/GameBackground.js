import React from 'react';

const PARTICLES = [
  ['8%', '18%', '0s', '9s', '18px'],
  ['18%', '72%', '-4s', '12s', '24px'],
  ['29%', '38%', '-7s', '10s', '16px'],
  ['41%', '84%', '-2s', '13s', '22px'],
  ['53%', '13%', '-6s', '11s', '19px'],
  ['64%', '62%', '-9s', '14s', '26px'],
  ['76%', '30%', '-3s', '10s', '17px'],
  ['88%', '76%', '-8s', '12s', '21px'],
  ['95%', '45%', '-5s', '15s', '15px'],
  ['4%', '91%', '-10s', '13s', '20px'],
];

const GameBackground = ({ theme = 'hub' }) => (
  <div className={`game-background game-background--${theme}`} aria-hidden="true">
    <div className="game-background__aurora game-background__aurora--one" />
    <div className="game-background__aurora game-background__aurora--two" />
    <div className="game-background__aurora game-background__aurora--three" />
    <div className="game-background__particles">
      {PARTICLES.map(([left, top, delay, duration, size], index) => (
        <span
          key={`${left}-${top}`}
          style={{
            '--particle-left': left,
            '--particle-top': top,
            '--particle-delay': delay,
            '--particle-duration': duration,
            '--particle-size': size,
            '--particle-index': index,
          }}
        >
          ?
        </span>
      ))}
    </div>
  </div>
);

export default GameBackground;
