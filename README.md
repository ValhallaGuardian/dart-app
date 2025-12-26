# Serwer Smart Dartboard

Serwer produkcyjny dla aplikacji Smart Dartboard z integracją Arduino.

## Funkcjonalności

- **Zarządzanie grą w czasie rzeczywistym** poprzez Socket.IO
- **Integracja z tarczą Arduino** przez port szeregowy
- **Uwierzytelnianie JWT** dla bezpiecznych sesji użytkowników
- **Wiele trybów gry**: 501, 301, Cricket, Killer
- **Śledzenie statystyk graczy**
- **System Lobby** z zarządzaniem przez hosta

## Stos Technologiczny

- **Runtime**: Node.js
- **Framework**: Express 5
- **Real-time**: Socket.IO
- **Uwierzytelnianie**: JWT + bcryptjs
- **Hardware**: SerialPort (Arduino)
- **Baza danych**: Przechowywanie w plikach JSON

## Wymagania

- Node.js 18+
- Tarcza z Arduino (opcjonalnie - serwer działa również bez niej)

## Instalacja

```bash
npm install
```
Konfiguracja
Zmienne środowiskowe (opcjonalne):

Zmienna	Domyślnie	Opis
PORT	3001	Port serwera
JWT_SECRET	smart-dartboard-secret-key-2024	Klucz podpisu JWT
SERIAL_PORT_PATH	/dev/ttyACM0	Port szeregowy Arduino
SERIAL_BAUD_RATE	115200	Prędkość transmisji (Baud rate)
Uruchamianie

Produkcja
code
Bash
node server.js
Serwer będzie dostępny pod adresem:

Aplikacja: http://localhost:3001
API: http://localhost:3001/api
WebSocket: ws://localhost:3001
Z użyciem PM2 (zalecane)
code
Bash
pm2 start server.js --name dartboard
Endpointy API

Uwierzytelnianie (Auth)
Metoda	Endpoint	Opis
POST	/api/auth/register	Rejestracja nowego użytkownika
POST	/api/auth/login	Logowanie użytkownika
GET	/api/auth/me	Pobranie aktualnego użytkownika
Profil
Metoda	Endpoint	Opis
PUT	/api/profile/avatar	Aktualizacja awatara
GET	/api/profile/avatars	Pobranie dostępnych awatarów
PUT	/api/profile/username	Zmiana nazwy użytkownika
PUT	/api/profile/password	Zmiana hasła
Lobby
Metoda	Endpoint	Opis
GET	/api/lobbies	Lista wszystkich lobby
POST	/api/lobbies	Utworzenie lobby
GET	/api/lobbies/:id	Szczegóły lobby
POST	/api/lobbies/:id/join	Dołączenie do lobby
POST	/api/lobbies/:id/leave	Opuszczenie lobby
PUT	/api/lobbies/:id/mode	Ustawienie trybu gry
POST	/api/lobbies/:id/start	Rozpoczęcie gry
POST	/api/lobbies/:id/end	Zakończenie gry
POST	/api/lobbies/:id/abort	Przerwanie gry
POST	/api/lobbies/:id/undo-throw	Cofnięcie ostatniego rzutu
Gra
Metoda	Endpoint	Opis
GET	/api/game/can-start	Sprawdzenie dostępności tarczy
GET	/api/game/dartboard/status	Pobranie statusu połączenia z tarczą
Zdarzenia Socket.IO

Klient → Serwer
Zdarzenie	Payload	Opis
join_lobby	lobbyId: string	Dołączenie do pokoju lobby
leave_lobby	lobbyId: string	Opuszczenie pokoju lobby
Serwer → Klient
Zdarzenie	Payload	Opis
lobby_update	Lobby	Zmiana stanu lobby
game_update	GameState	Zmiana stanu gry (wyniki)
game_started	GameState	Gra rozpoczęta
game_ended	-	Gra zakończona normalnie
game_aborted	{ abortedBy: string }	Gra przerwana
host_changed	{ newHostId, newHostName }	Zmiana hosta
lobby_deleted	-	Lobby zostało usunięte
dartboard_status	{ connected: boolean }	Status połączenia tarczy
Protokół Arduino
Serwer oczekuje wiadomości JSON z Arduino przez port szeregowy:

code
JSON
{
  "event": "hit",
  "sector": 20,
  "multiplier": 3,
  "score": 60
}
Pola
Pole	Typ	Opis
event	string	Typ zdarzenia (zawsze hit)
sector	number	Sektor tarczy (1-20, 25 dla środka)
multiplier	number	1 = pojedyncze, 2 = podwójne, 3 = potrójne
score	number	Obliczony wynik (sektor × mnożnik)
Baza Danych
Dane są przechowywane w pliku database.json:

code
JSON
{
  "users": [],
  "lobbies": [],
  "activeGame": null
}
Baza danych jest tworzona automatycznie przy pierwszym uruchomieniu.

Struktura Projektu
code
Code
backend-emulator/
├── server.js        # Główny plik serwera
├── database.json    # Magazyn danych
├── package.json     # Zależności
├── public/          # Zbudowany Frontend (z dart-app)
└── README.md        # Ten plik
Development

Symulacja Rzutu (bez Arduino)
code
Bash
curl -X POST http://localhost:3001/api/lobbies/{id}/simulate-throw \
  -H "Authorization: Bearer {token}"
Licencja
MIT