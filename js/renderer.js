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
        highlight: (code, lang, info) => {
          if (this.hljs && this.hljs.getLanguage(lang)) {
            return this.hljs.highlight(code, { language: lang }).value;
          }
          return code;
        },
      }),
    );
    this.marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }

  render(markdown, route = null) {
    let processedMarkdown = markdown.replaceAll("%GAP%", "&nbsp;&nbsp;&nbsp;");
    const frontmatter = this.extractFrontmatter(processedMarkdown);
    let content = processedMarkdown;

    if (frontmatter) {
      content = content.substring(frontmatter.length);
    }

    const html = this.marked.parse(content);
    const processedHtml = this.addCopyButtons(html);
    const finalHtml = this.addHeadingAnchors(processedHtml);
    return DOMPurify.sanitize(finalHtml, {
      ADD_TAGS: ["iframe", "video", "audio", "button"],
      ADD_ATTR: [
        "allow",
        "allowfullscreen",
        "frameborder",
        "scrolling",
        "id",
        "onclick",
        "style",
        "class",
      ],
    });
  }

  extractFrontmatter(markdown) {
    if (markdown.startsWith("+++\n")) {
      const endIndex = markdown.indexOf("\n+++", 3);
      if (endIndex !== -1) {
        return markdown.substring(0, endIndex + 4);
      }
    }
    return null;
  }

  addCopyButtons(html) {
    return html.replace(
      /<pre><code class="hljs language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g,
      (match, lang, code) => {
        return `<pre><button class="copy-button" onclick="navigator.clipboard.writeText(${JSON.stringify(code)}); this.textContent='Copied!'; this.classList.add('copied'); setTimeout(() => { this.textContent='Copy'; this.classList.remove('copied'); }, 2000);">Copy</button><code class="hljs language-${lang}">${code}</code></pre>`;
      },
    );
  }

  addHeadingAnchors(html) {
    return html.replace(/<h([1-6])>(.*?)<\/h\1>/g, (match, level, content) => {
      const id = content
        .toLowerCase()
        .replace(/<[^>]*>/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      return `<h${level} id="${id}">${content}</h${level}>`;
    });
  }

  renderPost(postData) {
    const { title, date, content, tags } = postData;
    let html = `<article class="post">
      <header class="post-header">
        <h1 class="post-title">${title}</h1>
        <div class="post-meta">${date ? new Date(date).toLocaleDateString() : ""}</div>
      </header>
      <div class="post-content">
        ${this.render(content)}
      </div>`;

    if (tags && tags.length > 0) {
      html += '<div class="tags">';
      tags.forEach((tag) => {
        html += `<a href="#/tags/${tag}" class="tag">${tag}</a>`;
      });
      html += "</div>";
    }

    html += "</article>";
    return html;
  }

  renderExcerpt(postData) {
    const { title, date, summary, slug } = postData;
    return `<article class="excerpt">
      <h2 class="excerpt-title">
        <a href="#/${slug}">${title}</a>
      </h2>
      <div class="excerpt-meta">${date ? new Date(date).toLocaleDateString() : ""}</div>
      <div class="excerpt-summary">
        ${summary || ""}
      </div>
      <a href="#/${slug}" class="read-more">Read more →</a>
    </article>`;
  }
}
