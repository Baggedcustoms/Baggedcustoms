// scripts/mod.js

async function loadMod() {
  const params = new URLSearchParams(window.location.search);
  const modId = params.get('id');
  if (!modId) {
    document.getElementById('modContainer').innerHTML = '<p>No mod ID specified.</p>';
    return;
  }

  // Load mods.json
  let mods;
  try {
    const res = await fetch('mods.json');
    mods = await res.json();
  } catch {
    document.getElementById('modContainer').innerHTML = '<p>Failed to load mods data.</p>';
    return;
  }

  // Find mod by id (assuming mod.id or mod.name unique identifier)
  const mod = mods.find(m => m.id === modId || m.name === modId);
  if (!mod) {
    document.getElementById('modContainer').innerHTML = `<p>Mod with ID "${modId}" not found.</p>`;
    return;
  }

  // Build the mod detail HTML
  const container = document.getElementById('modContainer');

  // Images gallery
  let imagesHtml = '';
  if (Array.isArray(mod.images) && mod.images.length > 0) {
    imagesHtml = `<div class="image-gallery">` +
      mod.images.map(img => `<img src="${img}" alt="${mod.name}" class="mod-image">`).join('') +
      `</div>`;
  } else if (mod.image) {
    imagesHtml = `<img src="${mod.image}" alt="${mod.name}" class="mod-image">`;
  }

  container.innerHTML = `
    <h1>${mod.name}</h1>
    ${imagesHtml}
    <p>${mod.description || ''}</p>
    <a href="${mod.link}" class="download-button" target="_blank" rel="noopener noreferrer">Download on Patreon</a>
  `;
}

document.addEventListener('DOMContentLoaded', loadMod);
