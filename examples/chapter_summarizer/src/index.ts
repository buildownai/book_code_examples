import { mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path'
import { config } from './config.js';

import { ensureModel } from '@buildownai/examples_ollama';
import { rimraf } from 'rimraf';
import { summarize } from './llm.js';

console.log('Start');

// Ensure the required models available in Ollama
// They are automatically downloaded, if not present
await ensureModel(config().model);

// Cleaning the output folder
console.log('Cleaning output folder');
const isClean = await rimraf(config().outputDir);
if (!isClean) {
  console.error('Output folder yould not be cleaned');
  process.exit(1);
}
await mkdir(config().outputDir, { recursive: true })
console.log('✅ clean output folder');

// Start summarizer
const files = await readdir(config().inputDir, { recursive: true });
for (const fileName of files) {
  console.log(`📑 -> reading ${fileName}`);
  const inFile = resolve(config().inputDir, fileName)
  const foo = Bun.file(inFile);
  const content = await foo.text()

  const summary = await summarize(content)

  const outFile = resolve(config().outputDir, fileName)
  await Bun.write(outFile, summary)
  console.log(`✅ -> created ${fileName}`);
}

console.log('🎉 Finish');
