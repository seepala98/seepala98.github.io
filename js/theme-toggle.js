document.addEventListener('DOMContentLoaded', () => {
    const toggleCheckbox = document.getElementById('checkbox');
    const body = document.body;

    // Check for saved theme preference, default to dark
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light-mode') {
        body.classList.add('light-mode');
        toggleCheckbox.checked = true;
    } else {
        toggleCheckbox.checked = false;
    }

    toggleCheckbox.addEventListener('change', () => {
        if (toggleCheckbox.checked) {
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light-mode');
        } else {
            body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark-mode');
        }
    });
});