<template>
<div
  class="flex rounded-xl bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-300 px-2 py-6 sm:px-4 border border-slate-200 dark:border-slate-700 mb-2"
>
  <div class="mr-2 flex h-9 w-9 pt-1 rounded-full sm:mr-4 bg-blue-500 text-white font-semibold justify-center">AI</div>
  <div class="items-center grow rounded-xl w-full mr-5">
    <template v-for="m of splittedContent">
      <vue-markdown v-if="m.type==='md'" :source="m.content" class="prose w-full text-slate-900 dark:text-slate-300" />
      <GeneratedPrompt v-else :message="m.content"  class=" w-full"/>
      </template>
  </div>
</div>
</template>

<script setup lang="ts">
import type { Message } from 'ollama';
import { computed } from 'vue';
import VueMarkdown from 'vue-markdown-render';
import GeneratedPrompt from './GeneratedPrompt.vue';

const props = defineProps<{
	message: Message;
}>();
const splittedContent = computed(() => {
	if (!props.message.content) {
		return [{ type: 'md', content: '' }];
	}
	const match = props.message.content.match(
		/^([\s\S]*?)<prompt>([\s\S]*?)(?:<\/prompt>|$)([\s\S]*?)$/i,
	);
	if (match) {
		const m: { type: string; content: string }[] = [
			{ type: 'md', content: match[1] ?? '' },
		];

		if (match[2]?.length) {
			m.push({ type: 'prompt', content: match[2] ?? '' });
		}
		if (match[3]?.length) {
			m.push({ type: 'md', content: match[3] ?? '' });
		}
		return m;
	} else {
		return [{ type: 'md', content: props.message.content }];
	}
});
</script>
