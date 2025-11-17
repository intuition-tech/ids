let observer = new IntersectionObserver(
  (elements) => {
    elements.forEach((el) => {
      if (el.intersectionRatio > 0.3) {
        el.target.classList.remove("is-sleeping");
      } else {
        el.target.classList.add("is-sleeping");
      }
    });
  },
  { threshold: [0, 0.5] }
);

document.querySelectorAll(".ids__sleepy").forEach((el) => {
  observer.observe(el);
});
