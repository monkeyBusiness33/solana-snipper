import http, { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const PORT = 5001;
const CLIENT_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

const server: HTTPServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', CLIENT_URL);
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', '*');
});

const io: SocketIOServer = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});


export default io;