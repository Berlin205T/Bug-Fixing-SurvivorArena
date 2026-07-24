// =============================================
//  main.js — Titik awal & pengatur jalannya game
// =============================================
// File pertama yang dijalankan. Tugasnya menyiapkan layar, menyesuaikan
// kualitas ke kekuatan HP, menangkap kontrol pemain (keyboard & joystick),
// lalu menjalankan perulangan utama game (update + gambar terus-menerus).
import { Game } from './game.js';
import { unlockAudio } from './effects/sfx.js';
import { preloadSprites } from './utils/assets.js';
import { setMaxParticles } from './effects/vfx.js';
import { setRenderQuality } from './quality.js';
import { resizeViewport } from './viewport.js';
import { prebuildBackgrounds } from './world/background.js';
import { MAX_PARTICLES_HIGH, MAX_PARTICLES_LOW } from './config.js';
import { initTutorial, notifyInput, isBlockingGameplay, reposition as repositionTutorial } from './tutorial.js';
import { setRenderQuality, evaluateDynamicQuality } from './quality.js';

// ---- Menentukan kualitas gambar (sekali di awal) --------------------------
// Ditentukan dari kekuatan HP/laptop dan tidak berubah selama main.
/** Tebak kualitas gambar dari kekuatan perangkat (bisa dipaksa lewat ?quality=). */
function detectDeviceQuality() {
  const forced = new URLSearchParams(location.search).get('quality');
  if (forced === 'low' || forced === 'medium' || forced === 'high') {
    return forced;
  }

  const cpuCores = navigator.hardwareConcurrency || 4; // jumlah inti prosesor (default 4 saat tak terbaca)
  const ramGB = navigator.deviceMemory; // besar RAM; sebagian browser tidak menyediakannya

  if (cpuCores <= 2 || (ramGB !== undefined && ramGB <= 2)) return 'low';
  if (cpuCores <= 4 || (ramGB !== undefined && ramGB <= 4)) return 'medium';
  return 'high';
}

const deviceQuality = detectDeviceQuality();
setRenderQuality(deviceQuality);
if (deviceQuality === 'medium') {
  setMaxParticles(Math.round((MAX_PARTICLES_HIGH + MAX_PARTICLES_LOW) / 2));
} else if (deviceQuality === 'low') {
  setMaxParticles(MAX_PARTICLES_LOW);
}

const canvas = document.getElementById('game-canvas');
const stage = document.getElementById('game-stage');

// ---- Sesuaikan ukuran layar & ikuti perubahannya --------------------------
resizeViewport(canvas, stage);
window.addEventListener('resize', () => {
  resizeViewport(canvas, stage);
  repositionTutorial();
});

const game = new Game(canvas);

// ---- Kontrol keyboard (buat main di komputer) ------------------------------
const keys = { up: false, down: false, left: false, right: false };

window.addEventListener('keydown', (e) => {
  unlockAudio();
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// ---- Joystick sentuh (buat main di HP) -------------------------------------
// Joystick tidak diam di satu tempat: ia muncul persis di titik jari pertama
// kali menyentuh sisi kiri layar, lalu arah gerak dihitung dari titik itu.
const touchZone = document.getElementById('touch-controls');
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');
let joystickVector = { x: 0, y: 0 };
let activeTouchId = null;
let originX = 0;
let originY = 0;
const JOYSTICK_MAX = 34;

/** Munculkan joystick di titik sentuh, jadikan origin drag. */
function showJoystickAt(clientX, clientY) {
  const rect = touchZone.getBoundingClientRect();
  originX = clientX;
  originY = clientY;
  joystickBase.style.left = `${clientX - rect.left}px`;
  joystickBase.style.top = `${clientY - rect.top}px`;
  joystickBase.classList.add('active');
}

/** Hitung vektor joystick (-1..1) dari posisi jari. */
function joystickPointFromEvent(clientX, clientY) {
  let dx = clientX - originX;
  let dy = clientY - originY;
  const dist = Math.hypot(dx, dy);
  if (dist > JOYSTICK_MAX) {
    dx = (dx / dist) * JOYSTICK_MAX;
    dy = (dy / dist) * JOYSTICK_MAX;
  }
  joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
  joystickVector = { x: dx / JOYSTICK_MAX, y: dy / JOYSTICK_MAX };
}

/** Sembunyikan joystick & nol-kan input. */
function resetJoystick() {
  joystickBase.classList.remove('active');
  joystickStick.style.transform = 'translate(0px, 0px)';
  joystickVector = { x: 0, y: 0 };
  activeTouchId = null;
}

touchZone.addEventListener('touchstart', (e) => {
  if (activeTouchId !== null) return; // sudah ada jari aktif, abaikan sentuhan lain
  if (e.cancelable) e.preventDefault();
  unlockAudio();
  const t = e.changedTouches[0];
  activeTouchId = t.identifier;
  showJoystickAt(t.clientX, t.clientY);
  joystickPointFromEvent(t.clientX, t.clientY);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (activeTouchId === null) return;
  if (e.cancelable) e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === activeTouchId) {
      joystickPointFromEvent(t.clientX, t.clientY);
    }
  }
}, { passive: false });

window.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === activeTouchId) resetJoystick();
  }
});

window.addEventListener('touchcancel', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === activeTouchId) resetJoystick();
  }
});

// Klik untuk unlock audio (aturan autoplay browser)
window.addEventListener('pointerdown', () => unlockAudio());

// Matikan menu klik-kanan & seleksi teks saat menyentuh area game.
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---- Tutorial "Cara Main" --------------------------------------------------
// Panduan yang menyorot tiap bagian tampilan lalu diakhiri latihan gerak
// (selengkapnya di src/tutorial.js).
initTutorial(canvas);

// ---- Peringatan orientasi --------------------------------------------------
// Saat layar mendatar & pendek, style.css menutup layar dengan pesan "putar
// perangkatmu". Permainan ikut dijeda di sini — kalau tidak, musuh terus
// menyerang di balik pesan yang menutupi layar dan pemain kehabisan nyawa tanpa
// bisa melihat apa pun.
//
// PENTING: batas layar ini harus sama persis dengan media query di style.css.
const landscapeQuery = window.matchMedia('(orientation: landscape) and (max-height: 500px)');
let blockedByOrientation = landscapeQuery.matches;

const onOrientationChange = (e) => { blockedByOrientation = e.matches; };
if (landscapeQuery.addEventListener) {
  landscapeQuery.addEventListener('change', onOrientationChange);
} else {
  landscapeQuery.addListener(onOrientationChange); // Safari lama
}

/** Satukan joystick + keyboard jadi satu arah gerak. */
function currentInputVector() {
  let x = joystickVector.x;
  let y = joystickVector.y;
  if (x === 0 && y === 0) {
    if (keys.left) x -= 1;
    if (keys.right) x += 1;
    if (keys.up) y -= 1;
    if (keys.down) y += 1;
  }
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

// ---- Perulangan utama game -------------------------------------------------
let lastTime = -1;
// Pelacak untuk evaluasi FPS dinamis
let frameCount = 0;
let fpsTimer = 0;

function loop(now) {
  requestAnimationFrame(loop);

  try {
    if (lastTime < 0 || now - lastTime > 500) {
      lastTime = now;
      return;
    }

    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    // --- HITUNG DAN EVALUASI FPS TIAP 3 DETIK ---
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 3.0) {
      const averageFps = frameCount / fpsTimer;
      evaluateDynamicQuality(averageFps);
      frameCount = 0;
      fpsTimer = 0;
    }
    // -------------------------------------------

    const input = currentInputVector();
    notifyInput(input.x, input.y);
    if (!isBlockingGameplay() && !blockedByOrientation) game.update(dt, input);
    game.render();
  } catch (err) {
    console.error('Frame dilewati karena error:', err);
  }
}
/**
 * Perulangan utama: baca kontrol, perbarui game (kecuali dijeda tutorial), gambar.
 *
 * Dua hal di bawah menjaga game tetap hidup walau ada yang error:
 * 1. Frame berikutnya dijadwalkan di baris PERTAMA, bukan terakhir. Kalau
 *    dijadwalkan terakhir, satu error di tengah loop membuat baris itu tak
 *    pernah jalan — rantai frame putus dan game membeku selamanya.
 * 2. Isi loop dibungkus try/catch, jadi frame yang error cuma dilewati.
 */
function loop(now) {
  requestAnimationFrame(loop);

  try {
    // Frame pertama atau baru balik dari tab lain: lewati sekali biar game tidak
    // melompat karena jeda waktunya kelewat besar.
    if (lastTime < 0 || now - lastTime > 500) {
      lastTime = now;
      return;
    }

    // dt = selisih waktu sejak frame lalu (detik). Dibatasi biar tidak melonjak.
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    const input = currentInputVector();
    notifyInput(input.x, input.y);
    // Game dijeda saat tutorial sedang menjelaskan bagian tampilan (biar pemain
    // bisa fokus membaca) dan saat layar mendatar (pesan "putar perangkatmu"
    // sedang menutupi game). Tampilannya tetap digambar supaya layar tidak
    // kosong saat jedanya selesai.
    if (!isBlockingGameplay() && !blockedByOrientation) game.update(dt, input);
    game.render();
  } catch (err) {
    // Lewati frame ini saja; frame berikutnya sudah antre di atas.
    console.error('Frame dilewati karena error:', err);
  }
}

// ---- Titik mulai -----------------------------------------------------------
/**
 * Muat aset, siapkan latar, buka tombol Mulai, lalu jalankan game.
 *
 * Sengaja dibungkus fungsi async dan bukan `await` di tingkat atas file:
 * top-level await butuh Chrome 89 / iOS 15 ke atas, dan di bawah itu file ini
 * gagal dibaca sama sekali — layar hitam tanpa pesan, sebelum satu pun
 * penjagaan error di dalamnya sempat berjalan.
 */
async function start() {
  // Muat semua gambar dulu sebelum game mulai, biar tidak ada gambar yang
  // muncul mendadak di tengah permainan. Aman walau gambarnya belum ada.
  await preloadSprites();

  // Siapkan latar siang & malam sekarang, selagi layar pembuka masih tampil.
  // Urutannya penting: harus setelah preloadSprites() (lihat background.js).
  prebuildBackgrounds();

  // Baru sekarang tombol "Mulai" boleh ditekan. Kalau bisa ditekan lebih awal,
  // layar pembuka hilang tapi game belum bisa menggambar apa pun — pemain cuma
  // melihat layar hitam sampai pemuatan selesai.
  game.markReady();

  requestAnimationFrame(loop);
}

start();
