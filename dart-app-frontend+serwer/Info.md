# Smart Dartboard - Stos technologiczny

Kompletny przegląd technologiczny projektu Smart Dartboard.

---

## Backend

### Runtime i Framework

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **Node.js** | 18+ | Środowisko uruchomieniowe JavaScript |
| **Express** | 5.2.1 | Framework webowy |

### Komunikacja w czasie rzeczywistym

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **Socket.IO** | 4.8.1 | Abstrakcja WebSocket dla zdarzeń w czasie rzeczywistym |

### Uwierzytelnianie i bezpieczeństwo

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **jsonwebtoken** | 9.0.3 | Generowanie i weryfikacja tokenów JWT |
| **bcryptjs** | 3.0.3 | Haszowanie haseł |
| **cors** | 2.8.5 | Współdzielenie zasobów między źródłami |

### Integracja sprzętu

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **serialport** | 13.0.0 | Komunikacja przez port szeregowy |
| **@serialport/parser-readline** | 12.0.0 | Analizowanie danych szeregowych linia po linii |

### Narzędzia

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **uuid** | 13.0.0 | Generowanie unikalnych identyfikatorów |
| **lowdb** | 5.1.0 | Baza danych JSON (dostępna) |

### Magazyn danych

- **Plik JSON** - Prosta baza danych oparta na plikach (`database.json`)

---

## Frontend

### Rdzeń

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **React** | 19.2.0 | Biblioteka UI |
| **React DOM** | 19.2.0 | Renderer React DOM |
| **TypeScript** | 5.9.3 | Bezpieczny JavaScript z typami |

### Narzędzia kompilacji

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **Vite** | 7.2.4 | Narzędzie kompilacji i serwer deweloperski |
| **@vitejs/plugin-react** | 5.1.1 | Plugin React dla Vite |

### Routing

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **React Router DOM** | 7.10.1 | Routing po stronie klienta |

### Stylizacja

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **Tailwind CSS** | 3.4.17 | Framework CSS oparty na narzędziach |
| **PostCSS** | 8.4.35 | Transformacje CSS |
| **Autoprefixer** | 10.4.19 | Automatyzacja prefiksów dostawców |

### Komunikacja w czasie rzeczywistym

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **Socket.IO Client** | 4.8.1 | Klient WebSocket dla zdarzeń w czasie rzeczywistym |

### Jakość kodu

| Technologia | Wersja | Cel |
|------------|---------|---------|
| **ESLint** | 9.39.1 | Linter JavaScript/TypeScript |
| **typescript-eslint** | 8.46.4 | Parser ESLint dla TypeScript |
| **eslint-plugin-react-hooks** | 7.0.1 | Reguły lintowania React Hooks |
| **eslint-plugin-react-refresh** | 0.4.24 | Lintowanie React Refresh |

### Definicje typów

| Pakiet | Cel |
|---------|---------|
| **@types/react** | Definicje typów React |
| **@types/react-dom** | Definicje typów React DOM |
| **@types/node** | Definicje typów Node.js |

---

## Przegląd architektury

```
┌─────────────────────────────────────────────────────────┐
│                      KLIENT                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  React + TypeScript + Tailwind CSS              │   │
│  │  ├── React Router (nawigacja SPA)               │   │
│  │  └── Socket.IO Client (aktualizacje real-time)  │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────┴────────────────────────────────┐
│                      SERWER                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Node.js + Express 5                            │   │
│  │  ├── REST API (uwierzytelnianie, lobby, gra)    │   │
│  │  ├── Socket.IO (aktualizacje gry real-time)     │   │
│  │  ├── JWT (zarządzanie sesją)                    │   │
│  │  └── SerialPort (komunikacja Arduino)           │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ Serial (USB)
┌────────────────────────┴────────────────────────────────┐
│                     SPRZĘT                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Arduino + Elektroniczny Dartboard              │   │
│  │  └── Protokół JSON przez port szeregowy         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Protokoły komunikacji

### REST API
- Format JSON dla żądań/odpowiedzi
- Uwierzytelnianie tokenem Bearer JWT
- Standardowe metody HTTP (GET, POST, PUT, DELETE)

### WebSocket (Socket.IO)
- Komunikacja oparta na zdarzeniach
- Automatyczne ponowne połączenie
- Broadcasting oparty na pokojach (na lobby)

### Serial (Arduino)
- Wiadomości JSON przez USB serial
- Szybkość transmisji 115200
- Wiadomości rozdzielone znakami nowego wiersza

---

## Programowanie vs Produkcja

| Aspekt | Programowanie | Produkcja |
|--------|-------------|------------|
| Frontend | `npm run dev` (Vite HMR) | Pliki statyczne w `public/` |
| Backend | `node server.js` | `pm2 start server.js` |
| Baza danych | `database.json` | `database.json` |
| Arduino | Opcjonalnie | Wymagane |
