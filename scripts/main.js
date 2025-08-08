let allMods = [];
let prettyUrlMap = new Map();   // slug -> relative /mods/*.html
let prettySlugSet = new Set();  // quick existence check
const pageSize = 15;

// --- Slugify to match the PowerShell New-Slug ---
function slugify(s) {
  if (!s || typeof s !== "string") return "mod";
  // Remove anything not letter/number/space/hyphen (Unicode aware)
  let out = s
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return out || "mod";
}

// === FETCH SITEMAP AND BUILD URL MAP ===
async function loadSitemapUrls() {
  try {
    const res = await fetch("sitemap.xml", { cache: "no-store" });
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    // Handle XML namespaces (sitemaps use a default ns)
    const urlNodes = Array.from(xmlDoc.getElementsByTagNameNS("*", "url"));
    let count = 0;

    urlNodes.forEach(urlNode => {
      const locNode = urlNode.getElementsByTagNameNS("*", "loc")[0];
      if (!locNode) return;
      const full = locNode.textContent.trim();
      if (!full.includes("/mods/")) return;

      // Make a relative path for client-side links
      let relPath;
      try {
        const u = new URL(full, window.location.origin);
        relPath = u.pathname; // e.g. /mods/some-slug.html
      } catch {
        // If it's already relative
        relPath = full;
      }

      // Extract slug (filename without .html)
      const last = relPath.substring(relPath.lastIndexOf("/") + 1);
      if (!last.toLowerCase().endsWith(".html")) return;
      const slug = last.slice(0, -5).toLowerCase();

      prettyUrlMap.set(slug, relPath);
      prettySlugSet.add(slug);
      count++;
    });

    console.log(`[SITEMAP] Loaded ${count} /mods/ pages (slugs)`);
  } catch (err) {
    console.warn("[SITEMAP] Failed to load/parse sitemap.xml", err);
  }
}

async function fetchMods() {
  const res = await fetch("mods.json", { cache: "no-store" });
  allMods = await res.json();

  const exclusions = ["z3d", "example1", "example2"];
  const tagExclusions = ["Prime Assets", "GearHead Assets"];

  allMods = allMods.filter(mod => {
    const nameExcluded = exclusions.some(keyword =>
      (mod.name || "").toLowerCase().includes(keyword.toLowerCase())
    );
    const tagsExcluded = Array.isArray(mod.tags) && mod.tags.some(tag =>
      tagExclusions.some(excludedTag => (tag || "").toLowerCase() === excludedTag.toLowerCase())
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
    await displayFeatured();
    displayMods("all");
    document.getElementById("modGrid")?.classList.add("visible");
    document.getElementById("mainFooter")?.classList.add("visible");
  } else if (path.includes("category.html")) {
    const category = params.get("cat") || "";
    const page = parseInt(params.get("page")) || 1;

    const filtered = (category === "" || category === "all")
      ? allMods.filter(mod => Array.isArray(mod.tags) && mod.tags.length > 0)
      : allMods.filter(mod => Array.isArray(mod.tags) && mod.tags.includes(category));

    const titleEl = document.getElementById("categoryTitle");
    if (titleEl) {
      titleEl.textContent = (category === "" || category === "all") ? "All Categories" : category;
    }
    displayPagedMods(filtered, page, `category.html?cat=${encodeURIComponent(category)}&`);
  } else if (path.includes("search.html")) {
    const query = params.get("q")?.toLowerCase() || "";
    const page = parseInt(params.get("page")) || 1;

    const filtered = allMods.filter(
      (mod) =>
        (mod.name || "").toLowerCase().includes(query) ||
        (Array.isArray(mod.tags) && mod.tags.some(t => (t || "").toLowerCase().includes(query)))
    );

    const searchTitle = document.getElementById("searchTitle");
    if (searchTitle) searchTitle.textContent = `Search: "${query}"`;
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

    const link = getModLink(mod);

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

// === DETERMINE MOD LINK ===
function getModLink(mod) {
  // 1) Try exact pretty page by slug from name (matches how files are generated)
  const nameSlug = slugify(mod.name || "");
  if (prettySlugSet.has(nameSlug)) {
    return prettyUrlMap.get(nameSlug);
  }

  // 2) Try slug from post_id, if present
  const idSlug = slugify(mod.post_id || "");
  if (idSlug && prettySlugSet.has(idSlug)) {
    return prettyUrlMap.get(idSlug);
  }

  // 3) Fallback to old format
  return `mod.html?id=${encodeURIComponent(mod.post_id || mod.name || "")}`;
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

// === MOD CARD ===
function generateModCard(mod) {
  const link = getModLink(mod);
  return `
    <div class="mod-card">
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

  await loadSitemapUrls(); // build slug map first
  await fetchMods();       // then render using getModLink()
});
