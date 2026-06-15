import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const port = 3006;

app.use(cors());
app.use(express.json());

// Mock system stats generator
function generateMetrics() {
  const baseSubscribers = 5124930;
  const time = Date.now();
  
  // Create beautiful sinusoidal waving metrics with small random noise
  const subscribers = baseSubscribers + Math.floor(Math.sin(time / 15000) * 1200) + Math.floor(Math.random() * 50);
  const tps = Math.floor(14250 + Math.sin(time / 6000) * 1500 + Math.random() * 200);
  const cpu = Math.floor(45 + Math.sin(time / 20000) * 15 + Math.random() * 5);
  const memory = parseFloat((4.8 + Math.sin(time / 30000) * 0.4 + Math.random() * 0.1).toFixed(2));
  const activeConnections = Math.floor(5023900 + Math.sin(time / 10000) * 800 + Math.random() * 100);
  const latency = Math.floor(35 + Math.sin(time / 5000) * 10 + Math.random() * 5);
  
  const regions = [
    { name: 'US-East (N. Virginia)', load: Math.floor(42 + Math.sin(time / 10000) * 8 + Math.random() * 5), active: Math.floor(1804500 + Math.random() * 5000) },
    { name: 'EU-West (Frankfurt)', load: Math.floor(36 + Math.sin(time / 12000) * 6 + Math.random() * 4), active: Math.floor(1503200 + Math.random() * 4000) },
    { name: 'AP-East (Hong Kong)', load: Math.floor(62 + Math.sin(time / 8000) * 12 + Math.random() * 6), active: Math.floor(1210800 + Math.random() * 3000) },
    { name: 'SA-East (São Paulo)', load: Math.floor(21 + Math.sin(time / 15000) * 4 + Math.random() * 3), active: Math.floor(506400 + Math.random() * 1500) }
  ];

  return {
    timestamp: time,
    subscribers,
    tps,
    cpu,
    memory,
    activeConnections,
    latency,
    regions
  };
}

// 1. HTTP Polling Endpoint
app.get('/api/polling', (req, res) => {
  res.json(generateMetrics());
});

// 2. Server-Sent Events Endpoint
let sseClients = [];
app.get('/api/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection ACK
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  const client = { id: Date.now(), res };
  sseClients.push(client);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== client.id);
  });
});

// Default SSE Broadcast at 200ms
const sseInterval = setInterval(() => {
  if (sseClients.length === 0) return;
  const data = JSON.stringify({ type: 'update', data: generateMetrics() });
  sseClients.forEach(client => {
    client.res.write(`data: ${data}\n\n`);
  });
}, 200);

// Setup Server
const server = createServer(app);

// 3. WebSocket Setup
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url === '/api/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  console.log('WS Client connected');
  ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));

  let intervalMs = 200;
  let wsInterval;

  const startStream = () => {
    if (wsInterval) clearInterval(wsInterval);
    wsInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'update', data: generateMetrics() }));
      }
    }, intervalMs);
  };

  startStream();

  ws.on('message', (message) => {
    try {
      const command = JSON.parse(message);
      if (command.type === 'config' && typeof command.interval === 'number') {
        // Adjust the client's preferred refresh rate
        intervalMs = Math.max(50, Math.min(command.interval, 5000));
        startStream();
        ws.send(JSON.stringify({ type: 'config_ack', interval: intervalMs }));
      }
      if (command.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (e) {
      console.error('Failed to parse WS message:', e);
    }
  });

  ws.on('close', () => {
    console.log('WS Client disconnected');
    if (wsInterval) clearInterval(wsInterval);
  });
});

server.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
