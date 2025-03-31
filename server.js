const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

const rooms = {};

wss.on('connection', socket => {
  socket.on('message', message => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON:', message);
      return;
    }

    const { type, room, payload } = data;

    switch (type) {
      case 'join':
        if (!rooms[room]) rooms[room] = [];
        rooms[room].push(socket);
        socket.room = room;
        break;

      case 'signal':
        if (rooms[room]) {
          rooms[room].forEach(peer => {
            if (peer !== socket && peer.readyState === WebSocket.OPEN) {
              peer.send(JSON.stringify({ type: 'signal', payload }));
            }
          });
        }
        break;
    }
  });

  socket.on('close', () => {
    const room = socket.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter(peer => peer !== socket);
      if (rooms[room].length === 0) {
        delete rooms[room];
      }
    }
  });
});

console.log('Signaling server started on ws://localhost:3000');
