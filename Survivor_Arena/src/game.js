// =============================================
//  game.js — Pusat kendali game
// =============================================
// File utama yang mengatur segalanya: pengaturan angka (CONFIG), keadaan
// permainan, memunculkan musuh & item, tembak-menembak, cek tabrakan, naik
// level, dan menggambar semuanya. Dipanggil main.js terus-menerus.
import { Player } from './objects/player.js';
import { MeleeEnemy } from './objects/enemy-melee.js';
import { ExploderEnemy } from './objects/enemy-exploder.js';
import { LaserEnemy } from './objects/enemy-laser.js';
import {
  spawnProjectile, updateProjectiles, drawProjectiles,
  forEachActiveProjectile, clearProjectiles,
} from './objects/projectile-pool.js';
import { PointItem } from './objects/point.js';
import { PowerUpItem } from './objects/powerup.js';
import { WORLD_W, WORLD_H, OBSTACLES, drawBackground } from './world/background.js';
import { updateHUD } from './ui/hud.js';
import { updateVFX, drawVFX, spawnHitParticles, spawnLevelUpBurst, spawnFloatingText, clearVFX } from './effects/vfx.js';
import { sfxShoot, sfxHit, sfxPoint, sfxLevelUp, sfxPowerUp, sfxMonster, sfxGameOver, sfxExplosion, sfxLaser, sfxSwing } from './effects/sfx.js';
import { POWERUP_TYPES, POWERUP_META, applyPowerUp } from './effects/powerup-effects.js';
import { circleCollide, distance, randRange, randInt, randomEdgePoint } from './utils/helpers.js';
import { spriteReady } from './utils/assets.js';
import { viewport, camera, updateCamera } from './viewport.js';
import { VIEWPORT_W, VIEWPORT_H, MINIMAP_W, MINIMAP_H, MINIMAP_MARGIN } from './config.js';
import { isLowQuality } from './quality.js';
import {
  webviewSignalLaunch, webviewSignalStartRound, webviewSignalEndRound, webviewSignalExit,
} from './MpBridge.js';

// Semua angka pengaturan game dikumpulkan di sini biar gampang diubah.
export const CONFIG = {
  STAGE_COUNT: 3,
  STAGE_TARGET: [15, 22, 30],
  STAGE_TIME: [90, 120, 150], // Lvl 1: 1:30, +30 detik tiap naik level
  BASE_ENEMY_HP: 18,
  BASE_ENEMY_DAMAGE: 1,
  ENEMY_HP_GROWTH_PER_STAGE: 1.35,
  ENEMY_DMG_GROWTH_PER_STAGE: 1,
  ENEMY_SPEED: 55,
  ENEMY_SPAWN_INTERVAL: 1.8,
  MAX_MELEE_ENEMY: 8,
  MAX_EXPLODER_ENEMY: 3,
  MAX_LASER_ENEMY: 3,
  POINT_SPAWN_INTERVAL: 2.2,
  POWERUP_SPAWN_INTERVAL: 9,
  // --- Shotgun power-up (orb merah) ---
  SHOTGUN_PELLETS: 5,          // jumlah peluru per tembakan
  SHOTGUN_SPREAD: 0.7,         // total sudut sebaran (radian, ~40 derajat)
  SHOTGUN_RANGE_MULT: 0.56,    // jarak lebih pendek dari peluru biasa (160 -> ~90)
  SHOTGUN_DAMAGE_MULT: 0.6,    // damage per pelet (total besar saat semua kena di jarak dekat)
  SHOTGUN_FIRE_RATE: 0.6,      // jeda antar tembakan shotgun (sedikit lebih lambat)
  MAX_LIVES: 5,
  START_LIVES: 3,
  XP_TO_LEVEL_BASE: 100, // <--- MODIFIKASI XP: DIUBAH MENJADI 100
  NIGHT_VISION_RADIUS: 140,
};

// --- DIKEMBALIKAN KE TOP LEVEL AGAR TOMBOL MULAI SELALU BERFUNGSI ---
const overlayEl = document.getElementById('overlay');
const overlayTitleEl = document.getElementById('overlay-title');
const overlayMessageEl = document.getElementById('overlay-message');
const overlayButtonEl = document.getElementById('overlay-button');
const overlayExitEl = document.getElementById('overlay-exit');

export class Game {
  /** Siapkan game, atur ulang ke kondisi awal, & pasang tombol "Mulai". */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Dipakai untuk sinyal ke host WebView (MpBridge). Sengaja di luar reset()
    // karena harus bertahan saat pemain menekan "Main lagi".
    this.hasLaunched = false;
    // hasExited di-reset di reset() supaya tombol "Keluar" muncul lagi tiap ronde.
    this.hasExited = false;
    this.lastWin = false;
    this.lastScore = 0;

    // Aset belum dimuat. Tombol Mulai ditahan sampai main.js memanggil
    // markReady() — harus di-set sebelum reset(), yang membacanya.
    this.ready = false;

    this.reset();

    if (overlayButtonEl) {
      overlayButtonEl.onclick = () => this.startPlaying();
    }

    // Event Delegation sebagai pengaman ganda tombol Mulai
    document.addEventListener('click', (e) => {
      if (e.target && (e.target.id === 'overlay-button' || e.target.closest('#overlay-button'))) {
        this.startPlaying();
      }
    });

    if (overlayExitEl) {
      overlayExitEl.onclick = () => this.exitGame();
    }
  }

  /**
   * Aset selesai dimuat — buka tombol Mulai. Dipanggil sekali dari main.js.
   */
  markReady() {
    this.ready = true;
    if (overlayButtonEl) {
      overlayButtonEl.disabled = false;
      overlayButtonEl.textContent = 'Mulai';
    }
  }

  /**
   * Mulai bermain dari layar intro atau layar hasil. Pengecekan di awal juga
   * yang membuat tombol Mulai aman ditekan dua kali (lihat pengaman ganda di
   * constructor): panggilan kedua langsung berhenti di sini.
   */
  startPlaying() {
    if (!this.ready) return; // aset belum siap; game belum bisa menggambar
    if (this.state !== 'intro' && this.state !== 'ended') return;
    if (this.state === 'ended') this.reset();

    if (!this.hasLaunched) {
      this.hasLaunched = true;
      webviewSignalLaunch();
    }

    this.state = 'playing';
    if (overlayEl) overlayEl.classList.add('hidden');
    webviewSignalStartRound();
  }

  /** Pemain menekan "Keluar" di panel hasil. Hanya boleh dilaporkan sekali. */
  exitGame() {
    if (this.hasExited) return;
    this.hasExited = true;
    if (overlayExitEl) overlayExitEl.disabled = true;
    webviewSignalExit(this.lastWin, this.lastScore);
  }

  /** Kembalikan semua ke kondisi awal (saat mulai baru atau main lagi). */
  reset() {
    this.state = 'intro';
    this.deathReason = null;
    this.elapsedTime = 0;
    this.stageIndex = 0;
    this.stageCount = CONFIG.STAGE_COUNT;
    this.stageTarget = CONFIG.STAGE_TARGET[0];
    this.timeLeft = CONFIG.STAGE_TIME[0];

    this.score = 0;
    this.stageScore = 0;
    this.xp = 0;
    this.powerLevel = 0;
    this.xpToNextLevel = CONFIG.XP_TO_LEVEL_BASE;

    this.lives = CONFIG.START_LIVES;
    this.maxLives = CONFIG.MAX_LIVES;

    this.player = new Player();
    // Snap kamera ke posisi player yang baru supaya tidak meluncur lambat
    // karena lerp dari posisi kamera lama setelah full restart.
    camera.x = this.player.x - VIEWPORT_W / 2;
    camera.y = this.player.y - VIEWPORT_H / 2;
    this.player.powerLevel = 0;
    this.meleeEnemies = [];
    this.exploderEnemies = [];
    this.laserEnemies = [];
    clearProjectiles();
    this.points = [];
    this.powerUps = [];

    this.meleeSpawnTimer = 0;
    this.exploderSpawnTimer = 3.5;
    this.laserSpawnTimer = 5.0;
    this.pointSpawnTimer = 0.5;
    this.powerUpSpawnTimer = CONFIG.POWERUP_SPAWN_INTERVAL;

    clearVFX();

    // Reset flag exit & tombolnya setiap ronde baru — "Keluar" harus ditawarkan
    // tiap ronde, hanya sinyal webviewSignalExit yang sekali seumur hidup halaman.
    this.hasExited = false;
    if (overlayExitEl) {
      overlayExitEl.disabled = false;
      overlayExitEl.classList.add('hidden');
    }

    if (overlayTitleEl) {
      overlayTitleEl.textContent = 'Survivor Arena';
      overlayMessageEl.textContent = 'Welcome to Survivor Arena!';
      // Selagi aset dimuat, biarkan tombol tetap "Memuat…" (lihat markReady).
      if (this.ready) overlayButtonEl.textContent = 'Mulai';
      if (overlayEl) overlayEl.classList.remove('hidden');
    }
    // Keluar hanya ditawarkan di panel hasil, bukan di layar intro.
    // (Diset di blok reset-flag di atas agar tombol siap dipakai kembali.)
  }

  /** Sedang di level terakhir (malam, pandangan terbatas)? */
  get isNight() {
    return this.stageIndex === this.stageCount - 1;
  }

  /** Munculkan musuh melee dari pinggir; makin tinggi level makin kuat. */
  spawnMeleeEnemy() {
    const p = randomEdgePoint(WORLD_W, WORLD_H, 16);
    const hp = CONFIG.BASE_ENEMY_HP * Math.pow(CONFIG.ENEMY_HP_GROWTH_PER_STAGE, this.stageIndex);
    const dmg = CONFIG.BASE_ENEMY_DAMAGE + CONFIG.ENEMY_DMG_GROWTH_PER_STAGE * this.stageIndex;
    const speed = CONFIG.ENEMY_SPEED + this.stageIndex * 8;
    this.meleeEnemies.push(new MeleeEnemy(p.x, p.y, hp, dmg, speed));
    sfxMonster();
  }

  /** Munculkan musuh exploder; darahnya lebih sedikit dari musuh melee. */
  spawnExploderEnemy() {
    const p = randomEdgePoint(WORLD_W, WORLD_H, 16);
    const baseHp = CONFIG.BASE_ENEMY_HP * Math.pow(CONFIG.ENEMY_HP_GROWTH_PER_STAGE, this.stageIndex);
    const hp = baseHp * 0.75;
    const speed = CONFIG.ENEMY_SPEED + this.stageIndex * 8;
    // Exploder tidak memakai damage numerik — membunuh player via instantKill.
    this.exploderEnemies.push(new ExploderEnemy(p.x, p.y, hp, speed));
    sfxMonster();
  }

  /** Munculkan musuh laser (penembak jarak jauh) dari pinggir. */
  spawnLaserEnemy() {
    const p = randomEdgePoint(WORLD_W, WORLD_H, 16);
    const hp = CONFIG.BASE_ENEMY_HP * Math.pow(CONFIG.ENEMY_HP_GROWTH_PER_STAGE, this.stageIndex);
    const dmg = CONFIG.BASE_ENEMY_DAMAGE + CONFIG.ENEMY_DMG_GROWTH_PER_STAGE * this.stageIndex;
    const speed = CONFIG.ENEMY_SPEED + this.stageIndex * 8;
    this.laserEnemies.push(new LaserEnemy(p.x, p.y, hp, dmg, speed));
    sfxMonster();
  }

  /** Cari tempat acak yang tidak menimpa pohon/batu (coba sampai 20 kali). */
  randomFreePosition(itemR, margin = 24) {
    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 20; attempt++) {
      x = randRange(margin, WORLD_W - margin);
      y = randRange(margin, WORLD_H - margin);
      let overlaps = false;
      for (const o of OBSTACLES) {
        // Dianggap menimpa saat titiknya terlalu dekat dengan pohon/batu
        // (jaraknya lebih kecil dari gabungan ukuran keduanya + sedikit jarak aman).
        if (Math.hypot(x - o.x, y - o.y) < o.r + itemR + 6) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) break; // sudah dapat tempat kosong
    }
    return { x, y };
  }

  /** Munculkan satu koin di tempat acak yang tidak menimpa pohon/batu. */
  spawnPoint() {
    const { x, y } = this.randomFreePosition(7); // 7 = ukuran koin
    this.points.push(new PointItem(x, y, 1));
  }

  /** Munculkan satu power-up acak di tempat yang tidak menimpa pohon/batu. */
  spawnPowerUp() {
    const { x, y } = this.randomFreePosition(9); // 9 = ukuran power-up
    const type = POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)];
    this.powerUps.push(new PowerUpItem(x, y, type));
  }

  /** Semua musuh (melee, exploder, laser) dijadikan satu daftar. */
  allEnemies() {
    return [...this.meleeEnemies, ...this.exploderEnemies, ...this.laserEnemies];
  }

  /** Otomatis bidik musuh terdekat lalu tembak (menyebar saat mode shotgun). */
  tryShoot() {
    if (this.player.fireCooldown > 0) return;

    // Cari musuh terdekat sebagai sasaran.
    let nearest = null;
    let nearestDist = Infinity;
    for (const enemy of this.allEnemies()) {
      if (!enemy.isTargetable) continue;
      const distToEnemy = distance(this.player, enemy);
      if (distToEnemy < nearestDist) {
        nearestDist = distToEnemy;
        nearest = enemy;
      }
    }
    if (!nearest) return;

    // --- MODIFIKASI: CEK STATUS SHOTGUN (DENGAN WAKTU) & RAPID FIRE ---
    const hasShotgun = this.player.hasShotgun(this.elapsedTime);
    const isRapid = this.player.hasRapidFire(this.elapsedTime); // <--- OPSI 3

    // Shotgun: jangkauan lebih pendek dari peluru biasa.
    const range = hasShotgun
      ? this.player.currentBulletRange(this.elapsedTime) * CONFIG.SHOTGUN_RANGE_MULT
      : this.player.currentBulletRange(this.elapsedTime);
    if (nearestDist > range) return;

    const dx = (nearest.x - this.player.x) / nearestDist;
    const dy = (nearest.y - this.player.y) / nearestDist;

    if (hasShotgun) {
      // Tembak menyebar (spread) ke ARAH MUSUH terdekat.
      const baseAngle = Math.atan2(dy, dx);
      const dmg = Math.max(1, Math.round(this.player.damage * CONFIG.SHOTGUN_DAMAGE_MULT));
      const n = CONFIG.SHOTGUN_PELLETS;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i / (n - 1)) - 0.5; // sebar merata -0.5..0.5
        const a = baseAngle + t * CONFIG.SHOTGUN_SPREAD;
        spawnProjectile(this.player.x, this.player.y, Math.cos(a), Math.sin(a), range, dmg);
      }
      // --- MODIFIKASI: KALAU PUNYA SHOTGUN + RAPID FIRE = BURST GUN! ---
      this.player.fireCooldown = isRapid ? 0.2 : CONFIG.SHOTGUN_FIRE_RATE;
    } else {
      spawnProjectile(this.player.x, this.player.y, dx, dy, range, this.player.damage);
      // --- MODIFIKASI: KALAU RAPID FIRE NORMAL = SENAPAN MESIN (0.15s)! ---
      this.player.fireCooldown = isRapid ? 0.15 : this.player.baseFireRate;
    }

    this.player.notifyShot(this.elapsedTime);
    sfxShoot();
  }

  /** Perbarui semuanya satu langkah: player, musuh, peluru, item, tabrakan, waktu. */
  update(dt, input) {
    if (this.state === 'dying') {
      this.elapsedTime += dt;
      this.player.update(dt, { x: 0, y: 0 }, this.elapsedTime);
      updateCamera(this.player.x, this.player.y);
      updateVFX(dt);
      if (this.player.deathTime >= 0.9) {
        this.endGame(false);
      }
      return;
    }

    if (this.state !== 'playing') return;

    this.elapsedTime += dt;
    this.timeLeft -= dt;

    this.player.update(dt, input, this.elapsedTime);
    updateCamera(this.player.x, this.player.y);
    this.tryShoot();

    updateProjectiles(dt);

    for (const meleeEnemy of this.meleeEnemies) {
      const wasAttacking = meleeEnemy.attacking;
      meleeEnemy.update(dt, this.player, this.elapsedTime, OBSTACLES);
      if (!wasAttacking && meleeEnemy.attacking) {
        sfxSwing();
      }
    }
    for (const exploderEnemy of this.exploderEnemies) {
      exploderEnemy.update(dt, this.player, this.elapsedTime, OBSTACLES);
      if (exploderEnemy.consumeExplosionTrigger()) {
        spawnHitParticles(exploderEnemy.x, exploderEnemy.y, '#FF6B4A', 14);
        sfxExplosion();
      }
      if (exploderEnemy.hitsPlayerNow(this.player, this.elapsedTime)) {
        this.onPlayerHit(1, { instantKill: true });
      }
    }
    for (const laserEnemy of this.laserEnemies) {
      laserEnemy.update(dt, this.player, this.elapsedTime, OBSTACLES);
      if (laserEnemy.shouldFireLaser()) {
        const dx = this.player.x - laserEnemy.x;
        const dy = this.player.y - laserEnemy.y;
        const dist = Math.hypot(dx, dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;
        const muzzle = laserEnemy.r + 8;
        const sx = laserEnemy.x + dirX * muzzle;
        const sy = laserEnemy.y + dirY * muzzle;
        const laser = spawnProjectile(sx, sy, dirX, dirY, laserEnemy.attackRange, laserEnemy.damage, true);
        laser.isLaser = true;
        sfxLaser();
      }
    }

    forEachActiveProjectile((proj) => {
      if (proj.isEnemy) return;
      for (const meleeEnemy of this.meleeEnemies) {
        if (meleeEnemy.dying) continue;
        if (circleCollide(proj, meleeEnemy)) {
          meleeEnemy.takeDamage(proj.damage, this.elapsedTime);
          proj.dead = true;
          spawnHitParticles(meleeEnemy.x, meleeEnemy.y, '#7B3FE4', 6);
          sfxHit();
          if (meleeEnemy.defeated) {
            meleeEnemy.startDeath();
            this.onEnemyKilled(meleeEnemy);
          }
          break;
        }
      }
      for (const exploderEnemy of this.exploderEnemies) {
        if (exploderEnemy.dying || exploderEnemy.attacking) continue;
        if (circleCollide(proj, exploderEnemy)) {
          exploderEnemy.takeDamage(proj.damage, this.elapsedTime);
          proj.dead = true;
          spawnHitParticles(exploderEnemy.x, exploderEnemy.y, '#FF6B4A', 6);
          sfxHit();
          if (exploderEnemy.defeated) {
            exploderEnemy.startDeath();
            this.onEnemyKilled(exploderEnemy);
          }
          break;
        }
      }
      for (const laserEnemy of this.laserEnemies) {
        if (laserEnemy.dying) continue;
        if (circleCollide(proj, laserEnemy)) {
          laserEnemy.takeDamage(proj.damage, this.elapsedTime);
          proj.dead = true;
          spawnHitParticles(laserEnemy.x, laserEnemy.y, '#4A90E2', 6);
          sfxHit();
          if (laserEnemy.defeated) {
            laserEnemy.startDeath();
            this.onEnemyKilled(laserEnemy);
          }
          break;
        }
      }
    });

    this.meleeEnemies = this.meleeEnemies.filter((meleeEnemy) => !meleeEnemy.isGone());
    this.exploderEnemies = this.exploderEnemies.filter((exploderEnemy) => !exploderEnemy.isGone());
    this.laserEnemies = this.laserEnemies.filter((laserEnemy) => !laserEnemy.isGone());

    for (const meleeEnemy of this.meleeEnemies) {
      if (meleeEnemy.shouldDealDamage(this.player)) {
        this.onPlayerHit(meleeEnemy.damage);
      }
    }

    if (!this.player.isInvulnerable(this.elapsedTime)) {
      let alreadyHit = false;
      forEachActiveProjectile((proj) => {
        if (alreadyHit || !proj.isEnemy || proj.dead) return;
        if (circleCollide(this.player, proj)) {
          alreadyHit = true;
          this.onPlayerHit(proj.damage);
          proj.dead = true;
        }
      });
    }

    for (const pt of this.points) {
      if (!pt.collected && circleCollide(this.player, pt)) {
        pt.collected = true;
        this.onPointCollected(pt);
      }
    }
    this.points = this.points.filter((p) => !p.collected);

    for (const pu of this.powerUps) {
      if (!pu.collected && circleCollide(this.player, pu)) {
        pu.collected = true;
        applyPowerUp(pu.type, this.player, this);
        
        let text = 'Power Up!';
        if (pu.type === 'life') text = '+1 Nyawa!';
        if (pu.type === 'damage') text = 'Peluru Sakit!';
        if (pu.type === 'speed') text = 'Lari Cepat!';
        if (pu.type === 'shotgun') text = 'Shotgun!';
        if (pu.type === 'rapid') text = 'Mesin!'; // <--- MODIFIKASI: TEKS RAPID FIRE

        spawnFloatingText(pu.x, pu.y - 20, text, '#FFC857');
        sfxPowerUp();
      }
    }
    this.powerUps = this.powerUps.filter((p) => !p.collected);

    const alive = (enemyList) => enemyList.filter((enemy) => !enemy.dying).length;

    // --- SPAWN MUSUH BERTAHAP ---
    this.meleeSpawnTimer -= dt;
    if (this.meleeSpawnTimer <= 0) {
      if (alive(this.meleeEnemies) < CONFIG.MAX_MELEE_ENEMY) this.spawnMeleeEnemy();
      this.meleeSpawnTimer = CONFIG.ENEMY_SPAWN_INTERVAL;
    }

    if (this.stageIndex >= 1) {
      this.laserSpawnTimer -= dt;
      if (this.laserSpawnTimer <= 0) {
        if (alive(this.laserEnemies) < CONFIG.MAX_LASER_ENEMY) this.spawnLaserEnemy();
        this.laserSpawnTimer = CONFIG.ENEMY_SPAWN_INTERVAL * 2.8;
      }
    }

    if (this.stageIndex >= 2) {
      this.exploderSpawnTimer -= dt;
      if (this.exploderSpawnTimer <= 0) {
        if (alive(this.exploderEnemies) < CONFIG.MAX_EXPLODER_ENEMY) this.spawnExploderEnemy();
        this.exploderSpawnTimer = CONFIG.ENEMY_SPAWN_INTERVAL * 3.5;
      }
    }

    this.pointSpawnTimer -= dt;
    if (this.pointSpawnTimer <= 0) {
      this.spawnPoint();
      this.pointSpawnTimer = CONFIG.POINT_SPAWN_INTERVAL;
    }
    this.powerUpSpawnTimer -= dt;
    if (this.powerUpSpawnTimer <= 0) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = CONFIG.POWERUP_SPAWN_INTERVAL;
    }

    updateVFX(dt);

    if (this.stageScore >= this.stageTarget) {
      this.advanceStage();
    } else if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.deathReason = 'timeout';
      this.startPlayerDeath();
    }

    updateHUD(this);
  }

  /** Saat koin diambil: tambah skor & poin level, lalu cek apakah naik level. */
  onPointCollected(pt) {
    this.score += 10 * pt.value;
    this.stageScore += pt.value;
    // <--- MODIFIKASI XP: HAPUS PENAMBAHAN XP DARI KOIN
    spawnFloatingText(pt.x, pt.y, '+10', '#FFC857');
    sfxPoint();
    this.checkPowerLevelUp();
  }

  /** Saat musuh mati: tambah skor & XP, lalu cek apakah naik level. */
  onEnemyKilled(enemy) {
    this.score += 15;
    this.xp += 12; // <--- MODIFIKASI XP: XP MURNI DARI BUNUH MUSUH
    spawnFloatingText(enemy.x, enemy.y - 10, '+15', '#FF6F59');
    this.checkPowerLevelUp();
  }

  /** Kalau XP cukup, naik level (dan XP untuk level berikutnya jadi 2x lebih banyak). */
  checkPowerLevelUp() {
    if (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.powerLevel += 1;
      this.player.powerLevel = this.powerLevel;
      // <--- MODIFIKASI XP: KURVA LEVEL UP MENJADI * 2.0x
      this.xpToNextLevel = Math.round(this.xpToNextLevel * 2.0);
      
      spawnLevelUpBurst(this.player.x, this.player.y);
      spawnFloatingText(this.player.x, this.player.y - 30, 'LEVEL UP! Damage+', '#2DE1C7');
      sfxLevelUp();
    }
  }

  /** Player kena serangan: kurangi nyawa, beri kebal sebentar, cek kalah. */
  onPlayerHit(damage = 1, { instantKill = false } = {}) {
    if (this.player.isInvulnerable(this.elapsedTime)) return;
    this.lives -= instantKill ? this.lives : damage;
    if (this.lives < 0) this.lives = 0;
    this.player.takeHit(this.elapsedTime, 1.2);
    spawnHitParticles(this.player.x, this.player.y, '#FF5470', 10);
    sfxHit();
    if (this.lives <= 0) {
      this.deathReason = 'defeated';
      this.startPlayerDeath();
    }
  }

  /** Mulai player mati: putar animasi matinya dulu, atau langsung berakhir. */
  startPlayerDeath() {
    this.player.startDeath();
    sfxGameOver();
    if (spriteReady('playerDeath')) {
      this.state = 'dying';
    } else {
      this.endGame(false);
    }
  }

  /** Lanjut ke level berikutnya; menang begitu level terakhir selesai. */
  advanceStage() {
    this.stageIndex += 1;
    if (this.stageIndex >= this.stageCount) {
      this.endGame(true); // endGame yang melaporkan berakhirnya level terakhir
      return;
    }

    // Satu level = satu round bagi host WebView: tutup level yang barusan
    // selesai, lalu buka level baru bersamaan dengan reset state di bawah.
    webviewSignalEndRound(true, this.score);
    webviewSignalStartRound();

    this.stageScore = 0;
    this.stageTarget = CONFIG.STAGE_TARGET[this.stageIndex];
    this.timeLeft = CONFIG.STAGE_TIME[this.stageIndex];
    this.meleeEnemies = [];
    this.exploderEnemies = [];
    this.laserEnemies = [];
    clearProjectiles();
    // Bersihkan item, power-up, dan efek yang belum dikoleksi agar tidak
    // terbawa ke stage baru (mencegah skor gratis + spawn spike).
    this.points = [];
    this.powerUps = [];
    clearVFX();
    // Reset timer spawn ke kondisi awal agar tidak ada penumpukan spawn
    // akibat timer yang sudah terlanjur kecil/mendekati 0.
    this.meleeSpawnTimer = CONFIG.ENEMY_SPAWN_INTERVAL;
    this.pointSpawnTimer = CONFIG.POINT_SPAWN_INTERVAL;
    this.powerUpSpawnTimer = CONFIG.POWERUP_SPAWN_INTERVAL;
    this.exploderSpawnTimer = 3.5;
    this.laserSpawnTimer = 5.0;
    spawnLevelUpBurst(this.player.x, this.player.y, '#2DE1C7');
    sfxLevelUp();
  }

  /** Akhiri permainan & tampilkan layar hasil (won = menang atau kalah). */
  endGame(won) {
    this.state = 'ended';
    sfxGameOver();

    this.lastWin = won;
    this.lastScore = this.score;
    webviewSignalEndRound(won, this.score);

    if (overlayExitEl) overlayExitEl.classList.remove('hidden');

    if (overlayTitleEl) {
      overlayTitleEl.textContent = won ? 'Kamu selamat!' : 'Game over';
      const lossReason = this.deathReason === 'timeout'
        ? `Waktu habis di level ${this.stageIndex + 1}`
        : `Kehabisan nyawa di level ${this.stageIndex + 1}`;
      overlayMessageEl.textContent = won
        ? `Semua level selesai. Skor akhir: ${this.score}`
        : `${lossReason}. Skor akhir: ${this.score}`;
      overlayButtonEl.textContent = 'Main lagi';
      if (overlayEl) overlayEl.classList.remove('hidden');
    }
  }

  /** Gambar satu tampilan: latar, item, musuh, peluru, player, efek, peta kecil. */
  render() {
    const ctx = this.ctx;
    const { scale, offsetX, offsetY } = viewport;

    // Canvas kini pas seukuran area main (lihat resizeViewport), jadi cukup satu
    // isian penuh sebagai dasar — clearRect sebelumnya hanya mengulang kerja
    // yang sama. Bar hitam di sisa layar sudah jadi latar CSS, bukan digambar.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VIEWPORT_W, VIEWPORT_H);
    ctx.clip();

    ctx.translate(-camera.x, -camera.y);

    drawBackground(ctx, this.isNight, camera.x, camera.y, VIEWPORT_W, VIEWPORT_H);

    for (const pt of this.points) pt.draw(ctx, this.elapsedTime);
    for (const pu of this.powerUps) pu.draw(ctx, this.elapsedTime);
    for (const meleeEnemy of this.meleeEnemies) meleeEnemy.draw(ctx, this.elapsedTime);
    for (const exploderEnemy of this.exploderEnemies) exploderEnemy.draw(ctx, this.elapsedTime);
    for (const laserEnemy of this.laserEnemies) laserEnemy.draw(ctx, this.elapsedTime);
    drawProjectiles(ctx);
    this.player.draw(ctx, this.elapsedTime);

    drawVFX(ctx);

    if (this.isNight) {
      this.drawNightMask(ctx);
    }

    ctx.restore();

    if (this.state === 'playing' || this.state === 'dying') {
      this.drawMiniMap(ctx);
    }
  }

  /** Gelapkan layar kecuali lingkaran di sekitar player, seperti efek senter. */
  drawNightMask(ctx) {
    const radius = this.player.currentVisionRadius(this.elapsedTime, CONFIG.NIGHT_VISION_RADIUS);
    
    ctx.save();
    // 1. Gambar kegelapan malam DI LUAR lingkaran pandangan (menggunakan aturan evenodd)
    ctx.fillStyle = 'rgba(5, 7, 15, 0.94)';
    ctx.beginPath();
    // Kotak menutupi seluruh area dunia game
    ctx.rect(0, 0, WORLD_W, WORLD_H);
    // Lubang lingkaran berlawanan arah jarum jam tepat di posisi player
    ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2, true);
    ctx.fill('evenodd');

    // 2. Efek transisi halus (soft glow) di pinggiran senter agar tidak kaku
    if (!isLowQuality()) {
      const gradient = ctx.createRadialGradient(
        this.player.x, this.player.y, radius * 0.5,
        this.player.x, this.player.y, radius
      );
      gradient.addColorStop(0, 'rgba(5, 7, 15, 0)');
      gradient.addColorStop(1, 'rgba(5, 7, 15, 0.94)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Gambar peta kecil: koin, power-up, musuh, area yang terlihat, & posisi player. */
  drawMiniMap(ctx) {
    const mapW = MINIMAP_W;
    const mapH = MINIMAP_H;
    const margin = MINIMAP_MARGIN;
    const mapX = VIEWPORT_W - mapW - margin;
    const mapY = margin;

    ctx.save();
    ctx.fillStyle = 'rgba(11, 15, 43, 0.85)';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = '#2DE1C7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    const scaleX = mapW / WORLD_W;
    const scaleY = mapH / WORLD_H;

    ctx.fillStyle = '#FFC857';
    for (const pt of this.points) {
      if (pt.collected) continue;
      ctx.beginPath();
      ctx.arc(mapX + pt.x * scaleX, mapY + pt.y * scaleY, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Power-up seragam di minimap: lingkaran berwarna ukuran sama, dibedakan
    // hanya oleh warna tipenya — KECUALI 'life' yang tetap simbol hati.
    for (const pu of this.powerUps) {
      if (pu.collected) continue;
      const meta = POWERUP_META[pu.type];
      const px = mapX + pu.x * scaleX;
      const py = mapY + pu.y * scaleY;

      if (pu.type === 'life') {
        ctx.fillStyle = meta ? meta.color : '#FF5470';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❤', px, py + 0.5);
        continue;
      }

      ctx.fillStyle = meta ? meta.color : '#2DE1C7';
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    ctx.fillStyle = '#FF5470';
    for (const enemy of this.allEnemies()) {
      if (enemy.dying) continue;
      ctx.fillRect(mapX + enemy.x * scaleX - 1.5, mapY + enemy.y * scaleY - 1.5, 3, 3);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      mapX + camera.x * scaleX,
      mapY + camera.y * scaleY,
      VIEWPORT_W * scaleX,
      VIEWPORT_H * scaleY
    );

    ctx.fillStyle = '#FFC857';
    ctx.beginPath();
    ctx.arc(mapX + this.player.x * scaleX, mapY + this.player.y * scaleY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}