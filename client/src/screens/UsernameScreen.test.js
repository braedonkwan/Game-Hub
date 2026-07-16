import { fireEvent, render, screen } from '@testing-library/react';
import { MAX_USERNAME_LENGTH } from '../utils/usernameForm';
import UsernameScreen from './UsernameScreen';

describe('UsernameScreen', () => {
  test('submits a trimmed username from the labeled input', () => {
    const onSubmit = jest.fn(() => true);

    render(<UsernameScreen onSubmit={onSubmit} isConnected error={null} />);

    const input = screen.getByLabelText('Player name');
    expect(input.getAttribute('maxlength')).toBe(String(MAX_USERNAME_LENGTH));
    expect(
      screen.getByText(`Use the same name to reconnect to your seat. Max ${MAX_USERNAME_LENGTH} characters.`)
    ).toBeTruthy();
    expect(screen.getByText(`${MAX_USERNAME_LENGTH} characters left.`)).toBeTruthy();
    fireEvent.change(input, { target: { value: '  Ada  ' } });
    expect(
      screen.getByText(`${MAX_USERNAME_LENGTH - '  Ada  '.length} characters left.`)
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith('Ada');
    expect(screen.getByRole('button', { name: 'Submit' }).disabled).toBe(true);
  });

  test('shows connection state and server errors', () => {
    const onSubmit = jest.fn();

    render(
      <UsernameScreen
        onSubmit={onSubmit}
        isConnected={false}
        error="Name already taken"
      />
    );

    expect(screen.getByText('Name already taken')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connecting...' }).disabled).toBe(
      true
    );

    fireEvent.change(screen.getByLabelText('Player name'), {
      target: { value: 'Ada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Connecting...' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
