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
 * Animated / Sound sticker attempt
 */
export async function createSoundSticker(buffer, options = {}) {
  const {
    pack = 'Nuts Sticker',
    author = 'Nat🥜',
    quality = 60
  } = options;

  try {
    const sticker = new Sticker(buffer, {
      pack,
      author,
      quality,
      background: 'transparent'
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
 * Sticker → Image (extract first frame / convert webp)
 */
export async function stickerToImage(buffer) {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const input = path.join(tmpDir, `sticker_${Date.now()}.webp`);
  const output = path.join(tmpDir, `image_${Date.now()}.png`);

  fs.writeFileSync(input, buffer);

  try {
    // Try ffmpeg first
    await execAsync(`ffmpeg -y -i "${input}" "${output}"`);
    const result = fs.readFileSync(output);
    fs.unlinkSync(input);
    fs.unlinkSync(output);
    return result;
  } catch {
    // fallback: return original as is (WhatsApp may still open it)
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
    fs.unlinkSync(input);
    fs.unlinkSync(output);
    return result;
  } catch (e) {
    try { fs.unlinkSync(input); } catch {}
    try { fs.unlinkSync(output); } catch {}
    throw new Error('Gagal convert video ke audio. Pastikan ffmpeg terinstall.');
  }
}
