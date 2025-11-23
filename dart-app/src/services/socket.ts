import { io } from "socket.io-client";

// Adres IP Raspberry Pi (na razie localhost do testów, potem zmienisz na np. "http://192.168.1.15:3000")
const URL = "http://localhost:3000";

export const socket = io(URL, {
  autoConnect: false // Nie łącz się od razu przy starcie, poczekaj na inicjalizację
});