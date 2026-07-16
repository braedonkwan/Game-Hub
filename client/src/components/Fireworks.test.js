import { render } from '@testing-library/react';
import Fireworks, { FIREWORK_BURSTS, FIREWORK_SPARKLES } from './Fireworks';

describe('Fireworks', () => {
  test('renders configured decorative bursts with style variables', () => {
    const { container } = render(<Fireworks />);
    const bursts = container.querySelectorAll('.firework');
    const sparkles = container.querySelectorAll('.firework-sparkle');

    expect(bursts.length).toBe(FIREWORK_BURSTS.length);
    expect(sparkles.length).toBe(FIREWORK_SPARKLES.length);
    expect(container.querySelector('.fireworks')).toBeTruthy();
    expect(container.querySelector('.fireworks').getAttribute('aria-hidden')).toBe(
      'true'
    );
    expect(bursts[0].className).toContain('firework--coral');
    expect(bursts[0].getAttribute('style')).toContain('--firework-x: 12%');
    expect(bursts[0].getAttribute('style')).toContain('--firework-delay: 0s');
    expect(sparkles[0].className).toContain('firework--gold');
    expect(sparkles[0].getAttribute('style')).toContain('--sparkle-drift: -18px');
  });

  test('can render custom burst and sparkle sets', () => {
    const { container } = render(
      <Fireworks
        bursts={[
          { id: 'test', x: 50, y: 40, delay: 1.2, size: 15, tone: 'gold' },
        ]}
        sparkles={[
          { id: 'glint', x: 45, y: 30, delay: 0.4, drift: 8, size: 3, tone: 'cyan' },
        ]}
      />
    );

    const burst = container.querySelector('.firework');
    const sparkle = container.querySelector('.firework-sparkle');
    expect(container.querySelectorAll('.firework').length).toBe(1);
    expect(container.querySelectorAll('.firework-sparkle').length).toBe(1);
    expect(burst.className).toContain('firework--gold');
    expect(burst.getAttribute('style')).toContain('--firework-size: 15px');
    expect(sparkle.className).toContain('firework--cyan');
    expect(sparkle.getAttribute('style')).toContain('--sparkle-size: 3px');
  });
});
