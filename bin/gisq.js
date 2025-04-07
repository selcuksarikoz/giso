#!/usr/bin/env node
import e from "fs";
import o, { dirname as t, resolve as s } from "path";
import { fileURLToPath as r } from "url";
import n from "chalk";
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
      const r2 = (n2) => {
        switch (n2 = n2.toString()) {
          case "\n":
          case "\r":
            process.stdin.removeListener("data", r2), process.stdin.isTTY && process.stdin.setRawMode(false), o3.close(), t2(s2);
            break;
          case "":
            process.stdin.removeListener("data", r2), process.stdin.isTTY && process.stdin.setRawMode(false), o3.close(), process.exit(0);
            break;
          default:
            s2 += n2, process.stdout.write("\x1B[2K\x1B[200D" + e2 + "*".repeat(s2.length));
        }
      };
      process.stdin.on("data", r2);
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
const f = [{ name: "OpenAI", key: "openai", apiUrl: "https://api.openai.com/v1/chat/completions", modelName: "gpt-4-turbo-preview" }, { name: "Gemini", key: "gemini", apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent", modelName: "gemini-1.5-pro-latest" }, { name: "Claude Sonnet", key: "claude", apiUrl: "https://api.anthropic.com/v1/messages", modelName: "claude-3-sonnet-20240229" }, { name: "DeepSeek", key: "deepseek", apiUrl: "https://api.deepseek.com/v1/chat/completions", modelName: "deepseek-chat" }], y = o.join(c.homedir(), ".gisqconfig.json");
async function h(e2, o2, t2, s2) {
  for (; ; ) {
    const r2 = await p(e2, false);
    if (!r2.trim()) return o2;
    const n2 = parseFloat(r2);
    if (!isNaN(n2) && n2 >= t2 && n2 <= s2) return n2;
    console.log(`Please enter a number between ${t2} and ${s2}`);
  }
}
async function w(e2, o2, t2, s2) {
  const r2 = `You are a git commit message assistant. Analyze these changes and suggest 10 commit messages in EXACTLY this JSON format:
{
  "suggestions": [
    {
      "type": "feat|fix|chore|docs|style|refactor|test|fun",
      "message": "concise description",
      "description": "optional longer explanation"
    }
  ]
}

Git Status:
${t2}

Changed Files Content:
${s2}

Include:
- 4 conventional commits (with type prefix)
- 4 plain descriptive messages (type can be empty)
- 2 fun/creative messages (type "fun")
- Sort by relevance (most important changes first)`;
  switch (e2) {
    case "openai":
      return await async function(e3, o3) {
        var _a, _b, _c;
        const t3 = u(e3.apiKey);
        if (!t3) throw new Error("Failed to decrypt API key");
        try {
          const s3 = await fetch(e3.apiUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t3}` }, body: JSON.stringify({ model: e3.modelName, messages: [{ role: "user", content: o3 }], temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, max_tokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3, response_format: { type: "json_object" } }) }), r3 = await s3.json();
          if (console.log("OpenAI API Response:", JSON.stringify(r3, null, 2)), !s3.ok) throw new Error(`API error: ${((_a = r3.error) == null ? void 0 : _a.message) || s3.statusText}`);
          if (!r3.choices || !Array.isArray(r3.choices)) throw new Error("Invalid response format: missing choices array");
          const n2 = (_c = (_b = r3.choices[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
          if (!n2) throw new Error("No message content in response");
          try {
            const e4 = JSON.parse(n2);
            if (!e4.suggestions) throw new Error("Response JSON missing suggestions property");
            return e4.suggestions;
          } catch (e4) {
            return console.warn("Failed to parse JSON response, returning raw content"), n2;
          }
        } catch (e4) {
          throw console.error("OpenAI API Error:", e4.message), new Error(`Failed to generate suggestions: ${e4.message}`);
        }
      }(o2, r2);
    case "gemini":
      return await async function(e3, o3) {
        var _a, _b, _c, _d, _e;
        const t3 = u(e3.apiKey);
        if (!t3) throw new Error("Failed to decrypt Gemini API key");
        const s3 = `${e3.apiUrl}?key=${t3}`;
        try {
          const t4 = { contents: [{ parts: [{ text: o3 }] }], generationConfig: { response_mime_type: "application/json", temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, maxOutputTokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3 }, safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }] }, r3 = await fetch(s3, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t4), timeout: 1e4 });
          if (!r3.ok) {
            const e4 = await r3.json(), o4 = ((_a = e4.error) == null ? void 0 : _a.message) || `HTTP ${r3.status}`;
            throw new Error(`Gemini API error: ${o4}`);
          }
          const n2 = await r3.json();
          if (!n2.candidates || !Array.isArray(n2.candidates) || !((_e = (_d = (_c = (_b = n2.candidates[0]) == null ? void 0 : _b.content) == null ? void 0 : _c.parts) == null ? void 0 : _d[0]) == null ? void 0 : _e.text)) throw console.error("Invalid Gemini response structure:", n2), new Error("Received malformed response from Gemini API");
          const i2 = n2.candidates[0].content.parts[0].text;
          try {
            const e4 = JSON.parse(i2);
            if (!Array.isArray(e4 == null ? void 0 : e4.suggestions)) throw new Error("Suggestions array missing in response");
            return e4.suggestions.map((e5) => ({ type: e5.type || "", message: e5.message || "No message provided", description: e5.description || "" }));
          } catch (e4) {
            return [{ type: "text", message: i2, description: "Raw Gemini response" }];
          }
        } catch (e4) {
          throw console.error(n.red.bold("Gemini API Failed:"), e4.message), new Error(`Gemini: ${e4.message}`);
        }
      }(o2, r2);
    case "claude":
      return await async function(e3, o3) {
        var _a, _b;
        const t3 = u(e3.apiKey);
        if (!t3) throw new Error("Failed to decrypt API key");
        const s3 = await fetch(e3.apiUrl, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": t3, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: e3.modelName, temperature: (e3 == null ? void 0 : e3.temperature) || 0.4, max_tokens: (e3 == null ? void 0 : e3.maxTokens) || 2e3, messages: [{ role: "user", content: o3 }], response_format: { type: "json_object" } }) }), r3 = await s3.json();
        try {
          return JSON.parse((_a = r3.content[0]) == null ? void 0 : _a.text).suggestions;
        } catch {
          return ((_b = r3.content[0]) == null ? void 0 : _b.text) || "No response from Claude";
        }
      }(o2, r2);
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
          const r3 = await s3.json();
          if (!r3.choices || !((_c = (_b = r3.choices[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content)) throw console.error("Invalid DeepSeek response:", r3), new Error("Invalid response structure from DeepSeek API");
          const n2 = r3.choices[0].message.content;
          try {
            const e4 = JSON.parse(n2);
            if (!Array.isArray(e4.suggestions)) throw new Error("Expected suggestions array in response");
            return e4.suggestions;
          } catch (e4) {
            return [{ type: "text", message: n2, description: "Raw DeepSeek response" }];
          }
        } catch (e4) {
          throw console.error(n.red("DeepSeek API Error:"), e4.message), new Error(`DeepSeek: ${e4.message}`);
        }
      }(o2, r2);
    default:
      throw new Error(`Unsupported provider: ${e2}`);
  }
}
const S = s(t(r(import.meta.url)), "..", "package.json"), v = JSON.parse(e.readFileSync(S, "utf8")), { version: x } = v, k = process.argv.slice(2);
if ((k.includes("--version") || k.includes("-v")) && (console.log(`gisq version ${x}`), process.exit(0)), k.includes("--init")) !async function() {
  try {
    let o2;
    for (process.stdin.resume(), process.stdin.setEncoding("utf8"), console.log("Select AI providers (comma-separated numbers):"), f.forEach((e2, o3) => {
      console.log(`${o3 + 1}. ${e2.name}`);
    }); o2 = await p("> ", false), !o2.trim(); ) console.log("Please enter at least one provider number");
    const t2 = o2.split(",").map((e2) => parseInt(e2.trim()) - 1).filter((e2) => !isNaN(e2) && e2 >= 0 && e2 < f.length);
    0 === t2.length && (console.error("Error: Invalid provider selection."), console.error("Run gisq --init again."), process.exit(1));
    const s2 = { providers: {} };
    for (const e2 of t2) {
      const o3 = f[e2];
      let t3;
      for (; t3 = await p(`Enter your ${o3.name} API key: `, true), !t3.trim(); ) console.log("API key cannot be empty");
      const r2 = await h(`Enter temperature for ${o3.name} (0.0-2.0, default 0.4): `, 0.4, 0, 2), n2 = await h(`Enter max tokens for ${o3.name} (1-10000, default 2000): `, 2e3, 1, 1e4);
      s2.providers[o3.key] = { apiKey: d(t3), apiUrl: o3.apiUrl, modelName: o3.modelName, temperature: r2, maxTokens: n2 };
    }
    e.writeFileSync(y, JSON.stringify(s2, null, 2)), console.log(`
Configuration saved to ${y}`), process.exit(0);
  } catch (e2) {
    console.error("\nInitialization failed:", e2.message), process.exit(1);
  }
}();
else if (k.includes("--offer")) !async function() {
  try {
    e.existsSync(y) || (console.error("Error: Configuration file not found. Run gisq --init first."), process.exit(1));
    const t2 = JSON.parse(e.readFileSync(y, "utf8"));
    let s2, r2;
    t2.providers && 0 !== Object.keys(t2.providers).length || (console.error("Error: No providers configured. Run gisq --init first."), process.exit(1));
    try {
      s2 = i("git status --porcelain").toString().trim(), s2 || (console.log("No changes detected in git working tree (staged or unstaged)."), process.exit(0)), r2 = i("git diff --cached").toString().trim(), r2 ? console.log("Using staged changes for commit message generation.") : (r2 = i("git diff").toString().trim(), r2 ? console.log("Warning: No staged changes found. Using unstaged changes instead.") : (console.log("No changes detected in git working tree or staging area."), process.exit(0)));
    } catch (e2) {
      console.error("Error getting git info:", e2.message), process.exit(1);
    }
    console.log("\nGenerating commit messages...\n");
    let l2 = [], m2 = 0;
    for (const [e2, o2] of Object.entries(t2.providers)) {
      const t3 = f.find((o3) => o3.key === e2);
      if (t3) {
        m2++;
        try {
          const i2 = await w(e2, o2, s2, r2);
          console.log(n.bold.blue(`
=== ${t3.name} Suggestions ===`)), Array.isArray(i2) ? i2.forEach((e3) => {
            const o3 = e3.type ? `${e3.type}: ${e3.message}` : e3.message;
            console.log(n.bold(`• ${o3}`)), e3.description && console.log(`  ${e3.description}`), console.log(), l2.push({ name: `${t3.name}: ${o3}`, value: e3.type ? `${e3.type}: ${e3.message}` : e3.message, provider: t3.name, description: e3.description || "" });
          }) : (console.log(i2), l2.push({ name: `${t3.name}: ${i2}`, value: i2, provider: t3.name, description: "" }));
        } catch (e3) {
          console.error(n.red(`Error with ${t3.name}:`), e3.message);
        }
      }
    }
    0 === l2.length && (console.log(n.yellow("No suggestions were generated.")), process.exit(0)), l2.push({ name: n.gray("None (exit without committing)"), value: null });
    const { selectedMessages: p2 } = await a.prompt([{ type: "checkbox", name: "selectedMessages", message: "Select commit message(s):", choices: l2, pageSize: 15, loop: false, filter: (e2) => Array.isArray(e2) ? e2.map((e3) => e3 && "string" == typeof e3 ? e3.split(": ").slice(1).join(": ") : e3).filter(Boolean) : [] }]);
    p2 && 0 !== p2.length || (console.log(n.gray("\nNo commit messages selected. Exiting.")), process.exit(0));
    let g2 = p2.join("\n\n");
    const { commitAction: d2 } = await a.prompt([{ type: "list", name: "commitAction", message: "How would you like to proceed with this commit message?", choices: [{ name: "Commit with this message", value: "commit" }, { name: "Edit message before committing", value: "edit" }, { name: "Cancel", value: "cancel" }], default: "commit" }]);
    if ("cancel" === d2 && (console.log(n.gray("\nCommit cancelled.")), process.exit(0)), "edit" === d2) {
      const t3 = o.join(c.tmpdir(), `gisq-commit-${Date.now()}.txt`);
      e.writeFileSync(t3, g2);
      const s3 = process.env.GIT_EDITOR || process.env.VISUAL || process.env.EDITOR || "vi";
      try {
        i(`${s3} "${t3}"`, { stdio: "inherit" }), g2 = e.readFileSync(t3, "utf8").trim();
      } catch (e2) {
        console.error(n.red("Error editing commit message:"), e2.message), process.exit(1);
      } finally {
        try {
          e.unlinkSync(t3);
        } catch {
        }
      }
      g2 || (console.log(n.gray("\nEmpty commit message. Aborting.")), process.exit(0));
    }
    try {
      const e2 = g2.replace(/"/g, '\\"');
      i(`git commit -m "${e2}"`, { stdio: "inherit" }), console.log(n.green.bold("\n✓ Successfully committed with message:")), console.log(n.cyan(`"${g2}"`));
      try {
        const e3 = i("git rev-parse --short HEAD").toString().trim();
        console.log(n.gray(`Commit hash: ${e3}`));
      } catch (e3) {
        console.log(n.gray("(Could not retrieve commit hash)"));
      }
    } catch (e2) {
      console.error(n.red.bold("\n✗ Failed to create commit:"), e2.message), process.exit(1);
    }
    process.exit(0);
  } catch (e2) {
    console.error(n.red.bold("\nError:"), e2.message), process.exit(1);
  }
}();
else if (k.includes("--config")) {
  e.existsSync(y) || (console.log("Error: Configuration file not found. Run gisq --init first."), process.exit(1));
  const o2 = JSON.parse(e.readFileSync(y, "utf8"));
  console.log("Configuration:"), console.log(o2);
} else console.log("Usage:"), console.log("  gisq --init      Initialize configuration"), console.log("  gisq --offer     Generate commit message suggestions"), console.log("  gisq --version   Show version"), console.log("  gisq --config    Show configuration"), process.exit(1);
