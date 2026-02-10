const DEFAULT_WS_PORT = '8888';
const GAME_PATH_PREFIX = '/game';

const getWebSocketUrl = () => {
  const envUrl = process.env.REACT_APP_WEBSOCKET_URL;
  if (envUrl) {
    return envUrl;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const hostname = window.location.hostname;
  const pathname = window.location.pathname || '';

  const shouldUseLocationPort = pathname.startsWith(GAME_PATH_PREFIX);
  const port = shouldUseLocationPort ? window.location.port : DEFAULT_WS_PORT;
  const portSegment = port ? `:${port}` : '';

  return `${protocol}://${hostname}${portSegment}`;
};

export default getWebSocketUrl;
