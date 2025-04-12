import { callClaude } from "./callClaude.js";
import { callDeepseek } from "./callDeepseek.js";
import { callGemini } from "./callGemini.js";
import { callOpenAI } from "./callOpenAI.js";
import { callLocalhostLM } from "./callLocalhostLM.js";

export async function generateCommitMessage(
  providerKey,
  provider,
  gitStatus,
  gitDiff,
) {
  const maxSuggestions = provider?.maxSuggestions || 10;

  const prompt = `You are an expert creative and skilled git commit message generator. Analyze the following git status and file content changes to produce EXACTLY ${maxSuggestions} distinct commit message suggestions in EXACTLY the following JSON format:

{
  "suggestions": [
    {
      "type": "feat|fix|chore|docs|style|refactor|test",
      "message": "concise description",
      "description": "optional longer explanation"
    }
  ]
}

Your suggestions must adhere to these enhanced guidelines:

- **Strictly Adhere to Semantic Commit Messages:** Generate at least ${Math.min(maxSuggestions, 3)} commit messages that **literally** use the Semantic Commit Messages format (e.g., "feat: Implement user authentication"). Ensure the 'type' field is one of the allowed semantic types.
- **Avoid Duplicate Semantic Messages:** Ensure that within the semantic commit message suggestions, each combination of 'type' and 'message' is unique. **Furthermore, ensure that there are no suggestions where the 'type' and 'message' are identical (e.g., avoid both "fix: Resolve issue" and "fix: Resolve issue", or "chore: Update dependencies" and "chore: Update dependencies").**
- **Granular and Specific Fixes:** When suggesting fixes, aim for maximum specificity. If a fix addresses a particular area or component, include it in the scope (e.g., "fix(payment): Resolve issue with double charging users"). Use a general "fix: ..." only for truly broad fixes.
- **Clear Feature Introductions:** Clearly denote new features using the "feat" type (e.g., "feat: Introduce multi-factor authentication").
- **Categorize Maintenance Tasks Accurately:** Utilize the "chore" type for maintenance tasks such as dependency updates, build process modifications, or tooling changes (e.g., "chore: Bump react-router-dom to v6").
- **Provide Plain and Informative Alternatives:** Include plain descriptive commit messages that are still informative and to the point, without strictly following the semantic format (e.g., "Improved logging for API requests").
- ${provider?.funnyCommitMsg ? "**Include Funny Slang and Emoji Commit Messages:** Add **at least 1** commit messages that are lighthearted, use funny slang, and include **relevant** emojis. The other funny commit message should be distinct in its humor and slang.**" : ""}
- **Order by Relevance:** Sort the suggestions based on their perceived relevance to the changes. The most significant changes (new features, critical fixes) should appear earlier in the list.
- **Maintain Conciseness:** The "message" field should be brief and easy to understand.
- **Use Optional Descriptions for Context:** Employ the "description" field to provide additional context, reasoning, or implementation details when necessary.
- **Strict JSON Output Only:** Return **only** the JSON object as specified. Do not include any surrounding text, code blocks, or explanations.

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
    case "lmstudio":
      return await callLocalhostLM(provider, prompt);
    default:
      throw new Error(`Unsupported provider: ${providerKey}`);
  }
}
