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

// --- ITEM #13 FIX: Tambahan API tier granular & Auto-adjust statis ---
/** Cek apakah sedang di kualitas sedang atau rendah. */
export function isMediumOrLowQuality() {
  return currentQuality === 'medium' || currentQuality === 'low';
}

/** 
 * Evaluasi ulang kualitas secara dinamis berdasarkan performa (FPS).
 * Dipanggil secara periodik (misal tiap beberapa detik) dari game loop/main.
 */
export function evaluateDynamicQuality(averageFps) {
  if (averageFps < 30 && currentQuality !== 'low') {
    setRenderQuality('low');
  } else if (averageFps >= 30 && averageFps < 45 && currentQuality === 'high') {
    setRenderQuality('medium');
  } else if (averageFps >= 55 && currentQuality === 'low') {
    setRenderQuality('medium');
  }
}