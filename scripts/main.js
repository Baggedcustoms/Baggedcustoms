let allMods = [];
const pageSize = 16;

async function fetchMods() {
  const res = await fetch("mods.json");
  allMods = await res.json();

  const path = window.location.pathname;
  if (path.endsWith("index.html") || path === "/" || path === "/Baggedcustoms/") {
    displayFeatured();
    displayMods("All");
  } else if (path.endsWith("category.html")) {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("cat");
    document.getElementById("categoryTitle").textContent = category ? category : "All Categories";
    displayPagedMods(allMods.filter(mod => category ? mod.category === category : true));
  } else if (path.endsWith("search.html")) {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q")?.toLowerCase() || "";
    document.getElementById("searchTitle").textContent = `Search: "${query}"`;
    displayPagedMods(allMods.filter(mod =>
      mod.name.toLowerCase().includes(query) || mod.category.toLowerCase().includes(query)
    ));
  }
}

function displayFeatured() {
  const featured = allMods.filter(mod => mod.featured);
  if (!featured.length) return;
  let index = 0;
  const container = document.getElementById("featuredMod");

  function render() {
    const mod = featured[index];
    container.innerHTML = `
      <img src="${mod.image}" alt="${mod.name}">
      <div class="title">${mod.name}</div>
      <div class="category">Category: ${mod.category}</div>
      <a href="${mod.link}" class="download-button" target="_blank">Download</a>
    `;
    index = (index + 1) % featured.length;
  }

  render();
  setInterval(render, 5000);
}

function displayMods(category) {
  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";
  const filtered = category === "All" ? allMods : allMods.filter(mod => mod.category === category);
  filtered.slice(0, 16).forEach(mod => {
    grid.innerHTML += generateModCard(mod);
  });
}

function displayPagedMods(mods) {
  const params = new URLSearchParams(window.location.search);
  const page = parseInt(params.get("page")) || 1;
  const start = (page - 1) * pageSize;
  const paged = mods.slice(start, start + pageSize);

  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";
  paged.forEach(mod => {
    grid.innerHTML += generateModCard(mod);
  });

  const pagination = document.getElementById("paginationControls");
  if (!pagination) return;

  pagination.innerHTML = "";
  const totalPages = Math.ceil(mods.length / pageSize);
  if (totalPages <= 1) return;

  if (page > 1) {
    pagination.innerHTML += `<button onclick="changePage(${page - 1})">Previous</button>`;
  }
  if (page < totalPages) {
    pagination.innerHTML += `<button onclick="changePage(${page + 1})">Next</button>`;
  }
}

function changePage(pageNum) {
  const params = new URLSearchParams(window.location.search);
  if (window.location.pathname.includes("category.html")) {
    const cat = params.get("cat");
    window.location.href = `category.html?cat=${encodeURIComponent(cat)}&page=${pageNum}`;
  } else if (window.location.pathname.includes("search.html")) {
    const q = params.get("q");
    window.location.href = `search.html?q=${encodeURIComponent(q)}&page=${pageNum}`;
  }
}

function generateModCard(mod) {
  return `
    <div class="mod-card">
      <img src="${mod.image}" alt="${mod.name}">
      <div class="mod-info">
        <h3>${mod.name}</h3>
        <p>Category: ${mod.category}</p>
        <a href="${mod.link}" target="_blank" class="download-button">Download</a>
      </div>
    </div>
  `;
}

function redirectCategory(select) {
  const value = select.value;
  if (value) {
    window.location.href = `category.html?cat=${encodeURIComponent(value)}`;
  }
}

function performSearch() {
  const input = document.getElementById("searchInput");
  const value = input.value.trim();
  if (value) {
    window.location.href = `search.html?q=${encodeURIComponent(value)}`;
  }
}

fetchMods();
