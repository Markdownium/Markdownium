import { Router } from "./router.js";
import { Renderer } from "./renderer.js";

class Markdownium {
  constructor() {
    this.config = null;
    this.router = null;
    this.renderer = null;
  }

  async init() {
    try {
      await this.loadConfig();
      this.setupRenderer();
      this.setupRouter();
      this.initializeUI();
      const hash = window.location.hash;
      if (hash && hash !== "#/") {
        this.router.navigate(hash);
      } else {
        this.router.navigate("#/home");
      }
    } catch (error) {
      this.showError("Failed to initialize M↓ium: " + error.message);
    }
  }

  async loadConfig() {
    const response = await fetch("/config.json");
    if (!response.ok) throw new Error("config not found, somehow");
    this.config = await response.json();
  }

  setupRenderer() {
    this.renderer = new Renderer(this.config);
  }

  setupRouter() {
    this.router = new Router(this.config, this.renderer);

    window.addEventListener("popstate", () => {
      this.router.navigate(window.location.hash || "/");
    });

    document.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        const href = e.target.getAttribute("href");
        if (href && href.startsWith("/#/")) {
          e.preventDefault();
          this.router.navigate(href);
        } else if (
          e.target.href &&
          e.target.href.startsWith(window.location.origin)
        ) {
          e.preventDefault();
          const path = new URL(e.target.href).pathname;
          this.router.navigate(path);
        }
      }
    });
  }

  initializeUI() {
    document.getElementById("site-logo").src = this.config.logo;
    document.getElementById("site-name").textContent = this.config.siteName;
    document.getElementById("license-badge").innerHTML =
      this.config.licenseBadge;
    document.title = this.config.siteName;

    this.loadSidebar();
    this.loadTopLinks();
  }

  async loadSidebar() {
    const sidebarContent = await this.router.fetchContent("sidebar");
    const sidebarElement = document.getElementById("sidebar");
    sidebarElement.innerHTML = this.renderer.render(sidebarContent);
  }

  async loadTopLinks() {
    try {
      const topContent = await this.router.fetchContent("top");
      const topElement = document.getElementById("top-links");
      topElement.innerHTML = this.renderer.render(topContent);
    } catch (error) {}
  }

  showError(message) {
    document.getElementById("content").innerHTML =
      `<div class="error">${message}</div>`;
  }
}

const app = new Markdownium();
app.init();
