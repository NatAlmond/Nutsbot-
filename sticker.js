import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Image / Video / GIF → Sticker
 */
export async function createSticker(buffer, options = {}) {
  const {
    pack = 'Nuts Sticker',
    author = 'Nat🥜',
    type = StickerTypes.FULL,
    quality = 70
  } = options;

  const sticker = new Sticker(buffer, {
    pack,
    author,
    type,
    quality,
    background: 'transparent'
  });

  return await sticker.toBuffer();
}

/**
 * Video → Animated sticker
 */
export async function createVideoSticker(buffer, options = {}) {
  const {
    pack = 'Nuts Sticker',
    author = 'Nat🥜',
    quality = 55
  } = options;

  const sticker = new Sticker(buffer, {
    pack,
    author,
    type: StickerTypes.FULL,
    quality,
    background: 'transparent',
    fps: 12,
    maxDuration: 8
  });

  return await sticker.toBuffer();
}

/**
 * Video → Sticker + suara (sound sticker)
 */
export async function createSoundSticker(buffer, options = {}) {
  const {
    pack = 'Nuts Sticker',
    author = 'Nat🥜',
    quality = 50
  } = options;

  try {
    const sticker = new Sticker(buffer, {
      pack,
      author,
      quality,
      background: 'transparent',
      fps: 12,
      maxDuration: 8
    });

    if (typeof sticker.toSoundSticker === 'function') {
      return await sticker.toSoundSticker();
    }

    const buf = await sticker.toBuffer();
    return { sticker: buf, isAnimated: true };
  } catch (e) {
    const buf = await createSticker(buffer, { pack, author, quality });
    return { sticker: buf };
  }
}

/**
 * Teks → Sticker via SVG (tanpa native canvas)
 */
export async function createTextSticker(text, options = {}) {
  const {
    pack = 'Nuts Sticker',
    author = 'Nat🥜',
    quality = 85,
    bg = '#1a1a2e',
    color = '#eaeaea'
  } = options;

  const safe = String(text || 'Nuts')
    .slice(0, 60)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // pecah baris sederhana
  const words = safe.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (test.length > 18) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  if (!lines.length) lines.push('Nuts');

  const lineHeight = 56;
  const startY = 256 - ((lines.length - 1) * lineHeight) / 2;

  const tspans = lines
    .map((l, i) => `<tspan x="256" y="${startY + i * lineHeight}">${l}</tspan>`)
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="${bg}" rx="24"/>
  <text fill="${color}" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="bold" text-anchor="middle">${tspans}</text>
</svg>`;

  const sticker = new Sticker(Buffer.from(svg), {
    pack,
    author,
    type: StickerTypes.FULL,
    quality,
    background: bg
  });

  return await sticker.toBuffer();
}

/**
 * Sticker → Image
 */
export async function stickerToImage(buffer) {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const input = path.join(tmpDir, `sticker_${Date.now()}.webp`);
  const output = path.join(tmpDir, `image_${Date.now()}.png`);

  fs.writeFileSync(input, buffer);

  try {
    await execAsync(`ffmpeg -y -i "${input}" "${output}"`);
    const result = fs.readFileSync(output);
    try { fs.unlinkSync(input); } catch {}
    try { fs.unlinkSync(output); } catch {}
    return result;
  } catch {
    try { fs.unlinkSync(input); } catch {}
    return buffer;
  }
}

/**
 * Video → Audio (mp3)
 */
export async function videoToAudio(buffer) {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const input = path.join(tmpDir, `video_${Date.now()}.mp4`);
  const output = path.join(tmpDir, `audio_${Date.now()}.mp3`);

  fs.writeFileSync(input, buffer);

  try {
    await execAsync(`ffmpeg -y -i "${input}" -vn -acodec libmp3lame -q:a 2 "${output}"`);
    const result = fs.readFileSync(output);
    try { fs.unlinkSync(input); } catch {}
    try { fs.unlinkSync(output); } catch {}
    return result;
  } catch (e) {
    try { fs.unlinkSync(input); } catch {}
    try { fs.unlinkSync(output); } catch {}
    throw new Error('Gagal convert video ke audio. Pastikan ffmpeg terinstall.');
  }
}
