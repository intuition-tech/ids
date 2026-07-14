/**
 * Demo controls for ids-gen-cover: per-cover table (seeds, width em, aspect),
 * palette + randomize-all below, flex-wrap gallery.
 *
 * Markup: [data-gen-cover-demo] with [data-gen-cover-palette],
 * [data-gen-cover-frames], [data-gen-cover-randomize-all],
 * [data-gen-cover-grain], [data-gen-cover-rounded];
 * gallery [data-gen-cover-gallery] nearby.
 */
(function () {
  const SEED_MAX = 99;
  const ASPECTS = [
    ["16/9", 16 / 9],
    ["4/3", 4 / 3],
    ["1/1", 1],
    ["3/4", 3 / 4],
    ["21/9", 21 / 9],
  ];
  const ASPECT_MIN = 0.5;
  const ASPECT_MAX = 2.5;
  const WIDTH_MIN = 8;
  const WIDTH_MAX = 48;
  const WIDTH_DEFAULT = 28;
  const ASPECT_DEFAULT = 16 / 9;
  /** Default gallery layout matching the demo reference. */
  const DEFAULT_LAYOUTS = [
    { widthEm: 31, aspect: 21 / 9 },
    { widthEm: 14, aspect: 4 / 3 },
    { widthEm: 12, aspect: 0.81 },
    { widthEm: 33, aspect: 16 / 9 },
  ];

  function randomSeed() {
    return Math.floor(Math.random() * (SEED_MAX + 1));
  }

  function formatAspect(value) {
    return Number(value).toFixed(2);
  }

  function formatWidth(value) {
    return String(Math.round(Number(value)));
  }

  /** Aspect slider is inverted: left = wide, right = tall. */
  function aspectToSlider(aspect) {
    return ASPECT_MAX + ASPECT_MIN - aspect;
  }

  function sliderToAspect(slider) {
    return ASPECT_MAX + ASPECT_MIN - slider;
  }

  function syncRangeProgress(input) {
    const min = Number(input.min);
    const max = Number(input.max);
    const val = Number(input.value);
    const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
    input.style.setProperty(
      "--ids__gen-cover-demo-range-progress",
      `${pct}%`,
    );
  }

  function nearestPreset(ratio) {
    let best = null;
    let bestDelta = Infinity;
    for (const [, value] of ASPECTS) {
      const delta = Math.abs(value - ratio);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = value;
      }
    }
    return bestDelta < 0.02 ? best : null;
  }

  function swatchRow(colors) {
    const Cover = customElements.get("ids-gen-cover");
    const row = document.createElement("span");
    row.className = "ids__gen-cover-demo__swatches";
    row.setAttribute("aria-hidden", "true");
    for (const color of colors) {
      const swatch = document.createElement("span");
      swatch.className = "ids__gen-cover-demo__swatch";
      swatch.style.background = Cover.colorValue(color);
      row.append(swatch);
    }
    return row;
  }

  function wirePalettePicker(root, getCovers, initialCover) {
    const host = root.querySelector("[data-gen-cover-palette]");
    if (!host || !window.customElements.get("ids-gen-cover")) return;
    const Cover = customElements.get("ids-gen-cover");
    if (!Cover?.palettes) return;

    const ids = Cover.paletteIds;
    let current =
      initialCover.getAttribute("palette") ||
      ids[ids.length - 1] ||
      "prism";

    host.replaceChildren();
    host.classList.add("ids__gen-cover-demo__palette");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "ids__gen-cover-demo__palette-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const list = document.createElement("ul");
    list.className = "ids__gen-cover-demo__palette-list";
    list.setAttribute("role", "listbox");
    list.hidden = true;

    function paletteOptionContent(palette) {
      const wrap = document.createElement("span");
      wrap.className = "ids__gen-cover-demo__palette-option";
      wrap.append(swatchRow(palette.colors));
      return wrap;
    }

    function setTrigger(id) {
      const palette = Cover.palettes[id] ?? Cover.palettes.prism;
      trigger.replaceChildren(paletteOptionContent(palette));
      trigger.setAttribute("aria-label", `Palette: ${palette.label}`);
    }

    function syncSelected(id) {
      for (const option of list.querySelectorAll("[role='option']")) {
        option.setAttribute(
          "aria-selected",
          option.dataset.palette === id ? "true" : "false",
        );
      }
    }

    function applyPalette(id, { close = true } = {}) {
      current = id;
      for (const cover of getCovers()) {
        cover.setAttribute("palette", id);
      }
      setTrigger(id);
      syncSelected(id);
      if (close) {
        list.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    }

    function stepPalette(delta) {
      const index = Math.max(0, ids.indexOf(current));
      const next = ids[(index + delta + ids.length) % ids.length];
      applyPalette(next, { close: list.hidden });
      const selected = list.querySelector(`[data-palette="${next}"]`);
      selected?.scrollIntoView({ block: "nearest" });
    }

    for (const id of ids) {
      const palette = Cover.palettes[id];
      const option = document.createElement("li");
      option.setAttribute("role", "option");
      option.dataset.palette = id;
      option.setAttribute(
        "aria-selected",
        id === current ? "true" : "false",
      );
      option.setAttribute("aria-label", palette.label);
      option.append(paletteOptionContent(palette));
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        applyPalette(id);
        trigger.focus();
      });
      list.append(option);
    }

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = list.hidden;
      list.hidden = !open;
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        stepPalette(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        stepPalette(-1);
      } else if (event.key === "Escape") {
        list.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", () => {
      list.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    });

    host.append(trigger, list);
    setTrigger(current);
    if (!initialCover.hasAttribute("palette")) {
      applyPalette(current, { close: true });
    }
  }

  function ensureGallery(cover) {
    let gallery = document.querySelector("[data-gen-cover-gallery]");
    if (!gallery) {
      gallery = document.createElement("div");
      gallery.dataset.genCoverGallery = "";
      const stage = cover.closest("[data-gen-cover-stage]");
      if (stage) {
        stage.replaceWith(gallery);
      } else {
        cover.before(gallery);
      }
    }
    gallery.classList.add("ids__gen-cover-gallery");
    if (cover.parentElement !== gallery) {
      gallery.append(cover);
    }
    document.querySelector("[data-gen-cover-grid]")?.remove();
    return gallery;
  }

  function createAspectSelect(selected) {
    const aspect = document.createElement("select");
    aspect.className = "ids__gen-cover-demo__aspect-select";
    aspect.setAttribute("aria-label", "Aspect ratio preset");
    const customOption = document.createElement("option");
    customOption.value = "";
    customOption.textContent = "Custom";
    aspect.append(customOption);
    for (const [label, value] of ASPECTS) {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = label;
      aspect.append(option);
    }
    const preset = nearestPreset(selected);
    aspect.value = preset == null ? "" : String(preset);
    return aspect;
  }

  function wireGalleryControls(root, gallery, firstCover) {
    const host =
      root.querySelector("[data-gen-cover-frames]") ||
      root.querySelector("[data-gen-cover-frame]");
    if (!host) return { getCovers: () => [firstCover], randomizeAll() {}, setGrain() {}, setRounded() {} };

    host.replaceChildren();
    host.classList.add("ids__gen-cover-demo__frames");
    host.dataset.genCoverFrames = "";

    const table = document.createElement("table");
    table.className = "ids__gen-cover-demo__table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const label of ["Seeds", "Width", "Aspect", ""]) {
      const th = document.createElement("th");
      th.textContent = label;
      if (!label) th.className = "ids__gen-cover-demo__table-actions";
      headRow.append(th);
    }
    thead.append(headRow);

    const tbody = document.createElement("tbody");
    table.append(thead, tbody);
    host.append(table);

    /** @type {{ cover: HTMLElement, widthEm: number, aspect: number, row: HTMLTableRowElement, inputA: HTMLInputElement, inputB: HTMLInputElement }[]} */
    const items = [];

    const addRow = document.createElement("tr");
    addRow.className = "ids__gen-cover-demo__table-add";
    const addCell = document.createElement("td");
    addCell.colSpan = 4;
    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "ids__gen-cover-demo__frame-btn";
    plus.setAttribute("aria-label", "Add cover");
    plus.textContent = "+";
    addCell.append(plus);
    addRow.append(addCell);
    tbody.append(addRow);

    function applyItemLayout(item) {
      item.cover.style.width = `${item.widthEm}em`;
      item.cover.style.maxWidth = "100%";
      item.cover.style.aspectRatio = String(item.aspect);
      item.cover.style.marginBottom = "0";
      item.cover.style.flex = "0 0 auto";
    }

    function syncRemoveButtons() {
      for (const item of items) {
        const minus = item.row.querySelector("[data-frame-remove]");
        if (minus) minus.hidden = items.length <= 1;
      }
    }

    function readPreviousSize() {
      const last = items[items.length - 1];
      return {
        widthEm: last?.widthEm ?? WIDTH_DEFAULT,
        aspect: last?.aspect ?? ASPECT_DEFAULT,
        palette:
          last?.cover.getAttribute("palette") ||
          firstCover.getAttribute("palette") ||
          "prism",
      };
    }

    function syncSeedsFromCover(item) {
      item.inputA.value = item.cover.getAttribute("seed-a") ?? "0";
      item.inputB.value = item.cover.getAttribute("seed-b") ?? "0";
    }

    function addItem(cover, { widthEm, aspect } = readPreviousSize()) {
      const item = {
        cover,
        widthEm: Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, widthEm)),
        aspect: Math.min(ASPECT_MAX, Math.max(ASPECT_MIN, aspect)),
        row: document.createElement("tr"),
        inputA: document.createElement("input"),
        inputB: document.createElement("input"),
      };

      const seedsCell = document.createElement("td");
      const seedsField = document.createElement("div");
      seedsField.className = "ids__gen-cover-demo__field";
      item.inputA.type = "number";
      item.inputA.min = "0";
      item.inputA.max = String(SEED_MAX);
      item.inputA.setAttribute("aria-label", "Seed A");
      item.inputB.type = "number";
      item.inputB.min = "0";
      item.inputB.max = String(SEED_MAX);
      item.inputB.setAttribute("aria-label", "Seed B");
      const randomize = document.createElement("button");
      randomize.type = "button";
      randomize.textContent = "Randomize";
      seedsField.append(item.inputA, item.inputB, randomize);
      seedsCell.append(seedsField);

      const widthCell = document.createElement("td");
      const widthField = document.createElement("div");
      widthField.className = "ids__gen-cover-demo__field";
      const widthRange = document.createElement("input");
      widthRange.type = "range";
      widthRange.min = String(WIDTH_MIN);
      widthRange.max = String(WIDTH_MAX);
      widthRange.step = "1";
      widthRange.value = formatWidth(item.widthEm);
      widthRange.setAttribute("aria-label", "Cover width in em");
      const widthNumber = document.createElement("input");
      widthNumber.type = "number";
      widthNumber.min = String(WIDTH_MIN);
      widthNumber.max = String(WIDTH_MAX);
      widthNumber.step = "1";
      widthNumber.value = formatWidth(item.widthEm);
      widthNumber.setAttribute("aria-label", "Cover width in em");
      const widthUnit = document.createElement("span");
      widthUnit.className = "ids__gen-cover-demo__unit";
      widthUnit.textContent = "em";
      widthField.append(widthRange, widthNumber, widthUnit);
      widthCell.append(widthField);

      const aspectCell = document.createElement("td");
      const aspectField = document.createElement("div");
      aspectField.className = "ids__gen-cover-demo__field";
      const aspectRange = document.createElement("input");
      aspectRange.type = "range";
      aspectRange.min = String(ASPECT_MIN);
      aspectRange.max = String(ASPECT_MAX);
      aspectRange.step = "0.01";
      aspectRange.value = formatAspect(aspectToSlider(item.aspect));
      aspectRange.setAttribute("aria-label", "Cover aspect ratio");
      const aspectNumber = document.createElement("input");
      aspectNumber.type = "number";
      aspectNumber.min = String(ASPECT_MIN);
      aspectNumber.max = String(ASPECT_MAX);
      aspectNumber.step = "0.01";
      aspectNumber.value = formatAspect(item.aspect);
      aspectNumber.setAttribute("aria-label", "Cover aspect ratio");
      const aspectSelect = createAspectSelect(item.aspect);
      aspectField.append(aspectRange, aspectNumber, aspectSelect);
      aspectCell.append(aspectField);

      const actionsCell = document.createElement("td");
      actionsCell.className = "ids__gen-cover-demo__table-actions";
      const minus = document.createElement("button");
      minus.type = "button";
      minus.className = "ids__gen-cover-demo__frame-btn";
      minus.dataset.frameRemove = "";
      minus.setAttribute("aria-label", "Remove cover");
      minus.textContent = "−";
      actionsCell.append(minus);

      item.row.append(seedsCell, widthCell, aspectCell, actionsCell);
      tbody.insertBefore(item.row, addRow);

      if (cover.parentElement !== gallery) {
        gallery.append(cover);
      }
      applyItemLayout(item);
      syncSeedsFromCover(item);
      syncRangeProgress(widthRange);
      syncRangeProgress(aspectRange);

      function setWidth(value) {
        item.widthEm = Math.min(
          WIDTH_MAX,
          Math.max(WIDTH_MIN, parseInt(value, 10) || WIDTH_DEFAULT),
        );
        widthRange.value = formatWidth(item.widthEm);
        widthNumber.value = formatWidth(item.widthEm);
        syncRangeProgress(widthRange);
        applyItemLayout(item);
      }

      function setAspect(value, { fromSelect = false, fromSlider = false } = {}) {
        const raw = fromSlider
          ? sliderToAspect(parseFloat(value))
          : parseFloat(value);
        item.aspect = Math.min(
          ASPECT_MAX,
          Math.max(ASPECT_MIN, Number.isFinite(raw) ? raw : ASPECT_DEFAULT),
        );
        aspectRange.value = formatAspect(aspectToSlider(item.aspect));
        aspectNumber.value = formatAspect(item.aspect);
        syncRangeProgress(aspectRange);
        if (!fromSelect) {
          const preset = nearestPreset(item.aspect);
          aspectSelect.value = preset == null ? "" : String(preset);
        }
        applyItemLayout(item);
      }

      item.inputA.addEventListener("input", () => {
        const a = parseInt(item.inputA.value, 10);
        if (!Number.isNaN(a)) item.cover.setAttribute("seed-a", String(a));
      });
      item.inputB.addEventListener("input", () => {
        const b = parseInt(item.inputB.value, 10);
        if (!Number.isNaN(b)) item.cover.setAttribute("seed-b", String(b));
      });
      randomize.addEventListener("click", () => {
        item.cover.setAttribute("seed-a", String(randomSeed()));
        item.cover.setAttribute("seed-b", String(randomSeed()));
        syncSeedsFromCover(item);
      });

      widthRange.addEventListener("input", () => setWidth(widthRange.value));
      widthNumber.addEventListener("input", () => setWidth(widthNumber.value));
      aspectRange.addEventListener("input", () =>
        setAspect(aspectRange.value, { fromSlider: true }),
      );
      aspectNumber.addEventListener("input", () =>
        setAspect(aspectNumber.value),
      );
      aspectSelect.addEventListener("change", () => {
        if (!aspectSelect.value) return;
        setAspect(aspectSelect.value, { fromSelect: true });
      });

      minus.addEventListener("click", () => {
        if (items.length <= 1) return;
        const index = items.indexOf(item);
        if (index < 0) return;
        items.splice(index, 1);
        item.row.remove();
        item.cover.remove();
        syncRemoveButtons();
      });

      items.push(item);
      syncRemoveButtons();
      return item;
    }

    function grainAttr() {
      const input = root.querySelector("[data-gen-cover-grain]");
      return input && !input.checked ? "off" : null;
    }

    function roundedEnabled() {
      const input = root.querySelector("[data-gen-cover-rounded]");
      return !input || input.checked;
    }

    function applyGrain(cover) {
      const off = grainAttr();
      if (off) cover.setAttribute("grain", off);
      else cover.removeAttribute("grain");
    }

    function applyRounded(cover) {
      cover.classList.toggle("ids__rounded", roundedEnabled());
    }

    function coverBaseClass() {
      return roundedEnabled() ? "ids__rounded" : "";
    }

    plus.addEventListener("click", () => {
      const prev = readPreviousSize();
      const next = document.createElement("ids-gen-cover");
      next.className = coverBaseClass();
      next.setAttribute("palette", prev.palette);
      next.setAttribute("seed-a", String(randomSeed()));
      next.setAttribute("seed-b", String(randomSeed()));
      applyGrain(next);
      addItem(next, { widthEm: prev.widthEm, aspect: prev.aspect });
    });

    const [firstLayout, ...restLayouts] = DEFAULT_LAYOUTS;
    applyRounded(firstCover);
    addItem(firstCover, firstLayout);
    for (const layout of restLayouts) {
      const next = document.createElement("ids-gen-cover");
      next.className = coverBaseClass();
      next.setAttribute(
        "palette",
        firstCover.getAttribute("palette") || "prism",
      );
      next.setAttribute("seed-a", String(randomSeed()));
      next.setAttribute("seed-b", String(randomSeed()));
      applyGrain(next);
      addItem(next, layout);
    }

    return {
      getCovers() {
        return items.map((item) => item.cover);
      },
      randomizeAll() {
        for (const item of items) {
          item.cover.setAttribute("seed-a", String(randomSeed()));
          item.cover.setAttribute("seed-b", String(randomSeed()));
          syncSeedsFromCover(item);
        }
      },
      setGrain(enabled) {
        for (const item of items) {
          if (enabled) item.cover.removeAttribute("grain");
          else item.cover.setAttribute("grain", "off");
        }
      },
      setRounded(enabled) {
        for (const item of items) {
          item.cover.classList.toggle("ids__rounded", enabled);
        }
      },
    };
  }

  function wireDemo(root) {
    const cover =
      root.querySelector("ids-gen-cover") ||
      document.querySelector("[data-gen-cover-gallery] ids-gen-cover") ||
      root.closest(".ids__wrapper")?.querySelector("ids-gen-cover") ||
      root.parentElement?.querySelector("ids-gen-cover");
    if (!cover) return;

    root.querySelector("[data-gen-cover-effect]")?.remove();
    /* Global seeds moved into per-row controls. */
    root.querySelector('[data-seed="a"]')?.closest(".ids__gen-cover-demo__field")?.remove();
    root.querySelector('[data-seed="a"]')?.remove();
    root.querySelector('[data-seed="b"]')?.remove();

    const gallery = ensureGallery(cover);
    const galleryApi = wireGalleryControls(root, gallery, cover);

    wirePalettePicker(root, () => galleryApi.getCovers(), cover);

    const randomizeAll = root.querySelector("[data-gen-cover-randomize-all]");
    if (randomizeAll) {
      randomizeAll.addEventListener("click", () => galleryApi.randomizeAll());
    }

    const grain = root.querySelector("[data-gen-cover-grain]");
    if (grain) {
      grain.addEventListener("change", () => {
        galleryApi.setGrain(grain.checked);
      });
      galleryApi.setGrain(grain.checked);
    }

    const rounded = root.querySelector("[data-gen-cover-rounded]");
    if (rounded) {
      rounded.addEventListener("change", () => {
        galleryApi.setRounded(rounded.checked);
      });
      galleryApi.setRounded(rounded.checked);
    }
  }

  document.querySelectorAll("[data-gen-cover-demo]").forEach(wireDemo);
})();
