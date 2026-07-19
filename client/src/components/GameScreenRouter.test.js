import { render, screen } from '@testing-library/react';
import GameScreenRouter from './GameScreenRouter';
import { GAME_STATES } from '../utils/gameState';

const actions = {
  sendUsername: jest.fn(() => true),
  startGame: jest.fn(() => true),
  selectGame: jest.fn(() => true),
  sendGuess: jest.fn(() => true),
  sendTriviaAnswer: jest.fn(() => true),
  sendColoursBet: jest.fn(() => true),
  sendColoursChoice: jest.fn(() => true),
  sendReady: jest.fn(() => true),
  playAgain: jest.fn(() => true),
  setupGame: jest.fn(() => true),
  newGame: jest.fn(() => true),
};

const baseProps = {
  gameData: null,
  isConnected: true,
  players: [],
  screenData: {
    listData: [],
    playlistError: null,
    playlistSetupConfig: null,
    isTriviaSetup: false,
    isTriviaQuestion: false,
    usernameError: null,
    scoreboardPayload: null,
    scoreboardData: null,
  },
  actions,
};

describe('GameScreenRouter', () => {
  test('routes to the username screen', () => {
    render(<GameScreenRouter {...baseProps} gameState={GAME_STATES.SET_USERNAME} />);

    expect(screen.getByText('Enter your name')).toBeTruthy();
  });

  test('routes game selection with available games', () => {
    render(
      <GameScreenRouter
        {...baseProps}
        gameState={GAME_STATES.SELECT_GAME}
        screenData={{
          ...baseProps.screenData,
          listData: [{ id: 'trivia', name: 'Trivia', description: 'Questions' }],
        }}
      />
    );

    expect(screen.getByText('Game Hub')).toBeTruthy();
    expect(screen.getByText('Trivia')).toBeTruthy();
  });

  test('routes scoreboard payloads', () => {
    render(
      <GameScreenRouter
        {...baseProps}
        gameState={GAME_STATES.SCOREBOARD}
        screenData={{
          ...baseProps.screenData,
          scoreboardPayload: {
            round: 2,
            total: 5,
            roundResult: { answer: 'Mercury' },
          },
          scoreboardData: {
            1: {
              username: 'Ada',
              score: 1200,
              delta: 100,
              streak: 2,
              roundOutcome: { answered: true, answerTimeMs: 650, correct: true },
            },
          },
        }}
      />
    );

    expect(screen.getByText('Scoreboard')).toBeTruthy();
    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByText('Mercury')).toBeTruthy();
    expect(screen.getByText('Correct')).toBeTruthy();
    expect(screen.getByText('0.7s')).toBeTruthy();
    expect(screen.getByText('Fastest')).toBeTruthy();
    expect(screen.getByText('2 streak')).toBeTruthy();
  });

  test('routes Colours betting payloads', () => {
    const coloursRound = {
      type: 'colours_round',
      round: 1,
      banker: { username: 'Ada', balanceCents: 10000 },
      colours: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
      role: 'bettor',
      canBet: true,
      balanceCents: 10000,
      perColourMaxCents: 1666,
      totalMaxCents: 10000,
      submittedCount: 0,
      eligibleCount: 1,
    };
    render(
      <GameScreenRouter
        {...baseProps}
        gameState={GAME_STATES.SELECT_ANSWER}
        gameData={coloursRound}
        screenData={{
          ...baseProps.screenData,
          isColoursRound: true,
        }}
      />
    );
    expect(screen.getByText('Colours')).toBeTruthy();
    expect(screen.getByLabelText('Red bet')).toBeTruthy();
  });
});
