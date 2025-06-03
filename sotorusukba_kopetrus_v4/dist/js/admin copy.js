"use strict";

document.addEventListener("DOMContentLoaded", function () {
  var levelSelect = document.getElementById("levelSelect");
  var speedInput = document.getElementById("speedInput");
  var toleranceInput = document.getElementById("toleranceInput");
  var rewardInput = document.getElementById("rewardInput");
  var iconInput = document.getElementById("iconInput");
  var previewIcon = document.getElementById("previewIcon");
  function loadSettings() {
    var level = levelSelect.value;
    if (window.db) {
      db.ref("settings/level".concat(level)).once("value", function (snapshot) {
        var conf = snapshot.val() || {};
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
    var level = levelSelect.value;
    var speed = speedInput.value;
    var tolerance = toleranceInput.value;
    var reward = rewardInput.value;
    var iconFile = iconInput.files[0];
    var applySave = function applySave(iconBase64) {
      var data = {
        speed: speed,
        tolerance: tolerance,
        reward: reward,
        icon: iconBase64
      };
      if (window.db) {
        db.ref("settings/level".concat(level)).set(data).then(function () {
          alert("✅ Data disimpan ke Firebase");
          loadSettings();
        });
      } else {
        alert("Firebase belum siap");
      }
    };
    if (iconFile) {
      var reader = new FileReader();
      reader.onload = function () {
        return applySave(reader.result);
      };
      reader.readAsDataURL(iconFile);
    } else {
      applySave(previewIcon.src);
    }
  }
  window.saveSettings = saveSettings;
  levelSelect.addEventListener("change", loadSettings);

  // Tunggu firebase ready
  var interval = setInterval(function () {
    if (window.db) {
      clearInterval(interval);
      loadSettings();
    }
  }, 300);
});