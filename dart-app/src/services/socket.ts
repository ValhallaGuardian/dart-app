// dart-app/src/services/socket.ts
import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "../types";

// W trybie DEV adresu z .env, w PROD (na RPi) undefined = auto-detect
const isDev = import.meta.env.DEV;
const URL = isDev ? (import.meta.env.VITE_API_URL || "http://localhost:3000") : undefined;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('token') || '',
  },
  transports: ['websocket', 'polling'], 
});

export function connectSocket(token: string) {
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket() {
  socket.disconnect();
}
