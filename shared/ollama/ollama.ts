import { config } from '@buildownai/examples_config';
import { Ollama } from 'ollama';

export const ollama = new Ollama(config().ollama);

// Ensure the requeted model is present in Ollama.
// If not, it will be downloaded
export const ensureModel = async (model: string) => {
  const listResult = await ollama.list();
  const installed = listResult.models.find((item) =>
    item.name.startsWith(model),
  );

  if (installed) {
    console.log(`Model ${model} present in ollama`);
    return;
  }

  console.log(`Model ${model} not present in ollama - downloading ${model}...`);

  let currentDigestDone = false;
  const stream = await ollama.pull({
    model,
    stream: true,
  });

  for await (const part of stream) {
    if (part.digest) {
      let percent = 0;
      if (part.completed && part.total) {
        percent = Math.round((part.completed / part.total) * 100);
      }
      process.stdout.clearLine(0); // Clear the current line
      process.stdout.cursorTo(0); // Move cursor to the beginning of the line
      process.stdout.write(`${part.status} ${percent}%...`); // Write the new text
      if (percent === 100 && !currentDigestDone) {
        console.log(); // Output to a new line
        currentDigestDone = true;
      } else {
        currentDigestDone = false;
      }
    } else {
      console.log(part.status);
    }
  }
};
