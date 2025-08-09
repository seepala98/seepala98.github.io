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

// Highlight the first card that actually has an arrow icon
const firstArrowCard = Array.from(experienceCards).find(c => c.querySelector(".arrow"));
if (firstArrowCard) {
    const firstArrow = firstArrowCard.querySelector(".arrow");
    firstArrow.classList.add("pulse-hint");
}

experienceCards.forEach(card => {
    const arrow = card.querySelector(".arrow");
    const details = card.querySelector(".experience-details");
    if (!details) return;

    card.addEventListener("click", () => {
        details.classList.toggle("open");
        card.classList.toggle("open");
        if (arrow) {
            arrow.classList.remove("pulse-hint");
        }
        card.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

// Dark/Light Theme Toggle
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }
    if (themeToggle) {
        themeToggle.checked = theme === "dark";
    }
}

const storedTheme = localStorage.getItem("theme");
const prefersDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(storedTheme ? storedTheme : prefersDark ? "dark" : "light");

if (themeToggle) {
    themeToggle.addEventListener("change", () => {
        const nextTheme = themeToggle.checked ? "dark" : "light";
        applyTheme(nextTheme);
        localStorage.setItem("theme", nextTheme);
    });
}

// Responsive Navbar Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.getElementById('primary-navigation');

function closeNav() {
  if (!navLinks) return;
  navLinks.classList.remove('open');
  if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function openNav() {
  if (!navLinks) return;
  navLinks.classList.add('open');
  if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

if (hamburger && navLinks) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navLinks.classList.contains('open')) {
      closeNav();
    } else {
      openNav();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!navLinks.classList.contains('open')) return;
    const clickedInsideMenu = navLinks.contains(e.target) || hamburger.contains(e.target);
    if (!clickedInsideMenu) closeNav();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // Close after clicking a link
  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => closeNav());
  });
}