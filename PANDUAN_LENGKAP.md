# PANDUAN LENGKAP — Nuts Bot (Railway + Android)

## Daftar file yang harus ada di root GitHub

```
limit.js
games.js
index.js          ← sudah di-patch (owner-like + dragon + fishing)
config.js
ai.js
message.js
media.js
sticker.js
downloader.js
utils.js
minigames.js
quiz.js
translate.js
package.json
Dockerfile        ← NAMA HARUS Dockerfile (bukan .jpg)
railway.toml
.env.example
.gitignore
README.md
pict1.png ... pict18.png (sudah ada di repo)
pict20.png ... pict28.png (opsional)
```

**Hapus** file `Dockerfile.jpg` jika masih ada.

---

## Langkah 1 — Upload ke GitHub

1. Buka repo https://github.com/NatAlmond/Nutsbot-
2. Upload / ganti SEMUA file di atas ke root.
3. Hapus `Dockerfile.jpg`.
4. Commit & Push.

---

## Langkah 2 — Railway

1. New Project → Deploy from GitHub → pilih repo.
2. **Variables** (isi minimal):

```
OWNER_NUMBER=628xxxxxxxxxx
OWNER_CODE=....
PAIRING_NUMBER=628xxxxxxxxxx
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...          (opsional)
GROQ_MODEL=openai/gpt-oss-20b
GEMINI_MODEL=gemini-2.0-flash
BOT_NAME=Nuts
PREFIX=.
```

3. **Volume** → New Volume → Mount Path: `/app/session`
4. Deploy / Redeploy.

---

## Langkah 3 — Pairing di Android

1. Buka **Deployments → Logs** di Railway.
2. Tunggu muncul:

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

4. Tunggu Logs menampilkan bot terhubung.

---

## Langkah 4 — Aktifkan Owner-like

1. Chat **pribadi** ke nomor bot.
2. Ketik tepat: `myownerlikepeanuts`
3. Bot balas sukses → limit kamu = ∞ (download, AI, game).

---

## Perintah uji

```
.menu
.mancing
.tarik
.dragon start
.dragon explore
.dragon attack
.aio https://...
.s          (kirim gambar lalu .s)
.ai halo
```

---

## Jika error

| Error | Solusi |
|-------|--------|
| Cannot find module './games.js' | File games.js belum ter-upload / belum push |
| Cannot find module './limit.js' | File limit.js belum ter-upload |
| Dockerfile not found | Hapus Dockerfile.jpg, pastikan nama file = Dockerfile |
| Session hilang tiap redeploy | Pasang Volume di `/app/session` |
| Pairing code tidak muncul | Isi PAIRING_NUMBER = nomor WhatsApp bot (format 628...) |
| yt-dlp tidak terinstall | Pastikan build pakai Dockerfile (bukan Nixpacks) |

