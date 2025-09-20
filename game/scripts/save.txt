        // Game Variables
        let canvas, ctx;
        let camera = { x: 0, y: 0 };
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let cameraStart = { x: 0, y: 0 };
        let zoom = 0.5;
        const MIN_ZOOM = 0.5;
        const MAX_ZOOM = 1.5;
        const MAP_WIDTH = 2000;
        const MAP_HEIGHT = 1200;
        let gameRunning = false;
        let gameState = {
            money: 100,
            lives: 10,
            score: 0,
            wave: 1,
            selectedTower: null,
            sellMode: false,
            towers: [],
            enemies: [],
            projectiles: [],
            effects: [],
            enemySpawnTimer: 0,
            waveTimer: 0,
            countdownTimer: 5,
            showCountdown: false,
            enemiesInWave: 5,
            enemiesSpawned: 0,
            mouseX: 0,
            mouseY: 0
        };

        // Game Constants
        const GRID_SIZE = 40;
        const TOWER_TYPES = {
            basic: { 
                cost: 50, damage: 20, range: 80, fireRate: 60, color: '#ff6b35', shape: 'star',
                name: 'Basic Tower', description: 'Balanced tower for beginners. Good cost-benefit ratio.'
            },
            fast: { 
                cost: 75, damage: 15, range: 70, fireRate: 30, color: '#10b981', shape: 'square',
                name: 'Fast Tower', description: 'Shoot rapidly, ideal for enemies in groups.'
            },
            strong: { 
                cost: 100, damage: 40, range: 90, fireRate: 90, color: '#ef4444', shape: 'pentagon',
                name: 'Strong Tower', description: 'High Damage, ideal for resistive enemies.'
            },
            sniper: { 
                cost: 150, damage: 60, range: 150, fireRate: 120, color: '#8b5cf6', shape: 'diamond',
                name: 'Sniper Tower', description: 'Long range and high damage, but shoots slower.'
            },
            splash: { 
                cost: 120, damage: 25, range: 75, fireRate: 75, color: '#f59e0b', shape: 'hexagon',
                name: 'Explosive Tower', description: 'Causes damage in an area, attacks multiple enemies.'
            },
            slow: { 
                cost: 90, damage: 8, range: 85, fireRate: 50, color: '#06b6d4', shape: 'square',
                name: 'Ice Tower', description: 'Slows down enemies, allowing strategic control.',
                slowFactor: 0.5, slowDuration: 3000
            },
            poison: {
                cost: 110, damage: 5, range: 80, fireRate: 70, color: '#22c55e', shape: 'circle',
                name: 'Poison Tower', description: 'Poison enemies causing continuous damage.',
                poisonDamage: 3, poisonDuration: 4000
            },
            lightning: {
                cost: 200, damage: 25, range: 150, fireRate: 150, color: '#aaddee', shape: 'pentagon',
                name: 'Lightning Tower', description: 'Shoots lightning at enemies, attacking multipe enemies from long distances.'
            }
        };
        
        // Global Upgrades
        const TOWER_UPGRADES = {
            basic: { damage: 0, range: 0, fireRate: 0, special: 0 },
            fast: { damage: 0, range: 0, fireRate: 0, special: 0 },
            strong: { damage: 0, range: 0, fireRate: 0, special: 0 },
            sniper: { damage: 0, range: 0, fireRate: 0, special: 0 },
            splash: { damage: 0, range: 0, fireRate: 0, special: 0 },
            slow: { damage: 0, range: 0, fireRate: 0, special: 0 },
            poison: { damage: 0, range: 0, fireRate: 0, special: 0 },
            lightning: { damage: 0, range: 0, fireRate: 0, special: 0 }
        };

        // Game Path
        const PATH = [
            {x: 0, y: 300}, {x: 220, y: 300}, {x: 220, y: 100}, {x: 420, y: 100},
            {x: 420, y: 380}, {x: 620, y: 380}, {x: 620, y: 220}, {x: 820, y: 220},
            {x: 820, y: 420}, {x: 1000, y: 420}
        ];

        // Initialize Game
        function startGame() {
            canvas = document.getElementById('gameCanvas');
            ctx = canvas.getContext('2d');
            
            setupEventListeners();
            resetGame();
            gameRunning = true;
            gameLoop();
        }

        function resetGame() {
            gameState = {
                money: 100,
                lives: 10,
                score: 0,
                wave: 1,
                selectedTower: null,
                sellMode: false,
                towers: [],
                enemies: [],
                projectiles: [],
                effects: [],
                enemySpawnTimer: 0,
                waveTimer: 60,
                countdownTimer: 5,
                showCountdown: false,
                enemiesInWave: 5,
                enemiesSpawned: 0,
                mouseX: 0,
                mouseY: 0
            };
            updateUI();
        }

        function restartGame() {
            document.getElementById('gameOverScreen').classList.add('hidden');
            resetGame();
            gameRunning = true;
            gameLoop();
        }

        function setupEventListeners() {
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) / zoom + camera.x;
                const mouseY = (e.clientY - rect.top) / zoom + camera.y;
                gameState.mouseX = mouseX;
                gameState.mouseY = mouseY;
                if (isDragging) {
                    camera.x = cameraStart.x + (dragStart.x - e.clientX) / zoom;
                    camera.y = cameraStart.y + (dragStart.y - e.clientY) / zoom;
                    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - canvas.width / zoom));
                    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - canvas.height / zoom));
                }
            });
            canvas.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    isDragging = true;
                    dragStart.x = e.clientX;
                    dragStart.y = e.clientY;
                    cameraStart.x = camera.x;
                    cameraStart.y = camera.y;
                }
            });
            canvas.addEventListener('mouseup', (e) => {
                if (e.button === 0) {
                    isDragging = false;
                }
            });
            canvas.addEventListener('mouseleave', () => {
                isDragging = false;
            });
            canvas.addEventListener('wheel', (e) => {
                const prevZoom = zoom;
                if (e.deltaY < 0) {
                    zoom = Math.min(MAX_ZOOM, zoom + 0.1);
                } else {
                    zoom = Math.max(MIN_ZOOM, zoom - 0.1);
                }
                const rect = canvas.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) / prevZoom + camera.x;
                const mouseY = (e.clientY - rect.top) / prevZoom + camera.y;
                camera.x = mouseX - (e.clientX - rect.left) / zoom;
                camera.y = mouseY - (e.clientY - rect.top) / zoom;
                camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - canvas.width / zoom));
                camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - canvas.height / zoom));
                e.preventDefault();
            });

            canvas.addEventListener('click', (e) => {
                if (!gameRunning) return;
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / zoom + camera.x;
                const y = (e.clientY - rect.top) / zoom + camera.y;
                if (gameState.sellMode) {
                    // Sell Mode: find clicked tower
                    let towerIndex = -1;
                    gameState.towers.forEach((tower, index) => {
                        const dx = x - tower.x;
                        const dy = y - tower.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance <= 20) {
                            towerIndex = index;
                        }
                    });
                    if (towerIndex >= 0) {
                        sellTower(towerIndex);
                    }
                } else if (gameState.selectedTower) {
                    placeTower(x, y);
                }
            });
            
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (!gameRunning) return;
                
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Find tower clicked with right button
                let towerIndex = -1;
                gameState.towers.forEach((tower, index) => {
                    const dx = x - tower.x;
                    const dy = y - tower.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= 20) {
                        towerIndex = index;
                    }
                });
                
                if (towerIndex >= 0) {
                    showTowerConfig(gameState.towers[towerIndex], towerIndex);
                }
            });

            // Add keyboard events
            document.addEventListener('keydown', (e) => {
                if (!gameRunning) return;
                
                const key = e.key;
                
                // Keys for selecting towers (1-8)
                if (key >= '1' && key <= '8') {
                    const towerTypes = ['basic', 'fast', 'strong', 'sniper', 'splash', 'slow', 'poison', 'lightning'];
                    const towerType = towerTypes[parseInt(key) - 1];
                    if (towerType) {
                        selectTower(towerType);
                    }
                }
                
                // Key DEL for activating/unactivating sell mode
                if (key === 'Delete' || key === 'Del') {
                    toggleSellMode();
                }
                
                // ESC to cancel selection
                if (key === 'Escape') {
                    gameState.selectedTower = null;
                    gameState.sellMode = false;
                    updateTowerButtons();
                }
            });
        }

        function selectTower(type) {
            // If the same tower is selected, remove selection
            if (gameState.selectedTower === type) {
                gameState.selectedTower = null;
                document.getElementById(`${type}TowerBtn`).classList.remove('ring-2', 'ring-primary');
                return;
            }
            
            const towerType = TOWER_TYPES[type];
            if (gameState.money >= towerType.cost) {
                // Unactivate sell mode if it is active
                if (gameState.sellMode) {
                    toggleSellMode();
                }
                
                gameState.selectedTower = type;
                
                // Visual feedback - remove previous selection
                document.querySelectorAll('[id$="TowerBtn"]').forEach(btn => {
                    btn.classList.remove('ring-2', 'ring-primary');
                });
                
                // Add selection of the new tower
                document.getElementById(`${type}TowerBtn`).classList.add('ring-2', 'ring-primary');
            }
        }

        function placeTower(x, y) {
            const gridX = Math.floor(x / GRID_SIZE) * GRID_SIZE;
            const gridY = Math.floor(y / GRID_SIZE) * GRID_SIZE;
            
            if (isValidTowerPosition(gridX, gridY)) {
                const towerType = TOWER_TYPES[gameState.selectedTower];
                gameState.money -= towerType.cost;
                
                const newTower = {
                    x: gridX + GRID_SIZE / 2,
                    y: gridY + GRID_SIZE / 2,
                    type: gameState.selectedTower,
                    lastFire: 0,
                    ...towerType
                };
                gameState.towers.push(newTower);
                
                // Visual Effect for tower placement
                createTowerPlacementEffect(newTower.x, newTower.y, towerType.color);
                
                // Remove selection of the tower after placing
                gameState.selectedTower = null;
                document.querySelectorAll('[id$="TowerBtn"]').forEach(btn => {
                    btn.classList.remove('ring-2', 'ring-primary');
                });
                
                updateUI();
            }
        }

        function isValidTowerPosition(x, y) {
            // Check if position is on path
            for (let i = 0; i < PATH.length - 1; i++) {
                const start = PATH[i];
                const end = PATH[i + 1];
                if (isPointOnPathSegment(x + GRID_SIZE/2, y + GRID_SIZE/2, start, end, 30)) {
                    return false;
                }
            }
            
            // Check if position is occupied by another tower
            return !gameState.towers.some(tower => 
                Math.abs(tower.x - (x + GRID_SIZE/2)) < GRID_SIZE && 
                Math.abs(tower.y - (y + GRID_SIZE/2)) < GRID_SIZE
            );
        }

        function isPointOnPathSegment(px, py, start, end, width) {
            const A = px - start.x;
            const B = py - start.y;
            const C = end.x - start.x;
            const D = end.y - start.y;
            
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            if (lenSq !== 0) param = dot / lenSq;
            
            let xx, yy;
            if (param < 0) {
                xx = start.x;
                yy = start.y;
            } else if (param > 1) {
                xx = end.x;
                yy = end.y;
            } else {
                xx = start.x + param * C;
                yy = start.y + param * D;
            }
            
            const dx = px - xx;
            const dy = py - yy;
            return Math.sqrt(dx * dx + dy * dy) <= width;
        }

        // Visual Effect functions
        function createTowerPlacementEffect(x, y, color) {
            for (let i = 0; i < 12; i++) {
                gameState.effects.push({
                    type: 'explosion',
                    x: x + (Math.random() - 0.5) * 40,
                    y: y + (Math.random() - 0.5) * 40,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    color: color,
                    life: 30,
                    maxLife: 30,
                    size: Math.random() * 8 + 4
                });
            }
        }

        function createHitEffect(x, y, damage) {
            for (let i = 0; i < 8; i++) {
                gameState.effects.push({
                    type: 'damage',
                    x: x + (Math.random() - 0.5) * 20,
                    y: y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    color: '#ff6b35',
                    life: 20,
                    maxLife: 20,
                    size: Math.random() * 4 + 2
                });
            }
            
            // Damage text
            gameState.effects.push({
                type: 'text',
                x: x,
                y: y,
                text: `-${damage}`,
                color: '#ff6b35',
                life: 60,
                maxLife: 60,
                vy: -2
            });
        }

        function createKillEffect(x, y, money) {
            for (let i = 0; i < 8; i++) {
                gameState.effects.push({
                    type: 'explosion',
                    x: x + (Math.random() - 0.5) * 20,
                    y: y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    color: '#ffd700',
                    life: 25,
                    maxLife: 25,
                    size: Math.random() * 6 + 3
                });
            }
            
            // Money text
            gameState.effects.push({
                type: 'text',
                x: x,
                y: y - 20,
                text: `+${money}💰`,
                color: '#ffd700',
                life: 90,
                maxLife: 90,
                vy: -1.5
            });
        }

        function createLifeLossEffect() {
            // Position the explosion of the exit for enemies (end of PATH)
            const exitPoint = PATH[PATH.length - 1];
            for (let i = 0; i < 20; i++) {
                gameState.effects.push({
                    type: 'explosion',
                    x: exitPoint.x + (Math.random() - 0.5) * 60,
                    y: exitPoint.y + (Math.random() - 0.5) * 60,
                    vx: (Math.random() - 0.5) * 12,
                    vy: (Math.random() - 0.5) * 12,
                    color: '#ef4444',
                    life: 50,
                    maxLife: 50,
                    size: Math.random() * 15 + 8
                });
            }
        }

        function spawnEnemy() {
            if (gameState.enemiesSpawned < gameState.enemiesInWave) {
                gameState.enemies.push({
                    x: PATH[0].x,
                    y: PATH[0].y,
                    health: 30 + gameState.wave * 10,
                    maxHealth: 30 + gameState.wave * 10,
                    speed: 1.5 + gameState.wave * 0.15,
                    pathIndex: 0,
                    progress: 0,
                    radius: 12 + gameState.wave * 0.5
                });
                gameState.enemiesSpawned++;
            }
        }

        function updateEnemies() {
            gameState.enemies.forEach((enemy, index) => {
                if (enemy.pathIndex < PATH.length - 1) {
                    const current = PATH[enemy.pathIndex];
                    const next = PATH[enemy.pathIndex + 1];
                    
                    const dx = next.x - current.x;
                    const dy = next.y - current.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const effectiveSpeed = enemy.slowedUntil && Date.now() < enemy.slowedUntil ? 
                        enemy.speed * (enemy.slowFactor || 1) : enemy.speed;
                    
                    // Process poison damage
                    if (enemy.poisonedUntil && Date.now() < enemy.poisonedUntil) {
                        if (Date.now() - enemy.lastPoisonDamage >= 1000) { // Damage per second
                            enemy.health -= enemy.poisonDamage;
                            enemy.lastPoisonDamage = Date.now();
                            
                            // Visual effect for poison damage
                            for (let i = 0; i < 5; i++) {
                                gameState.effects.push({
                                    type: 'poison',
                                    x: enemy.x + (Math.random() - 0.5) * 20,
                                    y: enemy.y + (Math.random() - 0.5) * 20,
                                    vx: (Math.random() - 0.5) * 2,
                                    vy: (Math.random() - 0.5) * 2 - 1,
                                    color: '#22c55e',
                                    life: 30,
                                    maxLife: 30,
                                    size: Math.random() * 4 + 2
                                });
                            }
                        }
                    }
                    
                    enemy.progress += (effectiveSpeed * gameSpeed) / distance;
                    
                    if (enemy.progress >= 1) {
                        enemy.progress = 0;
                        enemy.pathIndex++;
                    }
                    
                    if (enemy.pathIndex < PATH.length - 1) {
                        const currentPos = PATH[enemy.pathIndex];
                        const nextPos = PATH[enemy.pathIndex + 1];
                        enemy.x = currentPos.x + (nextPos.x - currentPos.x) * enemy.progress;
                        enemy.y = currentPos.y + (nextPos.y - currentPos.y) * enemy.progress;
                    }
                } else {
                    // Enemy reached the end
                    gameState.lives--;
                    createLifeLossEffect();
                    gameState.enemies.splice(index, 1);
                    updateUI();
                    
                    if (gameState.lives <= 0) {
                        gameOver();
                    }
                }
            });
        }

        function findNearestEnemy(tower) {
            let nearest = null;
            let minDistance = tower.range;
            
            gameState.enemies.forEach(enemy => {
                const distance = Math.sqrt(
                    Math.pow(enemy.x - tower.x, 2) + Math.pow(enemy.y - tower.y, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = enemy;
                }
            });
            
            return nearest;
        }

        function fireProjectile(tower, target) {
            const dx = target.x - tower.x;
            const dy = target.y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const upgrades = TOWER_UPGRADES[tower.type];
            const modifiedDamage = tower.damage + upgrades.damage * (tower.type === 'strong' ? 10 : tower.type === 'sniper' ? 15 : 5);
            
            gameState.projectiles.push({
                x: tower.x,
                y: tower.y,
                targetX: target.x,
                targetY: target.y,
                vx: (dx / distance) * 15,
                vy: (dy / distance) * 15,
                damage: modifiedDamage,
                color: tower.color,
                trail: [],
                maxTrailLength: 15,
                type: tower.type,
                splashRadius: tower.type === 'splash' || tower.type === 'lightning' ? 50 + (upgrades.special * 15) : 0,
                slowFactor: tower.type === 'slow' ? 0.5 - (upgrades.special * 0.1) : 0,
                slowDuration: tower.type === 'slow' ? 3000 : 0,
                poisonDamage: tower.type === 'poison' ? 3 + upgrades.special : 0,
                poisonDuration: tower.type === 'poison' ? 4000 + (upgrades.special * 1000) : 0
            });
        }

        function updateProjectiles() {
            gameState.projectiles.forEach((projectile, pIndex) => {
                // Add trail
                projectile.trail.push({x: projectile.x, y: projectile.y});
                if (projectile.trail.length > projectile.maxTrailLength) {
                    projectile.trail.shift();
                }
                
                projectile.x += projectile.vx;
                projectile.y += projectile.vy;
                
                // Check collision with enemies
                gameState.enemies.forEach((enemy, eIndex) => {
                    const dx = projectile.x - enemy.x;
                    const dy = projectile.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < enemy.radius + 8) {
                        createHitEffect(enemy.x, enemy.y, projectile.damage);
                        
                        // Area damage for explosive tower and lightning tower
                        if (projectile.type === 'splash' || projectile.type === 'lightning') {
                            gameState.enemies.forEach((nearbyEnemy, nearbyIndex) => {
                                const nearbyDistance = Math.sqrt(
                                    Math.pow(nearbyEnemy.x - enemy.x, 2) + 
                                    Math.pow(nearbyEnemy.y - enemy.y, 2)
                                );
                                if (nearbyDistance <= projectile.splashRadius) {
                                    const splashDamage = Math.max(projectile.damage * (1 - nearbyDistance / projectile.splashRadius), projectile.damage * 0.3);
                                    nearbyEnemy.health -= splashDamage;
                                    if (nearbyEnemy !== enemy) {
                                        createHitEffect(nearbyEnemy.x, nearbyEnemy.y, splashDamage);
                                    }
                                }
                            });
                            
                            // Visual effect of explosion
                            for (let i = 0; i < 20; i++) {
                                gameState.effects.push({
                                    type: 'explosion',
                                    x: enemy.x + (Math.random() - 0.5) * (projectile.splashRadius * 2),
                                    y: enemy.y + (Math.random() - 0.5) * (projectile.splashRadius * 2),
                                    vx: (Math.random() - 0.5) * 12,
                                    vy: (Math.random() - 0.5) * 12,
                                    color: projectile.color,
                                    life: 30,
                                    maxLife: 30,
                                    size: Math.random() * 10 + 5
                                });
                            }
                        } 
                        // Ice Effect
                        else if (projectile.type === 'slow') {
                            enemy.health -= projectile.damage;
                            enemy.slowedUntil = Date.now() + projectile.slowDuration;
                            enemy.slowFactor = projectile.slowFactor;
                            
                            // Visual Effect of ice
                            for (let i = 0; i < 10; i++) {
                                gameState.effects.push({
                                    type: 'ice',
                                    x: enemy.x + (Math.random() - 0.5) * 40,
                                    y: enemy.y + (Math.random() - 0.5) * 40,
                                    vx: (Math.random() - 0.5) * 4,
                                    vy: (Math.random() - 0.5) * 4,
                                    color: '#06b6d4',
                                    life: 60,
                                    maxLife: 60,
                                    size: Math.random() * 6 + 3
                                });
                            }
                        }
                        // Poison Effect
                        else if (projectile.type === 'poison') {
                            enemy.health -= projectile.damage;
                            enemy.poisonedUntil = Date.now() + projectile.poisonDuration;
                            enemy.poisonDamage = projectile.poisonDamage;
                            enemy.lastPoisonDamage = Date.now();
                            
                            // Visual effect for poison
                            for (let i = 0; i < 15; i++) {
                                gameState.effects.push({
                                    type: 'poison',
                                    x: enemy.x + (Math.random() - 0.5) * 40,
                                    y: enemy.y + (Math.random() - 0.5) * 40,
                                    vx: (Math.random() - 0.5) * 3,
                                    vy: (Math.random() - 0.5) * 3 - 2,
                                    color: '#22c55e',
                                    life: 80,
                                    maxLife: 80,
                                    size: Math.random() * 8 + 4
                                });
                            }
                        } else {
                            enemy.health -= projectile.damage;
                        }
                        
                        gameState.projectiles.splice(pIndex, 1);
                        
                        // Verify dead enemies after damage (including area damage)
                        gameState.enemies.forEach((checkEnemy, checkIndex) => {
                            if (checkEnemy.health <= 0) {
                                const money = 10 + gameState.wave * 2;
                                gameState.money += money;
                                gameState.score += 50 + gameState.wave * 10;
                                createKillEffect(checkEnemy.x, checkEnemy.y, money);
                                gameState.enemies.splice(checkIndex, 1);
                            }
                        });
                        
                        updateUI();
                    }
                });
                
                // Remove projectiles that are off-screen
                if (projectile.x < -50 || projectile.x > canvas.width + 50 || 
                    projectile.y < -50 || projectile.y > canvas.height + 50) {
                    gameState.projectiles.splice(pIndex, 1);
                }
            });
        }

        function updateEffects() {
            // Limit number of visual effects for preformance
            if (gameState.effects.length > 500) {
                gameState.effects.splice(0, gameState.effects.length - 500);
            }
            
            gameState.effects.forEach((effect, index) => {
                effect.life -= gameSpeed;
                
                if (effect.type === 'explosion' || effect.type === 'damage' || effect.type === 'ice' || effect.type === 'poison') {
                    effect.x += effect.vx * gameSpeed;
                    effect.y += effect.vy * gameSpeed;
                    effect.vx *= 0.98;
                    effect.vy *= 0.98;
                } else if (effect.type === 'text') {
                    effect.y += effect.vy * gameSpeed;
                }
                
                if (effect.life <= 0) {
                    gameState.effects.splice(index, 1);
                }
            });
        }

        function updateWaveSystem() {
            if (!gameState.showCountdown) {
                if (gameState.enemySpawnTimer <= 0 && gameState.enemiesSpawned < gameState.enemiesInWave) {
                    spawnEnemy();
                    gameState.enemySpawnTimer = 45; // Spawn every 0.75 seconds at 60fps
                } else {
                    gameState.enemySpawnTimer -= gameSpeed;
                }
                
                // Check if wave is complete
                if (gameState.enemiesSpawned >= gameState.enemiesInWave && gameState.enemies.length === 0) {
                    gameState.showCountdown = true;
                    gameState.countdownTimer = 5;
                    document.getElementById('countdownContainer').classList.remove('hidden');
                    // Initialize progress bar to full
                    document.getElementById('progressBar').style.width = '100%';
                }
            } else {
                // Countdown between waves
                gameState.waveTimer -= gameSpeed;
                
                // Update progress bar smoothly based on total remaining time
                const totalTimeLeft = Math.max(0, gameState.countdownTimer * 60 + gameState.waveTimer);
                const totalTime = 5 * 60; // 5 seconds * 60 frames
                const progress = Math.max(0, (totalTimeLeft / totalTime) * 100);
                document.getElementById('progressBar').style.width = progress + '%';
                
                if (gameState.waveTimer <= 0 && gameState.countdownTimer > 0) {
                    gameState.countdownTimer--;
                    document.getElementById('countdown').textContent = Math.max(0, gameState.countdownTimer);
                    gameState.waveTimer = 60; // Reset timer for next second
                }
                
                // Only hide when progress bar actually reaches 0%
                if (totalTimeLeft <= 0) {
                    // Start next wave
                    gameState.wave++;
                    gameState.enemiesInWave = Math.floor(5 + gameState.wave * 1.5);
                    gameState.enemiesSpawned = 0;
                    gameState.showCountdown = false;
                    document.getElementById('countdownContainer').classList.add('hidden');
                    updateUI();
                }
            }
        }

        // Function for drawing the shape of the towers
        function drawTowerShape(x, y, size, shape, color) {
            ctx.save();
            ctx.translate(x, y);
            
            // Shadow
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            
            ctx.fillStyle = color;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            
            switch(shape) {
                case 'star':
                    const spikes = 5;
                    const outerRadius = size;
                    const innerRadius = size * 0.5;
                    for (let i = 0; i < spikes * 2; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const angle = (i / (spikes * 2)) * Math.PI * 2;
                        const px = Math.cos(angle) * radius;
                        const py = Math.sin(angle) * radius;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    break;
                    
                case 'square':
                    ctx.rect(-size, -size, size * 2, size * 2);
                    break;
                    
                case 'pentagon':
                    const sides = 5;
                    for (let i = 0; i < sides; i++) {
                        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
                        const px = Math.cos(angle) * size;
                        const py = Math.sin(angle) * size;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    break;
                    
                case 'diamond':
                    ctx.moveTo(0, -size);
                    ctx.lineTo(size * 0.7, 0);
                    ctx.lineTo(0, size);
                    ctx.lineTo(-size * 0.7, 0);
                    ctx.closePath();
                    break;
                    
                case 'hexagon':
                    const hexSides = 6;
                    for (let i = 0; i < hexSides; i++) {
                        const angle = (i / hexSides) * Math.PI * 2;
                        const px = Math.cos(angle) * size;
                        const py = Math.sin(angle) * size;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    break;
                    
                case 'circle':
                    ctx.arc(0, 0, size, 0, Math.PI * 2);
                    break;
            }
            
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        function draw() {
            // Clear canvas with gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#0a0a0a');
            gradient.addColorStop(0.5, '#1a1a1a');
            gradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = gradient;
            ctx.save();
            ctx.setTransform(zoom, 0, 0, zoom, -camera.x * zoom, -camera.y * zoom);
            ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
            
            // Draw grid simples (optimized)
            ctx.strokeStyle = 'rgba(255, 107, 53, 0.15)';
            ctx.lineWidth = 0.5;
            
            for (let x = 0; x <= MAP_WIDTH; x += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, MAP_HEIGHT);
                ctx.stroke();
            }
            for (let y = 0; y <= MAP_HEIGHT; y += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(MAP_WIDTH, y);
                ctx.stroke();
            }
            
            // Draw path with least saturated color
            ctx.strokeStyle = '#8B5A2B';
            ctx.lineWidth = 40;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = '#8B5A2B';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(PATH[0].x, PATH[0].y);
            for (let i = 1; i < PATH.length; i++) {
                ctx.lineTo(PATH[i].x, PATH[i].y);
            }
            ctx.stroke();
            
            // Internal line of the path
            ctx.strokeStyle = '#A0522D';
            ctx.lineWidth = 30;
            ctx.shadowBlur = 0;
            ctx.stroke();
            
            ctx.shadowBlur = 0;
            
            // Draw projectiles with better trails
            gameState.projectiles.forEach(projectile => {
                // Draw continuous trail
                if (projectile.trail && projectile.trail.length > 1) {
                    ctx.strokeStyle = projectile.color;
                    ctx.shadowColor = projectile.color;
                    ctx.shadowBlur = 8;
                    
                    for (let i = 0; i < projectile.trail.length - 1; i++) {
                        const alpha = (i / projectile.trail.length) * 0.9;
                        const width = (i / projectile.trail.length) * 8 + 2;
                        
                        ctx.lineWidth = width;
                        ctx.globalAlpha = alpha;
                        
                        ctx.beginPath();
                        ctx.moveTo(projectile.trail[i].x, projectile.trail[i].y);
                        ctx.lineTo(projectile.trail[i + 1].x, projectile.trail[i + 1].y);
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                }
                
             // First projectile with intense sparkles
                ctx.fillStyle = projectile.color;
                ctx.shadowColor = projectile.color;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Bright center
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.shadowBlur = 0;
            
            // Draw towers with shapes and brightness
            gameState.towers.forEach(tower => {
                // Tower range (when hovering)
                if (gameState.selectedTower) {
                    ctx.fillStyle = `${tower.color}20`;
                    ctx.beginPath();
                    ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                drawTowerShape(tower.x, tower.y, 18, tower.shape, tower.color);
            });
            
            // Draw enemies with brightness and shadows
            gameState.enemies.forEach(enemy => {
                // Verify effects
                const isSlowed = enemy.slowedUntil && Date.now() < enemy.slowedUntil;
                const isPoisoned = enemy.poisonedUntil && Date.now() < enemy.poisonedUntil;
                
                // Determinar color based on the effect
                let color = '#ef4444';
                let innerColor = '#ff6666';
                if (isPoisoned) {
                    color = '#22c55e';
                    innerColor = '#4ade80';
                } else if (isSlowed) {
                    color = '#06b6d4';
                    innerColor = '#67e8f9';
                }
                
                // Shadow of the enemy
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner circle
                ctx.shadowBlur = 0;
                ctx.fillStyle = innerColor;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius * 0.7, 0, Math.PI * 2);
                ctx.fill();
                
                // Extra effects
                if (isSlowed) {
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
                    ctx.beginPath();
                    ctx.arc(enemy.x, enemy.y, enemy.radius * 1.2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                if (isPoisoned) {
                    ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
                    ctx.beginPath();
                    ctx.arc(enemy.x, enemy.y, enemy.radius * 1.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Health bar with brightness
                const barWidth = enemy.radius * 2.5;
                const barHeight = 6;
                const healthPercent = enemy.health / enemy.maxHealth;
                
                // Bar Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.radius - 15, barWidth, barHeight);
                
                // Health Bar
                const healthColor = healthPercent > 0.5 ? '#10b981' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
                ctx.fillStyle = healthColor;
                ctx.shadowColor = healthColor;
                ctx.shadowBlur = 10;
                ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.radius - 15, barWidth * healthPercent, barHeight);
            });
            
            ctx.shadowBlur = 0;
            
            // Draw effects
            gameState.effects.forEach(effect => {
                const alpha = effect.life / effect.maxLife;
                
                if (effect.type === 'explosion' || effect.type === 'damage') {
                    ctx.fillStyle = effect.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                    ctx.shadowColor = effect.color;
                    ctx.shadowBlur = effect.size;
                    
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                } else if (effect.type === 'text') {
                    ctx.fillStyle = effect.color;
                    ctx.font = 'bold 16px Inter';
                    ctx.shadowColor = effect.color;
                    ctx.shadowBlur = 10;
                    ctx.textAlign = 'center';
                    ctx.globalAlpha = alpha;
                    ctx.fillText(effect.text, effect.x, effect.y);
                    ctx.globalAlpha = 1;
                }
            });
            
            ctx.shadowBlur = 0;
            
            // Draw tower preview
            if (gameState.selectedTower) {
                const gridX = Math.floor(gameState.mouseX / GRID_SIZE) * GRID_SIZE;
                const gridY = Math.floor(gameState.mouseY / GRID_SIZE) * GRID_SIZE;
                const centerX = gridX + GRID_SIZE / 2;
                const centerY = gridY + GRID_SIZE / 2;
                const towerType = TOWER_TYPES[gameState.selectedTower];
                const isValid = isValidTowerPosition(gridX, gridY);
            ctx.restore();
                
                // Range preview
                ctx.fillStyle = isValid ? `${towerType.color}30` : '#ef444430';
                ctx.beginPath();
                ctx.arc(centerX, centerY, towerType.range, 0, Math.PI * 2);
                ctx.fill();
                
                // Tower preview
                ctx.globalAlpha = 0.8;
                drawTowerShape(centerX, centerY, 18, towerType.shape, isValid ? towerType.color : '#ef4444');
                ctx.globalAlpha = 1;
                
                // Pulsating grid highlight
                ctx.strokeStyle = isValid ? '#10b981' : '#ef4444';
                ctx.lineWidth = 4;
                ctx.shadowColor = isValid ? '#10b981' : '#ef4444';
                ctx.shadowBlur = 15;
                ctx.strokeRect(gridX, gridY, GRID_SIZE, GRID_SIZE);
                ctx.shadowBlur = 0;
            }
        }

        function updateUI() {
            document.getElementById('money').textContent = gameState.money;
            document.getElementById('lives').textContent = gameState.lives;
            document.getElementById('score').textContent = gameState.score;
            document.getElementById('wave').textContent = gameState.wave;
            
            // Update tower button states
            Object.keys(TOWER_TYPES).forEach(type => {
                const btn = document.getElementById(type + 'TowerBtn');
                if (gameState.money < TOWER_TYPES[type].cost) {
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                    btn.disabled = true;
                } else {
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                    btn.disabled = false;
                }
            });
        }

        function gameOver() {
            gameRunning = false;
            document.getElementById('finalScore').textContent = gameState.score;
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }

        function gameLoop() {
            if (!gameRunning) return;
            
            if (!isPaused) {
                updateEnemies();
                updateTowers();
                updateProjectiles();
                updateEffects();
                updateWaveSystem();
            }
            
            draw();
            requestAnimationFrame(gameLoop);
        }

        // Function for new systems
        let currentTowerBeingConfigured = null;
        let isPaused = false;
        let gameSpeed = 1;
        let currentUpgradeTowerType = null;

        function showTowerUpgrade(towerType) {
            currentUpgradeTowerType = towerType;
            const tower = TOWER_TYPES[towerType];
            const upgrades = TOWER_UPGRADES[towerType];
            
            document.getElementById('towerUpgradeTitle').textContent = tower.name;
            document.getElementById('towerUpgradeContent').innerHTML = `
                <p><strong>Description:</strong> ${tower.description}</p>
                <p><strong>Initial Cost:</strong> ${tower.cost}💰</p>
            `;
            
            // Update values of the stats
            document.getElementById('damageValue').textContent = tower.damage + upgrades.damage;
            document.getElementById('rangeValue').textContent = tower.range + (upgrades.range * 20);
            document.getElementById('fireRateValue').textContent = Math.max(20, tower.fireRate - (upgrades.fireRate * 10));
            
            document.getElementById('damageLevel').textContent = `Level ${upgrades.damage + 1}`;
            document.getElementById('rangeLevel').textContent = `Level ${upgrades.range + 1}`;
            document.getElementById('fireRateLevel').textContent = `Level ${upgrades.fireRate + 1}`;
            document.getElementById('specialLevel').textContent = `Level ${upgrades.special + 1}`;
            
            // Update costs
            document.getElementById('damageBuy').innerHTML = `+${towerType === 'strong' ? 10 : towerType === 'sniper' ? 15 : 5} (${50 + upgrades.damage * 25}💰)`;
            document.getElementById('rangeBuy').innerHTML = `+20 (${40 + upgrades.range * 20}💰)`;
            document.getElementById('fireRateBuy').innerHTML = `+10 (${60 + upgrades.fireRate * 30}💰)`;
            
            // Configure special upgrade based on type
            const specialUpgrade = document.getElementById('specialUpgrade');
            const specialLabel = specialUpgrade.querySelector('label');
            const specialValue = document.getElementById('specialValue');
            const specialBuy = document.getElementById('specialBuy');
            
            if (towerType === 'splash') {
                specialLabel.innerHTML = `Exploding Ray <span id="specialLevel">Level ${upgrades.special + 1}</span>`;
                specialValue.textContent = 50 + (upgrades.special * 15);
                specialBuy.innerHTML = `+15 (${80 + upgrades.special * 40}💰)`;
            } else if (towerType === 'slow') {
                specialLabel.innerHTML = `Ice Intensity <span id="specialLevel">Level ${upgrades.special + 1}</span>`;
                specialValue.textContent = `${Math.round((0.5 - upgrades.special * 0.1) * 100)}%`;
                specialBuy.innerHTML = `+10% (${80 + upgrades.special * 40}💰)`;
            } else if (towerType === 'poison') {
                specialLabel.innerHTML = `Poison Intensity <span id="specialLevel">Level ${upgrades.special + 1}</span>`;
                specialValue.textContent = `${3 + upgrades.special}/s per ${4 + upgrades.special}s`;
                specialBuy.innerHTML = `+1 damage/s +1s (${80 + upgrades.special * 40}💰)`;
            } else if (towerType === 'lightning') {
                specialLabel.innerHTML = `Lightning Bolt <span id="specialLevel">Level ${upgrades.special + 1}</span>`;
                specialValue.textContent = 50 + (upgrades.special * 15);
                specialBuy.innerHTML = `+15 (${80 + upgrades.special * 40}💰)`;
            } else {
                specialUpgrade.style.display = 'none';
            }
            
            document.getElementById('towerUpgradePopup').classList.remove('hidden');
        }

        function closeTowerUpgrade() {
            document.getElementById('towerUpgradePopup').classList.add('hidden');
        }

        function upgradeTowerStat(stat) {
            if (!currentUpgradeTowerType) return;
            
            const upgrades = TOWER_UPGRADES[currentUpgradeTowerType];
            let cost = 0;
            
            switch(stat) {
                case 'damage':
                    cost = 50 + upgrades.damage * 25;
                    break;
                case 'range':
                    cost = 40 + upgrades.range * 20;
                    break;
                case 'fireRate':
                    cost = 60 + upgrades.fireRate * 30;
                    break;
                case 'special':
                    cost = 80 + upgrades.special * 40;
                    break;
            }
            
            if (gameState.money >= cost) {
                gameState.money -= cost;
                upgrades[stat]++;
                showTowerUpgrade(currentUpgradeTowerType); // Refresh popup
            }
        }

        function toggleSellMode() {
            gameState.sellMode = !gameState.sellMode;
            const btn = document.getElementById('sellModeBtn');
            
            if (gameState.sellMode) {
                btn.classList.add('ring-2', 'ring-red-500');
                btn.textContent = '🗑️ ACTIVE';
                gameState.selectedTower = null;
                // Remove selected tower
                document.querySelectorAll('[id$="TowerBtn"]').forEach(btn => {
                    btn.classList.remove('ring-2', 'ring-primary');
                });
            } else {
                btn.classList.remove('ring-2', 'ring-red-500');
                btn.textContent = '🗑️ Remove';
            }
        }

        function sellTower(towerIndex) {
            if (towerIndex >= 0 && towerIndex < gameState.towers.length) {
                const soldTower = gameState.towers[towerIndex];
                const sellPrice = Math.floor(TOWER_TYPES[soldTower.type].cost * 0.7); // 70% value
                gameState.money += sellPrice;
                gameState.towers.splice(towerIndex, 1);
                // Does not exit sell mode automatically
            }
        }

        function showTowerConfig(tower, towerIndex) {
            currentTowerBeingConfigured = towerIndex;
            document.getElementById('targetPriority').value = tower.targetPriority || 'closest';
            document.getElementById('towerConfigPopup').classList.remove('hidden');
        }

        function closeTowerConfig() {
            document.getElementById('towerConfigPopup').classList.add('hidden');
            currentTowerBeingConfigured = null;
        }

        function saveTowerConfig() {
            if (currentTowerBeingConfigured !== null) {
                const priority = document.getElementById('targetPriority').value;
                gameState.towers[currentTowerBeingConfigured].targetPriority = priority;
            }
            closeTowerConfig();
        }

        function togglePause() {
            isPaused = !isPaused;
            const btn = document.getElementById('pauseBtn');
            const speedControls = document.getElementById('speedControls');
            
            if (isPaused) {
                btn.innerHTML = '▶️ Continue';
                btn.classList.add('ring-2', 'ring-primary');
                speedControls.classList.remove('hidden');
            } else {
                btn.innerHTML = '⏸️ Pause';
                btn.classList.remove('ring-2', 'ring-primary');
                speedControls.classList.add('hidden');
            }
        }
        
        function changeGameSpeed(speed) {
            gameSpeed = speed;
            document.getElementById('slowBtn').classList.toggle('ring-2', speed === 0.5);
            document.getElementById('normalBtn').classList.toggle('ring-2', speed === 1);
            document.getElementById('fastBtn').classList.toggle('ring-2', speed === 2);
        }
        
        function upgradeTowerStat(stat) {
            if (!currentUpgradeTowerType) return;
            
            const upgrades = TOWER_UPGRADES[currentUpgradeTowerType];
            let cost;
            
            switch (stat) {
                case 'damage':
                    cost = 50 + upgrades.damage * 25;
                    break;
                case 'range':
                    cost = 40 + upgrades.range * 20;
                    break;
                case 'fireRate':
                    cost = 60 + upgrades.fireRate * 30;
                    break;
                case 'special':
                    cost = 80 + upgrades.special * 40;
                    break;
            }
            
            if (gameState.money >= cost) {
                gameState.money -= cost;
                upgrades[stat]++;
                showTowerUpgrade(currentUpgradeTowerType); // Refresh popup
            }
        }

        function getTowerTarget(tower) {
            let target = null;
            let bestValue = Infinity;
            
            const upgrades = TOWER_UPGRADES[tower.type];
            const modifiedRange = tower.range + (upgrades.range * 20);
            
            gameState.enemies.forEach(enemy => {
                const dx = tower.x - enemy.x;
                const dy = tower.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= modifiedRange) {
                    let value;
                    switch(tower.targetPriority || 'closest') {
                        case 'closest':
                            value = distance;
                            break;
                        case 'strongest':
                            value = -enemy.health; // Negative to get the largest
                            break;
                        case 'weakest':
                            value = enemy.health;
                            break;
                        default:
                            value = distance;
                    }
                    
                    if (value < bestValue) {
                        bestValue = value;
                        target = enemy;
                    }
                }
            });
            
            return target;
        }

        // Update updateTowers to use new target systems
        function updateTowers() {
            gameState.towers.forEach(tower => {
                tower.lastFire += gameSpeed;
                
                const upgrades = TOWER_UPGRADES[tower.type];
                const modifiedFireRate = Math.max(20, tower.fireRate - (upgrades.fireRate * 10));
                
                if (tower.lastFire >= modifiedFireRate) {
                    const target = getTowerTarget(tower);
                    if (target) {
                        fireProjectile(tower, target);
                        tower.lastFire = 0;
                    }
                }
            });
        }

        // Initialize UI
        updateUI();

        // Animate counter when the page loads
        function animateCounters() {
            const counters = document.querySelectorAll('.animated-counter');
            
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'));
                const increment = target / 100;
                let current = 0;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    counter.textContent = Math.floor(current);
                }, 20);
            });
        }

        // Intersection observer to animate when the section appears on screen
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        });

        // Initialize observer when the page loads
        document.addEventListener('DOMContentLoaded', () => {

            startGame()
        });

