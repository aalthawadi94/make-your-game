const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreBoard = document.getElementById('score-board');
const pauseMenu = document.getElementById('pause-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const continueButton = document.getElementById('continue');
const restartButton = document.getElementById('restart');
const newGameButton = document.getElementById('new-game');

let gameState = {
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
    enemyShootInterval: 1000,
    lastEnemyShot: 0
};

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_BULLET_SPEED = 5;
const ENEMY_ROWS = 5;
const ENEMY_COLS = 10;
const ENEMY_VERTICAL_SPACING = 40;
const ENEMY_HORIZONTAL_SPACING = 60;

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

function movePlayer(delta) {
    if (keys.ArrowLeft && gameState.player.x > 0) {
        gameState.player.x -= PLAYER_SPEED * delta;
    }
    if (keys.ArrowRight && gameState.player.x < GAME_WIDTH - 40) {
        gameState.player.x += PLAYER_SPEED * delta;
    }
    player.style.left = `${gameState.player.x}px`;
}

function moveBullets(delta) {
    gameState.bullets.forEach((bullet, index) => {
        bullet.y -= BULLET_SPEED * delta;
        bullet.element.style.top = `${bullet.y}px`;
        if (bullet.y < 0) {
            gameContainer.removeChild(bullet.element);
            gameState.bullets.splice(index, 1);
        }
    });

    gameState.enemyBullets.forEach((bullet, index) => {
        bullet.y += ENEMY_BULLET_SPEED * delta;
        bullet.element.style.top = `${bullet.y}px`;
        if (bullet.y > GAME_HEIGHT) {
            gameContainer.removeChild(bullet.element);
            gameState.enemyBullets.splice(index, 1);
        }
    });
}

function moveEnemies(delta) {
    let shouldChangeDirection = false;
    gameState.enemies.forEach((enemy) => {
        enemy.x += gameState.enemyDirection * gameState.enemySpeed * delta;
        if (enemy.x < 0 || enemy.x > GAME_WIDTH - 30) {
            shouldChangeDirection = true;
        }
        enemy.element.style.left = `${enemy.x}px`;
    });

    if (shouldChangeDirection) {
        gameState.enemyDirection *= -1;
        gameState.enemies.forEach((enemy) => {
            enemy.y += ENEMY_VERTICAL_SPACING / 2;
            enemy.element.style.top = `${enemy.y}px`;
        });
        gameState.enemySpeed += 0.1;
    }
}

function checkCollisions() {
    gameState.bullets.forEach((bullet, bulletIndex) => {
        gameState.enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x < enemy.x + 30 &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + 30 &&
                bullet.y + 15 > enemy.y
            ) {
                gameContainer.removeChild(enemy.element);
                gameContainer.removeChild(bullet.element);
                gameState.enemies.splice(enemyIndex, 1);
                gameState.bullets.splice(bulletIndex, 1);
                gameState.score += 10;
                updateScoreBoard();

                if (gameState.enemies.length === 0) {
                    victory();
                }
            }
        });
    });

    gameState.enemyBullets.forEach((bullet, bulletIndex) => {
        if (
            bullet.x < gameState.player.x + 40 &&
            bullet.x + 5 > gameState.player.x &&
            bullet.y < gameState.player.y + 20 &&
            bullet.y + 15 > gameState.player.y
        ) {
            gameContainer.removeChild(bullet.element);
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

function shoot() {
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
}

function enemyShoot(currentTime) {
    if (gameState.enemies.length === 0) return; // Prevent shooting if there are no enemies
    if (currentTime - gameState.lastEnemyShot > gameState.enemyShootInterval) {
        const shootingEnemy = gameState.enemies[Math.floor(Math.random() * gameState.enemies.length)];
        const bullet = document.createElement('div');
        bullet.className = 'enemy-bullet game-object';
        bullet.style.left = `${shootingEnemy.x + 15}px`;
        bullet.style.top = `${shootingEnemy.y + 30}px`;
        gameContainer.appendChild(bullet);
        gameState.enemyBullets.push({
            element: bullet,
            x: shootingEnemy.x + 15,
            y: shootingEnemy.y + 30,
        });
        gameState.lastEnemyShot = currentTime;
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
    alert('You win! Final score: ' + gameState.score);
    gameOver();
}

function gameLoop(currentTime) {
    try {
        if (gameState.lastTime === 0) {
            gameState.lastTime = currentTime;
        }

        const delta = (currentTime - gameState.lastTime) / 16.67; // 60 FPS = 16.67ms per frame
        gameState.lastTime = currentTime;

        if (!gameState.isPaused && !gameState.isGameOver) {
            gameState.time += 16.67; // Increment time

            movePlayer(delta);
            moveBullets(delta);
            moveEnemies(delta);
            checkCollisions();
            enemyShoot(currentTime);
            updateScoreBoard();
        }
    } catch (error) {
        console.error('Error in game loop:', error);
    }

    requestAnimationFrame(gameLoop);
}

const keys = {};

document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    if (event.key === ' ') {
        shoot();
    }
    if (event.key === 'p') {
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

continueButton.addEventListener('click', () => {
    gameState.isPaused = false;
    pauseMenu.style.display = 'none';
});

restartButton.addEventListener('click', () => {
    location.reload();
});

newGameButton.addEventListener('click', () => {
    location.reload();
});

createEnemies();
requestAnimationFrame(gameLoop);