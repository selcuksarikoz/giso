#!/usr/bin/env node
import e from 'fs';
import o, { dirname as t, resolve as s } from 'path';
import { fileURLToPath as r } from 'url';
import n from 'chalk';
import { execSync as i } from 'child_process';
import a from 'inquirer';
import c from 'os';
import l from 'readline';
import g from 'crypto';
function p(e2, o2 = false) {
  const t2 = l.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((s2) => {
    if (o2) {
      const o3 = process.openStdin();
      process.stdin.on('data', (s3) => {
        switch ((s3 += '')) {
          case '\n':
          case '\r':
          case '':
            o3.pause();
            break;
          default:
            process.stdout.write('\x1B[2K\x1B[200D' + e2 + '*'.repeat(t2.line.length));
        }
      });
    }
    t2.question(e2, (e3) => {
      o2 && process.stdin.removeAllListeners('data'), t2.close(), s2(e3);
    });
  });
}
function m() {
  const e2 = c.hostname();
  return g.createHash('sha256').update(e2).digest('hex').substring(0, 32);
}
function d(e2) {
  const o2 = g.createCipheriv('aes-256-cbc', m(), Buffer.alloc(16, 0));
  let t2 = o2.update(e2, 'utf8', 'hex');
  return (t2 += o2.final('hex')), t2;
}
function u(e2) {
  try {
    const o2 = g.createDecipheriv('aes-256-cbc', m(), Buffer.alloc(16, 0));
    let t2 = o2.update(e2, 'hex', 'utf8');
    return (t2 += o2.final('utf8')), t2;
  } catch (e3) {
    return console.error('Decryption failed - possibly wrong machine?'), null;
  }
}
const f = [
    { name: 'OpenAI', key: 'openai', apiUrl: 'https://api.openai.com/v1/chat/completions' },
    {
      name: 'Gemini',
      key: 'gemini',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      modelName: 'gemini-1.5-pro-latest',
    },
    { name: 'Claude Sonnet', key: 'claude', apiUrl: 'https://api.anthropic.com/v1/messages' },
    {
      name: 'DeepSeek',
      key: 'deepseek',
      apiUrl: 'https://api.deepseek.com/v1/chat/completions',
      modelName: 'deepseek-chat',
    },
  ],
  h = o.join(c.homedir(), '.gsqconfig.json');
async function y(e2, o2, t2, s2, r2) {
  const i2 = `You are a git commit message assistant. Analyze these changes and suggest 10 commit messages in EXACTLY this JSON format:
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
${s2}

Changed Files Content:
${r2}

Include:
- 4 conventional commits (with type prefix)
- 4 plain descriptive messages (type can be empty)
- 2 fun/creative messages (type "fun")
- Sort by relevance (most important changes first)`;
  switch (e2) {
    case 'openai':
      return await (async function (e3, o3, t3) {
        var _a, _b, _c;
        const s3 = u(o3);
        if (!s3) throw new Error('Failed to decrypt API key');
        try {
          const o4 = await fetch(e3, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s3}` },
              body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: t3 }],
                temperature: 0.7,
                response_format: { type: 'json_object' },
              }),
            }),
            r3 = await o4.json();
          if ((console.log('OpenAI API Response:', JSON.stringify(r3, null, 2)), !o4.ok))
            throw new Error(
              `API error: ${((_a = r3.error) == null ? void 0 : _a.message) || o4.statusText}`
            );
          if (!r3.choices || !Array.isArray(r3.choices))
            throw new Error('Invalid response format: missing choices array');
          const n2 =
            (_c = (_b = r3.choices[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
          if (!n2) throw new Error('No message content in response');
          try {
            const e4 = JSON.parse(n2);
            if (!e4.suggestions) throw new Error('Response JSON missing suggestions property');
            return e4.suggestions;
          } catch (e4) {
            return console.warn('Failed to parse JSON response, returning raw content'), n2;
          }
        } catch (e4) {
          throw (
            (console.error('OpenAI API Error:', e4.message),
            new Error(`Failed to generate suggestions: ${e4.message}`))
          );
        }
      })(o2, t2, i2);
    case 'gemini':
      return await (async function (e3, o3, t3) {
        var _a, _b, _c, _d, _e, _f;
        const s3 = u(o3);
        if (!s3) throw new Error('Failed to decrypt Gemini API key');
        const r3 = `https://generativelanguage.googleapis.com/v1beta/models/${((_a = f.find((e4) => 'gemini' === e4.key)) == null ? void 0 : _a.modelName) || 'gemini-pro'}:generateContent?key=${s3}`;
        try {
          const e4 = {
              contents: [{ parts: [{ text: t3 }] }],
              generationConfig: { response_mime_type: 'application/json', temperature: 0.7 },
              safetySettings: [
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
              ],
            },
            o4 = await fetch(r3, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(e4),
              timeout: 1e4,
            });
          if (!o4.ok) {
            const e5 = await o4.json(),
              t4 = ((_b = e5.error) == null ? void 0 : _b.message) || `HTTP ${o4.status}`;
            throw new Error(`Gemini API error: ${t4}`);
          }
          const s4 = await o4.json();
          if (
            !s4.candidates ||
            !Array.isArray(s4.candidates) ||
            !((_f =
              (_e =
                (_d = (_c = s4.candidates[0]) == null ? void 0 : _c.content) == null
                  ? void 0
                  : _d.parts) == null
                ? void 0
                : _e[0]) == null
              ? void 0
              : _f.text)
          )
            throw (
              (console.error('Invalid Gemini response structure:', s4),
              new Error('Received malformed response from Gemini API'))
            );
          const n2 = s4.candidates[0].content.parts[0].text;
          try {
            const e5 = JSON.parse(n2);
            if (!Array.isArray(e5 == null ? void 0 : e5.suggestions))
              throw new Error('Suggestions array missing in response');
            return e5.suggestions.map((e6) => ({
              type: e6.type || '',
              message: e6.message || 'No message provided',
              description: e6.description || '',
            }));
          } catch (e5) {
            return [{ type: 'text', message: n2, description: 'Raw Gemini response' }];
          }
        } catch (e4) {
          throw (
            (console.error(n.red.bold('Gemini API Failed:'), e4.message),
            new Error(`Gemini: ${e4.message}`))
          );
        }
      })(0, t2, i2);
    case 'claude':
      return await (async function (e3, o3, t3) {
        var _a, _b;
        const s3 = u(o3);
        if (!s3) throw new Error('Failed to decrypt API key');
        const r3 = await fetch(e3, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': s3,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-sonnet-20240229',
              max_tokens: 1e3,
              messages: [{ role: 'user', content: t3 }],
              response_format: { type: 'json_object' },
            }),
          }),
          n2 = await r3.json();
        try {
          return JSON.parse((_a = n2.content[0]) == null ? void 0 : _a.text).suggestions;
        } catch {
          return ((_b = n2.content[0]) == null ? void 0 : _b.text) || 'No response from Claude';
        }
      })(o2, t2, i2);
    case 'deepseek':
      return await (async function (e3, o3, t3) {
        var _a, _b, _c;
        const s3 = u(o3);
        if (!s3) throw new Error('Failed to decrypt DeepSeek API key');
        try {
          const o4 = await fetch(e3, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s3}` },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [{ role: 'user', content: t3 }],
              temperature: 0.7,
              max_tokens: 2e3,
              response_format: { type: 'json_object' },
            }),
            timeout: 1e4,
          });
          if (!o4.ok) {
            const e4 = await o4.json();
            throw new Error(((_a = e4.error) == null ? void 0 : _a.message) || `HTTP ${o4.status}`);
          }
          const r3 = await o4.json();
          if (
            !r3.choices ||
            !((_c = (_b = r3.choices[0]) == null ? void 0 : _b.message) == null
              ? void 0
              : _c.content)
          )
            throw (
              (console.error('Invalid DeepSeek response:', r3),
              new Error('Invalid response structure from DeepSeek API'))
            );
          const n2 = r3.choices[0].message.content;
          try {
            const e4 = JSON.parse(n2);
            if (!Array.isArray(e4.suggestions))
              throw new Error('Expected suggestions array in response');
            return e4.suggestions;
          } catch (e4) {
            return [{ type: 'text', message: n2, description: 'Raw DeepSeek response' }];
          }
        } catch (e4) {
          throw (
            (console.error(n.red('DeepSeek API Error:'), e4.message),
            new Error(`DeepSeek: ${e4.message}`))
          );
        }
      })(o2, t2, i2);
    default:
      throw new Error(`Unsupported provider: ${e2}`);
  }
}
const w = s(t(r(import.meta.url)), '..', 'package.json'),
  S = JSON.parse(e.readFileSync(w, 'utf8')),
  { version: v } = S,
  x = process.argv.slice(2);
if (
  ((x.includes('--version') || x.includes('-v')) &&
    (console.log(`gsq version ${v}`), process.exit(0)),
  x.includes('--init'))
)
  !(async function () {
    try {
      console.log('Select AI providers (comma-separated numbers):'),
        f.forEach((e2, o3) => {
          console.log(`${o3 + 1}. ${e2.name} (${e2.apiUrl})`);
        });
      const o2 = (await p('> '))
        .split(',')
        .map((e2) => parseInt(e2.trim()) - 1)
        .filter((e2) => !isNaN(e2) && e2 >= 0 && e2 < f.length);
      0 === o2.length &&
        (console.error('Error: You must select at least one provider.'),
        console.error('Run gsq --init again.'),
        process.exit(1));
      const t2 = { providers: {} };
      for (const e2 of o2) {
        const o3 = f[e2],
          s2 = await p(`Enter your ${o3.name} API key: `, true);
        t2.providers[o3.key] = { apiKey: d(s2), apiUrl: o3.apiUrl };
      }
      e.writeFileSync(h, JSON.stringify(t2, null, 2)),
        console.log(`Configuration saved to ${h}`),
        process.exit(0);
    } catch (e2) {
      console.error('Initialization failed:', e2.message), process.exit(1);
    }
  })();
else if (x.includes('--offer'))
  !(async function () {
    try {
      e.existsSync(h) ||
        (console.error('Error: Configuration file not found. Run gsq --init first.'),
        process.exit(1));
      const t2 = JSON.parse(e.readFileSync(h, 'utf8'));
      let s2, r2;
      (t2.providers && 0 !== Object.keys(t2.providers).length) ||
        (console.error('Error: No providers configured. Run gsq --init first.'), process.exit(1));
      try {
        (s2 = i('git status --porcelain').toString().trim()),
          s2 ||
            (console.log('No changes detected in git working tree (staged or unstaged).'),
            process.exit(0)),
          (r2 = i('git diff --cached').toString().trim()),
          r2
            ? console.log('Using staged changes for commit message generation.')
            : ((r2 = i('git diff').toString().trim()),
              r2
                ? console.log('Warning: No staged changes found. Using unstaged changes instead.')
                : (console.log('No changes detected in git working tree or staging area.'),
                  process.exit(0)));
      } catch (e2) {
        console.error('Error getting git info:', e2.message), process.exit(1);
      }
      console.log('\nGenerating commit messages...\n');
      let l2 = [],
        g2 = 0;
      for (const [e2, o2] of Object.entries(t2.providers)) {
        const t3 = f.find((o3) => o3.key === e2);
        if (t3) {
          g2++;
          try {
            const i2 = await y(e2, o2.apiUrl, o2.apiKey, s2, r2);
            console.log(
              n.bold.blue(`
=== ${t3.name} Suggestions ===`)
            ),
              Array.isArray(i2)
                ? i2.forEach((e3) => {
                    const o3 = e3.type ? `${e3.type}: ${e3.message}` : e3.message;
                    console.log(n.bold(`• ${o3}`)),
                      e3.description && console.log(`  ${e3.description}`),
                      console.log(),
                      l2.push({
                        name: `${t3.name}: ${o3}`,
                        value: e3.type ? `${e3.type}: ${e3.message}` : e3.message,
                        provider: t3.name,
                        description: e3.description || '',
                      });
                  })
                : (console.log(i2),
                  l2.push({
                    name: `${t3.name}: ${i2}`,
                    value: i2,
                    provider: t3.name,
                    description: '',
                  }));
          } catch (e3) {
            console.error(n.red(`Error with ${t3.name}:`), e3.message);
          }
        }
      }
      0 === l2.length && (console.log(n.yellow('No suggestions were generated.')), process.exit(0)),
        l2.push({ name: n.gray('None (exit without committing)'), value: null });
      const { selectedMessages: p2 } = await a.prompt([
        {
          type: 'checkbox',
          name: 'selectedMessages',
          message: 'Select commit message(s):',
          choices: l2,
          pageSize: 15,
          loop: false,
          filter: (e2) =>
            Array.isArray(e2)
              ? e2
                  .map((e3) =>
                    e3 && 'string' == typeof e3 ? e3.split(': ').slice(1).join(': ') : e3
                  )
                  .filter(Boolean)
              : [],
        },
      ]);
      (p2 && 0 !== p2.length) ||
        (console.log(n.gray('\nNo commit messages selected. Exiting.')), process.exit(0));
      let m2 = p2.join('\n\n');
      const { commitAction: d2 } = await a.prompt([
        {
          type: 'list',
          name: 'commitAction',
          message: 'How would you like to proceed with this commit message?',
          choices: [
            { name: 'Commit with this message', value: 'commit' },
            { name: 'Edit message before committing', value: 'edit' },
            { name: 'Cancel', value: 'cancel' },
          ],
          default: 'commit',
        },
      ]);
      if (
        ('cancel' === d2 && (console.log(n.gray('\nCommit cancelled.')), process.exit(0)),
        'edit' === d2)
      ) {
        const t3 = o.join(c.tmpdir(), `gsq-commit-${Date.now()}.txt`);
        e.writeFileSync(t3, m2);
        const s3 = process.env.GIT_EDITOR || process.env.VISUAL || process.env.EDITOR || 'vi';
        try {
          i(`${s3} "${t3}"`, { stdio: 'inherit' }), (m2 = e.readFileSync(t3, 'utf8').trim());
        } catch (e2) {
          console.error(n.red('Error editing commit message:'), e2.message), process.exit(1);
        } finally {
          try {
            e.unlinkSync(t3);
          } catch {}
        }
        m2 || (console.log(n.gray('\nEmpty commit message. Aborting.')), process.exit(0));
      }
      try {
        const e2 = m2.replace(/"/g, '\\"');
        i(`git commit -m "${e2}"`, { stdio: 'inherit' }),
          console.log(n.green.bold('\n✓ Successfully committed with message:')),
          console.log(n.cyan(`"${m2}"`));
        try {
          const e3 = i('git rev-parse --short HEAD').toString().trim();
          console.log(n.gray(`Commit hash: ${e3}`));
        } catch (e3) {
          console.log(n.gray('(Could not retrieve commit hash)'));
        }
      } catch (e2) {
        console.error(n.red.bold('\n✗ Failed to create commit:'), e2.message), process.exit(1);
      }
      process.exit(0);
    } catch (e2) {
      console.error(n.red.bold('\nError:'), e2.message), process.exit(1);
    }
  })();
else if (x.includes('--config')) {
  e.existsSync(h) ||
    (console.log('Error: Configuration file not found. Run gsq --init first.'), process.exit(1));
  const o2 = JSON.parse(e.readFileSync(h, 'utf8'));
  console.log('Configuration:'), console.log(o2);
} else
  console.log('Usage:'),
    console.log('  gsq --init      Initialize configuration'),
    console.log('  gsq --offer     Generate commit message suggestions'),
    console.log('  gsq --version   Show version'),
    console.log('  gsq --config    Show configuration'),
    process.exit(1);
