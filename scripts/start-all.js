"use strict";

const { spawn } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");

const processes = [
  { name: "add", script: "services/add/server.js" },
  { name: "subtract", script: "services/subtract/server.js" },
  { name: "multiply", script: "services/multiply/server.js" },
  { name: "divide", script: "services/divide/server.js" },
  { name: "gateway", script: "gateway/server.js" },
];

const children = processes.map(({ name, script }) => {
  const child = spawn(process.execPath, [path.join(root, script)], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  child.stdout.on("data", (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[${name}] ${data}`));
  child.on("exit", (code) => {
    console.log(`[${name}] exited with code ${code}`);
  });

  return child;
});

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Microservices calculator running.");
console.log("Gateway: http://localhost:3000");
console.log("Frontend: open frontend/index.html (set API to http://localhost:3000)");
