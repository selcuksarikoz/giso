import { decryptApiKey } from './crypto.js';

export async function callClaude(apiUrl, encryptedKey, prompt) {
  const apiKey = decryptApiKey(encryptedKey);
  if (!apiKey) {
    throw new Error('Failed to decrypt API key');
  }
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
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
  try {
    return JSON.parse(data.content[0]?.text).suggestions;
  } catch {
    return data.content[0]?.text || 'No response from Claude';
  }
}
