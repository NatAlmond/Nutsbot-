import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
  jidNormalizedUser
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import os from 'os';
import http from 'http';
import config from './config.js';
import { checkLimit, isOwnerLike, addOwnerLike, listOwnerLikes } from './limit.js';
import { downloadWithYtDlp, cleanTemp } from './downloader.js';
import { chatGroq, chatGemini, visionGemini, availableModels } from './ai.js';
import { createSticker, createVideoSticker, createSoundSticker, createTextSticker, stickerToImage, videoToAudio } from './sticker.js';
import {
  randomMemberGame, truthOrDare,
  startFishing, fishAction, getFishingMenu, resetFishing,
  startMonopoly, monopolyAction, getMonopolyMenu,
  getDragonMenu, dragonStart, dragonStatus, dragonExplore,
  dragonAttack, dragonFlee, dragonUpgrade, dragonHealTown, dragonReset
} from './games.js';
import { getQuizMenu, startQuiz, answerQuiz, stopQuiz, hasSession, getTitle, clearTitle } from './quiz.js';
import { getTranslateMenu, translateText, formatTranslateResult, resolveLang } from './translate.js';
import { playSuit, startTebakAngka, guessAngka, stopTebakAngka, hasAngkaSession, playSlot } from './minigames.js';
import { react, textToImage, getWeather, shortUrl, getMeme, getQuote, getFact, getJoke, getDog, getCat, getCountry, getKurs } from './utils.js';
import { sendPict, getPict } from './media.js';
import { 
  formatMenu, formatOwnerMenu, formatAdminMenu, formatInfo,
  formatReply, formatError, formatSuccess, getTime, getRuntime, formatAIResponse,
  formatWelcome, formatSettings, brick, bold
} from './message.js';

// ===== WEB SERVER BUAT RAILWAY (biar link gak Not Found) =====
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>NutsBot Aktif ✅</h1><p>Bot WhatsApp sedang berjalan.</p><p>Cek logs Railway untuk Pairing Code / QR.</p>');
});
server.listen(PORT, '0.0.0.0', () => {
  console.log('Web server jalan di 0.0.0.0:' + PORT);
});
server.on('error', (err) => {
  console.error('Web server error:', err.message);
});
// =============================================================

const logger = pino({ level: 'silent' });
const userModels = new Map();
const messageCount = new Map();
const pendingAio = new Map();
const startTime = Date.now();
let welcomeSent = false; // cegah spam sambutan tiap reconnect

function detectSource(url) {
  if (/tiktok|vt\.tiktok/i.test(url)) return 'TikTok';
  if (/instagram|instagr\.am/i.test(url)) return 'Instagram';
  if (/facebook|fb\.watch|fb\.com/i.test(url)) return 'Facebook';
  if (/pinterest|pin\.it/i.test(url)) return 'Pinterest';
  if (/youtube|youtu\.be/i.test(url)) return 'YouTube';
  return 'Unknown';
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(process.env.SESSION_PATH || './session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    // markOnlineOnConnect: false
  });

  sock.ev.on('creds.update', saveCreds);

  // Pairing Code support (lebih mudah di Android)
  if (!sock.authState.creds.registered) {
    const phoneNumber = process.env.PAIRING_NUMBER; // contoh: 6281234567890
    if (phoneNumber) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
          console.log('\n========================================');
          console.log('PAIRING CODE:', code);
          console.log('Masukkan kode ini di WhatsApp Android:');
          console.log('WhatsApp → Perangkat Tertaut → Tautkan perangkat → Tautkan dengan nomor telepon');
          console.log('========================================\n');
        } catch (e) {
          console.log('Gagal request pairing code:', e.message);
          console.log('Gunakan QR code saja.');
        }
      }, 3000);
    } else {
      console.log('\nTips: Set PAIRING_NUMBER di .env untuk login pakai kode (tanpa QR).\n');
    }
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('\nScan QR berikut (atau pakai Pairing Code):\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Koneksi terputus. Reconnect:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log(`\n${config.botName} berhasil terhubung\n`);
      // Sambutan hanya sekali per proses (hindari spam saat reconnect)
      if (!welcomeSent) {
        welcomeSent = true;
        try {
          const ownerJid = (config.owner || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
          const welcome = formatWelcome(config.botName, 'Owner');
          await sendPict(sock, ownerJid, 1, welcome); // pict1 = sambutan
          console.log('Pesan sambutan + gambar terkirim ke owner');
        } catch (e) {
          console.log('Gagal kirim sambutan:', e.message);
          try {
            const ownerJid = (config.owner || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            await sock.sendMessage(ownerJid, { text: formatWelcome(config.botName, 'Owner') });
          } catch {}
        }
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? (msg.key.participant || msg.participant) : from;
    const senderNumber = (sender || '').split('@')[0];
    const ownerNum = String(config.owner || '').replace(/[^0-9]/g, '');
    const isOwner = senderNumber === ownerNum ||
                    senderNumber === ownerNum.replace(/^0/, '62') ||
                    ('62' + senderNumber.replace(/^0/, '')) === ownerNum ||
                    isOwnerLike(senderNumber);

    if (isGroup) {
      const key = `${from}_${sender}`;
      messageCount.set(key, (messageCount.get(key) || 0) + 1);
    }

    const body = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || 
                 msg.message.imageMessage?.caption || 
                 msg.message.videoMessage?.caption || '';
    
    const reply = async (teks) => sock.sendMessage(from, { text: teks }, { quoted: msg });
    const replyImg = async (num, caption) => sendPict(sock, from, num, caption, msg);

    // ========== PENDING QUALITY SELECTION ==========
    if (pendingAio.has(sender) && /^[1-4]$/.test(body.trim())) {
      const pending = pendingAio.get(sender);
      if (Date.now() - pending.time > 180000) {
        pendingAio.delete(sender);
        return reply(formatError('Waktu pilihan kualitas habis (3 menit). Kirim ulang .aio <link>'));
      }
      pendingAio.delete(sender);
      const qualities = { '1': '360', '2': '480', '3': '720', '4': '1080' };
      const quality = qualities[body.trim()];
      const source = detectSource(pending.url);

      await react(sock, msg, '⏰');
      const result = await downloadWithYtDlp(pending.url, { quality });
      if (!result.success) {
        await react(sock, msg, '❌');
        await replyImg(9, formatError('Gagal mengunduh.\n' + result.error));
        return;
      }

      try {
        const buffer = fs.readFileSync(result.path);
        const isVideo = /\.(mp4|mkv|webm)$/i.test(result.filename);
        const isAudio = /\.(mp3|m4a|ogg)$/i.test(result.filename);

        if (isVideo) {
          const caption = `*Sukses ✅*\n\nLink to video work!\nNikmati videonya! Dan selamat menonton!\n\n• Sumber : ${source}\n• Kualitas : ${quality}p\n• Tipe : ${source === 'TikTok' || source === 'Pinterest' ? 'Short Video' : 'Video'}\n• File : ${result.filename}\n\n_${config.footer}_`;
          await sock.sendMessage(from, { video: buffer, caption }, { quoted: msg });
        } else if (isAudio) {
          const caption = `*Sukses ✅*\n\nLink to sound work!\nNikmati audionya! Dan selamat mendengar!\n\n• Sumber : ${source}\n• File : ${result.filename}\n\n_${config.footer}_`;
          await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg', fileName: result.filename }, { quoted: msg });
          await reply(caption);
        } else {
          await sock.sendMessage(from, { document: buffer, fileName: result.filename, mimetype: 'application/octet-stream' }, { quoted: msg });
        }
        await cleanTemp(result.path);
        await react(sock, msg, '✅');
      } catch (e) {
        await react(sock, msg, '❌');
        await replyImg(9, formatError('Gagal mengirim file.'));
      }
      return;
    }

    
    // Jawab tebak-tebakan tanpa prefix jika sesi aktif
    
    // Jawab tebak angka tanpa prefix
    if (hasAngkaSession(sender) && /^\d{1,3}$/.test((body || '').trim())) {
      const res = guessAngka(sender, body.trim());
      if (res.ok) {
        await sock.sendMessage(from, { text: res.text }, { quoted: msg });
        return;
      }
    }

    if (hasSession(sender) && /^[ABCD1234]$/i.test((body || '').trim())) {
      const res = answerQuiz(sender, body.trim());
      if (res.ok) {
        await sock.sendMessage(from, { text: res.text }, { quoted: msg });
        return;
      }
    }

    
    // ===== OWNER-LIKE CODE (chat pribadi saja) =====
    if (!isGroup && body.trim() === (config.ownerCode || 'myownerlikepeanuts')) {
      if (addOwnerLike(senderNumber)) {
        await reply(`✅ *Berhasil!*

Nomor *${senderNumber}* sekarang *Owner-like*.

• Limit download / AI / game = ∞
• Di grup dikenali sebagai Owner

Selamat menikmati!`);
      } else {
        await reply(formatError('Gagal menyimpan nomor.'));
      }
      return;
    }

    if (!body.startsWith(config.prefix)) return;

    const args = body.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const text = args.join(' ');

    let isAdmin = false, isBotAdmin = false;
    if (isGroup) {
      try {
        const meta = await sock.groupMetadata(from);
        const participants = meta.participants || [];
        const senderInfo = participants.find(p => p.id === sender || p.id === jidNormalizedUser(sender));
        const botId = sock.user.id;
        const botInfo = participants.find(p => p.id === botId || p.id.includes(botId.split(':')[0]));
        isAdmin = senderInfo?.admin === 'admin' || senderInfo?.admin === 'superadmin' || isOwner;
        isBotAdmin = botInfo?.admin === 'admin' || botInfo?.admin === 'superadmin';
      } catch {}
    }

    try {
      // ========== MENU ==========
      if (command === 'menu' || command === 'help') {
        await replyImg(3, formatMenu());
        return;
      }
      if (command === 'owner') {
        if (!isOwner) return reply(formatError('Hanya owner.'));
        const t0 = Date.now();
        const mem = process.memoryUsage();
        const extra = {
          pushName: msg.pushName || senderNumber,
          latency: Date.now() - t0,
          mem: (mem.rss / 1024 / 1024).toFixed(1) + 'MB',
          runtime: getRuntime(startTime),
          title: getTitle(sender)
        };
        // pict2 = gambar owner
        await replyImg(2, formatOwnerMenu(extra));
        return;
      }

      if (command === 'setting' || command === 'settings') {
        if (!isOwner) return reply(formatError('Hanya owner.'));
        await replyImg(3, formatSettings(config));
        return;
      }
      if (command === 'admin') {
        if (!isGroup) return reply(formatError('Hanya di grup.'));
        if (!isAdmin) return reply(formatError('Hanya admin grup.'));
        return reply(formatAdminMenu());
      }
      if (command === 'infobot') {
        const info = `*${config.botName}*\nCreator: Nat🥜\n\nBot multi fungsi WhatsApp.\nFitur terus ditambah.\n\nKetik .menu untuk daftar perintah.`;
        await replyImg(11, info);
        return;
      }
      if (command === 'info') {
        return reply(formatInfo((text || 'default').toLowerCase()));
      }

      // ========== TOOLS with photos ==========

      // ===== FISHING (teks saja, tanpa gambar) =====
      if (command === 'mancing' || command === 'fishingsimulator') {
        const r = startFishing(sender);
        return reply(r.ok ? r.text : formatError(r.msg));
      }
      if (command === 'tarik' || command === 'lepas') {
        const r = fishAction(sender, command);
        return reply(r.ok ? r.text : formatError(r.msg));
      }
      if (command === 'resetmancing') {
        resetFishing(sender);
        return reply(formatSuccess('Sesi mancing direset.'));
      }

      // ===== DRAGON ROLL (teks saja, tanpa gambar) =====
      if (command === 'dragon' || command === 'dragonroll') {
        const sub = (args[0] || '').toLowerCase();
        if (!sub || sub === 'menu') return reply(getDragonMenu());
        if (sub === 'start') {
          const r = dragonStart(sender);
          return reply(r.ok ? r.text : formatError(r.msg));
        }
        if (sub === 'status') {
          const r = dragonStatus(sender);
          return reply(r.ok ? r.text : formatError(r.msg));
        }
        if (sub === 'explore') {
          const r = dragonExplore(sender);
          return reply(r.ok ? r.text : formatError(r.msg));
        }
        if (sub === 'attack' || sub === 'skill') {
          const skill = sub === 'skill' ? (args[1] || 'slash').toLowerCase() : 'slash';
          const r = dragonAttack(sender, skill);
          return reply(r.ok ? r.text : formatError(r.msg));
        }
        if (sub === 'flee') {
          const r = dragonFlee(sender);
          return reply(r.ok ? r.text : formatError(r.msg));
        }
        if (sub === 'upgrade') {
          const r = dragonUpgrade(sender, args[1]);
          return reply(r.ok ? r.text : formatError(r.msg));
        }
        if (sub === 'heal') {
          const r = dragonHealTown(sender);
          return reply(r.ok ? r.text : formatError(r.msg));
        }
        if (sub === 'reset') {
          const r = dragonReset(sender);
          return reply(r.ok ? r.text : formatError(r.msg));
        }
        return reply(getDragonMenu());
      }

      if (command === 'ownerlike') {
        if (!isOwner) return reply(formatError('Hanya owner.'));
        if ((args[0] || '').toLowerCase() === 'list') {
          const list = listOwnerLikes();
          return reply(formatReply('OWNER-LIKE', list.length ? list.map((n, i) => `${i + 1}. ${n}`).join('\n') : 'Belum ada.'));
        }
        return reply('Gunakan: .ownerlike list');
      }


      if (command === 'ping') {
        const start = Date.now();
        await replyImg(14, `*Pong!*\nLatency: ${Date.now() - start}ms\n${getTime()}`);
        return;
      }
      if (command === 'jam' || command === 'time') {
        await replyImg(6, formatReply('WAKTU SEKARANG', getTime()));
        return;
      }
      if (command === 'calc' || command === 'hitung') {
        if (!text) return reply(formatError('Contoh: .calc 12*8+5'));
        try {
          const sanitized = text.replace(/[^0-9+\-*/().%\s]/g, '');
          const result = Function(`"use strict"; return (${sanitized})`)();
          await replyImg(3, formatReply('KALKULATOR', `Rumus: ${text}\nHasil: *${result}*`));
        } catch {
          return reply(formatError('Rumus tidak valid'));
        }
        return;
      }
      if (command === 'cuaca' || command === 'weather') {
        if (!text) return reply(formatError('Contoh: .cuaca jakarta'));
        await react(sock, msg, '⏰');
        const w = await getWeather(text);
        if (!w) {
          await react(sock, msg, '❌');
          return reply(formatError('Kota tidak ditemukan'));
        }
        const info = `Lokasi: ${w.location}\nSuhu: ${w.temp}°C (terasa ${w.feels}°C)\nCuaca: ${w.desc}\nKelembaban: ${w.humidity}%\nAngin: ${w.wind} km/h`;
        await replyImg(4, formatReply('CUACA', info));
        await react(sock, msg, '✅');
        return;
      }
      if (command === 'runtime' || command === 'uptime') {
        await replyImg(15, formatReply('RUNTIME', getRuntime(startTime)));
        return;
      }
      if (command === 'health' || command === 'status') {
        if (!isOwner) return reply(formatError('Hanya owner.'));
        const mem = process.memoryUsage();
        const info = `Runtime: ${getRuntime(startTime)}\nPlatform: ${os.platform()}\nNode: ${process.version}\nRSS: ${(mem.rss/1024/1024).toFixed(1)}MB\nHeap: ${(mem.heapUsed/1024/1024).toFixed(1)}MB`;
        await replyImg(2, formatReply('BOT HEALTH', info));
        return;
      }

      // ========== AIO ==========
      if (['aio','tiktok','ig','fb','pinterest','yt','youtube'].includes(command)) {
        if (!text || !text.startsWith('http')) return reply(formatError('Kirim link.\nContoh: .aio https://...'));
        const limitCheck = checkLimit(sender, 'download', config.limit.download);
        if (!limitCheck.allowed && !isOwner) return reply(formatError(`Limit download habis (${config.limit.download}/hari)`));

        pendingAio.set(sender, { url: text, time: Date.now() });
        return reply(`*Pilih Kualitas Video*\n\n1. 360p\n2. 480p\n3. 720p\n4. 1080p\n\nBalas dengan *angka saja* (1-4)\nSumber: ${detectSource(text)}\n\n_Timeout 3 menit_`);
      }

      // ========== AIO AUDIO ==========
      if (command === 'aioaudio') {
        if (!text || !text.startsWith('http')) return reply(formatError('Contoh: .aioaudio https://...'));
        const limitCheck = checkLimit(sender, 'download', config.limit.download);
        if (!limitCheck.allowed && !isOwner) return reply(formatError('Limit download habis'));
        await react(sock, msg, '⏰');
        const result = await downloadWithYtDlp(text, { audioOnly: true });
        if (!result.success) {
          await react(sock, msg, '❌');
          await replyImg(9, formatError(result.error));
          return;
        }
        const buffer = fs.readFileSync(result.path);
        const source = detectSource(text);
        const caption = `*Sukses ✅*\n\nLink to sound work!\nNikmati audionya! Dan selamat mendengar!\n\n• Sumber : ${source}\n• Tipe : Audio\n• File : ${result.filename}\n\n_${config.footer}_`;
        await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg', fileName: result.filename }, { quoted: msg });
        await reply(caption);
        await cleanTemp(result.path);
        await react(sock, msg, '✅');
        return;
      }

      if (command === 'mp3' || command === 'tomp3') {
        if (text && text.startsWith('http')) {
          const limitCheck = checkLimit(sender, 'download', config.limit.download);
          if (!limitCheck.allowed && !isOwner) return reply(formatError('Limit download habis'));
          await react(sock, msg, '⏰');
          const result = await downloadWithYtDlp(text, { audioOnly: true });
          if (!result.success) {
            await react(sock, msg, '❌');
            await replyImg(9, formatError(result.error));
            return;
          }
          const buffer = fs.readFileSync(result.path);
          await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg', fileName: result.filename }, { quoted: msg });
          await reply(`*Sukses ✅*\n\nLink to sound work!\nNikmati audionya!\n\n_${config.footer}_`);
          await cleanTemp(result.path);
          await react(sock, msg, '✅');
          return;
        }
        return reply(formatError('Gunakan .aioaudio <link> atau .mp3 <link>'));
      }

      // ========== STICKER ==========
      if (['s', 'sticker', 'stiker', 'tosticker'].includes(command)) {
        let mediaMsg = msg;
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted?.imageMessage || quoted?.videoMessage) mediaMsg = { key: msg.key, message: quoted };
        if (!mediaMsg.message?.imageMessage && !mediaMsg.message?.videoMessage) {
          return reply(formatError('Kirim atau reply *gambar/video* dengan .tosticker'));
        }
        await react(sock, msg, '⏰');
        try {
          const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
          const stickerBuffer = await createSticker(buffer, { pack: config.botName, author: 'Nat🥜' });
          await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
          await react(sock, msg, '✅');
        } catch {
          await react(sock, msg, '❌');
          await replyImg(7, formatError('Gagal membuat sticker'));
        }
        return;
      }

      if (command === 'toimage' || command === 'toimg') {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.stickerMessage) {
          return reply(formatError('Reply *sticker* dengan .toimage'));
        }
        await react(sock, msg, '⏰');
        try {
          const buffer = await downloadMediaMessage({ key: msg.key, message: quoted }, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
          const imgBuffer = await stickerToImage(buffer);
          await sock.sendMessage(from, { image: imgBuffer, caption: '*Sticker → Image*\n\n_' + config.footer + '_' }, { quoted: msg });
          await react(sock, msg, '✅');
        } catch (e) {
          await react(sock, msg, '❌');
          await replyImg(7, formatError('Gagal convert sticker ke gambar'));
        }
        return;
      }


      // ========== VIDEO STICKER ==========
      if (command === 'videosticker' || command === 'vsticker' || command === 'stickervideo') {
        let mediaMsg = msg;
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted?.videoMessage) mediaMsg = { key: msg.key, message: quoted };
        if (!mediaMsg.message?.videoMessage) {
          return reply(formatError('Kirim atau reply *video* dengan .videosticker'));
        }
        await react(sock, msg, '⏰');
        try {
          const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
          const stickerBuffer = await createVideoSticker(buffer, { pack: config.botName, author: 'Nat🥜' });
          await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
          await react(sock, msg, '✅');
        } catch (e) {
          await react(sock, msg, '❌');
          await reply(formatError('Gagal buat video sticker: ' + (e.message || '')));
        }
        return;
      }

      // ========== AUDIO STICKER (video + suara) ==========
      if (command === 'audiosticker' || command === 'ss' || command === 'sounds' || command === 'stickersound') {
        let mediaMsg = msg;
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted?.videoMessage || quoted?.audioMessage) mediaMsg = { key: msg.key, message: quoted };
        if (!mediaMsg.message?.videoMessage && !mediaMsg.message?.audioMessage) {
          return reply(formatError('Kirim/reply *video* (ada suara) dengan .audiosticker'));
        }
        await react(sock, msg, '⏰');
        try {
          const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
          const result = await createSoundSticker(buffer, { pack: config.botName, author: 'Nat🥜' });
          if (result?.sticker) {
            await sock.sendMessage(from, { sticker: result.sticker }, { quoted: msg });
            if (result.audio) {
              await sock.sendMessage(from, { audio: result.audio, mimetype: 'audio/ogg; codecs=opus', ptt: false }, { quoted: msg });
            }
          } else {
            // result is buffer
            await sock.sendMessage(from, { sticker: result }, { quoted: msg });
          }
          await react(sock, msg, '✅');
        } catch (e) {
          await react(sock, msg, '❌');
          await reply(formatError('Gagal buat audio sticker: ' + (e.message || '')));
        }
        return;
      }

      // ========== TEXT STICKER ==========
      if (command === 'textsticker' || command === 'tts' || command === 'stickertext') {
        if (!text) return reply(formatError('Contoh: .textsticker Halo Nuts'));
        await react(sock, msg, '⏰');
        try {
          const stickerBuffer = await createTextSticker(text, { pack: config.botName, author: 'Nat🥜' });
          await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
          await react(sock, msg, '✅');
        } catch (e) {
          await react(sock, msg, '❌');
          await reply(formatError('Gagal buat text sticker: ' + (e.message || '')));
        }
        return;
      }

      if (command === 'tts' || command === 'textsticker') {
        if (!text) return reply(formatError('Contoh: .tts kucing lucu'));
        await react(sock, msg, '⏰');
        try {
          const imgBuffer = await textToImage(text);
          const stickerBuffer = await createSticker(imgBuffer, { pack: config.botName, author: 'Text2Sticker' });
          await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
          await react(sock, msg, '✅');
        } catch {
          await react(sock, msg, '❌');
          await replyImg(7, formatError('Gagal text to sticker'));
        }
        return;
      }

      // ========== VIDEO TO AUDIO ==========
      if (command === 'toaudio' || command === 'tomp3vid') {
        let mediaMsg = msg;
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted?.videoMessage) mediaMsg = { key: msg.key, message: quoted };
        if (!mediaMsg.message?.videoMessage) {
          return reply(formatError('Reply *video* dengan .toaudio'));
        }
        await react(sock, msg, '⏰');
        try {
          const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
          const audioBuffer = await videoToAudio(buffer);
          await sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: 'audio.mp3'
          }, { quoted: msg });
          await reply(`*Sukses ✅*\n\nVideo → Audio berhasil!\n\n_${config.footer}_`);
          await react(sock, msg, '✅');
        } catch (e) {
          await react(sock, msg, '❌');
          await replyImg(9, formatError(e.message || 'Gagal convert video ke audio'));
        }
        return;
      }

      // ========== MEME ==========
      if (command === 'meme') {
        await react(sock, msg, '⏰');
        const meme = await getMeme();
        if (!meme) {
          await react(sock, msg, '❌');
          await replyImg(7, formatError('Gagal mengambil meme'));
          return;
        }
        try {
          await sock.sendMessage(from, {
            image: { url: meme.url },
            caption: `*${meme.title}*\n\nr/${meme.subreddit} • ⬆ ${meme.ups}\n\n_${config.footer}_`
          }, { quoted: msg });
          await react(sock, msg, '✅');
        } catch {
          await react(sock, msg, '❌');
          await replyImg(7, formatError('Gagal kirim meme'));
        }
        return;
      }

      // ========== AI ==========
      if (command === 'ai' || command === 'groq') {
        if (!text) return reply(formatError('Contoh: .ai apa itu gravitasi?'));
        const limitCheck = checkLimit(sender, 'ai', config.limit.ai);
        if (!limitCheck.allowed && !isOwner) return reply(formatError(`Limit AI habis`));
        await react(sock, msg, '⏰');
        try {
          const model = userModels.get(sender) || config.groqModel;
          const response = await chatGroq(text, model);
          await reply(formatAIResponse(text, response));
          await react(sock, msg, '✅');
        } catch (e) {
          await react(sock, msg, '❌');
          await replyImg(8, formatError(e.message || 'Gagal AI'));
        }
        return;
      }

      if (command === 'gemini') {
        if (!text) return reply(formatError('Contoh: .gemini jelaskan fotosintesis'));
        const limitCheck = checkLimit(sender, 'ai', config.limit.ai);
        if (!limitCheck.allowed && !isOwner) return reply(formatError('Limit AI habis'));
        await react(sock, msg, '⏰');
        try {
          const response = await chatGemini(text);
          await reply(formatAIResponse(text, response));
          await react(sock, msg, '✅');
        } catch (e) {
          await react(sock, msg, '❌');
          await replyImg(8, formatError(e.message || 'Gagal Gemini'));
        }
        return;
      }

      if (command === 'kenyataan' || command === 'truthcheck') {
        if (!text) return reply(formatError('Contoh: .kenyataan Bumi itu bulat?'));
        const limitCheck = checkLimit(sender, 'ai', config.limit.ai);
        if (!limitCheck.allowed && !isOwner) return reply(formatError('Limit AI habis'));
        await react(sock, msg, '⏰');
        try {
          const prompt = `Analisis pernyataan berikut secara objektif dan ilmiah. Berikan penjelasan singkat lalu berikan persentase keaslian/kebenaran (0-100%).\n\nPernyataan: "${text}"\n\nFormat jawaban:\nPenjelasan: ...\nKeaslian: XX%`;
          const response = await chatGroq(prompt, config.groqModel);
          await reply(formatAIResponse(text, response));
          await react(sock, msg, '✅');
        } catch (e) {
          await react(sock, msg, '❌');
          await replyImg(8, formatError(e.message || 'Gagal menganalisis'));
        }
        return;
      }

      if ((command === 'vision' || command === 'aiimg') && isOwner) {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.imageMessage) return reply(formatError('Reply gambar dengan .vision <prompt>'));
        await react(sock, msg, '⏰');
        try {
          const buffer = await downloadMediaMessage({ key: msg.key, message: quoted }, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
          const prompt = text || 'Jelaskan gambar ini secara detail.';
          const response = await visionGemini(buffer, prompt);
          await reply(formatAIResponse(prompt, response));
          await react(sock, msg, '✅');
        } catch (e) {
          await react(sock, msg, '❌');
          await replyImg(8, formatError(e.message || 'Gagal vision'));
        }
        return;
      }

      if (command === 'model') {
        if (!text) {
          let list = 'Model Groq:\n';
          availableModels.groq.forEach((m, i) => list += `${i+1}. ${m.name}\n`);
          list += '\nModel Gemini:\n';
          availableModels.gemini.forEach((m, i) => list += `${i+1}. ${m.name}\n`);
          return reply(formatReply('MODEL AI', list));
        }
        const all = [...availableModels.groq, ...availableModels.gemini];
        const found = all.find(m => m.id.includes(text) || m.name.toLowerCase().includes(text.toLowerCase()));
        if (found) {
          userModels.set(sender, found.id);
          return reply(formatSuccess(`Model diganti ke ${found.name}`));
        }
        return reply(formatError('Model tidak ditemukan'));
      }

      // ========== FISHING SIMULATOR (teks saja) ==========
      if (command === 'fishingsimulator' || command === 'fishing') {
        const action = (args[0] || '').toLowerCase();
        if (!action || action === 'menu' || action === 'mulai' || action === 'start') {
          const r = startFishing(sender);
          return reply(r.ok ? r.text : formatError(r.msg));
        }
        if (action === 'tarik' || action === 'pull' || action === 'lepas' || action === 'release') {
          const r = fishAction(sender, action === 'pull' ? 'tarik' : (action === 'release' ? 'lepas' : action));
          return reply(r.ok ? r.text : formatError(r.msg));
        }
        return reply(getFishingMenu());
      }

      if (command === 'repeatfishingsimulator' || command === 'repeatfishing') {
        resetFishing(sender);
        const r = startFishing(sender);
        return reply(r.ok ? ('*Permainan diulang!*

' + r.text) : formatError(r.msg));
      }

      // ========== MONOPOLY ==========
      if (command === 'monopoly') {
        const action = (args[0] || 'menu').toLowerCase();

        if (action === 'mulai' || action === 'start') {
          const res = startMonopoly(sender);
          if (res.already) {
            return reply(getMonopolyMenu(res.state));
          }
          return reply(`*MONOPOLY MINI DIMULAI*\n\nModal awal: Rp1500\n\n` + getMonopolyMenu(res.state));
        }

        if (action === 'menu' || !args[0]) {
          let state = null;
          const res = startMonopoly(sender);
          state = res.state;
          return reply(getMonopolyMenu(state));
        }

        const res = monopolyAction(sender, action);
        if (res.error) return reply(formatError(res.error));
        if (res.type === 'buyable') {
          return reply(formatReply('PROPERI TERSEDIA', `Kamu di *${res.place}*\nHarga: Rp${res.price}\nDadu: ${res.dice}\n\nKetik *.monopoly buy* untuk membeli\natau *.monopoly roll* untuk lanjut.`));
        }
        if (res.type === 'menu') {
          return reply(getMonopolyMenu(res.state));
        }
        if (res.type === 'end') {
          return reply(formatReply('PERMAINAN SELESAI', `Uang akhir: Rp${res.money}\nJumlah properti: ${res.properties}`));
        }
        if (res.type === 'event') {
          return reply(formatReply('MONOPOLY', res.msg));
        }
        return;
      }

      // ========== GROUP GAMES ==========
      const gameTypes = ['badut','bodoh','pintar','ganteng','jelek','kaya','miskin','toxic','bucin','goblok'];
      if (gameTypes.includes(command)) {
        if (!isGroup) return reply(formatError('Hanya di grup'));
        const limitCheck = checkLimit(sender, 'game', config.limit.game);
        if (!limitCheck.allowed && !isOwner) return reply(formatError('Limit game habis'));
        try {
          const meta = await sock.groupMetadata(from);
          const result = randomMemberGame(meta.participants, command);
          if (!result) return reply(formatError('Tidak ada member'));
          await sock.sendMessage(from, {
            text: `${result.title}\n\n@${result.jid.split('@')[0]}\n\n_${config.footer}_`,
            mentions: [result.jid]
          }, { quoted: msg });
        } catch {
          await replyImg(7, formatError('Gagal menjalankan game'));
        }
        return;
      }

      if (command === 'truth' || command === 'dare') {
        return reply(formatReply(command.toUpperCase(), truthOrDare(command)));
      }

      // ========== OTHER TOOLS ==========
      if (command === 'short' || command === 'shortlink') {
        if (!text) return reply(formatError('Contoh: .short https://example.com'));
        await react(sock, msg, '⏰');
        const short = await shortUrl(text);
        if (!short) {
          await react(sock, msg, '❌');
          return reply(formatError('Gagal membuat shortlink'));
        }
        await reply(formatReply('SHORTLINK', short));
        await react(sock, msg, '✅');
        return;
      }

      if (command === 'quote') {
        const quotes = [
          'Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.',
          'Jangan takut gagal. Takutlah tidak mencoba.',
          'Waktu yang hilang tidak akan pernah kembali.'
        ];
        await replyImg(16, formatReply('QUOTE', quotes[Math.floor(Math.random()*quotes.length)]));
        return;
      }

      if (command === 'fakta') {
        const fakta = [
          'Octopus memiliki tiga jantung.',
          'Madu tidak pernah basi.',
          'Kuku jari tumbuh lebih cepat daripada kuku kaki.'
        ];
        await replyImg(17, formatReply('FAKTA', fakta[Math.floor(Math.random()*fakta.length)]));
        return;
      }

      // ========== ADMIN ==========
      if (command === 'kick') {
        if (!isGroup || !isAdmin || !isBotAdmin) return reply(formatError('Butuh admin + bot admin'));
        let target = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                     msg.message.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply(formatError('Tag atau reply user.'));
        try {
          await sock.groupParticipantsUpdate(from, [target], 'remove');
          return reply(formatSuccess(`Berhasil mengeluarkan @${target.split('@')[0]}`));
        } catch {
          return reply(formatError('Gagal kick'));
        }
      }

      if (command === 'promote' || command === 'demote') {
        if (!isGroup || !isAdmin || !isBotAdmin) return reply(formatError('Butuh admin + bot admin'));
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentioned?.length) return reply(formatError(`Tag user.`));
        await sock.groupParticipantsUpdate(from, mentioned, command);
        return reply(formatSuccess(`Berhasil ${command}`));
      }

      if (command === 'hidetag' || command === 'htag') {
        if (!isGroup || !isAdmin) return reply(formatError('Hanya admin'));
        const meta = await sock.groupMetadata(from);
        await sock.sendMessage(from, { text: text || 'Hidetag', mentions: meta.participants.map(p => p.id) });
        return;
      }

      if (command === 'aktif' || command === 'palingaktif') {
        if (!isGroup) return reply(formatError('Hanya di grup'));
        const entries = [];
        for (const [key, count] of messageCount.entries()) {
          if (key.startsWith(from + '_')) entries.push({ jid: key.split('_')[1], count });
        }
        entries.sort((a,b) => b.count - a.count);
        const top = entries.slice(0, 10);
        if (!top.length) return reply(formatError('Belum ada data'));
        let t = 'Top 10 paling aktif:\n\n';
        top.forEach((u,i) => t += `${i+1}. @${u.jid.split('@')[0]} — ${u.count}\n`);
        return sock.sendMessage(from, { text: formatReply('USER PALING AKTIF', t), mentions: top.map(u => u.jid) }, { quoted: msg });
      }

      if (command === 'groupinfo' || command === 'ginfo') {
        if (!isGroup) return reply(formatError('Hanya di grup'));
        const meta = await sock.groupMetadata(from);
        const info = `Nama: ${meta.subject}\nMember: ${meta.participants.length}\nAdmin: ${meta.participants.filter(p=>p.admin).length}`;
        return reply(formatReply('INFO GRUP', info));
      }

      if (command === 'listadmin') {
        if (!isGroup) return reply(formatError('Hanya di grup'));
        const meta = await sock.groupMetadata(from);
        const admins = meta.participants.filter(p => p.admin);
        let t = admins.map((a,i) => `${i+1}. @${a.id.split('@')[0]}`).join('\n');
        return sock.sendMessage(from, { text: formatReply('DAFTAR ADMIN', t || 'Tidak ada'), mentions: admins.map(a => a.id) }, { quoted: msg });
      }

      if (command === 'stats') {
        if (!isOwner) return reply(formatError('Hanya owner.'));
        const total = Array.from(messageCount.values()).reduce((a,b)=>a+b,0);
        return reply(formatReply('STATS', `Total pesan: ${total}\nUser aktif: ${messageCount.size}`));
      }

    
      // ========== HIBURAN API ==========
      if (command === 'quote' || command === 'quotes') {
        await react(sock, msg, '⏰');
        const q = await getQuote();
        if (!q) {
          await react(sock, msg, '❌');
          return reply(formatError('Gagal ambil quote'));
        }
        await reply(formatReply('QUOTE', `"${q.content}"\n\n— ${q.author}`));
        await react(sock, msg, '✅');
        return;
      }

      if (command === 'fakta' || command === 'fact') {
        await react(sock, msg, '⏰');
        const f = await getFact();
        if (!f) {
          await react(sock, msg, '❌');
          return reply(formatError('Gagal ambil fakta'));
        }
        await reply(formatReply('FAKTA', f));
        await react(sock, msg, '✅');
        return;
      }

      if (command === 'joke' || command === 'jokes') {
        await react(sock, msg, '⏰');
        const j = await getJoke();
        if (!j) {
          await react(sock, msg, '❌');
          return reply(formatError('Gagal ambil joke'));
        }
        await reply(formatReply('JOKE', j));
        await react(sock, msg, '✅');
        return;
      }

      if (command === 'dog' || command === 'anjing') {
        await react(sock, msg, '⏰');
        const url = await getDog();
        if (!url) {
          await react(sock, msg, '❌');
          return reply(formatError('Gagal ambil gambar anjing'));
        }
        await sock.sendMessage(from, { image: { url }, caption: '🐶 Random Dog\n_' + config.footer + '_' }, { quoted: msg });
        await react(sock, msg, '✅');
        return;
      }

      if (command === 'cat' || command === 'kucing') {
        await react(sock, msg, '⏰');
        const url = await getCat();
        if (!url) {
          await react(sock, msg, '❌');
          return reply(formatError('Gagal ambil gambar kucing'));
        }
        await sock.sendMessage(from, { image: { url }, caption: '🐱 Random Cat\n_' + config.footer + '_' }, { quoted: msg });
        await react(sock, msg, '✅');
        return;
      }

      if (command === 'negara' || command === 'country') {
        if (!text) return reply(formatError('Contoh: .negara indonesia'));
        await react(sock, msg, '⏰');
        const c = await getCountry(text);
        if (!c) {
          await react(sock, msg, '❌');
          return reply(formatError('Negara tidak ditemukan'));
        }
        const info = `${c.flag || ''} *${c.name}*\nResmi: ${c.official}\nIbu kota: ${c.capital}\nWilayah: ${c.region}\nPopulasi: ${c.population}\nMata uang: ${c.currencies}`;
        await reply(formatReply('NEGARA', info));
        await react(sock, msg, '✅');
        return;
      }

      if (command === 'kurs' || command === 'currency') {
        await react(sock, msg, '⏰');
        const base = (text || 'USD').toUpperCase();
        const k = await getKurs(base);
        if (!k) {
          await react(sock, msg, '❌');
          return reply(formatError('Gagal ambil kurs'));
        }
        const rates = k.rates || {};
        const pick = ['IDR', 'EUR', 'JPY', 'SGD', 'MYR', 'GBP', 'AUD'];
        let body = `Base: ${k.base} • ${k.date}\n\n`;
        for (const code of pick) {
          if (rates[code] != null) body += `• ${code}: ${rates[code]}\n`;
        }
        await reply(formatReply('KURS', body.trim()));
        await react(sock, msg, '✅');
        return;
      }


    

      // ========== TRANSLATE ==========
      if (command === 'translate' || command === 'tr' || command === 'terjemah') {
        if (!text) {
          await replyImg(4, getTranslateMenu());
          return;
        }
        // .translate en Api  atau .translate Api (default en)
        const parts = text.trim().split(/\s+/);
        let langKey = 'english';
        let src = text;
        const maybe = resolveLang(parts[0]);
        if (maybe && parts.length > 1) {
          langKey = parts[0];
          src = parts.slice(1).join(' ');
        }
        // reply message as source?
        if ((!src || src === text && !maybe) && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          const q = msg.message.extendedTextMessage.contextInfo.quotedMessage;
          src = q.conversation || q.extendedTextMessage?.text || src;
        }
        try {
          await react(sock, msg, '🌐');
          const result = await translateText(src, langKey);
          return reply(formatTranslateResult(src, result));
        } catch (e) {
          return reply(formatError(e.message));
        }
      }

      // .toenglish, .tojapan, dll
      if (command.startsWith('to') && command.length > 2 && resolveLang(command)) {
        let src = text || '';
        if (!src && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          const q = msg.message.extendedTextMessage.contextInfo.quotedMessage;
          src = q.conversation || q.extendedTextMessage?.text || '';
        }
        if (!src) return reply(formatError('Kirim teks atau reply pesan.\nContoh: .toenglish Api'));
        try {
          await react(sock, msg, '🌐');
          const result = await translateText(src, command);
          return reply(formatTranslateResult(src, result));
        } catch (e) {
          return reply(formatError(e.message));
        }
      }

      // ========== MINI GAMES ==========
      if (command === 'suit' || command === 'rps') {
        const res = playSuit(text);
        if (!res.ok) return reply(formatError(res.msg));
        return reply(res.text);
      }

      if (command === 'tebakangka' || command === 'angka') {
        const sub = (text || '').trim().toLowerCase();
        if (sub === 'stop' || sub === 'batal') {
          if (stopTebakAngka(sender)) return reply(formatSuccess('Sesi tebak angka dihentikan.'));
          return reply(formatError('Tidak ada sesi.'));
        }
        return reply(startTebakAngka(sender));
      }

      if (command === 'slot' || command === 'slots') {
        return reply(playSlot());
      }

      // ========== TEBAK-TEBAKAN ==========
      if (command === 'tebak' || command === 'tebaktebakan' || command === 'quiz') {
        const sub = (text || '').trim().toLowerCase();
        if (!sub || sub === 'menu' || sub === 'help') {
          return reply(getQuizMenu());
        }
        if (sub === 'stop' || sub === 'batal') {
          if (stopQuiz(sender)) return reply(formatSuccess('Sesi tebak dibatalkan.'));
          return reply(formatError('Tidak ada sesi aktif.'));
        }
        if (sub === 'rank' || sub === 'gelar' || sub === 'title') {
          const t = getTitle(sender);
          return reply(formatReply('GELAR', `Kamu: *${t}*\n\nLulus Nightmare (≥20/25) untuk dapat *The Genius 🎓*`));
        }
        const res = startQuiz(sender, sub);
        if (!res.ok) return reply(formatError(res.msg));
        return reply(res.text);
      }

    } catch (err) {
      console.error(err);
      await react(sock, msg, '❌');
      await reply(formatError(err.message || 'Terjadi kesalahan'));
    }
  });

  // Hapus gelar jika member keluar grup
  sock.ev.on('group-participants.update', async (update) => {
    try {
      if (update.action === 'remove' || update.action === 'leave') {
        for (const p of (update.participants || [])) {
          clearTitle(p);
        }
      }
    } catch {}
  });

}

startBot().catch(err => console.error('Gagal start:', err));
