import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetupSelect from './SetupSelect';

describe('SetupSelect', () => {
  test('renders options and reports selected value', () => {
    const onChange = jest.fn();

    render(
      <SetupSelect
        label="Difficulty"
        value="easy"
        onChange={onChange}
        options={[
          { value: 'easy', label: 'Easy' },
          { value: 'hard', label: 'Hard' },
        ]}
      />
    );

    userEvent.selectOptions(screen.getByLabelText('Difficulty'), 'hard');

    expect(onChange).toHaveBeenCalledWith('hard');
  });
});
