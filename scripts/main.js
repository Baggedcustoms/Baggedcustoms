let mods = [];
let featuredIndex = 0;

fetch('mods.json')
  .then(response => response.json())
  .then(data => {
    mods = data;
    populateRecentMods();
    cycleFeaturedMod();
    setInterval(cycleFeaturedMod, 5000);
  });

function populateRecentMods() {
  const recentMods = mods.slice(0, 16);
  const grid = document.getElementById('modGrid');
  grid.innerHTML = '';

  recentMods.forEach(mod => {
    const card = document.createElement('div');
    card.className = 'mod-card';
    card.innerHTML = `
      <img src="${mod.image}" alt="${mod.name}">
      <h3>${mod.name}</h3>
      <p>Category: ${mod.category}</p>
      <a href="${mod.link}" target="_blank">
        <button class="download-btn">Download</button>
      </a>
    `;
    grid.appendChild(card);
  });
}

function cycleFeaturedMod() {
  const featuredMods = mods.filter(m => m.tags?.includes("featured"));
  if (featuredMods.length === 0) return;

  const mod = featuredMods[featuredIndex % featuredMods.length];
  featuredIndex++;

  const container = document.getElementById('featuredMod');
  container.innerHTML = `
    <img src="${mod.image}" alt="${mod.name}">
    <h3>${mod.name}</h3>
    <p>Category: ${mod.category}</p>
    <a href="${mod.link}" target="_blank">
      <button class="download-btn">Download</button>
    </a>
  `;
}

function filterMods(category) {
  const filtered = category === 'all'
    ? mods
    : mods.filter(m => m.category === category);

  const grid = document.getElementById('modGrid');
  grid.innerHTML = '';

  filtered.slice(0, 16).forEach(mod => {
    const card = document.createElement('div');
    card.className = 'mod-card';
    card.innerHTML = `
      <img src="${mod.image}" alt="${mod.name}">
      <h3>${mod.name}</h3>
      <p>Category: ${mod.category}</p>
      <a href="${mod.link}" target="_blank">
        <button class="download-btn">Download</button>
      </a>
    `;
    grid.appendChild(card);
  });
}
