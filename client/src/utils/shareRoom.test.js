import { copyRoomUrl, getRoomUrl } from './shareRoom';

describe('share room helpers', () => {
  test('reads the current room url from a location-like object', () => {
    expect(getRoomUrl({ href: 'http://localhost/game/' })).toBe(
      'http://localhost/game/'
    );
    expect(getRoomUrl(null)).toBe('');
  });

  test('copies the room url when clipboard access is available', async () => {
    const clipboard = { writeText: jest.fn(() => Promise.resolve()) };

    await expect(copyRoomUrl('http://localhost/game/', clipboard)).resolves.toBe(
      true
    );
    expect(clipboard.writeText).toHaveBeenCalledWith('http://localhost/game/');
  });

  test('reports copy failure defensively', async () => {
    await expect(copyRoomUrl('', { writeText: jest.fn() })).resolves.toBe(false);
    await expect(copyRoomUrl('http://localhost/game/', null)).resolves.toBe(false);
    await expect(
      copyRoomUrl('http://localhost/game/', {
        writeText: jest.fn(() => Promise.reject(new Error('blocked'))),
      })
    ).resolves.toBe(false);
  });
});
