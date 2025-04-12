#!/usr/bin/env node
import e from "fs";
import o, { dirname as t, resolve as s } from "path";
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
  const o2 = l.createCipheriv("aes-256-cbc", g(), Buffer.alloc(16, 0));
  let t2 = o2.update(e2, "utf8", "hex");
  return t2 += o2.final("hex"), t2;
}
function d(e2) {
  try {
    const o2 = l.createDecipheriv("aes-256-cbc", g(), Buffer.alloc(16, 0));
    let t2 = o2.update(e2, "hex", "utf8");
    return t2 += o2.final("utf8"), t2;
  } catch (e3) {
    return console.error("Decryption failed - possibly wrong machine?"), null;
  }
}
const u = [{ name: "OpenAI", key: "openai", apiUrl: "https://api.openai.com/v1/chat/completions", modelName: "gpt-4o" }, { name: "Gemini", key: "gemini", apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", modelName: "gemini-2.0-flash" }, { name: "Claude Sonnet", key: "claude", apiUrl: "https://api.anthropic.com/v1/messages", modelName: "claude-3-sonnet-20240229" }, { name: "DeepSeek", key: "deepseek", apiUrl: "https://api.deepseek.com/v1/chat/completions", modelName: "deepseek-chat" }], f = o.join(c.homedir(), ".gisoconfig.json");
async function h(e2, o2, t2, s2) {
  for (; ; ) {
    const { numberInput: n2 } = await a.prompt([{ type: "input", name: "numberInput", message: e2, default: o2, validate: (e3) => {
      if (null == e3 || !String(e3).trim()) return true;
      const o3 = parseFloat(e3);
      return !isNaN(o3) && o3 >= t2 && o3 <= s2 || `Please enter a number between ${t2} and ${s2}`;
    } }]);
    return null != n2 && String(n2).trim() ? parseFloat(n2) : o2;
  }
}
async function y(e2, o2, t2, s2) {
  const n2 = `You are a highly skilled git commit message assistant, capable of generating concise and informative commit messages. Analyze the following changes and provide 10 distinct commit message suggestions in EXACTLY this JSON format:

{
  "suggestions": [
    {
      "type": "feat|fix|chore|docs|style|refactor|test",
      "message": "concise description",
      "description": "optional longer explanation"
    }
  ]
}

Follow these guidelines for generating the suggestions:

- **Semantic Commit Messages:** Prioritize the use of Semantic Commit Messages. Include at least 4 suggestions that adhere to the conventional commit format (e.g., "feat: Add user authentication").
- **Granular Fixes:** When suggesting fixes, aim for specificity. If a fix addresses a particular issue or component, include that in the message (e.g., "fix(tile): Correct rendering issue with overlapping elements"). You can also use a more general "fix: ..." if the scope is broader.
- **Feature Introduction:** Clearly indicate new features with the "feat" type (e.g., "feat: Implement real-time collaboration").
- **Chores and Maintenance:** Use "chore" for tasks like dependency updates or build configuration changes (e.g., "chore: Update eslint dependencies").
- **Plain Descriptive Messages:** Include 4 plain descriptive messages that are still informative but do not strictly adhere to the conventional commit format. These should be clear and to the point (e.g., "Improve error handling in API requests").
- **Relevance Sorting:** Order the suggestions by their perceived relevance to the changes. Messages addressing significant new features or critical fixes should appear earlier in the list.
- **Conciseness:** Keep the "message" field brief and easy to understand.
- **Optional Description:** Use the "description" field to provide additional context or details if necessary.

Git Status:
${t2}

Changed Files Content:
${s2}`;
  switch (e2) {
    case "openai":
      return await async function(e3, o3) {
        var _a, _b, _c;
        const t3 = d(e3.apiKey);
        if (!t3) throw new Error("Failed to decrypt API key");
        try {
          const s3 = await fetch(e3.apiUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t3}` }, body: JSON.stringify({ model: e3.modelName, messages: [{ role: "user", content: o3 }], temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, max_tokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3, response_format: { type: "json_object" } }) }), n3 = await s3.json();
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
      }(o2, n2);
    case "gemini":
      return await async function(e3, o3) {
        var _a, _b, _c, _d, _e;
        const t3 = d(e3.apiKey);
        if (!t3) throw new Error("Failed to decrypt Gemini API key");
        const s3 = `${e3.apiUrl}?key=${t3}`;
        try {
          const t4 = { contents: [{ parts: [{ text: o3 }] }], generationConfig: { response_mime_type: "application/json", temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, maxOutputTokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3 }, safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }] }, n3 = await fetch(s3, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t4), timeout: 1e4 });
          if (!n3.ok) {
            const e4 = await n3.json(), o4 = ((_a = e4.error) == null ? void 0 : _a.message) || `HTTP ${n3.status}`;
            throw new Error(`Gemini API error: ${o4}`);
          }
          const r2 = await n3.json();
          if (!r2.candidates || !Array.isArray(r2.candidates) || !((_e = (_d = (_c = (_b = r2.candidates[0]) == null ? void 0 : _b.content) == null ? void 0 : _c.parts) == null ? void 0 : _d[0]) == null ? void 0 : _e.text)) throw console.error("Invalid Gemini response structure:", r2), new Error("Received malformed response from Gemini API");
          const i2 = r2.candidates[0].content.parts[0].text;
          try {
            const e4 = JSON.parse(i2);
            if (!Array.isArray(e4 == null ? void 0 : e4.suggestions)) throw new Error("Suggestions array missing in response");
            return e4.suggestions.map((e5) => ({ type: e5.type || "", message: e5.message || "No message provided", description: e5.description || "" }));
          } catch (e4) {
            return [{ type: "text", message: i2, description: "Raw Gemini response" }];
          }
        } catch (e4) {
          throw console.error(r.red.bold("Gemini API Failed:"), e4.message), new Error(`Gemini: ${e4.message}`);
        }
      }(o2, n2);
    case "claude":
      return await async function(e3, o3) {
        var _a, _b;
        const t3 = d(e3.apiKey);
        if (!t3) throw new Error("Failed to decrypt API key");
        const s3 = await fetch(e3.apiUrl, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": t3, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: e3.modelName, temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, max_tokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3, messages: [{ role: "user", content: o3 }], response_format: { type: "json_object" } }) }), n3 = await s3.json();
        console.log("Claude API Response:", n3);
        try {
          return JSON.parse((_a = n3.content[0]) == null ? void 0 : _a.text).suggestions;
        } catch {
          return ((_b = n3.content[0]) == null ? void 0 : _b.text) || "No response from Claude";
        }
      }(o2, n2);
    case "deepseek":
      return await async function(e3, o3) {
        var _a, _b, _c;
        const t3 = d(e3.apiKey);
        if (!t3) throw new Error("Failed to decrypt DeepSeek API key");
        try {
          const s3 = await fetch(e3.apiUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t3}` }, body: JSON.stringify({ model: e3.modelName, messages: [{ role: "user", content: o3 }], temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, max_tokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3, response_format: { type: "json_object" } }), timeout: 1e4 });
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
      }(o2, n2);
    default:
      throw new Error(`Unsupported provider: ${e2}`);
  }
}
const w = s(t(n(import.meta.url)), "..", "package.json"), v = JSON.parse(e.readFileSync(w, "utf8")), { version: S } = v, x = process.argv.slice(2);
if (["--version", "-v"].includes(x[0])) console.log(`giso version ${S}`), process.exit(0);
else if (["--init", "-i"].includes(x[0])) !async function() {
  try {
    console.log("Select an AI provider:");
    const o2 = u.map((e2, o3) => ({ name: `${o3 + 1}. ${e2.name}`, value: o3 })), { selectedProviderIndex: t2 } = await a.prompt([{ type: "list", name: "selectedProviderIndex", message: "Choose a provider:", choices: o2, pageSize: 10 }]);
    void 0 === t2 && (console.error("Error: No provider selected."), console.error("Run giso --init again."), process.exit(1));
    const s2 = { providers: {} }, n2 = u[t2], { apiKey: r2 } = await a.prompt([{ type: "password", name: "apiKey", message: `Enter your ${n2.name} API key:`, mask: "*", validate: (e2) => !(null == e2 || !String(e2).trim()) || "API key cannot be empty" }]), i2 = await h(`Enter temperature for ${n2.name} (0.0-2.0, default 0.4):`, 0.4, 0, 2), c2 = await h(`Enter max tokens for ${n2.name} (1-10000, default 2000):`, 2e3, 1, 1e4);
    s2.providers[n2.key] = { apiKey: p(r2), apiUrl: n2.apiUrl, modelName: n2.modelName, temperature: i2, maxTokens: c2 }, e.writeFileSync(f, JSON.stringify(s2, null, 2)), console.log(`
Configuration encrypted and saved to ${f}`), process.exit(0);
  } catch (e2) {
    console.error("\nInitialization failed:", e2.message), process.exit(1);
  }
}();
else if (["--offer", "-o"].includes(x[0])) !async function() {
  var _a;
  try {
    e.existsSync(f) || (console.error("Error: Configuration file not found. Run giso --init first."), process.exit(1));
    const t2 = JSON.parse(e.readFileSync(f, "utf8"));
    let s2, n2;
    t2.providers && ((_a = Object.keys(t2.providers)) == null ? void 0 : _a.length) || (console.error("Error: No providers configured. Run giso --init first."), process.exit(1));
    try {
      s2 = i("git status --porcelain").toString().trim(), s2 || (console.log("No changes detected in git working tree."), process.exit(0)), n2 = i("git diff --cached").toString().trim(), n2 || (n2 = i("git diff").toString().trim(), n2 && console.log(r.yellow("Using unstaged changes for commit message generation.")));
    } catch (e2) {
      console.error("Error getting git info:", e2.message), process.exit(1);
    }
    console.log("\nGenerating commit messages...\n");
    let l2 = [];
    for (const [e2, o2] of Object.entries(t2.providers)) {
      const t3 = u.find((o3) => o3.key === e2);
      if (t3) try {
        const i2 = await y(e2, o2, s2, n2);
        console.log(r.bold.blue(`
=== ${t3.name} Suggestions ===`)), Array.isArray(i2) ? i2.forEach((e3) => {
          const o3 = e3.type ? `${e3.type}: ${e3.message}` : e3.message;
          console.log(r.bold(`• ${o3}`)), e3.description && console.log(`  ${e3.description}`), console.log(), l2.push({ name: `${t3.name}: ${o3}`, value: e3, provider: t3.name });
        }) : (console.log(i2), l2.push({ name: `${t3.name}: ${i2}`, value: { message: i2 }, provider: t3.name }));
      } catch (e3) {
        console.error(r.red(`Error with ${t3.name}:`), e3.message);
      }
    }
    (l2 == null ? void 0 : l2.length) || (console.log(r.yellow("No suggestions were generated.")), process.exit(0)), l2.push({ name: r.gray("Exit without committing"), value: null });
    const { selectedMessages: m2 } = await a.prompt([{ type: "checkbox", name: "selectedMessages", message: "Select commit message(s):", choices: l2, pageSize: 15, loop: false }]);
    m2 && (m2 == null ? void 0 : m2.length) || (console.log(r.gray("\nNo commit messages selected. Exiting.")), process.exit(0));
    let g2 = m2.filter(Boolean).map((e2) => `${e2.type ? `${e2.type}: ` : ""}${e2.message}`.trim()).join("\n").trim();
    const { commitAction: p2 } = await a.prompt([{ type: "list", name: "commitAction", message: "Commit action:", choices: [{ name: "Stage all changes and commit", value: "commit" }, { name: "Edit message before committing", value: "edit" }, { name: "Cancel", value: "cancel" }], default: "commit" }]);
    if ("cancel" === p2 && (console.log(r.gray("\nCommit cancelled.")), process.exit(0)), "edit" === p2) {
      const t3 = o.join(c.tmpdir(), `giso-commit-${Date.now()}.txt`);
      e.writeFileSync(t3, g2);
      const s3 = process.env.GIT_EDITOR || process.env.VISUAL || process.env.EDITOR || "vi";
      try {
        i(`${s3} "${t3}"`, { stdio: "inherit" }), g2 = e.readFileSync(t3, "utf8").trim();
      } finally {
        try {
          e.unlinkSync(t3);
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
  e.existsSync(f) || (console.log("Error: Configuration file not found. Run giso --init first."), process.exit(1));
  const o2 = JSON.parse(e.readFileSync(f, "utf8"));
  console.log("Configuration:"), console.log(JSON.stringify(o2, null, 2));
} else ["--update", "-u"].includes(x[0]) ? async function(e2) {
  var _a;
  const o2 = "giso", t2 = `https://registry.npmjs.org/${o2}`;
  try {
    console.log(`Current installed version: ${e2}`), console.log("Checking for updates on npm...");
    const s2 = await m(t2);
    if (!s2.ok) return console.error(`Failed to fetch package info from npm: ${s2.status}`), 1;
    const n2 = await s2.json(), r2 = (_a = n2["dist-tags"]) == null ? void 0 : _a.latest;
    if (!r2) return console.error("Could not determine the latest version from npm."), 1;
    if (console.log(`Latest version on npm: ${r2}`), r2 === e2) return console.log("You are already using the latest version."), 0;
    console.log("A new version is available. Updating...");
    try {
      return i(`npm install -g ${o2}@latest`, { stdio: "inherit" }), console.log(`Successfully updated to version ${r2}`), 0;
    } catch (e3) {
      return console.error("Update failed:", e3.message), 1;
    }
  } catch (e3) {
    return console.error("Error during update check:", e3.message), 1;
  }
}(S).then((e2) => {
  process.exit(e2);
}) : (console.log("Usage:"), console.log("  giso --init (-i)      Initialize configuration"), console.log("  giso --offer (-o)     Generate commit message suggestions"), console.log("  giso --version (-v)   Show version"), console.log("  giso --config (-c)    Show configuration"), console.log("  giso --update (-u)    Update giso to the latest version"), process.exit(1));
