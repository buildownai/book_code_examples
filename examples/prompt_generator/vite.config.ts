import { URL, fileURLToPath } from 'node:url';
import devServer, { defaultOptions } from '@hono/vite-dev-server';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig(() => {
	return {
		root: './src/ui',
		plugins: [
			vue(),

			devServer({
				entry: './src/server.ts',
				exclude: [/.*\.vue$/, ...defaultOptions.exclude],
			}),
		],
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src/ui', import.meta.url)),
			},
		},
	};
});
