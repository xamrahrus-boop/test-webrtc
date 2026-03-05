const express = require('express');
const https = require('https');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();

const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS !== 'false';

// Setup server with HTTPS or HTTP
let server;

if (USE_HTTPS) {
  const certDir = path.join(__dirname, 'certs');
  const keyPath = path.join(certDir, 'private-key.pem');
  const certPath = path.join(certDir, 'certificate.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    try {
      const privateKey = fs.readFileSync(keyPath, 'utf8');
      const certificate = fs.readFileSync(certPath, 'utf8');
      const credentials = { key: privateKey, cert: certificate };
      server = https.createServer(credentials, app);
      console.log('Using HTTPS with self-signed certificate');
    } catch (error) {
      console.warn('Failed to load certificates:', error.message);
      console.log('Falling back to HTTP');
      server = http.createServer(app);
    }
  } else {
    console.log('⚠️  HTTPS certificates not found at:');
    console.log(`   - ${keyPath}`);
    console.log(`   - ${certPath}`);
    console.log('');
    console.log('To generate certificates, run:');
    console.log('   node generate-cert.js');
    console.log('');
    console.log('Falling back to HTTP for now...');
    server = http.createServer(app);
  }
} else {
  console.log('Using HTTP (development mode)');
  server = http.createServer(app);
}

const wss = new WebSocket.Server({ server });

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Store active connections
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data.type);

      switch (data.type) {
        case 'register':
          handleRegister(ws, data);
          break;
        case 'offer':
          handleOffer(ws, data);
          break;
        case 'answer':
          handleAnswer(ws, data);
          break;
        case 'ice-candidate':
          handleIceCandidate(ws, data);
          break;
        case 'get-peers':
          handleGetPeers(ws, data);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleRegister(ws, data) {
  const peerId = data.peerId;
  clients.set(peerId, ws);
  ws.peerId = peerId;

  // Notify all clients about new peer
  broadcastMessage({
    type: 'peer-connected',
    peerId: peerId
  });

  console.log(`Peer registered: ${peerId}. Total peers: ${clients.size}`);
}

function handleOffer(ws, data) {
  const targetPeerId = data.targetPeerId;
  const targetClient = clients.get(targetPeerId);

  if (targetClient && targetClient.readyState === WebSocket.OPEN) {
    targetClient.send(JSON.stringify({
      type: 'offer',
      peerId: ws.peerId,
      offer: data.offer
    }));
  }
}

function handleAnswer(ws, data) {
  const targetPeerId = data.targetPeerId;
  const targetClient = clients.get(targetPeerId);

  if (targetClient && targetClient.readyState === WebSocket.OPEN) {
    targetClient.send(JSON.stringify({
      type: 'answer',
      peerId: ws.peerId,
      answer: data.answer
    }));
  }
}

function handleIceCandidate(ws, data) {
  const targetPeerId = data.targetPeerId;
  const targetClient = clients.get(targetPeerId);

  if (targetClient && targetClient.readyState === WebSocket.OPEN) {
    targetClient.send(JSON.stringify({
      type: 'ice-candidate',
      peerId: ws.peerId,
      candidate: data.candidate
    }));
  }
}

function handleGetPeers(ws, data) {
  const peersList = Array.from(clients.keys()).filter(peerId => peerId !== ws.peerId);
  ws.send(JSON.stringify({
    type: 'peers-list',
    peers: peersList
  }));
}

function handleDisconnect(ws) {
  if (ws.peerId) {
    clients.delete(ws.peerId);
    broadcastMessage({
      type: 'peer-disconnected',
      peerId: ws.peerId
    });
  }
}

function broadcastMessage(message) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

server.listen(PORT, () => {
  const protocol = USE_HTTPS ? 'https' : 'http';
  const wsProtocol = USE_HTTPS ? 'wss' : 'ws';
  console.log(`\n✓ Signaling server running on ${protocol}://localhost:${PORT}`);
  console.log(`✓ WebSocket server ready on ${wsProtocol}://localhost:${PORT}`);
  console.log(`✓ Clients: ${clients.size}`);
  console.log('');
});
