// Global Navbar scroll effect
document.addEventListener("DOMContentLoaded", function() {
    const navbar = document.querySelector(".global-navbar");
    if (!navbar) return;
    
    function applyNavbarEffect() {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }
    
    // Check on load
    applyNavbarEffect();
    
    // Check on scroll
    window.addEventListener("scroll", applyNavbarEffect);
});

// Global Dark Mode logic
document.addEventListener("DOMContentLoaded", function() {
    const themeSwitch = document.getElementById("input");
    if(!themeSwitch) return;
    
    if(localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        themeSwitch.checked = true;
    } else {
        document.body.classList.remove("dark-mode");
        themeSwitch.checked = false;
    }
    
    themeSwitch.addEventListener("change", function(e) {
        if(e.target.checked) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        }
    });
});
