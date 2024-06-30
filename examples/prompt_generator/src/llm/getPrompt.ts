export type GeneratePromptInput = {
	generalAiInfo: string;
	taskDescription: string;
	inputDescription: string;
	outputDescription: string;
};

export const getPrompt = (input: GeneratePromptInput) => `Generate a system prompt. Here are the information about the prompt:

  ## About the AI
  Here are some general information about the AI:

  ${input.generalAiInfo}

  ## The task
  Here is the description of the task that needs to be done by the AI:

  ${input.taskDescription}

  ## The expected prompt input
  Here are some information about the expected input, the model will receive during the task:

  ${input.inputDescription}

  ## The expected output of the model
  Here are details on how the response output is expected to be:

  ${input.outputDescription}
`;
