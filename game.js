// Game constants
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

// Game variables
let score = 0;
let gameOver = false;
let gameStarted = false;
let highestReached = 0; // Track the highest platform number reached
let initialHeight = 0;

// Player properties
const player = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  width: 20,
  height: 20,
  velocityY: 0,
  velocityX: 0,
  jumpForce: -13, // Increased base jump force
  gravity: 0.5,
  speed: 10, // Slightly increased base horizontal speed
};

// Platform properties
const platforms = [];
const platformWidth = 60;
const platformHeight = 10;
const platformTypes = {
  PASSTHROUGH: "green",
  SOLID: "red",
};

// Initialize platforms
function initPlatforms() {
  // Add initial platforms
  for (let i = 0; i < 7; i++) {
    platforms.push({
      x: Math.random() * (canvas.width - platformWidth),
      y: canvas.height - i * 100 - 100,
      width: platformWidth,
      height: platformHeight,
      type:
        Math.random() < 0.7 ? platformTypes.PASSTHROUGH : platformTypes.SOLID,
      speed: 0,
      direction: 1,
      number: i, // Add platform number tracking
    });
  }
}

// Game loop
function gameLoop() {
  if (!gameOver) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
}

// Update game state
function update() {
  if (!gameStarted) return;

  // Increase gravity more aggressively based on score
  player.gravity = 0.5 + Math.min(0.8, Math.floor(score / 100) * 0.1); // More aggressive gravity scaling

  // Player movement
  player.velocityY += player.gravity;
  player.y += player.velocityY;
  player.x += player.velocityX;

  // Keep player in bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;

  // Check for game over - modified to consider screen position
  if (player.y > canvas.height && Math.min(...platforms.map((p) => p.y)) < 0) {
    gameOver = true;
    alert("Game Over! Score: " + score);
    location.reload();
  }

  // Platform collision and movement
  platforms.forEach((platform, index) => {
    // Move platforms with more aggressive speed scaling
    if (platform.speed > 0) {
      const speedMultiplier = 1 + Math.min(2, score / 500); // More aggressive platform speed scaling
      platform.x += platform.speed * platform.direction * speedMultiplier;
      if (platform.x <= 0 || platform.x + platform.width >= canvas.width) {
        platform.direction *= -1;
      }
    }

    // Collision detection
    if (
      player.velocityY > 0 &&
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x &&
      player.y < platform.y + platform.height &&
      player.y + player.height > platform.y
    ) {
      if (
        platform.type === platformTypes.SOLID ||
        (platform.type === platformTypes.PASSTHROUGH &&
          player.y + player.height - player.velocityY <= platform.y)
      ) {
        player.y = platform.y - player.height;
        player.velocityY = player.jumpForce; // Constant jump force

        // Update score by 10 points when reaching new heights
        const platformNumber = platform.number;
        if (platformNumber > highestReached) {
          score += 10;
          highestReached = platformNumber;
          scoreElement.textContent = "Score: " + score;

          // Increase platform speed based on score
          platforms.forEach((p) => {
            p.speed = Math.min(3, Math.floor(score / 150)); // Adjusted speed scaling
          });
        }
      }
    } else if (
      platform.type === platformTypes.SOLID &&
      player.velocityY < 0 &&
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x &&
      player.y < platform.y + platform.height &&
      player.y + player.height > platform.y &&
      player.y > platform.y // Only trigger game over if player's top hits platform bottom
    ) {
      // Game over if hitting solid platform from below
      gameOver = true;
      alert("Game Over! Score: " + score);
      location.reload();
    }
  });

  // Move view up and generate new platforms
  if (player.y < canvas.height / 2 && highestReached > 1) {
    const diff = canvas.height / 2 - player.y;
    player.y = canvas.height / 2;

    // Update platform positions
    platforms.forEach((platform) => {
      platform.y += diff;
    });

    // Remove platforms that are too low
    while (platforms[0].y > canvas.height) {
      platforms.shift();
    }

    // Add new platforms
    while (platforms[platforms.length - 1].y > 0) {
      const newNumber = platforms[platforms.length - 1].number + 1;
      const newPlatform = {
        x: Math.random() * (canvas.width - platformWidth),
        y: platforms[platforms.length - 1].y - 100,
        width: platformWidth,
        height: platformHeight,
        type:
          Math.random() < 0.7 ? platformTypes.PASSTHROUGH : platformTypes.SOLID,
        speed: Math.min(5, Math.floor(score / 200)),
        direction: 1,
        number: newNumber, // Increment platform number
      };

      if (isValidPlatformPosition(newPlatform, platforms)) {
        platforms.push(newPlatform);
      }
    }
  }
}

// Draw game objects
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw platforms
  platforms.forEach((platform) => {
    ctx.fillStyle = platform.type;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  });

  // Draw player
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Draw start message
  if (!gameStarted) {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Press any key to start", canvas.width / 2, canvas.height / 2);
  }
}

// Modified keyboard input handling
document.addEventListener("keydown", (e) => {
  if (!gameStarted) {
    gameStarted = true;
    // Initial jump when game starts
    player.velocityY = player.jumpForce;
    return;
  }

  if (e.key === "ArrowLeft") {
    player.velocityX = -player.speed;
  }
  if (e.key === "ArrowRight") {
    player.velocityX = player.speed;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    player.velocityX = 0;
  }
});

// Function to check if a new platform would overlap too much with existing platforms
function isValidPlatformPosition(newPlatform, existingPlatforms) {
  for (const platform of existingPlatforms) {
    // Only check platforms within 100 units of vertical distance
    if (Math.abs(platform.y - newPlatform.y) > 100) continue;

    // If the platform being checked is solid (red), apply stricter overlap rules
    if (newPlatform.type === platformTypes.SOLID) {
      // Calculate overlap percentage
      const overlap =
        Math.min(
          platform.x + platform.width,
          newPlatform.x + newPlatform.width
        ) - Math.max(platform.x, newPlatform.x);

      if (overlap > 0) {
        const overlapPercentage = overlap / platformWidth;
        if (overlapPercentage > 0.33) {
          // Reduced from 0.49 to 0.33 (33%)
          return false;
        }
      }
    }
  }
  return true;
}

// Function to generate new platform
function generateNewPlatform(y) {
  let newPlatform;
  let attempts = 0;
  const maxAttempts = 20; // Increased from 10 to 20 to give more attempts to find valid position

  do {
    newPlatform = {
      x: Math.random() * (canvas.width - platformWidth),
      y: y,
      width: platformWidth,
      height: platformHeight,
      type:
        Math.random() < 0.7 ? platformTypes.PASSTHROUGH : platformTypes.SOLID,
      speed: Math.min(5, Math.floor(score / 200)),
      direction: 1,
      number: platforms[platforms.length - 1].number + 1,
    };
    attempts++;
  } while (
    !isValidPlatformPosition(newPlatform, platforms) &&
    attempts < maxAttempts
  );

  // If we couldn't find a valid position for a solid platform, make it passthrough
  if (attempts >= maxAttempts && newPlatform.type === platformTypes.SOLID) {
    newPlatform.type = platformTypes.PASSTHROUGH;
  }

  return newPlatform;
}

// Start the game loop but wait for key press
initPlatforms();
gameLoop();
