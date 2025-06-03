document.addEventListener("DOMContentLoaded", async () => {
    // -------------------------
    // Bagian Admin: Pengaturan Level
    const levelSelect = document.getElementById("levelSelect");
    const speedInput = document.getElementById("speedInput");
    const toleranceInput = document.getElementById("toleranceInput");

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

// Tunggu Firebase siap sebelum melanjutkan
function waitForFirebaseReady(timeout = 5000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            if (window.firebaseReady) {
                resolve(window.firebaseReady);
            } else if (Date.now() - start > timeout) {
                reject("Timeout: window.firebaseReady tidak tersedia.");
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
}

// Tunggu sampai window.firebaseReady tersedia lalu jalan
try {
    const ready = await waitForFirebaseReady();
    await ready;
    console.log("✅ Firebase berhasil terhubung");
    loadSettings();
    loadWinners();
} catch (err) {
    console.error("❌ Firebase gagal siap:", err);
    alert("Gagal memuat Firebase. Cek koneksi atau urutan skrip.");
}

// Fungsi untuk load settings
async function loadSettings() {
        const level = levelSelect.value;
        try {
        const db = window.db;
        const snap = await db.ref(`settings/level${level}`).once("value");
        const conf = snap.val() || {};
    
        speedInput.value = conf.speed || "";
        toleranceInput.value = conf.tolerance || "";
    
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
    // Fungsi untuk save settings ke Firebase
    async function saveSettings() {
        const level = levelSelect.value;
        const speed = speedInput.value.trim();
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
            const db = window.firebase.database();  // Gunakan firestore() atau realtimedb() tergantung kebutuhan
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

    // -------------------------
    // Bagian Data: Menampilkan Pemenang
    const tableBody = document.getElementById("winnerTableBody");
    const downloadButton = document.getElementById('downloadAll');

    // Load dan render semua pemenang
    try {
        if (window.firebaseReady) {
            await window.firebaseReady;
            loadWinners(); // Hanya setelah Firebase siap
        } else {
            console.error("❌ Firebase belum siap.");
        }
    } catch (err) {
        console.error("❌ Firebase belum siap:", err);
        alert("❌ Firebase belum siap. Cek koneksi atau inisialisasi.");
    }

    // Fungsi untuk load pemenang
    async function loadWinners() {
        try {
        const db = window.db;
        const snap = await db.ref("winners").once("value");
        renderData(snap.val());
        } catch (err) {
        console.error("❌ Gagal memuat data pemenang:", err);
        alert("Gagal memuat data. Cek koneksi.");
        }
    }

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
            <td>${i + 1}</td>
            <td>${d.nama || '-'}</td>
            <td><span class="block-email">${d.ig || '-'}</span></td>
            <td>${d.telp || '-'}</td>
            <td>${d.level || '-'}</td>
            <td>
                ${d.reward || '-'}<br>
                <img src="${d.rewardIcon || 'assets/images/default-reward.png'}" alt="Icon" style="max-height: 40px; margin-top: 5px;">
            </td>
            <td>${new Date(d.timestamp).toLocaleString()}</td>
            <td>
                ${d.selfie 
                    ? `<img src="${d.selfie}" class="selfie-thumbnail" alt="Selfie" style="max-height: 60px; border-radius: 5px;">`
                    : 'Tidak ada'}
            </td>
            <td>
                <div class="table-data-feature">
                    ${d.selfie 
                        ? `<a class="item" title="Download Selfie" href="${d.selfie}" 
                            download="selfie_${(d.ig || 'pemenang').replace('@', '').replace(/\s+/g, '_')}.png">
                            <i class="zmdi zmdi-download"></i>
                        </a>` 
                        : ''}
                    ${d.selfie 
                        ? `<button class="item btn-lihat" title="Lihat Selfie" data-selfie="${d.selfie}">
                            <i class="zmdi zmdi-eye"></i>
                        </button>` 
                        : ''}
                    <button class="item btn-hapus" data-id="${key}" title="Hapus">
                        <i class="zmdi zmdi-delete"></i>
                    </button>
                </div>
            </td>
        `;
            frag.appendChild(tr);
        });
        tableBody.appendChild(frag);

        tableBody.querySelectorAll('.btn-lihat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const src = e.currentTarget.getAttribute('data-selfie');
                const modal = document.getElementById("selfieModal");
                const modalImage = document.getElementById("selfieModalImage");
                if (modal && modalImage && src) {
                    modalImage.src = src;
                    modal.classList.add("open");
                    modal.style.display = "block";
                } else {
                    alert("Gagal menampilkan selfie. Elemen tidak ditemukan.");
                }
            });
        });

        // Event listener Hapus
        tableBody.querySelectorAll('.btn-hapus').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('button').getAttribute('data-id');
                try {
                    const db = firebase.database(); // Gunakan firestore() atau realtimedb() tergantung kebutuhan
                    await db.ref(`winners/${id}`).remove();
                    loadWinners(); // Refresh data
                    alert("✅ Data pemenang berhasil dihapus.");
                } catch (err) {
                    console.error("❌ Gagal hapus data:", err);
                    alert("❌ Gagal menghapus data.");
                }
            });
        });
    }

    document.getElementById("closeSelfieModal").addEventListener("click", () => {
        const modal = document.getElementById("selfieModal");
        modal.classList.remove("open");
    });

    document.getElementById("closeSelfieModal").addEventListener("click", () => {
        document.getElementById("selfieModal").classList.remove("open");
        const modal = document.getElementById("selfieModal");
        modal.style.display = "none";
    });
});

// Helper function to show notification
function showNotification(message) {
    const notification = document.getElementById("download-status");
    notification.textContent = message;
    notification.style.display = "block";
}

// Helper function to hide notification after a delay
function hideNotification() {
    const notification = document.getElementById("download-status");
    setTimeout(() => {
        notification.style.display = "none";
    }, 2000); // Hide after 2 seconds
}

// Event: Download CSV
document.getElementById("btnDownloadCSV")?.addEventListener("click", async () => {
    showNotification("Sedang Mendownload...");

    const snap = await window.db.ref("winners").once("value");
    const data = snap.val();
    if (!data) {
        showNotification("Data kosong");
        return;
    }

    const rows = [["No", "Nama", "Instagram", "Telepon", "Level", "Hadiah", "Waktu"]];
    Object.values(data).forEach((d, i) => {
        rows.push([
            i + 1,
            d.nama || "-",
            d.ig || "-",
            d.telp || "-",
            d.level || "-",
            d.reward || "-",
            new Date(d.timestamp).toLocaleString()
        ]);
    });

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data_pemenang.csv";
    a.click();

    // Update notification to show success message
    showNotification("Data berhasil didownload");
    hideNotification();
});

// Event: Download JSON
document.getElementById("btnDownloadJSON")?.addEventListener("click", async () => {
    showNotification("Sedang Mendownload...");

    const snap = await window.db.ref("winners").once("value");
    const data = snap.val();
    if (!data) {
        showNotification("Data kosong");
        return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data_pemenang.json";
    a.click();

    // Update notification to show success message
    showNotification("Data berhasil didownload");
    hideNotification();
});

// Event: Download PDF
document.getElementById("btnDownloadPDF")?.addEventListener("click", async () => {
    showNotification("Sedang Mendownload...");

    const snap = await window.db.ref("winners").once("value");
    const data = snap.val();
    if (!data) {
        showNotification("Data kosong");
        return;
    }

    const body = [["No", "Nama", "Instagram", "Telepon", "Level", "Hadiah", "Waktu"]];
    Object.values(data).forEach((d, i) => {
        body.push([
            i + 1,
            d.nama || "-",
            d.ig || "-",
            d.telp || "-",
            d.level || "-",
            d.reward || "-",
            new Date(d.timestamp).toLocaleString()
        ]);
    });

    const docDefinition = {
        content: [
            { text: "Data Pemenang", style: "header" },
            {
                table: {
                    headerRows: 1,
                    widths: ["auto", "*", "*", "*", "auto", "*", "*"],
                    body: body
                }
            }
        ],
        styles: {
            header: {
                fontSize: 16,
                bold: true,
                marginBottom: 10
            }
        }
    };

    pdfMake.createPdf(docDefinition).download("data_pemenang.pdf");

    // Update notification to show success message
    showNotification("Data berhasil didownload");
    hideNotification();
});
