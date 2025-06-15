// @ts-check

/**
 * Represents the main game engine for the Match-3 game.
 * It encapsulates all game state, DOM elements, and logic.
 */
class Game {
    /**
     * Initializes the game by setting up constants, state, and querying DOM elements.
     */
    constructor() {
        // --- Configuration & Constants ---
        /** @type {number} The width of the game board in squares. */
        this.width = 8;
        /** @type {string[]} Array of image URLs for the candies. */
        this.colors = [
            'url(images/pig.png)',
            'url(images/cow.png)',
            'url(images/mouse.png)',
            'url(images/puppy.png)',
            'url(images/bumblebee.png)',
            'url(images/bear.png)'
        ];
        /** @type {object[]} Configuration for each level. */
        this.levels = [
            { movesAllowed: 40, candiesRequired: ['pig', 25] },
            { movesAllowed: 30, candiesRequired: ['cow', 20] },
            { movesAllowed: 30, candiesRequired: ['mouse', 30] }
        ];

        // --- DOM Elements ---
        /** @type {HTMLElement | null} The main game board container. */
        this.board = document.getElementById('board');
        /** @type {HTMLElement | null} The element displaying the current score/candies left. */
        this.candiesInfo = document.getElementById('candies');
        /** @type {HTMLElement | null} The element displaying the moves left. */
        this.movesInfo = document.getElementById('moves');
        /** @type {HTMLElement | null} The element displaying the current level. */
        this.levelInfo = document.getElementById('level');
        /** @type {HTMLElement | null} The image element for the required candy. */
        this.requiredCandyImage = document.getElementById('candy');
        /** @type {HTMLElement | null} The play button. */
        this.playButton = document.getElementById('button');
        /** @type {HTMLElement | null} */
        this.movesTitle = document.getElementById('moves-p');
        /** @type {HTMLElement | null} */
        this.levelTitle = document.getElementById('level-p');
        /** @type {HTMLElement | null} */
        this.candiesTimes = document.getElementById('candies-p');


        // --- Game State ---
        /** @type {HTMLDivElement[]} An array holding all the square div elements. */
        this.squares = [];
        /** @type {number} The current level index. */
        this.currentLevel = 0;
        /** @type {object | null} The configuration for the current level. */
        this.levelConfiguration = null;
        /** @type {number} The number of moves the player has left. */
        this.movesAvailable = 0;
        /** @type {number} The number of required candies left to collect. */
        this.candiesLeft = 0;
        /** @type {boolean} A flag to prevent player interaction during animations. */
        this.isBoardLocked = true;


        // --- Swipe Interaction State ---
        /** @type {boolean} Flag to indicate if a swipe is in progress. */
        this.isSwiping = false;
        /** @type {number | null} The ID of the square where the swipe began. */
        this.startSquareId = null;
        /** @type {number} The starting X coordinate of the swipe. */
        this.startX = 0;
        /** @type {number} The starting Y coordinate of the swipe. */
        this.startY = 0;
    }

    /**
     * Initializes the game, sets up the board and event listeners.
     * This is the main entry point to start the game logic.
     */
    init() {
        this.playButton?.addEventListener('click', () => this.play());
        this.setUpBoard();
    }

    // --- SETUP & INITIALIZATION ---

    /**
     * Creates the grid of squares for the game board.
     */
    setUpBoard() {
        if (!this.board) return;
        for (let i = 0; i < this.width * this.width; i++) {
            const square = document.createElement('div');
            square.className = 'square';
            // FIX: setAttribute's second argument must be a string.
            square.setAttribute('draggable', 'true');
            square.id = String(i);
            this.board.appendChild(square);
            this.squares.push(square);
        }
    }

    /**
     * Starts the game or a new level.
     */
    play() {
        new Audio('sound-effects/start.mp3').play();
        this.isBoardLocked = false;
        this.currentLevel = 0;
        this.setLevel();
        // The game loop is now event-driven, starting after the first move.
    }

    /**
     * Checks if the current board state has any matches of three.
     * This is a read-only check and does not modify the board.
     * @returns {boolean} True if a match exists, false otherwise.
     */
    hasInitialMatches() {
        // Check for horizontal matches
        for (let i = 0; i < this.width * this.width; i++) {
            const color = this.squares[i].style.backgroundImage;
            if (!color) continue; // Skip empty squares if any

            // Check for row of three
            if (i % this.width <= this.width - 3) {
                if (this.squares[i + 1].style.backgroundImage === color && this.squares[i + 2].style.backgroundImage === color) {
                    return true; // Found a horizontal match
                }
            }
            // Check for column of three
            if (i < this.width * (this.width - 2)) {
                if (this.squares[i + this.width].style.backgroundImage === color && this.squares[i + this.width * 2].style.backgroundImage === color) {
                    return true; // Found a vertical match
                }
            }
        }
        return false; // No matches found
    }

    /**
     * Configures the board and UI for the current level.
     * Ensures the generated board has no initial matches.
     */
    setLevel() {
        this.levelConfiguration = this.levels[this.currentLevel];
        if (!this.levelConfiguration) {
            console.error("Level configuration not found for level:", this.currentLevel);
            return;
        }
        this.movesAvailable = this.levelConfiguration.movesAllowed;
        this.candiesLeft = this.levelConfiguration.candiesRequired[1];

        // Reset board and UI
        this.clearBoard();
        this.updateUI();

        // Generate a board that is guaranteed to have no starting matches.
        do {
            this.fillBoardWithRandomCandies();
        } while (this.hasInitialMatches());

        this.addEventListeners();

        // DO NOT process board changes here. The game should start with a stable board.
        // The first call to processBoardChanges() will happen after the player's first valid move.
    }

    /**
     * Fills the entire board with new random candies.
     */
    fillBoardWithRandomCandies() {
        this.squares.forEach(square => {
            let candyColorIndex = Math.floor(Math.random() * this.colors.length);
            square.style.backgroundImage = this.colors[candyColorIndex];
        });
    }

    /**
     * Advances the player to the next level.
     */
    levelUp() {
        new Audio('sound-effects/level-up.mp3').play();
        this.currentLevel = (this.currentLevel + 1) % this.levels.length; // Loop back to level 1 if all are completed
        this.setLevel();
    }

    // --- EVENT LISTENERS & HANDLING ---

    /**
     * Attaches unified event listeners to the squares and the document.
     */
    addEventListeners() {
        this.squares.forEach(square => {
            square.addEventListener('mousedown', this.startInteraction.bind(this));
            square.addEventListener('touchstart', this.startInteraction.bind(this), { passive: true });

            // Click Events for special items are still needed
            square.addEventListener('click', this.handleClick.bind(this));
        });

        // Listen on the whole document for move and end events
        // This ensures the swipe completes even if the user's cursor/finger leaves the board
        document.addEventListener('mousemove', this.trackInteraction.bind(this));
        document.addEventListener('touchmove', this.trackInteraction.bind(this), { passive: true });

        document.addEventListener('mouseup', this.endInteraction.bind(this));
        document.addEventListener('touchend', this.endInteraction.bind(this));
    }

    /**
     * Removes all event listeners from the squares.
     */
    removeEventListeners() {
        this.squares.forEach(square => {
            // A clean way to remove all listeners is to replace the node
            const newSquare = square.cloneNode(true);
            square.parentNode?.replaceChild(newSquare, square);
        });
        // The `this.squares` array now holds references to the old, detached nodes.
        // We need to re-populate it with the new nodes from the board.
        if (this.board) {
            this.squares = Array.from(this.board.querySelectorAll('.square'));
        }
    }

    /**
     * Handles click events, specifically for special items like bombs or dynamite.
     * @param {MouseEvent} event The click event.
     */
    handleClick(event) {
        if (this.isBoardLocked) return;
        const target = /** @type {HTMLDivElement} */ (event.target);
        const candyType = target.style.backgroundImage;

        if (candyType.includes('bomb')) {
            this.popBomb();
        } else if (candyType.includes('dynamite')) {
            this.popDynamite(parseInt(target.id));
        }
    }

    /**
     * Helper to introduce a delay, useful for animations.
     * @param {number} ms Milliseconds to wait.
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- UNIFIED SWIPE INTERACTION LOGIC ---

    /**
     * Handles the start of an interaction (mousedown or touchstart).
     * @param {MouseEvent | TouchEvent} event
     */
    startInteraction(event) {
        if (this.isBoardLocked) return;

        this.isSwiping = true;
        const target = /** @type {HTMLDivElement} */ (event.target);
        this.startSquareId = parseInt(target.id);

        // Record starting coordinates
        if (event instanceof TouchEvent) {
            this.startX = event.touches[0].clientX;
            this.startY = event.touches[0].clientY;
        } else {
            this.startX = event.clientX;
            this.startY = event.clientY;
        }
    }

    /**
     * Tracks the movement of the interaction to determine the end point.
     * We only care about the final position, so this just updates state.
     * @param {MouseEvent | TouchEvent} event
     */
    trackInteraction(event) {
        if (!this.isSwiping) return;
        // This function could be used for real-time feedback in the future,
        // but for a simple swipe, we only need the end position.
    }

    /**
     * Handles the end of an interaction (mouseup or touchend).
     * Analyzes the swipe and triggers the candy swap if valid.
     * @param {MouseEvent | TouchEvent} event
     */
    endInteraction(event) {
        if (!this.isSwiping || this.startSquareId === null) {
            this.isSwiping = false;
            return;
        }

        this.isSwiping = false;

        let endX = 0;
        let endY = 0;

        if (event instanceof TouchEvent) {
            // If touches array is empty, it means the touch has ended off-screen.
            // We use the last known position from changedTouches.
            if (event.changedTouches.length === 0) return;
            endX = event.changedTouches[0].clientX;
            endY = event.changedTouches[0].clientY;
        } else {
            endX = event.clientX;
            endY = event.clientY;
        }

        const deltaX = endX - this.startX;
        const deltaY = endY - this.startY;

        const swipeThreshold = 20; // Minimum pixel distance for a valid swipe
        let targetSquareId = null;

        if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
            if (Math.abs(deltaX) > swipeThreshold) {
                targetSquareId = deltaX > 0 ? this.startSquareId + 1 : this.startSquareId - 1;
            }
        } else { // Vertical swipe
            if (Math.abs(deltaY) > swipeThreshold) {
                targetSquareId = deltaY > 0 ? this.startSquareId + this.width : this.startSquareId - this.width;
            }
        }

        if (targetSquareId !== null) {
            this.animateAndProcessSwap(this.startSquareId, targetSquareId);
        }

        this.startSquareId = null;
    }

    /**
     * Animates the swapping of two candies, then processes the move.
     * A move is always consumed, and candies are not swapped back if no match occurs.
     * @param {number} id1 The ID of the first square.
     * @param {number} id2 The ID of the second square.
     */
    async animateAndProcessSwap(id1, id2) {
        // --- Input Validation ---
        if (id2 < 0 || id2 >= this.width * this.width) return;
        const row1 = Math.floor(id1 / this.width);
        const col1 = id1 % this.width;
        const row2 = Math.floor(id2 / this.width);
        const col2 = id2 % this.width;
        if (Math.abs(row1 - row2) + Math.abs(col1 - col2) !== 1) return;

        this.isBoardLocked = true;
        const square1 = this.squares[id1];
        const square2 = this.squares[id2];
        const candy1 = square1.style.backgroundImage;
        const candy2 = square2.style.backgroundImage;

        const isSpecialCandy = candy1?.includes('bomb') || candy1?.includes('dynamite') ||
            candy2?.includes('bomb') || candy2?.includes('dynamite');
        if (isSpecialCandy) {
            this.isBoardLocked = false;
            return;
        }

        // --- Animate the Swap ---
        const dx = (col2 - col1) * square1.offsetWidth;
        const dy = (row2 - row1) * square1.offsetHeight;
        square1.style.transform = `translate(${dx}px, ${dy}px)`;
        square2.style.transform = `translate(${-dx}px, ${-dy}px)`;

        await this.sleep(200); // Wait for the animation to complete

        // --- Update the Board State ---
        square1.style.backgroundImage = candy2;
        square2.style.backgroundImage = candy1;
        square1.style.transform = '';
        square2.style.transform = '';

        // --- Consume a Move and Process the Board ---
        // A move is always consumed.
        this.movesAvailable--;
        this.updateUI();

        // Let processBoardChanges handle all matching, clearing, and cascading.
        // It will find the match we just made and correctly trigger the drop/refill.
        // If no match was made, it will simply unlock the board.
        this.processBoardChanges();
    }

    // --- GAME LOOP & LOGIC ---

    /**
     * The main game loop, triggered after a move. It handles matching, dropping,
     * and refilling candies until the board is stable.
     */
    async processBoardChanges() {
        this.isBoardLocked = true;
        let hasChanged = true;

        while (hasChanged) {
            const matchesFound = this.findAndClearAllMatches();
            if (matchesFound) {
                new Audio('sound-effects/match1.mp3').play();
                await this.sleep(200); // Wait for user to see cleared candies
                this.dropCandies();
                await this.sleep(200); // Wait for drop animation
                this.refillBoard();
                hasChanged = true;
            } else {
                hasChanged = false;
            }
        }

        this.isBoardLocked = false;
        this.checkGameOver();
    }

    /**
     * Finds and clears all types of matches (rows, columns) on the board.
     * @returns {boolean} True if any match was found and cleared, false otherwise.
     */
    findAndClearAllMatches() {
        if (!this.levelConfiguration) return false;
        const matchedIndices = new Set();

        const checkAndAdd = (indices, color) => {
            if (!color || color === '') return;
            if (indices.every(index => this.squares[index].style.backgroundImage === color)) {
                indices.forEach(index => matchedIndices.add(index));
            }
        };

        // Check for matches of 3
        for (let i = 0; i < this.width * this.width; i++) {
            // Rows
            if (i % this.width <= this.width - 3) {
                checkAndAdd([i, i + 1, i + 2], this.squares[i].style.backgroundImage);
            }
            // Columns
            if (i < this.width * (this.width - 2)) {
                checkAndAdd([i, i + this.width, i + this.width * 2], this.squares[i].style.backgroundImage);
            }
        }

        if (matchedIndices.size > 0) {
            let candiesCollected = 0;
            const requiredColorUrl = `url("images/${this.levelConfiguration.candiesRequired[0]}.png")`;
            matchedIndices.forEach(index => {
                if (this.squares[index].style.backgroundImage === requiredColorUrl) {
                    candiesCollected++;
                }
                this.squares[index].style.backgroundImage = '';
            });
            this.handleScore(candiesCollected);
            return true;
        }

        return false;
    }

    /**
     * Moves existing candies down to fill empty spaces using a column-by-column
     * compaction method. This ensures that all gaps are correctly filled.
     */
    dropCandies() {
        for (let col = 0; col < this.width; col++) {
            // 1. Read all existing candies in the current column from top to bottom.
            const candiesInColumn = [];
            for (let row = 0; row < this.width; row++) {
                const index = row * this.width + col;
                if (this.squares[index].style.backgroundImage !== '') {
                    candiesInColumn.push(this.squares[index].style.backgroundImage);
                }
            }

            // 2. Clear the entire column in the main squares array.
            for (let row = 0; row < this.width; row++) {
                const index = row * this.width + col;
                this.squares[index].style.backgroundImage = '';
            }

            // 3. Place the candies back into the column, starting from the bottom.
            let bottomRow = this.width - 1;
            for (let i = candiesInColumn.length - 1; i >= 0; i--) {
                const index = bottomRow * this.width + col;
                this.squares[index].style.backgroundImage = candiesInColumn[i];
                bottomRow--;
            }
        }
    }

    /**
     * Fills any empty square on the board with a new random candy.
     * This is called after dropCandies has compacted everything down.
     */
    refillBoard() {
        this.squares.forEach(square => {
            if (square.style.backgroundImage === '') {
                const newColorIndex = Math.floor(Math.random() * this.colors.length);
                square.style.backgroundImage = this.colors[newColorIndex];
            }
        });
    }

    // --- SPECIAL CANDY LOGIC ---

    /**
     * Logic for a bomb candy, which clears the whole board.
     */
    popBomb() {
        if (!this.levelConfiguration) return;
        new Audio('sound-effects/bomb-pop.mp3').play();
        this.movesAvailable--;
        let collected = 0;
        const requiredColorUrl = `url("images/${this.levelConfiguration.candiesRequired[0]}.png")`;
        for (let i = 0; i < this.width * this.width; i++) {
            if (this.squares[i].style.backgroundImage === requiredColorUrl) {
                collected++;
            }
            this.squares[i].style.backgroundImage = '';
        }
        this.handleScore(collected);
        this.processBoardChanges(); // Process the board after clearing
    }

    /**
     * Logic for a dynamite candy, which clears a 3x3 area.
     * @param {number} centerId The index of the dynamite square.
     */
    popDynamite(centerId) {
        if (!this.levelConfiguration) return;
        new Audio('sound-effects/dynamite-pop.mp3').play();
        this.movesAvailable--;
        const requiredColorUrl = `url("images/${this.levelConfiguration.candiesRequired[0]}.png")`;
        let collected = 0;

        // Define the 3x3 area, checking for board edges
        for (let row = -1; row <= 1; row++) {
            for (let col = -1; col <= 1; col++) {
                const targetId = centerId + (row * this.width) + col;
                const isSameRow = Math.floor(targetId / this.width) === Math.floor((centerId + (row * this.width)) / this.width);
                if (targetId >= 0 && targetId < this.width * this.width && isSameRow) {
                    if (this.squares[targetId].style.backgroundImage === requiredColorUrl) {
                        collected++;
                    }
                    this.squares[targetId].style.backgroundImage = '';
                }
            }
        }
        this.handleScore(collected);
        this.processBoardChanges(); // Process the board after clearing
    }

    // --- UI & STATE MANAGEMENT ---

    /**
     * Updates the score and checks for level completion.
     * @param {number} candiesCollected The number of required candies that were just cleared.
     */
    handleScore(candiesCollected) {
        this.candiesLeft = Math.max(0, this.candiesLeft - candiesCollected);
        this.updateUI();

        if (this.candiesLeft === 0) {
            this.isBoardLocked = true; // Lock board before level up
            setTimeout(() => this.levelUp(), 500); // Wait a bit before starting next level
        }
    }

    /**
      * Checks for game over condition (no more moves).
      */
    checkGameOver() {
        if (this.movesAvailable <= 0 && this.candiesLeft > 0) {
            new Audio('sound-effects/game-over.mp3').play();
            this.isBoardLocked = true;
            this.removeEventListeners();
            // Optional: Show a 'Game Over' message
            if (this.movesInfo) {
                this.movesInfo.innerText = "GAME OVER";
            }
            console.log("Game Over!");
        }
    }


    /**
   * Updates all UI elements with the current game state.
   */
    updateUI() {
        if (!this.levelConfiguration) return;
        const requiredCandyName = this.levelConfiguration.candiesRequired[0];

        if (this.levelTitle) {
            this.levelTitle.innerText = 'Level: ';
        }
        if (this.levelInfo) {
            this.levelInfo.innerText = String(this.currentLevel + 1);
        }

        if (this.movesTitle) {
            this.movesTitle.innerText = 'Moves: ';
        }
        if (this.movesInfo) {
            this.movesInfo.innerText = String(this.movesAvailable);
        }

        if (this.candiesTimes) {
            this.candiesTimes.innerText = 'x';
        }
        if (this.candiesInfo) {
            this.candiesInfo.innerText = String(this.candiesLeft);
        }

        const colorUrl = this.colors.find(c => c.includes(requiredCandyName));
        if (colorUrl && this.requiredCandyImage) {
            this.requiredCandyImage.style.backgroundImage = colorUrl;
        }
    }

    /**
     * Clears all candies from the board visually.
     */
    clearBoard() {
        this.squares.forEach(square => square.style.backgroundImage = '');
    }
}

/**
 * Main function to instantiate and initialize the game.
 * This is the entry point of the application.
 */
function main() {
    const game = new Game();
    game.init();
}

// Start the game once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);