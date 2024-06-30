<template>
  <div
    class="flex-1 rounded-xl p-4 text-sm leading-6 text-slate-900 dark:text-slate-100 sm:text-base sm:leading-7"
ref="messageWrapper"  
    >
    
    <template v-for="message of messages">
      <UserMessage v-if="message.role==='user'" :message="message"/>
      <AIMessage v-else :message="message" />
    </template>
    <LoadingIndicator :is-loading="isLoading"/>
    <div class="absolute mt-20"></div>
  </div>
</template>

<script setup lang="ts">
import { useMessages } from '@/composeables/useMessages';
import { useElementSize } from '@vueuse/core';
import { ref, watch } from 'vue';
import AIMessage from './AiMessage.vue';
import LoadingIndicator from './LoadingIndicator.vue';
import UserMessage from './UserMessage.vue';

defineProps<{ isLoading: boolean }>();

const messageWrapper = ref<HTMLDivElement | null>(null);
const { height } = useElementSize(messageWrapper);

watch(height, () => {
	messageWrapper.value?.lastElementChild?.scrollIntoView({
		behavior: 'smooth',
		block: 'end',
	});
});

const { messages } = useMessages();
</script>
