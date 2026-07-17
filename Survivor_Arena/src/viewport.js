// =============================================
//  viewport.js — Ukuran layar & kamera
// =============================================
// Mengatur bagaimana dunia game (yang besar) ditampilkan ke layar (yang kecil):
// menyesuaikan ukuran ke jendela, dan menggeser kamera mengikuti player.

import { WORLD_W, WORLD_H, VIEWPORT_W, VIEWPORT_H, MAX_DPR } from './config.js';
import { lerp } from './utils/helpers.js';

// Info skala & pergeseran gambar biar pas di layar apa pun ukurannya.
export const viewport = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  dpr: 1,
};

// Posisi kamera. speed = seberapa cepat kamera mengejar player
// (kecil = geraknya halus, 1 = langsung menempel).
export const camera = {
  x: 0,
  y: 0,
  speed: 0.08,
};

/**
 * Geser kamera pelan-pelan supaya player selalu di tengah layar. Kamera
 * ditahan agar tidak menampilkan area kosong di luar batas dunia.
 */
export function updateCamera(playerX, playerY) {
  // Target kamera agar player tepat berada di tengah layar terlihat
  const targetX = playerX - VIEWPORT_W / 2;
  const targetY = playerY - VIEWPORT_H / 2;

  camera.x = lerp(camera.x, targetX, camera.speed);
  camera.y = lerp(camera.y, targetY, camera.speed);

  // Batasi (clamp) agar kamera tidak memperlihatkan area luar batas dunia
  camera.x = Math.max(0, Math.min(camera.x, WORLD_W - VIEWPORT_W));
  camera.y = Math.max(0, Math.min(camera.y, WORLD_H - VIEWPORT_H));
}

/**
 * Sesuaikan ukuran gambar ke ukuran jendela browser supaya pas dan tidak
 * gepeng. Dipanggil saat game dibuka dan tiap kali ukuran layar berubah.
 *
 * Cara kerjanya: cari skala terbesar yang masih membuat area main 390x640 muat
 * penuh di jendela, lalu pas-kan `stage` ke ukuran itu dan taruh di tengah.
 * Canvas mengisi stage tepat — tidak ada lagi bar hitam DI DALAM canvas, jadi
 * offsetX/offsetY selalu 0. Bar hitam di sisa layar cukup jadi latar CSS.
 *
 * Karena HUD ada di dalam stage yang sama, ia otomatis sejajar dengan isi game
 * di semua ukuran layar tanpa perhitungan tambahan.
 */
export function resizeViewport(canvas, stage) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;

  // Skala dalam satuan CSS px (bukan piksel layar), dipakai untuk menata stage.
  const scaleCss = Math.min(cssW / VIEWPORT_W, cssH / VIEWPORT_H);
  const stageW = VIEWPORT_W * scaleCss;
  const stageH = VIEWPORT_H * scaleCss;

  if (stage) {
    stage.style.width = `${stageW}px`;
    stage.style.height = `${stageH}px`;
    stage.style.left = `${(cssW - stageW) / 2}px`;
    stage.style.top = `${(cssH - stageH) / 2}px`;
  }

  canvas.width = Math.round(stageW * dpr);
  canvas.height = Math.round(stageH * dpr);

  // Diambil dari canvas.width yang sudah dibulatkan, supaya VIEWPORT_W * scale
  // pas persis selebar canvas dan tidak menyisakan celah sepersekian piksel.
  viewport.scale = canvas.width / VIEWPORT_W;
  viewport.dpr = dpr;
  viewport.offsetX = 0;
  viewport.offsetY = 0;
}

/**
 * Ubah posisi sentuhan/klik di layar jadi posisi sebenarnya di dunia game
 * (memperhitungkan skala layar dan posisi kamera saat itu).
 */
export function clientToLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const bx = (clientX - rect.left) * (canvas.width / rect.width);
  const by = (clientY - rect.top) * (canvas.height / rect.height);
  return {
    x: (bx - viewport.offsetX) / viewport.scale + camera.x,
    y: (by - viewport.offsetY) / viewport.scale + camera.y,
  };
}