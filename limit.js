// Simple in-memory limit system (reset setiap hari)
const userLimits = new Map();

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function checkLimit(userId, type, max) {
  const key = `${userId}_${type}_${getToday()}`;
  const current = userLimits.get(key) || 0;
  
  if (current >= max) {
    return { allowed: false, remaining: 0, used: current };
  }
  
  userLimits.set(key, current + 1);
  return { 
    allowed: true, 
    remaining: max - (current + 1), 
    used: current + 1 
  };
}

export function getLimitStatus(userId, type, max) {
  const key = `${userId}_${type}_${getToday()}`;
  const used = userLimits.get(key) || 0;
  return { used, remaining: Math.max(0, max - used), max };
}

// Bersihkan limit lama (opsional, panggil setiap jam)
export function cleanOldLimits() {
  const today = getToday();
  for (const key of userLimits.keys()) {
    if (!key.endsWith(today)) {
      userLimits.delete(key);
    }
  }
}
