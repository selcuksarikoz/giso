#!/usr/bin/env node
import fs from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { offerCommitMessage } from "./offerCommitMessage.js";
import { configPath, initializeConfig } from "./initializeConfig.js";
import { updateGiso } from "./updateGiso.js";

// For ES modules to get the equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = resolve(__dirname, "..", "package.json");

// Import package.json for version
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const { version } = packageJson;

const args = process.argv.slice(2);

if (["--version", "-v"].includes(args[0])) {
  console.log(`giso version ${version}`);
  process.exit(0);
} else if (["--init", "-i"].includes(args[0])) {
  initializeConfig();
} else if (["--offer", "-o"].includes(args[0])) {
  offerCommitMessage();
} else if (["--config", "-c"].includes(args[0])) {
  if (!fs.existsSync(configPath)) {
    console.log("Error: Configuration file not found. Run giso --init first.");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  console.log("Configuration:");
  console.log(JSON.stringify(config, null, 2));
} else if (["--update", "-u"].includes(args[0])) {
  updateGiso(version).then((exitCode) => {
    process.exit(exitCode);
  });
} else {
  console.log("Usage:");
  console.log("  giso --init (-i)      Initialize configuration");
  console.log("  giso --offer (-o)     Generate commit message suggestions");
  console.log("  giso --version (-v)   Show version");
  console.log("  giso --config (-c)    Show configuration");
  console.log("  giso --update (-u)    Update giso to the latest version");
  process.exit(1);
}
