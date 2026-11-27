const fishingSessions = new Map();
const monopolySessions = new Map();

const FISH_LIST = [
  { name: 'Ikan Kecil', min: 5, max: 25, rarity: 'common' },
  { name: 'Ikan Mas', min: 40, max: 90, rarity: 'common' },
  { name: 'Tenggiri', min: 120, max: 280, rarity: 'uncommon' },
  { name: 'Kakap Merah', min: 250, max: 550, rarity: 'rare' },
  { name: 'Tuna', min: 450, max: 950, rarity: 'rare' },
  { name: 'Hiu Kecil', min: 900, max: 1800, rarity: 'epic' },
  { name: 'Legenda Laut', min: 2500, max: 6000, rarity: 'legendary' }
];

export function getFishingMenu(state) {
  if (!state) {
    return `╭─「 FISHING SIMULATOR 」
│
│ Kamu belum mulai petualangan.
│
│ Ketik:
│ .fishingsimulator mulai
│
╰─`;
  }
  return `╭─「 FISHING SIMULATOR 」
│ Uang     : Rp${state.money}
│ Level    : ${state.level}
│ Exp      : ${state.exp}/${state.level * 100}
│ Joran    : ${state.rod}
│ Lokasi   : ${state.location}
│ Ikan     : ${state.fishCaught}
│ Nyawa    : ${state.hp}/100
│
├── AKSI
│ .fishingsimulator cast
│ .fishingsimulator status
│ .fishingsimulator shop
│ .fishingsimulator buyrod
│ .fishingsimulator sail
│ .fishingsimulator heal
│ .fishingsimulator rest
│
├── LAINNYA
│ .fishingsimulator cerita
│ .repeatfishingsimulator
│
╰─`;
}

export function startFishing(userId) {
  if (fishingSessions.has(userId)) {
    return { already: true, state: fishingSessions.get(userId) };
  }
  const state = {
    money: 500,
    level: 1,
    exp: 0,
    rod: 'Bambu',
    fishCaught: 0,
    location: 'Pantai',
    hp: 100,
    alive: true,
    story: 0, // progress cerita
    ending: null
  };
  fishingSessions.set(userId, state);
  return { already: false, state };
}

export function fishAction(userId, action) {
  const state = fishingSessions.get(userId);
  if (!state) return { error: 'Kamu belum mulai. Ketik .fishingsimulator mulai' };
  if (!state.alive) {
    return { 
      type: 'dead', 
      ending: state.ending || 'Kamu sudah kalah.',
      msg: state.ending || 'Permainan berakhir. Ketik .repeatfishingsimulator untuk mengulang.'
    };
  }

  if (action === 'status' || action === 'menu') {
    return { type: 'menu', state };
  }

  if (action === 'cast') {
    // Event buruk
    const roll = Math.random();
    if (roll < 0.07) {
      state.alive = false;
      state.ending = 'ENDING 1: Dimakan Hiu\n\nSaat kamu sedang menarik ikan besar, tiba-tiba hiu muncul dari kedalaman. Kamu sempat berteriak, tapi sudah terlambat. Lautan menelanmu selamanya.';
      fishingSessions.set(userId, state);
      return { type: 'ending', ending: state.ending };
    }
    if (roll < 0.13) {
      state.money = Math.max(0, state.money - 250);
      state.hp -= 20;
      if (state.money <= 0 || state.hp <= 0) {
        state.alive = false;
        state.ending = 'ENDING 2: Bangkrut & Luka Parah\n\nOmbak besar merusak perahu dan semua hasil tangkapanmu hilang. Uang habis, tubuh penuh luka. Kamu terdampar di pantai tanpa apa-apa.';
        fishingSessions.set(userId, state);
        return { type: 'ending', ending: state.ending };
      }
      return { type: 'event', msg: 'Ombak besar menghantam! Kamu kehilangan Rp250 dan terluka (-20 HP).' };
    }

    // Catch
    const rarityRoll = Math.random() + (state.rod === 'Carbon Pro' ? 0.12 : 0) + (state.location === 'Laut Dalam' ? 0.1 : 0);
    let pool = FISH_LIST.filter(f => f.rarity === 'common');
    if (rarityRoll > 0.55) pool = FISH_LIST.filter(f => ['common','uncommon'].includes(f.rarity));
    if (rarityRoll > 0.80) pool = FISH_LIST.filter(f => ['uncommon','rare'].includes(f.rarity));
    if (rarityRoll > 0.93) pool = FISH_LIST.filter(f => ['rare','epic'].includes(f.rarity));
    if (rarityRoll > 0.98) pool = FISH_LIST.filter(f => f.rarity === 'legendary');

    const fish = pool[Math.floor(Math.random() * pool.length)];
    const value = Math.floor(Math.random() * (fish.max - fish.min + 1)) + fish.min;
    state.money += value;
    state.fishCaught += 1;
    state.exp += 12 + Math.floor(value / 40);
    state.story += 1;

    if (state.exp >= state.level * 100) {
      state.level += 1;
      state.exp = 0;
      state.hp = Math.min(100, state.hp + 15);
    }

    // Ending 3: Legenda
    if (state.fishCaught >= 25 && state.level >= 5 && state.money >= 8000) {
      state.alive = false;
      state.ending = 'ENDING 3: Raja Lautan\n\nSetelah bertahun-tahun mengarungi lautan, namamu dihormati seluruh nelayan. Kamu membangun kapal besar dan menjadi legenda. Lautan kini milikmu.';
      fishingSessions.set(userId, state);
      return { type: 'ending', ending: state.ending, fish: fish.name, value };
    }

    fishingSessions.set(userId, state);
    return { type: 'catch', fish: fish.name, value, state };
  }

  if (action === 'shop') {
    return { type: 'shop', state };
  }

  if (action === 'buyrod') {
    if (state.rod === 'Carbon Pro') return { type: 'event', msg: 'Kamu sudah punya joran terbaik.' };
    if (state.money < 800) return { type: 'event', msg: 'Uang tidak cukup (butuh Rp800).' };
    state.money -= 800;
    state.rod = 'Carbon Pro';
    fishingSessions.set(userId, state);
    return { type: 'event', msg: 'Berhasil membeli Joran Carbon Pro! Chance ikan langka meningkat.' };
  }

  if (action === 'sail') {
    if (state.level < 3) return { type: 'event', msg: 'Level minimal 3 untuk berlayar ke Laut Dalam.' };
    state.location = state.location === 'Pantai' ? 'Laut Dalam' : 'Pantai';
    fishingSessions.set(userId, state);
    return { type: 'event', msg: `Kamu berlayar ke *${state.location}*.` };
  }

  if (action === 'heal') {
    if (state.money < 150) return { type: 'event', msg: 'Uang tidak cukup untuk obat (Rp150).' };
    if (state.hp >= 100) return { type: 'event', msg: 'HP sudah penuh.' };
    state.money -= 150;
    state.hp = Math.min(100, state.hp + 40);
    fishingSessions.set(userId, state);
    return { type: 'event', msg: `Kamu berobat. HP sekarang ${state.hp}/100.` };
  }

  if (action === 'rest') {
    state.hp = Math.min(100, state.hp + 10);
    fishingSessions.set(userId, state);
    return { type: 'event', msg: `Kamu beristirahat sejenak. HP +10 (sekarang ${state.hp}/100).` };
  }

  if (action === 'cerita') {
    const stories = [
      'Kamu masih pemula di pantai. Lautan terasa luas dan menakutkan.',
      'Beberapa ikan sudah masuk keranjang. Semangatmu mulai tumbuh.',
      'Kamu mulai dikenal nelayan lokal. Mereka bilang kamu punya bakat.',
      'Badai pernah nyaris menenggelamkanmu, tapi kamu bertahan.',
      'Kamu bermimpi menjadi legenda yang namanya dikenang selamanya.'
    ];
    const idx = Math.min(Math.floor(state.story / 5), stories.length - 1);
    return { type: 'event', msg: `*Cerita saat ini:*\n${stories[idx]}` };
  }

  return { error: 'Aksi tidak dikenal. Ketik .fishingsimulator untuk melihat menu.' };
}

export function resetFishing(userId) {
  fishingSessions.delete(userId);
  return true;
}

// ==================== MONOPOLY ====================
const BOARD = [
  'Start', 'Jakarta', 'Chance', 'Bandung', 'Pajak', 'Surabaya',
  'Penjara', 'Medan', 'Chance', 'Makassar', 'Yogyakarta', 'Bali',
  'Parkir Bebas', 'Semarang', 'Chance', 'Palembang', 'Pajak', 'Manado'
];

export function getMonopolyMenu(state) {
  if (!state) {
    return `╭─「 MONOPOLY MINI 」
│
│ Kamu belum mulai permainan.
│
│ Ketik:
│ .monopoly mulai
│
╰─`;
  }
  const pos = BOARD[state.position] || 'Unknown';
  return `╭─「 MONOPOLY MINI 」
│ Posisi   : ${pos}
│ Uang     : Rp${state.money}
│ Properti : ${state.properties.length}
│ Giliran  : ${state.turns}
│
├── AKSI
│ .monopoly roll
│ .monopoly buy
│ .monopoly status
│ .monopoly properti
│ .monopoly end
│
╰─`;
}

export function startMonopoly(userId) {
  if (monopolySessions.has(userId)) {
    return { already: true, state: monopolySessions.get(userId) };
  }
  const state = {
    position: 0,
    money: 1500,
    properties: [],
    turns: 0,
    inJail: false
  };
  monopolySessions.set(userId, state);
  return { already: false, state };
}

export function monopolyAction(userId, action) {
  const state = monopolySessions.get(userId);
  if (!state) return { error: 'Belum mulai. Ketik .monopoly mulai' };

  if (action === 'status' || action === 'menu') {
    return { type: 'menu', state };
  }

  if (action === 'properti') {
    const list = state.properties.length ? state.properties.join(', ') : 'Belum punya properti';
    return { type: 'event', msg: `Properti milikmu:\n${list}` };
  }

  if (action === 'roll') {
    if (state.inJail) {
      state.inJail = false;
      monopolySessions.set(userId, state);
      return { type: 'event', msg: 'Kamu keluar dari penjara. Lempar dadu lagi di giliran berikutnya.' };
    }
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const dice = d1 + d2;
    state.position = (state.position + dice) % BOARD.length;
    state.turns += 1;
    const place = BOARD[state.position];

    if (place === 'Pajak') {
      state.money -= 150;
      monopolySessions.set(userId, state);
      return { type: 'event', msg: `Mendarat di Pajak. Bayar Rp150.\nDadu: ${d1}+${d2}=${dice}\nUang: Rp${state.money}` };
    }
    if (place === 'Penjara') {
      state.inJail = true;
      monopolySessions.set(userId, state);
      return { type: 'event', msg: `Kamu masuk Penjara! Skip 1 giliran.\nDadu: ${dice}` };
    }
    if (place === 'Chance') {
      if (Math.random() < 0.5) {
        state.money += 200;
        monopolySessions.set(userId, state);
        return { type: 'event', msg: `Chance bagus! Dapat Rp200.\nPosisi: ${place}\nUang: Rp${state.money}` };
      } else {
        state.money -= 100;
        monopolySessions.set(userId, state);
        return { type: 'event', msg: `Chance buruk! Bayar Rp100.\nPosisi: ${place}\nUang: Rp${state.money}` };
      }
    }
    if (place === 'Start' || place === 'Parkir Bebas') {
      if (place === 'Start') state.money += 200;
      monopolySessions.set(userId, state);
      return { type: 'event', msg: `Mendarat di ${place}.${place === 'Start' ? ' Dapat Rp200!' : ''}\nUang: Rp${state.money}` };
    }

    // Property
    if (!state.properties.includes(place)) {
      const price = 180 + state.position * 35;
      monopolySessions.set(userId, state);
      return { type: 'buyable', place, price, dice, state };
    }
    monopolySessions.set(userId, state);
    return { type: 'event', msg: `Mendarat di ${place} (sudah milikmu).\nDadu: ${dice}\nUang: Rp${state.money}` };
  }

  if (action === 'buy') {
    const place = BOARD[state.position];
    if (['Start','Chance','Pajak','Penjara','Parkir Bebas'].includes(place)) {
      return { type: 'event', msg: 'Lokasi ini tidak bisa dibeli.' };
    }
    if (state.properties.includes(place)) return { type: 'event', msg: 'Sudah kamu miliki.' };
    const price = 180 + state.position * 35;
    if (state.money < price) return { type: 'event', msg: `Uang tidak cukup. Butuh Rp${price}.` };
    state.money -= price;
    state.properties.push(place);
    monopolySessions.set(userId, state);
    return { type: 'event', msg: `Berhasil beli *${place}* seharga Rp${price}!\nUang sisa: Rp${state.money}` };
  }

  if (action === 'end') {
    const finalMoney = state.money;
    const props = state.properties.length;
    monopolySessions.delete(userId);
    return { type: 'end', money: finalMoney, properties: props };
  }

  return { error: 'Aksi tidak dikenal. Ketik .monopoly untuk melihat menu.' };
}

export function randomMemberGame(participants, type) {
  const members = participants.filter(p => !p.id.includes('status@broadcast') && !p.admin);
  if (!members.length) return null;
  const chosen = members[Math.floor(Math.random() * members.length)];
  const titles = {
    badut: 'Siapa yang paling badut di grup?',
    bodoh: 'Siapa yang paling bodoh di grup?',
    pintar: 'Siapa yang paling pintar di grup?',
    ganteng: 'Siapa yang paling ganteng di grup?',
    jelek: 'Siapa yang paling jelek di grup?',
    kaya: 'Siapa yang paling kaya di grup?',
    miskin: 'Siapa yang paling miskin di grup?',
    toxic: 'Siapa yang paling toxic di grup?',
    bucin: 'Siapa yang paling bucin di grup?',
    goblok: 'Siapa yang paling goblok di grup?'
  };
  return { title: titles[type] || type, jid: chosen.id };
}

export function truthOrDare(type) {
  const truths = [
    'Apa rahasia terbesar yang belum pernah kamu ceritakan ke siapapun di grup ini?',
    'Siapa orang di grup yang paling sering bikin kamu kesal?',
    'Pernah bohong besar ke teman? Ceritakan.'
  ];
  const dares = [
    'Kirim voice note nyanyi 15 detik.',
    'Ganti nama grup jadi nama yang aneh selama 10 menit.',
    'Chat orang random di grup bilang "aku kangen".'
  ];
  if (type === 'truth') return truths[Math.floor(Math.random() * truths.length)];
  return dares[Math.floor(Math.random() * dares.length)];
}
