# Game Hub

Game Hub is a browser-based multiplayer party game server. Players join the shared room with a name, and the room leader chooses a game:

- **Colours** — bet against a rotating banker with a leader-configurable betting timer until one player remains. Its minimum starting balance is `max($1.00, $0.01 × 5 × (players − 1))`.
- **Trivia Challenge** — answer timed general-knowledge questions.
- **Spotify Guess the Song** — identify tracks playing through a connected Spotify account.

The Node.js server hosts the WebSocket game session and serves the production React client from `/game`.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- npm
- Internet access for Trivia and Spotify
- Optional: a Spotify developer application and an account/device that supports Spotify Web API playback control

## Quick setup without Spotify

Colours and Trivia can run without Spotify credentials.

1. Install the server and client dependencies:

   ```sh
   npm ci
   npm --prefix client ci
   ```

2. Create a `.env` file in the project root:

   ```dotenv
   PORT=8888
   SPOTIFY_DISABLED=true
   ```

3. Build the React client:

   ```sh
   npm --prefix client run build
   ```

4. Start the server:

   ```sh
   npm start
   ```

5. Open [http://localhost:8888/game](http://localhost:8888/game). Other players can join by opening the same address from a device that can reach the host computer.

The server health endpoint is available at [http://localhost:8888/health](http://localhost:8888/health).

## Spotify setup

Spotify is optional. To enable Spotify Guess the Song:

1. Create an application in the Spotify developer dashboard.
2. Add `http://localhost:8888/callback` as an allowed redirect URI.
3. Create the root `.env` file with your application credentials:

   ```dotenv
   PORT=8888
   REDIRECT_URI=http://localhost:8888/callback
   CLIENT_ID=your-client-id
   CLIENT_SECRET=your-client-secret
   ```

4. Generate a refresh token:

   ```sh
   npm run get-token
   ```

   The command opens Spotify authorization in your browser. After approval, copy the refresh token printed in the terminal, stop the token helper with `Ctrl+C`, and add it to `.env`:

   ```dotenv
   REFRESH_TOKEN=your-refresh-token
   ```

5. Ensure Spotify is not disabled, build the client, and start Game Hub:

   ```dotenv
   SPOTIFY_DISABLED=false
   ```

   ```sh
   npm --prefix client run build
   npm start
   ```

Keep `.env` private. It is ignored by Git and must never be committed.

## Development mode

Run the server and React development server in separate terminals.

Terminal 1:

```sh
npm start
```

Terminal 2:

```sh
npm --prefix client start
```

Open [http://localhost:3000](http://localhost:3000). The development client connects to `ws://localhost:8888` by default.

If the WebSocket server uses another address or port, create `client/.env`:

```dotenv
REACT_APP_WEBSOCKET_URL=ws://localhost:9000
```

Restart the React development server after changing client environment variables.

## Playing over a local network

By default, the server listens on all network interfaces. Other devices can normally join using the host computer's LAN address, for example:

```text
http://192.168.1.20:8888/game
```

If needed, set `IP_ADDRESS` in `.env` to the specific interface address:

```dotenv
IP_ADDRESS=192.168.1.20
```

Allow the configured port through the host firewall. Everyone connecting to one server joins the same shared room.

## Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Node.js and WebSocket server. |
| `npm test` | Run all server tests. |
| `npm run get-token` | Run the Spotify refresh-token helper. |
| `npm --prefix client start` | Start the React development server. |
| `npm --prefix client test -- --watchAll=false` | Run the client tests once. |
| `npm --prefix client run build` | Create the production client in `client/build`. |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Server port. Defaults to `8888`. |
| `IP_ADDRESS` | No | Interface address to bind. Defaults to all interfaces. |
| `SPOTIFY_DISABLED` | No | Set to `true` to explicitly disable Spotify. |
| `CLIENT_ID` | Spotify only | Spotify application client ID. |
| `CLIENT_SECRET` | Spotify only | Spotify application client secret. |
| `REFRESH_TOKEN` | Spotify only | Refresh token produced by `npm run get-token`. |
| `REDIRECT_URI` | Token helper only | Spotify callback URI registered for the application. |
| `REACT_APP_WEBSOCKET_URL` | No | Client-side WebSocket override, configured in `client/.env`. |

## Troubleshooting

- **Spotify is unavailable:** verify all three Spotify credentials are present, `SPOTIFY_DISABLED` is not enabled, and the server reports Spotify as ready at `/health`.
- **The client cannot connect:** confirm the server is running, the browser is using the correct host and port, and the firewall permits the connection.
- **`/game` is blank or missing:** run `npm --prefix client run build` before starting the production server.
- **Spotify playback fails:** start playback on an available Spotify device before beginning the game.
