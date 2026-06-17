import { io } from 'socket.io-client';

const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const socket = io(socketUrl, {
  autoConnect: true,
  transports: ['websocket'],
});
