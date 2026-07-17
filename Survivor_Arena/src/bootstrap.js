// =============================================
//  bootstrap.js — Titik masuk halaman
// =============================================
// Satu-satunya file yang dipanggil <script> di index.html. Tugasnya cuma satu:
// menunggu JS Bridge WebView siap, baru memuat game.
//
// Kode game dimuat lewat import() dinamis, BUKAN import biasa di kepala file.
// Ini disengaja: import biasa selalu dijalankan lebih dulu sebelum baris mana
// pun di bawahnya, jadi game akan terlanjur mulai sebelum bridge tersedia dan
// sinyal `launch` bisa hilang.
// Sengaja memakai .then(), bukan `await` di tingkat atas file: top-level await
// butuh Chrome 89 / iOS 15 ke atas, dan di bawah itu file ini gagal dibaca sama
// sekali — layar hitam tanpa pesan.
//
// Syarat minimal game sekarang Chrome 80 / iOS 13.4, dibatasi optional chaining
// (`?.`) di MpBridge.js. Itu batas terendah yang bisa dicapai tanpa mengubah
// MpBridge, dan file itu memang tidak boleh diubah.
import { waitForBridge } from './MpBridge.js';

// Hasilnya false kalau bridge tak kunjung muncul sampai batas waktu (misal saat
// dibuka di browser biasa dengan IS_DEVELOPMENT_MODE = false). Game tetap
// dimuat supaya layar tidak kosong — sinyal ke host akan diabaikan dengan aman.
waitForBridge().then(() => import('./main.js'));
