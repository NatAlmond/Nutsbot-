import config from './config.js';
import moment from 'moment-timezone';

moment.tz.setDefault(config.timezone || 'Asia/Jakarta');

/** Fullwidth / brick style */
export function brick(text = '') {
  const map = {
    A:'Ａ',B:'Ｂ',C:'Ｃ',D:'Ｄ',E:'Ｅ',F:'Ｆ',G:'Ｇ',H:'Ｈ',I:'Ｉ',J:'Ｊ',K:'Ｋ',L:'Ｌ',M:'Ｍ',
    N:'Ｎ',O:'Ｏ',P:'Ｐ',Q:'Ｑ',R:'Ｒ',S:'Ｓ',T:'Ｔ',U:'Ｕ',V:'Ｖ',W:'Ｗ',X:'Ｘ',Y:'Ｙ',Z:'Ｚ',
    a:'ａ',b:'ｂ',c:'ｃ',d:'ｄ',e:'ｅ',f:'ｆ',g:'ｇ',h:'ｈ',i:'ｉ',j:'ｊ',k:'ｋ',l:'ｌ',m:'ｍ',
    n:'ｎ',o:'ｏ',p:'ｐ',q:'ｑ',r:'ｒ',s:'ｓ',t:'ｔ',u:'ｕ',v:'ｖ',w:'ｗ',x:'ｘ',y:'ｙ',z:'ｚ',
    '0':'０','1':'１','2':'２','3':'３','4':'４','5':'５','6':'６','7':'７','8':'８','9':'９',
    ' ':'　','!':'！','?':'？','.':'．','-':'－','_':'＿'
  };
  return String(text).split('').map(c => map[c] || c).join('');
}

export function bold(text = '') {
  const map = {
    A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',
    N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
    a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',
    n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
    '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵'
  };
  return String(text).split('').map(c => map[c] || c).join('');
}

export function getTime() {
  return moment().format('dddd, DD MMMM YYYY • HH:mm:ss') + ' WIB';
}

export function getRuntime(start) {
  const ms = Date.now() - start;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  if (d > 0) return `${d} hari ${h} jam ${m} menit`;
  if (h > 0) return `${h} jam ${m} menit ${s} detik`;
  return `${m} menit ${s} detik`;
}

/* ========== FRAME STYLE (lebih rapi) ========== */

export function formatReply(title, body) {
  return `╭───『 ${bold(title)} 』
│
${body.split('\n').map(l => '│ ' + l).join('\n')}
│
╰──────────────
_${config.footer}_`;
}

export function formatError(msg) {
  return `╭───『 ${bold('ERROR')} 』
│
│ ❌ ${msg}
│
╰──────────────
_${config.footer}_`;
}

export function formatSuccess(msg) {
  return `╭───『 ${bold('SUKSES')} 』
│
│ ✅ ${msg}
│
╰──────────────
_${config.footer}_`;
}

export function formatAIResponse(text) {
  return `╭───『 ${bold('AI')} 』
│
${text.split('\n').map(l => '│ ' + l).join('\n')}
│
╰──────────────
_${config.footer}_`;
}

export function formatWelcome(botName, pushName) {
  return `
╔════════════════════════╗
║  ${brick('Nuts Bot Siap!')}
╚════════════════════════╝

Halo *${pushName || 'Owner'}* 👋
Bot *${botName}* sudah aktif.

╭───『 STATUS 』
│ ⏰ ${getTime()}
│ 📌 Ketik *.menu* untuk daftar fitur
│ 📌 Ketik *.ping* untuk cek latency
╰──────────────

_${config.footer}_`.trim();
}

export function formatMenu() {
  return `
╔════════════════════════╗
║   ✦ ${bold((config.botName || 'NUTS').toUpperCase())} BOT ✦
║   Creator : Nat 🥜
╚════════════════════════╝

┌───『 ${bold('DOWNLOADER')} 』
│ ✧ .aio <link>
│ ✧ .aioaudio <link>
│ ✧ .mp3 <link>
│ ✧ .toaudio (reply video)
└──────────────

┌───『 ${bold('STICKER')} 』
│ ✧ .s / .sticker
│ ✧ .videosticker
│ ✧ .audiosticker / .ss
│ ✧ .textsticker <teks>
│ ✧ .toimage
└──────────────

┌───『 ${bold('AI')} 』
│ ✧ .ai <teks>
│ ✧ .gemini <teks>
│ ✧ .kenyataan <klaim>
│ ✧ .model
└──────────────

┌───『 ${bold('GAME')} 』
│ ✧ .suit ✊
│ ✧ .tebakangka 🔢
│ ✧ .slot 🎰
│ ✧ .mancing 🎣
│ ✧ .dragon 🐉 (RPG + Boss)
│ ✧ .monopoli 🏠
│ ✧ .truth  .dare
└──────────────

┌───『 ${bold('TOOLS')} 』
│ ✧ .calc  .jam  .cuaca
│ ✧ .short  .ping  .runtime
│ ✧ .meme  .quote  .fakta
└──────────────

┌───『 ${bold('INFO')} 』
│ ✧ .menu  .infobot
│ ✧ .owner  .health
└──────────────

Ketik *.info <fitur>* untuk panduan.
_${config.footer}_`.trim();
}

export function formatOwnerMenu(extra = {}) {
  const { pushName = '-', latency = '-', mem = '-', runtime = '-' } = extra;
  return `
╔════════════════════════╗
║     ${bold('OWNER MENU')}
╚════════════════════════╝

╭───『 STATUS 』
│ 👤 ${pushName}
│ 🏓 ${latency}ms
│ ⏱ ${runtime}
│ 🧠 ${mem}
╰──────────────

✧ .setting
✧ .health  .stats
✧ .broadcast <teks>
✧ .ownerlike list

_${config.footer}_`.trim();
}

export function formatAdminMenu() {
  return `
╔════════════════════════╗
║     ${bold('ADMIN MENU')}
╚════════════════════════╝

✧ .kick @user
✧ .promote @user
✧ .demote @user
✧ .hidetag <teks>
✧ .groupinfo
✧ .listadmin

_${config.footer}_`.trim();
}

export function formatInfo(feature) {
  const infos = {
    aio: `*Downloader*\n\n.aio <link> → pilih kualitas 360/480/720/1080\n.aioaudio <link> → langsung audio\n.toaudio → reply video jadi mp3`,
    sticker: `*Sticker*\n\n.s → gambar/video jadi stiker\n.videosticker → stiker animasi\n.audiosticker → stiker + suara\n.textsticker <teks>\n.toimage → stiker ke gambar`,
    ai: `*AI*\n\n.ai <teks> → Groq (gpt-oss)\n.gemini <teks> → Gemini terbaru\n.kenyataan <klaim> → analisis fakta`,
    mancing: `*Fishing Simulator*\n\n.mancing → mulai\n.tarik → tarik pancing\n.lepas → lepaskan\nAda 3 ending berbeda!`,
    monopoli: `*Monopoly Mini*\n\n.monopoli start\n.monopoli roll\n.monopoli status\n.monopoli stop`,
    suit: `*Suit*\n\n.suit batu | gunting | kertas\natau .suit b | g | k`,
    tebakangka: `*Tebak Angka*\n\n.tebakangka → bot pilih 1-100\nKetik angka saja untuk menebak`,
    default: `Fitur tidak ditemukan.\nKetik *.menu* untuk daftar lengkap.`
  };
  return infos[feature] || infos.default;
}
