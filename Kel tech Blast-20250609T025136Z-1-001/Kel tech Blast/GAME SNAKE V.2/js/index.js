let inputDir = { x: 0, y: 0 };
const foodSound = new Audio('food.mp3');
const gameOverSound = new Audio('gameover.mp3');
const moveSound = new Audio('move.mp3');
const musicSound = new Audio('music.mp3');
let score = 0; // Skor dimulai dari 0
let speed = 5;  // Kecepatan awal ular
let lastPaintTime = 0;
let bestscoreval = 0;  // Best score
let level = 0;  // Level dimulai dari 1
let snakeArr = [{ x: 13, y: 15 }];
let food = { x: 6, y: 7 };

const levelUpNotification = document.getElementById('level-up-notification');

// Fungsi utama game
function main(ctime) {
    window.requestAnimationFrame(main);
    if ((ctime - lastPaintTime) / 1000 < 1 / speed) {
        return;
    }
    lastPaintTime = ctime;
    gameEngine();
}

function isCollide(snake) {
    // jika ular menabrak tubuhnya sendiri
    for (let i = 1; i < snakeArr.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }
    // jika ular menabrak dinding
    if (snake[0].x >= 18 || snake[0].x <= 0 || snake[0].y >= 18 || snake[0].y <= 0) {
        return true;
    }
}


function gameEngine() {
    // Memperbarui array ular
    if (isCollide(snakeArr)) {
        gameOverSound.play();
        musicSound.pause();
        inputDir = { x: 0, y: 0 };
        alert("Game over! Tekan tombol apapun untuk bermain lagi.");
        snakeArr = [{ x: 13, y: 15 }];
        musicSound.play();
        score = 0;  // Reset skor ke 0
        level = 0;  // Reset level ke 1
        speed = 5;  // Reset kecepatan ke nilai awal
        document.getElementById("level").innerHTML = "Level: " + level;
        document.getElementById("scoreupdate").innerHTML = "Score: " + score;  // Tampilkan skor 0 di UI
    }

    // Jika ular memakan makanan, tambahkan skor dan buat makanan baru
    if (snakeArr[0].y === food.y && snakeArr[0].x === food.x) {
        foodSound.play();
        score += 10; // Tambah skor 10 setiap kali memakan makanan

        // Naik level setiap kelipatan 50
        if (score > 0 && score % 50 === 0) { 
            level += 1;
            speed += 1;  // Tambahkan kecepatan setiap kali naik level
            document.getElementById("level").innerHTML = "Level: " + level;

            levelUpNotification.style.display = "block"; 
            levelUpNotification.style.opacity = 1; 

            setTimeout(() => {
                levelUpNotification.style.opacity = 0; 
                setTimeout(() => {
                    levelUpNotification.style.display = "none"; 
                }, 500); 
            }, 1000); 
        }


        // Perbarui skor terbaik jika skor saat ini lebih tinggi
        if (score > bestscoreval) {
            bestscoreval = score;
            localStorage.setItem("bestscore", JSON.stringify(bestscoreval));
            document.getElementById("bestscorebox").innerHTML = "Best Score: " + bestscoreval;
        }

        document.getElementById("scoreupdate").innerHTML = "Score: " + score;  // Tampilkan skor yang benar
        snakeArr.unshift({ x: snakeArr[0].x + inputDir.x, y: snakeArr[0].y + inputDir.y });
        
        // Menghasilkan makanan baru di lokasi acak
        let a = 2;
        let b = 16;
        food = { x: Math.round(a + (b - a) * Math.random()), y: Math.round(a + (b - a) * Math.random()) };
    }

    // Menggerakkan ular
    for (let i = snakeArr.length - 2; i >= 0; i--) {
        snakeArr[i + 1] = { ...snakeArr[i] };
    }

    snakeArr[0].x += inputDir.x;
    snakeArr[0].y += inputDir.y;

    // Menampilkan ular dan makanan
    board.innerHTML = "";
    snakeArr.forEach((e, index) => {
        let snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;

        if (index == 0) {
            snakeElement.classList.add('head');
        } else {
            snakeElement.classList.add('snake');
        }
        board.appendChild(snakeElement);
    });

    // Menampilkan elemen makanan sebagai gambar
    let foodElement = document.createElement('img'); // Menggunakan elemen gambar
    foodElement.src = 'img/apple.png'; // Ganti dengan jalur gambar makanan Anda
    foodElement.style.gridRowStart = food.y;
    foodElement.style.gridColumnStart = food.x;
    foodElement.classList.add('food');
    foodElement.style.width = '30px'; // Ukuran gambar makanan
    foodElement.style.height = '30px'; // Ukuran gambar makanan
    board.appendChild(foodElement);
}

// Logika utama dimulai di sini
moveSound.play();
window.requestAnimationFrame(main);
window.addEventListener('keydown', e => {
    inputDir = { x: 0, y: 1 };  // Memulai permainan
    moveSound.play();
    switch (e.key) {
        case "ArrowUp":
            inputDir.x = 0;
            inputDir.y = -1;
            break;

        case "ArrowDown":
            inputDir.x = 0;
            inputDir.y = 1;
            break;

        case "ArrowLeft":
            inputDir.x = -1;
            inputDir.y = 0;
            break;

        case "ArrowRight":
            inputDir.x = 1;
            inputDir.y = 0;
            break;

        default:
            break;
    }
});

// Mengambil best score dari local storage
bestscore = localStorage.getItem('bestscore');
if (bestscore === null) {
    bestscoreval = 0;
    localStorage.setItem("bestscore", JSON.stringify(bestscoreval));
} else {
    bestscoreval = JSON.parse(bestscore);
    document.getElementById("bestscorebox").innerHTML = "Best Score: " + bestscore;
}
