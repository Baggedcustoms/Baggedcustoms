let allMods = [];
const pageSize = 16;

async function fetchMods() {
  const res = await fetch("mods.json");
  allMods = await res.json();

  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);

  console.log("Mods loaded:", allMods.length);
  console.log("Window path:", path);
  console.log("URL params:", Object.fromEntries(params.entries()));

  if (path.includes("index.html") || path === "/" || path.includes("baggedcustoms") && !path.includes("category.html") && !path.includes("search.html")) {
    displayFeatured();
    displayMods("All");
  } else if (path.includes("category.html")) {
    const category = params.get("cat") || "";
    const page = parseInt(params.get("page")) || 1;
    console.log("Filtering category:", category);

    const filtered = allMods.filter(mod =>
      mod.category.toLowerCase() === category.toLowerCase()
    );

    console.log("Filtered mods:", filtered.length);
    document.getElementById("categoryTitle").textContent = category || "All Categories";
    displayPagedMods(filtered, page, `category.html?cat=${encodeURIComponent(category)}&`);
  } else if (path.includes("search.html")) {
    const query = params.get("q")?.toLowerCase() || "";
    const page = parseInt(params.get("page")) || 1;

    const filtered = allMods.filter(mod =>
      mod.name.toLowerCase().includes(query) ||
      mod.category.toLowerCase().includes(query)
    );

    console.log("Search query:", query);
    console.log("Search results:", filtered.length);

    document.getElementById("searchTitle").textContent = `Search: "${query}"`;
    displayPagedMods(filtered, page, `search.html?q=${encodeURIComponent(query)}&`);
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
      <div class="featured-mod">
        <img src="${mod.image}" alt="${mod.name}">
        <div class="title">${mod.name}</div>
        <div class="category">Category: ${mod.category}</div>
        <a href="${mod.link}" class="download-button" target="_blank">Download</a>
      </div>
    `;
    index = (index + 1) % featured.length;
  }

  render();
  setInterval(render, 5000);
}

function displayMods(category) {
  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";
  const filtered = category === "All" ? allMods : allMods.filter(mod => mod.category.toLowerCase() === category.toLowerCase());
  filtered.slice(0, 16).forEach(mod => {
    grid.innerHTML += generateModCard(mod);
  });
}

function displayPagedMods(mods, currentPage, baseUrl) {
  const grid = document.getElementById("modGrid");
  const pagination = document.getElementById("paginationControls");
  const totalPages = Math.ceil(mods.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const paged = mods.slice(start, start + pageSize);

  grid.innerHTML = "";
  pagination.innerHTML = "";

  if (!paged.length) {
    grid.innerHTML = "<p style='text-align:center;'>No results found.</p>";
    return;
  }

  paged.forEach(mod => {
    grid.innerHTML += generateModCard(mod);
  });

  if (totalPages > 1) {
    if (currentPage > 1) {
      pagination.innerHTML += `<a class="back-button" href="${baseUrl}page=${currentPage - 1}">← Prev</a>`;
    }

    pagination.innerHTML += `<span style="margin: 0 10px;">Page ${currentPage} of ${totalPages}</span>`;

    if (currentPage < totalPages) {
      pagination.innerHTML += `<a class="back-button" href="${baseUrl}page=${currentPage + 1}">Next →</a>`;
    }
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
    window.location.href = `category.html?cat=${encodeURIComponent(value)}&page=1`;
  }
}

function performSearch() {
  const input = document.getElementById("searchInput");
  const value = input.value.trim();
  if (value) {
    window.location.href = `search.html?q=${encodeURIComponent(value)}&page=1`;
  }
}

fetchMods();
