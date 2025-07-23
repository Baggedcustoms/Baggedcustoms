let allMods = [];
let featuredMods = [];
let featuredIndex = 0;

function loadMods() {
  fetch('mods.json')
    .then(response => response.json())
    .then(data => {
      allMods = data;
      featuredMods = data.filter(mod => mod.featured);
      displayFeatured(); // Start rotating
      displayMods(data);
    });
}

function displayFeatured() {
  if (featuredMods.length === 0) return;

  const mod = featuredMods[featuredIndex];
  const container = document.getElementById('featuredMod');

  container.innerHTML = `
    <img src="${mod.image}" alt="${mod.title}" />
    <h3>${mod.title}</h3>
    <p>Category: ${mod.category}</p>
    <a class="download" href="${mod.download}" target="_blank">Download</a>
  `;

  // Move to next after 5s
  featuredIndex = (featuredIndex + 1) % featuredMods.length;
  setTimeout(displayFeatured, 5000);
}

function displayMods(mods) {
  const container = document.getElementById('modGrid');
  container.innerHTML = "";

  mods.forEach(mod => {
    container.innerHTML += `
      <div class="mod-card">
        <img src="${mod.image}" alt="${mod.title}" />
        <h3>${mod.title}</h3>
        <p>Category: ${mod.category}</p>
        <a class="download" href="${mod.download}" target="_blank">Download</a>
      </div>
    `;
  });
}

function filterMods(category) {
  if (category === 'all') {
    displayMods(allMods);
  } else {
    const filtered = allMods.filter(mod => mod.category === category);
    displayMods(filtered);
  }
}

document.addEventListener("DOMContentLoaded", loadMods);
