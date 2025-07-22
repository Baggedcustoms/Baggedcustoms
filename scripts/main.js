function filterMods(category) {
    const cards = document.querySelectorAll('.mod-card');
    const buttons = document.querySelectorAll('.filter-button');

    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}
