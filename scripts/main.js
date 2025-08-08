<script>
let allMods = [];
const pageSize = 15;

/* ---------- utils ---------- */
function makeSlug(s) {
  if (!s) return "mod";
  s = s.replace(/[^\p{L}\p{N}\s-]+/gu, "");
  s = s.trim().toLowerCase();
  s = s.replace(/\s+/g, "-");
  s = s.replace(/-+/g, "-");
  return s || "mod";
}

/* ---------- fetch + prep mods ---------- */
async function fetchMods() {
  const res = await fetch("mods.json", { cache: "no-store" });
  allMods = await res.json();

  const exclusions = ["z3d", "example1", "example2"];
  const tagExclusions = ["Prime Assets", "GearHead Assets"];

  allMods = allMods.filter(mod => {
    const name = (mod.name || "").toLowerCase();
    const nameExcluded = exclusions.some(keyword => name.includes(keyword.toLowerCase()));
    const tagsExcluded =
      Array.isArray(mod.tags) &&
      mod.tags.some(tag =>
        tagExclusions.some(excludedTag => tag.toLowerCase() === excludedTag.toLowerCase())
      );
    return !nameExcluded && !tagsExcluded;
  });

  const tagSet = new Set();
  allMods.forEach(mod => Array.isArray(mod.tags) && mod.tags.forEach(tag => tagSet.add(tag)));
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

    const filtered =
      category === "" || category === "all"
        ? allMods.filter(mod => Array.isArray(mod.tags) && mod.tags.length > 0)
        : allMods.filter(mod => Array.isArray(mod.tags) && mod.tags.includes(category));

    document.getElementById("categoryTitle").textContent =
      category === "" || category === "all" ? "All Categories" : category;
    displayPagedMods(filtered, page, `category.html?cat=${encodeURIComponent(category)}&`);
  } else if (path.includes("search.html")) {
    const query = params.get("q")?.toLowerCase() || "";
    const page = parseInt(params.get("page")) || 1;

    const filtered = allMods.filter(
      mod =>
        (mod.name || "").toLowerCase().includes(query) ||
        (mod.tags && mod.tags.some(t => t.toLowerCase().includes(query)))
    );

    document.getElementById("searchTitle").textContent = `Search: "${query}"`;
    displayPagedMods(filtered, page, `search.html?q=${encodeURIComponent(query)}&`);
  }
}

async function preloadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = resolve;
    img.src = src;
  });
}

/* ---------- featured (no fade on first paint, delayed rotation) ---------- */
async function displayFeatured() {
  const featured = allMods.filter(mod => mod.featured);
  if (!featured.length) return;

  const EXTRA_FIRST_DELAY = 3000; // wait after full load before starting rotation
  const ROTATE_EVERY = 5000;      // normal cadence
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  let timer = null;
  let firstPaint = true;

  const featuredContainer = document.getElementById("featuredMod");
  if (!featuredContainer) return;

  function modHTML(mod, link) {
    return `
      <a href="${link}" style="text-decoration:none; color: inherit;">
        <img src="${mod.image}" alt="${mod.name}" title="${mod.name}">
        <div class="featured-text">
          <div class="title">${mod.name}</div>
          ${
            mod.category && mod.category.toLowerCase() !== "uncategorized"
              ? `<div class="category">${mod.category}</div>`
              : ""
          }
        </div>
      </a>
    `;
  }

  async function renderFeatured() {
    const mod = featured[index];
    await preloadImage(mod.image);
    const link = getModLink(mod);

    if (firstPaint) {
      // Show immediately on first paint — no opacity changes, no extra classes.
      featuredContainer.innerHTML = modHTML(mod, link);
      firstPaint = false;
    } else {
      // Fade only on swaps
      featuredContainer.classList.add("is-swapping");
      featuredContainer.style.opacity = 0;

      // small timeout lets the opacity=0 apply before we swap content
      setTimeout(() => {
        featuredContainer.innerHTML = modHTML(mod, link);
        featuredContainer.style.opacity = 1;

        const off = () => {
          featuredContainer.classList.remove("is-swapping");
          featuredContainer.removeEventListener("transitionend", off);
        };
        // remove helper class once fade completes (in case you ever add CSS transitions)
        featuredContainer.addEventListener("transitionend", off);
      }, 50);
    }

    index = (index + 1) % featured.length;
  }

  function rotateOnce() { renderFeatured(); }
  function startInterval() { stopInterval(); timer = setInterval(rotateOnce, ROTATE_EVERY); }
  function stopInterval() { if (timer) { clearInterval(timer); timer = null; } }

  // First render immediately (no cycling, no fade)
  await renderFeatured();

  // Respect reduced motion: show first card and stop.
  if (prefersReduced) return;

  // Only start cycling after it's on-screen AND page fully loaded, then delay a bit
  let visible = false;
  const startWhenReady = () => {
    const kickoff = () => {
      setTimeout(() => {
        if (visible) { rotateOnce(); startInterval(); }
      }, EXTRA_FIRST_DELAY);
    };
    if (document.readyState === 'complete') kickoff();
    else window.addEventListener('load', kickoff, { once: true });
  };

  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      visible = true;
      io.disconnect();
      startWhenReady();
    }
  }, { threshold: 0.2 });
  io.observe(featuredContainer);

  // Pause on tab hidden / resume on visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopInterval(); else startInterval();
  });

  // Pause on hover so users can read
  featuredContainer.addEventListener('mouseenter', stopInterval);
  featuredContainer.addEventListener('mouseleave', startInterval);
}

/* ---------- always use pretty static page ---------- */
function getModLink(mod) {
  const slug = makeSlug(mod.name || "");
  return `/mods/${slug}.html`;
}

/* ---------- grids / pagination ---------- */
function displayMods(category) {
  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";

  const filtered =
    category === "All" || category === "" || category === "all"
      ? allMods
      : allMods.filter(mod => Array.isArray(mod.tags) && mod.tags.includes(category));

  filtered.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
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

/* ---------- card ---------- */
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
      if (e.key === "Enter") searchButton.click();
    });
  }

  await fetchMods(); // render with static pretty links
});
</script>
