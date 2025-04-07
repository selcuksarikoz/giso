import chalk from "chalk";
import { decryptApiKey } from "./crypto.js";

export async function callDeepseek(apiUrl, encryptedKey, prompt) {
  const apiKey = decryptApiKey(encryptedKey);
  if (!apiKey) {
    throw new Error('Failed to decrypt DeepSeek API key');
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
      timeout: 10000
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Properly handle DeepSeek's response structure
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error('Invalid DeepSeek response:', data);
      throw new Error('Invalid response structure from DeepSeek API');
    }

    const content = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.suggestions)) {
        throw new Error('Expected suggestions array in response');
      }
      return parsed.suggestions;
    } catch (parseError) {
      // If JSON parsing fails, return the content as a single suggestion
      return [{
        type: 'text',
        message: content,
        description: 'Raw DeepSeek response'
      }];
    }
  } catch (error) {
    console.error(chalk.red('DeepSeek API Error:'), error.message);
    throw new Error(`DeepSeek: ${error.message}`);
  }
}
