// =============================================
//  point.js — Koin yang dikumpulkan player
// =============================================
import { drawSprite, frameForClip } from '../utils/assets.js';

export class PointItem {
  // x, y = posisi koin; value = berapa poin yang diberikan saat diambil.
  constructor(x, y, value = 1) {
    this.x = x;
    this.y = y;
    this.r = 7;
    this.value = value;
    this.collected = false;
    this.spawnTime = performance.now();
  }

  /** Gambar koin berputar. Sebelum gambarnya dimuat, tampil sebagai lingkaran kuning. */
  draw(ctx, elapsedTime) {
    const pulse = 1 + Math.sin(elapsedTime * 4 + this.x) * 0.15;

    // Koin berputar (animasi 8-frame rotasi).
    const frame = frameForClip('coin', elapsedTime, 10, 'loop').index;
    if (drawSprite(ctx, 'coin', this.x, this.y, this.r * 2.6 * pulse, frame)) return;

    // Fallback primitif (dipakai selama sprite belum ada di src/assets/spritesheets/).
    ctx.fillStyle = '#FFC857';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
