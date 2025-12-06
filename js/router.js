export class Router {
  constructor(config, renderer) {
    this.config = config;
    this.renderer = renderer;
  }

  async navigate(path) {
    const route = this.parsePath(path);
    const contentElement = document.getElementById("content");
    contentElement.innerHTML = '<div class="loading">Loading...</div>';
    try {
      const content = await this.fetchContent(route.page);
      contentElement.innerHTML = this.renderer.render(content);
      window.history.pushState(
        {},
        "",
        `#/${route.page}${route.hash ? "#" + route.hash : ""}`,
      );

      if (route.hash) {
        setTimeout(() => {
          const element = document.getElementById(route.hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 300);
      } else {
        window.scrollTo(0, 0);
      }
    } catch (error) {
      contentElement.innerHTML = `<div class="error" onclick="alert('pedantic people will know this is actually 200 but stfu')" style="cursor: pointer; text-decoration: underline;">error 404*; ${route.page}</div>`;
    }
  }

  parsePath(path) {
    if (path.startsWith("#/")) {
      const hashPath = path.substring(2);
      const [page, ...hashParts] = hashPath.split("#");
      return {
        page: page || "home",
        hash: hashParts.length > 0 ? hashParts.join("#") : null,
      };
    } else if (path.startsWith("/#/")) {
      const hashPath = path.substring(3);
      const [page, ...hashParts] = hashPath.split("#");
      return {
        page: page || "home",
        hash: hashParts.length > 0 ? hashParts.join("#") : null,
      };
    } else {
      if (path === "/" || path === "") return { page: "home", hash: null };
      return { page: path.substring(1), hash: null };
    }
  }

  async fetchContent(route) {
    const url = `${this.config.baseUrl}/${route}.md`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("content not found");
    return await response.text();
  }
}
