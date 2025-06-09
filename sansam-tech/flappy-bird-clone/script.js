function drawBoundingBox(bounds, color = 'red') {
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.left = bounds.left + 'px';
    box.style.top = bounds.top + 'px';
    box.style.width = bounds.width + 'px';
    box.style.height = bounds.height + 'px';
    box.style.border = '2px solid ' + color;
    box.style.zIndex = 10000; // Make sure it stays on top
    box.style.pointerEvents = 'none'; // So it doesn't interfere with clicks
    box.classList.add('debug-box');
    document.body.appendChild(box);
}

function clearDebugBoxes() {
    document.querySelectorAll('.debug-box').forEach(box => box.remove());
}

let lastFrameTime = 0;
const fps = 30; // to save power on mobile phones and not overheat the CPU
const frameDuration = 1000 / fps;

let move_speed = 9;
let gravity = 4;
let bird_dy = 0;
let jump_height = 25;
let pipeVerticalGap = 35;
let birdBoundsShrink = 0.5;
let game_state = 'Start';

let bird = document.querySelector('.bird');
let birdImg = document.getElementById('bird-1');
let sound_point = new Audio('sounds effect/point.mp3');
let sound_die = new Audio('sounds effect/die.mp3');

let birdBounds = bird.getBoundingClientRect();

let background = document.querySelector('.background');
let backgroundBounds = background.getBoundingClientRect();

let score_val = document.querySelector('.score_val');
let message = document.querySelector('.message');
let score_title = document.querySelector('.score_title');

birdImg.style.display = 'none';
message.classList.add('messageStyle');

function move() {
    if (game_state != 'Play') return;

    let pipe_sprite = document.querySelectorAll('.pipe_sprite');

    pipe_sprite.forEach(e => {
        let pipeBounds = e.getBoundingClientRect();
        birdBounds = bird.getBoundingClientRect();

        //center the origin to the center of the bird sprite
        birdBounds.x = birdBounds.x + (birdBounds.width * 0.5);
        birdBounds.y = birdBounds.y + (birdBounds.height * 0.5);

        //shrink the bird bounds to give leeway to players,
        //this makes it so that the bird isn't as sensitive
        //to near-misses with the pipes
        birdBounds.height *= birdBoundsShrink;
        birdBounds.width *= birdBoundsShrink;

        //the bounds is now extending from the very center of the sprite
        //towards bottom right, to make sure that the center of the bounds
        //is also at the center of the bird sprite, we subtract it's current
        //xy position with half of it's size, this should shift the bounds
        //by half its size towards top left, centering its center to the
        //center of the bird sprite
        birdBounds.x = birdBounds.x - (birdBounds.width * 0.5);
        birdBounds.y = birdBounds.y - (birdBounds.height * 0.5);

        // console.log(birdBounds)
        drawBoundingBox(birdBounds, 'red')

        if (pipeBounds.right <= 0) {
            e.remove();
        } else {
            if (birdBounds.left < pipeBounds.left + pipeBounds.width &&
                birdBounds.left + birdBounds.width > pipeBounds.left &&
                birdBounds.top < pipeBounds.top + pipeBounds.height &&
                birdBounds.top + birdBounds.height > pipeBounds.top) {

                game_state = 'End';
                message.innerHTML = 'Kalah'.fontcolor('red') + '<br>Enter Untuk Mulai Lagi';
                message.classList.add('messageStyle');
                birdImg.style.display = 'none';
                sound_die.play();
                return;
            } else {
                if (pipeBounds.right < birdBounds.left &&
                    pipeBounds.right + move_speed >= birdBounds.left &&
                    e.increase_score == '1') {

                    score_val.innerHTML = + score_val.innerHTML + 1;
                    sound_point.play();
                }

                e.style.left = pipeBounds.left - move_speed + 'px';
            }
        }
    });
}

function apply_gravity() {
    if (game_state != 'Play') return;
    birdBounds = bird.getBoundingClientRect();
    bird_dy = bird_dy + gravity;

    if (birdBounds.top <= 0 || birdBounds.bottom >= backgroundBounds.bottom) {
        game_state = 'End';
        message.classList.remove('messageStyle');
        return;
    }
    bird.style.top = birdBounds.top + bird_dy + 'px';
}

let lastPipeFrame = 0;
function create_pipe() {
    if (game_state != 'Play') return;

    if (lastPipeFrame > 35) {
        lastPipeFrame = 0;

        let yPos = Math.floor(Math.random() * 43) + 8;
        let pipeTop = document.createElement('div');
        pipeTop.className = 'pipe_sprite';
        pipeTop.style.top = yPos - 70 + 'vh';
        pipeTop.style.left = '100vw';

        let pipeBot = document.createElement('div');
        pipeBot.className = 'pipe_sprite';
        pipeBot.style.top = yPos + pipeVerticalGap + 'vh';
        pipeBot.style.left = '100vw';
        pipeBot.increase_score = '1';

        document.body.appendChild(pipeTop);
        document.body.appendChild(pipeBot);
    }

    lastPipeFrame++;
}

background.addEventListener('touchstart', e => {
    if (game_state !== 'Play') {
        document.querySelectorAll('.pipe_sprite')
            .forEach(e => e.remove());
        game_state = 'Play';
        bird_dy = 0;

        birdImg.style.display = 'block';
        bird.style.top = '40vh';
        message.innerHTML = '';
        score_title.innerHTML = 'Skor: ';
        score_val.innerHTML = '0';
        message.classList.remove('messageStyle');

        create_pipe();
        play();
    } else {
        birdImg.src = 'images/Bird-2.png';
        bird_dy = -jump_height;
    }
})

background.addEventListener('touchend', e => {
    if (game_state !== 'Play') {

    } else {
        birdImg.src = 'images/Bird.png'
    }
})

function play(timestamp) {
    if (!lastFrameTime || timestamp - lastFrameTime >= frameDuration) {
        lastFrameTime = timestamp;

        // clearDebugBoxes();

        apply_gravity();
        move();
        create_pipe();

        if (game_state !== 'Play')
            return;
    }

    requestAnimationFrame(play);
}
