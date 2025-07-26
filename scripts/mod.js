// mod.js

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

    // Find the mod by matching the encoded id param
    const decodedId = decodeURIComponent(modId);
    const mod = allMods.find(m => decodeURIComponent(m.name) === decodedId);

    if (!mod) {
      document.getElementById("modContainer").innerHTML = "<p>Mod not found.</p>";
      return;
    }

    // Build main image section
    const mainImageUrl = mod.image || (mod.images && mod.images[0]) || "";
    let images = [];

    // Prepare array of images for thumbnails (excluding main image if duplicates)
    if (Array.isArray(mod.images) && mod.images.length > 0) {
      images = mod.images.filter(img => img !== mainImageUrl);
    }

    const container = document.getElementById("modContainer");

    container.innerHTML = `
      <h1 style="text-align:center; margin-bottom: 20px; color:#e0611f;">${mod.name}</h1>

      <div id="mainImageWrapper" style="text-align:center; margin-bottom: 20px;">
        <img id="mainImage" src="${mainImageUrl}" alt="${mod.name}" style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 0 15px #c9501d;" />
      </div>

      <div id="thumbnailContainer" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">
        ${images.map((img, idx) => `
          <img class="thumb" src="${img}" alt="Thumbnail ${idx+1}" style="width: 100px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer; box-shadow: 0 0 6px #c9501d;" />
        `).join("")}
      </div>

      <div style="text-align:center; margin-bottom: 20px; font-size: 14px; color: #ccc;">
        <a href="${mod.link}" target="_blank" rel="noopener noreferrer" style="background-color: #e0611f; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Download on Patreon</a>
      </div>

      <div style="font-size: 14px; line-height: 1.6; max-width: 700px; margin: auto; color: #ddd;">
        ${mod.description || ""}
      </div>
    `;

    // Thumbnail click swap logic
    const mainImage = document.getElementById("mainImage");
    const thumbnails = container.querySelectorAll(".thumb");
    thumbnails.forEach(thumb => {
      thumb.addEventListener("click", () => {
        mainImage.src = thumb.src;
      });
    });

  } catch (err) {
    document.getElementById("modContainer").innerHTML = `<p>Error loading mod details: ${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadModDetails);
