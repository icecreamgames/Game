const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Create a large ground plane
const planeGeometry = new THREE.PlaneGeometry(200, 200);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const planes = []; // Array to hold multiple planes

// Function to create and position planes
function createPlanes() {
    for (let i = -1; i <= 1; i++) {
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = Math.PI / 2; // Rotate to make it horizontal
        plane.position.y = 0; // Keep the plane at ground level
        plane.position.z = i * 200; // Position them far apart
        scene.add(plane);
        planes.push(plane);
    }
}

createPlanes();

// Load textures for the player and enemies
const playerTexture = new THREE.TextureLoader().load('path/to/space-guy.png'); // Path to your space guy texture
const enemyTexture = new THREE.TextureLoader().load('path/to/alien.png'); // Path to your alien texture

// Create the player (space guy)
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshBasicMaterial({ map: playerTexture });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// Position the camera to face toward the enemies
camera.position.set(0, 2, -5);
camera.lookAt(0, 0, 0); // Look toward the origin where the player is

// Controls
const keyboard = {};
window.addEventListener('keydown', (event) => {
    keyboard[event.code] = true;
});
window.addEventListener('keyup', (event) => {
    keyboard[event.code] = false;
});

// Projectiles
let projectiles = [];
const projectileSpeed = 0.5;
let lastShotTime = 0; // To track the last shot time
const shootDelay = 300; // 300 milliseconds

function shoot() {
    const currentTime = Date.now();
    if (currentTime - lastShotTime >= shootDelay) {
        lastShotTime = currentTime; // Update last shot time

        const projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

        // Set initial position behind the player
        projectile.position.copy(player.position);
        projectile.position.z += 1; // Move it slightly behind

        scene.add(projectile);
        projectiles.push(projectile);
    }
}

// Enemies
let enemies = [];
let enemySpeed = 0.02; // Initial speed of enemies
const spawnInterval = 2000; // Spawn an enemy every 2 seconds
let speedMultiplier = 1; // Multiplier for enemy speed
let lastScoreMultiple = 0; // Track last score multiple of 10

function createEnemy() {
    const enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const enemyMaterial = new THREE.MeshBasicMaterial({ map: enemyTexture }); // Use alien texture
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

    // Start enemies in front of the player, within view
    enemy.position.x = Math.random() * 40 - 20; // Random X between -20 and 20
    enemy.position.z = 10; // Start closer to the player
    enemy.position.y = 0.5; // Height of the enemy

    scene.add(enemy);
    enemies.push(enemy);
}

// Score tracking
let score = 0;
function updateScore() {
    document.getElementById('score').innerText = `Score: ${score}`;

    // Check for multiples of 10
    if (score % 10 === 0 && score > lastScoreMultiple) {
        enemySpeed *= 2; // Double enemy speed
        lastScoreMultiple = score; // Update last score multiple
    }
}

// Game state
let isGameOver = false;

function restartGame() {
    // Reset game state
    isGameOver = false;
    score = 0; // Reset score
    projectiles.forEach(p => scene.remove(p));
    enemies.forEach(e => scene.remove(e));
    projectiles = [];
    enemies = [];
    player.position.set(0, 0.5, 0); // Reset player position
    enemySpeed = 0.02; // Reset enemy speed
    lastScoreMultiple = 0; // Reset last score multiple
    updateScore(); // Update score display
}

// Collision detection
function checkCollisions() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const distance = projectile.position.distanceTo(enemy.position);
            if (distance < 1) { // Simple collision detection
                scene.remove(projectile);
                scene.remove(enemy);
                projectiles.splice(i, 1);
                enemies.splice(j, 1);
                score += 1; // Update the score when hitting an enemy
                updateScore(); // Update score display
                break; // Break inner loop
            }
        }
    }

    // Check for collision between player and enemies
    for (let enemy of enemies) {
        const distance = player.position.distanceTo(enemy.position);
        if (distance < 1) { // Simple collision detection
            isGameOver = true;
            alert("Game Over! Your score: " + score); // Notify the player
            restartGame(); // Restart the game
            break; // Stop further checks if game is over
        }
    }
}

// Animation loop
function animate() {
    if (isGameOver) return; // Stop the animation loop if game is over

    requestAnimationFrame(animate);

    // Move player based on keyboard input
    if (keyboard['KeyW']) {
        player.position.z += 0.1; // Move forward (toward enemies)
    }
    if (keyboard['KeyS']) {
        player.position.z -= 0.1; // Move backward (away from enemies)
    }
    if (keyboard['KeyA']) {
        player.position.x += 0.1; // Move right
    }
    if (keyboard['KeyD']) {
        player.position.x -= 0.1; // Move left
    }

    // Boundary checks to prevent the player from leaving the plane
    player.position.x = THREE.Math.clamp(player.position.x, -100, 100); // Clamp X position
    player.position.z = THREE.Math.clamp(player.position.z, -100, 100); // Clamp Z position

    if (keyboard['Space']) {
        shoot();
    }

    // Update camera position to follow the player
    camera.position.x = player.position.x;
    camera.position.z = player.position.z - 5; // Keep the camera behind the player
    camera.position.y = 2; // Keep the camera at a height

    // Move projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.position.z += projectileSpeed; // Move projectile forward

        // Remove projectile if it goes out of bounds (beyond enemy starting line)
        if (projectile.position.z > 10) {
            scene.remove(projectile);
            projectiles.splice(i, 1);
        }
    }

    // Update enemies to always move towards the player
    for (let enemy of enemies) {
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, enemy.position).normalize(); // Calculate direction toward player
        enemy.position.addScaledVector(direction, enemySpeed); // Move enemy toward player
    }

    // Check if any planes need repositioning
    planes.forEach(plane => {
        if (plane.position.z < player.position.z - 100) {
            plane.position.z += 200; // Reset position to simulate infinite plane
        }
    });

    checkCollisions(); // Check for collisions between projectiles and enemies

    renderer.render(scene, camera);
}

// Spawn enemies at intervals
setInterval(createEnemy, spawnInterval);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

// Start animation
animate();
