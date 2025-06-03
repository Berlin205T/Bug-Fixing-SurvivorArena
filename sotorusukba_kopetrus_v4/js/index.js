function startGame(level) {
    sessionStorage.setItem('audioAllowed', 'true');
    document.body.classList.remove("fade-in");
    document.body.classList.add("fade-out");
    setTimeout(() => {
        window.location.href = `select-reward.html?level=${level}`; // FIXED
    }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
    // Menyembunyikan loader setelah halaman sepenuhnya dimuat
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";

    // Resetting background dan content height agar selalu sesuai layar
    const bg = document.querySelector(".background");
    const content = document.querySelector(".content");
    if (bg) bg.style.height = "100vh";           
    if (content) content.style.height = "100vh"; 

    // Scroll ke atas (menggunakan beberapa cara untuk memastikan)
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // Keluar dari mode fullscreen jika sedang aktif
    if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
            console.warn("Tidak bisa keluar dari fullscreen:", err);
        });
    }

    // Menyusun ulang objek jika ada
    const obj = document.getElementById("object");
    if (obj) {
        const posX = (window.innerWidth - 100) / 2; // Menyusun objek di tengah layar
        obj.style.left = posX + "px";
    }
});

// Pendaftaran service worker untuk caching
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registered!', reg))
        .catch(err => console.log('Service Worker failed:', err));
}
