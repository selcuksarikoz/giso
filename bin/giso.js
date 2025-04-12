#!/usr/bin/env node
import e from "fs";
import t, { dirname as o, resolve as s } from "path";
import { fileURLToPath as n } from "url";
import r from "chalk";
import { execSync as i } from "child_process";
import a from "inquirer";
import c from "os";
import l from "crypto";
import m from "node-fetch";
function g() {
  const e2 = c.hostname();
  return l.createHash("sha256").update(e2).digest("hex").substring(0, 32);
}
function p(e2) {
  const t2 = l.createCipheriv("aes-256-cbc", g(), Buffer.alloc(16, 0));
  let o2 = t2.update(e2, "utf8", "hex");
  return o2 += t2.final("hex"), o2;
}
function d(e2) {
  try {
    const t2 = l.createDecipheriv("aes-256-cbc", g(), Buffer.alloc(16, 0));
    let o2 = t2.update(e2, "hex", "utf8");
    return o2 += t2.final("utf8"), o2;
  } catch (e3) {
    return console.error("Decryption failed - possibly wrong machine?"), null;
  }
}
const u = [{ name: "OpenAI", key: "openai", apiUrl: "https://api.openai.com/v1/chat/completions", modelName: "gpt-4o" }, { name: "Gemini", key: "gemini", apiUrl: "https://generativelanguage.googleapis.com/v1beta/models", modelName: "gemini-2.0-flash" }, { name: "Claude Sonnet", key: "claude", apiUrl: "https://api.anthropic.com/v1/messages", modelName: "claude-3-sonnet-20240229" }, { name: "DeepSeek", key: "deepseek", apiUrl: "https://api.deepseek.com/v1/chat/completions", modelName: "deepseek-chat" }, { name: "locahost (LM Studio)", key: "lmstudio", apiUrl: "http://127.0.0.1:1234/v1/chat/completions", modelName: "meta-llama-3.1-8b-instruct" }], h = t.join(c.homedir(), ".gisoconfig.json");
async function f(e2, t2, o2, s2) {
  for (; ; ) {
    const { numberInput: n2 } = await a.prompt([{ type: "input", name: "numberInput", message: e2, default: t2, validate: (e3) => {
      if (null == e3 || !String(e3).trim()) return true;
      const t3 = parseFloat(e3);
      return !isNaN(t3) && t3 >= o2 && t3 <= s2 || `Please enter a number between ${o2} and ${s2}`;
    } }]);
    return null != n2 && String(n2).trim() ? parseFloat(n2) : t2;
  }
}
async function y(e2, t2, o2, s2) {
  const n2 = (t2 == null ? void 0 : t2.maxSuggestions) || 10, i2 = `You are an expert creative and skilled git commit message generator. Analyze the following git status and file content changes to produce EXACTLY ${n2} distinct commit message suggestions in EXACTLY the following JSON format:

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

- **Strictly Adhere to Semantic Commit Messages:** Generate at least ${Math.min(n2, 3)} commit messages that **literally** use the Semantic Commit Messages format (e.g., "feat: Implement user authentication"). Ensure the 'type' field is one of the allowed semantic types.
- **Avoid Duplicate Semantic Messages:** Ensure that within the semantic commit message suggestions, each combination of 'type' and 'message' is unique. **Furthermore, ensure that there are no suggestions where the 'type' and 'message' are identical (e.g., avoid both "fix: Resolve issue" and "fix: Resolve issue", or "chore: Update dependencies" and "chore: Update dependencies").**
- **Granular and Specific Fixes:** When suggesting fixes, aim for maximum specificity. If a fix addresses a particular area or component, include it in the scope (e.g., "fix(payment): Resolve issue with double charging users"). Use a general "fix: ..." only for truly broad fixes.
- **Clear Feature Introductions:** Clearly denote new features using the "feat" type (e.g., "feat: Introduce multi-factor authentication").
- **Categorize Maintenance Tasks Accurately:** Utilize the "chore" type for maintenance tasks such as dependency updates, build process modifications, or tooling changes (e.g., "chore: Bump react-router-dom to v6").
- **Provide Plain and Informative Alternatives:** Include plain descriptive commit messages that are still informative and to the point, without strictly following the semantic format (e.g., "Improved logging for API requests").
- ${(t2 == null ? void 0 : t2.funnyCommitMsg) ? "**Include Funny Slang and Emoji Commit Messages:** Add **at least 1** commit messages that are lighthearted, use funny slang, and include **relevant** emojis. The other funny commit message should be distinct in its humor and slang.**" : ""}
- **Order by Relevance:** Sort the suggestions based on their perceived relevance to the changes. The most significant changes (new features, critical fixes) should appear earlier in the list.
- **Maintain Conciseness:** The "message" field should be brief and easy to understand.
- **Use Optional Descriptions for Context:** Employ the "description" field to provide additional context, reasoning, or implementation details when necessary.
- **Strict JSON Output Only:** Return **only** the JSON object as specified. Do not include any surrounding text, code blocks, or explanations.

Git Status:
${o2}

Changed Files Content:
${s2}`;
  switch (e2) {
    case "openai":
      return await async function(e3, t3) {
        var _a, _b, _c;
        const o3 = d(e3.apiKey);
        if (!o3) throw new Error("Failed to decrypt API key");
        try {
          const s3 = await fetch(e3.apiUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${o3}` }, body: JSON.stringify({ model: e3.modelName, messages: [{ role: "user", content: t3 }], temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, max_tokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3, response_format: { type: "json_object" } }) }), n3 = await s3.json();
          if (console.log("OpenAI API Response:", JSON.stringify(n3, null, 2)), !s3.ok) throw new Error(`API error: ${((_a = n3.error) == null ? void 0 : _a.message) || s3.statusText}`);
          if (!n3.choices || !Array.isArray(n3.choices)) throw new Error("Invalid response format: missing choices array");
          const r2 = (_c = (_b = n3.choices[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
          if (!r2) throw new Error("No message content in response");
          try {
            const e4 = JSON.parse(r2);
            if (!e4.suggestions) throw new Error("Response JSON missing suggestions property");
            return e4.suggestions;
          } catch (e4) {
            return console.warn("Failed to parse JSON response, returning raw content"), r2;
          }
        } catch (e4) {
          throw console.error("OpenAI API Error:", e4.message), new Error(`Failed to generate suggestions: ${e4.message}`);
        }
      }(t2, i2);
    case "gemini":
      return await async function(e3, t3) {
        var _a, _b, _c, _d, _e;
        const o3 = d(e3.apiKey);
        if (!o3) throw new Error("Failed to decrypt Gemini API key");
        const s3 = `${e3.apiUrl}/${e3.modelName}:generateContent?key=${o3}`;
        try {
          const o4 = { contents: [{ parts: [{ text: t3 }] }], generationConfig: { response_mime_type: "application/json", temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, maxOutputTokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3 }, safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }] }, n3 = await fetch(s3, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o4), timeout: 1e4 });
          if (!n3.ok) {
            const e4 = await n3.json(), t4 = ((_a = e4.error) == null ? void 0 : _a.message) || `HTTP ${n3.status}`;
            throw new Error(`Gemini API error: ${t4}`);
          }
          const r2 = await n3.json();
          if (!r2.candidates || !Array.isArray(r2.candidates) || !((_e = (_d = (_c = (_b = r2.candidates[0]) == null ? void 0 : _b.content) == null ? void 0 : _c.parts) == null ? void 0 : _d[0]) == null ? void 0 : _e.text)) throw console.error("Invalid Gemini response structure:", r2), new Error("Received malformed response from Gemini API");
          const i3 = r2.candidates[0].content.parts[0].text;
          try {
            const e4 = JSON.parse(i3);
            if (!Array.isArray(e4 == null ? void 0 : e4.suggestions)) throw new Error("Suggestions array missing in response");
            return e4.suggestions.map((e5) => ({ type: e5.type || "", message: e5.message || "No message provided", description: e5.description || "" }));
          } catch (e4) {
            return [{ type: "text", message: i3, description: "Raw Gemini response" }];
          }
        } catch (e4) {
          throw console.error(r.red.bold("Gemini API Failed:"), e4.message), new Error(`Gemini: ${e4.message}`);
        }
      }(t2, i2);
    case "claude":
      return await async function(e3, t3) {
        var _a, _b;
        const o3 = d(e3.apiKey);
        if (!o3) throw new Error("Failed to decrypt API key");
        const s3 = await fetch(e3.apiUrl, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": o3, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: e3.modelName, temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, max_tokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3, messages: [{ role: "user", content: t3 }], response_format: { type: "json_object" } }) }), n3 = await s3.json();
        console.log("Claude API Response:", n3);
        try {
          return JSON.parse((_a = n3.content[0]) == null ? void 0 : _a.text).suggestions;
        } catch {
          return ((_b = n3.content[0]) == null ? void 0 : _b.text) || "No response from Claude";
        }
      }(t2, i2);
    case "deepseek":
      return await async function(e3, t3) {
        var _a, _b, _c;
        const o3 = d(e3.apiKey);
        if (!o3) throw new Error("Failed to decrypt DeepSeek API key");
        try {
          const s3 = await fetch(e3.apiUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${o3}` }, body: JSON.stringify({ model: e3.modelName, messages: [{ role: "user", content: t3 }], temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, max_tokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3, response_format: { type: "json_object" } }), timeout: 1e4 });
          if (!s3.ok) {
            const e4 = await s3.json();
            throw new Error(((_a = e4.error) == null ? void 0 : _a.message) || `HTTP ${s3.status}`);
          }
          const n3 = await s3.json();
          if (!n3.choices || !((_c = (_b = n3.choices[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content)) throw console.error("Invalid DeepSeek response:", n3), new Error("Invalid response structure from DeepSeek API");
          const r2 = n3.choices[0].message.content;
          try {
            const e4 = JSON.parse(r2);
            if (!Array.isArray(e4.suggestions)) throw new Error("Expected suggestions array in response");
            return e4.suggestions;
          } catch (e4) {
            return [{ type: "text", message: r2, description: "Raw DeepSeek response" }];
          }
        } catch (e4) {
          throw console.error(r.red("DeepSeek API Error:"), e4.message), new Error(`DeepSeek: ${e4.message}`);
        }
      }(t2, i2);
    case "lmstudio":
      return await async function(e3, t3) {
        var _a, _b, _c;
        const o3 = d(e3.apiKey);
        if (!o3) throw new Error("Failed to decrypt API key");
        try {
          const s3 = await m(e3.apiUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${o3}` }, body: JSON.stringify({ model: e3.modelName, messages: [{ role: "user", content: t3 }], temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, max_tokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3, stream: false }) }), n3 = await s3.json();
          if (!s3.ok) throw new Error(`API error: ${((_a = n3.error) == null ? void 0 : _a.message) || s3.statusText}`);
          if (!n3.choices || !Array.isArray(n3.choices)) throw new Error("Invalid response format: missing choices array");
          const r2 = (_c = (_b = n3.choices[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
          if (!r2) throw new Error("No message content in response");
          try {
            const e4 = JSON.parse(r2);
            if (!e4.suggestions) throw new Error("Response JSON missing suggestions property");
            return e4.suggestions;
          } catch (e4) {
            return console.warn("Failed to parse JSON response, returning raw content"), r2;
          }
        } catch (e4) {
          throw console.error("OpenAI API Error:", e4.message), new Error(`Failed to generate suggestions: ${e4.message}`);
        }
      }(t2, i2);
    default:
      throw new Error(`Unsupported provider: ${e2}`);
  }
}
const w = s(o(n(import.meta.url)), "..", "package.json"), v = JSON.parse(e.readFileSync(w, "utf8")), { version: S } = v, x = process.argv.slice(2);
if (["--version", "-v"].includes(x[0])) console.log(`giso version ${S}`), process.exit(0);
else if (["--init", "-i"].includes(x[0])) !async function() {
  try {
    console.log("Select an AI provider:");
    const t2 = u.map((e2, t3) => ({ name: `${t3 + 1}. ${e2.name}`, value: t3 })), { selectedProviderIndex: o2 } = await a.prompt([{ type: "list", name: "selectedProviderIndex", message: "Choose a provider:", choices: t2, pageSize: 10 }]), { userChoiceModelName: s2 } = await a.prompt([{ type: "text", name: "userChoiceModelName", default: u[o2].modelName, message: `Enter the model name (Default ${u[o2].modelName}):` }]);
    void 0 === o2 && (console.error("Error: No provider selected."), console.error("Run giso --init again."), process.exit(1));
    const n2 = { providers: {} }, r2 = u[o2], { apiKey: i2 } = await a.prompt([{ type: "password", name: "apiKey", message: `Enter your ${r2.name} API key:`, mask: "*", validate: (e2) => !(null == e2 || !String(e2).trim()) || "API key cannot be empty" }]), c2 = await f(`Enter temperature for ${r2.name} (0.0-2.0, default 0.4):`, 0.4, 0, 2), l2 = await f(`Enter max tokens for ${r2.name} (1-10000, default 2000):`, 2e3, 1, 1e4), m2 = await f(`Enter max suggestions for ${r2.name} (1-100, default 10):`, 10, 1, 100), { funnyCommitMsg: g2 } = await a.prompt([{ type: "boolean", name: "funnyCommitMsg", default: true, message: "Do you want funny commit messages? Default: true" }]);
    n2.providers[r2.key] = { apiKey: p(i2), apiUrl: r2.apiUrl, modelName: s2 || r2.modelName, maxSuggestions: m2, funnyCommitMsg: g2, temperature: c2, maxTokens: l2 }, e.writeFileSync(h, JSON.stringify(n2, null, 2)), console.log(`
Configuration encrypted and saved to ${h}`), process.exit(0);
  } catch (e2) {
    console.error("\nInitialization failed:", e2.message), process.exit(1);
  }
}();
else if (["--offer", "-o"].includes(x[0])) !async function() {
  var _a;
  try {
    e.existsSync(h) || (console.error("Error: Configuration file not found. Run giso --init first."), process.exit(1));
    const o2 = JSON.parse(e.readFileSync(h, "utf8"));
    let s2, n2;
    o2.providers && ((_a = Object.keys(o2.providers)) == null ? void 0 : _a.length) || (console.error("Error: No providers configured. Run giso --init first."), process.exit(1));
    try {
      s2 = i("git status --porcelain").toString().trim(), s2 || (console.log("No changes detected in git working tree."), process.exit(0)), n2 = i("git diff --cached").toString().trim(), n2 || (n2 = i("git diff").toString().trim(), n2 && console.log(r.yellow("Using unstaged changes for commit message generation.")));
    } catch (e2) {
      console.error("Error getting git info:", e2.message), process.exit(1);
    }
    console.log("\nGenerating commit messages...\n");
    let l2 = [];
    for (const [e2, t2] of Object.entries(o2.providers)) {
      const o3 = u.find((t3) => t3.key === e2);
      if (o3) try {
        const i2 = await y(e2, t2, s2, n2);
        console.log(r.bold.blue(`
=== ${o3.name} Suggestions ===`)), Array.isArray(i2) ? i2.forEach((e3) => {
          const t3 = e3.type ? `${e3.type}: ${e3.message}` : e3.message;
          console.log(r.bold(`• ${t3}`)), e3.description && console.log(`  ${e3.description}`), console.log(), l2.push({ name: `${o3.name}: ${t3}`, value: e3, provider: o3.name });
        }) : l2.push({ name: `${o3.name}: ${i2}`, value: { message: i2 }, provider: o3.name });
      } catch (e3) {
        console.error(r.red(`Error with ${o3.name}:`), e3.message);
      }
    }
    (l2 == null ? void 0 : l2.length) || (console.log(r.yellow("No suggestions were generated.")), process.exit(0)), l2.push({ name: r.gray("Exit without committing"), value: null });
    const { selectedMessages: m2 } = await a.prompt([{ type: "checkbox", name: "selectedMessages", message: "Select commit message(s):", choices: l2, pageSize: 15, loop: false }]);
    m2 && (m2 == null ? void 0 : m2.length) || (console.log(r.gray("\nNo commit messages selected. Exiting.")), process.exit(0));
    let g2 = m2.filter(Boolean).map((e2) => `${e2.type ? `${e2.type}: ` : ""}${e2.message}`.trim()).join("\n").trim();
    const { commitAction: p2 } = await a.prompt([{ type: "list", name: "commitAction", message: "Commit action:", choices: [{ name: "Stage all changes and commit", value: "commit" }, { name: "Edit message before committing", value: "edit" }, { name: "Cancel", value: "cancel" }], default: "commit" }]);
    if ("cancel" === p2 && (console.log(r.gray("\nCommit cancelled.")), process.exit(0)), "edit" === p2) {
      const o3 = t.join(c.tmpdir(), `giso-commit-${Date.now()}.txt`);
      e.writeFileSync(o3, g2);
      const s3 = process.env.GIT_EDITOR || process.env.VISUAL || process.env.EDITOR || "vi";
      try {
        i(`${s3} "${o3}"`, { stdio: "inherit" }), g2 = e.readFileSync(o3, "utf8").trim();
      } finally {
        try {
          e.unlinkSync(o3);
        } catch {
        }
      }
      g2 || (console.log(r.gray("\nEmpty commit message. Aborting.")), process.exit(0));
    }
    try {
      console.log(r.gray("\nStaging all changes...")), i("git add .", { stdio: "inherit" });
      const e2 = g2.replace(/"/g, '\\"');
      i(`git commit -m "${e2}"`, { stdio: "inherit" }), console.log(r.green.bold("\n✓ Commit successful:")), console.log(r.cyan(g2));
      try {
        const e3 = i("git rev-parse --short HEAD").toString().trim();
        console.log(r.gray(`Commit hash: ${e3}`));
      } catch {
      }
    } catch (e2) {
      console.error(r.red.bold("\n✗ Commit failed:"), e2.message), process.exit(1);
    }
  } catch (e2) {
    console.error(r.red.bold("\nError:"), e2.message), process.exit(1);
  }
}();
else if (["--config", "-c"].includes(x[0])) {
  e.existsSync(h) || (console.log("Error: Configuration file not found. Run giso --init first."), process.exit(1));
  const t2 = JSON.parse(e.readFileSync(h, "utf8"));
  console.log("Configuration:"), console.log(JSON.stringify(t2, null, 2));
} else ["--update", "-u"].includes(x[0]) ? async function(e2) {
  var _a;
  const t2 = "giso", o2 = `https://registry.npmjs.org/${t2}`;
  try {
    console.log(`Current installed version: ${e2}`), console.log("Checking for updates on npm...");
    const s2 = await m(o2);
    if (!s2.ok) return console.error(`Failed to fetch package info from npm: ${s2.status}`), 1;
    const n2 = await s2.json(), r2 = (_a = n2["dist-tags"]) == null ? void 0 : _a.latest;
    if (!r2) return console.error("Could not determine the latest version from npm."), 1;
    if (console.log(`Latest version on npm: ${r2}`), r2 === e2) return console.log("You are already using the latest version."), 0;
    console.log("A new version is available. Updating...");
    try {
      return i(`npm install -g ${t2}@latest`, { stdio: "inherit" }), console.log(`Successfully updated to version ${r2}`), 0;
    } catch (e3) {
      return console.error("Update failed:", e3.message), 1;
    }
  } catch (e3) {
    return console.error("Error during update check:", e3.message), 1;
  }
}(S).then((e2) => {
  process.exit(e2);
}) : (console.log("Usage:"), console.log("  giso --init (-i)      Initialize configuration"), console.log("  giso --offer (-o)     Generate commit message suggestions"), console.log("  giso --version (-v)   Show version"), console.log("  giso --config (-c)    Show configuration"), console.log("  giso --update (-u)    Update giso to the latest version"), process.exit(1));
