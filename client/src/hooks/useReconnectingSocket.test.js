import { act, renderHook } from '@testing-library/react';
import useReconnectingSocket from './useReconnectingSocket';

class MockWebSocket {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.send = jest.fn();
    MockWebSocket.instances.push(this);
  }

  close = jest.fn(() => {
    this.readyState = 3;
    this.onclose?.();
  });
}

describe('useReconnectingSocket', () => {
  const OriginalWebSocket = global.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    global.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    global.WebSocket = OriginalWebSocket;
  });

  test('connects, parses messages, and sends through the active socket', () => {
    const onMessage = jest.fn();
    const onOpen = jest.fn();
    const { result, unmount } = renderHook(() =>
      useReconnectingSocket('ws://game.test', { onMessage, onOpen })
    );
    const socket = MockWebSocket.instances[0];

    expect(socket.url).toBe('ws://game.test');
    expect(result.current.connectionStatus).toBe('connecting');

    act(() => {
      socket.readyState = 1;
      socket.onopen();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionStatus).toBe('connected');
    expect(onOpen).toHaveBeenCalledWith(socket);

    act(() => socket.onmessage({ data: '{"type":"round","value":2}' }));
    expect(onMessage).toHaveBeenCalledWith({ type: 'round', value: 2 });

    expect(result.current.send('ready')).toBe(true);
    expect(socket.send).toHaveBeenCalledWith('ready');
    unmount();
  });

  test('reports disconnected sends without throwing', () => {
    const { result, unmount } = renderHook(() =>
      useReconnectingSocket('ws://game.test')
    );

    expect(result.current.send('ready')).toBe(false);
    expect(result.current.isConnected).toBe(false);
    unmount();
  });
});
