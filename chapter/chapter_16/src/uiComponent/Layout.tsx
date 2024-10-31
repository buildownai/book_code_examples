import { raw } from 'hono/html'
import type { FC } from 'hono/jsx'

export const Layout: FC = ({ children }) => (
	<html lang="en">
		<head>
			<title>Hono Chat Interface</title>
			<script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,container-queries" />
			<link
				rel="stylesheet"
				href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css"
			/>
			<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" />
			<script lang="js" type="module">
				{raw(`
        hljs.highlightAll();
        `)}
			</script>
		</head>
		<body class="font-sans bg-slate-300 dark:bg-slate-800">{children}</body>
	</html>
)
