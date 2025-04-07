import { callClaude } from "./callClaude.js";
import { callDeepseek } from "./callDeepseek.js";
import { callGemini } from "./callGemini.js";
import { callOpenAI } from "./callOpenAI.js";

export async function generateCommitMessage(providerKey, provider, gitStatus, gitDiff) {
  const prompt = `You are a highly skilled git commit message assistant, capable of generating concise and informative commit messages. Analyze the following changes and provide 10 distinct commit message suggestions in EXACTLY this JSON format:

{
  "suggestions": [
    {
      "type": "feat|fix|chore|docs|style|refactor|test",
      "message": "concise description",
      "description": "optional longer explanation"
    }
  ]
}

Follow these guidelines for generating the suggestions:

- **Semantic Commit Messages:** Prioritize the use of Semantic Commit Messages. Include at least 4 suggestions that adhere to the conventional commit format (e.g., "feat: Add user authentication").
- **Granular Fixes:** When suggesting fixes, aim for specificity. If a fix addresses a particular issue or component, include that in the message (e.g., "fix(tile): Correct rendering issue with overlapping elements"). You can also use a more general "fix: ..." if the scope is broader.
- **Feature Introduction:** Clearly indicate new features with the "feat" type (e.g., "feat: Implement real-time collaboration").
- **Chores and Maintenance:** Use "chore" for tasks like dependency updates or build configuration changes (e.g., "chore: Update eslint dependencies").
- **Plain Descriptive Messages:** Include 4 plain descriptive messages that are still informative but do not strictly adhere to the conventional commit format. These should be clear and to the point (e.g., "Improve error handling in API requests").
- **Relevance Sorting:** Order the suggestions by their perceived relevance to the changes. Messages addressing significant new features or critical fixes should appear earlier in the list.
- **Conciseness:** Keep the "message" field brief and easy to understand.
- **Optional Description:** Use the "description" field to provide additional context or details if necessary.

Git Status:
${gitStatus}

Changed Files Content:
${gitDiff}`;

  switch (providerKey) {
    case "openai":
      return await callOpenAI(provider, prompt);
    case "gemini":
      return await callGemini(provider, prompt);
    case "claude":
      return await callClaude(provider, prompt);
    case "deepseek":
      return await callDeepseek(provider, prompt);
    default:
      throw new Error(`Unsupported provider: ${providerKey}`);
  }
}
