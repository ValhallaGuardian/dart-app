const { Server } = require("socket.io");

const io = new Server(3000, {
  cors: {
    origin: "*", 
  },
});

console.log("Emulator Backend start na porcie 3000...");

// Stan początkowy gry
let gameState = {
  round: 1,
  currentThrow: null,
  players: [
    { name: "Bot Marcin", score: 501, isActive: true },
    { name: "Bot Franek", score: 501, isActive: false },
    { name: "Bot Dariusz", score: 501, isActive: false },
    { name: "Bot R", score: 501, isActive: false },
  ],
};

// Logika gry
function simulateGameStep() {
  
  const activePlayerIndex = gameState.players.findIndex((p) => p.isActive);
  const activePlayer = gameState.players[activePlayerIndex];

  // Symulacja rzutu
  const points = Math.floor(Math.random() * 61);
  
  console.log(`Rzut: ${activePlayer.name} trafia ${points}!`);

  // Aktualizuj wynik
  let newScore = activePlayer.score - points;
  
  // Obsługa "Bust" (jeśli wynik spadnie poniżej 0, rzut się nie liczy - uproszczenie)
  if (newScore < 0) {
    newScore = activePlayer.score; 
  }

  // Aktualizuj stan gracza
  gameState.players[activePlayerIndex].score = newScore;
  gameState.currentThrow = points;

  // Sprawdź wygraną (uproszczone - reset gry)
  if (newScore === 0) {
    console.log(`🏆 ${activePlayer.name} WYGRYWA! Reset gry...`);
    gameState.players.forEach(p => p.score = 501);
    gameState.round = 1;
  } else {
    // Zmiana tury
    gameState.players[activePlayerIndex].isActive = false;
    const nextPlayerIndex = (activePlayerIndex + 1) % gameState.players.length;
    gameState.players[nextPlayerIndex].isActive = true;
    
    // Zwiększ rundę jeśli wracamy do pierwszego gracza
    if (nextPlayerIndex === 0) {
      gameState.round++;
    }
  }

  // Wyślij update do wszystkich podłączonych klientów
  io.emit("game_update", gameState);
}

io.on("connection", (socket) => {
  console.log(`Klient połączony: ${socket.id}`);
  
  // Wyślij stan natychmiast po połączeniu
  socket.emit("game_update", gameState);

  socket.on("disconnect", () => {
    console.log(`Klient rozłączony: ${socket.id}`);
  });
});

// Uruchom symulację - rzut co 2 sekundy
setInterval(simulateGameStep, 2000);
