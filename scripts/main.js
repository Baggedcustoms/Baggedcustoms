const mods = [
  {
    title: "MonsterMax II Remastered [FIVEM]",
    category: "Real Life Builds",
    image: "images/monstermax.png"
  },
  {
    title: "Bagged Silverado",
    category: "Slammed Builds",
    image: "images/monstermax.png"
  },
  {
    title: "Bagged Dually 3500",
    category: "Real Life Builds",
    image: "images/monstermax.png"
  },
  {
    title: "Bagged Ram SRT10",
    category: "Slammed Builds",
    image: "images/monstermax.png"
  },
  {
    title: "Squarebody Slammed",
    category: "Slammed Builds",
    image: "images/monstermax.png"
  },
  {
    title: "Bagged Tahoe",
    category: "Slammed Builds",
    image: "images/monstermax.png"
  },
  {
    title: "OBS Slammed",
    category: "Slammed Builds",
    image: "images/monstermax.png"
  },
  {
    title: "Slammed Suburban",
    category: "Slammed Builds",
    image: "images/monstermax.png"
  }
];

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

// Load all by default
window.onload = () => filterMods("all");
