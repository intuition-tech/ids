/**
 * Deterministic PRNG (mulberry32): same seed always gives the same sequence.
 *
 * @param {number} seed
 * @returns {() => number} Random number in [0, 1)
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shared cyan for Billboard / Voltage (not part of Prism).
 */
const GEN_COVER_CYAN = "rgb(0, 210, 255)";

/**
 * Near-black for palettes: slightly lighter than dark-theme page
 * background (`--ids__color-gray-900` ≈ rgb(18, 18, 20)).
 */
const GEN_COVER_BLACK = "rgb(26, 26, 28)";
const GEN_COVER_BLACK_NEUTRAL = `neutral:${GEN_COVER_BLACK}`;

/**
 * IdsGenCover — generative cover driven by seed-a / seed-b.
 * Content of the tag becomes a caption over the image.
 * Visual algorithm: flex strips (direction, count, shift, distortion)
 * derived deterministically from the two seeds.
 *
 * Optional attribute: `palette` (color scale).
 * Optional attribute: `grain` — `off` / `false` / `0` disables film grain (on by default).
 * Glow: soft last-strip blur (seed factor) + thick accents on two thickest strips.
 *
 * Taste constraints (see docs/GEN-COVER.md) sit on top of the basic
 * Adam algorithm — marked with TASTE below so they can be reverted.
 */
class IdsGenCover extends HTMLElement {
  static observedAttributes = ["seed-a", "seed-b", "palette", "grain"];

  /**
   * Ordered palette ids for UI.
   * Multi → split pairs → high-contrast → monochrome ramps.
   */
  static paletteIds = [
    "prism",
    "punch",
    "billboard",
    "split",
    "split-green",
    "split-yellow",
    "split-gray",
    "inkline",
    "inkline-red",
    "voltage",
    "cobalt-teal",
    "cobalt-rose",
  ];

  /**
   * Prefix `neutral:` marks non-chroma stops for taste constraints.
   */
  static palettes = {
    prism: {
      label: "Prism",
      colors: [
        GEN_COVER_BLACK,
        "--ids__color-gray-500",
        "--ids__color-blue-500",
        "--ids__color-red-500",
        "--ids__color-gray-200",
        "--ids__color-green-500",
      ],
    },

    punch: {
      label: "Punch",
      colors: [
        GEN_COVER_BLACK,
        "--ids__color-blue-500",
        "--ids__color-green-500",
        "--ids__color-gray-200",
        "--ids__color-blue-500",
        "--ids__color-green-500",
      ],
    },

    /* Yellow doubled consecutively; prism red; shared cyan */
    billboard: {
      label: "Billboard",
      colors: [
        "--ids__color-red-500",
        "rgb(255, 230, 0)",
        "rgb(255, 230, 0)",
        GEN_COVER_BLACK_NEUTRAL,
        GEN_COVER_CYAN,
        "--ids__color-red-500",
      ],
    },

    split: {
      label: "Split",
      colors: [
        "--ids__color-blue-500",
        "--ids__color-blue-500",
        "--ids__color-red-500",
        "--ids__color-red-500",
        "--ids__color-blue-500",
        "--ids__color-red-500",
      ],
    },
    "split-green": {
      label: "Split Green",
      colors: [
        "--ids__color-blue-500",
        "--ids__color-blue-500",
        "--ids__color-green-500",
        "--ids__color-green-500",
        "--ids__color-blue-500",
        "--ids__color-green-500",
      ],
    },
    "split-yellow": {
      label: "Split Yellow",
      colors: [
        "--ids__color-red-500",
        "--ids__color-red-500",
        "rgb(255, 230, 0)",
        "rgb(255, 230, 0)",
        "--ids__color-red-500",
        "rgb(255, 230, 0)",
      ],
    },
    "split-gray": {
      label: "Split Gray",
      colors: [
        GEN_COVER_BLACK_NEUTRAL,
        GEN_COVER_BLACK_NEUTRAL,
        "neutral:rgb(200, 202, 208)",
        "neutral:rgb(200, 202, 208)",
        GEN_COVER_BLACK_NEUTRAL,
        "neutral:rgb(200, 202, 208)",
      ],
    },

    inkline: {
      label: "Inkline",
      colors: [
        GEN_COVER_BLACK_NEUTRAL,
        GEN_COVER_BLACK_NEUTRAL,
        "--ids__color-blue-500",
        "neutral:rgb(200, 202, 208)",
        "neutral:rgb(200, 202, 208)",
        "--ids__color-blue-500",
      ],
    },
    "inkline-red": {
      label: "Inkline Red",
      colors: [
        GEN_COVER_BLACK_NEUTRAL,
        GEN_COVER_BLACK_NEUTRAL,
        "--ids__color-red-500",
        "neutral:rgb(200, 202, 208)",
        "neutral:rgb(200, 202, 208)",
        "--ids__color-red-500",
      ],
    },
    /* Cyan doubled consecutively; light gray instead of white */
    voltage: {
      label: "Voltage",
      colors: [
        GEN_COVER_BLACK_NEUTRAL,
        "--ids__color-red-500",
        GEN_COVER_CYAN,
        GEN_COVER_CYAN,
        "neutral:rgb(200, 202, 208)",
        "--ids__color-red-500",
      ],
    },

    /* Cobalt family: light end leans teal vs rose (monochrome ramps) */
    "cobalt-teal": {
      label: "Cobalt Teal",
      colors: [
        "rgb(6, 18, 48)",
        "rgb(10, 55, 130)",
        "rgb(20, 110, 190)",
        "rgb(40, 165, 210)",
        "rgb(90, 200, 215)",
        "rgb(180, 235, 235)",
      ],
    },
    "cobalt-rose": {
      label: "Cobalt Rose",
      colors: [
        "rgb(6, 18, 48)",
        "rgb(30, 50, 140)",
        "rgb(70, 90, 200)",
        "rgb(130, 130, 230)",
        "rgb(190, 160, 235)",
        "rgb(240, 210, 235)",
      ],
    },
  };

  static #directions = {
    h: "row",
    v: "column",
    hr: "row-reverse",
    vr: "column-reverse",
  };

  static #subDirections = {
    h: "column",
    v: "row",
    hr: "column-reverse",
    vr: "row-reverse",
  };

  static #directionCodes = ["h", "v", "hr", "vr"];

  /* Floor above 1 so strips never go fully equal (1^n ≡ 1). */
  static #MIN_DISTORTION = 1.12;
  /* TASTE: was 2.5 (Adam), then 2; capped so strips don't collapse. */
  static #MAX_DISTORTION = 1.85;
  static #HOVER_FADE_IN_MS = 100;
  static #HOVER_FADE_OUT_MS = 700;

  #image = null;
  #text = null;
  /** @type {{ el: HTMLElement, color: string, role: "last"|"strip"|"branch", index?: number, offset?: number }[]} */
  #glowTargets = [];
  /** @type {{ el: HTMLElement, index: number, isSub?: boolean }[]} */
  #flexItems = [];
  /** @type {{ el: HTMLElement, offset: number }[]} */
  #colorTargets = [];
  /** @type {{ el: HTMLElement, index: number }[]} */
  #primaryItems = [];
  #renderState = null;
  #softFactor = 1;
  #distortion = 1;
  #hovering = false;
  #colorShiftAmount = 0;
  #isHorizontal = true;
  #resizeObserver = null;
  #effectNodes = [];
  #hoverFrame = 0;

  connectedCallback() {
    if (!this.#image) {
      const text = document.createElement("div");
      text.className = "ids__gen-cover__text";
      while (this.firstChild) {
        text.appendChild(this.firstChild);
      }
      this.#text = text;

      this.#image = document.createElement("div");
      this.#image.className = "ids__gen-cover__image";
      this.#image.setAttribute("aria-hidden", "true");

      this.appendChild(this.#image);
      this.appendChild(text);

      this.addEventListener("pointerenter", () => this.#setHover(true));
      this.addEventListener("pointerleave", () => this.#setHover(false));
    }

    if (!this.#resizeObserver) {
      this.#resizeObserver = new ResizeObserver(() => this.#updateBlur());
      this.#resizeObserver.observe(this);
    }

    this.#render();
  }

  disconnectedCallback() {
    this.#teardownEffect();
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.#image || oldValue === newValue) return;
    this.#render();
  }

  /** CSS value for a palette entry: token → var(), neutral: stripped, else literal. */
  static colorValue(color) {
    if (color.startsWith("neutral:")) color = color.slice("neutral:".length);
    return color.startsWith("--") ? `var(${color})` : color;
  }

  #tokens() {
    const id = this.getAttribute("palette") || "prism";
    return (
      IdsGenCover.palettes[id]?.colors ?? IdsGenCover.palettes.prism.colors
    );
  }

  #buildColorScale() {
    const colors = [];
    const tokens = this.#tokens();
    for (let i = 0; i < tokens.length; i++) {
      const current = IdsGenCover.colorValue(tokens[i]);
      colors.push(current);
      if (i === tokens.length - 1) continue;
      const next = IdsGenCover.colorValue(tokens[i + 1]);
      colors.push(`color-mix(in srgb, ${current} 50%, ${next} 50%)`);
    }
    return colors;
  }

  #colorAt(position) {
    const colors = this.#renderState?.allColors;
    if (!colors?.length) return "transparent";

    const length = colors.length;
    const wrapped = ((position % length) + length) % length;
    const lower = Math.floor(wrapped);
    const upper = (lower + 1) % length;
    const mix = wrapped - lower;

    if (mix < 0.001) return colors[lower];
    if (mix > 0.999) return colors[upper];

    return `color-mix(in srgb, ${colors[lower]} ${((1 - mix) * 100).toFixed(2)}%, ${colors[upper]})`;
  }

  #applyColorShift(offset = 0) {
    if (!this.#renderState) return;
    const start = this.#renderState.shiftStartIndex + offset;

    for (const target of this.#colorTargets) {
      target.el.style.backgroundColor = this.#colorAt(start + target.offset);
    }

    for (const target of this.#glowTargets) {
      target.color = this.#colorAt(start + (target.offset ?? target.index ?? 0));
      if (target.role === "last") {
        this.#image.style.backgroundColor = target.color;
      }
    }

    this.#updateBlur();
  }

  #setDirection(directionCode) {
    const direction = IdsGenCover.#directions[directionCode];
    const subDirection = IdsGenCover.#subDirections[directionCode];
    if (!direction || !subDirection) return;

    this.#isHorizontal = direction === "row" || direction === "row-reverse";
    this.#image.style.flexDirection = direction;
    for (const item of this.#primaryItems) {
      item.el.style.flexDirection = subDirection;
    }
    if (this.#renderState) {
      this.#renderState.directionCode = directionCode;
    }
    requestAnimationFrame(() => this.#updateBlur());
  }

  static #isGrayToken(token) {
    return (
      token.startsWith("neutral:") ||
      token.includes("gray") ||
      token.includes("white")
    );
  }

  /**
   * TASTE: indices in the expanded scale allowed for the last (blurred) strip —
   * pure chroma tokens and chroma↔chroma mixes only (no gray, no gray↔color).
   */
  #chromaticLastIndices() {
    const tokens = this.#tokens();
    const allowed = [];
    for (let i = 0; i < tokens.length; i++) {
      if (!IdsGenCover.#isGrayToken(tokens[i])) {
        allowed.push(i * 2);
      }
      if (i < tokens.length - 1) {
        if (
          !IdsGenCover.#isGrayToken(tokens[i]) &&
          !IdsGenCover.#isGrayToken(tokens[i + 1])
        ) {
          allowed.push(i * 2 + 1);
        }
      }
    }
    return allowed;
  }

  #stripSize(el) {
    return this.#isHorizontal ? el.offsetWidth : el.offsetHeight;
  }

  #shadow(radius, color) {
    const r = Math.max(0, Math.round(radius));
    return `0 0 ${r}px ${r}px ${color}`;
  }

  #applyFlex(distortion, { animate }) {
    const duration = animate
      ? "var(--ids__duration-base)"
      : "var(--ids__duration-instant)";
    const easing = "var(--ids__easing-base)";
    for (const item of this.#flexItems) {
      item.el.style.transition = `flex-grow ${duration} ${easing}`;
      item.el.style.flexGrow = String(distortion ** item.index);
    }
  }

  #setHover(on) {
    if (this.#hovering === on) return;
    this.#hovering = on;
    this.#animateHoverShift(
      on ? 1 : 0,
      on ? IdsGenCover.#HOVER_FADE_IN_MS : IdsGenCover.#HOVER_FADE_OUT_MS,
    );
  }

  #animateHoverShift(target, duration) {
    if (this.#hoverFrame) {
      cancelAnimationFrame(this.#hoverFrame);
      this.#hoverFrame = 0;
    }
    const from = this.#colorShiftAmount;
    if (Math.abs(from - target) < 0.001) {
      this.#colorShiftAmount = target;
      this.#applyColorShift(target);
      return;
    }
    const started = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - started) / duration);
      const smooth = t * t * (3 - 2 * t);
      this.#colorShiftAmount = from + (target - from) * smooth;
      this.#applyColorShift(this.#colorShiftAmount);
      if (t < 1) {
        this.#hoverFrame = requestAnimationFrame(tick);
      } else {
        this.#hoverFrame = 0;
        this.#colorShiftAmount = target;
        this.#applyColorShift(target);
      }
    };
    this.#hoverFrame = requestAnimationFrame(tick);
  }

  #updateBlur() {
    for (const target of this.#glowTargets) {
      target.el.style.boxShadow = "";
    }
    if (!this.#glowTargets.length) return;

    const last = this.#glowTargets.find((t) => t.role === "last");
    const strips = this.#glowTargets.filter((t) => t.role === "strip");

    if (last) {
      const size = this.#stripSize(last.el);
      last.el.style.boxShadow = this.#shadow(
        size * 0.8 * this.#softFactor,
        last.color,
      );
    }

    /* Thick accents: two thickest non-last strips; earlier = tiny, later = larger */
    const ranked = strips
      .map((t) => ({ ...t, size: this.#stripSize(t.el) }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 2)
      .sort((a, b) => a.index - b.index);
    if (ranked[0]) {
      ranked[0].el.style.boxShadow = this.#shadow(
        ranked[0].size * 0.08,
        ranked[0].color,
      );
    }
    if (ranked[1]) {
      ranked[1].el.style.boxShadow = this.#shadow(
        ranked[1].size * 0.18,
        ranked[1].color,
      );
    }
  }

  #trackEffectNode(node) {
    this.#effectNodes.push(node);
    return node;
  }

  #addOverlay(className) {
    const overlay = document.createElement("div");
    overlay.className = `ids__gen-cover__fx ${className}`;
    overlay.setAttribute("aria-hidden", "true");
    this.insertBefore(overlay, this.#text);
    return this.#trackEffectNode(overlay);
  }

  #teardownEffect({ restore = true } = {}) {
    if (this.#hoverFrame) {
      cancelAnimationFrame(this.#hoverFrame);
      this.#hoverFrame = 0;
    }

    for (const node of this.#effectNodes.splice(0)) {
      node.remove();
    }

    if (restore && this.#renderState) {
      this.#applyColorShift(this.#colorShiftAmount);
      this.#applyFlex(this.#distortion, { animate: true });
    }
  }

  #applyEffect() {
    if (!this.#renderState) return;
    this.#applyGrainEffect();
  }

  #applyGrainEffect() {
    const grain = this.getAttribute("grain");
    if (grain === "off" || grain === "false" || grain === "0") return;

    const overlay = this.#addOverlay("ids__gen-cover__fx--grain");
    const size = 1;
    const contrast = 3;
    const tile = Math.round(140 * size);
    overlay.style.backgroundSize = `${tile}px ${tile}px`;
    overlay.style.opacity = String(Math.min(0.85, 0.08 + contrast * 0.22));
    overlay.style.filter = `contrast(${(0.85 + contrast * 0.75).toFixed(2)})`;
    overlay.style.mixBlendMode = "overlay";
  }

  #render() {
    this.#teardownEffect({ restore: false });
    this.#colorShiftAmount = 0;
    this.#hovering = false;

    const a = parseInt(this.getAttribute("seed-a"), 10) || 0;
    const b = parseInt(this.getAttribute("seed-b"), 10) || 0;
    const seedCombo = (a + 1) * 9973 + (b + 1);
    const random = mulberry32(seedCombo);
    /* Soft factor for last-strip blur — separate PRNG, does not shift layout */
    this.#softFactor = 0.5 + mulberry32(seedCombo + 0x9e3779b9)() * 0.7;

    const directionCode =
      IdsGenCover.#directionCodes[
        Math.floor(random() * IdsGenCover.#directionCodes.length)
      ];

    /* TASTE: 5…8 (basic was 4…8 / originally ≥2). */
    const primaryCount = 5 + Math.floor(random() * 4);

    const allColors = this.#buildColorScale();
    const chromaLast = this.#chromaticLastIndices();

    /*
     * TASTE: force the last (blurred) strip onto a chromatic scale slot.
     * Basic revert:
     *   const shiftStartIndex = Math.floor(random() * allColors.length);
     */
    const lastIndex = chromaLast.length
      ? chromaLast[Math.floor(random() * chromaLast.length)]
      : Math.floor(random() * allColors.length);
    const shiftStartIndex =
      (lastIndex - (primaryCount - 1) + allColors.length * 8) %
      allColors.length;

    const distortionRaw = random();
    this.#distortion =
      IdsGenCover.#MIN_DISTORTION +
      distortionRaw * (IdsGenCover.#MAX_DISTORTION - IdsGenCover.#MIN_DISTORTION);
    const distortion = this.#distortion;
    const secondaryCount = Math.max(Math.round(primaryCount / 2), 2);

    const direction = IdsGenCover.#directions[directionCode];
    const subDirection = IdsGenCover.#subDirections[directionCode];

    this.#glowTargets = [];
    this.#flexItems = [];
    this.#colorTargets = [];
    this.#primaryItems = [];
    this.#renderState = {
      seedA: a,
      seedB: b,
      seedCombo,
      directionCode,
      primaryCount,
      secondaryCount,
      allColors,
      shiftStartIndex,
    };

    this.#image.replaceChildren();
    this.#image.style.backgroundColor = "";
    this.#setDirection(directionCode);

    for (let itemIndex = 0; itemIndex < primaryCount; itemIndex++) {
      const item = document.createElement("div");
      item.className = "ids__gen-cover__item";

      const colorIndex = (shiftStartIndex + itemIndex) % allColors.length;
      const color = allColors[colorIndex];
      item.style.flexGrow = String(distortion ** itemIndex);
      item.style.flexShrink = "1";
      item.style.flexBasis = "0";
      item.style.flexDirection = subDirection;

      this.#image.append(item);
      this.#primaryItems.push({ el: item, index: itemIndex });
      this.#flexItems.push({ el: item, index: itemIndex });
      this.#colorTargets.push({ el: item, offset: itemIndex });

      if (itemIndex === primaryCount - 2) {
        this.#glowTargets.push({
          el: item,
          color,
          role: "branch",
          index: itemIndex,
          offset: itemIndex,
        });
        for (let subItemIndex = 0; subItemIndex < secondaryCount; subItemIndex++) {
          const subItem = document.createElement("div");
          subItem.className = "ids__gen-cover__sub-item";

          const subColorIndex = (colorIndex + subItemIndex) % allColors.length;
          subItem.style.backgroundColor = allColors[subColorIndex];
          subItem.style.flexGrow = String(distortion ** subItemIndex);
          subItem.style.flexShrink = "1";
          subItem.style.flexBasis = "0";

          if (
            colorIndex + 1 === subColorIndex ||
            colorIndex - 1 === subColorIndex
          ) {
            subItem.style.filter = "brightness(0.85)";
          }

          item.append(subItem);
          this.#flexItems.push({
            el: subItem,
            index: subItemIndex,
            isSub: true,
          });
          this.#colorTargets.push({
            el: subItem,
            offset: itemIndex + subItemIndex,
          });
        }
        continue;
      }

      if (itemIndex === primaryCount - 1) {
        item.classList.add("ids__gen-cover__item--last");
        this.#image.style.backgroundColor = color;
        this.#glowTargets.push({
          el: item,
          color,
          role: "last",
          index: itemIndex,
          offset: itemIndex,
        });
      } else {
        this.#glowTargets.push({
          el: item,
          color,
          role: "strip",
          index: itemIndex,
          offset: itemIndex,
        });
      }

      item.style.backgroundColor = color;
    }

    this.#applyColorShift(0);
    this.#applyEffect();
    requestAnimationFrame(() => this.#updateBlur());
  }
}

window.customElements.define("ids-gen-cover", IdsGenCover);
