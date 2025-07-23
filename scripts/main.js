let allMods = [];

async function fetchMods() {
  const res = await fetch("mods.json");
  allMods = await res.json();
  displayFeatured();
  displayMods("All");
}

function displayFeatured() {
  const featured = allMods.filter(mod => mod.featured);
  let index = 0;

  const featuredContainer = document.getElementById("featuredMod");

  function renderFeatured() {
    const mod = featured[index];
    featuredContainer.innerHTML = `
      <img src="${mod.image}" alt="${mod.title}">
      <div class="title">${mod.title}</div>
      <div class="category">Category: ${mod.category}</div>
      <a href="${mod.download}" class="download-button" target="_blank">Download</a>
    `;

    index = (index + 1) % featured.length;
  }

  renderFeatured();
  setInterval(renderFeatured, 5000); // cycle every 5 seconds
}

function displayMods(category) {
  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";

  const modsToShow = allMods
    .filter(mod => category === "All" || mod.category === category)
    .slice(0, 16);

  modsToShow.forEach(mod => {
    const card = document.createElement("div");
    card.className = "mod-card";

    card.innerHTML = `
      <img src="${mod.image}" alt="${mod.title}">
      <div class="title">${mod.title}</div>
      <div class="category">Category: ${mod.category}</div>
      <a href="${mod.download}" class="download-button" target="_blank">Download</a>
    `;

    grid.appendChild(card);
  });
}

function filterMods(category) {
  displayMods(category);
}

fetchMods();
