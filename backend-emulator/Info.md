# Smart Dartboard - Technology Stack

Complete technology overview for the Smart Dartboard project.

---

## Backend

### Runtime & Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 5.2.1 | Web framework |

### Real-time Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Socket.IO** | 4.8.1 | WebSocket abstraction for real-time events |

### Authentication & Security

| Technology | Version | Purpose |
|------------|---------|---------|
| **jsonwebtoken** | 9.0.3 | JWT token generation and verification |
| **bcryptjs** | 3.0.3 | Password hashing |
| **cors** | 2.8.5 | Cross-Origin Resource Sharing |

### Hardware Integration

| Technology | Version | Purpose |
|------------|---------|---------|
| **serialport** | 13.0.0 | Serial port communication |
| **@serialport/parser-readline** | 12.0.0 | Line-by-line serial data parsing |

### Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **uuid** | 13.0.0 | Unique ID generation |
| **lowdb** | 5.1.0 | JSON file database (available) |

### Data Storage

- **JSON file** - Simple file-based database (`database.json`)

---

## Frontend

### Core

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI library |
| **React DOM** | 19.2.0 | React DOM renderer |
| **TypeScript** | 5.9.3 | Type-safe JavaScript |

### Build Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 7.2.4 | Build tool and dev server |
| **@vitejs/plugin-react** | 5.1.1 | React plugin for Vite |

### Routing

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Router DOM** | 7.10.1 | Client-side routing |

### Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **PostCSS** | 8.4.35 | CSS transformations |
| **Autoprefixer** | 10.4.19 | Vendor prefix automation |

### Real-time Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| **Socket.IO Client** | 4.8.1 | WebSocket client for real-time events |

### Code Quality

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.39.1 | JavaScript/TypeScript linter |
| **typescript-eslint** | 8.46.4 | TypeScript ESLint parser |
| **eslint-plugin-react-hooks** | 7.0.1 | React Hooks linting rules |
| **eslint-plugin-react-refresh** | 0.4.24 | React Refresh linting |

### Type Definitions

| Package | Purpose |
|---------|---------|
| **@types/react** | React type definitions |
| **@types/react-dom** | React DOM type definitions |
| **@types/node** | Node.js type definitions |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  React + TypeScript + Tailwind CSS              │   │
│  │  ├── React Router (SPA navigation)              │   │
│  │  └── Socket.IO Client (real-time updates)       │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────┴────────────────────────────────┐
│                      SERVER                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Node.js + Express 5                            │   │
│  │  ├── REST API (authentication, lobbies, game)   │   │
│  │  ├── Socket.IO (real-time game updates)         │   │
│  │  ├── JWT (session management)                   │   │
│  │  └── SerialPort (Arduino communication)         │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ Serial (USB)
┌────────────────────────┴────────────────────────────────┐
│                     HARDWARE                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Arduino + Electronic Dartboard                 │   │
│  │  └── JSON protocol over serial                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Communication Protocols

### REST API
- JSON request/response format
- JWT Bearer token authentication
- Standard HTTP methods (GET, POST, PUT, DELETE)

### WebSocket (Socket.IO)
- Event-based communication
- Automatic reconnection
- Room-based broadcasting (per lobby)

### Serial (Arduino)
- JSON messages over USB serial
- 115200 baud rate
- Newline-delimited messages

---

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Frontend | `npm run dev` (Vite HMR) | Static files in `public/` |
| Backend | `node server.js` | `pm2 start server.js` |
| Database | `database.json` | `database.json` |
| Arduino | Optional | Required |
