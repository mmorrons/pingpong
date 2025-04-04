// File: theme.js
// Handles theme toggling and persistence across all pages

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const THEME_STORAGE_KEY = 'torneoFisioThemePreference'; // Key for localStorage

    // Function to apply the theme class and update button
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            if (themeToggleButton) {
                themeToggleButton.textContent = '🌙'; // Moon icon for dark
                themeToggleButton.setAttribute('title', 'Passa al tema chiaro');
                themeToggleButton.setAttribute('aria-label', 'Passa al tema chiaro');
            }
        } else {
            // Default to light theme if 'theme' is not 'dark'
            document.body.classList.remove('dark-theme');
            if (themeToggleButton) {
                themeToggleButton.textContent = '☀️'; // Sun icon for light
                themeToggleButton.setAttribute('title', 'Passa al tema scuro');
                 themeToggleButton.setAttribute('aria-label', 'Passa al tema scuro');
            }
        }
    };

    // --- Initial Theme Load ---
    // Check localStorage first
    let currentTheme = localStorage.getItem(THEME_STORAGE_KEY);

    // If no preference saved, check prefers-color-scheme media query
    if (!currentTheme) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            currentTheme = 'dark'; // Default to system preference if dark
            console.log("Defaulting to system dark theme preference.");
        } else {
            currentTheme = 'light'; // Default to light otherwise
            console.log("Defaulting to light theme (no preference saved or system preference is light).");
        }
        // Do not save the system preference automatically, only save explicit clicks
    }

    // Apply the determined theme
    applyTheme(currentTheme);


    // --- Toggle Button Logic ---
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            let newTheme = 'light'; // Assume we are switching to light
            // Check if the body *currently* has the dark-theme class
            if (!document.body.classList.contains('dark-theme')) {
                // If it doesn't have dark-theme, it means we should switch TO dark
                newTheme = 'dark';
            }

            // Apply the new theme visually
            applyTheme(newTheme);

            // Save the explicitly chosen preference to localStorage
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
            console.log(`Theme preference saved: ${newTheme}`);
        });
    } else {
        // Log an error if the button isn't found on a page where theme.js is included
        console.warn("Theme toggle button (#theme-toggle) not found on this page.");
    }
});