(function () {
  const KEY = "ids-theme";
  const root = document.documentElement;
  const buttons = document.querySelectorAll(".ids__theme-toggle");
  if (!buttons.length) return;

  function updateToggles() {
    const isDark = root.classList.contains("dark");
    buttons.forEach((btn) => {
      btn.setAttribute("aria-checked", isDark ? "true" : "false");
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isDark = root.classList.toggle("dark");
      localStorage.setItem(KEY, isDark ? "dark" : "light");
      updateToggles();
    });
  });

  updateToggles();
})();
