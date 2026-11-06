// Lightweight WebSocket hub for instant push events (online chess rematches).
// Clients register under a stable numeric player_id; routes push events straight
// to a given player's sockets. If no HTTP server has attached, push is a no-op
// and clients fall back to polling. self-contained to the chess game module.
const { WebSocketServer, WebSocket } = require('ws');

// player_id (Number) -> Set<WebSocket>
const playerSockets = new Map();

// Attach the WebSocket server to an existing HTTP server.
function attach(server) {
  const wss = new WebSocketServer({ server, path: '/ws/chess' });

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.playerId = null;

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch (e) { return; }
      if (msg && msg.type === 'hello' && msg.player_id != null) {
        const pid = Number(msg.player_id);
        ws.playerId = pid;
        if (!playerSockets.has(pid)) playerSockets.set(pid, new Set());
        playerSockets.get(pid).add(ws);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'hello_ok', player_id: pid }));
        }
      }
    });

    ws.on('close', () => {
      if (ws.playerId != null) {
        const set = playerSockets.get(ws.playerId);
        if (set) {
          set.delete(ws);
          if (set.size === 0) playerSockets.delete(ws.playerId);
        }
      }
    });

    ws.on('error', () => {});
  });

  // Ping/pong heartbeat to reap dead connections.
  const hb = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) { ws.terminate(); continue; }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);
  wss.on('close', () => clearInterval(hb));
}

// Push a JSON payload to every open socket registered under playerId.
function notifyPlayer(playerId, payload) {
  if (playerId == null || playerId === '') return;
  const set = playerSockets.get(Number(playerId));
  if (!set) return;
  const str = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) ws.send(str);
  }
}

module.exports = { attach, notifyPlayer };