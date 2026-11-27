import config from '../config.js';
import moment from 'moment-timezone';

moment.tz.setDefault(config.timezone);

export function formatMenu() {
  return `
╔══════════════════════╗
║   ✦ ${config.botName.toUpperCase()} BOT ✦
║   Creator : Nat🥜
╚══════════════════════╝

┌───『 DOWNLOADER 』
│ ✧ .aio <link>
│ ✧ .aioaudio <link>
│ ✧ .mp3 <link>
│ ✧ .toaudio (reply video)
└──────────────

┌───『 STICKER 』
│ ✧ .tosticker / .s
│ ✧ .toimage
│ ✧ .ss (sticker sound)
│ ✧ .tts <teks>
└──────────────

┌───『 AI 』
│ ✧ .ai <teks>
│ ✧ .gemini <teks>
│ ✧ .kenyataan <pernyataan>
│ ✧ .model
└──────────────

┌───『 HIBURAN 』
│ ✧ .meme
│ ✧ .quote  .fakta
│ ✧ .truth  .dare
└──────────────

┌───『 GAME 』
│ ✧ .fishingsimulator
│ ✧ .monopoly
│ ✧ .badut .bodoh .pintar
│ ✧ .ganteng .jelek .kaya
└──────────────

┌───『 TOOLS 』
│ ✧ .calc  .jam  .cuaca
│ ✧ .short  .ping
└──────────────

┌───『 INFO 』
│ ✧ .infobot
│ ✧ .info <fitur>
└──────────────

┌───『 KHUSUS 』
│ ✧ .admin
│ ✧ .owner
└──────────────

Ketik *.info <nama>* untuk panduan.
${config.footer}
`.trim();
}

export function formatOwnerMenu() {
  return `
╔══════════════════════╗
║     OWNER MENU
╚══════════════════════╝

✧ .vision <prompt> (reply gambar)
✧ .health
✧ .stats
✧ .runtime
✧ .broadcast <teks>

${config.footer}
`.trim();
}

export function formatAdminMenu() {
  return `
╔══════════════════════╗
║     ADMIN MENU
╚══════════════════════╝

✧ .kick @user
✧ .promote @user
✧ .demote @user
✧ .hidetag <teks>
✧ .aktif
✧ .groupinfo
✧ .listadmin

${config.footer}
`.trim();
}

export function formatInfo(feature) {
  const infos = {
    aio: `*Downloader .aio*

Kirim:
.aio https://...

Bot minta pilih kualitas:
1. 360p
2. 480p
3. 720p
4. 1080p

Balas angka saja.

Untuk audio langsung:
.aioaudio <link>
.toaudio (reply video)`,

    sticker: `*Sticker*

.tosticker / .s
→ reply/kirim gambar atau video

.toimage
→ reply sticker untuk ubah jadi gambar

.ss
→ sticker + sound (reply video)

.tts <teks>
→ text menjadi sticker`,

    fishing: `*Fishing Simulator*

.fishingsimulator          → buka menu
.fishingsimulator mulai    → mulai baru
.fishingsimulator cast     → lempar pancing
.fishingsimulator shop     → toko
.fishingsimulator buyrod   → beli joran
.fishingsimulator sail     → pindah lokasi
.fishingsimulator heal     → berobat
.fishingsimulator rest     → istirahat
.fishingsimulator cerita   → lihat cerita
.repeatfishingsimulator    → ulangi dari awal

Ada 3 ending berbeda!`,

    monopoly: `*Monopoly Mini*

.monopoly         → buka menu
.monopoly mulai   → mulai baru
.monopoly roll    → lempar dadu
.monopoly buy     → beli properti
.monopoly status  → cek status
.monopoly properti
.monopoly end     → akhiri permainan`,

    meme: `*Meme Random*

.meme

Bot kirim meme random.`,

    kenyataan: `*Lihat Kenyataan*

.kenyataan <pernyataan>

Contoh:
.kenyataan Bumi itu bulat?

AI jawab + persentase keaslian.`,

    default: `Fitur tidak ditemukan.
Ketik .menu untuk daftar.`
  };
  return infos[feature] || infos.default;
}

export function formatReply(title, content, footer = true) {
  let text = `╭─「 ${title} 」\n`;
  text += content.split('\n').map(line => `│ ${line}`).join('\n');
  text += `\n╰─`;
  if (footer) text += `\n_${config.footer}_`;
  return text;
}

export function formatError(msg) {
  return `*Error*\n\n${msg}\n\n_${config.footer}_`;
}

export function formatSuccess(msg) {
  return `*Sukses ✅*\n\n${msg}`;
}

export function getTime() {
  return moment().format('dddd, DD MMMM YYYY • HH:mm:ss');
}

export function getRuntime(startTime) {
  const ms = Date.now() - startTime;
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / (1000 * 60)) % 60;
  const hour = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const day = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${day}d ${hour}h ${min}m ${sec}s`;
}

export function formatAIResponse(question, answer) {
  return `*Question:*
> ${question}

${answer}

_${config.footer}_`;
}
