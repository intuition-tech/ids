const promoBlocks = document.querySelectorAll(".ids__promo-block");
for (const block of promoBlocks) {
block.addEventListener("pointermove", function (event) {
  const target = event.target.closest(".ids__promo-block");
  if (target) {
    const x = Math.max(0, Math.min(1, event.offsetX / target.clientWidth))
    target.style.setProperty("--x", x)

    const imgs = Array.from(target.children).filter(el => el.tagName === "IMG")

    const index = Math.trunc(x * imgs.length)
    const activeChild = imgs[index];
    if (activeChild !== undefined && activeChild.tagName === "IMG") {
      for (const img of imgs) {
          img.style.visibility = "hidden"
      }
      activeChild.style.visibility = "visible"
    }
  }
}, true)
}

