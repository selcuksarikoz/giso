import readline from "readline";
export function askQuestion(question, sensitive = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (sensitive) {
      const stdin = process.openStdin();
      process.stdin.on("data", (char) => {
        // @ts-ignore
        char = char + "";
        switch (char) {
          case "\n":
          case "\r":
          case "\u0004":
            stdin.pause();
            break;
          default:
            process.stdout.write(
              "\x1B[2K\x1B[200D" + question + "*".repeat(rl.line.length)
            );
            break;
        }
      });
    }

    rl.question(question, (answer) => {
      if (sensitive) {
        process.stdin.removeAllListeners("data");
      }
      rl.close();
      resolve(answer);
    });
  });
}
