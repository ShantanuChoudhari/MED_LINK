// backend/src/socket.js
// Full WebRTC signaling + real-time chat relay via Socket.io
const socketIO = require('socket.io');

let io;

// Track rooms: roomId → Map<socketId, { name, role }>
const rooms = new Map();

exports.init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', '*'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`⚡ [Socket] Connected: ${socket.id}`);

    // ── Join a consultation room ──────────────────────────────────────────────
    socket.on('join-room', ({ roomId, userName, role }) => {
      socket.join(roomId);
      socket.data.roomId   = roomId;
      socket.data.userName = userName;
      socket.data.role     = role;

      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      rooms.get(roomId).set(socket.id, { name: userName, role });

      // Tell the NEW joiner about everyone already in the room
      const existing = [];
      rooms.get(roomId).forEach((info, sid) => {
        if (sid !== socket.id) existing.push({ socketId: sid, ...info });
      });
      socket.emit('room-members', existing);

      // Tell everyone ELSE that a new user joined
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        name: userName,
        role,
      });

      console.log(`📞 [Room ${roomId}] ${userName} (${role}) joined | total: ${rooms.get(roomId).size}`);
    });

    // ── WebRTC: Offer ────────────────────────────────────────────────────────
    // Initiator sends offer to a specific peer
    socket.on('webrtc-offer', ({ to, offer }) => {
      io.to(to).emit('webrtc-offer', {
        offer,
        from:      socket.id,
        fromName:  socket.data.userName,
        fromRole:  socket.data.role,
      });
    });

    // ── WebRTC: Answer ───────────────────────────────────────────────────────
    socket.on('webrtc-answer', ({ to, answer }) => {
      io.to(to).emit('webrtc-answer', { answer, from: socket.id });
    });

    // ── WebRTC: ICE Candidate ────────────────────────────────────────────────
    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    // ── Chat: Send message ───────────────────────────────────────────────────
    socket.on('send-message', ({ roomId, message, sender, role, time }) => {
      // Relay to everyone ELSE in the room
      socket.to(roomId).emit('receive-message', {
        message, sender, role, time,
        socketId: socket.id,
      });
    });

    // ── Toggle: Notify peers about A/V state change ──────────────────────────
    socket.on('media-toggle', ({ roomId, type, enabled }) => {
      socket.to(roomId).emit('peer-media-toggle', {
        socketId: socket.id,
        name: socket.data.userName,
        type,
        enabled,
      });
    });

    // ── Leave room ───────────────────────────────────────────────────────────
    socket.on('leave-room', ({ roomId }) => {
      cleanupSocket(socket, roomId);
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (roomId) cleanupSocket(socket, roomId);
      console.log(`❌ [Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

function cleanupSocket(socket, roomId) {
  socket.to(roomId).emit('user-left', {
    socketId: socket.id,
    name: socket.data.userName,
  });
  rooms.get(roomId)?.delete(socket.id);
  if (rooms.get(roomId)?.size === 0) rooms.delete(roomId);
  socket.leave(roomId);
}

exports.getIO = () => io;