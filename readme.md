# 🚀 giso - Git Super Offer

[![Version](https://img.shields.io/npm/v/giso.svg)](https://www.npmjs.com/package/giso)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

AI-powered commit message suggestions for your Git workflow. `giso` analyzes your changes and offers intelligent commit message suggestions using cutting-edge AI providers including OpenAI, Anthropic's Claude, Google's Gemini, LM Studio (localhost), OpenRouter and DeepSeek.

## ✨ Features

- 🤖 Multi-LLM support (OpenAI, Claude, Gemini, DeepSeek, LM Studio, OpenRouter)
- 🔐 Secure API key storage (encrypted with machine-specific key)
- ⚡️ Real-time diff analysis for precise suggestions
- 🎛️ Configurable AI provider selection
- 📦 Lightweight min-dependency package

## 🔌 Supported AI Providers

- **OpenAI** (GPT-3.5, GPT-4) - 🤫
- **Anthropic Claude** (Claude 2, Claude 3) 🤫
- **Google Gemini** (Gemini Pro) 👍
- **OpenRouter** (Qwen/Deepsek/Nvidia/Gemini !Free) 👍
- **LM Studio (localhost)** (default) 👍
- **DeepSeek** (DeepSeek Chat) 🤫

## 🛠️ Setup

```bash
npm i -g giso
```

```bash
giso --init  # Configure your preferred AI provider
```

## 🚀 Usage

```bash
# Initialize configuration
giso --init || -i

# Generate commit message suggestions
giso --offer || -o

# Show current configuration
giso --config || -c

# Update giso to the latest version
giso --update || -u

# Show version
giso --version || -v
```

## 🌟 Why Choose giso?

- **Smart Suggestions**: Leverages state-of-the-art LLMs to understand your code changes
- **Privacy Focused**: Your code diffs never leave your machine without encryption
- **Flexible**: Switch between AI providers based on your needs
- **Context-Aware**: Analyzes both code changes and git history for better suggestions
- **Team Friendly**: Consistent commit messages across your team

## 🔒 Security Architecture

Your API keys are protected with:

- SHA-256 encryption using machine-bound keys
- Hardware-backed encryption where available
- Memory-zeroing after use
- Optional keyring integration (coming soon)
