import { WebSocketServer, WebSocket } from 'ws';

const server = new WebSocketServer({ port: 8080 });
let clients = [];

server.on('connection', socket => {
  console.log('New client connected');
  const clientId = clients.length;
  clients.push({ id: clientId, socket });

  // 监听客户端发送的消息
  socket.on('message', message => {
    const data = JSON.parse(message);
    console.log(`Received message from client ${clientId}:`, data);
    // 广播消息给其他客户端
    clients.forEach(client => {
      if (client.id !== clientId && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify({ id: clientId, data }));
      }
    });
  });

  // 处理客户端断开连接
  socket.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    clients = clients.filter(client => client.socket !== socket);
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
