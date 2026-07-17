// =============================================
//  config.js — Angka-angka pengaturan umum
// =============================================
// Kumpulan angka setelan yang dipakai banyak file. Dikumpulkan di sini biar
// gampang diubah tanpa mengubek-ubek kode.

// ── Ukuran dunia & layar ─────────────────────
export { WORLD_W, WORLD_H } from './world/background.js';
export const VIEWPORT_W = 390; // Lebar area yang terlihat di layar
export const VIEWPORT_H = 640; // Tinggi area yang terlihat di layar

// Batas ketajaman layar. Layar HP yang sangat tajam dibatasi di sini supaya
// game tidak berat menggambarnya.
export const MAX_DPR = 2;

// ── Minimap (peta kecil di pojok) ────────────
export const MINIMAP_W = 90;
export const MINIMAP_H = 90;
export const MINIMAP_MARGIN = 12; // jarak dari pinggir layar

// ── Partikel (percikan efek) ─────────────────
export const MAX_PARTICLES_HIGH = 60; // batas jumlah saat kualitas tinggi
export const MAX_PARTICLES_LOW = 24;  // batas jumlah saat kualitas rendah
export const PARTICLE_POOL_SIZE = 80; // stok partikel yang dipakai ulang

// ── Peluru ───────────────────────────────────
export const PROJECTILE_POOL_SIZE = 80; // stok peluru yang dipakai ulang

// ── Suara ────────────────────────────────────
// Jeda minimal (milidetik) antara dua suara yang sama, biar tidak berisik
// saat dipicu beruntun.
export const AUDIO_THROTTLE_MS = 45;
