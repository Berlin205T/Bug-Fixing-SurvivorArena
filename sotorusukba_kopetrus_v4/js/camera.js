// js/camera.js versi Firebase

document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => {
      alert("Kamera tidak tersedia. Gunakan perangkat lain.");
      console.error("Camera error:", err);
    });

  // Ambil parameter "key" dari URL
  function getWinnerKeyFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("key");
  }

  // Fungsi untuk menunggu Firebase siap sebelum melanjutkan
  function waitForFirebaseReady() {
    return new Promise((resolve, reject) => {
      if (window.firebaseReady) {
        resolve(window.firebaseReady);
      } else {
        reject(new Error("Firebase belum siap"));
      }
    });
  }

  // EDITED by Adriannicholasl
  // Mengambil foto dari video dan menyimpannya ke Firebase   
  // FIXED Ukuran gambar untuk feed IG potret 4:5 (1080x1350)
  window.takeSelfie = () => {
    const key = getWinnerKeyFromURL();
    if (!key) {
      alert("❌ Link selfie tidak valid. Tidak ada key.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      alert("Kamera belum siap. Coba lagi.");
      return;
    }

    const targetWidth = 1080;
    const targetHeight = 1350;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;

    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    const inputRatio = tempCanvas.width / tempCanvas.height;
    const targetRatio = targetWidth / targetHeight;

    let cropWidth = tempCanvas.width;
    let cropHeight = tempCanvas.height;

    if (inputRatio > targetRatio) {
      cropWidth = tempCanvas.height * targetRatio;
    } else {
      cropHeight = tempCanvas.width / targetRatio;
    }

    const cropX = (tempCanvas.width - cropWidth) / 2;
    const cropY = (tempCanvas.height - cropHeight) / 2;

    ctx.drawImage(
      tempCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const frame = new Image();
    frame.src = "assets/images/fotoo.png";

    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, targetWidth, targetHeight);
      const dataUrl = canvas.toDataURL("image/png");

      // Tunggu Firebase siap
      waitForFirebaseReady()
        .then(() => {
          if (!window.db) {
            alert("Firebase belum siap.");
            return;
          }

          // Simpan ke path spesifik berdasarkan key dari URL
          const ref = db.ref(`winners/${key}`);
          ref.once("value", (snapshot) => {
            const data = snapshot.val();
            if (!data) {
              alert("❌ Data pemenang tidak ditemukan.");
              return;
            }

            if (data.selfie) {
              alert("⚠️ Selfie sudah pernah disimpan untuk pemenang ini.");
              return;
            }

            // Update data pemenang dengan selfie
            ref.update({
              selfie: dataUrl,
              selfieTime: new Date().toISOString()
            })
              .then(() => {
                alert("✅ Selfie disimpan ke Firebase. Mengalihkan kembali...");
                window.location.href = "https://adriannicholasl.github.io/sotorusukba_kopetrus_v4/";
              })
              .catch((err) => {
                alert("❌ Gagal menyimpan selfie.");
                console.error(err);
              });
          });
        })
        .catch((err) => {
          alert("❌ Gagal memuat Firebase.");
          console.error(err);
        });
    };

    frame.onerror = () => {
      alert("❌ Gagal memuat frame gambar.");
    };
  };

});
