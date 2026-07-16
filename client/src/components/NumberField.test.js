import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NumberField from './NumberField';

describe('NumberField', () => {
  test('associates its label with the input', () => {
    render(
      <NumberField
        label="Rounds"
        value="5"
        min={1}
        max={10}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Rounds (1-10)').value).toBe('5');
  });

  test('reports numeric changes and ignores invalid partial values', () => {
    const onChange = jest.fn();

    render(
      <NumberField
        label="Answer Time"
        value=""
        min={5}
        max={120}
        unit="seconds"
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText('Answer Time (5-120 seconds)');
    userEvent.type(input, '7a');

    expect(onChange).toHaveBeenCalledWith('7');
    expect(onChange).not.toHaveBeenCalledWith('7a');
  });
});
