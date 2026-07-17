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
