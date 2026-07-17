export const developerCode = {
  gamesJson: `[
    {
        "title": "Snake",
        "url": "https://www.google.com/logos/2010/pacman10-i.html",
        "thumbnail": "https://via.placeholder.com/150?text=Snake"
    },
    {
        "title": "2048",
        "url": "https://play2048.co/",
        "thumbnail": "https://via.placeholder.com/150?text=2048"
    },
    {
        "title": "Doodle Jump",
        "url": "https://doodlejump.io/",
        "thumbnail": "https://via.placeholder.com/150?text=Doodle+Jump"
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
            <iframe id="game-iframe" src="" frameborder="0" allowfullscreen></iframe>
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
    border-radius: 8px;
    margin-bottom: 10px;
}

#game-player {
    width: 100%;
    height: 90vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

#game-iframe {
    width: 80%;
    height: 80%;
    border: 3px solid #333;
    background: white;
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
} `,

  scriptJs: `const gameGrid = document.getElementById('game-grid');
const gamePlayer = document.getElementById('game-player');
const gameIframe = document.getElementById('game-iframe');
const backBtn = document.getElementById('back-btn');

// Load games from JSON file
async function loadGames() {
    try {
        const response = await fetch('games.json');
        const games = await response.json();
        
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = \`
                <img src="\${game.thumbnail}" alt="\&{game.title}">
                <h3>\${game.title}</h3>
            \`;
            
            card.onclick = () => playGame(game.url);
            gameGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading games:", error);
    }
}

// Function to switch to game view
function playGame(url) {
    gameGrid.classList.add('hidden');
    gamePlayer.classList.remove('hidden');
    backBtn.classList.remove('hidden');
    gameIframe.src = url;
}

// Function to return to the home screen
backBtn.onclick = () => {
    gameGrid.classList.remove('hidden');
    gamePlayer.classList.add('hidden');
    backBtn.classList.add('hidden');
    gameIframe.src = ""; // Stop the game when leaving
};

loadGames();`
};
