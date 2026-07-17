# Survivor Arena

Survivor Arena adalah game arena bertahan hidup dengan sudut pandang dari atas (top-down). Kamu berperan sebagai satu karakter yang dikepung musuh dari segala arah, bertugas mengumpulkan poin sambil bertahan sampai waktu habis. Yang bikin seru: karaktermu menembak sendiri ke musuh terdekat, jadi kamu tinggal fokus bergerak, menghindar, dan mengatur posisi — cocok dimainkan santai di HP dengan satu jempol.

---

## Fitur Utama

- **Tembak otomatis** — karakter membidik musuh terdekat sendiri, pemain cukup fokus bergerak dan menghindar.
- **Joystick mengikuti jari** — kontrol gerak muncul persis di titik pertama jari menyentuh layar, jadi nyaman dipegang di posisi mana pun.
- **3 level dengan tingkat kesulitan naik** — musuh makin banyak dan makin kuat tiap level; level terakhir gelap dan pandangan terbatas seperti pakai senter.
- **3 jenis musuh berbeda** — melee (pengejar jarak dekat), exploder (peledak nekat), dan laser (penembak jarak jauh).
- **Beragam power-up** — tambah nyawa, tembakan lebih sakit, lari lebih cepat, tembakan menyebar (shotgun), dan tembakan super cepat.
- **Peta kecil (minimap)** — menampilkan posisi musuh, koin, dan power-up di sekitarmu.
- **Panduan bawaan** — tutorial "Cara Main" muncul otomatis di awal dan bisa dibuka lagi kapan saja.
- **Ringan & mandiri** — total sekitar 200 KB, tanpa library eksternal. Setelah termuat, game jalan penuh tanpa koneksi.
- **Tahan gagal** — kalau gambar, suara, atau penyimpanan browser tidak tersedia, game tetap jalan dengan tampilan/efek sederhana alih-alih macet.

---

## Cara Bermain

### Tujuan
Kumpulkan koin sampai memenuhi target poin di tiap level sebelum waktu habis. Selesaikan ketiga level untuk menang. Kalau nyawa habis atau waktu keburu nol, permainan berakhir.

### Kontrol (HP / layar sentuh)

| Aksi | Cara |
|---|---|
| Menggerakkan karakter | Sentuh lalu geser (drag) di sisi kiri layar — joystick muncul di titik sentuhmu |
| Menembak | Otomatis ke musuh terdekat, tidak perlu tombol |
| Membuka panduan "Cara Main" | Tap tombol **?** di pojok kanan bawah |
| Mulai / main lagi | Tap tombol **Mulai** (atau **Main lagi** setelah selesai) |
| Keluar dari game | Tap tombol **Keluar** di panel hasil (hanya muncul setelah permainan selesai) |


### Aturan yang perlu diketahui
- **Waktu habis = langsung kalah**, bukan sekadar kehilangan nyawa. Kejar target poin secepatnya.
- **Tiap naik level, waktu bertambah** (Level 1: 1 menit 30 detik, lalu +30 detik tiap level) — tapi musuh juga makin kuat.
- **Level terakhir gelap.** Kamu hanya bisa melihat area kecil di sekitar karakter, jadi lebih waspada.
- **Kumpulkan XP dengan mengalahkan musuh** untuk naik level dan menambah kekuatan tembakan. XP hanya dari musuh, bukan dari koin.
- **Power-up nyawa bersifat permanen** (menambah nyawa), sedangkan power-up lain (shotgun, tembak cepat, damage, kecepatan) hanya bertahan beberapa detik. Sisa waktunya tampil di HUD kiri atas.

### Musuh

| Jenis | Muncul sejak | Perilaku |
|---|---|---|
| **Melee** | Level 1 | Mengejar player, berhenti saat dekat lalu memukul. |
| **Laser** | Level 2 | Berhenti di kejauhan lalu menembakkan laser secara berkala. |
| **Exploder** | Level 3 | Lari dua kali lebih cepat, mendekat lalu **meledak**. Tidak bisa ditembak saat sudah ancang-ancang. |


### Kebutuhan perangkat

- **Android 8.0+ dengan Chrome/WebView 87+**, atau **iOS 14.5+**
- Ukuran unduhan: **sekitar 200 KB** (~100 KB saat dikirim terkompresi)
- Koneksi internet hanya untuk memuat pertama kali; setelah itu tidak butuh server



### Menjalankan dari source (untuk developer)

Proyek ini murni file statis — tidak ada `npm install`, tidak ada proses build. Cukup dilayani lewat server sederhana:

```bash
# Masuk ke folder proyek
cd Survivor-Arena

# Jalankan server statis (butuh Python)
python -m http.server 8000 --bind 0.0.0.0
```

Lalu buka `http://localhost:8000` di browser.

---
## Struktur Folder Project

```
Survivor-Arena/
├─ index.html            # Halaman utama + tampilan info & tutorial
├─ style.css             # Gaya tampilan: HUD, tombol, joystick, tutorial
└─ src/                  # Semua kode & aset game
   ├─ bootstrap.js       # Titik masuk: tunggu JS Bridge, baru muat game
   ├─ MpBridge.js        # Jembatan sinyal ke host WebView (jangan diubah)
   ├─ main.js            # Kontrol pemain & perulangan game
   ├─ game.js            # Pusat kendali: aturan, spawn, tembak, level
   ├─ tutorial.js        # Panduan interaktif "Cara Main"
   ├─ viewport.js        # Ukuran layar & kamera
   ├─ config.js          # Angka pengaturan umum
   ├─ quality.js         # Tingkat kualitas gambar
   ├─ objects/           # Semua benda di arena: player, musuh, peluru, item
   ├─ effects/           # Suara dan efek visual (percikan, teks melayang)
   ├─ ui/                # Info di layar (nyawa, skor, level, waktu)
   ├─ world/             # Latar: rumput, pohon, batu
   ├─ utils/             # Fungsi bantu & pemuat gambar
   └─ assets/
      └─ spritesheets/   # Gambar karakter & item
         ├─ player/
         ├─ enemy/       # melee/ · exploder/ · laser/
         ├─ coin/  heart/  orb/
         └─ tree/  rock/
```

Penjelasan folder utama:

- **`src/objects/`** — semua benda di arena: player, tiga jenis musuh, peluru, koin, dan power-up.
- **`src/effects/`** — pemanis: suara dan efek visual.
- **`src/ui/`** — tampilan angka & info di atas layar.
- **`src/world/`** — latar tempat bermain.
- **`src/utils/`** — kumpulan fungsi pembantu dan pengatur gambar yang dipakai banyak file.
- **`src/assets/spritesheets/`** — file gambar karakter dan item. Bersifat opsional: sebelum gambar dimuat, game menampilkan bentuk sederhana sebagai gantinya.

Tiga jenis musuh dinamai sesuai cara bertarungnya, bukan nomor:

- **melee** ([enemy-melee.js](src/objects/enemy-melee.js)) — mengejar lalu memukul dari jarak dekat.
- **exploder** ([enemy-exploder.js](src/objects/enemy-exploder.js)) — lari cepat lalu meledak (kamikaze).
- **laser** ([enemy-laser.js](src/objects/enemy-laser.js)) — berhenti di kejauhan lalu menembak.



Tidak ada library eksternal, tidak ada proses build, tidak ada `package.json`, dan tidak butuh server backend — seluruh game berjalan di sisi pemain.
