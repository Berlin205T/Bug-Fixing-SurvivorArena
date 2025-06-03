// Ambil level dari URL
const query = new URLSearchParams(window.location.search);
let level = parseInt(query.get("level"));
if (![1, 2, 3, 4].includes(level)) level = 1;

// Default config
let speed = 20;
let tolerance = 8;
let rewardConfig = { reward: "Tanpa Nama", icon: "assets/images/winner.png" };

// State permainan
let gameInterval, gameCountdown;
let isMoving = true, posX = 0, gameEnded = false, gameStarted = false, movingIntervalStarted = false;
let countdownNumber = 3;
let maxDuration = -1;
let durationLeft = -1;

// Elemen DOM
const object          = document.getElementById("object");
const target          = document.getElementById("target");
const titleGame       = document.getElementById("title-game");
const tapSound        = document.getElementById("tapSound");
const winSound        = document.getElementById("winSound");
const loseSound       = document.getElementById("loseSound");
const countdownOverlay = document.getElementById("countdownOverlay");
const countdownText   = document.getElementById("countdownText");
const startBtn        = document.getElementById("startBtn");
const startOverlay    = document.getElementById("startOverlay");

// Tampilkan angka hitung mundur awal
if (countdownText) countdownText.innerText = countdownNumber;

// Ambil reward dari sessionStorage
const storedReward = sessionStorage.getItem("selectedReward");
if (storedReward) {
  try {
    rewardConfig = JSON.parse(storedReward);
    console.log("🎁 Hadiah terpilih:", rewardConfig);
  } catch (err) {
    console.warn("⚠️ Gagal parse selectedReward:", err);
  }
}

// ✅ Fungsi tunggu firebase siap, maksimal 5 detik
async function waitForFirebaseReady(timeout = 5000) {
  const start = Date.now();
  while (typeof window.firebaseReady === "undefined") {
    if (Date.now() - start > timeout) {
      alert("❌ Firebase belum siap setelah beberapa kali percobaan.");
      throw new Error("Timeout: firebaseReady belum tersedia.");
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  try {
    const db = await window.firebaseReady;
    console.log("✅ Firebase siap dan terkoneksi");
    return db;
  } catch (err) {
    console.error("❌ Gagal mendapatkan Firebase DB:", err);
    alert("❌ Gagal koneksi ke Firebase.");
    throw err;
  }
}

// ✅ Inisialisasi game
(async function initGame() {
  try {
    const db = await waitForFirebaseReady();
    window.db = db;
    await fetchSettingsFromFirebase();
  } catch (e) {
    console.error("🔥 Inisialisasi game gagal:", e);
  }
})();

// Ambil setting speed/tolerance dari Firebase
async function fetchSettingsFromFirebase() {
  try {
    const snapshot = await window.db.ref(`settings/level${level}`).once("value");
    if (!snapshot.exists()) throw new Error(`Setting level ${level} tidak ditemukan.`);
    const data = snapshot.val() || {};
    speed     = parseInt(data.speed)     || speed;
    tolerance = parseInt(data.tolerance) || tolerance;
    console.log("✅ Setting loaded:", { speed, tolerance });
  } catch (err) {
    console.error("❌ Gagal mengambil setting:", err.message);
    alert("Gagal mengambil pengaturan level. Cek koneksi.");
  }
}

// Hitung mundur sebelum mulai game
function startCountdown() {
  const interval = setInterval(() => {
    countdownNumber--;
    if (countdownNumber > 0) {
      countdownText.innerText = countdownNumber;
    } else if (countdownNumber === 0) {
      countdownText.innerText = "GO!";
    } else {
      clearInterval(interval);
      countdownOverlay.style.display = "none";
      gameStarted = true;
      setTimeout(() => {
        centerObjectToTarget();
        object.style.display = "block";
        target.style.display = "block";
        titleGame.style.display = "flex";
        requestAnimationFrame(() => object.classList.add("show"));
        startGame();
      }, 50);
    }
  }, 1000);
}

function startGame() {
  if (movingIntervalStarted) return;
  movingIntervalStarted = true;
  let duration = 20 + (5 - level) * 2;
  maxDuration = duration;
  document.getElementById("timeLeft").innerText = duration;
  moveObject();
  gameCountdown = setInterval(() => {
    if (duration <= 0) return endGame(false);
    duration--;
    durationLeft = duration;
    document.getElementById("timeLeft").innerText = duration;
  }, 1000);
}

function moveObject() {
  if (!isMoving || gameEnded) return;
  const targetRect = target.getBoundingClientRect();
  const objectRect = object.getBoundingClientRect();
  const targetCenter = targetRect.left + targetRect.width / 2;
  const objectCenter = objectRect.left + objectRect.width / 2;
  if (Math.abs(targetCenter - objectCenter) < 100) speed = Math.max(5, speed);
  posX += speed;
  if (posX > window.innerWidth) posX = -object.offsetWidth;
  object.style.left = `${posX}px`;
  gameInterval = requestAnimationFrame(moveObject);
}

// Klik untuk pause/resume
document.body.addEventListener("click", () => {
  if (!gameStarted || gameEnded || countdownNumber > 0) return;
  tapSound.play();
  if (isMoving) {
    cancelAnimationFrame(gameInterval);
    isMoving = false;
    checkHit();
  } else {
    document.body.style.backgroundColor = "#F44336";
    isMoving = true;
    moveObject();
  }
});

function checkHit() {
  const o = object.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const offsetX = Math.abs((o.left + o.width / 2) - (t.left + t.width / 2));
  const offsetY = Math.abs((o.top + o.height / 2) - (t.top + t.height / 2));
  const overlap = o.left <= t.right && o.right >= t.left && o.top <= t.bottom && o.bottom >= t.top;
  if (overlap && offsetX <= tolerance && offsetY <= tolerance) {
    document.body.style.backgroundColor = "#4CAF50";
    endGame(true);
  } else {
    document.body.style.backgroundColor = "#F44336";
  }
}

function centerObjectToTarget() {
  const t = target.getBoundingClientRect();
  const w = object.offsetWidth || 100;
  object.style.left = `${t.left + t.width / 2 - w / 2}px`;
}

function endGame(win) {
  cancelAnimationFrame(gameInterval);
  clearInterval(gameCountdown);
  movingIntervalStarted = false;
  gameEnded = true;
  if (win) {
    winSound.play();
    window.ReactNativeWebView.postMessage(JSON.stringify({
      status: 'win',
      data: maxDuration - durationLeft
    }))
    setTimeout(animateWin, 1000);
    setTimeout(() => showWinModal(), 2000);
  } else {
    loseSound.play();
    window.ReactNativeWebView.postMessage(JSON.stringify({
      status: 'lose',
      data: 0
    }))
    animateLose();
    setTimeout(() => showLoseModal(), 7000);
  }
}

function showWinModal() {
  document.getElementById("winRewardCode").textContent = rewardConfig.reward;
  const iconEl = document.getElementById("winRewardIcon");
  iconEl.src = rewardConfig.icon;
  iconEl.alt = rewardConfig.reward;
  document.getElementById("winModal").classList.replace("hidden", "show");
}

function showLoseModal() {
  document.getElementById("loseModal").classList.replace("hidden", "show");
}

// ✅ game.js (revisi lengkap - bagian penyimpanan + QR selfie)

async function saveWinner() {
  const nama = document.getElementById("nama").value.trim();
  const ig = document.getElementById("instagram").value.trim();
  const telp = document.getElementById("telepon").value.trim();
  const timestamp = new Date().toISOString();

  if (!nama || !telp) return alert("Nama dan Telepon wajib diisi!");

  const entry = {
    nama, ig, telp, level,
    reward: rewardConfig.reward,
    rewardIcon: rewardConfig.icon,
    timestamp
  };

  try {
    const db = await window.firebaseReady;
    const newRef = db.ref("winners").push();
    const key = newRef.key;
    sessionStorage.setItem("lastWinnerKey", key);
    await newRef.set(entry);

    // Tampilkan QR Code selfie
      updateSelfieQR(key);
    alert("✅ Data pemenang disimpan!");
  } catch (err) {
    console.error(err);
    alert("❌ Gagal simpan pemenang.");
  }
}

function animateWin() {
  object.style.transition = "transform 0.5s ease";
  object.style.transform = "scale(1.3) rotate(10deg)";
  setTimeout(() => object.style.transform = "scale(1) rotate(0)", 1000);
}

function animateLose() {
  object.style.transition = "none";
  object.style.animation = "shake 0.5s ease";
  setTimeout(() => {
    object.style.transition = "transform 2.5s ease-out";
    object.style.transform = "translate(100vw, -50%)";
  }, 500);
  setTimeout(() => {
    object.style.transform = "translate(-100vw, -100vh) rotate(-135deg)";
  }, 3000);
  setTimeout(() => {
    object.style.transform = "translate(120vw, 100vh) rotate(45deg)";
  }, 5500);
}

// Tombol mulai
if (startBtn) {
  startBtn.addEventListener("click", () => {
    [tapSound, winSound, loseSound].forEach(s => {
      s.muted = true;
      s.play().then(() => {
        s.pause();
        s.muted = false;
        s.currentTime = 0;
      }).catch(() => {});
    });
    const cSound = document.getElementById("countdownSound");
    if (cSound) cSound.play().catch(() => {});
    startOverlay.style.display = "none";
    startCountdown();
  });
}
