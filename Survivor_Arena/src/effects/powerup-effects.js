// =============================================
//  powerup-effects.js — Daftar & efek power-up
// =============================================
// Mengatur item bonus yang bisa diambil player: apa saja jenisnya, warnanya,
// dan apa efeknya saat diambil.

// Semua jenis power-up yang bisa muncul (dipilih acak saat memunculkannya).
export const POWERUP_TYPES = ['life', 'damage', 'speed', 'shotgun', 'rapid'];

// Warna & tulisan tiap jenis — dipakai buat gambar item, peta kecil, dan HUD.
export const POWERUP_META = {
  life: { color: '#FF5470', label: '+Nyawa' },
  damage: { color: '#FF6F59', label: 'Damage+' },
  speed: { color: '#FFC857', label: 'Cepat!' },
  shotgun: { color: '#FF2A2A', label: 'Shotgun!' },
  rapid: { color: '#FF8C00', label: 'Mesin!' }, // <--- WARNA ORANYE MENYALA
};

// Lama tiap efek bertahan (dalam detik). Satu-satunya sumber angka ini —
// player.js memakainya untuk menghitung efek, hud.js untuk menggambar bar sisa
// waktu. Jangan disalin ke tempat lain: dua angka yang bisa berbeda diam-diam
// adalah cara paling gampang membuat HUD berbohong.
export const BUFF_SECONDS = {
  damage: 8,
  speed: 6,
  shotgun: 10,
  rapid: 5,
};

// Besar bonus efek sementara (dipakai player.js).
export const DAMAGE_BUFF_BONUS = 5;   // damage per peluru
export const SPEED_BUFF_BONUS = 40;   // px/detik

/**
 * Jalankan efek power-up saat player mengambilnya:
 *   - life   : tambah 1 nyawa (tidak melebihi batas maksimal)
 *   - damage : peluru lebih sakit selama beberapa detik
 *   - speed  : lari lebih cepat selama beberapa detik
 *   - shotgun: tembakan menyebar selama beberapa detik
 *   - rapid  : menembak sangat cepat selama beberapa detik
 *
 * Kecuali 'life' yang langsung permanen, semua efek cuma mencatat "berlaku
 * sampai detik ke berapa" memakai waktu game. Efeknya sendiri dihitung ulang
 * dari catatan itu tiap frame di player.js — tidak ada yang perlu dibatalkan
 * belakangan.
 *
 * PR #2: Bug Medium/#16 — fungsi ini sekarang pure untuk state game.
 * Buffalo player di dalam switch-case (sudah tepat), tapi perubahan ke
 * game.lives dikembalikan sebagai delta dan diterapkan caller (game.js).
 */
export function applyPowerUp(type, player, elapsedTime) {
  switch (type) {
    case 'life':
      // Kembalikan delta; biarkan caller (game.js) yang mutasi game.lives.
      return { livesDelta: 1 };
    case 'damage':
      player.damageBuffUntil = elapsedTime + BUFF_SECONDS.damage;
      break;
    case 'speed':
      player.speedBuffUntil = elapsedTime + BUFF_SECONDS.speed;
      break;
    case 'shotgun':
      player.shotgunBuffUntil = elapsedTime + BUFF_SECONDS.shotgun;
      break;
    case 'rapid':
      player.rapidBuffUntil = elapsedTime + BUFF_SECONDS.rapid;
      break;
  }
  return { livesDelta: 0 };
}