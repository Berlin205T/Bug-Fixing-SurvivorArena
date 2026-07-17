// =============================================
//  enemy-laser.js — Musuh laser: penembak jarak jauh
// =============================================
// Musuh yang mendekat sampai player masuk jarak tembak, lalu berhenti dan
// menembakkan laser secara berkala (diberi jeda biar tidak terlalu sering).
//
// Fungsi dasar yang sama dengan musuh melee (mengurangi darah, menandai kalah,
// memulai animasi mati) dijelaskan di enemy-melee.js — di sini fokus ke
// lasernya.
import { drawSprite, frameForClip, spriteReady } from '../utils/assets.js';

let laserIdCounter = 0;

export class LaserEnemy {
  // Sama seperti musuh melee; damage di sini dipakai untuk lasernya.
  constructor(x, y, hp, damage, speed) {
    this.id = laserIdCounter++;
    this.x = x;
    this.y = y;
    this.r = 11;
    this.hp = hp;
    this.maxHp = hp;
    this.damage = damage;
    this.speed = speed;
    this.hitFlashUntil = 0;

    // --- State animasi ---
    this.facingDir = -1;
    this.clipTime = 0;
    this.dying = false;
    this.deathTime = 0;

    // --- Serangan jarak jauh (laser) ---
    this.attacking = false;
    this.attackTime = 0;
    this.attackRange = 240;  // 1.5x player range (160 * 1.5)
    // Siklus animasi attack: 9 frame @ 10fps = 0.9s. Laser dilepas saat animasi
    // mencapai frame "mulut terbuka penuh" (frame 8 ≈ 0.8s), lalu reset.
    this.attackFps = 10;
    this.attackFrames = 9;
    this.attackDuration = this.attackFrames / this.attackFps; // 0.9s
    this.laserFrame = 8;                                       // frame pelepasan laser
    this.laserFireTime = this.laserFrame / this.attackFps;    // 0.8s
    this.firedThisCycle = false; // sudah tembak di siklus animasi ini?

    // Fire rate diturunkan 35%: jeda ekstra di antara siklus tembak
    // (kecepatan animasi windup/laser sendiri tidak berubah).
    this.refireCooldown = 0;
    this.refireDelay = this.attackDuration * 0.35;
  }

  /** Tiap frame: mendekat selama player jauh, lalu berhenti & menembak saat dekat. */
  update(dt, target, elapsedTime, obstacles) {
    if (this.dying) {
      this.deathTime += dt;
      return;
    }

    this.clipTime += dt;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distToPlayer = Math.hypot(dx, dy) || 1;

    // Cek apakah player dalam range serangan
    const inRange = distToPlayer < this.attackRange;

    if (inRange) {
      if (!this.attacking) {
        // Baru masuk mode attack: mulai siklus animasi dari awal.
        this.attacking = true;
        this.attackTime = 0;
        this.firedThisCycle = false;
        this.refireCooldown = 0;
      }

      if (this.refireCooldown > 0) {
        // Jeda fire rate: animasi ditahan di frame terakhir sampai jeda habis.
        this.refireCooldown -= dt;
        if (this.refireCooldown <= 0) {
          this.attackTime = 0;
          this.firedThisCycle = false;
        }
      } else {
        this.attackTime += dt; // maju animasi attack di update (bukan draw)
        if (this.attackTime >= this.attackDuration) {
          // Selesai satu siklus animasi → mulai jeda fire rate sebelum siklus
          // baru. Waktu dipatok tepat di frame terakhir (bukan attackDuration
          // penuh) supaya frameForClip (mode loop) tidak wrap balik ke frame 0.
          this.attackTime = (this.attackFrames - 1) / this.attackFps;
          this.refireCooldown = this.refireDelay;
        }
      }
    } else {
      this.attacking = false;
      this.attackTime = 0;
      this.firedThisCycle = false;
      this.refireCooldown = 0;
    }

    // Menghadap ke arah player
    if (Math.abs(dx) > 0.5) this.facingDir = dx < 0 ? -1 : 1;

    // Kalau tidak dalam range serangan, bergerak mendekati player
    if (!this.attacking) {
      let vx = (dx / distToPlayer) * this.speed;
      let vy = (dy / distToPlayer) * this.speed;

      let nextX = this.x + vx * dt;
      let nextY = this.y + vy * dt;

      // Obstacle collision
      for (const o of obstacles) {
        const ddx = nextX - o.x;
        const ddy = nextY - o.y;
        const d = Math.hypot(ddx, ddy);
        const minDist = this.r + o.r;
        if (d < minDist && d > 0.001) {
          const push = (minDist - d) / d;
          nextX += ddx * push;
          nextY += ddy * push;
        }
      }

      this.x = nextX;
      this.y = nextY;
    }
  }

  // takeDamage, defeated, isTargetable, startDeath, isGone: sama seperti musuh melee.
  takeDamage(amount, elapsedTime) {
    if (this.dying) return;
    this.hp -= amount;
    this.hitFlashUntil = elapsedTime + 0.08;
    if (this.hp <= 0) this.hp = 0;
  }

  get defeated() {
    return this.hp <= 0;
  }

  get isTargetable() {
    return !this.dying;
  }

  startDeath() {
    if (!this.dying) {
      this.dying = true;
      this.deathTime = 0;
    }
  }

  isGone() {
    if (!this.dying) return false;
    if (!spriteReady('laserDeath')) return true;
    return this.deathTime >= 0.3; // 3 frame @ 10fps
  }

  /** Cek apakah laser dilepas saat ini (sekali tiap gerakan menembak). */
  shouldFireLaser() {
    if (!this.attacking || this.dying || this.firedThisCycle) return false;
    if (this.attackTime >= this.laserFireTime) {
      this.firedThisCycle = true;
      return true;
    }
    return false;
  }

  /** Gambar musuh sesuai keadaannya (jalan/nembak/mati) + bar darah kecil. */
  draw(ctx, elapsedTime) {
    const flashing = elapsedTime < this.hitFlashUntil;
    // Sprite Demon_1 default menghadap KANAN (East), jadi mirror saat hadap kiri.
    const mirror = this.facingDir < 0;
    const size = this.r * 4.2;

    // Pilih klip
    let clip = 'laserRun';
    let frame = frameForClip('laserRun', this.clipTime, 12, 'loop').index;
    if (this.dying) {
      clip = 'laserDeath';
      frame = frameForClip('laserDeath', this.deathTime, 10, 'once').index;
    } else if (this.attacking) {
      clip = 'laserAttack';
      frame = frameForClip('laserAttack', this.attackTime, 10, 'loop').index;
    }

    if (spriteReady(clip)) {
      drawSprite(ctx, clip, this.x, this.y, size, frame, mirror);
      if (flashing && !this.dying) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Fallback primitif: berwarna biru (jarak jauh mage)
      ctx.fillStyle = flashing ? '#FFFFFF' : '#4A90E2';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();

      if (this.attacking) {
        // Indikasi range attack: lingkaran garis
        ctx.strokeStyle = 'rgba(74, 144, 226, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Mini health bar
    if (!this.dying) {
      const w = this.r * 1.8;
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(this.x - w / 2, this.y - this.r - 8, w, 3);
      ctx.fillStyle = '#4A90E2';
      ctx.fillRect(this.x - w / 2, this.y - this.r - 8, w * hpRatio, 3);
    }
  }
}
