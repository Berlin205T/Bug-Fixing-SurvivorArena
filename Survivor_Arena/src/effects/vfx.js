// =============================================
//  vfx.js — Efek visual: percikan & teks melayang
// =============================================
// Menangani "partikel" (titik-titik kecil yang muncrat saat kena tembak/naik
// level) dan teks yang melayang naik lalu hilang (misalnya "+10").
//
// Supaya ringan, partikel tidak dibuat-buang terus-menerus. Kita siapkan
// sekumpulan partikel di awal, lalu pakai ulang: yang sudah selesai ditandai
// "menganggur" dan bisa dipakai lagi nanti.

import { PARTICLE_POOL_SIZE, MAX_PARTICLES_HIGH, MAX_PARTICLES_LOW } from '../config.js';

export { MAX_PARTICLES_HIGH, MAX_PARTICLES_LOW };

// Jenis huruf teks melayang, disimpan sekali biar tidak dihitung ulang terus.
const FLOATING_TEXT_FONT = 'bold 12px sans-serif';

// Batas jumlah partikel yang boleh aktif bersamaan (diatur sistem kualitas).
let maxParticles = MAX_PARTICLES_HIGH;

/** Atur batas jumlah partikel (dikurangi otomatis di perangkat lemah). */
export function setMaxParticles(limit) { maxParticles = limit; }

/** Bikin satu partikel kosong. */
function makeParticle() {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: '', active: false };
}

// Stok partikel yang dipakai ulang.
const pool = [];
for (let i = 0; i < PARTICLE_POOL_SIZE; i++) pool.push(makeParticle());

/** Ambil satu partikel yang sedang menganggur dari stok. */
function acquireParticle() {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) return pool[i];
  }
  // Stok habis (jarang) — bikin baru.
  const p = makeParticle();
  pool.push(p);
  return p;
}

// Daftar partikel & teks yang sedang tampil.
let particles = [];
let floatingTexts = [];

/** Munculkan satu partikel di posisi tertentu dengan arah, umur, ukuran, warna. */
function emit(x, y, vx, vy, life, size, color) {
  if (particles.length >= maxParticles) return;
  const p = acquireParticle();
  p.x = x; p.y = y;
  p.vx = vx; p.vy = vy;
  p.life = life; p.maxLife = life;
  p.size = size; p.color = color;
  p.active = true;
  particles.push(p);
}

/** Muncrat ke segala arah saat sesuatu kena tembak/pukul. */
export function spawnHitParticles(x, y, color = '#FF5470', count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 60 + Math.random() * 60;
    emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.35, 2 + Math.random() * 2, color);
  }
}

/** Semburan melingkar penuh, dipakai saat naik level / pindah stage. */
export function spawnLevelUpBurst(x, y, color = '#FFC857') {
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16;
    const speed = 90 + Math.random() * 40;
    emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.6, 3, color);
  }
}

/** Tampilkan teks yang melayang naik lalu memudar (misal "+10", "LEVEL UP!"). */
export function spawnFloatingText(x, y, text, color = '#EAF2FF') {
  floatingTexts.push({ x, y, text, color, life: 0.8, maxLife: 0.8 });
}

/** Gerakkan & kurangi umur semua partikel + teks; buang yang sudah habis. */
export function updateVFX(dt) {
  // Cara buang cepat: pindahkan elemen terakhir ke slot yang dihapus.
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      particles[i] = particles[particles.length - 1];
      particles.pop();
    }
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const t = floatingTexts[i];
    t.y -= 24 * dt;
    t.life -= dt;
    if (t.life <= 0) {
      floatingTexts[i] = floatingTexts[floatingTexts.length - 1];
      floatingTexts.pop();
    }
  }
}

/** Gambar semua partikel & teks yang sedang tampil ke layar. */
export function drawVFX(ctx) {
  // Partikel digambar sebagai kotak kecil (lebih ringan daripada lingkaran).
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  if (floatingTexts.length > 0) {
    ctx.font = FLOATING_TEXT_FONT;
    ctx.textAlign = 'center';
    for (let i = 0; i < floatingTexts.length; i++) {
      const t = floatingTexts[i];
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}

/** Bersihkan semua partikel & teks (saat mulai ulang / ganti stage). */
export function clearVFX() {
  for (let i = 0; i < particles.length; i++) particles[i].active = false;
  particles.length = 0;
  floatingTexts.length = 0;
}
