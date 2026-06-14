const axios = require('axios');
const {
    CLIENT_ID,
    CLIENT_SECRET,
    REFRESH_TOKEN,
    SPOTIFY_CONFIGURED,
} = require('./config');
const {
    MAX_ATTEMPTS,
    SPOTIFY_RETRY_ATTEMPTS,
    SPOTIFY_RETRY_DELAY_MS,
} = require('./constants');

let accessToken;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isSpotifyReady = () => Boolean(accessToken);

async function spotifyRequest(config, description) {
    for (let attempt = 1; attempt <= SPOTIFY_RETRY_ATTEMPTS; attempt++) {
        try {
            return await axios(config);
        } catch (err) {
            const details = err.response?.data || err.message;
            console.warn(
                `[spotify] ${description} failed (attempt ${attempt}/${SPOTIFY_RETRY_ATTEMPTS}).`,
                details
            );
            if (attempt === SPOTIFY_RETRY_ATTEMPTS) {
                throw err;
            }
            await sleep(SPOTIFY_RETRY_DELAY_MS);
        }
    }
}

async function refreshAccessToken(delayMs) {
    if (!SPOTIFY_CONFIGURED) {
        throw new Error('Spotify credentials are not configured.');
    }
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        try {
            const resp = await axios.post('https://accounts.spotify.com/api/token', null, {
                params: {
                    grant_type: 'refresh_token',
                    refresh_token: REFRESH_TOKEN,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                },
            });
            accessToken = resp.data.access_token;
            console.log('[spotify] Access token refreshed.');
            return accessToken;
        } catch (err) {
            const details = err.response?.data || err.message;
            console.warn(
                `[spotify] Refresh token attempt ${i + 1}/${MAX_ATTEMPTS} failed.`,
                details
            );
            if (i < MAX_ATTEMPTS - 1) {
                await sleep(delayMs);
            }
        }
    }
    accessToken = null;
    console.error('[ERROR] Spotify refresh token failed after max attempts.');
    throw new Error('Failed to refresh access token');
}

// Spotify API functions
async function getUserPlaylists() {
    const result = [];
    let url = 'https://api.spotify.com/v1/me/playlists';
    try {
        while (url) {
            const resp = await spotifyRequest(
                {
                    method: 'get',
                    url,
                    headers: { Authorization: `Bearer ${accessToken}` },
                },
                'fetch user playlists'
            );
            const playlists = resp.data.items.map((playlist) => ({
                name: playlist.name,
                playlistID: playlist.id,
            }));
            result.push(...playlists);
            url = resp.data.next;
        }
        return result;
    } catch (err) {
        console.error(
            "[ERROR] Failed to fetch user's playlists after retries.",
            err.response?.data || err.message
        );
        throw new Error('Failed to fetch playlists.');
    }
}

async function loadPlaylist(playlistId) {
    const allTracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    try {
        while (url) {
            const resp = await spotifyRequest(
                {
                    method: 'get',
                    url,
                    headers: { Authorization: `Bearer ${accessToken}` },
                },
                `load playlist ${playlistId}`
            );
            const items = (resp.data.items || [])
                .map((item) => item.track)
                .filter((track) => track && track.id);
            allTracks.push(...items);
            url = resp.data.next;
        }
        return allTracks;
    } catch (err) {
        console.error(
            '[ERROR] Failed to load playlist:',
            playlistId,
            err.response?.data || err.message
        );
        throw new Error('Failed to load playlist.');
    }
}

async function playPlaylist(playlistId) {
    try {
        await spotifyRequest(
            {
                method: 'put',
                url: 'https://api.spotify.com/v1/me/player/play',
                data: { context_uri: `spotify:playlist:${playlistId}` },
                headers: { Authorization: `Bearer ${accessToken}` },
            },
            `play playlist ${playlistId}`
        );
        console.log(`[spotify] Started playing playlist ${playlistId}.`);
    } catch (err) {
        console.error(
            '[ERROR] Failed to start playlist playback:',
            playlistId,
            err.response?.data || err.message
        );
        throw new Error('Failed to start playlist playback.');
    }
}

async function getCurrentTrack() {
    try {
        const resp = await spotifyRequest(
            {
                method: 'get',
                url: 'https://api.spotify.com/v1/me/player/currently-playing',
                headers: { Authorization: `Bearer ${accessToken}` },
            },
            'get current track'
        );
        return resp.data?.item || null;
    } catch (err) {
        console.error('[ERROR] Failed to get current track.', err.response?.data || err.message);
        throw new Error('Failed to get current track.');
    }
}

async function nextTrack() {
    try {
        await spotifyRequest(
            {
                method: 'post',
                url: 'https://api.spotify.com/v1/me/player/next',
                headers: { Authorization: `Bearer ${accessToken}` },
            },
            'skip to next track'
        );
    } catch (err) {
        console.error('[ERROR] Failed to skip to next track.', err.response?.data || err.message);
        throw new Error('Failed to skip to next track.');
    }
}

module.exports = {
    refreshAccessToken,
    isSpotifyReady,
    getUserPlaylists,
    loadPlaylist,
    playPlaylist,
    getCurrentTrack,
    nextTrack,
};
