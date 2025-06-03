// Mengambil parameter level dari URL
const urlParams = new URLSearchParams(window.location.search);
const level = urlParams.get("level") || 1; // Default level 1 jika tidak ada parameter

// Elemen-elemen DOM
const loadingEl = document.getElementById("loading");
const rewardContainer = document.getElementById("rewardContainer");
const startBtn = document.getElementById("startGameBtn");

let selectedReward = null;

// IIFE: tunggu Firebase siap, lalu load rewards
(async function initRewards() {
  try {
    // Tunggu hingga window.firebaseReady terdefinisi
    while (typeof window.firebaseReady === "undefined") {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const db = await window.firebaseReady;
    loadRewards(db);
  } catch (error) {
    console.error("Firebase belum siap:", error);
    alert("Gagal terhubung ke Firebase. Cek koneksi.");
  }
})();

// Fungsi memuat dan merender hadiah
function loadRewards(db) {
  // tampilkan spinner
  loadingEl.style.display = "block";
  rewardContainer.innerHTML = "";  // clear container

  db.ref(`settings/level${level}`).once("value")
    .then(snapshot => {
      const conf = snapshot.val() || {};
      const rewards = Array.isArray(conf.rewards) ? conf.rewards : [];

      // sembunyikan spinner
      loadingEl.style.display = "none";

      if (rewards.length) {
        rewards.forEach((r, i) => {
          const div = document.createElement("div");
          div.className = "reward-option";
          div.innerHTML = `
            <img src="${r.icon}" alt="Reward ${i+1}" />
            <div class="reward-name">${r.reward}</div>
          `;

          div.addEventListener("click", () => {
            // toggle selected
            document.querySelectorAll(".reward-option")
                    .forEach(opt => opt.classList.remove("selected"));
            div.classList.add("selected");
            selectedReward = r;
            startBtn.disabled = false;
          });

          rewardContainer.appendChild(div);
        });
      } else {
        rewardContainer.innerHTML = "<p>Tidak ada hadiah ditemukan untuk level ini.</p>";
      }
    })
    .catch(err => {
      // error handling
      loadingEl.style.display = "none";
      console.error("Error loadRewards:", err);
      alert("Gagal memuat hadiah. Cek koneksi.");
    });
}

// Tombol Mulai Game
startBtn.addEventListener("click", () => {
  if (!selectedReward) {
    return alert("Silakan pilih hadiah dahulu!");
  }
  const minimalReward = {
    reward: selectedReward.reward,
    icon: selectedReward.icon,
  };
  sessionStorage.setItem("selectedReward", JSON.stringify(minimalReward));
  window.location.href = `game.html?level=${level}`;
});
