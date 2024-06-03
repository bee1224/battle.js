import { WebSocketServer, WebSocket } from 'ws';

const server = new WebSocketServer({ port: 8080 });
let rooms = {};

server.on('connection', socket => {
  console.log('New client connected');

  socket.on('message', message => {
    const data = JSON.parse(message);
    const { action, room, board, score, nextPiece } = data;

    if (action === 'create') {
      if (!rooms[room]) {
        rooms[room] = { players: [] };
      }
      rooms[room].players.push(socket);
      if (rooms[room].players.length > 2) {
        socket.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
      } else {
        socket.send(JSON.stringify({ type: 'joined', room }));
        if (rooms[room].players.length === 2) {
          rooms[room].players.forEach(player => {
            player.send(JSON.stringify({ type: 'start' }));
          });
        }
      }
    } else if (action === 'join') {
      if (rooms[room]) {
        rooms[room].players.push(socket);
        if (rooms[room].players.length > 2) {
          socket.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
        } else {
          socket.send(JSON.stringify({ type: 'joined', room }));
          if (rooms[room].players.length === 2) {
            rooms[room].players.forEach(player => {
              player.send(JSON.stringify({ type: 'start' }));
            });
          }
        }
      } else {
        socket.send(JSON.stringify({ type: 'error', message: 'Room does not exist' }));
      }
    } else if (action === 'update') {
      if (rooms[room]) {
        rooms[room].players.forEach(player => {
          if (player !== socket && player.readyState === WebSocket.OPEN) {
            player.send(JSON.stringify({ type: 'update', board, score, nextPiece }));
          }
        });
      }
    }
  });

  socket.on('close', () => {
    console.log('Client disconnected');
    for (const room in rooms) {
      rooms[room].players = rooms[room].players.filter(player => player !== socket);
      if (rooms[room].players.length === 0) {
        delete rooms[room];
      }
    }
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
