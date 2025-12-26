# Smart Dartboard Server

Production server for the Smart Dartboard application with Arduino integration.

## Features

- **Real-time game management** via Socket.IO
- **Arduino dartboard integration** via serial port
- **JWT authentication** for secure user sessions
- **Multiple game modes**: 501, 301, Cricket, Killer
- **Player statistics tracking**
- **Lobby system** with host management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Real-time**: Socket.IO
- **Authentication**: JWT + bcryptjs
- **Hardware**: SerialPort (Arduino)
- **Database**: JSON file storage

## Requirements

- Node.js 18+
- Arduino dartboard (optional - server works without it)

## Installation

```bash
npm install
```

## Configuration

Environment variables (optional):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | `smart-dartboard-secret-key-2024` | JWT signing key |
| `SERIAL_PORT_PATH` | `/dev/ttyACM0` | Arduino serial port |
| `SERIAL_BAUD_RATE` | `115200` | Serial baud rate |

## Running

### Production

```bash
node server.js
```

Server will be available at:
- **Application**: `http://localhost:3001`
- **API**: `http://localhost:3001/api`
- **WebSocket**: `ws://localhost:3001`

### With PM2 (recommended)

```bash
pm2 start server.js --name dartboard
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/profile/avatar` | Update avatar |
| GET | `/api/profile/avatars` | Get available avatars |
| PUT | `/api/profile/username` | Change username |
| PUT | `/api/profile/password` | Change password |

### Lobby

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lobbies` | List all lobbies |
| POST | `/api/lobbies` | Create lobby |
| GET | `/api/lobbies/:id` | Get lobby details |
| POST | `/api/lobbies/:id/join` | Join lobby |
| POST | `/api/lobbies/:id/leave` | Leave lobby |
| PUT | `/api/lobbies/:id/mode` | Set game mode |
| POST | `/api/lobbies/:id/start` | Start game |
| POST | `/api/lobbies/:id/end` | End game |
| POST | `/api/lobbies/:id/abort` | Abort game |
| POST | `/api/lobbies/:id/undo-throw` | Undo last throw |

### Game

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/game/can-start` | Check dartboard availability |
| GET | `/api/game/dartboard/status` | Get dartboard connection status |

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_lobby` | `lobbyId: string` | Join lobby room |
| `leave_lobby` | `lobbyId: string` | Leave lobby room |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `lobby_update` | `Lobby` | Lobby state changed |
| `game_update` | `GameState` | Game state changed |
| `game_started` | `GameState` | Game started |
| `game_ended` | - | Game ended normally |
| `game_aborted` | `{ abortedBy: string }` | Game aborted |
| `host_changed` | `{ newHostId, newHostName }` | Host changed |
| `lobby_deleted` | - | Lobby was deleted |
| `dartboard_status` | `{ connected: boolean }` | Dartboard connection status |

## Arduino Protocol

The server expects JSON messages from Arduino via serial port:

```json
{
  "event": "hit",
  "sector": 20,
  "multiplier": 3,
  "score": 60
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | Event type (`hit`) |
| `sector` | number | Dartboard sector (1-20, 25 for bull) |
| `multiplier` | number | 1 = single, 2 = double, 3 = triple |
| `score` | number | Calculated score (sector × multiplier) |

## Database

Data is stored in `database.json`:

```json
{
  "users": [],
  "lobbies": [],
  "activeGame": null
}
```

The database is automatically created on first run.

## Project Structure

```
backend-emulator/
├── server.js        # Main server file
├── database.json    # Data storage
├── package.json     # Dependencies
├── public/          # Frontend build (from dart-app)
└── README.md        # This file
```

## Development

### Simulate Throw (without Arduino)

```bash
curl -X POST http://localhost:3001/api/lobbies/{id}/simulate-throw \
  -H "Authorization: Bearer {token}"
```

## License

MIT
