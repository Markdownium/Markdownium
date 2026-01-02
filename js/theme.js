class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.loadedStylesheets = new Set();
    this.loadedScripts = new Set();
  }

  async loadTheme(themeConfig) {
    await this.unloadTheme();

    if (!themeConfig) {
      console.log("no theme config provided. using default");
      this.currentTheme = "default";
      return;
    }

    this.currentTheme = themeConfig.name || "default";

    if (themeConfig.css && themeConfig.css.length > 0) {
      for (const cssPath of themeConfig.css) {
        await this.loadCSS(cssPath);
      }
    } else {
      console.log("no CSS files to load");
    }

    if (themeConfig.scss && themeConfig.scss.length > 0) {
      console.log("loading SCSS files:", themeConfig.scss);
      for (const scssPath of themeConfig.scss) {
        await this.loadSCSS(scssPath);
      }
    } else {
      console.log("no SCSS files to load");
    }

    if (themeConfig.js && themeConfig.js.length > 0) {
      console.log("loading JS files:", themeConfig.js);
      for (const jsPath of themeConfig.js) {
        await this.loadJS(jsPath);
      }
    } else {
      console.log("no JS files to load");
    }

    this.applyThemeSettings(themeConfig);
  }

  applyThemeSettings(themeConfig) {
    const body = document.body;

    if (themeConfig.colorScheme) {
      body.setAttribute("data-theme", themeConfig.colorScheme);
    }

    if (themeConfig.layout) {
      body.className = `layout-${themeConfig.layout}`;
    }

    if (themeConfig.faviconEmoji) {
      this.setFaviconEmoji(themeConfig.faviconEmoji);
    }
  }

  setFaviconEmoji(emoji) {
    const existingFavicon = document.querySelector('link[rel="icon"]');
    if (existingFavicon) {
      existingFavicon.remove();
    }

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`;
    document.head.appendChild(link);
  }

  async loadCSS(href) {
    if (this.loadedStylesheets.has(href)) {
      console.log("CSS already loaded:", href);
      return;
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => {
        console.log("CSS loaded successfully:", href);
        this.loadedStylesheets.add(href);
        resolve();
      };
      link.onerror = (error) => {
        console.error("failed to load CSS:", href, error);
        reject(error);
      };
      document.head.appendChild(link);
    });
  }

  async loadSCSS(href) {
    if (this.loadedStylesheets.has(href)) return;
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(href);
        if (!response.ok) throw new Error(`failed to fetch SCSS: ${href}`);
        const scssContent = await response.text();
        try {
          const { compileString } = await import("https://jspm.dev/sass");
          const cssContent = compileString(scssContent).css;
          const style = document.createElement("style");
          style.textContent = cssContent;
          style.setAttribute("data-scss-source", href);
          document.head.appendChild(style);
          this.loadedStylesheets.add(href);
          console.log("SCSS compiled and loaded:", href);
          resolve();
        } catch (sassError) {
          console.error("SASS compilation error:", sassError);
          reject(sassError);
        }
      } catch (error) {
        console.error("failed to compile SCSS:", href, error);
        reject(error);
      }
    });
  }

  async loadJS(src) {
    if (this.loadedScripts.has(src)) return;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = src;
      script.onload = () => {
        this.loadedScripts.add(src);
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async unloadTheme() {
    this.loadedStylesheets.forEach((href) => {
      const link = document.querySelector(`link[href="${href}"]`);
      if (link) {
        link.remove();
      }
      const style = document.querySelector(`style[data-scss-source="${href}"]`);
      if (style) {
        style.remove();
      }
    });

    this.loadedScripts.forEach((src) => {
      const script = document.querySelector(`script[src="${src}"]`);
      if (script) {
        script.remove();
      }
    });

    this.loadedStylesheets.clear();
    this.loadedScripts.clear();
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

export { ThemeManager };
