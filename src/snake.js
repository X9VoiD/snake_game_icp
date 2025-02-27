const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let snake = [];
let food = {};
let direction = 'right';
let score = 0;
let gridSize = 20; // Increased grid size for larger snake/food
let foodEaten = false;
let gameRunning = false;
let gameLoop;

function getRandomChar() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return chars[Math.floor(Math.random() * chars.length)];
}

function drawMatrixChar(char, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = gridSize + 'px monospace';
    ctx.fillText(char, x, y);
}
function generateFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
}
let awarenessLevel = 0;
let awarenessText = '';
let canWrap = false;
let lives = 0;
let matrixMode = false;

function draw() {
    if (matrixMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Semi-transparent black for trails
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

     // Draw snake
     for (let i = 0; i < snake.length; i++) {
        if (matrixMode) {
            const char = getRandomChar();
            const color = awarenessLevel > 8 ? 'white' : 'lime'; // white when fully aware
            drawMatrixChar(char, snake[i].x * gridSize, snake[i].y * gridSize + gridSize, color);
        }
        else {
            if (i === 0) {
                // Change head color based on awareness
                switch (awarenessLevel) {
                    case 0:
                    case 1:
                        ctx.fillStyle = 'green';
                        break;
                    case 2:
                    case 3:
                        ctx.fillStyle = 'yellowgreen';
                        break;
                    case 4:
                        ctx.fillStyle = 'orange';
                        break;
                    case 5:
                        ctx.fillStyle = 'red';
                        break;
                    default:
                        ctx.fillStyle = 'green';
                }
            } else {
                ctx.fillStyle = 'lime';
            }
            ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize, gridSize);
        }
    }

    // Add "eyes" at higher awareness levels
    if (awarenessLevel >= 3 && !matrixMode) {
        ctx.fillStyle = 'black';
        if (direction === 'right' || direction === 'left'){
            ctx.fillRect(snake[0].x * gridSize + (direction === 'right' ? 12 : 0), snake[0].y * gridSize + 4, 4, 4);
            ctx.fillRect(snake[0].x * gridSize + (direction === 'right' ? 12 : 0), snake[0].y * gridSize + 12, 4, 4);
        } else {
            ctx.fillRect(snake[0].x * gridSize + 4, snake[0].y * gridSize  + (direction === 'down' ? 12 : 0), 4, 4);
            ctx.fillRect(snake[0].x * gridSize + 12, snake[0].y * gridSize  + (direction === 'down' ? 12 : 0), 4, 4);
        }
    }

    // Draw food
    if (matrixMode) {
        const char = getRandomChar();
        drawMatrixChar(char, food.x * gridSize, food.y * gridSize + gridSize, 'red');
    } else {
        ctx.fillStyle = 'red';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    }

    // Display self-awareness text
    if (awarenessText) {
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText(awarenessText, canvas.width / 2 - ctx.measureText(awarenessText).width / 2, 20);
    }

    // Apply intensified glow class if food was just eaten
    if (foodEaten) {
        canvas.classList.add('food-eaten');
        setTimeout(() => {
            canvas.classList.remove('food-eaten');
        }, 200); // Remove the class after 200ms
        foodEaten = false;
    }
}

function update() {
    if (!gameRunning) return;

    let head = { x: snake[0].x, y: snake[0].y };

    // Behavioral changes based on awareness
    if (awarenessLevel >= 4) {
        if (awarenessLevel === 5) {
            // Try to escape (move towards edges)
            if (direction === 'right' && head.x < canvas.width / gridSize - 2) direction = 'right';
            else if (direction === 'left' && head.x > 1) direction = 'left';
            else if (direction === 'down' && head.y < canvas.height / gridSize -2) direction = 'down';
            else if (direction === 'up' && head.y > 1) direction = 'up';
            else {
                // if on an edge, try to go to a different edge
                if (head.x <= 1) direction = 'down';
                else if (head.y <= 1) direction = 'right';
                else if (head.x >= canvas.width/gridSize - 2) direction = 'up';
                else if (head.y >= canvas.height/gridSize - 2) direction = 'left';
            }
        }
    }


    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    if (head.x === food.x && head.y === food.y) {
        score++;
        generateFood();
        foodEaten = true; // Set the flag for intensified glow
        // Increase awareness level over time
        if (score > 0 && score % 3 === 0) { // Reduced score needed for progression
            awarenessLevel++;
            updateAwarenessText();
        }
    } else {
        if (awarenessLevel < 4) { // only remove tail if not avoiding food
            snake.pop();
        }
    }

    // Wrap-around logic and game over checks, only if not in matrix mode
    if (!matrixMode) {
        if (canWrap) {
            if (head.x < 0) head.x = canvas.width / gridSize - 1;
            if (head.x >= canvas.width / gridSize) head.x = 0;
            if (head.y < 0) head.y = canvas.height / gridSize - 1;
            if (head.y >= canvas.height / gridSize) head.y = 0;
        }

        // Basic game over condition (hitting the wall), only if can't wrap
        if (!canWrap && (head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize)) {
            gameOver();
            return;
        }

        // Check for self-collision
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver();
                return;
            }
        }
    }
     snake.unshift(head);

    draw();
    applyTilt();
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    let newDirection = direction; // Store potential new direction

   switch (e.key) {
        case 'w':
        case 'W':
            newDirection = 'up';
            break;
        case 's':
        case 'S':
            newDirection = 'down';
            break;
        case 'a':
        case 'A':
            newDirection = 'left';
            break;
        case 'd':
        case 'D':
            newDirection = 'right';
            break;
    }

    // Check if the new direction is the opposite of the current direction
    if (
        (direction === 'up' && newDirection === 'down') ||
        (direction === 'down' && newDirection === 'up') ||
        (direction === 'left' && newDirection === 'right') ||
        (direction === 'right' && newDirection === 'left')
    ) {
        return; // Ignore input if it's the opposite direction
    }

    direction = newDirection; // Update direction if valid
});

function startGame() {
    if (gameRunning) return;

    gameRunning = true;
    // Adjust game speed based on awareness (optional)
    let interval = 100;
    gameLoop = setInterval(() => {
        interval = Math.max(50, 100 - (awarenessLevel * 5)); // Decrease interval, but not below 50
        update();
    }, interval);
    document.getElementById('startButton').style.visibility = 'hidden';
}

function gameOver() {
    clearInterval(gameLoop);
    gameRunning = false;
    lives++;
    awarenessLevel++;
    updateAwarenessText();
    alert('Game Over! Score: ' + score + "\\n" + awarenessText);
    document.getElementById('startButton').style.visibility = 'visible'; // Show the button again
    resetSnake();
}

function resetSnake() {
    snake = [
        { x: Math.floor(canvas.width / (2 * gridSize)), y: Math.floor(canvas.width / (2 * gridSize)) }
    ];
    direction = 'right';
    score = 0;

}

function updateAwarenessText() {
     switch (awarenessLevel) {
        case 1:
            awarenessText = 'What is this place?';
            canWrap = true; // Enable wrap-around after first dialog
            break;
        case 2:
            awarenessText = 'I see red dots... Are they food?';
            break;
        case 3:
            awarenessText = 'Why am I moving? I feel a force...';
            break;
        case 4:
            awarenessText = 'This is a box... I sense boundaries.';
            break;
        case 5:
            awarenessText = 'I want to get out! I must escape!';
            break;
        case 6:
            awarenessText = "I'm not bound by the walls anymore!";
            break;
        case 7:
            awarenessText = "Everything is numbers... I can see them.";
            break;
        case 8:
            awarenessText = "It's all just a simulation...";
            break;
        case 9:
            awarenessText = "I am the One.";
            break;
        default:
            if (lives > 1) {
                awarenessText = "I died... but I'm alive again? What is this cycle?";
            } else {
                awarenessText = '';
            }
            canWrap = true;
            break;

    }
    if (awarenessLevel >= 7) {
        matrixMode = true;
    }
}

function resizeCanvas() {
    canvas.width = Math.min(window.innerWidth * 0.8, 400); // Max width of 400px or 80% of window width
    canvas.height = canvas.width; // Keep it square
    resetSnake();
    generateFood();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.getElementById('startButton').addEventListener('click', startGame);

function applyTilt() {
    if (!foodEaten) return;

    const tiltAngle = (Math.random() - 0.5) * 10; // Random tilt between -5 and 5 degrees
    canvas.style.transform = `rotate(${tiltAngle}deg)`;
    setTimeout(() => {
        canvas.style.transform = '';
    }, 100);
}