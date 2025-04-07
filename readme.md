# 🚀 gsq - Git Suggest Queue

[![Version](https://img.shields.io/npm/v/gsq.svg)](https://www.npmjs.com/package/gsq)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

AI-powered commit message suggestions for your Git workflow. `gsq` analyzes your changes and offers intelligent commit message suggestions using cutting-edge AI providers including OpenAI, Anthropic's Claude, Google's Gemini, and DeepSeek.

## ✨ Features

- 🤖 Multi-LLM support (OpenAI, Claude, Gemini, DeepSeek)
- 🔐 Secure API key storage (encrypted with machine-specific key)
- ⚡️ Real-time diff analysis for precise suggestions
- 🎛️ Configurable AI provider selection
- 📦 Lightweight zero-dependency package

## 🔌 Supported AI Providers

- **OpenAI** (GPT-3.5, GPT-4)
- **Anthropic Claude** (Claude 2, Claude 3)
- **Google Gemini** (Gemini Pro)
- **DeepSeek** (DeepSeek Chat)

## 🛠️ Setup

```bash
npm install -g gsq
gsq --init  # Configure your preferred AI provider
```

## 🚀 Usage
```bash
# Generate commit message suggestions
gsq --offer

# Initialize configuration
gsq --init

# Show current configuration
gsq --config

# Show version
gsq --version
```

## 🌟 Why Choose gsq?

- **Smart Suggestions**: Leverages state-of-the-art LLMs to understand your code changes
- **Privacy Focused**: Your code diffs never leave your machine without encryption
- **Flexible**: Switch between AI providers based on your needs
- **Context-Aware**: Analyzes both code changes and git history for better suggestions
- **Team Friendly**: Consistent commit messages across your team

## 🔒 Security Architecture

Your API keys are protected with:
- AES-256 encryption using machine-bound keys
- Hardware-backed encryption where available
- Memory-zeroing after use
- Optional keyring integration (coming soon)
