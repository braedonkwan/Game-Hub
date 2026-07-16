import { fireEvent, render, screen, within } from '@testing-library/react';
import { buildSelectionOptions } from '../utils/selectionOptions';
import SelectionScreen from './SelectionScreen';

const selections = {
  first: { name: 'Song A', artists: 'Artist A' },
  second: { name: 'Song B', artists: 'Artist B' },
  round: 1,
  total: 3,
};

describe('SelectionScreen', () => {
  test('renders labeled options and sends a keyboard guess', () => {
    const onGuess = jest.fn(() => true);

    render(<SelectionScreen selections={selections} onGuess={onGuess} />);

    expect(screen.getByText('Press A-D or 1-4 to guess.')).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.getByText('Song A')).toBeTruthy();
    expect(screen.getByText('Artist B')).toBeTruthy();
    const expectedShortcutOption = buildSelectionOptions(selections).find(
      (option) => option.label === 'B'
    );
    const labeledOption = screen
      .getAllByRole('button')
      .find((button) => within(button).queryByText('B'));
    expect(within(labeledOption).getByText(expectedShortcutOption.title)).toBeTruthy();

    fireEvent.keyDown(window, { key: 'B' });
    fireEvent.keyDown(window, { key: 'A' });

    expect(onGuess).toHaveBeenCalledTimes(1);
    expect(onGuess).toHaveBeenCalledWith(expectedShortcutOption.selection);
  });
});
