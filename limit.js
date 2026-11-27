/**
 * Limit harian + Owner-like system
 * Owner & owner-like → limit = Infinity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const LIMITS_FILE = path.join(DATA_DIR, 'limits.json');
const OWNERLIKE_FILE = path.join(DATA_DIR, 'ownerlikes.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadJSON(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {}
  return fallback;
}

function saveJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

let limits = loadJSON(LIMITS_FILE, {});
let ownerLikes = new Set(loadJSON(OWNERLIKE_FILE, []));

function todayKey() {
  return new Date().toLocaleDateString('en-CA', { timeZone: config.timezone || 'Asia/Jakarta' });
}

function cleanNum(n) {
  return String(n || '').replace(/[^0-9]/g, '');
}

export function isOwnerLike(number) {
  const n = cleanNum(number);
  if (!n) return false;
  return ownerLikes.has(n) || ownerLikes.has(n.replace(/^0/, '62')) || ownerLikes.has('0' + n.replace(/^62/, ''));
}

export function addOwnerLike(number) {
  const n = cleanNum(number);
  if (!n) return false;
  ownerLikes.add(n);
  if (n.startsWith('0')) ownerLikes.add('62' + n.slice(1));
  if (n.startsWith('62')) ownerLikes.add('0' + n.slice(2));
  return saveJSON(OWNERLIKE_FILE, [...ownerLikes]);
}

export function listOwnerLikes() {
  return [...ownerLikes];
}

export function removeOwnerLike(number) {
  const n = cleanNum(number);
  ownerLikes.delete(n);
  ownerLikes.delete(n.replace(/^0/, '62'));
  ownerLikes.delete('0' + n.replace(/^62/, ''));
  return saveJSON(OWNERLIKE_FILE, [...ownerLikes]);
}

/**
 * Cek & kurangi limit.
 * type: 'download' | 'ai' | 'game'
 */
export function checkLimit(userId, type = 'download') {
  const uid = cleanNum(userId);
  const ownerNum = cleanNum(config.owner);

  if (
    uid === ownerNum ||
    uid === ownerNum.replace(/^0/, '62') ||
    ('62' + uid.replace(/^0/, '')) === ownerNum ||
    isOwnerLike(uid)
  ) {
    return { ok: true, remaining: Infinity };
  }

  const day = todayKey();
  if (!limits[day]) limits[day] = {};
  if (!limits[day][uid]) {
    limits[day][uid] = {
      download: config.limit?.download ?? 5,
      ai: config.limit?.ai ?? 15,
      game: config.limit?.game ?? 10
    };
  }

  for (const d of Object.keys(limits)) {
    if (d !== day) delete limits[d];
  }

  const user = limits[day][uid];
  if (user[type] === undefined) user[type] = config.limit?.[type] ?? 5;

  if (user[type] <= 0) {
    return {
      ok: false,
      msg: `Limit *${type}* hari ini sudah habis.\nOwner / yang punya kode owner-like = ∞`
    };
  }

  user[type]--;
  saveJSON(LIMITS_FILE, limits);
  return { ok: true, remaining: user[type] };
}

export function getLimitStatus(userId) {
  const uid = cleanNum(userId);
  if (isOwnerLike(uid) || uid === cleanNum(config.owner)) {
    return { download: '∞', ai: '∞', game: '∞' };
  }
  const day = todayKey();
  const user = limits[day]?.[uid] || {
    download: config.limit?.download ?? 5,
    ai: config.limit?.ai ?? 15,
    game: config.limit?.game ?? 10
  };
  return user;
}
