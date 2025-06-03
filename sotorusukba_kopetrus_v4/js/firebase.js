// Inisialisasi Firebase via CDN (compat) dan expose window.db + window.firebaseReady
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Gagal load ${src}`));
    document.head.appendChild(s);
  });
}

// Memuat Firebase script
Promise.all([ 
  loadScript("https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"),
  loadScript("https://www.gstatic.com/firebasejs/9.22.2/firebase-storage-compat.js"),
  loadScript("https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js")
])
.then(() => {
  // Konfigurasi Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyBcu0rGrmBITM9fJUWlpG5Sd8S_uhPgl3M",
    authDomain: "rusukbakopetrus.firebaseapp.com",
    projectId: "rusukbakopetrus",
    storageBucket: "rusukbakopetrus.firebasestorage.app",
    messagingSenderId: "616900062598",
    appId: "1:616900062598:web:c57da9b5b4986317afd007",
    databaseURL: "https://rusukbakopetrus-default-rtdb.asia-southeast1.firebasedatabase.app"
  };

  // Inisialisasi Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase connected");
  } else {
    console.warn("⚠️ Firebase sudah terinisialisasi");
  }

  // Atur firebaseReady setelah Firebase berhasil terinisialisasi
  window.firebaseReady = new Promise((resolve, reject) => {
    try {
      const db = firebase.database();
      window.db = db; // Tetap expose untuk debug/manual
      resolve(db);    // Resolve promise dengan database Firebase
    } catch (err) {
      reject(new Error("❌ Gagal menginisialisasi Firebase Database."));
    }
  });
})
.catch(err => {
  console.error("❌ Firebase gagal dimuat:", err);
  alert("❌ Gagal memuat Firebase. Cek koneksi atau URL skrip.");
});
