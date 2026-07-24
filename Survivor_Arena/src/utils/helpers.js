// =============================================
//  helpers.js — Fungsi bantu yang dipakai di mana-mana
// =============================================
// Isinya perhitungan-perhitungan kecil yang sering dibutuhkan file lain.

/**
 * Cek apakah dua benda bulat saling bersentuhan. Tiap benda harus punya
 * posisi (x, y) dan jari-jari (r). Dipakai misalnya untuk tahu apakah peluru
 * mengenai musuh, atau player menyentuh koin.
 *
 * Namanya circleA/circleB — bukan mis. attacker/target — karena urutannya tidak
 * berpengaruh: hasilnya sama saja kalau kedua argumen ditukar.
 *
 * Sengaja membandingkan jarak KUADRAT (tanpa Math.sqrt): hasilnya identik, dan
 * fungsi ini dipanggil ribuan kali tiap frame (tiap peluru x tiap musuh).
 */
export function circleCollide(circleA, circleB) {
  const dx = circleA.x - circleB.x;
  const dy = circleA.y - circleB.y;
  const distSq = dx * dx + dy * dy;
  const minDist = circleA.r + circleB.r;
  return distSq <= minDist * minDist;
}

/**
 * Hitung jarak lurus antara dua titik. Cukup butuh x & y — tidak seperti
 * circleCollide, jari-jari tidak dipakai di sini.
 */
export function distance(pointA, pointB) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

/** Ambil angka acak (boleh pecahan) di antara min dan max. */
export function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

/** Ambil angka bulat acak dari min sampai max (kedua ujung ikut). */
export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

/** Jaga nilai supaya tidak kurang dari min atau lebih dari max. */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Ambil nilai di antara dua angka sesuai kemajuan 0..1 (0 = awal, 1 = akhir).
 * Buat gerak halus. Berbeda dari circleCollide/distance, urutan di sini PENTING:
 * lerp(0, 10, 0.5) = 5, sedangkan lerp(10, 0, 0.5) juga 5 — tapi lerp(0, 10, 0.2)
 * = 2 sementara lerp(10, 0, 0.2) = 8.
 */
export function lerp(fromValue, toValue, progress) {
  return fromValue + (toValue - fromValue) * progress;
}

/** Ubah jumlah detik jadi tulisan waktu "mm:ss" buat tampilan timer. */
export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/**
 * Cek apakah ada garis lurus (line-of-sight) antara dua titik tanpa diblokir
 * oleh obstacle berbentuk lingkaran. Memakai closest-point-on-segment secara
 * analitis — O(n) terhadap jumlah obstacle, tanpa pembuatan array baru.
 *
 * NOTE: parameter `obstacles` adalah argumen WAJIB. Caller (game.js / modul
 * musuh) yang punya akses ke array OBSTACLESwa agar helpers.js tetap menjadi
 * modul utilitas murni tanpa ketergantungan pada modul dunia permainan.
 *
 * Toleransi hitbox: efektif radius blokir = o.r * 0.75, supaya jalur tembakan
 * tidak terblokir hanya karena menyenggol pinggiran kanopi pohon.
 */
export function hasLineOfSight(x1, y1, x2, y2, obstacles) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return true; // titik yang sama selalu terlihat

  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    const effectiveR = o.r * 0.75;
    const effectiveRSq = effectiveR * effectiveR;
    const ox = o.x - x1;
    const oy = o.y - y1;
    const t = Math.max(0, Math.min(1, (ox * dx + oy * dy) / lenSq));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    const ddx = closestX - o.x;
    const ddy = closestY - o.y;
    if (ddx * ddx + ddy * ddy < effectiveRSq) return false;
  }
  return true;
}

/** Pilih titik acak di salah satu pinggir dunia, buat memunculkan musuh dari luar layar. */
export function randomEdgePoint(worldW, worldH, margin = 20) {
  const side = randInt(0, 3);
  if (side === 0) return { x: randRange(0, worldW), y: -margin };
  if (side === 1) return { x: worldW + margin, y: randRange(0, worldH) };
  if (side === 2) return { x: randRange(0, worldW), y: worldH + margin };
  return { x: -margin, y: randRange(0, worldH) };
}
