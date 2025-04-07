#!/usr/bin/env node
import e from "fs";
import o, { dirname as t, resolve as s } from "path";
import { fileURLToPath as n } from "url";
import r from "chalk";
import { execSync as i } from "child_process";
import a from "inquirer";
import c from "os";
import l from "readline";
import m from "crypto";
function p(e2, o2 = false) {
  return new Promise((t2) => {
    if (o2) {
      const o3 = l.createInterface({ input: process.stdin, output: process.stdout });
      process.stdout.write(e2);
      let s2 = "";
      process.stdin.isTTY && process.stdin.setRawMode(true);
      const n2 = (r2) => {
        switch (r2 = r2.toString()) {
          case "\n":
          case "\r":
            process.stdin.removeListener("data", n2), process.stdin.isTTY && process.stdin.setRawMode(false), o3.close(), t2(s2);
            break;
          case "":
            process.stdin.removeListener("data", n2), process.stdin.isTTY && process.stdin.setRawMode(false), o3.close(), process.exit(0);
            break;
          default:
            s2 += r2, process.stdout.write("\x1B[2K\x1B[200D" + e2 + "*".repeat(s2.length));
        }
      };
      process.stdin.on("data", n2);
    } else {
      const o3 = l.createInterface({ input: process.stdin, output: process.stdout });
      o3.question(e2, (e3) => {
        o3.close(), t2(e3);
      });
    }
  });
}
function g() {
  const e2 = c.hostname();
  return m.createHash("sha256").update(e2).digest("hex").substring(0, 32);
}
function d(e2) {
  const o2 = m.createCipheriv("aes-256-cbc", g(), Buffer.alloc(16, 0));
  let t2 = o2.update(e2, "utf8", "hex");
  return t2 += o2.final("hex"), t2;
}
function u(e2) {
  try {
    const o2 = m.createDecipheriv("aes-256-cbc", g(), Buffer.alloc(16, 0));
    let t2 = o2.update(e2, "hex", "utf8");
    return t2 += o2.final("utf8"), t2;
  } catch (e3) {
    return console.error("Decryption failed - possibly wrong machine?"), null;
  }
}
const f = [{ name: "OpenAI", key: "openai", apiUrl: "https://api.openai.com/v1/chat/completions", modelName: "gpt-4o" }, { name: "Gemini", key: "gemini", apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", modelName: "gemini-2.0-flash" }, { name: "Claude Sonnet", key: "claude", apiUrl: "https://api.anthropic.com/v1/messages", modelName: "claude-3-sonnet-20240229" }, { name: "DeepSeek", key: "deepseek", apiUrl: "https://api.deepseek.com/v1/chat/completions", modelName: "deepseek-chat" }], h = o.join(c.homedir(), ".gisoconfig.json");
async function y(e2, o2, t2, s2) {
  for (; ; ) {
    const n2 = await p(e2, false);
    if (!n2.trim()) return o2;
    const r2 = parseFloat(n2);
    if (!isNaN(r2) && r2 >= t2 && r2 <= s2) return r2;
    console.log(`Please enter a number between ${t2} and ${s2}`);
  }
}
async function w(e2, o2, t2, s2) {
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
        const t3 = u(e3.apiKey);
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
        const t3 = u(e3.apiKey);
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
        const t3 = u(e3.apiKey);
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
        const t3 = u(e3.apiKey);
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
const v = s(t(n(import.meta.url)), "..", "package.json"), S = JSON.parse(e.readFileSync(v, "utf8")), { version: x } = S, k = process.argv.slice(2);
if ((k.includes("--version") || k.includes("-v")) && (console.log(`giso version ${x}`), process.exit(0)), k.includes("--init")) !async function() {
  try {
    let o2;
    for (process.stdin.resume(), process.stdin.setEncoding("utf8"), console.log("Select AI providers (comma-separated numbers):"), f.forEach((e2, o3) => {
      console.log(`${o3 + 1}. ${e2.name}`);
    }); o2 = await p("> ", false), !o2.trim(); ) console.log("Please enter at least one provider number");
    const t2 = o2.split(",").map((e2) => parseInt(e2.trim()) - 1).filter((e2) => !isNaN(e2) && e2 >= 0 && e2 < f.length);
    (t2 == null ? void 0 : t2.length) || (console.error("Error: Invalid provider selection."), console.error("Run giso --init again."), process.exit(1));
    const s2 = { providers: {} };
    for (const e2 of t2) {
      const o3 = f[e2];
      let t3;
      for (; t3 = await p(`Enter your ${o3.name} API key: `, true), !t3.trim(); ) console.log("API key cannot be empty");
      const n2 = await y(`Enter temperature for ${o3.name} (0.0-2.0, default 0.4): `, 0.4, 0, 2), r2 = await y(`Enter max tokens for ${o3.name} (1-10000, default 2000): `, 2e3, 1, 1e4);
      s2.providers[o3.key] = { apiKey: d(t3), apiUrl: o3.apiUrl, modelName: o3.modelName, temperature: n2, maxTokens: r2 };
    }
    e.writeFileSync(h, JSON.stringify(s2, null, 2)), console.log(`
Configuration encrypted and saved to ${h}`), process.exit(0);
  } catch (e2) {
    console.error("\nInitialization failed:", e2.message), process.exit(1);
  }
}();
else if (k.includes("--offer")) !async function() {
  var _a;
  try {
    e.existsSync(h) || (console.error("Error: Configuration file not found. Run giso --init first."), process.exit(1));
    const t2 = JSON.parse(e.readFileSync(h, "utf8"));
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
      const t3 = f.find((o3) => o3.key === e2);
      if (t3) try {
        const i2 = await w(e2, o2, s2, n2);
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
    let p2 = m2.filter(Boolean).map((e2) => `${e2.type ? `${e2.type}: ` : ""}${e2.message}`.trim()).join("\n").trim();
    const { commitAction: g2 } = await a.prompt([{ type: "list", name: "commitAction", message: "Commit action:", choices: [{ name: "Stage all changes and commit", value: "commit" }, { name: "Edit message before committing", value: "edit" }, { name: "Cancel", value: "cancel" }], default: "commit" }]);
    if ("cancel" === g2 && (console.log(r.gray("\nCommit cancelled.")), process.exit(0)), "edit" === g2) {
      const t3 = o.join(c.tmpdir(), `giso-commit-${Date.now()}.txt`);
      e.writeFileSync(t3, p2);
      const s3 = process.env.GIT_EDITOR || process.env.VISUAL || process.env.EDITOR || "vi";
      try {
        i(`${s3} "${t3}"`, { stdio: "inherit" }), p2 = e.readFileSync(t3, "utf8").trim();
      } finally {
        try {
          e.unlinkSync(t3);
        } catch {
        }
      }
      p2 || (console.log(r.gray("\nEmpty commit message. Aborting.")), process.exit(0));
    }
    try {
      console.log(r.gray("\nStaging all changes...")), i("git add .", { stdio: "inherit" });
      const e2 = p2.replace(/"/g, '\\"');
      i(`git commit -m "${e2}"`, { stdio: "inherit" }), console.log(r.green.bold("\n✓ Commit successful:")), console.log(r.cyan(p2));
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
else if (k.includes("--config")) {
  e.existsSync(h) || (console.log("Error: Configuration file not found. Run giso --init first."), process.exit(1));
  const o2 = JSON.parse(e.readFileSync(h, "utf8"));
  console.log("Configuration:"), console.log(o2);
} else console.log("Usage:"), console.log("  giso --init      Initialize configuration"), console.log("  giso --offer     Generate commit message suggestions"), console.log("  giso --version   Show version"), console.log("  giso --config    Show configuration"), process.exit(1);
