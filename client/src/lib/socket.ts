import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;
let pendingListeners: { event: string; handler: (...args: any[]) => void }[] = [];

export function connectSocket(token: string): Socket {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  pendingListeners.forEach(({ event, handler }) => socket!.on(event, handler));

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  pendingListeners = [];
}

// Registers a listener immediately if the socket is already connected, otherwise
// queues it so it's attached as soon as connectSocket() creates the socket.
// Use this for listeners that must never miss an early event (e.g. incoming calls).
export function onSocket(event: string, handler: (...args: any[]) => void) {
  if (socket) socket.on(event, handler);
  pendingListeners.push({ event, handler });
}

export function offSocket(event: string, handler: (...args: any[]) => void) {
  socket?.off(event, handler);
  pendingListeners = pendingListeners.filter((p) => !(p.event === event && p.handler === handler));
}
