# Nuts Bot

Bot WhatsApp multi fungsi. Creator: Nat🥜

## Cara Menghubungkan ke WhatsApp (Android)

Ada 2 cara:

### Cara 1: Pairing Code (Direkomendasikan)

1. Isi di file `.env`:
   ```
   PAIRING_NUMBER=628xxxxxxxxxx
   ```
   (nomor WhatsApp yang mau dijadikan bot, tanpa +)

2. Jalankan bot (`npm start`)

3. Di log akan muncul **PAIRING CODE** (8 digit)

4. Di HP Android:
   - Buka WhatsApp
   - Ketuk titik tiga → **Perangkat Tertaut**
   - Ketuk **Tautkan perangkat**
   - Pilih **Tautkan dengan nomor telepon**
   - Masukkan kode yang muncul di log

### Cara 2: Scan QR

1. Jangan isi PAIRING_NUMBER
2. Jalankan bot
3. Scan QR yang muncul di terminal dengan WhatsApp → Perangkat Tertaut

## Fitur Utama

- Downloader + pilih kualitas + audio
- Sticker lengkap (.tosticker, .toimage, .ss, .tts)
- Video → Audio (.toaudio)
- AI Groq + Gemini + Kenyataan
- Fishing Simulator (3 ending)
- Monopoly Mini
- Meme, Game grup, Tools

## Instalasi

```bash
npm install
cp .env.example .env
# isi .env
npm start
```

Pastikan server punya: **yt-dlp** dan **ffmpeg**

## Deploy Railway

1. Upload semua file ke GitHub
2. Connect repo di Railway
3. Isi Environment Variables (termasuk PAIRING_NUMBER jika mau)
4. Start Command: `npm start`
5. Lihat Logs untuk Pairing Code / QR
