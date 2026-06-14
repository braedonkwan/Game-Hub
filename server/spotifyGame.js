const { getCurrentTrack } = require('./spotify');
const { shuffleArray } = require('./utils');

const cleanTrackName = (name) => name.replace(/\s(?:\(feat\..*|\(with.*)/i, '');

const selectionKey = (selection) =>
    `${selection?.name || ''}::${selection?.artists || ''}`;

const toSelection = (track) => ({
    name: cleanTrackName(track.name),
    artists: track.artists.map((artist) => artist.name).join(', '),
});

async function songSelection(playlist) {
    const current = await getCurrentTrack();
    if (!current) {
        throw new Error('No track currently playing. Start Spotify playback and try again.');
    }

    const seen = new Set([current.id]);
    const decoys = [];
    playlist.forEach((track) => {
        if (!track?.id || seen.has(track.id)) {
            return;
        }
        seen.add(track.id);
        decoys.push(track);
    });

    if (decoys.length < 3) {
        throw new Error('Playlist must have at least 4 unique tracks.');
    }

    return {
        'current track': toSelection(current),
        ...Object.fromEntries(
            shuffleArray(decoys)
                .slice(0, 3)
                .map((track, index) => [`random track ${index + 1}`, toSelection(track)])
        ),
    };
}

module.exports = {
    selectionKey,
    songSelection,
};
