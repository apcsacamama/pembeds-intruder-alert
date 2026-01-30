# Backend Setup & Usage

## Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Server

### Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

### Development mode (auto-restart on changes):
```bash
npm run dev
```

## API Endpoints

### GET `/api/status`
Returns current system status including distance, incident count, and device status.

**Response:**
```json
{
  "currentDistance": 45,
  "incidentCount": 12,
  "deviceStatus": "Online",
  "systemActive": true
}
```

### GET `/api/logs?limit=50`
Returns historical detection logs (default: 50 entries).

**Response:**
```json
[
  {
    "timestamp": "2026-01-30 14:30:05",
    "distance": 15,
    "status": "INTRUDER"
  }
]
```

### POST `/api/sensor-data`
Submit new sensor readings from your HC-SR04 ultrasonic sensor.

**Request Body:**
```json
{
  "distance": 25
}
```

**Response:**
```json
{
  "success": true,
  "logEntry": {
    "timestamp": "2026-01-30 14:30:05",
    "distance": 25,
    "status": "INTRUDER"
  }
}
```

## WebSocket Connection

The server provides real-time updates via WebSocket at `ws://localhost:3000`.

**Message Types:**
- `init` - Initial data sent on connection
- `update` - Real-time sensor updates

**Example:**
```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

## Configuration

- **Port:** Default is 3000 (set via `PORT` environment variable)
- **Intruder Threshold:** 30 cm (modify `INTRUDER_THRESHOLD` in server.js)
- **Simulation:** The server simulates sensor data every 5 seconds for demo purposes. Comment out line 147 in server.js to disable when using real sensor data.

## Integrating with HC-SR04 Sensor

To connect your actual HC-SR04 ultrasonic sensor:

1. Disable the simulation by commenting out this line in server.js:
```javascript
// setInterval(simulateSensorData, 5000);
```

2. From your embedded device (Arduino, Raspberry Pi, etc.), send POST requests:
```python
# Python example
import requests

distance = read_sensor()  # Your sensor reading function
requests.post('http://localhost:3000/api/sensor-data', 
              json={'distance': distance})
```

3. The backend will automatically broadcast updates to all connected clients in real-time.

## Architecture

- **Express:** REST API server
- **WebSocket (ws):** Real-time bidirectional communication
- **CORS:** Enabled for cross-origin requests
- **In-memory storage:** Keeps last 100 detection logs

## Troubleshooting

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
set PORT=3001 && npm start
```

**WebSocket connection failed:**
- Ensure the server is running
- Check firewall settings
- Verify the URL matches your server address
