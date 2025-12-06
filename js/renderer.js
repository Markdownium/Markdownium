import { Marked } from "/js/external/marked.esm.js";
import { markedHighlight } from "/js/external/marked-highlight.esm.js";
import hljs from "/js/external/highlight.js";
export class Renderer {
  constructor(config) {
    this.config = config;
    this.hljs = null;
    this.marked = null;
    this.setupMarked();
    this.initHighlightJS();
  }

  async initHighlightJS() {
    try {
      const highlightJs = await import("/js/external/highlight.js");
      console.log(
        highlightJs.default.highlight("console.log('h');", { language: "js" })
          .value,
      );
      this.hljs = highlightJs.default;
      this.setupMarked();
    } catch (error) {
      console.warn("Failed to load highlight.js");
    }
  }

  setupMarked() {
    this.marked = new Marked(
      markedHighlight({
        emptyLangClass: "hljs",
        langPrefix: "hljs language-",
        highlight(code, lang, info) {
          const language = hljs.getLanguage(lang) ? lang : "plaintext";
          return hljs.highlight(code, { language }).value;
        },
      }),
    );
    this.marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }

  render(markdown) {
    let processedMarkdown = markdown.replaceAll("%GAP%", "&nbsp;&nbsp;&nbsp;");
    const html = this.marked.parse(processedMarkdown);
    const processedHtml = html.replace(
      /<h([1-6])>(.*?)<\/h\1>/g,
      (match, level, content) => {
        const id = content
          .toLowerCase()
          .replace(/<[^>]*>/g, "")
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        return `<h${level} id="${id}" style="cursor: pointer;" onclick="const currentPath = window.location.hash || '#/home'; const pagePart = currentPath.split('#')[0] || '#/home'; window.location.hash = pagePart + '#${id}'">${content}</h${level}>`;
      },
    );

    return DOMPurify.sanitize(processedHtml, {
      ADD_TAGS: ["iframe", "video", "audio"],
      ADD_ATTR: [
        "allow",
        "allowfullscreen",
        "frameborder",
        "scrolling",
        "id",
        "onclick",
        "style",
      ],
    });
  }
}
