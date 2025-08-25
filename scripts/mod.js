// ======================= mod.js (drop-in) =======================

// ---------- utils ----------
function toAbsolute(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const clean = url.startsWith("/") ? url : `/${url}`;
  return `${location.origin}${clean}`;
}

function unique(arr) {
  const seen = new Set();
  const out = [];
  for (const x of (arr || [])) {
    if (!x) continue;
    const key = String(x).toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(x); }
  }
  return out;
}

// ---------- SEO helpers ----------
function injectJsonLd(mod, imagesAbs, pageUrlAbs) {
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": mod.name,
    "description": (mod.description || "").replace(/<[^>]*>/g, "").slice(0, 500),
    "image": imagesAbs,
    "url": pageUrlAbs,
    "author": { "@type": "Person", "name": "BaggedCustoms" }
  });
  document.head.appendChild(el);
}

function injectNoScriptImages(mod, imagesAbs) {
  if (!imagesAbs.length) return;
  const nos = document.createElement("noscript");
  let html = '<div class="gallery">';
  for (let i = 0; i < imagesAbs.length; i++) {
    const src = imagesAbs[i];
    const alt = `${mod.name} – image ${i + 1}`;
    html += `<img src="${src}" alt="${alt}" width="1000" height="562" loading="lazy" />`;
  }
  html += "</div>";
  nos.innerHTML = html;
  const main = document.getElementById("modContainer") || document.querySelector("main");
  if (main) main.appendChild(nos);
}

// ---------- main renderer ----------
function renderMod(mod) {
  const tags = Array.isArray(mod.tags) ? mod.tags.join(', ') : '';

  // --- SEO updates ---
  document.title = `${mod.name} - BaggedCustoms GTA V & FiveM Mod${tags ? ` [${tags}]` : ''}`;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
  metaDesc.content = `${mod.name} — ${(mod.description || "").replace(/<[^>]*>/g, "").slice(0, 160) || "Explore this custom GTA V & FiveM mod."}`;

  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) { metaKeywords = document.createElement("meta"); metaKeywords.name = "keywords"; document.head.appendChild(metaKeywords); }
  metaKeywords.content = tags;

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
  canonical.href = location.href;
  // -------------------

  // Build image lists
  const mainImageUrl = mod.image || (Array.isArray(mod.images) && mod.images[0]) || "";
  let gallery = Array.isArray(mod.images) ? mod.images.slice() : [];
  if (mainImageUrl) gallery.unshift(mainImageUrl); // ensure main first
  gallery = unique(gallery);

  // Absolute URLs for SEO & Bing
  const galleryAbs = gallery.map(toAbsolute);

  const container = document.getElementById("modContainer");
  const otherImages = gallery.filter((img, idx) => idx > 0);
  container.innerHTML = `
    <h1 style="text-align:center; margin-bottom: 20px;">${mod.name}</h1>

    <div id="mainImageWrapper" style="text-align:center; margin-bottom: 20px;">
      <img id="mainImage"
           src="${gallery[0] || ""}"
           alt="${mod.name} Main Preview"
           title="${mod.name} Main Preview"
           style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 0 15px #c9501d;" />
    </div>

    <div id="thumbnailContainer" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">
      ${otherImages.map((img, idx) => `
        <img class="thumb"
             src="${img}"
             alt="${mod.name} Thumbnail ${idx + 1}"
             title="${mod.name} Thumbnail ${idx + 1}"
             loading="lazy"
             style="width: 100px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer;" />
      `).join("")}
    </div>

    <div style="text-align:center; margin-bottom: 20px; font-size: 14px; color: #ccc;">
      ${mod.link ? `<a href="${mod.link}" target="_blank" rel="noopener noreferrer" style="background-color: #e0611f; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Download on Patreon</a>` : ``}
    </div>

    <div style="font-size: 14px; line-height: 1.6; max-width: 700px; margin: auto; color: #ddd;">
      ${mod.description || ""}
      ${tags ? `<p style="margin-top: 20px; font-size: 13px; color: #888;"><strong>Tags:</strong> ${tags}</p>` : ""}
    </div>
  `;

  // Click-to-swap
  const mainImage = document.getElementById("mainImage");
  container.querySelectorAll(".thumb").forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      mainImage.src = thumb.src;
      mainImage.alt = `${mod.name} Thumbnail ${index + 1}`;
      mainImage.title = `${mod.name} Thumbnail ${index + 1}`;
    });
  });

  // --- NEW: noscript fallback & JSON-LD with absolute image URLs ---
  injectNoScriptImages(mod, galleryAbs);
  injectJsonLd(mod, galleryAbs, location.href);

  // 🔗 Hook: add related/continue after render
  if (window.__bcInjectRelatedNav) window.__bcInjectRelatedNav(mod);
}

async function loadModDetails() {
  // Static page path: use embedded JSON if present
  const dataEl = document.getElementById("modData");
  if (dataEl) {
    try {
      const mod = JSON.parse(dataEl.textContent || "{}");
      if (mod && mod.name) { renderMod(mod); return; }
    } catch (e) { /* continue */ }
  }

  // Legacy dynamic path: /mod.html?id=...
  const params = new URLSearchParams(location.search);
  const modId = params.get("id");
  if (!modId) {
    (document.getElementById("modContainer") || document.body).innerHTML = "<p>Mod ID missing in URL.</p>";
    return;
  }

  try {
    // ✅ root-relative path (works from /mods/ pages)
    const res = await fetch("/mods.json", { cache: "no-store" });
    const allMods = await res.json();

    const decodedId = decodeURIComponent(modId);
    const mod = allMods.find(m =>
      m.post_id === decodedId ||
      decodeURIComponent(m.name || "") === decodedId ||
      (m.link && m.link.includes(decodedId))
    );

    if (!mod) {
      (document.getElementById("modContainer") || document.body).innerHTML = "<p>Mod not found.</p>";
      return;
    }

    renderMod(mod);
  } catch (err) {
    (document.getElementById("modContainer") || document.body).innerHTML = `<p>Error loading mod details: ${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadModDetails);

// =================== Related Mods Only (history-aware + variety) ===================
(function () {
  const RELATED_LIMIT = 4;
  const DEV_TIER_TAGS = new Set(["prime assets", "gear head assets", "dev", "wip"]);
  const HISTORY_KEY = "bcRecentMods";
  const HISTORY_KEEP = 5;

  // same slugger as main.js
  function makeSlug(s) {
    if (!s) return "mod";
    s = s.replace(/[^\p{L}\p{N}\s-]+/gu, "");
    s = s.trim().toLowerCase();
    s = s.replace(/\s+/g, "-").replace(/-+/g, "-");
    return s || "mod";
  }

  const slugFromPath = () =>
    (location.pathname.toLowerCase().match(/\/mods\/([^\/]+)\.html$/i) || [,""])[1];

  const hasDevTier = (m) => (m.tags||[])
    .map(t=>String(t).toLowerCase())
    .some(t=>DEV_TIER_TAGS.has(t));

  const imgSrc = (m) =>
    m.image || (Array.isArray(m.images) && m.images[0]) || m.banner || "/images/placeholder.webp";
  const imgSrcAbs = (m) => toAbsolute(imgSrc(m));

  // same linking rule as main.js
  function modHref(m) {
    const slug = makeSlug(m.name || m.title || "");
    return `/mods/${slug}.html`;
  }

  // recent history (per-tab)
  function getRecentSlugs() {
    try {
      const arr = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(arr) ? arr.slice(-HISTORY_KEEP) : [];
    } catch { return []; }
  }
  function pushRecentSlug(slug) {
    try {
      const arr = getRecentSlugs().filter(s => s && s !== slug);
      arr.push(slug);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(-HISTORY_KEEP)));
    } catch {}
  }

  function isSameMod(currSlug, curr, m) {
    const s1 = currSlug || makeSlug(curr?.name || curr?.title || "");
    const s2 = makeSlug(m?.name || m?.title || "");
    if (s1 && s2 && s1 === s2) return true;
    if ((curr?.post_id) && (m?.post_id) && String(curr.post_id) === String(m.post_id)) return true;
    return false;
  }

  const byDate = (a,b) =>
    (new Date(b.date||b.updated||b.created||0) - new Date(a.date||a.updated||a.created||0)) ||
    String(a.name||a.title).localeCompare(String(b.name||b.title));

  // light “relatedness” score
  const jaccard = (a=[],b=[]) => {
    const A = new Set(a.map(x=>String(x).toLowerCase()));
    const B = new Set(b.map(x=>String(x).toLowerCase()));
    const inter = [...A].filter(x=>B.has(x)).length;
    const uni = new Set([...A, ...B]).size || 1;
    return inter / uni;
  };
  const scoreRelated = (curr, cand) => {
    let s = 0;
    s += Math.round(5 * jaccard(curr.tags||[], cand.tags||[]));
    if (cand.date||cand.updated) s += 0.5;
    return s;
  };

  // seeded shuffle for variety (stable per page)
  function hash32(str) {
    let h = 2166136261 >>> 0;
    for (let i=0; i<str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function seededShuffle(arr, seed) {
    const a = arr.slice();
    let s = seed >>> 0;
    for (let i=a.length-1; i>0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i+1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // minimal styles (cards & grid). Your CSS overrides for hover glow still apply.
  function ensureStyles() {
    if (document.getElementById("mod-nav-styles")) return;
    const css = `
      .mod-nav { margin-top: 22px; }
      .related-mods { margin-top: 22px; }
      .rel-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap:12px; }
      .rel-card { display:flex; flex-direction:column; background:#121212; border-radius:16px; overflow:hidden; text-decoration:none;
                  border:1px solid rgba(255,255,255,0.06); transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
      .rel-card:hover { transform: translateY(-2px); }
      .rel-thumb { aspect-ratio:16/9; overflow:hidden; }
      .rel-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
      .rel-meta { padding:10px 12px 12px; }
      .rel-title { font-size:.98rem; margin:2px 0 8px; line-height:1.2; color:#fff; }
      .section-title { font-size:1.1rem; margin: 14px 0; text-align:center; }
    `;
    const el = document.createElement("style");
    el.id = "mod-nav-styles";
    el.textContent = css;
    document.head.appendChild(el);
  }

  const cardHTML = (m) => `
    <a class="rel-card" href="${modHref(m)}">
      <div class="rel-thumb">
        <img loading="lazy"
             src="${imgSrcAbs(m)}"
             alt="${(m.name||m.title||"").replace(/"/g,'&quot;')}"
             width="640" height="360"
             onerror="this.onerror=null;this.src='/images/placeholder.webp';">
      </div>
      <div class="rel-meta">
        <div class="rel-title">${m.name||m.title||"View mod"}</div>
      </div>
    </a>
  `;

  // exposed: called after renderMod(mod)
  window.__bcInjectRelatedNav = async function(currentMod) {
    try {
      const res = await fetch("/mods.json", { cache: "no-store" });
      const raw = await res.json();
      const list = Array.isArray(raw.mods) ? raw.mods : (Array.isArray(raw) ? raw : []);
      if (!list.length) return;

      const pageSlug = slugFromPath();
      const current = { ...currentMod };

      if (pageSlug) pushRecentSlug(pageSlug);
      const recent = new Set(getRecentSlugs());

      // Score all candidates; exclude dev tier, current page, and last few visited
      const scored = list
        .filter(m => !hasDevTier(m)
          && !isSameMod(pageSlug, current, m)
          && !recent.has(makeSlug(m.name||m.title||"")))
        .map(m => ({ m, s: scoreRelated(current, m) }))
        .sort((a,b)=> (b.s - a.s) || byDate(a.m, b.m));

      // Variety: seeded shuffle of a top pool, then pick 4
      const seed = hash32((pageSlug || makeSlug(current.name||current.title||"")) + "|related");
      const pool = scored.slice(0, 16).map(x => x.m);
      const pick = seededShuffle(pool, seed).slice(0, RELATED_LIMIT);
      if (!pick.length) return;

      ensureStyles();
      const mount = document.getElementById("modContainer") || document.querySelector("main") || document.body;
      const shell = document.createElement("section");
      shell.className = "mod-nav";

      const wrap = document.createElement("section");
      wrap.className = "related-mods";
      wrap.innerHTML = `
        <h2 class="section-title">Related Mods</h2>
        <div class="rel-grid">
          ${pick.map(cardHTML).join("")}
        </div>`;
      shell.appendChild(wrap);

      mount.appendChild(shell);
    } catch (e) {
      console.error("Related injection failed:", e);
    }
  };
})();
