<template>
  <div class="flex h-dvh w-dvw">
    <Sidebar/>
    <div class="flex flex-col h-dvh relative grow">
      <div class="grow min-h-vh overflow-y-auto">
        <div class="flex w-full h-vw flex-col pb-5 overflow-y-auto">
            <div>
            <h1 class="font-semibold text-2xl p-2 text-center">Prompt Generator</h1>
            </div>
            <div
            class="flex-1 space-y-6 overflow-y-auto rounded-xl p-4 text-sm leading-6 text-slate-900 dark:text-slate-300 sm:text-base sm:leading-7"
            >
              <Messages :is-loading="isLoading" />
            </div>
        </div>
      </div>
      <div class="min-h-16 bg-slate-500/30 backdrop-blur-sm dark:bg-slate-600">
        <PromptInput v-model="userMsg" @submit="sendChatMessage"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Messages from '@/components/Messages.vue';
import PromptInput from '@/components/PromptInput.vue';
import Sidebar from '@/components/Sidebar.vue';

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { onBeforeMount, ref } from 'vue';
import { useMessages } from './composeables/useMessages';
import { useSettings } from './composeables/useSettings';

const userMsg = ref<string>('');
const isLoading = ref(false);

const { fetchMessageHistory, addHistory, messages } = useMessages();
const { model } = useSettings();

onBeforeMount(async () => {
	await fetchMessageHistory();
	await sendInitMessage();
});

const sendChatMessage = async () => {
	const msg = userMsg.value;
	userMsg.value = '';
	addHistory('user', msg);
	addHistory('assistant', '');
	const index = messages.value.length - 1;

	fetchEventSource('/api/prompt-generator/chat', {
		method: 'POST',
		body: JSON.stringify({
			message: msg,
			model: model.value,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
		openWhenHidden: true,
		onclose: () => {
			isLoading.value = false;
		},
		onmessage: (event) => {
			if (event.event === 'start') {
				isLoading.value = true;
			}
			if (event.event === 'end') {
				isLoading.value = false;
			}
			if (event.event === 'response') {
				messages.value[index].content += JSON.parse(event.data).content;
			}
		},
		onerror: console.error,
	});
};

const sendInitMessage = async () => {
	addHistory('assistant', '');
	const index = messages.value.length - 1;

	fetchEventSource('/api/prompt-generator/generate', {
		method: 'POST',
		body: JSON.stringify({
			generalAiInfo: 'You are the author of the book',
			taskDescription: 'Summarize the given chapters of the book',
			inputDescription: 'a single chapter of the book',
			outputDescription: 'A detailed description',
			model: model.value,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
		openWhenHidden: true,
		onclose: () => {
			isLoading.value = false;
		},
		onmessage: (event) => {
			if (event.event === 'start') {
				isLoading.value = true;
			}
			if (event.event === 'end') {
				isLoading.value = false;
			}
			if (event.event === 'response') {
				messages.value[index].content += JSON.parse(event.data).content;
			}
		},
		onerror: console.error,
	});
};
</script>
