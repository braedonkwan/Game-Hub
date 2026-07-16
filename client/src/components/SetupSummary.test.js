import { render, screen } from '@testing-library/react';
import SetupSummary from './SetupSummary';

describe('SetupSummary', () => {
  test('renders summary text when provided', () => {
    render(<SetupSummary text="4 rounds, 30s per guess" />);

    expect(screen.getByText('4 rounds, 30s per guess')).toBeTruthy();
  });

  test('renders nothing without summary text', () => {
    const { container } = render(<SetupSummary text="" />);

    expect(container.firstChild).toBeNull();
  });
});
