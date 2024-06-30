<template>
  <div class="rounded-lg border dark:border-slate-700 dark:bg-slate-950 border-slate-700 bg-slate-800 mt-5 mb-5">
      <div class="prose prose-invert w-full whitespace-pre-wrap p-3 text-slate-400" style="max-width: none !important">{{ message.trim() }}</div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ message: string }>();
</script>