# Nuts Bot 🥜

Bot WhatsApp multi-fungsi.  
**Creator: Nat**

---

## Fitur Utama

- Downloader (yt-dlp) + pilih kualitas + audio
- Sticker lengkap (gambar, video, audio, teks)
- AI: Groq (gpt-oss) + Gemini terbaru
- Fishing Simulator (3 ending)
- **Dragon Roll Simulator** (RPG upgrade + boss + 3 ending)
- Monopoly Mini, Suit, Tebak Angka, Slot
- Tools: cuaca, kalkulator, meme, dll

---

## Cara Menghubungkan ke WhatsApp

### 1. Pairing Code (Direkomendasikan)

1. Isi di Environment / `.env`:
   ```
   PAIRING_NUMBER=628xxxxxxxxxx
   ```
2. Jalankan bot (`npm start`)
3. Lihat log → muncul **PAIRING CODE** 8 digit
4. Di HP: WhatsApp → Perangkat Tertaut → Tautkan dengan nomor telepon → masukkan kode

### 2. Scan QR

- Jangan isi `PAIRING_NUMBER`
- Jalankan bot → scan QR di terminal

---

## Instalasi Lokal

```bash
git clone https://github.com/NatAlmond/Nutsbot-.git
cd Nutsbot-
cp .env.example .env
# isi .env
npm install
npm start
```

Pastikan server punya **yt-dlp** dan **ffmpeg**.

---

## Deploy ke Railway

1. Push semua file ke GitHub
2. New Project → Deploy from GitHub repo
3. Isi **Environment Variables** (lihat `.env.example`)
4. **Wajib**: buat Volume, mount ke `/app/session`
5. Start Command: `npm start`
6. Lihat Logs untuk Pairing Code / status

### Environment Variables penting

| Key | Contoh | Keterangan |
|-----|--------|----------|
| `OWNER_NUMBER` | 6281234567890 | Nomor owner |
| `OWNER_CODE` | myownerlikepeanuts | Kode claim owner-like |
| `PAIRING_NUMBER` | 628xxxxxxxxxx | Opsional |
| `GROQ_API_KEY` | gsk_... | Wajib untuk AI |
| `GEMINI_API_KEY` | AIza... | Opsional |
| `GROQ_MODEL` | openai/gpt-oss-20b | Default |
| `GEMINI_MODEL` | gemini-3.8-flash | Default |
| `BOT_NAME` | Nuts | Nama bot |
| `PREFIX` | . | Prefix perintah |

---

## Owner-like System

1. Set `OWNER_CODE=myownerlikepeanuts` di env
2. User chat **pribadi** ke bot, kirim kode tersebut
3. Nomor otomatis disimpan → di grup dianggap Owner (limit ∞)

---

## Perintah Game Baru

### Fishing
```
.mancing
.tarik
.lepas
```

### Dragon Roll Simulator
```
.dragon start
.dragon explore
.dragon attack
.dragon skill fire|heal|berserk
.dragon upgrade atk|def|hp|mp
.dragon status
.dragon flee
.dragon reset
```

Alur: Town → Explore → Battle → Upgrade → Boss (3 Ending)

---

## Struktur File Penting

```
├── index.js          # Main bot
├── config.js         # Konfigurasi
├── limit.js          # Limit + owner-like
├── games.js          # Fishing + Dragon + Monopoly
├── minigames.js      # Suit, tebak angka, slot
├── ai.js             # Groq + Gemini
├── message.js        # Format tampilan
├── media.js          # Kirim pict
├── downloader.js     # yt-dlp
├── sticker.js
├── Dockerfile
├── railway.toml
└── pict1.png ... pict28.png
```

---

## Catatan

- Session harus di Volume agar tidak hilang saat redeploy
- Owner & owner-like memiliki limit Infinity
- Model AI otomatis fallback jika model utama gagal
