"use strict";

console.log("MANADO POST!")

function startGame(level) {
  sessionStorage.setItem('audioAllowed', 'true');
  document.body.classList.remove("fade-in");
  document.body.classList.add("fade-out");
  setTimeout(function () {
    window.location.href = "select-reward.html?level=".concat(level); // FIXED
  }, 500);
}
document.addEventListener("DOMContentLoaded", function () {
  // Menyembunyikan loader setelah halaman sepenuhnya dimuat
  var loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";

  // Resetting background dan content height agar selalu sesuai layar
  var bg = document.querySelector(".background");
  var content = document.querySelector(".content");
  if (bg) bg.style.height = "100vh";
  if (content) content.style.height = "100vh";

  // Scroll ke atas (menggunakan beberapa cara untuk memastikan)
  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;

  // Keluar dari mode fullscreen jika sedang aktif
  if (document.fullscreenElement) {
    document.exitFullscreen()["catch"](function (err) {
      console.warn("Tidak bisa keluar dari fullscreen:", err);
    });
  }

  // Menyusun ulang objek jika ada
  var obj = document.getElementById("object");
  if (obj) {
    var posX = (window.innerWidth - 100) / 2; // Menyusun objek di tengah layar
    obj.style.left = posX + "px";
  }
});

// Pendaftaran service worker untuk caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then(function (reg) {
    return console.log('Service Worker registered!', reg);
  })["catch"](function (err) {
    return console.log('Service Worker failed:', err);
  });
}