#!/usr/bin/env node
import fs from "fs";
import os from "os";
import path from "path";

import { askQuestion } from "./askQuestion.js";
import { encryptApiKey } from "./crypto.js";
import { providers } from "./providers.js";

export const configPath = path.join(os.homedir(), ".gsqconfig.json");

export async function initializeConfig() {
  try {
    console.log("Select AI providers (comma-separated numbers):");
    providers.forEach((provider, index) => {
      console.log(`${index + 1}. ${provider.name} (${provider.apiUrl})`);
    });

    const selectedProviders = await askQuestion("> ");
    const selectedIndices = selectedProviders
      .split(",")
      .map((num) => parseInt(num.trim()) - 1);

    const validSelections = selectedIndices.filter(
      (idx) => !isNaN(idx) && idx >= 0 && idx < providers.length
    );

    if (validSelections.length === 0) {
      console.error("Error: You must select at least one provider.");
      console.error("Run gsq --init again.");
      process.exit(1);
    }

    const config = { providers: {} };

    for (const idx of validSelections) {
      const provider = providers[idx];
      const apiKey = await askQuestion(
        `Enter your ${provider.name} API key: `,
        true
      );
      config.providers[provider.key] = {
        apiKey: encryptApiKey(apiKey), // Store encrypted
        apiUrl: provider.apiUrl,
      };
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Configuration saved to ${configPath}`);
    process.exit(0);
  } catch (error) {
    console.error("Initialization failed:", error.message);
    process.exit(1);
  }
}
