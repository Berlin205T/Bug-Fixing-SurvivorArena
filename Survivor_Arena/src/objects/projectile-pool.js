// =============================================
//  projectile-pool.js — Pengelola peluru
// =============================================
// Menampung semua peluru (milik player maupun laser musuh). Supaya ringan,
// peluru tidak dibuat-buang terus-menerus: kita siapkan stok di awal lalu
// pakai ulang — sama seperti sistem partikel di vfx.js.

import { Projectile } from './projectile.js';
import { PROJECTILE_POOL_SIZE } from '../config.js';

// Stok peluru yang dipakai ulang.
const pool = [];
for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) pool.push(new Projectile());

// Peluru yang sedang terbang.
let active = [];

/** Ambil satu peluru yang menganggur dari stok (buat baru saat stok habis). */
function acquire() {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) return pool[i];
  }
  // Pool habis (jarang terjadi) — buat baru sebagai fallback.
  const p = new Projectile();
  pool.push(p);
  return p;
}

/**
 * Tembakkan satu peluru dari titik (x, y) ke arah (dirX, dirY). range = jarak
 * tempuh maksimal, damage = seberapa sakit, isEnemy = true untuk peluru musuh.
 */
export function spawnProjectile(x, y, dirX, dirY, range, damage, isEnemy = false) {
  const p = acquire();
  p.reset(x, y, dirX, dirY, range, damage, isEnemy);
  p.active = true;
  active.push(p);
  return p;
}

/** Gerakkan semua peluru; yang sudah habis dikembalikan ke stok. */
export function updateProjectiles(dt) {
  // Swap-and-pop: hapus O(1) tanpa alokasi array baru.
  for (let i = active.length - 1; i >= 0; i--) {
    const p = active[i];
    p.update(dt);
    if (p.dead) {
      p.active = false;
      active[i] = active[active.length - 1];
      active.pop();
    }
  }
}

/** Gambar semua peluru yang sedang terbang. */
export function drawProjectiles(ctx) {
  for (let i = 0; i < active.length; i++) active[i].draw(ctx);
}

/** Jalankan sebuah fungsi untuk tiap peluru (dipakai buat cek tabrakan). */
export function forEachActiveProjectile(fn) {
  for (let i = 0; i < active.length; i++) fn(active[i]);
}

/** Berapa peluru yang sedang terbang. */
export function activeProjectileCount() {
  return active.length;
}

/** Hapus semua peluru (saat mulai ulang / ganti stage). */
export function clearProjectiles() {
  for (let i = 0; i < active.length; i++) active[i].active = false;
  active.length = 0;
}
