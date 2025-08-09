// Fade-in sections on scroll
const sections = document.querySelectorAll(".fade-section");
function checkVisibility() {
    const triggerBottom = window.innerHeight * 0.85;
    sections.forEach(section => {
        const boxTop = section.getBoundingClientRect().top;
        if (boxTop < triggerBottom) {
            section.classList.add("visible");
        }
    });
}
window.addEventListener("scroll", checkVisibility);
checkVisibility();

// Expandable Experience Cards
const experienceCards = document.querySelectorAll(".experience-card");
if (experienceCards.length > 0) {
    experienceCards[0].querySelector(".arrow").classList.add("pulse-hint");
}
experienceCards.forEach(card => {
    const arrow = card.querySelector(".arrow");
    card.addEventListener("click", () => {
        const details = card.querySelector(".experience-details");
        details.classList.toggle("open");
        card.classList.toggle("open");
        arrow.classList.remove("pulse-hint");
        card.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

// Dark/Light Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.checked = true;
} else {
    themeToggle.checked = false;
}
themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
        document.body.classList.add("dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.body.classList.remove("dark");
        localStorage.setItem("theme", "light");
    }
});
``