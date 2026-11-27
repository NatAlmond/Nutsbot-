# CARA MENJALANKAN BOT + PAIRING DI ANDROID

## A. Siapkan file di GitHub

1. **Hapus** file `Dockerfile.jpg` di repo (jika masih ada).
2. Upload / ganti file-file berikut ke root repo:
   - `limit.js`          ← WAJIB (sebelumnya 404)
   - `games.js`          ← WAJIB (sebelumnya 404)
   - `Dockerfile`        ← nama harus tepat, tanpa .jpg
   - `config.js`
   - `ai.js`
   - `message.js`        (opsional, tampilan lebih rapi)
   - `.env.example`
   - `railway.toml`
   - `pict20.png` s/d `pict28.png` (opsional)
3. **Patch `index.js`** mengikuti `PATCH_INDEX.md` (4–5 perubahan kecil).
4. Commit & Push.

## B. Setup Railway

1. New Project → Deploy from GitHub → pilih repo Nutsbot-
2. **Variables** (Settings → Variables) isi minimal:
   ```
   OWNER_NUMBER=628xxxxxxxxxx
   OWNER_CODE=myownerlikepeanuts
   PAIRING_NUMBER=628xxxxxxxxxx
   GROQ_API_KEY=gsk_...
   GEMINI_API_KEY=AIza...   (opsional)
   GROQ_MODEL=openai/gpt-oss-20b
   GEMINI_MODEL=gemini-2.0-flash
   BOT_NAME=Nuts
   PREFIX=.
   ```
3. **Volume** (penting agar session tidak hilang):
   - New Volume
   - Mount Path: `/app/session`
4. Deploy / Redeploy.

## C. Pairing di Android (paling mudah)

1. Buka **Logs** di Railway.
2. Tunggu muncul tulisan seperti:
   ```
   ========================================
   PAIRING CODE: ABCD1234
   ========================================
   ```
3. Di HP Android:
   - Buka **WhatsApp**
   - Ketuk **titik tiga (⋮)** → **Perangkat Tertaut**
   - **Tautkan perangkat**
   - Pilih **Tautkan dengan nomor telepon**
   - Masukkan **8 digit kode** dari Logs
4. Tunggu status "terhubung" di Logs.

> Ya, benar: **Pairing Code** = cara menautkan bot ke WhatsApp Android tanpa QR (lebih nyaman di HP).

## D. Setelah terhubung

1. Chat **pribadi** ke nomor bot → ketik: `myownerlikepeanuts`
2. Bot akan balas sukses → nomor kamu jadi Owner-like (limit ∞).
3. Coba:
   - `.menu`
   - `.mancing` lalu `.tarik`
   - `.dragon start` → `.dragon explore` → `.dragon attack`
   - `.aio <link youtube/tiktok>`

## E. Jika error

- `Cannot find module './games.js'` atau `./limit.js` → file belum ter-upload / belum di-push.
- Build gagal Dockerfile → pastikan file bernama **`Dockerfile`** (bukan Dockerfile.jpg).
- Session hilang tiap redeploy → Volume belum dipasang di `/app/session`.
- Pairing code tidak muncul → pastikan `PAIRING_NUMBER` diisi nomor yang **sama** dengan WhatsApp yang mau dijadikan bot, format `628...` tanpa `+`.
