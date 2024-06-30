/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'selector', //'selector',
	content: ['./src/ui/index.html', './src/ui/**/*.{vue,js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f3f2ff',
					100: '#e9e8ff',
					200: '#d6d4ff',
					300: '#b8b2ff',
					400: '#9486ff',
					500: '#7255fd',
					600: '#6031f6',
					700: '#5120e1',
					800: '#431abd',
					900: '#39179b',
					950: '#260e7b',
				},
				secondary: {
					50: '#fbffe7',
					100: '#f3ffc1',
					200: '#ecff86',
					300: '#e9ff41',
					400: '#eeff0d',
					500: '#f1f500',
					600: '#d1c200',
					700: '#a68e02',
					800: '#896e0a',
					900: '#74590f',
					950: '#443104',
				},
			},
		},
	},
	plugins: [require('@tailwindcss/typography')],
};
