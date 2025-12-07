const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

// ============================================
// KONFIGURACJA
// ============================================
const PORT = 3000;
const JWT_SECRET = "smart-dartboard-secret-key-2024";
const DB_PATH = path.join(__dirname, "database.json");

// ============================================
// INICJALIZACJA SERWERA
// ============================================
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

console.log("🎯 Smart Dartboard Backend Emulator");
console.log("====================================");

// ============================================
// PROSTA BAZA DANYCH (JSON FILE)
// ============================================
let db = {
  users: [],
  lobbies: [],
  activeGame: null, // ID aktywnej gry (tylko jedna może być aktywna)
};

// Załaduj bazę z pliku
function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      db = JSON.parse(data);
      console.log(`📁 Załadowano bazę: ${db.users.length} użytkowników, ${db.lobbies.length} lobby`);
    }
  } catch (err) {
    console.log("📁 Tworzę nową bazę danych...");
  }
}

// Zapisz bazę do pliku
function saveDatabase() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

loadDatabase();

// ============================================
// AVATAR PRESETS
// ============================================
const AVATAR_PRESETS = [
  "default", "dart1", "dart2", "dart3", 
  "player1", "player2", "player3", "player4",
  "crown", "target", "bull"
];

// ============================================
// HELPERY AUTH
// ============================================
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

// Middleware do weryfikacji tokenu
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak tokenu autoryzacji" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Nieprawidłowy token" });
  }

  req.user = decoded;
  next();
}

// ============================================
// REST API - AUTENTYKACJA
// ============================================

// Rejestracja
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;

  // Walidacja
  if (!username || username.length < 3 || username.length > 15) {
    return res.status(400).json({ error: "Nick musi mieć 3-15 znaków" });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: "Hasło musi mieć min. 4 znaki" });
  }

  // Sprawdź czy nick zajęty
  if (db.users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: "Ten nick jest już zajęty" });
  }

  // Hashuj hasło
  const hashedPassword = await bcrypt.hash(password, 10);

  // Utwórz użytkownika
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

  console.log(`✅ Nowy użytkownik: ${username}`);

  // Zwróć token
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

// Logowanie
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  // Znajdź użytkownika
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ error: "Nieprawidłowy nick lub hasło" });
  }

  // Sprawdź hasło
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Nieprawidłowy nick lub hasło" });
  }

  console.log(`🔓 Zalogowano: ${username}`);

  // Zwróć token
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

// Pobierz profil (z tokenem)
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "Użytkownik nie istnieje" });
  }

  res.json({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    stats: user.stats,
  });
});

// ============================================
// REST API - PROFIL
// ============================================

// Aktualizuj avatar
app.put("/api/profile/avatar", authMiddleware, (req, res) => {
  const { avatar } = req.body;

  if (!AVATAR_PRESETS.includes(avatar)) {
    return res.status(400).json({ error: "Nieprawidłowy avatar" });
  }

  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "Użytkownik nie istnieje" });
  }

  user.avatar = avatar;
  saveDatabase();

  res.json({ avatar: user.avatar });
});

// Pobierz dostępne avatary
app.get("/api/profile/avatars", (req, res) => {
  res.json(AVATAR_PRESETS);
});

// ============================================
// REST API - LOBBY
// ============================================

// Lista wszystkich lobby
app.get("/api/lobbies", authMiddleware, (req, res) => {
  const lobbies = db.lobbies.map((lobby) => ({
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

// Utwórz nowe lobby
app.post("/api/lobbies", authMiddleware, (req, res) => {
  const { name, maxPlayers = 4 } = req.body;
  const user = db.users.find((u) => u.id === req.user.id);

  // Sprawdź czy użytkownik nie jest już w innym lobby
  const existingLobby = db.lobbies.find((l) =>
    l.players.some((p) => p.id === req.user.id)
  );
  if (existingLobby) {
    return res.status(400).json({ error: "Już jesteś w innym lobby" });
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
    status: "WAITING", // WAITING, PLAYING, FINISHED
    createdAt: new Date().toISOString(),
    gameState: null,
  };

  db.lobbies.push(newLobby);
  saveDatabase();

  console.log(`🏠 Nowe lobby: ${newLobby.name} (host: ${user.username})`);

  res.json(newLobby);
});

// Dołącz do lobby
app.post("/api/lobbies/:id/join", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);
  const user = db.users.find((u) => u.id === req.user.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  if (lobby.status !== "WAITING") {
    return res.status(400).json({ error: "Gra już trwa" });
  }

  if (lobby.players.length >= lobby.maxPlayers) {
    return res.status(400).json({ error: "Lobby jest pełne" });
  }

  // Sprawdź czy już w tym lobby
  if (lobby.players.some((p) => p.id === req.user.id)) {
    return res.json(lobby);
  }

  // Sprawdź czy w innym lobby
  const existingLobby = db.lobbies.find((l) =>
    l.players.some((p) => p.id === req.user.id)
  );
  if (existingLobby) {
    return res.status(400).json({ error: "Już jesteś w innym lobby" });
  }

  // Dodaj gracza
  lobby.players.push({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    isReady: false,
    isHost: false,
  });

  saveDatabase();

  console.log(`👤 ${user.username} dołączył do: ${lobby.name}`);

  // Powiadom innych przez Socket.IO
  io.to(lobby.id).emit("lobby_update", lobby);

  res.json(lobby);
});

// Opuść lobby
app.post("/api/lobbies/:id/leave", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  const playerIndex = lobby.players.findIndex((p) => p.id === req.user.id);
  if (playerIndex === -1) {
    return res.status(400).json({ error: "Nie jesteś w tym lobby" });
  }

  const leavingPlayer = lobby.players[playerIndex];
  lobby.players.splice(playerIndex, 1);

  // Jeśli host opuścił, usuń lobby lub przekaż hosta
  if (leavingPlayer.isHost) {
    if (lobby.players.length > 0) {
      lobby.players[0].isHost = true;
      lobby.hostId = lobby.players[0].id;
      lobby.hostName = lobby.players[0].username;
    } else {
      // Usuń puste lobby
      db.lobbies = db.lobbies.filter((l) => l.id !== lobby.id);
      saveDatabase();
      console.log(`🗑️ Usunięto puste lobby: ${lobby.name}`);
      return res.json({ message: "Lobby usunięte" });
    }
  }

  saveDatabase();

  console.log(`👋 ${leavingPlayer.username} opuścił: ${lobby.name}`);

  // Powiadom innych
  io.to(lobby.id).emit("lobby_update", lobby);

  res.json({ message: "Opuszczono lobby" });
});

// Pobierz szczegóły lobby
app.get("/api/lobbies/:id", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  res.json(lobby);
});

// Zmień tryb gry (tylko host)
app.put("/api/lobbies/:id/mode", authMiddleware, (req, res) => {
  const { mode } = req.body;
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  if (lobby.hostId !== req.user.id) {
    return res.status(403).json({ error: "Tylko host może zmienić tryb" });
  }

  const validModes = ["301", "501", "CRICKET", "KILLER", "AROUND_THE_CLOCK", "SHANGHAI"];
  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: "Nieprawidłowy tryb gry" });
  }

  lobby.mode = mode;
  saveDatabase();

  io.to(lobby.id).emit("lobby_update", lobby);

  res.json(lobby);
});

// ============================================
// REST API - GAME
// ============================================

// Sprawdź czy można rozpocząć grę
app.get("/api/game/can-start", authMiddleware, (req, res) => {
  res.json({
    canStart: db.activeGame === null,
    activeGameId: db.activeGame,
  });
});

// Rozpocznij grę (tylko host)
app.post("/api/lobbies/:id/start", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  if (lobby.hostId !== req.user.id) {
    return res.status(403).json({ error: "Tylko host może rozpocząć grę" });
  }

  if (lobby.players.length < 2) {
    return res.status(400).json({ error: "Potrzeba minimum 2 graczy" });
  }

  // 🎯 KLUCZOWE: Sprawdź czy inna gra nie jest aktywna
  if (db.activeGame !== null) {
    const activeLobby = db.lobbies.find((l) => l.id === db.activeGame);
    return res.status(400).json({
      error: `Tarcza jest zajęta! Trwa gra: ${activeLobby?.name || "nieznana"}`,
    });
  }

  // Rozpocznij grę
  db.activeGame = lobby.id;
  lobby.status = "PLAYING";

  // Inicjalizuj stan gry
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
    players: lobby.players.map((p) => ({
      id: p.id,
      name: p.username,
      score: startingScore,
      isActive: false,
      throwsInRound: [],
    })),
  };

  // Pierwszy gracz zaczyna
  lobby.gameState.players[0].isActive = true;

  saveDatabase();

  console.log(`🎮 Gra rozpoczęta: ${lobby.name} (tryb: ${lobby.mode})`);

  // Powiadom wszystkich w lobby
  io.to(lobby.id).emit("game_started", lobby.gameState);
  io.to(lobby.id).emit("game_update", lobby.gameState);

  res.json(lobby.gameState);
});

// Zakończ grę
app.post("/api/lobbies/:id/end", authMiddleware, (req, res) => {
  const lobby = db.lobbies.find((l) => l.id === req.params.id);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby nie istnieje" });
  }

  if (lobby.hostId !== req.user.id) {
    return res.status(403).json({ error: "Tylko host może zakończyć grę" });
  }

  // Zwolnij tarczę
  if (db.activeGame === lobby.id) {
    db.activeGame = null;
  }

  lobby.status = "WAITING";
  lobby.gameState = null;

  saveDatabase();

  console.log(`⏹️ Gra zakończona: ${lobby.name}`);

  io.to(lobby.id).emit("game_ended");

  res.json({ message: "Gra zakończona" });
});

// ============================================
// SOCKET.IO - REAL-TIME
// ============================================

// Weryfikacja tokenu dla Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Brak tokenu"));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error("Nieprawidłowy token"));
  }

  socket.user = decoded;
  next();
});

io.on("connection", (socket) => {
  console.log(`🔌 Socket połączony: ${socket.user.username}`);

  // Dołącz do pokoju lobby
  socket.on("join_lobby", (lobbyId) => {
    socket.join(lobbyId);
    console.log(`📍 ${socket.user.username} dołączył do pokoju: ${lobbyId}`);

    // Wyślij aktualny stan lobby
    const lobby = db.lobbies.find((l) => l.id === lobbyId);
    if (lobby) {
      socket.emit("lobby_update", lobby);
      if (lobby.gameState) {
        socket.emit("game_update", lobby.gameState);
      }
    }
  });

  // Opuść pokój lobby
  socket.on("leave_lobby", (lobbyId) => {
    socket.leave(lobbyId);
    console.log(`📍 ${socket.user.username} opuścił pokój: ${lobbyId}`);
  });

  // Rozłączenie
  socket.on("disconnect", () => {
    console.log(`🔌 Socket rozłączony: ${socket.user.username}`);
  });
});

// ============================================
// SYMULATOR RZUTÓW (tylko dla developmentu)
// ============================================

function simulateThrow() {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];
  const multipliers = [1, 2, 3];

  const value = values[Math.floor(Math.random() * values.length)];
  let multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];

  // Bull nie może być triple
  if (value === 25 && multiplier === 3) multiplier = 2;

  return { value, multiplier, total: value * multiplier };
}

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

function simulateGameStep() {
  if (!db.activeGame) return;

  const lobby = db.lobbies.find((l) => l.id === db.activeGame);
  if (!lobby || !lobby.gameState || lobby.gameState.status !== "PLAYING") return;

  const gs = lobby.gameState;
  const activePlayer = gs.players[gs.currentPlayerIndex];

  // Symulacja rzutu
  const dartThrow = simulateThrow();

  console.log(
    `🎯 ${activePlayer.name}: ${dartThrow.multiplier === 3 ? "T" : dartThrow.multiplier === 2 ? "D" : ""}${dartThrow.value} (${dartThrow.total})`
  );

  gs.lastThrow = dartThrow;
  gs.isBust = false;

  let newScore = activePlayer.score - dartThrow.total;

  // Bust
  if (newScore < 0 || newScore === 1) {
    console.log(`💥 BUST!`);
    gs.isBust = true;
    newScore = activePlayer.score;
    activePlayer.throwsInRound = [];
  } else {
    activePlayer.throwsInRound.push(dartThrow);
    activePlayer.score = newScore;
  }

  // Wygrana
  if (newScore === 0) {
    if (gs.isDoubleOut && dartThrow.multiplier !== 2) {
      console.log(`💥 BUST! Wymagany Double Out!`);
      gs.isBust = true;
      activePlayer.score = activePlayer.score + dartThrow.total;
      activePlayer.throwsInRound = [];
    } else {
      console.log(`🏆 ${activePlayer.name} WYGRYWA!`);
      gs.winner = activePlayer.id;
      gs.status = "FINISHED";

      // Zwolnij tarczę
      db.activeGame = null;
      lobby.status = "FINISHED";
      saveDatabase();

      io.to(lobby.id).emit("game_update", gs);
      return;
    }
  }

  gs.checkoutHint = getCheckoutHint(activePlayer.score);

  // Zmiana gracza po 3 rzutach lub buście
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

// Symuluj rzuty co 2 sekundy gdy gra jest aktywna
setInterval(simulateGameStep, 2000);

// ============================================
// START SERWERA
// ============================================
const HOST = "0.0.0.0"; // Nasłuchuj na wszystkich interfejsach (dostęp z sieci)

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Serwer działa na http://${HOST}:${PORT}`);
  console.log(`📡 REST API: http://192.168.1.65:${PORT}/api`);
  console.log(`🔌 WebSocket: ws://192.168.1.65:${PORT}`);
  console.log(`📱 Otwórz na telefonie: http://192.168.1.65:5173`);
  console.log("====================================");
});
