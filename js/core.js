import { Router } from "./router.js";
import { Renderer } from "./renderer.js";
import { ThemeManager } from "./theme.js";

class Markdownium {
  constructor() {
    this.config = null;
    this.router = null;
    this.renderer = null;
    this.themeManager = null;
  }

  async init() {
    try {
      await this.loadConfig();
      await this.setupTheme();
      this.setupRenderer();
      this.setupRouter();
      this.initializeUI();
      this.setupNavigation();
      this.setupFooter();
      const hash = window.location.hash;
      if (hash && hash !== "#/") {
        this.router.navigate(hash);
      } else {
        this.router.navigate("#/home");
      }
    } catch (error) {
      this.showError("Failed to initialize: " + error.message);
    }
  }

  async loadConfig() {
    const response = await fetch("/config.json");
    if (!response.ok) throw new Error("config not found");
    this.config = await response.json();
  }

  async setupTheme() {
    this.themeManager = new ThemeManager();
    await this.themeManager.loadTheme(this.config.theme);
  }

  setupRenderer() {
    this.renderer = new Renderer(this.config);
  }

  setupRouter() {
    this.router = new Router(this.config, this.renderer);

    window.addEventListener("popstate", () => {
      this.router.navigate(window.location.hash || "#/home");
    });

    document.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        const href = e.target.getAttribute("href");
        if (href && (href.startsWith("/#/") || href.startsWith("#/"))) {
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
    document.getElementById("site-name").textContent = this.config.siteName;
    document.title = this.config.siteName;
    this.setFavicon();
    this.setMetaTags();
  }

  setFavicon() {
    if (this.config.theme.faviconEmoji) {
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${this.config.theme.faviconEmoji}</text></svg>`;
      }
    }
  }

  setMetaTags() {
    const descriptionTag = document.querySelector('meta[name="description"]');
    const authorTag = document.querySelector('meta[name="author"]');
    if (descriptionTag && this.config.description) {
      descriptionTag.content = this.config.description;
    }

    if (authorTag && this.config.author) {
      authorTag.content = this.config.author;
    }
  }

  setupNavigation() {
    if (this.config.mainMenu) {
      const menuContainer = document.getElementById("main-menu");
      const mobileMenuContainer = document.getElementById("main-menu-items");
      this.config.mainMenu.forEach((item) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = item.newTab ? item.url : `#/${item.url}`;
        a.textContent = item.name;
        if (item.newTab) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }

        li.appendChild(a);
        menuContainer.appendChild(li);
        mobileMenuContainer.appendChild(li.cloneNode(true));
      });
    }
  }

  setupFooter() {
    const socialsContainer = document.getElementById("socials");
    const copyrightContainer = document.getElementById("copyright");
    if (this.config.socials && this.config.socials.length > 0) {
      socialsContainer.innerHTML = "<ul></ul>";
      const ul = socialsContainer.querySelector("ul");
      this.config.socials.forEach((social) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = social.url;
        a.className = "social-link";
        a.title = social.name;
        a.setAttribute("aria-label", social.name);
        a.rel = "me noopener noreferrer";
        a.target = "_blank";
        a.textContent = social.name;
        li.appendChild(a);
        ul.appendChild(li);
      });
    }

    if (copyrightContainer) {
      const year = new Date().getFullYear();
      const author = this.config.author || "Unknown";
      copyrightContainer.innerHTML = `
        <span>© <time>${year}</time> ${author}</span>
        <span>Powered by <a href="https://github.com/Markdownium">Markdownium</a></span>
      `;
    }
  }

  showError(message) {
    const mainElement = document.getElementById("main");
    if (mainElement) {
      mainElement.innerHTML = `<div class="error">${message}</div>`;
    }
  }
}

const app = new Markdownium();
app.init();
