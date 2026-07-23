// =============================================
//  enemy-melee.js — Musuh melee: pengejar jarak dekat
// =============================================
// Musuh yang mengejar player, lalu berhenti dan memukul saat sudah dekat.
// Pukulannya melukai tepat di saat ayunan senjata (sekali tiap gerakan serang).
//
// Musuh exploder & laser memakai beberapa fungsi yang sama persis dengan file
// ini: mengurangi darah, menandai kalah, dan memulai animasi mati. Penjelasan
// lengkapnya ada di sini; file mereka hanya memuat bagian yang berbeda.
// (Ketiganya class terpisah tanpa pewarisan — sengaja, biar tiap jenis musuh
// bisa diubah tanpa memengaruhi yang lain.)
import { drawSprite, frameForClip, spriteReady } from '../utils/assets.js';
import { WORLD_W, WORLD_H } from '../world/background.js'; // <--- Tambahkan import batas dunia

let meleeIdCounter = 0;

const ATTACK_TRIGGER_DIST = 20; // jarak "sangat dekat" untuk mulai menyerang
// Siklus animasi attack: 9 frame @ 10fps = 0.9s. Damage terjadi saat ayunan
// senjata (frame ~5, ≈0.5s) — sinkron dengan sabetan di sprite.
const ATTACK_FPS = 10;
const ATTACK_FRAMES = 9;
const ATTACK_DURATION = ATTACK_FRAMES / ATTACK_FPS; // 0.9s
const ATTACK_HIT_TIME = 5 / ATTACK_FPS;             // 0.5s
const ATTACK_HIT_RANGE = 26; // jangkauan sabetan saat momen damage

export class MeleeEnemy {
  // x, y = tempat muncul; hp = darah; damage = kekuatan pukulan;
  // speed = kecepatan gerak.
  constructor(x, y, hp, damage, speed) {
    this.id = meleeIdCounter++;
    this.x = x;
    this.y = y;
    this.r = 11;
    this.hp = hp;
    this.maxHp = hp;
    this.damage = damage;
    this.speed = speed;
    this.dead = false;
    this.hitFlashUntil = 0;

    // --- State animasi ---
    this.facingDir = -1;   // -1 hadap kiri (default sprite), +1 kanan
    this.clipTime = 0;     // waktu berjalan klip run
    this.dying = false;    // sedang memainkan animasi death (belum benar2 dihapus)
    this.deathTime = 0;

    // --- Attack jarak dekat ---
    this.attacking = false;
    this.attackTime = 0;
    this.hitThisCycle = false; // sudah menyerang di siklus animasi ini?
  }

  /**
   * Dijalankan tiap frame: mengejar player, lalu memukul saat sudah dekat.
   * target = player, obstacles = daftar pohon/batu penghalang.
   */
  update(dt, target, elapsedTime, obstacles) {
    if (this.dying) {
      this.deathTime += dt;
      return;
    }

    this.clipTime += dt;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) > 0.5) this.facingDir = dx < 0 ? -1 : 1;

    if (this.attacking) {
      // Sedang menyerang: berhenti bergerak, mainkan animasi sampai selesai.
      this.attackTime += dt;
      if (this.attackTime >= ATTACK_DURATION) {
        this.attacking = false;
        this.attackTime = 0;
        this.hitThisCycle = false;
      }
      return;
    }

    if (dist < ATTACK_TRIGGER_DIST) {
      // Sangat dekat: mulai menyerang (berhenti bergerak siklus ini).
      this.attacking = true;
      this.attackTime = 0;
      this.hitThisCycle = false;
      return;
    }

    let vx = (dx / dist) * this.speed;
    let vy = (dy / dist) * this.speed;

    let nextX = this.x + vx * dt;
    let nextY = this.y + vy * dt;

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

    // --- MODIFIKASI: CLAMP POSISI AGAR TIDAK KELUAR BATAS DUNIA ---
    this.x = Math.max(this.r, Math.min(WORLD_W - this.r, nextX));
    this.y = Math.max(this.r, Math.min(WORLD_H - this.r, nextY));
  }

  /** Kurangi darah + tampilkan kedipan putih sebentar sebagai tanda kena. */
  takeDamage(amount, elapsedTime) {
    if (this.dying) return;
    this.hp -= amount;
    this.hitFlashUntil = elapsedTime + 0.08;
    if (this.hp <= 0) this.hp = 0;
  }

  /** Menandakan darah sudah habis (animasi mati tetap diputar dulu). */
  get defeated() {
    return this.hp <= 0;
  }

  /** Masih bisa jadi sasaran tembakan player selama belum mati. */
  get isTargetable() {
    return !this.dying;
  }

  /**
   * Cek apakah pukulan mengenai player saat ini. Hanya melukai sekali tiap
   * gerakan serang, tepat di saat ayunan senjatanya.
   */
  shouldDealDamage(player) {
    if (!this.attacking || this.dying || this.hitThisCycle) return false;
    if (this.attackTime < ATTACK_HIT_TIME) return false;
    this.hitThisCycle = true; // konsumsi: hanya sekali per siklus animasi
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist < ATTACK_HIT_RANGE;
  }

  /** Mulai animasi mati (dipanggil saat darah habis). */
  startDeath() {
    if (!this.dying) {
      this.dying = true;
      this.deathTime = 0;
    }
  }

  /** Sudah boleh dihapus dari game (animasi matinya sudah selesai). */
  isGone() {
    if (!this.dying) return false;
    if (!spriteReady('meleeDeath')) return true;
    return this.deathTime >= 0.9; // 9 frame @ 10fps
  }

  /** Gambar musuh sesuai keadaannya (jalan/nyerang/mati) + bar darah kecil. */
  draw(ctx, elapsedTime) {
    const flashing = elapsedTime < this.hitFlashUntil;
    const mirror = this.facingDir > 0;
    const size = this.r * 4.2;

    // Pilih klip
    let clip = 'meleeRun';
    let frame = frameForClip('meleeRun', this.clipTime, 12, 'loop').index;
    if (this.dying) {
      clip = 'meleeDeath';
      frame = frameForClip('meleeDeath', this.deathTime, 10, 'once').index;
    } else if (this.attacking) {
      clip = 'meleeAttack';
      frame = frameForClip('meleeAttack', this.attackTime, ATTACK_FPS, 'once').index;
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
      // Fallback primitif (dipakai selama sprite belum ada di src/assets/spritesheets/).
      ctx.fillStyle = flashing ? '#FFFFFF' : '#7B3FE4';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#EAF2FF';
      ctx.beginPath();
      ctx.arc(this.x - 3, this.y - 2, 2, 0, Math.PI * 2);
      ctx.arc(this.x + 3, this.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Indikasi visual sabetan saat fallback primitif (tanpa sprite attack).
      if (this.attacking) {
        const t = this.attackTime / ATTACK_DURATION;
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - t)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 4 + t * 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Mini health bar di atas kepala (sembunyikan saat sedang mati)
    if (!this.dying) {
      const w = this.r * 1.8;
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(this.x - w / 2, this.y - this.r - 8, w, 3);
      ctx.fillStyle = '#FF5470';
      ctx.fillRect(this.x - w / 2, this.y - this.r - 8, w * hpRatio, 3);
    }
  }
}
