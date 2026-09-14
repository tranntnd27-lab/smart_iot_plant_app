const net = require('net');
const http = require('http');
const os = require('os');
const aedes = require('aedes')();
const { WebSocketServer } = require('ws');

const TCP_PORT = 1883;
const WS_PORT = 9001;

// 1. Tự động tìm IP nội bộ (Local IPv4) của máy tính trong mạng Wi-Fi
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();

// 2. Tạo TCP Server (Port 1883) cho ESP32 kết nối
const tcpServer = net.createServer(aedes.handle);
tcpServer.listen(TCP_PORT, () => {
  console.log(`[TCP Server] ESP32 MQTT Broker listening on port ${TCP_PORT}`);
});

// 3. Tạo WebSocket Server (Port 9001) cho App Android & Web kết nối
const httpServer = http.createServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  const stream = require('ws').createWebSocketStream(ws);
  aedes.handle(stream);
});

httpServer.listen(WS_PORT, () => {
  console.log(`[WS Server] Mobile App MQTT WebSocket listening on port ${WS_PORT}`);
  console.log(`\n=============================================================`);
  console.log(`🚀 LOCAL MQTT BROKER SERVER IS RUNNING SUCCESSFUL!`);
  console.log(`-------------------------------------------------------------`);
  console.log(`  📍 Local IP Address : ${localIP}`);
  console.log(`  🔌 ESP32 TCP Port   : ${TCP_PORT} (Môi trường nạp code ESP32)`);
  console.log(`  🌐 App WS URL       : ws://${localIP}:${WS_PORT}`);
  console.log(`=============================================================\n`);
});

// 4. In log khi có Client kết nối / ngắt kết nối
aedes.on('client', (client) => {
  console.log(`[MQTT Client Connected]: ${client ? client.id : 'Unknown'}`);
});

aedes.on('clientDisconnect', (client) => {
  console.log(`[MQTT Client Disconnected]: ${client ? client.id : 'Unknown'}`);
});

aedes.on('publish', (packet, client) => {
  if (client && packet.topic && !packet.topic.startsWith('$SYS/')) {
    console.log(`[MQTT Topic: ${packet.topic}] from ${client.id}: ${packet.payload.toString()}`);
  }
});
