// Supported AI providers with their API URLs
export const providers = [
  {
    name: "OpenAI",
    key: "openai",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    modelName: "gpt-4o",
  },
  {
    name: "Gemini",
    key: "gemini",
    apiUrl:
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    modelName: "gemini-2.0-flash",
  },
  {
    name: "Claude Sonnet",
    key: "claude",
    apiUrl: "https://api.anthropic.com/v1/messages",
    modelName: "claude-3-sonnet-20240229",
  },
  {
    name: "DeepSeek",
    key: "deepseek",
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    modelName: "deepseek-chat",
  },
];
