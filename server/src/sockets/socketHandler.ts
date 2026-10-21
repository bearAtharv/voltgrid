import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export const initSocket = (io: Server) => {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('join_station', (stationId: string) => {
      socket.join(`station_${stationId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined room station_${stationId}`);
    });

    socket.on('leave_station', (stationId: string) => {
      socket.leave(`station_${stationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};

export const getSocketIO = (): Server | null => {
  return ioInstance;
};

export const broadcastBayStatusUpdate = (stationId: string, bayId: string, status: string) => {
  if (ioInstance) {
    ioInstance.emit('bay_status_changed', { stationId, bayId, status });
    ioInstance.to(`station_${stationId}`).emit('bay_status_changed', { stationId, bayId, status });
  }
};

export const broadcastTicketUpdate = (ticket: any) => {
  if (ioInstance) {
    ioInstance.emit('ticket_updated', ticket);
  }
};
