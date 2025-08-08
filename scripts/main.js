let allMods = [];
const pageSize = 15;

async function fetchMods() {
  const res = await fetch("mods.json");
  allMods = await res.json();

  const exclusions = ["z3d", "example1", "example2"];
  const tagExclusions = ["Prime Assets", "GearHead Assets"];

  allMods = allMods.filter(mod => {
    const nameExcluded = exclusions.some(keyword =>
      mod.name.toLowerCase().includes(keyword.toLowerCase())
    );
    const tagsExcluded = mod.tags && mod.tags.some(tag =>
      tagExclusions.some(excludedTag => tag.toLowerCase() === excludedTag.toLowerCase())
    );
    return !nameExcluded && !tagsExcluded;
  });

  const tagSet = new Set();
  allMods.forEach(mod => {
    if (Array.isArray(mod.tags)) {
      mod.tags.forEach(tag => tagSet.add(tag));
    }
  });
  const tags = Array.from(tagSet).sort();

  const categorySelect = document.getElementById("categorySelect");
  if (categorySelect) {
    categorySelect.innerHTML = `
      <option value="" selected>Select Category</option>
      <option value="">All Categories</option>
    `;
    tags.forEach(tag => {
      const opt = document.createElement("option");
      opt.value = tag;
      opt.textContent = tag;
      categorySelect.appendChild(opt);
    });

    const params = new URLSearchParams(window.location.search);
    const selectedTag = params.get("cat") || "";
    if (selectedTag) categorySelect.value = selectedTag;
  }

  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);

  if (
    path.includes("index.html") ||
    path === "/" ||
    (path.includes("baggedcustoms") &&
     !path.includes("category.html") &&
     !path.includes("search.html"))
  ) {
    await displayFeatured(); // wait for featured to load first
    displayMods("all");

    document.getElementById("modGrid")?.classList.add("visible");
    document.getElementById("mainFooter")?.classList.add("visible");
  } else if (path.includes("category.html")) {
    const category = params.get("cat") || "";
    const page = parseInt(params.get("page")) || 1;

    const filtered = (category === "" || category === "all")
      ? allMods.filter(mod => Array.isArray(mod.tags) && mod.tags.length > 0)
      : allMods.filter(mod => Array.isArray(mod.tags) && mod.tags.includes(category));

    document.getElementById("categoryTitle").textContent =
      category === "" || category === "all" ? "All Categories" : category;
    displayPagedMods(filtered, page, `category.html?cat=${encodeURIComponent(category)}&`);
  } else if (path.includes("search.html")) {
    const query = params.get("q")?.toLowerCase() || "";
    const page = parseInt(params.get("page")) || 1;

    const filtered = allMods.filter(
      (mod) =>
        mod.name.toLowerCase().includes(query) ||
        (mod.tags && mod.tags.some(t => t.toLowerCase().includes(query)))
    );

    document.getElementById("searchTitle").textContent = `Search: "${query}"`;
    displayPagedMods(filtered, page, `search.html?q=${encodeURIComponent(query)}&`);
  }
}

async function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.src = src;
  });
}

// === SLUG + STATIC PAGE CHECK ===
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function checkStaticPage(slug) {
  try {
    const res = await fetch(`mods/${slug}.html`, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

// === FEATURED MODS ===
async function displayFeatured() {
  const featured = allMods.filter((mod) => mod.featured);
  if (!featured.length) return;

  let index = 0;
  const featuredContainer = document.getElementById("featuredMod");

  async function renderFeatured() {
    const mod = featured[index];
    await preloadImage(mod.image);
    featuredContainer.style.opacity = 0;

    const slug = `baggedcustoms-${generateSlug(mod.name)}`;
    let link = `mod.html?id=${encodeURIComponent(mod.post_id)}`;
    if (await checkStaticPage(slug)) {
      link = `mods/${slug}.html`;
    }

    setTimeout(() => {
      featuredContainer.innerHTML = `
        <a href="${link}" style="text-decoration:none; color: inherit;">
          <img src="${mod.image}" alt="${mod.name}" title="${mod.name}">
          <div class="featured-text">
            <div class="title">${mod.name}</div>
           ${mod.category && mod.category.toLowerCase() !== "uncategorized" ? `<div class="category">${mod.category}</div>` : ""}
          </div>
        </a>
      `;
      featuredContainer.classList.remove("preloading");
      featuredContainer.style.opacity = 1;
      featuredContainer.classList.add("loaded");
      index = (index + 1) % featured.length;
    }, 500);
  }

  await renderFeatured();
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

  filtered.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  filtered.slice(0, 20).forEach((mod) => {
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
      pagination.innerHTML += `<a class="back-button" href="${baseUrl}page=${currentPage - 1}">← Prev</a>`;
    }

    pagination.innerHTML += `<span style="margin: 0 10px;">Page ${currentPage} of ${totalPages}</span>`;

    if (currentPage < totalPages) {
      pagination.innerHTML += `<a class="back-button" href="${baseUrl}page=${currentPage + 1}">Next →</a>`;
    }
  }
}

// === MOD CARD (auto-upgrade to static page) ===
function generateModCard(mod) {
  const id = encodeURIComponent(mod.post_id);
  const slug = `baggedcustoms-${generateSlug(mod.name)}`;
  let link = `mod.html?id=${id}`;

  checkStaticPage(slug).then(exists => {
    if (exists) {
      const card = document.querySelector(`[data-mod-id="${id}"] a`);
      if (card) card.href = `mods/${slug}.html`;
    }
  });

  return `
    <div class="mod-card" data-mod-id="${id}">
      <a href="${link}">
        <img src="${mod.image}" alt="${mod.name}" title="${mod.name}" loading="lazy">
        <div class="mod-info">
          <h3>${mod.name}</h3>
        </div>
      </a>
    </div>
  `;
}

// === DOM READY ===
document.addEventListener("DOMContentLoaded", async () => {
  const categorySelect = document.getElementById("categorySelect");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      const selected = categorySelect.value;
      window.location.href = `category.html?cat=${encodeURIComponent(selected)}&page=1`;
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

  await fetchMods();
});
