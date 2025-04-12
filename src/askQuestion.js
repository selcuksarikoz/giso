import readline from "readline";

export function askQuestion(question, sensitive = false) {
  return new Promise((resolve) => {
    if (sensitive) {
      // Sensitive input handling (for API keys)
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Write the initial prompt
      process.stdout.write(question);

      let input = "";
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }

      const onData = (char) => {
        char = char.toString();
        switch (char) {
          case "\n":
          case "\r":
            process.stdin.removeListener("data", onData);
            if (process.stdin.isTTY) {
              process.stdin.setRawMode(false);
            }
            rl.close();
            resolve(input);
            break;
          case "\u0003": // Ctrl+C
            process.stdin.removeListener("data", onData);
            if (process.stdin.isTTY) {
              process.stdin.setRawMode(false);
            }
            rl.close();
            process.exit(0);
            break;
          default:
            input += char;
            process.stdout.write(
              "\x1B[2K\x1B[200D" + question + "*".repeat(input.length),
            );
            break;
        }
      };

      process.stdin.on("data", onData);
    } else {
      // Regular input handling (for numbers, selections)
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}
