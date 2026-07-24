// =============================================
//  quality.js — Pengatur tingkat kualitas gambar
// =============================================
// Cuma menyimpan satu keterangan: kualitas gambar sekarang tinggi, sedang, atau
// rendah. Nilainya diisi main.js saat game dibuka (menyesuaikan kekuatan HP),
// lalu dibaca file lain untuk memutuskan apakah efek berat perlu dikurangi.

let currentQuality = 'high';

/** Ganti tingkat kualitas gambar. */
export function setRenderQuality(level) {
  currentQuality = level;
}

/** Lihat tingkat kualitas gambar sekarang. */
export function getRenderQuality() {
  return currentQuality;
}

/** Cek apakah sedang di kualitas paling rendah (biar efek berat dilewati). */
export function isLowQuality() {
  return currentQuality === 'low';
}

// --- PR #2: Bug Medium/#13 — Dynamic FPS-based quality with hysteresis ---

// Hysteresis threshold: 10-FPS buffer antara tier untuk mencegah osilasi.
// DOWNGRADE:  FPS < 30 → LOW     FPS < 45 → MEDIUM
// UPGRADE:    FPS >= 55 → HIGH   FPS >= 45 → MEDIUM
const FPS_DOWNGRADE_LOW  = 30;
const FPS_DOWNGRADE_MED  = 45;
const FPS_UPGRADE_MED   = 45;
const FPS_UPGRADE_HIGH  = 55;

/**
 * Tentukan tier berdasarkan FPS aktual dengan hysteresis.
 * Evaluasi hysteresis-aware: upgrade butuh FPS lebih tinggi dari downgrade
 * agar tier tidak bergeser terus-menerus saat FPS berada di sekitar threshold.
 */
export function evaluateQualityTier(fps, currentTier) {
  const order = { low: 0, medium: 1, high: 2 };
  const cur = order[currentTier] !== undefined ? order[currentTier] : 1;

  if (cur > 0 && fps < FPS_DOWNGRADE_LOW)  return 'low';
  if (cur > 0 && fps < FPS_DOWNGRADE_MED)  return 'medium';
  if (cur < 2 && fps >= FPS_UPGRADE_HIGH)   return 'high';
  if (cur < 2 && fps >= FPS_UPGRADE_MED)   return 'medium';

  return currentTier; // tidak berubah
}
