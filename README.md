Oto kompletny, profesjonalny plik `README.md` sformatowany w Markdown. Został napisany tak, aby każdy członek zespołu (oraz wykładowca/osoba oceniająca) od razu wiedział, jak uruchomić projekt i jak on działa.

Możesz stworzyć plik `README.md` w **głównym folderze projektu** (`valhallaguardian-dart-app/`) i wkleić tam poniższą zawartość.

***

```markdown
# 🎯 Smart Dartboard - System

Kompletny system oprogramowania dla inteligentnej tarczy do rzutek. Projekt składa się z nowoczesnego frontendu (PWA) oraz emulatora backendu, który symuluje logikę gry i komunikację z hardwarem.

## 🏗 Architektura

System działa w architekturze **Klient-Serwer** z wykorzystaniem komunikacji w czasie rzeczywistym (Real-time).

1.  **Frontend (`/dart-app`):** Aplikacja React wyświetlająca interfejs gracza. Działa na telefonach, tabletach i komputerach. Nie posiada logiki biznesowej gry – służy tylko do prezentacji.
2.  **Backend Emulator (`/backend-emulator`):** Serwer Node.js, który pełni rolę "Mózgu". Przechowuje stan gry, zarządza użytkownikami, liczy punkty i pilnuje zasad (np. Bust, Double Out). Docelowo zastępuje fizyczne Raspberry Pi.

---

## 🚀 Technologie (Tech Stack)

### Frontend (Klient)
*   **Framework:** React 19 (via Vite)
*   **Język:** TypeScript (Strict Mode)
*   **Style:** Tailwind CSS v3.4 (Mobile First Design)
*   **Routing:** React Router v7
*   **Komunikacja:** Socket.io-client (WebSockets) + Fetch API (REST)
*   **Typ aplikacji:** PWA (Progressive Web App)

### Backend (Serwer/Emulator)
*   **Runtime:** Node.js
*   **API:** Express.js
*   **Real-time:** Socket.io
*   **Baza danych:** JSON File Database (Persistence)
*   **Auth:** JWT (JSON Web Token) + Bcrypt (hashowanie haseł)

---

## ⚙️ Instrukcja Uruchomienia

Projekt wymaga uruchomienia dwóch niezależnych procesów w osobnych terminalach.

### Krok 1: Uruchomienie Backendu (Serwera)
To musi działać w tle, aby frontend miał się z czym połączyć.

```bash
cd backend-emulator
npm install
npm start
```
*Serwer wystartuje na porcie `3000`.*

### Krok 2: Uruchomienie Frontendu (Aplikacji)
Otwórz **drugi terminal** i wpisz:

```bash
cd dart-app
npm install
npm run dev
```
*Aplikacja wystartuje zazwyczaj na porcie `5173`.*

---

## 📱 Testowanie na Telefonie (W tej samej sieci Wi-Fi)

Aby otworzyć aplikację na telefonie, musisz skonfigurować adres IP.

1.  Sprawdź IP swojego komputera w sieci lokalnej (np. `192.168.1.X`).
2.  W folderze `dart-app` utwórz plik `.env.local` i dodaj:
    ```env
    VITE_API_URL=http://TWOJE_IP:3000
    ```
3.  Uruchom frontend z flagą `--host`:
    ```bash
    npm run dev -- --host
    ```
4.  Na telefonie wpisz w przeglądarce: `http://TWOJE_IP:5173`.

---

## 🧩 Struktura Projektu

### `/dart-app` (Frontend)
*   **`src/components`** - Widoki aplikacji (Login, Lobby, GameScreen).
*   **`src/services`** - Warstwa komunikacji:
    *   `api.ts` - REST API (Logowanie, Tworzenie gry).
    *   `socket.ts` - WebSocket (Obsługa zdarzeń na żywo).
*   **`src/context`** - `AuthContext` zarządzający sesją użytkownika.
*   **`src/types`** - Współdzielone definicje typów TypeScript (`GameState`, `Player`, `Lobby`).

### `/backend-emulator` (Backend)
*   **`server.js`** - Główna logika:
    *   Silnik gry (liczenie punktów, zmiana tur).
    *   Obsługa WebSocketów (pokoje, eventy).
    *   Symulator rzutów (`simulateThrow`).
*   **`database.json`** - Plikowa baza danych (Użytkownicy, Historie gier).

---

## 🎮 Funkcjonalności (MVP)

1.  **System Kont:** Rejestracja, Logowanie, Awatary, Statystyki (zapisywane w `database.json`).
2.  **Lobby:** Tworzenie pokoi, dołączanie do gier, lista aktywnych stołów.
3.  **Logika Gry (501/301):**
    *   Pełna obsługa zasad (odliczanie w dół).
    *   **Double Out:** Wymóg zakończenia podwójnym polem.
    *   **Bust (Fura):** Cofanie punktów po przekroczeniu zera.
    *   **Checkout Hints:** Podpowiedzi jak zakończyć grę (np. "Rzuć T20, D20").
4.  **Emulator Sprzętu:**
    *   Możliwość testowania bez fizycznej tarczy (przycisk "Symuluj rzut" lub automatyczna symulacja w backendzie).
5.  **Obsługa Błędów:** Reconnection, walidacja stanów, obsługa przerwania gry.

---

## 🔌 Integracja z Hardware (Dla zespołu Backendowego)

Obecnie plik `server.js` używa funkcji `simulateThrow()` do generowania losowych trafień.
Aby podłączyć fizyczną tarczę (Arduino/Raspberry Pi):

1.  Zainstaluj bibliotekę `serialport` w `backend-emulator`.
2.  W pliku `server.js` podmień wywołanie `simulateThrow` na nasłuchiwanie portu USB.
3.  Reszta logiki (Lobby, Frontend, Punkty) pozostaje bez zmian!

---

## 📜 Autorzy
*   **Frontend & Architecture:** Adam
*   **Backend & Hardware:** Zespół Backendowy
```
