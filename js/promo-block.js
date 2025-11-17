const promoBlocks = document.querySelectorAll(".ids__promo-block");
for (const block of promoBlocks) {
    const imgs = Array.from(block.children).filter(el => el.tagName === "IMG");
    const counter = block.querySelector(":scope > .ids__promo-block__pos");
    if (counter) {
        counter.dataset.index = 1;
        counter.dataset.count = imgs.length;
    }

    block.addEventListener("pointermove", function (event) {
      const target = event.target.closest(".ids__promo-block");
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
      }
    }, true)
}

