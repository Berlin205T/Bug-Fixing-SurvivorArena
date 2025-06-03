# 📦 Proyek Game Tangkap - Soto Rusuk Ba' Ko Petrus

Game ini adalah permainan interaktif berbasis web untuk menarik pelanggan di restoran Soto Rusuk Ba' Ko Petrus, diakses melalui LG Standby ME (WebOS) dan HP admin.

---

## 🎮 Fitur Utama
- **Game tangkap interaktif** berbasis touch-screen.
- **4 level kesulitan** dengan pengaturan hadiah yang fleksibel.
- **Sistem hadiah & pemenang** dengan input data pelanggan.
- **Ambil selfie pemenang** via HP.
- **Dashboard Admin** untuk atur kecepatan, toleransi, hadiah. download data pemenang
- **Firebase Realtime Database** sebagai backend (hosting github-page).
- **Offline-ready** untuk akses di LG Standby ME.
- **Responsive UI** untuk akses di LG Standby ME.

---

## 📱 Alur Penggunaan

### 🔹 Di LG Standby ME (Customer)
1. Akses `index.html` melalui GitHub Pages.
2. Pilih level → main game.
3. Jika menang → isi nama, IG, telepon. (Simpan Data)
4. QR Selfie ditampilkan untuk HP Customer (LG Standby ME tidak mendukung akses kamera di webOS)

### 🔹 Di HP Admin (Staf)
1. Scan QR untuk buka `camera.html` → ambil selfie.
2. Gunakan `dashboard.html` untuk:
   - Atur hadiah dan level
   - Lihat data pemenang
   - Download data pemenang
   - Lihat Foto Pemenang
   - Hapus Data Pemenang
   - Download Foto Pemenang untuk post di sosial media
   - Lihat data pemenang
3. Gunakan `login.html` untuk akses ke `dashboard.html`


## 🛠️ Teknologi yang Digunakan
- HTML, CSS, JavaScript, JQ
- Firebase Realtime Database
- GitHub Pages
- WebOS Browser Compatibility
- PWA (Download Aplikasi Khusus Android)

---

## 🌐 Struktur Halaman

| Halaman              | Akses dari       | Fungsi                                    |
|---------------------|------------------|-------------------------------------------|
| `index.html`        | LG               | Halaman awal & pilih level permainan      |
| `game.html`         | LG               | Gameplay & hasil menang/kalah             |
| `admin.html`        | HP Admin         | Atur kecepatan, hadiah, toleransi         |
| `camera.html`       | HP               | Ambil selfie pemenang                     |
| `login.html`        | HP               | Akse ke `dashboard.html` wajib login      |
| `modal.html`        | HP & LG          | Notfikasi Menang & Kalah, QR untuk Selfie |
| `dashboard.html`    | HP Admin         | Berisi untuk `systemlevel` & `datapemenang`|

---

## 🔐 Akses Aman
- QR untuk Admin & Data **tidak ditampilkan publik**.
- QR Selfie hanya muncul **jika customer menang**.

---

## 🔄 Sinkronisasi Data
Semua data disimpan di **Firebase**:
- `settings/level1` – `level4`: Konfigurasi permainan
- `winners/`: Data pemenang, termasuk selfie

Data tersimpan cloud dan bisa diakses dari semua device.

---

## 📌 Catatan Penting
- Aplikasi ini tidak menggunakan backend pribadi.
- Bisa dijalankan 100% online di LG Standby ME setelah halaman dimuat.
- Fitur selfie tidak berjalan di LG (kamera tidak didukung), gunakan HP .

---

## 🙌 Developer

Copyright © 2025 Kustomisasi Kreasi Kreatif Multimedia and design Agency. **(KKK Multimedia & Design)**
> Dibuat secara profesional dengan integrasi Firebase dan desain responsif. 

