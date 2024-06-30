<template>
    <div class="mt-4 flex justify-center" aria-hidden="true">
      <div class="flex animate-pulse space-x-2" v-if="isLoading">
        <div class="h-2 w-2 rounded-full bg-slate-600"></div>
        <div class="h-2 w-2 rounded-full bg-slate-600"></div>
        <div class="h-2 w-2 rounded-full bg-slate-600"></div>
      </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
	isLoading: boolean;
}>();
</script>