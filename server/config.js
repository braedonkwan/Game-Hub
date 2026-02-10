const REQUIRED_ENV = ['CLIENT_ID', 'CLIENT_SECRET', 'REFRESH_TOKEN'];
const DEFAULT_PORT = 8888;

function validateEnv(env) {
    const missing = REQUIRED_ENV.filter((key) => !env[key]);
    if (missing.length) {
        console.error(`[ERROR] Missing required env vars: ${missing.join(', ')}`);
        process.exit(1);
    }
}

const env = process.env;
validateEnv(env);

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
};
