let mods = [];

function fetchMods() {
  fetch("mods.json")
    .then(response => response.json())
    .then(data => {
      mods = data;
      renderFeatured();
      renderRecent();
    })
    .catch(err => {
      console.error("Failed to load mods.json:", err);
    });
}

function renderFeatured() {
  const mainSpot = document.getElementById("featured-main");
  const sideSpots = document.getElementById("featured-side");
  const featuredMods = mods.filter(mod => mod.featured);

  if (featuredMods.length === 0) return;

  // Display first featured in main, others on side
  let currentIndex = 0;
  function showMain(index) {
    const mod = featuredMods[index];
    mainSpot.innerHTML = `
      <div class="mod-card featured-main-card">
        <img src="${mod.image}" alt="${mod.title}">
        <div class="mod-title">${mod.title}</div>
        <div class="mod-category">Category: ${mod.category}</div>
        <a class="download-btn" href="${mod.download}" target="_blank">Download</a>
      </div>
    `;
  }

  function showSideMods() {
    sideSpots.innerHTML = "";
    featuredMods.forEach((mod, idx) => {
      if (idx === currentIndex) return; // skip the one already in spotlight
      const card = document.createElement("div");
      card.className = "mod-card featured-side-card";
      card.innerHTML = `
        <img src="${mod.image}" alt="${mod.title}">
        <div class="mod-title">${mod.title}</div>
        <div class="mod-category">${mod.category}</div>
      `;
      card.addEventListener("click", () => {
        currentIndex = idx;
        showMain(currentIndex);
        showSideMods();
      });
      sideSpots.appendChild(card);
    });
  }

  showMain(currentIndex);
  showSideMods();

  // Cycle automatically every 6 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % featuredMods.length;
    showMain(currentIndex);
    showSideMods();
  }, 6000);
}

function renderRecent() {
  const grid = document.getElementById("modGrid");
  grid.innerHTML = "";

  const recentMods = mods.slice(0, 8); // Show only 8 recent mods

  recentMods.forEach(mod => {
    const card = document.createElement("div");
    card.className = "mod-card";
    card.innerHTML = `
      <img src="${mod.image}" alt="${mod.title}">
      <div class="mod-title">${mod.title}</div>
      <div class="mod-category">Category: ${mod.category}</div>
      <a class="download-btn" href="${mod.download}" target="_blank">Download</a>
    `;
    grid.appendChild(card);
  });
}

// Load on page load
window.onload = fetchMods;
