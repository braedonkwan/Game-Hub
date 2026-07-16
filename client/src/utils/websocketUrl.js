const DEFAULT_WS_PORT = '8888';
const GAME_PATH_PREFIX = '/game';

export const buildWebSocketUrl = ({
  envUrl = '',
  location,
} = {}) => {
  const configuredUrl = String(envUrl || '').trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (!location) {
    return '';
  }

  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const hostname = location.hostname;
  const pathname = location.pathname || '';

  const shouldUseLocationPort = pathname.startsWith(GAME_PATH_PREFIX);
  const port = shouldUseLocationPort ? location.port : DEFAULT_WS_PORT;
  const portSegment = port ? `:${port}` : '';

  return `${protocol}://${hostname}${portSegment}`;
};

const getWebSocketUrl = () =>
  buildWebSocketUrl({
    envUrl: process.env.REACT_APP_WEBSOCKET_URL,
    location: typeof window === 'undefined' ? null : window.location,
  });

export default getWebSocketUrl;
