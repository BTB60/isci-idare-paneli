const socketIO = require('socket.io');

let io = null;

function socketAllowedOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (raw && raw.trim()) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (process.env.NODE_ENV === 'production') {
    return ['https://555insaat.az', 'https://www.555insaat.az'];
  }
  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ];
}

const initializeSocket = (server) => {
  const prod = process.env.NODE_ENV === 'production';
  io = socketIO(server, {
    cors: {
      origin: prod ? socketAllowedOrigins() : true,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user-specific room
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
    });

    // Join admin room
    socket.on('join_admin', () => {
      socket.join('admin_room');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
