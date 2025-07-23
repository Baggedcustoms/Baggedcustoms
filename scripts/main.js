let mods = [];

fetch('mods.json')
  .then(res => res.json())
  .then(data => {
    mods = data;
    showFeatured();
    filterMods("all");
  });

function showFeatured() {
  const main = document.getElementById("featuredMain");
  const side = document.getElementById("featuredSide");

  const top5 = mods.slice(0, 5);
  let currentIndex = 0;

  function renderMain(index) {
    const mod = top5[index];
    main.innerHTML = `
      <img src="${mod.image}" alt="${mod.title}" />
      <div class="mod-title">${mod.title}</div>
      <div class="mod-category">Category: ${mod.category}</div>
      <button class="download-btn">Download</button>
    `;
  }

  function renderSide() {
    side.innerHTML = "";
    top5.forEach((mod, index) => {
      if (index !== currentIndex) {
        const div = document.createElement("div");
        div.className = "featured-small-card";
        div.innerHTML = `<strong>${mod.title}</strong><br><small>${mod.category}</small>`;
        div.onclick = () => {
          currentIndex = index;
          renderMain(currentIndex);
          renderSide();
        };
        side.appendChild(div);
      }
    });
  }

  renderMain(currentIndex);
  renderSide();

  // Auto-cycle every 8 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % top5.length;
    renderMain(currentIndex);
    renderSide();
  }, 8000);
}

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
