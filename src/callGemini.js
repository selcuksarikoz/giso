import chalk from "chalk";
import { decryptApiKey } from "./crypto.js";

export async function callGemini(provider, prompt) {
  // Decrypt the API key first
  const apiKey = decryptApiKey(provider.apiKey);
  if (!apiKey) {
    throw new Error("Failed to decrypt Gemini API key");
  }

  const url = `${provider.apiUrl}/${provider.modelName}:generateContent?key=${apiKey}`;

  try {
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: provider?.temperature || 0.4,
        maxOutputTokens: provider?.maxTokens || 2000,
      },
      safetySettings: [
        // Added safety settings
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
      throw new Error(`Gemini API error: ${errorMsg}`);
    }

    const data = await response.json();

    // Enhanced response validation
    if (
      !data.candidates ||
      !Array.isArray(data.candidates) ||
      !data.candidates[0]?.content?.parts?.[0]?.text
    ) {
      console.error("Invalid Gemini response structure:", data);
      throw new Error("Received malformed response from Gemini API");
    }

    const textResponse = data.candidates[0].content.parts[0].text;

    try {
      const parsed = JSON.parse(textResponse);
      if (!Array.isArray(parsed?.suggestions)) {
        throw new Error("Suggestions array missing in response");
      }

      // Validate each suggestion has at least a message
      return parsed.suggestions.map((suggestion) => ({
        type: suggestion.type || "",
        message: suggestion.message || "No message provided",
        description: suggestion.description || "",
      }));
    } catch (parseError) {
      // Fallback for non-JSON responses
      return [
        {
          type: "text",
          message: textResponse,
          description: "Raw Gemini response",
        },
      ];
    }
  } catch (error) {
    console.error(chalk.red.bold("Gemini API Failed:"), error.message);
    throw new Error(`Gemini: ${error.message}`);
  }
}
