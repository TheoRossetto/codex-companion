const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { LIMIT, metadata, pipeName, sign, verify } = require('./protocol.cjs');
const { permission } = require('./permission.cjs');
async function startServer(dir, onEvent, {onPermission} = {}) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const keyPath = path.join(dir, 'transport.key');
  try { fs.writeFileSync(keyPath, randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  const key = fs.readFileSync(keyPath, 'utf8').trim();
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Invalid local transport key.');
  const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket);
    socket.setEncoding('utf8');
    let deadline = setTimeout(() => socket.destroy(), 1500);
    socket.on('close', () => { clearTimeout(deadline); sockets.delete(socket); });
    socket.on('error', () => socket.destroy());
    socket.setTimeout(1500, () => socket.destroy());
    const nonce = randomBytes(24).toString('hex');
    socket.write(JSON.stringify({ nonce, proof: sign(key, `server:${nonce}`) }) + '\n');
    let buffer = '';
    let received = false;
    socket.on('data', chunk => {
      if (received) return socket.destroy();
      buffer += chunk.toString('utf8');
      if (Buffer.byteLength(buffer) > LIMIT) return socket.destroy();
      if (!buffer.includes('\n')) return;
      received = true;
      try {
        const frame = JSON.parse(buffer.split('\n')[0]);
        if (typeof frame.body !== 'string' || !verify(key, `${nonce}:${frame.body}`, frame.proof)) return socket.destroy();
        const raw = JSON.parse(frame.body);
        const event = metadata(raw);
        if (event) onEvent(event);
        const detail = raw.permission && permission({...event,...raw.permission});
        if (event && detail && onPermission) {
          const abort = new AbortController();
          socket.once('close',()=>abort.abort());
          const pending = onPermission({...event,...detail},abort.signal);
          if (pending) {
            clearTimeout(deadline);deadline=setTimeout(()=>socket.destroy(),95000);socket.setTimeout(95000,()=>socket.destroy());
            socket.write(JSON.stringify({waiting:true,proof:sign(key,'waiting:'+nonce)})+'\n');
            Promise.resolve(pending).then(decision=>{
              if(socket.destroyed)return;
              const body=JSON.stringify(['allow','deny'].includes(decision)?{hookSpecificOutput:{hookEventName:'PermissionRequest',decision:{behavior:decision}}}:{});
              socket.end(JSON.stringify({body,proof:sign(key,'decision:'+nonce+':'+body)})+'\n');
            }).catch(()=>socket.end('{}\n'));
            return;
          }
        }
        socket.end('{}\n');
      } catch { socket.destroy(); }
    });
  });
  server.maxConnections = 32;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(pipeName(dir), () => { server.removeListener('error', reject); resolve(); });
  });
  server.on('error', () => {});
  return { close: () => new Promise(resolve => { for (const socket of sockets) socket.destroy(); server.close(resolve); }) };
}
module.exports = { startServer };
