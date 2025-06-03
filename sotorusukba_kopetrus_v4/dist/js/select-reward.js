"use strict";

require("core-js/modules/es.array.concat.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/es.string.search.js");
require("core-js/modules/web.dom-collections.for-each.js");
require("core-js/modules/web.dom-collections.iterator.js");
require("core-js/modules/web.url-search-params.js");
// Mengambil parameter level dari URL
var urlParams = new URLSearchParams(window.location.search);
var level = urlParams.get("level") || 1; // Default level 1 jika tidak ada level yang diberikan
var rewardContainer = document.getElementById("rewardContainer");
var startBtn = document.getElementById("startGameBtn");
var selectedReward = null;

// Fungsi untuk memuat hadiah berdasarkan level
function loadRewards() {
  if (!window.db) return alert("Firebase belum siap!");
  db.ref("settings/level".concat(level)).once("value", function (snapshot) {
    var conf = snapshot.val();
    if (conf && Array.isArray(conf.rewards)) {
      conf.rewards.forEach(function (r, i) {
        var div = document.createElement("div");
        div.className = "reward-option";
        div.innerHTML = "\n        <img src=\"".concat(r.icon, "\" alt=\"Reward ").concat(i + 1, "\" />\n        <div class=\"reward-name\">").concat(r.reward, "</div>\n      ");
        // Menambahkan event listener untuk memilih hadiah
        div.addEventListener("click", function () {
          document.querySelectorAll(".reward-option").forEach(function (opt) {
            return opt.classList.remove("selected");
          });
          div.classList.add("selected");
          selectedReward = r;
          startBtn.disabled = false; // Mengaktifkan tombol "Mulai Game" setelah hadiah dipilih
        });
        rewardContainer.appendChild(div);
      });
    } else {
      rewardContainer.innerHTML = "<p>Tidak ada hadiah ditemukan untuk level ini.</p>";
    }
  });
}

// Event listener untuk tombol "Mulai Game"
startBtn.addEventListener("click", function () {
  if (!selectedReward) return alert("Silakan pilih hadiah dahulu!");
  sessionStorage.setItem("selectedReward", JSON.stringify(selectedReward)); // Menyimpan hadiah yang dipilih
  window.location.href = "game.html?level=".concat(level); // Mengarahkan ke halaman permainan
});

// Tunggu hingga Firebase siap sebelum memuat hadiah
var wait = setInterval(function () {
  if (window.db) {
    clearInterval(wait);
    loadRewards(); // Memuat hadiah
  }
}, 300);