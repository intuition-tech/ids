/**
 * @param {HTMLDivElement} node
 */
const photoSwipeSize = (node) => {
  // get image tag inside of node
  if (node.hasAttribute("data-pswp-width") && node.hasAttribute("data-pswp-height")) {
    return;
  }
  /** @type {HTMLImageElement | null} */
  const img = node.querySelector("img");
  if (!img) {
    return;
  }
  let i = new Image();
  i.onload = () => {
    node.setAttribute("data-pswp-width", i.width.toString());
    node.setAttribute("data-pswp-height", i.height.toString());
  };
  i.src = img.src;
};

class IdsGallery extends HTMLElement {
  constructor() {
    super();
    this.classList.add("ids__gallery");
  }

  connectedCallback() {
    this.lightbox = new PhotoSwipeLightbox({
      gallery: this,
      children: "a",
      pswpModule: PhotoSwipe,
      padding: { top: 20, bottom: 40, left: 100, right: 100 },
    });

    this.lightbox.on("uiRegister", () => {
      if (!this.getAttribute("zoom") && this.lightbox?.pswp?.ui?.uiElementsData?.length) {
        this.lightbox.pswp.ui.uiElementsData = this.lightbox.pswp.ui.uiElementsData.filter((el) => el.name !== "zoom");
      }

      this.lightbox.pswp.ui.registerElement({
        name: "caption",
        appendTo: "root",
        onInit: (el, pswp) => {
          pswp.on("change", () => {
            const figcaption = pswp.currSlide.data.element?.closest("figure")?.querySelector("figcaption")?.cloneNode(true);

            el.innerHTML = "";
            if (figcaption) {
              el.appendChild(figcaption);
            }
          });
        },
      });
    });

    this.lightbox.init();

    this.querySelectorAll("a").forEach(photoSwipeSize);
  }

  disconnectedCallback() {
    this.lightbox.destroy();
  }
}

window.customElements.define("ids-gallery", IdsGallery);
