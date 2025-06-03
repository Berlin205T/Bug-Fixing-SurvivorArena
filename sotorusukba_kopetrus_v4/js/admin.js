document.addEventListener("DOMContentLoaded", async () => {
  const levelSelect     = document.getElementById("levelSelect");
  const speedInput      = document.getElementById("speedInput");
  const toleranceInput  = document.getElementById("toleranceInput");

  // Inputs untuk 3 hadiah
  const rewardInputs = [
    document.getElementById("rewardInput1"),
    document.getElementById("rewardInput2"),
    document.getElementById("rewardInput3")
  ];
  const iconInputs = [
    document.getElementById("iconInput1"),
    document.getElementById("iconInput2"),
    document.getElementById("iconInput3")
  ];
  const previewIcons = [
    document.getElementById("previewIcon1"),
    document.getElementById("previewIcon2"),
    document.getElementById("previewIcon3")
  ];

  // Muat settings saat ganti level
  levelSelect.addEventListener("change", loadSettings);

  // Tampilkan preview saat file image diganti
  iconInputs.forEach((input, idx) => {
    input.addEventListener("change", () => handleIconPreview(input, previewIcons[idx], idx));
  });

  // Tombol simpan di HTML harus memanggil window.saveSettings()
  window.saveSettings = saveSettings;

  try {
    // Tunggu Firebase siap
    await window.firebaseReady;
    console.log("✅ Firebase ready, siap meload settings");
    loadSettings();  // load settings pertama kali setelah Firebase siap

  } catch (err) {
    console.error("❌ Firebase belum siap:", err);
    alert("❌ Firebase belum siap. Cek koneksi atau inisialisasi.");
  }

  // -----------------------------
  // Fungsi untuk load settings
  async function loadSettings() {
    const level = levelSelect.value;
    try {
      const db = await window.firebaseReady;
      const snap = await db.ref(`settings/level${level}`).once("value");
      const conf = snap.val() || {};

      speedInput.value     = conf.speed     || "";
      toleranceInput.value = conf.tolerance || "";

      // Render rewards ke form
      (conf.rewards || []).forEach((r, i) => {
        if (rewardInputs[i]) {
          rewardInputs[i].value = r.reward || "";
        }
        if (previewIcons[i]) {
          previewIcons[i].src = r.icon || "";
        }
      });
    } catch (err) {
      console.error("❌ Gagal load settings:", err);
      alert("Gagal memuat settings. Cek koneksi.");
    }
  }

  // -----------------------------
  // Fungsi untuk save settings ke Firebase
  async function saveSettings() {
    const level     = levelSelect.value;
    const speed     = speedInput.value.trim();
    const tolerance = toleranceInput.value.trim();

    // Validasi nama hadiah
    if (!validateRewards()) {
      return; // Hentikan proses jika ada nama hadiah kosong
    }

    try {
      // Baca semua icon (FileReader) jadi Base64
      const iconPromises = iconInputs.map((input, idx) => readIconFile(input, previewIcons[idx], idx));
      const icons = await Promise.all(iconPromises);

      // Buat array rewards
      const rewards = rewardInputs.map((inp, i) => ({
        reward: inp.value.trim(),
        icon: icons[i]
      }));

      // Payload
      const payload = { speed, tolerance, rewards };

      // Simpan sekali ke Firebase
      const db = await window.firebaseReady;
      await db.ref(`settings/level${level}`).set(payload);

      alert("✅ Data berhasil disimpan!");
      loadSettings();  // refresh form dengan data terbaru
    } catch (err) {
      console.error("❌ Gagal save settings:", err);
      alert("Gagal menyimpan settings. Cek konsol.");
    }
  }

  // Fungsi untuk menampilkan preview icon
  function handleIconPreview(input, previewIcon, idx) {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        previewIcon.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Fungsi untuk membaca file icon dan mengembalikan URL Base64
  function readIconFile(input, previewIcon, idx) {
    const file = input.files[0];
    if (!file) {
      // Jika tidak ada file baru, gunakan preview src saat ini
      return Promise.resolve(previewIcon.src);
    }
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  // Validasi jika nama hadiah tidak kosong
  function validateRewards() {
    for (let i = 0; i < rewardInputs.length; i++) {
      if (!rewardInputs[i].value.trim()) {
        alert(`❗ Nama hadiah ${i + 1} tidak boleh kosong`);
        return false;
      }
    }
    return true;
  }
});
