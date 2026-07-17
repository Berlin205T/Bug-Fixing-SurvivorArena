// =============================================
//  player.js — Karakter pemain
// =============================================
// Mengurus gerak player, tembakannya, dan efek-efek bonus sementara yang
// didapat dari power-up (damage naik, lari cepat, shotgun, tembak cepat).
import { clamp } from '../utils/helpers.js';
import { WORLD_W, WORLD_H, OBSTACLES } from '../world/background.js';
import { drawSprite, frameForClip, spriteReady } from '../utils/assets.js';
import { DAMAGE_BUFF_BONUS, SPEED_BUFF_BONUS } from '../effects/powerup-effects.js';

export class Player {
  /** Tempatkan player di tengah dunia dengan kemampuan awal. */
  constructor() {
    this.x = WORLD_W / 2;
    this.y = WORLD_H / 2;
    this.r = 12;
    this.baseSpeed = 130; // px/detik
    this.facing = { x: 0, y: -1 };

    this.baseDamage = 8;
    this.baseFireRate = 0.5; // detik antar tembakan
    this.baseRange = 160;

    this.fireCooldown = 0;
    this.damageBuffUntil = 0;
    this.speedBuffUntil = 0;
    // --- MODIFIKASI: TIMER POWER-UP SHOTGUN & RAPID FIRE ---
    this.shotgunBuffUntil = 0;    // <--- DIUBAH JADI TIMER (BUKAN PERMANEN LAGI)
    this.rapidBuffUntil = 0;      // <--- DITAMBAHKAN: TIMER RAPID FIRE / MESIN (OPSI 3)
    this.currentElapsedTime = 0;

    this.invulnerableUntil = 0;

    // --- State animasi ---
    this.facingDir = -1;     // -1 = hadap kiri (West, default sprite), +1 = kanan
    this.moving = false;
    this.clipTime = 0;       // waktu berjalan di klip animasi aktif
    this.firingUntil = 0;    // tampilkan animasi firing sampai elapsedTime ini
    this.dead = false;
    this.deathTime = 0;      // waktu berjalan sejak mulai animasi death
  }

  /**
   * Kekuatan tiap peluru: kekuatan dasar + bonus dari naik level + bonus
   * power-up bila sedang aktif. Saat mode tembak-cepat aktif, kekuatannya
   * sedikit dikurangi biar tetap seimbang.
   */
  get damage() {
    let currentDamage = this.baseDamage + (this.powerLevel || 0) * 2;
    if (this.hasDamageBuff(this.currentElapsedTime)) {
      currentDamage += DAMAGE_BUFF_BONUS;
    }
    if (this.hasRapidFire(this.currentElapsedTime)) {
      currentDamage = Math.max(1, Math.round(currentDamage * 0.7)); // turun 30%
    }
    return currentDamage;
  }

  /** Kecepatan lari sekarang: dasar + bonus power-up bila sedang aktif. */
  speedAt(elapsedTime) {
    return this.baseSpeed + (this.hasSpeedBuff(elapsedTime) ? SPEED_BUFF_BONUS : 0);
  }

  /** Dipanggil tiap kali menembak (peluru tak terbatas, tanpa isi ulang). */
  notifyShot(elapsedTime) {
    this.firingUntil = elapsedTime + 0.35; // lama tampil pose menembak
  }

  /** Menandakan player sedang kebal (baru saja kena serangan). */
  isInvulnerable(elapsedTime) {
    return elapsedTime < this.invulnerableUntil;
  }

  /** Beri kebal sebentar setelah kena serangan, biar tidak langsung kena lagi. */
  takeHit(elapsedTime, invulnSeconds = 1) {
    this.invulnerableUntil = elapsedTime + invulnSeconds;
  }

  /** Mulai animasi player mati. */
  startDeath() {
    if (!this.dead) {
      this.dead = true;
      this.deathTime = 0;
    }
  }

  /** Sedang dalam mode tembak-cepat ('Mesin!'). */
  hasRapidFire(elapsedTime) {
    return elapsedTime < this.rapidBuffUntil;
  }

  /** Sedang dapat bonus damage ('Peluru Sakit!'). */
  hasDamageBuff(elapsedTime) {
    return elapsedTime < this.damageBuffUntil;
  }

  /** Sedang dapat bonus kecepatan ('Lari Cepat!'). */
  hasSpeedBuff(elapsedTime) {
    return elapsedTime < this.speedBuffUntil;
  }

  /** Tiap frame: gerakkan player sesuai arahan, tahan agar tidak menembus pohon/batu. */
  update(dt, input, elapsedTime) {
    this.currentElapsedTime = elapsedTime; // dipakai oleh perhitungan damage di atas
    if (this.dead) {
      this.deathTime += dt;
      return;
    }

    let dx = input.x;
    let dy = input.y;
    const len = Math.hypot(dx, dy);
    this.moving = len > 0.001;
    if (this.moving) {
      dx /= len;
      dy /= len;
      this.facing = { x: dx, y: dy };
      // Arah hadap kiri/kanan hanya berubah saat ada gerakan mendatar.
      // Gerak naik-turun saja mempertahankan arah hadap terakhir.
      if (Math.abs(dx) > 0.01) this.facingDir = dx < 0 ? -1 : 1;
    } else {
      dx = 0;
      dy = 0;
    }

    const speed = this.speedAt(elapsedTime);
    let nextX = this.x + dx * speed * dt;
    let nextY = this.y + dy * speed * dt;

    // Kalau nabrak pohon/batu, dorong player keluar biar tidak menembusnya.
    for (const o of OBSTACLES) {
      const ddx = nextX - o.x;
      const ddy = nextY - o.y;
      const dist = Math.hypot(ddx, ddy);
      const minDist = this.r + o.r;
      if (dist < minDist && dist > 0.001) {
        const push = (minDist - dist) / dist;
        nextX += ddx * push;
        nextY += ddy * push;
      }
    }

    this.x = clamp(nextX, this.r, WORLD_W - this.r);
    this.y = clamp(nextY, this.r, WORLD_H - this.r);

    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    this.clipTime += dt;
  }

  /** Seberapa jauh player bisa melihat saat malam. */
  currentVisionRadius(elapsedTime, baseRadius) {
    return baseRadius;
  }

  /** Seberapa jauh peluru player bisa terbang. */
  currentBulletRange(elapsedTime) {
    return this.baseRange;
  }

  /** Sedang dalam mode shotgun (tembakan menyebar). */
  hasShotgun(elapsedTime) {
    return elapsedTime < this.shotgunBuffUntil;
  }

  /** Tentukan pose player yang pas sekarang (diam/jalan/nembak/mati). */
  activeClip(elapsedTime) {
    if (this.dead) return 'playerDeath';
    if (elapsedTime < this.firingUntil) return 'playerFiring';
    if (this.moving) return 'playerRun';
    return 'playerIdle';
  }

  /** Gambar player sesuai posenya. Sebelum gambarnya dimuat, tampil sebagai bulatan. */
  draw(ctx, elapsedTime) {
    const mirror = this.facingDir > 0; // gambar aslinya hadap kiri; kanan = dibalik
    const size = this.r * 4.2;         // render sedikit lebih besar dari radius fisik

    // --- Path sprite ---
    const clip = this.activeClip(elapsedTime);
    if (spriteReady(clip)) {
      let frame;
      if (clip === 'playerRun') {
        // ping-pong biar loop lari mulus (maju lalu balik), tidak patah.
        frame = frameForClip(clip, this.clipTime, 12, 'pingpong').index;
      } else if (clip === 'playerFiring') {
        frame = frameForClip(clip, elapsedTime, 20, 'loop').index;
      } else if (clip === 'playerDeath') {
        frame = frameForClip(clip, this.deathTime, 10, 'once').index;
      } else {
        frame = 0; // idle
      }

      const blinking = this.isInvulnerable(elapsedTime) && Math.floor(elapsedTime * 12) % 2 === 0;
      if (blinking) ctx.globalAlpha = 0.4;
      drawSprite(ctx, clip, this.x, this.y, size, frame, mirror);
      ctx.globalAlpha = 1;
      return;
    }

    // --- Bentuk cadangan (dipakai sebelum gambar dimuat) ---
    const blinking = this.isInvulnerable(elapsedTime) && Math.floor(elapsedTime * 12) % 2 === 0;
    if (blinking) ctx.globalAlpha = 0.4;

    ctx.fillStyle = '#FF6F59';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFC857';
    ctx.beginPath();
    ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Indikator arah hadap
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(this.x + this.facing.x * this.r * 0.5, this.y + this.facing.y * this.r * 0.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}