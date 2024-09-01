const startMenu = document.getElementById('start-menu');
const howToPlayMenu = document.getElementById('how-to-play-menu');
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreBoard = document.getElementById('score-board');
const pauseMenu = document.getElementById('pause-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const victoryMenu = document.getElementById('victory-menu');

const startGameButton = document.getElementById('start-game');
const howToPlayButton = document.getElementById('how-to-play');
const closeHowToPlayButton = document.getElementById('close-how-to-play');
const continueButton = document.getElementById('continue');
const restartButton = document.getElementById('restart');
const newGameButton = document.getElementById('new-game');
const playAgainButton = document.getElementById('play-again');

let gameState;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 5;
const ENEMY_BULLET_SPEED = 5;
const ENEMY_ROWS = 5;
const ENEMY_COLS = 8;
const ENEMY_VERTICAL_SPACING = 50;
const ENEMY_HORIZONTAL_SPACING = 80;

document.addEventListener('wheel', function (e) {
    if (e.ctrlKey) {
        e.preventDefault();
    }
}, { passive: false });

function resetGameState() {
    gameState = {
        player: { x: 380, y: 560 },
        enemies: [],
        bullets: [],
        enemyBullets: [],
        score: 0,
        lives: 3,
        time: 0,
        isGameOver: false,
        isPaused: false,
        lastTime: 0,
        enemyDirection: 1,
        enemySpeed: 1,
        enemyShootInterval: 800,
        lastEnemyShot: 0,
        lastPlayerShot: 0,
        playerShootCooldown: 250
    };

    // Clear the game container
    while (gameContainer.firstChild) {
        gameContainer.removeChild(gameContainer.firstChild);
    }

    // Reset player position
    player.style.left = `${gameState.player.x}px`;
    player.style.top = `${gameState.player.y}px`;
    gameContainer.appendChild(player);

    // Reset scoreboard
    gameContainer.appendChild(scoreBoard);
    document.getElementById('time').textContent = '0.0';
    document.getElementById('score').textContent = '0';
    document.getElementById('lives').textContent = '3';

    // Recreate enemies
    createEnemies();
}

function createEnemies() {
    for (let row = 0; row < ENEMY_ROWS; row++) {
        for (let col = 0; col < ENEMY_COLS; col++) {
            const enemy = document.createElement('div');
            enemy.className = 'enemy game-object';
            enemy.style.left = `${col * ENEMY_HORIZONTAL_SPACING + 50}px`;
            enemy.style.top = `${row * ENEMY_VERTICAL_SPACING + 50}px`;
            gameContainer.appendChild(enemy);
            gameState.enemies.push({
                element: enemy,
                x: col * ENEMY_HORIZONTAL_SPACING + 50,
                y: row * ENEMY_VERTICAL_SPACING + 50,
            });
        }
    }
}

function gameLoop(currentTime) {
    if (gameState.lastTime === 0) {
        gameState.lastTime = currentTime;
    }

    const delta = (currentTime - gameState.lastTime) / 16.67; // 60 FPS = 16.67ms per frame
    gameState.lastTime = currentTime;

    if (!gameState.isPaused && !gameState.isGameOver) {
        gameState.time += delta * 16.67; // Increment time

        try {
            movePlayer(delta);
            moveBullets(delta);
            moveEnemies(delta);
            checkCollisions();
            enemyShoot(currentTime);
            updateScoreBoard();

            // Check if space key is pressed and call shoot with current time
            if (keys[' ']) {
                shoot(currentTime);
            }
        } catch (error) {
            console.error("Game encountered an error:", error);
            gameState.isPaused = true;
            alert("An error occurred. The game is paused. Please restart.");
        }
    }

    if (!gameState.isGameOver) {
        requestAnimationFrame(gameLoop);
    }
}

function movePlayer(delta) {
    if (keys.ArrowLeft && gameState.player.x > 0) {
        gameState.player.x = Math.max(0, gameState.player.x - PLAYER_SPEED * delta);
    }
    if (keys.ArrowRight && gameState.player.x < GAME_WIDTH - 40) {
        gameState.player.x = Math.min(GAME_WIDTH - 40, gameState.player.x + PLAYER_SPEED * delta);
    }
    player.style.left = `${gameState.player.x}px`;
}

function moveBullets(delta) {
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.y -= BULLET_SPEED * delta;

        if (bullet.y > 0) {
            bullet.element.style.top = `${bullet.y}px`;
            return true;
        } else {
            if (bullet.element.parentNode) {
                gameContainer.removeChild(bullet.element);
            }
            return false;
        }
    });

    gameState.enemyBullets = gameState.enemyBullets.filter(bullet => {
        bullet.y += ENEMY_BULLET_SPEED * delta;

        if (bullet.y < GAME_HEIGHT) {
            bullet.element.style.top = `${bullet.y}px`;
            return true;
        } else {
            if (bullet.element.parentNode) {
                gameContainer.removeChild(bullet.element);
            }
            return false;
        }
    });
}

function moveEnemies(delta) {
    let shouldChangeDirection = false;
    gameState.enemies.forEach(enemy => {
        enemy.x += gameState.enemyDirection * gameState.enemySpeed * delta;
        if (enemy.x < 0 || enemy.x > GAME_WIDTH - 30) {
            shouldChangeDirection = true;
        }
        enemy.element.style.left = `${enemy.x}px`;
    });

    if (shouldChangeDirection) {
        gameState.enemyDirection *= -1;
        gameState.enemies.forEach(enemy => {
            enemy.y += ENEMY_VERTICAL_SPACING / 2;
            if (enemy.y + 30 > GAME_HEIGHT - 50) {
                gameOver();
            }
            enemy.element.style.top = `${enemy.y}px`;
        });
        gameState.enemySpeed = Math.min(gameState.enemySpeed + 0.1, 5);  // Cap enemy speed increase
    }
}

function checkCollisions() {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        let bullet = gameState.bullets[i];

        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            let enemy = gameState.enemies[j];

            if (
                bullet.x < enemy.x + 30 &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + 30 &&
                bullet.y + 15 > enemy.y
            ) {
                if (enemy.element.parentNode) {
                    gameContainer.removeChild(enemy.element);
                }
                gameState.enemies.splice(j, 1);

                if (bullet.element.parentNode) {
                    gameContainer.removeChild(bullet.element);
                }
                gameState.bullets.splice(i, 1);

                gameState.score += 10;
                updateScoreBoard();

                if (gameState.enemies.length === 0) {
                    victory();
                }

                break;
            }
        }
    }

    gameState.enemyBullets.forEach((bullet, bulletIndex) => {
        if (
            bullet.x < gameState.player.x + 40 &&
            bullet.x + 5 > gameState.player.x &&
            bullet.y < gameState.player.y + 20 &&
            bullet.y + 15 > gameState.player.y
        ) {
            if (bullet.element.parentNode) {
                gameContainer.removeChild(bullet.element);
            }
            gameState.enemyBullets.splice(bulletIndex, 1);
            gameState.lives--;
            updateScoreBoard();

            if (gameState.lives <= 0) {
                gameOver();
            }
        }
    });

    gameState.enemies.forEach((enemy) => {
        if (enemy.y + 30 > gameState.player.y) {
            gameOver();
        }
    });
}

function shoot(currentTime) {
    if (currentTime - gameState.lastPlayerShot > gameState.playerShootCooldown) {
        const bullet = document.createElement('div');
        bullet.className = 'bullet game-object';
        bullet.style.left = `${gameState.player.x + 17.5}px`;
        bullet.style.top = `${gameState.player.y}px`;
        gameContainer.appendChild(bullet);

        gameState.bullets.push({
            element: bullet,
            x: gameState.player.x + 17.5,
            y: gameState.player.y,
        });

        gameState.lastPlayerShot = currentTime;
    }
}

function enemyShoot(currentTime) {
    if (currentTime - gameState.lastEnemyShot > gameState.enemyShootInterval) {
        const shootingEnemy =
            gameState.enemies[Math.floor(Math.random() * gameState.enemies.length)];
        if (shootingEnemy) {
            const bullet = document.createElement('div');
            bullet.className = 'enemy-bullet game-object';
            bullet.style.left = `${shootingEnemy.x + 12.5}px`;
            bullet.style.top = `${shootingEnemy.y + 30}px`;
            gameContainer.appendChild(bullet);

            gameState.enemyBullets.push({
                element: bullet,
                x: shootingEnemy.x + 12.5,
                y: shootingEnemy.y + 30,
            });
            gameState.lastEnemyShot = currentTime;
        }
    }
}

function updateScoreBoard() {
    document.getElementById('time').textContent = (gameState.time / 1000).toFixed(1);
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
}

function gameOver() {
    gameState.isGameOver = true;
    gameOverMenu.style.display = 'block';
    document.getElementById('final-time').textContent = (gameState.time / 1000).toFixed(1);
    document.getElementById('final-score').textContent = gameState.score;
}

function victory() {
    gameState.isGameOver = true;
    victoryMenu.style.display = 'block';
    document.getElementById('victory-time').textContent = (gameState.time / 1000).toFixed(1);
    document.getElementById('victory-score').textContent = gameState.score;
}

function showStartMenu() {
    startMenu.style.display = 'block';
    howToPlayMenu.style.display = 'none';
    gameContainer.style.display = 'none';
    pauseMenu.style.display = 'none';
    gameOverMenu.style.display = 'none';
    victoryMenu.style.display = 'none';
}

function startGame() {
    startMenu.style.display = 'none';
    gameContainer.style.display = 'block';
    resetGameState();
    requestAnimationFrame(gameLoop);
}

function showHowToPlay() {
    howToPlayMenu.style.display = 'block';
    startMenu.style.display = 'none';
}

function closeHowToPlay() {
    howToPlayMenu.style.display = 'none';
    startMenu.style.display = 'block';
}

function restartGame() {
    location.reload();
}

const keys = {};

document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    if (event.key === 'Escape') {
        gameState.isPaused = !gameState.isPaused;
        if (gameState.isPaused) {
            pauseMenu.style.display = 'block';
        } else {
            pauseMenu.style.display = 'none';
        }
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Event listeners for buttons
startGameButton.addEventListener('click', startGame);
howToPlayButton.addEventListener('click', showHowToPlay);
closeHowToPlayButton.addEventListener('click', closeHowToPlay);

continueButton.addEventListener('click', () => {
    gameState.isPaused = false;
    pauseMenu.style.display = 'none';
});

restartButton.addEventListener('click', restartGame);
newGameButton.addEventListener('click', showStartMenu);
playAgainButton.addEventListener('click', showStartMenu);

// Initial setup
showStartMenu();