const reg = /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g

export const transformToSnakeCase = (input: string): string => {
	return input
		? // biome-ignore lint/style/noNonNullAssertion: <explanation>
			input
				.match(reg)!
				.map((x: string) => x.toLowerCase())
				.join('_')
		: ''
}
