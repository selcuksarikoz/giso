import { decryptApiKey } from './crypto.js';

export async function callClaude(provider, prompt) {
  const apiKey = decryptApiKey(provider.apiKey);
  if (!apiKey) {
    throw new Error('Failed to decrypt API key');
  }
  const response = await fetch(provider.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: provider.modelName,
      temperature: provider?.temperature || 0.4,
      max_tokens: provider?.maxTokens || 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  console.log("Claude API Response:", data); // Add this line

  try {
    return JSON.parse(data.content[0]?.text).suggestions;
  } catch {
    return data.content[0]?.text || 'No response from Claude';
  }
}
