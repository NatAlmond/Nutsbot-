/**
 * Games: Fishing Simulator + Monopoly Mini + Dragon Roll Simulator
 */
const fishingSessions = new Map();
const monopolySessions = new Map();
const dragonSessions = new Map();

const FISH_LIST = [
  { name: 'Ikan Kecil', emoji: '🐟', rarity: 'common', points: 5, chance: 30 },
  { name: 'Ikan Mas', emoji: '🐠', rarity: 'common', points: 12, chance: 25 },
  { name: 'Ikan Gabus', emoji: '🐡', rarity: 'uncommon', points: 28, chance: 18 },
  { name: 'Ikan Kakap', emoji: '🦈', rarity: 'rare', points: 65, chance: 12 },
  { name: 'Ikan Hiu', emoji: '🦈', rarity: 'rare', points: 90, chance: 8 },
  { name: 'Ikan Naga Laut', emoji: '🐉', rarity: 'legendary', points: 220, chance: 4 },
  { name: 'Sepatu Bot', emoji: '👟', rarity: 'trash', points: -8, chance: 15 },
  { name: 'Kaleng Bekas', emoji: '🥫', rarity: 'trash', points: -5, chance: 12 },
  { name: 'Harta Karun', emoji: '💎', rarity: 'secret', points: 350, chance: 2 }
];

const FISH_ENDINGS = {
  good: 'Kamu jadi nelayan legendaris! Desa menjulukimu *Raja Laut* 🏆',
  bad: 'Kapalmu karam... tapi setidaknya ceritanya seru 💀',
  secret: 'Kamu menemukan *harta karun kuno* di dasar laut! 💰✨'
};

function pickFish() {
  const total = FISH_LIST.reduce((s, f) => s + f.chance, 0);
  let r = Math.random() * total;
  for (const f of FISH_LIST) { r -= f.chance; if (r <= 0) return f; }
  return FISH_LIST[0];
}

export function getFishingMenu() {
  return `╭───『 🎣 FISHING SIMULATOR 』\n│\n│ .mancing → Mulai\n│ .tarik → Tarik pancingan\n│ .lepas → Lepaskan\n│ .resetmancing → Reset\n│\n│ 3 Ending berbeda!\n╰──────────────`;
}

export function startFishing(userId) {
  if (fishingSessions.has(userId)) return { ok: false, msg: 'Sudah memancing. Ketik *.tarik* atau *.lepas*' };
  const fish = pickFish();
  fishingSessions.set(userId, { stage: 'waiting', fish, attempts: 0, start: Date.now() });
  return { ok: true, text: `╭───『 🎣 MULAI MEMANCING 』\n│\n│ Ada sesuatu yang menarik umpan!\n│ Ketik *.tarik* atau *.lepas*\n╰──────────────` };
}

export function fishAction(userId, action) {
  const s = fishingSessions.get(userId);
  if (!s) return { ok: false, msg: 'Belum mulai. Ketik *.mancing*' };
  s.attempts++;
  if (action === 'tarik' || action === 'pull') {
    const elapsed = (Date.now() - s.start) / 1000;
    const difficulty = Math.min(0.55, 0.25 + elapsed * 0.02);
    const success = Math.random() > difficulty;
    fishingSessions.delete(userId);
    if (!success) return { ok: true, text: `╭───『 🎣 GAGAL 』\n│\n│ Ikannya terlalu kuat dan lepas!\n╰──────────────` };
    let ending = 'good';
    if (s.fish.rarity === 'trash') ending = 'bad';
    if (s.fish.rarity === 'secret' || (s.fish.rarity === 'legendary' && Math.random() > 0.55)) ending = 'secret';
    return { ok: true, text: `╭───『 🎣 BERHASIL! 』\n│\n│ ${s.fish.emoji} *${s.fish.name}*\n│ Rarity: ${s.fish.rarity}\n│ Poin: ${s.fish.points > 0 ? '+' : ''}${s.fish.points}\n│\n│ ${FISH_ENDINGS[ending]}\n╰──────────────` };
  }
  if (action === 'lepas' || action === 'release') {
    fishingSessions.delete(userId);
    return { ok: true, text: `╭───『 🎣 DILEPAS 』\n│\n│ Kamu melepas ikan itu kembali ke air.\n╰──────────────` };
  }
  return { ok: false, msg: 'Pakai *.tarik* atau *.lepas*' };
}

export function resetFishing(userId) { fishingSessions.delete(userId); return true; }

export function getMonopolyMenu() {
  return `╭───『 🎲 MONOPOLY MINI 』\n│\n│ .monopoli start\n│ .monopoli roll\n│ .monopoli status\n│ .monopoli stop\n╰──────────────`;
}

export function startMonopoly(groupId, players = []) {
  if (monopolySessions.has(groupId)) return { ok: false, msg: 'Sudah ada game.' };
  if (players.length < 1) return { ok: false, msg: 'Tag minimal 1 pemain.' };
  monopolySessions.set(groupId, {
    players: players.map(p => ({ id: p, money: 1500, pos: 0 })),
    turn: 0,
    board: ['GO', 'Tanah Murah', 'Pajak', 'Stasiun', 'Penjara', 'Hotel', 'Chance', 'Finish']
  });
  return { ok: true, text: `╭───『 🎲 MONOPOLY 』\n│\n│ Pemain: ${players.length}\n│ Ketik *.monopoli roll*\n╰──────────────` };
}

export function monopolyAction(groupId, userId, action) {
  const s = monopolySessions.get(groupId);
  if (!s) return { ok: false, msg: 'Belum ada game. *.monopoli start*' };
  if (action === 'stop') { monopolySessions.delete(groupId); return { ok: true, text: 'Game dihentikan.' }; }
  if (action === 'status') {
    const list = s.players.map((p, i) => `${i+1}. ...${String(p.id).slice(-4)} | 💰${p.money}`).join('\n');
    return { ok: true, text: `Status:\n${list}` };
  }
  if (action === 'roll') {
    const current = s.players[s.turn];
    const dice = Math.floor(Math.random() * 6) + 1;
    current.pos = (current.pos + dice) % s.board.length;
    const tile = s.board[current.pos];
    let extra = '';
    if (tile === 'Pajak') { current.money -= 200; extra = 'Pajak -200'; }
    else if (tile === 'Chance') { const g = Math.random() > 0.5 ? 300 : -150; current.money += g; extra = `Chance ${g>0?'+':''}${g}`; }
    else if (tile === 'Finish') { current.money += 500; extra = 'Finish +500'; }
    s.turn = (s.turn + 1) % s.players.length;
    return { ok: true, text: `╭───『 🎲 ROLL 』\n│\n│ Dadu: ${dice} → ${tile}\n│ ${extra}\n│ Uang: ${current.money}\n╰──────────────` };
  }
  return { ok: false, msg: 'roll / status / stop' };
}

/* ===== DRAGON ROLL SIMULATOR ===== */
const DRAGON_ENEMIES = [
  { id: 'slime', name: 'Slime Hijau', emoji: '🟢', hp: 40, atk: 8, def: 2, exp: 15, gold: 10 },
  { id: 'wolf', name: 'Serigala Hutan', emoji: '🐺', hp: 70, atk: 14, def: 5, exp: 28, gold: 22 },
  { id: 'goblin', name: 'Goblin Bandit', emoji: '👺', hp: 90, atk: 18, def: 7, exp: 40, gold: 35 },
  { id: 'orc', name: 'Orc Warrior', emoji: '👹', hp: 140, atk: 24, def: 12, exp: 65, gold: 55 },
  { id: 'wyvern', name: 'Wyvern Muda', emoji: '🐉', hp: 200, atk: 32, def: 18, exp: 100, gold: 90 },
  { id: 'dragon', name: 'Naga Api Kuno', emoji: '🔥🐉', hp: 380, atk: 48, def: 28, exp: 250, gold: 200 }
];

const SKILLS = [
  { id: 'slash', name: 'Slash', cost: 0, mult: 1.0 },
  { id: 'fire', name: 'Fireball', cost: 8, mult: 1.6 },
  { id: 'heal', name: 'Heal', cost: 12, mult: 0 },
  { id: 'berserk', name: 'Berserk', cost: 15, mult: 2.2 }
];

function createDragonPlayer() {
  return {
    level: 1, exp: 0, expNext: 50,
    hp: 100, maxHp: 100, mp: 30, maxMp: 30,
    atk: 12, def: 6, gold: 20, skillPoints: 0,
    skills: ['slash'], stage: 'town', enemy: null,
    killCount: 0, choices: []
  };
}

function calcDamage(atk, def, mult = 1) {
  const base = Math.max(1, atk - def * 0.6);
  return Math.floor(base * mult * (0.85 + Math.random() * 0.3));
}

export function getDragonMenu() {
  return `╭───『 🐉 DRAGON ROLL 』\n│\n│ .dragon start\n│ .dragon explore\n│ .dragon attack\n│ .dragon skill fire|heal|berserk\n│ .dragon upgrade atk|def|hp|mp\n│ .dragon status / flee / heal / reset\n│\n│ Town → Explore → Battle → Boss\n│ 3 Ending berbeda!\n╰──────────────`;
}

export function dragonStart(userId) {
  if (dragonSessions.has(userId)) return { ok: false, msg: 'Sudah punya karakter. *.dragon status* atau *.dragon reset*' };
  const p = createDragonPlayer();
  dragonSessions.set(userId, p);
  return { ok: true, text: `╭───『 🐉 PETUALANGAN DIMULAI 』\n│\n│ ❤️ HP ${p.hp}/${p.maxHp}\n│ 💙 MP ${p.mp}/${p.maxMp}\n│ ⚔️ ATK ${p.atk}  🛡️ DEF ${p.def}\n│ 💰 ${p.gold} gold\n│\n│ Ketik *.dragon explore*\n╰──────────────` };
}

export function dragonStatus(userId) {
  const p = dragonSessions.get(userId);
  if (!p) return { ok: false, msg: 'Belum mulai. *.dragon start*' };
  return { ok: true, text: `╭───『 🐉 STATUS 』\n│\n│ Level: ${p.level}  EXP: ${p.exp}/${p.expNext}\n│ ❤️ ${p.hp}/${p.maxHp}  💙 ${p.mp}/${p.maxMp}\n│ ⚔️ ${p.atk}  🛡️ ${p.def}  💰 ${p.gold}\n│ Kill: ${p.killCount}  SP: ${p.skillPoints}\n│ Stage: ${p.stage}\n╰──────────────` };
}

export function dragonExplore(userId) {
  const p = dragonSessions.get(userId);
  if (!p) return { ok: false, msg: 'Belum mulai. *.dragon start*' };
  if (p.stage === 'battle' || p.stage === 'boss') return { ok: false, msg: 'Sedang bertarung!' };
  if (p.stage === 'ending') return { ok: false, msg: 'Selesai. *.dragon reset*' };
  if (p.killCount >= 5 && p.level >= 4) {
    p.stage = 'boss';
    const boss = { ...DRAGON_ENEMIES[5] };
    p.enemy = { ...boss, hp: boss.hp };
    return { ok: true, text: `╭───『 🔥 BOSS! 』\n│\n│ *Naga Api Kuno* muncul!\n│ ${boss.emoji} HP: ${boss.hp}\n│\n│ *.dragon attack* atau *.dragon skill fire*\n╰──────────────` };
  }
  const pool = DRAGON_ENEMIES.filter(e => e.id !== 'dragon').slice(0, Math.min(5, 2 + Math.floor(p.level / 2)));
  const enemy = { ...pool[Math.floor(Math.random() * pool.length)] };
  p.enemy = { ...enemy, hp: enemy.hp };
  p.stage = 'battle';
  return { ok: true, text: `╭───『 ⚔️ MUSUH 』\n│\n│ ${enemy.emoji} *${enemy.name}*\n│ HP: ${enemy.hp}  ATK: ${enemy.atk}\n│\n│ *.dragon attack* / *.dragon skill ...* / *.dragon flee*\n╰──────────────` };
}

export function dragonAttack(userId, skillId = 'slash') {
  const p = dragonSessions.get(userId);
  if (!p) return { ok: false, msg: 'Belum mulai.' };
  if (p.stage !== 'battle' && p.stage !== 'boss') return { ok: false, msg: 'Tidak bertarung. *.dragon explore*' };
  const skill = SKILLS.find(s => s.id === skillId) || SKILLS[0];
  if (!p.skills.includes(skill.id) && skill.id !== 'slash') return { ok: false, msg: `Skill *${skill.name}* belum dimiliki.` };
  if (p.mp < skill.cost) return { ok: false, msg: `MP kurang (butuh ${skill.cost}).` };
  p.mp -= skill.cost;
  const log = [];
  if (skill.id === 'heal') {
    const heal = Math.floor(p.maxHp * 0.35);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    log.push(`Heal +${heal} HP`);
  } else {
    let mult = skill.mult;
    if (skill.id === 'berserk' && Math.random() < 0.25) { mult *= 0.5; log.push('Berserk gagal!'); }
    const dmg = calcDamage(p.atk, p.enemy.def, mult);
    p.enemy.hp -= dmg;
    log.push(`*${skill.name}* → ${dmg} dmg`);
  }
  if (p.enemy.hp <= 0) {
    const gainedExp = p.enemy.exp;
    const gainedGold = p.enemy.gold;
    p.killCount++;
    p.exp += gainedExp;
    p.gold += gainedGold;
    p.stage = 'town';
    p.enemy = null;
    let leveled = false;
    while (p.exp >= p.expNext) {
      p.exp -= p.expNext;
      p.level++;
      p.expNext = Math.floor(p.expNext * 1.45);
      p.maxHp += 18; p.hp = p.maxHp;
      p.maxMp += 6; p.mp = p.maxMp;
      p.atk += 3; p.def += 2; p.skillPoints += 1;
      leveled = true;
    }
    if (p.level >= 2 && !p.skills.includes('fire')) p.skills.push('fire');
    if (p.level >= 3 && !p.skills.includes('heal')) p.skills.push('heal');
    if (p.level >= 5 && !p.skills.includes('berserk')) p.skills.push('berserk');
    let extra = leveled ? `\n│ 🎉 LEVEL UP! Lv.${p.level}` : '';
    if (p.killCount >= 5 && p.level >= 4) extra += '\n│ 🔥 Boss siap! *.dragon explore*';
    return { ok: true, text: `╭───『 ⚔️ MENANG! 』\n│\n│ ${log.join('\n│ ')}\n│ +${gainedExp} EXP +${gainedGold} gold\n│ Kill: ${p.killCount}${extra}\n╰──────────────` };
  }
  const edmg = calcDamage(p.enemy.atk, p.def);
  p.hp -= edmg;
  log.push(`${p.enemy.emoji} serang → ${edmg} dmg`);
  if (p.hp <= 0) {
    p.hp = 0; p.stage = 'ending';
    return { ok: true, text: `╭───『 💀 KALAH 』\n│\n│ ${log.join('\n│ ')}\n│\n│ Ending: *Dark Ending*\n│ *.dragon reset* untuk coba lagi\n╰──────────────` };
  }
  return { ok: true, text: `╭───『 ⚔️ BATTLE 』\n│\n│ ${log.join('\n│ ')}\n│\n│ ❤️ ${p.hp}/${p.maxHp}  💙 ${p.mp}/${p.maxMp}\n│ Musuh: ${Math.max(0, p.enemy.hp)} HP\n╰──────────────` };
}

export function dragonFlee(userId) {
  const p = dragonSessions.get(userId);
  if (!p || (p.stage !== 'battle' && p.stage !== 'boss')) return { ok: false, msg: 'Tidak bertarung.' };
  if (p.stage === 'boss') return { ok: false, msg: 'Tidak bisa kabur dari Boss!' };
  if (Math.random() > 0.35) { p.stage = 'town'; p.enemy = null; return { ok: true, text: 'Berhasil kabur!' }; }
  const edmg = calcDamage(p.enemy.atk, p.def);
  p.hp -= edmg;
  if (p.hp <= 0) { p.hp = 0; p.stage = 'ending'; return { ok: true, text: 'Gagal kabur & kalah.\nEnding: Dark\n*.dragon reset*' }; }
  return { ok: true, text: `Gagal kabur! Kena ${edmg}. HP: ${p.hp}/${p.maxHp}` };
}

export function dragonUpgrade(userId, stat) {
  const p = dragonSessions.get(userId);
  if (!p) return { ok: false, msg: 'Belum mulai.' };
  if (p.stage === 'battle' || p.stage === 'boss') return { ok: false, msg: 'Tidak bisa upgrade saat battle.' };
  if (p.skillPoints < 1) return { ok: false, msg: 'Skill Point kurang.' };
  const map = { atk: 'atk', attack: 'atk', def: 'def', defense: 'def', hp: 'maxHp', mp: 'maxMp' };
  const key = map[(stat || '').toLowerCase()];
  if (!key) return { ok: false, msg: '.dragon upgrade atk|def|hp|mp' };
  p.skillPoints--;
  if (key === 'maxHp') { p.maxHp += 25; p.hp += 25; }
  else if (key === 'maxMp') { p.maxMp += 12; p.mp += 12; }
  else p[key] += 4;
  return { ok: true, text: `⬆️ ${key.toUpperCase()} naik! SP sisa: ${p.skillPoints}` };
}

export function dragonHealTown(userId) {
  const p = dragonSessions.get(userId);
  if (!p) return { ok: false, msg: 'Belum mulai.' };
  if (p.stage === 'battle' || p.stage === 'boss') return { ok: false, msg: 'Sedang bertarung!' };
  if (p.gold < 15) return { ok: false, msg: 'Gold kurang (butuh 15).' };
  p.gold -= 15; p.hp = p.maxHp; p.mp = p.maxMp;
  return { ok: true, text: 'Rest di town. HP & MP penuh! -15 gold' };
}

export function dragonReset(userId) {
  dragonSessions.delete(userId);
  return { ok: true, text: 'Karakter direset. *.dragon start*' };
}

export function randomMemberGame() { return 'Fitur random member aktif di grup.'; }
export function truthOrDare(type = 'random') {
  const truths = ['Apa rahasia terbesar yang pernah kamu simpan?', 'Siapa crushmu saat ini?', 'Pernah bohong besar ke orang tua?'];
  const dares = ['Kirim voice note nyanyi 10 detik', 'Ubah foto profil jadi meme 1 jam', 'Chat orang random "aku suka kamu"'];
  if (type === 'truth') return truths[Math.floor(Math.random() * truths.length)];
  if (type === 'dare') return dares[Math.floor(Math.random() * dares.length)];
  return Math.random() > 0.5 ? 'Truth: ' + truths[Math.floor(Math.random() * truths.length)] : 'Dare: ' + dares[Math.floor(Math.random() * dares.length)];
}
