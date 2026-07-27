---
name: Google Fonts import with Tailwind v4
description: @import url() in Tailwind v4 input CSS causes PostCSS error; must use index.html link tag instead
---

Placing `@import url('https://fonts.googleapis.com/...')` in the Tailwind v4 input CSS (`index.css`) causes a PostCSS error:
`@import must precede all other statements (besides @charset or empty @layer)`

**Why:** Tailwind v4 generates a large block of CSS before user rules, so by the time PostCSS sees the `@import url(...)`, there are already non-import statements above it.

**How to apply:** Put Google Fonts in `index.html` as `<link>` tags, not in CSS:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

Never use `@import url(https://fonts.googleapis.com/...)` in Tailwind v4 CSS files.
