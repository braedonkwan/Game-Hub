import { fireEvent, render, screen } from '@testing-library/react';
import useSingleSendAction from './useSingleSendAction';

const Harness = ({ action }) => {
  const { isLocked, reset, run } = useSingleSendAction();

  return (
    <>
      <button type="button" onClick={() => run(action, 'payload')}>
        {isLocked ? 'Locked' : 'Run'}
      </button>
      <button type="button" onClick={reset}>
        Reset
      </button>
    </>
  );
};

describe('useSingleSendAction', () => {
  test('locks after a successful send and can reset', () => {
    const action = jest.fn(() => true);

    render(<Harness action={action} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    fireEvent.click(screen.getByRole('button', { name: 'Locked' }));

    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith('payload');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(action).toHaveBeenCalledTimes(2);
  });

  test('stays unlocked when send fails', () => {
    const action = jest.fn(() => false);

    render(<Harness action={action} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(action).toHaveBeenCalledTimes(2);
  });
});
