<template>
  <div>
    <form class="mt-2 ml-8 mr-8"  @submit.prevent="handleSubmit">
    <div class="flex gap-x-2">
      <input
        v-model="model"
        id="chat-input"
        type="text"
        class="w-full max-h-14 rounded-lg border border-slate-300 bg-slate-100 p-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-200/10 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-400 dark:focus:border-blue-600 sm:text-base"
        placeholder="Chat with the model to improve"
        required
        autocomplete="off"
      />
      <button
        type="submit"
        class="rounded-lg border border-transparent bg-blue-600 px-3 py-1 text-slate-200 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M10 14l11 -11"></path>
          <path
            d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"
          ></path>
        </svg>
      </button>
    </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const model = defineModel();
const emit = defineEmits(['submit']);

const handleSubmit = () => {
	emit('submit');
};
</script>
