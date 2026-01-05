const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

// ===========================================
// CONFIGURATION
// ===========================================
const PORT = 3000;
const JWT_SECRET = "smart-dartboard-secret-key-2024";
const DB_PATH = path.join(__dirname, "database.json");
const FRONTEND_DIST = path.join(__dirname, "public");
const SERIAL_PORT_PATH = "/dev/ttyACM0";
const SERIAL_BAUD_RATE = 115200;

// ===========================================
// SERVER INITIALIZATION
// ===========================================
const app = express();
app.use(cors());
app.use(express.json());

// Endpoint do konfiguracji frontendu
app.get("/api/config", (req, res) => {
  res.json({
    serverUrl: `//${req.get('host')}`,
  });
});

app.use(express.static(FRONTEND_DIST));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

console.log("Smart Dartboard Backend");
console.log("====================================");

// ===========================================
// DATABASE
// ===========================================
let db = {
  users: [],
  lobbies: [],
  activeGame: null,
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      db = JSON.parse(data);
      console.log(`[DB] Zaladowano baze: ${db.users.length} uzytkownikow, ${db.lobbies.length} lobby`);
      
      if (db.activeGame) {
        console.log(`[DB] Resetowanie aktywnej gry: ${db.activeGame}`);
        db.activeGame = null;
      }
      
      if (db.lobbies.length > 0) {
        console.log(`[DB] Usuwanie ${db.lobbies.length} lobby (restart serwera)`);
        db.lobbies = [];
      }
      
      saveDatabase();
      console.log("[DB] Serwer uruchomiony z czysta karta");
    }
  } catch (err) {
    console.log("[DB] Tworze nowa baze danych...");
  }
}

function saveDatabase() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

loadDatabase();

// ===========================================
// CONSTANTS
// ===========================================
const AVATAR_PRESETS = [
  "default", "dart1", "dart2", "dart3", 
  "player1", "player2", "player3", "player4",
  "crown", "target", "bull"
];

// ===========================================
// AUTHENTICATION HELPERS
// ===========================================
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak tokenu autoryzacji" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Nieprawidlowy token" });
  }

  req.user = decoded;
  next();
}

// ===========================================
// REST API - AUTHENTICATION
// ===========================================
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || username.length < 3 || username.length > 15) {
    return res.status(400).json({ error: "Nick musi miec 3-15 znakow" });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: "Haslo musi miec min. 4 znaki" });
  }

  if (db.users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: "Ten nick jest juz zajety" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    username: username.trim(),
    password: hashedPassword,
    avatar: "default",
    createdAt: new Date().toISOString(),
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      totalPoints: 0,
      highestCheckout: 0,
      averagePerRound: 0,
      favoriteMode: null,
    },
  };

  db.users.push(newUser);
  saveDatabase();

  console.log(`[AUTH] Nowy uzytkownik: ${username}`);

  const token = generateToken(newUser);
  res.json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      avatar: newUser.avatar,
      stats: newUser.stats,
    },
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ error: "Nieprawidlowy nick lub haslo" });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Nieprawidlowy nick lub haslo" });
  }

  console.log(`[AUTH] Zalogowano: ${username}`);

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      stats: user.stats,
    },
  });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "Uzytkownik nie istnieje" });
  }

  res.json({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    stats: user.stats,
  });
});

// ===========================================
// REST API - PROFILE
// ===========================================
app.put("/api/profile/avatar", authMiddleware, (req, res) => {
  const { avatar } = req.body;

  if (!AVATAR_PRESETS.includes(avatar)) {
    return res.status(400).json({ error: "Nieprawidlowy avatar" });
  }

  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "Uzytkownik nie istnieje" });
  }

  user.avatar = avatar;
  saveDatabase();

  res.json({ avatar: user.avatar });
});

app.get("/api/profile/avatars", (req, res) => {
  res.json(AVATAR_PRESETS);
});

app.put("/api/profile/username", authMiddleware, async (req, res) => {
  const { username } = req.body;

  if (!username || username.length < 3 || username.length > 15) {
    return res.status(400).json({ error: "Nick musi miec 3-15 znakow" });
  }

  const existingUser = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.id !== req.user.id
  );
  if (existingUser) {
    return res.status(400).json({ error: "Ten nick jest juz zajety" });
  }

  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "Uzytkownik nie istnieje" });
  }

  user.username = username.trim();
  saveDatabase();

  console.log(`[AUTH] Zmiana nicku: ${req.user.username} -> ${username}`);

  res.json({ 
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    stats: user.stats,
  });
});

app.put("/api/profile/password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ error: "Podaj aktualne haslo" });
  }
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "Nowe haslo musi miec min. 4 znaki" });
  }

  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "Uzytkownik nie istnieje" });
  }

  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Nieprawidlowe aktualne haslo" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  saveDatabase();

  console.log(`[AUTH] Password changed for: ${user.username}`);

  res.json({ message: "Haslo zostalo zmienione" });
});

// ===========================================
// REST API - LOBBY
// ===========================================
app.get("/api/lobbies", authMiddleware, (req, res) => {
  const lobbies = db.lobbies
    .filter((lobby) => lobby.status !== "FINISHED")
    .map((lobby) => ({
      id: lobby.id,
      name: lobby.name,
      hostName: lobby.hostName,
      playerCount: lobby.players.length,
      maxPlayers: lobby.maxPlayers,
      mode: lobby.mode,
      status: lobby.status,
      createdAt: lobby.createdAt,
    }));

  res.json(lobbies);
});

app.post("/api/lobbies", authMiddleware, (req, res) => {
  const { name, maxPlayers = 4 } = req.body;
  const user = db.users.find((u) => u.id === req.user.id);

  const existingLobby = db.lobbies.find((l) =>
    l.status !== "FINISHED" && l.players.some((p) => p.id === req.user.id)
  );
  if (existingLobby) {
    return res.status(400).json({ error: "Juz jestes w innym lobby" });
  }

  const newLobby = {
    id: uuidv4(),
    name: name || `Gra ${user.username}`,
    hostId: user.id,
    hostName: user.username,
    players: [
      {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        isReady: true,
        isHost: true,
      },
    ],
    maxPlayers: Math.min(Math.max(maxPlayers, 2), 8),
    mode: "501",
    status: "WAITING",
    createdAt: new Date().toISOString(),
    gameState: null,
  };

  db.lobbies.push(newLobby);
  saveDatabase();

  console.log(`[LOBBY] Nowe lobby: ${newLobby.name} (host: ${user.username})`);

  res.json(newLobby);
});

app.post("/api/lobbies/:id/join", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);
  const user = db.users.find((u) => u.id === req.user.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  if (lobby.status !== "WAITING") {
    return res.status(400).json({ error: "Gra juz trwa" });
  }

  if (lobby.players.length >= lobby.maxPlayers) {
    return res.status(400).json({ error: "Lobby jest pelne" });
  }

  if (lobby.players.some((p) => p.id === req.user.id)) {
    return res.json(lobby);
  }

  const existingLobby = db.lobbies.find((l) =>
    l.status !== "FINISHED" && l.players.some((p) => p.id === req.user.id)
  );
  if (existingLobby) {
    return res.status(400).json({ error: "Juz jestes w innym lobby" });
  }

  lobby.players.push({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    isReady: false,
    isHost: false,
  });

  saveDatabase();

  console.log(`[LOBBY] ${user.username} dolaczyl do: ${lobby.name}`);

  io.to(lobby.id).emit("lobby_update", lobby);

  res.json(lobby);
});

app.post("/api/lobbies/:id/leave", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  const playerIndex = lobby.players.findIndex((p) => p.id === req.user.id);
  if (playerIndex === -1) {
    return res.status(400).json({ error: "Nie jestes w tym lobby" });
  }

  const leavingPlayer = lobby.players[playerIndex];
  lobby.players.splice(playerIndex, 1);

  if (leavingPlayer.isHost) {
    if (lobby.players.length > 0) {
      lobby.players[0].isHost = true;
      lobby.hostId = lobby.players[0].id;
      lobby.hostName = lobby.players[0].username;
      
      saveDatabase();
      console.log(`[LOBBY] Nowy host: ${lobby.hostName} w lobby: ${lobby.name}`);
      
      io.to(lobby.id).emit("host_changed", { newHostId: lobby.hostId, newHostName: lobby.hostName });
      io.to(lobby.id).emit("lobby_update", lobby);
    } else {
      db.lobbies = db.lobbies.filter((l) => l.id !== lobby.id);
      saveDatabase();
      console.log(`[LOBBY] Usunieto puste lobby: ${lobby.name}`);
      
      io.to(lobby.id).emit("lobby_deleted");
      return res.json({ message: "Lobby usuniete" });
    }
  } else {
    saveDatabase();
    io.to(lobby.id).emit("lobby_update", lobby);
  }

  console.log(`[LOBBY] ${leavingPlayer.username} opuscil: ${lobby.name}`);

  res.json({ message: "Opuszczono lobby" });
});

app.get("/api/lobbies/:id", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  res.json(lobby);
});

app.put("/api/lobbies/:id/mode", authMiddleware, (req, res) => {
  const { mode } = req.body;
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  if (lobby.hostId !== req.user.id) {
    return res.status(403).json({ error: "Tylko host moze zmienic tryb" });
  }

  const validModes = ["301", "501", "CRICKET", "KILLER", "AROUND_THE_CLOCK", "SHANGHAI"];
  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: "Nieprawidlowy tryb gry" });
  }

  lobby.mode = mode;
  saveDatabase();

  io.to(lobby.id).emit("lobby_update", lobby);

  res.json(lobby);
});

// ===========================================
// REST API - GAME
// ===========================================
app.get("/api/game/can-start", authMiddleware, (req, res) => {
  res.json({
    canStart: db.activeGame === null && isDartboardConnected(),
    activeGameId: db.activeGame,
    dartboardConnected: isDartboardConnected(),
  });
});

app.get("/api/dartboard/status", authMiddleware, (req, res) => {
  res.json({
    connected: isDartboardConnected(),
    port: SERIAL_PORT_PATH,
    baudRate: SERIAL_BAUD_RATE,
  });
});

app.post("/api/lobbies/:id/start", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  if (lobby.hostId !== req.user.id) {
    return res.status(403).json({ error: "Tylko host moze rozpoczac gre" });
  }

  if (lobby.players.length < 2) {
    return res.status(400).json({ error: "Potrzeba minimum 2 graczy" });
  }

  if (!isDartboardConnected()) {
    return res.status(400).json({
      error: "Tarcza nie jest podlaczona! Podlacz Arduino i sprobuj ponownie.",
    });
  }

  if (db.activeGame !== null) {
    const activeLobby = db.lobbies.find((l) => l.id === db.activeGame);
    
    if (!activeLobby || activeLobby.status !== "PLAYING") {
      console.log(`[WARN] Czyszczenie osieroconego activeGame: ${db.activeGame}`);
      db.activeGame = null;
      saveDatabase();
    } else {
      return res.status(400).json({
        error: `Tarcza jest zajeta! Trwa gra: ${activeLobby.name}`,
      });
    }
  }

  db.activeGame = lobby.id;
  lobby.status = "PLAYING";

  const startingScore = lobby.mode === "301" ? 301 : 501;

  lobby.gameState = {
    mode: lobby.mode,
    status: "PLAYING",
    round: 1,
    currentPlayerIndex: 0,
    lastThrow: null,
    isBust: false,
    isDoubleOut: true,
    winner: null,
    checkoutHint: null,
    throwHistory: [],
    players: lobby.players.map((p) => ({
      id: p.id,
      name: p.username,
      score: startingScore,
      isActive: false,
      throwsInRound: [],
    })),
  };

  lobby.gameState.players[0].isActive = true;

  saveDatabase();

  console.log(`[GAME] Gra rozpoczeta: ${lobby.name} (tryb: ${lobby.mode})`);

  io.to(lobby.id).emit("game_started", lobby.gameState);
  io.to(lobby.id).emit("game_update", lobby.gameState);

  res.json(lobby.gameState);
});

app.post("/api/lobbies/:id/end", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  if (lobby.hostId !== req.user.id) {
    return res.status(403).json({ error: "Tylko host moze zakonczyc gre" });
  }

  if (db.activeGame === lobby.id) {
    db.activeGame = null;
  }

  lobby.status = "WAITING";
  lobby.gameState = null;

  saveDatabase();

  console.log(`[GAME] Gra zakonczona: ${lobby.name}`);

  io.to(lobby.id).emit("game_ended");

  res.json({ message: "Gra zakonczona" });
});

app.post("/api/lobbies/:id/abort", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  const player = lobby.players.find((p) => p.id === req.user.id);
  if (!player) {
    return res.status(403).json({ error: "Nie jestes w tym lobby" });
  }

  if (lobby.status !== "PLAYING") {
    return res.status(400).json({ error: "Gra nie jest w trakcie" });
  }

  const user = db.users.find((u) => u.id === req.user.id);
  const abortedBy = user ? user.username : "Nieznany";

  if (db.activeGame === lobby.id) {
    db.activeGame = null;
  }

  db.lobbies = db.lobbies.filter((l) => l.id !== lobby.id);
  saveDatabase();

  console.log(`[GAME] Gra przerwana przez ${abortedBy}: ${lobby.name}`);

  io.to(lobby.id).emit("game_aborted", { abortedBy });

  res.json({ message: "Gra przerwana" });
});

app.post("/api/lobbies/:id/simulate-throw", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  if (!lobby.gameState || lobby.gameState.status !== "PLAYING") {
    return res.status(400).json({ error: "Gra nie jest w trakcie" });
  }

  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];
  const multipliers = [1, 2, 3];
  const value = values[Math.floor(Math.random() * values.length)];
  let multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
  if (value === 25 && multiplier === 3) multiplier = 2;
  
  const dartThrow = { value, multiplier, total: value * multiplier };
  
  processThrow(lobby, dartThrow);

  res.json(lobby.gameState);
});

app.post("/api/lobbies/:id/undo-throw", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  if (lobby.hostId !== req.user.id) {
    return res.status(403).json({ error: "Tylko host moze cofac rzuty" });
  }

  if (!lobby.gameState || lobby.gameState.status !== "PLAYING") {
    return res.status(400).json({ error: "Gra nie jest w trakcie" });
  }

  const gs = lobby.gameState;
  
  if (!gs.throwHistory || gs.throwHistory.length === 0) {
    return res.status(400).json({ error: "Brak rzutow do cofniecia" });
  }

  const lastHistoryItem = gs.throwHistory.pop();
  
  const player = gs.players.find(p => p.id === lastHistoryItem.playerId);
  if (!player) {
    return res.status(400).json({ error: "Nie mozna znalezc gracza" });
  }

  if (!lastHistoryItem.isBust) {
    player.score += lastHistoryItem.throw.total;
  }

  const currentPlayer = gs.players[gs.currentPlayerIndex];
  
  if (currentPlayer.id === player.id) {
    if (currentPlayer.throwsInRound.length > 0) {
      currentPlayer.throwsInRound.pop();
    }
  } else {
    gs.players[gs.currentPlayerIndex].isActive = false;
    
    const playerIndex = gs.players.findIndex(p => p.id === player.id);
    gs.currentPlayerIndex = playerIndex;
    gs.players[playerIndex].isActive = true;
    
    if (player.throwsInRound.length > 0) {
      player.throwsInRound.pop();
    }
  }

  if (gs.throwHistory.length > 0) {
    const prevItem = gs.throwHistory[gs.throwHistory.length - 1];
    gs.lastThrow = prevItem.throw;
    gs.isBust = prevItem.isBust;
  } else {
    gs.lastThrow = null;
    gs.isBust = false;
  }

  gs.checkoutHint = getCheckoutHint(gs.players[gs.currentPlayerIndex].score);

  saveDatabase();

  console.log(`[GAME] Cofnieto rzut: ${lastHistoryItem.playerName} - ${lastHistoryItem.throw.total}pkt`);

  io.to(lobby.id).emit("game_update", gs);

  res.json(gs);
});

// ===========================================
// SOCKET.IO - REAL-TIME COMMUNICATION
// ===========================================
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Brak tokenu"));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error("Nieprawidlowy token"));
  }

  socket.user = decoded;
  next();
});

io.on("connection", (socket) => {
  console.log(`[SOCKET] Polaczony: ${socket.user.username}`);

  socket.on("join_lobby", (lobbyId) => {
    socket.join(lobbyId);
    console.log(`[SOCKET] ${socket.user.username} dolaczyl do pokoju: ${lobbyId}`);

    const lobby = db.lobbies.find((l) => l.id === lobbyId);
    if (lobby) {
      socket.emit("lobby_update", lobby);
      if (lobby.gameState) {
        socket.emit("game_update", lobby.gameState);
      }
    }
  });

  socket.on("leave_lobby", (lobbyId) => {
    socket.leave(lobbyId);
    console.log(`[SOCKET] ${socket.user.username} opuscil pokoj: ${lobbyId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET] Rozlaczony: ${socket.user.username}`);
  });
});

// ===========================================
// CHECKOUT HINTS TABLE
// ===========================================

const checkoutTable = {
  170: ["T20", "T20", "Bull"],
  160: ["T20", "T20", "D20"],
  120: ["T20", "S20", "D20"],
  100: ["T20", "D20"],
  80: ["T20", "D10"],
  60: ["S20", "D20"],
  40: ["D20"],
  32: ["D16"],
  20: ["D10"],
  16: ["D8"],
  8: ["D4"],
  4: ["D2"],
  2: ["D1"],
};

function getCheckoutHint(score) {
  if (score > 170 || score < 2) return null;
  return checkoutTable[score] || null;
}

/**
 * Process dart throw from Arduino dartboard
 */
function processThrow(lobby, dartThrow) {
  const gs = lobby.gameState;
  if (!gs || gs.status !== "PLAYING") return;

  const activePlayer = gs.players[gs.currentPlayerIndex];

  console.log(
    `[THROW] ${activePlayer.name}: ${dartThrow.multiplier === 3 ? "T" : dartThrow.multiplier === 2 ? "D" : ""}${dartThrow.value} (${dartThrow.total})`
  );

  gs.lastThrow = dartThrow;
  gs.isBust = false;

  let newScore = activePlayer.score - dartThrow.total;
  let isBust = false;

  if (newScore < 0 || newScore === 1) {
    console.log(`[THROW] BUST!`);
    gs.isBust = true;
    isBust = true;
    newScore = activePlayer.score;
    activePlayer.throwsInRound = [];
  } else {
    activePlayer.throwsInRound.push(dartThrow);
    activePlayer.score = newScore;
  }

  if (newScore === 0) {
    if (gs.isDoubleOut && dartThrow.multiplier !== 2) {
      console.log(`[THROW] BUST! Double Out required!`);
      gs.isBust = true;
      isBust = true;
      activePlayer.score = activePlayer.score + dartThrow.total;
      activePlayer.throwsInRound = [];
    } else {
      addToHistory(gs, activePlayer, dartThrow, false);
      
      console.log(`[GAME] ${activePlayer.name} WINS!`);
      gs.winner = activePlayer.id;
      gs.status = "FINISHED";

      updatePlayerStats(lobby, activePlayer.id, dartThrow.total);

      db.activeGame = null;
      lobby.status = "FINISHED";
      saveDatabase();

      io.to(lobby.id).emit("game_update", gs);
      return;
    }
  }

  addToHistory(gs, activePlayer, dartThrow, isBust);

  gs.checkoutHint = getCheckoutHint(activePlayer.score);

  if (activePlayer.throwsInRound.length >= 3 || gs.isBust) {
    gs.players[gs.currentPlayerIndex].isActive = false;
    gs.currentPlayerIndex = (gs.currentPlayerIndex + 1) % gs.players.length;
    gs.players[gs.currentPlayerIndex].isActive = true;
    gs.players[gs.currentPlayerIndex].throwsInRound = [];

    if (gs.currentPlayerIndex === 0) {
      gs.round++;
    }

    gs.checkoutHint = getCheckoutHint(gs.players[gs.currentPlayerIndex].score);
  }

  saveDatabase();
  io.to(lobby.id).emit("game_update", gs);
}

/**
 * Adds a throw to game history (max 10 entries)
 */
function addToHistory(gs, player, dartThrow, isBust) {
  if (!gs.throwHistory) {
    gs.throwHistory = [];
  }

  gs.throwHistory.push({
    id: uuidv4(),
    playerId: player.id,
    playerName: player.name,
    throw: dartThrow,
    isBust: isBust,
    timestamp: Date.now(),
  });

  if (gs.throwHistory.length > 10) {
    gs.throwHistory = gs.throwHistory.slice(-10);
  }
}

/**
 * Updates player statistics after game completion
 */
function updatePlayerStats(lobby, winnerId, checkoutScore) {
  const gs = lobby.gameState;
  if (!gs) return;

  const startingScore = gs.mode === "301" ? 301 : 501;
  
  gs.players.forEach((gamePlayer) => {
    const user = db.users.find((u) => u.id === gamePlayer.id);
    if (!user) return;

    user.stats.gamesPlayed++;
    
    const pointsScored = startingScore - gamePlayer.score;
    user.stats.totalPoints += pointsScored;
    
    if (gamePlayer.id === winnerId) {
      user.stats.gamesWon++;
      
      if (checkoutScore > user.stats.highestCheckout) {
        user.stats.highestCheckout = checkoutScore;
      }
    }
    
    const roundsPlayed = Math.ceil(gs.round / gs.players.length);
    if (roundsPlayed > 0) {
      const avgThisGame = pointsScored / roundsPlayed;
      const prevGames = user.stats.gamesPlayed - 1;
      if (prevGames > 0) {
        user.stats.averagePerRound = 
          (user.stats.averagePerRound * prevGames + avgThisGame) / user.stats.gamesPlayed;
      } else {
        user.stats.averagePerRound = avgThisGame;
      }
    }
    
    user.stats.favoriteMode = gs.mode;
    
    console.log(`[STATS] ${user.username}: games=${user.stats.gamesPlayed}, wins=${user.stats.gamesWon}, points=${user.stats.totalPoints}`);
  });
}

// ===========================================
// ARDUINO SERIAL PORT
// ===========================================

let serialPort = null;
let serialParser = null;
let isArduinoConnected = false;

/**
 * Checks if dartboard is connected
 */
function isDartboardConnected() {
  return isArduinoConnected && serialPort && serialPort.isOpen;
}

/**
 * Initializes serial port connection to Arduino dartboard
 */
function initializeSerialPort() {
  try {
    serialPort = new SerialPort({
      path: SERIAL_PORT_PATH,
      baudRate: SERIAL_BAUD_RATE,
      autoOpen: true,
    });

    serialParser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

    serialPort.on("open", () => {
      isArduinoConnected = true;
      console.log(`[ARDUINO] Connected on ${SERIAL_PORT_PATH} @ ${SERIAL_BAUD_RATE} baud`);
      io.emit("dartboard_status", { connected: true });
    });

    serialPort.on("error", (err) => {
      isArduinoConnected = false;
      console.error(`[ARDUINO] Serial port error: ${err.message}`);
      console.log("[ARDUINO] Server continues without physical dartboard.");
      io.emit("dartboard_status", { connected: false });
    });

    serialPort.on("close", () => {
      isArduinoConnected = false;
      console.log("[ARDUINO] Disconnected. Reconnecting in 5s...");
      io.emit("dartboard_status", { connected: false });
      setTimeout(initializeSerialPort, 5000);
    });

    serialParser.on("data", (line) => {
      handleArduinoData(line);
    });

  } catch (err) {
    isArduinoConnected = false;
    console.error(`[ARDUINO] Cannot open port ${SERIAL_PORT_PATH}: ${err.message}`);
    console.log("[ARDUINO] Server running without Arduino. Retry in 10s...");
    setTimeout(initializeSerialPort, 10000);
  }
}

/**
 * Handles incoming data from Arduino dartboard
 */
function handleArduinoData(line) {
  let data;
  try {
    data = JSON.parse(line.trim());
  } catch (err) {
    console.warn(`[ARDUINO] Invalid JSON: ${line}`);
    return;
  }

  if (data.event !== "hit") {
    console.log(`[ARDUINO] Event: ${data.event}`, data);
    return;
  }

  console.log(`[ARDUINO] HIT: sector=${data.sector}, multiplier=${data.multiplier}, score=${data.score}`);

  const dartThrow = {
    value: data.sector,
    multiplier: data.multiplier,
    total: data.score,
  };

  if (!db.activeGame) {
    console.log("[ARDUINO] Hit ignored - no active game");
    return;
  }

  const lobby = db.lobbies.find((l) => l.id === db.activeGame);
  if (!lobby || !lobby.gameState || lobby.gameState.status !== "PLAYING") {
    console.log("[ARDUINO] Hit ignored - game not in progress");
    return;
  }

  processThrow(lobby, dartThrow);
}

setTimeout(() => {
  console.log("[ARDUINO] Searching for Arduino on serial port...");
  initializeSerialPort();
}, 1000);

// ===========================================
// SPA ROUTING (React Router)
// ===========================================
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});

// ===========================================
// SERVER START
// ===========================================
const HOST = "0.0.0.0";
const os = require("os");

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const localIP = getLocalIP();

httpServer.listen(PORT, HOST, () => {
  console.log(`Smart Dartboard Server (Production)`);
  console.log(`====================================`);
  console.log(`Application: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log(``);
  console.log(`Local network access:`);
  console.log(`   http://${localIP}:${PORT}`);
  console.log(`====================================`);
});
