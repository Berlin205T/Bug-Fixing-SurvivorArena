const CACHE_NAME = 'Rusuk Ba Ko Petrus - Game Cache v1.0.0'; // Ganti dengan nama cache yang sesuai
const urlsToCache = [
// CSS
  'css/admin-style.css',  
  'css/css/bootstrap-datetimepicker.min.css',
  'css/font-face.css',
  'css/style.css',
  'css/theme.css',

  // HTML
  'camera.html',
  'dashboard.html',
  'game.html',
  'index.html',
  'login.html',
  'offline.html',
  'select-reward.html',

  // JS
  'js/game.js',
  'js/admin.js',
  'js/bootstrap-datetimepicker.js',
  'js/camera.js',
  'js/data.js',
  'js/firebase.js',
  'js/game.js',
  'js/howler.core.min.js',
  'js/main copy.js',
  'js/main.js',
  'js/index.js',
  'js/moment.js',
  'js/login.js',
  'js/game_important.js',
  'js/select-reward.js',
  'manifest.json',

  // FONT
  'assets/font/MANGOLD.ttf',
  'assets/font/Wonder\ Boys\ -\ Personal\ Use.ttf',
  'assets/font/JungleAdventurer.otf',

  'vendor',


  


  // GAMBAR
  'assets/imagesbackground-lanscape.jpg',
  'assets/images/background-potrait.jpg',
  'assets/images/fotoo.png',
  'assets/images/frame.png',
  'assets/images/ic_camera_front_white_36px.svg',
  'assets/images/ic_camera_rear_white_36px.svg',
  'assets/images/ic_fullscreen_exit_white_48px.svg',
  'assets/images/ic_fullscreen_white_48px.svg',
  'assets/images/ic_photo_camera_white_48px.svg',
  'assets/images/logo.png',
  'assets/images/target-area1.png',
  'assets/images/winner.png',
  'assets/images/target-area3.png',

  // SOUNDS
  'assets/sounds/bgm.mp3',
  'assets/sounds/win.mp3',
  'assets/sounds/lose.mp3',
  'assets/sounds/countdown.mp3',
  'assets/sounds/tap.mp3'
  
];

// Install: cache semua resource
self.addEventListener('install', event => {
  self.skipWaiting(); // aktifkan langsung
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        console.log('Mulai caching semua file game...');
        await Promise.all(
          urlsToCache.map(url =>
            fetch(url)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Gagal fetch ${url}`);
                }
                return cache.put(url, response.clone());
              })
              .catch(err => {
                console.warn('❌ Gagal cache:', url, err);
              })
          )
        );
        console.log('✅ Semua file selesai dicoba cache.');
      })
  );
});
// Fetch: ambil dari cache, fallback ke offline.html jika gagal
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request).catch(() => caches.match('offline.html')))
  );
});

// Activate: bersihkan cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim(); // ambil alih kontrol
});
