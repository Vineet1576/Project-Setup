const jwt = require('jsonwebtoken');

const onlineUsers = new Map();
const userStatuses = new Map();
const room = (prefix, id) => `${prefix}:${id}`;

const authenticate = (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    const { id, _id, roleName } = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = String(id || _id);
    socket.userRole = roleName || '';
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
};

const withCid = (socket, event, target) =>
  socket.on(event, ({ conversationId }) => {
    if (!conversationId) return;
    target(socket, conversationId);
  });

let _io;

const registerSocket = (io) => {
  _io = io;
  io.use(authenticate);

  io.on('connection', (socket) => {
    const { userId } = socket;

    onlineUsers.set(userId, socket.id);
    userStatuses.set(userId, 'online');
    socket.join(room('user', userId));
    socket.broadcast.emit('user_online', { userId });
    socket.broadcast.emit('users_online', [...onlineUsers.keys()]);

    // --- Presence / Status ---

    socket.on('user_status_change', ({ status }) => {
      const valid = ['online', 'away', 'busy', 'offline'];
      if (!valid.includes(status)) return;
      userStatuses.set(userId, status);
      socket.broadcast.emit('user_status_change', { userId, status });
    });

    // --- Chat: Room management ---

    socket.on('chat_join', (id) => id && socket.join(room('conversation', id)));
    socket.on('chat_leave', (id) => id && socket.leave(room('conversation', id)));

    // --- Chat: Typing indicators ---

    withCid(socket, 'chat_typing', (s, cid) =>
      s.to(room('conversation', cid)).emit('chat_typing', { userId, conversationId: cid }),
    );
    withCid(socket, 'chat_stop_typing', (s, cid) =>
      s.to(room('conversation', cid)).emit('chat_stop_typing', { userId, conversationId: cid }),
    );

    // --- Chat: Messaging ---

    socket.on('chat_send_message', ({ conversationId, message, attachments }) => {
      if (!conversationId || !message) return;
      io.to(room('conversation', conversationId)).emit('chat_new_message', {
        userId,
        conversationId,
        message,
        attachments,
        timestamp: new Date(),
      });
    });

    socket.on('chat_message_delivered', ({ conversationId, messageId }) => {
      if (!conversationId || !messageId) return;
      socket.to(room('conversation', conversationId)).emit('chat_message_delivered', {
        userId,
        conversationId,
        messageId,
      });
    });

    socket.on('chat_message_read', ({ conversationId, messageId }) => {
      if (!conversationId || !messageId) return;
      io.to(room('conversation', conversationId)).emit('chat_message_read', {
        userId,
        conversationId,
        messageId,
      });
    });

    withCid(socket, 'chat_mark_read', (s, cid) =>
      io.to(room('conversation', cid)).emit('chat_mark_read', { userId, conversationId: cid }),
    );

    socket.on('chat_edit_message', ({ conversationId, messageId, message }) => {
      if (!conversationId || !messageId || !message) return;
      io.to(room('conversation', conversationId)).emit('chat_edit_message', {
        userId,
        conversationId,
        messageId,
        message,
        editedAt: new Date(),
      });
    });

    socket.on('chat_delete_message', ({ conversationId, messageId }) => {
      if (!conversationId || !messageId) return;
      io.to(room('conversation', conversationId)).emit('chat_delete_message', {
        userId,
        conversationId,
        messageId,
      });
    });

    // --- Notifications ---

    socket.on('send_notification', ({ targetUserId, event, data }) => {
      if (!targetUserId || !event) return;
      io.to(room('user', targetUserId)).emit(event, data);
    });

    socket.on('notification_read', ({ notificationId }) => {
      if (!notificationId) return;
      io.to(room('user', userId)).emit('notification_read', { userId, notificationId });
    });

    socket.on('notification_dismiss', ({ notificationId }) => {
      if (!notificationId) return;
      io.to(room('user', userId)).emit('notification_dismiss', { userId, notificationId });
    });

    // --- Disconnect ---

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      userStatuses.set(userId, 'offline');
      socket.broadcast.emit('user_offline', { userId });
      socket.broadcast.emit('users_online', [...onlineUsers.keys()]);
    });
  });
};

const emitToUser = (userId, event, data) => {
  if (!_io) return;
  _io.to(room('user', userId)).emit(event, data);
};

module.exports = { registerSocket, emitToUser };
