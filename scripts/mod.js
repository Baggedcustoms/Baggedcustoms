async function loadMod() {
  const params = new URLSearchParams(window.location.search);
  const modId = params.get('id');
  if (!modId) return;

  const res = await fetch("mods.json");
  const mods = await res.json();
  const mod = mods.find(m => m.id === modId);
  if (!mod) return;

  const container = document.getElementById("modContainer");

  let imagesHTML = '';
  for (const img of mod.images) {
    imagesHTML += `<img src="images/${mod.id}/${img}" alt="${mod.name}" class="mod-image">`;
  }

  const videoHTML = mod.video ? `
    <div class="video-container">
      <iframe src="https://www.youtube.com/embed/${mod.video}" frameborder="0" allowfullscreen></iframe>
    </div>
  ` : '';

  const uvLink = mod.uv ? `<a href="${mod.uv}" class="download-button" target="_blank">Download UV Template</a>` : '';
  const dlLink = mod.download ? `<a href="${mod.download}" class="download-button" target="_blank">Download Mod</a>` : '';

  container.innerHTML = `
    <h1>${mod.name}</h1>
    <p>${mod.description}</p>
    <div class="image-gallery">${imagesHTML}</div>
    ${videoHTML}
    <div class="mod-links">
      ${uvLink}
      ${dlLink}
    </div>
  `;
}

loadMod();
