const SPOTIFY_ENV_KEYS = ['CLIENT_ID', 'CLIENT_SECRET', 'REFRESH_TOKEN'];
const DEFAULT_PORT = 8888;

const getMissingSpotifyEnv = (env) =>
    SPOTIFY_ENV_KEYS.filter((key) => !env[key]);
const isTruthyEnv = (value) => /^(1|true|yes)$/i.test(String(value || '').trim());

const env = process.env;
const MISSING_SPOTIFY_ENV = getMissingSpotifyEnv(env);
const SPOTIFY_DISABLED = isTruthyEnv(env.SPOTIFY_DISABLED);
const SPOTIFY_CONFIGURED = !SPOTIFY_DISABLED && MISSING_SPOTIFY_ENV.length === 0;
if (!SPOTIFY_CONFIGURED) {
    const reason = SPOTIFY_DISABLED
        ? 'disabled by SPOTIFY_DISABLED'
        : `missing environment variables: ${MISSING_SPOTIFY_ENV.join(', ')}`;
    console.warn(`[spotify] Disabled: ${reason}.`);
}

const PORT = Number(env.PORT) || DEFAULT_PORT;
const HOST = env.IP_ADDRESS || '0.0.0.0';
const DISPLAY_HOST = env.IP_ADDRESS || 'localhost';
const CLIENT_ID = env.CLIENT_ID;
const CLIENT_SECRET = env.CLIENT_SECRET;
const REFRESH_TOKEN = env.REFRESH_TOKEN;

module.exports = {
    PORT,
    HOST,
    DISPLAY_HOST,
    CLIENT_ID,
    CLIENT_SECRET,
    REFRESH_TOKEN,
    SPOTIFY_CONFIGURED,
    SPOTIFY_DISABLED,
    MISSING_SPOTIFY_ENV,
    getMissingSpotifyEnv,
    isTruthyEnv,
};
