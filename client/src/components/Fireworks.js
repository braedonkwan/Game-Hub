import React from 'react';

export const FIREWORK_BURSTS = [
  { id: 'top-left', x: 12, y: 10, delay: 0, size: 11, tone: 'coral' },
  { id: 'top-right', x: 78, y: 12, delay: 0.28, size: 13, tone: 'cyan' },
  { id: 'upper-mid', x: 46, y: 18, delay: 0.56, size: 10, tone: 'gold' },
  { id: 'right-high', x: 90, y: 25, delay: 0.82, size: 9, tone: 'green' },
  { id: 'left-mid', x: 18, y: 34, delay: 1.08, size: 14, tone: 'cyan' },
  { id: 'center-mid', x: 56, y: 42, delay: 1.34, size: 12, tone: 'coral' },
  { id: 'far-left', x: 7, y: 58, delay: 1.6, size: 9, tone: 'gold' },
  { id: 'right-mid', x: 84, y: 57, delay: 1.86, size: 12, tone: 'green' },
  { id: 'lower-left', x: 26, y: 74, delay: 2.12, size: 11, tone: 'coral' },
  { id: 'lower-right', x: 68, y: 78, delay: 2.38, size: 13, tone: 'cyan' },
  { id: 'bottom-left', x: 14, y: 88, delay: 2.64, size: 10, tone: 'green' },
  { id: 'bottom-right', x: 91, y: 86, delay: 2.9, size: 11, tone: 'gold' },
];

export const FIREWORK_SPARKLES = [
  { id: 'sparkle-1', x: 20, y: 18, delay: 0.15, drift: -18, size: 4, tone: 'gold' },
  { id: 'sparkle-2', x: 64, y: 16, delay: 0.45, drift: 16, size: 5, tone: 'cyan' },
  { id: 'sparkle-3', x: 36, y: 29, delay: 0.8, drift: -12, size: 4, tone: 'coral' },
  { id: 'sparkle-4', x: 87, y: 38, delay: 1.1, drift: 18, size: 5, tone: 'green' },
  { id: 'sparkle-5', x: 11, y: 47, delay: 1.35, drift: -10, size: 4, tone: 'cyan' },
  { id: 'sparkle-6', x: 52, y: 55, delay: 1.7, drift: 14, size: 5, tone: 'gold' },
  { id: 'sparkle-7', x: 76, y: 66, delay: 2.05, drift: 12, size: 4, tone: 'coral' },
  { id: 'sparkle-8', x: 29, y: 80, delay: 2.35, drift: -16, size: 5, tone: 'green' },
];

const getBurstStyle = ({ delay, size, x, y }) => ({
  '--firework-delay': `${delay}s`,
  '--firework-size': `${size}px`,
  '--firework-x': `${x}%`,
  '--firework-y': `${y}%`,
});

const getSparkleStyle = ({ delay, drift, size, x, y }) => ({
  '--sparkle-delay': `${delay}s`,
  '--sparkle-drift': `${drift}px`,
  '--sparkle-size': `${size}px`,
  '--sparkle-x': `${x}%`,
  '--sparkle-y': `${y}%`,
});

const Fireworks = ({
  bursts = FIREWORK_BURSTS,
  sparkles = FIREWORK_SPARKLES,
}) => (
  <div className="fireworks" aria-hidden="true">
    {bursts.map((burst) => (
      <span
        key={burst.id}
        className={`firework firework--${burst.tone}`}
        style={getBurstStyle(burst)}
      />
    ))}
    {sparkles.map((sparkle) => (
      <span
        key={sparkle.id}
        className={`firework-sparkle firework--${sparkle.tone}`}
        style={getSparkleStyle(sparkle)}
      />
    ))}
  </div>
);

export default Fireworks;
