const scopes = document.querySelectorAll("[data-filter-scope]");

const normalize = (value) => value.trim().toLowerCase();

scopes.forEach((scope) => {
  const mode = scope.dataset.filterMode ?? "includes";
  const buttons = [...scope.querySelectorAll("[data-filter-value]")];
  const items = [...scope.querySelectorAll("[data-filter-item]")];
  const status = scope.querySelector("[data-filter-status]");

  const itemValues = new Map(
    items.map((item) => [
      item,
      (item.dataset.filterValues ?? "")
        .split(",")
        .map(normalize)
        .filter(Boolean)
    ])
  );

  const setStatus = (count) => {
    if (!status) return;
    const noun = scope.querySelector(".note-list") ? "条短记" : "个条目";
    status.textContent = `${count} ${noun}`;
  };

  const applyFilter = (value) => {
    const selected = normalize(value);
    let visibleCount = 0;

    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(normalize(button.dataset.filterValue ?? "") === selected));
    });

    items.forEach((item) => {
      const values = itemValues.get(item) ?? [];
      const visible = selected === "all" || (mode === "exact" ? values[0] === selected : values.includes(selected));
      item.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    setStatus(visibleCount);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filterValue ?? "all"));
  });

  applyFilter("all");
});
