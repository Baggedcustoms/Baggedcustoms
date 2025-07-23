let mods = [];
let featuredMods = [];
let currentFeaturedIndex = 0;

// Fetch mods.json
fetch('data/mods.json')
  .then(response => response.json())
  .then(data => {
    mods = data;
    featuredMods = mods.slice(0, 5); // First 5 as featured
    filterMods("all");
    setupFeaturedRotation();
  })
  .catch(err => console.error("Failed to load mods.json:", err));

// Filter logic
function filterMods(category) {
  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";

  const filtered = category === "all" ? mods : mods.filter(mod => mod.category === category);
  filtered.forEach(mod => {
    const card = document.createElement("div");
    card.className = "mod-card";
    card.innerHTML = `
      <img src="${mod.image}" alt="${mod.title}">
      <div class="mod-title">${mod.title}</div>
      <div class="mod-category">Category: ${mod.category}</div>
      <button class="download-btn">Download</button>
    `;
    grid.appendChild(card);
  });
}

// Populate main featured mod
function populateFeaturedMain(mod) {
  const featuredMain = document.querySelector(".featured-main");
  featuredMain.innerHTML = `
    <img src="${mod.image}" alt="${mod.title}" />
    <div class="mod-title">${mod.title}</div>
    <div class="mod-category">Category: ${mod.category}</div>
    <button class="download-btn">Download</button>
  `;
}

// Populate 4 small featured cards
function populateFeaturedSide(modsSubset) {
  const sideContainer = document.querySelector(".featured-side");
  sideContainer.innerHTML = "";

  modsSubset.forEach((mod, index) => {
    const card = document.createElement("div");
    card.className = "featured-small-card";
    card.innerHTML = `
      <strong>Featured Mod</strong><br>
      ${mod.title}<br>
      <small>${mod.category}</small>
    `;
    card.onclick = () => {
      currentFeaturedIndex = mods.indexOf(mod);
      populateFeaturedMain(mod);
    };
    sideContainer.appendChild(card);
  });
}

// Rotate featured mods every 10s
function setupFeaturedRotation() {
  populateFeaturedMain(featuredMods[0]);
  populateFeaturedSide(featuredMods.slice(1));

  setInterval(() => {
    currentFeaturedIndex = (currentFeaturedIndex + 1) % featuredMods.length;
    const reordered = [...featuredMods];
    const nextMain = reordered.splice(currentFeaturedIndex, 1)[0];
    populateFeaturedMain(nextMain);
    populateFeaturedSide(reordered);
  }, 10000);
}
