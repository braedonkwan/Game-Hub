import {
  NEW_GAME_MESSAGE,
  PLAY_AGAIN_MESSAGE,
  READY_MESSAGE,
  SETUP_GAME_MESSAGE,
  buildGameSelectMessage,
  buildGuessMessage,
  buildStartGameMessage,
  buildTriviaAnswerMessage,
  buildColoursBetMessage,
  buildColoursChoiceMessage,
  buildUsernameMessage,
} from './clientMessages';

describe('client websocket messages', () => {
  test('builds username and resume messages', () => {
    expect(
      JSON.parse(
        buildUsernameMessage({
          username: 'Player',
          resumeToken: 'token',
        })
      )
    ).toEqual({
      type: 'set_username',
      username: 'Player',
      resumeToken: 'token',
    });
  });

  test('builds setup messages with only selected options', () => {
    expect(
      JSON.parse(
        buildStartGameMessage({
          maxRounds: 4,
          playlistId: 'playlist',
          category: 9,
          difficulty: 'hard',
          type: 'boolean',
          guessSeconds: 45,
        })
      )
    ).toEqual({
      'max rounds': 4,
      'playlist ID': 'playlist',
      category: 9,
      difficulty: 'hard',
      type: 'boolean',
      guessSeconds: 45,
    });

    expect(JSON.parse(buildStartGameMessage({ maxRounds: 2 }))).toEqual({
      'max rounds': 2,
    });
  });

  test('builds action messages expected by the server', () => {
    expect(JSON.parse(buildGameSelectMessage('trivia'))).toEqual({
      gameId: 'trivia',
    });
    expect(JSON.parse(buildTriviaAnswerMessage('True'))).toEqual({
      type: 'trivia_answer',
      answer: 'True',
    });
    expect(JSON.parse(buildGuessMessage({ name: 'Song' }))).toEqual({
      name: 'Song',
    });
    expect(
      JSON.parse(buildColoursBetMessage({ red: '1.00', blue: '0.50' }))
    ).toEqual({
      type: 'colours_bet',
      bets: { red: '1.00', blue: '0.50' },
    });
    expect(JSON.parse(buildColoursChoiceMessage('purple'))).toEqual({
      type: 'colours_choice',
      colour: 'purple',
    });
    expect(READY_MESSAGE).toBe('ready');
    expect(PLAY_AGAIN_MESSAGE).toBe('play again');
    expect(SETUP_GAME_MESSAGE).toBe('setup game');
    expect(NEW_GAME_MESSAGE).toBe('new game');
  });

  test('includes Colours starting cash in setup messages', () => {
    expect(
      JSON.parse(
        buildStartGameMessage({ startingCash: '100.00', betSeconds: 45 })
      )
    ).toEqual({
      startingCash: '100.00',
      betSeconds: 45,
    });
  });
});
