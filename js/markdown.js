export class MarkdownProcessor {
    static processImages(baseUrl, markdown) {
        return markdown.replace(/!\[([^\]]*)\]\((?!http)([^)]+)\)/g, (match, alt, src) => {
            return `![${alt}](${baseUrl}/${src})`;
        });
    }

    static processLinks(markdown) {
        return markdown.replace(/\[([^\]]+)\]\((?!http)([^)]+)\)/g, (match, text, href) => {
            return `[${text}](${href})`;
        });
    }
}
