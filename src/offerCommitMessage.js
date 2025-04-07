import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';
import { configPath } from './initializeConfig.js';
import { providers } from './providers.js';
import { generateCommitMessage } from './generateCommitMessage.js';

export async function offerCommitMessage() {
  try {
    // Check if config file exists
    if (!fs.existsSync(configPath)) {
      console.error('Error: Configuration file not found. Run gsq --init first.');
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Check if any providers are configured
    if (!config.providers || Object.keys(config.providers).length === 0) {
      console.error('Error: No providers configured. Run gsq --init first.');
      process.exit(1);
    }

    // Get git status and diff
    let gitStatus, gitDiff;
    try {
      // First check if there are any changes at all
      gitStatus = execSync('git status --porcelain').toString().trim();
      if (!gitStatus) {
        console.log('No changes detected in git working tree (staged or unstaged).');
        process.exit(0);
      }

      // Try to get staged changes first
      gitDiff = execSync('git diff --cached').toString().trim();
      if (gitDiff) {
        console.log('Using staged changes for commit message generation.');
      } else {
        // Fall back to unstaged changes
        gitDiff = execSync('git diff').toString().trim();
        if (gitDiff) {
          console.log('Warning: No staged changes found. Using unstaged changes instead.');
        } else {
          // This case should theoretically never happen since we checked git status first
          console.log('No changes detected in git working tree or staging area.');
          process.exit(0);
        }
      }
    } catch (error) {
      console.error('Error getting git info:', error.message);
      process.exit(1);
    }

    // Rest of your function remains the same...
    console.log('\nGenerating commit messages...\n');

    let allSuggestions = [];
    let providerCount = 0;

    // Process each provider and collect suggestions
    for (const [providerKey, providerConfig] of Object.entries(config.providers)) {
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
            const displayMsg = msg.type ? `${msg.type}: ${msg.message}` : msg.message;
            // Using bullet points instead of numbers
            console.log(chalk.bold(`• ${displayMsg}`));
            if (msg.description) console.log(`  ${msg.description}`);
            console.log();

            // Store with provider prefix and original message
            allSuggestions.push({
              name: `${provider.name}: ${displayMsg}`,
              value: msg.type ? `${msg.type}: ${msg.message}` : msg.message,
              provider: provider.name,
              description: msg.description || '',
            });
          });
        } else {
          console.log(messages);
          allSuggestions.push({
            name: `${provider.name}: ${messages}`,
            value: messages,
            provider: provider.name,
            description: '',
          });
        }
      } catch (error) {
        console.error(chalk.red(`Error with ${provider.name}:`), error.message);
      }
    }

    if (allSuggestions.length === 0) {
      console.log(chalk.yellow('No suggestions were generated.'));
      process.exit(0);
    }

    // Add option to not commit
    allSuggestions.push({
      name: chalk.gray('None (exit without committing)'),
      value: null,
    });

    // Prompt user to select one or more suggestions
    const { selectedMessages } = await inquirer.prompt([
      {
        type: 'checkbox', // Changed from 'list' to 'checkbox' for multiple selection
        name: 'selectedMessages',
        message: 'Select commit message(s):',
        choices: allSuggestions,
        pageSize: 15,
        loop: false,
        filter: (input) => {
          if (!Array.isArray(input)) return [];
          return input
            .map((item) => {
              if (item && typeof item === 'string') {
                return item.split(': ').slice(1).join(': ');
              }
              return item;
            })
            .filter(Boolean);
        },
      },
    ]);

    if (!selectedMessages || selectedMessages.length === 0) {
      console.log(chalk.gray('\nNo commit messages selected. Exiting.'));
      process.exit(0);
    }

    // Join multiple messages if selected
    let commitMessage = selectedMessages.join('\n\n');

    // Show final confirmation with option to edit
    const { commitAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'commitAction',
        message: `How would you like to proceed with this commit message?`,
        choices: [
          {
            name: 'Commit with this message',
            value: 'commit',
          },
          {
            name: 'Edit message before committing',
            value: 'edit',
          },
          {
            name: 'Cancel',
            value: 'cancel',
          },
        ],
        default: 'commit',
      },
    ]);

    if (commitAction === 'cancel') {
      console.log(chalk.gray('\nCommit cancelled.'));
      process.exit(0);
    }

    if (commitAction === 'edit') {
      // Create a temporary file with the commit message
      const tempFile = path.join(os.tmpdir(), `gsq-commit-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, commitMessage);

      // Open the editor (respects git's core.editor config, falls back to system default)
      const editor = process.env.GIT_EDITOR || process.env.VISUAL || process.env.EDITOR || 'vi'; // default fallback

      try {
        execSync(`${editor} "${tempFile}"`, { stdio: 'inherit' });
        commitMessage = fs.readFileSync(tempFile, 'utf8').trim();
      } catch (e) {
        console.error(chalk.red('Error editing commit message:'), e.message);
        process.exit(1);
      } finally {
        try {
          fs.unlinkSync(tempFile);
        } catch {}
      }

      if (!commitMessage) {
        console.log(chalk.gray('\nEmpty commit message. Aborting.'));
        process.exit(0);
      }
    }

    try {
      const sanitizedMessage = commitMessage.replace(/"/g, '\\"');
      execSync(`git commit -m "${sanitizedMessage}"`, { stdio: 'inherit' });
      console.log(chalk.green.bold(`\n✓ Successfully committed with message:`));
      console.log(chalk.cyan(`"${commitMessage}"`));

      // Show the commit hash
      try {
        const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
        console.log(chalk.gray(`Commit hash: ${commitHash}`));
      } catch (hashError) {
        console.log(chalk.gray('(Could not retrieve commit hash)'));
      }
    } catch (commitError) {
      console.error(chalk.red.bold('\n✗ Failed to create commit:'), commitError.message);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(chalk.red.bold('\nError:'), error.message);
    process.exit(1);
  }
}
