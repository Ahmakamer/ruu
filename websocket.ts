import { Server } from 'http';
import { Server as WebSocketServer } from 'socket.io';
import logger from './logger';

export function setupWebSocket(server: Server) {
  const io = new WebSocketServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://ahmuko.com'
        : 'http://localhost:5173',
      credentials: true
    }
  });

  // Store user socket mappings
  const userSockets = new Map<number, string>();

  io.on('connection', (socket) => {
    logger.info('New WebSocket connection');

    // Authenticate user
    socket.on('authenticate', (userId: number) => {
      userSockets.set(userId, socket.id);
      logger.info(`User ${userId} authenticated on socket ${socket.id}`);
    });

    // Handle private messages
    socket.on('private_message', ({ recipientId, message }) => {
      const recipientSocket = userSockets.get(recipientId);
      if (recipientSocket) {
        io.to(recipientSocket).emit('new_message', message);
      }
    });

    // Handle listing updates
    socket.on('listing_update', (listing) => {
      socket.broadcast.emit('listing_changed', listing);
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      // Remove user from mapping
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
      logger.info('Client disconnected');
    });
  });

  return io;
}
