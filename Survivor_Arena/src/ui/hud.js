// =============================================
//  hud.js — Info di layar (nyawa, skor, level, waktu)
// =============================================
// Info seperti nyawa, level, timer, dan skor ditampilkan sebagai tulisan HTML
// di atas game, bukan digambar bareng game-nya. File ini bertugas memperbarui
// tulisan-tulisan itu tiap saat supaya selalu sesuai keadaan game.
import { formatTime } from '../utils/helpers.js';
import { POWERUP_META, BUFF_SECONDS } from '../effects/powerup-effects.js';

const livesEl = document.getElementById('lives');
const stageLabelEl = document.getElementById('stage-label');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const levelBadgeEl = document.getElementById('level-badge');
const xpFillEl = document.getElementById('xp-bar-fill');
const buffListEl = document.getElementById('buff-list');

// Daftar efek sementara yang perlu ditampilkan beserta ikonnya, buat
// memunculkan penanda hitung mundur di layar. Lama tiap efek diambil dari
// BUFF_SECONDS (powerup-effects.js), bukan ditulis ulang di sini \u2014 biar bar
// sisa waktu tidak mungkin beda dengan efek yang sebenarnya berlaku.
const TRACKED_BUFFS = [
  { key: 'damageBuffUntil', type: 'damage', icon: '\u2694\ufe0f' },
  { key: 'speedBuffUntil', type: 'speed', icon: '\u26a1' },
  { key: 'shotgunBuffUntil', type: 'shotgun', icon: '\ud83d\udca5' },
  { key: 'rapidBuffUntil', type: 'rapid', icon: '\ud83d\udd25' },
];

// Simpan penanda efek yang sudah dibuat, biar tidak dibuat ulang tiap saat.
const buffBadgeEls = {};

/** Ambil penanda efek untuk satu jenis (dibuat sekali, lalu dipakai ulang). */
function getBuffBadge(type) {
  if (buffBadgeEls[type]) return buffBadgeEls[type];

  const meta = POWERUP_META[type];
  const badge = document.createElement('div');
  badge.className = 'buff-badge';
  badge.innerHTML = `
    <span class="buff-icon"></span>
    <div class="buff-info">
      <div class="buff-name" style="color:${meta.color}">${meta.label}</div>
      <div class="buff-track"><div class="buff-fill" style="background:${meta.color}"></div></div>
    </div>
    <span class="buff-time"></span>
  `;
  buffListEl.appendChild(badge);

  const els = {
    root: badge,
    icon: badge.querySelector('.buff-icon'),
    fill: badge.querySelector('.buff-fill'),
    time: badge.querySelector('.buff-time'),
    shownVisible: null, // keadaan terakhir yang sudah ditulis (lihat catatan di bawah)
    shownTime: '',
  };
  buffBadgeEls[type] = els;
  return els;
}

/**
 * Nilai terakhir yang sudah benar-benar ditulis ke layar.
 *
 * updateHUD dipanggil tiap frame (60x/detik), tapi hampir semua nilainya jarang
 * berubah \u2014 nyawa berubah beberapa kali per menit, timer 1x per detik. Menulis
 * DOM memicu perhitungan ulang tata letak, jadi di sini tiap nilai dibandingkan
 * dulu dan hanya ditulis kalau benar-benar berubah.
 */
const shown = {
  lives: -1,
  maxLives: -1,
  stage: '',
  timer: '',
  score: '',
  level: '',
  xpRatio: -1,
};

/** Perbarui semua info di layar (nyawa, level, timer, skor, XP, efek aktif). */
export function updateHUD(game) {
  if (game.lives !== shown.lives || game.maxLives !== shown.maxLives) {
    shown.lives = game.lives;
    shown.maxLives = game.maxLives;
    livesEl.textContent = '\u2764'.repeat(game.lives) + '\u2661'.repeat(Math.max(0, game.maxLives - game.lives));
  }

  const stage = `Lvl ${game.stageIndex + 1}/${game.stageCount}`;
  if (stage !== shown.stage) {
    shown.stage = stage;
    stageLabelEl.textContent = stage;
  }

  const timer = formatTime(game.timeLeft);
  if (timer !== shown.timer) {
    shown.timer = timer;
    timerEl.textContent = timer;
  }

  const score = `Skor: ${game.score} | Target Poin: ${game.stageScore}/${game.stageTarget}`;
  if (score !== shown.score) {
    shown.score = score;
    scoreEl.textContent = score;
  }

  const level = `${game.powerLevel + 1}`;
  if (level !== shown.level) {
    shown.level = level;
    levelBadgeEl.textContent = level;
  }

  // Bar diisi lewat transform, bukan width: transform tidak memicu tata letak
  // ulang dan dikerjakan kartu grafis. Skalanya 0..1 (bukan persen).
  const xpRatio = Math.min(1, game.xp / game.xpToNextLevel);
  if (xpRatio !== shown.xpRatio) {
    shown.xpRatio = xpRatio;
    xpFillEl.style.transform = `scaleX(${xpRatio})`;
  }

  const player = game.player;
  for (const buff of TRACKED_BUFFS) {
    const els = getBuffBadge(buff.type);
    const remaining = player ? player[buff.key] - game.elapsedTime : 0;
    const visible = remaining > 0;

    if (visible !== els.shownVisible) {
      els.shownVisible = visible;
      els.root.style.display = visible ? 'flex' : 'none';
      if (visible) els.icon.textContent = buff.icon;
    }
    if (!visible) continue;

    // Hanya nilai di bawah ini yang memang berubah tiap frame.
    const time = `${remaining.toFixed(1)}s`;
    if (time !== els.shownTime) {
      els.shownTime = time;
      els.time.textContent = time;
    }
    els.fill.style.transform = `scaleX(${Math.min(1, remaining / BUFF_SECONDS[buff.type])})`;
  }
}