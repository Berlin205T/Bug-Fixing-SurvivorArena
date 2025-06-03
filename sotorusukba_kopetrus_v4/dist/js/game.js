"use strict";

require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.object.keys.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/es.string.search.js");
require("core-js/modules/es.string.trim.js");
require("core-js/modules/web.dom-collections.iterator.js");
require("core-js/modules/web.url-search-params.js");
var query = new URLSearchParams(window.location.search);
var level = parseInt(query.get("level")) || 1;
var speed = 20;
var tolerance = 8;
var rewardConfig = {
  reward: "Tanpa Nama",
  icon: "assets/images/winner.png"
};
var gameInterval, gameCountdown;
var isMoving = true,
  posX = 0,
  gameEnded = false,
  gameStarted = false,
  movingIntervalStarted = false;
var objectCenterRatio = null;
var object = document.getElementById("object");
var target = document.getElementById("target");
var titleGame = document.getElementById("title-game");
var tapSound = document.getElementById("tapSound");
var winSound = document.getElementById("winSound");
var loseSound = document.getElementById("loseSound");
var countdownOverlay = document.getElementById("countdownOverlay");
var countdownText = document.getElementById("countdownText");
var startBtn = document.getElementById("startBtn");
var startOverlay = document.getElementById("startOverlay");
var countdownNumber = 3;
if (countdownText) countdownText.innerText = countdownNumber;

// Ambil reward yang dipilih user dari sessionStorage
var storedReward = sessionStorage.getItem("selectedReward");
if (storedReward) {
  try {
    rewardConfig = JSON.parse(storedReward);
    console.log("🎁 Hadiah terpilih:", rewardConfig);
  } catch (err) {
    console.warn("⚠️ Gagal parse selectedReward:", err);
  }
}

// Ambil setting dari Firebase
function fetchSettingsFromFirebase() {
  if (!window.db) return alert("Firebase belum siap");
  console.log("\uD83D\uDCE5 Mengambil setting level ".concat(level, " dari Firebase..."));
  db.ref("settings/level".concat(level)).once("value", function (snapshot) {
    var data = snapshot.val();
    if (data) {
      speed = parseInt(data.speed || 20);
      tolerance = parseInt(data.tolerance || 8);
      console.log("\u2705 Setting berhasil diambil:");
      console.log("\u2192 Speed: ".concat(speed));
      console.log("\u2192 Tolerance: ".concat(tolerance));
    } else {
      console.log("⚠️ Tidak ada data setting untuk level ini.");
    }
    console.log("✅ Setting berhasil diambil. Menunggu user klik Mulai...");
  });
}
function startCountdown() {
  var countdownInterval = setInterval(function () {
    countdownNumber--;
    if (countdownText) {
      if (countdownNumber > 0) {
        countdownText.innerText = countdownNumber;
      } else if (countdownNumber === 0) {
        countdownText.innerText = "GO!";
      } else {
        clearInterval(countdownInterval);
        if (countdownOverlay) countdownOverlay.style.display = "none";
        gameStarted = true;
        setTimeout(function () {
          centerObjectToTarget();
          object.style.display = "block";
          target.style.display = "block";
          titleGame.style.display = "flex";
          requestAnimationFrame(function () {
            return object.classList.add("show");
          });
          startGame();
        }, 50);
      }
    }
  }, 1000);
}
function startGame() {
  if (movingIntervalStarted) return;
  movingIntervalStarted = true;
  var duration = 20 + (5 - level) * 2;
  document.getElementById("timeLeft").innerText = duration;
  moveObject();
  gameCountdown = setInterval(function () {
    if (duration <= 0) return endGame(false);
    duration--;
    document.getElementById("timeLeft").innerText = duration;
  }, 1000);
}
function moveObject() {
  if (!isMoving || gameEnded) return;
  var targetRect = target.getBoundingClientRect();
  var objectRect = object.getBoundingClientRect();
  var targetCenter = targetRect.left + targetRect.width / 2;
  var objectCenter = objectRect.left + objectRect.width / 2;
  if (Math.abs(targetCenter - objectCenter) < 100) {
    speed = Math.max(5, speed);
  }
  posX += speed;
  if (posX > window.innerWidth) posX = -object.offsetWidth;
  object.style.left = posX + "px";
  gameInterval = requestAnimationFrame(moveObject);
}
document.body.addEventListener("click", function () {
  if (!gameStarted || gameEnded || countdownNumber > 0) return;
  tapSound.play();
  if (isMoving) {
    cancelAnimationFrame(gameInterval);
    isMoving = false;
    var objectRect = object.getBoundingClientRect();
    var targetRect = target.getBoundingClientRect();
    var offsetX = Math.abs(objectRect.left + objectRect.width / 2 - (targetRect.left + targetRect.width / 2));
    var offsetY = Math.abs(objectRect.top + objectRect.height / 2 - (targetRect.top + targetRect.height / 2));
    var overlap = objectRect.left <= targetRect.right && objectRect.right >= targetRect.left && objectRect.top <= targetRect.bottom && objectRect.bottom >= targetRect.top;
    if (overlap && offsetX <= tolerance && offsetY <= tolerance) {
      document.body.style.backgroundColor = "#4CAF50";
      endGame(true);
    } else {
      document.body.style.backgroundColor = "#F44336";
    }
    objectCenterRatio = objectRect.left / window.innerWidth;
  } else {
    document.body.style.backgroundColor = "#F44336";
    isMoving = true;
    moveObject();
  }
});
function centerObjectToTarget() {
  var targetRect = target.getBoundingClientRect();
  var objectWidth = object.offsetWidth || 100;
  var targetCenterX = targetRect.left + targetRect.width / 2;
  var objectLeft = targetCenterX - objectWidth / 2;
  object.style.left = "".concat(objectLeft, "px");
}
function endGame(win) {
  cancelAnimationFrame(gameInterval);
  clearInterval(gameCountdown);
  movingIntervalStarted = false;
  gameEnded = true;
  if (win) {
    winSound.play();
    setTimeout(function () {
      return animateWin();
    }, 1000);
    setTimeout(function () {
      document.getElementById("winRewardCode").textContent = rewardConfig.reward || "Kupon Hadiah";
      document.getElementById("winRewardIcon").src = rewardConfig.icon || "assets/images/winner.png";
      document.getElementById("winRewardIcon").alt = rewardConfig.reward;
      document.getElementById("winModal").classList.remove("hidden");
      document.getElementById("winModal").classList.add("show");
    }, 2000);
  } else {
    loseSound.play();
    animateLose();
    setTimeout(function () {
      document.getElementById("loseModal").classList.remove("hidden");
      document.getElementById("loseModal").classList.add("show");
    }, 7000);
  }
}
function saveWinner() {
  var nama = document.getElementById("nama").value.trim();
  var ig = document.getElementById("instagram").value.trim();
  var telp = document.getElementById("telepon").value.trim();
  var timestamp = new Date().toISOString();
  if (!nama || !telp) {
    alert("Nama dan Telepon wajib diisi!");
    return;
  }
  var entry = {
    nama: nama,
    ig: ig,
    telp: telp,
    level: level,
    reward: rewardConfig.reward,
    rewardIcon: rewardConfig.icon,
    timestamp: timestamp
  };
  if (window.db) {
    var newRef = db.ref("winners").push();
    newRef.set(entry).then(function () {
      return alert("✅ Data pemenang disimpan ke Firebase!");
    });
  } else {
    alert("Firebase belum siap.");
  }
}
function animateWin() {
  object.style.transition = "transform 0.5s ease";
  object.style.transform = "scale(1.3) rotate(10deg)";
  setTimeout(function () {
    object.style.transform = "scale(1) rotate(0)";
  }, 1000);
}
function animateLose() {
  object.style.transition = "none";
  object.style.animation = "shake 0.5s ease";
  object.style.transform = "translate(-50%, -50%) rotate(0deg)";
  void object.offsetWidth;
  setTimeout(function () {
    object.style.transition = "transform 2.5s ease-out";
    object.style.transform = "translate(100vw, -50%) rotate(0deg)";
  }, 500);
  setTimeout(function () {
    object.style.transition = "transform 2.5s ease-in-out";
    object.style.transform = "translate(-100vw, -100vh) rotate(-135deg)";
  }, 3000);
  setTimeout(function () {
    object.style.transition = "transform 2.5s ease-in";
    object.style.transform = "translate(120vw, 100vh) rotate(45deg)";
  }, 5500);
}
var waitFirebase = setInterval(function () {
  if (window.db) {
    clearInterval(waitFirebase);
    fetchSettingsFromFirebase();
  }
}, 300);
if (startBtn) {
  startBtn.addEventListener("click", function () {
    [tapSound, winSound, loseSound].forEach(function (sound) {
      sound.muted = true;
      sound.play().then(function () {
        sound.pause();
        sound.muted = false;
        sound.currentTime = 0;
      })["catch"](function () {});
    });
    var countdownSound = document.getElementById("countdownSound");
    if (countdownSound) {
      countdownSound.play()["catch"](function (err) {
        return console.warn("❗ Gagal memutar countdown sound:", err);
      });
    }
    if (startOverlay) startOverlay.style.display = "none";
    startCountdown();
  });
}