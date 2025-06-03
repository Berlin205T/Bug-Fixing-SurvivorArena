"use strict";

require("core-js/modules/es.object.keys.js");
// js/camera.js versi Firebase

document.addEventListener("DOMContentLoaded", function () {
  var video = document.getElementById("video");
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  navigator.mediaDevices.getUserMedia({
    video: true
  }).then(function (stream) {
    video.srcObject = stream;
  })["catch"](function (err) {
    alert("Kamera tidak tersedia. Gunakan perangkat lain.");
    console.error("Camera error:", err);
  });

  // EDITED by Adriannicholasl
  // Mengambil foto dari video dan menyimpannya ke Firebase   
  // FIXED Ukuran gambar untuk feed IG potret 4:5 (1080x1350)
  window.takeSelfie = function () {
    if (!video.videoWidth || !video.videoHeight) {
      alert("Kamera belum siap. Coba lagi.");
      return;
    }

    // Ukuran target untuk feed IG potret
    var targetWidth = 1080;
    var targetHeight = 1350;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    var tempCanvas = document.createElement("canvas");
    var tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;

    // Ambil dari video (gambar asli)
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    // Hitung cropping dari rasio 4:5
    var inputRatio = tempCanvas.width / tempCanvas.height;
    var targetRatio = targetWidth / targetHeight;
    var cropWidth = tempCanvas.width;
    var cropHeight = tempCanvas.height;
    if (inputRatio > targetRatio) {
      // Gambar lebih lebar dari 4:5 → potong sisi kiri-kanan
      cropWidth = tempCanvas.height * targetRatio;
    } else {
      // Gambar lebih tinggi dari 4:5 → potong atas-bawah
      cropHeight = tempCanvas.width / targetRatio;
    }
    var cropX = (tempCanvas.width - cropWidth) / 2;
    var cropY = (tempCanvas.height - cropHeight) / 2;

    // Gambar ke canvas akhir (1080x1350)
    ctx.drawImage(tempCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
    var frame = new Image();
    frame.src = "assets/images/fotoo.png"; // HARUS ukuran 1080x1350

    frame.onload = function () {
      ctx.drawImage(frame, 0, 0, targetWidth, targetHeight);
      var dataUrl = canvas.toDataURL("image/png");
      if (!window.db) return alert("Firebase belum siap");
      db.ref("winners").limitToLast(1).once("value", function (snapshot) {
        var data = snapshot.val();
        if (!data) return alert("Belum ada pemenang untuk disisipkan selfie.");
        var lastKey = Object.keys(data)[0];
        db.ref("winners/".concat(lastKey)).update({
          selfie: dataUrl
        }).then(function () {
          alert("✅ Selfie disimpan ke Firebase. Mengalihkan kembali...");
          window.location.href = "https://adriannicholasl.github.io/sotorusukba_kopetrus_v4/";
        })["catch"](function (err) {
          alert("❌ Gagal menyimpan selfie. Mengalihkan kembali...");
          window.location.href = "https://adriannicholasl.github.io/sotorusukba_kopetrus_v4/";
        });
      });
    };
    frame.onerror = function () {
      alert("Gagal memuat frame gambar.");
    };
  };
});