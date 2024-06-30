<template>
    <div class="flex flex-row px-2 py-4 sm:px-4">
    <div class="mr-2 flex h-9 w-9 pt-2 rounded-full sm:mr-4 bg-slate-500 text-slate-300 font-semibold justify-center text-xs">YOU</div>

    <div class="flex items-center mr-5">
        <vue-markdown :source="message.content"  class="prose max-w-none text-slate-500" />
    </div>
    </div>
</template>

<script setup lang="ts">
import type { Message } from 'ollama';
import VueMarkdown from 'vue-markdown-render';

const _props = defineProps<{
	message: Message;
}>();
</script>
