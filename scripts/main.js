let allMods = [];
const pageSize = 15;

/* ---------- utils ---------- */
function makeSlug(s) {
  if (!s) return "mod";
  s = s.replace(/[^\p{L}\p{N}\s-]+/gu, "");
  s = s.trim().toLowerCase();
  s = s.replace(/\s+/g, "-").replace(/-+/g, "-");
  return s || "mod";
}

/* Use a safe hero image (handles missing/array) */
function heroImage(mod) {
  return mod.image || (Array.isArray(mod.images) && mod.images[0]) || "images/placeholder.webp";
}

/* ---------- fetch + prep mods ---------- */
async function fetchMods() {
  const response = await fetch("mods.json", { cache: "no-store" });
  allMods = await response.json();

  const exclusions = ["z3d", "example1", "example2"];
  const tagExclusions = ["Prime Assets", "GearHead Assets"];

  allMods = allMods.filter(mod => {
    const name = (mod.name || "").toLowerCase();
    const nameExcluded = exclusions.some(k => name.includes(k.toLowerCase()));
    const tagsExcluded =
      Array.isArray(mod.tags) &&
      mod.tags.some(tag => tagExclusions.some(ex => tag.toLowerCase() === ex.toLowerCase()));
    return !nameExcluded && !tagsExcluded;
  });

  // Build category select
  const tagSet = new Set();
  allMods.forEach(m => Array.isArray(m.tags) && m.tags.forEach(t => tagSet.add(t)));
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

  // Simple router
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

    const filtered =
      category === "" || category === "all"
        ? allMods.filter(m => Array.isArray(m.tags) && m.tags.length > 0)
        : allMods.filter(m => Array.isArray(m.tags) && m.tags.includes(category));

    const titleEl = document.getElementById("categoryTitle");
    if (titleEl) titleEl.textContent = category === "" || category === "all" ? "All Categories" : category;

    displayPagedMods(filtered, page, `category.html?cat=${encodeURIComponent(category)}&`);
  } else if (path.includes("search.html")) {
    const query = (params.get("q") || "").toLowerCase();
    const page = parseInt(params.get("page")) || 1;

    const filtered = allMods.filter(m =>
      (m.name || "").toLowerCase().includes(query) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(query)))
    );

    const titleEl = document.getElementById("searchTitle");
    if (titleEl) titleEl.textContent = `Search: "${query}"`;

    displayPagedMods(filtered, page, `search.html?q=${encodeURIComponent(query)}&`);
  }
}

function preloadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });
}

/* ---------- featured (first paint no fade, rotate after) ---------- */
async function displayFeatured() {
  const featured = allMods.filter(m => m.featured);
  if (!featured.length) return;

  const featuredContainer = document.getElementById("featuredMod");
  if (!featuredContainer) return;

  const EXTRA_FIRST_DELAY = 3000;
  const ROTATE_EVERY = 5000;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const templateFor = (mod) => {
    const link = getModLink(mod);
    const img = heroImage(mod);
    return `
      <a href="${link}" style="text-decoration:none; color:inherit;">
        <img src="${img}" alt="${mod.name}" title="${mod.name}"
             width="640" height="360" loading="eager" decoding="async">
        <div class="featured-text">
          <div class="title">${mod.name}</div>
          ${mod.category && mod.category.toLowerCase() !== "uncategorized"
            ? `<div class="category">${mod.category}</div>`
            : ""}
        </div>
      </a>
    `;
  };

  // Pick a random starting index
  let index = Math.floor(Math.random() * featured.length);

  // First render instant (no fade)
  featuredContainer.innerHTML = templateFor(featured[index]);
  featuredContainer.classList.remove("preloading");
  featuredContainer.classList.add("loaded");
  featuredContainer.style.opacity = "1";

  // Advance index for rotation
  index = (index + 1) % featured.length;

  // Re-enable transitions for later swaps
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      featuredContainer.style.transition = "";
    });
  });

  if (prefersReduced) return;

  let timer = null;

  const rotateOnce = async () => {
    const mod = featured[index];
    await preloadImage(heroImage(mod));
    featuredContainer.classList.add("is-swapping");
    featuredContainer.style.opacity = "0";
    setTimeout(() => {
      featuredContainer.innerHTML = templateFor(mod);
      featuredContainer.style.opacity = "1";
      featuredContainer.classList.remove("is-swapping");
    }, 120);
    index = (index + 1) % featured.length;
  };

  const start = () => { stop(); timer = setInterval(rotateOnce, ROTATE_EVERY); };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

  // Start only after visible + page load + extra delay
  let visible = false;
  const io = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) {
      visible = true;
      io.disconnect();

      const kickoff = () => {
        setTimeout(async () => {
          if (!visible) return;
          await rotateOnce();
          start();
        }, EXTRA_FIRST_DELAY);
      };

      if (document.readyState === "complete") kickoff();
      else window.addEventListener("load", kickoff, { once: true });
    }
  }, { threshold: 0.2 });

  io.observe(featuredContainer);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop(); else start();
  });

  featuredContainer.addEventListener("mouseenter", stop);
  featuredContainer.addEventListener("mouseleave", start);
}

/* ---------- pretty static mod links ---------- */
function getModLink(mod) {
  const slug = makeSlug(mod.name || "");
  return `/mods/${slug}.html`;
}

/* ---------- grids / pagination ---------- */
function displayMods(category) {
  const grid = document.getElementById("modGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const filtered =
    category === "All" || category === "" || category === "all"
      ? allMods
      : allMods.filter(m => Array.isArray(m.tags) && m.tags.includes(category));

  filtered.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

  filtered.slice(0, 20).forEach(mod => {
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
  if (pagination) pagination.innerHTML = "";

  if (!paged.length) {
    grid.innerHTML = "<p style='text-align:center;'>No results found.</p>";
    return;
  }

  paged.forEach(mod => {
    grid.innerHTML += generateModCard(mod);
  });

  if (pagination && totalPages > 1) {
    if (currentPage > 1) {
      pagination.innerHTML += `<a class="back-button" href="${baseUrl}page=${currentPage - 1}">← Prev</a>`;
    }
    pagination.innerHTML += `<span style="margin: 0 10px;">Page ${currentPage} of ${totalPages}</span>`;
    if (currentPage < totalPages) {
      pagination.innerHTML += `<a class="back-button" href="${baseUrl}page=${currentPage + 1}">Next →</a>`;
    }
  }
}

/* ---------- card ---------- */
function generateModCard(mod) {
  const link = getModLink(mod);
  const img = heroImage(mod);
  return `
    <div class="mod-card">
      <a href="${link}">
        <div class="thumb-wrap">
          <img src="${img}" alt="${mod.name}" title="${mod.name}"
               width="400" height="225" loading="lazy" decoding="async">
        </div>
        <div class="mod-info">
          <h3>${mod.name}</h3>
        </div>
      </a>
    </div>
  `;
}

/* ---------- DOM ready ---------- */
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
    searchInput.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchButton.click();
      }
    });
  }

  await fetchMods();
});
