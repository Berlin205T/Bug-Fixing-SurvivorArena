"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // Hide loader when fully loaded
  var loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";

  // Reset background & content height
  var bg = document.querySelector(".background");
  var content = document.querySelector(".content");
  if (bg) bg.style.height = "100vh"; // <- pakai 100vh
  if (content) content.style.height = "100vh"; // <- pakai 100vh

  // Scroll to top (pakai 3 cara)
  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;

  // Exit fullscreen if any
  if (document.fullscreenElement) {
    document.exitFullscreen()["catch"](function (err) {
      console.warn("Tidak bisa keluar dari fullscreen:", err);
    });
  }

  // Center object if exists
  var obj = document.getElementById("object");
  if (obj) {
    var posX = (window.innerWidth - 100) / 2;
    obj.style.left = posX + "px";
  }
  function setActualViewportHeight() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', "".concat(vh, "px"));
  }
  setActualViewportHeight();
  window.addEventListener('resize', setActualViewportHeight);
});

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then(function (reg) {
    return console.log('Service Worker registered!', reg);
  })["catch"](function (err) {
    return console.log('Service Worker failed:', err);
  });
}