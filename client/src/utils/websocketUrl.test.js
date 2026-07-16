import getWebSocketUrl, { buildWebSocketUrl } from './websocketUrl';

const locationFor = ({
  protocol = 'http:',
  hostname = 'localhost',
  port = '',
  pathname = '/',
} = {}) => ({
  protocol,
  hostname,
  port,
  pathname,
});

describe('websocket url helpers', () => {
  const originalEnvUrl = process.env.REACT_APP_WEBSOCKET_URL;

  afterEach(() => {
    if (originalEnvUrl === undefined) {
      delete process.env.REACT_APP_WEBSOCKET_URL;
    } else {
      process.env.REACT_APP_WEBSOCKET_URL = originalEnvUrl;
    }
  });

  test('uses trimmed configured websocket url when provided', () => {
    expect(
      buildWebSocketUrl({
        envUrl: '  wss://example.test/socket  ',
        location: locationFor(),
      })
    ).toBe('wss://example.test/socket');
  });

  test('falls back to default development port outside the hosted game path', () => {
    expect(
      buildWebSocketUrl({
        envUrl: '   ',
        location: locationFor({ hostname: '127.0.0.1', pathname: '/' }),
      })
    ).toBe('ws://127.0.0.1:8888');
  });

  test('uses the current host port for hosted game builds', () => {
    expect(
      buildWebSocketUrl({
        location: locationFor({
          hostname: 'game.example.test',
          pathname: '/game/',
          port: '443',
          protocol: 'https:',
        }),
      })
    ).toBe('wss://game.example.test:443');
  });

  test('omits a port segment for hosted game builds without a visible port', () => {
    expect(
      buildWebSocketUrl({
        location: locationFor({
          hostname: 'game.example.test',
          pathname: '/game/room',
          protocol: 'https:',
        }),
      })
    ).toBe('wss://game.example.test');
  });

  test('returns empty string without a configured url or browser location', () => {
    expect(buildWebSocketUrl()).toBe('');
  });

  test('default export reads process env and window location', () => {
    process.env.REACT_APP_WEBSOCKET_URL = ' ws://configured.test ';

    expect(getWebSocketUrl()).toBe('ws://configured.test');
  });
});
