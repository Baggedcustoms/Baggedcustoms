document.addEventListener("DOMContentLoaded", () => {
    const filterButtons = document.querySelectorAll('.filter-button');
    const modCards = document.querySelectorAll('.mod-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const category = button.dataset.category;

            modCards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});
