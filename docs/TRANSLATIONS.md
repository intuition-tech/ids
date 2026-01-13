# Translation instructions

## File setup
- Place translations in language subdirectories: `en/index.html`, `de/index.html`, etc.
- Change `lang="ru"` to appropriate language code
- Update all relative paths with `../` prefix: `css/` → `../css/`, `js/` → `../js/`, `images/` → `../images/`
- Update self-references: `index.html` → `en/index.html` (in the aside about downloading)

## URLs
- Course link: remove `/ru/` for English → `intuition.team/how-to-design-with-code`
- Docs link: keep as root `intuition-tech.github.io/ids` (not language-specific)
- For links to Russian-only pages, append "(in Russian)" to the label. Check linked pages manually; ask if in doubt.

## Typography
- Curly quotes: use `&ldquo;` `&rdquo;` for double, `&lsquo;` `&rsquo;` for single/apostrophe
- Dashes: use `&ndash;` for en-dash, prepend with non-breaking space `&nbsp;`

## Terminology to preserve
- "floors" — intentional metaphor for horizontal page sections (like building floors)
- "lead blocks" — typography reference for spacers (like in metal typesetting)
- "stroke thickness" — general term covering both CSS borders and SVG strokes

## Navigation
- Keep `ids-nav-item` label attributes short — they appear in the menu