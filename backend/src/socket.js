const { Server } = require('socket.io');
const User = require('./models/User');
const { verifyAccessToken } = require('./utils/tokens');

let io;

// Admin/staff sockets join the "admins" room and receive live notifications.
exports.initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: (process.env.CLIENT_URLS || 'http://localhost:5173').split(',').map((s) => s.trim()), credentials: true },
  });
  io.use(async (socket, next) => {
    try {
      const payload = verifyAccessToken(socket.handshake.auth?.token);
      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) return next(new Error('unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });
  io.on('connection', (socket) => {
    if (['admin', 'staff'].includes(socket.user.role)) socket.join('admins');
    socket.join(`user:${socket.user._id}`);
  });
  return io;
};

exports.emitToAdmins = (event, payload) => io && io.to('admins').emit(event, payload);
exports.emitToUser = (userId, event, payload) => io && io.to(`user:${userId}`).emit(event, payload);
