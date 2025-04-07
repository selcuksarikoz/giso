#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { askQuestion } from './askQuestion.js';
import { encryptApiKey } from './crypto.js';
import { providers } from './providers.js';

export const configPath = path.join(os.homedir(), '.gisqconfig.json');

async function getNumberInput(prompt, defaultValue, min, max) {
  while (true) {
    const input = await askQuestion(prompt, false); // Explicitly non-sensitive
    if (!input.trim()) return defaultValue;

    const number = parseFloat(input);
    if (!isNaN(number) && number >= min && number <= max) {
      return number;
    }
    console.log(`Please enter a number between ${min} and ${max}`);
  }
}

export async function initializeConfig() {
  try {
    // Ensure stdin is properly set up
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    console.log('Select AI providers (comma-separated numbers):');
    providers.forEach((provider, index) => {
      console.log(`${index + 1}. ${provider.name}`);
    });

    // Get provider selection - must use non-sensitive mode
    let selectedProviders;
    while (true) {
      selectedProviders = await askQuestion('> ', false); // Explicitly non-sensitive
      if (selectedProviders.trim()) break;
      console.log('Please enter at least one provider number');
    }

    const selectedIndices = selectedProviders.split(',').map((num) => parseInt(num.trim()) - 1);
    const validSelections = selectedIndices.filter(
      (idx) => !isNaN(idx) && idx >= 0 && idx < providers.length
    );

    if (validSelections.length === 0) {
      console.error('Error: Invalid provider selection.');
      console.error('Run gisq --init again.');
      process.exit(1);
    }

    const config = { providers: {} };

    for (const idx of validSelections) {
      const provider = providers[idx];

      // Get API Key (sensitive input)
      let apiKey;
      while (true) {
        apiKey = await askQuestion(`Enter your ${provider.name} API key: `, true);
        if (apiKey.trim()) break;
        console.log('API key cannot be empty');
      }

      // Get Temperature (non-sensitive)
      const temperature = await getNumberInput(
        `Enter temperature for ${provider.name} (0.0-2.0, default 0.4): `,
        0.4, 0.0, 2.0
      );

      // Get Max Tokens (non-sensitive)
      const maxTokens = await getNumberInput(
        `Enter max tokens for ${provider.name} (1-10000, default 2000): `,
        2000, 1, 10000
      );

      config.providers[provider.key] = {
        apiKey: encryptApiKey(apiKey),
        apiUrl: provider.apiUrl,
        modelName: provider.modelName,
        temperature,
        maxTokens
      };
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`\nConfiguration encrypted and saved to ${configPath}`);
    process.exit(0);
  } catch (error) {
    console.error('\nInitialization failed:', error.message);
    process.exit(1);
  }
}
