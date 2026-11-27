import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const TEMP_DIR = './temp';
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

/**
 * Download media (video/audio) menggunakan yt-dlp
 */
export async function downloadWithYtDlp(url, options = {}) {
  const { audioOnly = false, quality = '720' } = options;
  const outputTemplate = path.join(TEMP_DIR, '%(title).40s.%(ext)s');
  
  let cmd = `yt-dlp --no-playlist -o "${outputTemplate}" --print after_move:filepath`;
  
  if (audioOnly) {
    cmd += ` -x --audio-format mp3 --audio-quality 0`;
  } else {
    cmd += ` -f "best[height<=${quality}]/best"`;
  }
  
  cmd += ` "${url}"`;
  
  try {
    const { stdout } = await execAsync(cmd, { timeout: 180000 });
    const filePath = stdout.trim().split('\n').pop();
    
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('File tidak ditemukan setelah download');
    }
    
    return {
      success: true,
      path: filePath,
      filename: path.basename(filePath)
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Gagal download'
    };
  }
}

export async function cleanTemp(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}
}
