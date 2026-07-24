// =============================================
//  enemy-exploder.js — Musuh exploder: peledak nekat (kamikaze)
// =============================================
// Musuh cepat yang mengejar player, dan begitu dekat ia berhenti sebentar
// (ancang-ancang) lalu MELEDAK. Ledakannya melukai player yang ada di dekatnya.
// Darahnya lebih sedikit, larinya dua kali lebih cepat dari musuh melee.
//
// Fungsi dasar yang sama dengan musuh melee (mengurangi darah, menandai kalah,
// memulai animasi mati) dijelaskan di enemy-melee.js — di sini fokus ke
// ledakannya.
import { drawSprite, frameForClip, spriteReady } from '../utils/assets.js';
import { WORLD_W, WORLD_H } from '../world/background.js';

let exploderIdCounter = 0;

const ATTACK_TRIGGER_DIST = 42; // sedekat apa baru mulai ancang-ancang meledak
const WINDUP_TIME = 0.5;        // lama ancang-ancang sebelum meledak (detik)
const EXPLODE_RADIUS = 46;      // seberapa luas ledakan melukai player

export class ExploderEnemy {
  // Sama seperti musuh melee; kecepatannya digandakan di dalam.
  // Catatan: konstruktor TIDAK menerima parameter `damage` karena Exploder
  // membunuh player lewat flag instantKill (lihat game.js:onPlayerHit),
  // bukan damage numerik. Ini by design — Exploder = bom kamikaze.
  constructor(x, y, hp, speed) {
    this.id = exploderIdCounter++;
    this.x = x;
    this.y = y;
    this.r = 11;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed * 2; // 2x speed
    this.hitFlashUntil = 0;

    // --- State animasi ---
    this.facingDir = -1;
    this.clipTime = 0;
    this.dying = false;
    this.deathTime = 0;

    // --- Serangan ledakan ---
    this.attacking = false;  // sedang windup sebelum meledak
    this.attackTime = 0;
    this.explodeRadius = EXPLODE_RADIUS;
    this.explosionActive = false; // radius ledakan aktif (sepanjang animasi mati)
    this.hasHitPlayer = false;    // player sudah kena ledakan (cegah damage berulang)
    this.explosionJustTriggered = false; // one-shot: baru saja mulai meledak
  }

  /** Tiap frame: kejar player, ancang-ancang saat dekat, lalu meledak. */
  update(dt, target, elapsedTime, obstacles) {
    if (this.dying) {
      this.deathTime += dt;
      // Radius ledakan hanya aktif di paruh awal animasi mati (momen ledakan).
      if (this.deathTime > 0.5) this.explosionActive = false;
      return;
    }

    this.clipTime += dt;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distToPlayer = Math.hypot(dx, dy) || 1;

    // Sedang windup ledakan: diam, hitung waktu; saat selesai -> mati (ledakan
    // dipicu di startDeath()).
    if (this.attacking) {
      this.attackTime += dt;
      if (this.attackTime >= WINDUP_TIME) {
        this.startDeath();
      }
      return;
    }

    // Mulai ancang-ancang saat sudah cukup dekat.
    if (distToPlayer < ATTACK_TRIGGER_DIST) {
      this.attacking = true;
      this.attackTime = 0;
      return;
    }

    // Chase player.
    if (Math.abs(dx) > 0.5) this.facingDir = dx < 0 ? -1 : 1;

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

    this.x = Math.max(0, Math.min(WORLD_W - this.r, nextX));
    this.y = Math.max(0, Math.min(WORLD_H - this.r, nextY));
  }

  /** Seperti musuh melee; tidak mempan saat sudah ancang-ancang meledak. */
  takeDamage(amount, elapsedTime) {
    if (this.dying || this.attacking) return;
    this.hp -= amount;
    this.hitFlashUntil = elapsedTime + 0.08;
    if (this.hp <= 0) this.hp = 0;
  }

  /** Menandakan darah sudah habis. */
  get defeated() {
    return this.hp <= 0;
  }

  /** Tidak bisa ditembak saat sedang ancang-ancang meledak atau sudah mati. */
  get isTargetable() {
    return !this.dying && !this.attacking;
  }

  /** Mulai mati sekaligus MELEDAK (entah karena ancang-ancang selesai atau kena tembak). */
  startDeath() {
    if (!this.dying) {
      this.dying = true;
      this.deathTime = 0;
      // Musuh ini SELALU meledak saat mati (baik windup selesai maupun kena tembak).
      // Radius ledakan aktif sepanjang animasi mati.
      this.explosionActive = true;
      // One-shot flag: game.js consume ini untuk trigger SFX/VFX ledakan TEPAT
      // sekali, tidak peduli dari jalur mana startDeath() dipanggil (windup
      // ATAU kena tembak) — lebih robust daripada bandingkan state antar frame.
      this.explosionJustTriggered = true;
    }
  }

  /**
   * Kasih tahu game "aku baru saja meledak" tepat sekali, supaya suara & efek
   * ledakan cuma dipicu satu kali.
   */
  consumeExplosionTrigger() {
    if (!this.explosionJustTriggered) return false;
    this.explosionJustTriggered = false;
    return true;
  }

  /** Sudah boleh dihapus (animasi matinya selesai). */
  isGone() {
    if (!this.dying) return false;
    if (!spriteReady('exploderAttack')) return true;
    return this.deathTime >= 0.9; // 9 frame @ 10fps
  }

  /**
   * Cek apakah player sedang berada di dalam ledakan. Cuma melukai sekali
   * per ledakan — tapi TIDAK mengunci flag hasHitPlayer kalau hit akan
   * diabaikan karena player sedang i-frame (lihat onPlayerHit). Tanpa
   * pengecualian ini, satu ledakan yang masuk saat i-frame bisa
   * "menelan" kesempatan hit berikutnya yang sah.
   */
  hitsPlayerNow(player, elapsedTime) {
    if (!this.explosionActive || this.hasHitPlayer) return false;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist >= this.explodeRadius) return false;
    // Hormati i-frame: jangan bakar kuota satu-hit bila damage akan
    // dibuang oleh onPlayerHit.
    if (player.isInvulnerable && player.isInvulnerable(elapsedTime)) return false;
    this.hasHitPlayer = true; // cegah damage berulang dari ledakan yang sama
    return true;
  }

  /** Gambar musuh + lingkaran peringatan ancang-ancang + efek ledakan + bar darah. */
  draw(ctx, elapsedTime) {
    const flashing = elapsedTime < this.hitFlashUntil;
    const mirror = this.facingDir > 0;
    const size = this.r * 4.2;

    // Pilih klip: run -> attack (windup) -> death (reuse attack sprite).
    let clip = 'exploderRun';
    let frame = frameForClip('exploderRun', this.clipTime, 12, 'loop').index;
    if (this.dying) {
      clip = 'exploderAttack';
      frame = frameForClip('exploderAttack', this.deathTime, 10, 'once').index;
    } else if (this.attacking) {
      clip = 'exploderAttack';
      frame = frameForClip('exploderAttack', this.attackTime, 12, 'once').index;
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
      // Fallback primitif: berwarna merah (ledakan)
      ctx.fillStyle = flashing ? '#FFFFFF' : '#FF6B4A';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Indikator windup: cincin merah membesar (peringatan ke player).
    if (this.attacking && !this.dying) {
      const t = Math.min(1, this.attackTime / WINDUP_TIME);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.35 * t;
      ctx.strokeStyle = '#FF6B4A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.explodeRadius * t, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Ledakan aktif saat mati: lingkaran oranye transparan + cincin (radius damage).
    if (this.explosionActive) {
      const t = Math.min(1, this.deathTime / 0.5); // 0..1 sepanjang fase ledakan
      ctx.save();
      ctx.globalAlpha = 0.4 * (1 - t);
      ctx.fillStyle = '#FF8A3D';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.7 * (1 - t);
      ctx.strokeStyle = '#FF6B4A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Mini health bar (sembunyikan saat windup/mati).
    if (!this.dying && !this.attacking) {
      const w = this.r * 1.8;
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(this.x - w / 2, this.y - this.r - 8, w, 3);
      ctx.fillStyle = '#FF6B4A';
      ctx.fillRect(this.x - w / 2, this.y - this.r - 8, w * hpRatio, 3);
    }
  }
}
