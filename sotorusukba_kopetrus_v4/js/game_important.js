document.addEventListener("DOMContentLoaded", () => {
    // Hide loader when fully loaded
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";

    // Reset background & content height
    const bg = document.querySelector(".background");
    const content = document.querySelector(".content");
    if (bg) bg.style.height = "100vh";           // <- pakai 100vh
    if (content) content.style.height = "100vh"; // <- pakai 100vh

    // Scroll to top (pakai 3 cara)
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // Exit fullscreen if any
    if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
            console.warn("Tidak bisa keluar dari fullscreen:", err);
        });
    }

    // Center object if exists
    const obj = document.getElementById("object");
    if (obj) {
        const posX = (window.innerWidth - 100) / 2;
        obj.style.left = posX + "px";
    }

    function setActualViewportHeight() {
      const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setActualViewportHeight();
    window.addEventListener('resize', setActualViewportHeight);
    });

    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registered!', reg))
        .catch(err => console.log('Service Worker failed:', err));
    }
