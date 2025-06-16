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
     * Generates a new, random level configuration.
     * The difficulty scales with the level number.
     * @param {number} levelIndex The current level index (0-based).
     * @returns {{movesAllowed: number, candiesRequired: [string, number]}} The configuration for the new level.
     */
    generateRandomLevel(levelIndex) {
        // 1. Pick a random candy for the objective.
        const candyIndex = Math.floor(Math.random() * this.colors.length);
        const requiredCandyUrl = this.colors[candyIndex];
        // Extract the name (e.g., 'pig') from the URL 'url(images/pig.png)'
        // FIX: Handle the case where .pop() returns undefined by providing a default empty string.
        const requiredCandyName = (requiredCandyUrl.split('/').pop() || '').replace('.png)', '');

        // 2. Calculate the number of candies required. This increases as levels go up.
        // Starts at 20 and increases by 3 for each level the player has completed.
        const candiesRequiredCount = 20 + (levelIndex * 3);

        // 3. Calculate a fair number of moves. This is the most important part.
        // A simple formula: a base amount of moves plus extra moves proportional to the goal.
        // We assume a player needs about 1 move to clear 1.5 required candies on average
        // (this accounts for cascades, setup moves, and clearing non-required candies).
        // We add a base of 25 moves to ensure very low-requirement levels aren't impossible.
        const movesAllowed = 25 + Math.ceil(candiesRequiredCount / 1.5);

        return {
            movesAllowed: movesAllowed,
            candiesRequired: [requiredCandyName, candiesRequiredCount]
        };
    }

    /**
     * Initializes the game, sets up the board and event listeners.
     * This is the main entry point to start the game logic.
     */
    init() {
        this.playButton?.addEventListener('click', () => this.play());
        this.setUpBoard();
    }

    // /**
    //  * Logs the current state of the board to the console in a readable grid format.
    //  * @param {string} title A title for the log entry.
    //  */
    // logBoardState(title) {

    //     const boardGrid = [];
    //     for (let i = 0; i < this.width; i++) {
    //         const row = [];
    //         for (let j = 0; j < this.width; j++) {
    //             const index = i * this.width + j;
    //             const image = this.squares[index].style.backgroundImage;
    //             // FIX: Handle the case where .pop() returns undefined by providing a default empty string.
    //             row.push(image ? (image.split('/').pop() ?? '').replace('")', '').slice(0, 3) : '---');
    //         }
    //         boardGrid.push(row.join(' '));
    //     }


    // }

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
        if (this.playButton)
            this.playButton.style.display = 'none';
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
        // This is the main change: Generate a level instead of looking it up.
        this.levelConfiguration = this.generateRandomLevel(this.currentLevel);

        if (!this.levelConfiguration) {
            console.error("Failed to generate a level configuration for level:", this.currentLevel);
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
        // The old code looped back to level 1. The new code increments forever.
        this.currentLevel++;
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

        // this.logBoardState("Board State BEFORE Swap");
        // ... (rest of the function is the same, just keeping it for context)
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

        const dx = (col2 - col1) * square1.offsetWidth;
        const dy = (row2 - row1) * square1.offsetHeight;
        square1.style.transform = `translate(${dx}px, ${dy}px)`;
        square2.style.transform = `translate(${-dx}px, ${-dy}px)`;

        await this.sleep(200);

        square1.style.backgroundImage = candy2;
        square2.style.backgroundImage = candy1;
        square1.style.transform = '';
        square2.style.transform = '';
        // this.logBoardState("Board State AFTER Swap (before match check)");

        this.movesAvailable--;
        this.updateUI();
        this.processBoardChanges();
    }

    // --- GAME LOOP & LOGIC ---

    /**
     * The main game loop. It now orchestrates the entire cycle of checking for matches,
     * clearing them, animating gravity, and then re-checking for cascading matches.
     * It continues as long as there are matches to clear OR empty squares to fill.
     */
    async processBoardChanges() {

        this.isBoardLocked = true;

        let cycleCount = 1;
        while (true) {

            const matchData = this.findAllMatches();

            // --- THE FIX ---
            // We must also check for empty squares left by bombs/dynamite.
            const hasEmptySquares = this.squares.some(s => s.style.backgroundImage === '');

            // The loop should continue if there are matches to process OR empty squares to fill.
            if (matchData.indicesToClear.size > 0 || hasEmptySquares) {


                // Only handle score/special items if there was an actual match.
                if (matchData.indicesToClear.size > 0) {
                    new Audio('sound-effects/match1.mp3').play();
                    this.handleMatches(matchData);
                    await this.sleep(200); // Wait for user to see the cleared match.
                }

                // ALWAYS run gravity if the board is unstable. This will now fill
                // holes from both matches and special item explosions.

                await this.animateGravity();

                // Loop again to check for cascades.
                cycleCount++;
            } else {
                // If there are no matches AND no empty squares, the board is stable.

                break;
            }
        }

        this.isBoardLocked = false;

        this.checkGameOver();
    }

    /**
     * Finds all matches on the board and returns a plan of what to do.
     * This function is "read-only" and does NOT modify the board state.
     * @returns {{indicesToClear: Set<number>, specialItemsToCreate: Array<{index: number, type: string}>}}
     */
    findAllMatches() {
        // FIX: Add a JSDoc type annotation to prevent TypeScript from inferring `specialItemsToCreate` as `never[]`.
        /** @type {{indicesToClear: Set<number>, specialItemsToCreate: Array<{index: number, type: string}>}} */
        const matchData = {
            indicesToClear: new Set(),
            specialItemsToCreate: []
        };
        const processedIndices = new Set();

        // Check for special matches (4-in-a-row, 2x2) FIRST
        for (let i = 0; i < this.width * this.width; i++) {
            if (processedIndices.has(i)) continue;
            const color = this.squares[i].style.backgroundImage;
            if (!color || color.includes('bomb') || color.includes('dynamite')) continue;

            // Row of 4
            if (i % this.width <= this.width - 4 && this.squares[i + 1].style.backgroundImage === color && this.squares[i + 2].style.backgroundImage === color && this.squares[i + 3].style.backgroundImage === color) {
                const indices = [i, i + 1, i + 2, i + 3];
                matchData.specialItemsToCreate.push({ index: i, type: 'bomb' });
                matchData.indicesToClear.add(i + 1); matchData.indicesToClear.add(i + 2); matchData.indicesToClear.add(i + 3);
                indices.forEach(index => processedIndices.add(index));
                continue;
            }
            // Column of 4
            if (i < this.width * (this.width - 3) && this.squares[i + this.width].style.backgroundImage === color && this.squares[i + this.width * 2].style.backgroundImage === color && this.squares[i + this.width * 3].style.backgroundImage === color) {
                const indices = [i, i + this.width, i + this.width * 2, i + this.width * 3];
                matchData.specialItemsToCreate.push({ index: i, type: 'bomb' });
                matchData.indicesToClear.add(i + this.width); matchData.indicesToClear.add(i + this.width * 2); matchData.indicesToClear.add(i + this.width * 3);
                indices.forEach(index => processedIndices.add(index));
                continue;
            }
            // 2x2 Square for Dynamite
            if (i % this.width < this.width - 1 && i < this.width * (this.width - 1) && this.squares[i + 1].style.backgroundImage === color && this.squares[i + this.width].style.backgroundImage === color && this.squares[i + this.width + 1].style.backgroundImage === color) {
                const indices = [i, i + 1, i + this.width, i + this.width + 1];
                matchData.specialItemsToCreate.push({ index: i, type: 'dynamite' });
                matchData.indicesToClear.add(i + 1); matchData.indicesToClear.add(i + this.width); matchData.indicesToClear.add(i + this.width + 1);
                indices.forEach(index => processedIndices.add(index));
                continue;
            }
        }

        // Now, check for 3-matches on any remaining unprocessed squares
        for (let i = 0; i < this.width * this.width; i++) {
            if (processedIndices.has(i)) continue;
            const color = this.squares[i].style.backgroundImage;
            if (!color || color.includes('bomb') || color.includes('dynamite')) continue;

            if (i % this.width <= this.width - 3 && this.squares[i + 1].style.backgroundImage === color && this.squares[i + 2].style.backgroundImage === color) {
                const indices = [i, i + 1, i + 2];
                indices.forEach(index => { matchData.indicesToClear.add(index); processedIndices.add(index); });
            }
            if (i < this.width * (this.width - 2) && this.squares[i + this.width].style.backgroundImage === color && this.squares[i + this.width * 2].style.backgroundImage === color) {
                const indices = [i, i + this.width, i + this.width * 2];
                indices.forEach(index => { matchData.indicesToClear.add(index); processedIndices.add(index); });
            }
        }
        return matchData;
    }

    /**
     * Executes the plan from findAllMatches. It modifies the board by clearing squares,
     * creating special items, and updating the score.
     * @param {{indicesToClear: Set<number>, specialItemsToCreate: Array<{index: number, type: string}>}} matchData
     */
    handleMatches(matchData) {
        if (!this.levelConfiguration) return;
        let candiesCollected = 0;
        const requiredColorUrl = `url("images/${this.levelConfiguration.candiesRequired[0]}.png")`;

        matchData.indicesToClear.forEach(index => {
            if (this.squares[index].style.backgroundImage === requiredColorUrl) {
                candiesCollected++;
            }
            this.squares[index].style.backgroundImage = '';
        });

        matchData.specialItemsToCreate.forEach(item => {
            if (this.squares[item.index].style.backgroundImage === requiredColorUrl) {
                candiesCollected++;
            }
            this.squares[item.index].style.backgroundImage = `url(images/${item.type}.png)`;
            new Audio('sound-effects/bomb-created.mp3').play();
        });

        if (candiesCollected > 0) {
            this.handleScore(candiesCollected);
        }
        // this.logBoardState("Board State AFTER Matches Cleared");
    }

    /**
     * Calculates and animates the gravity effect for all columns using a robust
     * three-phase approach: Plan, Animate, and Finalize. This prevents state
     * corruption and visual bugs.
     */
    async animateGravity() {

        const animationDuration = 300;
        const promises = [];
        // A pristine, read-only copy of the board's state BEFORE animations are planned.
        const initialBoardImages = this.squares.map(s => s.style.backgroundImage);

        // The master plan for what the board will look like after everything is done.
        const finalBoardState = Array(this.width * this.width).fill(null);

        for (let col = 0; col < this.width; col++) {
            // --- PHASE 1: PLAN --- (No changes here)
            const existingCandiesInCol = [];
            for (let row = 0; row < this.width; row++) {
                const index = row * this.width + col;
                if (initialBoardImages[index]) {
                    existingCandiesInCol.push(initialBoardImages[index]);
                }
            }

            const emptySlots = this.width - existingCandiesInCol.length;

            for (let i = 0; i < emptySlots; i++) {
                const toIndex = i * this.width + col;
                finalBoardState[toIndex] = this.colors[Math.floor(Math.random() * this.colors.length)];
            }

            existingCandiesInCol.forEach((image, i) => {
                const toIndex = (emptySlots + i) * this.width + col;
                finalBoardState[toIndex] = image;
            });
        }



        // --- PHASE 2: ANIMATE --- (Modified)
        for (let col = 0; col < this.width; col++) {
            const existingCandiesInCol = [];
            const originalIndexes = [];

            for (let row = 0; row < this.width; row++) {
                const index = row * this.width + col;
                if (initialBoardImages[index]) {
                    existingCandiesInCol.push(initialBoardImages[index]);
                    originalIndexes.push(index);
                }
            }
            const emptySlots = this.width - existingCandiesInCol.length;

            existingCandiesInCol.forEach((_, i) => {
                const fromIndex = originalIndexes[i];
                const toRow = emptySlots + i;
                const fromRow = Math.floor(fromIndex / this.width);
                const fallDistance = toRow - fromRow;

                if (fallDistance > 0) {
                    const squareToAnimate = this.squares[fromIndex];

                    squareToAnimate.style.transition = `transform ${animationDuration}ms ease-in`;
                    squareToAnimate.style.transform = `translateY(${fallDistance * squareToAnimate.offsetHeight}px)`;
                    promises.push(this.sleep(animationDuration));
                }
            });

            for (let i = 0; i < emptySlots; i++) {
                const toIndex = i * this.width + col;
                const square = this.squares[toIndex];

                // ***** FIX: DO NOT SET THE BACKGROUND IMAGE HERE *****
                // The square will be visually empty as it drops, which is fine.
                // It will get its image in the Finalize phase.
                square.style.transition = 'none'; // So it can be teleported instantly
                square.style.transform = `translateY(-${(i + 1) * square.offsetHeight}px)`;

                promises.push(new Promise(resolve => {
                    setTimeout(() => {
                        square.style.transition = `transform ${animationDuration}ms ease-out`;
                        square.style.transform = 'translateY(0)';
                        resolve(undefined);
                    }, 50); // Small delay to stagger drops
                }));
            }
        }


        // Wait for the longest animation to complete.
        if (promises.length > 0) {
            await this.sleep(animationDuration + 100);
        }


        // --- PHASE 3: FINALIZE ---

        this.squares.forEach((square, i) => {
            // Reset all transforms and transitions first to prevent visual glitches.
            square.style.transition = 'none';
            square.style.transform = '';
            // Now, apply the master plan. This is the single source of truth.
            square.style.backgroundImage = finalBoardState[i] || '';
        });

        // Add a micro-delay to allow the browser to render the final state before the next check
        await this.sleep(20);

        // this.logBoardState("Board State AFTER Gravity and Finalization");

    }

    // --- SPECIAL CANDY LOGIC ---

    /**
     * Logic for a bomb candy. It clears the board, pauses for visual effect,
     * and then triggers the refill process.
     */
    async popBomb() {
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

        // --- THE FIX ---
        // Add a delay so the user can see the board clear before refilling.
        await this.sleep(300);

        this.processBoardChanges(); // Now start the refill process.
    }

    /**
     * Logic for a dynamite candy. It clears a 3x3 area, pauses for visual effect,
     * and then triggers the refill process.
     * @param {number} centerId The index of the dynamite square.
     */
    async popDynamite(centerId) {
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

        // --- THE FIX ---
        // Add a delay here as well for consistency.
        await this.sleep(300);

        this.processBoardChanges(); // Now start the refill process.
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