const applyRoundSetup = (game, setup) => {
    game.rounds = 1;
    game.maxRounds = setup.rounds;
    game.answerTimeoutMs = setup.guessMs;
    game.scoreboard = {};
    game.lastRoundDeltas = null;
    game.lastRoundOutcomes = null;
};

const applySpotifySetup = (game, setup) => {
    applyRoundSetup(game, setup);
};

const applyTriviaSetup = (game, setup) => {
    applyRoundSetup(game, setup);
    game.trivia.category = setup.category;
    game.trivia.difficulty = setup.difficulty;
    game.trivia.type = setup.type;
};

module.exports = {
    applyRoundSetup,
    applySpotifySetup,
    applyTriviaSetup,
};
