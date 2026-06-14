const { TRIVIA_GAME_ID } = require('./gameCatalog');

const buildRoundResult = ({ activeGameId, triviaAnswer, currentTrack }) => {
    if (activeGameId === TRIVIA_GAME_ID) {
        return triviaAnswer ? { answer: triviaAnswer } : null;
    }
    return currentTrack?.name
        ? { answer: currentTrack.name, detail: currentTrack.artists || '' }
        : null;
};

module.exports = {
    buildRoundResult,
};
