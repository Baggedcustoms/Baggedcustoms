let mods = [];
let featuredIndex = 0;

async function fetchMods() {
  const response = await fetch("mods.json");
  mods = await response.json();
  populateMods(mods);
  setupFeatured(mods.slice(0, 5));
}

function populateMods(modsList) {
  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";

  modsList.forEach(mod => {
    const card = document.createElement("div");
    card.className = "mod-card";
    card.innerHTML = `
      <img src="${mod.image}" alt="${mod.title}">
      <h3>${mod.title}</h3>
      <p>Category: ${mod.category}</p>
      <button>Download</button>
    `;
    grid.appendChild(card);
  });
}

function setupFeatured(featuredMods) {
  const main = document.getElementById("featuredMain");
  const side = document.getElementById("featuredSide");

  function renderMain(index) {
    const mod = featuredMods[index];
    main.innerHTML = `
      <img src="${mod.image}" alt="${mod.title}">
      <h3>${mod.title}</h3>
      <p>Category: ${mod.category}</p>
      <button>Download</button>
    `;
  }

  function renderSide() {
    side.innerHTML = "";
    featuredMods.forEach((mod, index) => {
      if (index !== featuredIndex) {
        const img = document.createElement("img");
        img.src = mod.image;
        img.alt = "";
        img.onclick = () => {
          featuredIndex = index;
          renderMain(index);
          renderSide();
        };
        side.appendChild(img);
      }
    });
  }

  renderMain(featuredIndex);
  renderSide();

  setInterval(() => {
    featuredIndex = (featuredIndex + 1) % featuredMods.length;
    renderMain(featuredIndex);
    renderSide();
  }, 7000);
}

function filterMods(category) {
  if (category === "all") {
    populateMods(mods);
  } else {
    const filtered = mods.filter(mod => mod.category === category);
    populateMods(filtered);
  }
}

window.onload = fetchMods;
