import { Server } from 'socket.io';
import cache from './cache.js';

/**
 * WebSocket Manager
 * Handles real-time updates to connected clients
 */

let io = null;

export function initializeWebSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN === '*' ? '*' :
                process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) :
                    'http://localhost:3000',
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        // Allow clients to subscribe to specific sensor updates
        socket.on('subscribe:sensor', (sensorId) => {
            socket.join(`sensor:${sensorId}`);
        });

        socket.on('unsubscribe:sensor', (sensorId) => {
            socket.leave(`sensor:${sensorId}`);
        });
    });

    return io;
}

// Broadcast dashboard updates to all connected clients
export function broadcastDashboardUpdate(data) {
    if (io) {
        io.emit('dashboard:update', data);
    }
}

// Broadcast sensor update to subscribed clients
export function broadcastSensorUpdate(sensorId, data) {
    if (io) {
        io.to(`sensor:${sensorId}`).emit('sensor:update', data);
    }
}

// Broadcast new reading to all clients
export function broadcastNewReading(reading) {
    if (io) {
        io.emit('reading:new', reading);
    }
}

// Broadcast ticket update
export function broadcastTicketUpdate(ticket) {
    if (io) {
        io.emit('ticket:update', ticket);
    }
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}
