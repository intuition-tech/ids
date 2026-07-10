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
 * IdsGenCover - Deterministic generative cover driven by two numbers
 * in the seed-a and seed-b attributes. Content of the tag becomes
 * a caption over the image.
 */
class IdsGenCover extends HTMLElement {
  static observedAttributes = ["seed-a", "seed-b"];

  /* Backgrounds are the darker palette colors so the white caption stays readable */
  static #backgrounds = [
    "--ids__color-red-500",
    "--ids__color-blue-500",
    "--ids__color-green-600",
    "--ids__color-gray-800",
  ];

  static #shapeColors = [
    "--ids__color-white",
    "--ids__color-yellow-500",
    "--ids__color-red-500",
    "--ids__color-blue-500",
    "--ids__color-green-500",
    "--ids__color-gray-950",
  ];

  #image = null;

  connectedCallback() {
    if (!this.#image) {
      const text = document.createElement("div");
      text.className = "ids__gen-cover__text";
      while (this.firstChild) {
        text.appendChild(this.firstChild);
      }

      this.#image = document.createElement("div");
      this.#image.className = "ids__gen-cover__image";
      this.#image.setAttribute("aria-hidden", "true");

      this.appendChild(this.#image);
      this.appendChild(text);
    }
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#image) {
      this.#render();
    }
  }

  #render() {
    const a = parseInt(this.getAttribute("seed-a"), 10) || 0;
    const b = parseInt(this.getAttribute("seed-b"), 10) || 0;
    const random = mulberry32((a + 1) * 9973 + (b + 1));

    const pick = (list) => list[Math.floor(random() * list.length)];

    const background = pick(IdsGenCover.#backgrounds);
    const colors = IdsGenCover.#shapeColors.filter((c) => c !== background);

    const shapes = [];
    const count = 4 + Math.floor(random() * 3);
    for (let i = 0; i < count; i++) {
      const size = 2 + Math.floor(random() * 3);
      const x = Math.floor(random() * (16 - size + 1));
      const y = Math.floor(random() * (9 - size + 1));
      const fill = `var(${pick(colors)})`;

      switch (Math.floor(random() * 4)) {
        case 0:
          shapes.push(
            `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${fill}"/>`,
          );
          break;
        case 1:
          shapes.push(
            `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}"/>`,
          );
          break;
        case 2:
          shapes.push(
            `<path d="M ${x} ${y + size} a ${size / 2} ${size / 2} 0 0 1 ${size} 0 z" fill="${fill}"/>`,
          );
          break;
        default:
          shapes.push(
            `<polygon points="${x},${y + size} ${x + size},${y + size} ${x + size / 2},${y}" fill="${fill}"/>`,
          );
      }
    }

    this.#image.innerHTML = `<svg viewBox="0 0 16 9" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="16" height="9" fill="var(${background})"/>${shapes.join("")}</svg>`;
  }
}

window.customElements.define("ids-gen-cover", IdsGenCover);
