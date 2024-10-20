import { GameLoop } from "nanojet";

// Get the canvas element from the DOM
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

if (!context) {
  throw new Error("Unable to get 2D context");
}

// Set the canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
  x: 0,
  y: 0,
  velocity: { x: 0, y: 0 },
  width: 32,
  height: 32,
  color: "red",
};

const keysDown = {
  w: false,
  s: false,
  a: false,
  d: false,
};

addEventListener("keydown", (event) => {
  switch (event.key) {
    case "w":
      keysDown.w = true;
      break;
    case "s":
      keysDown.s = true;
      break;
    case "a":
      keysDown.a = true;
      break;
    case "d":
      keysDown.d = true;
      break;
  }
});

addEventListener("keyup", (event) => {
  switch (event.key) {
    case "w":
      keysDown.w = false;
      break;
    case "s":
      keysDown.s = false;
      break;
    case "a":
      keysDown.a = false;
      break;
    case "d":
      keysDown.d = false;
      break;
  }
});

function processInput() {
  player.velocity.x = 0;
  player.velocity.y = 0;

  if (keysDown.w) {
    player.velocity.y = -5;
  }
  if (keysDown.s) {
    player.velocity.y = 5;
  }
  if (keysDown.a) {
    player.velocity.x = -5;
  }
  if (keysDown.d) {
    player.velocity.x = 5;
  }
}

function update() {
  // Update game objects here
  player.x += player.velocity.x;
  player.y += player.velocity.y;
}

function render(extrapolation: number) {
  // Clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Render game objects here
  context.fillStyle = player.color;
  context.fillRect(
    player.x + player.velocity.x * extrapolation,
    player.y + player.velocity.y * extrapolation,
    player.width,
    player.height
  );

  // Render the render and update FPS
  context.fillStyle = "black";
  context.font = "16px Arial";
  context.fillText(`Render FPS: ${loop.getRenderFps().toFixed(1)}`, 10, 20);
  context.fillText(`Update FPS: ${loop.getUpdateFps().toFixed(1)}`, 10, 40);

}

const loop = new GameLoop(60, processInput, update, render);

loop.start();
