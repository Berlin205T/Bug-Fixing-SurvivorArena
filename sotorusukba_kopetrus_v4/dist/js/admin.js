"use strict";

require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.string.trim.js");
require("core-js/modules/web.dom-collections.for-each.js");
document.addEventListener("DOMContentLoaded", function () {
  var levelSelect = document.getElementById("levelSelect");
  var speedInput = document.getElementById("speedInput");
  var toleranceInput = document.getElementById("toleranceInput");

  // Untuk 3 hadiah
  var rewardInputs = [document.getElementById("rewardInput1"), document.getElementById("rewardInput2"), document.getElementById("rewardInput3")];
  var iconInputs = [document.getElementById("iconInput1"), document.getElementById("iconInput2"), document.getElementById("iconInput3")];
  var previewIcons = [document.getElementById("previewIcon1"), document.getElementById("previewIcon2"), document.getElementById("previewIcon3")];
  function loadSettings() {
    var level = levelSelect.value;
    if (window.db) {
      db.ref("settings/level".concat(level)).once("value", function (snapshot) {
        var conf = snapshot.val() || {};
        speedInput.value = conf.speed || "";
        toleranceInput.value = conf.tolerance || "";
        if (conf.rewards && Array.isArray(conf.rewards)) {
          conf.rewards.forEach(function (r, i) {
            if (rewardInputs[i]) rewardInputs[i].value = r.reward || "";
            if (previewIcons[i]) previewIcons[i].src = r.icon || "";
          });
        }
      });
    } else {
      alert("Firebase belum siap");
    }
  }
  function saveSettings() {
    var level = levelSelect.value;
    var speed = speedInput.value;
    var tolerance = toleranceInput.value;
    var rewards = [];
    function uploadToFirebase() {
      if (rewards.length === 3) {
        db.ref("settings/level".concat(level)).set({
          speed: speed,
          tolerance: tolerance,
          rewards: rewards
        }).then(function () {
          alert("✅ Data berhasil disimpan ke Firebase!");
          loadSettings();
        });
      }
    }
    var _loop = function _loop() {
        var name = rewardInputs[i].value.trim();
        var file = iconInputs[i].files[0];
        if (!name) {
          alert("\u2757 Nama hadiah ".concat(i + 1, " kosong"));
          return {
            v: void 0
          };
        }
        var finish = function finish(iconBase64) {
          rewards.push({
            reward: name,
            icon: iconBase64
          });
          uploadToFirebase();
        };
        if (file) {
          var reader = new FileReader();
          reader.onload = function () {
            return finish(reader.result);
          };
          reader.readAsDataURL(file);
        } else {
          finish(previewIcons[i].src); // Gunakan gambar lama
        }
      },
      _ret;
    for (var i = 0; i < 3; i++) {
      _ret = _loop();
      if (_ret) return _ret.v;
    }
  }
  window.saveSettings = saveSettings;
  levelSelect.addEventListener("change", loadSettings);

  // Tampilkan preview gambar saat file diganti
  iconInputs.forEach(function (input, index) {
    input.addEventListener("change", function () {
      var file = input.files[0];
      if (file) {
        var reader = new FileReader();
        reader.onload = function () {
          previewIcons[index].src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    });
  });

  // Tunggu firebase ready
  var interval = setInterval(function () {
    if (window.db) {
      clearInterval(interval);
      loadSettings();
    }
  }, 300);
});