/**
 * Fitur Translate multi-bahasa
 * .translate → menu
 * .toenglish / .tojapan / ... teks
 * atau .translate <kode> <teks>
 */

import config from './config.js';

const LANGS = {
  english:    { code: 'en', name: 'English 🇬🇧', aliases: ['en', 'inggris', 'english'] },
  japan:      { code: 'ja', name: '日本語 🇯🇵', aliases: ['ja', 'jp', 'jepang', 'japan', 'japanese'] },
  china:      { code: 'zh', name: '中文 🇨🇳', aliases: ['zh', 'cn', 'china', 'chinese', 'mandarin'] },
  korea:      { code: 'ko', name: '한국어 🇰🇷', aliases: ['ko', 'kr', 'korea', 'korean'] },
  german:     { code: 'de', name: 'Deutsch 🇩🇪', aliases: ['de', 'german', 'jerman'] },
  rusia:      { code: 'ru', name: 'Русский 🇷🇺', aliases: ['ru', 'rusia', 'russian', 'russia'] },
  indonesian: { code: 'id', name: 'Indonesia 🇮🇩', aliases: ['id', 'indo', 'indonesian', 'indonesia'] },
  italia:     { code: 'it', name: 'Italiano 🇮🇹', aliases: ['it', 'italia', 'italian'] },
  thailand:   { code: 'th', name: 'ไทย 🇹🇭', aliases: ['th', 'thailand', 'thai'] },
  france:     { code: 'fr', name: 'Français 🇫🇷', aliases: ['fr', 'france', 'french', 'prancis'] },
  philipine:  { code: 'tl', name: 'Filipino 🇵🇭', aliases: ['tl', 'fil', 'philipine', 'philippines', 'filipino', 'tagalog'] },
  spanish:    { code: 'es', name: 'Español 🇪🇸', aliases: ['es', 'spanish', 'spanyol'] },
  arabic:     { code: 'ar', name: 'العربية 🇸🇦', aliases: ['ar', 'arabic', 'arab'] },
  portuguese: { code: 'pt', name: 'Português 🇧🇷', aliases: ['pt', 'portuguese', 'portugis'] },
  hindi:      { code: 'hi', name: 'हिन्दी 🇮🇳', aliases: ['hi', 'hindi'] },
  turkish:    { code: 'tr', name: 'Türkçe 🇹🇷', aliases: ['tr', 'turkish', 'turki'] },
  vietnamese: { code: 'vi', name: 'Tiếng Việt 🇻🇳', aliases: ['vi', 'vietnamese', 'vietnam'] },
  dutch:      { code: 'nl', name: 'Nederlands 🇳🇱', aliases: ['nl', 'dutch', 'belanda'] },
};

export function resolveLang(input) {
  const key = String(input || '').toLowerCase().trim().replace(/^\.to/, '').replace(/^\./, '');
  for (const [id, meta] of Object.entries(LANGS)) {
    if (id === key || meta.aliases.includes(key) || meta.code === key) return { id, ...meta };
  }
  return null;
}

export function getTranslateMenu() {
  return `
╭───『 ✦ TRANSLATE ✦ 』
│
│ 🌐 Terjemahkan ke bahasa mana saja
│ Model: Llama / Spark Muse
│
│ Cara pakai:
│  • .toenglish Fire
│  • .tojapan Hello
│  • .translate en Api
│
│ Atau reply pesan + perintah:
│  • .toenglish (reply teks)
│
├── Bahasa populer ──
│ 🇬🇧 .toenglish
│ 🇯🇵 .tojapan
│ 🇨🇳 .tochina
│ 🇰🇷 .tokorea
│ 🇩🇪 .togerman
│ 🇷🇺 .torusia
│ 🇮🇩 .toindonesian
│ 🇮🇹 .toitalia
│ 🇹🇭 .tothailand
│ 🇫🇷 .tofrance
│ 🇵🇭 .tophilipine
│ 🇪🇸 .tospanish
│ 🇸🇦 .toarabic
│ 🇧🇷 .toportuguese
│ 🇮🇳 .tohindi
│ 🇹🇷 .toturkish
│ 🇻🇳 .tovietnamese
│ 🇳🇱 .todutch
│
│ Contoh:
│  .toenglish Api  →  Fire
│  .tojapan Hello  →  こんにちは
╰──────────────
_Nuts Translate_
`.trim();
}

/**
 * Terjemahkan teks via AI (Groq/OpenAI-compatible)
 * Fallback: MyMemory free API jika AI gagal
 */
export async function translateText(text, targetLang) {
  const lang = resolveLang(targetLang);
  if (!lang) throw new Error('Bahasa tidak dikenali. Ketik .translate untuk daftar.');

  const source = String(text || '').trim();
  if (!source) throw new Error('Tidak ada teks untuk diterjemahkan.');

  // 1) Coba AI (Groq) dulu
  const apiKey = config.groqKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const system = `You are a precise translator. Translate the user text into ${lang.name} (${lang.code}). Output ONLY the translation, no explanation, no quotes.`;
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.groqModel || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: source }
          ],
          temperature: 0.2,
          max_tokens: 1024
        })
      });
      if (res.ok) {
        const data = await res.json();
        const out = data?.choices?.[0]?.message?.content?.trim();
        if (out) {
          return { text: out, lang, engine: 'Llama (Groq)' };
        }
      }
    } catch (e) {
      console.log('AI translate fail:', e.message);
    }
  }

  // 2) Fallback MyMemory (gratis, tanpa key)
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(source)}&langpair=|${lang.code}`;
    const res = await fetch(url);
    const data = await res.json();
    const out = data?.responseData?.translatedText;
    if (out && !String(out).toLowerCase().includes('invalid')) {
      return { text: out, lang, engine: 'MyMemory' };
    }
  } catch (e) {
    console.log('MyMemory fail:', e.message);
  }

  // 3) Fallback LibreTranslate public (jika ada)
  try {
    const res = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: source, source: 'auto', target: lang.code, format: 'text' })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.translatedText) {
        return { text: data.translatedText, lang, engine: 'LibreTranslate' };
      }
    }
  } catch {}

  throw new Error('Gagal menerjemahkan. Coba lagi atau set GROQ_API_KEY.');
}

export function formatTranslateResult(source, result) {
  return `
╭───『 ✦ TRANSLATE ✦ 』
│
│ 📝 Asli:
│ ${source}
│
│ 🌐 Hasil (${result.lang.name}):
│ *${result.text}*
│
│ ⚙️ Engine: ${result.engine}
╰──────────────
_Nuts Translate_
`.trim();
}

export { LANGS };
