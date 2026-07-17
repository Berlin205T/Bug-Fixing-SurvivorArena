// =============================================
//  powerup.js — Item power-up di dunia
// =============================================
import { POWERUP_META } from '../effects/powerup-effects.js';
import { drawSprite, frameForClip, spriteReady } from '../utils/assets.js';

export class PowerUpItem {
  // x, y = posisi item; type = jenis power-up (lihat POWERUP_TYPES).
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.r = 9;
    this.type = type;
    this.collected = false;
  }

  /**
   * Gambar item power-up. Jenis 'life' tampil sebagai hati; jenis lain tampil
   * sebagai bola mengkilap dengan warna sesuai jenisnya.
   */
  draw(ctx, elapsedTime) {
    const meta = POWERUP_META[this.type];
    const color = meta ? meta.color : '#2DE1C7';
    const bob = Math.sin(elapsedTime * 3 + this.x) * 3;
    const y = this.y + bob;

    // 'life' tetap pakai sprite HATI (dikecualikan dari orb seragam).
    if (this.type === 'life') {
      const frame = frameForClip('heart', elapsedTime, 10, 'loop').index;
      if (spriteReady('heart') && drawSprite(ctx, 'heart', this.x, y, this.r * 2.6, frame)) {
        return;
      }
      // Bentuk cadangan sebelum gambar dimuat: hati merah sederhana.
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(this.x, y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      return;
    }

    // Semua power-up lain SERAGAM: orb mengilap dengan bentuk & ukuran sama,
    // dibedakan hanya oleh warna sesuai tipenya (POWERUP_META).
    const pulse = 1 + Math.sin(elapsedTime * 5 + this.x) * 0.08;
    const rr = this.r * pulse;

    // Aura lembut
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, y, rr * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Badan orb
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, y, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Kilau putih kecil
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(this.x - rr * 0.32, y - rr * 0.32, rr * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
}
