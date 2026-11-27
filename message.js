import config from './config.js';
import moment from 'moment-timezone';

moment.tz.setDefault(config.timezone);

/** Font fullwidth / brick */
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
  return `${d}h ${h}j ${m}m ${s}d`;
}

export function formatReply(title, body) {
  return `╭───『 ${bold(title)} 』\n${body}\n╰──────────────\n_${config.footer}_`;
}

export function formatError(msg) {
  return `╭───『 ${bold('ERROR')} 』\n│ ❌ ${msg}\n╰──────────────\n_${config.footer}_`;
}

export function formatSuccess(msg) {
  return `╭───『 ${bold('SUKSES')} 』\n│ ✅ ${msg}\n╰──────────────\n_${config.footer}_`;
}

export function formatAIResponse(text) {
  return `╭───『 ${bold('AI RESPONSE')} 』\n${text}\n╰──────────────\n_${config.footer}_`;
}

/** Sambutan pertama (chat sendiri / owner) — pict1 Klein */
export function formatWelcome(botName, pushName) {
  const title = brick('Anda Telah Memasang Bot Nuts!');
  return `
╔══════════════════════════╗
║  ${title}
╚══════════════════════════╝

${brick('Selamat Menikmati Tools-Tools')}
${brick('Yang Seru Dan Bervariatif!')}

╭───『 INFO 』
│ 👤 User : ${pushName || 'Owner'}
│ 🤖 Bot  : ${botName}
│ ⏰ Waktu: ${getTime()}
│
│ Cek status:
│ • .ping  • .health  • .owner
╰──────────────

Ketik *.menu* untuk daftar perintah.
_${config.footer}_
`.trim();
}

export function formatMenu() {
  return `
╔══════════════════════════╗
║   ✦ ${bold(config.botName.toUpperCase() + ' BOT')} ✦
║   Creator : Nat🥜
╚══════════════════════════╝

┌───『 ${bold('DOWNLOADER')} 』
│ ✧ .aio <link>
│ ✧ .aioaudio <link>
│ ✧ .mp3 <link>
│ ✧ .toaudio (reply video)
└──────────────

┌───『 ${bold('STICKER')} 』
│ ✧ .s / .sticker / .tosticker
│ ✧ .videosticker
│ ✧ .audiosticker / .ss
│ ✧ .textsticker / .tts <teks>
│ ✧ .toimage
└──────────────

┌───『 ${bold('TRANSLATE')} 』
│ ✧ .translate
│ ✧ .toenglish .tojapan .tochina
│ ✧ .tokorea .togerman .torusia
│ ✧ .toindonesian .toitalia
│ ✧ .tothailand .tofrance
│ ✧ .tophilipine + bahasa lain
└──────────────

┌───『 ${bold('AI')} 』
│ ✧ .ai <teks>
│ ✧ .gemini <teks>
│ ✧ .kenyataan <pernyataan>
│ ✧ .model
└──────────────

┌───『 ${bold('HIBURAN')} 』
│ ✧ .meme  .quote  .fakta  .joke
│ ✧ .dog  .cat
│ ✧ .truth  .dare
└──────────────

┌───『 ${bold('GAME')} 』
│ ✧ .tebak 🎯 (4 level + gelar)
│ ✧ .suit ✊ (batu gunting kertas)
│ ✧ .tebakangka 🔢
│ ✧ .slot 🎰
│ ✧ .fishingsimulator 🎣
│ ✧ .monopoly 🏠
│ ✧ .badut 🤡 .bodoh 🤪 .pintar 🧠
│ ✧ .ganteng 😎 .jelek 🤢 .kaya 💰
└──────────────

┌───『 ${bold('TOOLS')} 』
│ ✧ .calc  .jam  .cuaca
│ ✧ .short  .ping  .runtime
│ ✧ .negara <nama>  .kurs
└──────────────

┌───『 ${bold('INFO')} 』
│ ✧ .menu  .infobot  .info <fitur>
│ ✧ .owner  .health
└──────────────

┌───『 ${bold('OWNER')} 』
│ ✧ .owner  .setting
│ ✧ .admin (menu admin grup)
└──────────────

Ketik *.info <nama>* untuk panduan.
_${config.footer}_
`.trim();
}

export function formatOwnerMenu(extra = {}) {
  const { pushName = '-', latency = '-', mem = '-', runtime = '-', title = 'Member' } = extra;
  return `
╔══════════════════════════╗
║     ${bold('OWNER MENU')}
╚══════════════════════════╝

╭───『 STATUS 』
│ 👤 Nama   : ${pushName}
│ 🏷️ Gelar  : ${title}
│ 🏓 Ping   : ${latency}ms
│ 💚 Health : OK
│ ⏱ Runtime: ${runtime}
│ 🧠 RAM    : ${mem}
╰──────────────

✧ .setting → pengaturan bot
✧ .vision <prompt> (reply gambar)
✧ .health  .stats  .runtime
✧ .broadcast <teks>
✧ .ping

_${config.footer}_
`.trim();
}

export function formatSettings(cfg = {}) {
  return `
╭───『 ${bold('SETTING BOT')} 』
│ (Hanya Owner)
│
│ Nama Bot : ${cfg.botName || config.botName}
│ Prefix   : ${cfg.prefix || config.prefix}
│ Owner    : ${cfg.owner || config.owner}
│ AI       : ${cfg.defaultAI || config.defaultAI}
│ Limit DL : ${cfg.limit?.download ?? config.limit.download}/hari
│ Limit AI : ${cfg.limit?.ai ?? config.limit.ai}/hari
│
│ Ubah via Environment Variables
│ di Railway / file .env lalu redeploy.
│
│ Contoh env:
│ BOT_NAME=Nuts
│ PREFIX=.
│ OWNER_NUMBER=628...
│ DEFAULT_AI=groq
│ LIMIT_DOWNLOAD=10
│ GROQ_API_KEY=gsk_...
╰──────────────
_${config.footer}_
`.trim();
}

export function formatAdminMenu() {
  return `
╔══════════════════════════╗
║     ${bold('ADMIN MENU')}
╚══════════════════════════╝

✧ .kick @user
✧ .promote @user
✧ .demote @user
✧ .hidetag <teks>
✧ .aktif
✧ .groupinfo
✧ .listadmin

_${config.footer}_
`.trim();
}

export function formatInfo(feature) {
  const infos = {
    aio: `*Downloader .aio*\n\n.aio <link> → pilih kualitas\n.aioaudio <link>\n.toaudio (reply video)`,
    sticker: `*Sticker*\n\n.s → gambar/video\n.videosticker → animasi\n.audiosticker → + suara\n.textsticker <teks>\n.toimage → sticker ke gambar`,
    translate: `*Translate*\n\n.translate → menu bahasa\n.toenglish Api → Fire\n.tojapan Hello → こんにちは\nBisa reply teks lalu ketik perintah.`,
    tebak: `*Tebak-Tebakan 🎯*\n\n.tebak easy|normal|hard|nightmare\n25 soal per level, jawab A/B/C/D\nLulus Nightmare (≥20 benar) → gelar The Genius 🎓`,
    suit: `*Suit ✊*\n\n.suit batu|gunting|kertas\natau .suit b|g|k`,
    tebakangka: `*Tebak Angka 🔢*\n\n.tebakangka → bot pilih 1-100\nKetik angka untuk menebak.`,
    slot: `*Slot 🎰*\n\n.slot → putar mesin slot`,
    fishing: `*Fishing Simulator 🎣*\n\n.fishingsimulator mulai / cast / shop ...`,
    monopoly: `*Monopoly Mini 🏠*\n\n.monopoly`,
    ai: `*AI*\n\n.ai <teks>  .gemini <teks>  .kenyataan <klaim>`,
    default: `Fitur tidak ditemukan. Ketik *.menu*`
  };
  return infos[feature] || infos.default;
}
