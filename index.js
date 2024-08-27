const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreBoard = document.getElementById('score-board');
const pauseMenu = document.getElementById('pause-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const victoryMenu = document.getElementById('victory-menu');
const continueButton = document.getElementById('continue');
const restartButton = document.getElementById('restart');
const newGameButton = document.getElementById('new-game');
const newGameVictoryButton = document.getElementById('new-game-victory');

let gameState;

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
        enemyShootInterval: 1000,
        lastEnemyShot: 0
    };
    const logo = document.getElementById('logo');
    const scoreBoard = document.getElementById('score-board');
    gameContainer.innerHTML = '';
    gameContainer.appendChild(logo);
    gameContainer.appendChild(player);
    gameContainer.appendChild(scoreBoard);
    
    document.getElementById('time').textContent = '0';
    document.getElementById('score').textContent = '0';
    document.getElementById('lives').textContent = '3';
    createEnemies();
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 5;
const ENEMY_BULLET_SPEED = 5;
const ENEMY_ROWS = 5;
const ENEMY_COLS = 10;
const ENEMY_VERTICAL_SPACING = 40;
const ENEMY_HORIZONTAL_SPACING = 60;

function createEnemies() {
    const fragment = document.createDocumentFragment();
    for (let row = 0; row < ENEMY_ROWS; row++) {
        for (let col = 0; col < ENEMY_COLS; col++) {
            const enemy = document.createElement('div');
            enemy.className = 'enemy game-object';
            const x = col * ENEMY_HORIZONTAL_SPACING + 50;
            const y = row * ENEMY_VERTICAL_SPACING + 50;
            enemy.style.transform = `translate(${x}px, ${y}px)`;
            fragment.appendChild(enemy);
            gameState.enemies.push({ element: enemy, x, y });
        }
    }
    gameContainer.appendChild(fragment);
}

function movePlayer(delta) {
    if (keys.ArrowLeft && gameState.player.x > 0) {
        gameState.player.x = Math.max(0, gameState.player.x - PLAYER_SPEED * delta);
    }
    if (keys.ArrowRight && gameState.player.x < GAME_WIDTH - 40) {
        gameState.player.x = Math.min(GAME_WIDTH - 40, gameState.player.x + PLAYER_SPEED * delta);
    }
    player.style.transform = `translateX(${gameState.player.x}px)`;
}

function moveBullets(delta) {
    const removeBullets = [];
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.y -= BULLET_SPEED * delta;
        bullet.element.style.transform = `translate(${bullet.x}px, ${bullet.y}px)`;
        if (bullet.y < 0) {
            removeBullets.push(bullet.element);
            return false;
        }
        return true;
    });

    gameState.enemyBullets = gameState.enemyBullets.filter(bullet => {
        bullet.y += ENEMY_BULLET_SPEED * delta;
        bullet.element.style.transform = `translate(${bullet.x}px, ${bullet.y}px)`;
        if (bullet.y > GAME_HEIGHT) {
            removeBullets.push(bullet.element);
            return false;
        }
        return true;
    });

    removeBullets.forEach(element => gameContainer.removeChild(element));
}

function moveEnemies(delta) {
    let shouldChangeDirection = false;
    const enemySpeed = gameState.enemySpeed * delta;

    gameState.enemies.forEach(enemy => {
        enemy.x += gameState.enemyDirection * enemySpeed;
        if (enemy.x < 0 || enemy.x > GAME_WIDTH - 30) {
            shouldChangeDirection = true;
        }
    });

    if (shouldChangeDirection) {
        gameState.enemyDirection *= -1;
        gameState.enemies.forEach(enemy => {
            enemy.y += ENEMY_VERTICAL_SPACING / 2;
        });
        gameState.enemySpeed += 0.1;
    }

    gameState.enemies.forEach(enemy => {
        enemy.element.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;
    });
}

function checkCollisions() {
    const removeElements = [];

    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            if (
                bullet.x < enemy.x + 30 &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + 30 &&
                bullet.y + 15 > enemy.y
            ) {
                removeElements.push(enemy.element, bullet.element);
                gameState.enemies.splice(j, 1);
                gameState.bullets.splice(i, 1);
                gameState.score += 10;
                break;
            }
        }
    }

    for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = gameState.enemyBullets[i];
        if (
            bullet.x < gameState.player.x + 40 &&
            bullet.x + 5 > gameState.player.x &&
            bullet.y < gameState.player.y + 20 &&
            bullet.y + 15 > gameState.player.y
        ) {
            removeElements.push(bullet.element);
            gameState.enemyBullets.splice(i, 1);
            gameState.lives--;
            if (gameState.lives <= 0) {
                gameOver();
            }
        }
    }

    if (gameState.enemies.some(enemy => enemy.y + 70 > gameState.player.y)) {
        gameOver();
    }

    removeElements.forEach(element => gameContainer.removeChild(element));
    updateScoreBoard();

    if (gameState.enemies.length === 0) {
        victory();
    }
}

function shoot() {
    const bullet = document.createElement('div');
    bullet.className = 'bullet game-object';
    const x = gameState.player.x + 17.5;
    const y = gameState.player.y;
    bullet.style.transform = `translate(${x}px, ${y}px)`;
    gameContainer.appendChild(bullet);
    gameState.bullets.push({ element: bullet, x, y });
}

function enemyShoot(currentTime) {
    if (currentTime - gameState.lastEnemyShot > gameState.enemyShootInterval && gameState.enemies.length > 0) {
        const shootingEnemy = gameState.enemies[Math.floor(Math.random() * gameState.enemies.length)];
        const bullet = document.createElement('div');
        bullet.className = 'enemy-bullet game-object';
        const x = shootingEnemy.x + 12.5;
        const y = shootingEnemy.y + 30;
        bullet.style.transform = `translate(${x}px, ${y}px)`;
        gameContainer.appendChild(bullet);
        gameState.enemyBullets.push({ element: bullet, x, y });
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
    victoryMenu.style.display = 'block';
    document.getElementById('victory-time').textContent = (gameState.time / 1000).toFixed(1);
    document.getElementById('victory-score').textContent = gameState.score;
}

let lastRenderTime = 0;
function gameLoop(currentTime) {
    if (gameState.isGameOver) return;

    const delta = (currentTime - lastRenderTime) / 16.67; // 60 FPS = 16.67ms per frame
    lastRenderTime = currentTime;

    if (!gameState.isPaused) {
        gameState.time += 16.67; // Increment time

        movePlayer(delta);
        moveBullets(delta);
        moveEnemies(delta);
        checkCollisions();
        enemyShoot(currentTime);
        updateScoreBoard();
    }

    requestAnimationFrame(gameLoop);
}

const keys = {};

document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    if (event.key === ' ' && !gameState.isPaused && !gameState.isGameOver) {
        shoot();
        event.preventDefault();
    }
    if (event.key === 'Escape' && !gameState.isGameOver) {
        gameState.isPaused = !gameState.isPaused;
        pauseMenu.style.display = gameState.isPaused ? 'block' : 'none';
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

newGameVictoryButton.addEventListener('click', () => {
    location.reload();
});

resetGameState();
requestAnimationFrame(gameLoop);