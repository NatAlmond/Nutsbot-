import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR = path.join(__dirname, '../media');

export function getPict(num) {
  const file = path.join(MEDIA_DIR, `pict${num}.png`);
  if (fs.existsSync(file)) return fs.readFileSync(file);
  // fallback
  const alt = path.join(MEDIA_DIR, `pict${num}.jpg`);
  if (fs.existsSync(alt)) return fs.readFileSync(alt);
  return null;
}

export async function sendPict(sock, jid, num, caption = '', quoted = null) {
  const buffer = getPict(num);
  if (!buffer) return null;
  return sock.sendMessage(jid, {
    image: buffer,
    caption: caption || undefined
  }, { quoted });
}
