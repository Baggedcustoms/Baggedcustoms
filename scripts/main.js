let mods = [];

// Fetch JSON data
fetch('mods.json')
  .then(res => res.json())
  .then(data => {
    mods = data;
    applyFilter('all');
  });

function filterMods(category) {
  applyFilter(category);
  document.querySelectorAll('.filter-buttons button').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === (category === 'all' ? 'All' : category));
  });
}

// Central renderer
function applyFilter(category) {
  const filtered = category === 'all' ? mods : mods.filter(m => m.category === category);
  
  renderFeatured(filtered);
  renderRecent(filtered);
}

function renderFeatured(list) {
  const feat = list.filter(m => m.featured);
  const main = feat[0] || list[0] || null;
  const side = feat.slice(1, 3);

  const mainCon = document.getElementById('featured-main');
  mainCon.innerHTML = main
    ? `<img src="${main.image}" alt="">
       <div class="mod-title">${main.title}</div>
       <div class="mod-category">Category: ${main.category}</div>
       <button class="download-btn" onclick="location.href='${main.download}'">Download</button>`
    : '';

  const sideCon = document.getElementById('featured-side');
  sideCon.innerHTML = side.map(m =>
    `<div class="featured-small-card">
       <img src="${m.image}" alt="">
       <div class="info">
         <div class="mod-title">${m.title}</div>
         <div class="mod-category">${m.category}</div>
       </div>
     </div>`
  ).join('');
}

function renderRecent(list) {
  const rec = list.filter(m => !m.featured).slice(0, 8);

  const grid = document.getElementById('modGrid');
  grid.innerHTML = rec.map(m =>
    `<div class="mod-card">
       <img src="${m.image}" alt="">
       <div class="mod-title">${m.title}</div>
       <div class="mod-category">Category: ${m.category}</div>
       <button class="download-btn" onclick="location.href='${m.download}'">Download</button>
     </div>`
  ).join('');
}
