# Simple RAG

An example on how to build s simple RAG for generating FAQ data from given text.
The generated and stored FAQ is used, to answer questions.

|   |   |
|---|---|
| Welcome to the BuildOwn.AI repository, your companion for the book. Here, you'll find all the code snippets and examples from the book, organized for easy reference and use. | [![BuildOwn.AI](book.png)](https://buildown.ai) |
| [BuildOwn.AI](https://buildown.ai) | [Get The Book](https://buildown.ai/book/buy) |

## Requirements

Ensure, you have:

- [Bun](https://bun.sh) installed as JavaScript/Typescript runtime
- [Ollama](https://ollama.com/) installed and running on your machine

This examples is using the models `nomic-embed-text` for embedding and `gemma2` as llm model.

The models will be downloaded, if they are not already present in Ollama.

## Install & Run

Run `bun i` to install all dependencies.

Run `bun start` to start the program.
The program provides a simple http server at [http://localhost:3000](http://localhost:3000).

## Generate the FAQ

Open [http://localhost:3000](http://localhost:3000) in your browser. This will show you the swagger UI.

Navigate to `POST /add`, click to expand, and click on the "_Try itout_" button.
You can now insert you text.

Click on the button "_Execute_", and hava look at the output on console log of this program.


## Ask questions

Open [http://localhost:3000](http://localhost:3000) in your browser. This will show you the swagger UI.

Navigate to `POST /ask`, click to expand, and click on the "_Try itout_" button.
You can now insert you question.

Click on the button "_Execute_", and hava look at the output on console log of this program.
