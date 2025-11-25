const promoBlocks = document.querySelectorAll(".ids__inline-gallery");
for (const block of promoBlocks) {
    const imgs = Array.from(block.children).filter(el => el.tagName === "IMG");

    const counter = block.querySelector(":scope > .ids__inline-gallery__pos");
    if (counter) {
        counter.dataset.index = 1;
        counter.dataset.count = imgs.length;
    }

    const dots = block.querySelector(":scope > .ids__inline-gallery__dots");
    if (dots) {
      for (let i = 0; i < imgs.length; i += 1) {
        const dot = document.createElement("span");
        dot.className = "ids__inline-gallery__dot";
        if (i === 0) {
          dot.classList.add("ids__inline-gallery__dot-active");
        } else {
          dot.style.order = String(i);
        }
        dots.appendChild(dot);
      }
    }

    const dashes = block.querySelector(":scope > .ids__inline-gallery__dashes");
    if (dashes) {
      for (let i = 0; i < imgs.length; i += 1) {
        const dash = document.createElement("span");
        dash.className = "ids__inline-gallery__dash";
        if (i === 0) {
          dash.classList.add("ids__inline-gallery__dash-active");
        }
        dashes.appendChild(dash);
      }
    }

    block.addEventListener("pointermove", function (event) {
      const target = event.target.closest(".ids__inline-gallery");
      if (target === block) {
        const x = Math.max(0, Math.min(1, event.offsetX / target.clientWidth));

        const index = Math.trunc(x * imgs.length);

        target.style.setProperty("--x", x);
        target.style.setProperty("--index", Math.min(index + 1, imgs.length));
        target.style.setProperty("--count", imgs.length);

        const activeChild = imgs[index];
        if (activeChild !== undefined && activeChild.tagName === "IMG") {
          for (const img of imgs) {
              img.style.visibility = "hidden";
          }
          activeChild.style.visibility = "visible";
        }

        if (counter) {
            counter.dataset.index = Math.min(index + 1, imgs.length);
            counter.dataset.count = imgs.length;
        }

        if (dashes) {
          for (let i = 0; i < dashes.children.length; i += 1) {
            const dash = dashes.children[i];
            if (i === index) {
              dash.classList.add("ids__inline-gallery__dash-active");
            } else {
              dash.classList.remove("ids__inline-gallery__dash-active");
            }
          }
        }
      }
    }, true)
}

