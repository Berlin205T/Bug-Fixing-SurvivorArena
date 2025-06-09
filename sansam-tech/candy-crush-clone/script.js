const boardSize = 8;
const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
let score = 0;
const tiles = [];
let currentLevel = 1; // Level awal
const levelTargetScores = [150, 200, 300, 400, 500, 600, 700, 900, 1000, 2500]; // Skor target untuk masing-masing level
let username = "";
let scores = JSON.parse(localStorage.getItem('scores')) || [];


function startGame() {
    username = document.getElementById('username-input').value;
    if (!username) {
        alert("Masukkan nama untuk memulai permainan!");
        return;
    }
    document.getElementById('start-screen').classList.add('hidden');
    // document.getElementById('game-container').classList.remove('hidden');
    initBoard();
}

function endGame() {
    // Simpan skor ke dalam array scores
    scores.push({ name: username, score: score });
    localStorage.setItem('scores', JSON.stringify(scores));

    // Reset permainan untuk user berikutnya
    resetGame();
    showHighScores();
}

function resetGame() {
    score = 0;
    currentLevel = 1;
    location.reload();
}

function showHighScores() {
    const highScoresList = document.getElementById('high-scores');
    highScoresList.innerHTML = ''; // Hapus daftar sebelumnya

    // Tampilkan skor tertinggi
    scores.sort((a, b) => b.score - a.score);
    scores.slice(0, 10).forEach(score => {
        const li = document.createElement('li');
        li.textContent = `${score.name}: ${score.score}`;
        highScoresList.appendChild(li);
    });
}

// Gambar untuk tile berdasarkan level
const levelImages = [
    ['images/candy1.png', 'images/candy2.png', 'images/candy3.png', 'images/candy4.png', 'images/candy5.png'], // Level 1 (5 gambar)
    ['images/candy1.png', 'images/candy2.png', 'images/candy3.png', 'images/candy4.png', 'images/candy5.png', 'images/candy6.png'], // Level 2 (6 gambar)
    ['images/candy1.png', 'images/candy2.png', 'images/candy3.png', 'images/candy4.png', 'images/candy5.png', 'images/candy6.png', 'images/candy7.png'], // Level 3 (7 gambar)
    ['images/candy1.png', 'images/candy2.png', 'images/candy3.png', 'images/candy4.png', 'images/candy5.png', 'images/candy6.png', 'images/candy7.png', 'images/candy8.png'], // Level 4 (8 gambar)
    ['images/candy1.png', 'images/candy2.png', 'images/candy3.png', 'images/candy4.png', 'images/candy5.png', 'images/candy6.png', 'images/candy7.png', 'images/candy8.png', 'images/candy9.png'], // Level 5 (9 gambar)
    ['images/candy1.png', 'images/candy2.png', 'images/candy3.png', 'images/candy4.png', 'images/candy5.png', 'images/candy6.png', 'images/candy7.png', 'images/candy8.png', 'images/candy9.png', 'images/candy10.png'], // Level 6  (10 gambar)
    ['images/candy1.png', 'images/candy2.png', 'images/candy3.png', 'images/candy4.png', 'images/candy5.png', 'images/candy6.png', 'images/candy7.png', 'images/candy8.png', 'images/candy9.png', 'images/candy10.png'], // Level 7  (10 gambar)
    ['images/candy1.png', 'images/candy2.png', 'images/candy3.png', 'images/candy4.png', 'images/candy5.png', 'images/candy6.png', 'images/candy7.png', 'images/candy8.png', 'images/candy9.png', 'images/candy10.png'], // Level 8  (10 gambar)
    ['images/candy1.png', 'images/candy2.png', 'images/candy3.png', 'images/candy4.png', 'images/candy5.png', 'images/candy6.png', 'images/candy7.png', 'images/candy8.png', 'images/candy9.png', 'images/candy10.png','images/candy11.png'], // Level 9 (11 gambar)
    ['images/candy1.png', 'images/candy2.png', 'images/candy3.png', 'images/candy4.png', 'images/candy5.png', 'images/candy6.png', 'images/candy7.png', 'images/candy8.png', 'images/candy9.png', 'images/candy10.png','images/candy11.png','images/candy12.png'] // Level 10  (12 gambar)
];

// Tambahkan elemen audio
const matchSound = document.getElementById('match-sound');
const levelUpSound = document.getElementById('level-up-sound'); // Suara naik level
const backgroundMusic = document.getElementById('background-music'); // Backsound

// Fungsi untuk memulai musik latar belakang
function startBackgroundMusic() {
    backgroundMusic.play(); // Memutar musik latar
    backgroundMusic.volume = 0.2; // Atur volume (0.0 hingga 1.0)
}
function stopBackgroundMusic() {
    backgroundMusic.pause(); // Hentikan musik
    backgroundMusic.currentTime = 0; // Reset waktu musik ke awal
}


// Fungsi untuk menginisialisasi board sesuai level
function initBoard() {
    gameBoard.innerHTML = ''; // Hapus semua tile
    tiles.length = 0; // Kosongkan array tiles

    const images = levelImages[currentLevel - 1]; // Dapatkan gambar sesuai level

    for (let i = 0; i < boardSize * boardSize; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.backgroundImage = `url(${images[Math.floor(Math.random() * images.length)]})`;
        tile.style.backgroundSize = 'cover'; // Pastikan gambar menutupi area
        tile.dataset.id = i;
        tile.setAttribute('draggable', true); // Menambahkan atribut draggable
        tile.addEventListener('dragstart', dragStart);
        tile.addEventListener('dragover', dragOver);
        tile.addEventListener('drop', drop);
        tile.addEventListener('dragend', dragEnd);
        gameBoard.appendChild(tile);
        tiles.push(tile);
    }
    checkForMatches();
    tile.addEventListener('touchstart', touchStart);
    tile.addEventListener('touchend', touchEnd);
}

function touchStart(e) {
    // Logika untuk memulai sentuhan
    draggedTile = e.target;
    e.target.classList.add('dragging');
}

function touchEnd(e) {
    // Logika untuk mengakhiri sentuhan
    targetTile = e.target;
    if (draggedTile !== targetTile) {
        swapTiles(draggedTile, targetTile);
        setTimeout(() => checkForMatches(), 200); // Tunggu sedikit sebelum memeriksa pencocokan
    }
}

let draggedTile = null;
let targetTile = null;

// Event Listener untuk drag start
function dragStart(e) {
    draggedTile = e.target;
    e.target.classList.add('dragging');
}

// Event Listener untuk drag over
function dragOver(e) {
    e.preventDefault();
}

// Event Listener untuk drop
function drop(e) {
    e.preventDefault();
    targetTile = e.target;
    if (draggedTile !== targetTile) {
        swapTiles(draggedTile, targetTile);
        setTimeout(() => checkForMatches(), 200); // Tunggu sedikit sebelum memeriksa pencocokan
    }
}

// Event Listener untuk drag end
function dragEnd(e) {
    e.target.classList.remove('dragging');
}

// Fungsi untuk menukar tile
function swapTiles(tile1, tile2) {
    let tempImage = tile1.style.backgroundImage;
    tile1.style.backgroundImage = tile2.style.backgroundImage;
    tile2.style.backgroundImage = tempImage;
}

// Fungsi untuk memeriksa pencocokan
function checkForMatches() {
    let matchFound = false;

    // Cek baris
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize - 2; col++) {
            let index = row * boardSize + col;
            let matchLength = 1;
            let image = tiles[index].style.backgroundImage;

            // Deteksi rentetan blok dengan gambar yang sama
            for (let i = 1; i < 5; i++) {
                if (col + i < boardSize && tiles[index + i].style.backgroundImage === image) {
                    matchLength++;
                } else {
                    break;
                }
            }

            // Jika ditemukan pencocokan minimal 3 blok
            if (matchLength >= 3) {
                matchFound = true;
                for (let i = 0; i < matchLength; i++) {
                    removeTile(index + i);
                }
                // Tambahkan skor sesuai dengan panjang rantai
                addScore(getScoreForMatch(matchLength));
                // Putar suara
                matchSound.play();
            }

            // Loncat indeks untuk menghindari pemeriksaan berulang
            col += matchLength - 1;
        }
    }

    // Cek kolom
    for (let col = 0; col < boardSize; col++) {
        for (let row = 0; row < boardSize - 2; row++) {
            let index = row * boardSize + col;
            let matchLength = 1;
            let image = tiles[index].style.backgroundImage;

            // Deteksi rentetan blok dengan gambar yang sama
            for (let i = 1; i < 5; i++) {
                if (row + i < boardSize && tiles[index + i * boardSize].style.backgroundImage === image) {
                    matchLength++;
                } else {
                    break;
                }
            }

            // Jika ditemukan pencocokan minimal 3 blok
            if (matchLength >= 3) {
                matchFound = true;
                for (let i = 0; i < matchLength; i++) {
                    removeTile(index + i * boardSize);
                }
                // Tambahkan skor sesuai dengan panjang rantai
                addScore(getScoreForMatch(matchLength));
                // Putar suara
                matchSound.play();
            }

            // Loncat indeks untuk menghindari pemeriksaan berulang
            row += matchLength - 1;
        }
    }

    if (matchFound) {
        setTimeout(() => {
            fillEmptyTiles();
            setTimeout(checkForMatches, 500); // Cek lagi setelah pengisian ulang
        }, 500); // Beri waktu untuk animasi menghilang
    }

    // Cek apakah skor cukup untuk naik level
    checkLevelUp();
}

// Fungsi untuk menghitung poin berdasarkan panjang rantai pencocokan
function getScoreForMatch(matchLength) {
    switch (matchLength) {
        case 3:
            return 100;
        case 4:
            return 200;
        case 5:
            return 300;
        default:
            return 0;
    }
}

// Fungsi untuk menghapus tile (mengosongkan gambarnya)
function removeTile(index) {
    tiles[index].style.backgroundImage = ''; // Menghapus gambar
}

// Fungsi untuk mengisi ulang tile yang kosong
function fillEmptyTiles() {
    for (let col = 0; col < boardSize; col++) {
        for (let row = boardSize - 1; row >= 0; row--) {
            let index = row * boardSize + col;
            if (tiles[index].style.backgroundImage === '') {
                // Cari tile di atasnya yang memiliki gambar
                let aboveIndex = index - boardSize;
                while (aboveIndex >= 0 && tiles[aboveIndex].style.backgroundImage === '') {
                    aboveIndex -= boardSize;
                }

                if (aboveIndex >= 0) {
                    // Tukar gambar dengan tile di atasnya
                    tiles[index].style.backgroundImage = tiles[aboveIndex].style.backgroundImage;
                    tiles[aboveIndex].style.backgroundImage = '';

                    // Tambahkan animasi jatuh
                    tiles[index].style.transform = 'translateY(-50px)';
                    tiles[index].style.transition = 'transform 0.3s ease-in-out'; // Efek transisi
                    setTimeout(() => {
                        tiles[index].style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    // Jika tidak ada yang di atas, buat tile baru
                    tiles[index].style.backgroundImage = `url(${levelImages[currentLevel - 1][Math.floor(Math.random() * levelImages[currentLevel - 1].length)]})`;
                    tiles[index].style.transform = 'translateY(-50px)';
                    tiles[index].style.transition = 'transform 0.3s ease-in-out'; // Efek transisi
                    setTimeout(() => {
                        tiles[index].style.transform = 'translateY(0)';
                    }, 50);
                }
            }
        }
    }
}

// Fungsi untuk menambahkan skor
function addScore(points) {
    score += points;
    scoreDisplay.textContent = score;
}

function showLevelUpNotification() {
    const notification = document.getElementById('level-up-notification');
    const currentLevelDisplay = document.getElementById('current-level');
    
    currentLevelDisplay.textContent = currentLevel;
    notification.classList.remove('hidden');

    // Hide notification after a few seconds
    setTimeout(() => {
        closeLevelUpNotification();
    }, 5000); // Adjust duration as needed
}
function closeLevelUpNotification() {
    const notification = document.getElementById('level-up-notification');
    notification.classList.add('hidden');
}

// Fungsi untuk memeriksa apakah pemain dapat naik level
function checkLevelUp() {
    if (score >= levelTargetScores[currentLevel - 1]) {
        levelUpSound.play();
        showLevelUpNotification();
        currentLevel++;
        if (currentLevel > 10) {
            endGame(); // Panggil endGame saat game selesai
            return;
        }
        scoreDisplay.textContent = score;
        initBoard();
    }
}


// Inisialisasi permainan
// window.onload = function() {
//     startBackgroundMusic(); // Mulai musik latar
//     initBoard(); // Inisialisasi board
// };

// Inisialisasi permainan
window.onload = function() {
    startBackgroundMusic();
    // document.getElementById('game-container').classList.add('hidden');
    showHighScores(); // Tampilkan skor tertinggi pada saat halaman dimuat
};