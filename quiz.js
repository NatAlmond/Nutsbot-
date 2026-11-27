/**
 * Game Tebak-Tebakan multi-level
 * easy / normal / hard / nightmare — 25 soal tiap level
 * Lulus nightmare → gelar "The Genius 🎓"
 */

const quizSessions = new Map(); // userId -> session
const titles = new Map();       // userId -> title string

export function getTitle(userId) {
  return titles.get(userId) || 'Member';
}

export function setTitle(userId, title) {
  if (!title || title === 'Member') titles.delete(userId);
  else titles.set(userId, title);
}

export function clearTitle(userId) {
  titles.delete(userId);
}

// 25 soal per tingkat (pilihan ganda A-D)
const BANK = {
  easy: [
    { q: 'Ibu kota Indonesia?', o: ['Jakarta', 'Bandung', 'Surabaya', 'Medan'], a: 0 },
    { q: '2 + 2 = ?', o: ['3', '4', '5', '22'], a: 1 },
    { q: 'Warna bendera Indonesia?', o: ['Merah-Putih', 'Merah-Kuning', 'Biru-Putih', 'Hijau-Putih'], a: 0 },
    { q: 'Hewan yang mengeong?', o: ['Anjing', 'Kucing', 'Sapi', 'Ayam'], a: 1 },
    { q: 'Berapa hari dalam seminggu?', o: ['5', '6', '7', '8'], a: 2 },
    { q: 'Planet tempat kita tinggal?', o: ['Mars', 'Venus', 'Bumi', 'Jupiter'], a: 2 },
    { q: 'Matahari terbit dari arah?', o: ['Barat', 'Timur', 'Utara', 'Selatan'], a: 1 },
    { q: '1 jam berapa menit?', o: ['30', '45', '60', '90'], a: 2 },
    { q: 'Buah berwarna kuning panjang?', o: ['Apel', 'Pisang', 'Jeruk', 'Anggur'], a: 1 },
    { q: 'Alat tulis untuk menulis di kertas?', o: ['Garpu', 'Pensil', 'Sendok', 'Obeng'], a: 1 },
    { q: 'Hewan yang bertelur dan bisa terbang?', o: ['Ikan', 'Burung', 'Ular', 'Kucing'], a: 1 },
    { q: 'Warna daun umumnya?', o: ['Merah', 'Biru', 'Hijau', 'Ungu'], a: 2 },
    { q: 'Berapa sisi segitiga?', o: ['2', '3', '4', '5'], a: 1 },
    { q: 'Air membeku pada suhu?', o: ['100°C', '50°C', '0°C', '25°C'], a: 2 },
    { q: 'Satuan waktu: 60 detik = ?', o: ['1 jam', '1 menit', '1 hari', '1 minggu'], a: 1 },
    { q: 'Hewan laut yang punya tentakel?', o: ['Hiu', 'Gurita', 'Paus', 'Lumba-lumba'], a: 1 },
    { q: 'Benda langit di malam hari yang bersinar?', o: ['Matahari', 'Bintang', 'Awan', 'Pelangi'], a: 1 },
    { q: 'Organ tubuh untuk melihat?', o: ['Telinga', 'Hidung', 'Mata', 'Mulut'], a: 2 },
    { q: 'Minuman dari susu sapi yang difermentasi?', o: ['Teh', 'Kopi', 'Yogurt', 'Soda'], a: 2 },
    { q: 'Alat musik bertali yang dipetik?', o: ['Drum', 'Gitar', 'Terompet', 'Piano'], a: 1 },
    { q: 'Negara dengan menara Eiffel?', o: ['Italia', 'Spanyol', 'Prancis', 'Jerman'], a: 2 },
    { q: 'Hewan yang disebut raja hutan?', o: ['Harimau', 'Singa', 'Beruang', 'Serigala'], a: 1 },
    { q: 'Berapa bulan dalam setahun?', o: ['10', '11', '12', '13'], a: 2 },
    { q: 'Warna darah manusia?', o: ['Biru', 'Hijau', 'Merah', 'Kuning'], a: 2 },
    { q: 'Tempat tinggal ikan?', o: ['Udara', 'Tanah', 'Air', 'Api'], a: 2 }
  ],
  normal: [
    { q: 'Siapa penemu bola lampu?', o: ['Einstein', 'Edison', 'Newton', 'Tesla'], a: 1 },
    { q: 'Gunung tertinggi di dunia?', o: ['Kilimanjaro', 'Everest', 'Fuji', 'Elbrus'], a: 1 },
    { q: 'Unsur kimia air?', o: ['CO2', 'H2O', 'NaCl', 'O2'], a: 1 },
    { q: 'Ibu kota Jepang?', o: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], a: 2 },
    { q: 'Berapa kromosom manusia?', o: ['23', '46', '48', '44'], a: 1 },
    { q: 'Planet terbesar di tata surya?', o: ['Saturnus', 'Jupiter', 'Neptunus', 'Uranus'], a: 1 },
    { q: 'Siapa penulis Harry Potter?', o: ['Tolkien', 'Rowling', 'Martin', 'King'], a: 1 },
    { q: 'Samudra terbesar?', o: ['Atlantik', 'Hindia', 'Pasifik', 'Arktik'], a: 2 },
    { q: 'Bahasa resmi Brazil?', o: ['Spanyol', 'Portugis', 'Inggris', 'Prancis'], a: 1 },
    { q: 'Tahun kemerdekaan RI?', o: ['1940', '1945', '1950', '1942'], a: 1 },
    { q: 'Alat ukur suhu?', o: ['Barometer', 'Termometer', 'Higrometer', 'Anemometer'], a: 1 },
    { q: 'Bentuk bumi secara umum?', o: ['Datar', 'Kubus', 'Bulat pepat', 'Segitiga'], a: 2 },
    { q: 'Vitamin dari sinar matahari?', o: ['A', 'B', 'C', 'D'], a: 3 },
    { q: 'Ibu kota Australia?', o: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], a: 2 },
    { q: 'Proses tumbuhan membuat makanan?', o: ['Respirasi', 'Fotosintesis', 'Transpirasi', 'Fermentasi'], a: 1 },
    { q: 'Simbol kimia emas?', o: ['Ag', 'Au', 'Fe', 'Cu'], a: 1 },
    { q: 'Berapa sisi segi enam?', o: ['5', '6', '7', '8'], a: 1 },
    { q: 'Negara dengan piramida Giza?', o: ['Irak', 'Mesir', 'Iran', 'Turki'], a: 1 },
    { q: 'Gas yang paling banyak di atmosfer?', o: ['Oksigen', 'Nitrogen', 'Karbon dioksida', 'Hidrogen'], a: 1 },
    { q: 'Siapa pelukis Mona Lisa?', o: ['Michelangelo', 'Da Vinci', 'Picasso', 'Van Gogh'], a: 1 },
    { q: 'Satuan arus listrik?', o: ['Volt', 'Watt', 'Ampere', 'Ohm'], a: 2 },
    { q: 'Benua terkecil?', o: ['Eropa', 'Australia', 'Antartika', 'Amerika Selatan'], a: 1 },
    { q: 'Hewan mamalia yang bisa terbang?', o: ['Elang', 'Kelelawar', 'Penguin', 'Burung unta'], a: 1 },
    { q: 'Ibu kota Thailand?', o: ['Phuket', 'Chiang Mai', 'Bangkok', 'Pattaya'], a: 2 },
    { q: 'Rumus luas lingkaran?', o: ['πr', '2πr', 'πr²', 'πd'], a: 2 }
  ],
  hard: [
    { q: 'Siapa ilmuwan teori relativitas?', o: ['Newton', 'Einstein', 'Hawking', 'Galileo'], a: 1 },
    { q: 'Berapa jumlah planet di tata surya (resmi)?', o: ['7', '8', '9', '10'], a: 1 },
    { q: 'Ibu kota Kanada?', o: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], a: 2 },
    { q: 'Unsur dengan nomor atom 1?', o: ['Helium', 'Hidrogen', 'Litium', 'Oksigen'], a: 1 },
    { q: 'Siapa penemu telepon?', o: ['Edison', 'Bell', 'Marconi', 'Tesla'], a: 1 },
    { q: 'Sungai terpanjang di dunia?', o: ['Amazon', 'Nil', 'Yangtze', 'Mississippi'], a: 1 },
    { q: 'Tahun Perang Dunia II berakhir?', o: ['1943', '1944', '1945', '1946'], a: 2 },
    { q: 'Bahasa pemrograman dibuat Google?', o: ['Rust', 'Go', 'Swift', 'Kotlin'], a: 1 },
    { q: 'Kecepatan cahaya kira-kira?', o: ['300 km/s', '300.000 km/s', '30.000 km/s', '3.000 km/s'], a: 1 },
    { q: 'Negara dengan populasi terbesar (2020-an)?', o: ['India', 'China', 'AS', 'Indonesia'], a: 0 },
    { q: 'Simbol kimia natrium?', o: ['N', 'Na', 'Nt', 'Nm'], a: 1 },
    { q: 'Siapa penulis "1984"?', o: ['Huxley', 'Orwell', 'Bradbury', 'Asimov'], a: 1 },
    { q: 'Gunung berapi aktif di Italia?', o: ['Etna', 'Vesuvius', 'Stromboli', 'Semua benar'], a: 3 },
    { q: 'DNA singkatan dari?', o: ['Deoxyribonucleic Acid', 'Dinucleic Acid', 'Dual Nucleic Acid', 'Deoxy Natural Acid'], a: 0 },
    { q: 'Ibu kota Kazakhstan (sekarang)?', o: ['Almaty', 'Astana/Nur-Sultan', 'Shymkent', 'Karaganda'], a: 1 },
    { q: 'Berapa bit dalam 1 byte?', o: ['4', '8', '16', '32'], a: 1 },
    { q: 'Filsuf "Cogito ergo sum"?', o: ['Plato', 'Aristoteles', 'Descartes', 'Kant'], a: 2 },
    { q: 'Satuan frekuensi?', o: ['Watt', 'Hertz', 'Joule', 'Newton'], a: 1 },
    { q: 'Negara yang digelar "Negeri Sakura"?', o: ['Korea', 'China', 'Jepang', 'Thailand'], a: 2 },
    { q: 'Proses pembelahan sel tubuh?', o: ['Meiosis', 'Mitosis', 'Fusi', 'Fisi'], a: 1 },
    { q: 'Siapa komposer Symphony No. 9?', o: ['Mozart', 'Bach', 'Beethoven', 'Chopin'], a: 2 },
    { q: 'Benua yang dilintasi khatulistiwa (bukan Asia)?', o: ['Eropa', 'Afrika', 'Antartika', 'Australia'], a: 1 },
    { q: 'Rumus E=mc² ditemukan oleh?', o: ['Newton', 'Einstein', 'Planck', 'Bohr'], a: 1 },
    { q: 'Organel sel penghasil energi?', o: ['Nukleus', 'Mitokondria', 'Ribosom', 'Lisosom'], a: 1 },
    { q: 'Tahun internet (ARPANET) lahir kira-kira?', o: ['1959', '1969', '1979', '1989'], a: 1 }
  ],
  nightmare: [
    { q: 'Siapa yang membuktikan ketidaklengkapan matematika (1931)?', o: ['Turing', 'Gödel', 'Russell', 'Hilbert'], a: 1 },
    { q: 'Konstanta Planck dilambangkan?', o: ['c', 'G', 'h', 'k'], a: 2 },
    { q: 'Ibu kota Bhutan?', o: ['Thimphu', 'Paro', 'Punakha', 'Phuntsholing'], a: 0 },
    { q: 'Bahasa dengan huruf Hangul?', o: ['Jepang', 'China', 'Korea', 'Vietnam'], a: 2 },
    { q: 'Partikel pembawa gaya elektromagnetik?', o: ['Gluon', 'Foton', 'Boson Higgs', 'Neutrino'], a: 1 },
    { q: 'Siapa penulis "Critique of Pure Reason"?', o: ['Hegel', 'Kant', 'Nietzsche', 'Schopenhauer'], a: 1 },
    { q: 'Tahun revolusi Prancis dimulai?', o: ['1776', '1789', '1799', '1815'], a: 1 },
    { q: 'Unsur radioaktif yang ditemukan Curie?', o: ['Uranium', 'Radium', 'Plutonium', 'Thorium'], a: 1 },
    { q: 'Algoritma sorting O(n log n) rata-rata?', o: ['Bubble', 'Insertion', 'Quick/Merge', 'Selection'], a: 2 },
    { q: 'Negara dengan bahasa resmi paling banyak?', o: ['India', 'Afrika Selatan', 'Swiss', 'Papua Nugini'], a: 3 },
    { q: 'Siapa yang menemukan penicilin?', o: ['Pasteur', 'Fleming', 'Koch', 'Jenner'], a: 1 },
    { q: 'Jarak rata-rata Bumi-Matahari disebut?', o: ['Parsec', 'Light year', 'AU', 'Angstrom'], a: 2 },
    { q: 'Teori big bang pertama kali diusulkan oleh?', o: ['Einstein', 'Hubble', 'Lemaître', 'Gamow'], a: 2 },
    { q: 'Simbol kimia merkuri?', o: ['Me', 'Hg', 'Mr', 'Mc'], a: 1 },
    { q: 'Siapa arsitek Taj Mahal?', o: ['Sinan', 'Ustad Ahmad Lahori', 'Ibn Tulun', 'Sinan Pasha'], a: 1 },
    { q: 'Hukum termodinamika ke-2 terkait?', o: ['Energi kekal', 'Entropi', 'Suhu absolut', 'Aksi-reaksi'], a: 1 },
    { q: 'Bahasa resmi Vatikan?', o: ['Italia', 'Latin', 'Prancis', 'Yunani'], a: 1 },
    { q: 'Siapa penemu mesin uap praktis?', o: ['Newcomen', 'Watt', 'Stephenson', 'Faraday'], a: 1 },
    { q: 'Galaksi tempat tata surya berada?', o: ['Andromeda', 'Bima Sakti', 'Triangulum', 'Whirlpool'], a: 1 },
    { q: 'Nilai π (pi) kira-kira?', o: ['2,14', '3,14', '3,41', '4,13'], a: 1 },
    { q: 'Siapa yang menulis "The Republic"?', o: ['Aristoteles', 'Plato', 'Sokrates', 'Cicero'], a: 1 },
    { q: 'Satuan resistansi listrik?', o: ['Volt', 'Ampere', 'Ohm', 'Watt'], a: 2 },
    { q: 'Negara yang tidak pernah dijajah di Asia Tenggara?', o: ['Vietnam', 'Thailand', 'Myanmar', 'Kamboja'], a: 1 },
    { q: 'Proses pembentukan bintang disebut?', o: ['Nebula collapse', 'Supernova', 'Red giant', 'White dwarf'], a: 0 },
    { q: 'Siapa yang memecahkan Enigma di WWII (tim)?', o: ['Oppenheimer', 'Turing', 'von Neumann', 'Shannon'], a: 1 }
  ]
};

const LEVELS = ['easy', 'normal', 'hard', 'nightmare'];
const LEVEL_LABEL = {
  easy: 'Easy 🟢',
  normal: 'Normal 🟡',
  hard: 'Hard 🟠',
  nightmare: 'Nightmare 🔴'
};

function pick25(level) {
  const src = BANK[level] || BANK.easy;
  // sudah 25, acak urutan
  return [...src].sort(() => Math.random() - 0.5).slice(0, 25);
}

export function getQuizMenu() {
  return `╭───『 TEBAK-TEBAKAN 』
│
│ Pilih tingkat kesulitan:
│ 1. Easy 🟢
│ 2. Normal 🟡
│ 3. Hard 🟠
│ 4. Nightmare 🔴
│
│ Setiap tingkat: *25 soal* pilihan ganda.
│ Jawab dengan *A / B / C / D*
│
│ 🏆 Lulus *Nightmare* → gelar *The Genius 🎓*
│
│ Ketik: .tebak easy | .tebak normal | ...
│ Atau: .tebak 1 / 2 / 3 / 4
│
│ .tebak rank → lihat gelar
│ .tebak stop → batalkan sesi
╰──────────────`;
}

export function startQuiz(userId, levelInput) {
  let level = String(levelInput || '').toLowerCase().trim();
  if (level === '1') level = 'easy';
  if (level === '2') level = 'normal';
  if (level === '3') level = 'hard';
  if (level === '4') level = 'nightmare';
  if (!LEVELS.includes(level)) {
    return { ok: false, msg: 'Pilih: easy / normal / hard / nightmare (atau 1-4)' };
  }
  if (quizSessions.has(userId)) {
    return { ok: false, msg: 'Kamu masih punya sesi aktif. Ketik .tebak stop dulu.' };
  }
  const questions = pick25(level);
  const session = {
    level,
    questions,
    index: 0,
    score: 0,
    started: Date.now()
  };
  quizSessions.set(userId, session);
  return { ok: true, session, text: formatQuestion(session) };
}

export function answerQuiz(userId, answer) {
  const session = quizSessions.get(userId);
  if (!session) return { ok: false, msg: 'Tidak ada sesi. Mulai dengan .tebak <level>' };

  const ans = String(answer || '').trim().toUpperCase();
  const map = { A: 0, B: 1, C: 2, D: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
  if (!(ans in map)) {
    return { ok: false, msg: 'Jawab dengan A, B, C, atau D' };
  }

  const q = session.questions[session.index];
  const correct = map[ans] === q.a;
  if (correct) session.score++;

  session.index++;
  const feedback = correct ? '✅ Benar!' : `❌ Salah. Jawaban: *${String.fromCharCode(65 + q.a)}. ${q.o[q.a]}*`;

  if (session.index >= session.questions.length) {
    quizSessions.delete(userId);
    const total = session.questions.length;
    const pct = Math.round((session.score / total) * 100);
    let result = `${feedback}\n\n🏁 *Selesai ${LEVEL_LABEL[session.level]}*\nSkor: *${session.score}/${total}* (${pct}%)\n`;

    // Gelar The Genius hanya jika lulus nightmare dengan skor tinggi (>=20/25)
    if (session.level === 'nightmare' && session.score >= 20) {
      setTitle(userId, 'The Genius 🎓');
      result += `\n🎉 Selamat! Kamu mendapat gelar *The Genius 🎓*\nGelar tersimpan sampai kamu keluar grup / leave.`;
    } else if (session.level === 'nightmare' && session.score < 20) {
      result += `\nSkor Nightmare kurang dari 20. Belum dapat gelar.`;
    }

    return { ok: true, done: true, text: result };
  }

  return {
    ok: true,
    done: false,
    text: `${feedback}\n\n${formatQuestion(session)}`
  };
}

export function stopQuiz(userId) {
  if (!quizSessions.has(userId)) return false;
  quizSessions.delete(userId);
  return true;
}

export function formatQuestion(session) {
  const q = session.questions[session.index];
  const n = session.index + 1;
  const total = session.questions.length;
  return `╭───『 ${LEVEL_LABEL[session.level]} · Soal ${n}/${total} 』
│ Skor: ${session.score}
│
│ ${q.q}
│
│ A. ${q.o[0]}
│ B. ${q.o[1]}
│ C. ${q.o[2]}
│ D. ${q.o[3]}
│
│ Balas *A / B / C / D*
╰──────────────`;
}

export function hasSession(userId) {
  return quizSessions.has(userId);
}
