
import { callClaude } from "./callClaude.js";
import { callDeepseek } from "./callDeepseek.js";
import { callGemini } from "./callGemini.js";
import { callOpenAI } from "./callOpenAI.js";

export async function generateCommitMessage(
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
