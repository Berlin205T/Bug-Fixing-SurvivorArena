document.addEventListener("DOMContentLoaded", () => {
  const levelSelect = document.getElementById("levelSelect");
  const speedInput = document.getElementById("speedInput");
  const toleranceInput = document.getElementById("toleranceInput");
  const rewardInput = document.getElementById("rewardInput");
  const iconInput = document.getElementById("iconInput");
  const previewIcon = document.getElementById("previewIcon");

  function loadSettings() {
      const level = levelSelect.value;
      if (window.db) {
          db.ref(`settings/level${level}`).once("value", snapshot => {
              const conf = snapshot.val() || {};
              speedInput.value = conf.speed || "";
              toleranceInput.value = conf.tolerance || "";
              rewardInput.value = conf.reward || "";
              previewIcon.src = conf.icon || "";
          });
      } else {
          alert("Firebase belum siap");
      }
  }

  function saveSettings() {
      const level = levelSelect.value;
      const speed = speedInput.value;
      const tolerance = toleranceInput.value;
      const reward = rewardInput.value;
      const iconFile = iconInput.files[0];

      const applySave = (iconBase64) => {
          const data = { speed, tolerance, reward, icon: iconBase64 };
          if (window.db) {
              db.ref(`settings/level${level}`).set(data).then(() => {
                  alert("✅ Data disimpan ke Firebase");
                  loadSettings();
              });
          } else {
              alert("Firebase belum siap");
          }
      };

      if (iconFile) {
          const reader = new FileReader();
          reader.onload = () => applySave(reader.result);
          reader.readAsDataURL(iconFile);
      } else {
          applySave(previewIcon.src);
      }
  }

  window.saveSettings = saveSettings;
  levelSelect.addEventListener("change", loadSettings);

  // Tunggu firebase ready
  const interval = setInterval(() => {
      if (window.db) {
          clearInterval(interval);
          loadSettings();
      }
  }, 300);
});
