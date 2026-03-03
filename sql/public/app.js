const searchInput = document.getElementById("q");
const resultsEl = document.getElementById("results");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear");
const loadMoreBtn = document.getElementById("loadMore");
const activeFiltersEl = document.getElementById("activeFilters");
const sortSelect = document.getElementById("sort");
const suggestionsEl = document.getElementById("suggestions");

const filters = {
  category: document.getElementById("category"),
  brand: document.getElementById("brand"),
  type: document.getElementById("type"),
  availability: document.getElementById("availability"),
  cpu: document.getElementById("cpu"),
  ram: document.getElementById("ram"),
  storage: document.getElementById("storage"),
  gpu: document.getElementById("gpu"),
  screen: document.getElementById("screen"),
  price: document.getElementById("price"),
  minPrice: document.getElementById("minPrice")
};

const pageSize = 12;
let offset = 0;
let totalCount = 0;
let currentItems = [];

const debounce = (fn, wait = 200) => {
  let t;
  return (...args) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
};

const toNumber = (value) => (value === "" ? null : Number(value));

const buildParams = () => {
  const params = new URLSearchParams();
  const q = searchInput.value.trim();
  if (q) params.set("q", q);

  if (filters.category.value) params.set("category", filters.category.value);
  if (filters.brand.value) params.set("brand", filters.brand.value);
  if (filters.type.value) params.set("type", filters.type.value);
  if (filters.availability.value) params.set("availability", filters.availability.value);
  if (filters.cpu.value) params.set("cpuBrand", filters.cpu.value);
  if (filters.gpu.value) params.set("gpuBrand", filters.gpu.value);

  if (sortSelect.value && sortSelect.value !== "relevance") {
    params.set("sort", sortSelect.value);
  }

  const minRam = toNumber(filters.ram.value);
  if (minRam) params.set("minRam", String(minRam));

  const minStorage = toNumber(filters.storage.value);
  if (minStorage) params.set("minStorage", String(minStorage));

  const minScreen = toNumber(filters.screen.value);
  if (minScreen) params.set("minScreen", String(minScreen));

  const minPrice = toNumber(filters.minPrice.value);
  if (minPrice) params.set("minPrice", String(minPrice));

  const maxPrice = toNumber(filters.price.value);
  if (maxPrice) params.set("maxPrice", String(maxPrice));

  params.set("limit", String(pageSize));
  params.set("offset", String(offset));
  return params;
};

const formatAvailability = (value) => {
  if (value === false) return "Out of stock";
  return "In stock";
};

const renderChips = () => {
  const chips = [];
  const q = searchInput.value.trim();
  if (q) chips.push({ key: "q", label: `Search: ${q}` });
  if (filters.category.value) chips.push({ key: "category", label: `Category: ${filters.category.value}` });
  if (filters.brand.value) chips.push({ key: "brand", label: `Brand: ${filters.brand.value}` });
  if (filters.type.value) chips.push({ key: "type", label: `Type: ${filters.type.value}` });
  if (filters.availability.value) chips.push({ key: "availability", label: `Availability: ${filters.availability.value === "in_stock" ? "In stock" : "Out of stock"}` });
  if (filters.cpu.value) chips.push({ key: "cpu", label: `CPU: ${filters.cpu.value}` });
  if (filters.gpu.value) chips.push({ key: "gpu", label: `GPU: ${filters.gpu.value}` });
  if (filters.ram.value) chips.push({ key: "ram", label: `RAM: ${filters.ram.value}+` });
  if (filters.storage.value) chips.push({ key: "storage", label: `Storage: ${filters.storage.value}+` });
  if (filters.screen.value) chips.push({ key: "screen", label: `Screen: ${filters.screen.value}+` });
  if (filters.minPrice.value) chips.push({ key: "minPrice", label: `Min $${filters.minPrice.value}` });
  if (filters.price.value) chips.push({ key: "price", label: `Max $${filters.price.value}` });

  activeFiltersEl.innerHTML = "";
  chips.forEach((chip) => {
    const el = document.createElement("button");
    el.className = "chip";
    el.type = "button";
    el.textContent = chip.label;
    el.addEventListener("click", () => {
      if (chip.key === "q") searchInput.value = "";
      else if (chip.key === "category") filters.category.value = "";
      else if (chip.key === "brand") filters.brand.value = "";
      else if (chip.key === "type") filters.type.value = "";
      else if (chip.key === "availability") filters.availability.value = "";
      else if (chip.key === "cpu") filters.cpu.value = "";
      else if (chip.key === "gpu") filters.gpu.value = "";
      else if (chip.key === "ram") filters.ram.value = "";
      else if (chip.key === "storage") filters.storage.value = "";
      else if (chip.key === "screen") filters.screen.value = "";
      else if (chip.key === "minPrice") filters.minPrice.value = "";
      else if (chip.key === "price") filters.price.value = "";
      resetAndSearch();
    });
    activeFiltersEl.appendChild(el);
  });
};

const render = () => {
  resultsEl.innerHTML = "";
  if (!currentItems.length) {
    emptyEl.classList.remove("hidden");
    countEl.textContent = "0 results";
    loadMoreBtn.classList.add("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  countEl.textContent = `${totalCount} result${totalCount === 1 ? "" : "s"}`;

  for (const item of currentItems) {
    const card = document.createElement("article");
    card.className = "card";
    const badgeClass = item.inStock === false ? "badge out" : "badge";
    card.innerHTML = `
      <img src="${item.imageUrl || "/images/placeholder.svg"}" alt="${item.name}" loading="lazy" decoding="async" width="640" height="480" />
      <div class="card-header">
        <h3>${item.name}</h3>
        <span class="${badgeClass}">${formatAvailability(item.inStock)}</span>
      </div>
      <div class="meta">${item.brand} · ${item.category || "electronics"} · ${item.cpu} · ${item.ram}GB RAM · ${item.storage}GB SSD</div>
      <div class="meta">${item.gpu}${item.screen ? ` · ${item.screen}\" screen` : ""}</div>
      ${item.description ? `<div class="meta">${item.description}</div>` : ""}
      <div class="taglist">${item.tags.map((tag) => `#${tag}`).join(" ")}</div>
      <div class="meta">Rating: ${item.rating?.toFixed(1) ?? "0.0"} · Popularity: ${item.popularity ?? 0}</div>
      <div class="price">$${item.price.toLocaleString()}</div>
    `;
    resultsEl.appendChild(card);
  }

  if (currentItems.length < totalCount) {
    loadMoreBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.add("hidden");
  }
};

const runSearch = async (append = false) => {
  const params = buildParams();
  const response = await fetch(`/api/products?${params.toString()}`);
  const data = await response.json();
  totalCount = data.total ?? 0;
  if (append) {
    currentItems = [...currentItems, ...(data.items ?? [])];
  } else {
    currentItems = data.items ?? [];
  }
  renderChips();
  render();
};

const resetAndSearch = () => {
  offset = 0;
  currentItems = [];
  runSearch(false);
};

const debouncedSearch = debounce(() => resetAndSearch(), 200);

searchInput.addEventListener("input", debouncedSearch);
Object.values(filters).forEach((el) => {
  el.addEventListener("input", resetAndSearch);
  el.addEventListener("change", resetAndSearch);
});

sortSelect.addEventListener("change", resetAndSearch);

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  Object.values(filters).forEach((el) => {
    if (el.tagName === "SELECT") el.value = "";
    if (el.tagName === "INPUT") el.value = "";
  });
  sortSelect.value = "relevance";
  resetAndSearch();
});

loadMoreBtn.addEventListener("click", () => {
  offset += pageSize;
  runSearch(true);
});

resetAndSearch();

const fillSuggestions = (items) => {
  suggestionsEl.innerHTML = "";
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    suggestionsEl.appendChild(option);
  });
};

const fetchSuggestions = async (query) => {
  if (!query) {
    const res = await fetch("/api/search/popular");
    const data = await res.json();
    fillSuggestions(data.items ?? []);
    return;
  }
  const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  fillSuggestions(data.items ?? []);
};

searchInput.addEventListener("input", debounce((e) => {
  fetchSuggestions(e.target.value.trim());
}, 200));

searchInput.addEventListener("focus", () => {
  fetchSuggestions(searchInput.value.trim());
});
