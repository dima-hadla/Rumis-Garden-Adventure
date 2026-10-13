"use strict";

// Store the image paths for the three game characters.
const characters = {
    Rumi: "images/Rumi.png",
    Mira: "images/Mira.png",
    Zoey: "images/Zoey.png"
};

// Define the four movement directions and their wall information.
const directions = {
    // Move one cell up.
    up: {
        row: -1,
        col: 0,
        wall: "top",
        opposite: "bottom"
    },
    // Move one cell down.
    down: {
        row: 1,
        col: 0,
        wall: "bottom",
        opposite: "top"
    },
    // Move one cell left.
    left: {
        row: 0,
        col: -1,
        wall: "left",
        opposite: "right"
    },
    // Move one cell right.
    right: {
        row: 0,
        col: 1,
        wall: "right",
        opposite: "left"
    }
};
// Get the HTML form used to start the game.
const form = document.getElementById("maze-form");

// Get the HTML element where the maze will appear.
const board = document.getElementById("maze-board");

// Get the input used to select the maze size.
const sizeInput = document.getElementById("maze-size");

// Get the input used to select the player character.
const characterInput = document.getElementById("player-character");

// Get the input used to enable or disable the timer.
const timerInput = document.getElementById("timer-enabled");

// Get the input used to set the time limit.
const timeLimitInput = document.getElementById("time-limit");

// Get the element used to display settings errors.
const settingsError = document.getElementById("settings-error");

// Get the element that displays the current level.
const levelDisplay = document.getElementById("level-score");

// Get the element that displays the remaining time.
const timerDisplay = document.getElementById("game-timer");

// Get the element that displays the number of collected friends.
const friendsDisplay = document.getElementById("friends-count");

// Get the element that displays the number of steps taken.
const stepsDisplay = document.getElementById("steps-count");

// Get the element that displays the selected character's name.
const characterDisplay = document.getElementById("selected-character-name");

// Get the element that displays game messages.
const messageDisplay = document.getElementById("game-message");

// Get the screen displayed when the player wins.
const winScreen = document.getElementById("win-screen");

// Get the screen displayed when the player loses.
const loseScreen = document.getElementById("lose-screen");

// Get the element that displays the winning message.
const winMessage = document.getElementById("win-message");

// Get the element that displays the final score.
const winScore = document.getElementById("win-score");

// Get the element that displays the character on the lose screen.
const loseCharacter = document.getElementById("lose-character");

// Get the element that displays the losing message.
const loseMessage = document.getElementById("lose-message");

// Get the button used to move to the next level.
const nextLevelButton = document.getElementById("next-level");

// Get the Play Again button on the win screen.
const winAgainButton = document.getElementById("win-play-again");

// Get the Play Again button on the lose screen.
const loseAgainButton = document.getElementById("lose-play-again");

// Store the maze cells.
let maze = [];

// Set the default maze size to 10.
let mazeSize = 10;

// Set the player's starting position to row 0, column 0.
let player = { row: 0, col: 0 };

// Set the default exit position to row 9, column 9.
let exit = { row: 9, col: 9 };

// Set Rumi as the default selected character.
let selectedCharacter = "Rumi";

// Store the other characters waiting in the maze.
let friends = [];

// Store the names of the friends collected by the player.
let collectedFriends = [];

// Create a Set to keep track of visited maze cells.
let visited = new Set();
// Store a different trail color for each character.
const characterTrailColors = {
    Rumi: "#e8d9ff",
    Mira: "#ffe0ef",
    Zoey: "#dcecff"
};

// Store which character visited each cell.
let visitedCharacter = new Map();

// Count the number of steps taken by the player.
let steps = 0;

// Set the starting level to 1.
let level = 1;

// Set the initial remaining time to 120 seconds.
let secondsLeft = 120;

// Store the timer interval ID.
let timerId = null;

// Track whether the game is currently active.
let gameActive = false;

// Track whether the game has ended.
let gameOver = false;

// Create a unique key using a cell's row and column.
function cellKey(row, col) {
    return `${row},${col}`;
}

// Shuffle the items into a random order.
function shuffle(items) {
    // Create a copy of the original list.
    const result = [...items];

    // Randomly rearrange the items.
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    // Return the shuffled list.
    return result;
}

// Check whether a cell is inside the maze boundaries.
function isInside(row, col) {
    return (
        row >= 0 &&
        row < mazeSize &&
        col >= 0 &&
        col < mazeSize
    );
}

// Create an empty maze with all four walls closed in every cell.
function createEmptyMaze(size) {
    // Create an array of rows, each containing maze cells.
    return Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => ({
            // Store the cell's row and column.
            row,
            col,

            // Set all four walls to closed.
            walls: {
                top: true,
                right: true,
                bottom: true,
                left: true
            },

            // Mark the cell as not visited yet.
            visited: false
        }))
    );
}


// Generate the maze by opening paths between neighbouring cells.
function generateMaze(size) {
    // Create an empty grid with all walls closed.
    const grid = createEmptyMaze(size);

    // Start the process from the top-left cell.
    const stack = [grid[0][0]];

    // Mark the starting cell as visited.
    grid[0][0].visited = true;

    // Continue until there are no cells left in the stack.
    while (stack.length > 0) {
        // Get the current cell from the top of the stack.
        const current = stack[stack.length - 1];

        // Find unvisited neighbouring cells in random order.
        const options = shuffle(
            Object.values(directions).filter(direction => {
                // Calculate the position of the neighbouring cell.
                const nextRow = current.row + direction.row;
                const nextCol = current.col + direction.col;

                // Keep neighbours that are inside the grid and not visited.
                return (
                    nextRow >= 0 &&
                    nextRow < size &&
                    nextCol >= 0 &&
                    nextCol < size &&
                    !grid[nextRow][nextCol].visited
                );
            })
        );

        // Go back to the previous cell if no unvisited neighbours remain.
        if (options.length === 0) {
            stack.pop();
            continue;
        }

        // Choose the first available neighbour.
        const direction = options[0];

        // Calculate the neighbouring cell's position.
        const nextRow = current.row + direction.row;
        const nextCol = current.col + direction.col;
        const nextCell = grid[nextRow][nextCol];

        // Open the wall between the current cell and the next cell.
        current.walls[direction.wall] = false;
        nextCell.walls[direction.opposite] = false;

        // Mark the neighbouring cell as visited.
        nextCell.visited = true;

        // Add the new cell to the stack.
        stack.push(nextCell);
    }

    // Remove the temporary visited property from every cell.
    grid.forEach(row => {
        row.forEach(cell => {
            delete cell.visited;
        });
    });

    // Return the completed maze.
    return grid;
}

// Find all maze cells that can be reached from a starting position.
function findReachableCells(startRow, startCol) {
    // Add the starting cell to the queue.
    const queue = [{ row: startRow, col: startCol }];

    // Remember the starting cell so it is not visited again.
    const found = new Set([cellKey(startRow, startCol)]);

    // Store all reachable cells.
    const result = [];

    // Continue while there are cells left to check.
    while (queue.length > 0) {
        // Remove the first cell from the queue.
        const current = queue.shift();

        // Add the current cell to the results.
        result.push(current);

        // Check each possible movement direction.
        for (const direction of Object.values(directions)) {
            // Calculate the position of the neighbouring cell.
            const nextRow = current.row + direction.row;
            const nextCol = current.col + direction.col;

            // Skip the neighbour if it is outside the maze.
            if (!isInside(nextRow, nextCol)) {
                continue;
            }

            // Skip the neighbour if a wall blocks the path.
            if (maze[current.row][current.col].walls[direction.wall]) {
                continue;
            }

            // Create a unique key for the neighbouring cell.
            const nextKey = cellKey(nextRow, nextCol);

            // Skip cells that have already been found.
            if (found.has(nextKey)) {
                continue;
            }

            // Mark the neighbouring cell as found.
            found.add(nextKey);

            // Add the neighbouring cell to the queue.
            queue.push({
                row: nextRow,
                col: nextCol
            });
        }
    }

    // Return all reachable cells.
    return result;
}

// Place the two other characters in reachable maze cells.
function placeFriends() {
    // Get the names of the characters who are not selected by the player.
    const otherCharacters = Object.keys(characters).filter(
        name => name !== selectedCharacter
    );

    // Find reachable cells that are not the starting cell or the exit.
    const possibleCells = findReachableCells(0, 0).filter(cell => {
        // Check whether the cell is the starting position.
        const isStart = cell.row === 0 && cell.col === 0;

        // Check whether the cell is the exit position.
        const isExit = cell.row === exit.row && cell.col === exit.col;

        // Keep only cells that are not the start or the exit.
        return !isStart && !isExit;
    });

    // Randomly select two cells for the friends.
    const selectedCells = shuffle(possibleCells).slice(0, 2);

    // Assign a character and position to each selected cell.
    friends = selectedCells.map((cell, index) => ({
        row: cell.row,
        col: cell.col,
        name: otherCharacters[index],
        collected: false
    }));

    // Reset the list of collected friends.
    collectedFriends = [];
}

// Convert seconds into a minutes-and-seconds format.
function formatTime(seconds) {
    // Calculate the number of whole minutes.
    const minutes = Math.floor(seconds / 60);

    // Calculate the remaining seconds.
    const remaining = seconds % 60;

    // Return the time with two digits for minutes and seconds.
    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
    );
}

// Update the current time and year in the footer.
function updateFooter() {
    // Get the current date and time.
    const now = new Date();

    // Format the current time using Calgary's time zone.
    const time = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Edmonton",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    }).format(now);

    // Update the time in each matching HTML element.
    ["home-time", "current-time"].forEach(id => {
        // Find the HTML element using its ID.
        const element = document.getElementById(id);

        // Update the element if it exists.
        if (element) {
            element.textContent = time;
        }
    });

    // Update the year in each matching HTML element.
    ["home-year", "current-year"].forEach(id => {
        // Find the HTML element using its ID.
        const element = document.getElementById(id);

        // Display the current year if the element exists.
        if (element) {
            element.textContent = now.getFullYear();
        }
    });
}

// Add a character image to a maze cell.
function addCharacterImage(element, name) {
    // Create an image element.
    const image = document.createElement("img");

    // Set the image source, alternative text, and dragging behaviour.
    image.src = characters[name];
    image.alt = name;
    image.draggable = false;

    // Show a fallback emoji if the image fails to load.
    image.onerror = () => {
        // Remove the image that failed to load.
        image.remove();

        // Create a span element for the fallback emoji.
        const fallback = document.createElement("span");
        fallback.className = "tile-emoji";

        // Choose an emoji based on the character's name.
        fallback.textContent = name === "Mira" ? "🌸" :
            name === "Zoey" ? "🌟" : "😊";

        // Add the fallback emoji to the maze cell.
        element.appendChild(fallback);
    };

    // Add the character image to the maze cell.
    element.appendChild(image);
}

// Create one maze cell and display its contents.
function createCell(row, col) {
    // Get the maze data for this cell.
    const cell = maze[row][col];

    // Create a button element for the cell.
    const element = document.createElement("button");

    // Set the button type and CSS classes.
    element.type = "button";
    element.className = "maze-cell path";

    // Add an accessible label showing the cell's row and column.
    element.setAttribute(
        "aria-label",
        `Row ${row + 1}, column ${col + 1}`
    );

    // Place the cell in the correct grid row and column.
    element.style.gridRow = String(row + 1);
    element.style.gridColumn = String(col + 1);

    // Display a green border if the top wall is closed.
    element.style.borderTop = cell.walls.top
        ? "4px solid #347447"
        : "1px solid #f3aecb";

    // Display a green border if the right wall is closed.
    element.style.borderRight = cell.walls.right
        ? "4px solid #347447"
        : "1px solid #f3aecb";

    // Display a green border if the bottom wall is closed.
    element.style.borderBottom = cell.walls.bottom
        ? "4px solid #347447"
        : "1px solid #f3aecb";

    // Display a green border if the left wall is closed.
    element.style.borderLeft = cell.walls.left
        ? "4px solid #347447"
        : "1px solid #f3aecb";

    // Set the cell's background and layout styles.
    element.style.backgroundColor = "#ffe8ef";
    element.style.position = "relative";
    element.style.minWidth = "0";
    element.style.minHeight = "0";
    element.style.padding = "0";
    element.style.display = "flex";
    element.style.alignItems = "center";
    element.style.justifyContent = "center";
    element.style.overflow = "hidden";
    element.style.cursor = "pointer";

    // Check whether the player has visited this cell.
    if (visited.has(cellKey(row, col))) {
        // Add the visited class to the cell.
        element.classList.add("visited");

        // Create a span element for the footprints.
        const footprint = document.createElement("span");
        footprint.className = "footstep-mark";
        footprint.textContent = "👣";
        footprint.style.position = "absolute";
        footprint.style.inset = "0";
        footprint.style.display = "grid";
        footprint.style.placeItems = "center";
        footprint.style.fontSize = "clamp(8px, 1.5vw, 17px)";
        footprint.style.opacity = "0.75";
        footprint.style.pointerEvents = "none";

        // Add the footprints to the cell.
        element.appendChild(footprint);
    }

    // Check whether this cell is the maze exit.
    const isExit =
        row === exit.row &&
        col === exit.col;

    if (isExit) {
        // Mark the cell as the exit and set its background colour.
        element.classList.add("exit-cell");
        element.style.backgroundColor = "#ffe49b";

        // Create the golden star that marks the exit.
        const star = document.createElement("span");
        star.className = "tile-emoji";
        star.textContent = "★";
        star.style.position = "relative";
        star.style.zIndex = "2";
        star.style.fontSize = "clamp(16px, 2.5vw, 30px)";
        star.style.color = "#e8a914";

        // Add the star to the exit cell.
        element.appendChild(star);
    }

    // Find a friend in this cell who has not been collected.
    const friend = friends.find(item =>
        !item.collected &&
        item.row === row &&
        item.col === col
    );

    if (friend) {
        // Apply the friend cell's class and background colour.
        element.classList.add("friend-cell");
        element.style.backgroundColor = "#f4e5ff";

        // Display the friend's character image.
        addCharacterImage(element, friend.name);
    }

    // Check whether the player is currently in this cell.
    if (player.row === row && player.col === col) {
        // Mark the cell as the player's current position.
        element.classList.add("player-cell");

        // Clear the cell's existing contents before showing the player.
        element.replaceChildren();

        // Set the player's cell background and inner border.
        element.style.backgroundColor = "#e8d9ff";
        element.style.boxShadow = "inset 0 0 0 2px #9d78ce";

        // Display the selected character in the cell.
        addCharacterImage(element, selectedCharacter);
    }

    // Move the player when this cell is clicked.
    element.addEventListener("click", () => {
        moveToCell(row, col);
    });

    // Return the completed maze cell.
    return element;
}

// Draw the maze and update the game display.
function renderMaze() {
    // Stop if the board does not exist or the maze is empty.
    if (!board || maze.length === 0) {
        return;
    }

    // Remove the previous maze cells.
    board.replaceChildren();

    // Set the maze board to use a grid layout.
    board.style.display = "grid";

    // Set the number and size of the grid columns.
    board.style.gridTemplateColumns =
        `repeat(${mazeSize}, minmax(0, 1fr))`;

    // Set the number and size of the grid rows.
    board.style.gridTemplateRows =
        `repeat(${mazeSize}, minmax(0, 1fr))`;

    // Store the maze column count as a CSS custom property.
    board.style.setProperty("--maze-columns", mazeSize);

    // Store the maze size as a CSS custom property.
    board.style.setProperty("--maze-size", mazeSize);

    // Remove the gaps between maze cells.
    board.style.gap = "0";

    // Keep the maze board square.
    board.style.aspectRatio = "1 / 1";

    // Set the board's position and overflow behaviour.
    board.style.position = "relative";
    board.style.overflow = "hidden";

    // Set the maze board's background colour.
    board.style.backgroundColor = "#ffe3ed";

    // Create a temporary container for the maze cells.
    const fragment = document.createDocumentFragment();

    // Loop through every row in the maze.
    for (let row = 0; row < mazeSize; row++) {
        // Loop through every column in the current row.
        for (let col = 0; col < mazeSize; col++) {
            // Create a cell and add it to the temporary container.
            fragment.appendChild(createCell(row, col));
        }
    }

    // Add all maze cells to the board.
    board.appendChild(fragment);

    // Refresh the progress information.
    updateProgress();
}

// Update the progress information displayed on the page.
function updateProgress() {
    // Display the current level if its element exists.
    if (levelDisplay) {
        levelDisplay.textContent = level;
    }

    // Display the remaining time in minutes and seconds.
    if (timerDisplay) {
        timerDisplay.textContent = formatTime(secondsLeft);
    }

    // Display the number of steps taken.
    if (stepsDisplay) {
        stepsDisplay.textContent = steps;
    }

    // Display the number of friends collected out of two.
    if (friendsDisplay) {
        friendsDisplay.textContent = `${collectedFriends.length} / 2`;
    }

    // Display the name of the selected character.
    if (characterDisplay) {
        characterDisplay.textContent = `Playing as ${selectedCharacter}`;
    }
}

// Stop the countdown timer.
function stopTimer() {
    // Check whether a timer is currently running.
    if (timerId !== null) {
        // Clear the timer interval.
        clearInterval(timerId);

        // Reset the timer ID.
        timerId = null;
    }
}

// Start the countdown timer.
function startTimer() {
    // Stop any previously running timer.
    stopTimer();

    // Do not start the timer if the game is inactive or the timer is disabled.
    if (
        !timerInput ||
        !timerInput.checked ||
        !gameActive ||
        gameOver
    ) {
        return;
    }

    // Run the timer code every second.
    timerId = setInterval(() => {
        // Stop the timer if the game has ended or become inactive.
        if (!gameActive || gameOver) {
            stopTimer();
            return;
        }

        // Reduce the remaining time by one second without going below zero.
        secondsLeft = Math.max(0, secondsLeft - 1);

        // Update the displayed progress information.
        updateProgress();

        // Show the lose screen when the time reaches zero.
        if (secondsLeft === 0) {
            showLoseScreen();
        }
    }, 1000);
}

// Hide the win and lose screens.
function hideResults() {
    // Hide the win screen if it exists.
    if (winScreen) {
        winScreen.hidden = true;
    }

    // Hide the lose screen if it exists.
    if (loseScreen) {
        loseScreen.hidden = true;
    }
}

// Start a new game, optionally keeping the current level.
function startNewGame(keepLevel = false) {
    // Stop if the maze board does not exist.
    if (!board) {
        return;
    }

    // Read the selected maze size, time limit, and timer setting.
    const requestedSize = Number(sizeInput?.value || 10);
    const requestedTime = Number(timeLimitInput?.value || 120);
    const timerEnabled = Boolean(timerInput?.checked);

    // Check whether the selected maze size is allowed.
    if (![5, 10, 15, 20].includes(requestedSize)) {
        // Display an error if the maze size is invalid.
        if (settingsError) {
            settingsError.textContent =
                "Choose a maze size of 5, 10, 15, or 20.";
        }

        return;
    }

    // Validate the time limit when the timer is enabled.
    if (
        timerEnabled &&
        (
            !Number.isInteger(requestedTime) ||
            requestedTime < 10 ||
            requestedTime > 600
        )
    ) {
        // Display an error if the time limit is invalid.
        if (settingsError) {
            settingsError.textContent =
                "Enter a time between 10 and 600 seconds.";
        }

        return;
    }

    // Clear any previous settings error.
    if (settingsError) {
        settingsError.textContent = "";
    }

    // Stop the previous countdown.
    stopTimer();

    // Apply the selected maze size.
    mazeSize = requestedSize;

    // Use the selected character if it exists; otherwise, use Rumi.
    selectedCharacter = characters[characterInput?.value]
        ? characterInput.value
        : "Rumi";

    // Reset the level to 1 unless the current level should be kept.
    if (!keepLevel) {
        level = 1;
    }

    // Generate a new maze using the selected size.
    maze = generateMaze(mazeSize);

    // Set the player's starting position and the exit position.
    player = { row: 0, col: 0 };
    exit = { row: mazeSize - 1, col: mazeSize - 1 };

    // Reset the step count and set the remaining time.
    steps = 0;
    secondsLeft = timerEnabled ? requestedTime : 0;

    // Mark the starting cell as visited.
    visited = new Set([cellKey(0, 0)]);

    // Activate the game and clear the game-over state.
    gameActive = true;
    gameOver = false;

    // Place the friends and prepare the game screens.
    placeFriends();
    hideResults();
    renderMaze();
    updateProgress();

    // Display the starting instructions.
    if (messageDisplay) {
        messageDisplay.textContent =
            "Collect both friends, then reach the golden star!";
    }

    // Start the countdown if the timer is enabled.
    if (timerEnabled) {
        startTimer();
    }
}

// Check whether the player can move in a specific direction.
function canMove(directionName) {
    // Get the movement information for the selected direction.
    const direction = directions[directionName];

    // Reject invalid directions or movement when the game is inactive.
    if (!direction || !gameActive || gameOver || maze.length === 0) {
        return false;
    }

    // Calculate the position of the next cell.
    const nextRow = player.row + direction.row;
    const nextCol = player.col + direction.col;

    // Check whether the next cell is inside the maze.
    if (!isInside(nextRow, nextCol)) {
        return false;
    }

    // Get the current cell and the next cell.
    const currentCell = maze[player.row][player.col];
    const nextCell = maze[nextRow][nextCol];

    // Allow movement only when both sides of the connecting path are open.
    return (
        currentCell.walls[direction.wall] === false &&
        nextCell.walls[direction.opposite] === false
    );
}

// Move the player in the selected direction.
function movePlayer(directionName) {
    // Check whether movement in this direction is allowed.
    if (!canMove(directionName)) {
        // Display a message if the path is blocked.
        if (gameActive && !gameOver && messageDisplay) {
            messageDisplay.textContent =
                "The green hedge blocks this way. Try another path!";
        }

        return;
    }

    // Get the movement information for the selected direction.
    const direction = directions[directionName];

    // Calculate the position of the next cell and move there.
    moveToCell(
        player.row + direction.row,
        player.col + direction.col
    );
}

// Move the player to a specific cell in the maze.
function moveToCell(row, col) {
    // Stop if the game is inactive or has ended.
    if (!gameActive || gameOver) {
        return;
    }

    // Calculate the difference between the current and target positions.
    const rowDifference = row - player.row;
    const colDifference = col - player.col;

    // Allow movement by only one cell in one direction.
    if (
        Math.abs(rowDifference) +
        Math.abs(colDifference) !== 1
    ) {
        return;
    }

    // Store the direction of movement.
    let directionName;

    // Identify the direction based on the position difference.
    if (rowDifference === -1) {
        directionName = "up";
    } else if (rowDifference === 1) {
        directionName = "down";
    } else if (colDifference === -1) {
        directionName = "left";
    } else if (colDifference === 1) {
        directionName = "right";
    }

    // Check whether the direction is valid and the path is open.
    if (!directionName || !canMove(directionName)) {
        // Display a message if a wall blocks the path.
        if (messageDisplay) {
            messageDisplay.textContent =
                "A hedge blocks the way. Follow an open pink path!";
        }

        return;
    }

    // Update the player's position.
    player = { row, col };

    // Increase the number of steps taken.
    steps += 1;

    // Record the cell as visited.
    visited.add(cellKey(row, col));

    // Check for a friend, redraw the maze, update progress, and check for a win.
    collectFriend();
    renderMaze();
    updateProgress();
    checkWin();
}

// Check whether the player has reached a friend.
function collectFriend() {
    // Find an uncollected friend in the player's current cell.
    const friend = friends.find(item =>
        !item.collected &&
        item.row === player.row &&
        item.col === player.col
    );

    // Stop if there is no friend in the current cell.
    if (!friend) {
        return;
    }

    // Mark the friend as collected.
    friend.collected = true;

    // Add the friend's name to the collected friends list.
    collectedFriends.push(friend.name);

    // Display a message when the friend joins the adventure.
    if (messageDisplay) {
        messageDisplay.textContent =
            `${friend.name} joined your adventure!`;
    }
}

// Check whether the player has won the game.
function checkWin() {
    // Check whether the player has reached the exit.
    const reachedExit =
        player.row === exit.row &&
        player.col === exit.col;

    // Stop if the player has not reached the exit.
    if (!reachedExit) {
        return;
    }

    // Require both friends to be collected before winning.
    if (collectedFriends.length < 2) {
        // Remind the player to collect both friends.
        if (messageDisplay) {
            messageDisplay.textContent =
                "Find both friends before reaching the golden star!";
        }

        return;
    }

    // Mark the game as finished.
    gameOver = true;
    gameActive = false;

    // Stop the countdown timer.
    stopTimer();

    // Display the winning message.
    if (winMessage) {
        winMessage.textContent =
            `${selectedCharacter}, Mira and Zoey reached the garden exit together!`;
    }

    // Display the total number of steps taken.
    if (winScore) {
        winScore.textContent = steps;
    }

    // Show the win screen.
    if (winScreen) {
        winScreen.hidden = false;
    }
}

// Display the lose screen when the player loses.
function showLoseScreen() {
    // Mark the game as finished.
    gameOver = true;
    gameActive = false;

    // Stop the countdown timer.
    stopTimer();

    // Display the message explaining that time ran out.
    if (loseMessage) {
        loseMessage.textContent =
            "Time ran out. Try again and find both friends!";
    }

    // Display the name of the selected character.
    if (loseCharacter) {
        loseCharacter.src = characters[selectedCharacter];
        loseCharacter.alt = selectedCharacter;
    }

    // Show the lose screen.
    if (loseScreen) {
        loseScreen.hidden = false;
    }
}

// Listen for the game form being submitted.
if (form) {
    form.addEventListener("submit", event => {
        // Prevent the browser from refreshing the page.
        event.preventDefault();

        // Start a new game and reset the level.
        startNewGame(false);
    });
}

// Add click events to all movement buttons.
document.querySelectorAll("[data-move]").forEach(button => {
    button.addEventListener("click", () => {
        // Move the player in the direction assigned to the button.
        movePlayer(button.dataset.move);
    });
});

// Listen for keyboard input to control the player.
document.addEventListener("keydown", event => {
    // Match arrow keys and WASD keys with movement directions.
    const keys = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right"
    };

    // Get the movement direction for the pressed key.
    const direction = keys[event.key];

    // Ignore keys that do not control movement.
    if (!direction) {
        return;
    }

    // Do not move the player while typing in a form field.
    if (
        document.activeElement &&
        ["INPUT", "SELECT", "TEXTAREA"].includes(
            document.activeElement.tagName
        )
    ) {
        return;
    }

    // Prevent the default keyboard action and move the player.
    event.preventDefault();
    movePlayer(direction);
});

// Listen for changes to the selected character.
if (characterInput) {
    characterInput.addEventListener("change", () => {
        // Do not change the character if the game is inactive.
        if (!gameActive) {
            return;
        }

        // Use the selected character or default to Rumi.
        selectedCharacter = characters[characterInput.value]
            ? characterInput.value
            : "Rumi";

        // Redraw the maze and update the progress display.
        renderMaze();
        updateProgress();
    });
}

// Listen for changes to the timer setting.
if (timerInput) {
    timerInput.addEventListener("change", () => {
        // Do not change the timer if the game is inactive.
        if (!gameActive) {
            return;
        }

        // Check whether the timer is enabled.
        if (timerInput.checked) {
            // Restore the selected time if no time remains.
            if (secondsLeft <= 0) {
                secondsLeft = Number(timeLimitInput?.value || 120);
            }

            // Start the countdown timer.
            startTimer();
        } else {
            // Stop the timer and reset the remaining time.
            stopTimer();
            secondsLeft = 0;

            // Update the displayed progress information.
            updateProgress();
        }
    });
}

// Listen for clicks on the Next Level button.
if (nextLevelButton) {
    nextLevelButton.addEventListener("click", () => {
        // Increase the current level by one.
        level += 1;

        // Increase the maze size by five, up to a maximum of twenty.
        if (sizeInput && Number(sizeInput.value) < 20) {
            sizeInput.value = String(
                Math.min(20, Number(sizeInput.value) + 5)
            );
        }

        // Start a new maze while keeping the current level.
        startNewGame(true);
    });
}

// Listen for clicks on the Play Again button on the win screen.
if (winAgainButton) {
    winAgainButton.addEventListener("click", () => {
        // Start a new game and reset the level.
        startNewGame(false);
    });
}

// Listen for clicks on the Play Again button on the lose screen.
if (loseAgainButton) {
    loseAgainButton.addEventListener("click", () => {
        // Start a new game and reset the level.
        startNewGame(false);
    });
}

// Update the time and year displayed in the footer.
updateFooter();

// Start a new game if the maze board exists.
if (board) {
    startNewGame(false);
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => {
                console.log("Service Worker registered successfully.");
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error);
            });
    });
}
