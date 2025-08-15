// mod.js (drop-in)

function toAbsolute(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  // ensure leading slash
  const clean = url.startsWith("/") ? url : `/${url}`;
  return `${location.origin}${clean}`;
}

function unique(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!x) continue;
    const key = x.toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(x); }
  }
  return out;
}

function injectJsonLd(mod, imagesAbs, pageUrlAbs) {
  // Keep your CreativeWork but ensure absolute image URLs
  const json = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": mod.name,
    "description": (mod.description || "").replace(/<[^>]*>/g, "").slice(0, 500),
    "image": imagesAbs,
    "url": pageUrlAbs,
    "author": { "@type": "Person", "name": "BaggedCustoms" }
  };
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(json);
  document.head.appendChild(el);
}

function injectNoScriptImages(mod, imagesAbs) {
  if (!imagesAbs.length) return;
  const nos = document.createElement("noscript");
  let html = '<div class="gallery">';
  for (let i = 0; i < imagesAbs.length; i++) {
    const src = imagesAbs[i];
    const alt = `${mod.name} – image ${i + 1}`;
    // width/height are hints; adjust if you have exact sizes
    html += `<img src="${src}" alt="${alt}" width="1000" height="562" loading="lazy" />`;
  }
  html += "</div>";
  nos.innerHTML = html;
  const main = document.querySelector("main#modContainer") || document.querySelector("main");
  if (main) main.appendChild(nos);
}

function renderMod(mod) {
  const tags = Array.isArray(mod.tags) ? mod.tags.join(', ') : '';

  // --- SEO updates ---
  document.title = `${mod.name} - BaggedCustoms GTA V & FiveM Mod${tags ? ` [${tags}]` : ''}`;

  const metaDesc = document.createElement("meta");
  metaDesc.name = "description";
  metaDesc.content = `${mod.name} — ${(mod.description || "").replace(/<[^>]*>/g, "").slice(0, 160) || "Explore this custom GTA V & FiveM mod."}`;
  document.head.appendChild(metaDesc);

  const metaKeywords = document.createElement("meta");
  metaKeywords.name = "keywords";
  metaKeywords.content = tags;
  document.head.appendChild(metaKeywords);

  // canonical = current URL
  const canonical = document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = location.href;
  document.head.appendChild(canonical);
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
}

async function loadModDetails() {
  // Static page path: use embedded JSON if present
  const dataEl = document.getElementById("modData");
  if (dataEl) {
    try {
      const mod = JSON.parse(dataEl.textContent || "{}");
      if (mod && mod.name) {
        renderMod(mod);
        return;
      }
    } catch (e) {
      // continue
    }
  }

  // Legacy dynamic path: /mod.html?id=...
  const params = new URLSearchParams(location.search);
  const modId = params.get("id");
  if (!modId) {
    document.getElementById("modContainer").innerHTML = "<p>Mod ID missing in URL.</p>";
    return;
  }

  try {
    const res = await fetch("mods.json", { cache: "no-store" });
    const allMods = await res.json();

    const decodedId = decodeURIComponent(modId);
    const mod = allMods.find(m =>
      m.post_id === decodedId ||
      decodeURIComponent(m.name) === decodedId ||
      (m.link && m.link.includes(decodedId))
    );

    if (!mod) {
      document.getElementById("modContainer").innerHTML = "<p>Mod not found.</p>";
      return;
    }

    renderMod(mod);
  } catch (err) {
    document.getElementById("modContainer").innerHTML = `<p>Error loading mod details: ${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadModDetails);
