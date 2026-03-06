/**
 * PROJECT NEON JUSTICE
 * A Metal Slug style Side-scroller
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const weaponEl = document.getElementById('weapon-name');
const healthEl = document.getElementById('health-bar');
const overlay = document.getElementById('overlay');
const restartBtn = document.getElementById('restart-btn');

// --- Configuration ---
const WIDTH = 1024;
const HEIGHT = 576;
const GRAVITY = 0.8;
const GROUND_Y = HEIGHT - 80;

canvas.width = WIDTH;
canvas.height = HEIGHT;

// --- Game State ---
let gameState = {
    score: 0,
    health: 100,
    gameOver: false,
    currentWeapon: 'pistol'
};

const weapons = {
    pistol: {
        name: 'PISTOL',
        fireRate: 500, // ms
        damage: 10,
        speed: 12,
        color: '#00f2ff',
        type: 'single'
    },
    machine_gun: {
        name: 'H-MACHINE GUN',
        fireRate: 100,
        damage: 8,
        speed: 15,
        color: '#00f2ff',
        type: 'auto'
    },
    shotgun: {
        name: 'S-SHOTGUN',
        fireRate: 1200,
        damage: 50,
        speed: 10,
        color: '#ffdd00',
        type: 'burst'
    }
};

// --- Input Handling ---
const keys = {
    w: false, a: false, s: false, d: false,
    space: false, shift: false
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    if (e.code === 'Space') keys.space = true;
    if (e.code === 'ShiftLeft') keys.shift = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
    if (e.code === 'Space') keys.space = false;
    if (e.code === 'ShiftLeft') keys.shift = false;
});

// --- Classes ---

class Projectile {
    constructor(x, y, dx, dy, settings, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.settings = settings;
        this.active = true;
        this.isEnemy = isEnemy;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x < 0 || this.x > WIDTH || this.y < 0 || this.y > HEIGHT) {
            this.active = false;
        }
    }

    draw() {
        ctx.fillStyle = this.isEnemy ? '#ff00ff' : this.settings.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(this.x, this.y, 8, 4);
        ctx.shadowBlur = 0;
    }
}

class Player {
    constructor() {
        this.width = 40;
        this.height = 80;
        this.x = 100;
        this.y = GROUND_Y - this.height;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpForce = -15;
        this.grounded = false;
        this.facing = 1; // 1 for right, -1 for left
        this.lastShot = 0;

        // Animation States
        this.state = 'IDLE'; // IDLE, WALK, SHOOT_IDLE, SHOOT_WALK, DEATH
    }

    update() {
        if (gameState.gameOver) return;

        // X Movement
        if (keys.a) {
            this.vx = -this.speed;
            this.facing = -1;
        } else if (keys.d) {
            this.vx = this.speed;
            this.facing = 1;
        } else {
            this.vx = 0;
        }

        // Y Movement (Jump)
        if (keys.shift && this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;

        // Ground Collision
        if (this.y > GROUND_Y - this.height) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.grounded = true;
        }

        // Bounds
        this.x = Math.max(0, Math.min(this.x, WIDTH - this.width));

        // State Machine Logic
        this.determineState();

        // Shooting logic
        if (keys.space) {
            this.shoot();
        }
    }

    determineState() {
        const isShooting = (Date.now() - this.lastShot < 200);
        const isMoving = Math.abs(this.vx) > 0;

        if (gameState.health <= 0) {
            this.state = 'DEATH';
        } else if (isShooting) {
            this.state = isMoving ? 'SHOOT_WALK' : 'SHOOT_IDLE';
        } else if (isMoving) {
            this.state = 'WALK';
        } else {
            this.state = 'IDLE';
        }
    }

    shoot() {
        const weapon = weapons[gameState.currentWeapon];
        const now = Date.now();

        if (now - this.lastShot > weapon.fireRate) {
            this.lastShot = now;

            if (weapon.type === 'burst') {
                // Shotgun burst
                for (let i = -2; i <= 2; i++) {
                    projectiles.push(new Projectile(
                        this.x + (this.facing > 0 ? this.width : 0),
                        this.y + 30,
                        this.facing * weapon.speed,
                        i * 2,
                        weapon
                    ));
                }
            } else {
                projectiles.push(new Projectile(
                    this.x + (this.facing > 0 ? this.width : 0),
                    this.y + 30,
                    this.facing * weapon.speed,
                    0,
                    weapon
                ));
            }
        }
    }

    draw() {
        ctx.save();

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0, 242, 255, 0.5)';

        // Placeholder for Agent
        // Legs (Pernas) - Move based on state
        ctx.fillStyle = '#222';
        const legOffset = this.state === 'WALK' || this.state === 'SHOOT_WALK' ? Math.sin(Date.now() / 100) * 5 : 0;
        ctx.fillRect(this.x + 10, this.y + 60, 10, 20 + legOffset);
        ctx.fillRect(this.x + 20, this.y + 60, 10, 20 - legOffset);

        // Torso (Tronco)
        ctx.fillStyle = this.state === 'DEATH' ? '#444' : '#111';
        ctx.fillRect(this.x, this.y + 10, 40, 50);

        // Arm (Shoot visualization)
        if (this.state.includes('SHOOT')) {
            ctx.fillStyle = '#00f2ff';
            ctx.fillRect(this.x + (this.facing > 0 ? 30 : -10), this.y + 30, 20, 10);
        }

        // Head/Tie
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 15, this.y, 10, 15);
        ctx.fillStyle = '#f00'; // Neon tie
        ctx.fillRect(this.x + 18, this.y + 15, 4, 10);

        ctx.restore();
    }
}

class Enemy {
    constructor(x) {
        this.width = 40;
        this.height = 70;
        this.x = x;
        this.y = GROUND_Y - this.height;
        this.speed = 2;
        this.direction = -1;
        this.health = 30;
        this.lastShot = 0;
        this.patrolRange = 200;
        this.startX = x;
    }

    update() {
        // Simple Patrol
        this.x += this.speed * this.direction;
        if (Math.abs(this.x - this.startX) > this.patrolRange) {
            this.direction *= -1;
        }

        // Detection and Shooting (Detection on similar Y)
        const distanceToPlayer = this.x - player.x;
        if (Math.abs(distanceToPlayer) < 400 && Math.abs(player.y - this.y) < 100) {
            // Face player
            this.direction = distanceToPlayer > 0 ? -1 : 1;

            // Shoot pink laser
            if (Date.now() - this.lastShot > 1500) {
                this.lastShot = Date.now();
                projectiles.push(new Projectile(
                    this.x + (this.direction > 0 ? this.width : 0),
                    this.y + 25,
                    this.direction * 8,
                    0,
                    { color: '#ff00ff' },
                    true
                ));
            }
        }
    }

    draw() {
        ctx.fillStyle = '#ff00ff'; // Bunny Girl Pink
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';

        // Placeholder Bunny Ears
        ctx.fillRect(this.x + 5, this.y - 15, 10, 20);
        ctx.fillRect(this.x + 25, this.y - 15, 10, 20);

        // Body
        ctx.fillRect(this.x, this.y, 40, 70);

        ctx.shadowBlur = 0;
    }
}

// --- Game Logic ---

const player = new Player();
let enemies = [];
let projectiles = [];

function spawnEnemy() {
    if (enemies.length < 5) {
        enemies.push(new Enemy(WIDTH + Math.random() * 500));
    }
}

function handleCollisions() {
    projectiles.forEach((p, pIdx) => {
        if (!p.active) return;

        if (p.isEnemy) {
            // Player hit
            if (p.x < player.x + player.width && p.x + 8 > player.x &&
                p.y < player.y + player.height && p.y + 4 > player.y) {
                gameState.health -= 10;
                p.active = false;
                if (gameState.health <= 0) {
                    gameState.gameOver = true;
                }
            }
        } else {
            // Enemy hit
            enemies.forEach((e, eIdx) => {
                if (p.x < e.x + e.width && p.x + 8 > e.x &&
                    p.y < e.y + e.height && p.y + 4 > e.y) {
                    e.health -= p.settings.damage;
                    p.active = false;
                    if (e.health <= 0) {
                        enemies.splice(eIdx, 1);
                        gameState.score += 100;
                        // Random weapon drop
                        if (Math.random() < 0.2) {
                            gameState.currentWeapon = Math.random() < 0.5 ? 'machine_gun' : 'shotgun';
                        }
                    }
                }
            });
        }
    });

    // Cleanup inactive projectiles
    projectiles = projectiles.filter(p => p.active);
}

function updateUI() {
    scoreEl.textContent = gameState.score.toString().padStart(6, '0');
    weaponEl.textContent = weapons[gameState.currentWeapon].name;
    healthEl.style.width = `${gameState.health}%`;

    if (gameState.gameOver) {
        overlay.classList.remove('hidden');
    }
}

function drawBackground() {
    // Cyberpunk Grid/City Placeholder
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Grid Floor
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let i = 0; i < WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, GROUND_Y);
        ctx.lineTo(i, HEIGHT);
        ctx.stroke();
    }

    // Horizontal Floor Lines (Perspective-ish)
    for (let j = GROUND_Y; j < HEIGHT; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(WIDTH, j);
        ctx.stroke();
    }

    // Neon Ground Edge
    ctx.strokeStyle = '#9d00ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(WIDTH, GROUND_Y);
    ctx.stroke();
}

function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawBackground();

    if (!gameState.gameOver) {
        player.update();
        enemies.forEach(e => e.update());
        projectiles.forEach(p => p.update());

        handleCollisions();

        if (Math.random() < 0.01) spawnEnemy();
    }

    player.draw();
    enemies.forEach(e => e.draw());
    projectiles.forEach(p => p.draw());

    updateUI();
    requestAnimationFrame(gameLoop);
}

restartBtn.addEventListener('click', () => {
    gameState = {
        score: 0,
        health: 100,
        gameOver: false,
        currentWeapon: 'pistol'
    };
    player.x = 100;
    player.y = GROUND_Y - player.height;
    enemies = [];
    projectiles = [];
    overlay.classList.add('hidden');
});

// Start the game
gameLoop();
