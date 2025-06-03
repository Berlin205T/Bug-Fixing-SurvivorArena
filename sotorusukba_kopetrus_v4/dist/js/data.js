"use strict";

require("core-js/modules/es.symbol.js");
require("core-js/modules/es.symbol.description.js");
require("core-js/modules/es.symbol.iterator.js");
require("core-js/modules/es.array.from.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.regexp.to-string.js");
require("core-js/modules/es.array.concat.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.array.join.js");
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.object.entries.js");
require("core-js/modules/es.object.keys.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/es.string.replace.js");
require("core-js/modules/web.dom-collections.for-each.js");
require("core-js/modules/web.dom-collections.iterator.js");
require("core-js/modules/web.url.js");
require("core-js/modules/web.url.to-json.js");
require("core-js/modules/web.url-search-params.js");
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// Menambahkan event listener pada tombol close
document.getElementById('closeSelfieModal').addEventListener('click', closeSelfieModal);

// Closing the selfie modal when the close button is clicked
document.getElementById('closeSelfieModal').addEventListener('click', function () {
  document.getElementById('selfieModal').style.display = 'none';
});
document.addEventListener("DOMContentLoaded", function () {
  var tableBody = document.getElementById("winnerTableBody");
  var downloadButton = document.getElementById('downloadAll');

  // Fungsi untuk mengunduh data sebagai CSV
  function downloadDataAsCSV(data) {
    var rows = [];
    var header = ['No', 'Nama', 'Instagram', 'Telp', 'Level', 'Reward', 'Timestamp'];
    rows.push(header);

    // Menambahkan baris data
    Object.entries(data).forEach(function (_ref, i) {
      var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        d = _ref2[1];
      var row = [i + 1, d.nama || '-', d.ig || '-', d.telp || '-', d.level || '-', d.reward || '-', new Date(d.timestamp).toLocaleString()];
      rows.push(row);
    });

    // Mengubah array menjadi CSV string
    var csvContent = rows.map(function (row) {
      return row.join(',');
    }).join('\n');

    // Membuat file CSV dan mengunduhnya
    var blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data_pemenang.csv';
    link.click();
  }

  // Fungsi untuk mengunduh data sebagai JSON
  function downloadDataAsJSON(data) {
    var jsonContent = JSON.stringify(data, null, 2);
    var blob = new Blob([jsonContent], {
      type: 'application/json;charset=utf-8;'
    });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data_pemenang.json';
    link.click();
  }

  // Menambahkan event listener pada tombol download
  downloadButton.addEventListener('click', function () {
    db.ref("winners").once("value", function (snapshot) {
      var data = snapshot.val();
      if (data) {
        // Pilih format download (CSV atau JSON)
        var fileFormat = prompt('Pilih format unduhan (CSV/JSON):').toLowerCase();
        if (fileFormat === 'csv') {
          downloadDataAsCSV(data);
        } else if (fileFormat === 'json') {
          downloadDataAsJSON(data);
        } else {
          alert('Format yang dipilih tidak valid!');
        }
      } else {
        alert('Tidak ada data untuk diunduh.');
      }
    });
  });
  function renderData(data) {
    tableBody.innerHTML = "";
    if (!data || Object.keys(data).length === 0) {
      tableBody.innerHTML = "\n        <tr class=\"tr-shadow\">\n        <td colspan=\"10\" class=\"empty-table\">Belum ada data pemenang.</td>\n        </tr>";
      return;
    }
    Object.entries(data).forEach(function (_ref3, i) {
      var _ref4 = _slicedToArray(_ref3, 2),
        key = _ref4[0],
        d = _ref4[1];
      var row = document.createElement("tr");
      row.classList.add("tr-shadow");
      row.innerHTML = "\n        <td>".concat(i + 1, "</td>\n        <td>").concat(d.nama || '-', "</td>\n        <td><span class=\"block-email\">").concat(d.ig || '-', "</span></td>\n        <td>").concat(d.telp || '-', "</td>\n        <td>").concat(d.level || '-', "</td>\n        <td>\n        ").concat(d.reward || '-', "<br>\n        ").concat(d.rewardIcon ? "<img src=\"".concat(d.rewardIcon, "\" alt=\"Icon\" style=\"max-height: 40px; margin-top: 5px;\">") : '<img src="assets/images/default-reward.png" style="max-height: 40px; margin-top: 5px;">', "\n        </td>\n        <td>").concat(new Date(d.timestamp).toLocaleString(), "</td>\n        <td>\n        ").concat(d.selfie ? "<img src=\"".concat(d.selfie, "\" class=\"selfie-thumbnail\" alt=\"Selfie\" style=\"max-height: 60px; border-radius: 5px;\">") : 'Tidak ada', "\n        </td>\n        <td>\n    <div class=\"table-data-feature\">\n        ").concat(d.selfie ? "<a class=\"item\" title=\"Download Selfie\" href=\"".concat(d.selfie, "\" download=\"selfie_").concat((d.ig || 'pemenang').replace(/\s+/g, '_'), ".png\">\n                <i class=\"zmdi zmdi-download\"></i>\n            </a>") : '', "\n        ").concat(d.selfie ? "<button class=\"item btn-lihat\" title=\"Lihat Selfie\" data-selfie=\"".concat(d.selfie, "\">\n                <i class=\"zmdi zmdi-eye\"></i>\n            </button>") : '', "\n        <button class=\"item btn-hapus\" data-id=\"").concat(key, "\" title=\"Hapus\">\n            <i class=\"zmdi zmdi-delete\"></i>\n        </button>\n        </div>\n    </td>\n    ");
      tableBody.appendChild(row);

      // Tambahkan spacer antar baris
      var spacer = document.createElement("tr");
      spacer.classList.add("spacer");
      tableBody.appendChild(spacer);
    });
    var viewButtons = document.querySelectorAll('.btn-lihat');
    viewButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var src = this.getAttribute('data-selfie');
        var img = document.getElementById("selfieModalImage");
        img.src = src;
        document.getElementById('selfieModal').style.display = "flex";
      });
    });
    function showSelfieModal(url) {
      var img = document.getElementById("selfieModalImage");
      img.src = url;
      document.getElementById("selfieModal").style.display = "flex";
    }
    function closeSelfieModal() {
      document.getElementById("selfieModal").style.display = "none";
    }

    // Tambahkan event listener untuk tombol hapus
    var deleteButtons = document.querySelectorAll('.btn-hapus');
    deleteButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var key = this.getAttribute('data-id'); // Ambil ID entri dari data-id
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
          db.ref("winners/" + key).remove().then(function () {
            alert("Data dihapus!");
            renderDataAfterUpdate(); // Render ulang setelah update
          })["catch"](function (error) {
            console.error("Error menghapus data:", error);
            alert("Terjadi kesalahan saat menghapus data.");
          });
        }
      });
    });
  }
  function renderDataAfterUpdate() {
    db.ref("winners").once("value", function (snapshot) {
      renderData(snapshot.val());
    });
  }

  // Tunggu Firebase siap
  var waitFirebase = setInterval(function () {
    if (window.db) {
      clearInterval(waitFirebase);
      db.ref("winners").once("value", function (snapshot) {
        renderData(snapshot.val());
      });
    }
  }, 300);
});