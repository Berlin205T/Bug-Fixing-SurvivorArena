// Tutup modal selfie
function closeSelfieModal() {
    document.getElementById('selfieModal').style.display = 'none';
  }
  document.getElementById('closeSelfieModal')
    .addEventListener('click', closeSelfieModal);
  
  document.addEventListener("DOMContentLoaded", () => {
    const tableBody      = document.getElementById("winnerTableBody");
    const downloadButton = document.getElementById('downloadAll');
  
    // ---------------------------------------------------
    // 1. Load dan render semua pemenang
    window.firebaseReady
    .then(db => loadWinners(db))
    .catch(err => {
      console.error("❌ Firebase belum siap:", err);
      alert("❌ Firebase belum siap. Cek koneksi atau inisialisasi.");
    });
    async function loadWinners(db) {
      try {
        const snap = await db.ref("winners").once("value");
        renderData(snap.val());
      } catch (err) {
        console.error("❌ Gagal memuat data pemenang:", err);
        alert("Gagal memuat data. Cek koneksi.");
      }
    }
  
    // ---------------------------------------------------
    // 2. Download data (CSV / JSON)
    document.addEventListener("DOMContentLoaded", async () => {
        try {
          // Tunggu sampai Firebase siap
          const db = await window.firebaseReady;
      
          // Operasi yang memerlukan Firebase siap
          console.log("✅ Firebase ready, mulai akses database");
      
          // Lanjutkan operasi database, misalnya memuat data
          const snap = await db.ref('some/path').once("value");
          const data = snap.val();
          console.log(data);
      
        } catch (err) {
          console.error("❌ Firebase belum siap:", err);
          alert("❌ Firebase belum siap. Cek koneksi atau inisialisasi.");
        }
      });
  
    // ---------------------------------------------------
    // 3. Render tabel pemenang
    function renderData(data) {
      tableBody.innerHTML = "";
      if (!data || !Object.keys(data).length) {
        tableBody.innerHTML = `
          <tr class="tr-shadow">
            <td colspan="9" class="empty-table">Belum ada data pemenang.</td>
          </tr>`;
        return;
      }
  
      const frag = document.createDocumentFragment();
      Object.entries(data).forEach(([key, d], i) => {
        const tr = document.createElement("tr");
        tr.classList.add("tr-shadow");
        tr.innerHTML = `
          <td>${i+1}</td>
          <td>${d.nama || '-'}</td>
          <td>${d.ig   || '-'}</td>
          <td>${d.telp || '-'}</td>
          <td>${d.level || '-'}</td>
          <td>
            ${d.reward || '-'}<br>
            <img src="${d.rewardIcon || 'assets/images/default-reward.png'}"
                 alt="Icon" style="max-height:40px;margin-top:5px;">
          </td>
          <td>${new Date(d.timestamp).toLocaleString()}</td>
          <td>
            ${d.selfie
              ? `<button class="btn-lihat" data-selfie="${d.selfie}">Lihat</button>`
              : '—'}
          </td>
          <td>
            <button class="btn-hapus" data-id="${key}">Hapus</button>
          </td>
        `;
        frag.appendChild(tr);
      });
      tableBody.appendChild(frag);
  
      // Event listener Lihat Selfie
      tableBody.querySelectorAll('.btn-lihat').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById("selfieModalImage").src = btn.dataset.selfie;
          document.getElementById("selfieModal").style.display = 'flex';
        });
      });
  
      // Event listener Hapus
      tableBody.querySelectorAll('.btn-hapus').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Yakin hapus data ini?')) return;
          try {
            const db = await window.firebaseReady;
            await db.ref(`winners/${btn.dataset.id}`).remove();
            alert("✅ Data dihapus!");
            loadWinners(db);
          } catch (err) {
            console.error("❌ Gagal hapus data:", err);
            alert("Gagal menghapus data.");
          }
        });
      });
    }
  
    // ---------------------------------------------------
    // 4. Utility: Download CSV / JSON
    function downloadDataAsCSV(data) {
      const rows = [
        ['No', 'Nama', 'Instagram', 'Telp', 'Level', 'Reward', 'Timestamp']
      ];
      Object.values(data).forEach((d, i) => {
        rows.push([
          i + 1, d.nama || '-', d.ig || '-', d.telp || '-',
          d.level || '-', d.reward || '-',
          new Date(d.timestamp).toLocaleString()
        ]);
      });
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: 'data_pemenang.csv'
      });
      a.click();
    }
  
    function downloadDataAsJSON(data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: 'data_pemenang.json'
      });
      a.click();
    }
  });
  