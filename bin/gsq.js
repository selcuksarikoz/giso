#!/usr/bin/env node
import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";
import fetch from "node-fetch";
import chalk from "chalk";
import inquirer from "inquirer";
import os from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from "crypto";

// For ES modules to get the equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import package.json for version
const packageJson = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")
);
const { version } = packageJson;

const configPath = path.join(os.homedir(), ".gsqconfig.json");

// Supported AI providers with their API URLs
const providers = [
  {
    name: "OpenAI",
    key: "openai",
    apiUrl: "https://api.openai.com/v1/chat/completions",
  },
  {
    name: "Gemini",
    key: "gemini",
    apiUrl:
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    modelName: "gemini-1.5-pro-latest",
  },
  {
    name: "Claude Sonnet",
    key: "claude",
    apiUrl: "https://api.anthropic.com/v1/messages",
  },
  {
    name: "DeepSeek",
    key: "deepseek",
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    modelName: "deepseek-chat",
  },
];

// Generate machine-specific key based on machine ID
function getMachineKey() {
  const machineId = os.hostname(); // or use a more unique machine identifier
  return crypto
    .createHash("sha256")
    .update(machineId)
    .digest("hex")
    .substring(0, 32);
}

// Encrypt API key before storing
function encryptApiKey(apiKey) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    getMachineKey(),
    Buffer.alloc(16, 0) // IV - could be made more secure
  );
  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Decrypt API key when reading
function decryptApiKey(encryptedKey) {
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      getMachineKey(),
      Buffer.alloc(16, 0)
    );
    let decrypted = decipher.update(encryptedKey, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    console.error("Decryption failed - possibly wrong machine?");
    return null;
  }
}

const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  console.log(`gsq version ${version}`);
  process.exit(0);
}

if (args.includes("--init")) {
  initializeConfig();
} else if (args.includes("--offer")) {
  offerCommitMessage();
} else {
  console.log("Usage:");
  console.log("  gsq --init      Initialize configuration");
  console.log("  gsq --offer     Generate commit message suggestions");
  console.log("  gsq --version  Show version");
  process.exit(1);
}

async function initializeConfig() {
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

async function offerCommitMessage() {
  try {
    // Check if config file exists
    if (!fs.existsSync(configPath)) {
      console.error(
        "Error: Configuration file not found. Run gsq --init first."
      );
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    // Check if any providers are configured
    if (!config.providers || Object.keys(config.providers).length === 0) {
      console.error("Error: No providers configured. Run gsq --init first.");
      process.exit(1);
    }

    // Get git status and diff
    let gitStatus, gitDiff;
    try {
      // First check if there are any changes at all
      gitStatus = execSync("git status --porcelain").toString().trim();
      if (!gitStatus) {
        console.log(
          "No changes detected in git working tree (staged or unstaged)."
        );
        process.exit(0);
      }

      // Try to get staged changes first
      gitDiff = execSync("git diff --cached").toString().trim();
      if (gitDiff) {
        console.log("Using staged changes for commit message generation.");
      } else {
        // Fall back to unstaged changes
        gitDiff = execSync("git diff").toString().trim();
        if (gitDiff) {
          console.log(
            "Warning: No staged changes found. Using unstaged changes instead."
          );
        } else {
          // This case should theoretically never happen since we checked git status first
          console.log(
            "No changes detected in git working tree or staging area."
          );
          process.exit(0);
        }
      }
    } catch (error) {
      console.error("Error getting git info:", error.message);
      process.exit(1);
    }

    // Rest of your function remains the same...
    console.log("\nGenerating commit messages...\n");

    let allSuggestions = [];
    let providerCount = 0;

    // Process each provider and collect suggestions
    for (const [providerKey, providerConfig] of Object.entries(
      config.providers
    )) {
      const provider = providers.find((p) => p.key === providerKey);
      if (!provider) continue;

      providerCount++;
      try {
        const messages = await generateCommitMessage(
          providerKey,
          providerConfig.apiUrl,
          providerConfig.apiKey,
          gitStatus,
          gitDiff
        );

        console.log(chalk.bold.blue(`\n=== ${provider.name} Suggestions ===`));

        if (Array.isArray(messages)) {
          messages.forEach((msg) => {
            const displayMsg = msg.type
              ? `${msg.type}: ${msg.message}`
              : msg.message;
            // Using bullet points instead of numbers
            console.log(chalk.bold(`• ${displayMsg}`));
            if (msg.description) console.log(`  ${msg.description}`);
            console.log();

            // Store with provider prefix and original message
            allSuggestions.push({
              name: `${provider.name}: ${displayMsg}`,
              value: msg.type ? `${msg.type}: ${msg.message}` : msg.message,
              provider: provider.name,
              description: msg.description || "",
            });
          });
        } else {
          console.log(messages);
          allSuggestions.push({
            name: `${provider.name}: ${messages}`,
            value: messages,
            provider: provider.name,
            description: "",
          });
        }
      } catch (error) {
        console.error(chalk.red(`Error with ${provider.name}:`), error.message);
      }
    }

    if (allSuggestions.length === 0) {
      console.log(chalk.yellow("No suggestions were generated."));
      process.exit(0);
    }

    // Add option to not commit
    allSuggestions.push({
      name: chalk.gray("None (exit without committing)"),
      value: null,
    });

    // Prompt user to select one or more suggestions
    const { selectedMessages } = await inquirer.prompt([
      {
        type: "checkbox", // Changed from 'list' to 'checkbox' for multiple selection
        name: "selectedMessages",
        message: "Select commit message(s):",
        choices: allSuggestions,
        pageSize: 15,
        loop: false,
        filter: (input) => {
          if (!Array.isArray(input)) return [];
          return input
            .map((item) => {
              if (item && typeof item === "string") {
                return item.split(": ").slice(1).join(": ");
              }
              return item;
            })
            .filter(Boolean);
        },
      },
    ]);

    if (!selectedMessages || selectedMessages.length === 0) {
      console.log(chalk.gray("\nNo commit messages selected. Exiting."));
      process.exit(0);
    }

    // Join multiple messages if selected
    const commitMessage = selectedMessages.join("\n\n");

    // Show final confirmation with option to edit
    const { commitAction } = await inquirer.prompt([
      {
        type: "list",
        name: "commitAction",
        message: `How would you like to proceed with this commit message?`,
        choices: [
          {
            name: "Commit with this message",
            value: "commit",
          },
          {
            name: "Edit message before committing",
            value: "edit",
          },
          {
            name: "Cancel",
            value: "cancel",
          },
        ],
        default: "commit",
      },
    ]);

    if (commitAction === "cancel") {
      console.log(chalk.gray("\nCommit cancelled."));
      process.exit(0);
    }

    if (commitAction === "edit") {
      // Create a temporary file with the commit message
      const tempFile = path.join(os.tmpdir(), `gsq-commit-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, commitMessage);

      // Open the editor (respects git's core.editor config, falls back to system default)
      const editor =
        process.env.GIT_EDITOR ||
        process.env.VISUAL ||
        process.env.EDITOR ||
        "vi"; // default fallback

      try {
        execSync(`${editor} "${tempFile}"`, { stdio: "inherit" });
        commitMessage = fs.readFileSync(tempFile, "utf8").trim();
      } catch (e) {
        console.error(chalk.red("Error editing commit message:"), e.message);
        process.exit(1);
      } finally {
        try {
          fs.unlinkSync(tempFile);
        } catch {}
      }

      if (!commitMessage) {
        console.log(chalk.gray("\nEmpty commit message. Aborting."));
        process.exit(0);
      }
    }

    try {
      const sanitizedMessage = commitMessage.replace(/"/g, '\\"');
      execSync(`git commit -m "${sanitizedMessage}"`, { stdio: "inherit" });
      console.log(chalk.green.bold(`\n✓ Successfully committed with message:`));
      console.log(chalk.cyan(`"${commitMessage}"`));

      // Show the commit hash
      try {
        const commitHash = execSync("git rev-parse --short HEAD")
          .toString()
          .trim();
        console.log(chalk.gray(`Commit hash: ${commitHash}`));
      } catch (hashError) {
        console.log(chalk.gray("(Could not retrieve commit hash)"));
      }
    } catch (commitError) {
      console.error(
        chalk.red.bold("\n✗ Failed to create commit:"),
        commitError.message
      );
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(chalk.red.bold("\nError:"), error.message);
    process.exit(1);
  }
}

async function generateCommitMessage(
  providerKey,
  apiUrl,
  apiKey,
  gitStatus,
  gitDiff
) {
  // Updated prompt to request 10 commit messages instead of 5
  const prompt = `You are a git commit message assistant. Analyze these changes and suggest 10 commit messages in EXACTLY this JSON format:
{
  "suggestions": [
    {
      "type": "feat|fix|chore|docs|style|refactor|test|fun",
      "message": "concise description",
      "description": "optional longer explanation"
    }
  ]
}

Git Status:
${gitStatus}

Changed Files Content:
${gitDiff}

Include:
- 4 conventional commits (with type prefix)
- 4 plain descriptive messages (type can be empty)
- 2 fun/creative messages (type "fun")
- Sort by relevance (most important changes first)`;

  switch (providerKey) {
    case "openai":
      return await callOpenAI(apiUrl, apiKey, prompt);
    case "gemini":
      return await callGemini(apiUrl, apiKey, prompt);
    case "claude":
      return await callClaude(apiUrl, apiKey, prompt);
    case "deepseek":
      return await callDeepseek(apiUrl, apiKey, prompt);
    default:
      throw new Error(`Unsupported provider: ${providerKey}`);
  }
}

async function callOpenAI(apiUrl, encryptedKey, prompt) {
  const apiKey = decryptApiKey(encryptedKey);
  if (!apiKey) {
    throw new Error("Failed to decrypt API key");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0]?.message?.content).suggestions;
  } catch {
    return data.choices[0]?.message?.content || "No response from OpenAI";
  }
}

async function callGemini(apiUrl, encryptedKey, prompt) {
  // Decrypt the API key first
  const apiKey = decryptApiKey(encryptedKey);
  if (!apiKey) {
    throw new Error("Failed to decrypt Gemini API key");
  }

  const modelName =
    providers.find((p) => p.key === "gemini")?.modelName || "gemini-pro";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.7, // Added for more consistent responses
      },
      safetySettings: [
        // Added safety settings
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
      throw new Error(`Gemini API error: ${errorMsg}`);
    }

    const data = await response.json();

    // Enhanced response validation
    if (
      !data.candidates ||
      !Array.isArray(data.candidates) ||
      !data.candidates[0]?.content?.parts?.[0]?.text
    ) {
      console.error("Invalid Gemini response structure:", data);
      throw new Error("Received malformed response from Gemini API");
    }

    const textResponse = data.candidates[0].content.parts[0].text;

    try {
      const parsed = JSON.parse(textResponse);
      if (!Array.isArray(parsed?.suggestions)) {
        throw new Error("Suggestions array missing in response");
      }

      // Validate each suggestion has at least a message
      return parsed.suggestions.map((suggestion) => ({
        type: suggestion.type || "",
        message: suggestion.message || "No message provided",
        description: suggestion.description || "",
      }));
    } catch (parseError) {
      // Fallback for non-JSON responses
      return [
        {
          type: "text",
          message: textResponse,
          description: "Raw Gemini response",
        },
      ];
    }
  } catch (error) {
    console.error(chalk.red.bold("Gemini API Failed:"), error.message);
    throw new Error(`Gemini: ${error.message}`);
  }
}

async function callClaude(apiUrl, encryptedKey, prompt) {
  const apiKey = decryptApiKey(encryptedKey);
  if (!apiKey) {
    throw new Error("Failed to decrypt API key");
  }
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();
  try {
    return JSON.parse(data.content[0]?.text).suggestions;
  } catch {
    return data.content[0]?.text || "No response from Claude";
  }
}
async function callDeepseek(apiUrl, encryptedKey, prompt) {
    const apiKey = decryptApiKey(encryptedKey);
    if (!apiKey) {
      throw new Error('Failed to decrypt DeepSeek API key');
    }
  
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{
            role: "user",
            content: prompt
          }],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        }),
        timeout: 10000
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }
  
      const data = await response.json();
  
      // Properly handle DeepSeek's response structure
      if (!data.choices || !data.choices[0]?.message?.content) {
        console.error('Invalid DeepSeek response:', data);
        throw new Error('Invalid response structure from DeepSeek API');
      }
  
      const content = data.choices[0].message.content;
  
      try {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed.suggestions)) {
          throw new Error('Expected suggestions array in response');
        }
        return parsed.suggestions;
      } catch (parseError) {
        // If JSON parsing fails, return the content as a single suggestion
        return [{
          type: 'text',
          message: content,
          description: 'Raw DeepSeek response'
        }];
      }
    } catch (error) {
      console.error(chalk.red('DeepSeek API Error:'), error.message);
      throw new Error(`DeepSeek: ${error.message}`);
    }
  }

function askQuestion(question, sensitive = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (sensitive) {
      const stdin = process.openStdin();
      process.stdin.on("data", (char) => {
        char = char + "";
        switch (char) {
          case "\n":
          case "\r":
          case "\u0004":
            stdin.pause();
            break;
          default:
            process.stdout.write(
              "\x1B[2K\x1B[200D" + question + "*".repeat(rl.line.length)
            );
            break;
        }
      });
    }

    rl.question(question, (answer) => {
      if (sensitive) {
        process.stdin.removeAllListeners("data");
      }
      rl.close();
      resolve(answer);
    });
  });
}
