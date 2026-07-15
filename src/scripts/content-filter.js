const scopes = document.querySelectorAll("[data-filter-scope]");

const normalize = (value) => value.trim().toLowerCase();

scopes.forEach((scope) => {
  const mode = scope.dataset.filterMode ?? "includes";
  const buttons = [...scope.querySelectorAll("[data-filter-value]")];
  const items = [...scope.querySelectorAll("[data-filter-item]")];
  const status = scope.querySelector("[data-filter-status]");
  const reset = scope.querySelector("[data-filter-reset]");
  const active = new Map();

  const itemValues = new Map(
    items.map((item) => [
      item,
      (item.dataset.filterValues ?? "")
        .split(",")
        .map(normalize)
        .filter(Boolean)
    ])
  );

  const itemFacets = new Map(
    items.map((item) => [
      item,
      {
        category: normalize(item.dataset.filterCategory ?? ""),
        tags: (item.dataset.filterTags ?? "")
          .split(",")
          .map(normalize)
          .filter(Boolean)
      }
    ])
  );

  const getGroup = (button) => button.dataset.filterGroup ?? "legacy";

  const setStatus = (count) => {
    if (!status) return;
    const noun = scope.dataset.filterNoun ?? (scope.querySelector(".note-list") ? "条短记" : "个条目");
    status.textContent = `${count} ${noun}`;
  };

  const setPressedState = () => {
    buttons.forEach((button) => {
      const group = getGroup(button);
      const selected = active.get(group) ?? "all";
      button.setAttribute("aria-pressed", String(normalize(button.dataset.filterValue ?? "") === selected));
    });
  };

  const isLegacyVisible = (item, selected) => {
    const values = itemValues.get(item) ?? [];
    return selected === "all" || (mode === "exact" ? values[0] === selected : values.includes(selected));
  };

  const isFacetVisible = (item) => {
    const facets = itemFacets.get(item) ?? { category: "", tags: [] };
    const category = active.get("category") ?? "all";
    const tag = active.get("tag") ?? "all";
    return (category === "all" || facets.category === category) && (tag === "all" || facets.tags.includes(tag));
  };

  const applyFilter = () => {
    const hasFacets = buttons.some((button) => button.dataset.filterGroup);
    const legacy = active.get("legacy") ?? "all";
    let visibleCount = 0;

    setPressedState();

    items.forEach((item) => {
      const visible = hasFacets ? isFacetVisible(item) : isLegacyVisible(item, legacy);
      item.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    setStatus(visibleCount);
  };

  buttons.forEach((button) => {
    const group = getGroup(button);
    if (!active.has(group)) active.set(group, "all");
    button.addEventListener("click", () => {
      active.set(group, normalize(button.dataset.filterValue ?? "all"));
      applyFilter();
    });
  });

  reset?.addEventListener("click", () => {
    [...active.keys()].forEach((group) => active.set(group, "all"));
    applyFilter();
  });

  applyFilter();
});
