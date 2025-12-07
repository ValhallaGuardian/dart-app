import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "../types";

// URL z .env lub fallback do localhost
const URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Typowany socket
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('token') || '',
  },
});

// Funkcja do połączenia z tokenem
export function connectSocket(token: string) {
  socket.auth = { token };
  socket.connect();
}

// Funkcja do rozłączenia
export function disconnectSocket() {
  socket.disconnect();
}
