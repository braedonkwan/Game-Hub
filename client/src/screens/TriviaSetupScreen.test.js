import { fireEvent, render, screen } from '@testing-library/react';
import TriviaSetupScreen from './TriviaSetupScreen';

const config = {
  setupId: 1,
  maxRoundsDefault: 5,
  maxRoundsMin: 1,
  maxRoundsMax: 20,
  guessSecondsDefault: 30,
  guessSecondsMin: 5,
  guessSecondsMax: 90,
  defaultCategory: 'any',
  defaultDifficulty: 'any',
  defaultType: 'multiple',
  categories: [{ id: 9, name: 'General Knowledge' }],
  difficulties: [
    { id: 'any', name: 'Any difficulty' },
    { id: 'hard', name: 'Hard' },
  ],
  types: [
    { id: 'multiple', name: 'Multiple choice' },
    { id: 'boolean', name: 'True or false' },
  ],
};

describe('TriviaSetupScreen', () => {
  test('submits trivia setup payload and locks after a successful send', () => {
    const onStart = jest.fn(() => true);

    render(<TriviaSetupScreen config={config} onStart={onStart} />);

    expect(screen.getByText('5 questions, 30s per answer')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Number of Questions (1-20)'), {
      target: { value: '8' },
    });
    fireEvent.change(screen.getByLabelText('Answer Time (5-90 seconds)'), {
      target: { value: '45' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: '9' },
    });
    fireEvent.change(screen.getByLabelText('Difficulty'), {
      target: { value: 'hard' },
    });
    fireEvent.change(screen.getByLabelText('Question Type'), {
      target: { value: 'boolean' },
    });
    expect(screen.getByText('8 questions, 45s per answer')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start Trivia' }));

    expect(onStart).toHaveBeenCalledWith({
      maxRounds: 8,
      category: '9',
      difficulty: 'hard',
      type: 'boolean',
      guessSeconds: 45,
    });
    expect(screen.getByRole('button', { name: 'Start Trivia' }).disabled).toBe(
      true
    );
  });

  test('keeps trivia setup retryable when send fails', () => {
    const onStart = jest.fn(() => false);

    render(<TriviaSetupScreen config={config} onStart={onStart} />);

    fireEvent.click(screen.getByRole('button', { name: 'Start Trivia' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Start Trivia' }).disabled).toBe(
      false
    );
  });

  test('resets locked trivia setup when setup id changes', () => {
    const { rerender } = render(
      <TriviaSetupScreen config={config} onStart={jest.fn(() => true)} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start Trivia' }));
    expect(screen.getByRole('button', { name: 'Start Trivia' }).disabled).toBe(
      true
    );

    rerender(
      <TriviaSetupScreen
        config={{ ...config, setupId: 2, error: 'Try again' }}
        onStart={jest.fn(() => true)}
      />
    );

    expect(screen.getByText('Try again')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start Trivia' }).disabled).toBe(
      false
    );
  });
});
