let allMods = [];
let featuredIndex = 0;
let featuredMods = [];

async function loadMods() {
  const res = await fetch('mods.json');
  allMods = await res.json();

  featuredMods = allMods.filter(mod => mod.featured);
  populateFeatured();
  populateMods(allMods);
}

function populateFeatured() {
  const main = document.getElementById('main-featured');
  const side = document.getElementById('featured-side');
  if (!featuredMods.length) return;

  const currentMain = featuredMods[featuredIndex];
  const sideMods = featuredMods.filter((_, i) => i !== featuredIndex).slice(0, 4);

  main.innerHTML = createFeaturedCard(currentMain);
  side.innerHTML = sideMods.map(createSideCard).join('');

  featuredIndex = (featuredIndex + 1) % featuredMods.length;
  setTimeout(populateFeatured, 6000);
}

function createFeaturedCard(mod) {
  return `
    <div class="featured-card">
      <img src="${mod.image}" alt="${mod.title}">
      <div class="info">
        <h3>${mod.title}</h3>
        <p>Category: ${mod.category}</p>
        <a href="${mod.download}" target="_blank">Download</a>
      </div>
    </div>
  `;
}

function createSideCard(mod) {
  return `
    <div class="featured-card">
      <img src="${mod.image}" alt="${mod.title}">
      <div class="info">
        <h3>${mod.title}</h3>
        <p>${mod.category}</p>
        <a href="${mod.download}" target="_blank">Download</a>
      </div>
    </div>
  `;
}

function populateMods(mods) {
  const container = document.getElementById('mod-grid');
  container.innerHTML = mods.map(mod => `
    <div class="mod-card">
      <img src="${mod.image}" alt="${mod.title}">
      <div class="info">
        <h3>${mod.title}</h3>
        <p>Category: ${mod.category}</p>
        <a href="${mod.download}" target="_blank">Download</a>
      </div>
    </div>
  `).join('');
}

function filterMods(category) {
  if (category === 'all') {
    populateMods(allMods);
  } else {
    populateMods(allMods.filter(mod => mod.category === category));
  }
}

document.addEventListener('DOMContentLoaded', loadMods);
