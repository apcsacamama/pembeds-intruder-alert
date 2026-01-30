const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// In-memory data storage
let detectionLogs = [
    { timestamp: '2023-10-27 14:30:05', distance: 15, status: 'INTRUDER' },
    { timestamp: '2023-10-27 14:28:10', distance: 12, status: 'INTRUDER' },
    { timestamp: '2023-10-27 10:15:00', distance: 180, status: 'Safe' }
];

let currentDistance = 45;
let incidentCount = 12;
const INTRUDER_THRESHOLD = 30; // cm

// Helper function to get current timestamp
function getCurrentTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

// REST API Endpoints
app.get('/api/status', (req, res) => {
    res.json({
        currentDistance,
        incidentCount,
        deviceStatus: 'Online',
        systemActive: true
    });
});

app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json(detectionLogs.slice(0, limit));
});

app.post('/api/sensor-data', (req, res) => {
    const { distance } = req.body;
    
    if (typeof distance !== 'number' || distance < 0) {
        return res.status(400).json({ error: 'Invalid distance value' });
    }

    currentDistance = distance;
    const status = distance < INTRUDER_THRESHOLD ? 'INTRUDER' : 'Safe';
    
    if (status === 'INTRUDER') {
        incidentCount++;
    }

    const logEntry = {
        timestamp: getCurrentTimestamp(),
        distance,
        status
    };

    detectionLogs.unshift(logEntry);
    
    // Keep only last 100 logs
    if (detectionLogs.length > 100) {
        detectionLogs = detectionLogs.slice(0, 100);
    }

    // Broadcast to all connected WebSocket clients
    broadcast({
        type: 'update',
        data: {
            currentDistance,
            incidentCount,
            latestLog: logEntry
        }
    });

    res.json({ success: true, logEntry });
});

// WebSocket Connection Handler
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    // Send initial data
    ws.send(JSON.stringify({
        type: 'init',
        data: {
            currentDistance,
            incidentCount,
            logs: detectionLogs.slice(0, 20)
        }
    }));

    ws.on('message', (message) => {
        console.log('Received:', message.toString());
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Broadcast to all connected clients
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Simulate sensor readings (for testing)
function simulateSensorData() {
    // Random distance between 5 and 200 cm
    const distance = Math.floor(Math.random() * 195) + 5;
    const status = distance < INTRUDER_THRESHOLD ? 'INTRUDER' : 'Safe';
    
    currentDistance = distance;
    
    if (status === 'INTRUDER') {
        incidentCount++;
    }

    const logEntry = {
        timestamp: getCurrentTimestamp(),
        distance,
        status
    };

    detectionLogs.unshift(logEntry);
    
    if (detectionLogs.length > 100) {
        detectionLogs = detectionLogs.slice(0, 100);
    }

    broadcast({
        type: 'update',
        data: {
            currentDistance,
            incidentCount,
            latestLog: logEntry
        }
    });
}

// Simulate sensor readings every 5 seconds (for demo purposes)
// Comment this out when using real sensor data
setInterval(simulateSensorData, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server ready`);
});
