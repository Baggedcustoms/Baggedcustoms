document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".filter-btn");
    const modCards = document.querySelectorAll(".mod-card");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            // Reset all buttons
            buttons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const category = button.getAttribute("data-category");

            modCards.forEach(card => {
                const modCategory = card.querySelector("p").textContent.replace("Category: ", "").trim();
                if (category === "all" || modCategory === category) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });
});
