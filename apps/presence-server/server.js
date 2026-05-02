'use strict';

const crypto = require('crypto');
const http = require('http');

const PORT = Number(process.env.PRESENCE_PORT || 3011);
const HOST = process.env.PRESENCE_HOST || '127.0.0.1';
const HEARTBEAT_MS = Number(process.env.PRESENCE_HEARTBEAT_MS || 30000);
const MAX_PAYLOAD_BYTES = 4096;

const clients = new Map();

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function countByCategory(categoryId) {
  let total = 0;
  for (const client of clients.values()) {
    if (client.categoryId === categoryId) total += 1;
  }
  return total;
}

function encodeFrame(payload) {
  const body = Buffer.from(payload);
  const header = [];
  header.push(0x81);

  if (body.length < 126) {
    header.push(body.length);
  } else if (body.length < 65536) {
    header.push(126, (body.length >> 8) & 255, body.length & 255);
  } else {
    header.push(127, 0, 0, 0, 0);
    header.push((body.length >> 24) & 255, (body.length >> 16) & 255, (body.length >> 8) & 255, body.length & 255);
  }

  return Buffer.concat([Buffer.from(header), body]);
}

function send(client, message) {
  if (client.socket.destroyed) return;
  client.socket.write(encodeFrame(JSON.stringify(message)));
}

function broadcastPresence(categoryId, delta) {
  const categoryTotal = categoryId ? countByCategory(categoryId) : undefined;
  const globalMessage = { type: 'presence', delta };

  for (const client of clients.values()) {
    if (categoryId && client.categoryId === categoryId) {
      send(client, { type: 'presence', category_id: categoryId, delta, ws_total: categoryTotal });
    }

    if (!client.categoryId) {
      send(client, globalMessage);
    }
  }
}

function decodeClientFrame(buffer) {
  if (buffer.length < 2) return null;

  const opcode = buffer[0] & 0x0f;
  let length = buffer[1] & 0x7f;
  let offset = 2;

  if (length === 126) {
    if (buffer.length < 4) return null;
    length = buffer.readUInt16BE(2);
    offset = 4;
  } else if (length === 127) {
    return null;
  }

  const masked = (buffer[1] & 0x80) !== 0;
  if (!masked || length > MAX_PAYLOAD_BYTES || buffer.length < offset + 4 + length) return null;

  const mask = buffer.subarray(offset, offset + 4);
  offset += 4;
  const payload = Buffer.alloc(length);

  for (let i = 0; i < length; i += 1) {
    payload[i] = buffer[offset + i] ^ mask[i % 4];
  }

  return { opcode, payload };
}

function closeClient(id) {
  const client = clients.get(id);
  if (!client) return;
  clients.delete(id);
  broadcastPresence(client.categoryId, -1);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (url.pathname === '/healthz') {
    json(response, 200, {
      ok: true,
      clients: clients.size,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  json(response, 404, { ok: false });
});

server.on('upgrade', (request, socket) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname !== '/ws/presence') {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }

  const key = request.headers['sec-websocket-key'];
  if (!key) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash('sha1')
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64');

  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '',
    '',
  ].join('\r\n'));

  const id = crypto.randomUUID();
  const categoryId = url.searchParams.get('category_id') || '';
  clients.set(id, { id, socket, categoryId, lastSeen: Date.now() });
  broadcastPresence(categoryId, 1);

  socket.on('data', (buffer) => {
    const frame = decodeClientFrame(buffer);
    if (!frame) return;

    const client = clients.get(id);
    if (client) client.lastSeen = Date.now();

    if (frame.opcode === 0x8) {
      socket.end();
    } else if (frame.opcode === 0x9) {
      socket.write(Buffer.from([0x8a, 0x00]));
    }
  });

  socket.on('close', () => closeClient(id));
  socket.on('error', () => closeClient(id));
});

setInterval(() => {
  const now = Date.now();
  for (const client of clients.values()) {
    if (client.socket.destroyed || now - client.lastSeen > HEARTBEAT_MS * 3) {
      client.socket.destroy();
      closeClient(client.id);
      continue;
    }

    try {
      client.socket.write(Buffer.from([0x89, 0x00]));
    } catch {
      closeClient(client.id);
    }
  }
}, HEARTBEAT_MS).unref();

server.listen(PORT, HOST, () => {
  console.log(`emart-presence-server listening on ${HOST}:${PORT}`);
});
