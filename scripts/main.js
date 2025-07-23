let mods = [];

function renderMods(category = 'all') {
  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";

  const filtered = category === "all" ? mods : mods.filter(mod => mod.category === category);
  filtered.forEach(mod => {
    const card = document.createElement("div");
    card.className = "mod-card";
    card.innerHTML = `
      <img src="${mod.image}" alt="${mod.title}" />
      <div class="mod-title">${mod.title}</div>
      <div class="mod-category">Category: ${mod.category}</div>
      <a class="download-btn" href="${mod.download}" target="_blank">Download</a>
    `;
    grid.appendChild(card);
  });
}

function renderFeatured() {
  const wrapper = document.getElementById("featuredMods");
  wrapper.innerHTML = "";

  const featured = mods.filter(mod => mod.featured);
  if (featured.length === 0) return;

  const main = featured[0];
  const side = featured.slice(1, 5); // Show up to 4 in side

  const mainHTML = `
    <div class="featured-main">
      <img src="${main.image}" alt="${main.title}" />
      <div class="mod-title">${main.title}</div>
      <div class="mod-category">Category: ${main.category}</div>
      <a class="download-btn" href="${main.download}" target="_blank">Download</a>
    </div>
  `;

  const sideHTML = `
    <div class="featured-side">
      ${side.map(mod => `
        <div class="featured-small-card">
          <strong>${mod.title}</strong><br/>
          <small>${mod.category}</small>
        </div>
      `).join('')}
    </div>
  `;

  wrapper.innerHTML = mainHTML + sideHTML;
}

function setupFilters() {
  document.querySelectorAll(".filter-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-buttons button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const category = btn.getAttribute("data-category");
      renderMods(category);
    });
  });
}

fetch("mods.json")
  .then(res => res.json())
  .then(data => {
    mods = data;
    renderMods("all");
    renderFeatured();
    setupFilters();
  });
