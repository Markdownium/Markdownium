![Logo](https://github.com/markdownium.png)
# Markdownium

A blazingly fast, minimal wiki engine that doesn't suck.

## Features

- **Client-side rendering** - No server-side processing required
- **Hash-based routing** - Clean URLs like `/#/page` and `/#/page#header` (just like [Holo.js](https://holo.js.org))
- **Syntax highlighting** - Code blocks with Highlight.js
- **Dark theme** - Modern minimal design
- **Responsive** - Mobile-friendly layout
- **XSS protection** - Safe content rendering
- **Auto header IDs** - Clickable headers for deep linking
- **Smooth scrolling** - Navigate to sections seamlessly

## Setup

1. Copy `config.json.def` to `config.json`
2. Configure your settings
3. Place Markdown files in `content/` directory
4. Serve with any static web server

## Configuration

```json
{
  "siteName": "Your Wiki Name",
  "logo": "https://example.com/logo.png",
  "baseUrl": "http://raw.githubusercontent.com/USERNAME/REPO/refs/head/main",
  "licenseBadge": "<a href=\"license-url\"><img src=\"badge-url\"></a>"
}
```

## Content

- Create `.md` files (duh)
- `home.md` is the default page
- `sidebar.md` for sidebar navigation
- `top.md` for top navigation links
- Internal links: `[Text](/#/page-name)` or `[Text](/page-name)`

## Deployment

Deploy to any static hosting service - GitHub Pages, Netlify, Vercel, etc. No server requirements beyond serving static files.
