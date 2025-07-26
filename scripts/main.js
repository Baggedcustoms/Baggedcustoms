let allMods = [];
const pageSize = 30;

async function fetchMods() {
  const res = await fetch("mods.json");
  allMods = await res.json();

  // EXCLUDE ALL MODS WITH 'z3d' IN THE NAME (case-insensitive)
  allMods = allMods.filter(mod => !mod.name.toLowerCase().includes("z3d"));

  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);

  console.log("Mods loaded:", allMods.length);
  console.log("Window path:", path);
  console.log("URL params:", Object.fromEntries(params.entries()));

  if (
    path.includes("index.html") ||
    path === "/" ||
    (path.includes("baggedcustoms") &&
      !path.includes("category.html") &&
      !path.includes("search.html"))
  ) {
    displayFeatured();
    displayMods("All");
  } else if (path.includes("category.html")) {
    const category = params.get("cat") || "";
    const page = parseInt(params.get("page")) || 1;
    console.log("Filtering category:", category);

    const filtered = allMods.filter(
      (mod) => mod.category.toLowerCase() === category.toLowerCase()
    );

    console.log("Filtered mods:", filtered.length);
    document.getElementById("categoryTitle").textContent =
      category || "All Categories";
    displayPagedMods(filtered, page, `category.html?cat=${encodeURIComponent(category)}&`);
  } else if (path.includes("search.html")) {
    const query = params.get("q")?.toLowerCase() || "";
    const page = parseInt(params.get("page")) || 1;

    const filtered = allMods.filter(
      (mod) =>
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
  const featured = allMods.filter((mod) => mod.featured);
  if (!featured.length) return;

  let index = 0;
  const featuredContainer = document.getElementById("featuredMod");

  function renderFeatured() {
    const mod = featured[index];
    featuredContainer.innerHTML = `
      <img src="${mod.image}" alt="${mod.name}">
      <div class="title">${mod.name}</div>
    `;
    index = (index + 1) % featured.length;
  }

  renderFeatured(); // ✅ Call the correct function
  setInterval(renderFeatured, 5000);
}

function displayMods(category) {
  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";
  const filtered =
    category === "All"
      ? allMods
      : allMods.filter(
          (mod) => mod.category.toLowerCase() === category.toLowerCase()
        );

  // Sort filtered mods by published_at descending (newest first)
  filtered.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  filtered.slice(0, 16).forEach((mod) => {
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

  paged.forEach((mod) => {
    grid.innerHTML += generateModCard(mod);
  });

  if (totalPages > 1) {
    if (currentPage > 1) {
      pagination.innerHTML += `<a class="back-button" href="${baseUrl}page=${
        currentPage - 1
      }">← Prev</a>`;
    }

    pagination.innerHTML += `<span style="margin: 0 10px;">Page ${currentPage} of ${totalPages}</span>`;

    if (currentPage < totalPages) {
      pagination.innerHTML += `<a class="back-button" href="${baseUrl}page=${
        currentPage + 1
      }">Next →</a>`;
    }
  }
}

function generateModCard(mod) {
  return `
    <div class="mod-card">
      <img src="${mod.image}" alt="${mod.name}">
      <div class="mod-info">
        <h3>${mod.name}</h3>
      </div>
    </div>
  `;
}

// Hook up search + category listeners after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const categorySelect = document.getElementById("categorySelect");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      const selected = categorySelect.value;
      if (selected) {
        window.location.href = `category.html?cat=${encodeURIComponent(selected)}&page=1`;
      }
    });
  }

  if (searchInput && searchButton) {
    searchButton.addEventListener("click", () => {
      const value = searchInput.value.trim();
      if (value) {
        window.location.href = `search.html?q=${encodeURIComponent(value)}&page=1`;
      }
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchButton.click();
      }
    });
  }
});

// Initial load
fetchMods();
