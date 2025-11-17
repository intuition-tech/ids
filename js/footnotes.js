/**
 * Get footnote display number
 *
 * @param {number} index - Zero-based footnote index
 * @returns {string} Number starting from 1
 */
function getFootnoteSymbol(index) {
  return (index + 1).toString();
}

/**
 * FootnoteStore - Singleton state management for footnotes
 */
class FootnoteStoreClass {
  #linkRegistry = [];
  #noteRegistry = [];
  #currentIndex = null;
  #subscribers = new Set();

  // Link registry methods
  registerLink(element) {
    this.#linkRegistry.push(element);
    this.#notify();
  }

  unregisterLink(element) {
    const index = this.#linkRegistry.indexOf(element);
    if (index > -1) {
      this.#linkRegistry.splice(index, 1);
      // Close if this was the active footnote
      if (this.#currentIndex === index) {
        this.#currentIndex = null;
      } else if (this.#currentIndex > index) {
        // Adjust current index if it shifted
        this.#currentIndex--;
      }
      this.#notify();
    }
  }

  getLinkIndex(element) {
    return this.#linkRegistry.indexOf(element);
  }

  // Note registry methods
  registerNote(element) {
    this.#noteRegistry.push(element);
    this.#notify();
  }

  unregisterNote(element) {
    const index = this.#noteRegistry.indexOf(element);
    if (index > -1) {
      this.#noteRegistry.splice(index, 1);
      this.#notify();
    }
  }

  getNoteIndex(element) {
    return this.#noteRegistry.indexOf(element);
  }

  // Current index getter/setter
  get currentIndex() {
    return this.#currentIndex;
  }

  set currentIndex(value) {
    if (this.#currentIndex !== value) {
      this.#currentIndex = value;
      this.#notify();
    }
  }

  // Public registry access (read-only)
  get linkRegistry() {
    return [...this.#linkRegistry];
  }

  get noteRegistry() {
    return [...this.#noteRegistry];
  }

  // Subscription methods
  subscribe(callback) {
    this.#subscribers.add(callback);
  }

  unsubscribe(callback) {
    this.#subscribers.delete(callback);
  }

  #notify() {
    this.#subscribers.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("FootnoteStore subscriber error:", error);
      }
    });
  }
}

// Export singleton instance
const FootnoteStore = new FootnoteStoreClass();

/**
 * IdsFootnoteLink - Clickable footnote trigger with auto-numbered badge
 */
class IdsFootnoteLink extends HTMLElement {
  #button = null;
  #label = null;

  connectedCallback() {
    // Create DOM structure
    this.#label = document.createElement("label");
    this.#button = document.createElement("button");
    this.#button.className = "ids-footnote-link__button";

    // Move existing content to label (before button)
    while (this.firstChild) {
      this.#label.appendChild(this.firstChild);
    }

    this.#label.appendChild(this.#button);
    this.appendChild(this.#label);

    // Register in store
    FootnoteStore.registerLink(this);

    // Setup click handler
    this.#button.addEventListener("click", this.#handleClick);

    // Subscribe to store updates
    FootnoteStore.subscribe(this.#update);

    this.#update();
  }

  disconnectedCallback() {
    FootnoteStore.unregisterLink(this);
    FootnoteStore.unsubscribe(this.#update);
    this.#button?.removeEventListener("click", this.#handleClick);
  }

  #handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.toggle();
  };

  #update = () => {
    const index = FootnoteStore.getLinkIndex(this);
    const isOpen = FootnoteStore.currentIndex === index;
    const symbol = getFootnoteSymbol(index);

    this.#button.textContent = symbol;
    this.#button.setAttribute("aria-expanded", isOpen);
    this.#button.setAttribute("aria-controls", `ids-footnote-${index}`);
    this.#button.classList.toggle("open", isOpen);
    this.#button.classList.toggle("enlarge", index >= 10);
  };

  get index() {
    return FootnoteStore.getLinkIndex(this);
  }

  get symbol() {
    return getFootnoteSymbol(this.index);
  }

  get isOpen() {
    return FootnoteStore.currentIndex === this.index;
  }

  toggle() {
    const index = this.index;
    FootnoteStore.currentIndex =
      FootnoteStore.currentIndex === index ? null : index;
    this.dispatchEvent(
      new CustomEvent("ids-footnote-toggle", {
        detail: { index, open: this.isOpen },
        bubbles: true,
      }),
    );
  }

  open() {
    FootnoteStore.currentIndex = this.index;
  }

  close() {
    if (this.isOpen) {
      FootnoteStore.currentIndex = null;
    }
  }
}

/**
 * IdsFootnote - Popup container that displays footnote content
 */
class IdsFootnote extends HTMLElement {
  #wrapper = null;
  #aside = null;
  #closeButton = null;
  #resizeObserver = null;

  connectedCallback() {
    // Create wrapper
    this.#wrapper = document.createElement("div");
    this.#wrapper.className = "ids-footnote-wrap";

    // Move existing content to wrapper for later use
    while (this.firstChild) {
      this.#wrapper.appendChild(this.firstChild);
    }

    this.appendChild(this.#wrapper);

    // Register in store
    FootnoteStore.registerNote(this.#wrapper);

    // Subscribe to store updates
    FootnoteStore.subscribe(this.#update);

    this.#update();
  }

  disconnectedCallback() {
    FootnoteStore.unregisterNote(this.#wrapper);
    FootnoteStore.unsubscribe(this.#update);
    this.#cleanup();
  }

  #update = () => {
    const index = FootnoteStore.getNoteIndex(this.#wrapper);
    const isOpen = FootnoteStore.currentIndex === index;

    if (isOpen && !this.#aside) {
      this.#render(index);
      // Defer position calculation to next frame to ensure layout is complete
      requestAnimationFrame(() => {
        if (this.#aside) {
          this.#updatePosition(index);
          this.#checkScrollability();
        }
      });
    } else if (!isOpen && this.#aside) {
      this.#cleanup();
    } else if (isOpen) {
      // Update position for already rendered footnote
      this.#updatePosition(index);
      this.#checkScrollability();
    }
  };

  #render(index) {
    // Save current scroll position to prevent unwanted scroll
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Create aside
    this.#aside = document.createElement("aside");
    this.#aside.className = "ids-footnote";
    this.#aside.id = `ids-footnote-${index}`;
    this.#aside.setAttribute("role", "dialog");
    this.#aside.setAttribute(
      "aria-labelledby",
      `ids-footnote-label-${index}`,
    );

    // Move content from wrapper to aside (but keep wrapper's original children)
    const tempContent = [];
    this.#wrapper.childNodes.forEach((node) => {
      if (node !== this.#aside) {
        tempContent.push(node.cloneNode(true));
      }
    });

    tempContent.forEach((node) => this.#aside.appendChild(node));

    // Create close button (hidden by default, shown if scrollable)
    this.#closeButton = this.#createCloseButton();
    this.#aside.appendChild(this.#closeButton);

    this.#wrapper.appendChild(this.#aside);

    // Restore scroll position if it changed
    window.scrollTo(scrollX, scrollY);

    // Add first paragraph badge
    this.#addFirstParagraphBadge(index);

    // Setup event listeners
    this.#setupEventListeners();

    // Setup resize observer for scrollability
    this.#resizeObserver = new ResizeObserver(() =>
      this.#checkScrollability(),
    );
    this.#resizeObserver.observe(this.#aside);
  }

  #cleanup() {
    if (this.#aside) {
      this.#removeEventListeners();
      this.#resizeObserver?.disconnect();
      this.#aside.remove();
      this.#aside = null;
      this.#closeButton = null;
      document.documentElement.style.removeProperty("overflow");
    }
  }

  #updatePosition(index) {
    const linkElement = FootnoteStore.linkRegistry[index];
    if (!linkElement || !this.#wrapper) return;

    // Reset position first to get accurate measurements
    this.#wrapper.style.setProperty("--top", "0px");

    // Force reflow to ensure accurate measurements
    void this.#wrapper.offsetHeight;

    const linkRect = linkElement.getBoundingClientRect();
    const wrapperRect = this.#wrapper.getBoundingClientRect();
    const offsetTop = `${linkRect.top - wrapperRect.top}px`;

    this.#wrapper.style.setProperty("--top", offsetTop);
  }

  #checkScrollability() {
    if (!this.#aside) return;

    this.#aside.classList.toggle(
      "scrollable",
      this.#aside.scrollHeight > this.#aside.clientHeight,
    );

    // Lock body scroll if scrollable
    if (this.isScrollable) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.removeProperty("overflow");
    }
  }

  #addFirstParagraphBadge(index) {
    const firstP = this.#aside.querySelector("p:first-child");
    if (firstP) {
      firstP.setAttribute("data-index", getFootnoteSymbol(index));
    }

    // Add enlarge-number class if index >= 10
    if (index >= 10) {
      this.#aside.classList.add("enlarge-number");
    }
  }

  #setupEventListeners() {
    document.addEventListener("click", this.#handleOutsideClick, true);
    document.addEventListener("keyup", this.#handleEscape);
    this.#closeButton.addEventListener("click", this.#handleCloseClick);
  }

  #removeEventListeners() {
    document.removeEventListener("click", this.#handleOutsideClick, true);
    document.removeEventListener("keyup", this.#handleEscape);
    this.#closeButton?.removeEventListener(
      "click",
      this.#handleCloseClick,
    );
  }

  #handleOutsideClick = (e) => {
    const targetNode = e.target;

    // Don't close if clicking inside this footnote
    if (this.#aside.contains(targetNode)) {
      return;
    }

    // Don't close if clicking on any footnote link
    const clickedLink = FootnoteStore.linkRegistry.some((link) =>
      link.contains(targetNode),
    );
    if (clickedLink) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    this.close();
  };

  #handleEscape = (e) => {
    if (e.key === "Escape") {
      this.close();
    }
  };

  #handleCloseClick = () => {
    this.close();
  };

  #createCloseButton() {
    const button = document.createElement("button");
    button.className = "ids-footnote__close";

    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    svg.setAttribute("viewBox", "0 0 20 20");

    const line1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    line1.setAttribute("x1", "0");
    line1.setAttribute("y1", "20");
    line1.setAttribute("x2", "20");
    line1.setAttribute("y2", "0");

    const line2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    line2.setAttribute("x1", "0");
    line2.setAttribute("y1", "0");
    line2.setAttribute("x2", "20");
    line2.setAttribute("y2", "20");

    svg.appendChild(line1);
    svg.appendChild(line2);

    const span = document.createElement("span");
    span.textContent = "Закрыть";

    button.appendChild(svg);
    button.appendChild(span);

    return button;
  }

  get index() {
    return FootnoteStore.getNoteIndex(this.#wrapper);
  }

  get isOpen() {
    return FootnoteStore.currentIndex === this.index;
  }

  get isScrollable() {
    if (!this.#aside) return false;
    return this.#aside.scrollHeight > this.#aside.clientHeight;
  }

  get offsetTop() {
    return this.#wrapper?.style.getPropertyValue("--top") || "";
  }

  close() {
    if (this.isOpen) {
      FootnoteStore.currentIndex = null;
      this.dispatchEvent(
        new CustomEvent("ids-footnote-close", {
          detail: { index: this.index },
          bubbles: true,
        }),
      );
    }
  }
}

// Register custom elements
window.customElements.define("ids-footnote-link", IdsFootnoteLink);
window.customElements.define("ids-footnote", IdsFootnote);

