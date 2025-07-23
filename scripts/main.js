let allMods = [];

function loadMods() {
  fetch('mods.json')
    .then(response => response.json())
    .then(data => {
      allMods = data;
      displayFeatured(data);
      displayMods(data);
    });
}

function displayFeatured(mods) {
  const featured = mods.filter(mod => mod.featured);
  const container = document.getElementById('featuredMod');
  if (featured.length === 0) {
    container.innerHTML = "<p>No featured mods found.</p>";
    return;
  }

  const mod = featured[0]; // Just show the first one
  container.innerHTML = `
    <img src="${mod.image}" alt="${mod.title}" />
    <h3>${mod.title}</h3>
    <p>Category: ${mod.category}</p>
    <a class="download" href="${mod.download}" target="_blank">Download</a>
  `;
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
