require('dotenv').config();
const open = require('open').default;
const express = require('express');
const axios = require('axios');

const app = express();

const {
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
    PORT
} = process.env;

const REQUIRED_ENV = ['CLIENT_ID', 'CLIENT_SECRET', 'REDIRECT_URI', 'PORT'];
const scope = 'user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative';

function validateEnv() {
    const missing = REQUIRED_ENV.filter(key => !process.env[key]);
    if (missing.length) {
        console.error(`\n[ERROR]: Missing required env vars: ${missing.join(', ')}\n`);
        process.exit(1);
    }
}

function buildAuthUrl() {
    return `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

app.get('/', (_req, res) => {
    res.redirect(buildAuthUrl());
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        res.status(400).send('Authorization code missing.');
        return;
    }

    try {
        const resp = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
        );

        const { refresh_token: refreshToken } = resp.data;
        console.log(`\nYour refresh token is: ${refreshToken}\n`);
        res.send('Refresh token retrieved. Check your console output.');
    } catch (err) {
        const details = err.response?.data || err.message;
        console.error('\n[ERROR]: Failed to retrieve refresh token', details);
        res.status(500).send('Failed to retrieve refresh token. See server logs for details.');
    }
});

function start() {
    validateEnv();
    app.listen(PORT, () => {
        console.log(`\nServer running on http://localhost:${PORT}\n`);
        open(`http://localhost:${PORT}`);
    });
}

start();
