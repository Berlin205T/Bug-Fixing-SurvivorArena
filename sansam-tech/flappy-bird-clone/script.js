// @ts-check

const MpPostMessage = /** @type {Window & { MpPostMessage?: (event: string, data: any) => void }} */
    (window).MpPostMessage;

MpPostMessage?.('gameState', { type: 'gameLaunch' });

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

let bird = /** @type {HTMLElement | null} */ (document.querySelector('.bird'));
let birdImg = /** @type {HTMLImageElement | null} */ (document.getElementById('bird-1'));
if (!bird || !birdImg) throw new Error('Can\'t find bird element in document!');
let birdBounds = bird.getBoundingClientRect();

let background = /** @type {HTMLElement | null} */ (document.querySelector('.background'));
if (!background) throw new Error('Can\'t find background element in document!');
let backgroundBounds = background.getBoundingClientRect();

let score_val = /** @type {HTMLElement | null} */ (document.querySelector('.score_val'));
let message = /** @type {HTMLElement | null} */ (document.querySelector('.message'));
let score_title = /** @type {HTMLElement | null} */ (document.querySelector('.score_title'));

let resultDialog = /** @type {HTMLElement | null} */ (document.querySelector('.popupContainer .result'));
if (!resultDialog) throw new Error('Can\'t find result dialog box element in document!');

let sound_point = new Audio('sounds effect/point.mp3');
let sound_die = new Audio('sounds effect/die.mp3');

birdImg.style.display = 'none';

if (message)
    message.classList.add('messageStyle');

// document.addEventListener('DOMContentLoaded', _ => {
//     setTimeout(() => {
//         showResultDialog(0)
//     }, 1000)
// })

function drawBoundingBox(bounds, color = 'red') {
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.left = bounds.left + 'px';
    box.style.top = bounds.top + 'px';
    box.style.width = bounds.width + 'px';
    box.style.height = bounds.height + 'px';
    box.style.border = '2px solid ' + color;
    box.style.zIndex = '10000'; // Make sure it stays on top
    box.style.pointerEvents = 'none'; // So it doesn't interfere with clicks
    box.classList.add('debug-box');
    document.body.appendChild(box);
}

function clearDebugBoxes() {
    document.querySelectorAll('.debug-box').forEach(box => box.remove());
}

function resetGameState() {
    document.querySelectorAll('.pipe_sprite')
        .forEach(e => e.remove());
    game_state = 'Play';
    bird_dy = 0;

    if (birdImg && bird) {
        birdImg.style.display = 'block';
        bird.style.top = '40vh';
    }
    if (message) {
        message.innerHTML = '';
        message.classList.remove('messageStyle');
    }
    if (score_title)
        score_title.innerHTML = 'Skor: ';
    if (score_val)
        score_val.innerHTML = '0';
}

/** @param {() => void} onHide */
function hideResultDialog(onHide) {
    if (!resultDialog)
        return void console.log('[hideResultDialog] Can\'t find resultDialog!');

    resultDialog.classList.remove('show');

    setTimeout(() => onHide(), 500);
}

/** @param {number} score */
function showResultDialog(score) {
    if (!resultDialog)
        return void console.log('[showResultDialog] Can\'t find resultDialog!');

    resultDialog.classList.add('show');

    const restartButton = document.querySelector('.result #actions #restart');
    const exitButton = document.querySelector('.result #actions #exit');
    const scoreText = document.querySelector('.result #content #finalScore');

    if (scoreText)
        scoreText.innerHTML = String(score);

    if (!restartButton || !exitButton)
        return void console.log('[showResultDialog] Can\'t find restart or exit button in result dialog!');

    let restartButtonPressed = false;
    let exitButtonPressed = false;

    restartButton.addEventListener('pointerup', _ => {
        if (restartButtonPressed) return;

        restartButtonPressed = true;
        hideResultDialog(() => {
            MpPostMessage?.('gameState', { type: 'gameRestart', score });
            resetGameState();
            create_pipe();
            play();
        })
    });

    exitButton.addEventListener('pointerup', _ => {
        if (exitButtonPressed) return;

        exitButtonPressed = true;
        hideResultDialog(() => {
            MpPostMessage?.('gameState', { type: 'gameEnded', score });
        })
    });
}

function move() {
    if (game_state != 'Play') return;

    let pipe_sprite = document.querySelectorAll('.pipe_sprite');

    pipe_sprite.forEach(element => {
        const e = /** @type {HTMLElement} */ (element);

        if (!bird || !birdImg)
            return void console.log("[move] Can't find bird element!");
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

        // console.log(birdBounds);
        // drawBoundingBox(birdBounds, 'red');

        if (pipeBounds.right <= 0) {
            e.remove();
        } else {
            if (birdBounds.left < pipeBounds.left + pipeBounds.width &&
                birdBounds.left + birdBounds.width > pipeBounds.left &&
                birdBounds.top < pipeBounds.top + pipeBounds.height &&
                birdBounds.top + birdBounds.height > pipeBounds.top) {

                game_state = 'End';
                // if (message) {
                //     message.innerHTML = 'Kalah'.fontcolor('red') + '<br>Enter Untuk Mulai Lagi';
                //     message.classList.add('messageStyle');
                // }
                showResultDialog(parseInt(score_val ? score_val.innerHTML : '0'));
                birdImg.style.display = 'none';
                sound_die.play();

                return;
            } else {
                if (pipeBounds.right < birdBounds.left &&
                    pipeBounds.right + move_speed >= birdBounds.left &&
                    /** @type {any} */ (e).increase_score == '1') {

                    if (!score_val)
                        return void console.log("[move] can't find score_val element!");

                    score_val.innerHTML = String(parseInt(score_val.innerHTML) + 1);
                    sound_point.play();
                }

                e.style.left = pipeBounds.left - move_speed + 'px';
            }
        }
    });
}

function apply_gravity() {
    if (game_state != 'Play') return;
    if (!bird) return void console.log("[apply_gravity] can't find bird element!");

    birdBounds = bird.getBoundingClientRect();
    bird_dy = bird_dy + gravity;

    if (birdBounds.top <= 0 || birdBounds.bottom >= backgroundBounds.bottom) {
        game_state = 'End';
        if (message) message.classList.remove('messageStyle');
        showResultDialog(parseInt(score_val ? score_val.innerHTML : '0'));
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
        /** @type {any} */ (pipeBot).increase_score = '1';

        document.body.appendChild(pipeTop);
        document.body.appendChild(pipeBot);
    }

    lastPipeFrame++;
}

background.addEventListener('pointerdown', e => {
    if (game_state !== 'Play') {
        if (resultDialog?.classList.contains('show'))
            return;

        resetGameState();
        create_pipe();
        play();
    } else {
        if (birdImg) birdImg.src = 'images/Bird-2.png';
        bird_dy = -jump_height;
    }
});

background.addEventListener('pointerup', e => {
    if (game_state !== 'Play') {

    } else {
        if (birdImg) birdImg.src = 'images/Bird.png';
    }
});

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