import { ref } from 'vue';

const model = ref<string>('llama3');
export const useSettings = () => {
	return {
		model,
	};
};
