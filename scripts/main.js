document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.filter-button');
    const cards = document.querySelectorAll('.mod-card');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.filter-button.active').classList.remove('active');
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');
            cards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});
