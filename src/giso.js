#!/usr/bin/env node
import fs from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { offerCommitMessage } from "./offerCommitMessage.js";
import { configPath, initializeConfig } from "./initializeConfig.js";

// For ES modules to get the equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = resolve(__dirname, "..", "package.json");

// Import package.json for version
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const { version } = packageJson;

const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  console.log(`giso version ${version}`);
  process.exit(0);
}

if (args.includes("--init")) {
  initializeConfig();
} else if (args.includes("--offer")) {
  offerCommitMessage();
} else if (args.includes("--config")) {
  if (!fs.existsSync(configPath)) {
    console.log("Error: Configuration file not found. Run giso --init first.");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  console.log("Configuration:");
  console.log(config);
} else {
  console.log("Usage:");
  console.log("  giso --init      Initialize configuration");
  console.log("  giso --offer     Generate commit message suggestions");
  console.log("  giso --version   Show version");
  console.log("  giso --config    Show configuration");
  process.exit(1);
}
