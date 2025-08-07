async function loadModDetails() {
  const params = new URLSearchParams(window.location.search);
  const modId = params.get("id");
  if (!modId) {
    document.getElementById("modContainer").innerHTML = "<p>Mod ID missing in URL.</p>";
    return;
  }

  try {
    const res = await fetch("mods.json");
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

    // === SEO ENHANCEMENTS ===
    const tags = Array.isArray(mod.tags) ? mod.tags.join(', ') : '';
    document.title = `${mod.name} - BaggedCustoms GTA V & FiveM Mod${tags ? ` [${tags}]` : ''}`;

    const metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    metaDesc.content = `${mod.name} — ${mod.description?.slice(0, 150) || "Explore this custom GTA V & FiveM mod."}`;
    document.head.appendChild(metaDesc);

    const metaKeywords = document.createElement("meta");
    metaKeywords.name = "keywords";
    metaKeywords.content = tags;
    document.head.appendChild(metaKeywords);

    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = window.location.href;
    document.head.appendChild(canonical);
    // =======================

    const mainImageUrl = mod.image || (mod.images && mod.images[0]) || "";
    let images = [];

    if (Array.isArray(mod.images) && mod.images.length > 0) {
      images = mod.images.filter(img => img !== mainImageUrl);
    }

    const container = document.getElementById("modContainer");

    container.innerHTML = `
      <h1 style="text-align:center; margin-bottom: 20px; color:#e0611f;">${mod.name}</h1>

      <div id="mainImageWrapper" style="text-align:center; margin-bottom: 20px;">
        <img id="mainImage" 
             src="${mainImageUrl}" 
             alt="${mod.name} Main Preview" 
             title="${mod.name} Main Preview" 
             style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 0 15px #c9501d;" />
      </div>

      <div id="thumbnailContainer" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">
        ${images.map((img, idx) => `
  <img class="thumb" 
       src="${img}" 
       alt="${mod.name} Thumbnail ${idx + 1}" 
       title="${mod.name} Thumbnail ${idx + 1}" 
       loading="lazy"
       style="width: 100px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer;" />
`).join("")}
      </div>

      <div style="text-align:center; margin-bottom: 20px; font-size: 14px; color: #ccc;">
        <a href="${mod.link}" target="_blank" rel="noopener noreferrer" style="background-color: #e0611f; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Download on Patreon</a>
      </div>

      <div style="font-size: 14px; line-height: 1.6; max-width: 700px; margin: auto; color: #ddd;">
        ${mod.description || ""}
        ${tags ? `<p style="margin-top: 20px; font-size: 13px; color: #888;"><strong>Tags:</strong> ${tags}</p>` : ""}
      </div>
    `;

    const mainImage = document.getElementById("mainImage");
    const thumbnails = container.querySelectorAll(".thumb");
    thumbnails.forEach((thumb, index) => {
      thumb.addEventListener("click", () => {
        mainImage.src = thumb.src;
        mainImage.alt = `${mod.name} Thumbnail ${index + 1}`;
        mainImage.title = `${mod.name} Thumbnail ${index + 1}`;
      });
    });

  } catch (err) {
    document.getElementById("modContainer").innerHTML = `<p>Error loading mod details: ${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadModDetails);
