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
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/models",
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
  {
    name: "locahost (LM Studio)",
    key: "lmstudio",
    apiUrl: "http://127.0.0.1:1234/v1/chat/completions",
    modelName: "meta-llama-3.1-8b-instruct",
  },
];
