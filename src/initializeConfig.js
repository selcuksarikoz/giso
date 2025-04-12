#!/usr/bin/env node
import fs from "fs";
import os from "os";
import path from "path";
import inquirer from "inquirer";
import { encryptApiKey } from "./crypto.js";
import { providers } from "./providers.js";

export const configPath = path.join(os.homedir(), ".gisoconfig.json");

async function getNumberInput(prompt, defaultValue, min, max) {
  while (true) {
    const { numberInput } = await inquirer.prompt([
      {
        type: "input",
        name: "numberInput",
        message: prompt,
        default: defaultValue,
        validate: (input) => {
          if (input === undefined || input === null || !String(input).trim())
            return true; // Allow default
          const num = parseFloat(input);
          if (!isNaN(num) && num >= min && num <= max) {
            return true;
          }
          return `Please enter a number between ${min} and ${max}`;
        },
      },
    ]);

    if (
      numberInput === undefined ||
      numberInput === null ||
      !String(numberInput).trim()
    )
      return defaultValue;
    return parseFloat(numberInput);
  }
}

export async function initializeConfig() {
  try {
    console.log("Select an AI provider:");
    const providerChoices = providers.map((provider, index) => ({
      name: `${index + 1}. ${provider.name}`,
      value: index,
    }));

    // Display the list of providers
    const { selectedProviderIndex } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedProviderIndex",
        message: "Choose a provider:",
        choices: providerChoices,
        pageSize: 10,
      },
    ]);

    // Get the selected provider model name
    const { userChoiceModelName } = await inquirer.prompt([
      {
        type: "text",
        name: "userChoiceModelName",
        default: providers[selectedProviderIndex].modelName,
        message: `Enter the model name (Default ${providers[selectedProviderIndex].modelName}):`,
      },
    ]);

    if (selectedProviderIndex === undefined) {
      console.error("Error: No provider selected.");
      console.error("Run giso --init again.");
      process.exit(1);
    }

    const config = { providers: {} };
    const provider = providers[selectedProviderIndex];

    const { apiKey } = await inquirer.prompt([
      {
        type: "password",
        name: "apiKey",
        message: `Enter your ${provider.name} API key:`,
        mask: "*", // Display asterisks for the password
        validate: (input) => {
          if (input === undefined || input === null || !String(input).trim())
            return "API key cannot be empty";
          return true;
        },
      },
    ]);

    const temperature = await getNumberInput(
      `Enter temperature for ${provider.name} (0.0-2.0, default 0.4):`,
      0.4,
      0.0,
      2.0,
    );

    const maxTokens = await getNumberInput(
      `Enter max tokens for ${provider.name} (1-10000, default 2000):`,
      2000,
      1,
      10000,
    );

    const maxSuggestions = await getNumberInput(
      `Enter max suggestions for ${provider.name} (1-100, default 10):`,
      10,
      1,
      100,
    );

    const { funnyCommitMsg } = await inquirer.prompt([
      {
        type: "boolean",
        name: "funnyCommitMsg",
        default: true,
        message: `Do you want funny commit messages? Default: true`,
      },
    ]);

    config.providers[provider.key] = {
      apiKey: encryptApiKey(apiKey),
      apiUrl: provider.apiUrl,
      modelName: userChoiceModelName || provider.modelName,
      maxSuggestions,
      funnyCommitMsg,
      temperature,
      maxTokens,
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`\nConfiguration encrypted and saved to ${configPath}`);
    process.exit(0);
  } catch (error) {
    console.error("\nInitialization failed:", error.message);
    process.exit(1);
  }
}
