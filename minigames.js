/**
 * Mini games: suit, tebak angka, slot
 */

const numberSessions = new Map(); // userId -> { target, tries }

export function playSuit(choice) {
  const map = {
    batu: 'batu', b: 'batu', rock: 'batu',
    gunting: 'gunting', g: 'gunting', scissors: 'gunting',
    kertas: 'kertas', k: 'kertas', paper: 'kertas'
  };
  const emoji = { batu: '✊', gunting: '✌️', kertas: '✋' };
  const user = map[String(choice || '').toLowerCase().trim()];
  if (!user) {
    return { ok: false, msg: 'Pilih: batu / gunting / kertas\nContoh: .suit batu' };
  }
  const opts = ['batu', 'gunting', 'kertas'];
  const bot = opts[Math.floor(Math.random() * 3)];
  let hasil = 'Seri 🤝';
  if (user === bot) hasil = 'Seri 🤝';
  else if (
    (user === 'batu' && bot === 'gunting') ||
    (user === 'gunting' && bot === 'kertas') ||
    (user === 'kertas' && bot === 'batu')
  ) hasil = 'Kamu Menang! 🎉';
  else hasil = 'Kamu Kalah 😢';

  return {
    ok: true,
    text: `╭───『 SUIT ✊ 』
│
│ Kamu : ${emoji[user]} ${user}
│ Bot  : ${emoji[bot]} ${bot}
│
│ Hasil: *${hasil}*
╰──────────────`
  };
}

export function startTebakAngka(userId) {
  const target = Math.floor(Math.random() * 100) + 1;
  numberSessions.set(userId, { target, tries: 0 });
  return `╭───『 TEBAK ANGKA 🔢 』
│
│ Aku sudah memilih angka 1–100.
│ Tebak angkanya!
│
│ Ketik angka saja (tanpa prefix)
│ atau .tebakangka stop
╰──────────────`;
}

export function guessAngka(userId, num) {
  const s = numberSessions.get(userId);
  if (!s) return { ok: false, msg: 'Tidak ada sesi. Ketik .tebakangka dulu.' };
  const n = parseInt(num, 10);
  if (isNaN(n) || n < 1 || n > 100) {
    return { ok: false, msg: 'Masukkan angka 1–100.' };
  }
  s.tries++;
  if (n === s.target) {
    numberSessions.delete(userId);
    return {
      ok: true,
      done: true,
      text: `╭───『 TEBAK ANGKA 🔢 』
│
│ ✅ Benar! Angkanya *${s.target}*
│ Percobaan: ${s.tries}
│
│ Ketik .tebakangka untuk main lagi.
╰──────────────`
    };
  }
  const hint = n < s.target ? 'lebih besar ⬆️' : 'lebih kecil ⬇️';
  return {
    ok: true,
    done: false,
    text: `╭───『 TEBAK ANGKA 🔢 』
│
│ ❌ Salah. Coba yang *${hint}*
│ Percobaan: ${s.tries}
╰──────────────`
  };
}

export function stopTebakAngka(userId) {
  if (!numberSessions.has(userId)) return false;
  numberSessions.delete(userId);
  return true;
}

export function hasAngkaSession(userId) {
  return numberSessions.has(userId);
}

export function playSlot() {
  const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
  const a = symbols[Math.floor(Math.random() * symbols.length)];
  const b = symbols[Math.floor(Math.random() * symbols.length)];
  const c = symbols[Math.floor(Math.random() * symbols.length)];
  let hasil = 'Coba lagi 😅';
  if (a === b && b === c) {
    if (a === '7️⃣' || a === '💎') hasil = 'JACKPOT!!! 💰💰💰';
    else hasil = 'Menang! 🎉';
  } else if (a === b || b === c || a === c) {
    hasil = 'Hampir! ✨';
  }
  return `╭───『 SLOT 🎰 』
│
│  ┌─────────┐
│  │ ${a} │ ${b} │ ${c} │
│  └─────────┘
│
│ ${hasil}
╰──────────────`;
}
