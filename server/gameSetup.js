const applySpotifySetup = (game, setup) => {
    game.rounds = 1;
    game.maxRounds = setup.rounds;
    game.answerTimeoutMs = setup.guessMs;
    game.scoreboard = {};
};

const applyTriviaSetup = (game, setup) => {
    game.rounds = 1;
    game.answerTimeoutMs = setup.guessMs;
    game.maxRounds = setup.rounds;
    game.trivia.category = setup.category;
    game.trivia.difficulty = setup.difficulty;
    game.trivia.type = setup.type;
    game.scoreboard = {};
};

module.exports = {
    applySpotifySetup,
    applyTriviaSetup,
};
