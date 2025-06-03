function handleLogin() {
    const inputPassword = document.getElementById("adminPassword").value;
    const errorMsg = document.getElementById("errorMsg");
    
    if (!inputPassword) {
        errorMsg.textContent = "Harap masukkan password";
        return;
    }
    
    // Simulasi login sederhana (ganti dengan Firebase di production)
    if (inputPassword === "admin123") {
        window.location.href = "dashboard.html";
    } else {
        errorMsg.textContent = "Password salah. Coba lagi.";
    }
}

// Handle enter key
document.getElementById("adminPassword").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        handleLogin();
    }
});