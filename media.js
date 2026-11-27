import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR = __dirname;

export function getPict(num) {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const file = path.join(MEDIA_DIR, `pict${num}.${ext}`);
    if (fs.existsSync(file)) return fs.readFileSync(file);
  }
  return null;
}

export async function sendPict(sock, jid, num, caption = '', quoted = null) {
  const buffer = getPict(num);
  if (!buffer) {
    if (caption) {
      return sock.sendMessage(jid, { text: caption }, { quoted });
    }
    return null;
  }
  return sock.sendMessage(jid, {
    image: buffer,
    caption: caption || undefined
  }, { quoted });
}
