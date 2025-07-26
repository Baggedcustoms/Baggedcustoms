let allMods = [];
const pageSize = 30;

async function fetchMods() {
  const res = await fetch("mods.json");
  allMods = await res.json();

  // List of exclusion keywords (case-insensitive)
  const exclusions = ["z3d", "example1", "example2"]; // add more keywords as needed
  // Tags to exclude completely from the site (case-insensitive)
  const tagExclusions = ["Prime Assets", "GearHead Assets"];

  // Filter out mods whose name contains any of the exclusion keywords
  // OR have any excluded tags
  allMods = allMods.filter(mod => {
    const nameExcluded = exclusions.some(keyword =>
      mod.name.toLowerCase().includes(keyword.toLowerCase())
    );

    const tagsExcluded = mod.tags && mod.tags.some(tag =>
      tagExclusions.some(excludedTag => tag.toLowerCase() === excludedTag.toLowerCase())
    );

    return !nameExcluded && !tagsExcluded;
  });

  // Dynamically build unique tags list for category dropdown
  const tagSet = new Set();
  allMods.forEach(mod => {
    if (Array.isArray(mod.tags)) {
      mod.tags.forEach(tag => tagSet.add(tag));
    }
  });
  const tags = Array.from(tagSet).sort();

  // Populate the categorySelect dropdown with tags
  const categorySelect = document.getElementById("categorySelect");
  if (categorySelect) {
    categorySelect.innerHTML = `
      <option value="" selected>Select Category</option>
      <option value="all">All Categories</option>
    `; // default options

    tags.forEach(tag => {
      const opt = document.createElement("option");
      opt.value = tag;
      opt.textContent = tag;
      categorySelect.appendChild(opt);
    });

    // If URL param exists, set dropdown to that value
    const params = new URLSearchParams(window.location.search);
    const selectedTag = params.get("cat") || "";
    if (selectedTag) {
      categorySelect.value = selectedTag;
    }
  }

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
    displayMods("all");
  } else if (path.includes("category.html")) {
    const category = params.get("cat") || "";
    const page = parseInt(params.get("page")) || 1;
    console.log("Filtering category/tag:", category);

    // Filter by tags now (not category)
    const filtered = (category === "" || category === "all")
      ? allMods
      : allMods.filter(mod => Array.isArray(mod.tags) && mod.tags.includes(category));

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
        (mod.tags && mod.tags.some(t => t.toLowerCase().includes(query)))
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
    category === "All" || category === "" || category === "all"
      ? allMods
      : allMods.filter(
          (mod) => Array.isArray(mod.tags) && mod.tags.includes(category)
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
      if (selected && selected !== "all") {
        window.location.href = `category.html?cat=${encodeURIComponent(selected)}&page=1`;
      } else {
        // Go to main index if 'all' or no category selected
        window.location.href = 'index.html';
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
