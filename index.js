        // Game Variables
        let canvas, ctx;
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
                name: 'Torre Básica', description: 'Torre equilibrada para iniciantes. Boa relação custo-benefício.'
            },
            fast: { 
                cost: 75, damage: 15, range: 70, fireRate: 30, color: '#10b981', shape: 'square',
                name: 'Torre Rápida', description: 'Atira rapidamente, ideal para inimigos em grupo.'
            },
            strong: { 
                cost: 100, damage: 40, range: 90, fireRate: 90, color: '#ef4444', shape: 'pentagon',
                name: 'Torre Forte', description: 'Alto dano, ideal para inimigos resistentes.'
            },
            sniper: { 
                cost: 150, damage: 60, range: 150, fireRate: 120, color: '#8b5cf6', shape: 'diamond',
                name: 'Torre Sniper', description: 'Longo alcance e alto dano, mas tiro lento.'
            },
            splash: { 
                cost: 120, damage: 25, range: 75, fireRate: 75, color: '#f59e0b', shape: 'hexagon',
                name: 'Torre Explosiva', description: 'Causa dano em área, atinge múltiplos inimigos.'
            },
            slow: { 
                cost: 90, damage: 8, range: 85, fireRate: 50, color: '#06b6d4', shape: 'square',
                name: 'Torre Gelo', description: 'Desacelera inimigos, permitindo controle estratégico.',
                slowFactor: 0.5, slowDuration: 3000
            },
            poison: {
                cost: 110, damage: 5, range: 80, fireRate: 70, color: '#22c55e', shape: 'circle',
                name: 'Torre Veneno', description: 'Envenena inimigos causando dano contínuo.',
                poisonDamage: 3, poisonDuration: 4000
            }
        };
        
        // Sistema de upgrades globais
        const TOWER_UPGRADES = {
            basic: { damage: 0, range: 0, fireRate: 0, special: 0 },
            fast: { damage: 0, range: 0, fireRate: 0, special: 0 },
            strong: { damage: 0, range: 0, fireRate: 0, special: 0 },
            sniper: { damage: 0, range: 0, fireRate: 0, special: 0 },
            splash: { damage: 0, range: 0, fireRate: 0, special: 0 },
            slow: { damage: 0, range: 0, fireRate: 0, special: 0 },
            poison: { damage: 0, range: 0, fireRate: 0, special: 0 }
        };

        // Game Path
        const PATH = [
            {x: 0, y: 300}, {x: 220, y: 300}, {x: 220, y: 100}, {x: 420, y: 100},
            {x: 420, y: 380}, {x: 620, y: 380}, {x: 620, y: 220}, {x: 820, y: 220},
            {x: 820, y: 420}, {x: 1000, y: 420}
        ];

        // Initialize Game
        function startGame() {
            document.getElementById('homePage').classList.add('hidden');
            document.getElementById('gameContainer').classList.remove('hidden');
            
            canvas = document.getElementById('gameCanvas');
            ctx = canvas.getContext('2d');
            
            setupEventListeners();
            resetGame();
            gameRunning = true;
            gameLoop();
        }

        function goHome() {
            gameRunning = false;
            document.getElementById('homePage').classList.remove('hidden');
            document.getElementById('gameContainer').classList.add('hidden');
            document.getElementById('gameOverScreen').classList.add('hidden');
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
                waveTimer: 300,
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
                gameState.mouseX = e.clientX - rect.left;
                gameState.mouseY = e.clientY - rect.top;
            });

            canvas.addEventListener('click', (e) => {
                if (!gameRunning) return;
                
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                if (gameState.sellMode) {
                    // Modo venda: encontrar torre clicada
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
                
                // Encontrar torre clicada com botão direito
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

            // Adicionar eventos de teclado
            document.addEventListener('keydown', (e) => {
                if (!gameRunning) return;
                
                const key = e.key;
                
                // Atalhos para selecionar torres (1-7)
                if (key >= '1' && key <= '7') {
                    const towerTypes = ['basic', 'fast', 'strong', 'sniper', 'splash', 'slow', 'poison'];
                    const towerType = towerTypes[parseInt(key) - 1];
                    if (towerType) {
                        selectTower(towerType);
                    }
                }
                
                // Tecla DEL para ativar/desativar modo de venda
                if (key === 'Delete' || key === 'Del') {
                    toggleSellMode();
                }
                
                // ESC para cancelar seleção
                if (key === 'Escape') {
                    gameState.selectedTower = null;
                    gameState.sellMode = false;
                    updateTowerButtons();
                }
            });
        }

        function selectTower(type) {
            // Se a mesma torre está selecionada, deseleciona
            if (gameState.selectedTower === type) {
                gameState.selectedTower = null;
                document.getElementById(`${type}TowerBtn`).classList.remove('ring-2', 'ring-primary');
                return;
            }
            
            const towerType = TOWER_TYPES[type];
            if (gameState.money >= towerType.cost) {
                // Desativar modo venda se estiver ativo
                if (gameState.sellMode) {
                    toggleSellMode();
                }
                
                gameState.selectedTower = type;
                
                // Visual feedback - remove seleção anterior
                document.querySelectorAll('[id$="TowerBtn"]').forEach(btn => {
                    btn.classList.remove('ring-2', 'ring-primary');
                });
                
                // Adiciona seleção na nova torre
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
                
                // Efeito visual de colocação da torre
                createTowerPlacementEffect(newTower.x, newTower.y, towerType.color);
                
                // Deseleciona a torre após colocar
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

        // Funções de Efeitos Visuais
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
            
            // Texto de dano
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
            
            // Texto de dinheiro
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
            // Posiciona a explosão na saída dos inimigos (final do PATH)
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
                    
                    // Processar dano de veneno
                    if (enemy.poisonedUntil && Date.now() < enemy.poisonedUntil) {
                        if (Date.now() - enemy.lastPoisonDamage >= 1000) { // Dano a cada segundo
                            enemy.health -= enemy.poisonDamage;
                            enemy.lastPoisonDamage = Date.now();
                            
                            // Efeito visual de dano por veneno
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
                splashRadius: tower.type === 'splash' ? 50 + (upgrades.special * 15) : 0,
                slowFactor: tower.type === 'slow' ? 0.5 - (upgrades.special * 0.1) : 0,
                slowDuration: tower.type === 'slow' ? 3000 : 0,
                poisonDamage: tower.type === 'poison' ? 3 + upgrades.special : 0,
                poisonDuration: tower.type === 'poison' ? 4000 + (upgrades.special * 1000) : 0
            });
        }

        function updateProjectiles() {
            gameState.projectiles.forEach((projectile, pIndex) => {
                // Adicionar rastro
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
                        
                        // Dano em área para torre explosiva
                        if (projectile.type === 'splash') {
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
                            
                            // Efeito visual de explosão
                            for (let i = 0; i < 20; i++) {
                                gameState.effects.push({
                                    type: 'explosion',
                                    x: enemy.x + (Math.random() - 0.5) * (projectile.splashRadius * 2),
                                    y: enemy.y + (Math.random() - 0.5) * (projectile.splashRadius * 2),
                                    vx: (Math.random() - 0.5) * 12,
                                    vy: (Math.random() - 0.5) * 12,
                                    color: '#f59e0b',
                                    life: 30,
                                    maxLife: 30,
                                    size: Math.random() * 10 + 5
                                });
                            }
                        } 
                        // Efeito de gelo
                        else if (projectile.type === 'slow') {
                            enemy.health -= projectile.damage;
                            enemy.slowedUntil = Date.now() + projectile.slowDuration;
                            enemy.slowFactor = projectile.slowFactor;
                            
                            // Efeito visual de gelo
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
                        // Efeito de veneno
                        else if (projectile.type === 'poison') {
                            enemy.health -= projectile.damage;
                            enemy.poisonedUntil = Date.now() + projectile.poisonDuration;
                            enemy.poisonDamage = projectile.poisonDamage;
                            enemy.lastPoisonDamage = Date.now();
                            
                            // Efeito visual de veneno
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
                        
                        // Verificar inimigos mortos após dano (incluindo dano em área)
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
            // Limitar número de efeitos para performance
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
                }
            } else {
                // Countdown between waves
                gameState.waveTimer -= gameSpeed;
                
                if (gameState.waveTimer <= 0) {
                    gameState.countdownTimer--;
                    document.getElementById('countdown').textContent = gameState.countdownTimer;
                    gameState.waveTimer = 60; // Reset timer for next second
                    
                    if (gameState.countdownTimer <= 0) {
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
        }

        // Função para desenhar formas das torres
        function drawTowerShape(x, y, size, shape, color) {
            ctx.save();
            ctx.translate(x, y);
            
            // Sombra
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
            // Clear canvas com gradiente
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#0a0a0a');
            gradient.addColorStop(0.5, '#1a1a1a');
            gradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw grid simples (otimizado)
            ctx.strokeStyle = 'rgba(255, 107, 53, 0.15)';
            ctx.lineWidth = 0.5;
            
            for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            
            // Draw path com cor menos saturada
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
            
            // Linha interna do path
            ctx.strokeStyle = '#A0522D';
            ctx.lineWidth = 30;
            ctx.shadowBlur = 0;
            ctx.stroke();
            
            ctx.shadowBlur = 0;
            
            // Draw projectiles com rastros melhorados
            gameState.projectiles.forEach(projectile => {
                // Desenhar rastro contínuo
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
                
                // Projétil principal com brilho intenso
                ctx.fillStyle = projectile.color;
                ctx.shadowColor = projectile.color;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Núcleo brilhante
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.shadowBlur = 0;
            
            // Draw towers com formas e brilhos
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
            
            // Draw enemies com brilho e sombras
            gameState.enemies.forEach(enemy => {
                // Verificar efeitos
                const isSlowed = enemy.slowedUntil && Date.now() < enemy.slowedUntil;
                const isPoisoned = enemy.poisonedUntil && Date.now() < enemy.poisonedUntil;
                
                // Determinar cor baseada no efeito
                let color = '#ef4444';
                let innerColor = '#ff6666';
                if (isPoisoned) {
                    color = '#22c55e';
                    innerColor = '#4ade80';
                } else if (isSlowed) {
                    color = '#06b6d4';
                    innerColor = '#67e8f9';
                }
                
                // Sombra do inimigo
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Círculo interno
                ctx.shadowBlur = 0;
                ctx.fillStyle = innerColor;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius * 0.7, 0, Math.PI * 2);
                ctx.fill();
                
                // Efeitos extras
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
                
                // Health bar com brilho
                const barWidth = enemy.radius * 2.5;
                const barHeight = 6;
                const healthPercent = enemy.health / enemy.maxHealth;
                
                // Fundo da barra
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.radius - 15, barWidth, barHeight);
                
                // Barra de vida
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
                
                // Range preview
                ctx.fillStyle = isValid ? `${towerType.color}30` : '#ef444430';
                ctx.beginPath();
                ctx.arc(centerX, centerY, towerType.range, 0, Math.PI * 2);
                ctx.fill();
                
                // Tower preview
                ctx.globalAlpha = 0.8;
                drawTowerShape(centerX, centerY, 18, towerType.shape, isValid ? towerType.color : '#ef4444');
                ctx.globalAlpha = 1;
                
                // Grid highlight com pulsação
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

        // Funções para os novos sistemas
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
                <p><strong>Descrição:</strong> ${tower.description}</p>
                <p><strong>Custo Base:</strong> ${tower.cost}💰</p>
            `;
            
            // Atualizar valores dos stats
            document.getElementById('damageValue').textContent = tower.damage + upgrades.damage;
            document.getElementById('rangeValue').textContent = tower.range + (upgrades.range * 20);
            document.getElementById('fireRateValue').textContent = Math.max(20, tower.fireRate - (upgrades.fireRate * 10));
            
            document.getElementById('damageLevel').textContent = `Nível ${upgrades.damage + 1}`;
            document.getElementById('rangeLevel').textContent = `Nível ${upgrades.range + 1}`;
            document.getElementById('fireRateLevel').textContent = `Nível ${upgrades.fireRate + 1}`;
            document.getElementById('specialLevel').textContent = `Nível ${upgrades.special + 1}`;
            
            // Atualizar custos
            document.getElementById('damageBuy').innerHTML = `+${towerType === 'strong' ? 10 : towerType === 'sniper' ? 15 : 5} (${50 + upgrades.damage * 25}💰)`;
            document.getElementById('rangeBuy').innerHTML = `+20 (${40 + upgrades.range * 20}💰)`;
            document.getElementById('fireRateBuy').innerHTML = `+10 (${60 + upgrades.fireRate * 30}💰)`;
            
            // Configurar upgrade especial baseado no tipo
            const specialUpgrade = document.getElementById('specialUpgrade');
            const specialLabel = specialUpgrade.querySelector('label');
            const specialValue = document.getElementById('specialValue');
            const specialBuy = document.getElementById('specialBuy');
            
            if (towerType === 'splash') {
                specialLabel.innerHTML = `Raio Explosão <span id="specialLevel">Nível ${upgrades.special + 1}</span>`;
                specialValue.textContent = 50 + (upgrades.special * 15);
                specialBuy.innerHTML = `+15 (${80 + upgrades.special * 40}💰)`;
            } else if (towerType === 'slow') {
                specialLabel.innerHTML = `Intensidade Gelo <span id="specialLevel">Nível ${upgrades.special + 1}</span>`;
                specialValue.textContent = `${Math.round((0.5 - upgrades.special * 0.1) * 100)}%`;
                specialBuy.innerHTML = `+10% (${80 + upgrades.special * 40}💰)`;
            } else if (towerType === 'poison') {
                specialLabel.innerHTML = `Intensidade Veneno <span id="specialLevel">Nível ${upgrades.special + 1}</span>`;
                specialValue.textContent = `${3 + upgrades.special}/s por ${4 + upgrades.special}s`;
                specialBuy.innerHTML = `+1 dano/s +1s (${80 + upgrades.special * 40}💰)`;
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
                updateDisplay();
                showTowerUpgrade(currentUpgradeTowerType); // Refresh popup
            }
        }

        function toggleSellMode() {
            gameState.sellMode = !gameState.sellMode;
            const btn = document.getElementById('sellModeBtn');
            
            if (gameState.sellMode) {
                btn.classList.add('ring-2', 'ring-red-500');
                btn.textContent = '🗑️ Modo ATIVO';
                gameState.selectedTower = null;
                // Remover seleção de torres
                document.querySelectorAll('[id$="TowerBtn"]').forEach(btn => {
                    btn.classList.remove('ring-2', 'ring-primary');
                });
            } else {
                btn.classList.remove('ring-2', 'ring-red-500');
                btn.textContent = '🗑️ Excluir';
            }
        }

        function sellTower(towerIndex) {
            if (towerIndex >= 0 && towerIndex < gameState.towers.length) {
                const soldTower = gameState.towers[towerIndex];
                const sellPrice = Math.floor(TOWER_TYPES[soldTower.type].cost * 0.7); // 70% do valor
                gameState.money += sellPrice;
                gameState.towers.splice(towerIndex, 1);
                updateDisplay();
                // NÃO desativa mais automaticamente o modo de venda
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
                btn.innerHTML = '▶️ Continuar';
                btn.classList.add('ring-2', 'ring-primary');
                speedControls.classList.remove('hidden');
            } else {
                btn.innerHTML = '⏸️ Pausar';
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
                updateDisplay();
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
                            value = -enemy.health; // Negativo para pegar o maior
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

        // Atualizar função updateTowers para usar novo sistema de alvos
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

        // Animar contadores quando a página carrega
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

        // Observador de interseção para animar quando a seção aparecer na tela
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        });

        // Inicializar observer quando a página carregar
        document.addEventListener('DOMContentLoaded', () => {
            const statsSection = document.querySelector('.stats-card').closest('section');
            if (statsSection) {
                observer.observe(statsSection);
            }
        });

