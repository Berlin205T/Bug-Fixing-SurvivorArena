// =============================================
//  tutorial.js — Panduan "Cara Main"
// =============================================
// Menyorot bagian-bagian tampilan satu per satu sambil menampilkan penjelasan
// singkat, lalu diakhiri latihan gerak. Muncul otomatis sekali saat pertama
// kali main, dan bisa dibuka lagi kapan saja lewat tombol "?".

import { viewport } from './viewport.js';
import { VIEWPORT_W, MINIMAP_W, MINIMAP_H, MINIMAP_MARGIN } from './config.js';

const SEEN_KEY = 'survivorArena_tutorialSeen';

/**
 * localStorage bisa melempar error, bukan cuma kosong: WebView Android
 * mematikannya secara default, dan storage penuh juga melempar. Kalau error itu
 * lolos, tutorial gagal menutup diri dan overlay-nya mengunci layar selamanya.
 * Di sini kegagalan diserap: paling buruk tutorial muncul lagi lain kali.
 */
const seenStore = {
  get() {
    try {
      return localStorage.getItem(SEEN_KEY);
    } catch {
      return null;
    }
  },
  set() {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* diabaikan sengaja */
    }
  },
};

const overlayEl = document.getElementById('tutorial-overlay');
const spotlightEl = document.getElementById('tutorial-spotlight');
const tooltipEl = document.getElementById('tutorial-tooltip');
const progressEl = document.getElementById('tutorial-progress');
const textEl = document.getElementById('tutorial-text');
const nextBtn = document.getElementById('tutorial-next');
const skipBtn = document.getElementById('tutorial-skip');
const swipeEl = document.getElementById('tutorial-swipe');
const skipSwipeBtn = document.getElementById('tutorial-skip-swipe');
const howtoBtn = document.getElementById('howto-btn');
const mainOverlayEl = document.getElementById('overlay');

let canvasRef = null;
let active = false;
let stepIndex = 0;

/** Cari letak & ukuran sebuah bagian tampilan di layar. */
function rectOf(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

// Peta kecil digambar langsung di game (bukan tulisan HTML), jadi letaknya di
// layar dihitung sendiri dari posisi & skala tampilan saat ini.
function getMinimapRect() {
  if (!canvasRef) return null;
  const canvasRect = canvasRef.getBoundingClientRect();
  const { scale, offsetX, offsetY, dpr } = viewport;
  const logicalX = VIEWPORT_W - MINIMAP_W - MINIMAP_MARGIN;
  const logicalY = MINIMAP_MARGIN;
  return {
    left: canvasRect.left + (logicalX * scale + offsetX) / dpr,
    top: canvasRect.top + (logicalY * scale + offsetY) / dpr,
    width: (MINIMAP_W * scale) / dpr,
    height: (MINIMAP_H * scale) / dpr,
  };
}

const STEPS = [
  {
    id: 'hp',
    text: 'Permainan akan selesai jika HP kosong.',
    getRect: () => rectOf(document.getElementById('lives')),
  },
  {
    id: 'level',
    text: 'Kalahkan musuh untuk naikkan level XP dan menambah daya serangmu.',
    getRect: () => rectOf(document.getElementById('level-badge')),
  },
  {
    id: 'target',
    text: 'Kumpulkan cukup poin untuk naik ke level selanjutnya. Jika waktu habis, permainan berakhir.',
    getRect: () => rectOf(document.getElementById('target-time')),
  },
  {
    id: 'xp',
    text: 'XP dapat didapat dari musuh yang telah kamu bunuh',
    getRect: () => rectOf(document.getElementById('xp-bar-track')),
  },
  {
    id: 'minimap',
    text: 'Menampilkan musuh terdekat & item penting di sekitarmu.',
    getRect: getMinimapRect,
  },
  {
    id: 'movement',
    text: 'Geser untuk menggerakkan karaktermu.',
  },
];

/** Pindahkan lingkaran sorotan supaya pas menutupi bagian yang dijelaskan. */
function applySpotlight(rect) {
  const pad = 10;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  spotlightEl.style.left = `${rect.left - pad}px`;
  spotlightEl.style.top = `${rect.top - pad}px`;
  spotlightEl.style.width = `${w}px`;
  spotlightEl.style.height = `${h}px`;
  spotlightEl.style.borderRadius = h < 40 ? '999px' : '14px';
}

/** Taruh kotak penjelasan di atas/bawah bagian yang disorot, jangan sampai keluar layar. */
function positionTooltip(rect) {
  const pad = 10;
  const margin = 14;
  const tw = tooltipEl.offsetWidth;
  const th = tooltipEl.offsetHeight;

  const spotTop = rect.top - pad;
  const spotBottom = rect.top + rect.height + pad;
  const spotCenterX = rect.left + rect.width / 2;

  let top;
  if (spotBottom + th + margin <= window.innerHeight) {
    top = spotBottom + margin; // taruh di bawah target
  } else if (spotTop - th - margin >= 0) {
    top = spotTop - th - margin; // taruh di atas target
  } else {
    top = Math.max(margin, (window.innerHeight - th) / 2);
  }

  let left = spotCenterX - tw / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - tw - margin));

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

/**
 * Pindah ke langkah tutorial tertentu: sorot bagiannya & tampilkan
 * penjelasannya. Pada langkah terakhir, yang ditampilkan adalah latihan gerak.
 * Kalau bagian yang mau disorot belum siap, langkahnya dilewati.
 */
function goToStep(idx) {
  if (idx >= STEPS.length) { finish(); return; }
  stepIndex = idx;
  const step = STEPS[idx];
  progressEl.textContent = `${idx + 1}/${STEPS.length}`;

  if (step.id === 'movement') {
    spotlightEl.classList.remove('show');
    tooltipEl.classList.remove('show');
    overlayEl.classList.add('step-movement');
    swipeEl.classList.remove('hidden');
    requestAnimationFrame(() => swipeEl.classList.add('show'));
    return;
  }

  overlayEl.classList.remove('step-movement');
  swipeEl.classList.remove('show');
  swipeEl.classList.add('hidden');

  const rect = step.getRect();
  if (!rect || rect.width < 2 || rect.height < 2) {
    // Bagian yang mau disorot belum ada — langsung lanjut ke langkah berikutnya.
    goToStep(idx + 1);
    return;
  }

  textEl.textContent = step.text;
  applySpotlight(rect);
  spotlightEl.classList.add('show');
  // Atur posisi kotak penjelasan setelah teksnya terisi (biar ukurannya pas).
  requestAnimationFrame(() => {
    positionTooltip(rect);
    tooltipEl.classList.add('show');
  });
}

/** Lanjut ke langkah berikutnya (tombol "Lanjut"). */
function next() {
  goToStep(stepIndex + 1);
}

/** Tutup tutorial & ingat bahwa pemain sudah pernah melihatnya. */
function finish() {
  if (!active) return;
  active = false;
  seenStore.set();
  overlayEl.classList.add('fade-out');
  setTimeout(() => {
    overlayEl.classList.add('hidden');
    overlayEl.classList.remove('fade-out', 'step-movement');
    spotlightEl.classList.remove('show');
    tooltipEl.classList.remove('show');
    swipeEl.classList.remove('show');
    swipeEl.classList.add('hidden');
  }, 360);
}

/** Mulai tutorial dari awal (force = true untuk memaksa tampil lagi). */
function start({ force = false } = {}) {
  if (active) return;
  if (!force && seenStore.get()) return;
  active = true;
  overlayEl.classList.remove('hidden', 'fade-out');
  goToStep(0);
}

/** Siapkan tombol-tombol tutorial & atur agar muncul sendiri saat game dimulai. */
export function initTutorial(canvas) {
  canvasRef = canvas;

  nextBtn.addEventListener('click', next);
  skipBtn.addEventListener('click', finish);
  skipSwipeBtn.addEventListener('click', finish);
  howtoBtn.addEventListener('click', () => start({ force: true }));

  // Tampilkan otomatis begitu pemain menekan "Mulai" (layar pembuka hilang).
  // Diberi jeda sedikit supaya info di layar sempat tampil sebelum disorot.
  if (mainOverlayEl) {
    const obs = new MutationObserver(() => {
      if (mainOverlayEl.classList.contains('hidden')) {
        obs.disconnect();
        setTimeout(() => start(), 150);
      }
    });
    obs.observe(mainOverlayEl, { attributes: true, attributeFilter: ['class'] });
  }
}

/** Dipanggil tiap frame; saat langkah latihan gerak, tutorial selesai begitu player bergerak. */
export function notifyInput(x, y) {
  if (!active || STEPS[stepIndex].id !== 'movement') return;
  if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05) finish();
}

/** Apakah game sedang dijeda oleh tutorial (biar pemain bisa membaca dengan tenang). */
export function isBlockingGameplay() {
  return active && STEPS[stepIndex].id !== 'movement';
}

/** Apakah langkah saat ini adalah latihan gerak (movement). */
export function isMovementStep() {
  return active && STEPS[stepIndex].id === 'movement';
}

/** Sesuaikan lagi posisi sorotan & penjelasan setelah ukuran layar berubah. */
export function reposition() {
  if (!active) return;
  const step = STEPS[stepIndex];
  if (step.id === 'movement') return;
  const rect = step.getRect();
  if (rect && rect.width >= 2 && rect.height >= 2) {
    applySpotlight(rect);
    positionTooltip(rect);
  }
}
