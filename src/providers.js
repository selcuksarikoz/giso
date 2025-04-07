// Supported AI providers with their API URLs
export const providers = [
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
