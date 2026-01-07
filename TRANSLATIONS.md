# IDS Documentation Structure Patterns

## Global Structure

    body.ids
      header (empty)
      main
        .ids__wrapper [.L|.XL|.XXL]?
          .section [#id]?
            content


## Core Pattern

### Section

    .section [#id]?
      h1|h2|h3|h4 [code]?
      p+
      code?
      aside?
        h4?
        p+
        style?
        [content: table, figure, examples]
      [demonstration content]


**Characteristics:**
- ID optional (for anchors/navigation)
- code shows class/tag names (inline in heading or standalone)
- aside optional for technical notes, caveats, implementation details, or example containers
- demonstration content varies: grids, galleries, tables, component instances
- text content may be wrapped in `.ids__text-width` for reading measure (visual detail, not structural)

**Examples:** all sections throughout document

---

## Supporting Patterns

### Aside Variants

**Technical caveat:**
```
aside
  p
```

**Implementation details:**
```
aside
  h4
  p+
```

**Example container:**
```
aside
  style?
  [content: table, figure, code examples]
```

**Meta information:**
```
aside
  p (repo, version, links)
  p+
```

---

### Code Display Variants

**Inline reference:**
```
code.class-name
```

**In paragraph:**
```
p: text + code + text
```

**Hierarchical markup:**
```
p code (parent)
p     code (child, indented with spaces)
```

**Comparison layout:**
```
.ids__sequence.XL
  .ids__sequence-item
    p (label)
    p code (approach A)
  .ids__sequence-item
    p (label) 
    p code (approach B)
```

---

### Grid Demonstrations

**Standard pattern:**
```
.ids__sequence.[size] [.gap-[size]]?
  .ids__sequence-item+
    (avoid styling item directly)
    div|figure (style this instead)
      content
```

**Inline-gallery variant:**
```
.ids__sequence.[size]
  .ids__sequence-item+
    .ids__inline-gallery [.img-contained]? style="--img-aspect-ratio: w/h"
      img+
      figcaption.[modifier]?
```

---

### Wrapper Modifiers

- `.ids__wrapper` - standard (default)
- `.ids__wrapper.L` - wider
- `.ids__wrapper.XL` - minimal margin  
- `.ids__wrapper.XXL` - no margin

Desktop-only differentiation; mobile collapses L/XL to standard

---

### Inline Styling

- Extensively used in demonstrations
- Custom property overrides: `style="--var: value"`
- Color demos: `style="background-color: rgba(var(--ids__color-RGB), opacity)"`
- Aspect ratios: `style="--img-aspect-ratio: width/height"`


# Translation instructions

## File setup
- Place translations in language subdirectories: `en/index.html`, `de/index.html`, etc.
- Change `lang="ru"` to appropriate language code
- Update all relative paths with `../` prefix: `css/` → `../css/`, `js/` → `../js/`, `images/` → `../images/`
- Update self-references: `index.html` → `en/index.html` (in the aside about downloading)

## URLs
- Course link: remove `/ru/` for English → `intuition.team/how-to-design-with-code`
- Docs link: keep as root `intuition-tech.github.io/ids` (not language-specific)

## Typography
- Curly quotes: use `&ldquo;` `&rdquo;` for double, `&lsquo;` `&rsquo;` for single/apostrophe
- Dashes: use `&ndash;` for en-dash

## Terminology to preserve
- "floors" — intentional metaphor for horizontal page sections (like building floors)
- "lead blocks" — typography reference for spacers (like in metal typesetting)
- "stroke thickness" — general term covering both CSS borders and SVG strokes