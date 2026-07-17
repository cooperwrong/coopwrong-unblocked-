export const developerCode = {
  gamesJson: `[
  {
    "title": "Built-in Retro Snake",
    "url": "local-snake",
    "thumbnail": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=300&auto=format&fit=crop"
  },
  {
    "title": "Built-in Classic 2048",
    "url": "local-2048",
    "thumbnail": "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=300&auto=format&fit=crop"
  },
  {
    "title": "Google Pac-Man Doodle",
    "url": "https://www.google.com/logos/2010/pacman10-hp.html",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop"
  }
]`,

  indexHtml: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unblocked Games Hub</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <header>
        <h1>Unblocked Games</h1>
        <button id="back-btn" class="hidden">Back to Home</button>
    </header>

    <main>
        <!-- The grid where game cards appear -->
        <div id="game-grid" class="grid"></div>

        <!-- The player area where the game loads -->
        <div id="game-player" class="hidden">
            <iframe id="game-iframe" src="" frameborder="0" allowfullscreen class="hidden"></iframe>
            <div id="local-game-container"></div>
        </div>
    </main>

    <script src="script.js"></script>
</body>
</html>`,

  styleCss: `body {
    font-family: Arial, sans-serif;
    background-color: #121212;
    color: white;
    margin: 0;
    padding: 0;
}

header {
    background-color: #1f1f1f;
    padding: 20px;
    text-align: center;
    border-bottom: 2px solid #333;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    padding: 40px;
}

.game-card {
    background: #1f1f1f;
    padding: 15px;
    border-radius: 10px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s;
    border: 1px solid #333;
}

.game-card:hover {
    transform: scale(1.05);
    background: #2a2a2a;
}

.game-card img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 10px;
}

#game-player {
    width: 100%;
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-sizing: border-box;
}

#game-iframe {
    width: 90%;
    height: 70vh;
    border: 3px solid #333;
    background: white;
    border-radius: 12px;
}

#local-game-container {
    width: 100%;
    max-width: 440px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.hidden {
    display: none !important;
}

#back-btn {
    padding: 10px 20px;
    background-color: #ff4757;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

/* Custom Styles for local games inside exported portal */
.local-snake-canvas {
    border: 3px solid #6366f1;
    background-color: #000;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
    border-radius: 12px;
}

.local-game-hud {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 320px;
    margin-bottom: 15px;
    font-family: monospace;
    font-size: 14px;
}

.local-2048-board {
    background: #1a1a1a;
    border: 4px solid #333;
    border-radius: 12px;
    padding: 10px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: 8px;
    width: 300px;
    height: 300px;
}

.local-2048-cell {
    background: #2b2b2b;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: monospace;
    font-size: 20px;
    font-weight: bold;
}
`,

  scriptJs: `const gameGrid = document.getElementById('game-grid');
const gamePlayer = document.getElementById('game-player');
const gameIframe = document.getElementById('game-iframe');
const localGameContainer = document.getElementById('local-game-container');
const backBtn = document.getElementById('back-btn');

// High-quality fallback games if games.json fails to load or runs into CORS blocks
const defaultGames = [
    {
        "title": "Built-in Retro Snake",
        "url": "local-snake",
        "thumbnail": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=300&auto=format&fit=crop"
    },
    {
        "title": "Built-in Classic 2048",
        "url": "local-2048",
        "thumbnail": "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=300&auto=format&fit=crop"
    },
    {
        "title": "Google Pac-Man Doodle",
        "url": "https://www.google.com/logos/2010/pacman10-hp.html",
        "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop"
    }
];

let gameLoopInterval = null;

// Load games from JSON file with smart fallbacks
async function loadGames() {
    let games = defaultGames;
    try {
        const response = await fetch('games.json');
        if (response.ok) {
            games = await response.json();
            console.log("Successfully loaded games from games.json");
        } else {
            console.warn("Could not load games.json, using high-quality local fallback games.");
        }
    } catch (error) {
        console.warn("CORS/Fetch error reading games.json, using fallback games instead:", error);
    }
    
    renderGames(games);
}

// Render the games list inside the grid
function renderGames(gamesList) {
    gameGrid.innerHTML = '';
    gamesList.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = \`
            <img src="\${game.thumbnail}" alt="\${game.title}" onerror="this.src='https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=300&auto=format&fit=crop'">
            <h3>\${game.title}</h3>
        \`;
        
        card.onclick = () => playGame(game.url);
        gameGrid.appendChild(card);
    });
}

// Function to switch to game view
function playGame(url) {
    gameGrid.classList.add('hidden');
    gamePlayer.classList.remove('hidden');
    backBtn.classList.remove('hidden');
    
    // Clear previous local game elements
    localGameContainer.innerHTML = '';
    clearInterval(gameLoopInterval);
    
    if (url === 'local-snake') {
        gameIframe.classList.add('hidden');
        localGameContainer.classList.remove('hidden');
        startLocalSnake();
    } else if (url === 'local-2048') {
        gameIframe.classList.add('hidden');
        localGameContainer.classList.remove('hidden');
        startLocal2048();
    } else {
        localGameContainer.classList.add('hidden');
        gameIframe.classList.remove('hidden');
        gameIframe.src = url;
    }
}

// Clean up and return to the home screen
backBtn.onclick = () => {
    gameGrid.classList.remove('hidden');
    gamePlayer.classList.add('hidden');
    backBtn.classList.add('hidden');
    gameIframe.src = ""; // Stop the game when leaving
    localGameContainer.innerHTML = '';
    clearInterval(gameLoopInterval);
};

// Vanilla JS Local Snake Implementation
function startLocalSnake() {
    localGameContainer.innerHTML = \`
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div class="local-game-hud">
                <span>SCORE: <span id="snake-score">0</span></span>
                <span>RETRO SNAKE</span>
            </div>
            <canvas id="snakeCanvas" width="300" height="300" class="local-snake-canvas"></canvas>
            <p style="font-size: 11px; color: #888; margin-top: 10px; font-family: monospace;">Use Arrow keys or WASD to navigate</p>
        </div>
    \`;
    
    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('snake-score');
    
    const grid = 15;
    let count = 0;
    let score = 0;
    
    let snake = {
        x: 150,
        y: 150,
        dx: grid,
        dy: 0,
        cells: [],
        maxCells: 4
    };
    
    let apple = {
        x: 60,
        y: 60
    };
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    
    function resetApple() {
        apple.x = getRandomInt(0, 20) * grid;
        apple.y = getRandomInt(0, 20) * grid;
    }
    
    function loop() {
        if (++count < 6) {
            return;
        }
        count = 0;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        snake.x += snake.dx;
        snake.y += snake.dy;
        
        if (snake.x < 0) snake.x = canvas.width - grid;
        else if (snake.x >= canvas.width) snake.x = 0;
        if (snake.y < 0) snake.y = canvas.height - grid;
        else if (snake.y >= canvas.height) snake.y = 0;
        
        snake.cells.unshift({x: snake.x, y: snake.y});
        if (snake.cells.length > snake.maxCells) {
            snake.cells.pop();
        }
        
        // draw apple
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(apple.x, apple.y, grid-1, grid-1);
        
        // draw snake
        ctx.fillStyle = '#6366f1';
        snake.cells.forEach(function(cell, index) {
            ctx.fillRect(cell.x, cell.y, grid-1, grid-1);
            if (cell.x === apple.x && cell.y === apple.y) {
                snake.maxCells++;
                score += 10;
                scoreElement.textContent = score;
                resetApple();
            }
            for (let i = index + 1; i < snake.cells.length; i++) {
                if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                    snake.x = 150;
                    snake.y = 150;
                    snake.cells = [];
                    snake.maxCells = 4;
                    snake.dx = grid;
                    snake.dy = 0;
                    score = 0;
                    scoreElement.textContent = score;
                    resetApple();
                }
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if ((e.key === 'ArrowLeft' || e.key === 'a') && snake.dx === 0) {
            snake.dx = -grid;
            snake.dy = 0;
        } else if ((e.key === 'ArrowUp' || e.key === 'w') && snake.dy === 0) {
            snake.dy = -grid;
            snake.dx = 0;
        } else if ((e.key === 'ArrowRight' || e.key === 'd') && snake.dx === 0) {
            snake.dx = grid;
            snake.dy = 0;
        } else if ((e.key === 'ArrowDown' || e.key === 's') && snake.dy === 0) {
            snake.dy = grid;
            snake.dx = 0;
        }
    });
    
    gameLoopInterval = setInterval(loop, 16);
}

// Vanilla JS Local 2048 Implementation
function startLocal2048() {
    localGameContainer.innerHTML = \`
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div class="local-game-hud">
                <span>SCORE: <span id="2048-score">0</span></span>
                <span>NEON 2048</span>
            </div>
            <div id="board2048" class="local-2048-board"></div>
            <p style="font-size: 11px; color: #888; margin-top: 15px; font-family: monospace;">Use Arrow keys or WASD to slide cells</p>
        </div>
    \`;
    
    const boardDiv = document.getElementById('board2048');
    const scoreElement = document.getElementById('2048-score');
    let score = 0;
    let grid = Array(16).fill(0);
    
    function draw() {
        boardDiv.innerHTML = '';
        grid.forEach(val => {
            const cell = document.createElement('div');
            cell.className = 'local-2048-cell';
            if (val > 0) {
                cell.textContent = val;
                cell.style.background = val === 2 ? '#3b82f6' : val === 4 ? '#ec4899' : val === 8 ? '#f59e0b' : '#10b981';
                cell.style.color = '#fff';
            }
            boardDiv.appendChild(cell);
        });
    }
    
    function addRandom() {
        const empty = [];
        grid.forEach((val, idx) => { if (val === 0) empty.push(idx); });
        if (empty.length > 0) {
            grid[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    function slide(row) {
        let arr = row.filter(val => val);
        let missing = 4 - arr.length;
        let zeros = Array(missing).fill(0);
        return arr.concat(zeros);
    }
    
    function combine(row) {
        for (let i = 0; i < 3; i++) {
            if (row[i] === row[i + 1] && row[i] !== 0) {
                row[i] = row[i] * 2;
                row[i + 1] = 0;
                score += row[i];
                scoreElement.textContent = score;
            }
        }
        return row;
    }
    
    function moveRight() {
        let moved = false;
        for (let i = 0; i < 16; i += 4) {
            let row = [grid[i], grid[i+1], grid[i+2], grid[i+3]];
            let reversed = [...row].reverse();
            let slid = slide(reversed);
            let combined = combine(slid);
            let finalRow = slide(combined).reverse();
            for (let j = 0; j < 4; j++) {
                if (grid[i+j] !== finalRow[j]) moved = true;
                grid[i+j] = finalRow[j];
            }
        }
        if (moved) { addRandom(); draw(); }
    }
    
    function moveLeft() {
        let moved = false;
        for (let i = 0; i < 16; i += 4) {
            let row = [grid[i], grid[i+1], grid[i+2], grid[i+3]];
            let slid = slide(row);
            let combined = combine(slid);
            let finalRow = slide(combined);
            for (let j = 0; j < 4; j++) {
                if (grid[i+j] !== finalRow[j]) moved = true;
                grid[i+j] = finalRow[j];
            }
        }
        if (moved) { addRandom(); draw(); }
    }
    
    function moveDown() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            let col = [grid[i], grid[i+4], grid[i+8], grid[i+12]];
            let reversed = [...col].reverse();
            let slid = slide(reversed);
            let combined = combine(slid);
            let finalCol = slide(combined).reverse();
            for (let j = 0; j < 4; j++) {
                if (grid[i+j*4] !== finalCol[j]) moved = true;
                grid[i+j*4] = finalCol[j];
            }
        }
        if (moved) { addRandom(); draw(); }
    }
    
    function moveUp() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            let col = [grid[i], grid[i+4], grid[i+8], grid[i+12]];
            let slid = slide(col);
            let combined = combine(slid);
            let finalCol = slide(combined);
            for (let j = 0; j < 4; j++) {
                if (grid[i+j*4] !== finalCol[j]) moved = true;
                grid[i+j*4] = finalCol[j];
            }
        }
        if (moved) { addRandom(); draw(); }
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
        else if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
        else if (e.key === 'ArrowUp' || e.key === 'w') moveUp();
        else if (e.key === 'ArrowDown' || e.key === 's') moveDown();
    });
    
    addRandom();
    addRandom();
    draw();
}

loadGames();`
};
