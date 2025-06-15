let inputDir = { x: 0, y: 0 };
const foodSound = new Audio('food.mp3');
const gameOverSound = new Audio('gameover.mp3');
const moveSound = new Audio('move.mp3');
const musicSound = new Audio('music.mp3');
let score = 0; 
let speed = 5;
let lastPaintTime = 0;
let bestscoreval = 0;  
let level = 0;  
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
    for (let i = 1; i < snakeArr.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }
    if (snake[0].x >= 18 || snake[0].x <= 0 || snake[0].y >= 18 || snake[0].y <= 0) {
        return true;
    }
}

function gameEngine() {
    if (isCollide(snakeArr)) {
        gameOverSound.play();
        musicSound.pause();
        inputDir = { x: 0, y: 0 };
        alert("Game over! Tekan tombol apapun untuk bermain lagi.");
        snakeArr = [{ x: 13, y: 15 }];
        musicSound.play();
        score = 0;
        level = 0;
        speed = 5;
        document.getElementById("level").innerHTML = "Level: " + level;
        document.getElementById("scoreupdate").innerHTML = "Score: " + score;
    }

    if (snakeArr[0].y === food.y && snakeArr[0].x === food.x) {
        foodSound.play();
        score += 10;

        if (score > 0 && score % 50 === 0) { 
            level += 1;
            speed += 1;
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

        if (score > bestscoreval) {
            bestscoreval = score;
            localStorage.setItem("bestscore", JSON.stringify(bestscoreval));
            document.getElementById("bestscorebox").innerHTML = "Best Score: " + bestscoreval;
        }

        document.getElementById("scoreupdate").innerHTML = "Score: " + score;
        snakeArr.unshift({ x: snakeArr[0].x + inputDir.x, y: snakeArr[0].y + inputDir.y });

        let a = 2;
        let b = 16;
        food = { x: Math.round(a + (b - a) * Math.random()), y: Math.round(a + (b - a) * Math.random()) };
    }

    for (let i = snakeArr.length - 2; i >= 0; i--) {
        snakeArr[i + 1] = { ...snakeArr[i] };
    }

    snakeArr[0].x += inputDir.x;
    snakeArr[0].y += inputDir.y;

    board.innerHTML = "";
    snakeArr.forEach((e, index) => {
        let snakeElement;
        
        if (index == 0) {
            snakeElement = document.createElement('img');
            snakeElement.src = 'img/snake_head.png'; // Ganti dengan jalur gambar kepala ular
            snakeElement.classList.add('head');
             
           
        } else {
            snakeElement = document.createElement('div');
            snakeElement.classList.add('snake');
            
        }
    
        // Tentukan arah tubuh mengikuti kepala
        if (inputDir.x === 1) {
            snakeElement.style.transform = 'rotate(90deg)'; // Arah kanan
        } else if (inputDir.x === -1) {
            snakeElement.style.transform = 'rotate(-90deg)'; // Arah kiri
        } else if (inputDir.y === -1) {
            snakeElement.style.transform = 'rotate(0deg)'; // Arah atas
        } else if (inputDir.y === 1) {
            snakeElement.style.transform = 'rotate(180deg)'; // Arah bawah
        }
    

        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;
        board.appendChild(snakeElement);
    });

    let foodElement = document.createElement('img');
    foodElement.src = 'img/apple.png'; 
    foodElement.style.gridRowStart = food.y;
    foodElement.style.gridColumnStart = food.x;
    foodElement.classList.add('food');
    foodElement.style.width = '30px';
    foodElement.style.height = '30px';
    board.appendChild(foodElement);
}

moveSound.play();
window.requestAnimationFrame(main);
window.addEventListener('keydown', e => {
    inputDir = { x: 0, y: 1 };
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

bestscore = localStorage.getItem('bestscore');
if (bestscore === null) {
    bestscoreval = 0;
    localStorage.setItem("bestscore", JSON.stringify(bestscoreval));
} else {
    bestscoreval = JSON.parse(bestscore);
    document.getElementById("bestscorebox").innerHTML = "Best Score: " + bestscore;
}
