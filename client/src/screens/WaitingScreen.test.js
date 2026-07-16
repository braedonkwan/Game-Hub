import { fireEvent, render, screen } from '@testing-library/react';
import WaitingScreen from './WaitingScreen';

describe('WaitingScreen', () => {
  test('shows the waiting message, room link, and players', () => {
    render(
      <WaitingScreen
        message="Waiting for other players..."
        roomUrl="http://localhost/game/"
        currentUsername="Ada"
        players={[
          {
            id: 1,
            username: 'Ada',
            isConnected: true,
            isLeader: true,
            status: 'Ready',
          },
        ]}
      />
    );

    expect(screen.getByText('Waiting for other players...')).toBeTruthy();
    expect(screen.getByText('Room link')).toBeTruthy();
    expect(screen.getByText('http://localhost/game/')).toBeTruthy();
    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy();
  });

  test('copies the room link and shows success feedback', async () => {
    const copyRoomUrlFn = jest.fn(() => Promise.resolve(true));

    render(
      <WaitingScreen
        message="Waiting"
        roomUrl="http://localhost/game/"
        players={[]}
        copyRoomUrlFn={copyRoomUrlFn}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(copyRoomUrlFn).toHaveBeenCalledWith('http://localhost/game/');
    expect(await screen.findByText('Copied')).toBeTruthy();
  });

  test('shows unavailable feedback when copy fails', async () => {
    render(
      <WaitingScreen
        message="Waiting"
        roomUrl="http://localhost/game/"
        players={[]}
        copyRoomUrlFn={() => Promise.resolve(false)}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(await screen.findByText('Copy unavailable')).toBeTruthy();
  });

  test('omits room link controls when no room url is available', () => {
    render(<WaitingScreen message="Waiting" roomUrl="" players={[]} />);

    expect(screen.queryByText('Room link')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
  });
});
