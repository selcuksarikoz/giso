import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import os from "os";
import path from "path";
import { configPath } from "./initializeConfig.js";
import { providers } from "./providers.js";
import { generateCommitMessage } from "./generateCommitMessage.js";

export async function offerCommitMessage() {
  try {
    if (!fs.existsSync(configPath)) {
      console.error("Error: Configuration file not found. Run giso --init first.");
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    if (!config.providers || !Object.keys(config.providers)?.length) {
      console.error("Error: No providers configured. Run giso --init first.");
      process.exit(1);
    }

    let gitStatus, gitDiff;
    try {
      gitStatus = execSync("git status --porcelain").toString().trim();
      if (!gitStatus) {
        console.log("No changes detected in git working tree.");
        process.exit(0);
      }

      gitDiff = execSync("git diff --cached").toString().trim();
      if (!gitDiff) {
        gitDiff = execSync("git diff").toString().trim();
        if (gitDiff)
          console.log(chalk.yellow("Using unstaged changes for commit message generation."));
      }
    } catch (error) {
      console.error("Error getting git info:", error.message);
      process.exit(1);
    }

    console.log("\nGenerating commit messages...\n");

    let allSuggestions = [];
    for (const [providerKey, providerConfig] of Object.entries(config.providers)) {
      const provider = providers.find((p) => p.key === providerKey);
      if (!provider) continue;

      try {
        const messages = await generateCommitMessage(
          providerKey,
          providerConfig,
          gitStatus,
          gitDiff
        );
        console.log(chalk.bold.blue(`\n=== ${provider.name} Suggestions ===`));

        if (Array.isArray(messages)) {
          messages.forEach((msg) => {
            const displayMsg = msg.type ? `${msg.type}: ${msg.message}` : msg.message;
            console.log(chalk.bold(`• ${displayMsg}`));
            if (msg.description) console.log(`  ${msg.description}`);
            console.log();
            allSuggestions.push({
              name: `${provider.name}: ${displayMsg}`,
              value: msg,
              provider: provider.name,
            });
          });
        } else {
          console.log(messages);
          allSuggestions.push({
            name: `${provider.name}: ${messages}`,
            value: { message: messages },
            provider: provider.name,
          });
        }
      } catch (error) {
        console.error(chalk.red(`Error with ${provider.name}:`), error.message);
      }
    }

    if (!allSuggestions?.length) {
      console.log(chalk.yellow("No suggestions were generated."));
      process.exit(0);
    }

    allSuggestions.push({
      name: chalk.gray("Exit without committing"),
      value: null,
    });

    const { selectedMessages } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedMessages",
        message: "Select commit message(s):",
        choices: allSuggestions,
        pageSize: 15,
        loop: false,
      },
    ]);

    if (!selectedMessages || !selectedMessages?.length) {
      console.log(chalk.gray("\nNo commit messages selected. Exiting."));
      process.exit(0);
    }

    let commitMessage = selectedMessages
      .filter(Boolean)
      .map((msg) => `${msg.type ? `${msg.type}: ` : ""}${msg.message}`.trim())
      .join("\n")
      .trim();

    const { commitAction } = await inquirer.prompt([
      {
        type: "list",
        name: "commitAction",
        message: "Commit action:",
        choices: [
          { name: "Stage all changes and commit", value: "commit" },
          { name: "Edit message before committing", value: "edit" },
          { name: "Cancel", value: "cancel" },
        ],
        default: "commit",
      },
    ]);

    if (commitAction === "cancel") {
      console.log(chalk.gray("\nCommit cancelled."));
      process.exit(0);
    }

    if (commitAction === "edit") {
      const tempFile = path.join(os.tmpdir(), `giso-commit-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, commitMessage);
      const editor = process.env.GIT_EDITOR || process.env.VISUAL || process.env.EDITOR || "vi";
      try {
        execSync(`${editor} "${tempFile}"`, { stdio: "inherit" });
        commitMessage = fs.readFileSync(tempFile, "utf8").trim();
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
      console.log(chalk.gray("\nStaging all changes..."));
      execSync("git add .", { stdio: "inherit" });
      const sanitizedMessage = commitMessage.replace(/"/g, '\\"');
      execSync(`git commit -m "${sanitizedMessage}"`, { stdio: "inherit" });
      console.log(chalk.green.bold("\n✓ Commit successful:"));
      console.log(chalk.cyan(commitMessage));
      try {
        const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
        console.log(chalk.gray(`Commit hash: ${commitHash}`));
      } catch {}
    } catch (error) {
      console.error(chalk.red.bold("\n✗ Commit failed:"), error.message);
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red.bold("\nError:"), error.message);
    process.exit(1);
  }
}
