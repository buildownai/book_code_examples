# Chapter Summarizer

This example does:

- walk through a given input directory recursively
- read the content of the mark down files
- create a summary via llm of the markdown content
- output the response to the output directory

## Requirements

This example expects, that you have a **[Ollama with Meta Llama 3](https://www.ollama.com/library/llama3)** running on your machine.

It also uses **[Bun](https://bun.sh)** as Typescript runtime.
