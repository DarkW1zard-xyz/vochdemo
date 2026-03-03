const searchInput = document.getElementById("q");
const resultsEl = document.getElementById("results");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear");

const filters = {
  type: document.getElementById("type"),
  cpu: document.getElementById("cpu"),
  ram: document.getElementById("ram"),
  storage: document.getElementById("storage"),
  gpu: document.getElementById("gpu"),
  screen: document.getElementById("screen"),
  price: document.getElementById("price")
};

const miniSearch = new MiniSearch({
  fields: ["name", "cpu", "gpu", "tags", "type"],
  storeFields: [
    "id",
    "name",
    "type",
    "cpu",
    "ram",
    "storage",
    "gpu",
    "screen",
    "price",
    "tags",
    "url"
  ],
  searchOptions: {
    boost: { name: 3, cpu: 2, gpu: 2, tags: 1.5 },
    prefix: true,
    fuzzy: 0.2
  }
});

miniSearch.addAll(PRODUCTS);

const debounce = (fn, wait = 200) => {
  let t;
  return (...args) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
};

const toNumber = (value) => (value === "" ? null : Number(value));

const applyFilters = (items) => {
  const type = filters.type.value;
  const cpu = filters.cpu.value;
  const ram = toNumber(filters.ram.value);
  const storage = toNumber(filters.storage.value);
  const gpu = filters.gpu.value;
  const screen = toNumber(filters.screen.value);
  const price = toNumber(filters.price.value);

  return items.filter((item) => {
    if (type && item.type !== type) return false;
    if (cpu && !item.cpu.toLowerCase().includes(cpu)) return false;
    if (ram && item.ram < ram) return false;
    if (storage && item.storage < storage) return false;
    if (gpu && !item.gpu.toLowerCase().includes(gpu)) return false;
    if (screen && item.screen && item.screen < screen) return false;
    if (price && item.price > price) return false;
    return true;
  });
};

const render = (items) => {
  resultsEl.innerHTML = "";
  if (!items.length) {
    emptyEl.classList.remove("hidden");
    countEl.textContent = "0 results";
    return;
  }

  emptyEl.classList.add("hidden");
  countEl.textContent = `${items.length} result${items.length === 1 ? "" : "s"}`;

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.name}</h3>
      <div class="meta">${item.cpu} · ${item.ram}GB RAM · ${item.storage}GB SSD</div>
      <div class="meta">${item.gpu}${item.screen ? ` · ${item.screen}\" screen` : ""}</div>
      <div class="taglist">${item.tags.map((tag) => `#${tag}`).join(" ")}</div>
      <div class="price">$${item.price.toLocaleString()}</div>
    `;
    resultsEl.appendChild(card);
  }
};

const runSearch = () => {
  const query = searchInput.value.trim();
  let matches;

  if (query) {
    matches = miniSearch.search(query).map((result) => result);
  } else {
    matches = PRODUCTS;
  }

  const filtered = applyFilters(matches);
  render(filtered);
};

const debouncedSearch = debounce(runSearch, 200);

searchInput.addEventListener("input", debouncedSearch);
Object.values(filters).forEach((el) => {
  el.addEventListener("input", runSearch);
  el.addEventListener("change", runSearch);
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  Object.values(filters).forEach((el) => {
    if (el.tagName === "SELECT") el.value = "";
    if (el.tagName === "INPUT") el.value = "";
  });
  runSearch();
});

runSearch();
