export const removeFrontmatter = (markdown: string): string => {
	// Match frontmatter block starting with '---' or '+++'
	const frontmatterRegex = /^---[\s\S]*?---\s*|^\+\+\+[\s\S]*?\+\+\+\s*/

	// Remove the frontmatter block if it exists
	return markdown.replace(frontmatterRegex, '').trim()
}
